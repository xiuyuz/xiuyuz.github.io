const e = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const external = 'target="_blank" rel="noopener noreferrer"';
const link = (url, text, cls = '') => `<a class="${cls}" href="${e(url)}" ${external}>${text}</a>`;

// A curved lattice surface, projected into an original native SVG sculpture.
function sculpture() {
  function point(u, v) {
    let x = u;
    let y = v;
    let z = .48 * (u * u - v * v) + .13 * Math.sin(2 * u) * Math.cos(2 * v);
    [y,z] = [y * .66 - z * .751, y * .751 + z * .66];
    [x,z] = [x * .94 + z * .342, -x * .342 + z * .94];
    [x,y] = [x * .94 - y * .342, x * .342 + y * .94];
    return {x:330 + 173 * x, y:207 + 160 * y, z};
  }
  const faces=[];
  for(let i=0;i<45;i++) for(let j=0;j<45;j++) {
    const u=-1.2+i/45*2.4, next=-1.2+(i+1)/45*2.4, v=-1.2+j/45*2.4, nv=-1.2+(j+1)/45*2.4;
    const p=[point(u,v),point(next,v),point(next,nv),point(u,nv)];
    const shade=Math.sin(u*1.7+.2)*14 + (j/45)*14;
    const rgb=[205+shade,217+shade+Math.sin(v)*10,234+shade-Math.sin(v)*7].map(n=>Math.min(250,Math.round(n)));
    faces.push({z:p.reduce((n,x)=>n+x.z,0)/4,html:`<polygon points="${p.map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" fill="rgb(${rgb})" stroke="rgba(91,112,143,.19)" stroke-width=".42" stroke-linejoin="round"/>`});
  }
  return `<svg class="lt-sculpture" viewBox="0 0 660 440" aria-hidden="true" focusable="false"><defs><radialGradient id="lt-shadow"><stop stop-color="#8494ad" stop-opacity=".19"/><stop offset="1" stop-color="#8494ad" stop-opacity="0"/></radialGradient></defs><ellipse cx="340" cy="388" rx="210" ry="28" fill="url(#lt-shadow)"/>${faces.sort((a,b)=>a.z-b.z).map(f=>f.html).join('')}</svg>`;
}

function render(data) {
  return `<div class="concept concept-23" id="lt-top"><div class="lt-shell"><header class="lt-header"><a class="lt-wordmark" href="#lt-top" aria-label="XiuYu Zhang home">xz<span>.</span></a><span class="lt-header-note">COMPUTER SCIENCE / NUS</span><nav aria-label="Page navigation"><a href="#lt-about">About</a><a href="#lt-research">Research</a><a href="mailto:${e(data.email)}">Contact <span>↗</span></a></nav></header>
  <section class="lt-hero"><div class="lt-title"><span class="lt-label">XIUYU ZHANG / ACADEMIC PROFILE</span><h1>XiuYu <em>Zhang.</em></h1><div class="lt-role"><p>${e(data.role)}</p><p>${e(data.institution)}</p></div></div><div class="lt-art">${sculpture()}<span class="lt-art-caption">REASONING · REPRESENTATION · RELIABLE AI</span></div><div class="lt-hero-footer"><a href="#lt-about">An introduction <span>↓</span></a><div>${link(data.scholarUrl,'Google Scholar ↗')}${link(data.githubUrl,'GitHub ↗')}</div></div></section>
  <section class="lt-about" id="lt-about"><div class="lt-section-heading"><span class="lt-label">01 / ABOUT</span><h2>A little about <em>me.</em></h2></div><div class="lt-introduction full-introduction">${data.introductionHtml}</div></section>
  <section class="lt-research" id="lt-research"><div class="lt-section-heading lt-work-heading"><div><span class="lt-label">02 / SELECTED WORK</span><h2>Research in <em>focus.</em></h2></div>${link(data.scholarUrl,'All publications <span>↗</span>','lt-all')}</div><div class="lt-papers">${data.papers.slice(0,4).map((p,i)=>`<article class="lt-paper"><div class="lt-paper-meta"><span>0${i+1} / ${e(p.tag)}</span><span>${e(p.year)}</span></div><div class="lt-paper-layout">${link(p.url,`<img src="${e(p.image)}" alt="Research figure from ${e(p.title)}" loading="lazy"><span class="lt-figure-arrow" aria-hidden="true">↗</span>`,'lt-figure')}<div class="lt-paper-copy"><h3>${link(p.url,e(p.title))}</h3><p class="lt-authors">${e(p.authors).replaceAll('XiuYu Zhang','<strong>XiuYu Zhang</strong>')}</p><p class="lt-summary">${e(p.summary)}</p><div class="lt-paper-links">${link(p.url,'Read paper ↗')}${p.code?link(p.code,'Code ↗'):''}</div></div></div></article>`).join('')}</div></section>
  <section class="lt-education"><div class="lt-section-heading"><span class="lt-label">03 / BACKGROUND</span><h2>Academic <em>path.</em></h2></div><div class="lt-schools">${data.education.map(s=>`<article><span>${e(s.years)}</span><h3>${e(s.school)}</h3><p>${e(s.degree)}</p></article>`).join('')}</div></section>
  <footer class="lt-footer"><div class="lt-contact"><span class="lt-label">GET IN TOUCH</span><a href="mailto:${e(data.email)}">${e(data.email)} <span>↗</span></a></div><div class="lt-footer-base"><span>${e(data.name)} / Singapore</span><div>${link(data.scholarUrl,'Scholar ↗')}${link(data.githubUrl,'GitHub ↗')}<a href="#lt-top">Back to top ↑</a></div></div></footer></div></div>`;
}
export const concepts = {'23':{render}};
