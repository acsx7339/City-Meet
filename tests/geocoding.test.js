import { describe, it, expect } from 'vitest';
import { calculateDistance, getLocalLandmarks, parseNominatimResults } from '../src/utils/geocoding';

describe('Geocoding & Distance Utilities', () => {
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
});
