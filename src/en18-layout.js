// Calibrated against high-resolution satellite grid (en18_grid_calibrated.png)
// and 4 Google Street View reference photos (09958b07, 32549c45, b8210105, f641fbe2).
// Origin: EN16 (x=0, z=0), +X East, -Z North.

export const en18Center = [-7, -92];

// Outer footprint polygon enclosing the entire EN18 complex (0 road/building conflicts)
export const en18Footprint = [
  [-42.5, -141.0],
  [-17.0, -123.0],
  [0.5, -125.5],
  [2.6, -118.5],
  [15.5, -96.0],
  [22.5, -78.0],
  [26.0, -58.0],
  [-2.1, -52.4],
  [-28.0, -58.0],
  [-29.0, -76.0],
  [-28.0, -88.0],
  [-35.0, -104.0],
  [-32.0, -122.0],
];

// 1. Main South-West Volume ("อาคาร 50 ปี วิศวะรวมใจ" Block — Cream Roof Wing)
// Rotated rectangle: C_NW(-28,-88), C_NE(-6,-104), C_SE(18.5,-68.4), C_SW(-2.1,-52.4)
export const en18MainBlock = {
  cx: -4.4,
  cz: -78.2,
  w: 26.6,
  d: 44.02,
  h: 21.5,
  rotation: 0.6288, // 36.03 deg: -Z local faces North-West toward the forecourt & road
  recessDepth: 6.5,
  lobbyH: 8.2,
};

// 2. North-East Solar Roof Wing, Soaring Prow & 3-Peak Diamond Lattice
export const en18SolarWing = {
  prowBase: [-23.0, -120.0],
  prowPeak: [-24.0, 25.5, -121.0],
  innerCorner: [-6.0, -104.0], // meets C_NE of Main Block
  spineSE: [18.5, -68.4],      // meets C_SE of Main Block
  eastEave: [15.5, -96.0],     // clear of EN01 (x >= 16)
  neMidEave: [2.6, -118.5],    // clear of SERVICE01 (x >= 3, z <= -119)
  northEave: [0.5, -125.5],
  // Google satellite 2026 (near-orthographic): the prow tip is the NW-most corner; the north face
  // runs east from it, there is no wall continuing north-west past the tip.
  nwEave: [-21.4, -122.4],
};

// 3. Elevated Concrete Gallery & Giant Gear Wall (Photo 1 & Photo 3)
// Extends from G_START near the NW road curve to G_END at the Prow NW wall
export const en18GearGallery = {
  start: [-42.5, -141.0],
  end: [-17.0, -123.0], // meets the prow's north face, west third
  gearS: 5.2,
  gearY: 1.95,
  gearRadius: 1.85,
  holeRadius: 0.88,
  teethCount: 18,
};

// 4. West Cooling Tower Deck & SE Triangular Terrace (Satellite Photo 5)
export const en18Annexes = {
  westPlant: {
    cx: -21.0,
    cz: -68.0,
    w: 12.0,
    d: 20.0,
    h: 8.2,
    rotation: 0.6288,
    towers: [
      [-21.5, -73.0],
      [-19.2, -69.5],
      [-16.9, -66.0],
    ],
  },
  seTerrace: {
    p1: [18.5, -68.4],
    p2: [7.5, -59.8],
    tip: [26.0, -58.0],
    y: 8.5,
  },
};
