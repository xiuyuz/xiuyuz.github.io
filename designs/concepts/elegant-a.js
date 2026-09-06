import {renderResearch, mountResearch} from './contour-research.js';
import {mountRibbon} from './contour-motion.js';
import {mountHeroEffects} from './contour-hero-effects.js';
import {renderContact, mountContact} from './contour-contact.js';

const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external = (url, text, className = '') => `<a class="${className}" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;

// The static sculpture is also the reduced-motion fallback. Surface panels add
// softly shaded depth beneath the woven threads; both use the same geometry.
function ribbon() {
  const project = (u, v) => {
    const radius = 176 + 68 * v * Math.cos(u / 2);
    const x = radius * Math.cos(u);
    const y = radius * Math.sin(u);
    const z = 68 * v * Math.sin(u / 2);
    return [400 + x * 1.27 + y * .51, 218 - x * .18 + y * .48 - z * .94];
  };
  const path = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const panels = Array.from({length:96}, (_, i) => {
    const a = i / 96 * Math.PI * 2, b = (i + 1) / 96 * Math.PI * 2;
    const shade = .07 + (.5 + .5 * Math.sin(a - .6)) * .12;
    return `<path d="${path([project(a, -1), project(b, -1), project(b, 1), project(a, 1)])}Z" fill="url(#ct-silk)" opacity="${shade.toFixed(3)}"/>`;
  }).join('');
  const longitudinal = Array.from({length:39}, (_, j) => {
    const v = -1 + j / 19;
    return `<path d="${path(Array.from({length:113}, (_, i) => project(i / 112 * Math.PI * 2, v)))}"/>`;
  }).join('');
  const transverse = Array.from({length:85}, (_, j) => {
    const u = j / 84 * Math.PI * 2;
    return `<path d="${path([project(u, -1), project(u, 1)])}"/>`;
  }).join('');
  const edge = path(Array.from({length:225}, (_, i) => project(i / 112 * Math.PI * 2, -1)));
  return `<div class="ct-art-atmosphere" aria-hidden="true"></div><svg class="ct-orbits" viewBox="0 0 800 430" aria-hidden="true"><defs><linearGradient id="ct-orbit-line" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#aeb5d1" stop-opacity="0"/><stop offset=".3" stop-color="#aeb5d1" stop-opacity=".6"/><stop offset=".7" stop-color="#b6a4cf" stop-opacity=".5"/><stop offset="1" stop-color="#b6a4cf" stop-opacity="0"/></linearGradient></defs><g class="ct-orbit-lines" fill="none" stroke="url(#ct-orbit-line)" stroke-width=".65"><ellipse cx="420" cy="224" rx="348" ry="123" transform="rotate(-21 420 224)"/><ellipse cx="420" cy="224" rx="340" ry="170" transform="rotate(21 420 224)" stroke-dasharray="1 7" opacity=".62"/></g><circle class="ct-orbit-light" cx="731.2" cy="112.7" r="2.4" fill="#a9a3c5"/></svg><svg class="ct-ribbon" viewBox="70 38 660 352" aria-hidden="true"><defs><linearGradient id="ct-thread" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#434e7c"/><stop offset=".3" stop-color="#777fae"/><stop offset=".56" stop-color="#c3b5df"/><stop offset=".8" stop-color="#777fb0"/><stop offset="1" stop-color="#585b8a"/></linearGradient><linearGradient id="ct-silk" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#7389b8"/><stop offset=".46" stop-color="#9185b9"/><stop offset=".78" stop-color="#c3afdd"/><stop offset="1" stop-color="#6e84b5"/></linearGradient><linearGradient id="ct-rim" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#7686b5" stop-opacity=".6"/><stop offset=".35" stop-color="#fff" stop-opacity=".95"/><stop offset=".58" stop-color="#a2a4ce" stop-opacity=".5"/><stop offset=".8" stop-color="#f9f6ff" stop-opacity=".9"/><stop offset="1" stop-color="#7485b5" stop-opacity=".5"/></linearGradient></defs><g class="ct-ribbon-surface">${panels}</g><g class="ct-ribbon-threads" fill="none" stroke="url(#ct-thread)" stroke-width=".65" opacity=".86">${longitudinal}</g><g class="ct-ribbon-crosslines" fill="none" stroke="#8893b7" stroke-width=".4" opacity=".43">${transverse}</g><path class="ct-ribbon-rim" d="${edge}" fill="none" stroke="url(#ct-rim)" stroke-width="1.3"/></svg>`;
}

