// Runtime SVG presentation only. Original raster and vector assets stay intact.
const MAX_CACHED_ASSETS = 8;
const contexts = new WeakMap();

export const protectedFigureRegions = {
  // Measured on the original 996 × 996 graphical abstract. Boundaries follow
  // the photo interiors, excluding the panel's pale antialiasing fringe.
  // The lower-right illustration contains three separately rounded micrographs.
  'ocf-featured.jpg': [
    {x: 110.5, y: 457.5, width: 111.5, height: 151, rx: 9},
    {x: 351.5, y: 457.5, width: 110, height: 151, rx: 9},
    {x: 589.5, y: 457.5, width: 110.5, height: 151, rx: 9},
    {x: 591.5, y: 779.5, width: 105, height: 139.5, rx: 7},
    {x: 805.5, y: 779.5, width: 36, height: 138.5, rx: 2.5},
    {x: 844, y: 779.5, width: 40, height: 138.5, rx: 2.5},
    {x: 887, y: 779.5, width: 36.5, height: 138.5, rx: 2.5},
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
  return new context.view.DOMException('Figure presentation was disposed.', 'AbortError');
}

function assertActive(context) {
  if (context.disposed) throw abortError(context);
}

function dataUri(bytes, mime, view) {
  const parts = [];
  for (let i = 0; i < bytes.length; i += 32768) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + 32768)));
  }
  return 'data:' + mime + ';base64,' + view.btoa(parts.join(''));
}

function imageDimensions(uri, context) {
  const image = new context.view.Image();
  const signal = context.controller.signal;
  return new Promise((resolve, reject) => {
    const clean = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      clean();
      image.removeAttribute('src');
      reject(abortError(context));
    };
    image.onload = () => {
      clean();
      if (image.naturalWidth && image.naturalHeight) {
        resolve({width: image.naturalWidth, height: image.naturalHeight});
      } else {
        reject(new Error('The source figure has no intrinsic dimensions.'));
      }
    };
    image.onerror = () => {
      clean();
      reject(new Error('The figure could not be decoded.'));
    };
    if (signal.aborted) return onAbort();
    signal.addEventListener('abort', onAbort, {once: true});
    image.src = uri;
  });
}

function mimeFor(source, contentType, bytes) {
  const type = contentType?.split(';')[0].trim().toLowerCase();
  if (type?.startsWith('image/')) return type;
  const path = new URL(source).pathname.toLowerCase();
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  throw new Error('The source is not a supported figure image.');
}

function validRegions(regions) {
  return (regions || []).map(region => {
    const rect = {
      x: Number(region.x), y: Number(region.y),
      width: Number(region.width), height: Number(region.height),
      rx: Math.max(0, Number(region.rx || 0)),
    };
    if (!Object.values(rect).every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) {
      throw new TypeError('Protected figure regions need finite pixel coordinates and positive dimensions.');
    }
    return rect;
  });
}

function wrapper(uri, width, height, regions) {
  const rects = regions.map(({x, y, width: w, height: h, rx}) =>
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '"/>'
  ).join('');
  // This matrix combines invert(1) followed by hue-rotate(180deg) in sRGB.
  // Endpoint mapping happens in a separate primitive, after channel clamping.
  // Alpha remains untouched, so transparent logo backgrounds remain transparent.
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '">'
    + '<defs>'
    + '<image id="original" width="' + width + '" height="' + height + '" href="' + uri + '"/>'
    + '<filter id="night" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">'
    + '<feColorMatrix type="matrix" values=".574 -1.43 -.144 0 1 -.426 -.43 -.144 0 1 -.426 -1.43 .856 0 1 0 0 0 1 0"/>'
    + '<feComponentTransfer>'
    + '<feFuncR type="linear" slope="' + (209 / 255) + '" intercept="' + (23 / 255) + '"/>'
    + '<feFuncG type="linear" slope="' + (204 / 255) + '" intercept="' + (34 / 255) + '"/>'
    + '<feFuncB type="linear" slope="' + (196 / 255) + '" intercept="' + (48 / 255) + '"/>'
    + '<feFuncA type="identity"/>'
    + '</feComponentTransfer></filter>'
    + (rects ? '<clipPath id="protected" clipPathUnits="userSpaceOnUse">' + rects + '</clipPath>'
      + '<mask id="adapted-area" maskUnits="userSpaceOnUse" x="0" y="0" width="' + width + '" height="' + height + '" mask-type="luminance">'
      + '<rect width="' + width + '" height="' + height + '" fill="white"/>'
      + '<g fill="black">' + rects + '</g></mask>' : '')
    + '</defs><use href="#original" filter="url(#night)"' + (rects ? ' mask="url(#adapted-area)"' : '') + '/>'
    + (rects ? '<use href="#original" clip-path="url(#protected)"/>' : '')
    + '</svg>';
}

async function createPresentation(source, regions, context) {
  const response = await context.view.fetch(source, {signal: context.controller.signal});
  if (!response.ok) throw new Error('Could not load figure (' + response.status + ').');
  const bytes = new Uint8Array(await response.arrayBuffer());
  assertActive(context);
  const uri = dataUri(bytes, mimeFor(source, response.headers.get('content-type'), bytes), context.view);
  const {width, height} = await imageDimensions(uri, context);
  assertActive(context);
  const svg = wrapper(uri, width, height, regions);
  const url = context.view.URL.createObjectURL(new context.view.Blob([svg], {type: 'image/svg+xml'}));
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
 * Return a self-contained SVG object URL for the source's dark presentation.
 * Protected rectangles use original image pixel coordinates. Passing [] disables
 * the default OCF protection, while omitted regions use the asset configuration.
 * Existing consumers keep working after an LRU eviction: object URLs are revoked
 * only by disposeDarkFigures(), once the owning page no longer uses them.
 */
export async function getDarkFigure(source, doc = window.document, regions) {
  if (!doc?.baseURI) throw new TypeError('A document is required to resolve figure URLs.');
  const absolute = new URL(source, doc.baseURI).href;
  const name = new URL(absolute).pathname.split('/').pop();
  const protectedRects = validRegions(regions === undefined ? protectedFigureRegions[name] : regions);
  const key = absolute + '\n' + JSON.stringify(protectedRects);
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
  context.urls.forEach(url => context.view.URL.revokeObjectURL(url));
  context.urls.clear();
  context.cache.clear();
  contexts.delete(doc);
}
