// Pixel-faithful figure transitions for the research carousel.
// Navigation, accessibility state, and slide selection remain owned by its caller.
const instances = new WeakMap();
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = (value) => {
  value = clamp(value);
  return value * value * (3 - 2 * value);
};
const number = (value) => Number.parseFloat(value) || 0;

export function createResearchDissolve(carousel) {
  if (instances.has(carousel)) return instances.get(carousel);
  const document = carousel.ownerDocument,
    view = document.defaultView;
  const reduced = view.matchMedia("(prefers-reduced-motion: reduce)");
  const sourceCache = new Map(),
    sampleCache = new Map(),
    imageRequests = new Set();
  const originalPosition = carousel.style.position;
  const positioned = view.getComputedStyle(carousel).position === "static";
  if (positioned) carousel.style.position = "relative";
  let active = null,
    disposed = false,
    inView = true,
    serial = 0;
  let observedWidth = carousel.getBoundingClientRect().width;

  function paused() {
    return carousel.querySelector("[data-pc-effects-toggle]")?.dataset.paused === "true";
  }
  function figure(slide) {
    return slide?.querySelector(".pc-enlarge img") || null;
  }
  // These figures use fixed src URLs. currentSrc may briefly retain the previous
  // theme's decoded image immediately after a source swap.
  function sourceOf(img) {
    return img?.src || img?.currentSrc || "";
  }
  function seeded(text) {
    let seed = 2166136261;
    for (let i = 0; i < text.length; i++) seed = Math.imul(seed ^ text.charCodeAt(i), 16777619);
    return () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
  }

  function loadImage(element) {
    const src = sourceOf(element);
    if (!src) return Promise.resolve(null);
    if (element.complete && element.naturalWidth) return Promise.resolve(element);
    if (sourceCache.has(src)) return sourceCache.get(src);
    const promise = new Promise((resolve) => {
      const image = new view.Image();
      let settled = false,
        timeout;
      const request = { cancel: () => finish(null) };
      function finish(result) {
        if (settled) return;
        settled = true;
        view.clearTimeout(timeout);
        image.onload = image.onerror = null;
        imageRequests.delete(request);
        resolve(result);
      }
      imageRequests.add(request);
      if (element.crossOrigin) image.crossOrigin = element.crossOrigin;
      image.onload = () => {
        if (!image.naturalWidth) {
          finish(null);
          return;
        }
        if (typeof image.decode === "function")
          image
            .decode()
            .catch(() => {})
            .then(() => finish(image));
        else finish(image);
      };
      image.onerror = () => finish(null);
      timeout = view.setTimeout(() => finish(null), 2500);
      image.src = src;
      if (image.complete && image.naturalWidth) image.onload();
    });
    sourceCache.set(src, promise);
    promise.then((result) => {
      if (!result) sourceCache.delete(src);
    });
    return promise;
  }

  function positionFraction(token, freeSpace) {
    if (token === "left" || token === "top") return 0;
    if (token === "right" || token === "bottom") return freeSpace;
    if (!token || token === "center") return freeSpace * 0.5;
    return token.endsWith("%") ? (freeSpace * number(token)) / 100 : number(token);
  }

  // Measure the image's own content box, not the button's full area. Subtract
  // padding and borders before applying object-fit and object-position.
  function measure(element, decoded, host) {
    const box = element.getBoundingClientRect(),
      hostBox = host.getBoundingClientRect();
    const style = view.getComputedStyle(element);
    const scaleX = element.offsetWidth ? box.width / element.offsetWidth : 1;
    const scaleY = element.offsetHeight ? box.height / element.offsetHeight : 1;
    const borderLeft = number(style.borderLeftWidth) * scaleX;
    const borderRight = number(style.borderRightWidth) * scaleX;
    const borderTop = number(style.borderTopWidth) * scaleY;
    const borderBottom = number(style.borderBottomWidth) * scaleY;
    const elementBox = { x: box.left - hostBox.left, y: box.top - hostBox.top, width: box.width, height: box.height };
    const content = {
      x: elementBox.x + borderLeft + number(style.paddingLeft) * scaleX,
      y: elementBox.y + borderTop + number(style.paddingTop) * scaleY,
      width: Math.max(1, box.width - borderLeft - borderRight - (number(style.paddingLeft) + number(style.paddingRight)) * scaleX),
      height: Math.max(1, box.height - borderTop - borderBottom - (number(style.paddingTop) + number(style.paddingBottom)) * scaleY),
    };
    const naturalWidth = decoded.naturalWidth,
      naturalHeight = decoded.naturalHeight;
    const contain = Math.min(content.width / naturalWidth, content.height / naturalHeight);
    const cover = Math.max(content.width / naturalWidth, content.height / naturalHeight);
    const fit = style.objectFit || "fill";
    let width = content.width,
      height = content.height;
    if (fit !== "fill") {
      const scale = fit === "cover" ? cover : fit === "none" ? 1 : fit === "scale-down" ? Math.min(1, contain) : contain;
      width = naturalWidth * scale;
      height = naturalHeight * scale;
    }
    const objectPosition = style.objectPosition.trim().split(/\s+/);
    const draw = {
      x: content.x + positionFraction(objectPosition[0], content.width - width),
      y: content.y + positionFraction(objectPosition[1] || "50%", content.height - height),
      width,
      height,
    };
    return {
      elementBox,
      content,
      draw,
      image: decoded,
      background: style.backgroundColor,
      borderColor: style.borderTopColor,
      borderWidth: borderTop,
      radius: number(style.borderTopLeftRadius) * scaleX,
    };
  }

  function sampleFigure(image, metrics, count, src) {
    const draw = metrics.draw;
    const scale = Math.min(
      1,
      (draw.width * 1.35) / image.naturalWidth,
      (draw.height * 1.35) / image.naturalHeight,
      900 / image.naturalWidth,
      700 / image.naturalHeight
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const key = src + "|" + width + "x" + height + "|" + count;
    if (sampleCache.has(key)) return sampleCache.get(key);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const visible = [];
    const dark = document.documentElement.dataset.theme === "dark";
    for (let offset = 0; offset < pixels.length; offset += 4) {
      if (pixels[offset + 3] < 45) continue;
      if (dark && Math.abs(pixels[offset] - 23) < 10 && Math.abs(pixels[offset + 1] - 34) < 10 && Math.abs(pixels[offset + 2] - 48) < 10) continue;
      if (pixels[offset] > 240 && pixels[offset + 1] > 240 && pixels[offset + 2] > 240) continue;
      visible.push(offset / 4);
    }
    if (!visible.length) return null;
    const random = seeded(key),
      points = new Array(count);
    const step = visible.length / count;
    for (let index = 0; index < count; index++) {
      const pixel = visible[Math.min(visible.length - 1, Math.floor((index + random()) * step))];
      const offset = pixel * 4;
      const r = pixels[offset],
        g = pixels[offset + 1],
        b = pixels[offset + 2],
        alpha = pixels[offset + 3] / 255;
      points[index] = {
        x: ((pixel % width) + 0.5) / width,
        y: (Math.floor(pixel / width) + 0.5) / height,
        r,
        g,
        b,
        alpha,
        color: "rgb(" + r + "," + g + "," + b + ")",
      };
    }
    const sampled = { points, bitmap: canvas };
    sampleCache.set(key, sampled);
    if (sampleCache.size > 14) sampleCache.delete(sampleCache.keys().next().value);
    return sampled;
  }

  function commitOnce(state) {
    if (state.committed) return;
    state.committed = true;
    carousel.dataset.dissolvePhase = "assemble";
    state.commit();
  }

  function settle(state, commitPending = true, cancelled = false) {
    if (!state || active !== state) return;
    active = null;
    view.cancelAnimationFrame(state.frame);
    try {
      if (commitPending) commitOnce(state);
    } finally {
      state.hidden.forEach((element) => element.classList.remove("pc-dissolve-hidden"));
      state.canvas?.remove();
      carousel.classList.remove("pc-dissolve-active");
      delete carousel.dataset.dissolvePhase;
      delete carousel.dataset.dissolveProgress;
      state.resolve({ animated: state.started, cancelled });
    }
  }

  function cancel() {
    if (active) settle(active, true, true);
  }

  function placeCanvas(state, host) {
    const hostBox = host.getBoundingClientRect(),
      carouselBox = carousel.getBoundingClientRect();
    state.width = hostBox.width;
    state.height = hostBox.height;
    const ratio = Math.min(view.devicePixelRatio || 1, 2);
    state.canvas.width = Math.max(1, Math.round(state.width * ratio));
    state.canvas.height = Math.max(1, Math.round(state.height * ratio));
    Object.assign(state.canvas.style, {
      left: hostBox.left - carouselBox.left - carousel.clientLeft + carousel.scrollLeft + "px",
      top: hostBox.top - carouselBox.top - carousel.clientTop + carousel.scrollTop + "px",
      width: state.width + "px",
      height: state.height + "px",
    });
    state.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function pathRectangle(context, box, radius = 0) {
    context.beginPath();
    if (radius && context.roundRect) context.roundRect(box.x, box.y, box.width, box.height, radius);
    else context.rect(box.x, box.y, box.width, box.height);
  }
  function drawFrame(context, metrics) {
    context.save();
    pathRectangle(context, metrics.elementBox, metrics.radius);
    if (metrics.background && metrics.background !== "rgba(0, 0, 0, 0)" && metrics.background !== "transparent") {
      context.fillStyle = metrics.background;
      context.fill();
    }
    if (metrics.borderWidth > 0) {
      context.strokeStyle = metrics.borderColor;
      context.lineWidth = metrics.borderWidth;
      context.stroke();
    }
    context.restore();
  }
  function drawImage(context, metrics, opacity) {
    if (opacity <= 0) return;
    context.save();
    context.globalAlpha = opacity;
    const content = metrics.content,
      draw = metrics.draw;
    context.beginPath();
    context.rect(content.x, content.y, content.width, content.height);
    context.clip();
    context.drawImage(metrics.image, draw.x, draw.y, draw.width, draw.height);
    context.restore();
  }

  function render(state, progress) {
    const context = state.context;
    context.clearRect(0, 0, state.width, state.height);
    // The paper inset follows the destination's proportions while the pixels
    // are dispersed, so landscape diagrams and square atlases share one motion.
    const frameBlend = smooth((progress - 0.22) / 0.56);
    const frameBox = {};
    for (const key of ["x", "y", "width", "height"])
      frameBox[key] = state.fromMetrics.elementBox[key] + (state.toMetrics.elementBox[key] - state.fromMetrics.elementBox[key]) * frameBlend;
    drawFrame(context, { ...(progress < 0.5 ? state.fromMetrics : state.toMetrics), elementBox: frameBox });
    drawImage(context, state.fromMetrics, 1 - smooth(progress / 0.24));
    const assemble = smooth((progress - 0.53) / 0.36);
    const disperse = smooth((progress - 0.035) / 0.425);
    const particleOpacity = smooth(progress / 0.1) * (1 - smooth((progress - 0.88) / 0.12));
    const colorBlend = smooth((progress - 0.38) / 0.26);
    const curl = Math.sin(progress * Math.PI) ** 1.4;
    for (let index = 0; index < state.particles.length; index++) {
      const particle = state.particles[index],
        source = state.fromPixels[index],
        target = state.toPixels[index];
      const startX = state.fromMetrics.draw.x + source.x * state.fromMetrics.draw.width;
      const startY = state.fromMetrics.draw.y + source.y * state.fromMetrics.draw.height;
      const endX = state.toMetrics.draw.x + target.x * state.toMetrics.draw.width;
      const endY = state.toMetrics.draw.y + target.y * state.toMetrics.draw.height;
      const cloudX = state.width * 0.5 + ((startX + endX) * 0.5 - state.width * 0.5) * 0.58 + particle.dx * state.width * 0.25;
      const cloudY = state.height * 0.5 + ((startY + endY) * 0.5 - state.height * 0.5) * 0.52 + particle.dy * state.height * 0.29;
      let x = progress < 0.5 ? startX + (cloudX - startX) * disperse : cloudX + (endX - cloudX) * assemble;
      let y = progress < 0.5 ? startY + (cloudY - startY) * disperse : cloudY + (endY - cloudY) * assemble;
      x += Math.sin(progress * Math.PI * 2 + particle.phase) * particle.wave * curl;
      y += Math.cos(progress * Math.PI * 1.65 + particle.phase) * particle.wave * curl * 0.7;
      if (colorBlend <= 0) context.fillStyle = source.color;
      else if (colorBlend >= 1) context.fillStyle = target.color;
      else
        context.fillStyle =
          "rgb(" +
          Math.round(source.r + (target.r - source.r) * colorBlend) +
          "," +
          Math.round(source.g + (target.g - source.g) * colorBlend) +
          "," +
          Math.round(source.b + (target.b - source.b) * colorBlend) +
          ")";
      context.globalAlpha = particleOpacity * (source.alpha + (target.alpha - source.alpha) * colorBlend) * particle.opacity;
      const size = particle.size * (1 + Math.sin(progress * Math.PI) * 0.19);
      context.fillRect(x - size * 0.5, y - size * 0.5, size, size);
    }
    context.globalAlpha = 1;
    drawImage(context, state.toMetrics, smooth((progress - 0.83) / 0.17));
  }

  async function prepare(state) {
    try {
      const fromImage = figure(state.fromSlide),
        toImage = figure(state.toSlide);
      const fromHost = fromImage?.closest(".pc-enlarge"),
        toHost = toImage?.closest(".pc-enlarge");
      if (!fromHost || !toHost) {
        settle(state);
        return;
      }
      if (document.documentElement.dataset.theme === "dark" && [fromImage, toImage].some((image) => image.dataset.themeAsset !== "dark")) {
        settle(state);
        return;
      }
      // Resolve the destination element's own intrinsic size before measuring
      // proportionate frames, including images that began with lazy loading.
      toImage.loading = "eager";
      const [fromDecoded, toDecoded] = await Promise.all([loadImage(fromImage), loadImage(toImage)]);
      if (active !== state) return;
      if (!fromDecoded || !toDecoded || reduced.matches || paused() || !inView || document.hidden) {
        settle(state);
        return;
      }
      if (typeof toImage.decode === "function") {
        try {
          await toImage.decode();
        } catch {}
      }
      if (active !== state) return;
      const fromMetrics = measure(fromImage, fromDecoded, fromHost);
      const toMetrics = measure(toImage, toDecoded, toHost);
      if (fromHost.getBoundingClientRect().width < 2 || fromMetrics.draw.width < 2 || toMetrics.draw.width < 2) {
        settle(state);
        return;
      }
      const mobile = view.innerWidth <= 540;
      const area = Math.min(fromMetrics.draw.width * fromMetrics.draw.height, toMetrics.draw.width * toMetrics.draw.height);
      const count = Math.round(clamp(area / (mobile ? 22 : 25), mobile ? 1000 : 2200, mobile ? 1900 : 4500));
      const fromSample = sampleFigure(fromDecoded, fromMetrics, count, sourceOf(fromImage));
      const toSample = sampleFigure(toDecoded, toMetrics, count, sourceOf(toImage));
      if (!fromSample || !toSample) {
        settle(state);
        return;
      }
      const fromPixels = fromSample.points,
        toPixels = toSample.points;
      // Rasterize complex SVG figures once. Replaying vector artwork on every
      // frame can stall rendering; these cached textures keep the motion smooth.
      fromMetrics.image = fromSample.bitmap;
      toMetrics.image = toSample.bitmap;

      const canvas = document.createElement("canvas");
      canvas.className = "pc-dissolve-canvas";
      canvas.setAttribute("aria-hidden", "true");
      canvas.dataset.particleCount = String(count);
      Object.assign(canvas.style, { position: "absolute", pointerEvents: "none", zIndex: "8", display: "block" });
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) {
        settle(state);
        return;
      }
      const random = seeded(sourceOf(fromImage) + ">" + sourceOf(toImage));
      state.particles = Array.from({ length: count }, () => ({
        dx: random() - 0.5,
        dy: random() - 0.5,
        phase: random() * Math.PI * 2,
        wave: 3 + random() * (mobile ? 9 : 15),
        size: (mobile ? 0.95 : 1.05) + random() * 0.85,
        opacity: 0.68 + random() * 0.32,
      }));
      Object.assign(state, {
        canvas,
        context,
        fromMetrics,
        toMetrics,
        fromPixels,
        toPixels,
        fromImage,
        toImage,
        fromHost,
        toHost,
        toDecoded,
        toBitmap: toSample.bitmap,
      });
      placeCanvas(state, fromHost);
      render(state, 0);
      carousel.append(canvas);
      for (const element of [fromImage, toImage]) {
        if (!element.classList.contains("pc-dissolve-hidden")) {
          element.classList.add("pc-dissolve-hidden");
          state.hidden.add(element);
        }
      }
      carousel.classList.add("pc-dissolve-active");
      carousel.dataset.dissolvePhase = "disperse";
      carousel.dataset.dissolveProgress = "0";
      state.started = true;
      const duration = mobile ? 1080 : 1180;
      const start = view.performance.now();
      function frame(now) {
        if (active !== state) return;
        if (!carousel.isConnected || document.hidden || reduced.matches || paused() || !inView) {
          settle(state, true, true);
          return;
        }
        const progress = clamp((now - start) / duration);
        carousel.dataset.dissolveProgress = progress.toFixed(3);
        try {
          if (progress >= 0.5 && !state.committed) {
            // The data phase changes immediately before the caller swaps slides.
            commitOnce(state);
            if (active !== state) return;
            state.toMetrics = measure(toImage, toDecoded, toHost);
            state.toMetrics.image = state.toBitmap;
            placeCanvas(state, toHost);
          }
          render(state, progress);
          if (progress >= 1) settle(state, true, false);
          else state.frame = view.requestAnimationFrame(frame);
        } catch {
          settle(state, true, true);
        }
      }
      state.frame = view.requestAnimationFrame(frame);
    } catch {
      // A missing image or a canvas restricted by CORS falls back to a crisp swap.
      settle(state, true, true);
    }
  }

  function transition(fromSlide, toSlide, commit) {
    const interruptedTarget = active?.toSlide;
    cancel();
    if (disposed || reduced.matches || paused() || document.hidden || !inView || !toSlide || fromSlide === toSlide) {
      commit();
      return Promise.resolve({ animated: false, cancelled: false });
    }
    return new Promise((resolve) => {
      const state = {
        id: ++serial,
        fromSlide: interruptedTarget || fromSlide,
        toSlide,
        commit,
        resolve,
        committed: false,
        started: false,
        frame: 0,
        hidden: new Set(),
      };
      active = state;
      prepare(state);
    });
  }

  function onResize() {
    sampleCache.clear();
    cancel();
  }
  function onVisibility() {
    if (document.hidden) cancel();
  }
  function onReduced() {
    if (reduced.matches) cancel();
  }
  function onControl(event) {
    if (event.target.closest?.("[data-pc-effects-toggle]")) cancel();
  }
  view.addEventListener("ct-theme-change", cancel);
  view.addEventListener("ct-figure-appearance-change", cancel);
  view.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener("change", onReduced);
  carousel.addEventListener("click", onControl, true);
  const resizeObserver =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(() => {
          const width = carousel.getBoundingClientRect().width;
          if (Math.abs(width - observedWidth) > 1) {
            observedWidth = width;
            onResize();
          }
        })
      : null;
  resizeObserver?.observe(carousel);
  const intersectionObserver =
    typeof view.IntersectionObserver === "function"
      ? new view.IntersectionObserver((entries) => {
          inView = entries[0]?.isIntersecting !== false;
          if (!inView) cancel();
        })
      : null;
  intersectionObserver?.observe(carousel);

  function dispose() {
    if (disposed) return;
    cancel();
    disposed = true;
    imageRequests.forEach((request) => request.cancel());
    sourceCache.clear();
    sampleCache.clear();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    view.removeEventListener("ct-theme-change", cancel);
    view.removeEventListener("ct-figure-appearance-change", cancel);
    view.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    reduced.removeEventListener("change", onReduced);
    carousel.removeEventListener("click", onControl, true);
    if (positioned && carousel.style.position === "relative") carousel.style.position = originalPosition;
    instances.delete(carousel);
  }
  const api = { transition, cancel, dispose };
  instances.set(carousel, api);
  return api;
}
