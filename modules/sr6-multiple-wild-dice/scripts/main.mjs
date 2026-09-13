import { parseCount, installCount, validateMode } from "./core.mjs";

const ID = "sr6-multiple-wild-dice";
const states = new WeakMap();
let hintId = 0;

function styleHint(element, rules) {
  for (const [property, value] of Object.entries(rules)) {
    element.style.setProperty(property, value, "important");
  }
}

Hooks.on("renderRollDialog", (app, html) => {
  if (game.system.id !== "shadowrun6-eden") return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  const checkbox = root?.querySelector('input[name="useWildDie"]');
  const configured = app.dialogResult;
  if (!checkbox || !configured || !app.data?.buttons) return;
  if (root.querySelector('[data-sr6-multiple-wild]')) return;

  let state = states.get(app);
  if (!state) {
    state = { count: Number(configured.useWildDie) || (checkbox.checked ? 1 : 0), added: 0, loner: false };
    states.set(app, state);
    for (const [key, button] of Object.entries(app.data.buttons)) {
      if (typeof button.callback !== "function") continue;
      const original = button.callback;
      button.callback = async function (...args) {
        if (state.submitted) return;
        try {
          const count = parseCount(state.input.value);
          const added = parseCount(state.addInput.value);
          const form = state.input.closest("form");
          validateMode(count + added, {
            explode: form.querySelector('[name="explode"]')?.checked,
            extended: form.querySelector('[name="extended"]')?.checked,
            threshold: Number(form.querySelector('[name="threshold"]')?.value),
            buying: /auto|buy|bought/i.test(key)
          });
          state.count = count;
          state.added = added;
          state.checkbox.checked = count + added > 0;
          state.release?.();
          state.release = installCount(configured, count, added, state.lonerInput.checked);
          state.submitted = true;
        } catch (error) {
          ui.notifications.warn(error.message);
          throw error; // Prevent Dialog from closing or spending Edge/ammunition.
        }
        // Eden's callback resolves an outer promise and does not return its
        // asynchronous work. Keep the accessor for this configuration's lifetime.
        return original.apply(this, args);
      };
    }
  }

  checkbox.hidden = true;
  checkbox.style.setProperty("display", "none", "important");
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.max = "100";
  input.step = "1";
  input.value = String(state.count);
  input.dataset.sr6MultipleWild = "true";
  input.setAttribute("aria-label", "Anzahl Schicksalswürfel");
  input.style.width = "5em";
  input.addEventListener("input", () => {
    state.count = input.value;
    checkbox.checked = Number(input.value) + Number(state.added) > 0;
  });
  const help = document.createElement("span");
  help.className = "sr6-wild-hint";
  styleHint(help, { display: "block", position: "relative", margin: "2px 0 0", width: "auto" });
  const link = document.createElement("button");
  link.type = "button";
  link.className = "sr6-wild-hint-link";
  link.textContent = "(Hinweis)";
  // Keep essential presentation self-contained, including in PopOut windows.
  styleHint(link, {
    display: "inline", width: "auto", height: "auto", "min-width": "0",
    "min-height": "0", padding: "0", margin: "0", border: "0",
    background: "transparent", "box-shadow": "none", "text-shadow": "none",
    color: "inherit", font: "inherit", "font-size": "12px",
    "line-height": "1.5", "text-decoration": "underline dotted",
    "text-underline-offset": "3px", cursor: "help", opacity: "1"
  });
  const tooltip = document.createElement("span");
  tooltip.id = `${ID}-hint-${++hintId}`;
  tooltip.className = "sr6-wild-hint-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.textContent = "Verwenden ersetzt normale Würfel. Hinzufügen vergrößert den Pool. Beispiel: Pool 12, verwenden 3, hinzufügen 2 ergibt 9 normale und 5 Schicksalswürfel (14 insgesamt). Zusatzwürfel nicht nochmals als Pool-Modifikator eintragen.";
  tooltip.hidden = true;
  tooltip.setAttribute("popover", "manual");
  styleHint(tooltip, {
    display: "none", position: "fixed", inset: "auto", margin: "0",
    "z-index": "2147483647", width: "280px", "max-width": "calc(100vw - 24px)",
    "max-height": "calc(100vh - 24px)", overflow: "auto",
    "box-sizing": "border-box", padding: "12px 14px",
    border: "1px solid #8894a7", "border-radius": "6px",
    background: "#202530", color: "#ffffff", "box-shadow": "0 4px 16px #0008",
    font: "normal 13px/1.5 sans-serif", "text-align": "left",
    "text-transform": "none", "text-shadow": "none", "white-space": "normal",
    "overflow-wrap": "break-word", "letter-spacing": "normal", opacity: "1"
  });
  link.setAttribute("aria-describedby", tooltip.id);
  link.setAttribute("aria-controls", tooltip.id);
  link.setAttribute("aria-expanded", "false");
  let pinned = false;
  const showHint = (visible) => {
    if (!visible && tooltip.matches(":popover-open")) tooltip.hidePopover();
    tooltip.hidden = !visible;
    tooltip.style.setProperty("display", visible ? "block" : "none", "important");
    link.setAttribute("aria-expanded", String(visible));
    if (visible) {
      // The browser top layer prevents clipping by the scrollable roll dialog.
      if (tooltip.showPopover && !tooltip.matches(":popover-open")) tooltip.showPopover();
      const bounds = link.getBoundingClientRect();
      const viewport = link.ownerDocument.defaultView;
      const below = Math.max(0, viewport.innerHeight - bounds.bottom - 18);
      const above = Math.max(0, bounds.top - 18);
      const placeBelow = tooltip.scrollHeight <= below || below >= above;
      styleHint(tooltip, { "max-height": `${Math.max(24, placeBelow ? below : above)}px` });
      const width = tooltip.offsetWidth;
      const height = tooltip.offsetHeight;
      const left = Math.max(12, Math.min(bounds.right - width, viewport.innerWidth - width - 12));
      const top = placeBelow
        ? bounds.bottom + 6 : Math.max(12, bounds.top - height - 6);
      styleHint(tooltip, { left: `${left}px`, top: `${top}px` });
    }
  };
  help.addEventListener("pointerenter", () => showHint(true));
  help.addEventListener("pointerleave", () => {
    if (!pinned && link.ownerDocument.activeElement !== link) showHint(false);
  });
  link.addEventListener("focus", () => showHint(true));
  link.addEventListener("blur", () => { pinned = false; showHint(false); });
  link.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    pinned = !pinned;
    showHint(pinned);
  });
  link.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      pinned = false;
      showHint(false);
    }
  });
  help.append(link, tooltip);
  checkbox.after(input);
  const labelCell = checkbox.closest("td")?.previousElementSibling;
  if (labelCell && !labelCell.contains(checkbox)) labelCell.append(help);
  else input.after(help);
  const addInput = document.createElement("input");
  addInput.type = "number";
  addInput.min = "0";
  addInput.max = "100";
  addInput.step = "1";
  addInput.value = String(state.added);
  addInput.dataset.sr6AddedWild = "true";
  addInput.id = `${ID}-added-${hintId}`;
  addInput.setAttribute("aria-label", "Schicksalswürfel hinzufügen");
  addInput.style.width = "5em";
  addInput.addEventListener("input", () => {
    state.added = addInput.value;
    checkbox.checked = Number(state.count) + Number(addInput.value) > 0;
  });
  const addLabel = document.createElement("label");
  addLabel.htmlFor = addInput.id;
  addLabel.textContent = "Schicksalswürfel hinzufügen";
  const currentRow = checkbox.closest("tr");
  let addedRow;
  if (currentRow && labelCell) {
    const row = document.createElement("tr");
    row.dataset.sr6AddedWildRow = "true";
    let offset = 0;
    for (const cell of currentRow.cells) {
      if (cell === labelCell) break;
      offset += cell.colSpan;
    }
    if (offset) {
      const spacer = document.createElement("td");
      spacer.colSpan = offset;
      row.append(spacer);
    }
    const label = document.createElement("td");
    label.style.textAlign = "right";
    label.append(addLabel);
    const field = document.createElement("td");
    field.append(addInput);
    row.append(label, field);
    currentRow.after(row);
    addedRow = row;
  } else {
    const row = document.createElement("div");
    row.append(addLabel, addInput);
    input.after(row);
    addedRow = row;
  }
  const lonerInput = document.createElement("input");
  lonerInput.type = "checkbox";
  lonerInput.id = `${ID}-loner-${hintId}`;
  lonerInput.dataset.sr6Loner = "true";
  lonerInput.checked = state.loner;
  lonerInput.addEventListener("change", () => { state.loner = lonerInput.checked; });
  const lonerLabel = document.createElement("label");
  lonerLabel.htmlFor = lonerInput.id;
  lonerLabel.textContent = "Einzelgänger (+1 W6)";
  const lonerRow = document.createElement(addedRow.tagName.toLowerCase());
  lonerRow.dataset.sr6LonerRow = "true";
  if (addedRow.tagName === "TR") {
    if (addedRow.cells.length === 3) lonerRow.append(addedRow.cells[0].cloneNode(false));
    const label = document.createElement("td");
    label.style.textAlign = "right";
    label.append(lonerLabel);
    const field = document.createElement("td");
    field.append(lonerInput);
    lonerRow.append(label, field);
  } else lonerRow.append(lonerLabel, lonerInput);
  addedRow.after(lonerRow);
  state.lonerInput = lonerInput;
  state.input = input;
  state.addInput = addInput;
  state.checkbox = checkbox;
  app.setPosition({ height: "auto" });
});

Hooks.once("ready", () => {
  console.info(`${ID} | Geladen für Shadowrun 6 Eden ${game.system.version}`);
});
