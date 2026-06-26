/**
 * 精力管理評測系統 - 後端 Google Apps Script 範本
 * 
 * 部署步驟：
 * 1. 在 Google 試算表（Google Sheets）中，點選上方選單「擴充功能」 -> 「Apps Script」。
 * 2. 清空原本的代碼，將此檔案的所有內容貼上。
 * 3. 修改下方設定區的 CONFIG 內容：
 *    - FRONTEND_URL: 填入您的 Vercel 前端網址（例如 https://survey-demo.vercel.app）
 *    - COACH_EMAIL: 填入您的電子信箱（教練）
 *    - OWNER_EMAIL: 填入業主的電子信箱
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
  FRONTEND_URL: "https://demo-gamma-mauve.vercel.app", // 您的 Vercel 前端網頁網址，用來自動生成 Magic Link

  // 郵件通知設定
  ENABLE_EMAIL_NOTIFICATION: true, // 是否開啟郵件通知
  COACH_EMAIL: "mandyaispace@gmail.com", // 您的信箱（教練），多個信箱用逗號隔開
  OWNER_EMAIL: "Amychou43@gmail.com",  // 業主的信箱，多個信箱用逗號隔開
  OWNER_NAME: "Hank 能量管理團隊",      // 業主名稱 (用於信件末尾簽名)
  
  // 後台管理密碼設定
  ADMIN_PASSWORD: "admin123" // 👈 題目後台管理密碼 (預設 admin123，您可在此修改)
};

// 欄位定義索引 (以 0 為基準，A=0, B=1...)
const COL = {
  TIMESTAMP: 0,  // A欄：建立時間
  EMAIL: 1,      // B欄：電子信箱
  NAME: 2,       // C欄：姓名
  TOKEN: 3,      // D欄：安全憑證 (Magic Link Token)
  PRE_START: 4,  // E欄：前測 Q1 開始的位置 (E 到 AB 欄)
  POST_START: 28, // AC欄：後測 Q1 開始的位置 (AC 到 AZ 欄)
  MAGIC_LINK: 52 // BA欄：自動生成的免登入連結 (Magic Link)
};

/**
 * 處理 GET 請求 (查詢學員狀態與歷史分數，或獲取題目清單)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  // 1. 處理讀取題目的請求
  if (action === "get_questions") {
    try {
      const sheet = checkAndCreateQuestionsSheet();
      const data = sheet.getDataRange().getValues();
      const questions = [];
      
      // 從第二列開始讀取題目 (排除標題列)
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] !== "" && data[i][0] !== null) {
          questions.push({
            q: Number(data[i][0]),
            code: data[i][1].toString(),
            skill: data[i][2].toString(),
            text: data[i][3].toString()
          });
        }
      }
      
      // 依題號排序
      questions.sort((a, b) => a.q - b.q);
      
      return makeResponse({ success: true, questions: questions });
    } catch (err) {
      return makeResponse({ success: false, error: "讀取題目失敗: " + err.message }, 500);
    }
  }

  // 1.5 處理檢查 Email 是否已註冊的請求
  if (action === "check_email") {
    const email = e.parameter.email;
    if (!email) {
      return makeResponse({ success: false, error: "缺少 email 參數" }, 400);
    }
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
      if (!sheet) {
        return makeResponse({ success: true, registered: false });
      }
      const data = sheet.getDataRange().getValues();
      let registered = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][COL.EMAIL].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
          registered = true;
          break;
        }
      }
      return makeResponse({ success: true, registered: registered });
    } catch (err) {
      return makeResponse({ success: false, error: "檢查 Email 失敗: " + err.message }, 500);
    }
  }

  // 2. 原本的學員狀態查詢請求
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
 * 處理 POST 請求 (提交前測或後測分數，新註冊，或由後台更新題目)
 */
