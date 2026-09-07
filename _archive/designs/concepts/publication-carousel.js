import {renderVenue} from './research-venue.js';
import {mountResearchMotion} from './research-motion.js';
import {createResearchDissolve} from './research-dissolve.js?v=dark-assets-8';

const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function renderAbstract(paper, index) {
  const text = (paper.abstract || paper.summary || '').trim();
  if (!text) return '';
  const words = text.split(/\s+/);
  const curated = (paper.carouselExcerpt || '').trim();
  const expandable = curated ? curated !== text : words.length > 95;
  let excerpt = curated || text;
  if (expandable && !curated) {
    excerpt = words.slice(0, 78).join(' ');
    if (!/[.!?]$/.test(excerpt)) {
      const sentenceEnd = excerpt.lastIndexOf('. ');
      excerpt = sentenceEnd > excerpt.length * .65 ? excerpt.slice(0, sentenceEnd + 1) : `${excerpt}…`;
    }
  }
  const id = `pc-abstract-${index}`;
  return `<div class="pc-abstract"><span class="pc-abstract-label">${paper.abstract ? 'Abstract' : 'Overview'}</span><div class="pc-abstract-body" id="${id}"><p data-pc-excerpt>${escape(excerpt)}</p>${expandable ? `<p data-pc-full hidden>${escape(text)}</p>` : ''}</div>${expandable ? `<button class="pc-abstract-toggle" type="button" data-pc-abstract-toggle aria-expanded="false" aria-controls="${id}"><span data-pc-abstract-label>Read full abstract</span><span data-pc-abstract-symbol aria-hidden="true">+</span></button>` : ''}</div>`;
}

