import { describe, it, expect } from 'vitest';
import { parseAndValidateEvents } from '../src/utils/eventImporter';

describe('活動批次匯入驗證器單元測試 (eventImporter)', () => {
  it('應成功解析格式正確的 JSON 活動陣列，並自動補齊預設值', () => {
    const rawJson = JSON.stringify([
      {
        title: '華山文創草地二手市集',
        category: 'culture',
        coordinates: [25.0441, 121.5294],
        assemblyPoint: { name: '華山千層野台前' }
      }
    ]);

    const result = parseAndValidateEvents(rawJson);
    expect(result.success).toBe(true);
    expect(result.events.length).toBe(1);
    expect(result.events[0].id).toBeDefined();
    expect(result.events[0].stormLevel).toBeDefined(); // 自動補齊分級
    expect(result.events[0].moodParticles).toEqual([]); // 匯入活動不預填小心聲，保留給現場使用者自填
  });

  it('若缺少必要欄位（如 title 或 coordinates），應拒絕並記錄錯誤', () => {
    const invalidJson = JSON.stringify([
      {
        category: 'food'
        // 缺少 title 與 coordinates
      }
    ]);

    const result = parseAndValidateEvents(invalidJson);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('缺少必要欄位');
  });

  it('若 JSON 語法無效，應回傳解析失敗錯誤', () => {
    const malformed = 'INVALID_JSON_HERE';
    const result = parseAndValidateEvents(malformed);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('JSON 格式錯誤');
  });

  it('當未提供人數與熱度時，應根據標題關鍵字與類別智慧推估颱風等級', () => {
    const rawEvents = [
      {
        title: '2026 台北燈節光雕音樂季',
        coordinates: [25.0483, 121.5133],
        isOfficial: true
      },
      {
        title: '信義區微醺黑膠派對',
        category: 'party',
        coordinates: [25.0355, 121.5670]
      },
      {
        title: '社區公園晨間散步',
        coordinates: [25.0300, 121.5300]
      }
    ];

    const result = parseAndValidateEvents(rawEvents);
    expect(result.success).toBe(true);
    expect(result.events.length).toBe(3);

    // 1. 台北燈節 (含燈節/音樂季等盛事關鍵字) 應自動升級為強烈颱風 (strong)
    expect(result.events[0].stormLevel).toBe('strong');
    expect(result.events[0].heatScore).toBeGreaterThanOrEqual(500);
    expect(result.events[0].participantsCount).toBeGreaterThanOrEqual(500);

    // 2. 微醺黑膠派對 (含黑膠/派對等中型活動) 應為輕度或中度颱風
    expect(['mild', 'moderate']).toContain(result.events[1].stormLevel);
    expect(result.events[1].heatScore).toBeGreaterThan(80);

    // 3. 常態小散步應為低氣壓或氣旋種子
    expect(['seed', 'depression']).toContain(result.events[2].stormLevel);
  });
});