function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (err) {
    return makeResponse({ success: false, error: "無效的 JSON 內容" }, 400);
  }
  
  const action = params.action;
  
  // 1. 處理修改題目的請求
  if (action === "update_questions") {
    const password = params.password;
    const questions = params.questions;
    
    if (password !== CONFIG.ADMIN_PASSWORD) {
      return makeResponse({ success: false, error: "管理密碼錯誤，拒絕儲存！" }, 403);
    }
    
    if (!questions || !Array.isArray(questions) || questions.length !== 24) {
      return makeResponse({ success: false, error: "題目數量不正確 (須剛好為 24 題)" }, 400);
    }
    
    try {
      const sheet = checkAndCreateQuestionsSheet();
      
      // 格式化為 24 列寫入的陣列
      const rowsToWrite = questions.map(q => {
        return [Number(q.q), q.code.toString(), q.skill.toString(), q.text.toString()];
      });
      
      // 排序確保寫入題號正確 1~24
      rowsToWrite.sort((a, b) => a[0] - b[0]);
      
      // 覆寫 2 到 25 列
      sheet.getRange(2, 1, 24, 4).setValues(rowsToWrite);
      
      return makeResponse({ success: true, message: "所有題目修改已同步至試算表！" });
    } catch (err) {
      return makeResponse({ success: false, error: "寫入題目失敗: " + err.message }, 500);
    }
  }
  
  // 2. 原本的提交測驗分數請求
  const email = params.email;
  const name = params.name; // 新註冊時傳遞的姓名
  const token = params.token; // 已註冊學員傳遞的憑證
  const testType = params.testType; // "pre" 或 "post"
  const scores = params.scores;
  
  if (!email || !testType || !scores || !Array.isArray(scores) || scores.length !== 24) {
    return makeResponse({ success: false, error: "參數遺失或分數格式不正確" }, 400);
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
    
    let dbToken = "";
    let studentName = "";
    let writeRow = -1;
    
    if (userRowIndex === -1) {
      // 1. 如果此 Email 尚未註冊，則進行「首次註冊 + 填寫前測」
      if (testType !== "pre") {
        return makeResponse({ success: false, error: "此信箱尚未註冊，無法進行後測。" }, 400);
      }
      if (!name) {
        return makeResponse({ success: false, error: "首次填寫請提供您的姓名。" }, 400);
      }
      
      studentName = name.trim();
      dbToken = generateRandomToken();
      
      // 新增一行並寫入時間戳記 (解決 appendRow 不能為空的 Google 限制)
      sheet.appendRow([new Date()]);
      writeRow = sheet.getLastRow();
      
      // 寫入其餘基本資料
      sheet.getRange(writeRow, COL.EMAIL + 1).setValue(email.trim());
      sheet.getRange(writeRow, COL.NAME + 1).setValue(studentName);
      sheet.getRange(writeRow, COL.TOKEN + 1).setValue(dbToken);
      
      // 生成並寫入 Magic Link
      const magicLink = CONFIG.FRONTEND_URL + "/?email=" + encodeURIComponent(email.trim()) + "&token=" + dbToken;
      sheet.getRange(writeRow, COL.MAGIC_LINK + 1).setValue(magicLink);
      
    } else {
      // 2. 如果已註冊，則為帶憑證的作答 (前測或後測)
      if (!token) {
        return makeResponse({ success: false, error: "此信箱已被註冊，請使用您的專屬 Magic Link 連結登入作答。" }, 403);
      }
      
      const row = data[userRowIndex];
      dbToken = row[COL.TOKEN].toString().trim();
      studentName = row[COL.NAME].toString();
      
      // 驗證 Token 是否正確
      if (dbToken !== token.trim()) {
        return makeResponse({ success: false, error: "驗證失敗，專屬憑證不正確。" }, 403);
      }
      
      writeRow = userRowIndex + 1;
    }
    
    // 寫入分數對應區間 (試算表的 RowIndex 是 1-indexed，所以要在 userRowIndex + 1)
    let startCol = (testType === "pre") ? COL.PRE_START + 1 : COL.POST_START + 1; // getRange 也是 1-indexed
    
    // 整排寫入 (1 row, 24 columns)
    const range = sheet.getRange(writeRow, startCol, 1, 24);
    range.setValues([scores]);
    
    // 更新時間戳記
    sheet.getRange(writeRow, COL.TIMESTAMP + 1).setValue(new Date());
    
    // 發送郵件通知
    if (CONFIG.ENABLE_EMAIL_NOTIFICATION) {
      try {
        sendEmailNotification(email.trim(), studentName, dbToken, testType);
      } catch (mailErr) {
        Logger.log("郵件發送失敗但分數已成功儲存: " + mailErr.message);
      }
    }
    
    return makeResponse({
      success: true,
      token: dbToken, // 回傳 Token 給前端，讓前端能夠在首次提交後維持登入狀態
      message: (testType === "pre" ? "前測" : "後測") + "分數提交成功！"
    });
    
  } catch (err) {
    return makeResponse({ success: false, error: "儲存失敗: " + err.message }, 500);
  }
}

