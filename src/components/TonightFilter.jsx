import React from 'react';
import { CATEGORIES } from '../data/mockEvents';
import { Sparkles, ShieldCheck, Flame, Compass } from 'lucide-react';

export default function TonightFilter({
  activeCategory,
  onSelectCategory,
  sourceFilter, // 'all' | 'official' | 'ugc'
  onSelectSource,
  searchQuery,
  onSearchChange
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 雙軌來源快速切換 (今晚去哪裡模式) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <button
          onClick={() => onSelectSource('all')}
          style={{
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            background: sourceFilter === 'all' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
            color: sourceFilter === 'all' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Compass size={14} />
          <span>全城氣旋</span>
        </button>

        <button
          onClick={() => onSelectSource('official')}
          style={{
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            background: sourceFilter === 'official' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            color: sourceFilter === 'official' ? '#f87171' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Flame size={14} />
          <span>官方強颱</span>
        </button>

        <button
          onClick={() => onSelectSource('ugc')}
          style={{
            padding: '8px 10px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '8px',
            border: 'none',
            background: sourceFilter === 'ugc' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: sourceFilter === 'ugc' ? '#34d399' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={14} />
          <span>民間小局</span>
        </button>
      </div>

      {/* 分類標籤滑動膠囊選單 */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none'
        }}
      >
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`glass-pill ${isActive ? 'active' : ''}`}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: isActive ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
