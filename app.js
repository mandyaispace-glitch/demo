/**
 * 精力管理評測系統 - 前端核心邏輯
 */

// ================== 系統配置區 ==================
const CONFIG = {
  // 將此處替換為您的 Google Apps Script Web App URL
  API_URL: "https://script.google.com/macros/s/AKfycbzMaAqcYU38q7zKFbI-9vH_8R4x_TDDsYVzt4rUyj5vFeyN6tBcVGBKDVQJDLbQeOHe/exec", 
  
  // 評測維度定義
  dimensions: [
    {
      id: "physical",
      label: "體能",
      description: "關注飲食、睡眠和運動，這些是支持身體能量的基礎。",
      color: "#3db05e",
      skills: ["AA", "AB", "AC"]
    },
    {
      id: "emotional",
      label: "情緒",
      description: "集中在如何創造正向情緒、排除負向情緒與壓力管理。",
      color: "#d8c32f",
      skills: ["BA", "BB", "BC"]
    },
    {
      id: "mental",
      label: "思維",
      description: "探討專注、放空來提升專注力以及如何進入心流狀態。",
      color: "#e57c23",
      skills: ["CA", "CB", "CC"]
    },
    {
      id: "spirit",
      label: "精神",
      description: "著重於創造個人願景、使命感以及尋找人生意義。",
      color: "#e24e42",
      skills: ["DA", "DB", "DC"]
    }
  ],

  // 12 項知識技術指標
  skills: [
    { code: "AA", dimension: "physical", label: "飲食" },
    { code: "AB", dimension: "physical", label: "睡眠" },
    { code: "AC", dimension: "physical", label: "運動" },
    { code: "BA", dimension: "emotional", label: "創造正向情緒" },
    { code: "BB", dimension: "emotional", label: "排除負向情緒" },
    { code: "BC", dimension: "emotional", label: "壓力管理" },
    { code: "CA", dimension: "mental", label: "專注" },
    { code: "CB", dimension: "mental", label: "放空的技術" },
    { code: "CC", dimension: "mental", label: "心流體驗" },
    { code: "DA", dimension: "spirit", label: "創造個人願景" },
    { code: "DB", dimension: "spirit", label: "使命感" },
    { code: "DC", dimension: "spirit", label: "人生意義" }
  ],

  // 24 題原始題庫
  questions: [
    { q: 1, code: "AC2", skill: "AC", text: "我能在繁忙的工作生活中找到時間進行運動，並且感到運動後精力充沛。" },
    { q: 2, code: "AC1", skill: "AC", text: "我每週至少進行三次體能運動（如有氧運動、瑜伽或力量訓練），來保持體能。" },
    { q: 3, code: "CC2", skill: "CC", text: "當我進入心流狀態時，我的工作效率和創造力會大幅提升。" },
    { q: 4, code: "DA2", skill: "DA", text: "我的工作和生活中有一個清晰的方向，並且我的行為與這個目標一致。" },
    { q: 5, code: "CC1", skill: "CC", text: "我經常進入一種完全投入工作、感覺時間流逝的心流狀態。" },
    { q: 6, code: "CA2", skill: "CA", text: "我會使用具體的策略（如番茄工作法）來提高我的專注力和工作效率。" },
    { q: 7, code: "DC2", skill: "DC", text: "我會思考和探索生活中更深層次的意義，這使我在面對困難時更有韌性。" },
    { q: 8, code: "BB1", skill: "BB", text: "當我感受到壓力或焦慮時，我能快速識別並有效處理這些負向情緒。" },
    { q: 9, code: "DC1", skill: "DC", text: "我能在日常生活中找到深刻的意義，無論是工作還是私人時間。" },
    { q: 10, code: "BB2", skill: "BB", text: "我知道如何在情緒低潮時給自己短暫的休息，幫助自己恢復平靜。" },
    { q: 11, code: "CB2", skill: "CB", text: "我會定期給自己放空的時間，幫助自己重新集中注意力。" },
    { q: 12, code: "BA2", skill: "BA", text: "在面對挑戰時，我能主動尋找積極的視角，並讓自己保持正向情緒。" },
    { q: 13, code: "AB1", skill: "AB", text: "我每晚通常能獲得足夠的睡眠（7-8小時），並且早晨感覺精神充沛。" },
    { q: 14, code: "BA1", skill: "BA", text: "我每天有意識地進行一些活動來提升我的心情，如冥想、感恩或娛樂。" },
    { q: 15, code: "DB2", skill: "DB", text: "我會定期反思自己的使命，並且將其融入到日常行為中。" },
    { q: 16, code: "DB1", skill: "DB", text: "我的工作或生活中有一種使命感，讓我對所做的事充滿熱情和動力。" },
    { q: 17, code: "BC1", skill: "BC", text: "我有一套有效的壓力管理方法，能在忙碌的工作中保持冷靜。" },
    { q: 18, code: "AA1", skill: "AA", text: "我每天的飲食選擇能提供我足夠的能量和營養來應對工作和日常活動。" },
    { q: 19, code: "AA2", skill: "AA", text: "我能維持穩定的飲食習慣，並避免因為忙碌而忽視健康飲食。" },
    { q: 20, code: "CB1", skill: "CB", text: "我知道如何通過短暫的休息來放鬆大腦，讓自己更快進入專注狀態。" },
    { q: 21, code: "BC2", skill: "BC", text: "我會定期進行放鬆或冥想練習，來減輕工作和生活中的壓力。" },
    { q: 22, code: "DA1", skill: "DA", text: "我有明確的長期目標，並且經常回顧自己是否在朝著這些目標前進。" },
    { q: 23, code: "CA1", skill: "CA", text: "我能在工作中保持長時間的專注，不易分心或打斷。" },
    { q: 24, code: "AB2", skill: "AB", text: "我有良好的睡眠習慣，通常能夠快速入睡並保持整夜不被打斷。" }
  ]
};

