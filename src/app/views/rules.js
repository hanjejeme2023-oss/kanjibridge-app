import { t, tHtml } from '../../i18n/index.js';
import { $, $$, esc } from '../dom.js';
import { cleanTestResults } from '../lib/results.js';
import { shuffle } from '../lib/text.js';
import { S } from '../storage.js';
import { state } from '../state.js';
import { model } from '../data/instance.js';
import { kr } from '../lib/word.js';
import { beginTableTest, tableTestCell, bindTableTests } from '../ui/tableTest.js';
import { speak, stopSpeech, spk } from '../ui/speech.js';
import { updateCounts } from '../nav.js';

function saveRuleResult(key,lang,value){const row=state.ruleResults[key]||{};row[lang]=value;state.ruleResults[key]=row;S.set('kb_ruletest',state.ruleResults)}

function renderRules(preserve=false){
  beginTableTest();
  $('#rulebar').innerHTML=model.RULES.map(r=>{const d=(state.rprog[r.id]||[]).length;
    return `<button class="${r.id===state.ruleSel?'on':''}" data-id="${r.id}"><div class="r"><span class="ko">${r.kr}</span> → ${r.vi.map(v=>'-'+v).join('/')}</div><div class="p">${d}/${r.ex.length}</div></button>`}).join('');
  $$('#rulebar button').forEach(b=>b.onclick=()=>{state.ruleSel=b.dataset.id;state.quiz=null;renderRules();updateCounts()});
  const r=model.RULES.find(x=>x.id===state.ruleSel);
  if(!state.quiz)newQuiz(r);
  const e=state.quiz.e;
  const rows=r.ex.map(x=>{const key=`${r.id}:${x[0]}`,stored=state.ruleResults[key]||{};
    return `<tr><td class="han" style="font-size:22px">${x[0]}</td><td class="ko">${x[1]}</td><td>${x[2]}</td><td>${state.ruleTest?tableTestCell(key,'vi',[x[3]],[],stored.vi,false,(value)=>saveRuleResult(key,'vi',value)):`<b style="font-weight:600">${esc(x[3])}</b>${spk(x[3],'vi')}`}</td><td class="sub">${state.ruleTest?tableTestCell(key,'zh',[x[4]],[],stored.zh,false,(value)=>saveRuleResult(key,'zh',value)):`${esc(x[4])}${spk(x[0],'zh')}`}</td></tr>`}).join('');
  $('#ruledetail').innerHTML=`
    <div class="rulehead"><h2>${tHtml('rules.heading',{kr:`<span class="ko">${r.kr}</span>`,vi:r.vi.map(v=>'-'+v).join(' / ')})}</h2>
      <p>${esc(t('rules.compare',{jp:r.jp,zh:r.zh}))}</p></div>
    <div class="qcard">
      <div class="giant han">${e[0]}</div>
      <div class="readings"><span class="ko">${e[1]}</span><span class="sub">${e[2]}</span></div>
      <div class="opts">${state.quiz.opts.map((o,i)=>`<button class="pill ${state.quiz.ans?(o===e[3]?'right':(o===state.quiz.ans?'wrong':'')):''}" data-o="${esc(o)}"><span class="key">${i+1}</span>${esc(o)}</button>`).join('')}</div>
      <div class="after">${state.quiz.ans?`<div style="margin-bottom:16px" class="small sub">${tHtml('rules.answer_line',{vi:`${esc(e[3])}${spk(e[3],'vi')}`,zh:`${esc(e[4])}${spk(e[0],'zh')}`})}</div><button class="pill dark" id="qnext">${esc(t('rules.next'))}<span class="key">Enter</span></button>`:`<span class="sub small">${esc(t('rules.question'))}</span>`}</div>
    </div>
    <div style="margin:24px 0 10px;text-align:right"><button class="pill" id="ruletest" type="button">${esc(state.ruleTest?t('rules.test_stop'):t('rules.test_start'))}</button></div>
    <details ${state.ruleTest||S.get('kb_ex_open',false)?'open':''}><summary>${esc(t('rules.show_examples'))}</summary>
      <table><tr><th>${esc(t('rules.col_han'))}</th><th>${esc(t('lang.ko'))}</th><th>${esc(t('lang.ja'))}</th><th>${esc(t('lang.vi'))}</th><th>${esc(t('lang.zh'))}</th></tr>${rows}</table></details>`;
  $$('#ruledetail .opts button').forEach(b=>b.onclick=()=>pickRule(b.dataset.o));
  const details=$('#ruledetail details');
  // A language re-render must not persist the freshly recreated open details.
  let skipInitialToggle=preserve&&details.open;
  details.ontoggle=ev=>{const skip=skipInitialToggle&&ev.target.open;skipInitialToggle=false;if(!skip&&!state.ruleTest)S.set('kb_ex_open',ev.target.open)};
  $('#ruletest').onclick=()=>{state.ruleTest=!state.ruleTest;renderRules()};
  if(state.ruleTest)bindTableTests($('#ruledetail'));
  const n=$('#qnext');if(n){n.onclick=()=>{state.quiz=null;renderRules()};n.focus({preventScroll:true})}
}

function pickRule(o){
  if(state.quiz.ans)return;state.quiz.ans=o;
  if(state.autoplay){stopSpeech();speak(state.quiz.e[3],'vi',null,true)}
  if(o===state.quiz.e[3]){const a=state.rprog[state.ruleSel]||[];if(!a.includes(state.quiz.e[0]))a.push(state.quiz.e[0]);state.rprog[state.ruleSel]=a;S.set('kb_rules',state.rprog)}
  renderRules();
}

function newQuiz(r){
  const done=state.rprog[r.id]||[];const pool=r.ex.filter(e=>!done.includes(e[0]));const src=pool.length?pool:r.ex;
  const e=src[Math.floor(Math.random()*src.length)];
  const stem=e[3].replace(/(ng|nh|ch|c|p|t|n|m)$/,'');
  const alts=shuffle(['c','p','t','n','m','ng'].filter(f=>!r.vi.includes(f))).slice(0,2).map(f=>stem+f);
  state.quiz={e,opts:shuffle([e[3],...alts]),ans:null};
}

function initRules(){
state.ruleSel='k';
state.rprog=S.get('kb_rules',{});
state.quiz=null;
state.ruleTest=false;
state.ruleResults=cleanTestResults(S.get('kb_ruletest',{}));
}

export { saveRuleResult, renderRules, pickRule, newQuiz, initRules };
