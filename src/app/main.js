import './styles.css';
import { localeMeta, t, tHtml } from '../i18n/index.js';

import { buildModel } from './data/model.js';
import { $, $$, esc } from './dom.js';
import { appendFFMiss, ffExampleRow, newFFRoundIds, orderedFFPool, passageChecked } from './lib/ff.js';
import { judge, splitAnswerParts } from './lib/judge.js';
import { cleanFFStats, cleanTestResults, resultValue } from './lib/results.js';
import { shuffle, splitVals, strip } from './lib/text.js';
import { markedTone, toneHint } from './lib/tone.js';
import { S } from './storage.js';

const {
  WORD_BY_ID, RAW_WORD_BY_ID, WORDS, EXAMPLES, RULES, NONE_RULE, FF, PASSAGES,
  CHAR_NOTES, USAGE, GLYPHS,
} = buildModel(window.KB_DATA);

function initApp() {
let TABLE_TEST_CELLS=new Map();
function beginTableTest(){TABLE_TEST_CELLS=new Map()}
function tableTestCell(key,lang,readings,viAlt,saved,several,onAnswer){
  const id=`${key}:${lang}`,state=resultValue(saved),values=(readings||[]).filter(Boolean);
  TABLE_TEST_CELLS.set(id,{lang,readings:values,viAlt:viAlt||[],several:!!several,onAnswer});
  return `<div class="table-test"><div class="tone-hint">${esc(toneHint(lang,values))}</div><input data-test-cell="${esc(id)}" class="${state===1?'ok':state===0?'ng':''}" autocomplete="off" spellcheck="false"><div class="test-result"></div></div>`;
}
function focusNextTest(input){let all=[...document.querySelectorAll('input[data-test-cell]')];const i=all.indexOf(input);
  if(i>=0&&!all[i+1]){for(const job of CHUNKS.values())if(job.box.contains(input))appendChunk(job,job.size);all=[...document.querySelectorAll('input[data-test-cell]')]}
  if(i>=0&&all[i+1])all[i+1].focus()}
function answerTableCell(input){
  const cfg=TABLE_TEST_CELLS.get(input.dataset.testCell);if(!cfg||!input.value.trim())return null;
  const right=judge(input.value,cfg.lang,cfg.readings,cfg.viAlt,cfg.several)==='ok',value=right?1:0;
  input.classList.remove('ok','ng');input.classList.add(right?'ok':'ng');input.dataset.judged='1';
  const out=input.parentElement.querySelector('.test-result');out.className=`test-result ${right?'ok':'ng'}`;out.textContent=right?t('common.correct'):cfg.readings.join(' / ');
  cfg.onAnswer(value,input.value);return value;
}
function bindTableTests(root){
  const inputs=[...root.querySelectorAll('input[data-test-cell]')];
  inputs.forEach(input=>{input.oninput=()=>{delete input.dataset.judged;const out=input.parentElement.querySelector('.test-result');out.className='test-result';out.textContent=''};
    input.onblur=()=>{if(!input.dataset.judged)answerTableCell(input)};
    input.onkeydown=e=>{if(e.key==='Enter'||(e.key===' '&&input.dataset.judged)){e.preventDefault();if(input.dataset.judged)focusNextTest(input);else answerTableCell(input)}};
  });
}
const viFinal=s=>{const m=strip(s).match(/(ng|nh|ch|c|p|t|n|m)$/);return m?m[1]:''};
function ruleTags(w){
  if(!w.syl)return'';
  return w.syl.map(pair=>{
    const ch=(pair.ko_syllable||'').replace(/[（）()]/g,''),vi=pair.vi_syllable||'';
    const code=ch.charCodeAt(0)-0xAC00;if(code<0||code>11171)return'';
    const jong=code%28,r=jong===0?NONE_RULE:RULES.find(x=>x.jong===jong);if(!r)return'';
    const ok=r.vi.includes(viFinal(vi));
    return `<span class="tag ${ok?'':'off'}">${tHtml('rules.tag',{ko:`<span class="ko">${ch}</span>`,vi:esc(vi),label:ok?esc(r.label):esc(t('rules.exception'))})}</span>`;
  }).join('');
}

/* speech (Web Speech API) */
const SPK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const TTS={ok:typeof window.speechSynthesis!=='undefined',voices:[],warned:new Set()};
const LNAME={zh:t('lang.zh'),vi:t('lang.vi')};
let mute=S.get('kb_mute',false);
function syncMute(){$('#mute').classList.toggle('on',mute);$('#mute').setAttribute('aria-pressed',mute)}
$('#mute').onclick=()=>{mute=!mute;S.set('kb_mute',mute);if(mute)stopSpeech();syncMute()};syncMute();
function loadVoices(){if(!TTS.ok)return;try{TTS.voices=speechSynthesis.getVoices()||[]}catch(e){}}
if(TTS.ok){loadVoices();try{speechSynthesis.addEventListener('voiceschanged',loadVoices)}catch(e){}}
function pickVoice(lang){
  const vs=TTS.voices.filter(v=>{const l=(v.lang||'').toLowerCase().replace('_','-');
    return lang==='zh'?(l.startsWith('zh-cn')||l==='zh'||l.startsWith('cmn')||(l.startsWith('zh')&&!/hk|tw|yue/.test(l))):l.startsWith('vi')});
  const score=v=>(/natural/i.test(v.name)?4:0)+(/online|google/i.test(v.name)?2:0)+((v.lang||'').toLowerCase().replace('_','-')===(lang==='zh'?'zh-cn':'vi-vn')?1:0);
  return vs.sort((a,b)=>score(b)-score(a))[0]||null;
}
let toastT;
function toast(msg){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}
  el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.add('hidden'),7000)}
