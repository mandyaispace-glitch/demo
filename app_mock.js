const steps = [
  { title: "基本資料", desc: "受測者輪廓" },
  { title: "角色勾選", desc: "多重身分" },
  { title: "精力測評", desc: "15 題量表" },
  { title: "痛點描述", desc: "現況補充" },
  { title: "結果頁", desc: "圖表與處方" },
];

const dimensions = [
  {
    key: "sleep",
    label: "睡眠恢復",
    questions: ["我醒來時通常覺得有恢復體力", "我入睡不會花太久時間", "我的睡眠品質大致穩定"],
  },
  {
    key: "focus",
    label: "專注力",
    questions: ["我可以持續完成重要任務", "我不容易被通知或雜事打斷", "我能清楚安排一天的優先順序"],
  },
  {
    key: "emotion",
    label: "情緒穩定",
    questions: ["我遇到壓力時能維持冷靜", "我的情緒不太會突然大幅起伏", "我能在低潮時找到調整方法"],
  },
  {
    key: "stress",
    label: "壓力負荷",
    questions: ["我覺得目前的責任量還能承受", "我有時間消化壓力與待辦", "我不常有被事情追著跑的感覺"],
  },
  {
    key: "body",
    label: "身體活力",
    questions: ["我白天大多有足夠體力", "我有規律活動身體或伸展", "我不常靠咖啡或糖分硬撐"],
  },
];

const roleOptions = ["上班族", "管理者", "創業者 / 自由工作者", "學生", "家庭照顧者", "內容創作者", "其他"];
const painOptions = ["常常很累", "睡再久還是沒精神", "注意力不集中", "容易分心", "壓力大", "工作效率低", "下班後完全沒電", "不知道怎麼改善", "其他"];

const demoAnswers = Object.fromEntries(
  dimensions.flatMap((dimension) =>
    dimension.questions.map((_, index) => {
      const values = { sleep: [2, 3, 2], focus: [3, 2, 3], emotion: [3, 3, 2], stress: [2, 2, 2], body: [3, 2, 3] };
      return [`${dimension.key}-${index}`, values[dimension.key][index]];
    }),
  ),
);

const state = {
  step: 0,
  started: false,
  profile: {
    name: "",
    age: "",
    occupation: "",
    interview: "",
  },
  roles: [],
  answers: {},
  pains: [],
  painText: "",
  error: "",
};

const demoState = {
  profile: {
    name: "林晨",
    age: "31–40",
    occupation: "產品經理 / 團隊主管",
    interview: "是",
  },
  roles: ["上班族", "管理者", "內容創作者"],
  answers: demoAnswers,
  pains: ["常常很累", "注意力不集中", "壓力大", "下班後完全沒電"],
  painText: "最近工作切換很多，晚上還會想著未完成事項，休息後仍覺得腦袋很滿。",
};

const app = document.querySelector("#app");

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function updateNested(group, key, value) {
  state[group][key] = value;
  state.error = "";
  render();
}

function toggleArray(key, value) {
  const list = state[key];
  state[key] = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  state.error = "";
  render();
}

function validateStep(step = state.step) {
  if (step === 0) {
    const { name, age, occupation, interview } = state.profile;
    if (!name.trim() || !age || !occupation.trim() || !interview) return "請先完成基本資料欄位。";
  }
  if (step === 1 && state.roles.length === 0) return "請至少勾選一個角色。";
  if (step === 2 && Object.keys(state.answers).length < 15) return "請完成全部 15 題測評。";
  if (step === 3 && state.pains.length === 0 && !state.painText.trim()) return "請至少選擇一個痛點，或填寫簡短描述。";
  return "";
}

function goStep(nextStep) {
  if (nextStep > state.step + 1) {
    setState({ error: "請依序完成前面的步驟。" });
    return;
  }
  if (nextStep > state.step) {
    const error = validateStep();
    if (error) {
      setState({ error });
      return;
    }
  }
  setState({ step: nextStep, error: "" });
}

function next() {
  const error = validateStep();
  if (error) {
    setState({ error });
    return;
  }
  setState({ step: Math.min(state.step + 1, steps.length - 1), error: "" });
}

function previous() {
  setState({ step: Math.max(state.step - 1, 0), error: "" });
}

