/* WEIRD EVOLUTION! v0.24 — original procedural sci-fi laboratory soundtrack.
   No external audio assets or network calls. Works offline; starts only after input. */
(()=>{'use strict';
const KEY='weird_evolution_audio_v24';let preference={bgm:true,sfx:true};
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&typeof saved==='object'){if(typeof saved.bgm==='boolean')preference.bgm=saved.bgm;if(typeof saved.sfx==='boolean')preference.sfx=saved.sfx;}}catch(_){}
let ctx=null,master=null,musicBus=null,sfxBus=null,timer=null,next=0,step=0,unlockPromise=null,lastGesture=0;
const AudioCtx=window.AudioContext||window.webkitAudioContext;
function setup(){if(!AudioCtx)return false;if(ctx)return true;try{ctx=new AudioCtx();master=ctx.createGain();master.gain.value=.85;master.connect(ctx.destination);ctx.onstatechange=()=>{if(ctx.state==='running')startMusic();else if(timer){clearInterval(timer);timer=null;}};musicBus=ctx.createGain();musicBus.gain.value=.55;musicBus.connect(master);sfxBus=ctx.createGain();sfxBus.gain.value=.60;sfxBus.connect(master);return true;}catch(_){ctx=null;return false}}
function tone(freq,when,duration,type='sine',gain=.15,bus=sfxBus,endFreq=null){if(!ctx||!bus||!Number.isFinite(freq))return;const osc=ctx.createOscillator(),env=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(Math.max(30,freq),when);if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(30,endFreq),when+duration);env.gain.setValueAtTime(.0001,when);env.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),when+.012);env.gain.exponentialRampToValueAtTime(.0001,when+duration);osc.connect(env);env.connect(bus);osc.start(when);osc.stop(when+duration+.02)}
function scheduler(){if(!ctx||ctx.state!=='running'||!preference.bgm)return;const now=ctx.currentTime;if(next<now)next=now+.04;const bass=[110,110,98,98,130.81,130.81,98,82.41];const notes=[220,261.63,329.63,261.63,196,246.94,293.66,246.94,220,261.63,349.23,329.63,196,246.94,293.66,220];while(next<now+.24){const idx=step%16; if(idx%2===0)tone(bass[Math.floor(idx/2)],next,.55,'triangle',.16,musicBus);tone(notes[idx],next+.035,.2,'sine',.095,musicBus);if(idx===7||idx===15)tone(440,next+.06,.12,'sine',.025,musicBus);step++;next+=.37;}}
// iOS Safari: AudioContext must be resumed directly inside a trusted user gesture.
// A one-sample silent buffer makes the audio graph active without adding a test button.
function primeFromGesture(){
 if(!setup())return;
 lastGesture=Date.now();
 try{
  const source=ctx.createBufferSource();
  source.buffer=ctx.createBuffer(1,1,ctx.sampleRate);
  source.connect(master);
  source.start(0);
 }catch(_){}
 try{
  if(ctx.state!=='running'){
   const pending=ctx.resume();
   if(pending&&typeof pending.then==='function'){
    unlockPromise=pending.then(()=>{unlockPromise=null;startMusic();return ctx.state==='running'}).catch(()=>{unlockPromise=null;return false});
   }
  }
 }catch(_){}
 startMusic();
}
function startMusic(){
 if(!ctx||ctx.state!=='running'||!preference.bgm||document.hidden||timer)return;
 next=ctx.currentTime+.04;
 scheduler();
 timer=setInterval(scheduler,100);
}
function begin(){
 if(!setup())return Promise.resolve(false);
 if(ctx.state==='running'){startMusic();return Promise.resolve(true)}
 if(unlockPromise)return unlockPromise;
 try{
  const pending=ctx.resume();
  unlockPromise=Promise.resolve(pending).then(()=>{
   unlockPromise=null;
   if(ctx.state==='running'){startMusic();return true}
   return false;
  }).catch(()=>{unlockPromise=null;return false});
  return unlockPromise;
 }catch(_){unlockPromise=null;return Promise.resolve(false)}
}
function halt(){
 if(timer){clearInterval(timer);timer=null;}
 // Do not call suspend(): iOS Safari can refuse to resume after a tab switches.
 // Only stop scheduling, so audio can resume at the next gesture/visibility change.
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(preference))}catch(_){}}
function toggle(key){preference[key]=!preference[key];persist();if(key==='bgm'){if(preference.bgm)begin();else if(timer){clearInterval(timer);timer=null;}}else if(preference.sfx)begin();return preference[key]}
function effect(name){if(!preference.sfx||!setup()||document.hidden)return;if(ctx.state!=='running'){begin().then(ok=>{if(ok)effect(name)});return;}let t=ctx.currentTime+.005;
switch(name){
 case 'click':tone(480,t,.06,'sine',.09);break;
 case 'lock':tone(380,t,.08,'triangle',.11);tone(570,t+.075,.13,'sine',.09);break;
 case 'launch':tone(160,t,.36,'sawtooth',.15,sfxBus,570);tone(330,t+.09,.22,'sine',.08,sfxBus,650);break;
 case 'land':tone(310,t,.1,'triangle',.19);tone(460,t+.08,.19,'sine',.13);break;
 case 'miss':tone(330,t,.28,'triangle',.15,sfxBus,110);break;
 case 'pickup':tone(590,t,.09,'sine',.12);tone(790,t+.08,.11,'sine',.13);tone(1180,t+.17,.22,'sine',.10);break;
 case 'evolve':for(let i=0;i<5;i++)tone([220,293.66,369.99,440,587.33][i],t+i*.12,.42,'triangle',.11);break;
 case 'rare':for(let i=0;i<8;i++)tone([261.63,329.63,392,523.25,659.25,783.99,1046.5,1318.5][i],t+i*.15,.7,'sine',.16);break;
 case 'level':tone(440,t,.18,'sine',.12);tone(660,t+.14,.22,'sine',.13);break;
 case 'fail':tone(240,t,.3,'triangle',.14,sfxBus,100);tone(130,t+.25,.4,'sine',.09);break;
 }}
async function test(){
 const ok=await begin();
 if(ok){tone(660,ctx.currentTime+.01,.25,'sine',.20,sfxBus);return true}
 return false;
}
function state(){return {...preference,supported:!!AudioCtx,contextState:ctx?.state||'not-created',musicPlaying:!!timer}}
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)halt();
 else if(ctx){begin();}
});
if(typeof window.addEventListener==='function'){
 window.addEventListener('pageshow',()=>{if(ctx)begin()});
 window.addEventListener('focus',()=>{if(ctx)begin()});
}
// iPhone Safari and CrazyGames iframe: unlock on the actual tap event, not only after click callbacks.
for(const type of ['touchstart','touchend','pointerdown','mousedown','click','keydown']){
 document.addEventListener(type,primeFromGesture,{capture:true,passive:true});
}
window.WeirdAudio={begin,halt,toggle,effect,state,test};
})();
