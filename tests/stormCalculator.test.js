import { describe, it, expect } from 'vitest';
import {
  calculateHeatScore,
  mapScoreToStormLevel,
  calculatePersonalizedScore,
  calculatePolarPosition
} from '../src/utils/stormCalculator';

describe('City-Meet 核心氣象演算法單元測試 (TDD)', () => {
  describe('1. 氣旋熱度評分演算法 (calculateHeatScore)', () => {
    it('應正確依據技術規格書公式計算民間活動基礎熱度得分', () => {
      // 公式: (報名*3) + (收藏*1) + (打卡*5) + (小心聲*2) + 官方加權 - 時間衰退
      const stats = {
        participants: 10,  // 30
        bookmarks: 5,      // 5
        checkins: 2,       // 10
        moodCount: 4       // 8
      };
      // 30 + 5 + 10 + 8 = 53
      const score = calculateHeatScore(stats, { isOfficial: false, decay: 0 });
      expect(score).toBe(53);
    });

    it('官方活動應享有額外初始熱度加權 (預設 +100)', () => {
      const stats = {
        participants: 20, // 60
        bookmarks: 10,    // 10
        checkins: 5,      // 25
        moodCount: 5      // 10
      };
      // 60 + 10 + 25 + 10 + 100 = 205
      const score = calculateHeatScore(stats, { isOfficial: true, decay: 0 });
      expect(score).toBe(205);
    });

    it('若有時間衰退值，應扣除衰退且最低不低於 0', () => {
      const stats = { participants: 1, bookmarks: 0, checkins: 0, moodCount: 0 }; // 3
      const score = calculateHeatScore(stats, { isOfficial: false, decay: 10 });
      expect(score).toBe(0);
    });

    it('沒有傳遞參數時，應該使用預設值計算並回傳 0', () => {
      const score = calculateHeatScore();
      expect(score).toBe(0);
    });
  });

  describe('2. 熱度分級與颱風強度映射 (mapScoreToStormLevel)', () => {
    it('0 - 20 分應映射為「氣旋種子 (seed)」', () => {
      expect(mapScoreToStormLevel(0)).toBe('seed');
      expect(mapScoreToStormLevel(18)).toBe('seed');
      expect(mapScoreToStormLevel(20)).toBe('seed');
    });

    it('21 - 60 分應映射為「熱帶低氣壓 (depression)」', () => {
      expect(mapScoreToStormLevel(21)).toBe('depression');
      expect(mapScoreToStormLevel(50)).toBe('depression');
      expect(mapScoreToStormLevel(60)).toBe('depression');
    });

    it('61 - 150 分應映射為「輕度颱風 (mild)」', () => {
      expect(mapScoreToStormLevel(61)).toBe('mild');
      expect(mapScoreToStormLevel(115)).toBe('mild');
      expect(mapScoreToStormLevel(150)).toBe('mild');
    });

    it('151 - 500 分應映射為「中度颱風 (moderate)」', () => {
      expect(mapScoreToStormLevel(151)).toBe('moderate');
      expect(mapScoreToStormLevel(360)).toBe('moderate');
      expect(mapScoreToStormLevel(500)).toBe('moderate');
    });

    it('501 分以上應映射為「強烈颱風 (strong)」', () => {
      expect(mapScoreToStormLevel(501)).toBe('strong');
      expect(mapScoreToStormLevel(980)).toBe('strong');
      expect(mapScoreToStormLevel(1500)).toBe('strong');
    });
  });

  describe('3. 同溫層風向個人化加權 (calculatePersonalizedScore)', () => {
    it('若活動標籤符合使用者興趣，應放大為 1.5 倍同溫層熱度', () => {
      const userInterests = ['food', 'music'];
      const score = calculatePersonalizedScore(100, 'food', userInterests);
      expect(score).toBe(150);
    });

    it('若活動標籤不符合使用者興趣，應維持原得分', () => {
      const userInterests = ['food', 'music'];
      const score = calculatePersonalizedScore(100, 'sports', userInterests);
      expect(score).toBe(100);
    });
  });

  describe('4. 極座標旋轉步進演算法 (calculatePolarPosition)', () => {
    it('時間為 0 且起始角為 0 時，X 應為 centerX + radius，Y 為 centerY', () => {
      const pos = calculatePolarPosition({
        centerX: 100,
        centerY: 200,
        radius: 50,
        theta: 0,
        speed: 0.02,
        time: 0
      });

      expect(pos.x).toBeCloseTo(150);
      expect(pos.y).toBeCloseTo(200);
    });

    it('角度旋轉 90 度 (PI/2) 時，X 應等於 centerX，Y 應為 centerY + radius', () => {
      const pos = calculatePolarPosition({
        centerX: 100,
        centerY: 200,
        radius: 50,
        theta: Math.PI / 2,
        speed: 0,
        time: 0
      });

      expect(pos.x).toBeCloseTo(100);
      expect(pos.y).toBeCloseTo(250);
    });
  });
});
