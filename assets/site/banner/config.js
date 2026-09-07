import { createParticleStudy } from "./particle-material.js";

// The selected sculpted nebula. Sampling, color, density, and framing match
// the approved desktop and mobile artwork.
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
    x = normal(rand);
    y = normal(rand);
    z = normal(rand);
    radius = Math.hypot(x, y, z);
  } while (radius > 2.75);
  return [x, y, z, radius];
}

function rotateY(position, angle) {
  const [x, y, z] = position,
    c = Math.cos(angle),
    s = Math.sin(angle);
  return [x * c + z * s, y, z * c - x * s];
}

function finish(position, region, radius, rand, emphasis = 1) {
  // Smoothly compress only the outermost tails; there is no hard spherical
  // boundary on which particles could accumulate into a visible shell.
  const length = Math.hypot(...position);
  const scale = (1 + (length / 1.8) ** 8) ** (-1 / 8);
  const concentration = Math.exp(-radius * radius * 0.125);
  return {
    position: position.map((value) => value * scale),
    region,
    size: clamp(0.73 + concentration * 0.28 + rand() * 0.13, 0.7, 1.4),
    density: clamp((0.57 + concentration * 0.4) * emphasis, 0.5, 1),
  };
}

function sculptedNebula(rand, index) {
  const region = index % 3;
  const [a, b, c, radius] = cloud(rand);
  const centers = [
    [-0.46, 0.05, 0.06],
    [0.37, 0.38, -0.21],
    [0.38, -0.31, 0.22],
  ];
  const scales = [
    [0.51, 0.31, 0.4],
    [0.34, 0.37, 0.32],
    [0.36, 0.31, 0.44],
  ];
  const orientations = [-0.43, 0.62, -0.2];
  const sharedCore = rand() < 0.22;
  let position;
  if (sharedCore) {
    position = [a * 0.4 + 0.025, b * 0.33, c * 0.36];
  } else {
    const [sx, sy, sz] = scales[region];
    position = rotateY([a * sx, b * sy, c * sz], orientations[region]);
    position = position.map((value, axis) => value + centers[region][axis]);
  }
  const [x, y, z] = position;
  position = [x + 0.13 * Math.sin(1.8 * y + 0.65 * z), y + 0.09 * Math.sin(2.1 * z - 0.8 * x), z + 0.12 * Math.sin(1.9 * x + 0.4 * y)];
  return finish(position, region, radius, rand);
}

export const study = {
  id: 1,
  title: "Sculpted nebula",
  description: "Three interwoven regions gather into one asymmetric cloud, dense at its center and fine at its edges.",
  accent: "#899bab",
  particles: true,
  colors: ["#3f6089", "#7e69a2", "#428b91"],
  rotation: [0.17, -0.36, -0.1],
  rendering: {
    desktopCount: 84000,
    mobileCount: 36000,
    desktopScale: 1.24,
    mobileScale: 1.12,
    desktopGrain: 0.82,
    mobileGrain: 0.9,
  },
  sample: sculptedNebula,
  build: (THREE) => createParticleStudy(THREE, study),
};
