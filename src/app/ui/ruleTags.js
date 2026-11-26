import { t, tHtml } from '../../i18n/index.js';
import { esc } from '../dom.js';
import { strip } from '../lib/text.js';
import { model } from '../data/instance.js';

function viFinal(s){const m=strip(s).match(/(ng|nh|ch|c|p|t|n|m)$/);return m?m[1]:''}

function ruleTags(w){
  if(!w.syl)return'';
  return w.syl.map(pair=>{
    const ch=(pair.ko_syllable||'').replace(/[（）()]/g,''),vi=pair.vi_syllable||'';
    const code=ch.charCodeAt(0)-0xAC00;if(code<0||code>11171)return'';
    const jong=code%28,r=jong===0?model.NONE_RULE:model.RULES.find(x=>x.jong===jong);if(!r)return'';
    const ok=r.vi.includes(viFinal(vi));
    return `<span class="tag ${ok?'':'off'}">${tHtml('rules.tag',{ko:`<span class="ko">${ch}</span>`,vi:esc(vi),label:ok?esc(jong===0?t('rules.none_label'):r.label):esc(t('rules.exception'))})}</span>`;
  }).join('');
}

export { viFinal, ruleTags };
