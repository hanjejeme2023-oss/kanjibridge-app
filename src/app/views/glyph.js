import { t } from '../../i18n/index.js';
import { $, $$, esc } from '../dom.js';
import { judge, splitAnswerParts } from '../lib/judge.js';
import { cleanTestResults, resultValue } from '../lib/results.js';
import { splitVals } from '../lib/text.js';
import { S } from '../storage.js';
import { state } from '../state.js';
import { model } from '../data/instance.js';
import { beginTableTest, tableTestCell, bindTableTests } from '../ui/tableTest.js';
import { spk } from '../ui/speech.js';
import { renderChunked } from '../ui/chunks.js';
import { showFFWord } from './ff.js';
import { clearUnknown } from './read.js';
import { updateCounts } from '../nav.js';

function filteredGlyphs(){return model.GLYPHS.filter(g=>{
  if(state.gfil==='all')return true;
  if(state.gfil==='wrong')return Object.values(state.gresults[g[7]]||{}).some(value=>value===0);
  if(state.gfil.startsWith('level-'))return g[9]===+state.gfil.slice(6);
  return pat(g)===state.gfil;
})}

function pat(g){return g[0]===g[2]&&g[0]!==g[1]?'jz':g[0]===g[1]&&g[0]!==g[2]?'jk':g[0]!==g[1]&&g[1]!==g[2]&&g[0]!==g[2]?'diff':'same'}

function glyphTargets(g,lang){return g[lang==='zh'?10:11]||[]}

function glyphDisplay(g,lang){const targets=glyphTargets(g,lang),all=splitVals(g[lang==='zh'?3:6]);return [...targets,...all.filter(x=>!targets.includes(x))].join(' / ')}

function glyphViAlt(g){return [...new Set(g[8].flatMap(id=>(model.WORD_BY_ID.get(id)||{}).va||[]))]}

function glyphScore(){let ok=0,answered=0;filteredGlyphs().forEach(g=>{const row=state.gresults[g[7]]||{};['zh','vi'].forEach(lang=>{if(glyphTargets(g,lang).length&&resultValue(row[lang])!==null){answered++;if(row[lang]===1)ok++}})});return {ok,answered}}

function updateGlyphScore(){const el=$('#glyphscore');if(el){const score=glyphScore();el.textContent=t('glyph.score',score)}}

function markPosition(text,position){const chars=[...String(text)],i=position-1;if(i<0||i>=chars.length)return esc(text);return `${esc(chars.slice(0,i).join(''))}<mark>${esc(chars[i])}</mark>${esc(chars.slice(i+1).join(''))}`}

function markSyllable(text,position){const parts=String(text).split(' '),i=position-1;if(i<0||i>=parts.length)return esc(text);return parts.map((part,n)=>n===i?`<mark>${esc(part)}</mark>`:esc(part)).join(' ')}

function ffMark(w){return w.ff?`<button class="mini-mark" type="button" data-ff-word="${w.id}">${esc(t('glyph.ff_badge'))}</button>`:''}

function usageBody(g){const use=model.USAGE.get(g[7])||{zh:[],vi:[]},note=model.CHAR_NOTES.get(g[7])||'';
  const zh=use.zh.length?use.zh.map(([id,pos,pinyin])=>{const w=model.WORD_BY_ID.get(id),raw=model.RAW_WORD_BY_ID.get(id);return `<div class="usage-item"><span class="zh">${markPosition((raw.simp||raw.trad),pos)}</span>${ffMark(w)}<br>${markSyllable(pinyin,pos)}</div>`}).join(''):`<div class="sub">${esc(t('glyph.no_examples'))}</div>`;
  const vi=use.vi.length?use.vi.map(([id,pos])=>{const w=model.WORD_BY_ID.get(id),raw=model.RAW_WORD_BY_ID.get(id);return `<div class="usage-item">${markPosition((raw.jp||raw.trad),pos)}${raw.lit?`<span class="tag off">${esc(t('glyph.literary'))}</span>`:''}${ffMark(w)}<br>${markSyllable(raw.vi||'',pos)}</div>`}).join(''):`<div class="sub">${esc(t('glyph.no_examples'))}</div>`;
  return `<div class="usage-grid"><div><div class="usage-lang">${esc(t('lang.zh'))}</div>${zh}</div><div><div class="usage-lang">${esc(t('lang.vi'))}</div>${vi}</div>${note?`<div class="usage-note">${esc(note)}</div>`:''}</div>`;
}

function usagePanel(g){const open=state.gmode==='quiz'&&state.glyphOpened.has(g[7]);return `<details class="usage" data-usage="${g[7]}" ${open?'open':''}><summary>${esc(t('glyph.usage'))}</summary><div class="usage-body">${open?usageBody(g):''}</div></details>`}