function loadDemo() {
  state.started = true;
  state.step = 4;
  state.profile = { ...demoState.profile };
  state.roles = [...demoState.roles];
  state.answers = { ...demoState.answers };
  state.pains = [...demoState.pains];
  state.painText = demoState.painText;
  state.error = "";
  render();
}

function startFresh() {
  setState({ started: true, step: 0, error: "" });
}

function resetAll() {
  state.step = 0;
  state.started = false;
  state.profile = { name: "", age: "", occupation: "", interview: "" };
  state.roles = [];
  state.answers = {};
  state.pains = [];
  state.painText = "";
  state.error = "";
  render();
}

function scoreDimensions() {
  return dimensions.map((dimension) => {
    const values = dimension.questions.map((_, index) => Number(state.answers[`${dimension.key}-${index}`] || 0));
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return {
      ...dimension,
      score: Number(average.toFixed(1)),
      percent: Math.round((average / 5) * 100),
    };
  });
}

function makePrescription(scores) {
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  const low = sorted.slice(0, 2);
  const pains = state.pains;
  let type = "精力基礎調整型";

  if (scores.find((item) => item.key === "sleep").score <= 2.6 || pains.includes("睡再久還是沒精神")) {
    type = "恢復不足型";
  } else if (scores.find((item) => item.key === "stress").score <= 2.6 || pains.includes("壓力大")) {
    type = "壓力透支型";
  } else if (scores.find((item) => item.key === "focus").score <= 2.8 || pains.includes("注意力不集中")) {
    type = "專注失衡型";
  }

  const issueMap = {
    sleep: "恢復品質偏低，休息可能沒有真正補回能量。",
    focus: "專注容易被切碎，重要任務推進感不足。",
    emotion: "情緒緩衝空間較少，壓力來時較容易波動。",
    stress: "負荷偏高，需要先降低持續透支感。",
    body: "身體活力不足，白天能量續航需要補強。",
  };

  const adviceMap = {
    sleep: "固定一個睡前 30 分鐘降速儀式，先從關閉工作訊息開始。",
    focus: "每天安排 1 個 45 分鐘無通知專注區塊，只處理最重要任務。",
    emotion: "在壓力上升時做 3 分鐘呼吸或書寫，把腦中的待辦外部化。",
    stress: "把本週任務分成必做、可延後、可委派三類，先砍掉一個低價值承諾。",
    body: "每工作 90 分鐘做 3 分鐘走動或伸展，避免整天坐著硬撐。",
  };

  const problemSet = new Set(low.map((item) => issueMap[item.key]));
  pains.slice(0, 2).forEach((pain) => problemSet.add(`自述痛點明顯：${pain}。`));

  const advice = low.map((item) => adviceMap[item.key]);
  if (advice.length < 3) advice.push("每天用 1–5 分記錄睡眠、壓力、專注，觀察一週後再調整策略。");
  while (advice.length < 3) advice.push("先選一個最小改變做滿 7 天，比一次改很多更容易看到效果。");

  return {
    type,
    problems: [...problemSet].slice(0, 3),
    advice: advice.slice(0, 3),
    weeklyAction: `本週先做「${advice[0]}」並連續記錄 5 天感受。`,
  };
}

function renderHero() {
  return `
    <section class="hero">
      <div class="hero-main">
        <p class="eyebrow">ENERGY MANAGEMENT ASSESSMENT</p>
        <h1>精力管理問題測評系統</h1>
        <p class="lead">一個用於快速展示的互動 mock system。填寫基本資料、勾選角色、完成 15 題精力測評後，即可產生雷達圖與個人化精力管理處方籤。</p>
        <div class="hero-actions">
          <button class="btn primary" onclick="startFresh()">開始測評</button>
          <button class="btn" onclick="loadDemo()">載入 demo 結果</button>
        </div>
      </div>
      <aside class="hero-side">
        <div class="mini-card"><strong>5 步驟</strong><span>從基本資料到結果頁，完整展示填答流程。</span></div>
        <div class="mini-card"><strong>15 題</strong><span>以睡眠、專注、情緒、壓力、活力建立簡化量表。</span></div>
        <div class="mini-card"><strong>處方籤</strong><span>依分數與痛點產生類型、問題、建議與本週小行動。</span></div>
      </aside>
    </section>
  `;
}

