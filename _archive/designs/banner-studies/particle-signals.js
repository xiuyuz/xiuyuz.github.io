// Three concurrent research signals, drawn entirely with fine dust sprites and
// a sparse internal constellation. Coordinates remain local to the dust cluster.
const TAU = Math.PI * 2;
const fract = value => value - Math.floor(value);
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = value => { value = clamp(value); return value * value * (3 - 2 * value); };

export function createResearchSignals(THREE, samples, pose = [0, 0, 0]) {
  const object = new THREE.Group();
  object.name = 'Concurrent research signals';
  if (!samples?.length) return {object, update() {}, dispose() {}};

  const euler = pose?.isEuler ? pose.clone() : new THREE.Euler(...(Array.isArray(pose) ? pose : [0, 0, 0]));
  const center = new THREE.Vector3();
  const candidates = [];
  const stride = Math.max(1, Math.floor(samples.length / 720));
  for (let index = 0; index < samples.length; index += stride) {
    const sample = samples[index];
    if (!sample?.position || !sample.position.every(Number.isFinite)) continue;
    const position = new THREE.Vector3().fromArray(sample.position);
    center.add(position);
    candidates.push({position, region: clamp(Math.round(sample.region || 0), 0, 2), view: position.clone().applyEuler(euler)});
  }
  if (!candidates.length) return {object, update() {}, dispose() {}};
  center.divideScalar(candidates.length);
  const viewCenter = center.clone().applyEuler(euler);
  const radii = candidates.map(candidate => candidate.position.distanceTo(center)).sort((a, b) => a - b);
  const radius = Math.max(.45, radii[Math.floor((radii.length - 1) * .91)]);
  const inversePose = new THREE.Quaternion().setFromEuler(euler).invert();
  const front = new THREE.Vector3(0, 0, 1).applyQuaternion(inversePose);

  const palette = ['#4d80b1', '#429c90', '#9169af'].map(color => new THREE.Color(color));
  const reasoningColor = new THREE.Color('#3f7198');
  const reasoningPulse = new THREE.Color('#417d9e');
  const coral = new THREE.Color('#c45865');
  const teal = new THREE.Color('#3b9489');
  const temporaryColor = new THREE.Color();
  const scratch = new THREE.Vector3();
  const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2);

  function sprites(count, name) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const opacities = new Float32Array(count);
    const geometry = new THREE.BufferGeometry();
    for (const [name, values, width] of [['position', positions, 3], ['aColor', colors, 3], ['aSize', sizes, 1], ['aOpacity', opacities, 1]]) {
      const attribute = new THREE.BufferAttribute(values, width);
      attribute.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute(name, attribute);
    }
    const material = new THREE.ShaderMaterial({
      uniforms: {uPixelRatio: {value: pixelRatio}},
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aOpacity;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = aSize * uPixelRatio * clamp(6.5 / max(1.0, -viewPosition.z), 0.78, 1.2);
          vColor = aColor;
          vOpacity = aOpacity;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec2 p = gl_PointCoord * 2.0 - 1.0;
          float radius2 = dot(p, p);
          if (radius2 > 1.0) discard;
          float core = exp(-8.0 * radius2);
          float haze = exp(-3.5 * radius2) * 0.115;
          float alpha = (core + haze) * vOpacity;
          if (alpha < 0.008) discard;
          gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.10), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      blending: THREE.NormalBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.name = name;
    points.renderOrder = 8;
    points.frustumCulled = false;
    object.add(points);
    return {
      geometry, positions, colors, sizes, opacities,
      write(index, position, color, size, opacity) {
        position.toArray(positions, index * 3);
        color.toArray(colors, index * 3);
        sizes[index] = size;
        opacities[index] = opacity;
      },
      commit() {
        for (const attribute of Object.values(geometry.attributes)) attribute.needsUpdate = true;
      },
    };
  }

  // Prefer the near half of the actual cloud, then spread sixteen anchors over
  // it. Choosing sampled locations keeps the network inside each distribution.
  let pool = candidates.filter(candidate => candidate.view.z > viewCenter.z - radius * .12 && candidate.position.distanceTo(center) < radius);
  if (pool.length < 20) pool = candidates;
  let seed = pool[0];
  let seedScore = Infinity;
  for (const candidate of pool) {
    const score = candidate.position.distanceToSquared(center) - (candidate.view.z - viewCenter.z) * radius * .18;
    if (score < seedScore) { seed = candidate; seedScore = score; }
  }
  const selected = [seed];
  const selectedSet = new Set(selected);
  while (selected.length < Math.min(16, pool.length)) {
    let best, bestScore = -1;
    for (const candidate of pool) {
      if (selectedSet.has(candidate)) continue;
      let nearest = Infinity;
      for (const existing of selected) {
        const dx = candidate.view.x - existing.view.x, dy = candidate.view.y - existing.view.y;
        const dz = candidate.view.z - existing.view.z;
        nearest = Math.min(nearest, dx * dx + dy * dy + dz * dz * .22);
      }
      if (nearest > bestScore) { best = candidate; bestScore = nearest; }
    }
    if (!best) break;
    selected.push(best); selectedSet.add(best);
  }
  const anchors = selected.map(candidate => candidate.position.clone());
  const movingAnchors = anchors.map(anchor => anchor.clone());
  const nodeCount = anchors.length;
  const nodeActivity = new Float32Array(nodeCount);
  const edges = [];
  const edgeKeys = new Set();
  function addEdge(a, b) {
    const key = [Math.min(a, b), Math.max(a, b)].join(':');
    if (a === b || edgeKeys.has(key)) return;
    edgeKeys.add(key); edges.push([a, b]);
  }

  // A minimum spanning tree plus four short cross-links stays legible and
  // avoids the dense triangular web produced by connecting every nearby node.
  const connected = new Set([0]);
  while (connected.size < nodeCount) {
    let bestA = -1, bestB = -1, bestDistance = Infinity;
    for (const a of connected) for (let b = 0; b < nodeCount; b++) {
      if (connected.has(b)) continue;
      const distance = anchors[a].distanceToSquared(anchors[b]);
      if (distance < bestDistance) { bestA = a; bestB = b; bestDistance = distance; }
    }
    if (bestB < 0) break;
    addEdge(bestA, bestB); connected.add(bestB);
  }
  const additionalEdges = [];
  for (let a = 0; a < nodeCount; a++) for (let b = a + 1; b < nodeCount; b++) {
    if (!edgeKeys.has(`${a}:${b}`)) additionalEdges.push({a, b, length: anchors[a].distanceToSquared(anchors[b])});
  }
  additionalEdges.sort((a, b) => a.length - b.length);
  additionalEdges.slice(0, 4).forEach(edge => addEdge(edge.a, edge.b));

  const linePositions = new Float32Array(edges.length * 6);
  const lineAlpha = new Float32Array(edges.length * 2);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
  lineGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(lineAlpha, 1).setUsage(THREE.DynamicDrawUsage));
  const lineMaterial = new THREE.ShaderMaterial({
    uniforms: {uColor: {value: reasoningColor}, uOpacity: {value: .70}},
    vertexShader: `
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4(uColor, vAlpha * uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true, depthWrite: false, depthTest: false, toneMapped: false,
  });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  lines.name = 'Sparse internal reasoning network';
  lines.renderOrder = 7; lines.frustumCulled = false;
  object.add(lines);
  const reasoningNodes = sprites(nodeCount, 'Reasoning constellation nodes');
  const pulseCount = edges.length ? 4 : 0, pulseLength = 7;
  const reasoningTraces = sprites(pulseCount * pulseLength, 'Traveling reasoning traces');

  // Five small, loosely spaced coral packets move toward aligned teal targets.
  // They disappear after settling, before being recycled at the outer location.
  const safetyCount = 5, safetyDustCount = 7;
  const safety = Array.from({length: safetyCount}, (_, index) => {
    const anchor = anchors[(index * 3 + 2) % nodeCount];
    const end = anchor.clone().lerp(center, .16).addScaledVector(front, radius * .08);
    const outward = anchor.clone().sub(center).normalize();
    if (outward.lengthSq() < .1) outward.set(Math.cos(index * 1.9), Math.sin(index * 1.9), .2).normalize();
    const side = new THREE.Vector3().crossVectors(outward, front).normalize();
    const start = end.clone().addScaledVector(outward, radius * (.33 + index * .021)).addScaledVector(side, radius * .11);
    const controlA = start.clone().addScaledVector(side, radius * .10).addScaledVector(front, radius * .035);
    const controlB = end.clone().addScaledVector(outward, radius * .105).addScaledVector(side, -radius * .045);
    return {curve: new THREE.CubicBezierCurve3(start, controlA, controlB, end), outward, side, period: 7.2 + index * .53, phase: index * .193};
  });
  const safetySprites = sprites(safetyCount * safetyDustCount, 'Outliers moving into alignment');

  // Modality centers use actual regional samples. If regional means overlap,
  // use different near-facing sectors so transport retains a visible distance.
  const regionalMeans = Array.from({length: 3}, () => new THREE.Vector3());
  const regionalCounts = [0, 0, 0];
  for (const candidate of candidates) { regionalMeans[candidate.region].add(candidate.position); regionalCounts[candidate.region]++; }
  regionalMeans.forEach((mean, region) => regionalCounts[region] ? mean.divideScalar(regionalCounts[region]) : mean.copy(center));
  const meansOverlap = regionalMeans.some((mean, i) => regionalMeans.some((other, j) => j > i && mean.distanceTo(other) < radius * .36));
  const hubs = regionalMeans.map((mean, region) => {
    const theta = region * TAU / 3 + .38;
    const preferred = new THREE.Vector3(Math.cos(theta) * radius * .57, Math.sin(theta) * radius * .48, radius * .12).applyQuaternion(inversePose).add(center);
    const target = meansOverlap ? preferred : mean.clone().addScaledVector(front, radius * .11);
    const regional = candidates.filter(candidate => candidate.region === region && candidate.position.distanceTo(center) < radius * 1.06);
    let closest = regional[0] || candidates[0], best = Infinity;
    for (const candidate of regional) {
      const score = candidate.position.distanceToSquared(target);
      if (score < best) { closest = candidate; best = score; }
    }
    return closest.position.clone().lerp(target, .12);
  });
  const routes = hubs.map((start, index) => {
    const end = hubs[(index + 1) % 3];
    const direction = end.clone().sub(start).normalize();
    const side = new THREE.Vector3().crossVectors(direction, front).normalize();
    const controlA = start.clone().lerp(end, .33).addScaledVector(side, radius * .14).addScaledVector(front, radius * .025);
    const controlB = start.clone().lerp(end, .69).addScaledVector(side, radius * .10);
    return {curve: new THREE.CubicBezierCurve3(start, controlA, controlB, end), side, period: 5.5 + index * .47};
  });
  const packetsPerRoute = 2, dustPerPacket = 6, hubDustCount = 5;
  const transportCount = routes.length * packetsPerRoute * dustPerPacket;
  const modalitySprites = sprites(transportCount + hubs.length * hubDustCount, 'Traveling multimodal dust packets');

  const focus = [0, 0, 0], additionalTime = [0, 0, 0];
  let lastTime = 0, disposed = false;
  function update(time = 0, pointer = {}) {
    if (disposed) return;
    if (time < lastTime) additionalTime.fill(0);
    const dt = clamp(time - lastTime, 0, .10);
    lastTime = time;
    const focusedInterest = Number(pointer.focus) || 0;
    for (let index = 0; index < 3; index++) {
      const target = focusedInterest === index + 1 ? 1 : 0;
      focus[index] += (target - focus[index]) * (1 - Math.exp(-dt * 6));
      additionalTime[index] += dt * focus[index] * .27;
    }
    const reasoningTime = time + additionalTime[0];
    const safetyTime = time + additionalTime[1];
    const modalityTime = time + additionalTime[2];

    nodeActivity.fill(0);
    for (let index = 0; index < nodeCount; index++) {
      const phase = index * 1.73;
      movingAnchors[index].copy(anchors[index]);
      movingAnchors[index].x += Math.sin(time * .36 + phase) * radius * .022;
      movingAnchors[index].y += Math.cos(time * .29 + phase) * radius * .018;
      movingAnchors[index].z += Math.sin(time * .33 + phase * .8) * radius * .024;
    }
    for (let index = 0; index < edges.length; index++) {
      const [a, b] = edges[index];
      movingAnchors[a].toArray(linePositions, index * 6);
      movingAnchors[b].toArray(linePositions, index * 6 + 3);
      lineAlpha[index * 2] = lineAlpha[index * 2 + 1] = .55 + .10 * Math.sin(reasoningTime * .68 + index * 1.7) ** 2;
    }
    for (let pulse = 0; pulse < pulseCount; pulse++) {
      const raw = reasoningTime / (2.45 + pulse * .37) + pulse * .213;
      const cycle = Math.floor(raw), phase = fract(raw);
      const edgeIndex = (cycle * (5 + pulse * 2) + pulse * 7) % edges.length;
      let [a, b] = edges[edgeIndex];
      if ((cycle + pulse) % 2) [a, b] = [b, a];
      const visibility = smooth(phase / .10) * smooth((1 - phase) / .10);
      for (let trail = 0; trail < pulseLength; trail++) {
        const u = phase - trail * .036;
        scratch.copy(movingAnchors[a]).lerp(movingAnchors[b], clamp(u));
        const opacity = u < 0 ? 0 : visibility * (1 - trail / pulseLength) ** 1.3 * (.91 + focus[0] * .09);
        reasoningTraces.write(pulse * pulseLength + trail, scratch, reasoningPulse, (trail === 0 ? 10.5 : 5.7 - trail * .18) * (1 + focus[0] * .30), opacity);
      }
      lineAlpha[edgeIndex * 2] += visibility * .38;
      lineAlpha[edgeIndex * 2 + 1] += visibility * .30;
      nodeActivity[b] = Math.max(nodeActivity[b], smooth((phase - .72) / .22) * smooth((1 - phase) / .035));
    }
    for (let index = 0; index < nodeCount; index++) {
      temporaryColor.copy(reasoningColor).lerp(palette[selected[index].region], .23);
      reasoningNodes.write(index, movingAnchors[index], temporaryColor, (8 + nodeActivity[index] * 1.5) * (1 + focus[0] * .30), .70 + focus[0] * .16 + nodeActivity[index] * .14);
    }
    lineMaterial.uniforms.uOpacity.value = (.70 + focus[0] * .20) * (1 - .18 * Math.max(focus[1], focus[2]));
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.aAlpha.needsUpdate = true;
    reasoningNodes.commit(); reasoningTraces.commit();

    for (let index = 0; index < safetyCount; index++) {
      const packet = safety[index];
      const phase = fract(safetyTime / packet.period + packet.phase);
      const travel = smooth((phase - .13) / .62);
      const visibility = smooth(phase / .075) * smooth((1 - phase) / .12);
      const alignment = smooth((travel - .43) / .55);
      temporaryColor.copy(coral).lerp(teal, alignment);
      for (let dust = 0; dust < safetyDustCount; dust++) {
        const progress = clamp(travel - dust * .009 * (1 - alignment));
        packet.curve.getPoint(progress, scratch);
        const theta = dust * 2.399 + safetyTime * (.16 + dust * .008);
        const scatter = radius * (.026 + (1 - alignment) * .020) * (dust ? .55 + dust * .10 : .22);
        scratch.addScaledVector(packet.side, Math.cos(theta) * scatter);
        scratch.addScaledVector(front, Math.sin(theta) * scatter);
        scratch.addScaledVector(packet.outward, Math.sin(theta * 1.7) * scatter * .45);
        safetySprites.write(index * safetyDustCount + dust, scratch, temporaryColor, (dust ? 5.5 + (dust % 3) * .32 : 11) * (1 + focus[1] * .30), visibility * (.86 + focus[1] * .14) * (dust ? .64 : 1));
      }
    }
    safetySprites.commit();

    for (let routeIndex = 0; routeIndex < routes.length; routeIndex++) {
      const route = routes[routeIndex];
      for (let packet = 0; packet < packetsPerRoute; packet++) {
        const phase = fract(modalityTime / route.period + packet * .5 + routeIndex * .19);
        for (let dust = 0; dust < dustPerPacket; dust++) {
          const u = phase - dust * (.021 + (dust % 2) * .004);
          const progress = clamp(u);
          route.curve.getPoint(progress, scratch);
          const theta = dust * 2.399 + packet * 1.1 + modalityTime * .29;
          const scatter = radius * (.018 + (dust % 3) * .006) * Math.sin(progress * Math.PI);
          scratch.addScaledVector(route.side, Math.cos(theta) * scatter);
          scratch.addScaledVector(front, Math.sin(theta) * scatter);
          temporaryColor.copy(palette[routeIndex]).lerp(palette[(routeIndex + 1) % 3], smooth((progress - .58) / .40));
          const visibility = u < 0 ? 0 : smooth(progress / .075) * smooth((1 - progress) / .08);
          const opacity = visibility * (.84 + focus[2] * .16) * (1 - dust / (dustPerPacket + 2));
          modalitySprites.write((routeIndex * packetsPerRoute + packet) * dustPerPacket + dust, scratch, temporaryColor, (dust === 0 ? 10.5 : 5.7 - dust * .16) * (1 + focus[2] * .30), opacity);
        }
      }
    }
    hubs.forEach((hub, index) => {
      for (let dust = 0; dust < hubDustCount; dust++) {
        const phase = dust * 2.399 + index * .7;
        scratch.copy(hub);
        scratch.x += Math.cos(phase + modalityTime * .12) * radius * .034 * (dust ? 1 : .12);
        scratch.y += Math.sin(phase + modalityTime * .12) * radius * .030 * (dust ? 1 : .12);
        scratch.z += Math.sin(phase * 1.5) * radius * .022;
        const breathe = .92 + Math.sin(modalityTime * 1.15 + index * 2.1) * .08;
        modalitySprites.write(transportCount + index * hubDustCount + dust, scratch, palette[index], (dust ? 4.7 : 8.5) * (1 + focus[2] * .30), breathe * (.61 + focus[2] * .20) * (dust ? .67 : 1));
      }
    });
    modalitySprites.commit();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    object.traverse(child => { child.geometry?.dispose(); child.material?.dispose(); });
  }

  function setTheme(theme) {
    const night=theme==='dark';
    const colors=night?['#86b8de','#79c5b7','#bea0d9']:['#4d80b1','#429c90','#9169af'];
    palette.forEach((color,index)=>color.set(colors[index]));
    reasoningColor.set(night?'#81abc9':'#3f7198');
    reasoningPulse.set(night?'#c0dcea':'#417d9e');
    coral.set(night?'#e68c98':'#c45865');
    teal.set(night?'#81cbbd':'#3b9489');
  }
  update(0, {});
  return {object, update, dispose, setTheme};
}