// ================== 狀態控制區 ==================
const state = {
  mode: "production",    // "production" (打API) 或 "demo" (本地模擬)
  status: "NEW",         // "NEW", "PRE_DONE", "BOTH_DONE"
  email: "",
  token: "",
  studentName: "",
  
  // 分數儲存
  preScores: null,       // 前測的 12 項技能得分 (長度 12)
  postScores: null,      // 後測的 12 項技能得分 (長度 12)
  
  // 作答進度控制
  currentQuestionIndex: 0,
  currentAnswers: Array(24).fill(null), // 24題的作答結果 (0-5分)
  
  chartInstance: null    // Chart.js 實例
};

// ================== DOM 元素綁定 ==================
const elements = {
  loadingView: document.getElementById("loading-view"),
  errorView: document.getElementById("error-view"),
  errorMessage: document.getElementById("error-message"),
  welcomeView: document.getElementById("welcome-view"),
  welcomeName: document.getElementById("welcome-name"),
  testTypeBadge: document.getElementById("test-type-badge"),
  welcomeStatusDesc: document.getElementById("welcome-status-desc"),
  startBtn: document.getElementById("start-btn"),
  registrationForm: document.getElementById("registration-form"),
  regName: document.getElementById("reg-name"),
  regEmail: document.getElementById("reg-email"),
  welcomeGreetingContainer: document.getElementById("welcome-greeting-container"),
  goPostBtn: document.getElementById("go-post-btn"),
  
  quizView: document.getElementById("quiz-view"),
  quizCategory: document.getElementById("quiz-category"),
  quizProgressText: document.getElementById("quiz-progress-text"),
  quizProgressBar: document.getElementById("quiz-progress-bar"),
  questionId: document.getElementById("question-id"),
  questionText: document.getElementById("question-text"),
  quizOptions: document.querySelector(".quiz-options"),
  prevBtn: document.getElementById("prev-btn"),
  
  reportView: document.getElementById("report-view"),
  profileName: document.getElementById("profile-name"),
  profileEmail: document.getElementById("profile-email"),
  profileMode: document.getElementById("profile-mode"),
  reportModeTag: document.getElementById("report-mode-tag"),
  beforeTotalScore: document.getElementById("before-total-score"),
  afterTotalScore: document.getElementById("after-total-score"),
  afterTotalLabel: document.getElementById("after-total-label"),
  afterTotalContainer: document.getElementById("after-total-container"),
  liftScore: document.getElementById("lift-score"),
  liftContainer: document.getElementById("lift-container"),
  statusPill: document.getElementById("status-pill"),
  coreSummaryText: document.getElementById("core-summary-text"),
  diagnosisTitle: document.getElementById("diagnosis-title"),
  diagnosisBodyText: document.getElementById("diagnosis-body-text"),
  
  dimensionListContainer: document.getElementById("dimension-list-container"),
  skillGridContainer: document.getElementById("skill-grid-container"),
  actionListContainer: document.getElementById("action-list-container"),
  watchListContainer: document.getElementById("watch-list-container"),
  chartLegend: document.getElementById("chart-legend"),
  demoBadge: document.getElementById("demo-badge")
};

