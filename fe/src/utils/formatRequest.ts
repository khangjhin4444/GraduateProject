export function formatRequest(value: string) {
  const labels: Record<string, string> = {
    keyboardkit: "KeyboardKit",
    prebuild: "Prebuild",
    keycap: "Keycap",
    switch: "Switch",
    fullsize: "Full Size",
    "75": "75%",
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
