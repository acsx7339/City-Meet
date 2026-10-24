# 🚀 Superpowers 技能清單與使用手冊 (Cheatsheet)

> 本文件彙整了由 **Jesse Vincent (`obra/superpowers`)** 所開發的 AI Agent 軟體工程技能包（Skills Framework）。  
> 這些技能已全域安裝於 `~/.gemini/config/plugins/superpowers/`，可在 Antigravity IDE 或 CLI 環境中隨時調用。

---

## 📖 核心理念與調用方式

Superpowers 不是單純的提示詞（Prompt），而是為 AI Coding Agent 設計的**軟體工程工作流程**，旨在抑制 AI 隨意猜測（vibe-coding）的陋習，強制導入規格確認、測試驅動開發（TDD）與系統化除錯。

### 如何調用技能？
Antigravity 採用**漸進式揭露（Progressive Disclosure）**機制，平時不佔用 Token，只有在觸發時載入。你可以透過以下方式使用：

1. **直接指名技能**（推薦、最精確）：
   ```text
   請使用 brainstorming 技能，先釐清「使用者登入與權限管理」的規格與架構。
   ```
2. **依情境自然觸發**：
   當你的要求與技能描述吻合時（例如：「*先幫我寫會失敗的測試，再開始實作*」），AI 會自動識別並讀取對應的 `SKILL.md`。
3. **管理外掛狀態**：
   ```bash
   agy plugin list                 # 檢視已安裝插件
   agy plugin disable superpowers  # 暫時停用
   agy plugin enable superpowers   # 重新啟用
   ```

---

## 📋 15 個技能完整清單與分類

### 💡 階段一：需求規劃與規格定義

#### 1. `brainstorming`
* **觸發時機**：在進行任何創造性工作之前（新增功能、建立新元件、修改系統行為、架構規劃等）。
* **功能說明**：強制 AI 不准直接寫程式碼，而是透過蘇格拉底式的循序提問，協助你梳理邊界條件、使用情境與系統架構，產出明確的 Specification。
* **對話範例**：
  > 「我想在現有的 City-Meet 加入活動報名候補機制，請使用 `brainstorming` 技能先幫我梳理規格。」

#### 2. `writing-plans`
* **觸發時機**：當需求規格明確，準備開始多步驟任務之前。
* **功能說明**：將複雜的開發任務拆解成具體、可驗證、顆粒度適中的循序執行計畫（Implementation Plan）。
* **對話範例**：
  > 「規格已經確認完畢，請使用 `writing-plans` 技能產出逐步實作清單。」

---

### 🛠️ 階段二：環境隔離與實作開發

#### 3. `using-git-worktrees`
* **觸發時機**：開始執行新功能或計畫前，需要隔離開發環境以避免污染當前工作區時。
* **功能說明**：透過 Git Worktree 在乾淨獨立的分支目錄中進行開發與測試。
* **對話範例**：
  > 「請使用 `using-git-worktrees` 技能，開立一個獨立 worktree 來處理這個功能。」

#### 4. `test-driven-development` (TDD)
* **觸發時機**：實作任何新功能或修復 Bug 時，在撰寫正式代碼之前。
* **功能說明**：嚴格實施 **Red-Green-Refactor** 週期。必須先寫出測試並「親眼目睹測試失敗（Red）」，確認測試有效後，才編寫實作代碼使其通過（Green），最後進行重構。
* **對話範例**：
  > 「請遵循 `test-driven-development` 技能實作折扣計算函式，先寫單元測試。」

#### 5. `executing-plans`
* **觸發時機**：在當前對話工作階段由主 Agent 自行依序執行已建立的實作計畫時。
* **功能說明**：按部就班執行計畫中的各項 Task，並在每個階段做進度追蹤與核對。
* **對話範例**：
  > 「請使用 `executing-plans` 技能，依照剛才制定的計畫清單開始實作第一步。」

#### 6. `subagent-driven-development`
* **觸發時機**：執行包含多個相互獨立任務的計畫時。
* **功能說明**：派發專責的 Subagent 去完成各自的子任務，並在合併前進行檢查。
* **對話範例**：
  > 「這個計畫中的資料庫 Migration 與前端元件彼此獨立，請用 `subagent-driven-development` 派發子任務處理。」

#### 7. `dispatching-parallel-agents`
* **觸發時機**：面對 2 個以上無共用狀態、無順序相依性的平行任務時。
* **功能說明**：同時啟動多個並行 Agent 處理不同檔案或模組，最大化開發效率。
* **對話範例**：
  > 「這五個頁面的繁體中文 i18n 翻譯互不影響，請使用 `dispatching-parallel-agents` 同時處理。」

