/**
 * City-Meet 氣候能量與熱度演算法模組
 * 依據《技術規格書》第四節實作 Rule-Based 熱度得分與極座標物理計算
 */

/**
 * 1. 計算氣旋熱度得分 (Heat Score)
 * 公式: (報名*3) + (收藏*1) + (打卡*5) + (小心聲*2) + 官方加權 - 時間衰退
 */
export function calculateHeatScore(stats = {}, options = {}) {
  const participants = stats.participants || 0;
  const bookmarks = stats.bookmarks || 0;
  const checkins = stats.checkins || 0;
  const moodCount = stats.moodCount || 0;

  const isOfficial = options.isOfficial ?? false;
  const officialBonus = isOfficial ? 100 : 0;
  const decay = options.decay || 0;

  const baseScore =
    participants * 3 +
    bookmarks * 1 +
    checkins * 5 +
    moodCount * 2 +
    officialBonus -
    decay;

  return Math.max(0, baseScore);
}

/**
 * 2. 映射熱度得分至五級颱風分級
 * 0 - 20: seed (氣旋種子)
 * 21 - 60: depression (熱帶低氣壓)
 * 61 - 150: mild (輕度颱風)
 * 151 - 500: moderate (中度颱風)
 * 501+: strong (強烈颱風)
 */
export function mapScoreToStormLevel(score) {
  if (score <= 20) return 'seed';
  if (score <= 60) return 'depression';
  if (score <= 150) return 'mild';
  if (score <= 500) return 'moderate';
  return 'strong';
}

/**
 * 3. 同溫層風向個人化加權
 * 若活動分類符合使用者興趣標籤，熱度得分放大 1.5 倍
 */
export function calculatePersonalizedScore(baseScore, eventCategory, userInterests = []) {
  if (Array.isArray(userInterests) && userInterests.includes(eventCategory)) {
    return Math.round(baseScore * 1.5);
  }
  return baseScore;
}

/**
 * 4. 極座標旋轉步進演算法 (Polar Coordinates)
 * X = X_c + r * cos(theta + omega * t)
 * Y = Y_c + r * sin(theta + omega * t)
 */
export function calculatePolarPosition({
  centerX = 0,
  centerY = 0,
  radius = 0,
  theta = 0,
  speed = 0,
  time = 0
}) {
  const currentAngle = theta + speed * time;
  const x = centerX + radius * Math.cos(currentAngle);
  const y = centerY + radius * Math.sin(currentAngle);
  return { x, y, angle: currentAngle };
}
