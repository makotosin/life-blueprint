const screens = {
  start: document.getElementById("start-screen"),
  question: document.getElementById("question-screen"),
  result: document.getElementById("result-screen"),
  report: document.getElementById("report-screen")
};

const state = {
  current: 0,
  answers: [],
  scores: { seeker: 0, creator: 0, adventurer: 0, connector: 0, balancer: 0 }
};

const startButton = document.getElementById("start-button");
const backButton = document.getElementById("back-button");
const restartButton = document.getElementById("restart-button");
const showReportButton = document.getElementById("show-report-button");
const printReportButton = document.getElementById("print-report-button");
const backToResultButton = document.getElementById("back-to-result-button");

let latestResultData = null;
let latestTypeKey = null;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetState() {
  state.current = 0;
  state.answers = [];
  Object.keys(state.scores).forEach(key => state.scores[key] = 0);
}

function renderQuestion() {
  const question = QUESTIONS[state.current];
  document.getElementById("question-count").textContent = `${state.current + 1} / ${QUESTIONS.length}`;
  document.getElementById("progress-bar").style.width = `${((state.current + 1) / QUESTIONS.length) * 100}%`;
  document.getElementById("question-category").textContent = question.category;
  document.getElementById("question-text").textContent = question.text;

  const list = document.getElementById("answer-list");
  list.innerHTML = "";

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = answer.text;
    button.addEventListener("click", () => chooseAnswer(index));
    list.appendChild(button);
  });

  backButton.style.visibility = state.current === 0 ? "hidden" : "visible";
}

function chooseAnswer(index) {
  const answer = QUESTIONS[state.current].answers[index];
  state.answers[state.current] = index;
  Object.entries(answer.scores).forEach(([key, value]) => state.scores[key] += value);

  if (state.current < QUESTIONS.length - 1) {
    state.current += 1;
    renderQuestion();
  } else {
    renderResult();
  }
}

function goBack() {
  if (state.current === 0) return;
  const previousIndex = state.current - 1;
  const chosenIndex = state.answers[previousIndex];
  if (chosenIndex !== undefined) {
    const previousAnswer = QUESTIONS[previousIndex].answers[chosenIndex];
    Object.entries(previousAnswer.scores).forEach(([key, value]) => state.scores[key] -= value);
    state.answers.splice(previousIndex);
  }
  state.current = previousIndex;
  renderQuestion();
}

function topType() {
  return Object.entries(state.scores).sort((a, b) => b[1] - a[1])[0][0];
}

function makeDimensionScores() {
  const s = state.scores;
  const max = 21;
  const clamp = value => Math.max(20, Math.min(96, Math.round((value / max) * 100 + 30)));

  return {
    health: clamp(s.balancer * 1.8 + s.adventurer * 0.4),
    creativity: clamp(s.creator * 1.8 + s.seeker * 0.8),
    finance: clamp(s.balancer * 1.4 + s.seeker * 0.4),
    adventure: clamp(s.adventurer * 1.8 + s.connector * 0.4),
    connection: clamp(s.connector * 1.8 + s.balancer * 0.3)
  };
}

function buildResultData(typeKey, dimensions) {
  const type = TYPES[typeKey];
  return {
    version: "0.1",
    type: type.name,
    type_key: typeKey,
    health: dimensions.health,
    creativity: dimensions.creativity,
    finance: dimensions.finance,
    adventure: dimensions.adventure,
    connection: dimensions.connection,
    first_action: type.action,
    raw_scores: state.scores
  };
}