// 將 24 題的原始作答分數轉換為 12 項技術的得分
function convertRawScoresToSkills(rawScores) {
  if (!rawScores || !Array.isArray(rawScores) || rawScores.length !== 24) return null;
  return CONFIG.skills.map(skill => {
    const relatedQuestions = CONFIG.questions.filter(q => q.skill === skill.code);
    return relatedQuestions.reduce((total, q) => {
      const qIndex = CONFIG.questions.findIndex(item => item.q === q.q);
      return total + rawScores[qIndex];
    }, 0);
  });
}

// 載入雲端題目
async function fetchQuestions() {
  if (state.mode === "demo") return;
  const url = `${CONFIG.API_URL}?action=get_questions`;
  try {
    const response = await fetch(url);
    const result = await response.json();
    if (result.success && result.questions && Array.isArray(result.questions) && result.questions.length === 24) {
      CONFIG.questions = result.questions;
    }
  } catch (err) {
    console.warn("無法從伺服器載入題目，將使用本地預設題目。", err);
  }
}

// ================== 初始化與驗證流程 ==================
async function initApp() {
  const urlParams = new URLSearchParams(window.location.search);
  state.email = urlParams.get("email");
  state.token = urlParams.get("token");
  const isDemo = urlParams.get("demo") === "true";

  if (isDemo) {
    setupDemoMode();
  } else if (state.email && state.token) {
    state.mode = "production";
    await fetchQuestions(); // 優先載入雲端題目
    fetchStudentStatus();
  } else {
    await fetchQuestions(); // 優先載入雲端題目
    setupRegisterMode();
  }

  bindEvents();
}

// 啟動首次填寫註冊模式
function setupRegisterMode() {
  state.mode = "register";
  state.status = "NEW";
  
  // 顯示註冊表單，隱藏個人稱呼
  elements.registrationForm.classList.remove("hidden");
  elements.welcomeGreetingContainer.classList.add("hidden");
  
  elements.testTypeBadge.textContent = "前測";
  elements.testTypeBadge.style.backgroundColor = "var(--before)";
  elements.welcomeStatusDesc.textContent = "歡迎開始您的精力評測。請在上方填寫您的基本資料，填寫完 24 題並提交後，系統將自動生成並寄送您的「個人專屬報告連結 (Magic Link)」至您的信箱。";
  
  // 隱藏加載畫面，顯示歡迎面板
  elements.loadingView.classList.add("hidden");
  elements.welcomeView.classList.remove("hidden");
}

// 啟動 Demo 體驗模式
function setupDemoMode() {
  state.mode = "demo";
  const urlParams = new URLSearchParams(window.location.search);
  const startFromQuiz = urlParams.get("demo") === "true";
  
  state.studentName = "體驗學員 (Webber)";
  state.email = "demo@example.com";
  
  elements.demoBadge.classList.remove("hidden");
  
  if (startFromQuiz) {
    state.status = "NEW"; // 模擬新學員
    setupWelcomeView();
    switchView("welcome-view");
  } else {
    state.status = "BOTH_DONE"; // 預設直接顯示報告與沙盒
    // 原書基準模擬數據：前測 58 分，後測 80 分
    state.preScores = [5, 4, 5, 5, 5, 5, 6, 5, 5, 4, 4, 5];
    state.postScores = [8, 6, 6, 6, 7, 6, 8, 7, 9, 5, 5, 7];
    switchView("report-view");
    renderReport();
  }
}

// 從後端 API 取得狀態
async function fetchStudentStatus() {
  const url = `${CONFIG.API_URL}?email=${encodeURIComponent(state.email)}&token=${encodeURIComponent(state.token)}`;
  
  try {
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      showError(result.error || "身分驗證失敗。");
      return;
    }
    
    state.status = result.status;
    state.studentName = result.name;
    
    // 將後端傳回的 24 題原始分數轉換為 12 項技術得分
    state.preScores = convertRawScoresToSkills(result.preScores);
    state.postScores = convertRawScoresToSkills(result.postScores);
    
    // 若完成前測 (PRE_DONE) 或完成前後測 (BOTH_DONE)，都直接顯示報告頁
    if (state.status === "BOTH_DONE" || state.status === "PRE_DONE") {
      switchView("report-view");
      renderReport();
    } else {
      setupWelcomeView();
      switchView("welcome-view");
    }
  } catch (err) {
    showError("網路連線錯誤，無法連接至評測伺服器。");
  }
}

