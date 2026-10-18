// Shared exterior footprint: +X east, +Z south. Dimensions estimated from photos.
export const en14Parts = [
  {
    id: "west",
    x: -18,
    z: 30,
    w: 48,
    d: 15,
    h: 12.8,
    rotation: -0.73,
    roof: "custom",
  },
  {
    id: "east",
    x: 23,
    z: 52,
    w: 48,
    d: 16,
    h: 12.8,
    rotation: 0,
    roof: "custom",
  },
  {
    id: "tower",
    x: 1,
    z: 53,
    w: 9,
    d: 18,
    h: 14.3,
    rotation: 0,
    roof: "custom",
  },
  {
    id: "lab",
    x: 54,
    z: 55,
    w: 16,
    d: 24,
    h: 7.5,
    rotation: 0,
    roof: "custom",
  },
  {
    id: "office",
    x: 24,
    z: 37,
    w: 20,
    d: 15,
    h: 3.7,
    rotation: 0,
    roof: "flat",
  },
];

// Garden aligns with the central sign tower and glazed entrance (user correction).
export const en14Garden = { x: 1, z: 73, radius: 8.5 };
