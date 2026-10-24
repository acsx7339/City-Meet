import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, User, LogIn, CheckCircle2, ChevronRight, Settings } from 'lucide-react';
import { loginWithGoogle, getAuthConfig } from '../api/eventsApi';

// 官方 Google 向量標誌
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [customClientId, setCustomClientId] = useState('');

  // 鍵盤 Escape 監聽
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 嘗試載入 Google Client ID 配置
  useEffect(() => {
    getAuthConfig().then((cfg) => {
      if (cfg && cfg.googleClientId) {
        setGoogleClientId(cfg.googleClientId);
        setCustomClientId(cfg.googleClientId);
      }
    });
  }, []);

  // 載入 Google Identity Services SDK（若有配置 client_id）
  useEffect(() => {
    const activeClientId = customClientId || googleClientId;
    if (!activeClientId || typeof window === 'undefined') return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredentialResponse
        });
        const buttonDiv = document.getElementById('google-official-btn');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'filled_blue',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'pill'
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [customClientId, googleClientId]);

  // 處理官方 Google ID Token 回傳
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      const res = await loginWithGoogle({ credential: response.credential });
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      console.error('Google login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 一鍵體驗 Google 快速登入（適用於開發環境或尚未註冊 Google Console Client ID 的即時測試）
  const handleDemoGoogleLogin = async (presetUser = null) => {
    setLoading(true);
    try {
      const demoData = presetUser || {
        email: 'alex.chen.taipei@gmail.com',
        name: 'Alex Chen (陳子豪)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        googleId: '10849204928174920'
      };

      const res = await loginWithGoogle(demoData);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', padding: '28px 24px' }}
      >
        {/* 頂部 Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.4)'
              }}
            >
              <User size={18} color="#090d16" />
            </div>
            <div>
              <h2 id="login-modal-title" style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
                登入 City-Meet
              </h2>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                城市社交氣象台・專屬會員社群
              </span>
            </div>
          </div>

          <button onClick={onClose} className="modal-close-btn" aria-label="關閉彈窗">
            <X size={18} />
          </button>
        </div>

        {/* 會員權益提示 */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <CheckCircle2 size={15} color="var(--accent-cyan)" />
            <span>自主造局自動關聯主辦人個人品牌</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <CheckCircle2 size={15} color="var(--accent-cyan)" />
            <span>發表小心聲展示認證 Google 頭像與稱號</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
            <CheckCircle2 size={15} color="var(--accent-cyan)" />
            <span>資料庫（PostgreSQL）雲端即時同步保存</span>
          </div>
        </div>

        {/* 官方 Google 登入按鈕區塊（若有 Client ID 則渲染官方按鈕） */}
        {(customClientId || googleClientId) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div id="google-official-btn" style={{ minHeight: '44px' }} />
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
              —— 或使用免配置即刻登入 ——
            </div>
          </div>
        )}

        {/* Google 一鍵快速登入按鈕 */}
        <button
          onClick={() => handleDemoGoogleLogin()}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            color: '#1f2937',
            fontWeight: 600,
            fontSize: '14px',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.7 : 1
          }}
        >
          <GoogleIcon />
          <span>{loading ? '正在連線 PostgreSQL...' : '使用 Google 帳號快速登入'}</span>
        </button>

        {/* 快捷切換測試帳號 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
            快速切換不同角色測試多用戶互動：
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() =>
                handleDemoGoogleLogin({
                  email: 'emma.photo@gmail.com',
                  name: 'Emma (攝影師)',
                  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                  googleId: '1092849204928'
                })
              }
              className="glass-pill"
              style={{
                padding: '8px',
                fontSize: '11px',
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
            >
              👩‍🦰 Emma (攝影師)
            </button>

            <button
              type="button"
              onClick={() =>
                handleDemoGoogleLogin({
                  email: 'ken.dj@gmail.com',
                  name: 'Ken (音樂野餐狂)',
                  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  googleId: '1084920394857'
                })
              }
              className="glass-pill"
              style={{
                padding: '8px',
                fontSize: '11px',
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer'
              }}
            >
              🎧 Ken (音樂狂)
            </button>
          </div>
        </div>

        {/* 高級設定：自訂 Google Cloud Console Client ID 展開抽屜 */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <Settings size={12} />
            <span>{showConfig ? '收起 Google Client ID 設定' : '自訂 Google Cloud Client ID (選填)'}</span>
          </button>

          {showConfig && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="text"
                placeholder="貼上你的 Google Client ID (e.g. xxx.apps.googleusercontent.com)"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                className="form-input-field"
                style={{ fontSize: '11px', padding: '8px' }}
              />
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                填寫後將即時啟用官方 Google 登入彈窗。若未設定則自動啟用快速沙盒驗證。
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
