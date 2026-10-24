/**
 * City-Meet 模擬活動種子資料庫
 * 符合《企劃書》與《技術文檔》規格，包含雙軌來源（官方 vs 民間 UGC）與五級颱風分級
 */

export const STORM_LEVELS = {
  seed: {
    key: 'seed',
    name: '氣旋種子',
    radius: 35,
    speed: 0.008,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
    particleCount: 8,
    desc: '活動初發起，微弱光點蓄勢待發'
  },
  depression: {
    key: 'depression',
    name: '熱帶低氣壓',
    radius: 50,
    speed: 0.012,
    color: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.45)',
    particleCount: 14,
    desc: '基本盤形成，零星心聲悠閒旋轉'
  },
  mild: {
    key: 'mild',
    name: '輕度颱風',
    radius: 70,
    speed: 0.016,
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.5)',
    particleCount: 22,
    desc: '民間熱門小局，社群氛圍活絡'
  },
  moderate: {
    key: 'moderate',
    name: '中度颱風',
    radius: 95,
    speed: 0.022,
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.6)',
    particleCount: 32,
    desc: '官方中型活動或全區指標聚會'
  },
  strong: {
    key: 'strong',
    name: '強烈颱風',
    radius: 130,
    speed: 0.030,
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.7)',
    particleCount: 48,
    desc: '萬人官方盛事，暴風半徑與心聲流速爆棚'
  }
};

export const CATEGORIES = [
  { id: 'all', name: '全部風暴', icon: '🌪️' },
  { id: 'party', name: '派對狂歡', icon: '🎉' },
  { id: 'culture', name: '藝文展演', icon: '🎨' },
  { id: 'music', name: '音樂野餐', icon: '🎸' },
  { id: 'food', name: '吃貨美食', icon: '🍜' },
  { id: 'sports', name: '運動散步', icon: '🏃' }
];

