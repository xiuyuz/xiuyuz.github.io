import {renderCarousel, mountCarousel} from './publication-carousel.js';
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
    <dialog class="ctr-dialog" aria-labelledby="ctr-figure-title"><div class="ctr-dialog-top"><h3 id="ctr-figure-title"></h3><form method="dialog"><button>Close <span aria-hidden="true">×</span></button></form></div><img alt=""><p>Research figure from the selected work.</p></dialog>
  </section>`;
}

export function mountResearch(root) {
  mountCarousel(root);
  const dialog = root.querySelector('.ctr-dialog');
  if (!dialog) return;
  root.addEventListener('click', event=>{
    const trigger = event.target.closest('.pc-enlarge');
    if (!trigger) return;
    dialog.querySelector('h3').textContent = trigger.dataset.title;
    const img = dialog.querySelector('img');
    img.src = trigger.dataset.figure;
    img.alt = `Research figure from ${trigger.dataset.title}`;
    dialog.showModal();
  });
  dialog.addEventListener('click', event=>{
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}
