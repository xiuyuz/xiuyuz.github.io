import { createResearchSignals } from "./particle-signals.js";

const TAU = Math.PI * 2;
const smooth = (x) => {
  x = Math.max(0, Math.min(1, x));
  return x * x * (3 - 2 * x);
};
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aRegion;
  attribute float aDensity;
  attribute float aSafety;
  uniform float uTime;
  uniform float uDpr;
  uniform float uScale;
  uniform float uSafety;
  uniform float uNight;
  uniform vec3 uFocus;
  uniform vec3 uLight;
  uniform vec3 uPointer;
  uniform vec3 uCenters[3];
  uniform vec3 uColors[3];
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSharpness;
  void main(){
    vec3 center=aRegion<.5?uCenters[0]:(aRegion<1.5?uCenters[1]:uCenters[2]);
    vec3 local=position-center;
    // Counterflow within each region, independent of the whole-cloud turn.
    float turn=sin(uTime*.46+aRegion*2.094)*(.10+uFocus.z*.055);
    float c=cos(turn),s=sin(turn);
    vec3 p=center+vec3(local.x*c+local.z*s,local.y,-local.x*s+local.z*c);
    float phase=aPhase+uTime*(.65+.12*sin(aPhase));
    p+=vec3(cos(phase),sin(phase*.93),sin(phase+1.7))*(.028+.024*aDensity);
    // Coherent currents transport the fine grains through the shared volume.
    p+=vec3(sin(p.y*2.2+uTime*.70),cos(p.z*2.4-uTime*.53),sin(p.x*2.0+uTime*.59))*vec3(.055,.045,.065);
    float stray=aSafety*(1.0-uSafety);
    p+=vec3(sin(aPhase*2.0),cos(aPhase),sin(aPhase*3.0))*stray*.15;
    vec4 world=modelMatrix*vec4(p,1.0);
    vec4 view=viewMatrix*world;
    vec4 projected=projectionMatrix*view;
    // A cursor gently parts the dust locally; it settles back on pointer exit.
    vec2 away=projected.xy/projected.w-uPointer.xy;
    float influence=exp(-dot(away,away)*10.0)*uPointer.z;
    view.xy+=normalize(away+vec2(.001))*influence*.22;
    view.z+=influence*.08;
    float front=smoothstep(-1.35,1.35,world.z);
    vec3 regional=aRegion<.5?uColors[0]:(aRegion<1.5?uColors[1]:uColors[2]);
    vec3 tone=mix(vec3(.23,.32,.46),regional,.66+uFocus.z*.25);
    float illumination=.5+.5*dot(normalize(world.xyz+vec3(.1)),normalize(uLight));
    tone=mix(tone,vec3(.77,.82,.89),(1.0-front)*.30+illumination*.10);
    float signal=pow(.5+.5*sin(uTime*1.5-p.x*3.2-p.y*2.3),12.0);
    tone=mix(tone,vec3(.29,.55,.67),signal*(.10+uFocus.x*.17));
    vec3 corrected=mix(vec3(.73,.30,.38),vec3(.29,.58,.60),uSafety);
    tone=mix(tone,corrected,aSafety*(.55+uFocus.y*.40));
    tone=mix(tone,vec3(.65,.77,.89),influence*.26);
    tone=mix(tone,tone*.76+vec3(.24,.28,.33),uNight);
    vColor=tone;
    vAlpha=(.24+front*.66)*aDensity*(.88+.12*sin(aPhase+uTime*.6))+signal*.07;
    vAlpha*=mix(1.0,.76,uNight);
    vSharpness=mix(1.8,3.0,front);
    gl_Position=projectionMatrix*view;
    gl_PointSize=clamp(aSize*uDpr*uScale*(5.6/-view.z)*(1.35-front*.20),.7,5.0*uDpr);
  }
`;
const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSharpness;
  void main(){
    float d=length(gl_PointCoord-.5)*2.0;
    if(d>1.0)discard;
    float grain=exp(-d*d*vSharpness)*(1.0-smoothstep(.80,1.0,d));
    gl_FragColor=vec4(vColor,grain*vAlpha);
  }
`;

