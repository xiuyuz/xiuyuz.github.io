import { getDarkFigure, disposeDarkFigures } from "./figure-theme.js";

// Adapt presentation only: paper URLs and the original downloadable assets stay intact.
export function mountImageAppearance(root) {
  const document = root.ownerDocument,
    view = document.defaultView;
  const entries = new Map(),
    lifecycle = new AbortController();
  const darkSources = new Map();
  let disposed = false,
    printing = false;
  const isDark = () => !printing && document.documentElement.dataset.theme === "dark";

  function remember(image, source = image.getAttribute("src")) {
    if (!source) return null;
    const absolute = new URL(source, document.baseURI).href;
    const previous = entries.get(image);
    if (previous?.source === absolute) return previous;
    const entry = { image, source: absolute, version: 0 };
    entries.set(image, entry);
    image.dataset.themeAsset = "light";
    image.dataset.themeSource = absolute;
    return entry;
  }

  function originalRequested(entry) {
    return entry.image.closest(".ctr-dialog")?.dataset.originalColors === "true";
  }
  function changeSource(entry, source, appearance) {
    const image = entry.image;
    if (image.getAttribute("src") !== source) {
      // Source swaps also settle any in-flight particle texture.
      image.dispatchEvent(new view.CustomEvent("ct-figure-appearance-change", { bubbles: true }));
      image.src = source;
    }
    image.dataset.themeAsset = appearance;
  }
  function protectedRegions(source) {
    // Leave the university crests in their original colors; lift the wordmarks.
    if (source.includes("/nus-logo.png")) return [{ x: 0, y: 0, width: 93, height: 122 }];
    if (source.includes("/UC-Berkeley-Symbol.png")) return [{ x: 0, y: 0, width: 1037, height: 1014 }];
    if (source.includes("/UofT_Logo.png")) return [{ x: 0, y: 0, width: 230, height: 387 }];
    return undefined;
  }
  async function apply(entry) {
    const version = ++entry.version;
    if (!isDark() || originalRequested(entry)) {
      changeSource(entry, entry.source, "light");
      return;
    }
    if (darkSources.has(entry.source)) {
      changeSource(entry, darkSources.get(entry.source), "dark");
      return;
    }
    entry.image.dataset.themeAsset = "pending";
    try {
      const source = await getDarkFigure(entry.source, document, protectedRegions(entry.source));
      darkSources.set(entry.source, source);
      if (
        !disposed &&
        entry.image.isConnected &&
        entries.get(entry.image) === entry &&
        entry.version === version &&
        isDark() &&
        !originalRequested(entry)
      ) {
        changeSource(entry, source, "dark");
      }
    } catch {
      // Keep the original available when an asset cannot be adapted.
      if (!disposed && entries.get(entry.image) === entry && entry.version === version) {
        changeSource(entry, entry.source, "fallback");
      }
    }
  }
  function applyAll() {
    return Promise.all([...entries.values()].map(apply));
  }
  root.querySelectorAll(".pc-enlarge img, .ct-school-logo").forEach((image) => remember(image));

  root.addEventListener(
    "ct-figure-open",
    (event) => {
      const { image, source } = event.detail;
      const entry = remember(image, source);
      if (entry) apply(entry);
    },
    { signal: lifecycle.signal }
  );
  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-figure-original]");
      if (!button) return;
      const dialog = button.closest(".ctr-dialog");
      const original = dialog.dataset.originalColors !== "true";
      dialog.dataset.originalColors = String(original);
      button.setAttribute("aria-pressed", String(original));
      const entry = entries.get(dialog.querySelector("img"));
      if (entry) apply(entry);
    },
    { signal: lifecycle.signal }
  );
  view.addEventListener("ct-theme-change", applyAll, { signal: lifecycle.signal });
  view.addEventListener(
    "beforeprint",
    () => {
      printing = true;
      applyAll();
    },
    { signal: lifecycle.signal }
  );
  view.addEventListener(
    "afterprint",
    () => {
      printing = false;
      applyAll();
    },
    { signal: lifecycle.signal }
  );

  return {
    ready: applyAll(),
    dispose() {
      disposed = true;
      lifecycle.abort();
      entries.forEach((entry) => {
        entry.version++;
        entry.image.src = entry.source;
        delete entry.image.dataset.themeAsset;
        delete entry.image.dataset.themeSource;
      });
      entries.clear();
      darkSources.clear();
      disposeDarkFigures(document);
    },
  };
}