---

### 🔍 階段三：系統化除錯

#### 8. `systematic-debugging`
* **觸發時機**：遇到任何 Bug、測試失敗或非預期行為，在提出修改方案之前。
* **功能說明**：嚴格執行**四階段根因分析**（重現問題 ➔ 隔離變因 ➔ 找出根本原因 ➔ 驗證修正），禁止未經證實的隨機猜測式修復。
* **對話範例**：
  > 「API 遇到 500 內部伺服器錯誤，請使用 `systematic-debugging` 技能進行排查，不要瞎猜改法。」

---

### 🎯 階段四：審查、驗證與收尾

#### 9. `requesting-code-review`
* **觸發時機**：任務實作完成、完成重要功能或準備發起 PR 前。
* **功能說明**：主動依據需求清單、安全規範與代碼風格進行嚴謹的自我審查。
* **對話範例**：
  > 「這個模組已撰寫完畢，請使用 `requesting-code-review` 技能進行自我檢查與產出 Review 清單。」

#### 10. `receiving-code-review`
* **觸發時機**：收到代碼審查意見或人類的反饋，在動手修改之前。
* **功能說明**：強調技術嚴謹度與驗證，禁止盲目應和或直接照單全收；先釐清背後邏輯與衝擊面再行動。
* **對話範例**：
  > 「這是我主管留下的 Code Review 評語，請用 `receiving-code-review` 技能先評估其技術合理性與修改範圍。」

#### 11. `verification-before-completion`
* **觸發時機**：在宣稱「任務已完成」、「問題已修復」或準備 Commit 之前。
* **功能說明**：**證據先於斷言（Evidence before assertions）**。強制執行驗證命令（如 `npm test`、`npm run build`），確認看到成功的輸出才能回報完成。
* **對話範例**：
  > 「在宣稱此功能完成前，請使用 `verification-before-completion` 技能執行完整測試並提供輸出證據。」

#### 12. `finishing-a-development-branch`
* **觸發時機**：所有實作與測試均已通過，需要決定如何整併代碼時。
* **功能說明**：協助整理 Commit 紀錄、移除臨時調試碼、確認分支整潔並準備發 PR。
* **對話範例**：
  > 「功能已全部通過測試，請使用 `finishing-a-development-branch` 技能協助整理 Git 分支並準備 PR。」

---

### ⚙️ 框架與診斷工具

#### 13. `using-superpowers`
* **觸發時機**：Superpowers 技能包的入口指南。
* **功能說明**：規範 Agent 在遇到任何任務時，只要有 1% 的可能性符合某個技能，就必須優先調用該技能。

#### 14. `diagnosing-superpowers`
* **觸發時機**：當 Superpowers 運作不如預期、技能未正常觸發、或想向作者回報 Bug 時。
* **功能說明**：檢視 Session Log、分析任務未按規範執行的原因，並產出診斷報告。
* **對話範例**：
  > 「剛才 Agent 似乎跳過了 TDD 步驟，請使用 `diagnosing-superpowers` 技能幫我分析為什麼沒有遵守規則。」

#### 15. `writing-skills`
* **觸發時機**：自己想要編寫新技能、擴充客製化 runbook 或修改現有技能時。
* **功能說明**：提供標準化 SKILL.md 格式範本、漸進式載入規範與測試標準。
* **對話範例**：
  > 「我想為我們團隊寫一個部署到 GCP Cloud Run 的專屬 Skill，請使用 `writing-skills` 技能指引我。」

---

## ⚡ 常用情境速查表

| 我的當前情境 | 推薦搭配的技能 | 建議提示詞範例 |
| :--- | :--- | :--- |
| **剛拿到需求，還沒有細節** | `brainstorming` | `請用 brainstorming 幫我釐清這個功能的規格` |
| **要做較大功能，需要分步驟** | `writing-plans` | `請用 writing-plans 規劃實作步驟` |
| **要開始寫新功能或修復** | `test-driven-development` | `請依照 TDD 流程，先寫測試再寫實作` |
| **程式壞掉、出現莫名錯誤** | `systematic-debugging` | `請用 systematic-debugging 四階段除錯法排查` |
| **即將完成，準備提交代碼** | `verification-before-completion` | `請用 verification-before-completion 跑完測試並出示證據` |
| **準備發 Pull Request** | `finishing-a-development-branch` | `請用 finishing-a-development-branch 幫我收尾分支` |
