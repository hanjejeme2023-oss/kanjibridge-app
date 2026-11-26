import { state } from './state.js';
import { speak, stopSpeech } from './ui/speech.js';
import { doFlip, rate } from './views/cards.js';
import { renderRules, pickRule } from './views/rules.js';
import { rateFFCard, renderFF } from './views/ff.js';

function initKeyboard(){
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='SELECT')return;
  if(e.target.tagName==='INPUT'&&e.target.type!=='checkbox')return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const n=['1','2','3','4'].indexOf(e.key);
  if(state.view==='cards'&&state.flipped&&n>=0){e.preventDefault();rate(n);return}
  if(state.view==='cards'&&state.flipped&&state.cur){const k=e.key.toLowerCase();
    if(k==='v'&&state.target!=='zh'){e.preventDefault();stopSpeech();speak(state.cur.v,'vi');return}
    if(k==='c'&&state.target!=='vi'){e.preventDefault();stopSpeech();speak(state.cur.z,'zh');return}}
  if(state.view==='cards'&&!state.flipped&&state.cur&&(e.key==='Enter'||e.key===' ')){e.preventDefault();doFlip();return}
  if(state.view==='ff'&&state.ffmode==='cards'){
    if(!state.ffflipped&&(e.key==='Enter'||e.key===' ')){e.preventDefault();state.ffflipped=true;renderFF();return}
    if(state.ffflipped&&(e.key==='1'||e.key==='2')){e.preventDefault();rateFFCard(e.key==='2');return}
  }
  if(state.view==='rules'&&state.quiz){
    if(!state.quiz.ans&&n>=0&&n<state.quiz.opts.length){e.preventDefault();pickRule(state.quiz.opts[n]);return}
    if(state.quiz.ans&&(e.key==='Enter'||e.key===' ')){e.preventDefault();state.quiz=null;renderRules();return}
  }
});
}

export { initKeyboard };
