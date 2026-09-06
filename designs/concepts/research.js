import {concepts as contour} from './elegant-a.js';
import {researchLayouts as visual} from './research-a.js';
import {researchLayouts as comparison} from './research-b.js';
import {researchLayouts as expandable} from './research-c.js';
import {mountRibbon} from './contour-motion.js';
import {mountContact} from './contour-contact.js';
import {mountHeroEffects} from './contour-hero-effects.js';

const layouts={...visual,...comparison,...expandable};
function render(data,id) {
  const template=document.createElement('template');
  template.innerHTML=contour['21'].render(data);
  template.content.querySelector('#ct-research').outerHTML=layouts[id](data);
  template.content.querySelector('.concept').classList.add(`concept-${id}`);
  return template.innerHTML + `<dialog class="rs-dialog" aria-labelledby="rs-dialog-title"><div class="rs-dialog-top"><h2 id="rs-dialog-title"></h2><form method="dialog"><button>Close <span aria-hidden="true">×</span></button></form></div><img alt=""><p>Research figure from the selected paper.</p></dialog>`;
}
function mount(root) {
  mountRibbon(root);
  mountContact(root);
  mountHeroEffects(root);
  const dialog=root.querySelector('.rs-dialog');
  root.addEventListener('click',event=>{
    const trigger=event.target.closest('.rs-zoom');
    if(!trigger)return;
    dialog.querySelector('h2').textContent=trigger.dataset.title;
    const img=dialog.querySelector('img');img.src=trigger.dataset.figure;img.alt=`Research figure from ${trigger.dataset.title}`;
    dialog.showModal();
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
  });
}
export const concepts=Object.fromEntries(Object.keys(layouts).map(id=>[id,{render:data=>render(data,id),mount}]));
