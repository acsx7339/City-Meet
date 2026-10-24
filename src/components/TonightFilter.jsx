import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from '../data/mockEvents';
import { searchAddress } from '../utils/geocoding';
import { Sparkles, Flame, Compass, Search, MapPin, Loader2, Navigation, X } from 'lucide-react';

export default function TonightFilter({
  activeCategory,
  onSelectCategory,
  sourceFilter, // 'all' | 'official' | 'ugc'
  onSelectSource,
  searchQuery,
  onSearchChange,
  onSelectLocation,
  searchedLocation
}) {
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  // 監聽外部點擊關閉建議下拉選單
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 依據關鍵字進行地址與地標自動查詢（防抖 250ms）
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAddressSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const results = await searchAddress(searchQuery);
        setAddressSuggestions(results);
        if (results.length > 0) {
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Geocoding error:', err);
      } finally {
        setIsGeocoding(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 選擇地址或地標
  const handlePickLocation = (loc) => {
    setShowDropdown(false);
    if (onSearchChange) {
      onSearchChange(loc.name);
    }
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  // 按下 Enter 時自動定位到最符合之地址
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (addressSuggestions.length > 0) {
        handlePickLocation(addressSuggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleClearSearch = () => {
    if (onSearchChange) onSearchChange('');
    if (onSelectLocation) onSelectLocation(null);
    setShowDropdown(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} ref={containerRef}>
      {/* 搜尋關鍵字與地址定位輸入框 */}
      {onSearchChange && (
        <div style={{ position: 'relative', width: '100%' }}>
          <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            {isGeocoding ? (
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
            ) : (
              <Search size={14} style={{ color: 'var(--text-dim)' }} />
            )}
          </div>

          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (searchedLocation && e.target.value !== searchedLocation.name) {
                // 若使用者開始打新字，解除先前已鎖定的地址
                if (onSelectLocation) onSelectLocation(null);
              }
            }}
            onFocus={() => {
              if (addressSuggestions.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜尋活動、商圈或地址 (如: 師大、台北101)..."
            style={{
              width: '100%',
              padding: '8px 30px 8px 30px',
              borderRadius: '9999px',
              border: searchedLocation ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#fff',
              fontSize: '12px',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
              boxShadow: searchedLocation ? '0 0 10px rgba(0, 240, 255, 0.2)' : 'none'
            }}
          />

          {(searchQuery || searchedLocation) && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
              title="清除"
            >
              <X size={13} />
            </button>
          )}

          {/* 地標與地址自動補全下拉選單 */}
          {showDropdown && addressSuggestions.length > 0 && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 60,
                borderRadius: '12px',
                padding: '6px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxHeight: '240px',
                overflowY: 'auto'
              }}
            >
              <div style={{ padding: '4px 8px', fontSize: '10px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Navigation size={11} />
                <span>地標／地址定位（點擊直飛）：</span>
              </div>

              {addressSuggestions.map((item, idx) => (
                <button
                  key={`${item.lat}-${item.lng}-${idx}`}
                  onClick={() => handlePickLocation(item)}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 240, 255, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <MapPin size={14} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                      {item.shortName}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.displayName}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 若已選定特定地址或地標，顯示定位資訊卡片與快速解除按鈕 */}
      {searchedLocation && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 12px',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            fontSize: '11px',
            color: 'var(--accent-cyan)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
            <MapPin size={13} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              已鎖定：<strong>{searchedLocation.name}</strong>（方圓 2.5km）
            </span>
          </div>
          <button
            onClick={handleClearSearch}
            style={{
              background: 'rgba(0, 240, 255, 0.15)',
              border: 'none',
              borderRadius: '6px',
              color: 'var(--accent-cyan)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              marginLeft: '6px',
              flexShrink: 0
            }}
            title="解除地點鎖定"
          >
            <X size={11} />
            <span>解除</span>
          </button>
        </div>
      )}

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
