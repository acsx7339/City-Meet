import React, { useState } from 'react';
import { STORM_LEVELS } from '../data/mockEvents';
import SafetyBadge from './SafetyBadge';
import { X, Navigation, Users, Send, CheckCircle2, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function StormDetailModal({
  event,
  onClose,
  onAddMood,
  userStatus,
  onUpdateUserStatus
}) {
  if (!event) return null;

  const [moodText, setMoodText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💬');
  const level = STORM_LEVELS[event.stormLevel] || STORM_LEVELS.mild;

  const EMOJI_OPTIONS = ['💬', '🎸', '☕', '🍜', '📸', '🔥', '✨', '🎉', '🚇'];

  const handleSendMood = (e) => {
    e.preventDefault();
    if (!moodText.trim()) return;

    onAddMood(event.id, moodText.trim(), selectedEmoji);
    setMoodText('');

    // 微型彩帶特效
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleStatusClick = (statusKey) => {
    onUpdateUserStatus(event.id, statusKey);
  };

  const totalArrivals = (event.arrivalStats.departed || 0) + (event.arrivalStats.onTheWay || 0) + (event.arrivalStats.arrived || 0);
  const arrivedPercent = totalArrivals > 0 ? Math.round((event.arrivalStats.arrived / totalArrivals) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 頂部 Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  background: `${level.color}22`,
                  color: level.color,
                  border: `1px solid ${level.color}55`
                }}
              >
                {level.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {event.area}・{event.timeDesc}
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 暴風眼集合點卡片 */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600 }}>
            <Navigation size={16} />
            <span>暴風眼核心集合點</span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
            {event.assemblyPoint.name}
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            📍 細節說明：{event.assemblyPoint.detail}
          </div>
          {event.assemblyPoint.backup && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              備用集合點：{event.assemblyPoint.backup}
            </div>
          )}
        </div>

        {/* 現場抵達狀態切換器 */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              我的即時狀態與現場集結度
            </span>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
              現場已抵達 {event.arrivalStats.arrived} 人 ({arrivedPercent}%)
            </span>
          </div>

          {/* 狀態進度條 */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${arrivedPercent}%`, height: '100%', background: 'linear-gradient(90deg, #00f0ff, #10b981)', transition: 'width 0.3s' }} />
          </div>

          {/* 三態按鈕切換 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
            {[
              { key: 'departed', label: '我出發了 🚶', count: event.arrivalStats.departed },
              { key: 'onTheWay', label: '我快到了 🚴', count: event.arrivalStats.onTheWay },
              { key: 'arrived', label: '已抵達現場 🎉', count: event.arrivalStats.arrived }
            ].map(item => {
              const isActive = userStatus === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleStatusClick(item.key)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    border: isActive ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'rgba(0, 240, 255, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>({item.count}人)</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 現場小心聲氣泡旋轉清單 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="var(--accent-cyan)" />
              <span>現場小心聲氣流 ({event.moodParticles.length})</span>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              即時同步於地圖氣旋旋轉
            </span>
          </div>

          <div
            style={{
              maxHeight: '130px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              paddingRight: '4px'
            }}
          >
            {event.moodParticles.map(mood => (
              <div
                key={mood.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{mood.emoji}</span>
                  <span style={{ color: '#f1f5f9' }}>{mood.text}</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{mood.author}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 發布現場小心聲表單 */}
        <form onSubmit={handleSendMood} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            丟一顆小心聲到旋轉氣旋裡：
          </span>
          {/* Emoji 快速選擇器 */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {EMOJI_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => setSelectedEmoji(em)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: selectedEmoji === em ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                  background: selectedEmoji === em ? 'rgba(0, 240, 255, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {em}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={moodText}
              onChange={e => setMoodText(e.target.value)}
              placeholder="分享現場實況、心情或打卡... (例如：排隊剩3人！)"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              className="glass-pill"
              style={{
                padding: '0 16px',
                background: 'var(--accent-cyan)',
                border: 'none',
                color: '#090d16',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Send size={14} />
              <span>發送</span>
            </button>
          </div>
        </form>

        {/* 安全氣象台檢驗 */}
        <SafetyBadge safetyTrust={event.safetyTrust} />
      </div>
    </div>
  );
}
