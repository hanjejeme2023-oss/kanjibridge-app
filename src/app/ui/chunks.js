const CHUNKS=new Map();

function cancelChunks(name){(name?[name]:[...CHUNKS.keys()]).forEach(k=>{const job=CHUNKS.get(k);if(job){clearTimeout(job.timer);CHUNKS.delete(k)}})}

function appendChunk(job,count){const end=Math.min(job.items.length,job.next+count);if(end<=job.next)return;
  const t=document.createElement('template');t.innerHTML=job.items.slice(job.next,end).map(job.row).join('');
  job.bind(t.content);job.box.appendChild(t.content);job.next=end}

function chunkStep(name){const job=CHUNKS.get(name);if(!job)return;const now=performance.now();
  /* the gap since the last step includes the browser's layout of that step: aim at about 50 ms per step */
  if(job.last)job.size=Math.max(20,Math.min(500,Math.round(job.size*50/Math.max(now-job.last,1))));job.last=now;
  appendChunk(job,job.size);
  if(job.next<job.items.length)job.timer=setTimeout(()=>chunkStep(name),0);else CHUNKS.delete(name)}

function renderChunked(name,box,lead,items,row,bind){
  cancelChunks(name);const first=Math.min(items.length,30);
  box.innerHTML=lead+items.slice(0,first).map(row).join('');bind(box);
  if(first<items.length){const job={box,items,row,bind,next:first,size:100,last:0,timer:0};CHUNKS.set(name,job);job.timer=setTimeout(()=>chunkStep(name),0)}}

function flushChunks(name){(name?[name]:[...CHUNKS.keys()]).forEach(k=>{const job=CHUNKS.get(k);if(!job)return;clearTimeout(job.timer);appendChunk(job,job.items.length);CHUNKS.delete(k)})}

function ensureChunk(name,index){const job=CHUNKS.get(name);if(job&&index>=job.next)appendChunk(job,index+1-job.next)}

export { CHUNKS, cancelChunks, appendChunk, chunkStep, renderChunked, flushChunks, ensureChunk };