function speak(text,lang,btn,quiet){
  if(mute)return;
  if(!TTS.ok){if(!quiet)toast(t('speech.unsupported'));return}
  loadVoices();
  const v=pickVoice(lang);
  if(!v){if(!quiet||!TTS.warned.has(lang)){TTS.warned.add(lang);toast(t('speech.no_voice',{lang:LNAME[lang]}))}return}
  try{
    const u=new SpeechSynthesisUtterance(text);u.voice=v;u.lang=v.lang;u.rate=0.85;
    if(btn){btn.classList.add('on');u.onend=u.onerror=()=>btn.classList.remove('on')}
    speechSynthesis.speak(u);
  }catch(e){if(!quiet)toast(t('speech.failed'))}
}
function stopSpeech(){try{TTS.ok&&speechSynthesis.cancel()}catch(e){}}
const spk=(text,lang)=>`<button class="spk" type="button" data-say="${esc(text)}" data-lang="${lang}" aria-label="${esc(t('speech.play_in',{lang:LNAME[lang]}))}" title="${esc(t('speech.play_in',{lang:LNAME[lang]}))}">${SPK_SVG}</button>`;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.spk');if(!b)return;e.stopPropagation();e.preventDefault();stopSpeech();speak(b.dataset.say,b.dataset.lang,b)},true);
let autoplay=S.get('kb_auto',true);
function syncAuto(){$('#autoplay').classList.toggle('on',autoplay);$('#autoplay').setAttribute('aria-pressed',autoplay)}
$('#autoplay').onclick=()=>{autoplay=!autoplay;S.set('kb_auto',autoplay);syncAuto()};
syncAuto();

