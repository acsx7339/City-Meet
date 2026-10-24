import React, { useState } from 'react';
import { CATEGORIES } from '../data/mockEvents';
import { X, Wind, Sparkles, Navigation, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CreateStormModal({ onClose, onCreateStorm }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('food');
  const [area, setArea] = useState('東區商圈');
  const [assemblyName, setAssemblyName] = useState('');
  const [assemblyDetail, setAssemblyDetail] = useState('');
  const [initialMood, setInitialMood] = useState('');
  const [initialEmoji, setInitialEmoji] = useState('✨');

  const EMOJI_OPTIONS = ['✨', '🍜', '☕', '🎸', '📷', '🏃', '🎉', '💬'];

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
      stormLevel: 'seed', // 初發起為氣旋種子
      heatScore: 25,
      category,
      coordinates: [baseLat, baseLng],
      area,
      timeDesc: '即刻造局・熱度聚集中',
      assemblyPoint: {
        name: assemblyName.trim(),
        detail: assemblyDetail.trim() || '依現場氣旋標示集合',
        backup: '捷運站出口'
      },
      safetyTrust: {
        score: 90,
        isOfficial: false,
        hostName: '我 (發起人)',
        flags: ['實名手機認證', '初發起氣旋種子']
      },
      participantsCount: 1,
      arrivalStats: { departed: 0, onTheWay: 0, arrived: 1 },
      moodParticles: [
        {
          id: `m-init-${Date.now()}`,
          text: initialMood.trim() || '新風暴已發起，歡迎同好加入！',
          emoji: initialEmoji,
          author: '主辦人'
        }
      ]
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
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 210,
        background: 'rgba(0, 0, 0, 0.78)',
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
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 20px 60px rgba(0, 240, 255, 0.2)'
        }}
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
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                全民自主造局・發起新氣旋
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                無需既定商家，隨時隨地在地圖點燃社群能量
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
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

        {/* 表單 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              活動氣旋名稱 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：華山草地吹風聊天小局、通化夜市吃冰打卡"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                活動分類
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(30, 41, 59, 0.9)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                出沒商圈區域
              </label>
              <input
                type="text"
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="例如：大安區、中山站"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              暴風眼核心集合點 *
            </label>
            <input
              type="text"
              required
              value={assemblyName}
              onChange={e => setAssemblyName(e.target.value)}
              placeholder="例如：捷運忠孝敦化 2 號出口旁長椅"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              集合點地標與外觀備註
            </label>
            <input
              type="text"
              value={assemblyDetail}
              onChange={e => setAssemblyDetail(e.target.value)}
              placeholder="例如：我穿白色帽T、拿藍色保溫瓶"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              第一顆現場小心聲（跟隨氣旋旋轉）
            </label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setInitialEmoji(em)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    border: initialEmoji === em ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                    background: initialEmoji === em ? 'rgba(0, 240, 255, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    cursor: 'pointer'
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={initialMood}
              onChange={e => setInitialMood(e.target.value)}
              placeholder="例如：剛坐下等大家，微風好舒服！"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#fff',
                fontSize: '13px',
                outline: 'none'
              }}
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
