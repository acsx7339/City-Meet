/**
 * City-Meet 活動資料批次匯入與驗證模組
 */

import { mapScoreToStormLevel } from './stormCalculator';

export function parseAndValidateEvents(input) {
  let parsed;

  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      return {
        success: false,
        events: [],
        errors: [`JSON 格式錯誤：${err.message}`]
      };
    }
  } else {
    parsed = input;
  }

  // 支援單一物件或陣列
  const rawList = Array.isArray(parsed) ? parsed : [parsed];
  const validatedEvents = [];
  const errors = [];

  rawList.forEach((item, index) => {
    const itemPrefix = `第 ${index + 1} 筆活動`;

    // 必填欄位檢查
    if (!item.title || typeof item.title !== 'string') {
      errors.push(`${itemPrefix}缺少必要欄位：活動名稱 (title)`);
      return;
    }

    if (!item.coordinates || !Array.isArray(item.coordinates) || item.coordinates.length < 2) {
      errors.push(`${itemPrefix} (${item.title}) 缺少必要欄位：經緯度座標 (coordinates 必須為 [lat, lng])`);
      return;
    }

    const lat = Number(item.coordinates[0]);
    const lng = Number(item.coordinates[1]);

    if (isNaN(lat) || isNaN(lng)) {
      errors.push(`${itemPrefix} (${item.title}) 座標數值無效`);
      return;
    }

    // 計算熱度與分級
    const heatScore = Number(item.heatScore) || 50;
    const stormLevel = item.stormLevel || mapScoreToStormLevel(heatScore);

    // 整理暴風眼集合點
    let assemblyPoint = {
      name: '活動現場集合點',
      detail: '依現場標示集合',
      backup: '周邊捷運站出口'
    };

    if (typeof item.assemblyPoint === 'string') {
      assemblyPoint.name = item.assemblyPoint;
    } else if (item.assemblyPoint && typeof item.assemblyPoint === 'object') {
      assemblyPoint = {
        name: item.assemblyPoint.name || '活動現場集合點',
        detail: item.assemblyPoint.detail || '依現場標示集合',
        backup: item.assemblyPoint.backup || '周邊捷運站出口'
      };
    }

    // 整理小心聲
    let moodParticles = [];
    if (Array.isArray(item.moodParticles) && item.moodParticles.length > 0) {
      moodParticles = item.moodParticles.map((m, mIdx) => ({
        id: m.id || `m-imp-${Date.now()}-${mIdx}`,
        text: typeof m === 'string' ? m : m.text || '活動熱度聚集！',
        emoji: (typeof m === 'object' && m.emoji) || '💬',
        author: (typeof m === 'object' && m.author) || '官方快報'
      }));
    } else {
      moodParticles = [
        {
          id: `m-imp-${Date.now()}-0`,
          text: '已加入城市社交氣象台！',
          emoji: '✨',
          author: '氣象台'
        }
      ];
    }

    // 封裝標準活動物件
    const eventObj = {
      id: item.id || `evt-import-${Date.now()}-${index}`,
      title: item.title,
      sourceType: item.sourceType || (item.isOfficial ? 'official' : 'ugc'),
      stormLevel,
      heatScore,
      category: item.category || 'culture',
      coordinates: [lat, lng],
      area: item.area || '台北市區',
      timeDesc: item.timeDesc || '近期熱門活動',
      assemblyPoint,
      safetyTrust: item.safetyTrust || {
        score: item.sourceType === 'official' ? 99 : 92,
        isOfficial: item.sourceType === 'official',
        hostName: item.hostName || '外部匯入主辦方',
        flags: item.sourceType === 'official' ? ['外部對接認證', '官方大型活動'] : ['批次資料庫匯入']
      },
      participantsCount: Number(item.participantsCount) || 20,
      arrivalStats: item.arrivalStats || { departed: 5, onTheWay: 8, arrived: 7 },
      moodParticles
    };

    validatedEvents.push(eventObj);
  });

  if (errors.length > 0 && validatedEvents.length === 0) {
    return {
      success: false,
      events: [],
      errors
    };
  }

  return {
    success: true,
    events: validatedEvents,
    errors
  };
}
