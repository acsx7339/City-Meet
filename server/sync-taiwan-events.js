/**
 * City-Meet 全台活動自動化抓取與同步模組 (Taiwan Open Data ETL)
 * 資料來源：文化部全國藝文活動資訊整合平台 (iCulture Open Data API)
 * 自動轉換為 City-Meet 氣旋活動規格（風暴分級、熱度、集合點、安全信任分、即時心聲流）
 */

import { query, pool } from './db.js';

// 文化部分類代碼映射至 City-Meet 分類
const CATEGORY_MAP = {
  '1': 'music',    // 音樂
  '5': 'music',    // 獨立音樂
  '17': 'music',   // 演唱會
  '6': 'culture',  // 展覽
  '2': 'culture',  // 戲劇
  '7': 'culture',  // 講座
  '8': 'culture',  // 電影
  '3': 'party',    // 舞蹈
  '4': 'culture',  // 親子
  '11': 'party',   // 綜藝活動
  '15': 'culture'  // 其它
};

// 依據關鍵字進行二次智能類別分類
function detectCategory(title, description, rawCategory) {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (text.includes('市集') || text.includes('派對') || text.includes('狂歡') || text.includes('嘉年華') || text.includes('夜市')) {
    return 'party';
  }
  if (text.includes('美食') || text.includes('甜點') || text.includes('咖啡') || text.includes('小吃') || text.includes('餐酒')) {
    return 'food';
  }
  if (text.includes('路跑') || text.includes('馬拉松') || text.includes('瑜珈') || text.includes('登山') || text.includes('運動') || text.includes('健走')) {
    return 'sports';
  }
  if (text.includes('音樂') || text.includes('樂團') || text.includes('演唱會') || text.includes('吉他') || text.includes('野餐')) {
    return 'music';
  }
  return CATEGORY_MAP[rawCategory] || 'culture';
}

// 地址解析：擷取「縣市 + 鄉鎮市區」或知名商圈
function parseArea(address) {
  if (!address) return '全台活動';
  const cleanAddr = address.replace(/^\d+/, '').trim();
  const match = cleanAddr.match(/(.{2}[縣市])\s*(\d{3,5})?\s*(.{2,3}[區鄉鎮市])?/);
  if (match) {
    return `${match[1]} ${match[3] || ''}`.trim();
  }
  return cleanAddr.slice(0, 10);
}

// 根據熱度分數計算颱風強度分級
function calculateStormLevel(score) {
  if (score >= 600) return 'strong';
  if (score >= 250) return 'moderate';
  if (score >= 80) return 'mild';
  if (score >= 30) return 'depression';
  return 'seed';
}

// 產生擬真現場即時心聲流 (Mood Particles)
function generateMoodParticles(title, category, hostName) {
  const templates = {
    music: [
      { text: '現場音響重低音超震撼！', emoji: '🎸', author: '小安' },
      { text: '氣氛超嗨，周邊已經擠滿人了～', emoji: '🔥', author: '阿Ken' },
      { text: '建議搭捷運過來，附近車位全滿', emoji: '🚇', author: 'Kai' }
    ],
    culture: [
      { text: '策展內容非常有深度，很值得一看！', emoji: '🎨', author: 'Lily' },
      { text: '拍照採光超好，人潮適中逛起來很舒服', emoji: '📸', author: '晴晴' },
      { text: '現場導覽員解說非常專業～', emoji: '✨', author: 'Mia' }
    ],
    party: [
      { text: '現場市集攤位超多，各種手作與特色小吃！', emoji: '🎉', author: '豪哥' },
      { text: '晚上燈光點亮超浪漫～', emoji: '🍷', author: 'Evelyn' },
      { text: '人氣超旺！排隊約 5-10 分鐘', emoji: '🎈', author: 'Rain' }
    ],
    food: [
      { text: '招牌餐點香氣撲鼻，排隊也甘願！', emoji: '🍜', author: '吃貨阿傑' },
      { text: '限定甜點快賣完了，想吃要快！', emoji: '🍰', author: '糖糖' }
    ],
    sports: [
      { text: '補給站物資充足，志工超熱情！', emoji: '🏃', author: '飛毛腿' },
      { text: '天氣涼爽，沿途路線規劃得很棒！', emoji: '💪', author: '運動達人' }
    ]
  };

  const pool = templates[category] || templates.culture;
  return pool.map((item, idx) => ({
    id: `m-sync-${Date.now()}-${idx}`,
    ...item
  }));
}

/**
 * 清洗並轉換單筆文化部 API 資料為 City-Meet 規格
 */
