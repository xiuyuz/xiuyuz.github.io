// Five volumetric dust arrangements. The shared renderer supplies particles,
// lighting, motion, and the sparse semantic connections between modality regions.
// Sampling is deterministic when the caller supplies a seeded random function.
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function normal(rand) {
  let value;
  do {
    value = Math.sqrt(-2 * Math.log(Math.max(1e-9, rand()))) * Math.cos(TAU * rand());
  } while (Math.abs(value) > 3);
  return value;
}

// A truncated, isotropic Gaussian avoids rare distant particles changing the
// camera fit. Its edge is still sparse because the radial density is Gaussian.
function cloud(rand) {
  let x, y, z, radius;
  do {
    x = normal(rand); y = normal(rand); z = normal(rand);
    radius = Math.hypot(x, y, z);
  } while (radius > 2.75);
  return [x, y, z, radius];
}

function rotateY(position, angle) {
  const [x, y, z] = position, c = Math.cos(angle), s = Math.sin(angle);
  return [x * c + z * s, y, z * c - x * s];
}

function finish(position, region, radius, rand, emphasis = 1) {
  // Smoothly compress only the outermost tails; there is no hard spherical
  // boundary on which particles could accumulate into a visible shell.
  const length = Math.hypot(...position);
  const scale = (1 + (length / 1.80) ** 8) ** (-1 / 8);
  const concentration = Math.exp(-radius * radius * .125);
  return {
    position: position.map(value => value * scale),
    region,
    size: clamp(.73 + concentration * .28 + rand() * .13, .7, 1.4),
    density: clamp((.57 + concentration * .40) * emphasis, .5, 1),
  };
}

function sculptedNebula(rand, index) {
  const region = index % 3;
  const [a, b, c, radius] = cloud(rand);
  const centers = [[-.46, .05, .06], [.37, .38, -.21], [.38, -.31, .22]];
  const scales = [[.51, .31, .40], [.34, .37, .32], [.36, .31, .44]];
  const orientations = [-.43, .62, -.20];
  const sharedCore = rand() < .22;
  let position;
  if (sharedCore) {
    position = [a * .40 + .025, b * .33, c * .36];
  } else {
    const [sx, sy, sz] = scales[region];
    position = rotateY([a * sx, b * sy, c * sz], orientations[region]);
    position = position.map((value, axis) => value + centers[region][axis]);
  }
  const [x, y, z] = position;
  position = [
    x + .13 * Math.sin(1.8 * y + .65 * z),
    y + .09 * Math.sin(2.1 * z - .8 * x),
    z + .12 * Math.sin(1.9 * x + .4 * y),
  ];
  return finish(position, region, radius, rand);
}

function convergingPlumes(rand, index) {
  const region = index % 3;
  const [a, b, c, radius] = cloud(rand);
  if (rand() < .26) {
    return finish([.57 + a * .35, b * .31, c * .32], region, radius, rand);
  }
  const t = rand() ** .82;
  const remaining = (1 - t) ** 1.52;
  const phase = region * TAU / 3 + .40;
  const sweep = phase + t * .72;
  const plumeSpread = remaining * .98;
  const width = .077 + .105 * Math.sin(Math.PI * t) + .072 * t;
  const x = -1.47 + 2.58 * t + a * width * .74;
  const y = Math.cos(sweep) * plumeSpread + b * width + .12 * Math.sin(t * Math.PI);
  const z = Math.sin(sweep) * plumeSpread * .89 + c * width - .09 * t;
  return finish([x, y, z], region, radius, rand, .96 + .04 * t);
}

