const screens=[...document.querySelectorAll('.screen')];
const modes={one:{label:'今日の一枚',count:1,positions:['今日の兆し']},answer:{label:'迷いへの答え',count:1,positions:['問いへの答え']},three:{label:'過去・現在・未来',count:3,positions:['過去','現在','未来']},reignite:{label:'人生再点火の兆し',count:1,positions:['再点火の火種']}};
let state={mode:'one',question:'',selected:[],pool:[],visual:null};
const VISUAL_THEMES=[
  {name:'moon',body:'theme-moon',effect:'fx-mist',filter:'tone-moon'},
  {name:'blood',body:'theme-blood',effect:'fx-embers',filter:'tone-blood'},
  {name:'emerald',body:'theme-emerald',effect:'fx-runes',filter:'tone-emerald'},
  {name:'gold',body:'theme-gold',effect:'fx-stars',filter:'tone-gold'},
  {name:'violet',body:'theme-violet',effect:'fx-arcane',filter:'tone-violet'}
];
const CARD_MOODS={
  '15':'blood','16':'blood','13':'blood','18':'moon','17':'moon','02':'moon',
  '01':'violet','10':'violet','20':'gold','19':'gold','21':'gold','14':'emerald','03':'emerald'
};
function chooseVisual(card){
  const preferred=CARD_MOODS[String(card?.n).padStart(2,'0')];
  let pool=preferred?VISUAL_THEMES.filter(v=>v.name===preferred).concat(VISUAL_THEMES):[...VISUAL_THEMES];
  if(state.visual?.name&&pool.length>1)pool=pool.filter(v=>v.name!==state.visual.name);
  const visual=pool[Math.floor(Math.random()*pool.length)];
  state.visual={...visual,glow:['glow-soft','glow-deep','glow-pulse'][Math.floor(Math.random()*3)],motion:['motion-float','motion-sway','motion-breathe'][Math.floor(Math.random()*3)]};
  applyVisual();
}
function applyVisual(){
  document.body.classList.remove(...VISUAL_THEMES.map(v=>v.body),...VISUAL_THEMES.map(v=>v.effect));
  if(!state.visual)return;
  document.body.classList.add(state.visual.body,state.visual.effect);
  document.documentElement.style.setProperty('--current-mood',`"${state.visual.name}"`);
  spawnParticles(state.visual.name);
}
function spawnParticles(theme){
  const host=document.querySelector('#particles'); if(!host)return;
  host.innerHTML='';
  const count=innerWidth<700?16:30;
  for(let i=0;i<count;i++){
    const p=document.createElement('i');
    p.style.setProperty('--x',`${Math.random()*100}%`);
    p.style.setProperty('--y',`${Math.random()*100}%`);
    p.style.setProperty('--s',`${Math.random()*5+2}px`);
    p.style.setProperty('--d',`${Math.random()*8+7}s`);
    p.style.setProperty('--delay',`${-Math.random()*12}s`);
    p.className=`particle particle-${theme}`;
    host.appendChild(p);
  }
}


// Effects v4.0: card-specific visual direction
function cardFxClass(card){
  const n=Number(card?.n);
  if([18,2].includes(n)) return 'fx-card-moon';
  if([15,13].includes(n)) return 'fx-card-blood';
  if(n===16) return 'fx-card-tower';
  if([17,19,20,21].includes(n)) return 'fx-card-stars';
  if([1,10].includes(n)) return 'fx-card-arcane';
  if([3,14].includes(n)) return 'fx-card-nature';
  return ['fx-card-moon','fx-card-blood','fx-card-stars','fx-card-arcane','fx-card-nature'][Math.floor(Math.random()*5)];
}
function specialFxMarkup(){return '<div class="card-special-fx" aria-hidden="true"></div>'}

const $=s=>document.querySelector(s);
const DAILY_READING_KEY='reigniteTarotDailyReadingV1';
const TEST_MODE=new URLSearchParams(location.search).get('test')==='1';

function localDayKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function getDailyReadingState(){
  const today=localDayKey();
  try{
    const saved=JSON.parse(localStorage.getItem(DAILY_READING_KEY)||'{}');
    if(saved.date!==today)return {date:today,count:0};
    return {date:today,count:Number(saved.count)||0};
  }catch(_){return {date:today,count:0}}
}
function setDailyReadingCount(count){
  try{localStorage.setItem(DAILY_READING_KEY,JSON.stringify({date:localDayKey(),count}))}catch(_){}
}
function registerReadingAttempt(){
  const daily=getDailyReadingState();
  const next=daily.count+1;
  setDailyReadingCount(next);
  return next;
}
function startActualReading(){
  state.question=$('#question-input').value.trim();
  prepareDeck();
  go('draw');
}
function handleDailyReadingGate(){
  if(TEST_MODE){
    startActualReading();
    return;
  }
  const daily=getDailyReadingState();
  if(daily.count===0){
    registerReadingAttempt();
    startActualReading();
    return;
  }
  if(daily.count===1){
    state.question=$('#question-input').value.trim();
    document.body.classList.add('daily-omen');
    go('daily-warning');
    return;
  }
  if(daily.count===2){
    registerReadingAttempt();
    document.body.classList.add('daily-omen','daily-silence');
    go('daily-silence');
    return;
  }
  document.body.classList.add('daily-omen','daily-closed');
  go('daily-closed');
}
function go(id){screens.forEach(s=>s.classList.toggle('active',s.id===id));scrollTo({top:0,behavior:'smooth'});} 
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;$('#mode-label').textContent=modes[state.mode].label.toUpperCase();go('question')});
$('#question-input').addEventListener('input',e=>$('#count').textContent=e.target.value.length);
$('#begin-reading').onclick=handleDailyReadingGate;
$('#warning-continue').onclick=()=>{
  registerReadingAttempt();
  document.body.classList.remove('daily-omen');
  startActualReading();
};
$('#warning-stop').onclick=()=>{
  document.body.classList.remove('daily-omen');
  go('home');
};
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function prepareDeck(){state.selected=[];state.visual={...VISUAL_THEMES[Math.floor(Math.random()*VISUAL_THEMES.length)],glow:'glow-soft',motion:'motion-sway'};applyVisual();state.pool=shuffle(TAROT_CARDS);const deck=$('#deck');deck.innerHTML='';const shown=state.pool.slice(0,13);shown.forEach((card,i)=>{const btn=document.createElement('button');btn.className='deck-card';btn.style.setProperty('--rot',`${(i-6)*2.1}deg`);btn.style.setProperty('--lift',`${Math.abs(i-6)*2}px`);btn.setAttribute('aria-label',`${i+1}枚目のカード`);btn.innerHTML='<img src="images/card-back.svg" alt="カードの裏面">';btn.onclick=()=>pick(card,btn);deck.appendChild(btn)});$('#draw-help').textContent=modes[state.mode].count===1?'直感で一枚選びます':'直感で三枚選びます';updateStatus()}
function pick(card,btn){if(state.selected.length>=modes[state.mode].count)return;state.selected.push({...card,reversed:Math.random()<.35});btn.classList.add('picked');updateStatus();if(state.selected.length===modes[state.mode].count)setTimeout(reveal,500)}
function updateStatus(){const n=modes[state.mode].count;$('#selection-status').textContent=`${state.selected.length} / ${n} 枚を選択`}
function reveal(){chooseVisual(state.selected[0]);document.body.classList.add('v4-reading','v4-dim');setTimeout(()=>document.body.classList.remove('v4-dim'),1300);const wrap=$('#revealed-cards');wrap.innerHTML='';state.selected.forEach((c,i)=>{const el=document.createElement('div');el.className=`flip-card ${state.visual.glow} ${state.visual.motion} ${state.visual.filter} ${cardFxClass(c)}`;el.style.setProperty('--delay',`${i*.55}s`);el.innerHTML=`${specialFxMarkup()}<div class="card-aura"></div><div class="flip-inner"><div class="flip-face"><img src="images/card-back.svg" alt="カードの裏面"></div><div class="flip-face flip-front ${c.reversed?'reversed':''}"><img src="images/${String(c.n).padStart(2,'0')}-${c.slug}.png" alt="${c.jp}"></div></div><div class="card-caption">${modes[state.mode].positions[i]}</div>`;wrap.appendChild(el);setTimeout(()=>{el.classList.add('open','summoned');document.body.classList.add('reveal-flash','screen-rumble');setTimeout(()=>document.body.classList.remove('reveal-flash','screen-rumble'),1050)},220+i*520)});go('reveal')}
$('#show-result').onclick=()=>{renderResult();go('result')};
function orientation(c){return c.reversed?'逆位置':'正位置'}
function key(c){return c.reversed?c.reverse:c.upright}
function mainMessage(c){return c.reversed?c.shadow:c.message}
let resultCarouselTimer=null;
function cardImagePath(c){return `images/${String(c.n).padStart(2,'0')}-${c.slug}.png`}
function cardArt(c,extra=''){return `<div class="result-card-frame ${extra} ${state.visual?.glow||''} ${state.visual?.filter||''} ${cardFxClass(c)}">${specialFxMarkup()}<div class="card-aura"></div><img class="${c.reversed?'reversed':''}" src="${cardImagePath(c)}" alt="${c.jp}" loading="eager"></div>`}
function openCardLightbox(c){
  let box=document.querySelector('.card-lightbox');
  if(!box){box=document.createElement('div');box.className='card-lightbox';box.innerHTML='<button class="lightbox-close" aria-label="閉じる">×</button><div class="lightbox-stage"></div>';document.body.appendChild(box);box.onclick=e=>{if(e.target===box||e.target.closest('.lightbox-close'))box.classList.remove('show')}}
  box.querySelector('.lightbox-stage').innerHTML=`<img class="${c.reversed?'reversed':''}" src="${cardImagePath(c)}" alt="${c.jp}">`;
  box.classList.add('show');
}
function setupResultArtClicks(){
  const btn=document.querySelector('.v53-single .art-button');
  const hit=document.querySelector('.v53-single .single-card-hitarea');
  if(!btn||!hit)return;
  const open=e=>{e.preventDefault();e.stopPropagation();openCardLightbox(state.selected[0])};
  hit.addEventListener('pointerup',open);
  hit.addEventListener('click',open);
  btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){open(e)}});
}

