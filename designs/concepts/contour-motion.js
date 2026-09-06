// Animate the ribbon's surface in 3D while keeping its original SVG as the
// fallback. The geometry is built once; only projected path coordinates move.
const instances = new WeakMap();
const SVG_NS = 'http://www.w3.org/2000/svg';

function surface(u, v) {
  const radius = 168 + 78 * v * Math.cos(u / 2);
  return [radius * Math.cos(u), radius * Math.sin(u), 78 * v * Math.sin(u / 2)];
}

export function mountRibbon(root) {
  if (instances.has(root)) return instances.get(root);
  const panel = root.querySelector('.ct-art-panel');
  const svg = panel?.querySelector('.ct-ribbon');
  const toggle = panel?.querySelector('.ct-motion-toggle');
  const groups = svg ? [svg.querySelector('.ct-ribbon-threads'), svg.querySelector('.ct-ribbon-crosslines')].filter(Boolean) : [];
  if (groups.length < 2) return () => {};

  // Render short, depth-sorted pieces so the woven surface has a front and
  // back. The authored SVG remains an intact fallback if scripting is absent.
  const originalLayers = [...svg.children].filter(node => node.tagName !== 'defs');
  const depthGroup = document.createElementNS(SVG_NS, 'g');
  depthGroup.setAttribute('class', 'ct-ribbon-depth');
  svg.append(depthGroup);
  originalLayers.forEach(node => node.style.display = 'none');
  panel.classList.add('ct-banner-polished');

  const orbitLines = panel.querySelector('.ct-orbit-lines');
  const orbitLight = panel.querySelector('.ct-orbit-light');
  const pieces = Array.from({length: 112}, (_, index) => {
    const a = index / 112 * Math.PI * 2;
    const b = (index + 1) / 112 * Math.PI * 2;
    const mid = (a + b) / 2;
    const group = document.createElementNS(SVG_NS, 'g');
    const face = document.createElementNS(SVG_NS, 'path');
    const weave = document.createElementNS(SVG_NS, 'path');
    const cross = document.createElementNS(SVG_NS, 'path');
    const edge = document.createElementNS(SVG_NS, 'path');
    face.setAttribute('stroke-width', '.45');
    weave.setAttribute('fill', 'none');
    weave.setAttribute('stroke-width', '.47');
    cross.setAttribute('fill', 'none');
    cross.setAttribute('stroke-width', '.38');
    edge.setAttribute('fill', 'none');
    edge.setAttribute('stroke-width', '1.25');
    group.append(face, weave, cross, edge);
    depthGroup.append(group);
    const strips = Array.from({length: 32}, (_, i) => {
      const v = -1 + 2 * i / 31;
      return [surface(a, v), surface(b, v)];
    });
    const du = [-168 * Math.sin(mid), 168 * Math.cos(mid), 0];
    const dv = [78 * Math.cos(mid / 2) * Math.cos(mid), 78 * Math.cos(mid / 2) * Math.sin(mid), 78 * Math.sin(mid / 2)];
    const normal = [du[1] * dv[2], -du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
    const length = Math.hypot(...normal);
    return {
      index, group, face, weave, cross, edge, mid,
      normal: normal.map(value => value / length),
      center: surface(mid, 0), strips,
      corners: [surface(a, -1), surface(b, -1), surface(b, 1), surface(a, 1)],
      depth: 0,
    };
  });
  let lastOrder = '';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const initialBounds = panel.getBoundingClientRect();
  let inView = initialBounds.bottom > 0 && initialBounds.top < window.innerHeight;
  let userPaused = false;
  let disposed = false;
  let frame = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const state = () => reducedMotion.matches ? 'reduced' : userPaused ? 'paused' : document.hidden ? 'hidden' : !inView ? 'offscreen' : 'running';

  function staticPose() {
    elapsed = pointerX = pointerY = targetX = targetY = 0;
    paint(0);
  }

  function paint(dt) {
    const ease = 1 - Math.exp(-dt * 4.2);
    pointerX += (targetX - pointerX) * ease;
    pointerY += (targetY - pointerY) * ease;
    const rx = .18 + Math.sin(elapsed * .19) * .10 + pointerY * .065;
    const ry = -.27 + Math.sin(elapsed * .14) * .17 + pointerX * .09;
    const rz = -.065 + Math.sin(elapsed * .23) * .032;
    const cx = Math.cos(rx), sx = Math.sin(rx);
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const cz = Math.cos(rz), sz = Math.sin(rz);
    const lift = Math.sin(elapsed * .32) * 2;
    const turn = ([x, y, z]) => {
      const tiltedY = y * cx - z * sx;
      const tiltedZ = y * sx + z * cx;
      const turnedX = x * cy + tiltedZ * sy;
      const turnedZ = -x * sy + tiltedZ * cy;
      return [turnedX * cz - tiltedY * sz, turnedX * sz + tiltedY * cz, turnedZ];
    };
    const project = point => {
      const [x, y, z] = turn(point);
      return `${(400 + x * 1.20 + y * .49).toFixed(2)},${(211 - x * .18 + y * .53 - z * .98 + lift).toFixed(2)}`;
    };
    const curve = points => points.map((point, i) => `${i ? 'L' : 'M'}${project(point)}`).join(' ');
    const lightTurn = Math.sin(elapsed * .12) * .17;
    const light = [-.28 + lightTurn, -.48, .83];
    pieces.forEach(piece => {
      const normal = turn(piece.normal);
      const diffuse = Math.min(1, Math.abs(normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2]));
      const sheen = Math.pow(diffuse, 9);
      const tone = .22 + diffuse * .63 + sheen * .15;
      const red = Math.round(102 + tone * 111);
      const green = Math.round(112 + tone * 98);
      const blue = Math.round(157 + tone * 82);
      const faceColor = `rgb(${red},${green},${blue})`;
      piece.face.setAttribute('d', curve(piece.corners) + 'Z');
      piece.face.setAttribute('fill', faceColor);
      piece.face.setAttribute('stroke', faceColor);
      piece.face.setAttribute('opacity', (.64 + diffuse * .14).toFixed(3));
      piece.weave.setAttribute('d', piece.strips.map(curve).join(' '));
      piece.weave.setAttribute('stroke', `rgb(${Math.round(77 + sheen * 155)},${Math.round(91 + sheen * 144)},${Math.round(136 + sheen * 113)})`);
      piece.weave.setAttribute('opacity', (.34 + (1 - diffuse) * .19).toFixed(3));
      piece.cross.setAttribute('d', curve([piece.corners[0], piece.corners[3]]));
      piece.cross.setAttribute('stroke', '#7180a8');
      piece.cross.setAttribute('opacity', '.25');
      piece.edge.setAttribute('d', curve(piece.strips[0]) + ' ' + curve(piece.strips.at(-1)));
      piece.edge.setAttribute('stroke', `rgb(${Math.round(123 + diffuse * 129)},${Math.round(134 + diffuse * 116)},${Math.round(177 + diffuse * 78)})`);
      piece.edge.setAttribute('opacity', (.45 + diffuse * .45).toFixed(3));
      const center = turn(piece.center);
      piece.depth = center[0] * -.327 + center[1] * .814 + center[2] * .479;
    });
    const ordered = [...pieces].sort((a, b) => a.depth - b.depth);
    const order = ordered.map(piece => piece.index).join(',');
    if (order !== lastOrder) {
      depthGroup.append(...ordered.map(piece => piece.group));
      lastOrder = order;
    }
    // Lighting and orbital accents share the sculpture's single, pausable clock.
    orbitLines?.setAttribute('transform', `rotate(${(Math.sin(elapsed * .09) * 3).toFixed(2)} 420 224)`);
    const orbitAngle = -.45 + elapsed * .045;
    const orbitX = 348 * Math.cos(orbitAngle), orbitY = 123 * Math.sin(orbitAngle);
    const orbitTurn = -21 * Math.PI / 180;
    orbitLight?.setAttribute('cx', (420 + orbitX * Math.cos(orbitTurn) - orbitY * Math.sin(orbitTurn)).toFixed(2));
    orbitLight?.setAttribute('cy', (224 + orbitX * Math.sin(orbitTurn) + orbitY * Math.cos(orbitTurn)).toFixed(2));
    panel.style.setProperty('--ct-light-x', `${(76 + Math.sin(elapsed * .14) * 5 + pointerX * 2).toFixed(2)}%`);
    panel.style.setProperty('--ct-light-y', `${(38 + Math.cos(elapsed * .11) * 6 + pointerY * 2).toFixed(2)}%`);
    panel.style.setProperty('--ct-sculpture-lift', `${lift.toFixed(2)}px`);
  }

  function tick(now) {
    frame = 0;
    if (disposed || state() !== 'running') return;
    if (!lastFrame) lastFrame = now;
    const delta = now - lastFrame;
    // Keep SVG updates at 30 fps, including on high-refresh-rate displays.
    if (delta >= 1000 / 30 - .6) {
      const dt = Math.min(delta, 80) / 1000;
      lastFrame = now;
      elapsed += dt;
      paint(dt);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = lastFrame = 0;
    const currentState = state();
    panel.dataset.motionState = currentState;
    const paused = userPaused || reducedMotion.matches;
    if (toggle) {
      const label = reducedMotion.matches ? 'Motion reduced' : userPaused ? 'Play motion' : 'Pause motion';
      toggle.disabled = reducedMotion.matches;
      toggle.dataset.paused = String(paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', reducedMotion.matches ? 'Ribbon animation disabled by reduced motion preference' : userPaused ? 'Play ribbon animation' : 'Pause ribbon animation');
      const text = toggle.querySelector('.ct-motion-text');
      if (text) text.textContent = label;
    }
    if (reducedMotion.matches) staticPose();
    if (currentState === 'running') frame = requestAnimationFrame(tick);
  }

  function onPointerMove(event) {
    if (event.pointerType !== 'mouse' || !finePointer.matches || state() !== 'running') return;
    const bounds = svg.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
  }

  function resetPointer() { targetX = targetY = 0; }
  function onPause() { userPaused = !userPaused; resetPointer(); sync(); }
  function onPreferenceChange() { resetPointer(); sync(); }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (!inView) resetPointer();
    sync();
  }) : null;

  panel.addEventListener('pointermove', onPointerMove, {passive: true});
  panel.addEventListener('pointerleave', resetPointer, {passive: true});
  toggle?.addEventListener('click', onPause);
  reducedMotion.addEventListener('change', onPreferenceChange);
  finePointer.addEventListener('change', onPreferenceChange);
  document.addEventListener('visibilitychange', sync);
  observer?.observe(panel);
  root.dataset.ribbonMounted = 'true';

  const cleanup = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    panel.removeEventListener('pointermove', onPointerMove);
    panel.removeEventListener('pointerleave', resetPointer);
    toggle?.removeEventListener('click', onPause);
    reducedMotion.removeEventListener('change', onPreferenceChange);
    finePointer.removeEventListener('change', onPreferenceChange);
    document.removeEventListener('visibilitychange', sync);
    originalLayers.forEach(node => node.style.removeProperty('display'));
    depthGroup.remove();
    panel.classList.remove('ct-banner-polished');
    orbitLines?.removeAttribute('transform');
    orbitLight?.setAttribute('cx', '731.2');
    orbitLight?.setAttribute('cy', '112.7');
    ['--ct-light-x', '--ct-light-y', '--ct-sculpture-lift'].forEach(property => panel.style.removeProperty(property));
    delete panel.dataset.motionState;
    delete root.dataset.ribbonMounted;
    instances.delete(root);
  };
  instances.set(root, cleanup);
  staticPose();
  sync();
  return cleanup;
}
