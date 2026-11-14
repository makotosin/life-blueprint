/* WEIRD EVOLUTION! v0.31 - iOS media-element audio.
   This deliberately uses HTMLAudioElement + WAV files, following the working
   MOLE POP iPhone strategy. No oscillator-based Web Audio dependency. */
(()=>{'use strict';
const KEY='weird_evolution_audio_v24';
let preference={bgm:true,sfx:true};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s==='object')for(const k of ['bgm','sfx'])if(typeof s[k]==='boolean')preference[k]=s[k]}catch(_){}
const music=new Audio('audio/lab_bgm.wav');
music.preload='auto';music.loop=true;music.volume=.74;music.playsInline=true;
const names=['click','lock','launch','land','miss','pickup','evolve','rare','level','fail'];
const bank={};const indices={};
for(const k of names){bank[k]=[];indices[k]=0;for(let i=0;i<3;i++){
 const a=new Audio('audio/'+k+'.wav');a.preload='auto';a.volume=.85;a.playsInline=true;bank[k].push(a);
}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(preference))}catch(_){}}
function safePlay(a){try{const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_){}}
function begin(){if(!preference.bgm||document.hidden)return;safePlay(music)}
function halt(){music.pause()}
function toggle(key){if(key!=='bgm'&&key!=='sfx')return false;
 preference[key]=!preference[key];persist();
 if(key==='bgm'){if(preference.bgm)begin();else halt()}
 return preference[key];
}
function effect(name){if(!preference.sfx||document.hidden||!bank[name])return;
 const pool=bank[name],i=indices[name]++%pool.length,a=pool[i];
 try{a.pause();a.currentTime=0;}catch(_){}
 safePlay(a);
}
function state(){return {...preference,supported:true,contextState:music.paused?'paused':'playing',musicPlaying:!music.paused}}
// Call media.play() synchronously from real user input, including a tap in the embedded frame.
// Do not suspend the playback engine and do not rely on a resolved promise for first audio.
let lastStart=0;
function gesture(){if(!preference.bgm||document.hidden||!music.paused)return;
 const now=Date.now();if(now-lastStart<250)return;lastStart=now;begin();
}
for(const k of ['touchend','pointerup','click','keydown'])document.addEventListener(k,gesture,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});
window.addEventListener('pagehide',halt);
window.WeirdAudio={begin,halt,toggle,effect,state};
})();
