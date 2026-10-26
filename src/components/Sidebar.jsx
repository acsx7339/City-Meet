import React from 'react';
import { STORM_LEVELS } from '../data/mockEvents';
import TonightFilter from './TonightFilter';
import SafetyBadge from './SafetyBadge';
import { Wind, Radio, Plus, Users, MapPin, ChevronRight, Activity, LogIn, Compass } from 'lucide-react';

export default function Sidebar({
  events,
  selectedEvent,
  onSelectEvent,
  activeCategory,
  onSelectCategory,
  sourceFilter,
  onSelectSource,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  currentUser,
  onOpenLoginModal,
  onLogout,
  onSelectLocation,
  searchedLocation,
  viewportSyncEnabled = true,
  onToggleViewportSync,
  totalEventsCount
}) {
  return (
    <aside
      className="glass-panel"
      style={{
        width: '35%',
        minWidth: '340px',
        maxWidth: '440px',
        height: 'calc(100% - 32px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        margin: '16px 0 16px 16px',
        padding: '20px',
        gap: '14px',
        overflow: 'hidden'
      }}
    >
      {/* 頂部 Header：品牌標誌與即時狀態 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
            }}
          >
            <Wind size={22} color="#090d16" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              City-Meet
            </h1>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)' }} className="radar-wave" />
              <span>城市社交氣象台・即時觀測</span>
            </div>
          </div>
        </div>

        {/* 使用者狀態與造局按鈕 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid var(--accent-cyan)', objectFit: 'cover' }}
                title={`${currentUser.name} (${currentUser.email})`}
              />
              <button
                onClick={onLogout}
                className="glass-pill"
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer'
                }}
                title="登出"
              >
                登出
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="glass-pill"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <LogIn size={13} />
              <span>登入</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="glass-pill"
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid var(--accent-cyan)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} />
            <span>自主造局</span>
          </button>
        </div>
      </div>

      {/* 今晚去哪裡模式過濾器 */}
      <TonightFilter
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        sourceFilter={sourceFilter}
        onSelectSource={onSelectSource}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSelectLocation={onSelectLocation}
        searchedLocation={searchedLocation}
      />

      {/* 活動風暴列表標題與計數 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: searchedLocation ? 'var(--accent-cyan)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {searchedLocation ? (
            <>
              <MapPin size={13} color="var(--accent-cyan)" />
              <span>{searchedLocation.name} 周邊氣旋 ({events.length})</span>
            </>
          ) : viewportSyncEnabled ? (
            <>
              <Compass size={13} color="var(--accent-cyan)" />
              <span>當前視野氣旋 ({events.length})</span>
            </>
          ) : (
            <span>全台熱門氣旋 ({events.length})</span>
          )}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {!searchedLocation && onToggleViewportSync && (
            <button
              onClick={onToggleViewportSync}
              title={viewportSyncEnabled ? '目前正隨地圖移動即時切換（點擊切回全台風暴）' : '切換為隨地圖移動即時切換'}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: viewportSyncEnabled ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255,255,255,0.15)',
                background: viewportSyncEnabled ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.06)',
                color: viewportSyncEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
            >
              <Activity size={11} color={viewportSyncEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
              <span>{viewportSyncEnabled ? '視野連動' : '全台熱門'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 風暴列表清單 (滾動區) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '4px'
        }}
      >
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)', fontSize: '13px' }}>
            {searchedLocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div>📍 在「{searchedLocation.name}」方圓 2.5 公里內暫無活動氣旋</div>
                <button
                  onClick={() => onSelectLocation && onSelectLocation(null)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid var(--accent-cyan)',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  清除地點鎖定，查看全城氣旋
                </button>
              </div>
            ) : viewportSyncEnabled ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div>🗺️ 當前地圖視野內暫無氣旋活動</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  可縮小地圖、拖曳至其他縣市商圈，或切換為全台風暴
                </div>
                {onToggleViewportSync && (
                  <button
                    onClick={onToggleViewportSync}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: 'rgba(0, 240, 255, 0.15)',
                      border: '1px solid var(--accent-cyan)',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    查看全台熱門氣旋 ({totalEventsCount || 0})
                  </button>
                )}
              </div>
            ) : (
              <>
                🌪️ 當前篩選條件無活動氣旋<br />
                點擊右上角「自主造局」發起第一個小風暴！
              </>
            )}
          </div>
        ) : (
          events.map(evt => {
            const level = STORM_LEVELS[evt.stormLevel] || STORM_LEVELS.mild;
            const isSelected = selectedEvent && selectedEvent.id === evt.id;
            const topMood = evt.moodParticles && evt.moodParticles[0];

            return (
              <div
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(30, 41, 59, 0.45)',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isSelected ? '0 0 16px rgba(0, 240, 255, 0.2)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)';
                }}
              >
                {/* 卡片頂部：等級與熱度分 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: `${level.color}22`,
                        color: level.color,
                        border: `1px solid ${level.color}55`
                      }}
                    >
                      {level.name}
                    </span>
                    <SafetyBadge safetyTrust={evt.safetyTrust} compact />
                  </div>

                  <span style={{ fontSize: '12px', fontWeight: 700, color: level.color, display: 'flex', alignItems: 'center', gap: '2px' }}>
                    ⚡ {evt.heatScore}
                  </span>
                </div>

                {/* 卡片標題與地區 */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '3px', lineHeight: 1.3 }}>
                    {evt.title}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} color="var(--accent-cyan)" />
                      {evt.area}
                    </span>
                    {evt.distanceToSearch !== undefined ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        color: 'var(--accent-cyan)',
                        fontWeight: 600,
                        background: 'rgba(0, 240, 255, 0.12)',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        📍 距此 {evt.distanceToSearch.toFixed(1)} km
                      </span>
                    ) : evt.distanceToCenter !== undefined ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        color: 'rgba(0, 240, 255, 0.9)',
                        fontWeight: 600,
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid rgba(0, 240, 255, 0.2)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        約 {evt.distanceToCenter < 1 ? `${Math.round(evt.distanceToCenter * 1000)}m` : `${evt.distanceToCenter.toFixed(1)}km`}
                      </span>
                    ) : null}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Users size={12} />
                      {evt.participantsCount} 人參與
                    </span>
                  </div>
                </div>

                {/* 現場小心聲預覽 */}
                {topMood && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      borderLeft: `2px solid ${level.color}`
                    }}
                  >
                    <span>{topMood.emoji}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      "{topMood.text}"
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 底部友善提示 */}
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        點選地圖氣旋或卡片即可觀測暴風眼集合點與抵達狀態
      </div>
    </aside>
  );
}
