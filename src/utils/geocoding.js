/**
 * City-Meet OpenStreetMap 地理編碼與地址搜尋工具 (100% 免金鑰)
 * 結合本地高速地標快取與 OpenStreetMap 官方 Nominatim 服務
 */

// 周邊氣旋搜尋預設半徑 (公里)
export const SEARCH_RADIUS_KM = 2.5;

// 1. 半正矢公式 (Haversine Formula) 計算兩經緯度間距離 (公里)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半徑 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

// 2. 本地常用高頻地標字典（零延遲即時回應）
export const LOCAL_LANDMARKS = [
  { shortName: '台北車站', displayName: '台北車站・交通樞紐', lat: 25.0478, lng: 121.5170, area: '中正區' },
  { shortName: '台北101 / 市貿', displayName: '台北101・信義計畫區', lat: 25.0339, lng: 121.5645, area: '信義區' },
  { shortName: '華山1914文創園區', displayName: '華山1914文化創意產業園區', lat: 25.0441, lng: 121.5294, area: '中正區' },
  { shortName: '松山文創園區', displayName: '松山文創園區・松菸', lat: 25.0438, lng: 121.5606, area: '信義區' },
  { shortName: '西門町商圈 / 六號出口', displayName: '西門町徒步區・西門紅樓', lat: 25.0425, lng: 121.5075, area: '萬華區' },
  { shortName: '大安森林公園', displayName: '大安森林公園・生態綠地', lat: 25.0300, lng: 121.5350, area: '大安區' },
  { shortName: '中山赤峰街商圈', displayName: '赤峰街文青打鐵街・雙連站', lat: 25.0558, lng: 121.5204, area: '大同區' },
  { shortName: '忠孝復興 / 東區商圈', displayName: '忠孝復興・SOGO與東區潮流商圈', lat: 25.0415, lng: 121.5450, area: '大安區' },
  { shortName: '市政府前廣場', displayName: '台北市政府市民廣場・跨年主場', lat: 25.0375, lng: 121.5644, area: '信義區' },
  { shortName: '士林夜市', displayName: '士林觀光夜市・劍潭站', lat: 25.0880, lng: 121.5245, area: '士林區' },
  { shortName: '師大夜市商圈', displayName: '師大龍泉商圈・古亭/台電大樓', lat: 25.0250, lng: 121.5290, area: '大安區' },
  { shortName: '板橋車站 / 新北市民廣場', displayName: '新北市市民廣場・歡樂耶誕城', lat: 25.0135, lng: 121.4655, area: '板橋區' }
];

export function getLocalLandmarks(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  return LOCAL_LANDMARKS.filter(
    item =>
      item.shortName.toLowerCase().includes(q) ||
      item.displayName.toLowerCase().includes(q) ||
      item.area.toLowerCase().includes(q)
  );
}

// 3. 解析 Nominatim 原始結果
export function parseNominatimResults(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(item => {
    const parts = (item.display_name || '').split(',');
    const shortName = parts[0]?.trim() || '未知地點';
    return {
      shortName,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || 'address',
      area: parts[2]?.trim() || ''
    };
  });
}

// 4. 地址搜尋主函式（整合本地地標與遠端 Nominatim API）
export async function searchAddress(query) {
  if (!query || query.trim().length < 2) return [];

  const localMatches = getLocalLandmarks(query);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&countrycodes=tw&limit=5&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const parsedRemote = parseNominatimResults(data);

      // 合併並去重
      const seen = new Set();
      const combined = [];

      for (const item of [...localMatches, ...parsedRemote]) {
        const key = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }

      return combined.slice(0, 6);
    }
  } catch (err) {
    // 網路逾時或離線時，安全回退本地字典
  }

  return localMatches;
}
