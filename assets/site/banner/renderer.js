import * as THREE from "../lib/three/three.module.min.js";

// The approved particle artwork retains its desktop and mobile framing,
// motion preferences, shared lighting, and local pointer interactions.
export async function mountArtwork(root, study) {
  const stage = root.querySelector(".bs-art-stage");
  const panel = root.querySelector(".bs-panel");
  const hero = root.querySelector(".ct-hero") || root;
  const canvas = stage.querySelector("canvas");
  const toggle = panel.querySelector(".ct-motion-toggle");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer, scene, camera, art, pivot, key, fill;
  let disposed = false,
    contextLost = false,
    failed = false,
    inView = true;
  let paused = false,
    motionOverride = false;
  let frame = 0,
    last = 0,
    time = 0;
  let targetX = 0,
    targetY = 0,
    lightX = 0,
    lightY = 0;
  let targetArtX = 0,
    targetArtY = 0,
    targetInfluence = 0;
  let hoveredInterest = 0,
    focusedInterest = 0;
  const modelSize = new THREE.Vector3(3, 3, 3);
  const pointer = { x: 0, y: 0, artX: 0, artY: 0, influence: 0, focus: 0 };
  const motionEnabled = () => !paused && (!reduced.matches || motionOverride);
  const state = () =>
    failed || contextLost
      ? "static"
      : paused
        ? "paused"
        : reduced.matches && !motionOverride
          ? "reduced"
          : document.hidden
            ? "hidden"
            : !inView
              ? "offscreen"
              : "running";

  function draw(dt = 0) {
    if (disposed) return;
    const lightEase = 1 - Math.exp(-dt * 2.6);
    const inputEase = 1 - Math.exp(-dt * 8);
    lightX += (targetX - lightX) * lightEase;
    lightY += (targetY - lightY) * lightEase;
    pointer.x = lightX;
    pointer.y = lightY;
    pointer.artX += (targetArtX - pointer.artX) * inputEase;
    pointer.artY += (targetArtY - pointer.artY) * inputEase;
    pointer.influence += (targetInfluence - pointer.influence) * inputEase;
    if (renderer && !contextLost && art) {
      key.position.set(-3.6 + lightX * 4, 5.2 - lightY * 1.5, 5.5);
      fill.position.set(4 + lightX, 1 - lightY, 3);
      pivot.rotation.y = lightX * 0.045;
      pivot.rotation.x = lightY * 0.025;
      art.update?.(time, pointer);
      renderer.render(scene, camera);
    }
    root.style.setProperty("--study-light-x", `${72 + lightX * 15}%`);
    root.style.setProperty("--study-light-y", `${35 + lightY * 12}%`);
    stage.dataset.phase = time.toFixed(3);
    stage.dataset.interestFocus = String(pointer.focus);
    stage.dataset.pointerInfluence = pointer.influence.toFixed(3);
  }

  function resize() {
    if (disposed) return;
    const bounds = stage.getBoundingClientRect();
    if (renderer && !contextLost && camera && bounds.width > 0 && bounds.height > 0) {
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / bounds.height;
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const fit = (Math.max(modelSize.y, modelSize.x / camera.aspect) * 0.59) / tangent;
      const tuning = study.rendering || {};
      const enlargement = innerWidth <= 760 ? tuning.mobileScale || 1 : tuning.desktopScale || 1;
      camera.position.set(0, 0, ((fit + modelSize.z * 0.47) * (bounds.width < 500 ? 0.9 : 0.78)) / enlargement);
      camera.updateProjectionMatrix();
    }
    draw();
  }

  function tick(now) {
    frame = 0;
    if (disposed) return;
    if (state() !== "running") {
      sync();
      return;
    }
    if (!last) last = now;
    if (now - last >= 1000 / 30 - 0.6) {
      const dt = Math.min(now - last, 80) / 1000;
      last = now;
      time += dt;
      draw(dt);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = last = 0;
    panel.dataset.motionState = state();
    panel.dataset.motionOverride = String(motionOverride);
    const isPaused = !motionEnabled();
    if (toggle) {
      toggle.disabled = failed || contextLost;
      toggle.dataset.paused = String(isPaused);
      toggle.setAttribute("aria-pressed", String(isPaused));
      toggle.setAttribute(
        "aria-label",
        isPaused
          ? reduced.matches && !motionOverride
            ? "Play artwork motion, overriding reduced motion preference"
            : "Play artwork motion"
          : "Pause artwork motion"
      );
      toggle.title = reduced.matches && !motionOverride ? "Reduced motion is enabled. Select Play motion to animate this artwork." : "";
      const label = toggle.querySelector(".ct-motion-text");
      if (label) label.textContent = isPaused ? "Play motion" : "Pause motion";
    }
    draw();
    if (state() === "running") frame = requestAnimationFrame(tick);
  }

  function setPaused(value, { explicit = false } = {}) {
    paused = Boolean(value);
    if (!paused && explicit) motionOverride = reduced.matches;
    sync();
  }

  function clearPointer() {
    targetArtX = targetArtY = targetInfluence = 0;
  }

  function onPointer(event) {
    if (event.pointerType === "touch" || state() !== "running") return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    targetArtX = Math.max(-1, Math.min(1, x * 2 - 1));
    targetArtY = Math.max(-1, Math.min(1, 1 - y * 2));
    targetInfluence = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0.24;
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0xffffff, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = study.exposure || 1.06;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(study.fov || 32, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x8291ac, 1.1));
    key = new THREE.DirectionalLight(0xfffefe, 2.7);
    scene.add(key);
    fill = new THREE.DirectionalLight(0xd7e4ff, 1.25);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 1.3);
    rim.position.set(1, -1, -4);
    scene.add(rim);
    art = await study.build(THREE);
    art.setTheme?.(document.documentElement.dataset.theme || "light");
    stage.dataset.theme = document.documentElement.dataset.theme || "light";
    stage.dataset.particleCount = String(art.particleCount || 0);
    if (disposed) {
      art.dispose?.();
      return () => {};
    }
    if (!art?.object) throw new Error("Study did not provide an artwork.");
    art.update?.(0, pointer);
    art.object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(art.object);
    const center = bounds.getCenter(new THREE.Vector3());
    bounds.getSize(modelSize);
    const offset = new THREE.Group();
    offset.position.copy(center).negate();
    offset.add(art.object);
    pivot = new THREE.Group();
    pivot.add(offset);
    scene.add(pivot);
    resize();
    stage.classList.add("is-ready");
    panel.dataset.renderer = "webgl";
  } catch (error) {
    failed = true;
    canvas.hidden = true;
    panel.dataset.renderer = "static";
    console.error("Artwork:", error);
  }

  const onTheme = () => {
    const theme = document.documentElement.dataset.theme || "light";
    art?.setTheme?.(theme);
    stage.dataset.theme = theme;
    draw();
  };
  window.addEventListener("ct-theme-change", onTheme);
  const onPause = () => setPaused(motionEnabled(), { explicit: true });
  const onLight = (event) => {
    if (state() !== "running") return;
    targetX = event.detail.active ? event.detail.x : 0;
    targetY = event.detail.active ? event.detail.y : 0;
  };
  const onReduced = () => {
    motionOverride = false;
    targetX = targetY = 0;
    clearPointer();
    sync();
  };
  const onVisibility = () => {
    if (document.hidden) clearPointer();
    sync();
  };
  const onLost = (event) => {
    event.preventDefault();
    contextLost = true;
    stage.classList.remove("is-ready");
    panel.dataset.renderer = "static";
    sync();
  };
  const onRestored = () => {
    contextLost = false;
    stage.classList.add("is-ready");
    panel.dataset.renderer = "webgl";
    resize();
    sync();
  };
  const updateFocus = () => {
    pointer.focus = hoveredInterest || focusedInterest;
    // Keyboard and hover emphasis is a direct state change, also available
    // while animation is paused or a reduced-motion preference is active.
    draw();
  };
  const interestHandlers = [...panel.querySelectorAll(".ct-interest")].map((interest, index) => {
    interest.tabIndex = 0;
    const enter = () => {
      hoveredInterest = index + 1;
      updateFocus();
    };
    const leave = () => {
      if (hoveredInterest === index + 1) hoveredInterest = 0;
      updateFocus();
    };
    const focus = () => {
      focusedInterest = index + 1;
      updateFocus();
    };
    const blur = (event) => {
      if (event.relatedTarget && interest.contains(event.relatedTarget)) return;
      if (focusedInterest === index + 1) focusedInterest = 0;
      updateFocus();
    };
    interest.addEventListener("pointerenter", enter);
    interest.addEventListener("pointerleave", leave);
    interest.addEventListener("focusin", focus);
    interest.addEventListener("focusout", blur);
    return () => {
      interest.removeEventListener("pointerenter", enter);
      interest.removeEventListener("pointerleave", leave);
      interest.removeEventListener("focusin", focus);
      interest.removeEventListener("focusout", blur);
    };
  });

  toggle?.addEventListener("click", onPause);
  hero.addEventListener("ct-hero-light", onLight);
  panel.addEventListener("pointerenter", onPointer, { passive: true });
  panel.addEventListener("pointermove", onPointer, { passive: true });
  panel.addEventListener("pointerleave", clearPointer);
  panel.addEventListener("pointercancel", clearPointer);
  reduced.addEventListener("change", onReduced);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  const visibility = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    if (!inView) clearPointer();
    sync();
  });
  visibility.observe(panel);
  // Font requests must never hold the first animation frame hostage.
  resize();
  sync();
  document.fonts?.ready.then(() => {
    if (!disposed) resize();
  });

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    interestHandlers.forEach((cleanup) => cleanup());
    cancelAnimationFrame(frame);
    observer.disconnect();
    visibility.disconnect();
    window.removeEventListener("ct-theme-change", onTheme);
    toggle?.removeEventListener("click", onPause);
    hero.removeEventListener("ct-hero-light", onLight);
    panel.removeEventListener("pointerenter", onPointer);
    panel.removeEventListener("pointermove", onPointer);
    panel.removeEventListener("pointerleave", clearPointer);
    panel.removeEventListener("pointercancel", clearPointer);
    reduced.removeEventListener("change", onReduced);
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    const geometries = new Set(),
      materials = new Set();
    scene?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    art?.dispose?.();
    renderer?.dispose();
    renderer?.forceContextLoss();
  };
  dispose.setPaused = setPaused;
  dispose.pause = (value = true) => setPaused(value);
  return dispose;
}
