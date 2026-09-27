// Change colors at source resolution; original downloadable assets stay intact.
const MAX_CACHED_ASSETS = 8;
const contexts = new WeakMap();

export const protectedFigureRegions = {
  // Measured on the original 996 × 996 graphical abstract. Boundaries follow
  // the photo interiors, excluding the panel's pale antialiasing fringe.
  // The lower-right illustration contains three separately rounded micrographs.
  "ocf-featured.jpg": [
    { x: 110.5, y: 457.5, width: 111.5, height: 151, rx: 9 },
    { x: 351.5, y: 457.5, width: 110, height: 151, rx: 9 },
    { x: 589.5, y: 457.5, width: 110.5, height: 151, rx: 9 },
    { x: 591.5, y: 779.5, width: 105, height: 139.5, rx: 7 },
    { x: 805.5, y: 779.5, width: 36, height: 138.5, rx: 2.5 },
    { x: 844, y: 779.5, width: 40, height: 138.5, rx: 2.5 },
    { x: 887, y: 779.5, width: 36.5, height: 138.5, rx: 2.5 },
  ],
};

function contextFor(doc) {
  let context = contexts.get(doc);
  if (!context) {
    const view = doc.defaultView || globalThis;
    context = {
      view,
      cache: new Map(),
      urls: new Set(),
      controller: new view.AbortController(),
      disposed: false,
    };
    contexts.set(doc, context);
  }
  return context;
}

function abortError(context) {
  return new context.view.DOMException("Figure presentation was disposed.", "AbortError");
}

function assertActive(context) {
  if (context.disposed) throw abortError(context);
}

function dataUri(bytes, mime, view) {
  const parts = [];
  for (let i = 0; i < bytes.length; i += 32768) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  }
  return "data:" + mime + ";base64," + view.btoa(parts.join(""));
}

function imageDimensions(uri, context) {
  const image = new context.view.Image();
  const signal = context.controller.signal;
  return new Promise((resolve, reject) => {
    const clean = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      clean();
      image.removeAttribute("src");
      reject(abortError(context));
    };
    image.onload = () => {
      clean();
      if (image.naturalWidth && image.naturalHeight) {
        resolve({ width: image.naturalWidth, height: image.naturalHeight, image });
      } else {
        reject(new Error("The source figure has no intrinsic dimensions."));
      }
    };
    image.onerror = () => {
      clean();
      reject(new Error("The figure could not be decoded."));
    };
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    image.src = uri;
  });
}

function mimeFor(source, contentType, bytes) {
  const type = contentType?.split(";")[0].trim().toLowerCase();
  if (type?.startsWith("image/")) return type;
  const path = new URL(source).pathname.toLowerCase();
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  throw new Error("The source is not a supported figure image.");
}

function validRegions(regions) {
  return (regions || []).map((region) => {
    const rect = {
      x: Number(region.x),
      y: Number(region.y),
      width: Number(region.width),
      height: Number(region.height),
      rx: Math.max(0, Number(region.rx || 0)),
    };
    if (!Object.values(rect).every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
      throw new TypeError("Protected figure regions need finite pixel coordinates and positive dimensions.");
    }
    return rect;
  });
}

// The same sRGB mapping as the SVG filter below, with clamping between stages.
// Applying it to source pixels/paints avoids browser-dependent filter textures.
function nightColor(r, g, b) {
  const clamp = (value) => Math.max(0, Math.min(255, value));
  return [
    23 + (209 / 255) * clamp(0.574 * r - 1.43 * g - 0.144 * b + 255),
    34 + (204 / 255) * clamp(-0.426 * r - 0.43 * g - 0.144 * b + 255),
    48 + (196 / 255) * clamp(-0.426 * r - 1.43 * g + 0.856 * b + 255),
  ];
}