/* nav */
let view='cards';
$$('#nav button').forEach(b=>b.onclick=()=>{
  if(view==='read'&&b.dataset.v!=='read')markPassageRead(pid);
  view=b.dataset.v;stopSpeech();
  $$('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  $$('main>section').forEach(s=>s.classList.toggle('hidden',s.id!=='v-'+view));
  render();
});
function clearUnknown(wordId){const rows=S.get('kb_unknown',[]),next=Array.isArray(rows)?rows.filter(id=>id!==wordId):[];S.set('kb_unknown',next)}
function filteredGlyphs(){return GLYPHS.filter(g=>{
  if(gfil==='all')return true;
  if(gfil==='wrong')return Object.values(gresults[g[7]]||{}).some(value=>value===0);
  if(gfil.startsWith('level-'))return g[9]===+gfil.slice(6);
  return pat(g)===gfil;
})}
function updateCounts(){
  const counts={cards:deck().filter(targetOk).length,
    rules:(RULES.find(x=>x.id===ruleSel)||{ex:[]}).ex.length,
    ff:ffmode==='cards'?ffPool(fflang).length:FF.filter(f=>fff==='all'||f.traps.includes(fff)).length,
    read:PASSAGES.length,glyph:filteredGlyphs().length};
  Object.entries(counts).forEach(([key,value])=>{const el=$(`#count-${key}`);if(el)el.textContent=value.toLocaleString('ja-JP')});
}
/* chunked list rendering (R1, RELEASE_PLAN 1.2): the first screen at once, the rest in short
   idle-time steps; the final DOM equals one innerHTML of the whole list */
const CHUNKS=new Map();
function cancelChunks(name){(name?[name]:[...CHUNKS.keys()]).forEach(k=>{const job=CHUNKS.get(k);if(job){clearTimeout(job.timer);CHUNKS.delete(k)}})}
function appendChunk(job,count){const end=Math.min(job.items.length,job.next+count);if(end<=job.next)return;
  const t=document.createElement('template');t.innerHTML=job.items.slice(job.next,end).map(job.row).join('');
  job.bind(t.content);job.box.appendChild(t.content);job.next=end}
function chunkStep(name){const job=CHUNKS.get(name);if(!job)return;const now=performance.now();
  /* the gap since the last step includes the browser's layout of that step: aim at about 50 ms per step */
  if(job.last)job.size=Math.max(20,Math.min(500,Math.round(job.size*50/Math.max(now-job.last,1))));job.last=now;
  appendChunk(job,job.size);
  if(job.next<job.items.length)job.timer=setTimeout(()=>chunkStep(name),0);else CHUNKS.delete(name)}
function renderChunked(name,box,lead,items,row,bind){
  cancelChunks(name);const first=Math.min(items.length,30);
  box.innerHTML=lead+items.slice(0,first).map(row).join('');bind(box);
  if(first<items.length){const job={box,items,row,bind,next:first,size:100,last:0,timer:0};CHUNKS.set(name,job);job.timer=setTimeout(()=>chunkStep(name),0)}}
function flushChunks(name){(name?[name]:[...CHUNKS.keys()]).forEach(k=>{const job=CHUNKS.get(k);if(!job)return;clearTimeout(job.timer);appendChunk(job,job.items.length);CHUNKS.delete(k)})}
function ensureChunk(name,index){const job=CHUNKS.get(name);if(job&&index>=job.next)appendChunk(job,index+1-job.next)}
function render(){cancelChunks();({cards:renderCards,rules:renderRules,ff:renderFF,read:renderRead,glyph:renderGlyph})[view]();topStat();updateCounts()}

/* 1. cards */
const DAY=86400000, IV=[0,1,3,7,14,30];
const ALL_WORD_IDS=new Set(WORD_BY_ID.keys());
const rawSrs=S.get('kb_srs',{}), rawCustom=S.get('kb_custom',[]);
let srs=Object.fromEntries(Object.entries(rawSrs).filter(([id,v])=>ALL_WORD_IDS.has(id)&&v&&typeof v==='object'));
let custom=[...new Set(rawCustom.filter(id=>typeof id==='string'&&ALL_WORD_IDS.has(id)))];
let target=S.get('kb_target','vi');
const localDay=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`};
let newToday=S.get('kb_newtoday',{date:localDay(),ids:[]});
if(!newToday||newToday.date!==localDay()||!Array.isArray(newToday.ids))newToday={date:localDay(),ids:[]};
newToday.ids=[...new Set(newToday.ids.filter(id=>ALL_WORD_IDS.has(id)))];S.set('kb_newtoday',newToday);
let cur=null, flipped=false, guess={vi:'',zh:''}, doneToday=0;
const customWords=()=>custom.map(id=>WORD_BY_ID.get(id)).filter(Boolean);
const deck=()=>{const seen=new Set(WORDS.map(w=>w.id));return WORDS.concat(customWords().filter(w=>!seen.has(w.id)))};
const targetOk=w=>target==='vi'?!!w.v:target==='zh'?!!w.p:!!w.v&&!!w.p;
const due=()=>{const now=Date.now(),d=deck().filter(targetOk),available=new Set(d.map(w=>w.id)),introduced=new Set(newToday.ids.filter(id=>available.has(id)));
  const reviews=d.filter(w=>srs[w.id]&&srs[w.id].due<=now);
  const pending=d.filter(w=>!srs[w.id]&&introduced.has(w.id));
  const slots=Math.max(0,20-introduced.size),fresh=d.filter(w=>!srs[w.id]&&!introduced.has(w.id)).slice(0,slots);
  return reviews.concat(pending,fresh).sort((a,b)=>((srs[a.id]||{}).due||0)-((srs[b.id]||{}).due||0))};
function introduce(w){if(srs[w.id]||newToday.ids.includes(w.id))return;newToday.ids.push(w.id);S.set('kb_newtoday',newToday)}
function topStat(){const d=deck();const learned=d.filter(w=>srs[w.id]&&srs[w.id].box>=3).length;$('#topstat').textContent=t('header.topstat',{due:due().length,learned,total:d.length})}
$$('#target button').forEach(b=>{b.classList.toggle('on',b.dataset.t===target);b.onclick=()=>{target=b.dataset.t;S.set('kb_target',target);$$('#target button').forEach(x=>x.classList.toggle('on',x===b));flipped=false;renderCards();topStat();updateCounts()}});
const markedTarget=x=>`${esc(x.sentence.slice(0,x.start))}<mark>${esc(x.sentence.slice(x.start,x.start+x.len))}</mark>${esc(x.sentence.slice(x.start+x.len))}`;
function cardExample(w,lang){const x=EXAMPLES.get(`${w.id}:${lang}:card`);if(!x)return'';
  return `<div class="example"><div class="small sub">${esc(lang==='zh'?t('lang.zh'):t('lang.vi'))}</div><div class="${lang==='zh'?'zh':''}">${markedTarget(x)}</div>${lang==='zh'?`<div>${esc(x.pinyin)}</div>`:''}<div class="translation">${esc(x.translation)}</div></div>`}
const cardExamples=(w,showVi,showZh)=>{const rows=[showZh?cardExample(w,'zh'):'',showVi?cardExample(w,'vi'):''].filter(Boolean);return rows.length?`<div class="examples">${rows.join('')}</div>`:''};
function renderCards(){
  const q=due();
  $('#queueinfo').textContent=q.length?t('cards.queue',{n:q.length}):'';
  const total=q.length+doneToday;$('#prog').style.width=(total?doneToday/total*100:100)+'%';
  if(!cur||!q.find(w=>w.id===cur.id)&&!flipped){cur=q[0]||null;flipped=false;guess={vi:'',zh:''};if(cur)introduce(cur)}
  if(!cur){$('#cardbox').innerHTML=`<div class="done"><h2>${esc(t('cards.done_title'))}</h2><p class="sub">${esc(t('cards.done_text'))}</p></div>`;return}
  const w=cur, showVi=target!=='zh', showZh=target!=='vi';
  const front=`<div class="giant han">${esc(w.j)}</div>
    ${w.h!==w.j?`<div class="alt">${esc(t('cards.korean_hanja',{h:w.h}))}</div>`:''}
    <div class="readings"><span>${esc(w.jr)}</span><span class="ko">${esc(w.k)}</span></div>`;
  if(!flipped){
    $('#cardbox').innerHTML=`<div class="stage">${front}
      <div class="answer-in">
        ${showVi?`<label class="field"><span>${esc(t('lang.vi'))}</span><div class="tone-hint">${toneHint('vi',[w.v])}</div><input id="gvi" autocomplete="off" spellcheck="false" placeholder="${esc(t('cards.guess_placeholder'))}"></label>`:''}
        ${showZh?`<label class="field"><span>${esc(t('lang.zh_pinyin'))}</span><div class="tone-hint">${toneHint('zh',[w.p],w.pt)}</div><input id="gzh" autocomplete="off" spellcheck="false" placeholder="${esc(t('cards.guess_placeholder'))}"></label>`:''}
        <div><button class="pill dark" id="flip">${esc(t('cards.show_answer'))}<span class="key">Enter</span></button></div>
        <div class="sub small">${esc(t('cards.no_tone_ok'))}</div>
      </div></div>`;
    const f=$('#gvi')||$('#gzh');if(f)f.focus();
    $$('#cardbox input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();doFlip()}});
    $('#flip').onclick=doFlip;return;
  }
  const vt=(r,answer)=>r===null?`<div class="you sub">${esc(t('cards.no_input'))}</div>`:r==='ok'?`<div class="you ok">${esc(t('common.correct'))}</div>`:`<div class="you ng">${esc(answer)}</div>`;
  const yours=s=>s?`<div class="you sub">${esc(t('cards.yours',{s}))}</div>`:'';
  const metaRule=showVi?ruleTags(w):'';
  const metaGlyph=w.z!==w.j?`<span class="tag off">${tHtml('cards.glyph_tag',{j:esc(w.j),h:`<span class="ko">${esc(w.h)}</span>`,z:`<span class="zh">${esc(w.z)}</span>`})}</span>`:'';
  $('#cardbox').innerHTML=`<div class="stage">${front}
    <div class="reveal">
      <div class="ans">
        ${showVi?`<div><div class="lang">${esc(t('lang.vi'))}</div><div class="val">${esc(w.v)}${spk(w.v,'vi')}</div>${yours(guess.vi)}${vt(judge(guess.vi,'vi',[w.v],w.va||[]),w.v)}</div>`:''}
        ${showZh?`<div><div class="lang">${esc(t('lang.zh'))}</div><div class="val"><span class="zh">${esc(w.z)}</span> ${esc(w.p)}${spk(w.z,'zh')}</div>${yours(guess.zh)}${vt(judge(guess.zh,'zh',[w.p]),w.p)}</div>`:''}
      </div>
      <div class="meta">${metaRule}${metaGlyph}</div>
      ${cardExamples(w,showVi,showZh)}
      <div class="rate">
        <button class="pill" data-r="0"><span class="key">1</span>${esc(t('cards.rate_again'))}<small>${esc(t('cards.interval_now'))}</small></button>
        <button class="pill" data-r="1"><span class="key">2</span>${esc(t('cards.rate_hard'))}<small>${ivLabel(1)}</small></button>
        <button class="pill" data-r="2"><span class="key">3</span>${esc(t('cards.rate_ok'))}<small>${ivLabel(2)}</small></button>
        <button class="pill" data-r="3"><span class="key">4</span>${esc(t('cards.rate_easy'))}<small>${ivLabel(3)}</small></button>
      </div>
      <div class="sub small" style="margin-top:14px">${[showVi?`<span class="key">V</span>${esc(t('cards.play_vi'))}`:'',showZh?`<span class="key">C</span>${esc(t('cards.play_zh'))}`:''].filter(Boolean).join(t('cards.play_sep'))}</div>
    </div></div>`;
  $$('.rate button').forEach(b=>b.onclick=()=>rate(+b.dataset.r));
}
function nextBox(r){const b=(srs[cur.id]||{box:0}).box;return r===0?0:r===1?Math.max(b,1):r===2?Math.min(b+1,5):Math.min(b+2,5)}
function ivLabel(r){const d=IV[nextBox(r)];return d===0?t('cards.interval_now'):t('cards.interval_days',{n:d})}
function doFlip(){guess.vi=($('#gvi')||{}).value||'';guess.zh=($('#gzh')||{}).value||'';
  const viRight=target==='zh'||judge(guess.vi,'vi',[cur.v],cur.va||[])==='ok',zhRight=target==='vi'||judge(guess.zh,'zh',[cur.p])==='ok';
  if(viRight&&zhRight)clearUnknown(cur.id);flipped=true;renderCards();
  if(autoplay&&cur){stopSpeech();if(target!=='zh')speak(cur.v,'vi',null,true);if(target!=='vi')speak(cur.z,'zh',null,true)}}
function rate(r){
  stopSpeech();
  const box=nextBox(r);
  srs[cur.id]={box,due:r===0?Date.now()+60000:Date.now()+IV[box]*DAY-3600000};
  if(r!==0)doneToday++;
  S.set('kb_srs',srs);
  const q=due().filter(w=>w.id!==cur.id);
  if(r===0&&q.length===0)srs[cur.id].due=0;
  cur=q[0]||(r===0?cur:null);flipped=false;guess={vi:'',zh:''};
  renderCards();topStat();
}

/* 2. rules */
let ruleSel='k', rprog=S.get('kb_rules',{}), quiz=null, ruleTest=false;
let ruleResults=cleanTestResults(S.get('kb_ruletest',{}));
function saveRuleResult(key,lang,value){const row=ruleResults[key]||{};row[lang]=value;ruleResults[key]=row;S.set('kb_ruletest',ruleResults)}
function renderRules(){
  beginTableTest();
  $('#rulebar').innerHTML=RULES.map(r=>{const d=(rprog[r.id]||[]).length;
    return `<button class="${r.id===ruleSel?'on':''}" data-id="${r.id}"><div class="r"><span class="ko">${r.kr}</span> → ${r.vi.map(v=>'-'+v).join('/')}</div><div class="p">${d}/${r.ex.length}</div></button>`}).join('');
  $$('#rulebar button').forEach(b=>b.onclick=()=>{ruleSel=b.dataset.id;quiz=null;renderRules();updateCounts()});
  const r=RULES.find(x=>x.id===ruleSel);
  if(!quiz)newQuiz(r);
  const e=quiz.e;
  const rows=r.ex.map(x=>{const key=`${r.id}:${x[0]}`,stored=ruleResults[key]||{};
    return `<tr><td class="han" style="font-size:22px">${x[0]}</td><td class="ko">${x[1]}</td><td>${x[2]}</td><td>${ruleTest?tableTestCell(key,'vi',[x[3]],[],stored.vi,false,(value)=>saveRuleResult(key,'vi',value)):`<b style="font-weight:600">${esc(x[3])}</b>${spk(x[3],'vi')}`}</td><td class="sub">${ruleTest?tableTestCell(key,'zh',[x[4]],[],stored.zh,false,(value)=>saveRuleResult(key,'zh',value)):`${esc(x[4])}${spk(x[0],'zh')}`}</td></tr>`}).join('');
  $('#ruledetail').innerHTML=`
    <div class="rulehead"><h2>${tHtml('rules.heading',{kr:`<span class="ko">${r.kr}</span>`,vi:r.vi.map(v=>'-'+v).join(' / ')})}</h2>
      <p>${esc(t('rules.compare',{jp:r.jp,zh:r.zh}))}</p></div>
    <div class="qcard">
      <div class="giant han">${e[0]}</div>
      <div class="readings"><span class="ko">${e[1]}</span><span class="sub">${e[2]}</span></div>
      <div class="opts">${quiz.opts.map((o,i)=>`<button class="pill ${quiz.ans?(o===e[3]?'right':(o===quiz.ans?'wrong':'')):''}" data-o="${esc(o)}"><span class="key">${i+1}</span>${esc(o)}</button>`).join('')}</div>
      <div class="after">${quiz.ans?`<div style="margin-bottom:16px" class="small sub">${tHtml('rules.answer_line',{vi:`${esc(e[3])}${spk(e[3],'vi')}`,zh:`${esc(e[4])}${spk(e[0],'zh')}`})}</div><button class="pill dark" id="qnext">${esc(t('rules.next'))}<span class="key">Enter</span></button>`:`<span class="sub small">${esc(t('rules.question'))}</span>`}</div>
    </div>
    <div style="margin:24px 0 10px;text-align:right"><button class="pill" id="ruletest" type="button">${esc(ruleTest?t('rules.test_stop'):t('rules.test_start'))}</button></div>
    <details ${ruleTest||S.get('kb_ex_open',false)?'open':''}><summary>${esc(t('rules.show_examples'))}</summary>
      <table><tr><th>${esc(t('rules.col_han'))}</th><th>${esc(t('lang.ko'))}</th><th>${esc(t('lang.ja'))}</th><th>${esc(t('lang.vi'))}</th><th>${esc(t('lang.zh'))}</th></tr>${rows}</table></details>`;
  $$('#ruledetail .opts button').forEach(b=>b.onclick=()=>pickRule(b.dataset.o));
  $('#ruledetail details').ontoggle=ev=>{if(!ruleTest)S.set('kb_ex_open',ev.target.open)};
  $('#ruletest').onclick=()=>{ruleTest=!ruleTest;renderRules()};
  if(ruleTest)bindTableTests($('#ruledetail'));
  const n=$('#qnext');if(n){n.onclick=()=>{quiz=null;renderRules()};n.focus({preventScroll:true})}
}
function pickRule(o){
  if(quiz.ans)return;quiz.ans=o;
  if(autoplay){stopSpeech();speak(quiz.e[3],'vi',null,true)}
  if(o===quiz.e[3]){const a=rprog[ruleSel]||[];if(!a.includes(quiz.e[0]))a.push(quiz.e[0]);rprog[ruleSel]=a;S.set('kb_rules',rprog)}
  renderRules();
}
function newQuiz(r){
  const done=rprog[r.id]||[];const pool=r.ex.filter(e=>!done.includes(e[0]));const src=pool.length?pool:r.ex;
  const e=src[Math.floor(Math.random()*src.length)];
  const stem=e[3].replace(/(ng|nh|ch|c|p|t|n|m)$/,'');
  const alts=shuffle(['c','p','t','n','m','ng'].filter(f=>!r.vi.includes(f))).slice(0,2).map(f=>stem+f);
  quiz={e,opts:shuffle([e[3],...alts]),ans:null};
}

/* 3. false friends */
function ffLine(row){const reading=row.reading?(row.meaning&&!/^（.*）$/.test(row.reading)?t('ff.reading_paren',{r:row.reading}):row.reading):'';
  return `<div><b>${row.label}</b>${esc(row.meaning)}${reading?`<span class="ff-reading">${esc(reading)}</span>`:''}</div>`}
function ffExampleMarkup(f,lang){const x=ffExampleRow(EXAMPLES,f.id,lang);if(!x)return'';
  return `<div class="example"><div class="small sub">${esc(lang==='zh'?t('lang.zh'):t('lang.vi'))}</div><div class="${lang==='zh'?'zh':''}">${markedTarget(x)}</div>${lang==='zh'?`<div>${esc(x.pinyin)}</div>`:''}<div class="translation">${esc(x.translation)}</div></div>`;
}
function ffExamples(f,onlyLang=null){const langs=onlyLang?[onlyLang]:['zh','vi'],rows=langs.map(lang=>ffExampleMarkup(f,lang)).filter(Boolean);return rows.length?`<div class="examples">${rows.join('')}</div>`:''}
let ffmode='list',fff='all',fflang='zh',ffopen=new Set(),ffstats=cleanFFStats(S.get('kb_ffcard',{})),ffround=null,ffflipped=false;
const ffPool=lang=>orderedFFPool(FF,lang,ffstats);
function startFFRound(){const ids=newFFRoundIds(FF,fflang,ffstats);ffround={ids,queue:ids.slice()};ffflipped=false}
function syncFFControls(){
  $$('#ffmode button').forEach(b=>b.classList.toggle('on',b.dataset.m===ffmode));
  $('#fffilter').style.display=ffmode==='list'?'flex':'none';$('#fflang').style.display=ffmode==='cards'?'flex':'none';
  $$('#fffilter button').forEach(b=>b.classList.toggle('on',b.dataset.f===fff));
  $$('#fflang button').forEach(b=>b.classList.toggle('on',b.dataset.l===fflang));
  $('#ffhelp').textContent=ffmode==='list'?t('ff.help'):'';
}
$$('#ffmode button').forEach(b=>b.onclick=()=>{ffmode=b.dataset.m;if(ffmode==='cards'&&!ffround)startFFRound();renderFF();updateCounts()});
$$('#fffilter button').forEach(b=>b.onclick=()=>{fff=b.dataset.f;renderFF();updateCounts()});
$$('#fflang button').forEach(b=>b.onclick=()=>{fflang=b.dataset.l;startFFRound();renderFF();updateCounts()});
const FF_BY_ID=new Map(FF.map(f=>[f.id,f]));
function ffTile(f){const o=ffopen.has(f.id);return `<div class="tile ${o?'open':''}" data-w="${f.id}" role="button" tabindex="0" aria-expanded="${o}">
    <div class="w han">${esc(f.w)}</div><div class="l">${f.rows.filter(row=>!row.trap).map(ffLine).join('')}</div>
    ${o?`<div class="trap">${f.rows.filter(row=>row.trap).map(ffLine).join('')}</div>${ffExamples(f)}`:`<div class="hint">${esc(t('ff.hint'))}</div>`}</div>`}
function bindFFTiles(root){root.querySelectorAll('.tile').forEach(b=>{const toggle=()=>toggleFFTile(b.dataset.w);
    b.onclick=toggle;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}}})}
function toggleFFTile(id){ffopen.has(id)?ffopen.delete(id):ffopen.add(id);
  const old=$(`#fflist .tile[data-w="${id}"]`),f=FF_BY_ID.get(id);
  if(old&&f){const t=document.createElement('template');t.innerHTML=ffTile(f);bindFFTiles(t.content);const tile=t.content.firstElementChild;old.replaceWith(tile);tile.focus();return}
  renderFF();const next=$(`#fflist .tile[data-w="${id}"]`);if(next)next.focus()}
