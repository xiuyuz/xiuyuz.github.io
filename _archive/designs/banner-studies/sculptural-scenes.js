/* Four quiet, physically modelled sculptures for the banner studies gallery. */

const TAU = Math.PI * 2;

function physical(THREE, color, overrides = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.25,
    roughness: 0.27,
    clearcoat: 0.65,
    clearcoatRoughness: 0.19,
    side: THREE.DoubleSide,
    ...overrides,
  });
}

// A closed shell, including a real edge, rather than a double-sided flat sheet.
function shell(THREE, point, material, {
  uSegments = 84, vSegments = 36, thickness = 0.035,
} = {}) {
  const row = vSegments + 1;
  const count = (uSegments + 1) * row;
  const positions = new Float32Array(count * 6);
  const indices = [];
  const epsilon = 0.0001;
  const du = new THREE.Vector3();
  const dv = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i <= uSegments; i++) {
    for (let j = 0; j <= vSegments; j++) {
      const u = i / uSegments;
      const v = j / vSegments;
      const p = point(u, v);
      du.copy(point(Math.min(1, u + epsilon), v))
        .sub(point(Math.max(0, u - epsilon), v));
      dv.copy(point(u, Math.min(1, v + epsilon)))
        .sub(point(u, Math.max(0, v - epsilon)));
      normal.crossVectors(du, dv).normalize().multiplyScalar(thickness / 2);
      const index = i * row + j;
      positions.set([p.x + normal.x, p.y + normal.y, p.z + normal.z], index * 3);
      positions.set([p.x - normal.x, p.y - normal.y, p.z - normal.z], (count + index) * 3);
    }
  }
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * row + j;
      const b = a + row;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, c, a, c, d);
      indices.push(a + count, c + count, b + count, a + count, d + count, c + count);
    }
  }
  const wall = (a, b) => indices.push(a, a + count, b + count, a, b + count, b);
  for (let i = 0; i < uSegments; i++) {
    wall((i + 1) * row, i * row);
    wall(i * row + vSegments, (i + 1) * row + vSegments);
  }
  for (let j = 0; j < vSegments; j++) {
    wall(j, j + 1);
    wall(uSegments * row + j + 1, uSegments * row + j);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function fineCurve(THREE, points, material, radius = 0.005, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 2, radius, 5, closed), material);
}