function vectorPresentation(bytes, context) {
  const view = context.view;
  const parsed = new view.DOMParser().parseFromString(new view.TextDecoder().decode(bytes), "image/svg+xml");
  const svg = parsed.documentElement;
  if (svg.localName !== "svg" || parsed.querySelector("parsererror")) throw new Error("The vector figure could not be parsed.");
  // Complex paint servers and authored CSS need the general filter fallback.
  // The publication SVGs use paths, text outlines, and explicit hexadecimal paints.
  if (svg.querySelector("image, filter, mask, style, foreignObject, [style]")) return null;
  if (!svg.hasAttribute("fill")) svg.setAttribute("fill", "#000000");
  const colors = new Map();
  for (const element of [svg, ...svg.querySelectorAll("*")]) {
    for (const attribute of ["fill", "stroke", "stop-color", "color"]) {
      const value = element.getAttribute(attribute);
      if (!value || value === "none") continue;
      if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value)) return null;
      if (!colors.has(value)) {
        const hex = value.length === 4 ? value.slice(1).replace(/./g, "$&$&") : value.slice(1);
        const channels = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
        colors.set(
          value,
          `rgb(${nightColor(...channels)
            .map(Math.round)
            .join(",")})`
        );
      }
      element.setAttribute(attribute, colors.get(value));
    }
  }
  return new view.Blob([new view.XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
}

async function rasterPresentation(image, width, height, regions, doc) {
  const canvas = doc.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Figure color conversion is unavailable.");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  let protectedPixels;
  if (regions.length) {
    // Draw coverage separately so rounded photo edges and transparent crests
    // retain their original colors without changing the source alpha channel.
    context.clearRect(0, 0, width, height);
    context.fillStyle = "white";
    context.beginPath();
    for (const { x, y, width: w, height: h, rx } of regions) context.roundRect(x, y, w, h, rx);
    context.fill();
    protectedPixels = context.getImageData(0, 0, width, height).data;
  }
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    if (!pixels.data[offset + 3]) continue;
    const coverage = protectedPixels ? protectedPixels[offset + 3] / 255 : 0;
    if (coverage === 1) continue;
    const color = nightColor(pixels.data[offset], pixels.data[offset + 1], pixels.data[offset + 2]);
    for (let channel = 0; channel < 3; channel++) {
      pixels.data[offset + channel] = coverage * pixels.data[offset + channel] + (1 - coverage) * color[channel];
    }
  }
  context.putImageData(pixels, 0, 0);
  // Lossless output at the original pixel dimensions, shared by preview and viewer.
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The adapted figure could not be encoded."))), "image/png");
  });
}

function wrapper(uri, width, height, regions) {
  const rects = regions
    .map(({ x, y, width: w, height: h, rx }) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/>')
    .join("");
  // This matrix combines invert(1) followed by hue-rotate(180deg) in sRGB.
  // Endpoint mapping happens in a separate primitive, after channel clamping.
  // Alpha remains untouched, so transparent logo backgrounds remain transparent.
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    width +
    '" height="' +
    height +
    '" viewBox="0 0 ' +
    width +
    " " +
    height +
    '">' +
    "<defs>" +
    '<image id="original" width="' +
    width +
    '" height="' +
    height +
    '" href="' +
    uri +
    '"/>' +
    '<filter id="night" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">' +
    '<feColorMatrix type="matrix" values=".574 -1.43 -.144 0 1 -.426 -.43 -.144 0 1 -.426 -1.43 .856 0 1 0 0 0 1 0"/>' +
    "<feComponentTransfer>" +
    '<feFuncR type="linear" slope="' +
    209 / 255 +
    '" intercept="' +
    23 / 255 +
    '"/>' +
    '<feFuncG type="linear" slope="' +
    204 / 255 +
    '" intercept="' +
    34 / 255 +
    '"/>' +
    '<feFuncB type="linear" slope="' +
    196 / 255 +
    '" intercept="' +
    48 / 255 +
    '"/>' +
    '<feFuncA type="identity"/>' +
    "</feComponentTransfer></filter>" +
    (rects
      ? '<clipPath id="protected" clipPathUnits="userSpaceOnUse">' +
        rects +
        "</clipPath>" +
        '<mask id="adapted-area" maskUnits="userSpaceOnUse" x="0" y="0" width="' +
        width +
        '" height="' +
        height +
        '" mask-type="luminance">' +
        '<rect width="' +
        width +
        '" height="' +
        height +
        '" fill="white"/>' +
        '<g fill="black">' +
        rects +
        "</g></mask>"
      : "") +
    '</defs><use href="#original" filter="url(#night)"' +
    (rects ? ' mask="url(#adapted-area)"' : "") +
    "/>" +
    (rects ? '<use href="#original" clip-path="url(#protected)"/>' : "") +
    "</svg>"
  );
}