function setupThreeCarousel(){
  if(resultCarouselTimer)clearInterval(resultCarouselTimer);
  const stage=document.querySelector('.three-carousel'); if(!stage)return;
  const slides=[...stage.querySelectorAll('.carousel-card')], dots=[...stage.querySelectorAll('.carousel-dot')];
  let active=0;
  const show=i=>{active=(i+slides.length)%slides.length;slides.forEach((el,n)=>{const d=n-active;el.classList.toggle('active',n===active);el.classList.toggle('prev',d===-1||d===slides.length-1);el.classList.toggle('next',d===1||d===-(slides.length-1));el.setAttribute('aria-hidden',n===active?'false':'true')});dots.forEach((d,n)=>d.classList.toggle('active',n===active));const c=state.selected[active];document.querySelector('.carousel-reading').innerHTML=`<h3>${modes[state.mode].positions[active]}：${c.jp}</h3><div class="orientation">${c.en}・${orientation(c)}</div><p><b>${key(c)}</b></p><p>${mainMessage(c)}</p>`}
  const restart=()=>{clearInterval(resultCarouselTimer);resultCarouselTimer=setInterval(()=>show(active+1),5200)};
  stage.querySelector('.carousel-prev').onclick=()=>{show(active-1);restart()};stage.querySelector('.carousel-next').onclick=()=>{show(active+1);restart()};dots.forEach((d,n)=>d.onclick=()=>{show(n);restart()});slides.forEach((el,n)=>el.onclick=()=>{if(n===active)openCardLightbox(state.selected[n]);else{show(n);restart()}});show(0);restart();
}
function renderResult(){
  if(resultCarouselTimer){clearInterval(resultCarouselTimer);resultCarouselTimer=null}
  const q=$('#question-echo');q.textContent=state.question?`「${state.question}」`:'心に浮かべた問いに対して';const body=$('#result-body');
  if(state.selected.length===1){const c=state.selected[0];body.innerHTML=`<div class="v53-single"><button type="button" class="art-button" data-card-index="0" aria-label="カードを拡大表示">${cardArt(c,'result-art-large')}<span class="single-card-hitarea" aria-hidden="true"></span></button><div class="single-summary"><h3>${c.jp}</h3><div class="orientation">${c.en}・${orientation(c)}</div><p><b>${key(c)}</b></p><p>${mainMessage(c)}</p></div></div><div class="reading-block"><h4>今のあなたへ</h4><p>${interpret(c)}</p></div><div class="reading-block"><h4>今日からできる小さな行動</h4><p>${c.action}</p></div>`;setupResultArtClicks()}
  else{body.innerHTML=`<div class="three-carousel" aria-label="過去・現在・未来のカード"><button class="carousel-nav carousel-prev" aria-label="前のカード">‹</button><div class="carousel-stage">${state.selected.map((c,i)=>`<button class="carousel-card" data-index="${i}" aria-label="${modes[state.mode].positions[i]} ${c.jp}">${cardArt(c,'carousel-art')}<span>${modes[state.mode].positions[i]}</span></button>`).join('')}</div><button class="carousel-nav carousel-next" aria-label="次のカード">›</button><div class="carousel-dots">${state.selected.map((_,i)=>`<button class="carousel-dot" aria-label="${i+1}枚目"></button>`).join('')}</div></div><div class="carousel-reading"></div><div class="reading-block"><h4>三枚をつなぐ物語</h4><p>${threeStory()}</p></div><div class="reading-block"><h4>次の一歩</h4><p>${state.selected[1].action}</p></div>`;setupThreeCarousel()}
}
function threeStory(){const [a,b,c]=state.selected;return `過去には「${a.jp}」が示す${key(a)}の流れがありました。現在は「${b.jp}」の${key(b)}が中心にあります。この流れを受け止めることで、未来の「${c.jp}」が示す${key(c)}へ向かいます。未来は決定ではなく、今の選び方によって形を変える余地があります。`}
$('#again').onclick=()=>{state.selected=[];document.body.classList.remove('v4-reading');go('modes')};
$('#save-result').onclick=saveImage;
async function saveImage(){const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#19112f');g.addColorStop(1,'#05040b');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);x.strokeStyle='#d9b66f';x.lineWidth=3;x.strokeRect(42,42,996,1266);x.textAlign='center';x.fillStyle='#d9b66f';x.font='32px serif';x.fillText('人生再点火 TAROT',540,105);x.fillStyle='#f2ead7';x.font='bold 54px serif';x.fillText(modes[state.mode].label,540,180);if(state.selected.length===1){const card=state.selected[0];const img=await loadImage(`images/${String(card.n).padStart(2,'0')}-${card.slug}.png`);x.save();if(card.reversed){x.translate(540,555);x.rotate(Math.PI);x.drawImage(img,-180,-270,360,540)}else{x.drawImage(img,360,285,360,540)}x.restore();x.fillStyle='#f2ead7';x.font='bold 46px serif';x.fillText(`${card.jp}・${orientation(card)}`,540,900);wrapText(x,mainMessage(card),540,970,860,48,'30px serif');x.fillStyle='#d9b66f';x.font='bold 28px serif';x.fillText('今日からできる小さな行動',540,1130);x.fillStyle='#f2ead7';wrapText(x,card.action,540,1185,860,42,'27px serif')}else{x.font='bold 36px serif';for(let i=0;i<3;i++){const card=state.selected[i],img=await loadImage(`images/${String(card.n).padStart(2,'0')}-${card.slug}.png`),cx=230+i*310;x.save();if(card.reversed){x.translate(cx,490);x.rotate(Math.PI);x.drawImage(img,-115,-172,230,345)}else{x.drawImage(img,cx-115,318,230,345)}x.restore();x.fillStyle='#d9b66f';x.font='25px serif';x.fillText(modes[state.mode].positions[i],cx,710);x.fillStyle='#f2ead7';x.font='bold 28px serif';x.fillText(card.jp,cx,750)}x.fillStyle='#f2ead7';wrapText(x,threeStory(),540,865,900,45,'28px serif')}x.fillStyle='#81778d';x.font='22px serif';x.fillText('スキ3000突破記念・読者無料サービス',540,1280);const a=document.createElement('a');a.download=`reignite-tarot-${Date.now()}.png`;a.href=c.toDataURL('image/png');a.click()}
function loadImage(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
function wrapText(ctx,text,x,y,maxWidth,lineHeight,font){ctx.font=font;let line='';const chars=[...text];for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=ch;y+=lineHeight}else line=test}ctx.fillText(line,x,y)}
// stars
const canvas=$('#stars'),ctx=canvas.getContext('2d');let stars=[];function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);stars=Array.from({length:Math.min(150,innerWidth/7)},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.4+.2,a:Math.random()*.65+.15,s:Math.random()*.003+.001}))}function drawStars(t=0){ctx.clearRect(0,0,innerWidth,innerHeight);for(const s of stars){ctx.globalAlpha=s.a*(.65+.35*Math.sin(t*s.s+s.x));ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,7);ctx.fill()}requestAnimationFrame(drawStars)}addEventListener('resize',resize);resize();drawStars();
