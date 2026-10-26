import React from 'react';
import { STORM_LEVELS } from '../data/mockEvents';
import SafetyBadge from './SafetyBadge';
import { X, MapPin, Users, Navigation, MessageCircle, ChevronUp } from 'lucide-react';

export default function BottomSheet({
  event,
  onClose,
  onOpenDetail
}) {
  if (!event) return null;

  const level = STORM_LEVELS[event.stormLevel] || STORM_LEVELS.mild;
  const topMood = event.moodParticles && event.moodParticles[0];

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 240, 255, 0.3)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        padding: '16px 20px 28px 20px',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '80vh'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* 滑動拉桿與關閉按鈕 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto' }} />
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 標題與分級 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
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
            <SafetyBadge safetyTrust={event.safetyTrust} compact />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {event.title}
          </h2>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: level.color, flexShrink: 0 }}>
          ⚡ {event.heatScore}
        </span>
      </div>

      {/* 地點與集合點備註 */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--accent-cyan)" />
          <span>{event.area}・{event.timeDesc}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Navigation size={14} color="#f59e0b" />
          <span style={{ color: '#f1f5f9' }}>
            暴風眼集合點：{typeof event.assemblyPoint === 'string' ? event.assemblyPoint : (event.assemblyPoint?.name || '依現場標示集合')}
          </span>
        </div>
      </div>

      {/* 現場小心聲預覽 */}
      {topMood && (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderLeft: `3px solid ${level.color}`
          }}
        >
          <span style={{ fontSize: '14px' }}>{topMood.emoji}</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            "{topMood.text}"
          </span>
        </div>
      )}

      {/* 展開詳情與抵達狀態按鈕 */}
      <button
        onClick={() => onOpenDetail(event)}
        className="glass-pill"
        style={{
          width: '100%',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)',
          border: '1px solid var(--accent-cyan)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '4px'
        }}
      >
        <span>進入暴風眼集合點・即時互動</span>
        <ChevronUp size={16} />
      </button>
    </div>
  );
}
