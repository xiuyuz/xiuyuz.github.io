const escape = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const link = (url, label, className = '') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;

function sculpture() {
  const layers = Array.from({ length: 21 }, (_, i) => {
    const angle = -30 + i * 3.3;
    const centerX = 302 + 24 * Math.sin(i * .2);
    const centerY = 133 + i * 13;
    const width = 176 + 18 * Math.sin(i * .14);
    const depth = 38 + 10 * Math.sin(i * .17);
    return `<g transform="translate(${centerX} ${centerY}) rotate(${angle})"><path d="M ${-width} 0 C ${-width} ${-depth * 1.42}, ${width} ${-depth * 1.42}, ${width} 0 L ${width} 5 C ${width} ${depth * 1.42 + 5}, ${-width} ${depth * 1.42 + 5}, ${-width} 5 Z" fill="url(#jp-edge)"/><ellipse cx="0" cy="0" rx="${width}" ry="${depth}" fill="url(#jp-jade)" stroke="#f2fff9" stroke-opacity=".55" stroke-width=".8"/><path d="M ${-width * .81} ${-depth * .54} Q ${-width * .06} ${-depth * 1.53} ${width * .84} ${-depth * .47}" fill="none" stroke="#f9fffc" stroke-opacity=".57" stroke-width=".8"/></g>`;
  }).reverse().join('');
  return `<svg class="jp-sculpture" viewBox="0 0 620 570" aria-hidden="true" focusable="false"><defs><linearGradient id="jp-jade" x1="0" y1="0" x2="1" y2=".9"><stop offset="0" stop-color="#f1fcf6"/><stop offset=".35" stop-color="#c9e5d8"/><stop offset=".64" stop-color="#82b5a0"/><stop offset="1" stop-color="#386f5c"/></linearGradient><linearGradient id="jp-edge" x1="0" y1="0" x2="1" y2=".7"><stop offset="0" stop-color="#88b09e"/><stop offset=".6" stop-color="#39735c"/><stop offset="1" stop-color="#214b3c"/></linearGradient><radialGradient id="jp-shadow"><stop stop-color="#2a5444" stop-opacity=".17"/><stop offset="1" stop-color="#2a5444" stop-opacity="0"/></radialGradient></defs><ellipse cx="318" cy="476" rx="218" ry="37" fill="url(#jp-shadow)"/><g>${layers}</g></svg>`;
}

function paper(paper, index) {
  return `<article class="jp-paper"><div class="jp-paper-index"><span>0${index + 1}</span><span>${escape(paper.tag)} · ${escape(paper.year)}</span></div>${link(paper.url, `<img src="${escape(paper.image)}" alt="Research figure from ${escape(paper.title)}" loading="lazy"><span aria-hidden="true">↗</span>`, 'jp-figure')}<div class="jp-paper-copy"><h3>${link(paper.url, escape(paper.title))}</h3><p class="jp-authors">${escape(paper.authors).replaceAll('XiuYu Zhang', '<strong>XiuYu Zhang</strong>')}</p><div class="jp-paper-links">${link(paper.url, 'Read paper <span aria-hidden="true">↗</span>')}${paper.code ? link(paper.code, 'Code <span aria-hidden="true">↗</span>') : ''}</div></div></article>`;
}

function render(data) {
  return `<div class="concept concept-22" id="jp-top">
    <header class="jp-nav jp-container"><a class="jp-wordmark" href="#jp-top"><span class="jp-mark" aria-hidden="true">✳</span> ${escape(data.name)}</a><nav aria-label="Page navigation"><a href="#jp-about">About</a><a href="#jp-research">Research</a><a href="mailto:${escape(data.email)}">Contact <span aria-hidden="true">↗</span></a></nav></header>
    <section class="jp-hero jp-container" aria-labelledby="jp-name"><div class="jp-hero-meta"><span>COMPUTER SCIENCE · NUS</span><span>SINGAPORE</span></div><div class="jp-hero-stage"><div class="jp-identity"><p>Ph.D. student & researcher</p><h1 id="jp-name">XiuYu<br><em>Zhang.</em></h1><a class="jp-discover" href="#jp-about"><span>About my research</span><span aria-hidden="true">↓</span></a></div><div class="jp-art">${sculpture()}</div></div><div class="jp-hero-bottom"><p>Reasoning <span>·</span> Representation <span>·</span> Reliable AI</p><div>${link(data.scholarUrl, 'Google Scholar ↗')}${link(data.githubUrl, 'GitHub ↗')}</div></div></section>
    <section class="jp-about jp-container" id="jp-about"><div class="jp-section-heading"><span class="jp-kicker">01 / INTRODUCTION</span><h2>A little <em>about me.</em></h2></div><div class="jp-introduction full-introduction">${data.introductionHtml}</div><div class="jp-affiliations"><span>RESEARCH COMMUNITIES</span><div>${data.groups.map(group => link(group.url, `${escape(group.name)} <span aria-hidden="true">↗</span>`)).join('')}</div></div></section>
    <section class="jp-research" id="jp-research"><div class="jp-container"><div class="jp-section-heading jp-work-heading"><div><span class="jp-kicker">02 / RESEARCH</span><h2>Selected <em>work.</em></h2></div>${link(data.scholarUrl, 'All publications <span aria-hidden="true">↗</span>', 'jp-all')}</div><div class="jp-paper-grid">${data.papers.slice(0, 4).map(paper).join('')}</div></div></section>
    <section class="jp-education jp-container" id="jp-education"><div class="jp-section-heading"><span class="jp-kicker">03 / EDUCATION</span><h2>Along the <em>way.</em></h2></div><div class="jp-schools">${data.education.map(school => `<article><span>${escape(school.years)}</span><h3>${escape(school.school)}</h3><p>${escape(school.degree)}</p></article>`).join('')}</div></section>
    <footer class="jp-footer"><div class="jp-container"><div class="jp-footer-top"><div><span class="jp-kicker">CONTACT</span><h2>Let’s <em>connect.</em></h2></div><a class="jp-email" href="mailto:${escape(data.email)}">${escape(data.email)} <span aria-hidden="true">↗</span></a></div><div class="jp-footer-bottom"><span>${escape(data.name)} · National University of Singapore</span><div>${link(data.scholarUrl, 'Scholar ↗')}${link(data.githubUrl, 'GitHub ↗')}<a href="#jp-top">Back to top ↑</a></div></div></div></footer>
  </div>`;
}

export const concepts = { '22': { render } };
