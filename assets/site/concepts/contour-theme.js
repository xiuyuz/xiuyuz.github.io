/**
 * Local-time appearance for the working academic page.
 *
 * initializeTheme() is safe before the body exists. It returns the shared
 * controller: { getState(), setMode('auto' | 'light' | 'dark'), refresh() }.
 * mountTheme(root) adds the accessible navigation control and returns cleanup.
 * The selected mode is stored under `ct-theme-mode`; Auto follows local time,
 * with dark appearance from 19:00 to 07:00. No location permission is needed.
 * Both mode and resolved-theme changes emit `ct-theme-change` on window.
 */

const STORAGE_KEY = "ct-theme-mode";
const MODES = ["auto", "light", "dark"];
const LABELS = { auto: "Auto", light: "Light", dark: "Dark" };
const mounts = new WeakMap();
let controller;
let controlId = 0;

const icons = {
  light:
    '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="3.3"/><path d="M10 1.5v1.7m0 13.6v1.7M1.5 10h1.7m13.6 0h1.7M4 4l1.2 1.2m9.6 9.6L16 16M4 16l1.2-1.2m9.6-9.6L16 4"/></svg>',
  dark: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16.7 12.4A7.2 7.2 0 0 1 7.6 3.3a7.2 7.2 0 1 0 9.1 9.1Z"/></svg>',
};

function validMode(value) {
  return MODES.includes(value) ? value : "auto";
}

function storedMode() {
  try {
    return validMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "auto";
  }
}

function localTheme(mode) {
  if (mode !== "auto") return mode;
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? "dark" : "light";
}

export function initializeTheme() {
  if (controller) {
    controller.refresh();
    return controller;
  }

  let mode = storedMode();
  let theme;
  let announcedMode;

  const refresh = () => {
    const resolved = localTheme(mode);
    const html = document.documentElement;
    if (html) {
      html.dataset.theme = resolved;
      html.dataset.themeMode = mode;
      html.style.colorScheme = resolved;
    }
    if (resolved === theme && mode === announcedMode) return;
    theme = resolved;
    announcedMode = mode;
    window.dispatchEvent(
      new CustomEvent("ct-theme-change", {
        detail: { theme, mode },
      })
    );
  };

  controller = {
    getState: () => ({ theme, mode }),
    setMode(value) {
      mode = validMode(value);
      try {
        window.localStorage.setItem(STORAGE_KEY, mode);
      } catch {
        // The current tab still supports switching if storage is unavailable.
      }
      refresh();
    },
    refresh,
  };

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    try {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
    } catch {
      return;
    }
    mode = validMode(event.key === null ? null : event.newValue);
    refresh();
  });
  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });

  // Check on minute boundaries so an open page follows sunset, sunrise, or a
  // changed device clock. Visibility/focus also refresh suspended browser tabs.
  const schedule = () => {
    const now = new Date();
    const delay = 60000 - now.getSeconds() * 1000 - now.getMilliseconds() + 25;
    window.setTimeout(() => {
      refresh();
      schedule();
    }, delay);
  };
  refresh();
  schedule();
  return controller;
}

export function mountTheme(root) {
  if (mounts.has(root)) return mounts.get(root);
  const appearance = initializeTheme();
  const nav = root.querySelector(".ct-nav nav");
  if (!nav) return () => {};

  const abort = new AbortController();
  const signal = abort.signal;
  const id = `ct-theme-${++controlId}`;
  const wrapper = document.createElement("div");
  wrapper.className = "ct-theme";
  wrapper.innerHTML = `
    <button class="ct-theme-trigger" type="button" aria-expanded="false" aria-controls="${id}">
      <span class="ct-theme-icon" aria-hidden="true"></span>
      <span class="ct-theme-label"></span>
    </button>
    <div class="ct-theme-popover" id="${id}" hidden>
      <fieldset class="ct-theme-options" aria-describedby="${id}-hint">
        <legend>Appearance</legend>
        ${MODES.map(
          (mode) => `<label class="ct-theme-option"><input type="radio" name="${id}-mode" value="${mode}"><span>${LABELS[mode]}</span></label>`
        ).join("")}
      </fieldset>
      <p class="ct-theme-hint" id="${id}-hint">Auto follows your local time: dark from 7 pm to 7 am.</p>
    </div>`;
  nav.append(wrapper);

  const trigger = wrapper.querySelector(".ct-theme-trigger");
  const popover = wrapper.querySelector(".ct-theme-popover");
  const radioButtons = [...wrapper.querySelectorAll('input[type="radio"]')];

  const sync = () => {
    const { theme, mode } = appearance.getState();
    wrapper.querySelector(".ct-theme-icon").innerHTML = icons[theme];
    wrapper.querySelector(".ct-theme-label").textContent = LABELS[mode];
    trigger.setAttribute("aria-label", `Appearance: ${mode === "auto" ? `automatic, currently ${theme}` : theme}. Change appearance`);
    trigger.title = `Appearance: ${LABELS[mode]}`;
    for (const radio of radioButtons) radio.checked = radio.value === mode;
  };

  const close = (restoreFocus = false) => {
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus({ preventScroll: true });
  };

  trigger.addEventListener(
    "click",
    () => {
      if (!popover.hidden) {
        close();
        return;
      }
      popover.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      radioButtons.find((radio) => radio.checked)?.focus({ preventScroll: true });
    },
    { signal }
  );

  wrapper.addEventListener(
    "change",
    (event) => {
      if (!radioButtons.includes(event.target)) return;
      appearance.setMode(event.target.value);
      // Keep the group open: native arrow keys can traverse all three options.
    },
    { signal }
  );

  wrapper.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || popover.hidden) return;
      event.preventDefault();
      event.stopPropagation();
      close(true);
    },
    { signal }
  );

  wrapper.addEventListener(
    "focusout",
    (event) => {
      // A label click can briefly blur the radio before forwarding activation.
      // Outside pointer clicks are handled separately; only a known external
      // focus destination should dismiss the options here.
      if (event.relatedTarget && !wrapper.contains(event.relatedTarget)) close();
    },
    { signal }
  );

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!wrapper.contains(event.target)) close();
    },
    { signal }
  );
  window.addEventListener("ct-theme-change", sync, { signal });
  sync();

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    abort.abort();
    wrapper.remove();
    mounts.delete(root);
  };
  mounts.set(root, dispose);
  return dispose;
}
