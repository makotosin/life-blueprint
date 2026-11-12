(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);const W=960,H=530,G=940;
// Reduced maximum launch velocity: at 76° the highest point is just ~44px beyond the top edge.
const MIN_SPEED=310, POWER_SPAN=620, MAX_SPEED=MIN_SPEED+POWER_SPAN;
const speedFromPower=p=>MIN_SPEED+POWER_SPAN*p;
const colors={HARDEN:'#e2b07e',SENSE:'#7daeea',REGENERATE:'#85cd9c',MUTATE:'#d5a0dd'};
const platforms=[{x:315,y:347,w:118,h:14,type:'HARDEN',txt:'装甲試薬'},{x:480,y:275,w:106,h:14,type:'SENSE',txt:'感覚試薬'},{x:634,y:358,w:108,h:14,type:'REGENERATE',txt:'再生試薬'},{x:790,y:226,w:112,h:14,type:'MUTATE',txt:'変異試薬'}];
const thresholds=[0,3,7,15,24,34,45];
// Level 1: still; 2: left/right; 3: up/down; 4+: both axes. Level up every 3 successful landings.
function level(){return Math.min(5,1+Math.floor(game.success/6))}
function platformPosition(p,t){
 const lv=level(),idx=platforms.indexOf(p);
 const speed=lv===5?1.5:lv===4?1.22:lv===2?.75:1;
 const ph=t*speed*(.95+idx*.12)+idx*1.43;
 const dx=lv===1?0:lv===3?0:Math.sin(ph)* (lv===2?18:lv===4?37:49);
 const dy=lv<=2?0:Math.sin(ph*.84+1.1)*(lv===3?17:lv===4?24:33);
 return {...p,x:p.x+dx,y:p.y+dy};
}

let game,clock=0,last=0,power=0.52,powerDir=1,angle=48,ball=null,flash=null,particles=[],dialDrag=false,ended=false,stageShown=0,modalResolve=null,angleLocked=false;
let onTitle=true;let initialPickerAfterTitle=false;let pickingSpecies=false;let pickup=null, pendingPickup=null, effect={wide:0,narrow:0,wind:0}, notice='';
// An item appears while the player is aiming, and stays in the same position until collected or reset.
let pickupCountdown=4+Math.random()*5,lastSavedSecond=-1;
function savePickup(){try{localStorage.setItem('weird_launch_lab_v07_pickup',JSON.stringify(pickup))}catch(e){}}
function loadPickup(){try{const p=JSON.parse(localStorage.getItem('weird_launch_lab_v07_pickup'));if(p&&typeof p.x==='number'&&typeof p.y==='number'&&pickups.some(i=>i.id===p.id))return p}catch(e){}return null}

const pickups=[
 {id:'wide',color:'#9bd5b0',symbol:'+',label:'WIDE',desc:'足場が2回広くなる'},
 {id:'narrow',color:'#e9a5a4',symbol:'−',label:'NARROW',desc:'足場が2回狭くなる'},
 {id:'heal',color:'#e5b9c7',symbol:'♥',label:'LIFE +1',desc:'ライフ1回復'},
 {id:'wind',color:'#91c9ed',symbol:'↝',label:'WIND',desc:'次の2回に横風が吹く'}
];
function modifiedPlatform(p){const training=level()===1?1.65:level()===2?1.26:1;const factor=(effect.narrow>0?.62:effect.wide>0?1.48:1)*training;const w=p.w*factor;return {...p,x:p.x+(p.w-w)/2,w};}
function effectText(){let x=[];if(effect.wide>0)x.push('WIDE '+effect.wide);if(effect.narrow>0)x.push('NARROW '+effect.narrow);if(effect.wind!==0)x.push('WIND '+(effect.wind>0?'→':'←')+' '+Math.abs(effect.wind));return x.length?x.join(' / '):'なし'}
function maybeSpawnPickup(){
 if(pickup||game.done)return;
 const it=pickups[Math.floor(Math.random()*pickups.length)];
 // Keep the item visible and within broadly reachable portions of the arena.
 const positions=[
  {x:rand(260,390),y:rand(145,235)},
  {x:rand(410,535),y:rand(110,210)},
  {x:rand(550,685),y:rand(135,245)},
  {x:rand(700,830),y:rand(95,190)}
 ];
 pickup={...it,...positions[Math.floor(Math.random()*positions.length)]};
 savePickup();
 setMessage('イレギュラーアイテム出現！ 角度とパワーを調整して狙おう。取得するまで残ります。');
}
function collectPickup(){if(!pickup)return;const it=pickup;pickup=null;savePickup();
 if(it.id==='heal'){game.lives=Math.min(5,game.lives+1)}
 else pendingPickup=it.id;
 notice=it.label+' : '+it.desc;setMessage('アイテム取得：'+notice);save();update();
}
function applyPendingPickup(){const it=pendingPickup;pendingPickup=null;
 if(it==='wide'){effect.wide=2;effect.narrow=0}
 if(it==='narrow'){effect.narrow=2;effect.wide=0}
 if(it==='wind'){effect.wind=(Math.random()<.5?-1:1)*2}
}
function consumeShotEffect(){if(effect.wide>0)effect.wide--;if(effect.narrow>0)effect.narrow--;if(effect.wind>0)effect.wind--;else if(effect.wind<0)effect.wind++;}

