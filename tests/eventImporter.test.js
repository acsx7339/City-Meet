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
    expect(result.events[0].moodParticles).toBeInstanceOf(Array);
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
});