function renderResult() {
  const typeKey = topType();
  const type = TYPES[typeKey];
  const dimensions = makeDimensionScores();
  const resultData = buildResultData(typeKey, dimensions);
  latestResultData = resultData;
  latestTypeKey = typeKey;

  document.getElementById("result-icon").textContent = type.icon;
  document.getElementById("result-name").textContent = type.name;
  document.getElementById("result-catch").textContent = type.catch;
  document.getElementById("result-description").textContent = type.description;
  document.getElementById("result-strength").textContent = type.strength;
  document.getElementById("result-point").textContent = type.point;
  document.getElementById("result-action").textContent = type.action;
  document.getElementById("result-json").textContent = JSON.stringify(resultData, null, 2);

  const bars = document.getElementById("score-bars");
  bars.innerHTML = "";
  Object.entries(dimensions).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <div class="score-label"><span>${DIMENSIONS[key]}</span><strong>${value}</strong></div>
      <div class="score-track"><div class="score-fill" style="width:${value}%"></div></div>
    `;
    bars.appendChild(row);
  });

  const prompt = `以下の診断結果をもとに、人生再点火設計図を作成してください。\n\n${JSON.stringify(resultData, null, 2)}`;
  document.getElementById("copy-json").onclick = () => copyText(JSON.stringify(resultData, null, 2), "JSONをコピーしました");
  document.getElementById("copy-prompt").onclick = () => copyText(prompt, "GPT用文章をコピーしました");

  showScreen("result");
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById("copy-message").textContent = message;
  } catch {
    document.getElementById("copy-message").textContent = "コピーできませんでした。手動で選択してください。";
  }
}

startButton.addEventListener("click", () => {
  resetState();
  renderQuestion();
  showScreen("question");
});

backButton.addEventListener("click", goBack);

restartButton.addEventListener("click", () => {
  resetState();
  showScreen("start");
});




const REPORT_COPY = {
  seeker: {
    compass: "《深窓の羅針盤》",
    compassMessage: "知ること、考えること、言葉にすることが、次の扉を開きます。",
    health: "頭をよく使うタイプだからこそ、歩く・伸ばす・休むを意識して、思考を支える身体を整えます。",
    creativity: "調べたことを自分の言葉でまとめる力が強みです。短い文章や記録へ変えて残しましょう。",
    adventure: "大きな旅より、博物館・古書店・知らない道など、知的好奇心が動く小さな外出が向いています。",
    future: "学びと発信が自然につながり、自分だけのテーマを持って活動している姿が見えてきます。"
  },
  creator: {
    compass: "《灯火の羅針盤》",
    compassMessage: "作るほど、自分の輪郭が戻ってきます。",
    health: "創作を続けるために、目・肩・腰を休ませ、短い運動を生活の中へ組み込みます。",
    creativity: "最も強い領域です。完成度より回数を大切にして、毎週ひとつ小さな作品を残しましょう。",
    adventure: "新しい景色や会話を、創作の材料として受け取る外出が向いています。",
    future: "作品づくりが習慣になり、自分の表現を待つ人が少しずつ増えている状態を目指します。"
  },
  adventurer: {
    compass: "《蒼風の羅針盤》",
    compassMessage: "好奇心・表現・発見を道標に、まだ見ぬ景色へ進みます。",
    health: "好きな場所へ出かけ続けられるよう、脚力・睡眠・回復の土台を整えます。",
    creativity: "体験を文章・写真・音楽・企画へ変える力が非常に高いタイプです。",
    adventure: "日常に小さな未知を増やすことが再点火の中心です。大きな旅を待たず、半日以内の冒険を重ねます。",
    future: "新しい町を歩き、その体験を作品として残すことが自然な習慣になっています。"
  },
  connector: {
    compass: "《縁結びの羅針盤》",
    compassMessage: "人との時間が、あなたの力と未来を育てます。",
    health: "一人で頑張りすぎず、誰かと歩く・話す・楽しむ時間を健康習慣に変えます。",
    creativity: "人の話を聞き、場をつくり、共感を言葉にする力が強みです。",
    adventure: "誰かと一緒に初めての場所へ行くことで、行動の楽しさが大きくなります。",
    future: "信頼できる人との予定が増え、自分の楽しみも自然に共有できている状態を目指します。"
  },
  balancer: {
    compass: "《整流の羅針盤》",
    compassMessage: "整えることは、止まることではなく、前へ進む準備です。",
    health: "睡眠・食事・運動のうち、最も負担が少ない一つから整えます。",
    creativity: "生活の余白を作ることで、学びや表現へ使える時間が生まれます。",
    adventure: "無理のない予算と日程で、近場の楽しみを定期的に入れることが向いています。",
    future: "健康・時間・お金の土台が整い、安心して好きなことへ取り組める状態を目指します。"
  }
};

function weakestDimension(resultData) {
  const entries = [
    ["健康", resultData.health],
    ["創造・学び", resultData.creativity],
    ["お金", resultData.finance],
    ["遊び・冒険", resultData.adventure],
    ["つながり", resultData.connection]
  ];
  return entries.sort((a, b) => a[1] - b[1])[0];
}

function warningText(label) {
  const messages = {
    "健康": "動き続けるための土台を整える必要があります。睡眠・軽い運動・休養のうち、一つだけ改善します。",
    "創造・学び": "体験や知識を形にする機会が不足しています。短い記録や小作品から始めます。",
    "お金": "好きな体験を長く続けるため、使える予算を先に確保する仕組みを作ります。",
    "遊び・冒険": "日常に新しい刺激が少なくなっています。近場の未知を一つ増やします。",
    "つながり": "一人で完結しやすい状態です。体験や近況を一人だけに共有するところから始めます。"
  };
  return messages[label];
}

function renderReport() {
  if (!latestResultData || !latestTypeKey) return;

  const data = latestResultData;
  const type = TYPES[latestTypeKey];
  const copy = REPORT_COPY[latestTypeKey];
  const weakest = weakestDimension(data);

  document.getElementById("report-number").textContent =
    `LRR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  document.getElementById("report-type").textContent = type.name;
  document.getElementById("report-catch").textContent = type.catch;
  document.getElementById("report-description").textContent = type.description;
  document.getElementById("report-compass-name").textContent = copy.compass;
  document.getElementById("report-compass-message").textContent = copy.compassMessage;
  document.getElementById("report-health").textContent = copy.health;
  document.getElementById("report-creativity").textContent = copy.creativity;
  document.getElementById("report-adventure").textContent = copy.adventure;
  document.getElementById("report-warning-title").textContent = `要調整ポイント：${weakest[0]}`;
  document.getElementById("report-warning").textContent = warningText(weakest[0]);
  document.getElementById("report-first-action").textContent = data.first_action;
  document.getElementById("report-future").textContent = copy.future;

  const reportBars = document.getElementById("report-score-bars");
  reportBars.innerHTML = "";
  const dimensions = {
    health: data.health,
    creativity: data.creativity,
    finance: data.finance,
    adventure: data.adventure,
    connection: data.connection
  };

  Object.entries(dimensions).forEach(([key, value]) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <div class="score-label"><span>${DIMENSIONS[key]}</span><strong>${value}</strong></div>
      <div class="score-track"><div class="score-fill" style="width:${value}%"></div></div>
    `;
    reportBars.appendChild(row);
  });

  showScreen("report");
}

showReportButton.addEventListener("click", renderReport);
printReportButton.addEventListener("click", () => window.print());
backToResultButton.addEventListener("click", () => showScreen("result"));
