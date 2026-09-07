// Spatial probability distributions only: every visible element is a particle.
// The shared renderer supplies the fine dust, depth, color, and interaction.

const TAU = Math.PI * 2;

function gaussian(rand) {
  // Rejection keeps the tails natural without letting a rare sample set the
  // camera framing for thirty thousand otherwise closely grouped particles.
  for (let attempt = 0; attempt < 5; attempt++) {
    const value = Math.sqrt(-2 * Math.log(Math.max(1e-9, rand()))) * Math.cos(TAU * rand());
    if (Math.abs(value) < 2.6) return value;
  }
  return (rand() - 0.5) * 2;
}

function point(position, region, density = 0.86, size = 1) {
  const radius = Math.hypot(...position);
  if (radius > 1.5) {
    // Smoothly compress only the outermost wisps, with no hard spherical cut.
    const scale = (1.5 + 0.2 * Math.tanh((radius - 1.5) / 0.2)) / radius;
    position = position.map(value => value * scale);
  }
  return {position, region, density, size};
}

function braidedCurrents(rand) {
  const current = Math.floor(rand() * 3);
  const t = (rand() - 0.5) * 2;
  const envelope = Math.pow(Math.max(0, 1 - t * t), 0.68);
  const phase = current * TAU / 3 + t * Math.PI * 1.12;
  const a = gaussian(rand), b = gaussian(rand), c = gaussian(rand);
  const thickness = 0.065 + envelope * 0.105;
  const diffuse = rand() < 0.19;
  const radius = diffuse ? 0.2 : 0.49;
  return point([
    1.48 * t + a * 0.068,
    radius * Math.sin(phase) * envelope + b * thickness + 0.09 * t,
    radius * Math.cos(phase) * envelope + c * thickness * 0.88,
  ], current, diffuse ? 0.59 : 0.8 + 0.17 * envelope, 0.78 + rand() * 0.43);
}

function suspendedWisps(rand) {
  const layer = Math.floor(rand() * 3);
  const level = layer - 1;
  const a = gaussian(rand), b = gaussian(rand), c = gaussian(rand);
  const spread = 0.48 + 0.1 * (1 - Math.abs(level));
  const x = a * spread + Math.sin(layer * 1.7) * 0.1;
  const z = c * (0.35 + 0.07 * (1 - Math.abs(level))) + 0.08 * level;
  const diffuse = rand() < 0.23;
  const wave = 0.22 * Math.sin(1.65 * x + 0.85 * z)
    + 0.13 * x * z + 0.07 * Math.sin(3 * z + layer * 0.4);
  const y = wave + (diffuse ? b * 0.32 : level * 0.55 + b * 0.085);
  return point([x * 1.11, y, z], layer % 3,
    diffuse ? 0.55 : 0.87 - Math.abs(level) * 0.11, 0.77 + rand() * 0.42);
}

function asymmetricVortex(rand) {
  const t = Math.pow(rand(), 0.88);
  const diffuse = rand() < 0.21;
  const angle = -1.18 + 5.63 * t + gaussian(rand) * (diffuse ? 0.24 : 0.09);
  const radialNoise = gaussian(rand) * (0.075 + 0.067 * t);
  const radius = 0.26 + 1.04 * t + radialNoise;
  const x = radius * Math.cos(angle) + 0.1 * t + 0.055 * Math.sin(2.3 * angle);
  const y = 0.85 * radius * Math.sin(angle) + 0.08 * Math.cos(angle * 0.6);
  const z = 0.26 * Math.sin(angle * 0.73) + 0.19 * (t - 0.5)
    + gaussian(rand) * (diffuse ? 0.26 : 0.135 + 0.055 * t);
  return point([x, y, z], Math.min(2, Math.floor(t * 3)),
    diffuse ? 0.54 : 0.82 + 0.13 * Math.sin(Math.PI * t), 0.75 + rand() * 0.47);
}

// Irregular, overlapping anisotropic kernels. Their extended axes follow
// neighboring kernels; the result has a shared body rather than isolated balls.
const islands = [
  {p: [-0.95, 0.16, -0.1], width: [0.24, 0.12, 0.16], angle: 0.68, region: 0},
  {p: [-0.41, -0.25, 0.18], width: [0.28, 0.14, 0.18], angle: -0.54, region: 0},
  {p: [0.12, 0.13, -0.03], width: [0.31, 0.2, 0.2], angle: 0.27, region: 1},
  {p: [0.76, -0.01, 0.13], width: [0.27, 0.13, 0.17], angle: -0.18, region: 2},
  {p: [0.31, 0.76, 0.02], width: [0.23, 0.12, 0.16], angle: 1.03, region: 1},
  {p: [-0.29, 0.65, -0.24], width: [0.25, 0.12, 0.16], angle: -0.33, region: 0},
  {p: [0.47, -0.62, -0.12], width: [0.23, 0.12, 0.17], angle: -0.96, region: 2},
];
const bridges = [[0, 1], [0, 5], [1, 2], [2, 3], [2, 4], [4, 5], [2, 6], [3, 6]];