function galacticCloud(rand, index) {
  const region = index % 3;
  const [a, b, c, radius] = cloud(rand);
  if (rand() < .28) {
    return finish([a * .34, b * .30, c * .35], region, radius, rand);
  }
  const t = rand() ** .73;
  const orbit = .22 + 1.21 * t;
  const theta = region * TAU / 3 + 3.62 * (1 - t);
  const width = .105 + .108 * t;
  const radial = orbit + a * width;
  const tangent = b * width * .84;
  const ct = Math.cos(theta), st = Math.sin(theta);
  const x = radial * ct - tangent * st;
  const y = (radial * st + tangent * ct) * .82;
  // Depth varies along the arms, and the vertical Gaussian is substantial:
  // the arms form thick clouds twisting through space, not a flat disc.
  const z = .34 * Math.sin(theta * 1.36 + region * .55) * t + c * (.22 + .075 * t);
  return finish([x, y, z], region, radius, rand);
}

function layeredFields(rand, index) {
  const region = index % 3;
  const [a, b, c, radius] = cloud(rand);
  const layer = region - 1;
  const angle = [-.61, .31, .82][region];
  const local = rotateY([a * .57, b * .235, c * .43], angle);
  const x = local[0] + layer * .13;
  const z = local[2] + layer * .16;
  const y = local[1] + layer * .45
    + .19 * Math.sin(x * 1.62 + region * .7)
    + .11 * Math.sin(z * 1.9 - region * .45);
  // Deep overlap and a smoothly displaced mean turn the three strata into
  // interpenetrating density volumes, with neither planar boundaries nor sheets.
  return finish([x, y, z], region, radius, rand);
}

function turbulentCurl(rand, index) {
  const [a, b, c, radius] = cloud(rand);
  const t = rand() < .48 ? (rand() + rand()) * .5 : rand();
  const region = Math.min(2, Math.floor(t * 3));
  const theta = -2.08 + t * 4.12;
  const envelope = Math.sin(Math.PI * t) ** .76;
  const width = .060 + envelope * .155;
  const orbit = .91 + .115 * Math.sin(theta * 2.1) + a * width;
  const tangent = b * width * .73;
  const ct = Math.cos(theta), st = Math.sin(theta);
  let x = orbit * ct - tangent * st - .29;
  let y = (orbit * st + tangent * ct) * 1.11;
  let z = .28 * Math.sin(theta * 1.47) + c * (width + .060);
  // A broad asymmetric eddy retains a central pocket of negative space.
  // Small coherent distortions give its outer envelope turbulence without
  // filling that opening with independent uniform noise.
  x += .075 * Math.sin(y * 3.2 + z * 1.1) * envelope;
  y += .065 * Math.sin(z * 3.0 - x * 1.6) * envelope;
  z += .085 * Math.sin(y * 2.3 + x * 1.4) * envelope;
  return finish([x, y, z], region, radius, rand, .94 + .06 * envelope);
}

export const distributions = [
  {
    id: 1,
    title: 'Sculpted nebula',
    description: 'Three interwoven regions gather into one asymmetric cloud, dense at its center and fine at its edges.',
    accent: '#899bab',
    rotation: [.17, -.36, -.10],
    sample: sculptedNebula,
  },
  {
    id: 2,
    title: 'Converging plumes',
    description: 'Three curved dust streams gradually merge into a shared, luminous volume.',
    accent: '#8eaaa9',
    rotation: [.18, -.19, -.20],
    sample: convergingPlumes,
  },
  {
    id: 3,
    title: 'Galactic cloud',
    description: 'Thick spiral arms turn through depth around a compact, softly connected core.',
    accent: '#a197b4',
    rotation: [.28, -.26, .08],
    sample: galacticCloud,
  },
  {
    id: 4,
    title: 'Layered fields',
    description: 'Three gently warped density fields overlap into a layered, dimensional latent space.',
    accent: '#94a5b9',
    rotation: [.21, -.45, -.13],
    sample: layeredFields,
  },
  {
    id: 5,
    title: 'Turbulent curl',
    description: 'An asymmetric dust eddy bends around an open center, with dense folds and tapering wisps.',
    accent: '#a69baf',
    rotation: [.13, -.36, -.17],
    sample: turbulentCurl,
  },
];
