import React, { useState, useEffect, useMemo } from 'react';
import { SEED_EVENTS } from './data/mockEvents';
import { mapScoreToStormLevel } from './utils/stormCalculator';
import {
  getEvents,
  createEvent,
  addMood,
  updateUserStatus,
  batchImportEvents
} from './api/eventsApi';
import CycloneMap from './components/CycloneMap';
import Sidebar from './components/Sidebar';
import BottomSheet from './components/BottomSheet';
import StormDetailModal from './components/StormDetailModal';
import CreateStormModal from './components/CreateStormModal';
import AdminConsole from './components/AdminConsole';
import TonightFilter from './components/TonightFilter';
import LoginModal from './components/LoginModal';
import { calculateDistance } from './utils/geocoding';
import { Wind, Plus, Compass, Search, LogIn } from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState(() => {
    // 快取版本控制 (city_meet_events_v2)
    const saved = localStorage.getItem('city_meet_events_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return SEED_EVENTS;
  });

  // 獨立私有後台路由判斷 (支援 /admin, /#admin, ?admin)
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin' ||
      window.location.search.includes('admin')
    );
  });

  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(
        window.location.pathname.startsWith('/admin') ||
        window.location.hash === '#admin' ||
        window.location.search.includes('admin')
      );
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // 單一真實數據源：只記錄選中的 ID，其餘物件內容衍生自 events
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'official' | 'ugc'
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [userStatuses, setUserStatuses] = useState({}); // eventId -> statusKey
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('city_meet_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchedLocation, setSearchedLocation] = useState(null);

  const handleSelectLocation = (loc) => {
    if (!loc) {
      setSearchedLocation(null);
      return;
    }
    // 計算該地點周邊 2.5 公里內的氣旋活動數量
    const nearby = events.filter(evt => {
      if (!evt.coordinates || evt.coordinates.length < 2) return false;
      const dist = calculateDistance(loc.lat, loc.lng, evt.coordinates[0], evt.coordinates[1]);
      return dist <= 2.5;
    });
    setSearchedLocation({ ...loc, nearbyCount: nearby.length });
  };

  const handleLogout = () => {
    localStorage.removeItem('city_meet_user');
    setCurrentUser(null);
  };

  // 監聽螢幕 RWD 斷點
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 初始化自 PostgreSQL 資料庫載入活動（具備離線自動降級能力）
  useEffect(() => {
    getEvents().then(({ data, source }) => {
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      }
    });
  }, []);

  // 持久化儲存活動至本機快取
  useEffect(() => {
    localStorage.setItem('city_meet_events_v2', JSON.stringify(events));
  }, [events]);

  // 單一數據源：衍生當前選中的活動物件
  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // 過濾活動清單
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // 1. 雙軌來源過濾
      if (sourceFilter !== 'all' && evt.sourceType !== sourceFilter) {
        return false;
      }
      // 2. 分類過濾
      if (activeCategory !== 'all' && evt.category !== activeCategory) {
        return false;
      }
      // 3. 搜尋關鍵字
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          evt.title.toLowerCase().includes(q) ||
          evt.area.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, sourceFilter, activeCategory, searchQuery]);

  // 選中事件處理
  const handleSelectEvent = (event) => {
    setSelectedEventId(event.id);
    if (!isMobile) {
      // 桌面端點擊直接開詳情視窗
      setShowDetailModal(true);
    }
  };

  // 新增現場小心聲（熱度提升、動態升級風暴半徑並同步至 PostgreSQL）
  const handleAddMood = (eventId, text, emoji) => {
    const authorName = currentUser ? currentUser.name : '現場同好';
    const newMood = {
      id: `m-${Date.now()}`,
      text,
      emoji: emoji || '💬',
      author: authorName
    };

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const newScore = evt.heatScore + 15;
          return {
            ...evt,
            heatScore: newScore,
            stormLevel: mapScoreToStormLevel(newScore),
            moodParticles: [newMood, ...(evt.moodParticles || [])]
          };
        }
        return evt;
      })
    );

    // 同步寫入 PostgreSQL
    addMood(eventId, text, emoji, authorName);
  };

  // 更新使用者的抵達狀態 (我出發了 / 快到了 / 已抵達，同步至 PostgreSQL)
  const handleUpdateUserStatus = (eventId, statusKey) => {
    setUserStatuses(prev => ({ ...prev, [eventId]: statusKey }));

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const stats = { ...evt.arrivalStats };
          stats[statusKey] = (stats[statusKey] || 0) + 1;
          const arrivalBonus = statusKey === 'arrived' ? 5 : 2;
          const newScore = evt.heatScore + arrivalBonus;
          return {
            ...evt,
            heatScore: newScore,
            stormLevel: mapScoreToStormLevel(newScore),
            arrivalStats: stats,
            participantsCount: evt.participantsCount + 1
          };
        }
        return evt;
      })
    );

    // 同步寫入 PostgreSQL
    updateUserStatus(eventId, statusKey);
  };

  // 全民自主造局：建立新氣旋（同步儲存至 PostgreSQL）
  const handleCreateStorm = (newStorm) => {
    if (currentUser) {
      newStorm.safetyTrust = {
        ...newStorm.safetyTrust,
        hostName: `${currentUser.name} (認證主辦)`,
        flags: ['Google 實名認證', '初發起氣旋種子']
      };
    }
    setEvents(prev => [newStorm, ...prev]);
    setSelectedEventId(newStorm.id);
    createEvent(newStorm);
  };

  // 後台管理匯入更新（同步批次寫入 PostgreSQL）
  const handleUpdateEvents = async (updatedEvents) => {
    setEvents(updatedEvents);
    await batchImportEvents(updatedEvents);
  };

  // 若為後台網址，在所有 Hook 調用完畢後再渲染（嚴格遵守 React Hook 規範）
  if (isAdminRoute) {
    return <AdminConsole events={events} onUpdateEvents={handleUpdateEvents} />;
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex' }}>
      {/* 桌面端 (>=768px)：左側 35% 固定高密度資訊看板 */}
      {!isMobile && (
        <Sidebar
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          sourceFilter={sourceFilter}
          onSelectSource={setSourceFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={() => setShowCreateModal(true)}
          currentUser={currentUser}
          onOpenLoginModal={() => setShowLoginModal(true)}
          onLogout={handleLogout}
          onSelectLocation={handleSelectLocation}
        />
      )}

      {/* 行動端 (<768px)：頂部精簡浮動導航條與篩選抽屜 */}
      {isMobile && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00f0ff, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Wind size={16} color="#090d16" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>City-Meet</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1.5px solid var(--accent-cyan)', objectFit: 'cover' }}
                    onClick={handleLogout}
                    title="點擊登出"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="glass-pill"
                  style={{
                    padding: '6px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  aria-label="登入"
                >
                  <LogIn size={12} />
                  <span>登入</span>
                </button>
              )}

              <button
                onClick={() => setShowMobileFilter(prev => !prev)}
                className="glass-pill"
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: showMobileFilter ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  border: showMobileFilter ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                aria-label="搜尋與篩選"
              >
                <Search size={13} />
                <span>篩選</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="glass-pill"
                style={{
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'rgba(0, 240, 255, 0.2)',
                  border: '1px solid var(--accent-cyan)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>造局</span>
              </button>
            </div>
          </div>

          {showMobileFilter && (
            <div
              className="glass-panel"
              style={{
                padding: '12px',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
              }}
            >
              <TonightFilter
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                sourceFilter={sourceFilter}
                onSelectSource={setSourceFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSelectLocation={handleSelectLocation}
              />
            </div>
          )}
        </div>
      )}

      {/* 右側 (桌面 65% / 手機 100%)：滿版暗夜向量地圖與 Canvas 動態氣旋 */}
      <main style={{ flex: 1, height: '100%', position: 'relative' }}>
        <CycloneMap
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          isMobile={isMobile}
          searchedLocation={searchedLocation}
        />
      </main>

      {/* 行動端：底部抽屜卡片 (Bottom Sheet) */}
      {isMobile && selectedEvent && !showDetailModal && (
        <BottomSheet
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onOpenDetail={() => setShowDetailModal(true)}
        />
      )}

      {/* 暴風眼集合點與即時小心聲互動彈窗 (桌面/手機共用) */}
      {showDetailModal && selectedEvent && (
        <StormDetailModal
          event={selectedEvent}
          onClose={() => setShowDetailModal(false)}
          onAddMood={handleAddMood}
          userStatus={userStatuses[selectedEvent.id]}
          onUpdateUserStatus={handleUpdateUserStatus}
        />
      )}

      {/* 全民自主造局發起活動彈窗 */}
      {showCreateModal && (
        <CreateStormModal
          onClose={() => setShowCreateModal(false)}
          onCreateStorm={handleCreateStorm}
        />
      )}

      {/* Google 會員登入彈窗 */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(u) => setCurrentUser(u)}
        />
      )}
    </div>
  );
}
