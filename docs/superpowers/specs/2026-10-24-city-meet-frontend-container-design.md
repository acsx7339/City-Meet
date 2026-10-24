# Design Doc: City-Meet 動態社群熱度地圖 (前端容器化驗證版)

**日期**：2026-10-24  
**狀態**：等待審核 (Pending Approval)  
**作者/架構建議**：AI Pair Programmer  
**關聯文件**：[企劃書 (city-meet.md)](file:///Users/fachu/Desktop/Projects/City-Meet/文檔/city-meet.md) | [技術規格書 (技術文檔.md)](file:///Users/fachu/Desktop/Projects/City-Meet/文檔/技術文檔.md)

---

## 1. 意圖與產品目標 (Intent & The Why)

傳統地圖服務（如 Google Maps）僅能呈現冷冰冰的靜態座標（Where），無法傳達城市當下發生的社交氛圍、人潮情緒與即時熱度（When / Who / What）。  
**City-Meet** 的目標是建立「城市社交氣象台」，將地圖上的活動轉化為具備生命週期的**「動態能量氣旋（颱風）」**，並將現場人群的心情獨白化為**「旋轉的小心聲氣泡粒子」**。

本階段專案目標是快速打造出一個**全容器化（Docker Compose）的前端互動式 Web 應用程式**，專注於驗證與完美呈現規格書中所要求的：
1. 颱風分級氣旋與小心聲旋轉粒子系統。
2. 官方大型活動與民間 UGC 活動的雙軌視覺層次。
3. 支援桌面雙欄與手機底部抽屜（Bottom Sheet）的 RWD 佈局。
4. 今晚去哪裡（Tonight Mode）篩選、暴風眼抵達狀態切換與安全氣象台等互動體驗。

---

## 2. 目標、非目標與反向目標 (Goals, Non-Goals, Anti-Goals)

### 目標 (Goals)
* **純 Docker Compose 開發模式（免 Dockerfile、免 Rebuild）**：
  * 直接採用官方 `node:20-alpine` 映像檔。
  * 透過 Volume Mount（目錄掛載 `.:/app`）將專案目錄直接映射入容器。
  * 容器內部直接運行 Vite 開發伺服器（支援 HMR 熱重載）。
  * **程式碼一修改，瀏覽器秒級即時更新，完全不需要重新執行 `docker build`**！
* **高流暢度極座標粒子引擎**：在 HTML5 Canvas 上實現極座標軌跡演算法：
  $$X_{next} = X_c + r \cdot \cos(\theta + \omega \cdot t), \quad Y_{next} = Y_c + r \cdot \sin(\theta + \omega \cdot t)$$
  氣旋具備風場粒子線流動，心聲氣泡（含文字與貼圖）跟隨旋轉。
* **颱風強度動態分級視覺**：
  * **氣旋種子 / 低壓**：微弱光點與零星心聲。
  * **輕度颱風**：民間小型好玩活動（淡藍/青綠氣旋）。
  * **中度颱風**：官方定期活動或熱門聚會（亮橙/琥珀氣旋，中等風暴半徑）。
  * **強烈颱風**：萬人官方盛事（如台北跨年、新北耶誕城，具備炙紅高能氣旋與密集粒子流）。
* **極致 RWD 佈局**：
  * **桌面端 (>= 768px)**：左側 35% 資訊與篩選看板，右側 65% 滿版動態地圖。
  * **手機端 (< 768px)**：100% 滿版地圖，點擊氣旋時從底部滑出 Bottom Sheet，並配備單手浮動圓形操作鈕 (FAB)。
* **情境模擬與互動操作**：
  * 可透過「今晚去哪裡」切換官方強颱 vs 民間小局、分類標籤（美食、文青、派對、運動）。
  * 暴風眼集合點：即時切換抵達狀態（我出發了 ➔ 我快到了 ➔ 已抵達現場）。
  * 允許使用者在畫面上發起民間小氣旋，或在現有氣旋中發送「現場小心聲」，即時加入旋轉軌道。

### 非目標 (Non-Goals)
* MVP 階段暫不連線至真實實體 PostgreSQL/PostGIS 雲端資料庫（所有空間查詢與心聲資料於前端狀態層模擬真實 API 響應）。
* 不實作真實第三方金流與手機簡訊驗證（信任分數與安全標籤以 UI 視覺展示為主）。

### 反向目標 (Anti-Goals - 絕對避免的事項)
* **嚴禁回到傳統靜態地圖**：絕對不能退化為 Google Maps 常見的紅圖釘 (Pin) 或單純的模糊熱力圖 (Heatmap)。
* **避免外部 API Key 依賴**：地圖層必須開箱即用，不可因缺少 Mapbox Access Token 導致啟動白畫面。
* **避免容器過度龐大**：採用多階段建置（Multi-stage build）產生輕量 Nginx Alpine 映像檔，確保啟動秒級完成。

---

## 3. 技術方案評估 (Approaches Considered)

在討論過程中，共評估了三種技術途徑：

1. **方案 A（已獲選擇）：React + Canvas 雙層粒子引擎 + Nginx 輕量 Docker 容器**
   * *優勢*：元件化結構清晰，能完美實現手機 Bottom Sheet 與桌面雙欄佈局；Canvas 2D 粒子引擎能直接進行極座標連續高幀率運算；最終產物為數十 MB 的極速 Alpine Nginx 容器。
   * *代價*：需撰寫完整的 React 狀態管理與 UI 元件。
2. **方案 B：純 Vanilla JS + 靜態 HTML5 容器**
   * *優勢*：最簡單快速。
   * *代價*：當要處理複雜抽屜組件、今晚去哪裡切換、發布小心聲表單時，代碼雜亂難以維護。
3. **方案 C：Next.js 全棧單一容器**
   * *優勢*：可附帶真實 Node.js REST API 路由。
   * *代價*：容器體積較大、啟動較慢，現階段核心目的在驗證地圖與粒子視覺，多餘的後端程序會分散驗證焦點。

**決策結果**：使用者選定 **方案 A**。

---

## 4. 系統架構與詳細設計 (Detailed Design)

### 4.1 檔案與目錄結構規劃
```text
City-Meet/
├── docker-compose.yml             # 純 Docker Compose 配置 (直接使用 node:20-alpine + volume 掛載 + HMR)
├── package.json                   # 依賴 (React 18, Lucide-React, Leaflet 等)
├── vite.config.js                 # Vite 打包與 HMR 配置 (host: 0.0.0.0)
├── index.html                     # 網頁入口與 Google Fonts (Outfit / Inter)
└── src/
    ├── main.jsx                   # React 進入點
    ├── App.jsx                    # 主介面狀態與 RWD 佈局切換
    ├── index.css                  # 全域暗黑主題、霓虹色彩變數與玻璃擬態 CSS
    ├── components/
    │   ├── CycloneMap.jsx         # 地圖底層 (Leaflet DarkMatter) + Canvas 粒子圖層
    │   ├── CycloneCanvas.js       # 核心演算法：極座標旋轉、風暴眼光暈、心聲粒子渲染
    │   ├── Sidebar.jsx            # 桌面端左側 35% 資訊看板
    │   ├── BottomSheet.jsx        # 行動端底部抽屜詳情卡片
    │   ├── TonightFilter.jsx      # 今晚去哪裡模式 (分類標籤與熱度滑桿)
    │   ├── StormDetailModal.jsx   # 暴風眼集合點、抵達狀態與小心聲發送
    │   ├── CreateStormModal.jsx   # 全民自主造局：發起新氣旋
    │   └── SafetyBadge.jsx        # 安全氣象台：信任分數與風險標籤
    └── data/
        └── mockEvents.js          # 豐富的台北/台灣預設種子資料 (包含官方強颱與民間小局)
```

### 4.2 核心視覺演算法 (Cyclone & Mood Particles)
1. **地圖座標投影轉換**：
   Canvas 圖層覆蓋在地圖上方。當使用者拖曳或縮放地圖時，利用地圖的 `latLngToContainerPoint` 將經緯度轉換為螢幕像素座標 $(X_c, Y_c)$。
2. **極座標旋轉步進**：
   針對每個氣旋內的心聲粒子與風線粒子，每幀更新其角度：
   $$\theta_{new} = \theta_{old} + \omega \cdot \Delta t$$
   角速度 $\omega$ 與風暴等級掛鉤（強烈颱風 $\omega$ 較快，熱帶低壓較慢悠閒）。
3. **心聲氣泡繪製**：
   繪製圓角半透明氣泡、微型情緒 Emoji（如 🎸、☕、🔥、🎉）與簡短文字（如「吉他野餐中！」、「現場排隊約10人」、「現場超嗨！」），並在滑鼠 Hover 時高亮放大。

### 4.3 預設種子活動資料 (Mock Seed Data)
預設載入符合企劃書情境的多筆活動：
* 🔴 **強烈颱風（官方大型）**：2026 台北跨年倒數搖滾夜（市府廣場，熱度 980，暴風半徑大，密集高流速粒子）。
* 🟠 **中度颱風（官方大型）**：新北巨星耶誕狂歡城（市民廣場，熱度 360）。
* 🟢 **輕度颱風（民間 UGC）**：大安森林公園春日不插電吉他野餐局（熱度 95，主辦人信任度 92 分）。
* 🔵 **熱帶低氣壓（民間 UGC）**：赤峰街微醺底片攝影夜散步（熱度 48）。
* 🟣 **氣旋種子（初發起）**：西門町深夜拉麵尋訪局（熱度 15）。

---

## 5. 交付物清單 (Deliverables)
1. 完整可運作的 React 前端專案原始碼。
2. 純 `docker-compose.yml`（直接使用 `node:20-alpine` 映像檔，免維護 Dockerfile，免手動 rebuild，支援 Vite 即時熱重載）。
3. 容器啟動測試：自動以 `docker compose up -d` 啟動，並以瀏覽器子代理驗證 `http://localhost:3000` 正常顯示與互動。

---

## 6. 審核檢查點 (Approval Check)

請確認本設計文件內容是否符合你的期待。確認後請回覆「**同意**」或提出欲修改之處；一旦你批准此設計文件，我們將立即依照規範調用 `writing-plans` 技能產出逐步實作計畫！
