import { $ } from '../dom.js';

let toastT;

function toast(msg){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el)}
  el.textContent=msg;el.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.add('hidden'),7000)}

export { toastT, toast };
