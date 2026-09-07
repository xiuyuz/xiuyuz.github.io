// Three gallery sculptures, authored as actual smooth, closed 3D surfaces.
// THREE is supplied by the shared gallery renderer; this file has no imports.
const TAU = Math.PI * 2;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const ease = value => { value = clamp(value); return value * value * (3 - 2 * value); };

function satin(THREE, color, overrides = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: .54, roughness: .27,
    clearcoat: .58, clearcoatRoughness: .25,
    envMapIntensity: 1.18,
    ...overrides,
  });
}

// A rounded, flattened solid cross section gives the wide face a soft edge and
// real thickness. Its normals and edge highlights are lit by the shared room.
function ribbon(THREE, {
  point, width, thickness = .035, twist = () => 0,
  segments = 224, sides = 32, front = '#d2dbea', back = '#8599bb',
}) {
  const positions = [], colors = [], indices = [];
  const frontColor = new THREE.Color(front), backColor = new THREE.Color(back);
  const color = new THREE.Color();
  const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3();
  const n = new THREE.Vector3(), b = new THREE.Vector3(), vertex = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = point(t);
    tangent.copy(point(t + .0001)).sub(point(t - .0001)).normalize();
    normal.set(0, 1, 0).addScaledVector(tangent, -tangent.y).normalize();
    if (normal.lengthSq() < .1) normal.set(0, 0, 1).addScaledVector(tangent, -tangent.z).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    const roll = twist(t);
    n.copy(normal).multiplyScalar(Math.cos(roll)).addScaledVector(binormal, Math.sin(roll));
    b.copy(binormal).multiplyScalar(Math.cos(roll)).addScaledVector(normal, -Math.sin(roll));
    const halfWidth = typeof width === 'function' ? width(t) : width;
    const halfThickness = typeof thickness === 'function' ? thickness(t) : thickness;
    for (let j = 0; j < sides; j++) {
      const angle = j / sides * TAU;
      const x = Math.sign(Math.cos(angle)) * Math.abs(Math.cos(angle)) ** .45;
      const y = Math.sign(Math.sin(angle)) * Math.abs(Math.sin(angle)) ** .45;
      vertex.copy(center).addScaledVector(n, x * halfWidth).addScaledVector(b, y * halfThickness);
      positions.push(vertex.x, vertex.y, vertex.z);
      color.copy(backColor).lerp(frontColor, .5 + .5 * Math.sin(angle));
      colors.push(color.r, color.g, color.b);
      if (i < segments) {
        const a = i * sides + j, c = i * sides + (j + 1) % sides;
        const next = (i + 1) * sides + j, d = (i + 1) * sides + (j + 1) % sides;
        indices.push(a, c, next, c, d, next);
      }
    }
  }
  // Closed ends prevent paper-thin silhouettes as the object turns.
  for (const end of [0, segments]) {
    const center = point(end / segments), centerIndex = positions.length / 3;
    positions.push(center.x, center.y, center.z);
    color.copy(frontColor).lerp(backColor, .5);
    colors.push(color.r, color.g, color.b);
    for (let j = 0; j < sides; j++) {
      const a = end * sides + j, b = end * sides + (j + 1) % sides;
      indices.push(...(end === 0 ? [centerIndex, b, a] : [centerIndex, a, b]));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, satin(THREE, '#ffffff', {vertexColors: true}));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function result(object, rotation, updateMaterial) {
  object.rotation.set(...rotation);
  let disposed = false;
  return {
    object,
    update(time, pointer = {}) {
      if (disposed) return;
      const x = clamp(pointer.x || 0, -1, 1), y = clamp(pointer.y || 0, -1, 1);
      object.rotation.set(
        rotation[0] + Math.sin(time * .12) * .032 + y * .032,
        rotation[1] + Math.sin(time * .095) * .07 + x * .055,
        rotation[2] + Math.sin(time * .082) * .015,
      );
      object.position.y = Math.sin(time * .17) * .016;
      updateMaterial?.(time);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const geometries = new Set(), materials = new Set();
      object.traverse(node => {
        if (node.geometry) geometries.add(node.geometry);
        if (node.material) for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}

function foldedManifold(THREE) {
  const object = new THREE.Group();
  object.name = 'Folded manifold';
  const surface = ribbon(THREE, {
    point: t => {
      const u = t * 2 - 1;
      return new THREE.Vector3(1.48 * u, .65 * Math.sin(Math.PI * u), .38 * Math.cos(Math.PI * u * 1.03) - .09);
    },
    width: t => .46 + .13 * Math.sin(Math.PI * t) ** 2,
    thickness: .037,
    twist: t => -.94 + t * 1.90,
    front: '#d3dce9', back: '#8399be',
  });
  surface.material.iridescence = .07;
  surface.material.iridescenceIOR = 1.25;
  surface.material.iridescenceThicknessRange = [120, 180];
  object.add(surface);
  return result(object, [.20, -.27, -.18]);
}

function convergence(THREE) {
  const object = new THREE.Group();
  object.name = 'Confluence';
  const fronts = ['#c7d6e2', '#e0e5eb', '#d5cbe2'];
  const backs = ['#7e9bad', '#9faec3', '#a391b8'];
  for (let index = 0; index < 3; index++) {
    const lane = index - 1;
    const surface = ribbon(THREE, {
      point: t => {
        const u = t * 2 - 1;
        const merge = ease((t - .12) / .74);
        const spread = .70 * (1 - merge) + .355 * merge;
        return new THREE.Vector3(
          u * 1.58,
          lane * spread + .32 * Math.sin(u * Math.PI * .80),
          .36 * Math.cos(u * Math.PI * .76) + lane * (.26 * (1 - merge) + .10 * merge) - .12,
        );
      },
      width: t => .19 - .035 * ease((t - .15) / .72),
      thickness: .038,
      twist: t => -.42 + .60 * t + lane * .045,
      segments: 208,
      front: fronts[index], back: backs[index],
    });
    surface.material.metalness = .62;
    surface.material.roughness = .25;
    surface.material.clearcoat = .55;
    object.add(surface);
  }
  return result(object, [.25, -.34, -.30]);
}

function wovenField(THREE) {
  const object = new THREE.Group();
  object.name = 'Harmonic lattice';
  const dark = new THREE.Color('#788dac'), light = new THREE.Color('#c9d3e1');
  const materials = Array.from({length: 8}, (_, i) => satin(THREE, dark.clone().lerp(light, i / 7), {
    metalness: .66, roughness: .30, clearcoat: .42, envMapIntensity: 1.34,
  }));
  class Filament extends THREE.Curve {
    constructor(phase) { super(); this.phase = phase; }
    getPoint(t, target = new THREE.Vector3()) {
      const u = t * TAU;
      const weave = this.phase + u * 2;
      const radius = 1.18 + .27 * Math.cos(weave);
      return target.set(radius * Math.cos(u), radius * Math.sin(u) * .78, .40 * Math.sin(weave));
    }
  }
  const count = 44;
  for (let i = 0; i < count; i++) {
    const phase = i / count * TAU;
    const geometry = new THREE.TubeGeometry(new Filament(phase), 176, .0125, 8, true);
    const tone = Math.round((.5 + .5 * Math.cos(phase - .6)) * 7);
    const filament = new THREE.Mesh(geometry, materials[tone]);
    filament.castShadow = filament.receiveShadow = true;
    object.add(filament);
  }
  return result(object, [.42, -.15, -.20]);
}

export const studies = [
  {
    id: 4,
    title: 'Folded manifold',
    description: 'One continuous satin surface folds through several views of a shared representation.',
    accent: '#8195b7',
    build: foldedManifold,
  },
  {
    id: 5,
    title: 'Confluence',
    description: 'Three distinct metallic streams settle into one coherent, gently curved space.',
    accent: '#879fac',
    build: convergence,
  },
  {
    id: 6,
    title: 'Harmonic lattice',
    description: 'Fine metallic filaments reveal an ordered structure around an open center.',
    accent: '#8195ae',
    build: wovenField,
  },
];
