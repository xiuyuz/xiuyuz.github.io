// Real MRI-derived cortical surfaces, rendered three different ways.
// Asset provenance and the binary layout are documented in assets/SOURCES.md.
const files = new Map();
const clamp = (value, min = -1, max = 1) => Math.max(min, Math.min(max, value));

function asset(name, json = false) {
  if (!files.has(name)) {
    const request = fetch(new URL(`./assets/${name}`, import.meta.url)).then(response => {
      if (!response.ok) throw new Error(`Unable to load anatomy asset ${name} (${response.status})`);
      return json ? response.json() : response.arrayBuffer();
    }).catch(error => { files.delete(name); throw error; });
    files.set(name, request);
  }
  return files.get(name);
}

function geometryFromBinary(THREE, buffer, offset = 0) {
  const header = new DataView(buffer, offset, 8);
  const vertices = header.getUint32(0, true), count = header.getUint32(4, true);
  const positions = new Float32Array(buffer, offset + 8, vertices * 3);
  const normals = new Float32Array(buffer, offset + 8 + vertices * 12, vertices * 3);
  const indices = new Uint32Array(buffer, offset + 8 + vertices * 24, count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function physical(THREE, color, overrides = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: .32, metalness: .08,
    clearcoat: .52, clearcoatRoughness: .24,
    envMapIntensity: .90,
    ...overrides,
  });
}

