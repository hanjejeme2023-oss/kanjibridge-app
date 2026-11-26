import { t, tHtml } from '../../i18n/index.js';
import { $, $$, esc } from '../dom.js';
import { judge } from '../lib/judge.js';
import { toneHint } from '../lib/tone.js';
import { S } from '../storage.js';
import { state } from '../state.js';
import { model } from '../data/instance.js';
import { jr, kr } from '../lib/word.js';
import { ruleTags } from '../ui/ruleTags.js';
import { speak, stopSpeech, spk } from '../ui/speech.js';
import { clearUnknown } from './read.js';
import { updateCounts } from '../nav.js';

const DAY=86400000;

const IV=[0,1,3,7,14,30];

function localDay(){const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}

function customWords(){return state.custom.map(id=>model.WORD_BY_ID.get(id)).filter(Boolean)}

function deck(){const seen=new Set(model.WORDS.map(w=>w.id));return model.WORDS.concat(customWords().filter(w=>!seen.has(w.id)))}

function targetOk(w){return state.target==='vi'?!!w.v:state.target==='zh'?!!w.p:!!w.v&&!!w.p}

function due(){const now=Date.now(),d=deck().filter(targetOk),available=new Set(d.map(w=>w.id)),introduced=new Set(state.newToday.ids.filter(id=>available.has(id)));
  const reviews=d.filter(w=>state.srs[w.id]&&state.srs[w.id].due<=now);
  const pending=d.filter(w=>!state.srs[w.id]&&introduced.has(w.id));
  const slots=Math.max(0,20-introduced.size),fresh=d.filter(w=>!state.srs[w.id]&&!introduced.has(w.id)).slice(0,slots);
  return reviews.concat(pending,fresh).sort((a,b)=>((state.srs[a.id]||{}).due||0)-((state.srs[b.id]||{}).due||0))}

function introduce(w){if(state.srs[w.id]||state.newToday.ids.includes(w.id))return;state.newToday.ids.push(w.id);S.set('kb_newtoday',state.newToday)}

function topStat(){const d=deck();const learned=d.filter(w=>state.srs[w.id]&&state.srs[w.id].box>=3).length;$('#topstat').textContent=t('header.topstat',{due:due().length,learned,total:d.length})}

function markedTarget(x){return `${esc(x.sentence.slice(0,x.start))}<mark>${esc(x.sentence.slice(x.start,x.start+x.len))}</mark>${esc(x.sentence.slice(x.start+x.len))}`}

function cardExample(w,lang){const x=model.EXAMPLES.get(`${w.id}:${lang}:card`);if(!x)return'';
  return `<div class="example"><div class="small sub">${esc(lang==='zh'?t('lang.zh'):t('lang.vi'))}</div><div class="${lang==='zh'?'zh':''}">${markedTarget(x)}</div>${lang==='zh'?`<div>${esc(x.pinyin)}</div>`:''}<div class="translation">${esc(x.translation)}</div></div>`}

function cardExamples(w,showVi,showZh){const rows=[showZh?cardExample(w,'zh'):'',showVi?cardExample(w,'vi'):''].filter(Boolean);return rows.length?`<div class="examples">${rows.join('')}</div>`:''}

