/**
 * City-Meet 統一資料層 API 客戶端
 * 優先連接 PostgreSQL 後端 REST API，具備離線時無縫回退至 localStorage 之優雅降級能力
 */
import { SEED_EVENTS } from '../data/mockEvents';

const LOCAL_STORAGE_KEY = 'city_meet_events_v2';

// 檢查後端與 PostgreSQL 健康狀態
export async function checkDbHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (error) {
    return { status: 'offline', error: error.message };
  }
}

// 獲取所有活動
export async function getEvents() {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // 成功從 PostgreSQL 取得，同步更新本機快取
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return { data, source: 'postgres' };
    }
  } catch (err) {
    console.warn('[eventsApi] PostgreSQL API unavailable, falling back to localStorage:', err.message);
  }

  // 回退至 localStorage 或預設種子活動
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      return { data: JSON.parse(saved), source: 'local' };
    } catch (e) { }
  }
  return { data: SEED_EVENTS, source: 'seed' };
}

// 全民自主造局：建立新氣旋
export async function createEvent(event) {
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (res.ok) {
      const savedEvent = await res.json();
      return { success: true, event: savedEvent, source: 'postgres' };
    }
  } catch (err) {
    console.warn('[eventsApi] Failed to save to PostgreSQL, fallback to local:', err.message);
  }

  return { success: true, event, source: 'local' };
}

// 後台管理員大量匯入活動
export async function batchImportEvents(events) {
  try {
    const res = await fetch('/api/events/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    });
    if (res.ok) {
      const result = await res.json();
      return { success: true, count: result.count, source: 'postgres' };
    }
  } catch (err) {
    console.warn('[eventsApi] Failed to batch import to PostgreSQL, fallback to local:', err.message);
  }

  return { success: true, count: events.length, source: 'local' };
}

// 新增現場小心聲（熱度 +15）
export async function addMood(eventId, text, emoji = '✨') {
  try {
    const res = await fetch(`/api/events/${eventId}/moods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, emoji })
    });
    if (res.ok) {
      const updatedEvent = await res.json();
      return { success: true, event: updatedEvent, source: 'postgres' };
    }
  } catch (err) {
    console.warn('[eventsApi] Failed to sync mood to PostgreSQL:', err.message);
  }

  return { success: false, source: 'local' };
}

// 更新現場抵達狀態（已抵達/路上/出發）
export async function updateUserStatus(eventId, statusKey) {
  try {
    const res = await fetch(`/api/events/${eventId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusKey })
    });
    if (res.ok) {
      const updatedEvent = await res.json();
      return { success: true, event: updatedEvent, source: 'postgres' };
    }
  } catch (err) {
    console.warn('[eventsApi] Failed to sync status to PostgreSQL:', err.message);
  }

  return { success: false, source: 'local' };
}

// 取得後端 Google Client ID 配置
export async function getAuthConfig() {
  try {
    const res = await fetch('/api/auth/config');
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('[eventsApi] Failed to fetch auth config:', err.message);
  }
  return { googleClientId: '' };
}

// Google 登入驗證（支援 Google 官方 Token 或免配置即刻體驗）
export async function loginWithGoogle(authPayload) {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authPayload)
    });
    if (res.ok) {
      const result = await res.json();
      if (result.user) {
        localStorage.setItem('city_meet_user', JSON.stringify(result.user));
        return { success: true, user: result.user, source: 'postgres' };
      }
    }
  } catch (err) {
    console.warn('[eventsApi] PostgreSQL auth error, fallback to local session:', err.message);
  }

  // 離線自動降級與本地暫存
  const fallbackUser = {
    id: `usr-${authPayload.googleId || Date.now()}`,
    email: authPayload.email || 'demo.user@gmail.com',
    name: authPayload.name || 'City Explorer',
    avatar: authPayload.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=explorer',
    provider: 'google'
  };
  localStorage.setItem('city_meet_user', JSON.stringify(fallbackUser));
  return { success: true, user: fallbackUser, source: 'local' };
}
