const QUESTIONS = [
  {
    category: "現在地",
    text: "予定のない休日、いちばん心が動くのは？",
    answers: [
      { text: "静かな場所で本や映像を楽しむ", scores: { seeker: 3, creator: 1 } },
      { text: "知らない町や店へ出かける", scores: { adventurer: 3, connector: 1 } },
      { text: "家族や友人とゆっくり過ごす", scores: { connector: 3, balancer: 1 } },
      { text: "何かを作る、書く、演奏する", scores: { creator: 3, seeker: 1 } }
    ]
  },
  {
    category: "再点火",
    text: "最近、少し足りないと感じるものは？",
    answers: [
      { text: "新しい刺激やワクワク", scores: { adventurer: 3 } },
      { text: "自分だけの時間", scores: { balancer: 3, seeker: 1 } },
      { text: "誰かとのつながり", scores: { connector: 3 } },
      { text: "表現する機会", scores: { creator: 3 } }
    ]
  },
  {
    category: "行動",
    text: "何かを始めるとき、自然に選ぶ方法は？",
    answers: [
      { text: "まず調べて理解してから動く", scores: { seeker: 3 } },
      { text: "小さく試しながら形にする", scores: { creator: 2, balancer: 1 } },
      { text: "誰かを誘って一緒に始める", scores: { connector: 3 } },
      { text: "考えるより先に現地へ行く", scores: { adventurer: 3 } }
    ]
  },
  {
    category: "人生の資源",
    text: "今後、もっと増やしたいものは？",
    answers: [
      { text: "知識や技術", scores: { seeker: 2, creator: 1 } },
      { text: "思い出や体験", scores: { adventurer: 2, connector: 1 } },
      { text: "健康と安定", scores: { balancer: 3 } },
      { text: "作品や実績", scores: { creator: 3 } }
    ]
  },
  {
    category: "心の反応",
    text: "人を見て羨ましいと感じやすいのは？",
    answers: [
      { text: "好きなことを仕事や作品にした人", scores: { creator: 3 } },
      { text: "自由に世界を歩いている人", scores: { adventurer: 3 } },
      { text: "穏やかな暮らしを築いた人", scores: { balancer: 3 } },
      { text: "信頼できる仲間に囲まれた人", scores: { connector: 3 } }
    ]
  },
  {
    category: "未来像",
    text: "3年後、いちばん嬉しい変化は？",
    answers: [
      { text: "新しい分野に詳しくなっている", scores: { seeker: 3 } },
      { text: "自分の作品や活動が続いている", scores: { creator: 3 } },
      { text: "健康で、無理のない生活ができている", scores: { balancer: 3 } },
      { text: "行きたい場所へ何度も旅している", scores: { adventurer: 3 } }
    ]
  },
  {
    category: "最初の一歩",
    text: "今週ひとつだけ選ぶなら？",
    answers: [
      { text: "気になっていた本を開く", scores: { seeker: 3 } },
      { text: "小さな作品をひとつ作る", scores: { creator: 3 } },
      { text: "近場の初めての場所へ行く", scores: { adventurer: 3 } },
      { text: "大切な人と予定をひとつ決める", scores: { connector: 3, balancer: 1 } }
    ]
  }
];

const TYPES = {
  seeker: {
    name: "静かな探究者",
    icon: "📚",
    catch: "深く知ることが、あなたの火を灯す。",
    description: "あなたは、派手な刺激よりも「分かった」「つながった」という瞬間に喜びを感じるタイプです。",
    strength: "一つのテーマを丁寧に掘り下げ、自分なりの意味を見つけられること。",
    point: "知識を集めるだけで終わらせず、小さく外へ表現すると再点火が進みます。",
    action: "今週、気になるテーマを一つ決め、30分だけ調べて短いメモを残す。"
  },
  creator: {
    name: "火を育てる創作者",
    icon: "✍️",
    catch: "作るほど、自分の輪郭が戻ってくる。",
    description: "あなたは、考えや感情を形にしたときに生き生きするタイプです。",
    strength: "曖昧な気持ちを、文章・音・絵・企画などの形へ変えられること。",
    point: "完成度より回数を大切にすると、創作の火が安定して育ちます。",
    action: "今週、15分で終わる小さな作品を一つ完成させる。"
  },
  adventurer: {
    name: "風を追う冒険者",
    icon: "🧭",
    catch: "初めての景色が、人生を動かす。",
    description: "あなたは、未知の場所や新しい経験からエネルギーを受け取るタイプです。",
    strength: "変化を恐れすぎず、体験から学べること。",
    point: "大きな旅を待たず、日常に小さな冒険を差し込むと再点火します。",
    action: "今週、行ったことのない店・道・公園のどれかを一つ訪れる。"
  },
  connector: {
    name: "縁を結ぶ伴走者",
    icon: "🤝",
    catch: "誰かとの時間が、あなたの力になる。",
    description: "あなたは、人との信頼や共感から人生の手応えを得るタイプです。",
    strength: "相手を見ながら場を温め、関係を長く育てられること。",
    point: "人に合わせるだけでなく、自分の楽しみも共有することが再点火の鍵です。",
    action: "今週、大切な人へ一通だけ近況や誘いの連絡をする。"
  },
  balancer: {
    name: "暮らしを整える設計者",
    icon: "⚙️",
    catch: "整えることは、前へ進むこと。",
    description: "あなたは、健康・時間・お金の土台が整うほど力を発揮するタイプです。",
    strength: "無理なく続く形を考え、生活を少しずつ改善できること。",
    point: "完璧な計画ではなく、一つの負担を減らす設計が再点火につながります。",
    action: "今週、やめること・減らすことを一つだけ決める。"
  }
};

const DIMENSIONS = {
  health: "健康",
  creativity: "創造・学び",
  finance: "お金",
  adventure: "遊び・冒険",
  connection: "つながり"
};
