/* Stage 5 gate harness (Claude, 2026-11-12). Injected into a COPY of app/index.html by
   stage5_gate_run.py; exercises all five views and every D71/D76 feature, then writes JSON
   into a pre element with id harness-out. It changes localStorage of the throwaway headless profile only.
   R1 (2026-11-14, D78): the long lists render in chunks (RELEASE_PLAN 1.2), so F() completes them
   before the harness counts or queries rows; the end checks that pending chunks also finish on their own,
   the window title and the about panel. Driven over file:// and http://127.0.0.1 by stage5_gate_run.py. */
window.addEventListener('load',async()=>{
const F=()=>{if(typeof flushChunks==='function')flushChunks()};
const out={errors:window.__errs,checks:{},bad:[],fail:[]};
const rec=(k,v)=>{out.checks[k]=v};
const must=(label,cond)=>{if(!cond)out.fail.push(label)};
const badText=()=>{const t=document.querySelector('main').innerText+document.querySelector('header').innerText;const m=t.match(/undefined|NaN|\bnull\b|\[object/g);return m?m.slice(0,5):[]};
const chk=label=>{const b=badText();if(b.length)out.bad.push([label,b])};
const nav=v=>document.querySelector(`#nav button[data-v="${v}"]`).click();
const key=(k,el=document)=>{const e=new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented};
const timed=fn=>{const t=performance.now();fn();return Math.round(performance.now()-t)};
const ls=k=>JSON.parse(localStorage.getItem(k)||'null');
try{
  rec('counts',Object.fromEntries(['cards','rules','ff','read','glyph'].map(k=>[k,document.querySelector('#count-'+k).textContent])));
  rec('explain',[...document.querySelectorAll('.tab-explain')].map(x=>x.textContent));
  chk('cards-initial');
  /* ---- tone hints over the whole deck and every glyph row ---- */
  const badHint=h=>!h||/^・|・$|・・|undefined|^ \/|\/ $|\/ \//.test(h);
  let zhTyped=0,zhBad=[],viBad=[],ptLenMismatch=[];
  WORDS.forEach(w=>{if(w.p){zhTyped++;const h=toneHint('zh',[w.p],w.pt);if(badHint(h)||!w.pt)zhBad.push(w.id);if(w.pt&&w.pt.length!==h.split('・').length)ptLenMismatch.push(w.id)}
    if(w.v){const h=toneHint('vi',[w.v]);if(badHint(h))viBad.push(w.id)}});
  let gBad=[];GLYPHS.forEach(g=>{['zh','vi'].forEach(l=>{const t=glyphTargets(g,l);if(t.length&&badHint(toneHint(l,t)))gBad.push(g[7]+l)})});
  const nopt=KB.words.filter(x=>!x.pt);
  const deckIds=new Set(WORDS.map(w=>w.id)),glyphWordIds=new Set(GLYPHS.flatMap(g=>g[8]));
  rec('tone',{deck:WORDS.length,zhTyped,zhBad:zhBad.length,viBad:viBad.length,ptLenMismatch:ptLenMismatch.length,glyphBad:gBad.length,
    noPt:nopt.length,noPtNoPinyin:nopt.filter(x=>!x.pinyin).length,noPtInDeck:nopt.filter(x=>deckIds.has(x.word_id)).length,
    noPtInGlyph:nopt.filter(x=>glyphWordIds.has(x.word_id)).length,noPtWithPinyinFF:nopt.filter(x=>x.pinyin&&x.false_friend).length,
    deckSingle:WORDS.filter(w=>[...w.h].length<2).length});
  must('no bad zh hint',zhBad.length===0);must('no bad vi hint',viBad.length===0);must('no bad glyph hint',gBad.length===0);
  /* ---- カード ---- */
  const c1=cur;rec('card_first',{id:c1.id,h:c1.h,v:c1.v,hints:[...document.querySelectorAll('#cardbox .tone-hint')].map(x=>x.textContent)});
  const gv=document.querySelector('#gvi');must('card vi input',!!gv);
  gv.value=c1.v.normalize('NFD').replace(/[̣́̀̉̃]/g,'').normalize('NFC');key('Enter',gv);
  rec('card_back',document.querySelector('#cardbox').innerText.slice(0,400));
  must('card tone-stripped right',/正解/.test(document.querySelector('#cardbox').innerText));
  rec('card_examples',document.querySelectorAll('#cardbox .example').length);
  chk('cards-back');
  key('3');must('card rated',cur&&cur.id!==c1.id&&!flipped);
  // wrong answer shows correct reading
  const c2=cur;document.querySelector('#gvi').value='zzz';key('Enter',document.querySelector('#gvi'));
  must('card wrong shows answer',document.querySelector('#cardbox .you.ng')&&document.querySelector('#cardbox .you.ng').textContent===c2.v);
  key('1');
  // Space flips when not in input
  document.activeElement&&document.activeElement.blur&&document.activeElement.blur();
  must('space flips card',key(' ')&&flipped);key('2');
  document.querySelector('#target button[data-t="both"]').click();
  rec('card_both_hints',[...document.querySelectorAll('#cardbox .tone-hint')].map(x=>x.textContent));
  rec('count_cards_both',document.querySelector('#count-cards').textContent);
  document.querySelector('#target button[data-t="vi"]').click();
  rec('newtoday',(ls('kb_newtoday')||{}).ids.length);
  /* ---- 音のルール ---- */
  rec('t_rules',timed(()=>nav('rules')));chk('rules');
  document.querySelector('#ruletest').click();
  let inputs=[...document.querySelectorAll('#ruledetail input[data-test-cell]')];
  rec('rule_inputs',inputs.length);must('rule test inputs',inputs.length>=8);
  const r0=RULES.find(r=>r.id===ruleSel);
  inputs[0].value=r0.ex[0][3];inputs[0].dispatchEvent(new Event('blur'));
  must('rule vi right',inputs[0].classList.contains('ok')&&inputs[0].parentElement.querySelector('.test-result').textContent==='正解');
  inputs[1].value='qqq';must('enter judges',key('Enter',inputs[1]));
  must('rule zh wrong shows answer',inputs[1].classList.contains('ng')&&inputs[1].parentElement.querySelector('.test-result').textContent===r0.ex[0][4]);
  inputs[2].value='ab';const spPrevented=key(' ',inputs[2]);must('space types in unjudged input',!spPrevented);
  rec('kb_ruletest',ls('kb_ruletest'));
  document.querySelector('#ruletest').click();document.querySelector('#ruletest').click();
  inputs=[...document.querySelectorAll('#ruledetail input[data-test-cell]')];
  must('reopen empties but keeps colour',inputs[0].value===''&&inputs[0].classList.contains('ok')&&inputs[1].classList.contains('ng')&&inputs[0].parentElement.querySelector('.test-result').textContent==='');
  must('kb_rules untouched',JSON.stringify(ls('kb_rules')||{})==='{}');
  rec('rule_hint0',inputs[0].parentElement.querySelector('.tone-hint').textContent);
  document.querySelector('#ruletest').click();chk('rules-after');
  /* ---- 偽の友達 ---- */
  rec('t_ff',timed(()=>nav('ff')));F();chk('ff');
  const tiles=document.querySelectorAll('#fflist .tile');rec('ff_tiles',tiles.length);
  const kisha=FF.find(f=>f.w==='汽車');rec('ff_kisha_lines',kisha&&document.querySelector(`#fflist .tile[data-w="${kisha.id}"] .l`).innerText);
  const pao=FF.find(f=>f.w==='包子');
  rec('t_ff_open',timed(()=>document.querySelector(`#fflist .tile[data-w="${pao.id}"]`).click()));
  const paoTile=document.querySelector(`#fflist .tile[data-w="${pao.id}"]`);
  rec('ff_paozi_open',paoTile.innerText);must('paozi examples 2',paoTile.querySelectorAll('.example').length===2);
  chk('ff-open');
  document.querySelector('#fffilter button[data-f="vi"]').click();F();rec('ff_vi_tiles',document.querySelectorAll('#fflist .tile').length);rec('count_ff_vi',document.querySelector('#count-ff').textContent);
  document.querySelector('#fffilter button[data-f="all"]').click();F();
  // open all tiles' examples check over data: none case
  let noneCase=FF.filter(f=>!ffExampleRow(EXAMPLES,f.id,'zh')&&!ffExampleRow(EXAMPLES,f.id,'vi')).length;rec('ff_without_examples',noneCase);
  let emptyHint=0;FF.forEach(f=>f.rows.forEach(r=>{if(!r.meaning&&!r.reading)emptyHint++}));rec('ff_rows_without_meaning_or_reading',emptyHint);
  document.querySelector('#ffmode button[data-m="cards"]').click();chk('ffcards-front');
  rec('ffcard_front',document.querySelector('#fflist').innerText.slice(0,300));rec('count_ff_cards',document.querySelector('#count-ff').textContent);
  const firstId=ffround.queue[0];rec('ffround_len',ffround.ids.length);must('20 per round',ffround.ids.length===20);
  must('enter flips ff',key('Enter')&&ffflipped);rec('ffcard_back',document.querySelector('#fflist').innerText.slice(0,400));chk('ffcards-back');
  key('1');must('miss returns to end',ffround.queue[ffround.queue.length-1]===firstId&&ffround.queue.length===20);
  rec('kb_ffcard',ls('kb_ffcard'));
  key(' ');key('2');rec('kb_ffcard2',ls('kb_ffcard'));must('queue shrinks on ok',ffround.queue.length===19);
  document.querySelector('#fflang button[data-l="vi"]').click();rec('ffround_vi_len',ffround.ids.length);rec('count_ff_cards_vi',document.querySelector('#count-ff').textContent);
  key('Enter');rec('ffcard_vi_back',document.querySelector('#fflist').innerText.slice(0,300));chk('ffcards-vi');
  document.querySelector('#ffmode button[data-m="list"]').click();F();
  /* ---- 読解 ---- */
  rec('t_read',timed(()=>nav('read')));chk('read');
  const pills=()=>[...document.querySelectorAll('#psel button')];
  must('no check on first display',!pills().some(b=>b.textContent.includes('✓')));
  const p0=PASSAGES[0],p1=PASSAGES[1],p2=PASSAGES[2];
  const s0=document.querySelector('.tok.sino .s');s0.click();
  const markedId=p0.toks[selTok].w.id;rec('marked',markedId);
  must('kb_unknown has mark',(ls('kb_unknown')||[]).includes(markedId));
  must('review list',document.querySelector('#unknownreview').innerText.includes('わからない'));
  rec('review',document.querySelector('#unknownreview').innerText);chk('read-detail');
  document.querySelector(`#psel button[data-p="${p1.id}"]`).click();
  must('kb_read has p0',(ls('kb_read')||[]).includes(p0.id));
  must('marked passage no check',!document.querySelector(`#psel button[data-p="${p0.id}"]`).textContent.includes('✓'));
  document.querySelector(`#psel button[data-p="${p2.id}"]`).click();
  must('left unmarked passage has check',document.querySelector(`#psel button[data-p="${p1.id}"]`).textContent.includes('✓')||p1.toks.some(t=>t.w&&unknownIds().has(t.w.id)));
  clearUnknown(markedId);renderRead();
  must('cleared -> check',document.querySelector(`#psel button[data-p="${p0.id}"]`).textContent.includes('✓'));
  markUnknown(markedId);renderRead();must('remarked -> no check',!document.querySelector(`#psel button[data-p="${p0.id}"]`).textContent.includes('✓'));
  clearUnknown(markedId);
  nav('glyph');must('tab switch marks read',(ls('kb_read')||[]).includes(p2.id));
  /* ---- 字体 ---- */
  F();chk('glyph');rec('glyph_rows',document.querySelectorAll('#glyphbox .grow').length);
  const t0=performance.now();document.querySelector('#gmode button[data-g="quiz"]').click();rec('t_glyph_quiz',Math.round(performance.now()-t0));F();chk('glyph-quiz');
  rec('glyph_quiz_inputs',document.querySelectorAll('#glyphbox input[data-test-cell]').length);
  const huan=GLYPHS.find(g=>g[1]==='還');const hz=document.querySelector(`#glyphbox input[data-test-cell="${huan[7]}:zh"]`);
  rec('huan_hint',hz.parentElement.querySelector('.tone-hint').textContent);
  hz.value='hai, huan';key('Enter',hz);must('還 both readings right',hz.classList.contains('ok'));
  const hv=document.querySelector(`#glyphbox input[data-test-cell="${huan[7]}:vi"]`);hv.value='hoan';hv.dispatchEvent(new Event('blur'));
  rec('huan_vi_result',hv.parentElement.querySelector('.test-result').textContent);
  const xing=GLYPHS.find(g=>g[1]==='行');const xz=document.querySelector(`#glyphbox input[data-test-cell="${xing[7]}:zh"]`);xz.value='hang, xuan';xz.dispatchEvent(new Event('blur'));
  rec('xing_wrong',xz.parentElement.querySelector('.test-result').textContent);
  rec('kb_glyphquiz',ls('kb_glyphquiz'));rec('score',document.querySelector('#glyphscore').textContent);
  const usageOpen=document.querySelector(`#glyphbox details[data-usage="${huan[7]}"]`);rec('huan_usage',usageOpen.open?usageOpen.innerText:'closed');
  document.querySelector('#gfilter button[data-p="wrong"]').click();F();rec('wrong_rows',document.querySelectorAll('#glyphbox .grow').length);rec('count_glyph_wrong',document.querySelector('#count-glyph').textContent);
  for(let l=1;l<=7;l++){document.querySelector(`#gfilter button[data-p="level-${l}"]`).click();F();out.checks['level'+l]=document.querySelectorAll('#glyphbox .grow').length}
  document.querySelector('#gfilter button[data-p="all"]').click();
  // reopen quiz: emptied with colour
  document.querySelector('#gmode button[data-g="list"]').click();document.querySelector('#gmode button[data-g="quiz"]').click();F();
  const hz2=document.querySelector(`#glyphbox input[data-test-cell="${huan[7]}:zh"]`);must('glyph reopen empty+ok',hz2.value===''&&hz2.classList.contains('ok'));
  // no-target rows have no input
  const noVi=GLYPHS.find(g=>!glyphTargets(g,'vi').length);must('no input for empty vi list',!document.querySelector(`#glyphbox input[data-test-cell="${noVi[7]}:vi"]`));
  // usage panel in list with ff mark
  document.querySelector('#gmode button[data-g="list"]').click();F();
  const ffChar=GLYPHS.find(g=>{const u=USAGE.get(g[7]);return u&&[...u.zh,...u.vi].some(r=>(WORD_BY_ID.get(r[0])||{}).ff)});
  const det=document.querySelector(`#glyphbox details[data-usage="${ffChar[7]}"]`);det.open=true;det.dispatchEvent(new Event('toggle'));
  rec('usage_ff_char',det.innerText);chk('glyph-usage');
  const mark=det.querySelector('[data-ff-word]');const ffw=mark.dataset.ffWord;mark.click();
  must('ff mark opens entry',view==='ff'&&ffopen.has(ffw)&&document.querySelector(`#fflist .tile[data-w="${ffw}"]`).classList.contains('open'));
  chk('ff-from-glyph');
  /* ---- clearUnknown from 字体 and カード ---- */
  // mute
  document.querySelector('#mute').click();must('mute stored',ls('kb_mute')===true);document.querySelector('#mute').click();
  nav('glyph');rec('t_glyph_list',timed(()=>{document.querySelector('#gfilter button[data-p="diff"]').click();document.querySelector('#gfilter button[data-p="all"]').click()}));
  /* ---- R1: idle-time chunks finish by themselves; same row counts as one full render ---- */
  const settle=async()=>{for(let i=0;i<600&&CHUNKS.size;i++)await new Promise(r=>setTimeout(r,50))};
  await settle();rec('glyph_rows_settled',document.querySelectorAll('#glyphbox .grow').length);
  must('glyph chunks complete',CHUNKS.size===0&&document.querySelectorAll('#glyphbox .grow').length===GLYPHS.length);
  document.querySelector('#gmode button[data-g="quiz"]').click();await settle();
  must('glyph quiz chunks complete',document.querySelectorAll('#glyphbox .grow').length===GLYPHS.length&&document.querySelectorAll('#glyphbox input[data-test-cell]').length===out.checks.glyph_quiz_inputs);
  document.querySelector('#gmode button[data-g="list"]').click();
  nav('ff');await settle();rec('ff_tiles_settled',document.querySelectorAll('#fflist .tile').length);
  must('ff chunks complete',document.querySelectorAll('#fflist .tile').length===FF.length);
  chk('ff-settled');
  // single-tile toggle keeps the other tiles (same nodes) and focuses the toggled tile
  const firstTile=document.querySelector('#fflist .tile'),secondTile=document.querySelectorAll('#fflist .tile')[1];
  rec('t_ff_toggle',timed(()=>firstTile.click()));const opened=document.querySelector('#fflist .tile');
  must('tile toggle opens in place',opened.classList.contains('open')&&opened.getAttribute('aria-expanded')==='true'&&document.activeElement===opened&&document.querySelectorAll('#fflist .tile')[1]===secondTile);
  key('Enter',opened);must('tile Enter closes',!document.querySelector('#fflist .tile').classList.contains('open'));
  /* ---- R1: window title and about panel (RELEASE_PLAN 2.6) ---- */
  rec('title',document.title);must('title without 試作版',document.title==='漢字ブリッジ');
  const about=document.querySelector('#about'),panel=document.querySelector('#aboutpanel');
  must('about closed at start',panel.classList.contains('hidden')&&about.getAttribute('aria-expanded')==='false');
  about.click();must('about opens',!panel.classList.contains('hidden')&&about.getAttribute('aria-expanded')==='true');
  rec('about_text',panel.innerText);
  must('about EDRDG sentence',panel.innerText.includes('These files are the property of the Electronic Dictionary Research and Development Group'));
  must('about repo link',!!panel.querySelector('a[href="https://github.com/hanjejeme2023-oss/kanji-bridge"]'));
  must('about AI note',panel.innerText.includes('AI（Google Gemini）'));
  about.click();must('about link closes',panel.classList.contains('hidden'));
  about.click();key('Escape');must('Esc closes about',panel.classList.contains('hidden')&&about.getAttribute('aria-expanded')==='false');
  chk('about');
}catch(e){out.exception=String(e&&e.stack||e)}
out.errors=window.__errs;
const pre=document.createElement('pre');pre.id='harness-out';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre);document.title='HARNESS DONE';
});
