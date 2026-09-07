import {mountResearch} from '../concepts/contour-research.js?v=dark-assets-8';
import {mountContact} from '../concepts/contour-contact.js';
import {mountHeroEffects} from '../concepts/contour-hero-effects.js';
import {mountResearchMotion} from '../concepts/research-motion.js';
import {mountArtwork} from './renderer.js?v=finish-6';
import {mountResearchDust} from './research-dust.js?v=finish-6';
import {initializeTheme,mountTheme} from '../concepts/contour-theme.js?v=theme-click-7';

import {mountImageAppearance} from '../concepts/image-appearance.js?v=dark-assets-8';

async function stylesReady(){
  await Promise.all(['./preview.css','./particle-refinements.css','../concepts/research-dissolve.css','../concepts/contour-finish.css'].map(path=>{
    const url=new URL(path,import.meta.url);
    const existing=[...document.querySelectorAll('link[rel=stylesheet]')].find(link=>new URL(link.href).pathname===url.pathname);
    // The finishing layer follows all study-specific styles in the cascade.
    if(existing && path.endsWith('contour-finish.css'))document.head.append(existing);
    if(existing?.sheet)return;
    return new Promise((resolve,reject)=>{
      const link=existing||document.createElement('link');
      link.addEventListener('load',resolve,{once:true});link.addEventListener('error',reject,{once:true});
      if(!existing){link.rel='stylesheet';link.href=url.href+'?v=dark-assets-8';document.head.append(link);}
    });
  }));
}

// Shared by the selected working page and individual banner-study previews.
export async function mountStudyPage(root,study){
  initializeTheme();
  await stylesReady();
  const disposeTheme=mountTheme(root);
  root.querySelector('.concept').classList.add('study-page','particle-study');
  const accent=study.accent||'#788aa8';
  const applyPalette=()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    root.style.setProperty('--study-accent',dark?'#a7c3df':accent);
    root.style.setProperty('--study-tint',dark?'#1b2838':`color-mix(in srgb, ${accent} 11%, #f8fbff)`);
    root.style.setProperty('--study-ink',dark?'#c1d5e8':`color-mix(in srgb, ${accent} 77%, #27364c)`);
    root.style.setProperty('--study-glint',dark?'#eff7ff':`color-mix(in srgb, ${accent} 50%, #e9f1ff)`);
  };
  applyPalette();
  window.addEventListener('ct-theme-change',applyPalette);
  const artwork=new URL(`./previews/art-${String(study.id).padStart(2,'0')}.png?v=finish-6`,import.meta.url);
  root.style.setProperty('--study-art',`url("${artwork}")`);
  root.dataset.study=String(study.id).padStart(2,'0');
  const panel=root.querySelector('.ct-art-panel');panel.classList.add('bs-panel');
  panel.querySelector('.ct-representation')?.remove();
  panel.querySelector('.ct-research-links')?.remove();
  panel.querySelectorAll('.ct-interest-detail').forEach(node=>node.remove());
  panel.insertAdjacentHTML('beforeend',`<div class="bs-art-stage" aria-hidden="true"><div class="bs-art-shadow"></div><img class="bs-art-fallback" src="${artwork}" alt=""><canvas></canvas></div>`);
  const carousel=root.querySelector('.publication-carousel');
  if(study.id===1)carousel.dataset.transition='particles';
  const disposeResearch=mountResearch(root);
  const images=mountImageAppearance(root);
  // Dispose the superseded effect rather than leaving its observers mounted.
  if(carousel)mountResearchMotion(carousel)();
  mountContact(root);
  const disposeLight=mountHeroEffects(root);
  const disposeDust=mountResearchDust(root,study);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const onResearchLight=event=>{
    if(event.pointerType!=='mouse'||reduced.matches)return;
    const card=event.target.closest('.pc-feature');if(!card)return;
    const bounds=card.getBoundingClientRect();
    card.style.setProperty('--research-light-x',`${(event.clientX-bounds.left)/bounds.width*100}%`);
    card.style.setProperty('--research-light-y',`${(event.clientY-bounds.top)/bounds.height*100}%`);
  };
  carousel?.addEventListener('pointermove',onResearchLight,{passive:true});
  const disposeArtwork=await mountArtwork(root,study);
  let disposed=false;
  const dispose=()=>{
    if(disposed)return;disposed=true;
    window.removeEventListener('pagehide',onPageHide);
    disposeArtwork();disposeLight();disposeDust();disposeResearch?.();images.dispose();disposeTheme();
    window.removeEventListener('ct-theme-change',applyPalette);
    carousel?.removeEventListener('pointermove',onResearchLight);
  };
  const onPageHide=event=>{if(!event.persisted)dispose();};
  window.addEventListener('pagehide',onPageHide);
  await images.ready;
  window.studyReady=true;
  return dispose;
}