function renderFFList(){
  const list=FF.filter(f=>fff==='all'||f.traps.includes(fff));$('#fflist').className='tiles';
  renderChunked('ff',$('#fflist'),'',list,ffTile,bindFFTiles);
}
function renderFFCard(){
  if(!ffround||!ffround.queue.length)startFFRound();const id=(ffround.queue||[])[0],f=FF.find(row=>row.id===id);$('#fflist').className='';
  if(!f){$('#fflist').innerHTML=`<div class="empty">${esc(t('ff.empty'))}</div>`;return}
  const target=f.rows.find(row=>row.lang===fflang&&row.trap),others=f.rows.filter(row=>row.lang!==fflang);
  $('#fflist').innerHTML=`<div class="ff-card" data-ff-card="${f.id}" role="button" tabindex="0"><div class="giant han">${esc(f.w)}</div>
    ${ffflipped?`<div class="back-line">${target?ffLine(target):''}${target?spk(fflang==='zh'?f.word.z:target.reading,fflang):''}</div>${ffExamples(f,fflang)}
      <div class="rate"><button class="pill" data-ff-rate="miss">${esc(t('ff.rate_miss'))}<span class="key">1</span></button><button class="pill dark" data-ff-rate="ok">${esc(t('ff.rate_ok'))}<span class="key">2</span></button></div>`:
      `<div class="front-lines">${others.map(ffLine).join('')}</div><div class="hint">${esc(t('ff.hint'))}</div>`}</div>`;
  const card=$('[data-ff-card]');if(!ffflipped){const flip=()=>{ffflipped=true;renderFF()};card.onclick=flip;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}}}
  $$('[data-ff-rate]').forEach(b=>b.onclick=e=>{e.stopPropagation();rateFFCard(b.dataset.ffRate==='ok')});
}
function rateFFCard(right){if(!ffround||!ffflipped||!ffround.queue.length)return;const id=ffround.queue[0],key=`${id}:${fflang}`,row=ffstats[key]||{miss:0,ok:0};right?row.ok++:row.miss++;ffstats[key]=row;S.set('kb_ffcard',ffstats);
  const rest=ffround.queue.slice(1);ffround.queue=right?rest:appendFFMiss(rest,id);ffflipped=false;if(!ffround.queue.length)startFFRound();renderFF()}
