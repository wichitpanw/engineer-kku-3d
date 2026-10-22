// EN15 former Engineering Library (Google Maps pins: ARIS / วิศวกรรมการผลิตขั้นสูง).
// Plan traced on Google satellite at ~0.153 m/px (21 Oct 2026) and the calibrated z19 mosaic;
// facades from Street View panoramas on the north road (x55,z-23 and x86,z-24).
// Dimensions are estimates, not survey data.
// Main hall: four folded-plate vaults running north-south, a two-storey glazed ground floor
// with an egg-crate fin grid and diamond lattice screen above on the long faces.
export const en15Parts = [
  { id: "hall", x: 61.25, z: -4, w: 32.5, d: 27, h: 10.4, roof: "flat", rotation: 0, kind: "hall" },
  // Lower west stair hall with three small east-west gables (satellite stripes).
  { id: "west-stair", x: 42.3, z: -2.5, w: 5.4, d: 13, h: 7.4, roof: "flat", rotation: 0, kind: "stair" },
  // Flat-roofed link and the white two-storey service wing against the east gable.
  { id: "east-link", x: 78.35, z: -3.5, w: 1.7, d: 25.5, h: 8, roof: "flat", rotation: 0, kind: "link" },
  { id: "east-wing", x: 82.45, z: -2.45, w: 6.5, d: 27.5, h: 7.6, roof: "flat", rotation: 0, kind: "wing" },
];
export const en15Vault = { bays: 4, rise: 4.6, over: 0.35 };
export const en15Site = {
  // One-storey lean-to verandah east of the service wing (white strip with posts on satellite).
  verandah: { x: 87.1, z: -2, w: 2.8, d: 20, h: 3.3 },
  // External stair to the service wing's upper floor, north face (Street View x86,z-24).
  stair: { x0: 80, x1: 85, z: -17.05, w: 1.4, rise: 3.8 },
  tank: { x: 88.2, z: -15 },
  // Letters "ENGINEERING LIBRARY" on the north ground-floor glazing.
  letters: { x: 62, z: -17.5 },
};
