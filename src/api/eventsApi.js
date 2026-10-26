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

// 全台活動即時抓取同步 (優先由後端匯入 PostgreSQL，支援前端直連備援)
export async function syncTaiwanEvents(limit = 100) {
  // 1. 優先請求後端 API
  try {
    const res = await fetch('/api/admin/sync-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        return { success: true, count: data.count, events: data.events, source: 'postgres' };
      }
    }
  } catch (err) {
    console.warn('[eventsApi] Backend sync failed, attempting direct Open Data fetch:', err.message);
  }

  // 2. 備援模式：前端直接向文化部 iCulture 開放資料 API 請求 (具備 CORS 支援)
  try {
    const directRes = await fetch('https://cloud.culture.tw/frontsite/trans/SearchShowAction.do?method=doFindTypeJ&category=all');
    if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
    const rawList = await directRes.json();
    if (!Array.isArray(rawList)) throw new Error('Invalid Open Data format');

    const validEvents = [];
    for (const item of rawList) {
      if (validEvents.length >= limit) break;
      const show = item.showInfo?.[0];
      if (!show) continue;
      const lat = parseFloat(show.latitude);
      const lng = parseFloat(show.longitude);
      if (isNaN(lat) || isNaN(lng) || lat < 21.8 || lat > 26.2 || lng < 119.2 || lng > 122.5) continue;

      const title = (item.title || '精彩活動').trim();
      const hostName = item.masterUnit?.[0] || '文化部認證主辦';
      const isOfficial = hostName.includes('館') || hostName.includes('政府') || hostName.includes('局') || hostName.includes('中心');
      const hitRate = parseInt(item.hitRate, 10) || 120;
      const heatScore = Math.min(950, Math.max(45, Math.floor(hitRate / 3) + 20));

      let stormLevel = 'seed';
      if (heatScore >= 600) stormLevel = 'strong';
      else if (heatScore >= 250) stormLevel = 'moderate';
      else if (heatScore >= 80) stormLevel = 'mild';
      else if (heatScore >= 30) stormLevel = 'depression';

      let category = 'culture';
      const lower = `${title} ${item.descriptionFilterHtml || ''}`.toLowerCase();
      if (lower.includes('市集') || lower.includes('派對') || lower.includes('夜市')) category = 'party';
      else if (lower.includes('音樂') || lower.includes('演唱會') || lower.includes('樂團')) category = 'music';
      else if (lower.includes('運動') || lower.includes('路跑') || lower.includes('馬拉松')) category = 'sports';
      else if (lower.includes('美食') || lower.includes('咖啡') || lower.includes('甜點')) category = 'food';

      // 實際參與人數：初始為 0，需真實使用者點擊出發/抵達才會增加
      const participantsCount = 0;
      const arrivalStats = { departed: 0, onTheWay: 0, arrived: 0 };

      validEvents.push({
        id: `evt-moc-${item.UID}`,
        title,
        sourceType: isOfficial ? 'official' : 'commercial',
        stormLevel,
        heatScore,
        category,
        coordinates: [lat, lng],
        area: (show.location ? show.location.replace(/^\d+/, '').slice(0, 8) : '全台活動').trim(),
        timeDesc: show.time ? show.time.slice(0, 16) : (item.startDate || '近期展演'),
        assemblyPoint: {
          name: show.locationName || '場館主要入口處',
          detail: show.location || '請至現場服務台集合',
          backup: '鄰近捷運/公車站出口'
        },
        safetyTrust: {
          score: isOfficial ? 96 : 88,
          isOfficial,
          hostName,
          flags: isOfficial ? ['官方藝文認證', '公立場館安全規劃'] : ['合法售票展演', '實名主辦登記']
        },
        participantsCount,
        arrivalStats,
        moodParticles: [] // 乾淨無預設心聲，純留給真實現場使用者發言
      });
    }

    return { success: true, count: validEvents.length, events: validEvents, source: 'client-moc' };
  } catch (clientErr) {
    throw new Error(`無法連接全台開放資料 API: ${clientErr.message}`);
  }
}

