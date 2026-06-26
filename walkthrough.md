# 專屬精力管理評測系統：功能實作成果與部署指南 (Walkthrough)

本專案已成功建立一整套客製化精力管理評測系統的**母版模板 (Master Template)**，存放於本地目錄的 [energy-survey-master](file:///C:/Users/manma/.gemini/antigravity/scratch/energy-survey-master/) 文件夾中。

以下為交付檔案清單與詳細部署操作步驟，協助您在 5 分鐘內完成新客戶的開通與上線。

---

## 📂 交付檔案清單 (Deliverables)

1.  **[index.html](file:///C:/Users/manma/.gemini/antigravity/scratch/energy-survey-master/index.html)**: 精緻的前端單頁應用程式 (SPA)。整合歡迎引導、單題流暢答題引擎、以及動態唯讀對比報告。
2.  **[styles.css](file:///C:/Users/manma/.gemini/antigravity/scratch/energy-survey-master/styles.css)**: 採用現代 Vanilla CSS 與 HSL 精緻配色。頂部預留 CSS 品牌變數，可一秒更換主色調。
3.  **[app.js](file:///C:/Users/manma/.gemini/antigravity/scratch/energy-survey-master/app.js)**: 控制答題進度、Chart.js 雷達圖渲染，並處理後端 Google Apps Script 的 API 連線。內建「Demo 體驗模式」。
4.  **[google-apps-script.js](file:///C:/Users/manma/.gemini/antigravity/scratch/energy-survey-master/google-apps-script.js)**: 供 Google 試算表貼上的後端程式碼，提供高安全性的免登入 API，具有跨來源限制 (CORS)。

---

## 🧪 本地測試與模擬體驗 (How to Run Local Demo)

您不需要安裝任何編譯工具，這是一個純靜態網頁專案：
1.  **開啟模擬模式**：直接使用瀏覽器開啟 [index.html](file:///C:/Users/manma/.gemini/antigravity/scratch/energy-survey-master/index.html)。
2.  由於網址中不包含 `email` 與 `token` 參數，系統會**自動切換至「模擬體驗模式 (Demo Mode)」**。
3.  您將能立刻看到精美的 Before/After 雙層雷達圖（前測 58 分、後測 80 分）、動態診斷文字與指標細節。
4.  **模擬答題流程**：您可以在網址後方加上 `?demo=true` 並重新整理，便能從「歡迎畫面」開始體驗 24 題的答題流暢度與存檔效果。

---

## 🚀 客戶部署五步驟 (Client Deployment Step-by-Step)

當您要為新客戶（例如 **客戶 D**）上線專屬評測系統時，請依照以下步驟操作：

### 第一步：準備 Google 試算表（資料庫）
1.  建立一個新的 Google 試算表，將分頁（工作表）命名為：`學員名單`。
2.  在第一行（標題列）分別輸入以下標題：
    *   **A1**: `最後更新時間`
    *   **B1**: `Email`
    *   **C1**: `姓名`
    *   **D1**: `Token`
    *   **E1 ~ AB1**: 分別輸入 `前測_Q1` 到 `前測_Q24`
    *   **AC1 ~ AZ1**: 分別輸入 `後測_Q1` 到 `後測_Q24`
    *   **BA1**: `Magic Link` （自動填入，欄位不能留空或放其他資料）
3.  點選上方選單 **「擴充功能 (Extensions)」 -> 「Apps Script」**。
4.  複製並貼上 [google-apps-script.js](file:///C:/Users/manma/OneDrive/Documents/Antigrivity/Assessment%20Tool/google-apps-script.js) 中的所有程式碼。
5.  **修改設定區 CONFIG**：
    *   `FRONTEND_URL`: 修改成您的 Vercel 前端網址（例如 `https://survey-demo.vercel.app`）。
    *   `COACH_EMAIL`: 填入您的信箱（教練），當有人完成測驗時會寄信通知您。
    *   `OWNER_EMAIL`: 填入業主的信箱，讓業主也能收到通知。
6.  點擊右上方 **「部署 (Deploy)」 -> 「新增部署 (New deployment)」**：
    *   點擊齒輪選擇「網頁應用程式 (Web app)」。
    *   執行身分選擇：**「我」**。
    *   誰有權限存取選擇：**「所有人 (Anyone)」**。
7.  完成後複製系統產生的 **「網頁應用程式 URL」**。

---

### 第二步：建立該客戶的 GitHub 儲存庫
1.  在 GitHub 上利用您的「母版模板」建立一個新的 Private 儲存庫，命名為 `survey-client-D`。
2.  下載此專案，並修改客製化參數：
    *   **API 串接**：打開 `app.js`，將最上方的 `API_URL` 換成您在第一步複製的「網頁應用程式 URL」。
    *   **更換主色調**：打開 `styles.css`，修改 `:root` 裡的 `--teal` 與 `--teal-dark`。
    *   **更換商標**：將客戶 D 的 Logo 命名為 `logo.png` 並覆蓋原圖，或在 `index.html` 中修改圖片 URL。
3.  `git commit` 並 `git push` 到 GitHub。

---

### 第三步：在 Vercel 進行託管
1.  登入 Vercel 後台，點擊 **"Add New Project"**。
2.  匯入剛才建立的 `survey-client-D`。
3.  點選 **Deploy**。幾秒鐘後，客戶 D 的評測網站即可上線（例如 `survey-client-d.vercel.app`）。
4.  *(選用)*：您可在 Vercel 專案設定中綁定客戶的自訂網網域（如 `survey.clientD.com`）。

---

### 第四步：限制 API 存取安全性（可選，但強烈推薦）
為了防止他人惡意向您的 Google Apps Script 發送垃圾請求，您可以限制 API 來源：
1.  回到 Google Apps Script 視窗。
2.  修改最上方設定區的 `CLIENT_ORIGIN` 為您剛在 Vercel 產生的網站網址：
    ```javascript
    const CONFIG = {
      SHEET_NAME: "學員名單",
      CLIENT_ORIGIN: "https://survey-client-d.vercel.app", // 👈 改為您的前端網址
    };
    ```
3.  點擊「部署」 -> 「管理部署」 -> 點選編輯圖示 -> 選擇「新版本(New Version)」 -> 點擊「部署」。

---

### 第五步：自動生成 Magic Link 與學員作答、郵件通知
1.  **自動/批量生成連結**：
    *   **方法 A (自動)**：在「學員名單」分頁中，只要在 **B 欄 (Email)** 輸入新信箱，系統的 `onEdit` 觸發器會**自動在 D 欄生成 8 位數隨機 Token，並在 BA 欄直接產生 Magic Link**！
    *   **方法 B (手動一鍵生成)**：如果您一次貼上多名學員，可以點選試算表頂部選單的 **「精力管理系統」 -> 「一鍵生成所有 Token 與 Magic Link」**，系統將一次為所有缺失連結的學員批量補齊。
2.  **發送連結**：顧問複製 BA 欄生成的專屬網址，發送給學員。
3.  **開始與自動郵件通知**：
    *   學員點開網址直接點擊「開始測驗」，作答 24 題後提交。
    *   提交成功後，**系統會自動向該學員、教練、業主發送精美 HTML 郵件通知**，信中包含查看個人報告的專屬連結。
    *   學員在輔導結束後，點選「同一個網址」即可進行「後測」。後測完成後同樣會觸發郵件通知，且點開報告即可看到前後測對比的雷達圖！
4.  **系統日誌與排錯**：
    *   系統內建了**試算表日誌功能**。當發生任何執行錯誤（例如郵件發送失敗、Token 驗證失敗等），後端會自動在同一個 Google 試算表中建立名為 **「系統日誌」** 的新分頁，並將時間、動作、與詳細的報錯訊息直接寫入。
    *   如果學員未收到信件，您不需要到 Apps Script 後台看空白的日誌，直接在試算表的「系統日誌」分頁即可一目了然！
