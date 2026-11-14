(()=>{'use strict';
const audio=window.WeirdAudio;
function playSound(name){audio?.effect(name)}
function syncSoundButtons(){const st=audio?.state();if(!st)return;for(const [key,ids] of [['bgm',['titleBgm','gameBgm']],['sfx',['titleSfx','gameSfx']]]){for(const id of ids){const btn=document.getElementById(id);if(!btn)continue;btn.textContent=(key==='bgm'?'BGM':'SFX')+': '+(st[key]?'ON':'OFF');btn.setAttribute('aria-pressed',String(st[key]));btn.disabled=!st.supported;}}}
for(const [key,ids] of [['bgm',['titleBgm','gameBgm']],['sfx',['titleSfx','gameSfx']]])for(const id of ids){document.getElementById(id)?.addEventListener('click',()=>{audio?.toggle(key);syncSoundButtons()});}
syncSoundButtons();
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);const W=960,H=530,G=940;
// Reduced maximum launch velocity: at 76° the highest point is just ~44px beyond the top edge.
const MIN_SPEED=310, POWER_SPAN=620, MAX_SPEED=MIN_SPEED+POWER_SPAN;
const speedFromPower=p=>MIN_SPEED+POWER_SPAN*p;
const colors={HARDEN:'#e2b07e',SENSE:'#7daeea',REGENERATE:'#85cd9c',MUTATE:'#d5a0dd'};
const platforms=[{x:315,y:347,w:118,h:14,type:'HARDEN',txt:'Armor reagent'},{x:480,y:275,w:106,h:14,type:'SENSE',txt:'Sense reagent'},{x:634,y:358,w:108,h:14,type:'REGENERATE',txt:'Regen reagent'},{x:790,y:226,w:112,h:14,type:'MUTATE',txt:'Mutant reagent'}];
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
let onTitle=true;let pickingSpecies=false;let pickup=null, pendingPickup=null, effect={wide:0,narrow:0,wind:0}, notice='';
// An item appears while the player is aiming, and stays in the same position until collected or reset.
let pickupCountdown=4+Math.random()*5,lastSavedSecond=-1;
function savePickup(){try{localStorage.setItem('weird_launch_lab_v07_pickup',JSON.stringify(pickup))}catch(e){}}
function loadPickup(){try{const p=JSON.parse(localStorage.getItem('weird_launch_lab_v07_pickup'));if(p&&typeof p.x==='number'&&typeof p.y==='number'&&pickups.some(i=>i.id===p.id))return p}catch(e){}return null}

const pickups=[
 {id:'wide',color:'#9bd5b0',symbol:'+',label:'WIDE',desc:'Platforms widen for 2 shots'},
 {id:'narrow',color:'#e9a5a4',symbol:'−',label:'NARROW',desc:'Platforms shrink for 2 shots'},
 {id:'heal',color:'#e5b9c7',symbol:'♥',label:'LIFE +1',desc:'Restore 1 life'},
 {id:'wind',color:'#91c9ed',symbol:'↝',label:'WIND',desc:'Crosswind for 2 shots'}
];
function modifiedPlatform(p){const training=level()===1?1.65:level()===2?1.26:1;const factor=(effect.narrow>0?.62:effect.wide>0?1.48:1)*training;const w=p.w*factor;return {...p,x:p.x+(p.w-w)/2,w};}
function effectText(){let x=[];if(effect.wide>0)x.push('WIDE '+effect.wide);if(effect.narrow>0)x.push('NARROW '+effect.narrow);if(effect.wind!==0)x.push('WIND '+(effect.wind>0?'→':'←')+' '+Math.abs(effect.wind));return x.length?x.join(' / '):'None'}
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
 setMessage('BONUS ITEM! Adjust angle and power to collect it. It remains until picked up.');
}
function collectPickup(){if(!pickup)return;playSound('pickup');const it=pickup;pickup=null;savePickup();
 if(it.id==='heal'){game.lives=Math.min(5,game.lives+1)}
 else pendingPickup=it.id;
 notice=it.label+' : '+it.desc;setMessage('ITEM COLLECTED: '+notice);save();update();
}
function applyPendingPickup(){const it=pendingPickup;pendingPickup=null;
 if(it==='wide'){effect.wide=2;effect.narrow=0}
 if(it==='narrow'){effect.narrow=2;effect.wide=0}
 if(it==='wind'){effect.wind=(Math.random()<.5?-1:1)*2}
 save();
}
function consumeShotEffect(){if(effect.wide>0)effect.wide--;if(effect.narrow>0)effect.narrow--;if(effect.wind>0)effect.wind--;else if(effect.wind<0)effect.wind++;}

