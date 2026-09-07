import { getEmail } from "../contact-email.js";

export function renderContact() {
  return `<dialog class="ct-contact-dialog" aria-labelledby="ct-contact-title" aria-describedby="ct-contact-description">
    <button class="ct-contact-close" type="button" aria-label="Close contact details"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m4 4 10 10M14 4 4 14" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></button>
    <span class="ct-contact-eyebrow">CONTACT</span>
    <h2 id="ct-contact-title">Let’s connect</h2>
    <p id="ct-contact-description" class="ct-contact-description">Interested in my research or have an idea for a collaboration? I’d love to hear from you.</p>
    <div class="ct-contact-email">
      <span class="ct-contact-email-label">EMAIL ADDRESS</span>
      <p class="ct-contact-address" tabindex="-1"></p>
    </div>
    <div class="ct-contact-actions">
      <button class="ct-contact-copy" type="button" autofocus><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1.5" fill="none" stroke="currentColor"/><path d="M10 5V3.5A1.5 1.5 0 0 0 8.5 2h-5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" fill="none" stroke="currentColor"/></svg><span>Copy email</span></button>
      <span class="ct-contact-status" role="status" aria-live="polite" aria-atomic="true"></span>
    </div>
  </dialog>`;
}

export function mountContact(root) {
  const dialog = root.querySelector(".ct-contact-dialog");
  if (!dialog || dialog.dataset.contactMounted) return;
  dialog.dataset.contactMounted = "true";

  const address = dialog.querySelector(".ct-contact-address");
  const copy = dialog.querySelector(".ct-contact-copy");
  const copyLabel = copy.querySelector("span");
  const status = dialog.querySelector(".ct-contact-status");
  let opener = null;
  let revision = 0;
  let backdropPointer = false;

  function clearContact() {
    revision += 1;
    address.textContent = "";
    status.textContent = "";
    copyLabel.textContent = "Copy email";
    copy.disabled = false;
    delete copy.dataset.copied;
    backdropPointer = false;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }

  function closeContact() {
    dialog.close();
    clearContact();
  }

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest?.("[data-contact-open]");
    if (!trigger || !root.contains(trigger)) return;
    event.preventDefault();
    if (dialog.open) return;
    revision += 1;
    opener = trigger;
    address.textContent = getEmail();
    dialog.showModal();
  });

  dialog.querySelector(".ct-contact-close").addEventListener("click", closeContact);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeContact();
  });
  dialog.addEventListener("close", () => {
    // Ignore a queued close event if the visitor has already reopened the dialog.
    if (!dialog.open) clearContact();
  });

  const isOutside = (event) => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  dialog.addEventListener("pointerdown", (event) => {
    backdropPointer = event.target === dialog && isOutside(event);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && backdropPointer && isOutside(event)) closeContact();
    backdropPointer = false;
  });

  function fallbackCopy(email) {
    // Keep the temporary selection inside the modal, since the rest of the page is inert.
    const field = document.createElement("textarea");
    field.className = "ct-contact-clipboard";
    field.value = email;
    field.readOnly = true;
    field.tabIndex = -1;
    dialog.append(field);
    let copied = false;
    try {
      field.select();
      field.setSelectionRange(0, email.length);
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    } finally {
      field.remove();
    }
    return copied;
  }

  copy.addEventListener("click", async () => {
    if (!dialog.open || copy.disabled) return;
    const currentRevision = revision;
    const email = address.textContent;
    copy.disabled = true;
    status.textContent = "";
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        copied = true;
      }
    } catch {
      // Some browsers or permissions block the Clipboard API; a selection can still be copied.
    }
    if (!dialog.open || currentRevision !== revision) return;
    if (!copied) copied = fallbackCopy(email);
    copy.disabled = false;
    if (copied) {
      copyLabel.textContent = "Copied";
      copy.dataset.copied = "true";
      status.textContent = "Email copied.";
      copy.focus({ preventScroll: true });
    } else {
      const range = document.createRange();
      range.selectNodeContents(address);
      address.focus({ preventScroll: true });
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Select and copy the email address.";
    }
  });
}
