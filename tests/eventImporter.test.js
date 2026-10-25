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

  it('若座標無效或缺少座標，應拒絕並記錄錯誤', () => {
    const rawEvents = [
      {
        title: '無效座標活動',
        coordinates: ['Invalid', 121.5133]
      },
      {
        title: '無效座標活動2',
        coordinates: [25.0483, 'Invalid']
      },
      {
        title: '缺少座標活動'
      },
      {
        title: '非陣列座標',
        coordinates: '25.0483, 121.5133'
      },
      {
        title: '座標長度不足',
        coordinates: [25.0483]
      }
    ];
    const result = parseAndValidateEvents(rawEvents);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBe(5);
    expect(result.errors[0]).toContain('座標數值無效');
    expect(result.errors[2]).toContain('缺少必要欄位：經緯度座標');
    expect(result.errors[3]).toContain('缺少必要欄位：經緯度座標');
    expect(result.errors[4]).toContain('缺少必要欄位：經緯度座標');
  });

  it('能夠處理不同的 assemblyPoint 格式 (字串, 缺少 backup/detail 的物件, 完全沒給)', () => {
    const rawEvents = [
      {
        title: '字串 assembly',
        coordinates: [25.0483, 121.5133],
        assemblyPoint: '捷運站出口'
      },
      {
        title: '部分物件 assembly',
        coordinates: [25.0483, 121.5133],
        assemblyPoint: { name: '台北車站' }
      },
      {
        title: '無 assembly',
        coordinates: [25.0483, 121.5133]
      },
      {
        title: '完整 assembly',
        coordinates: [25.0, 121.0],
        assemblyPoint: {
          name: '特定地點',
          detail: '特定細節',
          backup: '特定備用'
        }
      }
    ];

    const result = parseAndValidateEvents(rawEvents);
    expect(result.success).toBe(true);
    expect(result.events[0].assemblyPoint.name).toBe('捷運站出口');
    expect(result.events[0].assemblyPoint.detail).toBe('依現場標示集合'); // 預設值

    expect(result.events[1].assemblyPoint.name).toBe('台北車站');
    expect(result.events[1].assemblyPoint.detail).toBe('依現場標示集合'); // 預設值

    expect(result.events[2].assemblyPoint.name).toBe('活動現場集合點'); // 預設值
  });

  it('inferEventScale 的其他分支測試 (民間大活動, 官方小活動, 非官方其他分類)', () => {
    const rawEvents = [
      {
        // 缺少 title 會 fallback 為預設，為了推估 coverage 需要測 missing title
        coordinates: [25.0, 121.0]
      },
      {
        title: '民間跨年煙火 (Mega, 民間)',
        coordinates: [25.0, 121.0],
        category: 'party'
      },
      {
        title: '官方市集 (Medium, 官方)',
        coordinates: [25.0, 121.0],
        isOfficial: true,
        category: 'culture'
      },
      {
        title: '官方常規展覽 (官方)',
        coordinates: [25.0, 121.0],
        isOfficial: true,
        category: 'culture'
      },
      {
        title: '民間讀書會 (Other, 民間)',
        coordinates: [25.0, 121.0],
        category: 'education'
      },
      {
        title: '官方讀書會 (Other, 官方)',
        coordinates: [25.0, 121.0],
        category: 'education',
        isOfficial: true
      },
      {
        title: '已有熱度分數 (直接回傳)',
        coordinates: [25.0, 121.0],
        participantsCount: 100,
        heatScore: 100
      }
    ];

    const result = parseAndValidateEvents(rawEvents);
    expect(result.success).toBe(true);
    expect(result.events.length).toBe(6);

    // 民間 Mega: participants=500, heatScore=560
    expect(result.events[0].participantsCount).toBe(500);
    expect(result.events[0].heatScore).toBe(560);
    expect(result.events[0].safetyTrust.isOfficial).toBe(false);

    // 官方 Medium (標題含"市集"): participants=280, heatScore=360
    expect(result.events[1].participantsCount).toBe(280);
    expect(result.events[1].heatScore).toBe(360);
    expect(result.events[1].safetyTrust.isOfficial).toBe(true);

    // 官方非 Mega/Medium (一般官方活動): participants=120, heatScore=220
    expect(result.events[2].participantsCount).toBe(120);
    expect(result.events[2].heatScore).toBe(220);

    // 民間其他 (無關鍵字, 非culture/food, 非官方): participants=15, heatScore=25
    expect(result.events[3].participantsCount).toBe(15);
    expect(result.events[3].heatScore).toBe(25);

    // 官方其他: participants=80, heatScore=220
    expect(result.events[4].participantsCount).toBe(80);
    expect(result.events[4].heatScore).toBe(220);

    // 已有參數的
    expect(result.events[5].participantsCount).toBe(100);
    expect(result.events[5].heatScore).toBe(100);
  });

  it('傳入沒有 title 的活動 (會被 inferEventScale default 處理，雖然 parseAndValidateEvents 本身擋掉了 missing title)', async () => {
    // 為了純測 inferEventScale 的 title || '' 分支
    const { inferEventScale } = await import('../src/utils/eventImporter');
    const scale = inferEventScale(undefined, 'culture', false, undefined, undefined);
    expect(scale.participantsCount).toBe(35);
    expect(scale.heatScore).toBe(50);
  });

  it('傳入單一物件，而非陣列時，應也能正確處理', () => {
    const rawEvent = {
      title: '單一物件活動',
      coordinates: [25.0, 121.0]
    };
    const result = parseAndValidateEvents(rawEvent);
    expect(result.success).toBe(true);
    expect(result.events.length).toBe(1);
    expect(result.events[0].title).toBe('單一物件活動');
  });

  it('若傳入沒有 title 的資料，應該回傳預設標題或是錯誤', () => {
    const rawEvent = {
      coordinates: [25.0, 121.0]
    };
    const result = parseAndValidateEvents([rawEvent]);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('缺少必要欄位：活動名稱 (title)');
  });
});