async function createPresentation(source, regions, context) {
  const response = await context.view.fetch(source, { signal: context.controller.signal });
  if (!response.ok) throw new Error("Could not load figure (" + response.status + ").");
  const bytes = new Uint8Array(await response.arrayBuffer());
  assertActive(context);
  const mime = mimeFor(source, response.headers.get("content-type"), bytes);
  const uri = dataUri(bytes, mime, context.view);
  const { width, height, image } = await imageDimensions(uri, context);
  let presentation;
  if (mime === "image/svg+xml") {
    presentation = regions.length ? null : vectorPresentation(bytes, context);
    presentation ||= new context.view.Blob([wrapper(uri, width, height, regions)], { type: "image/svg+xml" });
  } else {
    presentation = await rasterPresentation(image, width, height, regions, image.ownerDocument);
  }
  assertActive(context);
  const url = context.view.URL.createObjectURL(presentation);
  context.urls.add(url);
  try {
    await imageDimensions(url, context);
    assertActive(context);
    return url;
  } catch (error) {
    context.view.URL.revokeObjectURL(url);
    context.urls.delete(url);
    throw error;
  }
}

/**
 * Return an object URL for the source's dark presentation: native-size lossless
 * PNG for raster sources, original vector geometry for supported SVG figures.
 * Complex SVG paints retain the general SVG filter fallback.
 * Protected rectangles use original image pixel coordinates. Passing [] disables
 * the default OCF protection, while omitted regions use the asset configuration.
 * Existing consumers keep working after an LRU eviction: object URLs are revoked
 * only by disposeDarkFigures(), once the owning page no longer uses them.
 */
export async function getDarkFigure(source, doc = window.document, regions) {
  if (!doc?.baseURI) throw new TypeError("A document is required to resolve figure URLs.");
  const absolute = new URL(source, doc.baseURI).href;
  const name = new URL(absolute).pathname.split("/").pop();
  const protectedRects = validRegions(regions === undefined ? protectedFigureRegions[name] : regions);
  const key = absolute + "\n" + JSON.stringify(protectedRects);
  const context = contextFor(doc);
  const cached = context.cache.get(key);
  if (cached) {
    context.cache.delete(key);
    context.cache.set(key, cached);
    return cached;
  }
  const pending = createPresentation(absolute, protectedRects, context);
  context.cache.set(key, pending);
  while (context.cache.size > MAX_CACHED_ASSETS) {
    context.cache.delete(context.cache.keys().next().value);
  }
  try {
    return await pending;
  } catch (error) {
    if (context.cache.get(key) === pending) context.cache.delete(key);
    throw error;
  }
}

/** Call only after the owning page has released its image and canvas consumers. */
export function disposeDarkFigures(doc = window.document) {
  const context = contexts.get(doc);
  if (!context) return;
  context.disposed = true;
  context.controller.abort();
  context.urls.forEach((url) => context.view.URL.revokeObjectURL(url));
  context.urls.clear();
  context.cache.clear();
  contexts.delete(doc);
}