function renderFF(){cancelChunks('ff');syncFFControls();ffmode==='cards'?renderFFCard():renderFFList()}
function showFFWord(wordId){ffmode='list';fff='all';ffopen=new Set([wordId]);view='ff';stopSpeech();$$('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v==='ff'));$$('main>section').forEach(s=>s.classList.toggle('hidden',s.id!=='v-ff'));render();ensureChunk('ff',FF.findIndex(f=>f.id===wordId));const tile=$(`#fflist .tile[data-w="${wordId}"]`);if(tile)tile.focus()}

/* 4. reading */
const PASSAGE_IDS=new Set(PASSAGES.map(p=>p.id));
let pid=(PASSAGES[0]||{}).id||'',selTok=null;
let readIds=new Set((Array.isArray(S.get('kb_read',[]))?S.get('kb_read',[]):[]).filter(id=>PASSAGE_IDS.has(id)));
const unknownIds=()=>new Set((Array.isArray(S.get('kb_unknown',[]))?S.get('kb_unknown',[]):[]).filter(id=>ALL_WORD_IDS.has(id)));
function markUnknown(wordId){const ids=unknownIds();ids.add(wordId);S.set('kb_unknown',[...ids])}
function markPassageRead(passageId){if(!PASSAGE_IDS.has(passageId))return;readIds.add(passageId);S.set('kb_read',[...readIds])}
$('#showann').onchange=renderRead;
function renderRead(){
  const unknown=unknownIds();
  $('#psel').innerHTML=PASSAGES.map(p=>`<button data-p="${p.id}" class="${p.id===pid?'on':''}">${p.name}${passageChecked(p,readIds,unknown)?esc(t('read.checked')):''}</button>`).join('');
  $$('#psel button').forEach(b=>b.onclick=()=>{if(b.dataset.p!==pid){markPassageRead(pid);pid=b.dataset.p;selTok=null}renderRead()});
  const p=PASSAGES.find(x=>x.id===pid),ann=$('#showann').checked;
  $('#passage').className='passage '+(p.lang==='zh'?'zh':'');
  $('#passage').innerHTML=p.toks.map((t,i)=>{
    if(t.x)return'';const nx=p.toks[i+1],tail=nx&&nx.x?`<span class="pt">${esc(nx.t)}</span>`:'';
    if(t.g)return `<span class="tok func"><span class="w"><span class="s">${esc(t.t)}</span>${tail}</span><span class="a">${ann?esc(t.g):''}</span></span>`;
    const a=p.lang==='vi'?t.w.h:t('read.annotation',{ja:t.w.jr,ko:t.w.k});
    return `<span class="tok sino ${selTok===i?'sel':''}" data-i="${i}"><span class="w"><span class="s" tabindex="0" role="button">${esc(t.t)}</span>${tail}</span><span class="a ${p.lang==='vi'?'han zh':''}">${ann?esc(a):''}</span></span>`;
  }).join('');
  const sent=p.lang==='vi'?p.toks.map(t=>t.t).join(' ').replace(/ ([.,])/g,'$1'):p.toks.map(t=>t.t).join('');$('#ptrans').innerHTML=`${esc(p.tr)}${spk(sent,p.lang)}`;
  $$('.tok.sino .s').forEach(el=>{const pick=()=>{selTok=+el.closest('.tok').dataset.i;markUnknown(p.toks[selTok].w.id);renderRead()};el.onclick=pick;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}}});
  const marked=[],seen=new Set();p.toks.forEach((t,i)=>{if(t.w&&unknownIds().has(t.w.id)&&!seen.has(t.w.id)){seen.add(t.w.id);marked.push([i,t.w])}});
  $('#unknownreview').innerHTML=marked.length?`<div class="sub small">${esc(t('read.unknown'))}</div><div class="review-list">${marked.map(([i,w])=>`<button class="pill" data-review-i="${i}">${esc(w.j||w.h)}</button>`).join('')}</div>`:'';
  $$('[data-review-i]').forEach(b=>b.onclick=()=>{selTok=+b.dataset.reviewI;renderRead()});
  const d=$('#tokdetail');if(selTok===null){d.innerHTML=`<div class="empty">${esc(t('read.tap_hint'))}</div>`;return}
  const w=p.toks[selTok].w,inDeck=deck().some(x=>x.id===w.id);d.innerHTML=`<div class="sheet">
    <div class="top"><div class="han" style="font-size:44px;line-height:1.1">${esc(w.h)}</div><button class="pill ${inDeck?'':'dark'}" id="addcard" ${inDeck?'disabled':''}>${esc(inDeck?t('read.added'):t('read.add_card'))}</button></div>
    <div class="grid"><div class="cell"><span>${esc(t('lang.ja'))}</span><div>${esc(w.jr)}</div></div><div class="cell"><span>${esc(t('lang.ko'))}</span><div class="ko">${esc(w.k)}</div></div>
      <div class="cell"><span>${esc(t('lang.zh'))}</span><div><span class="zh">${esc(w.z)}</span> ${esc(w.p)}${w.p?spk(w.z,'zh'):''}</div></div><div class="cell"><span>${esc(t('lang.vi'))}</span><div>${esc(w.v)}${w.v?spk(w.v,'vi'):''}</div></div></div>
    ${w.note?`<p class="sub small" style="margin:16px 0 0">${esc(w.note)}</p>`:''}<div style="margin-top:14px">${ruleTags(w)}</div></div>`;
  if(!inDeck)$('#addcard').onclick=()=>{custom.push(w.id);S.set('kb_custom',custom);updateCounts();renderRead();topStat()};
}

