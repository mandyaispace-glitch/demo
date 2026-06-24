/**
 * 精力管理評測系統 - 後端 Google Apps Script 範本
 * 
 * 部署步驟：
 * 1. 在 Google 試算表（Google Sheets）中，點選上方選單「擴充功能」 -> 「Apps Script」。
 * 2. 清空原本的代碼，將此檔案的所有內容貼上。
 * 3. 修改下方設定區的 CLIENT_ORIGIN 為您的 Vercel 前端網址（可放星號 *，但指定網址較安全）。
 * 4. 點選右上方「網頁應用程式部署 (Deploy -> New deployment)」：
 *    - 類型選擇：網頁應用程式 (Web app)
 *    - 執行身分：我 (Me)
 *    - 誰有權限存取：所有人 (Anyone)
 * 5. 部署完成後複製「網頁應用程式 URL」，此 URL 即為前端 `app.js` 所需設定的 API 網址。
 */

// ================== 設定區 ==================
const CONFIG = {
  SHEET_NAME: "學員名單", // 試算表分頁名稱
  CLIENT_ORIGIN: "*",    // 允許跨網域存取的前端來源，建議限制為您的 Vercel 網址，如 "https://client-a.vercel.app"
};

// 欄位定義索引 (以 0 為基準，A=0, B=1...)
const COL = {
  TIMESTAMP: 0,  // A欄：建立時間
  EMAIL: 1,      // B欄：電子信箱
  NAME: 2,       // C欄：姓名
  TOKEN: 3,      // D欄：安全憑證 (Magic Link Token)
  PRE_START: 4,  // E欄：前測 Q1 開始的位置 (E 到 AB 欄)
  POST_START: 28 // AC欄：後測 Q1 開始的位置 (AC 到 AZ 欄)
};

/**
 * 處理 GET 請求 (查詢學員狀態與歷史分數)
 * 網址格式：https://script.google.com/macros/s/.../exec?email=student@example.com&token=a8f9
 */
function doGet(e) {
  const email = e.parameter.email;
  const token = e.parameter.token;
  
  if (!email || !token) {
    return makeResponse({ success: false, error: "缺少參數 email 或 token" }, 400);
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      return makeResponse({ success: false, error: "找不到指定的試算表分頁：" + CONFIG.SHEET_NAME }, 500);
    }
    
    const data = sheet.getDataRange().getValues();
    let userRowIndex = -1;
    
    // 從第 2 行開始尋找 (排除標題列)
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL.EMAIL].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
        userRowIndex = i;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return makeResponse({ success: false, error: "此 Email 尚未註冊，請聯絡顧問。" }, 404);
    }
    
    const row = data[userRowIndex];
    const dbToken = row[COL.TOKEN].toString().trim();
    
    // 驗證 Token 是否相符
    if (dbToken !== token.trim()) {
      return makeResponse({ success: false, error: "驗證失敗，憑證不正確。" }, 403);
    }
    
    const name = row[COL.NAME].toString();
    
    // 取得前測分數 (24 題)
    const preScores = [];
    let hasPre = false;
    for (let col = COL.PRE_START; col < COL.PRE_START + 24; col++) {
      const val = row[col];
      if (val !== "" && val !== null && !isNaN(val)) {
        preScores.push(Number(val));
        hasPre = true;
      }
    }
    
    // 取得後測分數 (24 題)
    const postScores = [];
    let hasPost = false;
    for (let col = COL.POST_START; col < COL.POST_START + 24; col++) {
      const val = row[col];
      if (val !== "" && val !== null && !isNaN(val)) {
        postScores.push(Number(val));
        hasPost = true;
      }
    }
    
    // 判斷作答狀態
    let status = "NEW"; // 尚未作答前測
    if (hasPre && !hasPost) {
      status = "PRE_DONE"; // 已做前測，未做後測
    } else if (hasPre && hasPost) {
      status = "BOTH_DONE"; // 前後測皆已完成
    }
    
    return makeResponse({
      success: true,
      status: status,
      name: name,
      email: email,
      preScores: status !== "NEW" ? preScores : null,
      postScores: status === "BOTH_DONE" ? postScores : null
    });
    
  } catch (err) {
    return makeResponse({ success: false, error: "系統錯誤: " + err.message }, 500);
  }
}

/**
 * 處理 POST 請求 (提交前測或後測分數)
 * Payload 格式：{"email": "...", "token": "...", "testType": "pre|post", "scores": [5, 4, ...]}
 */
function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return makeResponse({ success: false, error: "無效的 JSON 內容" }, 400);
  }
  
  const email = params.email;
  const token = params.token;
  const testType = params.testType; // "pre" 或 "post"
  const scores = params.scores;
  
  if (!email || !token || !testType || !scores || !Array.isArray(scores) || scores.length !== 24) {
    return makeResponse({ success: false, error: "參數遺失或分數格式不正確 (須為 24 題分數)" }, 400);
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    let userRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][COL.EMAIL].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
        userRowIndex = i;
        break;
      }
    }
    
    if (userRowIndex === -1) {
      return makeResponse({ success: false, error: "此 Email 尚未註冊" }, 404);
    }
    
    const row = data[userRowIndex];
    const dbToken = row[COL.TOKEN].toString().trim();
    
    // 驗證 Token
    if (dbToken !== token.trim()) {
      return makeResponse({ success: false, error: "憑證不正確" }, 403);
    }
    
    // 寫入對應區間 (試算表的 RowIndex 是 1-indexed，所以要在 userRowIndex + 1)
    const writeRow = userRowIndex + 1;
    let startCol = (testType === "pre") ? COL.PRE_START + 1 : COL.POST_START + 1; // getRange 也是 1-indexed
    
    // 整排寫入 (1 row, 24 columns)
    const range = sheet.getRange(writeRow, startCol, 1, 24);
    range.setValues([scores]);
    
    // 更新時間戳記
    sheet.getRange(writeRow, COL.TIMESTAMP + 1).setValue(new Date());
    
    return makeResponse({
      success: true,
      message: (testType === "pre" ? "前測" : "後測") + "分數提交成功！"
    });
    
  } catch (err) {
    return makeResponse({ success: false, error: "儲存失敗: " + err.message }, 500);
  }
}

/**
 * 輔助函數：包裝 CORS JSON 回應
 */
function makeResponse(data, status = 200) {
  // Apps Script Web Apps 回傳 CORS header 的方法是透過 TextOutput 並指定 MimeType.JSON
  const output = ContentService.createTextOutput(JSON.stringify(data))
                               .setMimeType(ContentService.MimeType.JSON);
                               
  // 雖然 Apps Script 不直接支援設置 HTTP 狀態碼，但我們可以把狀態碼寫在回傳 JSON 中
  data.code = status;
  return output;
}
