import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../data/mockEvents';
import { X, Wind, Sparkles, Navigation, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreateStormModal({ onClose, onCreateStorm }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('food');
  const [area, setArea] = useState('東區商圈');
  const [assemblyName, setAssemblyName] = useState('');
  const [assemblyDetail, setAssemblyDetail] = useState('');
  const [timeDesc, setTimeDesc] = useState('今晚 20:30 集合');

  // 監聽鍵盤 Escape 鍵自動關閉彈窗
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !assemblyName.trim()) return;

    // 隨機在台北市區生成稍微偏移的座標
    const baseLat = 25.0410 + (Math.random() - 0.5) * 0.03;
    const baseLng = 121.5400 + (Math.random() - 0.5) * 0.03;

    const newStorm = {
      id: `evt-ugc-${Date.now()}`,
      title: title.trim(),
      sourceType: 'ugc',
      stormLevel: 'seed', // 初發起為氣旋種子，後續由現場參與者動態升級
      heatScore: 25,
      category,
      coordinates: [baseLat, baseLng],
      area: area.trim() || '台北市區',
      timeDesc: timeDesc.trim() || '即刻造局・熱度聚集中',
      assemblyPoint: {
        name: assemblyName.trim(),
        detail: assemblyDetail.trim() || '依現場氣旋標示集合',
        backup: '捷運站出口'
      },
      safetyTrust: {
        score: 90,
        isOfficial: false,
        hostName: '我 (發起人)',
        flags: ['實名認證發起', '初發起氣旋種子']
      },
      participantsCount: 1,
      arrivalStats: { departed: 0, onTheWay: 0, arrived: 0 },
      moodParticles: [] // 現場小心聲預設為空，保留給參與者在活動現場自由留言
    };

    onCreateStorm(newStorm);

    // 噴彩帶慶祝新氣旋誕生
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-container glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-storm-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.2)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wind size={18} />
            </div>
            <div>
              <h2 id="create-storm-title" style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                全民自主造局・發起新氣旋
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                無需既定商家，隨時隨地在地圖點燃社群能量
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="關閉彈窗"
          >
            <X size={16} />
          </button>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="form-label-title">
              <span>活動氣旋名稱 *</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：華山草地吹風聊天小局、通化夜市吃冰打卡"
              className="form-input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label-title">
                <span>活動分類</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="form-input-field"
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label-title">
                <span>出沒商圈區域</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="例如：大安區、中山站"
                className="form-input-field"
              />
            </div>
          </div>

          <div>
            <label className="form-label-title">
              <span>暴風眼核心集合點 *</span>
            </label>
            <input
              type="text"
              required
              value={assemblyName}
              onChange={e => setAssemblyName(e.target.value)}
              placeholder="例如：捷運忠孝敦化 2 號出口旁長椅"
              className="form-input-field"
            />
          </div>

          <div>
            <label className="form-label-title">
              <span>集合點地標與外觀備註</span>
            </label>
            <input
              type="text"
              value={assemblyDetail}
              onChange={e => setAssemblyDetail(e.target.value)}
              placeholder="例如：我穿白色帽T、拿藍色保溫瓶"
              className="form-input-field"
            />
          </div>

          <div>
            <label className="form-label-title">
              <span>集合時間（時）*</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['今晚 20:30', '今晚 21:30', '即刻出發', '週六下午 15:00'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeDesc(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    border: timeDesc === t ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
                    background: timeDesc === t ? 'rgba(0, 240, 255, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    color: timeDesc === t ? 'var(--accent-cyan)' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={timeDesc}
              onChange={e => setTimeDesc(e.target.value)}
              placeholder="例如：今晚 20:30、半小時後、週六 15:00"
              className="form-input-field"
            />
          </div>

          <button
            type="submit"
            className="glass-pill"
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
              border: 'none',
              color: '#090d16',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '8px',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)'
            }}
          >
            <Sparkles size={16} />
            <span>立即在地圖生成「氣旋種子」</span>
          </button>
        </form>
      </div>
    </div>
  );
}
