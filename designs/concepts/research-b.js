import {escape, paperTitle, authors, meta, actions, figure, heading} from './research-shared.js';

function figureGallery(data) {
  return `<section id="ct-research" class="research-option rs-26">${heading(data)}<div class="rs26-gallery">${data.papers.slice(0, 4).map((paper, index) => `<article class="rs-publication rs26-paper"><div class="rs26-image">${figure(paper)}<span class="rs26-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></div><div class="rs26-copy">${meta(paper)}${paperTitle(paper)}${authors(paper)}<p class="rs-summary">${escape(paper.summary)}</p>${actions(paper)}</div></article>`).join('')}</div></section>`;
}

function typographicJournal(data) {
  return `<section id="ct-research" class="research-option rs-27">${heading(data)}<div class="rs27-journal">${data.papers.slice(0, 4).map((paper, index) => `<article class="rs-publication rs27-paper"><span class="rs27-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div class="rs27-copy">${meta(paper)}${paperTitle(paper)}${authors(paper)}<div class="rs27-bottom"><p class="rs-summary">${escape(paper.summary)}</p>${actions(paper)}</div></div></article>`).join('')}</div></section>`;
}

export const researchLayouts = {'26': figureGallery, '27': typographicJournal};
