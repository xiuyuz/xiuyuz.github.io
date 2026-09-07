import {studies,number} from './studies.js?v=shortlist-4';
import {createParticleStudy} from './particle-material.js?v=shortlist-4';
import {mountArtwork} from './renderer.js?v=shortlist-4';

const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches,explicit=false;
const controls=document.createElement('div');controls.className='gallery-motion-tools';
controls.innerHTML='<span>Live particle studies</span><button type="button" class="gallery-motion-toggle"></button>';
document.querySelector('#studies').before(controls);
const toggle=controls.querySelector('button');
document.querySelector('#studies').innerHTML=studies.map(study=>`<a class="study-card" href="./preview.html?study=${number(study.id)}"><div class="study-card-image"><img class="study-poster" src="./previews/${number(study.id)}.jpg?v=shortlist-4" alt="Preview of ${escape(study.title)}" loading="${study.id<3?'eager':'lazy'}" width="1120" height="530"><div class="study-live ct-hero" aria-hidden="true"><div class="bs-panel"><span class="mini-eyebrow">RESEARCH INTERESTS</span><div class="mini-interests"><span class="ct-interest">Reasoning &amp; representation</span><span class="ct-interest">AI safety &amp; alignment</span><span class="ct-interest">Multimodal intelligence</span></div><div class="bs-art-stage"><img class="bs-art-fallback" src="./previews/art-${number(study.id)}.png?v=shortlist-4" alt="" loading="lazy"><canvas></canvas></div></div></div></div><div class="study-card-meta"><span class="study-number">${number(study.id)}</span><div><h2>${escape(study.title)}</h2><p>${escape(study.description)}</p><span class="study-card-label">Open interactive banner + research</span></div><span class="study-arrow" aria-hidden="true">↗</span></div></a>`).join('');
const cards=[...document.querySelectorAll('.study-card')].map((element,i)=>({element,study:studies[i],visible:false,version:0,dispose:null,mounting:false}));
function syncControls(){
  toggle.textContent=paused?'Play previews':'Pause previews';
  toggle.setAttribute('aria-pressed',String(paused));
  cards.forEach(card=>card.dispose?.setPaused(paused,{explicit}));
}
toggle.addEventListener('click',()=>{paused=!paused;explicit=true;syncControls();});
reduced.addEventListener('change',()=>{paused=reduced.matches;explicit=false;syncControls();});
async function start(card){
  if(card.dispose||card.mounting)return;
  card.mounting=true;const version=++card.version;
  const study={...card.study,build:THREE=>createParticleStudy(THREE,{...card.study,compact:true,particleCount:card.study.rendering?.previewCount||10500})};
  const dispose=await mountArtwork(card.element,study,{compact:true});
  card.mounting=false;
  if(version!==card.version||!card.visible){dispose();reset(card);if(card.visible)start(card);return;}
  card.dispose=dispose;dispose.setPaused(paused,{explicit});
  if(card.element.querySelector('.bs-panel').dataset.renderer==='webgl')card.element.classList.add('is-live');
}
function reset(card){
  card.element.classList.remove('is-live');
  card.element.querySelector('.bs-art-stage').classList.remove('is-ready');
  card.element.querySelector('canvas').replaceWith(document.createElement('canvas'));
}
function stop(card){
  card.version++;
  if(card.dispose){card.dispose();card.dispose=null;reset(card);}
}
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
    const card=cards.find(card=>card.element===entry.target);card.visible=entry.isIntersecting;
    if(card.visible)start(card);else stop(card);
  }
},{rootMargin:'80px 0px'});
cards.forEach(card=>observer.observe(card.element));
syncControls();window.galleryReady=true;
window.addEventListener('pagehide',()=>{observer.disconnect();cards.forEach(stop);},{once:true});
