import {renderCarousel, mountCarousel} from './publication-carousel.js?v=dark-assets-8';
import {renderVenue} from './research-venue.js';

const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external = 'target="_blank" rel="noopener noreferrer"';

export function renderResearch(data) {
  const selected = (data.selectedPaperKeys || data.papers.slice(0,4).map(p=>p.key))
    .map(key=>data.papers.find(p=>p.key===key)).filter(Boolean);
  const illustrated = selected.filter(p=>p.image);
  return `<section class="ct-research ct-carousel-research" id="ct-research" aria-labelledby="ctr-heading">
    <div class="ct-section-heading ct-research-heading"><div><span class="ct-label">02 / RESEARCH</span><h2 id="ctr-heading">Research</h2></div><a class="ct-all-papers" href="${escape(data.scholarUrl)}" ${external}>All research <span aria-hidden="true">↗</span></a></div>
    ${renderCarousel(illustrated)}
    <div class="ctr-list-heading"><h3>Selected research</h3><span>${String(selected.length).padStart(2,'0')} WORKS</span></div>
    <ol class="ctr-publications">${selected.map((p,i)=>`<li class="ctr-publication" id="selected-paper-${escape(p.key)}"><span class="ctr-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div class="ctr-citation"><div class="ctr-meta">${renderVenue(p)}</div><h4><a href="${escape(p.url)}" ${external}>${escape(p.title)}</a></h4><p class="ctr-authors">${escape(p.authors).replaceAll('XiuYu Zhang','<strong>XiuYu Zhang</strong>')}</p><div class="ctr-links"><a href="${escape(p.url)}" ${external}>Read paper <span aria-hidden="true">↗</span></a>${p.code?`<a href="${escape(p.code)}" ${external}>Code <span aria-hidden="true">↗</span></a>`:''}</div></div></li>`).join('')}</ol>
    <dialog class="ctr-dialog" aria-labelledby="ctr-figure-title"><div class="ctr-dialog-top"><h3 id="ctr-figure-title"></h3><form method="dialog"><button>Close <span aria-hidden="true">×</span></button></form></div><img alt=""><div class="ctr-figure-footer"><p>Research figure from the selected work.</p><button type="button" data-figure-original aria-pressed="false">Original colors</button></div></dialog>
  </section>`;
}

export function mountResearch(root) {
  const disposeCarousel = mountCarousel(root);
  const lifecycle = new AbortController();
  const dialog = root.querySelector('.ctr-dialog');
  if (!dialog) return disposeCarousel;
  root.addEventListener('click', event=>{
    let trigger = event.target.closest('.pc-enlarge');
    if (!trigger) return;
    if (trigger.closest('.pc-slide')?.inert) trigger = trigger.closest('.publication-carousel').querySelector('.pc-slide:not([inert]) .pc-enlarge');
    dialog.querySelector('h3').textContent = trigger.dataset.title;
    const img = dialog.querySelector('img');
    dialog.dataset.originalColors = 'false';
    dialog.querySelector('[data-figure-original]')?.setAttribute('aria-pressed', 'false');
    img.dataset.themeAsset = 'light';
    img.src = trigger.dataset.figure;
    img.alt = `Research figure from ${trigger.dataset.title}`;
    img.dispatchEvent(new CustomEvent('ct-figure-open', {bubbles: true, detail: {image: img, source: trigger.dataset.figure}}));
    dialog.showModal();
  }, {signal:lifecycle.signal});
  dialog.addEventListener('click', event=>{
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  }, {signal:lifecycle.signal});
  return ()=>{lifecycle.abort();disposeCarousel?.();};
}