function finish(THREE, sculpture, pose, motion = 1) {
  sculpture.rotation.set(...pose);
  const bounds = new THREE.Box3().setFromObject(sculpture);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = 3.42 / Math.max(size.x, size.y, size.z);
  sculpture.scale.setScalar(scale);
  const center = new THREE.Box3().setFromObject(sculpture).getCenter(new THREE.Vector3());
  sculpture.position.sub(center);
  const object = new THREE.Group();
  object.add(sculpture);
  return {
    object,
    update(t, pointer = {}) {
      const px = Number.isFinite(pointer.x) ? pointer.x : 0;
      const py = Number.isFinite(pointer.y) ? pointer.y : 0;
      object.rotation.x = Math.sin(t * 0.17) * 0.038 * motion + py * 0.032;
      object.rotation.y = Math.sin(t * 0.13) * 0.13 * motion + px * 0.07;
      object.rotation.z = Math.sin(t * 0.11) * 0.018 * motion;
      object.position.y = Math.sin(t * 0.27) * 0.022 * motion;
    },
    dispose() {
      const geometries = new Set();
      const materials = new Set();
      object.traverse((child) => {
        if (child.geometry) geometries.add(child.geometry);
        if (child.material) {
          for (const material of [].concat(child.material)) materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}

function landscape(THREE) {
  const sculpture = new THREE.Group();
  const porcelain = physical(THREE, '#b9ccdb', {
    metalness: 0.42, roughness: 0.26, iridescence: 0.1,
    iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 220],
  });
  const underside = physical(THREE, '#899aac', { metalness: 0.48, roughness: 0.34 });
  const contours = physical(THREE, '#597789', { metalness: 0.45, roughness: 0.29 });
  const edge = physical(THREE, '#d8e1e6', { metalness: 0.65, roughness: 0.21 });

  function membrane(u, v, height = 0) {
    const s = (u - 0.5) * 2;
    const t = (v - 0.5) * 2;
    // Rounded corners and a broad, asymmetric saddle with two lifted crests.
    const x = 1.56 * s * Math.sqrt(1 - 0.24 * t * t);
    const z = 1.17 * t * Math.sqrt(1 - 0.24 * s * s);
    const y = 0.57 * (s * s - t * t)
      + 0.29 * Math.sin(Math.PI * (t + 0.3 * s))
      + 0.12 * Math.sin(1.65 * Math.PI * s) + height;
    return new THREE.Vector3(x, y, z);
  }

  const lower = shell(THREE, (u, v) => membrane(u, v, -0.135), underside, { thickness: 0.045 });
  lower.scale.set(0.98, 1, 0.98);
  sculpture.add(lower);
  sculpture.add(shell(THREE, (u, v) => membrane(u, v), porcelain, { thickness: 0.052 }));

  for (let line = 1; line < 26; line++) {
    const v = line / 26;
    const points = [];
    for (let i = 0; i <= 70; i++) {
      const u = i / 70;
      const p = membrane(u, v);
      const du = membrane(Math.min(1, u + 0.001), v).sub(membrane(Math.max(0, u - 0.001), v));
      const dv = membrane(u, v + 0.001).sub(membrane(u, v - 0.001));
      // du × dv points below this horizontal membrane.
      p.add(du.cross(dv).normalize().multiplyScalar(-0.029));
      points.push(p);
    }
    sculpture.add(fineCurve(THREE, points, contours, 0.0036));
  }

  const outline = [];
  for (let i = 0; i < 48; i++) outline.push(membrane(i / 48, 0));
  for (let i = 0; i < 48; i++) outline.push(membrane(1, i / 48));
  for (let i = 0; i < 48; i++) outline.push(membrane(1 - i / 48, 1));
  for (let i = 0; i < 48; i++) outline.push(membrane(0, 1 - i / 48));
  sculpture.add(fineCurve(THREE, outline, edge, 0.021, true));
  return finish(THREE, sculpture, [0.72, -0.3, -0.18]);
}

function optics(THREE) {
  const sculpture = new THREE.Group();
  const rimMaterial = physical(THREE, '#9eacbb', {
    metalness: 0.88, roughness: 0.22, clearcoat: 0.5,
  });
  const porcelain = physical(THREE, '#c9d4df', { metalness: 0.23, roughness: 0.29 });
  const lavender = physical(THREE, '#a7a5c2', {
    transmission: 0.36, thickness: 0.3, ior: 1.47,
    attenuationColor: '#8882a5', attenuationDistance: 1.6,
    metalness: 0.03, roughness: 0.14, clearcoat: 1,
  });
  const blueGlass = physical(THREE, '#a5cbdc', {
    transmission: 0.75, thickness: 0.5, ior: 1.46,
    attenuationColor: '#8eb9d1', attenuationDistance: 1.3,
    metalness: 0.02, roughness: 0.09, clearcoat: 1,
    clearcoatRoughness: 0.11, side: THREE.FrontSide,
  });
  const clearGlass = physical(THREE, '#e1edf1', {
    transmission: 0.88, thickness: 0.38, ior: 1.49,
    attenuationColor: '#c2d6e3', attenuationDistance: 1.8,
    metalness: 0, roughness: 0.1, clearcoat: 1,
    side: THREE.FrontSide,
  });

  function lens(radius, depth, material, position, rotation, withRim = true) {
    const assembly = new THREE.Group();
    const profile = [];
    // A rounded biconvex cross-section, with a thicker optical edge.
    for (let i = 0; i <= 72; i++) {
      const angle = -Math.PI / 2 + Math.PI * i / 72;
      profile.push(new THREE.Vector2(radius * Math.cos(angle), depth * Math.sin(angle)));
    }
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 144), material);
    body.rotation.x = Math.PI / 2;
    assembly.add(body);
    if (withRim) {
      assembly.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.011, 10, 144), rimMaterial));
    }
    assembly.position.set(...position);
    assembly.rotation.set(...rotation);
    sculpture.add(assembly);
  }

  lens(1.16, 0.16, porcelain, [-0.37, 0.06, -0.58], [0.03, -0.12, -0.15]);
  lens(1.05, 0.14, lavender, [0.3, 0.19, -0.19], [-0.1, 0.23, 0.04]);
  lens(1.04, 0.25, blueGlass, [-0.14, -0.1, 0.28], [0.12, -0.18, -0.04]);
  lens(0.78, 0.18, clearGlass, [0.35, -0.13, 0.78], [-0.18, 0.19, 0.1]);
  return finish(THREE, sculpture, [-0.17, -0.43, -0.27], 0.8);
}

