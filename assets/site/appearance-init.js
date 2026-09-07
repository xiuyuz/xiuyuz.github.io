// Apply the saved preference before the first page paint.
(() => {
  document.documentElement.classList.remove("no-js");
  let mode = "auto";
  try {
    const saved = localStorage.getItem("ct-theme-mode");
    if (["auto", "light", "dark"].includes(saved)) mode = saved;
  } catch {}
  const hour = new Date().getHours();
  const theme = mode === "auto" ? (hour >= 19 || hour < 7 ? "dark" : "light") : mode;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = theme;
})();
