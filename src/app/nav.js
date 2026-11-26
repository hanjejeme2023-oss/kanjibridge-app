import { localeMeta } from '../i18n/index.js';
import { $, $$ } from './dom.js';
import { state } from './state.js';
import { model } from './data/instance.js';
import { stopSpeech } from './ui/speech.js';
import { cancelChunks, flushChunks } from './ui/chunks.js';
import { deck, targetOk, topStat, renderCards } from './views/cards.js';
import { renderRules } from './views/rules.js';
import { ffPool, syncFFControls, renderFF } from './views/ff.js';
import { markPassageRead, renderRead } from './views/read.js';
import { filteredGlyphs, renderGlyph } from './views/glyph.js';
import { syncResetLabel } from './footer.js';

function updateCounts(){
  const counts={cards:deck().filter(targetOk).length,
    rules:(model.RULES.find(x=>x.id===state.ruleSel)||{ex:[]}).ex.length,
    ff:state.ffmode==='cards'?ffPool(state.fflang).length:model.FF.filter(f=>state.fff==='all'||f.traps.includes(state.fff)).length,
    read:model.PASSAGES.length,glyph:filteredGlyphs().length};
  Object.entries(counts).forEach(([key,value])=>{const el=$(`#count-${key}`);if(el)el.textContent=value.toLocaleString(localeMeta().numberLocale)});
}

function render(preserve=false){cancelChunks();({cards:renderCards,rules:renderRules,ff:renderFF,read:renderRead,glyph:renderGlyph})[state.view](preserve);topStat();updateCounts()}

function rerenderAll(){const x=window.scrollX,y=window.scrollY;syncFFControls();syncResetLabel();render(true);flushChunks();window.scrollTo(x,y)}

function switchView(view){if(state.view==='read'&&view!=='read')markPassageRead(state.pid);state.view=view;stopSpeech();$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));$$('main>section').forEach(s=>s.classList.toggle('hidden',s.id!=='v-'+view));render()}

function initNav(){
state.view='cards';
$$('#nav button').forEach(b=>b.onclick=()=>{
  if(state.view==='read'&&b.dataset.v!=='read')markPassageRead(state.pid);
  state.view=b.dataset.v;stopSpeech();
  $$('#nav button').forEach(x=>x.classList.toggle('on',x===b));
  $$('main>section').forEach(s=>s.classList.toggle('hidden',s.id!=='v-'+state.view));
  render();
});
}

export { updateCounts, render, rerenderAll, switchView, initNav };
