import { t } from '../../i18n/index.js';
import { $, $$, esc } from '../dom.js';
import { passageChecked } from '../lib/ff.js';
import { S } from '../storage.js';
import { state } from '../state.js';
import { model } from '../data/instance.js';
import { jr, kr } from '../lib/word.js';
import { ruleTags } from '../ui/ruleTags.js';
import { spk } from '../ui/speech.js';
import { deck, topStat } from './cards.js';
import { updateCounts } from '../nav.js';

function clearUnknown(wordId){const rows=S.get('kb_unknown',[]),next=Array.isArray(rows)?rows.filter(id=>id!==wordId):[];S.set('kb_unknown',next)}

function unknownIds(){return new Set((Array.isArray(S.get('kb_unknown',[]))?S.get('kb_unknown',[]):[]).filter(id=>model.ALL_WORD_IDS.has(id)))}

function markUnknown(wordId){const ids=unknownIds();ids.add(wordId);S.set('kb_unknown',[...ids])}

function markPassageRead(passageId){if(!model.PASSAGE_IDS.has(passageId))return;state.readIds.add(passageId);S.set('kb_read',[...state.readIds])}

function renderRead(){
  const unknown=unknownIds();
  $('#psel').innerHTML=model.PASSAGES.map(p=>`<button data-p="${p.id}" class="${p.id===state.pid?'on':''}">${esc(t('read.passage_name',{lang:p.lang==='vi'?t('lang.short_vi'):t('lang.short_zh'),n:p.n}))}${passageChecked(p,state.readIds,unknown)?esc(t('read.checked')):''}</button>`).join('');
  $$('#psel button').forEach(b=>b.onclick=()=>{if(b.dataset.p!==state.pid){markPassageRead(state.pid);state.pid=b.dataset.p;state.selTok=null}renderRead()});
  const p=model.PASSAGES.find(x=>x.id===state.pid),ann=$('#showann').checked;
  $('#passage').className='passage '+(p.lang==='zh'?'zh':'');
  $('#passage').innerHTML=p.toks.map((token,i)=>{
    if(token.x)return'';const nx=p.toks[i+1],tail=nx&&nx.x?`<span class="pt">${esc(nx.t)}</span>`:'';
    if(token.g)return `<span class="tok func"><span class="w"><span class="s">${esc(token.t)}</span>${tail}</span><span class="a">${ann?esc(token.g):''}</span></span>`;
    const a=p.lang==='vi'?token.w.h:t('read.annotation',{ja:jr(token.w),ko:kr(token.w)});
    return `<span class="tok sino ${state.selTok===i?'sel':''}" data-i="${i}"><span class="w"><span class="s" tabindex="0" role="button">${esc(token.t)}</span>${tail}</span><span class="a ${p.lang==='vi'?'han zh':''}">${ann?esc(a):''}</span></span>`;
  }).join('');
  const sent=p.lang==='vi'?p.toks.map(t=>t.t).join(' ').replace(/ ([.,])/g,'$1'):p.toks.map(t=>t.t).join('');$('#ptrans').innerHTML=`${esc(p.tr)}${spk(sent,p.lang)}`;
  $$('.tok.sino .s').forEach(el=>{const pick=()=>{state.selTok=+el.closest('.tok').dataset.i;markUnknown(p.toks[state.selTok].w.id);renderRead()};el.onclick=pick;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick()}}});
  const marked=[],seen=new Set();p.toks.forEach((t,i)=>{if(t.w&&unknownIds().has(t.w.id)&&!seen.has(t.w.id)){seen.add(t.w.id);marked.push([i,t.w])}});
  $('#unknownreview').innerHTML=marked.length?`<div class="sub small">${esc(t('read.unknown'))}</div><div class="review-list">${marked.map(([i,w])=>`<button class="pill" data-review-i="${i}">${esc(w.j||w.h)}</button>`).join('')}</div>`:'';
  $$('[data-review-i]').forEach(b=>b.onclick=()=>{state.selTok=+b.dataset.reviewI;renderRead()});
  const d=$('#tokdetail');if(state.selTok===null){d.innerHTML=`<div class="empty">${esc(t('read.tap_hint'))}</div>`;return}
  const w=p.toks[state.selTok].w,inDeck=deck().some(x=>x.id===w.id);d.innerHTML=`<div class="sheet">
    <div class="top"><div class="han" style="font-size:44px;line-height:1.1">${esc(w.h)}</div><button class="pill ${inDeck?'':'dark'}" id="addcard" ${inDeck?'disabled':''}>${esc(inDeck?t('read.added'):t('read.add_card'))}</button></div>
    <div class="grid"><div class="cell"><span>${esc(t('lang.ja'))}</span><div>${esc(jr(w))}</div></div><div class="cell"><span>${esc(t('lang.ko'))}</span><div class="ko">${esc(kr(w))}</div></div>
      <div class="cell"><span>${esc(t('lang.zh'))}</span><div><span class="zh">${esc(w.z)}</span> ${esc(w.p)}${w.p?spk(w.z,'zh'):''}</div></div><div class="cell"><span>${esc(t('lang.vi'))}</span><div>${esc(w.v)}${w.v?spk(w.v,'vi'):''}</div></div></div>
    ${w.note?`<p class="sub small" style="margin:16px 0 0">${esc(w.note)}</p>`:''}<div style="margin-top:14px">${ruleTags(w)}</div></div>`;
  if(!inDeck)$('#addcard').onclick=()=>{state.custom.push(w.id);S.set('kb_custom',state.custom);updateCounts();renderRead();topStat()};
}

function initRead(){
state.pid=(model.PASSAGES[0]||{}).id||'';
state.selTok=null;
state.readIds=new Set((Array.isArray(S.get('kb_read',[]))?S.get('kb_read',[]):[]).filter(id=>model.PASSAGE_IDS.has(id)));
$('#showann').onchange=renderRead;
}

export { clearUnknown, unknownIds, markUnknown, markPassageRead, renderRead, initRead };
