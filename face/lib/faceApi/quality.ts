// Lighting assessment for the live scan and uploaded photos. A frame that is
// too dark or blown out must not be used for analysis — the user is warned to
// fix their lighting first.

export interface Lighting {
  brightness: number; // mean luma 0-255
  ok: boolean;
  reason: string;     // user-facing warning when !ok
}

// Tunable bounds (exported for on-device adjustment).
export const LIGHTING = {
  MIN: 60,   // below this = too dark
  MAX: 220,  // above this = blown out / harsh backlight
};

export function assessLighting(meanLuma: number): Lighting {
  if (meanLuma <= 0) return { brightness: meanLuma, ok: false, reason: "Can't read the lighting — make sure the camera isn't covered." };
  if (meanLuma < LIGHTING.MIN) return { brightness: meanLuma, ok: false, reason: "Too dark — move to brighter, even lighting." };
  if (meanLuma > LIGHTING.MAX) return { brightness: meanLuma, ok: false, reason: "Too bright — reduce glare or move away from a backlight." };
  return { brightness: meanLuma, ok: true, reason: "" };
}
