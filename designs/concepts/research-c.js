import {escape, paperTitle, authors, meta, actions, figure, heading} from './research-shared.js';
function expandable(data) {
  return `<section id="ct-research" class="research-option rs-28">${heading(data)}<div class="rs-28-list">${data.papers.slice(0,4).map((p,i)=>`<article class="rs-publication"><div class="rs-28-top"><span class="rs-choice-number">0${i+1}</span>${meta(p)}</div>${paperTitle(p)}${authors(p)}${actions(p)}<details class="rs-28-details" ${i===0?'open':''}><summary><span class="rs-28-show">View figure & summary</span><span class="rs-28-hide">Hide figure & summary</span><span class="rs-28-indicator" aria-hidden="true">+</span></summary><div class="rs-28-detail-body">${figure(p)}<div><span class="ct-label">ABOUT THIS WORK</span><p class="rs-summary">${escape(p.summary)}</p></div></div></details></article>`).join('')}</div></section>`;
}
export const researchLayouts = {'28':expandable};