/* 5. glyph */
let gmode='list', gfil='all';
const GLYPH_IDS=new Set(GLYPHS.map(g=>g[7]));
let gresults=cleanTestResults(S.get('kb_glyphquiz',{}),GLYPH_IDS),glyphOpened=new Set();
const pat=g=>g[0]===g[2]&&g[0]!==g[1]?'jz':g[0]===g[1]&&g[0]!==g[2]?'jk':g[0]!==g[1]&&g[1]!==g[2]&&g[0]!==g[2]?'diff':'same';
const glyphTargets=(g,lang)=>g[lang==='zh'?10:11]||[];
function glyphDisplay(g,lang){const targets=glyphTargets(g,lang),all=splitVals(g[lang==='zh'?3:6]);return [...targets,...all.filter(x=>!targets.includes(x))].join(' / ')}
const glyphViAlt=g=>[...new Set(g[8].flatMap(id=>(WORD_BY_ID.get(id)||{}).va||[]))];
function glyphScore(){let ok=0,answered=0;filteredGlyphs().forEach(g=>{const row=gresults[g[7]]||{};['zh','vi'].forEach(lang=>{if(glyphTargets(g,lang).length&&resultValue(row[lang])!==null){answered++;if(row[lang]===1)ok++}})});return {ok,answered}}
function updateGlyphScore(){const el=$('#glyphscore');if(el){const score=glyphScore();el.textContent=t('glyph.score',score)}}
function markPosition(text,position){const chars=[...String(text)],i=position-1;if(i<0||i>=chars.length)return esc(text);return `${esc(chars.slice(0,i).join(''))}<mark>${esc(chars[i])}</mark>${esc(chars.slice(i+1).join(''))}`}
function markSyllable(text,position){const parts=String(text).split(' '),i=position-1;if(i<0||i>=parts.length)return esc(text);return parts.map((part,n)=>n===i?`<mark>${esc(part)}</mark>`:esc(part)).join(' ')}
const ffMark=w=>w.ff?`<button class="mini-mark" type="button" data-ff-word="${w.id}">${esc(t('glyph.ff_badge'))}</button>`:'';
function usageBody(g){const use=USAGE.get(g[7])||{zh:[],vi:[]},note=CHAR_NOTES.get(g[7])||'';
  const zh=use.zh.length?use.zh.map(([id,pos,pinyin])=>{const w=WORD_BY_ID.get(id),raw=RAW_WORD_BY_ID.get(id);return `<div class="usage-item"><span class="zh">${markPosition((raw.simp||raw.trad),pos)}</span>${ffMark(w)}<br>${markSyllable(pinyin,pos)}</div>`}).join(''):`<div class="sub">${esc(t('glyph.no_examples'))}</div>`;
  const vi=use.vi.length?use.vi.map(([id,pos])=>{const w=WORD_BY_ID.get(id),raw=RAW_WORD_BY_ID.get(id);return `<div class="usage-item">${markPosition((raw.jp||raw.trad),pos)}${raw.lit?`<span class="tag off">${esc(t('glyph.literary'))}</span>`:''}${ffMark(w)}<br>${markSyllable(raw.vi||'',pos)}</div>`}).join(''):`<div class="sub">${esc(t('glyph.no_examples'))}</div>`;
  return `<div class="usage-grid"><div><div class="usage-lang">${esc(t('lang.zh'))}</div>${zh}</div><div><div class="usage-lang">${esc(t('lang.vi'))}</div>${vi}</div>${note?`<div class="usage-note">${esc(note)}</div>`:''}</div>`;
}
function usagePanel(g){const open=gmode==='quiz'&&glyphOpened.has(g[7]);return `<details class="usage" data-usage="${g[7]}" ${open?'open':''}><summary>${esc(t('glyph.usage'))}</summary><div class="usage-body">${open?usageBody(g):''}</div></details>`}
function bindUsagePanels(root=$('#glyphbox')){
  root.querySelectorAll('details[data-usage]').forEach(d=>d.ontoggle=()=>{if(d.open&&!d.querySelector('.usage-body').innerHTML){const g=GLYPHS.find(row=>row[7]===d.dataset.usage);d.querySelector('.usage-body').innerHTML=usageBody(g)}});
  $('#glyphbox').onclick=e=>{const b=e.target.closest&&e.target.closest('[data-ff-word]');if(!b)return;e.preventDefault();e.stopPropagation();showFFWord(b.dataset.ffWord)};
}
function clearGlyphWords(g,lang,input){const parts=splitAnswerParts(input);g[8].forEach(id=>{const w=WORD_BY_ID.get(id);if(!w)return;const accepted=lang==='zh'?[w.p]:[w.v],alts=lang==='vi'?(w.va||[]):[];if(parts.some(part=>judge(part,lang,accepted,alts)==='ok'))clearUnknown(id)})}
function saveGlyphResult(g,lang,value,input){const row=gresults[g[7]]||{};row[lang]=value;gresults[g[7]]=row;S.set('kb_glyphquiz',gresults);if(value===1)clearGlyphWords(g,lang,input);glyphOpened.add(g[7]);
  const d=$(`#glyphbox details[data-usage="${g[7]}"]`);if(d){d.open=true;const body=d.querySelector('.usage-body');if(!body.innerHTML)body.innerHTML=usageBody(g)}updateGlyphScore();if(gfil==='wrong'&&value===1){renderGlyph();updateCounts()}}
