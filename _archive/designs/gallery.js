import { catalog, getFavorites, toggleFavorite } from './catalog.js';
let filter = 'All';
let onlyFavorites = false;
const collectionName = document.body.dataset.collection;
const isNewCollection = Boolean(collectionName);
const collection = catalog.filter(c => collectionName ? c.collection === collectionName : !c.collection);
const grid = document.querySelector('#design-grid');
function render() {
  const favorites = getFavorites().filter(id => collection.some(c => c.id === id));
  const visible = collection.filter(c => (filter === 'All' || c.group === filter) && (!onlyFavorites || favorites.includes(c.id)));
  grid.innerHTML = visible.map(c => `<article class="design-card" style="--paper:${c.colors[0]}">
    <a class="preview-link" href="./preview.html?design=${c.id}" aria-label="Explore ${c.name}"><img src="./previews/${c.id}.jpg" width="1280" height="${isNewCollection ? 1200 : 900}" alt="${c.name} academic homepage design" ${collection.indexOf(c) > 1 ? 'loading="lazy"' : 'fetchpriority="high"'}><span class="open-preview">Explore design <span>↗</span></span></a>
    <div class="card-copy"><div class="card-top"><a class="card-title" href="./preview.html?design=${c.id}"><span class="card-number">${c.id}</span><h2>${c.name}</h2></a><div class="card-actions">${c.recommended ? '<span class="suggested">A GOOD START</span>' : ''}<button class="favorite ${favorites.includes(c.id) ? 'saved' : ''}" data-save="${c.id}" aria-label="${favorites.includes(c.id) ? 'Remove' : 'Save'} ${c.name} ${favorites.includes(c.id) ? 'from' : 'to'} shortlist" aria-pressed="${favorites.includes(c.id)}">${favorites.includes(c.id) ? '♥' : '♡'}</button></div></div><p class="card-description">${c.description}</p><div class="card-meta"><span class="card-mood">${c.mood}</span><span class="swatches" aria-hidden="true">${c.colors.map(color => `<i style="--swatch:${color}"></i>`).join('')}</span></div></div>
  </article>`).join('');
  document.querySelector('#favorite-count').textContent = favorites.length;
  document.querySelector('#empty-state').hidden = visible.length > 0;
  document.querySelector('#shortlist').classList.toggle('active', onlyFavorites);
  document.querySelector('#shortlist').setAttribute('aria-pressed', String(onlyFavorites));
  document.querySelector('#shortlist').setAttribute('aria-label', `${onlyFavorites ? 'Show all designs' : 'Show shortlist'}, ${favorites.length} saved designs`);
  document.querySelector('#empty-title').textContent = favorites.length ? 'No favorites in this style yet.' : 'Your shortlist starts here.';
  document.querySelector('#empty-description').textContent = favorites.length ? 'Try another style or explore the complete collection.' : 'Save the designs you like with the heart button.';
}
document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]'); if (!button) return;
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
  render();
});
grid.addEventListener('click', event => {
  const button = event.target.closest('[data-save]'); if (!button) return;
  const id = button.dataset.save;
  const position = [...grid.querySelectorAll('[data-save]')].indexOf(button);
  const saved = toggleFavorite(id).includes(id);
  render();
  const buttons = [...grid.querySelectorAll('[data-save]')];
  (document.querySelector(`[data-save="${id}"]`) || buttons[position] || buttons.at(-1) || document.querySelector('#shortlist')).focus({ preventScroll: true });
  document.querySelector('#save-status').textContent = `${catalog.find(c => c.id === id).name} ${saved ? 'saved to' : 'removed from'} your shortlist.`;
});
document.querySelector('#shortlist').addEventListener('click', () => { onlyFavorites = !onlyFavorites; render(); });
document.querySelector('#show-all').addEventListener('click', () => { onlyFavorites = false; document.querySelector('[data-filter="All"]').click(); });
window.addEventListener('storage', render);
window.addEventListener('pageshow', render);
render();
