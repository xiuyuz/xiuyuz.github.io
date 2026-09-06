import { escape, paperTitle, authors, meta, actions, figure, heading } from './research-shared.js';

function highlight(paper) {
  return `<article class="rs-publication ra-highlight">
    ${figure(paper)}
    <div class="ra-highlight-copy">
      ${meta(paper)}
      ${paperTitle(paper)}
      ${authors(paper)}
      <p class="rs-summary">${escape(paper.summary)}</p>
      ${actions(paper)}
    </div>
  </article>`;
}

function indexEntry(paper, index) {
  return `<article class="rs-publication ra-index-entry">
    <span class="ra-index-number" aria-hidden="true">${String(index + 3).padStart(2, '0')}</span>
    <div class="ra-index-copy">
      ${meta(paper)}
      ${paperTitle(paper)}
      ${authors(paper)}
      <p class="rs-summary">${escape(paper.summary)}</p>
    </div>
    ${actions(paper)}
  </article>`;
}

function twoHighlights(data) {
  const papers = data.papers.slice(0, 4);
  return `<section id="ct-research" class="research-option rs-24">
    ${heading(data)}
    <div class="ra-highlights">${papers.slice(0, 2).map(highlight).join('')}</div>
    <div class="ra-index">
      <p class="ra-index-label">Further selected work</p>
      ${papers.slice(2).map(indexEntry).join('')}
    </div>
  </section>`;
}

function spread(paper, index) {
  return `<article class="rs-publication ra-spread">
    <div class="ra-spread-visual">
      <span class="ra-spread-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      ${figure(paper)}
    </div>
    <div class="ra-spread-copy">
      ${meta(paper)}
      ${paperTitle(paper)}
      ${authors(paper)}
      <p class="rs-summary">${escape(paper.summary)}</p>
      ${actions(paper)}
    </div>
  </article>`;
}

function editorialSpreads(data) {
  return `<section id="ct-research" class="research-option rs-25">
    ${heading(data)}
    <div class="ra-spreads">${data.papers.slice(0, 4).map(spread).join('')}</div>
  </section>`;
}

export const researchLayouts = { '24': twoHighlights, '25': editorialSpreads };