export const SEED_EVENTS = [
  {
    id: 'evt-101-countdown',
    title: '2026 台北跨年倒數搖滾狂歡夜',
    sourceType: 'official', // 官方對接盛事
    stormLevel: 'strong',    // 強烈颱風
    heatScore: 980,
    category: 'party',
    coordinates: [25.0375, 121.5644], // 台北市政府前廣場
    area: '信義商圈',
    timeDesc: '今晚 19:00 - 01:00',
    assemblyPoint: {
      name: '市府路主舞台右側大螢幕下',
      detail: '藍色工作人員服務帳篷旁，現場有立體風暴眼氣球標示',
      backup: '捷運台北 101/世貿站 4 號出口噴水池'
    },
    safetyTrust: {
      score: 99,
      isOfficial: true,
      hostName: '台北市政府觀傳局 (認證)',
      flags: ['官方大型認證', '現場醫療站設立', '夜間捷運42小時不打烊']
    },
    participantsCount: 1420,
    arrivalStats: { departed: 450, onTheWay: 620, arrived: 350 },
    moodParticles: [
      { id: 'm1', text: '101 煙火絕佳視角卡位中！', emoji: '🎆', author: '小安' },
      { id: 'm2', text: '搖滾區音響超震撼，現場熱血沸騰！', emoji: '🎸', author: '阿Ken' },
      { id: 'm3', text: '周邊人潮開始塞了，強烈建議搭捷運！', emoji: '🚇', author: 'Kai' },
      { id: 'm4', text: '現場限量螢光手環免費索取中～', emoji: '✨', author: 'Rain' },
      { id: 'm5', text: '跨年倒數的氛圍太棒了！', emoji: '🔥', author: 'Evelyn' }
    ]
  },
  {
    id: 'evt-christmas-city',
    title: '新北巨星耶誕狂歡城',
    sourceType: 'official', // 官方活動
    stormLevel: 'moderate',  // 中度颱風
    heatScore: 420,
    category: 'culture',
    coordinates: [25.0135, 121.4655], // 板橋新北市民廣場
    area: '板橋車站特區',
    timeDesc: '每日 17:30 - 23:00',
    assemblyPoint: {
      name: '竹筍聖誕樹北側服務台前大時鐘',
      detail: '面對板橋大遠百過馬路處，有閃爍雪花燈柱',
      backup: '板橋捷運站 3A 出口地下連通道'
    },
    safetyTrust: {
      score: 98,
      isOfficial: true,
      hostName: '新北市政府 (官方認證)',
      flags: ['官方節慶活動', '警力定點巡邏', '無障礙動線完善']
    },
    participantsCount: 680,
    arrivalStats: { departed: 180, onTheWay: 280, arrived: 220 },
    moodParticles: [
      { id: 'm6', text: '整點光雕投影秀美到不行！', emoji: '🎄', author: 'Lily' },
      { id: 'm7', text: '巨星演唱會彩排搶先看現場！', emoji: '🎤', author: '小豪' },
      { id: 'm8', text: '德國熱紅酒市集排隊約 5 分鐘', emoji: '🍷', author: 'Mia' },
      { id: 'm9', text: '燈海步道拍照不用排隊衝啊', emoji: '📸', author: '晴晴' }
    ]
  },
  {
    id: 'evt-daan-picnic',
    title: '大安森林公園春日不插電吉他野餐局',
    sourceType: 'ugc',      // 全民自主造局
    stormLevel: 'mild',     // 輕度颱風
    heatScore: 115,
    category: 'music',
    coordinates: [25.0300, 121.5350], // 大安森林公園
    area: '大安區',
    timeDesc: '今天 14:30 - 18:30',
    assemblyPoint: {
      name: '露天音樂台後方大草坪大樹下',
      detail: '鋪黃白格紋野餐墊，立著一支木吉他琴袋',
      backup: '捷運大安森林公園站 2 號出口斜坡'
    },
    safetyTrust: {
      score: 94,
      isOfficial: false,
      hostName: '野餐主理人 Emma (常客)',
      flags: ['實名手機認證', '歷史活動完成率 100%', '白天開闊公園']
    },
    participantsCount: 38,
    arrivalStats: { departed: 8, onTheWay: 12, arrived: 18 },
    moodParticles: [
      { id: 'm10', text: '帶了自烤檸檬磅蛋糕，歡迎免費吃！', emoji: '🍰', author: 'Emma' },
      { id: 'm11', text: '微風吹來聽指彈吉他好療癒', emoji: '🍃', author: 'Ray' },
      { id: 'm12', text: '有人帶兩隻柯基來一起打滾草皮', emoji: '🐕', author: '瑄瑄' },
      { id: 'm13', text: '帶了手沖咖啡器材現場分享', emoji: '☕', author: '咖啡小飛' }
    ]
  },
  {
    id: 'evt-chifeng-photo',
    title: '赤峰街微醺底片攝影夜散步',
    sourceType: 'ugc',       // 全民自主造局
    stormLevel: 'depression',// 熱帶低氣壓
    heatScore: 52,
    category: 'culture',
    coordinates: [25.0558, 121.5204], // 赤峰街 / 雙連
    area: '中山赤峰商圈',
    timeDesc: '今晚 20:00 - 22:30',
    assemblyPoint: {
      name: '捷運雙連站 1 號出口旁手搖飲門口',
      detail: '大家都背相機或底片機，很好辨識',
      backup: '赤峰街巷口打鐵老店前'
    },
    safetyTrust: {
      score: 91,
      isOfficial: false,
      hostName: '老莫 (攝影愛好者)',
      flags: ['信箱已驗證', '熱門商圈徒步']
    },
    participantsCount: 16,
    arrivalStats: { departed: 3, onTheWay: 5, arrived: 8 },
    moodParticles: [
      { id: 'm14', text: '今天帶柯達金 200 出動！', emoji: '📷', author: '老莫' },
      { id: 'm15', text: '準備拐進打鐵小巷拍懷舊霓虹', emoji: '💡', author: 'Iris' },
      { id: 'm16', text: '散步完再去喝杯精釀啤酒', emoji: '🍺', author: 'Danny' }
    ]
  },
  {
    id: 'evt-ximen-ramen',
    title: '西門町深夜隱藏拉麵覓食小局',
    sourceType: 'ugc',  // 全民自主造局
    stormLevel: 'seed', // 氣旋種子 (初發起)
    heatScore: 18,
    category: 'food',
    coordinates: [25.0425, 121.5075], // 西門六號出口
    area: '西門町商圈',
    timeDesc: '今晚 22:30 集合',
    assemblyPoint: {
      name: '西門捷運 6 號出口彩虹地景斑馬線旁',
      detail: '戴黑色鴨舌帽、手拿手機看地圖',
      backup: '屈臣氏前大騎樓'
    },
    safetyTrust: {
      score: 88,
      isOfficial: false,
      hostName: '宵夜戰士 Leo',
      flags: ['新進主辦人', '市區公共鬧區']
    },
    participantsCount: 6,
    arrivalStats: { departed: 1, onTheWay: 2, arrived: 3 },
    moodParticles: [
      { id: 'm17', text: '剛加班完好餓，求麵友同行！', emoji: '🍜', author: 'Leo' },
      { id: 'm18', text: '剛打聽過店內還有 4 個吧檯位', emoji: '🥢', author: 'Leo' }
    ]
  }
];
