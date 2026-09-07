// One pointer position lights both the name and the artwork. Updates are
// coalesced only while the pointer moves; there is no independent frame loop.
const mounted = new WeakMap();

export function mountHeroEffects(root) {
  if (mounted.has(root)) return mounted.get(root);
  const hero = root.querySelector('.ct-hero');
  const name = hero?.querySelector('.ct-name-effects');
  if (!hero || !name) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let disposed = false;
  let nextX = 0;
  let nextY = 0;

  function emit(x, y, active) {
    // x: left -1 to right +1; y: top -1 to bottom +1, within the hero.
    hero.dispatchEvent(new CustomEvent('ct-hero-light', {detail: {x, y, active}}));
  }

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    nextX = nextY = 0;
    name.style.removeProperty('--ct-name-glint');
    emit(0, 0, false);
  }

  function move(event) {
    if (disposed || event.pointerType !== 'mouse' || reduced.matches || !finePointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    nextX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    nextY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed || reduced.matches || !finePointer.matches) return;
      const position = (1 - (nextX + 1) / 2) * 66.667;
      name.style.setProperty('--ct-name-glint', `${position.toFixed(2)}%`);
      emit(nextX, nextY, true);
    });
  }

  hero.addEventListener('pointermove', move, {passive: true});
  hero.addEventListener('pointerleave', reset, {passive: true});
  reduced.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
  hero.classList.add('ct-hero-effects-enabled');

  const cleanup = () => {
    disposed = true;
    reset();
    hero.removeEventListener('pointermove', move);
    hero.removeEventListener('pointerleave', reset);
    reduced.removeEventListener('change', reset);
    finePointer.removeEventListener('change', reset);
    hero.classList.remove('ct-hero-effects-enabled');
    mounted.delete(root);
  };
  mounted.set(root, cleanup);
  return cleanup;
}
