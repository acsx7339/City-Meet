import React, { useState, useEffect, useMemo } from 'react';
import { SEED_EVENTS } from './data/mockEvents';
import CycloneMap from './components/CycloneMap';
import Sidebar from './components/Sidebar';
import BottomSheet from './components/BottomSheet';
import StormDetailModal from './components/StormDetailModal';
import CreateStormModal from './components/CreateStormModal';
import { Wind, Plus, Compass } from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState(() => {
    // 優先讀取 LocalStorage 快取
    const saved = localStorage.getItem('city_meet_events');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return SEED_EVENTS;
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'official' | 'ugc'
  const [searchQuery, setSearchQuery] = useState('');
  const [userStatuses, setUserStatuses] = useState({}); // eventId -> statusKey
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 監聽螢幕 RWD 斷點
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 持久化儲存活動
  useEffect(() => {
    localStorage.setItem('city_meet_events', JSON.stringify(events));
  }, [events]);

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
    setSelectedEvent(event);
    if (!isMobile) {
      // 桌面端點擊直接開詳情視窗
      setShowDetailModal(true);
    }
  };

  // 新增現場小心聲
  const handleAddMood = (eventId, text, emoji) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const newMood = {
            id: `m-${Date.now()}`,
            text,
            emoji: emoji || '💬',
            author: '現場同好'
          };
          // 每次發布心聲，熱度分 +15
          return {
            ...evt,
            heatScore: evt.heatScore + 15,
            moodParticles: [newMood, ...(evt.moodParticles || [])]
          };
        }
        return evt;
      })
    );

    // 同步更新當前選中活動
    setSelectedEvent(prev => {
      if (!prev || prev.id !== eventId) return prev;
      const newMood = {
        id: `m-${Date.now()}`,
        text,
        emoji: emoji || '💬',
        author: '現場同好'
      };
      return {
        ...prev,
        heatScore: prev.heatScore + 15,
        moodParticles: [newMood, ...(prev.moodParticles || [])]
      };
    });
  };

  // 更新使用者的抵達狀態 (我出發了 / 快到了 / 已抵達)
  const handleUpdateUserStatus = (eventId, statusKey) => {
    setUserStatuses(prev => ({ ...prev, [eventId]: statusKey }));

    setEvents(prev =>
      prev.map(evt => {
        if (evt.id === eventId) {
          const stats = { ...evt.arrivalStats };
          stats[statusKey] = (stats[statusKey] || 0) + 1;
          return {
            ...evt,
            arrivalStats: stats,
            participantsCount: evt.participantsCount + 1
          };
        }
        return evt;
      })
    );

    setSelectedEvent(prev => {
      if (!prev || prev.id !== eventId) return prev;
      const stats = { ...prev.arrivalStats };
      stats[statusKey] = (stats[statusKey] || 0) + 1;
      return {
        ...prev,
        arrivalStats: stats,
        participantsCount: prev.participantsCount + 1
      };
    });
  };

  // 全民自主造局：建立新氣旋
  const handleCreateStorm = (newStorm) => {
    setEvents(prev => [newStorm, ...prev]);
    setSelectedEvent(newStorm);
  };

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
          onOpenCreateModal={() => setShowCreateModal(true)}
        />
      )}

      {/* 行動端 (<768px)：頂部精簡浮動導航條 */}
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
      )}

      {/* 右側 (桌面 65% / 手機 100%)：滿版暗夜向量地圖與 Canvas 動態氣旋 */}
      <main style={{ flex: 1, height: '100%', position: 'relative' }}>
        <CycloneMap
          events={filteredEvents}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          isMobile={isMobile}
        />
      </main>

      {/* 行動端：底部抽屜卡片 (Bottom Sheet) */}
      {isMobile && selectedEvent && !showDetailModal && (
        <BottomSheet
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
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
    </div>
  );
}
