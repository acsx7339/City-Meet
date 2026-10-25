/**
 * City-Meet 活動資料批次匯入與驗證模組
 */

import { mapScoreToStormLevel } from './stormCalculator';

/**
 * 智慧推估活動規模與熱度分
 * 當外部爬蟲或開放資料未提供人數或熱度時，自動分析活動標題關鍵字、領域分類與官方身分
 */
export function inferEventScale(title = '', category = 'culture', isOfficial = false, rawParticipants, rawHeatScore) {
  let participantsCount = Number(rawParticipants);
  let heatScore = Number(rawHeatScore);

  const hasValidHeat = !isNaN(heatScore) && heatScore > 0;
  const hasValidParticipants = !isNaN(participantsCount) && participantsCount > 0;

  if (hasValidHeat && hasValidParticipants) {
    return { heatScore, participantsCount };
  }

  const titleLower = (title || '').toLowerCase();

  // 1. 頂級大型盛事關鍵字 (Mega Events -> 強烈颱風等級 🔴)
  const isMegaEvent =
    titleLower.includes('跨年') ||
    titleLower.includes('燈節') ||
    titleLower.includes('嘉年華') ||
    titleLower.includes('音樂祭') ||
    titleLower.includes('博覽會') ||
    titleLower.includes('巨星演唱會') ||
    titleLower.includes('萬人') ||
    titleLower.includes('煙火');

  // 2. 中型熱門活動關鍵字 (Medium Popular Events -> 中度颱風等級 🟠)
  const isMediumEvent =
    isMegaEvent ||
    category === 'music' ||
    category === 'party' ||
    titleLower.includes('市集') ||
    titleLower.includes('黑膠') ||
    titleLower.includes('野餐') ||
    titleLower.includes('啤酒節') ||
    titleLower.includes('微醺') ||
    titleLower.includes('路跑') ||
    titleLower.includes('派對') ||
    titleLower.includes('電音');

  // 3. 根據特徵賦予合理預估人潮規模
  if (!hasValidParticipants) {
    if (isMegaEvent) {
      participantsCount = isOfficial ? 880 : 500;
    } else if (isMediumEvent) {
      participantsCount = isOfficial ? 280 : 80;
    } else if (category === 'culture' || category === 'food') {
      participantsCount = isOfficial ? 120 : 35;
    } else {
      participantsCount = isOfficial ? 80 : 15;
    }
  }

  // 4. 根據特徵賦予動態熱度分
  if (!hasValidHeat) {
    if (isMegaEvent) {
      heatScore = 560; // 強烈颱風 (strong)
    } else if (isMediumEvent) {
      heatScore = isOfficial ? 360 : 135; // 官方中度颱風 (moderate) 或 民間輕颱 (mild)
    } else if (isOfficial) {
      heatScore = 220; // 官方中度颱風
    } else if (category === 'culture' || category === 'food') {
      heatScore = 50; // 民間常態藝文美食 -> 熱帶低氣壓 (depression)
    } else {
      heatScore = 25; // 民間零星小局 -> 氣旋種子 (seed)
    }
  }

  return { heatScore, participantsCount };
}

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

    // 官方身分判斷
    const isOfficial = item.sourceType === 'official' || Boolean(item.isOfficial);
    const category = item.category || 'culture';

    // 智慧推估熱度與人潮規模（當外部 API 缺少人數或熱度時，自動分析標題關鍵字與分類）
    const { heatScore, participantsCount } = inferEventScale(
      item.title,
      category,
      isOfficial,
      item.participantsCount,
      item.heatScore
    );
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
      arrivalStats: item.arrivalStats || {
        departed: Math.max(1, Math.round(participantsCount * 0.25)),
        onTheWay: Math.max(1, Math.round(participantsCount * 0.45)),
        arrived: Math.max(1, Math.round(participantsCount * 0.3))
      },
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