function renderSteps() {
  return `
    <nav class="steps" aria-label="測評步驟">
      ${steps
        .map(
          (step, index) => `
            <button class="step-item ${index === state.step ? "active" : ""} ${index < state.step ? "done" : ""}" onclick="goStep(${index})">
              <span class="step-number">${index + 1}</span>
              <span>
                <span class="step-title">${step.title}</span>
                <span class="step-desc">${step.desc}</span>
              </span>
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderHeader(title, desc) {
  const percent = Math.round(((state.step + 1) / steps.length) * 100);
  return `
    <div class="section-head">
      <div>
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
      <div class="progress">
        Step ${state.step + 1} / ${steps.length}
        <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
      </div>
    </div>
  `;
}

function renderProfile() {
  const p = state.profile;
  return `
    ${renderHeader("Step 1：基本資料", "先建立受測者輪廓，讓結果頁看起來更像真實產品。")}
    <div class="field-grid">
      <div class="field">
        <label for="name">姓名或暱稱</label>
        <input id="name" value="${escapeHtml(p.name)}" placeholder="例如：林晨" oninput="state.profile.name = this.value; state.error = '';" />
      </div>
      <div class="field">
        <label for="age">年齡區間</label>
        <select id="age" onchange="updateNested('profile','age',this.value)">
          ${["", "18–24", "25–30", "31–40", "41–50", "51+"].map((item) => `<option value="${item}" ${p.age === item ? "selected" : ""}>${item || "請選擇"}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="occupation">職業 / 身分</label>
        <input id="occupation" value="${escapeHtml(p.occupation)}" placeholder="例如：專案經理、學生、自由工作者" oninput="state.profile.occupation = this.value; state.error = '';" />
      </div>
      <div class="field">
        <span class="label">是否願意接受訪談</span>
        <div class="option-grid">
          ${["是", "否"].map((item) => optionRadio("interview", item, p.interview === item, `updateNested('profile','interview','${item}')`)).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderRoles() {
  return `
    ${renderHeader("Step 2：角色勾選", "角色可以多選，用來展示系統如何理解不同生活情境。")}
    <div class="option-grid">
      ${roleOptions.map((role) => optionCheckbox("roles", role, state.roles.includes(role))).join("")}
    </div>
  `;
}

function optionCheckbox(key, label, checked) {
  return `
    <label class="option">
      <input type="checkbox" ${checked ? "checked" : ""} onchange="toggleArray('${key}','${label.replaceAll("'", "\\'")}')" />
      <span>${label}</span>
    </label>
  `;
}

function optionRadio(name, label, checked, handler) {
  return `
    <label class="option">
      <input type="radio" name="${name}" ${checked ? "checked" : ""} onchange="${handler}" />
      <span>${label}</span>
    </label>
  `;
}

function renderAssessment() {
  return `
    ${renderHeader("Step 3：精力管理測評", "請依最近兩週的狀態作答，1 代表非常不同意，5 代表非常同意。")}
    ${dimensions
      .map(
        (dimension) => `
          <section class="question-group">
            <h3>${dimension.label}</h3>
            ${dimension.questions
              .map((question, index) => {
                const key = `${dimension.key}-${index}`;
                return `
                  <div class="question">
                    <div>${question}</div>
                    <div>
                      <div class="scale">
                        ${[1, 2, 3, 4, 5]
                          .map(
                            (value) => `
                              <label>
                                <input type="radio" name="${key}" value="${value}" ${Number(state.answers[key]) === value ? "checked" : ""} onchange="state.answers['${key}']=${value}; state.error=''; render();" />
                                ${value}
                              </label>
                            `,
                          )
                          .join("")}
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </section>
        `,
      )
      .join("")}
    <div class="hint-row"><span>1 非常不同意</span><span>5 非常同意</span></div>
  `;
}

function renderPains() {
  return `
    ${renderHeader("Step 4：痛點描述", "用多選與文字補充目前最卡的地方，結果頁會納入處方籤判斷。")}
    <div class="field full">
      <span class="label">常見痛點</span>
      <div class="option-grid">
        ${painOptions.map((pain) => optionCheckbox("pains", pain, state.pains.includes(pain))).join("")}
      </div>
    </div>
    <div class="field full" style="margin-top:18px">
      <label for="painText">開放式描述</label>
      <textarea id="painText" placeholder="例如：每天會議很多，晚上很難真正休息，週末也覺得補不回來。" oninput="state.painText=this.value; state.error='';">${escapeHtml(state.painText)}</textarea>
    </div>
  `;
}

function renderResults() {
  const scores = scoreDimensions();
  const prescription = makePrescription(scores);
  const name = state.profile.name || "受測者";
  return `
    ${renderHeader("Step 5：結果頁", `${escapeHtml(name)} 的精力狀態摘要，包含雷達圖與精力管理處方籤。`)}
    <div class="results-grid">
      <section class="result-card">
        <h3>五維度雷達圖</h3>
        <div class="radar-wrap">${renderRadar(scores)}</div>
        <div class="score-list">
          ${scores
            .map(
              (item) => `
                <div class="score-row">
                  <span>${item.label}</span>
                  <div class="score-bar"><span style="width:${item.percent}%"></span></div>
                  <strong>${item.score}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>
      <section class="result-card prescription">
        <div>
          <span class="type-badge">${prescription.type}</span>
          <h3>精力管理處方籤</h3>
          <p class="subtle">依照目前分數與自述痛點，這份 demo 會先抓出最需要處理的 2–3 個問題，再給出一週內可執行的微調方向。</p>
        </div>
        <div class="prescription-block">
          <h3>主要問題</h3>
          <ul>${prescription.problems.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
        <div class="prescription-block">
          <h3>改善建議</h3>
          <ul>${prescription.advice.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
        <div class="action-callout">
          <h3>本週小行動</h3>
          <p>${prescription.weeklyAction}</p>
        </div>
      </section>
    </div>
  `;
}

function renderRadar(scores) {
  const size = 320;
  const center = size / 2;
  const radius = 108;
  const pointsFor = (scale) =>
    scores
      .map((score, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
        const r = radius * scale * (score.score / 5);
        return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
      })
      .join(" ");
  const ring = (scale) =>
    scores
      .map((_, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
        const r = radius * scale;
        return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
      })
      .join(" ");
  const axes = scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const lx = center + Math.cos(angle) * (radius + 28);
      const ly = center + Math.sin(angle) * (radius + 28);
      return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="var(--line)" /><text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="var(--muted)" font-size="13" font-weight="700">${score.label}</text>`;
    })
    .join("");

  return `
    <svg width="100%" height="340" viewBox="0 0 ${size} ${size + 20}" role="img" aria-label="精力管理雷達圖">
      ${[0.25, 0.5, 0.75, 1].map((scale) => `<polygon points="${ring(scale)}" fill="none" stroke="var(--line)" />`).join("")}
      ${axes}
      <polygon points="${pointsFor(1)}" fill="color-mix(in srgb, var(--primary) 32%, transparent)" stroke="var(--primary)" stroke-width="3" />
      ${scores
        .map((score, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
          const r = radius * (score.score / 5);
          return `<circle cx="${center + Math.cos(angle) * r}" cy="${center + Math.sin(angle) * r}" r="4.5" fill="var(--accent)" />`;
        })
        .join("")}
    </svg>
  `;
}

function renderCurrentStep() {
  const views = [renderProfile, renderRoles, renderAssessment, renderPains, renderResults];
  return views[state.step]();
}

function renderActions() {
  return `
    <div class="form-actions">
      <button class="btn ghost" onclick="previous()" ${state.step === 0 ? "disabled" : ""}>上一步</button>
      ${
        state.step < steps.length - 1
          ? `<button class="btn primary" onclick="next()">下一步</button>`
          : `<button class="btn primary" onclick="loadDemo()">重載 demo 結果</button>`
      }
      <button class="btn" onclick="resetAll()">回到起始畫面</button>
    </div>
    ${state.error ? `<p class="error">${state.error}</p>` : ""}
  `;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  if (!state.started) {
    app.innerHTML = renderHero();
    return;
  }

  app.innerHTML = `
    <section class="layout">
      ${renderSteps()}
      <div class="panel">
        ${renderCurrentStep()}
        ${renderActions()}
      </div>
    </section>
  `;
}

render();