export function transformCultureEvent(item) {
  const show = item.showInfo?.[0];
  if (!show) return null;

  const lat = parseFloat(show.latitude);
  const lng = parseFloat(show.longitude);

  // 坐標合法性校驗：限制在台灣本土與主要離島經緯度範圍
  if (isNaN(lat) || isNaN(lng) || lat < 21.8 || lat > 26.2 || lng < 119.2 || lng > 122.5) {
    return null;
  }

  const title = (item.title || '精彩藝文活動').trim();
  const hostName = (item.masterUnit && item.masterUnit[0]) ? item.masterUnit[0] : '文化部藝文登記主辦';
  const isOfficial = hostName.includes('館') || hostName.includes('政府') || hostName.includes('局') || hostName.includes('文化中心') || hostName.includes('中心');
  const category = detectCategory(title, item.descriptionFilterHtml, item.category);

  // 根據瀏覽熱度 hitRate 換算 heatScore 與人數
  const hitRate = parseInt(item.hitRate, 10) || 120;
  const baseHeat = Math.floor(hitRate / 3) + Math.floor(Math.random() * 40);
  const heatScore = Math.min(960, Math.max(45, baseHeat));
  const stormLevel = calculateStormLevel(heatScore);
  // 實際參與人數：初始為 0，需真實使用者點擊出發/抵達才會增加
  const participantsCount = 0;

  const locationName = show.locationName ? show.locationName.trim() : '主要入口展區';
  const address = show.location ? show.location.trim() : '';
  const area = parseArea(address);

  // 時間格式轉換
  let timeDesc = '近期熱門活動';
  if (show.time) {
    timeDesc = show.time.slice(0, 16);
  } else if (item.startDate) {
    timeDesc = `${item.startDate} ~ ${item.endDate || ''}`.trim();
  }

  // 集合點規格構建
  const assemblyPoint = {
    name: locationName.length > 3 ? locationName : `${area}展區正門`,
    detail: address || '請依現場導引與服務台標示集合',
    backup: '鄰近捷運/公車站出入口或服務台'
  };

  // 安全信任認證
  const safetyTrust = {
    score: isOfficial ? 96 : 88,
    isOfficial,
    hostName,
    flags: isOfficial
      ? ['官方藝文認證', '公立場館安全動線', '現場專人服務導引']
      : ['合規展演登記', '實名主辦單位', '定點醫療應變規劃']
  };

  // 現場集結狀態：初始皆為 0，留給真實使用者實際打卡
  const arrivalStats = { departed: 0, onTheWay: 0, arrived: 0 };

  // 現場小心聲：預設為空陣列，保留給真實使用者到場發布
  const moodParticles = [];

  return {
    id: `evt-moc-${item.UID}`,
    title,
    sourceType: isOfficial ? 'official' : 'commercial',
    stormLevel,
    heatScore,
    category,
    coordinates: [lat, lng],
    area,
    timeDesc,
    assemblyPoint,
    safetyTrust,
    participantsCount,
    arrivalStats,
    moodParticles
  };
}

/**
 * 抓取文化部全台活動並同步寫入 PostgreSQL
 * @param {number} limit 抓取筆數上限
 * @returns {Promise<{ count: number, events: Array }>}
 */
export async function fetchAndSyncCultureEvents(limit = 100) {
  console.log(`🌐 [Taiwan Events Sync] 開始自文化部 iCulture API 抓取全台活動 (上限: ${limit} 筆)...`);
  const apiUrl = 'https://cloud.culture.tw/frontsite/trans/SearchShowAction.do?method=doFindTypeJ&category=all';

  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'City-Meet-EventSync/1.0 (Mozilla/5.0)'
    }
  });

  if (!res.ok) {
    throw new Error(`文化部 API 請求失敗 (HTTP ${res.status}): ${res.statusText}`);
  }

  const rawList = await res.json();
  if (!Array.isArray(rawList)) {
    throw new Error('文化部 API 回傳非陣列資料格式');
  }

  console.log(`📦 取得原始資料 ${rawList.length} 筆，進行轉換過濾與座標驗證...`);

  const validEvents = [];
  for (const item of rawList) {
    if (validEvents.length >= limit) break;
    const transformed = transformCultureEvent(item);
    if (transformed) {
      validEvents.push(transformed);
    }
  }

  console.log(`✨ 成功轉換 ${validEvents.length} 筆合法台灣氣旋活動，開始寫入資料庫...`);

  let dbInserted = 0;
  for (const evt of validEvents) {
    try {
      const sql = `
        INSERT INTO events (
          id, title, source_type, storm_level, heat_score, category,
          latitude, longitude, area, time_desc,
          assembly_point, safety_trust, participants_count, arrival_stats, mood_particles
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          source_type = EXCLUDED.source_type,
          storm_level = EXCLUDED.storm_level,
          heat_score = EXCLUDED.heat_score,
          category = EXCLUDED.category,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          area = EXCLUDED.area,
          time_desc = EXCLUDED.time_desc,
          assembly_point = EXCLUDED.assembly_point,
          safety_trust = EXCLUDED.safety_trust,
          participants_count = EXCLUDED.participants_count,
          arrival_stats = EXCLUDED.arrival_stats,
          mood_particles = EXCLUDED.mood_particles,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id;
      `;

      const params = [
        evt.id,
        evt.title,
        evt.sourceType,
        evt.stormLevel,
        evt.heatScore,
        evt.category,
        evt.coordinates[0],
        evt.coordinates[1],
        evt.area,
        evt.timeDesc,
        JSON.stringify(evt.assemblyPoint),
        JSON.stringify(evt.safetyTrust),
        evt.participantsCount,
        JSON.stringify(evt.arrivalStats),
        JSON.stringify(evt.moodParticles)
      ];

      await query(sql, params);
      dbInserted++;
    } catch (err) {
      console.warn(`[Taiwan Events Sync] 寫入活動 ${evt.id} 失敗:`, err.message);
    }
  }

  console.log(`🎉 [Taiwan Events Sync] 完成！成功入庫 ${dbInserted} 筆全台風暴活動。`);
  return {
    count: dbInserted,
    events: validEvents
  };
}

// 支援命令列獨立執行：node server/sync-taiwan-events.js
if (process.argv[1] && process.argv[1].endsWith('sync-taiwan-events.js')) {
  const targetLimit = parseInt(process.argv[2], 10) || 120;
  fetchAndSyncCultureEvents(targetLimit)
    .then(result => {
      console.log(`✅ 同步完成！共匯入 ${result.count} 筆活動至 PostgreSQL。`);
      pool.end();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ 同步過程中斷:', err);
      process.exit(1);
    });
}
