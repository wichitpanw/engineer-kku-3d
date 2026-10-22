// EN08 Industrial Engineering. Plan traced on the Google z19 satellite mosaic (21 Oct 2026,
// 0.306 m/px, registered with fromGeo); heights and facades from Street View May 2019 and
// Google Maps place photos. Dimensions are estimates, not survey data.
// West half: two-storey concrete wings with flat roof decks around a tree court.
// East half: brick / pink-rendered wings with red roofs, a tan-roofed hall and the 1-storey office.
export const en08Parts = [
  { id: "west-north", x: -124.5, z: 16.5, w: 37, d: 13, h: 7.6, roof: "flat", rotation: 0, kind: "band" },
  { id: "west-wing", x: -137.5, z: 32, w: 15, d: 18, h: 7.6, roof: "flat", rotation: 0, kind: "band" },
  // Street View May 2019 (Wittayawattana Rd): the three-storey block is the SW corner, with the
  // entrance and orange signboard on its south face and vertical lettering on its west face.
  { id: "west-south-end", x: -140, z: 48, w: 12, d: 14, h: 11.2, roof: "flat", rotation: 0, kind: "end" },
  { id: "west-south", x: -120, z: 48, w: 28, d: 14, h: 7.6, roof: "flat", rotation: 0, kind: "band" },
  { id: "east-hall", x: -82.5, z: 17.25, w: 45, d: 14.5, h: 7.8, roof: "hip", rotation: 0, kind: "brick" },
  { id: "east-west-wing", x: -98.25, z: 32.75, w: 13.5, d: 16.5, h: 8.2, roof: "gable", rotation: 0, kind: "pink", ridge: "z" },
  { id: "east-block", x: -67.5, z: 32.75, w: 15, d: 16.5, h: 11, roof: "hip", rotation: 0, kind: "pink" },
  { id: "south-bar", x: -86.5, z: 50, w: 41, d: 10, h: 11, roof: "gable", rotation: 0, kind: "pink", ridge: "x" },
  { id: "office", x: -58, z: 33.5, w: 6, d: 15, h: 4.2, roof: "flat", rotation: 0, kind: "office" },
];
export const en08Site = {
  // Covered walk with round orange columns between the courts and the south bar.
  walk: { x: -83.5, z: 43, w: 47, d: 2.6 },
  westCourt: { x: -118, z: 32, w: 24, d: 18 },
  eastCourt: { x: -83.25, z: 32.75, w: 16.5, d: 16.5 },
  // Curved black department sign on a stone base, north of the office (position estimated).
  sign: { x: -55.5, z: 19, w: 6.4 },
  // Steel carport along the west driveway, seen from Wittayawattana Rd.
  carport: { x: -153.5, z: 36, w: 6, d: 22 },
};
