import { t } from '../../i18n/index.js';
import { esc } from '../dom.js';
import { judge } from '../lib/judge.js';
import { resultValue } from '../lib/results.js';
import { toneHint } from '../lib/tone.js';
import { CHUNKS, appendChunk } from './chunks.js';

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

export { TABLE_TEST_CELLS, beginTableTest, tableTestCell, focusNextTest, answerTableCell, bindTableTests };
