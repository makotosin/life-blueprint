const QUESTIONS = [
{id:"nickname",section:"基本情報",title:"① 愛称を教えてください",type:"text",maxLength:20,required:true},
{id:"age",section:"基本情報",title:"② 年齢を選んでください",type:"choice",choices:["20代以下","30代","40代","50代","60代","70代以上"]},
{id:"gender",section:"基本情報",title:"③ 性別を選んでください",type:"choice",choices:["男性","女性","その他","回答しない"]},
{id:"appearance",section:"基本情報",title:"④ 外見イメージに近いものは？",type:"choice",choices:["落ち着いた人","親しみやすい人","若々しい人","個性的な人","少し疲れた人","特に決めない"]},
{id:"catchcopy",section:"基本情報",title:"⑤ 今の自分につけるキャッチコピーは？",type:"choice",choices:["静かに燃える人","週末から本気を出す人","まだ旅の途中","家族第一の人","何か始めたい人"]},
{id:"fun",section:"現在地",title:"⑥ 現在、一番楽しいことは？",type:"choice",choices:["家族との時間","外食・お酒","旅行・散歩","スポーツ","映画・ドラマ","読書・学び","創作・発信","特にない"]},
{id:"problem",section:"現在地",title:"⑦ 現在、一番困っていることは？",type:"choice",choices:["健康","お金","時間不足","仕事","家族・人間関係","将来への不安","退屈・生きがい不足","特にない"]},
{id:"health",section:"現在地",title:"⑧ 健康状態に最も近いものは？",type:"choice",choices:["かなり元気","おおむね元気","少し気になる","体力が落ちた","生活改善が必要","治療や通院を優先している"]},
{id:"money",section:"現在地",title:"⑨ お金の状態に最も近いものは？",type:"choice",choices:["余裕がある","普通に生活できる","少し節約が必要","貯金を増やしたい","収入源を増やしたい","かなり不安がある"]},
{id:"time",section:"現在地",title:"⑩ 時間について改善したいことは？",type:"choice",choices:["自分の時間を増やす","家族の時間を増やす","学ぶ時間を作る","趣味の時間を作る","休む時間を増やす","今のままでよい"]},
{id:"hobby",section:"人生再点火",title:"⑪ 趣味・遊びで最も近いものは？",type:"choice",choices:["旅行・散歩","スポーツ","釣り・アウトドア","映画・ドラマ","食・お酒","ゲーム","音楽","まだ見つかっていない"]},
{id:"learning",section:"人生再点火",title:"⑫ 創作・学びで最も近いものは？",type:"choice",choices:["読書","資格・勉強","文章・小説","音楽","絵・写真","AI・デジタル","特にないが始めたい","特に興味はない"]},
{id:"future",section:"人生再点火",title:"⑬ 3年後、最も近づきたい姿は？",type:"choice",choices:["健康で活動的","家族と安定した生活","好きなことを続けている","収入や貯金が増えている","新しい仕事や役割がある","旅や体験が増えている","作品や成果を残している"]},
{id:"quote",section:"人生再点火",title:"⑭ 大切にしている言葉に近いものは？",type:"choice",choices:["継続は力なり","人生は一度きり","家族がいちばん","無理をしない","挑戦に年齢はない","なんとかなる"]},
{id:"world",section:"人生再点火",title:"⑮ 結果の世界観はどちらが好み？",type:"choice",choices:["設計図モード","RPGモード"]},
{id:"priority",section:"人生再点火",title:"⑯ 一番大切にしたいものは？",type:"choice",choices:["健康","家族","仲間","自由","挑戦","安心","創作","お金"]},
{id:"no_limits",section:"深層インタビュー",title:"⑰ 制約がなければ、本当は何をしてみたい？",type:"choice",choices:["世界を旅する","好きな仕事だけする","作品を発表する","学び直す","家族とゆっくり暮らす","新しい仲間を作る","何もしないで休む","まだ分からない"]},
{id:"emotion",section:"深層インタビュー",title:"⑱ もう一度、強く味わいたい感情は？",type:"choice",choices:["ワクワク","達成感","安心","恋愛","自由","没頭","誇らしさ","挑戦する高揚感"]},
{id:"envy",section:"深層インタビュー",title:"⑲ 少し羨ましい人物に近いのは？",type:"choice",choices:["自由に旅する人","創作で成功した人","家族に恵まれた人","健康で若々しい人","経済的に余裕のある人","専門性を持つ人","仲間の多い人","特にいない"]},
{id:"destiny_card",section:"羅針盤カード",title:"⑳ 未来の自分へ贈る言葉",help:"自由入力・99文字以内。空欄でも構いません。",type:"textarea",maxLength:99,required:false}
];
const DIMENSION_LABELS={health:"健康",creativity:"創造・学び",finance:"お金",adventure:"遊び・冒険",connection:"つながり",balance:"安定・生活"};