// 設定歡迎面板資訊
function setupWelcomeView() {
  elements.registrationForm.classList.add("hidden");
  elements.welcomeGreetingContainer.classList.remove("hidden");
  elements.welcomeName.textContent = state.studentName;
  
  if (state.status === "PRE_DONE") {
    elements.testTypeBadge.textContent = "後測";
    elements.testTypeBadge.style.backgroundColor = "var(--after)";
    elements.welcomeStatusDesc.textContent = "您先前已完成前測，本次測驗為輔導後的後測評量，將用來比對精力管理方案的效果。";
  } else {
    elements.testTypeBadge.textContent = "前測";
    elements.testTypeBadge.style.backgroundColor = "var(--before)";
    elements.welcomeStatusDesc.textContent = "這是您第一次進行評測，此數據將作為您精力管理的基準點。";
  }
}

// ================== 問卷答題邏輯 ==================
function startQuiz() {
  if (state.mode === "register") {
    const nameVal = elements.regName.value.trim();
    const emailVal = elements.regEmail.value.trim();
    
    if (!nameVal || !emailVal) {
      alert("請填寫姓名與電子信箱！");
      return;
    }
    
    if (!emailVal.includes("@")) {
      alert("請輸入有效的電子信箱格式！");
      return;
    }
    
    state.studentName = nameVal;
    state.email = emailVal;
  }

  state.currentQuestionIndex = 0;
  state.currentAnswers = Array(24).fill(null);
  switchView("quiz-view");
  renderQuestion();
}

function renderQuestion() {
  const q = CONFIG.questions[state.currentQuestionIndex];
  const skill = CONFIG.skills.find(s => s.code === q.skill);
  const dimension = CONFIG.dimensions.find(d => d.id === skill.dimension);
  
  // 更新進度與維度標籤
  elements.quizCategory.textContent = `${dimension.label}維度 / ${skill.label}`;
  elements.quizCategory.style.borderLeft = `4px solid ${dimension.color}`;
  
  const progressPercent = Math.round(((state.currentQuestionIndex + 1) / 24) * 100);
  elements.quizProgressText.textContent = `${state.currentQuestionIndex + 1} / 24`;
  elements.quizProgressBar.style.width = `${progressPercent}%`;
  
  // 顯示題目內容
  elements.questionId.textContent = `Q${state.currentQuestionIndex + 1}`;
  elements.questionText.textContent = q.text;
  
  // 清除前次按鈕選取狀態
  const optionBtns = elements.quizOptions.querySelectorAll(".option-btn");
  optionBtns.forEach(btn => {
    btn.classList.remove("selected");
    btn.style.backgroundColor = "";
    btn.style.color = "";
    btn.style.borderColor = "";
  });
  
  // 如果此題已經回答過，標記選取值
  const savedAnswer = state.currentAnswers[state.currentQuestionIndex];
  if (savedAnswer !== null) {
    const activeBtn = Array.from(optionBtns).find(btn => Number(btn.dataset.score) === savedAnswer);
    if (activeBtn) {
      activeBtn.classList.add("selected");
      activeBtn.style.backgroundColor = "var(--teal)";
      activeBtn.style.color = "#ffffff";
      activeBtn.style.borderColor = "var(--teal)";
    }
  }
  
  // 上一題按鈕狀態
  elements.prevBtn.disabled = state.currentQuestionIndex === 0;
}

function handleOptionClick(score) {
  state.currentAnswers[state.currentQuestionIndex] = score;
  
  // 播放微動畫
  const clickedBtn = Array.from(elements.quizOptions.querySelectorAll(".option-btn")).find(btn => Number(btn.dataset.score) === score);
  if (clickedBtn) {
    clickedBtn.style.transform = "scale(0.9)";
    setTimeout(() => clickedBtn.style.transform = "", 100);
  }

  // 延遲跳下一題，讓學員感覺更平滑
  setTimeout(() => {
    if (state.currentQuestionIndex < 23) {
      state.currentQuestionIndex++;
      renderQuestion();
    } else {
      submitQuizResults();
    }
  }, 180);
}

