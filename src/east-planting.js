// Individual trunks placed from the May 2019 courtyard panorama and aerial.
// Roots are explicit, not randomly scattered; canopy reach remains approximate.
export const eastPlanting = [
  ...[196, 207, 218, 240, 249].map((x, i) => ({
    kind: "shade-tree", x, z: 83.5 + (i % 2), h: 10 + (i % 3),
  })),
  { kind: "palm", x: 209, z: 14.2, h: 7.1 },
  { kind: "palm", x: 210.1, z: 15.1, h: 6.4 },
  { kind: "fan-cluster", x: 219, z: 15, h: 4.3 },
  { kind: "shrub-tree", x: 220.4, z: 17.2, h: 2.8 },
  { kind: "palm", x: 234, z: 11.4, h: 9.1 },
  { kind: "palm", x: 236, z: 37, h: 10 },
  ...[194, 198, 202, 206].map((x) => ({
    kind: "column-tree",
    x,
    z: -6.8,
    h: 9.3 + (x % 3) * 0.4,
  })),
  { kind: "shade-tree", x: 190, z: 1.8, h: 10.5 },
  { kind: "shade-tree", x: 233, z: 40, h: 11 },
  { kind: "shade-tree", x: 209, z: 64.5, h: 11.5 },
  { kind: "shade-tree", x: 231, z: 65.8, h: 10.5 },
];