/**
 * 試算表編輯觸發器：當手動輸入 Email 時，自動生成 Token 與 Magic Link
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  // 僅在「學員名單」分頁，且修改 B 欄 (Email) 時觸發
  if (sheet.getName() !== CONFIG.SHEET_NAME || range.getColumn() !== (COL.EMAIL + 1)) {
    return;
  }
  
  const row = range.getRow();
  if (row === 1) return; // 排除標題列
  
  const email = range.getValue().toString().trim();
  if (!email) return;
  
  // 檢查 Token 是否已存在
  const tokenRange = sheet.getRange(row, COL.TOKEN + 1);
  let token = tokenRange.getValue().toString().trim();
  if (!token) {
    token = generateRandomToken();
    tokenRange.setValue(token);
  }
  
  // 自動生成 Magic Link
  const magicLinkRange = sheet.getRange(row, COL.MAGIC_LINK + 1);
  const magicLink = CONFIG.FRONTEND_URL + "/?email=" + encodeURIComponent(email) + "&token=" + token;
  magicLinkRange.setValue(magicLink);
}

/**
 * 當試算表開啟時，自動新增自訂選單
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("精力管理系統")
    .addItem("一鍵生成所有 Token 與 Magic Link", "generateAllTokensAndLinks")
    .addItem("一鍵開通郵件授權 (點擊以授權)", "runPermissionTest")
    .addToUi();
}

/**
 * 批量為所有學員生成 Token 與 Magic Link
 */
function generateAllTokensAndLinks() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("找不到指定的試算表分頁：" + CONFIG.SHEET_NAME);
    return;
  }
  
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert("目前沒有學員資料。");
    return;
  }
  
  let count = 0;
  for (let row = 2; row <= lastRow; row++) {
    const email = sheet.getRange(row, COL.EMAIL + 1).getValue().toString().trim();
    if (!email) continue;
    
    let token = sheet.getRange(row, COL.TOKEN + 1).getValue().toString().trim();
    let updated = false;
    
    if (!token) {
      token = generateRandomToken();
      sheet.getRange(row, COL.TOKEN + 1).setValue(token);
      updated = true;
    }
    
    const magicLinkRange = sheet.getRange(row, COL.MAGIC_LINK + 1);
    const expectedLink = CONFIG.FRONTEND_URL + "/?email=" + encodeURIComponent(email) + "&token=" + token;
    
    if (magicLinkRange.getValue().toString().trim() !== expectedLink) {
      magicLinkRange.setValue(expectedLink);
      updated = true;
    }
    
    if (updated) count++;
  }
  
  SpreadsheetApp.getUi().alert("處理完成！已為 " + count + " 位學員生成/更新 Token 與 Magic Link。");
}

/**
 * 產生 8 位數隨機 Token
 */
function generateRandomToken() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 發送 HTML 郵件通知學員、教練與業主
 */
