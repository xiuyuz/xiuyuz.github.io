# Three.js local runtime

- Package: **three 0.185.1** (MIT).
- Official project: https://threejs.org/ and https://github.com/mrdoob/three.js
- Pinned package metadata: https://registry.npmjs.org/three/0.185.1
- Original npm tarball: https://registry.npmjs.org/three/-/three-0.185.1.tgz
- Downloaded: September 6, 2026.
- Published tarball integrity, verified before copying: `sha512-5aojFCXKwnjBRZvUnt3WFfEcvUJgkN5LlijRFN95hMy8WVkG4I0QNcJE+OuWvuJ0bOdStrbfXn0pkd6/QyiAlg==`.
- Upstream commit recorded by the package: `2431a09f46f34c560bc8e44b33be0e567723d5b9`.

Only the ES module renderer, its core module, and the original license are included. Runtime imports resolve locally; no CDN
or external runtime dependency is required.

| Local file | Original path inside npm package | Local bytes |
| --- | --- | ---: |
| `three.module.min.js` | `build/three.module.min.js` | 365,552 |
| `three.core.min.js` | `build/three.core.min.js` | 385,386 |
| `LICENSE` | `LICENSE` | 1,081 |

`three.module.min.js`, `three.core.min.js`, and `LICENSE` are unmodified.
SHA-256 of the vendored files:

- `three.module.min.js`: `86bcee248b64f44bcfc23c331ae74619061957d59cab040171dcb6fb5900beb6`
- `three.core.min.js`: `05b2609338c76cd65daf74f3ac515bc9a5045e1b3b33edc07d8c9bd55250fa90`
- `LICENSE`: `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc`

The gallery also includes `RoomEnvironment.js` from `examples/jsm/environments/RoomEnvironment.js` in the same pinned package. Its only modification changes the package import to `./three.module.min.js`. It uses the included Three.js MIT license.