export function createParticleStudy(THREE, distribution) {
  const rand = seeded(4117 + distribution.id * 211);
  const compact = matchMedia("(max-width:760px)").matches;
  const tuning = distribution.rendering || {};
  const count = distribution.particleCount || (compact ? tuning.mobileCount || 17500 : tuning.desktopCount || 32000);
  const grainScale = compact ? tuning.mobileGrain || 1 : tuning.desktopGrain || 1;
  const pose = distribution.rotation || [0.2, -0.35, -0.08];
  const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...pose));
  const samplePoint = new THREE.Vector3();
  const centers = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    regionCounts = [0, 0, 0];
  const samples = Array.from({ length: count }, (_, i) => {
    const sample = distribution.sample(rand, i, count);
    if (!sample.position?.every(Number.isFinite)) throw new Error(`Invalid particle in study ${distribution.id}`);
    const position = sample.position,
      region = sample.region || 0;
    centers[region].add(samplePoint.fromArray(position));
    regionCounts[region]++;
    samplePoint.applyMatrix4(rotation);
    return { position, region, size: sample.size || 1, density: sample.density || 0.9, depth: samplePoint.z, phase: rand() * TAU };
  });
  centers.forEach((center, i) => center.divideScalar(regionCounts[i] || 1));
  samples.sort((a, b) => a.depth - b.depth);
  const positions = [],
    sizes = [],
    phases = [],
    regions = [],
    densities = [],
    strays = [];
  for (const sample of samples) {
    positions.push(...sample.position);
    sizes.push((1.3 + Math.pow(rand(), 4) * 1.35) * sample.size);
    phases.push(sample.phase);
    regions.push(sample.region);
    densities.push(sample.density);
    strays.push(sample.region === 1 && sample.depth > 0.05 && rand() > 0.985 ? 0.6 + rand() * 0.4 : 0);
  }
  const colors = (distribution.colors || ["#3f6089", "#7e69a2", "#428b91"]).map((c) => new THREE.Color(c).convertLinearToSRGB());
  const uniforms = {
    uTime: { value: 0 },
    uNight: { value: 0 },
    uDpr: { value: Math.min(devicePixelRatio || 1, 1.75) },
    uScale: { value: (compact ? 0.92 : 1.13) * grainScale },
    uSafety: { value: 0 },
    uFocus: { value: new THREE.Vector3() },
    uLight: { value: new THREE.Vector3(-0.6, 0.8, 1.2) },
    uPointer: { value: new THREE.Vector3(0, 0, 0) },
    uCenters: { value: centers },
    uColors: { value: colors },
  };
  const geometry = new THREE.BufferGeometry();
  for (const [name, values, size] of [
    ["position", positions, 3],
    ["aSize", sizes, 1],
    ["aPhase", phases, 1],
    ["aRegion", regions, 1],
    ["aDensity", densities, 1],
    ["aSafety", strays, 1],
  ])
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, size));
  geometry.computeBoundingSphere();
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
    toneMapped: false,
  });
  const cloud = new THREE.Points(geometry, material);
  const object = new THREE.Group();
  object.add(cloud);
  object.rotation.set(...pose);
  const signals = createResearchSignals(THREE, samples, pose);
  object.add(signals.object);
  const focusWeights = [0, 0, 0];
  const update = (time, pointer = {}) => {
    uniforms.uTime.value = time;
    const phase = ((time + 1) / 10) % 1;
    uniforms.uSafety.value = smooth((phase - 0.1) / 0.5) * (1 - smooth((phase - 0.88) / 0.12));
    focusWeights.forEach((value, i) => (focusWeights[i] = value + (Number(pointer.focus === i + 1) - value) * 0.1));
    uniforms.uFocus.value.fromArray(focusWeights);
    uniforms.uPointer.value.set(pointer.artX || 0, pointer.artY || 0, pointer.influence || 0);
    uniforms.uLight.value.set(-0.6 + (pointer.x || 0) * 0.85, 0.8 - (pointer.y || 0) * 0.4, 1.2);
    object.rotation.set(pose[0] + Math.sin(time * 0.18) * 0.09, pose[1] + Math.sin(time * 0.16) * 0.34, pose[2] + Math.sin(time * 0.13) * 0.045);
    signals.update(time, pointer);
  };
  const setTheme = (theme) => {
    uniforms.uNight.value = theme === "dark" ? 1 : 0;
    signals.setTheme?.(theme);
  };
  return { object, update, setTheme, particleCount: count };
}
