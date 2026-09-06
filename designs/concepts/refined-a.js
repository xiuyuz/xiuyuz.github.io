const escape = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const external = (url, text, className = '') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const arrow = '<span aria-hidden="true">↗</span>';
const members = (items) => (items || []).map((item) => external(item.url, `${escape(item.name)} ${arrow}`)).join('');
const social = (data) => `${external(data.scholarUrl, `Google Scholar ${arrow}`)}${external(data.githubUrl, `GitHub ${arrow}`)}<a href="mailto:${escape(data.email)}">Email ${arrow}</a>`;
const figure = (paper, className) => `<a class="${className}" href="${escape(paper.url)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${escape(paper.title)}"><img src="${escape(paper.image)}" alt="Research figure from ${escape(paper.title)}" loading="lazy"></a>`;
const paperActions = (paper) => `${external(paper.url, `Paper ${arrow}`)}${paper.code ? external(paper.code, `Code ${arrow}`) : ''}`;
const publications = (data) => data.papers.filter((paper) => paper.image).slice(0, 4);

function oxford(data) {
  return `<div class="concept concept-11"><div class="ob-shell">
    <header class="ob-header"><a class="ob-wordmark" href="#ob-about">XZ<span> / </span>COMPUTER SCIENCE</a><nav aria-label="Page navigation"><a href="#ob-about">About</a><a href="#ob-research">Research</a><a href="mailto:${escape(data.email)}">Contact ${arrow}</a></nav></header>
    <main>
      <section id="ob-about" class="ob-about" aria-labelledby="ob-name">
        <div class="ob-title"><p class="ob-eyebrow">${escape(data.institution)}</p><h1 id="ob-name">${escape(data.name)}</h1><p class="ob-subtitle">${escape(data.role)}</p></div>
        <div class="ob-about-layout"><div class="ob-intro intro">${data.introductionHtml}</div>
          <aside class="ob-affiliations" aria-label="Academic affiliations"><div class="ob-affiliation-group"><h2>Co-advisors</h2>${members(data.advisors)}</div><div class="ob-affiliation-group"><h2>Research communities</h2>${members(data.groups)}</div><div class="ob-affiliation-group"><h2>Find me online</h2><nav aria-label="Profile links">${social(data)}</nav></div><a href="#ob-research" class="ob-research-jump">Selected research <span aria-hidden="true">↓</span></a></aside>
        </div>
      </section>
      <section id="ob-research" class="ob-research" aria-labelledby="ob-research-heading"><div class="ob-section-head"><div><span class="ob-eyebrow">PUBLICATIONS</span><h2 id="ob-research-heading">Selected research</h2></div>${external(data.scholarUrl, `All publications ${arrow}`, 'ob-all-publications')}</div>
        <div class="ob-paper-grid">${publications(data).map((paper, index) => `<article class="ob-paper">${figure(paper, 'ob-figure')}<div class="ob-paper-meta"><span>${escape(paper.tag)}</span><time>${escape(paper.year)}</time></div><h3>${external(paper.url, escape(paper.title))}</h3><p class="ob-authors">${escape(paper.authors)}</p><nav class="ob-paper-links" aria-label="Resources for paper ${index + 1}">${paperActions(paper)}</nav></article>`).join('')}</div>
      </section>
    </main><footer class="ob-footer"><span>${escape(data.name)}<small>${escape(data.institution)}</small></span><a href="mailto:${escape(data.email)}">${escape(data.email)} ${arrow}</a><a href="#ob-about">Back to top ↑</a></footer>
  </div></div>`;
}

function graphite(data) {
  return `<div class="concept concept-12"><div class="gj-layout">
    <aside class="gj-sidebar"><div class="gj-identity"><a href="#gj-about" class="gj-monogram" aria-label="XiuYu Zhang home">xz<span>.</span></a><p class="gj-sidebar-name">${escape(data.name)}</p><p class="gj-role">${escape(data.role)}</p><p class="gj-institution">${escape(data.institution)}</p></div><nav class="gj-page-nav" aria-label="Page navigation"><a href="#gj-about"><span>01</span> Introduction</a><a href="#gj-research"><span>02</span> Selected research</a><a href="#gj-contact"><span>03</span> Contact</a></nav><div class="gj-sidebar-group"><h2>Co-advised by</h2>${members(data.advisors)}</div><div class="gj-sidebar-group"><h2>Research groups</h2>${members(data.groups)}</div><nav class="gj-social" aria-label="Profile links">${social(data)}</nav></aside>
    <div class="gj-body"><header class="gj-topline"><span>PERSONAL ACADEMIC PAGE</span><span>SINGAPORE</span></header><main>
      <section id="gj-about" class="gj-about" aria-labelledby="gj-name"><p class="gj-eyebrow">COMPUTER SCIENCE · NUS</p><h1 id="gj-name">${escape(data.name)}</h1><div class="gj-intro intro">${data.introductionHtml}</div></section>
      <section id="gj-research" class="gj-research" aria-labelledby="gj-research-heading"><div class="gj-section-head"><h2 id="gj-research-heading">Selected research</h2>${external(data.scholarUrl, `All publications ${arrow}`)}</div><div class="gj-papers">${publications(data).map((paper, index) => `<article class="gj-paper"><div class="gj-paper-visual">${figure(paper, 'gj-figure')}<span class="gj-figure-caption">${String(index + 1).padStart(2, '0')} / ${escape(paper.year)}</span></div><div class="gj-paper-content"><p class="gj-paper-meta">${escape(paper.tag)} <span>·</span> ${escape(paper.year)}</p><h3>${external(paper.url, escape(paper.title))}</h3><p class="gj-authors">${escape(paper.authors)}</p><nav class="gj-paper-links" aria-label="Resources for paper ${index + 1}">${paperActions(paper)}</nav></div></article>`).join('')}</div></section>
    </main><footer id="gj-contact" class="gj-footer"><h2>Contact</h2><a href="mailto:${escape(data.email)}">${escape(data.email)} ${arrow}</a><p>${escape(data.name)} · ${escape(data.institution)}</p></footer></div>
  </div></div>`;
}

export const concepts = { '11': { render: oxford }, '12': { render: graphite } };