function clusterHierarchy(rand) {
  const category = rand();
  if (category < 0.17) {
    const x = gaussian(rand) * 0.49;
    return point([x, gaussian(rand) * 0.34 + 0.08, gaussian(rand) * 0.25],
      x < -0.22 ? 0 : x > 0.32 ? 2 : 1, 0.52, 0.75 + rand() * 0.36);
  }
  if (category < 0.38) {
    const edge = bridges[Math.floor(rand() * bridges.length)];
    const a = islands[edge[0]], b = islands[edge[1]];
    const t = rand();
    const arch = Math.sin(t * Math.PI);
    return point([
      a.p[0] + (b.p[0] - a.p[0]) * t + gaussian(rand) * 0.075,
      a.p[1] + (b.p[1] - a.p[1]) * t + gaussian(rand) * 0.075 + arch * 0.05,
      a.p[2] + (b.p[2] - a.p[2]) * t + gaussian(rand) * 0.11 + arch * 0.1,
    ], t < 0.5 ? a.region : b.region, 0.62, 0.8 + rand() * 0.36);
  }
  const index = Math.floor(rand() * islands.length);
  const island = islands[index];
  const a = gaussian(rand), b = gaussian(rand), c = gaussian(rand);
  const localScale = rand() < 0.37 ? 0.52 : 1;
  const u = a * island.width[0] * localScale;
  const v = b * island.width[1] * localScale;
  const cos = Math.cos(island.angle), sin = Math.sin(island.angle);
  return point([
    island.p[0] + u * cos - v * sin,
    island.p[1] + u * sin + v * cos + 0.04 * Math.sin(a * 2.6 + index),
    island.p[2] + c * island.width[2] * localScale + 0.065 * Math.sin(a * 1.8 + index),
  ], island.region, localScale < 1 ? 0.98 : 0.85, 0.8 + rand() * 0.46);
}

function wavelengthField(rand) {
  let x = 0, y = 0, z = 0, pulse = 0;
  // Modulate a continuous 3D cloud's probability density. No particle is
  // constrained to a mathematical surface, even inside the brightest wave.
  for (let attempt = 0; attempt < 20; attempt++) {
    x = gaussian(rand) * 0.57;
    y = gaussian(rand) * 0.38;
    z = gaussian(rand) * 0.31;
    const phase = 9.2 * (x + 0.45 * y * y + 0.4 * z * z
      - 0.16 * y + 0.06 * Math.sin(3.1 * z));
    pulse = Math.pow(0.5 + 0.5 * Math.cos(phase), 3.5);
    if (rand() < 0.19 + 0.81 * pulse) break;
  }
  return point([x, y + 0.07 * Math.sin(2.1 * x), z + 0.08 * Math.sin(2.4 * x)],
    x < -0.24 ? 0 : x > 0.24 ? 2 : 1, 0.62 + pulse * 0.33, 0.79 + rand() * 0.42);
}

export const distributions = [
  {
    id: 6,
    title: 'Converging currents',
    description: 'Three soft currents of fine particles braid through one shared volume.',
    accent: '#6d8ea5',
    rotation: [0.16, 0.34, -0.29],
    sample: braidedCurrents,
  },
  {
    id: 7,
    title: 'Suspended layers',
    description: 'Bent wisps of particle density float through a quiet, continuous core.',
    accent: '#8295aa',
    rotation: [0.39, -0.32, 0.04],
    sample: suspendedWisps,
  },
  {
    id: 8,
    title: 'Latent vortex',
    description: 'An asymmetric cloud curls around an opening, with depth in every wisp.',
    accent: '#758baf',
    rotation: [0.2, 0.4, -0.16],
    sample: asymmetricVortex,
  },
  {
    id: 9,
    title: 'Collective structure',
    description: 'Irregular islands of fine dust share a network of faint, soft connections.',
    accent: '#708e9d',
    rotation: [0.2, -0.4, -0.1],
    sample: clusterHierarchy,
  },
  {
    id: 10,
    title: 'Wavelength field',
    description: 'Curved pulses of particle density travel through a coherent spatial field.',
    accent: '#818baa',
    rotation: [-0.12, -0.47, 0.39],
    sample: wavelengthField,
  },
];
