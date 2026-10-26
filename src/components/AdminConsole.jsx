import React, { useState } from 'react';
import { parseAndValidateEvents } from '../utils/eventImporter';
import { SEED_EVENTS, STORM_LEVELS } from '../data/mockEvents';
import { syncTaiwanEvents } from '../api/eventsApi';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Lock,
  KeyRound,
  LogOut,
  Globe,
  Loader2
} from 'lucide-react';

// 內建的官方熱門活動範本包
const OFFICIAL_SAMPLE_PACK = [
  {
    title: '2026 台北燈節光影藝術季',
    sourceType: 'official',
    category: 'culture',
    heatScore: 560,
    stormLevel: 'strong',
    coordinates: [25.0483, 121.5133], // 台北西門至北門
    area: '西門町／北門廣場',
    timeDesc: '每晚 18:00 - 22:00',
    assemblyPoint: {
      name: '北門城門主燈前廣角服務台',
      detail: '交八廣場旁，有立體光雕導覽指標',
      backup: '捷運北門站 2 號出口'
    },
    safetyTrust: {
      score: 99,
      isOfficial: true,
      hostName: '台北市政府觀光傳播局',
      flags: ['官方大型盛事', '封街人行步道', '急救站駐點']
    },
    participantsCount: 890,
    arrivalStats: { departed: 220, onTheWay: 380, arrived: 290 },
    moodParticles: []
  },
  {
    title: '華山草地黑膠搖擺音樂聚',
    sourceType: 'ugc',
    category: 'music',
    heatScore: 135,
    stormLevel: 'mild',
    coordinates: [25.0441, 121.5294], // 華山文創
    area: '華山文創園區',
    timeDesc: '週六 15:00 - 19:00',
    assemblyPoint: {
      name: '華山千層野台草坡旁大榕樹',
      detail: '現場有擺放雙黑膠唱盤機與小旗幟',
      backup: '忠孝新生站 1 號出口'
    },
    safetyTrust: {
      score: 93,
      isOfficial: false,
      hostName: '黑膠探險隊隊長',
      flags: ['實名認證主辦', '白天開闊公園']
    },
    participantsCount: 42,
    arrivalStats: { departed: 10, onTheWay: 14, arrived: 18 },
    moodParticles: []
  }
];

