import { t } from '../../i18n/index.js';
import { $, $$, esc } from '../dom.js';
import { appendFFMiss, ffExampleRow, newFFRoundIds, orderedFFPool } from '../lib/ff.js';
import { cleanFFStats } from '../lib/results.js';
import { S } from '../storage.js';
import { state } from '../state.js';
import { model } from '../data/instance.js';
import { stopSpeech, spk } from '../ui/speech.js';
import { cancelChunks, renderChunked, ensureChunk } from '../ui/chunks.js';
import { markedTarget } from './cards.js';
import { updateCounts, render } from '../nav.js';

function ffLine(row){const reading=row.reading?(row.meaning&&!/^（.*）$/.test(row.reading)?t('ff.reading_paren',{r:row.reading}):row.reading):'';
  return `<div><b>${esc({ja:()=>t('lang.short_ja'),ko:()=>t('lang.short_ko'),zh:()=>t('lang.short_zh'),vi:()=>t('lang.short_vi')}[row.lang]())}</b>${esc(row.meaning)}${reading?`<span class="ff-reading">${esc(reading)}</span>`:''}</div>`}

function ffExampleMarkup(f,lang){const x=ffExampleRow(model.EXAMPLES,f.id,lang);if(!x)return'';
  return `<div class="example"><div class="small sub">${esc(lang==='zh'?t('lang.zh'):t('lang.vi'))}</div><div class="${lang==='zh'?'zh':''}">${markedTarget(x)}</div>${lang==='zh'?`<div>${esc(x.pinyin)}</div>`:''}<div class="translation">${esc(x.translation)}</div></div>`;
}

function ffExamples(f,onlyLang=null){const langs=onlyLang?[onlyLang]:['zh','vi'],rows=langs.map(lang=>ffExampleMarkup(f,lang)).filter(Boolean);return rows.length?`<div class="examples">${rows.join('')}</div>`:''}

function ffPool(lang){return orderedFFPool(model.FF,lang,state.ffstats)}

function startFFRound(){const ids=newFFRoundIds(model.FF,state.fflang,state.ffstats);state.ffround={ids,queue:ids.slice()};state.ffflipped=false}

function syncFFControls(){
  $$('#ffmode button').forEach(b=>b.classList.toggle('on',b.dataset.m===state.ffmode));
  $('#fffilter').style.display=state.ffmode==='list'?'flex':'none';$('#fflang').style.display=state.ffmode==='cards'?'flex':'none';
  $$('#fffilter button').forEach(b=>b.classList.toggle('on',b.dataset.f===state.fff));
  $$('#fflang button').forEach(b=>b.classList.toggle('on',b.dataset.l===state.fflang));
  $('#ffhelp').textContent=state.ffmode==='list'?t('ff.help'):'';
}

function ffTile(f){const o=state.ffopen.has(f.id);return `<div class="tile ${o?'open':''}" data-w="${f.id}" role="button" tabindex="0" aria-expanded="${o}">
    <div class="w han">${esc(f.w)}</div><div class="l">${f.rows.filter(row=>!row.trap).map(ffLine).join('')}</div>
    ${o?`<div class="trap">${f.rows.filter(row=>row.trap).map(ffLine).join('')}</div>${ffExamples(f)}`:`<div class="hint">${esc(t('ff.hint'))}</div>`}</div>`}

function bindFFTiles(root){root.querySelectorAll('.tile').forEach(b=>{const toggle=()=>toggleFFTile(b.dataset.w);
    b.onclick=toggle;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}}})}

function toggleFFTile(id){state.ffopen.has(id)?state.ffopen.delete(id):state.ffopen.add(id);
  const old=$(`#fflist .tile[data-w="${id}"]`),f=model.FF_BY_ID.get(id);
  if(old&&f){const t=document.createElement('template');t.innerHTML=ffTile(f);bindFFTiles(t.content);const tile=t.content.firstElementChild;old.replaceWith(tile);tile.focus();return}
  renderFF();const next=$(`#fflist .tile[data-w="${id}"]`);if(next)next.focus()}