function contour(data) {
  const updatedDate = data.lastUpdated ? new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(`${data.lastUpdated}T00:00:00Z`)) : '';
  return `<div class="concept concept-21" id="ct-top"><div class="ct-wrap"><header class="ct-nav"><a class="ct-monogram" href="#ct-top" aria-label="XiuYu Zhang home">xz<span>.</span></a><nav aria-label="Page navigation"><a href="#ct-about">About</a><a href="#ct-research">Research</a><button class="ct-contact-trigger" type="button" data-contact-open>Contact <span aria-hidden="true">↗</span></button></nav></header><section class="ct-hero" aria-labelledby="ct-name"><div class="ct-hero-label"><span>COMPUTER SCIENCE · NUS</span><span>SINGAPORE</span></div><div class="ct-title-row"><h1 class="ct-name-effects" id="ct-name">XiuYu <em>Zhang</em></h1><div class="ct-identity"><p>${escape(data.role)}<br>${escape(data.institution)}</p><div class="ct-affiliations" role="group" aria-label="Research affiliations">${data.groups.map(group => external(group.url, group.logo ? `<img src="${escape(group.logo)}" alt="${escape(group.name)}" width="${escape(group.logoWidth)}" height="${escape(group.logoHeight)}" decoding="async">` : escape(group.name), 'ct-affiliation')).join('')}</div></div></div><div class="ct-art-panel"><div class="ct-topics"><span class="ct-label">RESEARCH INTERESTS</span>${data.interests.map((interest, i) => `<p class="ct-interest" style="--ct-interest-order:${i}"><span class="ct-interest-number" aria-hidden="true">0${i + 1}</span><span class="ct-interest-text">${escape(interest)}</span></p>`).join('')}</div>${ribbon()}<div class="ct-art-caption"><button class="ct-motion-toggle" type="button" aria-label="Pause ribbon animation" aria-pressed="false" data-paused="false"><svg class="ct-motion-pause" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2v8M8 2v8" fill="none" stroke="currentColor" stroke-width="1.4"/></svg><svg class="ct-motion-play" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 6 4-6 4Z" fill="currentColor"/></svg><span class="ct-motion-text">Pause motion</span></button></div></div><div class="ct-hero-bottom"><a href="#ct-about">Introduction <span aria-hidden="true">↓</span></a></div></section><section class="ct-about" id="ct-about"><div class="ct-section-heading"><span class="ct-label">01 / INTRODUCTION</span><h2>About</h2></div><div class="ct-introduction full-introduction"><div class="ct-personal">${data.aboutPersonalHtml}</div><div class="ct-research-intro">${data.aboutResearchHtml}</div></div></section>${renderResearch(data)}<section class="ct-education" id="ct-education"><div class="ct-section-heading"><span class="ct-label">03 / BACKGROUND</span><h2>Education</h2></div><div class="ct-schools">${data.education.map(school => `<article>${school.logo ? `<img class="ct-school-logo" src="${escape(school.logo)}" alt="" width="220" height="64" loading="lazy" decoding="async">` : ''}<span>${escape(school.years)}</span><h3>${escape(school.school)}</h3><p>${escape(school.degree)}</p><p class="ct-department">${escape(school.department)}</p></article>`).join('')}</div></section><footer class="ct-footer"><div><span class="ct-label">GET IN TOUCH</span><button class="ct-email ct-contact-trigger" type="button" data-contact-open>Reveal email <span aria-hidden="true">↗</span></button></div><div class="ct-footer-links">${external(data.scholarUrl, 'Google Scholar ↗')}${external(data.githubUrl, 'GitHub ↗')}<a href="#ct-top">Back to top ↑</a></div><p>${escape(data.name)}${updatedDate ? ` · Last updated <time datetime="${escape(data.lastUpdated)}">${escape(updatedDate)}</time>` : ''}</p></footer></div>${renderContact()}</div>`;
}

function mount(root) {
  mountResearch(root);
  mountRibbon(root);
  mountContact(root);
  mountHeroEffects(root);
}

export const concepts = {'21': {render: contour, mount}};
