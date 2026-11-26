import { t } from '../../i18n/index.js';
import { $, esc } from '../dom.js';
import { S } from '../storage.js';
import { state } from '../state.js';
import { toast } from './toast.js';

const SPK_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

let TTS;

function syncMute(){$('#mute').classList.toggle('on',state.mute);$('#mute').setAttribute('aria-pressed',state.mute)}

function loadVoices(){if(!TTS.ok)return;try{TTS.voices=speechSynthesis.getVoices()||[]}catch(e){}}

function pickVoice(lang){
  const vs=TTS.voices.filter(v=>{const l=(v.lang||'').toLowerCase().replace('_','-');
    return lang==='zh'?(l.startsWith('zh-cn')||l==='zh'||l.startsWith('cmn')||(l.startsWith('zh')&&!/hk|tw|yue/.test(l))):l.startsWith('vi')});
  const score=v=>(/natural/i.test(v.name)?4:0)+(/online|google/i.test(v.name)?2:0)+((v.lang||'').toLowerCase().replace('_','-')===(lang==='zh'?'zh-cn':'vi-vn')?1:0);
  return vs.sort((a,b)=>score(b)-score(a))[0]||null;
}

function speak(text,lang,btn,quiet){
  if(state.mute)return;
  if(!TTS.ok){if(!quiet)toast(t('speech.unsupported'));return}
  loadVoices();
  const v=pickVoice(lang);
  if(!v){if(!quiet||!TTS.warned.has(lang)){TTS.warned.add(lang);toast(t('speech.no_voice',{lang:langName(lang)}))}return}
  try{
    const u=new SpeechSynthesisUtterance(text);u.voice=v;u.lang=v.lang;u.rate=0.85;
    if(btn){btn.classList.add('on');u.onend=u.onerror=()=>btn.classList.remove('on')}
    speechSynthesis.speak(u);
  }catch(e){if(!quiet)toast(t('speech.failed'))}
}

function stopSpeech(){try{TTS.ok&&speechSynthesis.cancel()}catch(e){}}

function spk(text,lang){return `<button class="spk" type="button" data-say="${esc(text)}" data-lang="${lang}" aria-label="${esc(t('speech.play_in',{lang:langName(lang)}))}" title="${esc(t('speech.play_in',{lang:langName(lang)}))}">${SPK_SVG}</button>`}

function syncAuto(){$('#autoplay').classList.toggle('on',state.autoplay);$('#autoplay').setAttribute('aria-pressed',state.autoplay)}

function langName(lang){return {zh:()=>t('lang.zh'),vi:()=>t('lang.vi')}[lang]()}

function initSpeech(){
TTS={ok:typeof window.speechSynthesis!=='undefined',voices:[],warned:new Set()};
state.mute=S.get('kb_mute',false);
$('#mute').onclick=()=>{state.mute=!state.mute;S.set('kb_mute',state.mute);if(state.mute)stopSpeech();syncMute()};
syncMute();
if(TTS.ok){loadVoices();try{speechSynthesis.addEventListener('voiceschanged',loadVoices)}catch(e){}}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.spk');if(!b)return;e.stopPropagation();e.preventDefault();stopSpeech();speak(b.dataset.say,b.dataset.lang,b)},true);
}

function initAutoplay(){
state.autoplay=S.get('kb_auto',true);
$('#autoplay').onclick=()=>{state.autoplay=!state.autoplay;S.set('kb_auto',state.autoplay);syncAuto()};
syncAuto();
}

export { SPK_SVG, TTS, syncMute, loadVoices, pickVoice, speak, stopSpeech, spk, syncAuto, langName, initSpeech, initAutoplay };