function renderCards(preserve=false){
  const q=due();
  $('#queueinfo').textContent=q.length?t('cards.queue',{n:q.length}):'';
  const total=q.length+state.doneToday;$('#prog').style.width=(total?state.doneToday/total*100:100)+'%';
  if(!preserve&&(!state.cur||!q.find(w=>w.id===state.cur.id)&&!state.flipped)){state.cur=q[0]||null;state.flipped=false;state.guess={vi:'',zh:''};if(state.cur)introduce(state.cur)}
  if(!state.cur){$('#cardbox').innerHTML=`<div class="done"><h2>${esc(t('cards.done_title'))}</h2><p class="sub">${esc(t('cards.done_text'))}</p></div>`;return}
  const w=state.cur, showVi=state.target!=='zh', showZh=state.target!=='vi';
  const front=`<div class="giant han">${esc(w.j)}</div>
    ${w.h!==w.j?`<div class="alt">${esc(t('cards.korean_hanja',{h:w.h}))}</div>`:''}
    <div class="readings"><span>${esc(jr(w))}</span><span class="ko">${esc(kr(w))}</span></div>`;
  if(!state.flipped){
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
        ${showVi?`<div><div class="lang">${esc(t('lang.vi'))}</div><div class="val">${esc(w.v)}${spk(w.v,'vi')}</div>${yours(state.guess.vi)}${vt(judge(state.guess.vi,'vi',[w.v],w.va||[]),w.v)}</div>`:''}
        ${showZh?`<div><div class="lang">${esc(t('lang.zh'))}</div><div class="val"><span class="zh">${esc(w.z)}</span> ${esc(w.p)}${spk(w.z,'zh')}</div>${yours(state.guess.zh)}${vt(judge(state.guess.zh,'zh',[w.p]),w.p)}</div>`:''}
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

function nextBox(r){const b=(state.srs[state.cur.id]||{box:0}).box;return r===0?0:r===1?Math.max(b,1):r===2?Math.min(b+1,5):Math.min(b+2,5)}

function ivLabel(r){const d=IV[nextBox(r)];return d===0?t('cards.interval_now'):t('cards.interval_days',{n:d})}

function doFlip(){state.guess.vi=($('#gvi')||{}).value||'';state.guess.zh=($('#gzh')||{}).value||'';
  const viRight=state.target==='zh'||judge(state.guess.vi,'vi',[state.cur.v],state.cur.va||[])==='ok',zhRight=state.target==='vi'||judge(state.guess.zh,'zh',[state.cur.p])==='ok';
  if(viRight&&zhRight)clearUnknown(state.cur.id);state.flipped=true;renderCards();
  if(state.autoplay&&state.cur){stopSpeech();if(state.target!=='zh')speak(state.cur.v,'vi',null,true);if(state.target!=='vi')speak(state.cur.z,'zh',null,true)}}

function rate(r){
  stopSpeech();
  const box=nextBox(r);
  state.srs[state.cur.id]={box,due:r===0?Date.now()+60000:Date.now()+IV[box]*DAY-3600000};
  if(r!==0)state.doneToday++;
  S.set('kb_srs',state.srs);
  const q=due().filter(w=>w.id!==state.cur.id);
  if(r===0&&q.length===0)state.srs[state.cur.id].due=0;
  state.cur=q[0]||(r===0?state.cur:null);state.flipped=false;state.guess={vi:'',zh:''};
  renderCards();topStat();
}

function initCards(){
const rawSrs=S.get('kb_srs',{});
const rawCustom=S.get('kb_custom',[]);
state.srs=Object.fromEntries(Object.entries(rawSrs).filter(([id,v])=>model.ALL_WORD_IDS.has(id)&&v&&typeof v==='object'));
state.custom=[...new Set(rawCustom.filter(id=>typeof id==='string'&&model.ALL_WORD_IDS.has(id)))];
state.target=S.get('kb_target','vi');
state.newToday=S.get('kb_newtoday',{date:localDay(),ids:[]});
if(!state.newToday||state.newToday.date!==localDay()||!Array.isArray(state.newToday.ids))state.newToday={date:localDay(),ids:[]};
state.newToday.ids=[...new Set(state.newToday.ids.filter(id=>model.ALL_WORD_IDS.has(id)))];
S.set('kb_newtoday',state.newToday);
state.cur=null;
state.flipped=false;
state.guess={vi:'',zh:''};
state.doneToday=0;
$$('#target button').forEach(b=>{b.classList.toggle('on',b.dataset.t===state.target);b.onclick=()=>{state.target=b.dataset.t;S.set('kb_target',state.target);$$('#target button').forEach(x=>x.classList.toggle('on',x===b));state.flipped=false;renderCards();topStat();updateCounts()}});
}

export { DAY, IV, localDay, customWords, deck, targetOk, due, introduce, topStat, markedTarget, cardExample, cardExamples, renderCards, nextBox, ivLabel, doFlip, rate, initCards };
