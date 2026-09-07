import { mountHomepage } from "./controller.js";

await mountHomepage(document.querySelector("#site-root"));
document.documentElement.classList.add("is-enhanced");
await document.fonts.ready;
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
window.siteReady = true;