const speciesNames={MAMMALOID:'Mammal',REPTILOID:'Reptile',AMPHIBIOID:'Amphibian',MOLLUSCOID:'Mollusk'};
const attrNames={HARDEN:'Armor',SENSE:'Psyche',REGENERATE:'Regeneration',MUTATE:'Chimera'};
const kinds=['MAMMALOID','REPTILOID','AMPHIBIOID','MOLLUSCOID'];
const attrs=['HARDEN','SENSE','REGENERATE','MUTATE'];
const artPath=(species,phase,attr)=>'assets/evolutions/'+species.toLowerCase()+'_'+(phase==='base'?'base':phase+'_'+attr.toLowerCase())+'.webp';
const gradeLabels=['☆ White Lv.1','☆☆ White Lv.2','☆☆☆ White Lv.3','★ Black Lv.1','★★ Black Lv.2','★★★ Black Lv.3'];
const rareArt={ANGEL:'assets/evolutions/rare_angel.webp',TRANSHUMAN:'assets/evolutions/rare_transhuman.webp'};
const pickMain=(counts)=>attrs.slice().sort((a,b)=>(counts[b]||0)-(counts[a]||0))[0];

const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function empty(){return {species:'REPTILOID',middleAttr:null,finalAttr:null,elapsed:0,lives:5,score:0,combo:0,shots:0,success:0,total:0,stage:0,counts:{HARDEN:0,SENSE:0,REGENERATE:0,MUTATE:0},done:false,grade:'',final:'',rareType:null}}
function save(){try{game.modifiers={...effect};game.pendingPickup=pendingPickup;game.pickupCountdown=pickupCountdown;localStorage.setItem('weird_launch_lab_v07',JSON.stringify(game))}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem('weird_launch_lab_v07'));if(d&&typeof d.lives==='number'&&d.counts){if(typeof d.elapsed!=='number'||!Number.isFinite(d.elapsed))d.elapsed=0;if(!kinds.includes(d.species))d.species='REPTILOID';for(const k of attrs){if(!Number.isFinite(d.counts[k]))d.counts[k]=0;}if(d.modifiers&&typeof d.modifiers==='object'){for(const k of ['wide','narrow','wind']){effect[k]=Number.isFinite(d.modifiers[k])?Math.max(-2,Math.min(2,d.modifiers[k])):0;}}pendingPickup=typeof d.pendingPickup==='string'?d.pendingPickup:null;pickupCountdown=Number.isFinite(d.pickupCountdown)?Math.max(1,d.pickupCountdown):5;return d}}catch(e){}return empty()}
function setMessage(t){$('message').textContent=t}
function modal(kicker,title,desc,extra,button,cb,art){$('overlayArt').classList.toggle('hidden',!art);if(art){$('overlayCreature').src=art.startsWith('assets/')?art:'assets/'+art;$('overlayArtFrame').className='overlayArtFrame phase-'+Math.min(game.stage,6)+(game.rareType&&game.stage===6?' rare-'+game.rareType.toLowerCase():'');}$('overlayKicker').textContent=kicker;$('overlayTitle').textContent=title;$('overlayText').textContent=desc;$('overlayExtra').innerHTML=extra||'';$('overlayBtn').textContent=button||'CONTINUE';$('overlay').classList.remove('hidden');modalResolve=cb||null;$('launch').disabled=true}
$('overlayBtn').onclick=()=>{playSound('click');$('overlay').classList.add('hidden');const cb=modalResolve;modalResolve=null;if(cb)cb();update()};
function status(){return onTitle?'TITLE':ball?'IN FLIGHT':game.done?'EXPERIMENT END':flash?'LANDING':(!($('overlay').classList.contains('hidden')&&!pickingSpecies)||pickingSpecies)?'LAB RESULT':'READY'}
function update(){
 $('score').textContent=game.score.toLocaleString();$('playtime').textContent=String(Math.floor(game.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(game.elapsed%60)).padStart(2,'0');$('level').textContent='LEVEL '+level();$('movement').textContent=['','Stationary','Moving horizontally','Moving vertically','Moving in both axes','Fast mixed movement'][level()];$('combo').textContent='×'+Math.max(1,game.combo);$('lives').textContent=('♥ '.repeat(game.lives)+ '♡ '.repeat(5-game.lives)).trim();$('angle').value=angle;$('angleTxt').textContent=angle+'°';$('state').textContent=status();$('launch').disabled=onTitle||!angleLocked||!!ball||!!flash||game.done||(!($('overlay').classList.contains('hidden')&&!pickingSpecies)||pickingSpecies); $('angle').disabled=angleLocked||!!ball||!!flash||game.done; $('angleDown').disabled=$('angle').disabled; $('angleUp').disabled=$('angle').disabled; $('lockAngle').disabled=!!ball||!!flash||game.done; $('lockAngle').classList.toggle('locked',angleLocked); $('lockAngle').textContent=angleLocked?'✓ ANGLE '+angle+'° LOCKED (CHANGE)':'LOCK ANGLE: '+angle+'°'; $('angleHint').textContent=angleLocked?'Angle locked. Time your power and launch!':'Set an angle, then lock it.'; $('launch').querySelector('span').textContent=angleLocked?'Watch the meter and launch!':'Lock the angle first'; document.querySelector('.powerControl').classList.toggle('pending',!angleLocked);
 const names=['ORIGIN','EVOLUTION I — GRAY','EVOLUTION II — BLACK','INTERMEDIATE EVOLUTION','EVOLUTION IV — BLUE','EVOLUTION V — RED','FINAL EVOLUTION'];
 $('stageLabel').textContent=names[Math.min(game.stage,6)]+(game.stage>=3?' · '+attrNames[game.stage===6?(game.finalAttr||game.middleAttr||'HARDEN'):(game.middleAttr||'HARDEN')]:'');
 const phase=game.stage===6?'final':game.stage>=3?'middle':'base';const attr=phase==='final'?(game.finalAttr||game.middleAttr||'HARDEN'):(game.middleAttr||'HARDEN');const imPath=(game.stage===6&&game.rareType&&rareArt[game.rareType])||artPath(game.species,phase,attr);
 if($('specimen').getAttribute('src')!==imPath)$('specimen').src=imPath;
 $('specimenFrame').className='specimen phase-'+Math.min(game.stage,6)+(game.rareType&&game.stage===6?' rare-'+game.rareType.toLowerCase():'');
 $('selectedSpecies').textContent=game.species+' / '+speciesNames[game.species];
 $('evoAttribute').textContent=game.stage===6&&game.rareType?'ULTRA RARE: '+(game.rareType==='ANGEL'?'Angel':'Transhuman'):game.stage>=3?'Evolution path: '+attrNames[game.middleAttr||'HARDEN']:'Evolution path: Not determined';
 $('evoGrade').textContent=game.stage===6?(game.grade||''):'Final grade revealed at evolution';
 $('evoPoints').textContent=game.total+' / '+thresholds[6]+' (next '+(thresholds[Math.min(6,game.stage+1)]||45)+')';if($('activeEffect'))$('activeEffect').textContent='Special effect: '+effectText();$('evoFill').style.width=(Math.min(game.total,45)/45*100)+'%';$('reagents').innerHTML=Object.entries(game.counts).map(([k,v])=>'<div class="reagent"><strong style="color:'+colors[k]+'">'+k+'</strong><span>'+v+' <small style="font-size:10px;color:#b4c3b9">vials</small></span></div>').join('');
}
function newGame(species){if(!kinds.includes(species)){showSpeciesSelector();return;}pickup=null;savePickup();pickupCountdown=4+Math.random()*5;pendingPickup=null;effect={wide:0,narrow:0,wind:0};notice='';game=empty();game.species=species;ball=null;flash=null;particles=[];ended=false;stageShown=0;angleLocked=false;save();setMessage(speciesNames[species]+' experiment started! Collect the four reagents.');update()}
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
 const label=['','Evolution I: Gray','Evolution II: Black','Intermediate Evolution','Evolution IV: Blue','Evolution V: Red','Final Evolution'][next];
 let detail='Reagents transform the body of '+speciesNames[game.species]+'!';
 if(next===3){game.middleAttr=pickMain(game.counts);save();update();detail='Dominant reagent: '+game.middleAttr+' ('+attrNames[game.middleAttr]+'). '+speciesNames[game.species]+' evolved into an intermediate form!';}
 if(next===6){
  game.finalAttr=game.middleAttr||pickMain(game.counts);
  game.rareType=rareFor(game);
  game.final=game.rareType==='ANGEL'?'Angel ― ANGEL':game.rareType==='TRANSHUMAN'?'Transhuman ― TRANSHUMAN':speciesNames[game.species]+' · '+attrNames[game.finalAttr]+'(Final Form)';
  game.grade=game.rareType?'✦ ULTRA RARE ✦':gradeFor();game.done=true;save();playSound(game.rareType?'rare':'evolve');
  detail=game.rareType?'Rare conditions met! An extraordinary transformation has appeared!':'Intermediate path '+game.finalAttr+' is complete! Grade: '+game.grade+' earned.';
  update();modal(game.rareType?'ULTRA RARE EVOLUTION':'FINAL EVOLUTION',game.final,detail,'<div class="gr">'+game.grade+'</div>','NEW EXPERIMENT',()=>newGame(),game.rareType?rareArt[game.rareType]:artPath(game.species,'final',game.finalAttr));return;
 }
 playSound('evolve');modal('EVOLUTION UNLOCKED',label,detail,'','CONTINUE PLAYING',null,next===3?artPath(game.species,'middle',game.middleAttr):null);
}
function lifeLoss(reason){playSound('miss');game.combo=0;game.lives=Math.max(0,game.lives-1);save();setMessage(reason+' — LIFE -1');if(game.lives===0){playSound('fail');game.done=true;save();modal('EXPERIMENT FAILED','Experiment failed', 'No lives left. Reagents collected: '+game.total+'; successful landings: '+game.success+'.','','NEW EXPERIMENT',()=>newGame());} update();}
function success(p,x){playSound('land');consumeShotEffect();applyPendingPickup();const prevLevel=level();game.success++;game.shots++;game.combo++;if(game.success%8===0&&game.lives<5){game.lives++;notice='LIFE +1 (8 landing bonus)';}game.counts[p.type]++;game.total++;const closeness=1-Math.min(1,Math.abs(x-(p.x+p.w/2))/(p.w/2));const gained=Math.round((80+120*closeness)*Math.min(5,game.combo));game.score+=gained;save();setMessage(p.type+' reagent! +'+gained+' points (streak '+game.combo+' landings)');$('labInfo').textContent='Collected: '+p.type+' reagent. '+p.txt+' contributed to your evolution.';for(let i=0;i<19;i++)particles.push({x,y:p.y,dx:rand(-115,115),dy:rand(-205,-30),life:rand(.4,.9),color:colors[p.type]});flash={type:'success',t:1.1};if(level()>prevLevel){playSound('level');setMessage('LEVEL UP! Platform movement: '+['','Stationary','Moving horizontally','Moving vertically','Moving in both axes','Fast mixed movement'][level()]);}update();setTimeout(()=>{flash=null;if(!game.done)evolve();update()},900)}
function fail(reason){consumeShotEffect();applyPendingPickup();game.shots++;lifeLoss(reason);flash={type:'fail',t:.8};setTimeout(()=>{flash=null;update()},700)}
function launch(){if(!angleLocked||game.done||ball||flash||(!($('overlay').classList.contains('hidden')&&!pickingSpecies)||pickingSpecies))return;angleLocked=false;playSound('launch');const s=speedFromPower(power);const a=angle*Math.PI/180;ball={x:118,y:389,vx:s*Math.cos(a),vy:-s*Math.sin(a),time:0,wind:effect.wind===0?0:(effect.wind>0?1:-1)*92};setMessage('Launched! Aim for a safe landing!');update()}
$('launch').onclick=launch;function setAngle(v){if(angleLocked||ball||flash||game.done)return;angle=clamp(Math.round(v),18,76);update()} $('angle').oninput=e=>setAngle(+e.target.value);$('angleDown').onclick=()=>setAngle(angle-5);$('angleUp').onclick=()=>setAngle(angle+5);$('lockAngle').onclick=()=>{if(ball||flash||game.done)return;angleLocked=!angleLocked;playSound('lock');setMessage(angleLocked?'Angle '+angle+'° locked! Time the power meter and launch!':'Angle unlocked. Adjust and lock again.');update()};$('restart').onclick=()=>modal('RESET EXPERIMENT','Start a new experiment?','Current reagents, score, and evolution progress will be reset.','','CHOOSE NEW SPECIES',()=>newGame());
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
 ctx.textAlign='left';ctx.fillStyle='#d1e0dc';ctx.font='11px system-ui';ctx.fillText('↑ Higher platforms need different launch power',22,30);ctx.fillStyle='#8ca3a7';ctx.font='10px system-ui';ctx.fillText('Land from above to collect a reagent',22,47);ctx.fillStyle='#f5d18f';ctx.font='bold 15px system-ui';ctx.fillText('LEVEL '+level()+'  /  '+['','STILL','HORIZONTAL','VERTICAL','DUAL MOTION','FAST MOTION'][level()],W-240,29);ctx.fillStyle='#bed7d1';ctx.font='bold 11px system-ui';ctx.fillText('FIXED CAMERA / TRAINING WIDTH ×1.65',W-260,48);
}
function tick(t){if(!last)last=t;const dt=document.hidden?0:clamp((t-last)/1000,0,.033);last=t;clock+=dt;if(!onTitle&&!game.done&&($('overlay').classList.contains('hidden')&&!pickingSpecies)){game.elapsed+=dt;if(Math.floor(game.elapsed)%10===0 && Math.floor(game.elapsed)!==lastSavedSecond){lastSavedSecond=Math.floor(game.elapsed);save();}}
 // Random appearance occurs during angle adjustment (before angle lock), not at launch.
 if(!onTitle&&!pickup&&!ball&&!flash&&!game.done&&!angleLocked&&($('overlay').classList.contains('hidden')&&!pickingSpecies)){
  pickupCountdown-=dt;
  if(pickupCountdown<=0){maybeSpawnPickup();pickupCountdown=7+Math.random()*14;}
 }
 const canMove=!onTitle&&angleLocked&&!game.done&&!ball&&!flash&&($('overlay').classList.contains('hidden')&&!pickingSpecies);if(canMove){power+=powerDir*dt*(level()===1?.42:level()===2?.56:.72);if(power>=1){power=2-power;powerDir=-1}if(power<=.1){power=.2-power;powerDir=1}}$('playtime').textContent=String(Math.floor(game.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(game.elapsed%60)).padStart(2,'0');$('powerFill').style.width=Math.round(power*100)+'%';$('powerMarker').style.left='calc('+Math.round(power*100)+'% - 2px)';$('powerTxt').textContent=Math.round(power*100)+'%';
 if(ball){const oldY=ball.y;ball.time+=dt;ball.x+=ball.vx*dt+.5*ball.wind*dt*dt;ball.vx+=ball.wind*dt;ball.y+=ball.vy*dt+.5*G*dt*dt;ball.vy+=G*dt;if(pickup&&Math.hypot(ball.x-pickup.x,ball.y-pickup.y)<33)collectPickup();let hit=null;if(ball.vy>0){for(const base of platforms){const p=modifiedPlatform(platformPosition(base,clock));const prev=modifiedPlatform(platformPosition(base,clock-dt));if(oldY+14<=prev.y+8 && ball.y+14>=p.y && ball.x>=p.x-6&&ball.x<=p.x+p.w+6){hit=p;break}}}if(hit){const x=ball.x,y=hit.y;ball=null;success(hit,x)}else if(ball.y>550||ball.x>990||ball.x< -40||ball.time>4.2){ball=null;fail('Missed the platform!')}}
 for(const p of particles){p.life-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;p.dy+=340*dt}particles=particles.filter(p=>p.life>0);draw();requestAnimationFrame(tick)}
 let saved=null;try{saved=localStorage.getItem('weird_launch_lab_v07')}catch(e){}game=load();pickup=game.done?null:loadPickup();update();setMessage('Choose a species, lock an angle and time your jump to collect reagents.');
 // Each title species button directly enters gameplay. There is no separate picker after START.
 function enterGame(){audio?.begin();onTitle=false;$('titleScreen').classList.add('hidden');update();}
 function populateTitle(){
   const cards=$('titleSpeciesCards');cards.innerHTML='';
   const hasProgress=!!saved&&!game.done&&kinds.includes(game.species);
   $('startFromTitle').classList.toggle('hidden',!hasProgress);
   $('titleChoiceLabel').textContent=hasProgress?'CONTINUE BELOW, OR START A NEW SPECIES':'CHOOSE A SPECIES TO START — ONE CLICK';
   kinds.forEach(species=>{
     const btn=document.createElement('button');btn.type='button';btn.className='titleSpeciesButton';
     const im=document.createElement('img');im.src=artPath(species,'base');im.alt='';
     const lbl=document.createElement('strong');lbl.textContent=species;
     const sub=document.createElement('small');sub.textContent=speciesNames[species];
     btn.append(im,lbl,sub);
     btn.setAttribute('aria-label','Start as '+speciesNames[species]);
     btn.onclick=()=>{audio?.begin();playSound('click');newGame(species);enterGame();};cards.appendChild(btn);
   });
 }
 populateTitle();
 $('startFromTitle').onclick=()=>{if(!game.done){enterGame();}};
 requestAnimationFrame(tick);
})();