function glyphListRow(g){return `<div class="grow">
  <div><div class="g han">${g[0]}</div><div class="lbl">${g[4]}</div></div>
  <div><div class="g han ko">${g[1]}</div><div class="lbl ko">${g[5]}</div></div>
  <div class="zhcol"><div class="g han zh">${g[2]}</div><div class="lbl">${esc(glyphDisplay(g,'zh'))}${glyphTargets(g,'zh').length?spk(g[2],'zh'):''}</div></div>
  <div class="rd">${esc(glyphDisplay(g,'vi'))}${glyphTargets(g,'vi').length?spk(glyphTargets(g,'vi').join(', '),'vi'):''}</div>${usagePanel(g)}</div>`}
function glyphQuizRow(g){const stored=gresults[g[7]]||{},py=glyphTargets(g,'zh'),vi=glyphTargets(g,'vi');return `<div class="grow quiz">
  <div><div class="g han">${g[0]}</div><div class="lbl">${g[4]}</div></div>
  <div><div class="g han ko">${g[1]}</div><div class="lbl ko">${g[5]}</div></div>
  <div class="zhcol"><div class="g han zh">${g[2]}</div>${py.length?tableTestCell(g[7],'zh',py,[],stored.zh,true,(value,input)=>saveGlyphResult(g,'zh',value,input)):`<div class="rd">${esc(glyphDisplay(g,'zh'))}</div>`}</div>
  <div>${vi.length?tableTestCell(g[7],'vi',vi,glyphViAlt(g),stored.vi,true,(value,input)=>saveGlyphResult(g,'vi',value,input)):`<div class="rd">${esc(glyphDisplay(g,'vi'))}</div>`}</div>${usagePanel(g)}</div>`}