// 提交測驗分數到後端
async function submitQuizResults() {
  switchView("loading-view");
  elements.loadingView.querySelector("p").textContent = "正在計算並儲存您的精力數據，請稍後...";
  
  const testType = (state.status === "PRE_DONE") ? "post" : "pre";
  
  if (state.mode === "demo") {
    // Demo 模式下，直接寫入本地 state 模擬存檔
    const calculatedSkillsScores = convertRawScoresToSkills(state.currentAnswers);
    if (testType === "pre") {
      state.preScores = calculatedSkillsScores;
      state.status = "PRE_DONE";
    } else {
      state.postScores = calculatedSkillsScores;
      state.status = "BOTH_DONE";
    }
    setTimeout(() => {
      switchView("report-view");
      renderReport();
    }, 1000);
    return;
  }
  
  // 生產環境打 API 儲存 (傳送 24 題原始作答分數)
  const payload = {
    email: state.email,
    testType: testType,
    scores: state.currentAnswers // 24 題原始作答分數 (0-5分)
  };
  
  if (state.mode === "register") {
    payload.name = state.studentName;
  } else {
    payload.token = state.token;
  }
  
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    
    if (!result.success) {
      showError(result.error || "儲存資料失敗。");
      return;
    }
    
    // 如果是新註冊，後端會回傳自動生成的 Token
    if (result.token) {
      state.token = result.token;
      state.mode = "production";
      
      // 更新網址列的參數，這樣學員重整頁面時不會遺失登入狀態
      const newUrl = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(state.email)}&token=${encodeURIComponent(state.token)}`;
      window.history.replaceState({}, "", newUrl);
    }
    
    // 儲存成功後，重新整理載入狀態
    fetchStudentStatus();
  } catch (err) {
    showError("網路儲存失敗，請檢查網路連線後重新載入。");
  }
}

// ================== 報告渲染與數據分析邏輯 ==================
function renderReport() {
  // 基本資料寫入
  elements.profileName.textContent = state.studentName;
  elements.profileEmail.textContent = state.email;
  
  // 顯示或隱藏「進行後測」按鈕 (僅在只完成前測且非 Demo 時顯示)
  if (state.status === "PRE_DONE" && state.mode !== "demo") {
    elements.goPostBtn.classList.remove("hidden");
  } else {
    elements.goPostBtn.classList.add("hidden");
  }
  
  // 計算總分
  const beforeTotal = sumScores(state.preScores);
  elements.beforeTotalScore.textContent = beforeTotal;
  
  const hasPost = state.status === "BOTH_DONE";
  
  if (hasPost) {
    const afterTotal = sumScores(state.postScores);
    elements.afterTotalScore.textContent = afterTotal;
    elements.afterTotalLabel.textContent = "輔導後測";
    
    const lift = afterTotal - beforeTotal;
    elements.liftScore.textContent = `${lift >= 0 ? "+" : ""}${lift}`;
    
    elements.liftContainer.classList.remove("hidden");
    elements.chartLegend.querySelector(".after-legend-item").classList.remove("hidden");
    elements.profileMode.textContent = "前後測成效對比";
    elements.reportModeTag.textContent = "前後測對比";
    
    // 設定狀態小藥丸
    const pill = elements.statusPill;
    pill.className = ""; // 清除
    if (lift >= 20) {
      pill.textContent = "顯著提升";
      pill.classList.add("level-high");
    } else if (lift >= 10) {
      pill.textContent = "穩定上升";
      pill.classList.add("level-med");
    } else if (lift >= 1) {
      pill.textContent = "微幅改善";
      pill.classList.add("level-med");
    } else {
      pill.textContent = "持平/需調整";
      pill.classList.add("level-low");
    }
  } else {
    // 只有前測 (Before Only)
    elements.afterTotalScore.textContent = "-";
    elements.afterTotalLabel.textContent = "後測尚未進行";
    elements.liftContainer.classList.add("hidden");
    elements.chartLegend.querySelector(".after-legend-item").classList.add("hidden");
    elements.profileMode.textContent = "單次前測數據基準";
    elements.reportModeTag.textContent = "前測報告";
    
    elements.statusPill.textContent = "已建立基準";
    elements.statusPill.className = "level-high";
  }

  // 1. 渲染四大維度分數清單
  renderDimensionsList(hasPost);
  
  // 2. 繪製雷達圖 (Radar Chart)
  drawRadarChart(hasPost);
  
  // 3. 核心診斷文案動態計算
  const diagnosis = calculateDiagnosis(hasPost, beforeTotal);
  elements.diagnosisTitle.textContent = `${diagnosis.lowestDimension.label}能量電池`;
  elements.diagnosisBodyText.innerHTML = diagnosis.bodyText;
  elements.coreSummaryText.textContent = diagnosis.summaryText;
  
  // 4. 渲染 12 項技能得分細節
  renderSkillsMetrics(hasPost);
  
  // 5. 渲染行動建議與優先追蹤題目
  renderRecommendations(hasPost, diagnosis.lowestDimension.id);
}

// 輔助：計算得分加總
function sumScores(scoreArray) {
  if (!scoreArray || !Array.isArray(scoreArray)) return 0;
  return scoreArray.reduce((a, b) => a + b, 0);
}

// 四大維度得分計算 (每個維度對應 3 項技能，滿分 30 分)
function getDimensionScores(scoreArray) {
  if (!scoreArray) return { physical: 0, emotional: 0, mental: 0, spirit: 0 };
  
  // scoreArray 長度 12，對應 CONFIG.skills 順序
  return {
    physical: scoreArray[0] + scoreArray[1] + scoreArray[2],
    emotional: scoreArray[3] + scoreArray[4] + scoreArray[5],
    mental: scoreArray[6] + scoreArray[7] + scoreArray[8],
    spirit: scoreArray[9] + scoreArray[10] + scoreArray[11]
  };
}

// 1. 渲染維度清單
function renderDimensionsList(hasPost) {
  const preDim = getDimensionScores(state.preScores);
  const postDim = hasPost ? getDimensionScores(state.postScores) : null;
  
  elements.dimensionListContainer.innerHTML = CONFIG.dimensions.map(dim => {
    const beforeVal = preDim[dim.id];
    const afterVal = hasPost ? postDim[dim.id] : "-";
    const liftVal = hasPost ? (postDim[dim.id] - preDim[dim.id]) : null;
    
    let liftString = "";
    if (liftVal !== null) {
      liftString = `<em>${liftVal >= 0 ? "+" : ""}${liftVal}</em>`;
    }
    
    return `
      <article class="dimension-row" style="--d-color: ${dim.color}">
        <div>
          <strong>${dim.label}能量維度</strong>
          <p>${dim.description}</p>
        </div>
        <div class="dimension-score">
          <span>${beforeVal} → ${afterVal}</span>
          ${liftString}
        </div>
      </article>
    `;
  }).join("");
}

// 2. 雷達圖繪製 (基於 Chart.js)
function drawRadarChart(hasPost) {
  const preDim = getDimensionScores(state.preScores);
  const postDim = hasPost ? getDimensionScores(state.postScores) : null;
  
  const labels = CONFIG.dimensions.map(d => d.label);
  const beforeData = [preDim.physical, preDim.emotional, preDim.mental, preDim.spirit];
  
  const datasets = [
    {
      label: "前次基準",
      data: beforeData,
      backgroundColor: "rgba(84, 106, 130, 0.15)",
      borderColor: "rgba(84, 106, 130, 0.7)",
      borderWidth: 2,
      pointBackgroundColor: "rgba(84, 106, 130, 1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(84, 106, 130, 1)",
      pointRadius: 4
    }
  ];
  
  if (hasPost) {
    const afterData = [postDim.physical, postDim.emotional, postDim.mental, postDim.spirit];
    datasets.push({
      label: "輔導後測",
      data: afterData,
      backgroundColor: "rgba(8, 140, 108, 0.22)",
      borderColor: "rgba(8, 140, 108, 0.8)",
      borderWidth: 3,
      pointBackgroundColor: "rgba(8, 140, 108, 1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(8, 140, 108, 1)",
      pointRadius: 5
    });
  }
  
  // 如果圖表已經存在，毀掉重建，避免疊圖
  if (state.chartInstance) {
    state.chartInstance.destroy();
  }
  
  const ctx = document.getElementById("radarCanvas").getContext("2d");
  state.chartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false // 自訂 Legend，故隱藏預設的
        }
      },
      scales: {
        r: {
          angleLines: {
            color: "rgba(26, 34, 31, 0.1)"
          },
          grid: {
            color: "rgba(26, 34, 31, 0.08)"
          },
          suggestedMin: 0,
          suggestedMax: 30, // 每個維度滿分為 30 分
          ticks: {
            stepSize: 5,
            color: "rgba(26, 34, 31, 0.4)",
            backdropColor: "transparent"
          },
          pointLabels: {
            font: {
              size: 14,
              weight: "bold",
              family: "'Inter', sans-serif"
            },
            color: "#1a221f"
          }
        }
      }
    }
  });
}

// 3. 診斷演算法
function calculateDiagnosis(hasPost, beforeTotal) {
  const preDim = getDimensionScores(state.preScores);
  const postDim = hasPost ? getDimensionScores(state.postScores) : null;
  const currentDim = hasPost ? postDim : preDim;
  
  // 找出目前最低分的維度
  let lowestDimId = "physical";
  let lowestVal = currentDim.physical;
  
  CONFIG.dimensions.forEach(dim => {
    if (currentDim[dim.id] < lowestVal) {
      lowestVal = currentDim[dim.id];
      lowestDimId = dim.id;
    }
  });
  
  const lowestDimension = CONFIG.dimensions.find(d => d.id === lowestDimId);
  
  let summaryText = "";
  let bodyText = "";
  
  if (hasPost) {
    // 找出進步最多的維度
    let biggestGap = -100;
    let biggestDimId = "physical";
    CONFIG.dimensions.forEach(dim => {
      const gap = postDim[dim.id] - preDim[dim.id];
      if (gap > biggestGap) {
        biggestGap = gap;
        biggestDimId = dim.id;
      }
    });
    
    const biggestDimension = CONFIG.dimensions.find(d => d.id === biggestDimId);
    
    summaryText = `${lowestDimension.label}能量是目前最低維度，${biggestDimension.label}能量則是輔導後進步最多的面向。`;
    bodyText = `這份結果展示了您在精力管理上的具體進步。總分從前次的 <b>${beforeTotal} 分</b> 提升到後次的 <b>${sumScores(state.postScores)} 分</b>，代表在輔導後您已成功修復了精力漏電。下一步的關鍵在於先<strong>穩固目前較低電量的 ${lowestDimension.label} 維度</strong>，並嘗試<strong>複製 ${biggestDimension.label} 維度在輔導期間做對的成功模式</strong>，將習慣自動化。`;
  } else {
    summaryText = `${lowestDimension.label}能量是目前得分最低（最漏電）的維度，建議列為第一階段改善目標。`;
    bodyText = `這是您的前測基準報告。在滿分 120 分中您獲得了 <b>${beforeTotal} 分</b>。數據顯示 <strong>${lowestDimension.label}能量電池</strong> 是目前電量最低、最需要優先進行精力補給的面向。在開始任何高強度工作安排前，請先透過下方建議來填補此維度的漏洞，建立穩固的精力底層支撐。`;
  }
  
  return { lowestDimension, summaryText, bodyText };
}

// 4. 渲染 12 項技能得分細節
function renderSkillsMetrics(hasPost) {
  // 若後測分數尚不存在，先以前測分數初始化，供學員在前台模擬調整
  if (!state.postScores) {
    state.postScores = [...state.preScores];
  }
  
  elements.skillGridContainer.innerHTML = CONFIG.skills.map((skill, index) => {
    const dim = CONFIG.dimensions.find(d => d.id === skill.dimension);
    const beforeVal = state.preScores[index];
    const afterVal = state.postScores[index];
    const liftVal = afterVal - beforeVal;
    
    return `
      <article class="skill-card" style="--skill-color: ${dim.color}">
        <div class="skill-head">
          <div>
            <span>${dim.label} / ${skill.code}</span>
            <strong>${skill.label}</strong>
          </div>
          <strong class="s-lift" style="color: ${liftVal >= 0 ? 'var(--after)' : 'var(--color-spirit)'}">
            ${liftVal >= 0 ? "+" : ""}${liftVal}
          </strong>
        </div>
        
        <div class="skill-score">
          <span>前次基準</span>
          <strong>${beforeVal} / 10</strong>
        </div>
        
        <div class="after-label">
          <span>輔導後測</span>
          <strong>可調整</strong>
        </div>
        
        <div class="after-editor" data-index="${index}">
          ${renderScoreButtons(index, afterVal)}
        </div>
      </article>
    `;
  }).join("");
}

function renderScoreButtons(skillIndex, selectedValue) {
  return Array.from({ length: 11 }, (_, score) => {
    const isChecked = score === selectedValue ? "checked" : "";
    return `
      <label>
        <input type="radio" name="after-score-${skillIndex}" value="${score}" ${isChecked} data-index="${skillIndex}" />
        <span>${score}</span>
      </label>
    `;
  }).join("");
}

// 5. 渲染行動建議與追蹤題目
function renderRecommendations(hasPost, lowestDimId) {
  // A. 行動建議
  // 找出進步最多的技術 (若無後測則預設以專注技術為案例)
  let bestLiftLabel = "專注技術";
  if (hasPost) {
    let maxLift = -100;
    let maxLiftIndex = 0;
    CONFIG.skills.forEach((_, idx) => {
      const lift = state.postScores[idx] - state.preScores[idx];
      if (lift > maxLift) {
        maxLift = lift;
        maxLiftIndex = idx;
      }
    });
    bestLiftLabel = CONFIG.skills[maxLiftIndex].label;
  }
  
  const lowestDim = CONFIG.dimensions.find(d => d.id === lowestDimId);
  
  const actions = [
    {
      title: "先管理精力，再安排時間",
      body: `分析顯示您目前最缺乏的是<b>${lowestDim.label}能量</b>。接下來請避免在行事曆中塞入更多緊湊行程，而是先找出導致該維度持續「漏電」的生活環節（如不規律睡眠或缺乏斷電休息），將其移除。`
    },
    {
      title: "建立精力儀式化習慣",
      body: "精力恢復不能靠心情決定。將睡眠、關鍵飲食、大腦放空技術做成固定的每日流程（例如睡前儀式、番茄工作法放空），讓恢復完全自動化。"
    },
    {
      title: `複製 【${bestLiftLabel}】 的成功條件`,
      body: `此技術是本次評估中進步或表現最優異的面向。請回顧您在這項指標改善時「做對了什麼事」（例如用了什麼輔助工具或環境設定），並嘗試將這些方法移植到其他弱項中。`
    }
  ];
  
  elements.actionListContainer.innerHTML = actions.map((act, index) => `
    <div class="action-item">
      <span class="action-index">${index + 1}</span>
      <div>
        <strong>${act.title}</strong>
        <p>${act.body}</p>
      </div>
    </div>
  `).join("");
  
  // B. 優先追蹤題目 (篩選出後測/當前得分最低的 3 項技能，並抓取題庫題目)
  const currentScores = hasPost ? state.postScores : state.preScores;
  
  // 包裝成有分數的物件陣列
  const mappedSkills = CONFIG.skills.map((skill, idx) => ({
    ...skill,
    score: currentScores[idx]
  }));
  
  // 排序前三低得分
  const lowestSkills = [...mappedSkills]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
    
  elements.watchListContainer.innerHTML = lowestSkills.map((skill, index) => {
    // 找出對應該技術的原始考題（兩題中取一題作為說明參考）
    const sampleQuestion = CONFIG.questions.find(q => q.skill === skill.code);
    
    return `
      <div class="watch-item">
        <span class="watch-index">${index + 1}</span>
        <div>
          <strong>${skill.label} (目前得分：${skill.score}/10 分)</strong>
          <p><em>優先檢視行為：</em>「${sampleQuestion.text}」</p>
        </div>
      </div>
    `;
  }).join("");
}

// ================== 共用輔助與事件監聽 ==================
function switchView(viewId) {
  const views = ["loading-view", "error-view", "welcome-view", "quiz-view", "report-view"];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (v === viewId) {
      el.classList.remove("hidden");
      el.classList.add("active");
    } else {
      el.classList.add("hidden");
      el.classList.remove("active");
    }
  });
}

function showError(msg) {
  elements.errorMessage.textContent = msg;
  switchView("error-view");
}

function bindEvents() {
  // 歡迎頁 -> 開始測驗
  elements.startBtn.addEventListener("click", startQuiz);
  
  // 答題按鈕監聽 (使用事件代理)
  elements.quizOptions.addEventListener("click", (e) => {
    if (e.target.classList.contains("option-btn")) {
      const score = Number(e.target.dataset.score);
      handleOptionClick(score);
    }
  });
  
  // 上一題按鈕監聽
  elements.prevBtn.addEventListener("click", () => {
    if (state.currentQuestionIndex > 0) {
      state.currentQuestionIndex--;
      renderQuestion();
    }
  });

  // 12 項技能分數模擬調整監聽 (事件代理)
  elements.skillGridContainer.addEventListener("change", (e) => {
    if (e.target.tagName === "INPUT" && e.target.type === "radio") {
      const skillIndex = Number(e.target.dataset.index);
      const newScore = Number(e.target.value);
      state.postScores[skillIndex] = newScore;
      
      // 若原先為 NEW 或 PRE_DONE 狀態，一旦開始模擬調整，強行將模式轉為 BOTH_DONE 對比渲染
      if (state.status !== "BOTH_DONE") {
        state.status = "BOTH_DONE";
      }
      
      renderReport();
    }
  });

  // 點擊「進行後測」按鈕
  elements.goPostBtn.addEventListener("click", () => {
    setupWelcomeView();
    switchView("welcome-view");
  });
}

// DOM 載入後啟動
document.addEventListener("DOMContentLoaded", initApp);