function bindUsagePanels(root=$('#glyphbox')){
  root.querySelectorAll('details[data-usage]').forEach(d=>d.ontoggle=()=>{if(d.open&&!d.querySelector('.usage-body').innerHTML){const g=model.GLYPHS.find(row=>row[7]===d.dataset.usage);d.querySelector('.usage-body').innerHTML=usageBody(g)}});
  $('#glyphbox').onclick=e=>{const b=e.target.closest&&e.target.closest('[data-ff-word]');if(!b)return;e.preventDefault();e.stopPropagation();showFFWord(b.dataset.ffWord)};
}

function clearGlyphWords(g,lang,input){const parts=splitAnswerParts(input);g[8].forEach(id=>{const w=model.WORD_BY_ID.get(id);if(!w)return;const accepted=lang==='zh'?[w.p]:[w.v],alts=lang==='vi'?(w.va||[]):[];if(parts.some(part=>judge(part,lang,accepted,alts)==='ok'))clearUnknown(id)})}

function saveGlyphResult(g,lang,value,input){const row=state.gresults[g[7]]||{};row[lang]=value;state.gresults[g[7]]=row;S.set('kb_glyphquiz',state.gresults);if(value===1)clearGlyphWords(g,lang,input);state.glyphOpened.add(g[7]);
  const d=$(`#glyphbox details[data-usage="${g[7]}"]`);if(d){d.open=true;const body=d.querySelector('.usage-body');if(!body.innerHTML)body.innerHTML=usageBody(g)}updateGlyphScore();if(state.gfil==='wrong'&&value===1){renderGlyph();updateCounts()}}

function glyphListRow(g){return `<div class="grow">
  <div><div class="g han">${g[0]}</div><div class="lbl">${g[4]}</div></div>
  <div><div class="g han ko">${g[1]}</div><div class="lbl ko">${g[5]}</div></div>
  <div class="zhcol"><div class="g han zh">${g[2]}</div><div class="lbl">${esc(glyphDisplay(g,'zh'))}${glyphTargets(g,'zh').length?spk(g[2],'zh'):''}</div></div>
  <div class="rd">${esc(glyphDisplay(g,'vi'))}${glyphTargets(g,'vi').length?spk(glyphTargets(g,'vi').join(', '),'vi'):''}</div>${usagePanel(g)}</div>`}

function glyphQuizRow(g){const stored=state.gresults[g[7]]||{},py=glyphTargets(g,'zh'),vi=glyphTargets(g,'vi');return `<div class="grow quiz">
  <div><div class="g han">${g[0]}</div><div class="lbl">${g[4]}</div></div>
  <div><div class="g han ko">${g[1]}</div><div class="lbl ko">${g[5]}</div></div>
  <div class="zhcol"><div class="g han zh">${g[2]}</div>${py.length?tableTestCell(g[7],'zh',py,[],stored.zh,true,(value,input)=>saveGlyphResult(g,'zh',value,input)):`<div class="rd">${esc(glyphDisplay(g,'zh'))}</div>`}</div>
  <div>${vi.length?tableTestCell(g[7],'vi',vi,glyphViAlt(g),stored.vi,true,(value,input)=>saveGlyphResult(g,'vi',value,input)):`<div class="rd">${esc(glyphDisplay(g,'vi'))}</div>`}</div>${usagePanel(g)}</div>`}

function renderGlyph(){
  beginTableTest();const list=filteredGlyphs(),quiz=state.gmode==='quiz';
  const head=`<div class="ghead"><span>${esc(t('glyph.col_jp'))}</span><span>${esc(t('glyph.col_kr'))}</span><span>${esc(t('glyph.col_cn'))}</span><span>${esc(t('glyph.col_reading'))}</span></div>`;
  renderChunked('glyph',$('#glyphbox'),(quiz?`<div class="glyph-score" id="glyphscore"></div>`:'')+(list.length?head:`<div class="empty">${esc(t('glyph.empty'))}</div>`),
    list,quiz?glyphQuizRow:glyphListRow,root=>{if(quiz)bindTableTests(root);bindUsagePanels(root)});
  if(quiz)updateGlyphScore();
}

function initGlyph(){
state.gmode='list';
state.gfil='all';
state.gresults=cleanTestResults(S.get('kb_glyphquiz',{}),model.GLYPH_IDS);
state.glyphOpened=new Set();
$$('#gmode button').forEach(b=>b.onclick=()=>{state.gmode=b.dataset.g;$$('#gmode button').forEach(x=>x.classList.toggle('on',x===b));renderGlyph();updateCounts()});
$$('#gfilter button').forEach(b=>b.onclick=()=>{state.gfil=b.dataset.p;$$('#gfilter button').forEach(x=>x.classList.toggle('on',x===b));renderGlyph();updateCounts()});
}

export { filteredGlyphs, pat, glyphTargets, glyphDisplay, glyphViAlt, glyphScore, updateGlyphScore, markPosition, markSyllable, ffMark, usageBody, usagePanel, bindUsagePanels, clearGlyphWords, saveGlyphResult, glyphListRow, glyphQuizRow, renderGlyph, initGlyph };