function bloom(THREE) {
  const sculpture = new THREE.Group();
  const outerMaterial = physical(THREE, '#a7bfcb', {
    metalness: 0.22, roughness: 0.28, clearcoat: 0.8,
  });
  const innerMaterial = physical(THREE, '#929fc0', {
    metalness: 0.34, roughness: 0.27, clearcoat: 0.75,
  });
  const heartMaterial = physical(THREE, '#778ba8', {
    metalness: 0.38, roughness: 0.3,
  });
  const ridgeMaterial = physical(THREE, '#94aeba', {
    metalness: 0.3, roughness: 0.37,
  });

  function petal(seed, scale, height, material, ridges) {
    function point(u, v) {
      const lateral = (v - 0.5) * 2;
      const sweep = Math.pow(Math.sin(Math.PI * u), 0.78);
      const radius = 0.18 + 1.32 * u;
      const theta = seed + 0.82 * u;
      const width = 0.49 * sweep + 0.017;
      return new THREE.Vector3(
        (radius * Math.cos(theta) - lateral * width * Math.sin(theta)) * scale,
        (radius * Math.sin(theta) + lateral * width * Math.cos(theta)) * scale,
        (0.16 + 0.58 * Math.sin(Math.PI * u) - 0.58 * u
          + 0.36 * lateral * lateral * sweep) * scale + height,
      );
    }
    sculpture.add(shell(THREE, point, material, {
      uSegments: 66, vSegments: 24, thickness: 0.048 * scale,
    }));
    if (ridges) {
      for (let ridge = 1; ridge <= 7; ridge++) {
        const v = 0.12 + ridge * 0.095;
        const points = [];
        for (let i = 0; i <= 45; i++) {
          const u = 0.08 + (i / 45) * 0.85;
          const p = point(u, v);
          const du = point(u + 0.0001, v).sub(point(u - 0.0001, v));
          const dv = point(u, v + 0.0001).sub(point(u, v - 0.0001));
          p.add(du.cross(dv).normalize().multiplyScalar(0.025 * scale));
          points.push(p);
        }
        sculpture.add(fineCurve(THREE, points, ridgeMaterial, 0.0026 * scale));
      }
    }
  }

  for (let i = 0; i < 7; i++) petal(i * TAU / 7, 1, 0, outerMaterial, true);
  for (let i = 0; i < 5; i++) petal(i * TAU / 5 + 0.35, 0.6, 0.22, innerMaterial, false);
  for (let i = 0; i < 3; i++) petal(i * TAU / 3 + 0.6, 0.3, 0.38, heartMaterial, false);
  return finish(THREE, sculpture, [0.39, -0.43, 0.11], 0.75);
}

function weave(THREE) {
  const sculpture = new THREE.Group();
  const warp = physical(THREE, '#779bae', {
    metalness: 0.65, roughness: 0.24, clearcoat: 0.8,
  });
  const weft = physical(THREE, '#aebdce', {
    metalness: 0.66, roughness: 0.25, clearcoat: 0.8,
  });
  const cutEdge = physical(THREE, '#b8c5d1', {
    metalness: 0.7, roughness: 0.22,
  });
  const strands = 12;
  const twist = 2.4;
  const phaseOffset = Math.PI / strands;

  for (const direction of [-1, 1]) {
    for (let strand = 0; strand < strands; strand++) {
      const phase = strand * TAU / strands + (direction < 0 ? phaseOffset : 0);
      const point = (u, v) => {
        const t = (u - 0.5) * 2;
        const belly = Math.pow(Math.max(0, Math.cos(t * Math.PI / 2)), 0.84);
        const radius = 0.24 + 0.69 * belly;
        // The two continuous ribbon families alternate over/under at crossings.
        const interlace = direction * 0.025
          * Math.cos(strands * twist * t - strands * phaseOffset / 2);
        const width = 0.038 + 0.068 * belly;
        const theta = phase + direction * twist * t + (v - 0.5) * width / radius;
        return new THREE.Vector3(1.6 * t, (radius + interlace) * Math.cos(theta),
          (radius + interlace) * Math.sin(theta));
      };
      sculpture.add(shell(THREE, point, direction > 0 ? warp : weft, {
        uSegments: 190, vSegments: 3, thickness: 0.014,
      }));
    }
  }

  // Quiet, machined collars finish the otherwise exposed ends of the weave.
  for (const side of [-1, 1]) {
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 12, 72), cutEdge);
    collar.rotation.y = Math.PI / 2;
    collar.position.x = side * 1.6;
    sculpture.add(collar);
  }
  return finish(THREE, sculpture, [-0.15, 0.25, -0.47], 0.8);
}

export const studies = [
  {
    id: 7,
    title: 'Latent landscape',
    description: 'A folded silver membrane, traced by delicate lines of a continuous field.',
    accent: '#5f8299',
    build: landscape,
  },
  {
    id: 8,
    title: 'Orbital optics',
    description: 'Overlapping optical glass and porcelain; a study in clarity and depth.',
    accent: '#7d84a5',
    build: optics,
  },
  {
    id: 9,
    title: 'Neural bloom',
    description: 'Sculpted porcelain shells unfold from a shared, softly shaded center.',
    accent: '#728ca4',
    build: bloom,
  },
  {
    id: 10,
    title: 'Structured light',
    description: 'Continuous metallic ribbons interlace into a precise, open volume.',
    accent: '#558a97',
    build: weave,
  },
];
