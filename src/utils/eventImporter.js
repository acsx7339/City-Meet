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

    // 計算熱度與分級：若未提供 heatScore，依人潮量級與官方屬性自動換算
    const participantsCount = Number(item.participantsCount) || 20;
    const isOfficial = item.sourceType === 'official' || Boolean(item.isOfficial);

    let heatScore = Number(item.heatScore);
    if (!heatScore || isNaN(heatScore)) {
      if (isOfficial) {
        heatScore = participantsCount >= 500 ? 560 : participantsCount >= 100 ? 350 : 220;
      } else {
        heatScore = participantsCount >= 50 ? 120 : 35;
      }
    }
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

    // 現場小心聲（由活動參與者在現場自行填寫，匯入資料預設為空陣列）
    const moodParticles = [];

    // 官方權威安全信任標籤
    const safetyTrust = item.safetyTrust || {
      score: isOfficial ? 99 : 92,
      isOfficial,
      hostName: item.hostName || (isOfficial ? '官方主辦機構' : '外部匯入主辦方'),
      flags: isOfficial
        ? ['官方大型盛事', '封街人行步道', '現場醫療救護站駐點']
        : ['批次資料庫匯入', '實名登記主辦']
    };

    // 封裝標準活動物件
    const eventObj = {
      id: item.id || `evt-import-${Date.now()}-${index}`,
      title: item.title,
      sourceType: isOfficial ? 'official' : 'ugc',
      stormLevel,
      heatScore,
      category: item.category || 'culture',
      coordinates: [lat, lng],
      area: item.area || '台北市區',
      timeDesc: item.timeDesc || '近期熱門活動',
      assemblyPoint,
      safetyTrust,
      participantsCount,
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
