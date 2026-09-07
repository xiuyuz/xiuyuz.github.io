// A quiet orbital field surrounds the artwork; the scientific figure itself is
// never transformed or painted over. One clock serves only the active slide.
const instances = new WeakMap();

export function mountResearchMotion(carousel) {
  if (instances.has(carousel)) return instances.get(carousel);
  const toggle = carousel.querySelector('[data-pc-effects-toggle]');
  const slides = [...carousel.querySelectorAll('.pc-slide')];
  const layers = slides.map(slide => {
    const figure = slide.querySelector('.pc-enlarge');
    const canvas = figure?.querySelector('.pc-orbit-field');
    return {figure, canvas, context: canvas?.getContext('2d'), image: figure?.querySelector('img'), width: 0, height: 0, visible: false};
  });
  if (!layers.some(layer => layer.context)) return () => {};

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let current = Number(carousel.dataset.current || 0);
  let userPaused = false;
  let inView = false;
  let disposed = false;
  let frame = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  const state = () => reduced.matches ? 'reduced' : userPaused ? 'paused' : document.hidden ? 'hidden' : !inView ? 'offscreen' : 'running';

  function resize(layer) {
    if (!layer.context) return;
    const width = layer.figure.clientWidth, height = layer.figure.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    if (layer.width === width && layer.height === height && layer.scale === scale) return;
    layer.width = width;
    layer.height = height;
    layer.scale = scale;
    layer.canvas.width = Math.round(width * scale);
    layer.canvas.height = Math.round(height * scale);
    layer.context.setTransform(scale, 0, 0, scale, 0, 0);
    draw(layer);
  }

  function draw(layer) {
    const {context: ctx, width: w, height: h, figure, image} = layer;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    // Cut the exact object-fit image rectangle out of the decorative field.
    // This also protects transparent diagrams from any particles behind them.
    const box = image.getBoundingClientRect();
    const container = figure.getBoundingClientRect();
    const fit = image.naturalWidth ? Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight) : 1;
    const imageW = image.naturalWidth ? image.naturalWidth * fit : box.width;
    const imageH = image.naturalHeight ? image.naturalHeight * fit : box.height;
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.rect(box.left - container.left + (box.width - imageW) / 2 - 8, box.top - container.top + (box.height - imageH) / 2 - 8, imageW + 16, imageH + 16);
    ctx.clip('evenodd');

    const cx = w * .5 + pointerX * 4, cy = h * .47 + pointerY * 3;
    const phase = elapsed * .075;
    const orbits = [
      {rx: w * .485, ry: h * .425, angle: -.17 + Math.sin(elapsed * .06) * .035},
      {rx: w * .57, ry: h * .245, angle: .28 + Math.cos(elapsed * .055) * .045},
      {rx: w * .56, ry: h * .39, angle: -.42}
    ];
    orbits.forEach((orbit, i) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(orbit.angle);
      ctx.lineWidth = .7;
      ctx.strokeStyle = i === 1 ? 'rgba(127,153,186,.25)' : 'rgba(155,137,180,.24)';
      ctx.setLineDash(i === 2 ? [1, 7] : []);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbit.rx, orbit.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let j = 0; j < 4; j++) {
        const a = phase * (i === 1 ? -.8 : 1) + j * Math.PI / 2 + i * .82;
        const x = orbit.rx * Math.cos(a), y = orbit.ry * Math.sin(a);
        if (j === 0) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
          glow.addColorStop(0, 'rgba(151,141,192,.25)');
          glow.addColorStop(1, 'rgba(151,141,192,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 12, y - 12, 24, 24);
        }
        ctx.fillStyle = i === 1 ? 'rgba(125,151,184,.7)' : 'rgba(145,125,172,.65)';
        ctx.beginPath();
        ctx.arc(x, y, j === 0 ? 1.8 : 1.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
    figure.style.setProperty('--pc-light-x', `${(64 + Math.sin(elapsed * .14) * 17 + pointerX * 18).toFixed(2)}%`);
    figure.style.setProperty('--pc-light-y', `${(36 + Math.cos(elapsed * .11) * 14 + pointerY * 18).toFixed(2)}%`);
  }

  function tick(now) {
    frame = 0;
    if (disposed || state() !== 'running') return;
    if (!lastFrame) lastFrame = now;
    const delta = now - lastFrame;
    if (delta >= 1000 / 30 - .6) {
      const dt = Math.min(delta, 80) / 1000;
      lastFrame = now;
      elapsed += dt;
      const ease = 1 - Math.exp(-dt * 4);
      pointerX += (targetX - pointerX) * ease;
      pointerY += (targetY - pointerY) * ease;
      draw(layers[current]);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = lastFrame = 0;
    carousel.dataset.effectsState = state();
    const paused = reduced.matches || userPaused;
    if (toggle) {
      toggle.disabled = reduced.matches;
      toggle.dataset.paused = String(paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', reduced.matches ? 'Research effects disabled by reduced motion preference' : userPaused ? 'Play research effects' : 'Pause research effects');
      toggle.querySelector('.pc-effects-label').textContent = reduced.matches ? 'Effects off' : userPaused ? 'Play effects' : 'Pause effects';
    }
    if (reduced.matches) {
      elapsed = pointerX = pointerY = targetX = targetY = 0;
      layers.forEach(draw);
    }
    if (state() === 'running') frame = requestAnimationFrame(tick);
  }

  function changeSlide() {
    current = Number(carousel.dataset.current || 0);
    inView = layers[current].visible;
    pointerX = pointerY = targetX = targetY = 0;
    resize(layers[current]);
    draw(layers[current]);
    sync();
  }
  function move(event) {
    if (event.pointerType !== 'mouse' || !finePointer.matches || state() !== 'running') return;
    const figure = layers[current].figure;
    if (!figure.contains(event.target)) { targetX = targetY = 0; return; }
    const bounds = figure.getBoundingClientRect();
    targetX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    targetY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  }
  function resetPointer() { targetX = targetY = 0; }
  function toggleEffects() { userPaused = !userPaused; resetPointer(); sync(); }
  const resizeObserver = new ResizeObserver(entries => entries.forEach(entry => {
    const layer = layers.find(item => item.figure === entry.target);
    if (layer) resize(layer);
  }));
  const slideObserver = new MutationObserver(changeSlide);
  slideObserver.observe(carousel, {attributes: true, attributeFilter: ['data-current']});
  // Observe the visible figure area, rather than the potentially long abstract.
  const intersectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const layer = layers.find(item => item.figure === entry.target);
      if (layer) layer.visible = entry.isIntersecting && entry.intersectionRatio > .01;
    });
    inView = layers[current].visible;
    if (!inView) resetPointer();
    sync();
  }, {threshold: [0, .01]});
  layers.forEach(layer => {
    if (!layer.figure) return;
    intersectionObserver.observe(layer.figure);
    resizeObserver.observe(layer.figure);
    resize(layer);
    layer.image.addEventListener('load', onImageLoad);
  });
  function onImageLoad() { draw(layers[current]); }
  toggle?.addEventListener('click', toggleEffects);
  carousel.addEventListener('pointermove', move, {passive: true});
  carousel.addEventListener('pointerleave', resetPointer, {passive: true});
  reduced.addEventListener('change', sync);
  finePointer.addEventListener('change', resetPointer);
  document.addEventListener('visibilitychange', sync);
  sync();

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    slideObserver.disconnect();
    intersectionObserver.disconnect();
    toggle?.removeEventListener('click', toggleEffects);
    carousel.removeEventListener('pointermove', move);
    carousel.removeEventListener('pointerleave', resetPointer);
    reduced.removeEventListener('change', sync);
    finePointer.removeEventListener('change', resetPointer);
    document.removeEventListener('visibilitychange', sync);
    layers.forEach(layer => layer.image?.removeEventListener('load', onImageLoad));
    instances.delete(carousel);
  };
  instances.set(carousel, dispose);
  return dispose;
}
