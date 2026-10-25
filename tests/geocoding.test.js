import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { calculateDistance, getLocalLandmarks, parseNominatimResults, searchAddress } from '../src/utils/geocoding';

describe('Geocoding & Distance Utilities', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly calculates Haversine distance between two coordinates in km', () => {
    // 台北車站 [25.0478, 121.5170] 到 台北101 [25.0339, 121.5645] 約 5 公里
    const dist = calculateDistance(25.0478, 121.5170, 25.0339, 121.5645);
    expect(dist).toBeGreaterThan(4.5);
    expect(dist).toBeLessThan(5.5);
  });

  it('matches local landmark dictionary accurately', () => {
    const results = getLocalLandmarks('台北車站');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].shortName).toContain('台北車站');
    expect(results[0].lat).toBeCloseTo(25.0478, 1);
    expect(results[0].lng).toBeCloseTo(121.5170, 1);
  });

  it('matches partial queries like "101" or "華山"', () => {
    const r101 = getLocalLandmarks('101');
    expect(r101.some(r => r.shortName.includes('台北101'))).toBe(true);

    const rHuashan = getLocalLandmarks('華山');
    expect(rHuashan.some(r => r.shortName.includes('華山'))).toBe(true);
  });

  it('parses Nominatim raw results into clean location objects', () => {
    const raw = [
      {
        display_name: '台北車站, 忠孝西路一段, 黎明里, 中正區, 臺北市, 10041, 臺灣',
        lat: '25.04776',
        lon: '121.51704',
        type: 'station'
      }
    ];
    const parsed = parseNominatimResults(raw);
    expect(parsed.length).toBe(1);
    expect(parsed[0].lat).toBeCloseTo(25.04776, 4);
    expect(parsed[0].lng).toBeCloseTo(121.51704, 4);
    expect(parsed[0].shortName).toBe('台北車站');
  });

  it('correctly calculates nearby events for 師大 (Shida)', () => {
    // 師大夜市商圈 [25.0250, 121.5280]
    // 大安森林公園 [25.0300, 121.5350] 應在 1.5 公里內
    const distToDaan = calculateDistance(25.0250, 121.5280, 25.0300, 121.5350);
    expect(distToDaan).toBeLessThan(1.5);

    // 西門町 [25.0425, 121.5075] 應在 3.0 公里內 (約 2.84 km)
    const distToXimen = calculateDistance(25.0250, 121.5280, 25.0425, 121.5075);
    expect(distToXimen).toBeLessThan(3.0);

    // 板橋新北市民廣場 [25.0135, 121.4655] 遠於 5 公里
    const distToBanqiao = calculateDistance(25.0250, 121.5280, 25.0135, 121.4655);
    expect(distToBanqiao).toBeGreaterThan(5.0);
  });

  describe('searchAddress', () => {
    it('returns empty array if query length < 2', async () => {
      expect(await searchAddress('')).toEqual([]);
      expect(await searchAddress(' ')).toEqual([]);
      expect(await searchAddress('a')).toEqual([]);
    });

    it('returns empty array if query is empty after trim', () => {
      const results = getLocalLandmarks('   ');
      expect(results).toEqual([]);
    });

    it('returns combined results on successful fetch and deduplicates by lat/lng', async () => {
      // "台北車站" 有本地快取 lat: 25.0478, lng: 121.5170
      // 模擬 Nominatim 也回傳相同的座標以及一個不同的座標
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            display_name: '台北車站, 重複資料',
            lat: '25.0478', // 重複
            lon: '121.5170'
          },
          {
            display_name: '台北車站地下街, 新資料',
            lat: '25.0500', // 新資料
            lon: '121.5180',
            type: 'subway'
          }
        ]
      });

      const results = await searchAddress('台北車站');

      // local 應該有 1 筆 "台北車站"，remote 應該被去重 1 筆，新增 1 筆
      expect(results.length).toBe(2);
      expect(results[0].shortName).toBe('台北車站'); // 來自 local
      expect(results[1].shortName).toBe('台北車站地下街'); // 來自 remote
    });

    it('returns only local matches if fetch fails (fallback mechanism)', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // 搜尋 '101' 本地會有 '台北101 / 市貿'
      const results = await searchAddress('101');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].shortName).toBe('台北101 / 市貿');
    });
  });

  describe('parseNominatimResults coverage', () => {
    it('returns empty array if input is not array', () => {
      expect(parseNominatimResults(null)).toEqual([]);
      expect(parseNominatimResults('string')).toEqual([]);
    });

    it('handles missing display_name gracefully', () => {
      const parsed = parseNominatimResults([{ lat: '25.0', lon: '121.0' }]);
      expect(parsed[0].shortName).toBe('未知地點');
    });
  });
});
