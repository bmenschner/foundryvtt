export function parseCount(value) {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0 || count > 100) {
    throw new Error("Bitte eine ganze Zahl von 0 bis 100 eingeben.");
  }
  return count;
}

// Eden writes a boolean choice immediately before constructing its formula.
// Keep the numeric choice on this single configuration object only.
export function installCount(configured, requested, added = 0, loner = false) {
  parseCount(requested);
  parseCount(added);
  const descriptor = Object.getOwnPropertyDescriptor(configured, "useWildDie");
  if (descriptor && (!descriptor.configurable || descriptor.get || descriptor.set)) {
    throw new Error("Eine andere Erweiterung verändert bereits die Schicksalswürfel-Auswahl.");
  }
  const originalPool = Number(configured.pool) || 0;
  let enabled = requested + added > 0;
  Object.defineProperty(configured, "useWildDie", {
    configurable: true,
    enumerable: true,
    get() {
      const pool = Math.max(0, Math.floor(Number(this.pool) || 0));
      // Added dice occupy their own places in the final pool. Only the
      // remaining original dice are eligible for replacement.
      const extra = Math.min(added, pool);
      return enabled ? extra + Math.min(requested, pool - extra) : 0;
    },
    set(value) { enabled = Boolean(value); }
  });
  // Eden subsequently applies the modifier, wounds and its normal pool cap.
  // Adjust the base exactly once, not on every read or recalculation.
  configured.pool = originalPool + added + (loner ? 1 : 0);
  return () => {
    const value = configured.useWildDie;
    Object.defineProperty(configured, "useWildDie", {
      configurable: true, enumerable: true, writable: true, value
    });
  };
}

export function validateMode(count, { explode, extended, threshold, buying }) {
  if (count <= 1) return;
  if (buying) throw new Error("Zum Erfolge-Kaufen bitte die Schicksalswürfel auf 0 setzen.");
  if (explode) throw new Error("Mehrere Schicksalswürfel mit explodierenden Sechsen werden von dieser Version noch nicht unterstützt.");
  if (extended && threshold > 0) {
    throw new Error("Mehrere Schicksalswürfel: Ausgedehnte Proben bitte mit Schwellenwert 0 intervallweise würfeln.");
  }
}
