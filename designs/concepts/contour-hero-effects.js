// Pointer-only polish; no frame loop, cloned text, or added keyboard stops.
const mounted = new WeakMap();

export function mountHeroEffects(root) {
  if (mounted.has(root)) return mounted.get(root);
  const hero = root.querySelector('.ct-hero');
  const name = hero?.querySelector('.ct-name-effects');
  if (!name) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let nextPosition = 100;

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    name.style.removeProperty('--ct-name-glint');
  }
  function move(event) {
    if (event.pointerType !== 'mouse' || reduced.matches || !finePointer.matches) return;
    const bounds = name.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    nextPosition = (1 - x) * 66.667;
    if (!frame) frame = requestAnimationFrame(() => {
      name.style.setProperty('--ct-name-glint', `${nextPosition.toFixed(2)}%`);
      frame = 0;
    });
  }
  name.addEventListener('pointermove', move, {passive:true});
  name.addEventListener('pointerleave', reset, {passive:true});
  reduced.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
  hero.classList.add('ct-hero-effects-enabled');

  const cleanup = () => {
    reset();
    name.removeEventListener('pointermove', move);
    name.removeEventListener('pointerleave', reset);
    reduced.removeEventListener('change', reset);
    finePointer.removeEventListener('change', reset);
    hero.classList.remove('ct-hero-effects-enabled');
    mounted.delete(root);
  };
  mounted.set(root, cleanup);
  return cleanup;
}
