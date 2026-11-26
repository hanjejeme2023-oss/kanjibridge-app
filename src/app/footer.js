import { t } from '../i18n/index.js';
import { $ } from './dom.js';
import { S } from './storage.js';
import { state } from './state.js';
import { localDay } from './views/cards.js';
import { render } from './nav.js';

function setAbout(open){$('#aboutpanel').classList.toggle('hidden',!open);$('#about').setAttribute('aria-expanded',open);
  if(open)$('#aboutpanel').scrollIntoView({block:'nearest'})}

function syncResetLabel(){$('#reset').textContent=state.armed?t('footer.reset_confirm'):t('footer.reset')}

function initAbout(){
$('#about').onclick=()=>setAbout($('#aboutpanel').classList.contains('hidden'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#aboutpanel').classList.contains('hidden')){setAbout(false);$('#about').focus()}});
}

function initReset(){
state.armed=false;
$('#reset').onclick=()=>{
  if(!state.armed){state.armed=true;$('#reset').textContent=t('footer.reset_confirm');setTimeout(()=>{state.armed=false;$('#reset').textContent=t('footer.reset')},3000);return}
  state.srs={};state.custom=[];state.rprog={};state.ruleResults={};state.gresults={};state.glyphOpened.clear();state.ffstats={};state.ffround=null;state.ffflipped=false;state.readIds.clear();state.doneToday=0;state.newToday={date:localDay(),ids:[]};
  S.set('kb_srs',{});S.set('kb_custom',[]);S.set('kb_newtoday',state.newToday);S.set('kb_rules',{});S.set('kb_glyph',{});S.set('kb_ruletest',{});S.set('kb_glyphquiz',{});S.set('kb_unknown',[]);S.set('kb_read',[]);S.set('kb_ffcard',{});
  state.cur=null;state.flipped=false;state.armed=false;$('#reset').textContent=t('footer.reset');render();
};
}

export { setAbout, syncResetLabel, initAbout, initReset };
