// Civil engineering precinct: EN01 (department, workshops and the faculty canteen) and
// EN02 (civil engineering laboratory hall). Plan traced on the calibrated Google z19 mosaic
// (5 m grid) and Google satellite at ~0.15 m/px, 21 Oct 2026. Street View: north park
// (May 2019), inner road between the blocks (Apr 2014) and the east road (May 2019).
// Dimensions are estimates, not survey data.
const p = (id, kind, x0, x1, z0, z1, h, extra = {}) => ({
  id, kind, x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, h, roof: "flat", rotation: 0, ...extra,
});
export const en01Parts = [
  // Long two-storey wing on the north road: white metal roof of N-S gables at ~5.8 m bays.
  p("north-wing", "wing", -12.2, 75, -164.6, -148.3, 7.6, { bays: 15 }),
  // Department wing (Google pin "ภาควิศวกรรมโยธา") with the same gable roof, six bays.
  p("department", "wing", 16, 46, -137.4, -118.4, 7.4, { bays: 6 }),
  // Flat grey single-storey link between the two wings.
  p("link", "link", 22.5, 38.5, -148.3, -137.4, 3.8),
  // Dark flat-roofed annex south of the department with skylight strips.
  p("annex", "annex", 29.5, 45.5, -118.4, -106.5, 4),
  // Faculty canteen (pin "ศูนย์อาหารวิศวกรรมศาสตร์"): dark hipped roof, light east aisle,
  // a lower south verandah with four skylight strips, and a small dark store to the east.
  p("canteen", "canteen", 49, 77.5, -138.3, -112.3, 4.6),
  p("canteen-aisle", "aisle", 77.5, 80.5, -138.3, -112.3, 3.6),
  p("canteen-verandah", "verandah", 49, 80.5, -112.3, -106.3, 3.4),
  p("canteen-store", "store", 85, 90, -130, -112, 3.6),
];
export const en02Parts = [
  // Steel-framed lab hall: gable roof with an E-W ridge and a raised monitor that starts
  // ~13 m from the west end; louvred walls over a white plinth (Street View, east road).
  p("hall", "hall", 44.7, 140.4, -83.5, -40.2, 7.2, { rise: 3.6, monitor: [57.7, 140.4], monitorWidth: 7 }),
  // Lower white-roofed annex at the south-west corner.
  p("south-annex", "annex-white", 44.7, 72.2, -40.2, -31.1, 4.2),
  p("south-shed", "shed", 91.3, 98.7, -37.4, -31, 3),
];
export const civilSite = {
  // Open steel carports along the south and east faces of EN02.
  canopies: [
    { x0: 110, x1: 140.4, z0: -40.2, z1: -35.4, h: 3.2 },
    { x0: 140.4, x1: 146.4, z0: -80, z1: -68.5, h: 3.4 },
    { x0: 140.4, x1: 146.4, z0: -63.5, z1: -45, h: 3.4 },
  ],
  // Red steel water tower with a white tank against the east gable (Street View, east road).
  tower: { x: 143.4, z: -66, h: 9.2 },
};
