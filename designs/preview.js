import { catalog, getFavorites, toggleFavorite } from './catalog.js';
const params = new URLSearchParams(location.search);
const item = catalog.find(c => c.id === params.get('design')) || catalog[0];
const collection = catalog.filter(c => item.collection ? c.collection === item.collection : !c.collection);
const index = collection.indexOf(item);
document.title = `${item.name} — Design preview`;
document.querySelector('#design-name').textContent = item.name;
document.querySelector('#design-number').textContent = item.collection ? `${item.id} · ${index + 1} of ${collection.length}` : `${item.id} / ${collection.length}`;
if (item.collection === 'refinements') {
  document.querySelector('.back-link').href = './refinements.html';
  document.querySelector('.back-link span').textContent = 'Refinements';
  document.querySelector('.back-link').setAttribute('aria-label', 'Back to the six refined designs');
}
if (item.collection === 'bold') {
  document.querySelector('.back-link').href = './bold.html';
  document.querySelector('.back-link span').textContent = 'New directions';
  document.querySelector('.back-link').setAttribute('aria-label', 'Back to the four new designs');
}
if (item.collection === 'elegant') {
  document.querySelector('.back-link').href = './elegant.html';
  document.querySelector('.back-link span').textContent = 'Elegant studies';
  document.querySelector('.back-link').setAttribute('aria-label', 'Back to the three elegant designs');
}
if (item.collection === 'research') {
  document.querySelector('.back-link').href = './research.html';
  document.querySelector('.back-link span').textContent = 'Research layouts';
  document.querySelector('.back-link').setAttribute('aria-label', 'Back to the five research layouts');
}
document.querySelector('#concept-frame').src = `./concept.html?design=${item.id}${item.focus || ''}`;
document.querySelector('#concept-frame').title = `${item.name} academic homepage`;
document.querySelector('#full-page').href = `./concept.html?design=${item.id}${item.focus || ''}`;
const device = params.get('device') === 'mobile' ? 'mobile' : 'desktop';
const frame = document.querySelector('#concept-frame');
new ResizeObserver(() => { document.querySelector('#device-note').textContent = `${Math.round(frame.getBoundingClientRect().width)} px · Scroll inside the preview`; }).observe(frame);
function setDevice(next) {
  document.querySelector('#stage').classList.toggle('mobile', next === 'mobile');
  document.querySelector('#device-note').hidden = next !== 'mobile';
  document.querySelectorAll('[data-device]').forEach(button => { button.classList.toggle('active', button.dataset.device === next); button.setAttribute('aria-pressed', String(button.dataset.device === next)); });
  params.set('device', next); params.set('design', item.id);
  history.replaceState(null, '', `?${params}`);
  document.querySelector('#previous').href = `?design=${collection[(index + collection.length - 1) % collection.length].id}&device=${next}`;
  document.querySelector('#next').href = `?design=${collection[(index + 1) % collection.length].id}&device=${next}`;
}
document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => setDevice(button.dataset.device)));
function renderSave() {
  const saved = getFavorites().includes(item.id);
  const button = document.querySelector('#save-design');
  button.innerHTML = `${saved ? '♥' : '♡'} <span>${saved ? 'Saved' : 'Save'}</span>`;
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${item.name} ${saved ? 'from' : 'to'} shortlist`);
  button.classList.toggle('saved', saved);
}
document.querySelector('#save-design').addEventListener('click', () => { const saved = toggleFavorite(item.id).includes(item.id); renderSave(); document.querySelector('#preview-status').textContent = `${item.name} ${saved ? 'saved' : 'removed'}.`; });
window.addEventListener('storage', renderSave);
setDevice(device); renderSave();
