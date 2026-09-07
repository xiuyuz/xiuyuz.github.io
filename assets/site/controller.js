import { mountResearch } from "./concepts/contour-research.js";
import { mountContact } from "./concepts/contour-contact.js";
import { mountHeroEffects } from "./concepts/contour-hero-effects.js";
import { initializeTheme, mountTheme } from "./concepts/contour-theme.js";
import { mountImageAppearance } from "./concepts/image-appearance.js";
import { mountArtwork } from "./banner/renderer.js";
import { mountResearchDust } from "./banner/research-dust.js";
import { study } from "./banner/config.js";

export async function mountHomepage(root) {
  initializeTheme();
  const disposeTheme = mountTheme(root);
  const applyPalette = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    const accent = study.accent || "#788aa8";
    root.style.setProperty("--study-accent", dark ? "#a7c3df" : accent);
    root.style.setProperty("--study-tint", dark ? "#1b2838" : `color-mix(in srgb, ${accent} 11%, #f8fbff)`);
    root.style.setProperty("--study-ink", dark ? "#c1d5e8" : `color-mix(in srgb, ${accent} 77%, #27364c)`);
    root.style.setProperty("--study-glint", dark ? "#eff7ff" : `color-mix(in srgb, ${accent} 50%, #e9f1ff)`);
  };
  applyPalette();
  window.addEventListener("ct-theme-change", applyPalette);
  const disposeResearch = mountResearch(root);
  const images = mountImageAppearance(root);
  mountContact(root);
  const disposeLight = mountHeroEffects(root);
  const disposeDust = mountResearchDust(root, study);
  const carousel = root.querySelector(".publication-carousel");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const onResearchLight = (event) => {
    if (event.pointerType !== "mouse" || reduced.matches) return;
    const card = event.target.closest(".pc-feature");
    if (!card) return;
    const bounds = card.getBoundingClientRect();
    card.style.setProperty("--research-light-x", `${((event.clientX - bounds.left) / bounds.width) * 100}%`);
    card.style.setProperty("--research-light-y", `${((event.clientY - bounds.top) / bounds.height) * 100}%`);
  };
  carousel.addEventListener("pointermove", onResearchLight, { passive: true });
  const disposeArtwork = await mountArtwork(root, study);
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("pagehide", onPageHide);
    disposeArtwork();
    disposeLight();
    disposeDust();
    disposeResearch();
    images.dispose();
    disposeTheme();
    window.removeEventListener("ct-theme-change", applyPalette);
    carousel.removeEventListener("pointermove", onResearchLight);
  };
  const onPageHide = (event) => {
    if (!event.persisted) dispose();
  };
  window.addEventListener("pagehide", onPageHide);
  await images.ready;
  return dispose;
}
