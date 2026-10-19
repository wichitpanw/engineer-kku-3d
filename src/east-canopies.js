// Shared low roof envelopes for rendering and overlap checks (campus metres).
// Tall building roofs are separate storeys and are not part of this low-roof audit.
export const eastCanopies = {
  electricalParking: { x: 222, z: 77.5, w: 58, d: 6.4, minY: 2.7, maxY: 3.7 },
  oldSouth: { x: 221, z: 62, w: 60, d: 2.4, minY: 2.7, maxY: 3.0 },
  motorcycle: { x: 207.5, z: 38.9, w: 33.5, d: 6.4, minY: 2.6, maxY: 3.4 },
  computer: { x: 201.5, z: -2.3, w: 21, d: 5.3, minY: 2.8, maxY: 2.9 },
  link: { x: 229.375, z: 35.1, w: 10.25, d: 2.7, minY: 2.6, maxY: 3.1 },
  oldNorth: { x: 221, z: 44.1, w: 60, d: 3.6, minY: 2.65, maxY: 3.0 },
  oldWest: { x: 189.8, z: 53, w: 2.25, d: 21, minY: 2.75, maxY: 2.9 },
};
