export function formatSubtype(value: string) {
  const labels: Record<string, string> = {
    keyboardkit: "Keyboard Kit",
    prebuild: "Prebuild",
    keycap: "Keycap",
    switch: "Switch",
    fullsize: "Full Size",
    "75": "75% or less",
    tkl: "TKL",
    alice: "Alice",
    cherry: "Cherry",
    mda: "MDA",
    sa: "SA",
    artisan: "Artisan",
    linear: "Linear",
    tactile: "Tactile",
    clicky: "Clicky",
    silent: "Silent",
  };

  return labels[value] ?? value;
}