function renderFFList(){
  const list=model.FF.filter(f=>state.fff==='all'||f.traps.includes(state.fff));$('#fflist').className='tiles';
  renderChunked('ff',$('#fflist'),'',list,ffTile,bindFFTiles);
}

function renderFFCard(preserve=false){
  if(!preserve&&(!state.ffround||!state.ffround.queue.length))startFFRound();const id=(state.ffround?.queue||[])[0],f=model.FF.find(row=>row.id===id);$('#fflist').className='';
  if(!f){$('#fflist').innerHTML=`<div class="empty">${esc(t('ff.empty'))}</div>`;return}
  const target=f.rows.find(row=>row.lang===state.fflang&&row.trap),others=f.rows.filter(row=>row.lang!==state.fflang);
  $('#fflist').innerHTML=`<div class="ff-card" data-ff-card="${f.id}" role="button" tabindex="0"><div class="giant han">${esc(f.w)}</div>
    ${state.ffflipped?`<div class="back-line">${target?ffLine(target):''}${target?spk(state.fflang==='zh'?f.word.z:target.reading,state.fflang):''}</div>${ffExamples(f,state.fflang)}
      <div class="rate"><button class="pill" data-ff-rate="miss">${esc(t('ff.rate_miss'))}<span class="key">1</span></button><button class="pill dark" data-ff-rate="ok">${esc(t('ff.rate_ok'))}<span class="key">2</span></button></div>`:
      `<div class="front-lines">${others.map(ffLine).join('')}</div><div class="hint">${esc(t('ff.hint'))}</div>`}</div>`;
  const card=$('[data-ff-card]');if(!state.ffflipped){const flip=()=>{state.ffflipped=true;renderFF()};card.onclick=flip;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}}}
  $$('[data-ff-rate]').forEach(b=>b.onclick=e=>{e.stopPropagation();rateFFCard(b.dataset.ffRate==='ok')});
}

function rateFFCard(right){if(!state.ffround||!state.ffflipped||!state.ffround.queue.length)return;const id=state.ffround.queue[0],key=`${id}:${state.fflang}`,row=state.ffstats[key]||{miss:0,ok:0};right?row.ok++:row.miss++;state.ffstats[key]=row;S.set('kb_ffcard',state.ffstats);
  const rest=state.ffround.queue.slice(1);state.ffround.queue=right?rest:appendFFMiss(rest,id);state.ffflipped=false;if(!state.ffround.queue.length)startFFRound();renderFF()}

function renderFF(preserve=false){cancelChunks('ff');syncFFControls();state.ffmode==='cards'?renderFFCard(preserve):renderFFList()}

function showFFWord(wordId){state.ffmode='list';state.fff='all';state.ffopen=new Set([wordId]);state.view='ff';stopSpeech();$$('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v==='ff'));$$('main>section').forEach(s=>s.classList.toggle('hidden',s.id!=='v-ff'));render();ensureChunk('ff',model.FF.findIndex(f=>f.id===wordId));const tile=$(`#fflist .tile[data-w="${wordId}"]`);if(tile)tile.focus()}

function initFF(){
state.ffmode='list';
state.fff='all';
state.fflang='zh';
state.ffopen=new Set();
state.ffstats=cleanFFStats(S.get('kb_ffcard',{}));
state.ffround=null;
state.ffflipped=false;
$$('#ffmode button').forEach(b=>b.onclick=()=>{state.ffmode=b.dataset.m;if(state.ffmode==='cards'&&!state.ffround)startFFRound();renderFF();updateCounts()});
$$('#fffilter button').forEach(b=>b.onclick=()=>{state.fff=b.dataset.f;renderFF();updateCounts()});
$$('#fflang button').forEach(b=>b.onclick=()=>{state.fflang=b.dataset.l;startFFRound();renderFF();updateCounts()});
}

export { ffLine, ffExampleMarkup, ffExamples, ffPool, startFFRound, syncFFControls, ffTile, bindFFTiles, toggleFFTile, renderFFList, renderFFCard, rateFFCard, renderFF, showFFWord, initFF };