function sculpture(object, rotation, animate) {
  object.rotation.set(...rotation);
  let disposed = false;
  return {
    object,
    update(time, pointer = {}) {
      if (disposed) return;
      object.rotation.set(
        rotation[0] + Math.sin(time * .09) * .025 + clamp(pointer.y || 0) * .025,
        rotation[1] + Math.sin(time * .075) * .055 + clamp(pointer.x || 0) * .06,
        rotation[2] + Math.sin(time * .061) * .012,
      );
      object.position.y = Math.sin(time * .15) * .014;
      animate?.(time);
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

async function porcelain(THREE) {
  const object = new THREE.Group();
  object.name = 'Porcelain cortex';
  const geometry = geometryFromBinary(THREE, await asset('cortex.bin'));
  const material = physical(THREE, '#e8e0d6', {
    roughness: .39, metalness: .035,
    clearcoat: .30, clearcoatRoughness: .28,
    specularIntensity: .78, envMapIntensity: .66,
  });
  const cortex = new THREE.Mesh(geometry, material);
  cortex.castShadow = cortex.receiveShadow = true;
  object.add(cortex);
  object.scale.setScalar(1.23);
  return sculpture(object, [.21, -.93, -.10]);
}

// Each contour is an actual intersection of the cortical mesh with an axial
// plane. A four-sided silver ribbon is given real width along the local surface.
// Surface normals retain the anatomical relief in the metallic highlights.
function contourGeometry(THREE, buffer) {
  const source = new Float32Array(buffer);
  const segments = source.length / 12;
  const positions = new Float32Array(segments * 12);
  const normals = new Float32Array(segments * 12);
  const indices = new Uint32Array(segments * 6);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const normalA = new THREE.Vector3(), normalB = new THREE.Vector3();
  const tangent = new THREE.Vector3(), widthA = new THREE.Vector3(), widthB = new THREE.Vector3();
  const halfWidth = .0055;
  for (let i = 0; i < segments; i++) {
    const start = i * 12;
    a.fromArray(source, start); normalA.fromArray(source, start + 3);
    b.fromArray(source, start + 6); normalB.fromArray(source, start + 9);
    tangent.copy(b).sub(a).normalize();
    widthA.crossVectors(normalA, tangent).normalize().multiplyScalar(halfWidth);
    widthB.crossVectors(normalB, tangent).normalize().multiplyScalar(halfWidth);
    for (let end = 0; end < 2; end++) {
      const point = end ? b : a, normal = end ? normalB : normalA, width = end ? widthB : widthA;
      for (let edge = 0; edge < 2; edge++) {
        const index = start + (end * 2 + edge) * 3, sign = edge ? 1 : -1;
        positions[index] = point.x + width.x * sign;
        positions[index + 1] = point.y + width.y * sign;
        positions[index + 2] = point.z + width.z * sign;
        normals.set([normal.x, normal.y, normal.z], index);
      }
    }
    const vertex = i * 4;
    indices.set([vertex, vertex + 2, vertex + 1, vertex + 1, vertex + 2, vertex + 3], i * 6);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

async function silverFiligree(THREE) {
  const object = new THREE.Group();
  object.name = 'Cortical filigree';
  const [surface, contours] = await Promise.all([asset('cortex.bin'), asset('cortex-contours.bin')]);
  const surfaceGeometry = geometryFromBinary(THREE, surface);
  const occluder = new THREE.Mesh(surfaceGeometry, new THREE.MeshBasicMaterial({colorWrite: false}));
  occluder.renderOrder = -1;
  object.add(occluder);
  const ghost = new THREE.Mesh(surfaceGeometry, physical(THREE, '#d8dee3', {
    metalness: .13, roughness: .46, transparent: true, opacity: .18,
    depthWrite: false, clearcoat: .16, envMapIntensity: .7,
  }));
  ghost.renderOrder = 1;
  object.add(ghost);
  const filigree = new THREE.Mesh(contourGeometry(THREE, contours), physical(THREE, '#8294a5', {
    metalness: .83, roughness: .28, clearcoat: .5,
    envMapIntensity: 1.14, side: THREE.DoubleSide,
  }));
  filigree.castShadow = false;
  object.add(filigree);
  object.scale.setScalar(1.25);
  return sculpture(object, [.28, -.90, -.07]);
}

function hemisphereGeometry(THREE, buffer, side) {
  const geometry = geometryFromBinary(THREE, buffer);
  const positions = geometry.getAttribute('position').array;
  const sourceIndices = geometry.index.array, indices = [];
  for (let index = 0; index < sourceIndices.length; index += 3) {
    const a = sourceIndices[index], b = sourceIndices[index + 1], c = sourceIndices[index + 2];
    const centerX = positions[a * 3] + positions[b * 3] + positions[c * 3];
    if ((centerX < 0 ? -1 : 1) === side) indices.push(a, b, c);
  }
  geometry.setIndex(indices);
  // Only referenced vertices should determine the hemisphere's bounds.
  const compact = geometry.toNonIndexed();
  geometry.dispose();
  compact.computeBoundingBox();
  compact.computeBoundingSphere();
  return compact;
}

async function innerAtlas(THREE) {
  const object = new THREE.Group();
  object.name = 'Inner atlas';
  const [cortex, inner, metadata] = await Promise.all([
    asset('cortex.bin'), asset('cortex-inner.bin'), asset('cortex-inner.metadata.json', true),
  ]);
  const hemispheres = [];
  for (const side of [-1, 1]) {
    const hemisphere = new THREE.Group();
    const geometry = hemisphereGeometry(THREE, cortex, side);
    const shell = new THREE.Mesh(geometry, physical(THREE, side < 0 ? '#9bbac0' : '#b1aec9', {
      roughness: .25, metalness: .025,
      transmission: .60, thickness: .38, ior: 1.32,
      transparent: false, opacity: 1, depthWrite: true,
      clearcoat: .73, clearcoatRoughness: .20,
      envMapIntensity: .92, side: THREE.FrontSide,
    }));
    shell.renderOrder = 3;
    const interior = new THREE.Mesh(geometry, physical(THREE, '#c5d5da', {
      transparent: true, opacity: .12, depthWrite: false,
      roughness: .46, side: THREE.BackSide,
      clearcoat: 0, envMapIntensity: .66,
    }));
    interior.renderOrder = 2;
    interior.material.dispose();
    hemisphere.add(shell);
    hemisphere.position.x = side * .46;
    hemisphere.rotation.y = side * .24;
    hemisphere.rotation.z = -side * .07;
    object.add(hemisphere);
    hemispheres.push({hemisphere, side});
  }
  const palette = ['#af987c', '#709696', '#9682a0'];
  metadata.structures.forEach((structure, index) => {
    const mesh = new THREE.Mesh(geometryFromBinary(THREE, inner, structure.byteOffset), physical(THREE, palette[index], {
      metalness: .32, roughness: .29, clearcoat: .58, envMapIntensity: 1.04,
    }));
    mesh.name = structure.name;
    mesh.castShadow = mesh.receiveShadow = true;
    object.add(mesh);
  });
  object.scale.setScalar(1.12);
  return sculpture(object, [.23, -.64, -.025], time => {
    for (const {hemisphere, side} of hemispheres) hemisphere.position.x = side * (.46 + Math.sin(time * .10) * .012);
  });
}

export const studies = [
  {
    id: 1,
    title: 'Porcelain cortex',
    description: 'An MRI-derived cortical surface, cast in warm porcelain with soft light across its folds.',
    accent: '#ac9b89',
    build: porcelain,
  },
  {
    id: 2,
    title: 'Cortical filigree',
    description: 'Fine silver contours trace the actual folds of a human cortex, suspended as an open anatomical sculpture.',
    accent: '#8c9dad',
    build: silverFiligree,
  },
  {
    id: 3,
    title: 'Inner atlas',
    description: 'Separated translucent hemispheres reveal the corpus callosum, hippocampi, and amygdalae within.',
    accent: '#9dabb1',
    build: innerAtlas,
  },
];