const speciesNames={MAMMALOID:'哺乳類',REPTILOID:'爬虫類',AMPHIBIOID:'両生類',MOLLUSCOID:'軟体類'};
const attrNames={HARDEN:'装甲化',SENSE:'精神化',REGENERATE:'複雑化',MUTATE:'キメラ化'};
const kinds=['MAMMALOID','REPTILOID','AMPHIBIOID','MOLLUSCOID'];
const attrs=['HARDEN','SENSE','REGENERATE','MUTATE'];
const artPath=(species,phase,attr)=>'assets/evolutions/'+species.toLowerCase()+'_'+(phase==='base'?'base':phase+'_'+attr.toLowerCase())+'.png';
const gradeLabels=['☆ 白星 Lv.1','☆☆ 白星 Lv.2','☆☆☆ 白星 Lv.3','★ 黒星 Lv.1','★★ 黒星 Lv.2','★★★ 黒星 Lv.3'];
const rareArt={ANGEL:'assets/evolutions/rare_angel.png',TRANSHUMAN:'assets/evolutions/rare_transhuman.png'};
const pickMain=(counts)=>attrs.slice().sort((a,b)=>(counts[b]||0)-(counts[a]||0))[0];

const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function empty(){return {species:'REPTILOID',middleAttr:null,finalAttr:null,elapsed:0,lives:5,score:0,combo:0,shots:0,success:0,total:0,stage:0,counts:{HARDEN:0,SENSE:0,REGENERATE:0,MUTATE:0},done:false,grade:'',final:'',rareType:null}}
function save(){try{localStorage.setItem('weird_launch_lab_v07',JSON.stringify(game))}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem('weird_launch_lab_v07'));if(d&&typeof d.lives==='number'&&d.counts){if(typeof d.elapsed!=='number')d.elapsed=0;if(!kinds.includes(d.species))d.species='REPTILOID';return d}}catch(e){}return empty()}
function setMessage(t){$('message').textContent=t}
function modal(kicker,title,desc,extra,button,cb,art){$('overlayArt').classList.toggle('hidden',!art);if(art){$('overlayCreature').src=art.startsWith('assets/')?art:'assets/'+art;$('overlayArtFrame').className='overlayArtFrame phase-'+Math.min(game.stage,6)+(game.rareType&&game.stage===6?' rare-'+game.rareType.toLowerCase():'');}$('overlayKicker').textContent=kicker;$('overlayTitle').textContent=title;$('overlayText').textContent=desc;$('overlayExtra').innerHTML=extra||'';$('overlayBtn').textContent=button||'続ける';$('overlay').classList.remove('hidden');modalResolve=cb||null;$('launch').disabled=true}
$('overlayBtn').onclick=()=>{$('overlay').classList.add('hidden');const cb=modalResolve;modalResolve=null;if(cb)cb();update()};
function status(){return onTitle?'TITLE':ball?'IN FLIGHT':game.done?'EXPERIMENT END':flash?'LANDING':(!($('overlay').classList.contains('hidden')&&!pickingSpecies)||pickingSpecies)?'LAB RESULT':'READY'}
function update(){
 $('score').textContent=game.score.toLocaleString();$('playtime').textContent=String(Math.floor(game.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(game.elapsed%60)).padStart(2,'0');$('level').textContent='LEVEL '+level();$('movement').textContent=['','静止','左右移動','上下移動','左右＋上下','高速・複合移動'][level()];$('combo').textContent='×'+Math.max(1,game.combo);$('lives').textContent=('♥ '.repeat(game.lives)+ '♡ '.repeat(5-game.lives)).trim();$('angle').value=angle;$('angleTxt').textContent=angle+'°';$('state').textContent=status();$('launch').disabled=onTitle||!angleLocked||!!ball||!!flash||game.done||(!($('overlay').classList.contains('hidden')&&!pickingSpecies)||pickingSpecies); $('angle').disabled=angleLocked||!!ball||!!flash||game.done; $('angleDown').disabled=$('angle').disabled; $('angleUp').disabled=$('angle').disabled; $('lockAngle').disabled=!!ball||!!flash||game.done; $('lockAngle').classList.toggle('locked',angleLocked); $('lockAngle').textContent=angleLocked?'✓ ANGLE '+angle+'° 決定済み（変更）':'ANGLE決定：'+angle+'°'; $('angleHint').textContent=angleLocked?'角度を固定しました。パワーを狙ってLAUNCH!':'角度を自分で選んで決定してください'; $('launch').querySelector('span').textContent=angleLocked?'ゲージを見て発射':'先にANGLEを決める'; document.querySelector('.powerControl').classList.toggle('pending',!angleLocked);
 const names=['ORIGIN — 白黒','EVOLUTION I — 灰','EVOLUTION II — 黒','INTERMEDIATE — 中間進化','EVOLUTION IV — 青','EVOLUTION V — 赤','FINAL — 最終進化'];
 $('stageLabel').textContent=names[Math.min(game.stage,6)]+(game.stage>=3?' · '+attrNames[game.stage===6?(game.finalAttr||game.middleAttr||'HARDEN'):(game.middleAttr||'HARDEN')]:'');
 const phase=game.stage===6?'final':game.stage>=3?'middle':'base';const attr=phase==='final'?(game.finalAttr||game.middleAttr||'HARDEN'):(game.middleAttr||'HARDEN');const imPath=(game.stage===6&&game.rareType&&rareArt[game.rareType])||artPath(game.species,phase,attr);
 if($('specimen').getAttribute('src')!==imPath)$('specimen').src=imPath;
 $('specimenFrame').className='specimen phase-'+Math.min(game.stage,6)+(game.rareType&&game.stage===6?' rare-'+game.rareType.toLowerCase():'');
 $('selectedSpecies').textContent=game.species+' / '+speciesNames[game.species];
 $('evoAttribute').textContent=game.stage===6&&game.rareType?'超レア：'+(game.rareType==='ANGEL'?'天使型':'超人類型'):game.stage>=3?'進化系統：'+attrNames[game.middleAttr||'HARDEN']:'進化系統：まだ未確定';
 $('evoGrade').textContent=game.stage===6?(game.grade||''):'最終グレードは進化時に公開';
 $('evoPoints').textContent=game.total+' / '+thresholds[6]+' (次 '+(thresholds[Math.min(6,game.stage+1)]||45)+')';if($('activeEffect'))$('activeEffect').textContent='イレギュラー効果：'+effectText();$('evoFill').style.width=(Math.min(game.total,45)/45*100)+'%';$('reagents').innerHTML=Object.entries(game.counts).map(([k,v])=>'<div class="reagent"><strong style="color:'+colors[k]+'">'+k+'</strong><span>'+v+' <small style="font-size:10px;color:#b4c3b9">vials</small></span></div>').join('');
}
function newGame(species){if(!kinds.includes(species)){showSpeciesSelector();return;}pickup=null;savePickup();pickupCountdown=4+Math.random()*5;pendingPickup=null;effect={wide:0,narrow:0,wind:0};notice='';game=empty();game.species=species;ball=null;flash=null;particles=[];ended=false;stageShown=0;angleLocked=false;save();setMessage(speciesNames[species]+'の実験を開始。4種類の試薬を集めよう！');update()}
function showSpeciesSelector(){pickingSpecies=true;const c=$('speciesCards');c.innerHTML='';kinds.forEach(species=>{const btn=document.createElement('button');btn.type='button';btn.className='speciesCard';btn.innerHTML='<img src="'+artPath(species,'base')+'" alt=""><strong>'+species+'</strong><small>'+speciesNames[species]+'</small>';btn.onclick=()=>{pickingSpecies=false;$('speciesPicker').classList.add('hidden');newGame(species);};c.appendChild(btn);});$('speciesPicker').classList.remove('hidden');$('launch').disabled=true;}
function gradeFor(){const r=Math.random();return gradeLabels[r<.34?0:r<.57?1:r<.74?2:r<.87?3:r<.96?4:5]}
// Only evaluate rare forms ONCE at final evolution; never at intermediate stages.
function rareFor(g,random=Math.random){
 const allFour=attrs.every(k=>(g.counts[k]||0)>=3);
 const highSkill=g.success>=35 && g.shots>0 && g.success/g.shots>=0.72 && g.lives>=3;
 if(!allFour || !highSkill)return null;
 const r=random();
 if(r<0.008)return 'ANGEL'; // all four originals eligible
 if(g.species==='MAMMALOID' && r<0.016)return 'TRANSHUMAN';
 return null;
}

function evolve(){if(game.done)return;let next=game.stage;for(let i=1;i<=6;i++){if(game.total>=thresholds[i])next=i;}if(next<=game.stage)return;game.stage=next;save();$('evoGlow').classList.remove('on');void $('evoGlow').offsetWidth;$('evoGlow').classList.add('on');update();
 const label=['','第1進化：灰色','第2進化：黒','第3進化：中間形態','第4進化：青','第5進化：赤','最終進化：抽選'][next];
 let detail='試薬を集めたことで、'+speciesNames[game.species]+'の身体に変化が起きた。';
 if(next===3){game.middleAttr=pickMain(game.counts);save();update();detail='最多試薬：'+game.middleAttr+'（'+attrNames[game.middleAttr]+'）。'+speciesNames[game.species]+'の中間形態へ進化！';}
 if(next===6){
  game.finalAttr=game.middleAttr||pickMain(game.counts);
  game.rareType=rareFor(game);
  game.final=game.rareType==='ANGEL'?'天使型 ― ANGEL':game.rareType==='TRANSHUMAN'?'超人類型 ― TRANSHUMAN':speciesNames[game.species]+' · '+attrNames[game.finalAttr]+'（最終形態）';
  game.grade=game.rareType?'✦ 超レア ✦':gradeFor();game.done=true;save();
  detail=game.rareType?'特別条件が成立。通常の最終形態を超える変異が発現した！':'中間進化の属性 '+game.finalAttr+' を完成させた！ '+game.grade+' を獲得。';
  update();modal(game.rareType?'ULTRA RARE EVOLUTION':'FINAL EVOLUTION',game.final,detail,'<div class="gr">'+game.grade+'</div>','原種選択に戻る',()=>newGame(),game.rareType?rareArt[game.rareType]:artPath(game.species,'final',game.finalAttr));return;
 }
 modal('EVOLUTION UNLOCKED',label,detail,'','アクションへ戻る',null,next===3?artPath(game.species,'middle',game.middleAttr):null);
}
function lifeLoss(reason){game.combo=0;game.lives=Math.max(0,game.lives-1);save();setMessage(reason+'　ライフ -1');if(game.lives===0){game.done=true;save();modal('EXPERIMENT FAILED','生命維持に失敗', 'ライフが尽き、最終進化には到達できなかった。獲得試薬 '+game.total+' 個、成功着地 '+game.success+' 回。','','原種選択に戻る',()=>newGame());} update();}
function success(p,x){consumeShotEffect();applyPendingPickup();const prevLevel=level();game.success++;game.shots++;game.combo++;if(game.success%8===0&&game.lives<5){game.lives++;notice='ライフ +1（8回着地ボーナス）';}game.counts[p.type]++;game.total++;const closeness=1-Math.min(1,Math.abs(x-(p.x+p.w/2))/(p.w/2));const gained=Math.round((80+120*closeness)*Math.min(5,game.combo));game.score+=gained;save();setMessage(p.type+' 試薬を獲得！ +'+gained+'点　（連続着地 '+game.combo+' 回）');$('labInfo').textContent='取得：'+p.type+' 試薬。'+p.txt+'が進化ポイントに反映された。';for(let i=0;i<19;i++)particles.push({x,y:p.y,dx:rand(-115,115),dy:rand(-205,-30),life:rand(.4,.9),color:colors[p.type]});flash={type:'success',t:1.1};if(level()>prevLevel){setMessage('LEVEL UP! 足場の動きが変化！ '+['','静止','左右移動','上下移動','左右＋上下','高速複合移動'][level()]);}update();setTimeout(()=>{flash=null;if(!game.done)evolve();update()},900)}
function fail(reason){consumeShotEffect();applyPendingPickup();game.shots++;lifeLoss(reason);flash={type:'fail',t:.8};setTimeout(()=>{flash=null;update()},700)}
function launch(){if(!angleLocked||game.done||ball||flash||(!($('overlay').classList.contains('hidden')&&!pickingSpecies)||pickingSpecies))return;angleLocked=false;const s=speedFromPower(power);const a=angle*Math.PI/180;ball={x:118,y:389,vx:s*Math.cos(a),vy:-s*Math.sin(a),time:0,wind:effect.wind===0?0:(effect.wind>0?1:-1)*92};setMessage('発射！　着地できる足場を狙え！');update()}
$('launch').onclick=launch;function setAngle(v){if(angleLocked||ball||flash||game.done)return;angle=clamp(Math.round(v),18,76);update()} $('angle').oninput=e=>setAngle(+e.target.value);$('angleDown').onclick=()=>setAngle(angle-5);$('angleUp').onclick=()=>setAngle(angle+5);$('lockAngle').onclick=()=>{if(ball||flash||game.done)return;angleLocked=!angleLocked;setMessage(angleLocked?'角度 '+angle+'° を固定！ 動くパワーゲージを見てLAUNCH!':'角度の固定を解除。もう一度調整してください。');update()};$('restart').onclick=()=>modal('RESET EXPERIMENT','新しい実験を開始しますか？','現在の試薬、スコア、進化履歴は初期化されます。','','原種を選び直す',()=>newGame());
function aimFromClient(ev){const r=canvas.getBoundingClientRect();const cx=(ev.clientX-r.left)*W/r.width,cy=(ev.clientY-r.top)*H/r.height;const dx=cx-118,dy=389-cy;setAngle(Math.atan2(dy,dx)*180/Math.PI)}
canvas.addEventListener('pointerdown',e=>{if(angleLocked||ball||game.done)return;const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;if(x<290&&y>175){dialDrag=true;canvas.setPointerCapture(e.pointerId);aimFromClient(e)}});canvas.addEventListener('pointermove',e=>{if(dialDrag)aimFromClient(e)});for(let n of ['pointerup','pointercancel'])canvas.addEventListener(n,()=>{dialDrag=false});
function draw(){ctx.clearRect(0,0,W,H);let bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#172631');bg.addColorStop(1,'#253c3c');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#2c4650';ctx.lineWidth=1;for(let x=40;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=10;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 ctx.fillStyle='#26352f';ctx.fillRect(0,475,W,55);ctx.fillStyle='#415047';ctx.fillRect(0,475,W,5);
 for(const base of platforms){const p=modifiedPlatform(platformPosition(base,clock));ctx.shadowColor=colors[p.type];ctx.shadowBlur=14;ctx.fillStyle=colors[p.type];ctx.fillRect(p.x,p.y,p.w,p.h);ctx.shadowBlur=0;ctx.fillStyle='#18252b';ctx.fillRect(p.x+3,p.y+4,p.w-6,6);ctx.fillStyle=colors[p.type]+'33';ctx.fillRect(p.x+5,p.y+14,p.w-10,9);ctx.strokeStyle='#48616a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(p.x+15,p.y+14);ctx.lineTo(p.x+15,475);ctx.moveTo(p.x+p.w-15,p.y+14);ctx.lineTo(p.x+p.w-15,475);ctx.stroke();ctx.fillStyle='#ecf2ec';ctx.textAlign='center';ctx.font='bold 16px system-ui';ctx.fillText(p.type,p.x+p.w/2,p.y-36);ctx.font='12px system-ui';ctx.fillStyle='#e7e1d4';ctx.fillText(p.txt,p.x+p.w/2,p.y-19);ctx.fillStyle=colors[p.type];ctx.beginPath();ctx.moveTo(p.x+p.w/2-6,p.y-15);ctx.lineTo(p.x+p.w/2,p.y-5);ctx.lineTo(p.x+p.w/2+6,p.y-15);ctx.fill();}
 // launcher spring
 ctx.fillStyle='#a6b4b1';ctx.fillRect(64,420,110,12);ctx.strokeStyle='#c4b89c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(70,420);ctx.lineTo(84,442);ctx.lineTo(98,420);ctx.lineTo(112,442);ctx.lineTo(126,420);ctx.lineTo(140,442);ctx.lineTo(154,420);ctx.stroke();ctx.fillStyle='#728f90';ctx.fillRect(65,443,110,16);
 ctx.save();ctx.translate(118,393);ctx.rotate(-angle*Math.PI/180);ctx.fillStyle='#c3a371';ctx.fillRect(-15,-13,74,26);ctx.strokeStyle='#ede2cc';ctx.lineWidth=3;ctx.strokeRect(-15,-13,74,26);ctx.fillStyle='#edc789';ctx.beginPath();ctx.moveTo(61,-13);ctx.lineTo(78,0);ctx.lineTo(61,13);ctx.fill();ctx.restore();
 ctx.beginPath();ctx.arc(118,393,87,Math.PI*1.5,0);ctx.strokeStyle='#82949c';ctx.setLineDash([3,7]);ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#d8c9aa';ctx.font='bold 13px system-ui';ctx.textAlign='left';ctx.fillText('ANGLE '+angle+'°',42,301);ctx.font='12px system-ui';ctx.fillStyle='#a5b8bf';ctx.fillText(angleLocked?'ANGLE LOCKED':'DRAG LEVER',44,321);
 if(!ball&&!game.done){const a=angle*Math.PI/180,v=speedFromPower(power);ctx.setLineDash([5,8]);ctx.strokeStyle='#e4cd906e';ctx.lineWidth=2;ctx.beginPath();for(let t=0;t<.69;t+=.04){const x=118+v*Math.cos(a)*t,y=389-v*Math.sin(a)*t+.5*G*t*t;if(t===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(118,389,15,0,Math.PI*2);ctx.fillStyle='#e0c391';ctx.fill();ctx.strokeStyle='#f7f0d8';ctx.lineWidth=2;ctx.stroke()}
 if(pickup){
 const glow=4*Math.sin(clock*6);ctx.save();ctx.shadowColor=pickup.color;ctx.shadowBlur=16;ctx.strokeStyle=pickup.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(pickup.x,pickup.y,18+glow,0,2*Math.PI);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#182b34';ctx.beginPath();ctx.arc(pickup.x,pickup.y,16,0,Math.PI*2);ctx.fill();ctx.fillStyle=pickup.color;ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.fillText(pickup.symbol,pickup.x,pickup.y+7);ctx.font='bold 10px system-ui';ctx.fillText(pickup.label,pickup.x,pickup.y-26);ctx.restore();
 }
 if(ball){ctx.shadowColor='#d7d2a1';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(ball.x,ball.y,14,0,Math.PI*2);ctx.fillStyle='#f1ca84';ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#314747';ctx.beginPath();ctx.arc(ball.x+5,ball.y-4,3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bd8d64';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ball.x-11,ball.y+8);ctx.lineTo(ball.x-17,ball.y+16);ctx.stroke()}
 for(const p of particles){ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)}ctx.globalAlpha=1;
 ctx.textAlign='left';ctx.fillStyle='#d1e0dc';ctx.font='11px system-ui';ctx.fillText('↑ 高さが違う足場は狙うパワーも変わる',22,30);ctx.fillStyle='#8ca3a7';ctx.font='10px system-ui';ctx.fillText('足場に上から着地すると試薬を取得',22,47);ctx.fillStyle='#f5d18f';ctx.font='bold 15px system-ui';ctx.fillText('LEVEL '+level()+'  /  '+['','STILL','HORIZONTAL','VERTICAL','DUAL MOTION','FAST MOTION'][level()],W-240,29);ctx.fillStyle='#bed7d1';ctx.font='bold 11px system-ui';ctx.fillText('FIXED CAMERA / TRAINING WIDTH ×1.65',W-260,48);
}
function tick(t){if(!last)last=t;const dt=clamp((t-last)/1000,0,.033);last=t;clock+=dt;if(!onTitle&&!game.done&&($('overlay').classList.contains('hidden')&&!pickingSpecies)){game.elapsed+=dt;if(Math.floor(game.elapsed)%10===0 && Math.floor(game.elapsed)!==lastSavedSecond){lastSavedSecond=Math.floor(game.elapsed);save();}}
 // Random appearance occurs during angle adjustment (before angle lock), not at launch.
 if(!onTitle&&!pickup&&!ball&&!flash&&!game.done&&!angleLocked&&($('overlay').classList.contains('hidden')&&!pickingSpecies)){
  pickupCountdown-=dt;
  if(pickupCountdown<=0){maybeSpawnPickup();pickupCountdown=7+Math.random()*14;}
 }
 const canMove=!onTitle&&angleLocked&&!game.done&&!ball&&!flash&&($('overlay').classList.contains('hidden')&&!pickingSpecies);if(canMove){power+=powerDir*dt*(level()===1?.42:level()===2?.56:.72);if(power>=1){power=2-power;powerDir=-1}if(power<=.1){power=.2-power;powerDir=1}}$('playtime').textContent=String(Math.floor(game.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(game.elapsed%60)).padStart(2,'0');$('powerFill').style.width=Math.round(power*100)+'%';$('powerMarker').style.left='calc('+Math.round(power*100)+'% - 2px)';$('powerTxt').textContent=Math.round(power*100)+'%';
 if(ball){const oldY=ball.y;ball.time+=dt;ball.x+=ball.vx*dt+.5*ball.wind*dt*dt;ball.vx+=ball.wind*dt;ball.y+=ball.vy*dt+.5*G*dt*dt;ball.vy+=G*dt;if(pickup&&Math.hypot(ball.x-pickup.x,ball.y-pickup.y)<33)collectPickup();let hit=null;if(ball.vy>0){for(const base of platforms){const p=modifiedPlatform(platformPosition(base,clock));const prev=modifiedPlatform(platformPosition(base,clock-dt));if(oldY+14<=prev.y+8 && ball.y+14>=p.y && ball.x>=p.x-6&&ball.x<=p.x+p.w+6){hit=p;break}}}if(hit){const x=ball.x,y=hit.y;ball=null;success(hit,x)}else if(ball.y>550||ball.x>990||ball.x< -40||ball.time>4.2){ball=null;fail('足場を外した！')}}
 for(const p of particles){p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;p.dy+=340*dt}particles=particles.filter(p=>p.life>0);draw();requestAnimationFrame(tick)}
 let saved=null;try{saved=localStorage.getItem('weird_launch_lab_v07')}catch(e){}game=load();if(game.done){game=empty();pickup=null;savePickup()}else{pickup=loadPickup()}update();setMessage('原種選択後、角度とパワーを決めて試薬足場を狙おう。');initialPickerAfterTitle=!saved||game.done;
 $('startFromTitle').onclick=()=>{onTitle=false;$('titleScreen').classList.add('hidden');if(initialPickerAfterTitle)showSpeciesSelector();update();};
 requestAnimationFrame(tick);
})();