/** Render a figure and abstract above each paper title. */
export function renderCarousel(papers = []) {
  if (!papers.length) return '';
  const count = papers.length;
  return `<div class="publication-carousel" role="region" aria-roledescription="carousel" aria-label="Research highlights" tabindex="0" data-current="0">
    <div class="pc-heading"><span>RESEARCH, IN FOCUS</span><div class="pc-heading-tools"><button class="pc-effects-toggle" type="button" data-pc-effects-toggle data-paused="false" aria-pressed="false" aria-label="Pause research effects"><svg class="pc-effects-pause" width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M3 2v8M7 2v8" fill="none" stroke="currentColor" stroke-width="1.3"/></svg><svg class="pc-effects-play" width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="m2 2 6 4-6 4Z" fill="currentColor"/></svg><span class="pc-effects-label">Pause effects</span></button><span class="pc-counter" aria-hidden="true"><span data-pc-current>01</span><span class="pc-counter-rule">/</span>${String(count).padStart(2, '0')}</span></div></div>
    <div class="pc-window"><div class="pc-track">${papers.map((paper, index) => `<article class="pc-slide" role="group" aria-roledescription="slide" aria-label="${index + 1} of ${count}" data-pc-index="${index}" data-paper-key="${escape(paper.key)}"${index ? ' inert aria-hidden="true"' : ''}>
      <div class="pc-feature${paper.abstract || paper.summary ? '' : ' pc-feature-figure-only'}"><button class="pc-enlarge" type="button" data-figure="${escape(paper.image)}" data-title="${escape(paper.title)}" aria-label="Enlarge figure from ${escape(paper.title)}"><canvas class="pc-orbit-field" aria-hidden="true"></canvas><img src="${escape(paper.image)}" alt="Research figure from ${escape(paper.title)}" loading="${index ? 'lazy' : 'eager'}" decoding="async" draggable="false"><span class="pc-enlarge-label" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M10 2h4v4M14 2 9 7M6 14H2v-4M2 14l5-5" stroke="currentColor" stroke-width="1.2"/></svg>Enlarge figure</span></button>${renderAbstract(paper, index)}</div>
      <div class="pc-caption"><h3><a href="${escape(paper.url)}" target="_blank" rel="noopener noreferrer">${escape(paper.title)}</a></h3><div class="pc-caption-footer"><div class="pc-meta">${renderVenue(paper)}</div><a class="pc-details" href="#selected-paper-${escape(paper.key)}">Research details <span aria-hidden="true">↓</span></a></div></div>
    </article>`).join('')}</div></div>
    ${count > 1 ? `<div class="pc-controls"><div class="pc-selectors" role="group" aria-label="Choose a research figure">${papers.map((paper, index) => `<button class="pc-picker${index ? '' : ' is-current'}" type="button" data-pc-goto="${index}" aria-label="Show figure ${index + 1} of ${count}: ${escape(paper.title)}"${index ? '' : ' aria-current="true"'}><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('')}</div><div class="pc-arrows"><button class="pc-arrow" type="button" data-pc-direction="-1" aria-label="Previous research figure"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" stroke-width="1.3"/></svg></button><button class="pc-arrow" type="button" data-pc-direction="1" aria-label="Next research figure"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" stroke-width="1.3"/></svg></button></div></div>` : ''}
    <p class="pc-status" role="status" aria-live="polite" aria-atomic="true"></p>
  </div>`;
}

/** Accept a carousel element or an ancestor; mounting a second time is a no-op. */
export function mountCarousel(root = document) {
  const disposers = [];
  const carousels = root.matches?.('.publication-carousel') ? [root] : root.querySelectorAll('.publication-carousel');
  for (const carousel of carousels) {
    if (carousel.dataset.pcMounted) continue;
    carousel.dataset.pcMounted = 'true';
    const slides = [...carousel.querySelectorAll('.pc-slide')];
    if (!slides.length) continue;
    const track = carousel.querySelector('.pc-track');
    const viewport = carousel.querySelector('.pc-window');
    const pickers = [...carousel.querySelectorAll('.pc-picker')];
    const status = carousel.querySelector('.pc-status');
    const lifecycle = new AbortController();
    const dissolve = carousel.dataset.transition === 'particles' ? createResearchDissolve(carousel) : null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let target = 0;
    let pointer = null;
    let suppressClickUntil = 0;
    const updateHeight = () => {
      viewport.style.height = `${Math.ceil(slides[current].getBoundingClientRect().height)}px`;
    };
    // Each slide can grow to show its full abstract without clipping the title
    // or leaving the height of an expanded, inactive slide behind.
    const observer = new ResizeObserver(updateHeight);
    slides.forEach(slide => observer.observe(slide));
    updateHeight();

    const commit = (index) => {
      const oldSlide = slides[current];
      const hadSlideFocus = oldSlide.contains(document.activeElement);
      const focusClass = document.activeElement?.closest('[data-pc-abstract-toggle]') ? '[data-pc-abstract-toggle]' : document.activeElement?.classList.contains('pc-details') ? '.pc-details' : document.activeElement?.closest('h3') ? 'h3 a' : '.pc-enlarge';
      current = index;
      carousel.dataset.current = String(current);
      track.style.transform = `translateX(-${current * 100}%)`;
      slides.forEach((slide, i) => {
        slide.inert = i !== current;
        if (i !== current) slide.setAttribute('aria-hidden', 'true');
        else slide.removeAttribute('aria-hidden');
      });
      pickers.forEach((picker, i) => {
        picker.classList.toggle('is-current', i === current);
        if (i === current) picker.setAttribute('aria-current', 'true');
        else picker.removeAttribute('aria-current');
      });
      carousel.querySelector('[data-pc-current]').textContent = String(current + 1).padStart(2, '0');
      const title = slides[current].querySelector('h3').textContent.trim();
      status.textContent = `Figure ${current + 1} of ${slides.length}: ${title}`;
      updateHeight();
      if (dissolve && carousel.classList.contains('pc-dissolve-active') && !reduced.matches) {
        slides[current].querySelectorAll('.pc-abstract,.pc-caption').forEach(copy=>copy.animate([{opacity:0},{opacity:1}],{duration:300,easing:'ease-out'}));
      }
      // Focus an equivalent control only when switching away from a focused slide.
      if (hadSlideFocus) (slides[current].querySelector(focusClass) || slides[current].querySelector('.pc-enlarge')).focus({preventScroll: true});
    };
    const show = (next) => {
      const index = (next + slides.length) % slides.length;
      if (index === target) return;
      // Finish any pending destination before starting the latest request.
      dissolve?.cancel();
      target = index;
      if (index === current) return;
      if (dissolve) dissolve.transition(slides[current],slides[index],()=>commit(index));
      else commit(index);
    };

    carousel.addEventListener('click', event => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (event.target.closest('.pc-enlarge,[data-pc-abstract-toggle]')) dissolve?.cancel();
      const picker = event.target.closest('[data-pc-goto]');
      const arrow = event.target.closest('[data-pc-direction]');
      let abstractToggle = event.target.closest('[data-pc-abstract-toggle]');
      if (abstractToggle?.closest('.pc-slide').inert) abstractToggle = slides[current].querySelector('[data-pc-abstract-toggle]');
      if (abstractToggle) {
        const expanded = abstractToggle.getAttribute('aria-expanded') !== 'true';
        const abstract = abstractToggle.closest('.pc-abstract');
        abstract.querySelector('[data-pc-excerpt]').hidden = expanded;
        abstract.querySelector('[data-pc-full]').hidden = !expanded;
        abstractToggle.setAttribute('aria-expanded', String(expanded));
        abstractToggle.querySelector('[data-pc-abstract-label]').textContent = expanded ? 'Show less' : 'Read full abstract';
        abstractToggle.querySelector('[data-pc-abstract-symbol]').textContent = expanded ? '−' : '+';
        updateHeight();
      }
      if (picker) show(Number(picker.dataset.pcGoto));
      if (arrow) show(target + Number(arrow.dataset.pcDirection));
    }, {capture:true,signal:lifecycle.signal});

    carousel.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        show(target + (event.key === 'ArrowRight' ? 1 : -1));
      }
    }, {signal:lifecycle.signal});

    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' || !event.isPrimary) return;
      pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
    }, {signal:lifecycle.signal});
    viewport.addEventListener('pointerup', event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      pointer = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        suppressClickUntil = Date.now() + 350;
        show(target + (dx < 0 ? 1 : -1));
      }
    }, {signal:lifecycle.signal});
    viewport.addEventListener('pointercancel', () => { pointer = null; }, {signal:lifecycle.signal});
    const disposeMotion = mountResearchMotion(carousel);
    disposers.push(()=>{lifecycle.abort();observer.disconnect();dissolve?.dispose();disposeMotion();delete carousel.dataset.pcMounted;});
  }
  return ()=>disposers.forEach(dispose=>dispose());
}