function sendEmailNotification(email, name, token, testType) {
  const testTypeName = (testType === "pre") ? "前測" : "後測";
  const reportUrl = CONFIG.FRONTEND_URL + "/?email=" + encodeURIComponent(email) + "&token=" + token;
  
  // 1. 發送給學員的郵件內容
  const studentSubject = `【精力管理評測】您的${testTypeName}已完成！請查看您的個人報告`;
  const studentBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #3db05e; border-bottom: 2px solid #3db05e; padding-bottom: 10px;">精力管理評測完成通知</h2>
      <p>親愛的 <strong>${name}</strong> 您好：</p>
      <p>感謝您參與精力管理評測，您已成功提交 <strong>${testTypeName}</strong> 分數。</p>
      <p>系統已為您生成了專屬的<strong>互動式精力雷達圖與分析報告</strong>，您可以隨時點選下方按鈕查看或進行沙盒模擬調整：</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${reportUrl}" style="background-color: #3db05e; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">查看我的評測報告</a>
      </div>
      <p style="color: #8899a6; font-size: 13px; line-height: 1.5;">* 此網址為您的專屬登入憑證 (Magic Link)，請妥善保存，切勿將此信件轉寄給他人。<br>
      * 您可以在報告頁面調整滑桿模擬改善後的狀態，此模擬不會覆蓋您已提交的正式數據。</p>
      <p style="text-align: right; margin-top: 25px; margin-bottom: 10px; font-size: 15px; color: #333333;">
        <strong>${CONFIG.OWNER_NAME}</strong> 敬上
      </p>
      <hr style="border: 0; border-top: 1px solid #e1e8ed; margin: 20px 0;">
      <p style="font-size: 12px; color: #aab8c2; text-align: center;">本信件由系統自動發送，請勿直接回覆。</p>
    </div>
  `;
  
  // 寄信給學員
  try {
    GmailApp.sendEmail(email, studentSubject, "", {
      htmlBody: studentBody
    });
  } catch (err) {
    Logger.log("學員郵件發送失敗: " + err.message);
  }
  
  // 2. 發送給教練與業主的郵件內容
  const adminSubject = `【評測通知】學員 ${name} 已完成精力管理${testTypeName}`;
  const adminBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; background-color: #f5f8fa;">
      <h3 style="color: #1b95e0; margin-top: 0;">學員作答通知</h3>
      <p>您好：</p>
      <p>學員 <strong>${name}</strong> (信箱: ${email}) 已於剛才完成並提交了 <strong>精力管理${testTypeName}</strong>。</p>
      <p>您可以點選下方連結，直接檢視該學員的報告與雷達圖：</p>
      <p><a href="${reportUrl}" style="color: #1b95e0; font-weight: bold; text-decoration: underline;">點此查看學員的互動報告</a></p>
      <hr style="border: 0; border-top: 1px solid #e1e8ed; margin: 20px 0;">
      <p style="font-size: 12px; color: #aab8c2;">本信件為系統自動通知，請勿回覆。</p>
    </div>
  `;
  
  // 寄信給教練與業主
  const adminEmails = [];
  if (CONFIG.COACH_EMAIL && CONFIG.COACH_EMAIL !== "coach@example.com") {
    adminEmails.push(CONFIG.COACH_EMAIL);
  }
  if (CONFIG.OWNER_EMAIL && CONFIG.OWNER_EMAIL !== "owner@example.com") {
    adminEmails.push(CONFIG.OWNER_EMAIL);
  }
  
  if (adminEmails.length > 0) {
    try {
      GmailApp.sendEmail(adminEmails.join(","), adminSubject, "", {
        htmlBody: adminBody
      });
    } catch (err) {
      Logger.log("管理者郵件發送失敗: " + err.message);
    }
  }
}

/**
 * 輔助函數：包裝 CORS JSON 回應
 */
function makeResponse(data, status = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
                               .setMimeType(ContentService.MimeType.JSON);
  data.code = status;
  return output;
}

/**
 * 輔助函數：檢查並自動建立「題目設定」分頁，且填入 24 題預設題目
 */
function checkAndCreateQuestionsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("題目設定");
  if (!sheet) {
    sheet = ss.insertSheet("題目設定");
    sheet.appendRow(["題號", "維度代碼", "指標代碼", "題目敘述"]);
    
    const defaultQuestions = [
      [1, "AC2", "AC", "我能在繁忙的工作生活中找到時間進行運動，並且感到運動後精力充沛。"],
      [2, "AC1", "AC", "我每週至少進行三次體能運動（如有氧運動、瑜伽或力量訓練），來保持體能。"],
      [3, "CC2", "CC", "當我進入心流狀態時，我的工作效率和創造力會大幅提升。"],
      [4, "DA2", "DA", "我的工作和生活中有一個清晰的方向，並且我的行為與這個目標一致。"],
      [5, "CC1", "CC", "我經常進入一種完全投入工作、感覺時間流逝的心流狀態。"],
      [6, "CA2", "CA", "我會使用具體的策略（如番茄工作法）來提高我的專注力和工作效率。"],
      [7, "DC2", "DC", "我會思考和探索生活中更深層次的意義，這使我在面對困難時更有韌性。"],
      [8, "BB1", "BB", "當我感受到壓力或焦慮時，我能快速識別並有效處理這些負向情緒。"],
      [9, "DC1", "DC", "我能在日常生活中找到深刻的意義，無論是工作還是私人時間。"],
      [10, "BB2", "BB", "我知道如何在情緒低潮時給自己短暫的休息，幫助自己恢復平靜。"],
      [11, "CB2", "CB", "我會定期給自己放空的時間，幫助自己重新集中注意力。"],
      [12, "BA2", "BA", "在面對挑戰時，我能主動尋找積極的視角，並讓自己保持正向情緒。"],
      [13, "AB1", "AB", "我每晚通常能獲得足夠的睡眠（7-8小時），並且早晨感覺精神充沛。"],
      [14, "BA1", "BA", "我每天有意識地進行一些活動來提升我的心情，如冥想、感恩或娛樂。"],
      [15, "DB2", "DB", "我會定期反思自己的使命，並且將其融入到日常行為中。"],
      [16, "DB1", "DB", "我的工作或生活中有一種使命感，讓我對所做的事充滿熱情和動力。"],
      [17, "BC1", "BC", "我有一套有效的壓力管理方法，能在忙碌的工作中保持冷靜。"],
      [18, "AA1", "AA", "我每天的飲食選擇能提供我足夠的能量 and 營養來應對工作和日常活動。"],
      [19, "AA2", "AA", "我能維持穩定的飲食習慣，並避免因為忙碌而忽視健康飲食。"],
      [20, "CB1", "CB", "我知道如何通過短暫的休息來放鬆大腦，讓自己更快進入專注狀態。"],
      [21, "BC2", "BC", "我會定期進行放鬆或冥想練習，來減輕工作和生活中的壓力。"],
      [22, "DA1", "DA", "我有明確的長期目標，並且經常回顧自己是否在朝著這些目標前進。"],
      [23, "CA1", "CA", "我能在工作中保持長時間的專注，不易分心或打斷。"],
      [24, "AB2", "AB", "我有良好的睡眠習慣，通常能夠快速入睡並保持整夜不被打斷。"]
    ];
    
    sheet.getRange(2, 1, 24, 4).setValues(defaultQuestions);
  }
  return sheet;
}

/**
 * 授權與發信測試函數
 * 
 * 步驟：
 * 1. 在 Apps Script 頂部選單選擇「runPermissionTest」
 * 2. 點擊「執行」，依提示完成 Google 帳號授權
 * 3. 檢查您的信箱是否收到測試信
 */
function runPermissionTest() {
  const testEmail = CONFIG.COACH_EMAIL;
  Logger.log("準備發送測試信至: " + testEmail);
  try {
    GmailApp.sendEmail(testEmail, "【精力管理系統】Google Apps Script 授權測試信", "", {
      htmlBody: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px;">
          <h2 style="color: #1b95e0;">🎉 授權成功！</h2>
          <p>您好，當您收到這封信時，代表您的 Google Apps Script 已成功開通發信授權！</p>
          <p>現在網頁版評測系統填寫完畢後，學員與教練就能正常收到通知信了。</p>
          <hr style="border: 0; border-top: 1px solid #e1e8ed; margin: 20px 0;">
          <p style="font-size: 12px; color: #aab8c2;">本信件由系統自動發送測試，無需回覆。</p>
        </div>
      `
    });
    Logger.log("測試信發送成功！請檢查信箱。");
    SpreadsheetApp.getUi().alert("🎉 測試信已發送成功！\n請檢查您的信箱 (" + testEmail + ") 是否收到測試郵件。");
  } catch (err) {
    Logger.log("測試信發送失敗，錯誤原因: " + err.message);
    SpreadsheetApp.getUi().alert("❌ 發送失敗！\n錯誤原因: " + err.message);
  }
}
