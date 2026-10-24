# City-Meet 前端動態社群熱度地圖 (純 Docker Compose 版) 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打造一個免 Dockerfile、免 Rebuild 的純 `docker-compose.yml` 容器化 City-Meet 動態社群熱度地圖網頁，以 Canvas 極座標粒子系統完整實現分級颱風氣旋與圍繞旋轉的現場小心聲，並具備 RWD 雙欄/底部抽屜佈局、今晚去哪裡模式與暴風眼抵達狀態切換。

**Architecture:** 前端採用 React 18 + Vite + Leaflet 暗黑圖資，上層疊加自訂 Canvas 2D 極座標旋轉粒子引擎。整體透過純 `docker-compose.yml` 掛載 `node:20-alpine` 運行 Vite HMR 熱重載開發伺服器，對外暴露 `3000:3000` 端口。

**Tech Stack:** React 18, Vite, Leaflet, Lucide-React, HTML5 Canvas API, Docker Compose, Node 20.

**Spec:** [docs/superpowers/specs/2026-10-24-city-meet-frontend-container-design.md](file:///Users/fachu/Desktop/Projects/City-Meet/docs/superpowers/specs/2026-10-24-city-meet-frontend-container-design.md)

## Global Constraints
- **免 Dockerfile**：直接在 `docker-compose.yml` 使用 `image: node:20-alpine`，透過 volume 掛載即時熱重載。
- **免外部 API Key**：底圖使用 CartoDB DarkMatter 暗色系開源向量瓦片，開箱即用不依賴 Mapbox token。
- **純極座標運算**：心聲粒子運動必須遵循極座標軌跡 $X = X_c + r \cdot \cos(\theta + \omega \cdot t)$ 與 $Y = Y_c + r \cdot \sin(\theta + \omega \cdot t)$。
- **颱風等級分級**：必須涵蓋種子、低壓、輕颱、中颱（官方）、強颱（跨年萬人）五種不同半徑與角速度風場。
- **RWD 規範**：桌面端（>=768px）雙欄（左側 35%、右側 65%）；手機端（<768px）滿版地圖 + Bottom Sheet 抽屜。

## Review Focus
1. 地圖縮放與拖曳時，Canvas 上的氣旋中心與旋轉心聲必須與經緯度座標即時緊密貼合，無漂移延遲。
2. 粒子旋轉在手機端自動調節數量以保證 60 FPS 流暢度與省電。
3. 發布新的「現場小心聲」時，心聲氣泡能即時無縫加入旋轉氣旋軌道。
4. 切換「今晚去哪裡」標籤時，過濾後的氣旋平滑過渡，未被選中的氣旋優雅淡出。
5. 暴風眼集合點的「我出發了 ➔ 我快到了 ➔ 已抵達」三態切換即時響應並顯示當前抵達人數統計。

---

### Task 1: 專案基礎腳手架與 Docker Compose 配置

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `docker-compose.yml`
- Create: `.gitignore`

**Interfaces:**
- Produces: 啟動於 `http://0.0.0.0:3000` 的 Vite HMR 開發環境與本機容器映射。

- [ ] **Step 1: 建立 package.json 與相依套件設定**
  定義 `react`, `react-dom`, `leaflet`, `lucide-react`, `canvas-confetti` 與開發工具 `vite`, `@vitejs/plugin-react`。
- [ ] **Step 2: 建立 vite.config.js**
  配置 `server: { host: '0.0.0.0', port: 3000, watch: { usePolling: true } }` 以確保 Docker 容器內的檔案變更觸發 HMR。
- [ ] **Step 3: 建立 index.html 與 .gitignore**
  加入 Google Fonts (Outfit / Inter) 與 Leaflet CSS CDN，設定頁面標題為「City-Meet | 城市社交氣象台」。
- [ ] **Step 4: 建立純 docker-compose.yml**
  使用 `image: node:20-alpine`，掛載 `.:/app`，執行 `sh -c "npm install && npm run dev -- --host 0.0.0.0 --port 3000"`。
- [ ] **Step 5: 驗證 docker compose 配置語法**
  執行: `docker compose config`
  預期: 正確解析 service `web`，映射 ports `3000:3000`。

---

### Task 2: 全域設計系統、色彩變數與種子活動資料庫

**Files:**
- Create: `src/index.css`
- Create: `src/data/mockEvents.js`

**Interfaces:**
- Produces:
  - CSS 變數：`--bg-dark`, `--primary-cyan`, `--warning-orange`, `--danger-red`, `--glass-bg` 等玻璃擬態與霓虹色彩。
  - `export const SEED_EVENTS`: 台灣北中南 5 大活動（含台北跨年強颱、新北耶誕城中颱、大安吉他野餐輕颱、赤峰街攝影散步低壓、西門町拉麵種子）。
  - `export const STORM_LEVELS`: 等級定義、對應顏色、角速度與半徑規格。

- [ ] **Step 1: 編寫 src/index.css**
  設定暗夜科技風背景、自訂滾動條、玻璃擬態光暈效果（Glassmorphism）、雷達脈衝動畫（`@keyframes radar-pulse`）。
- [ ] **Step 2: 編寫 src/data/mockEvents.js**
  建構五個包含 `id`, `title`, `sourceType` (official/ugc), `coordinates` ([lat, lng]), `stormLevel`, `heatScore`, `category`, `assemblyPoint`, `participantsStatus`, `moodParticles`, `safetyTrust` 的真實地標活動。
- [ ] **Step 3: 驗證種子資料正確性**
  執行簡易 node 腳本讀取並檢查所有活動的經緯度與等級參數。

---

### Task 3: 核心 Canvas 氣旋與小心聲極座標旋轉引擎

**Files:**
- Create: `src/components/CycloneCanvas.js`

**Interfaces:**
- Produces:
  - `createCycloneEngine(canvas, getScreenCoords, options)`: 返回控制器包含 `render()`, `addMood(eventId, text, emoji)`, `destroy()`, `setHoveredStorm(id)`。
  - 極座標更新函數：計算每顆心聲粒子與背景風場弧線的位置。

- [ ] **Step 1: 建立極座標旋轉數學計算模組**
  實現根據風暴等級（角速度 $\omega$、半徑 $r$）計算位置，並實現粒子隨風場旋轉。
- [ ] **Step 2: 實現氣旋風場漩渦與小心聲氣泡繪製**
  Canvas 繪製外環風暴氣流、中心暴風眼微光以及帶有 Emoji 貼圖的半透明圓角小心聲對話泡泡。
- [ ] **Step 3: 實現 Hover 與點擊檢測**
  滑鼠接近氣旋時高亮顯示核心小心聲內容。
- [ ] **Step 4: 單元驗證**
  確保極座標計算函式在不同 $t$ 下角度連續遞增且座標有界。

---

### Task 4: 互動式暗黑地圖圖層 (CycloneMap)

**Files:**
- Create: `src/components/CycloneMap.jsx`

**Interfaces:**
- Consumes: `CycloneCanvas.js`, `SEED_EVENTS`
- Produces: `<CycloneMap events={filteredEvents} selectedEvent={selectedEvent} onSelectEvent={fn} />`

- [ ] **Step 1: 初始化 Leaflet 暗黑底圖**
  使用 CartoDB DarkMatter 瓦片，預設中心定於台北車站周邊（25.0478, 121.5170），縮放層級 13。
- [ ] **Step 2: 疊加全覆蓋 Canvas 圖層**
  將 HTML5 Canvas 錨定在地圖容器上方，監聽地圖 `move`, `zoom`, `resize` 事件，動態更新投影座標。
- [ ] **Step 3: 地圖視角飛入與互動切換**
  點選特定氣旋時，地圖平滑平移（`flyTo`）至該暴風眼中心，並開啟詳情。
- [ ] **Step 4: 驗證圖層對齊**
  確保縮放時粒子引力中心完全與地理座標鎖定。

---

### Task 5: 響應式佈局：桌面側邊欄 (Sidebar) 與手機底部抽屜 (BottomSheet)

**Files:**
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/BottomSheet.jsx`
- Create: `src/components/TonightFilter.jsx`
- Create: `src/components/SafetyBadge.jsx`

**Interfaces:**
- Produces:
  - `<TonightFilter activeCategory={cat} onSelectCategory={fn} stormFilter={level} onSelectLevel={fn} />`
  - `<Sidebar />`: 桌面端 35% 寬度看板，展示城市氣象總覽、熱門風暴列表、今晚去哪裡控制項。
  - `<BottomSheet />`: 手機端滑動抽屜，展示選中活動詳情。
  - `<SafetyBadge trustScore={score} flags={flags} isOfficial={bool} />`: 信任度儀表與風險標籤。

- [ ] **Step 1: 實作 TonightFilter 元件**
  包含「官方強颱 vs 民間小局」快速切換、分類標籤（全部、美食、文青、派對、運動）。
- [ ] **Step 2: 實作 SafetyBadge 元件**
  展示官方認證盾牌（免驗證高信任度）或民間主辦人信任分數（例如 92分、完成率 100%）。
- [ ] **Step 3: 實作桌面端 Sidebar**
  包含頂部「城市社交氣象台」即時指數、活動列表卡片（點擊卡片地圖飛至該氣旋）。
- [ ] **Step 4: 實作行動端 BottomSheet 與 FAB 浮動按鈕**
  針對視窗寬度 < 768px 提供滑出式詳情卡片與圓形篩選按鈕。

---

### Task 6: 暴風眼集合點、小心聲發送與全民自主造局互動

**Files:**
- Create: `src/components/StormDetailModal.jsx`
- Create: `src/components/CreateStormModal.jsx`
- Create: `src/App.jsx`
- Create: `src/main.jsx`

**Interfaces:**
- Produces:
  - 暴風眼集合點與抵達狀態切換器（我出發了 ➔ 我快到了 ➔ 已抵達）。
  - 「丟一顆現場小心聲」輸入框與貼圖選單，即時飛入當前氣旋粒子陣列。
  - 「發起新活動」表單（標題、地點點選、分類、初始小心聲），新增後自動以「氣旋種子」型態出現在地圖上。

- [ ] **Step 1: 實作 StormDetailModal**
  整合集合點地標資訊、當前抵達人數統計條、即時心聲流、發送心聲功能。
- [ ] **Step 2: 實作 CreateStormModal**
  提供使用者自訂活動名稱、類別、集合點備註，送出後觸發彩帶動畫並於地圖生成新氣旋。
- [ ] **Step 3: 在 App.jsx 整合所有狀態**
  管理 `events`、`selectedEvent`、`filters`、`userStatus`、`isMobile`，並串聯所有組件。
- [ ] **Step 4: 在 main.jsx 掛載 React 應用**

---

### Task 7: Docker Compose 啟動與瀏覽器全功能驗證

**Files:**
- Docker Compose 啟動與自動驗證

- [ ] **Step 1: 本機安裝相依套件並確認語法無誤**
  執行 `npm install` 並執行 `npm run build` 驗證無語法或打包錯誤。
- [ ] **Step 2: 透過 Docker Compose 啟動服務**
  執行: `docker compose up -d`
  預期: 容器啟動成功，映射主機 `3000` 端口。
- [ ] **Step 3: 使用瀏覽器子代理驗證功能**
  - 造訪 `http://localhost:3000`，驗證台北地圖與氣旋旋轉粒子正常運作。
  - 測試切換「今晚去哪裡」分類篩選。
  - 點擊氣旋查看暴風眼集合點與小心聲。
  - 測試發布一則新的現場小心聲，觀察心聲粒子加入旋轉。
  - 測試切換至行動裝置檢視（手機寬度），驗證 Bottom Sheet 與浮動按鈕。
- [ ] **Step 4: 輸出測試通過報告與操作指南**