$$('#gmode button').forEach(b=>b.onclick=()=>{gmode=b.dataset.g;$$('#gmode button').forEach(x=>x.classList.toggle('on',x===b));renderGlyph();updateCounts()});
$$('#gfilter button').forEach(b=>b.onclick=()=>{gfil=b.dataset.p;$$('#gfilter button').forEach(x=>x.classList.toggle('on',x===b));renderGlyph();updateCounts()});
function renderGlyph(){
  beginTableTest();const list=filteredGlyphs(),quiz=gmode==='quiz';
  const head=`<div class="ghead"><span>${esc(t('glyph.col_jp'))}</span><span>${esc(t('glyph.col_kr'))}</span><span>${esc(t('glyph.col_cn'))}</span><span>${esc(t('glyph.col_reading'))}</span></div>`;
  renderChunked('glyph',$('#glyphbox'),(quiz?`<div class="glyph-score" id="glyphscore"></div>`:'')+(list.length?head:`<div class="empty">${esc(t('glyph.empty'))}</div>`),
    list,quiz?glyphQuizRow:glyphListRow,root=>{if(quiz)bindTableTests(root);bindUsagePanels(root)});
  if(quiz)updateGlyphScore();
}

/* keyboard */
document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'&&e.target.type!=='checkbox')return;
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const n=['1','2','3','4'].indexOf(e.key);
  if(view==='cards'&&flipped&&n>=0){e.preventDefault();rate(n);return}
  if(view==='cards'&&flipped&&cur){const k=e.key.toLowerCase();
    if(k==='v'&&target!=='zh'){e.preventDefault();stopSpeech();speak(cur.v,'vi');return}
    if(k==='c'&&target!=='vi'){e.preventDefault();stopSpeech();speak(cur.z,'zh');return}}
  if(view==='cards'&&!flipped&&cur&&(e.key==='Enter'||e.key===' ')){e.preventDefault();doFlip();return}
  if(view==='ff'&&ffmode==='cards'){
    if(!ffflipped&&(e.key==='Enter'||e.key===' ')){e.preventDefault();ffflipped=true;renderFF();return}
    if(ffflipped&&(e.key==='1'||e.key==='2')){e.preventDefault();rateFFCard(e.key==='2');return}
  }
  if(view==='rules'&&quiz){
    if(!quiz.ans&&n>=0&&n<quiz.opts.length){e.preventDefault();pickRule(quiz.opts[n]);return}
    if(quiz.ans&&(e.key==='Enter'||e.key===' ')){e.preventDefault();quiz=null;renderRules();return}
  }
});

/* about (RELEASE_PLAN 2.6): the footer link opens and closes the panel; Esc closes it */
function setAbout(open){$('#aboutpanel').classList.toggle('hidden',!open);$('#about').setAttribute('aria-expanded',open);
  if(open)$('#aboutpanel').scrollIntoView({block:'nearest'})}
$('#about').onclick=()=>setAbout($('#aboutpanel').classList.contains('hidden'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#aboutpanel').classList.contains('hidden')){setAbout(false);$('#about').focus()}});

/* reset */
let armed=false;
$('#reset').onclick=()=>{
  if(!armed){armed=true;$('#reset').textContent=t('footer.reset_confirm');setTimeout(()=>{armed=false;$('#reset').textContent=t('footer.reset')},3000);return}
  srs={};custom=[];rprog={};ruleResults={};gresults={};glyphOpened.clear();ffstats={};ffround=null;ffflipped=false;readIds.clear();doneToday=0;newToday={date:localDay(),ids:[]};
  S.set('kb_srs',{});S.set('kb_custom',[]);S.set('kb_newtoday',newToday);S.set('kb_rules',{});S.set('kb_glyph',{});S.set('kb_ruletest',{});S.set('kb_glyphquiz',{});S.set('kb_unknown',[]);S.set('kb_read',[]);S.set('kb_ffcard',{});
  cur=null;flipped=false;armed=false;$('#reset').textContent=t('footer.reset');render();
};

render();
}

initApp();