export default function AdminConsole({ events, onUpdateEvents }) {
  // 管理員驗證狀態管理 (預設需帳密 admin / sjwd5407 登入)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('city_meet_admin_auth') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'list'
  const [jsonInput, setJsonInput] = useState('');
  const [importNotice, setImportNotice] = useState(null); // { type: 'success' | 'error', message: string, count?: number }
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLimit, setSyncLimit] = useState(80);
  const [syncNotice, setSyncNotice] = useState(null);

  // 一鍵從文化部抓取全台活動
  const handleSyncTaiwanEvents = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const res = await syncTaiwanEvents(syncLimit);
      if (res.success && Array.isArray(res.events)) {
        const syncIdSet = new Set(res.events.map(e => e.id));
        // 替換已存在的同 ID 活動為最新乾淨版本（清空預設心聲），其餘手動建立的活動保留
        const remainingEvents = events.filter(e => !syncIdSet.has(e.id));
        const updatedEvents = [...res.events, ...remainingEvents];
        onUpdateEvents(updatedEvents);
        setSyncNotice({
          type: 'success',
          source: res.source === 'postgres' ? 'PostgreSQL' : '文化部 iCulture API (直連備援)',
          message: `🎉 成功同步 ${res.count} 筆全台活動（已全面清空預設心聲，保留純粹風場氣流）！`,
          count: res.count
        });
      } else {
        setSyncNotice({
          type: 'error',
          message: '同步未回傳資料，請確認網路連線或稍後再試。'
        });
      }
    } catch (err) {
      setSyncNotice({
        type: 'error',
        message: `同步失敗: ${err.message}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 登入驗證處理
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('city_meet_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || '管理員帳號或密碼錯誤');
      }
    } catch (err) {
      // 離線回退支援
      if (username.trim() === 'admin' && password === 'sjwd5407') {
        sessionStorage.setItem('city_meet_admin_auth', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError('管理員帳號或密碼錯誤，請重新確認');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 管理員登出處理
  const handleAdminLogout = () => {
    sessionStorage.removeItem('city_meet_admin_auth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  // 載入官方範本
  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(OFFICIAL_SAMPLE_PACK, null, 2));
    setImportNotice(null);
  };

  // 處理上傳檔案
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target.result);
      setImportNotice(null);
    };
    reader.readAsText(file);
  };

  // 執行匯入
  const handleExecuteImport = () => {
    if (!jsonInput.trim()) {
      setImportNotice({ type: 'error', message: '請先貼上 JSON 或上傳活動資料檔案' });
      return;
    }

    const result = parseAndValidateEvents(jsonInput);

    if (!result.success) {
      setImportNotice({
        type: 'error',
        message: `驗證失敗：\n${result.errors.join('\n')}`
      });
      return;
    }

    // 成功解析：合併現有活動（避免重複 ID）
    const existingIds = new Set(events.map(e => e.id));
    const newItems = result.events.filter(e => !existingIds.has(e.id));
    const updatedEvents = [...newItems, ...events];

    onUpdateEvents(updatedEvents);

    setImportNotice({
      type: 'success',
      message: `🎉 成功匯入 ${newItems.length} 筆活動（已自動建立氣旋與小心聲旋轉軌道）！`,
      count: newItems.length
    });

    if (result.errors.length > 0) {
      setImportNotice(prev => ({
        ...prev,
        message: `${prev.message}\n⚠️ 備註：部分欄位已自動填補預設值。`
      }));
    }
  };

  // 匯出全部資料
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `city-meet-events-export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 刪除單筆活動
  const handleDeleteEvent = (id) => {
    if (window.confirm('確定要自地圖移除這場氣旋活動嗎？')) {
      const updated = events.filter(e => e.id !== id);
      onUpdateEvents(updated);
    }
  };

  // 重置回預設種子資料
  const handleResetToDefault = () => {
    if (window.confirm('確定要重設為預設初始資料嗎？這將覆蓋現有新增的自訂活動。')) {
      onUpdateEvents(SEED_EVENTS);
      setImportNotice({ type: 'success', message: '已重置為系統預設 5 場種子活動！' });
    }
  };

  // 一鍵重設所有活動狀態（清空預設心聲、現場集結人數全數歸零）
  const handleClearAllMoods = () => {
    if (window.confirm('確定要將所有活動的集結人數與預設心聲全數歸零嗎？活動座標、風暴眼與旋轉風場將完整保留，純粹由現場真實使用者實際打卡參與。')) {
      const updated = events.map(e => ({
        ...e,
        moodParticles: [],
        participantsCount: 0,
        arrivalStats: { departed: 0, onTheWay: 0, arrived: 0 }
      }));
      onUpdateEvents(updated);
      setSyncNotice({
        type: 'success',
        message: '✨ 已成功將所有活動狀態歸零！現場集結人數與小心聲均重置為 0，等待真實使用者到場打卡。'
      });
      alert('已將所有活動人數與心聲全數歸零！目前為乾淨初始狀態。');
    }
  };

  // 若尚未通過管理員驗證，渲染高安全性認證閘道介面
  if (!isAuthenticated) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '36px 32px',
            borderRadius: '20px',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* 鎖頭圖示與標題 */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
              }}
            >
              <Lock size={26} color="var(--accent-cyan)" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                後台管理員身份驗證
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                此區域為機密活動管理控制台，請輸入管理員憑證解鎖
              </p>
            </div>
          </div>

          {/* 錯誤提示 */}
          {loginError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                color: '#f87171',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          {/* 表單 */}
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label-title">
                <span>管理員帳號</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="請輸入帳號 (例如: admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input-field"
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label className="form-label-title">
                <span>授權密碼</span>
              </label>
              <input
                type="password"
                required
                placeholder="請輸入管理密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input-field"
                disabled={isLoggingIn}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#090d16',
                fontWeight: 700,
                fontSize: '14px',
                cursor: isLoggingIn ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)',
                marginTop: '4px',
                opacity: isLoggingIn ? 0.7 : 1
              }}
            >
              <KeyRound size={16} />
              <span>{isLoggingIn ? '正在驗證身分...' : '解鎖並進入管理台'}</span>
            </button>
          </form>

          {/* 返回前台按鈕 */}
          <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
            <a
              href="/"
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <span>← 返回公開地圖首頁</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-main)',
        padding: '32px 24px',
        overflowY: 'auto'
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 頂部 Header */}
        <div
          className="glass-panel"
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgba(0, 240, 255, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 240, 255, 0.4)'
              }}
            >
              <Shield size={24} color="#090d16" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                City-Meet 管理員活動匯入與維護後台
              </h1>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                私有後台系統・支援 JSON 批次匯入、官方活動同步與地圖數據維護
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="/"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                background: 'rgba(0, 240, 255, 0.1)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: '9999px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>返回前台地圖</span>
              <ExternalLink size={14} />
            </a>

            <button
              onClick={handleAdminLogout}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '9999px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="登出管理員"
            >
              <LogOut size={14} />
              <span>管理員登出</span>
            </button>
          </div>
        </div>

        {/* 分頁切換選單 */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('import')}
            className={`glass-pill ${activeTab === 'import' ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Upload size={16} />
            <span>批次匯入活動 (Import)</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`glass-pill ${activeTab === 'list' ? 'active' : ''}`}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={16} />
            <span>現有活動清單與管理 ({events.length})</span>
          </button>
        </div>

        {/* 分頁 1: 批次匯入 */}
        {activeTab === 'import' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 全台開放資料即時抓取同步卡片 */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 8px 32px rgba(0, 240, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.4)'
                    }}
                  >
                    <Globe size={24} color="#090d16" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>全台活動即時自動抓取 (Taiwan Open Data)</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(0, 240, 255, 0.2)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                        文化部官方 API
                      </span>
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                      自動連線文化部藝文資料庫，即時抓取涵蓋台北、新北、台中、高雄、台南等全台展演與節慶，自動對齊經緯度、計算氣旋等級與動態小心聲。
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>抓取筆數:</span>
                    <select
                      value={syncLimit}
                      onChange={e => setSyncLimit(Number(e.target.value))}
                      disabled={isSyncing}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value={30}>30 筆精華</option>
                      <option value={60}>60 筆熱門</option>
                      <option value={100}>100 筆全台</option>
                      <option value={200}>200 筆大型庫</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncTaiwanEvents}
                    disabled={isSyncing}
                    style={{
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      background: isSyncing
                        ? 'rgba(100, 116, 139, 0.5)'
                        : 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                      color: '#090d16',
                      border: 'none',
                      cursor: isSyncing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isSyncing ? 'none' : '0 0 20px rgba(0, 240, 255, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        <span>抓取並清洗資料中...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        <span>一鍵抓取全台活動並匯入</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 同步結果反饋訊息 */}
              {syncNotice && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: syncNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${syncNotice.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    color: syncNotice.type === 'success' ? '#34d399' : '#f87171'
                  }}
                >
                  {syncNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{syncNotice.message}</div>
                    {syncNotice.source && (
                      <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                        資料來源管道：{syncNotice.source}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    檢視地圖與清單 ({events.length}) →
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                  貼上或上傳自訂活動 JSON 資料
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  手動匯入其他外部來源（支援自訂 JSON 規格，系統將自動補齊颱風分級與小心聲粒子）。
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(30, 41, 59, 0.7)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={14} color="#f59e0b" />
                  <span>載入官方活動範本</span>
                </button>

                <label
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--accent-cyan)',
                    background: 'rgba(0, 240, 255, 0.15)',
                    color: 'var(--accent-cyan)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileCode size={14} />
                  <span>上傳 .json 檔案</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            {/* JSON 文字輸入框 */}
            <textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "title": "大稻埕夏日煙火音樂節",\n    "sourceType": "official",\n    "category": "party",\n    "heatScore": 600,\n    "coordinates": [25.0560, 121.5075],\n    "area": "大稻埕碼頭",\n    "assemblyPoint": { "name": "延平河濱公園 5 號水門入口" }\n  }\n]`}
              style={{
                width: '100%',
                height: '240px',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(10, 14, 23, 0.9)',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical'
              }}
            />

            {/* 提示訊息 */}
            {importNotice && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: importNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: importNotice.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                  color: importNotice.type === 'success' ? '#34d399' : '#f87171'
                }}
              >
                {importNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <div>{importNotice.message}</div>
              </div>
            )}

            {/* 送出匯入按鈕 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => { setJsonInput(''); setImportNotice(null); }}
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                清空文字
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                className="glass-pill"
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
                  border: 'none',
                  color: '#090d16',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)'
                }}
              >
                <Upload size={16} />
                <span>驗證並匯入至地圖</span>
              </button>
            </div>
          </div>
        )}

        {/* 分頁 2: 現有活動清單與管理 */}
        {activeTab === 'list' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                  目前地圖運作中活動 ({events.length})
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  管理員可隨時匯出備份 JSON，或移除特定活動氣旋。
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleExportJson}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(30, 41, 59, 0.7)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>匯出全站 JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAllMoods}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="將所有活動的集結人數與留言清空歸零，純粹保留旋轉風場"
                >
                  <Sparkles size={14} />
                  <span>清空心聲與集結人數 (全數歸零)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefault}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>重設為種子資料</span>
                </button>
              </div>
            </div>

            {/* 活動表格 */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>活動名稱</th>
                    <th style={{ padding: '10px 8px' }}>來源類別</th>
                    <th style={{ padding: '10px 8px' }}>分級 / 熱度</th>
                    <th style={{ padding: '10px 8px' }}>區域商圈</th>
                    <th style={{ padding: '10px 8px' }}>心聲數</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(evt => {
                    const level = STORM_LEVELS[evt.stormLevel] || STORM_LEVELS.mild;
                    return (
                      <tr
                        key={evt.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background 0.2s'
                        }}
                      >
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#fff' }}>
                          {evt.title}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: evt.sourceType === 'official' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: evt.sourceType === 'official' ? '#f59e0b' : '#10b981',
                              fontWeight: 600
                            }}
                          >
                            {evt.sourceType === 'official' ? '官方盛事' : '民間 UGC'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ color: level.color, fontWeight: 600 }}>{level.name}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({evt.heatScore})</span>
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {evt.area}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {evt.moodParticles ? evt.moodParticles.length : 0} 顆
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            title="移除此活動"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
