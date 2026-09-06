export const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external = 'target="_blank" rel="noopener noreferrer"';
export const paperTitle = p => `<h3><a href="${escape(p.url)}" ${external}>${escape(p.title)}</a></h3>`;
export const authors = p => `<p class="rs-authors">${escape(p.authors).replaceAll('XiuYu Zhang','<strong>XiuYu Zhang</strong>')}</p>`;
export const meta = p => `<div class="rs-meta"><span class="rs-tag">${escape(p.tag)}</span><span>${escape(p.year)}</span></div>`;
export const actions = p => `<div class="rs-actions"><a href="${escape(p.url)}" ${external}>Read paper <span aria-hidden="true">↗</span></a>${p.code?`<a href="${escape(p.code)}" ${external}>Code <span aria-hidden="true">↗</span></a>`:''}</div>`;
export const figure = p => `<figure class="rs-figure"><button class="rs-zoom" data-figure="${escape(p.image)}" data-title="${escape(p.title)}" aria-label="Enlarge research figure for ${escape(p.title)}"><img src="${escape(p.image)}" alt="Research figure from ${escape(p.title)}" loading="lazy"><span class="rs-enlarge">Enlarge <span aria-hidden="true">↗</span></span></button></figure>`;
export const heading = (data, kicker = '02 / PUBLICATIONS') => `<div class="rs-heading"><div><span class="ct-label">${escape(kicker)}</span><h2>Selected research</h2></div><a class="rs-all" href="${escape(data.scholarUrl)}" ${external}>All publications <span aria-hidden="true">↗</span></a></div>`;
