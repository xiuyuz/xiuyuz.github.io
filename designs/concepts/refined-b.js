const escape = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const arrow = '<span aria-hidden="true">↗</span>';
const external = (url, label, className = '') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
const introduction = data => data.introductionHtml || `<p>${escape(data.bio)}</p>`;
const people = (items = []) => items.map(item => external(item.url, `${escape(item.name)} ${arrow}`)).join('');
const socials = data => `${external(data.scholarUrl, `Google Scholar ${arrow}`)}${external(data.githubUrl, `GitHub ${arrow}`)}<a href="mailto:${escape(data.email)}">Email ${arrow}</a>`;
const paperMeta = paper => `<span>${escape(paper.tag || paper.venue)}</span><time>${escape(paper.year)}</time>`;
const paperFigure = (paper, prefix, index) => external(paper.url, `<span class="${prefix}-figure-caption"><span>FIG. ${String(index + 1).padStart(2, '0')}</span>${arrow}</span><img src="${escape(paper.image)}" alt="Research figure for ${escape(paper.title)}" loading="lazy">`, `${prefix}-figure`);
const paperLinks = paper => `${external(paper.url, `Read paper ${arrow}`)}${paper.code ? external(paper.code, `Code ${arrow}`) : ''}`;

function tidal(data) {
  return `<div class="concept concept-13"><div class="tn-wrap">
    <header class="tn-topbar"><a href="#tn-about" class="tn-wordmark">XZ<span> / </span>Computer Science</a><nav aria-label="Page navigation"><a href="#tn-about">About</a><a href="#tn-research">Research</a><a href="mailto:${escape(data.email)}">Contact ${arrow}</a></nav></header>
    <main>
      <section class="tn-about" id="tn-about" aria-labelledby="tn-name">
        <div class="tn-name-row"><div><p class="tn-kicker">${escape(data.institution)}</p><h1 id="tn-name">${escape(data.name)}</h1></div><p class="tn-role">${escape(data.role)}<span>Singapore</span></p></div>
        <div class="tn-intro-layout"><div class="tn-introduction">${introduction(data)}</div><aside class="tn-margin" aria-label="Academic affiliations"><div class="tn-margin-block"><span class="tn-label">Co-advised by</span>${people(data.advisors)}</div><div class="tn-margin-block"><span class="tn-label">Research communities</span>${people(data.groups)}</div><div class="tn-margin-block"><span class="tn-label">Elsewhere</span><nav aria-label="Profile links">${socials(data)}</nav></div><p class="tn-margin-location"><span aria-hidden="true">↳</span> School of Computing<br>National University of Singapore</p></aside></div>
      </section>
      <section class="tn-research" id="tn-research" aria-labelledby="tn-research-title"><div class="tn-section-head"><div><span class="tn-label">Research / 2024—2026</span><h2 id="tn-research-title">Selected <em>research</em></h2></div>${external(data.scholarUrl, `All publications ${arrow}`, 'tn-all')}</div><div class="tn-papers">${data.papers.slice(0, 4).map((paper, index) => `<article class="tn-paper">${paperFigure(paper, 'tn', index)}<div class="tn-paper-meta">${paperMeta(paper)}</div><h3>${external(paper.url, escape(paper.title))}</h3><p class="tn-authors">${escape(paper.authors)}</p><div class="tn-paper-links">${paperLinks(paper)}</div></article>`).join('')}</div></section>
      <section class="tn-education" aria-labelledby="tn-education-title"><div><span class="tn-label">Background</span><h2 id="tn-education-title">Education</h2></div><div class="tn-education-list">${data.education.map(item => `<article><span>${escape(item.years)}</span><h3>${escape(item.school)}</h3><p>${escape(item.degree)}</p></article>`).join('')}</div></section>
    </main><footer class="tn-footer"><span>${escape(data.name)}<small>Computer Science · NUS</small></span><a href="mailto:${escape(data.email)}">${escape(data.email)} ${arrow}</a><a href="#tn-about">Back to top ↑</a></footer>
  </div></div>`;
}

function indigo(data) {
  return `<div class="concept concept-14"><div class="if-wrap">
    <header class="if-masthead"><a href="#if-about" class="if-wordmark">XiuYu Zhang<span>Academic folio</span></a><div>Computer Science<br>${escape(data.institution)}</div><a href="mailto:${escape(data.email)}">Get in touch ${arrow}</a></header>
    <div class="if-layout"><aside class="if-rail"><div class="if-rail-inner"><p class="if-rail-label">On this page</p><nav class="if-contents" aria-label="Page navigation"><a href="#if-about"><span>01</span> Introduction</a><a href="#if-research"><span>02</span> Research</a><a href="#if-background"><span>03</span> Background</a></nav><div class="if-rail-group"><p class="if-rail-label">Co-advisors</p>${people(data.advisors)}</div><div class="if-rail-group"><p class="if-rail-label">Affiliations</p>${people(data.groups)}</div><nav class="if-profile-links" aria-label="Profile links">${socials(data)}</nav></div></aside>
      <main><section class="if-about" id="if-about" aria-labelledby="if-name"><p class="if-overline">${escape(data.role)}</p><h1 id="if-name">${escape(data.name)}</h1><div class="if-introduction">${introduction(data)}</div></section>
      <section class="if-research" id="if-research" aria-labelledby="if-research-title"><div class="if-section-head"><h2 id="if-research-title"><span>02</span> Selected research</h2>${external(data.scholarUrl, `All papers ${arrow}`)}</div><div class="if-papers">${data.papers.slice(0, 4).map((paper, index) => `<article class="if-paper">${paperFigure(paper, 'if', index)}<div class="if-paper-copy"><div class="if-paper-meta">${paperMeta(paper)}</div><h3>${external(paper.url, escape(paper.title))}</h3><p class="if-authors">${escape(paper.authors)}</p><div class="if-paper-links">${paperLinks(paper)}</div></div></article>`).join('')}</div></section>
      <section class="if-background" id="if-background" aria-labelledby="if-background-title"><div class="if-section-head"><h2 id="if-background-title"><span>03</span> Background</h2></div><div class="if-education">${data.education.map(item => `<article><p>${escape(item.years)}</p><div><h3>${escape(item.school)}</h3><p>${escape(item.degree)}</p></div></article>`).join('')}</div></section>
      <footer class="if-footer"><div><span>Contact</span><a href="mailto:${escape(data.email)}">${escape(data.email)} ${arrow}</a></div><a href="#if-about">Back to top ↑</a></footer></main>
    </div><div class="if-signoff"><span>${escape(data.name)} / Computer Science</span><span>National University of Singapore</span></div>
  </div></div>`;
}

export const concepts = { '13': { render: tidal }, '14': { render: indigo } };
