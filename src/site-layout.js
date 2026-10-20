import { mechanicalGarage } from "./mechanical-layout.js";
import { en13Site } from "./en13-layout.js";
import { en14Garden } from "./en14-layout.js";
import clip from "../vendor/polygon-clipping/index.js";
import { buildings, auxiliaries } from "./campus-data.js";
export const SITE_REFERENCE = {
  originPixel: [458.38674602657557, 650.5646753944457],
  metersPerPixel: 0.57265497771093,
  source:
    "Google Maps satellite + Street View, Esri reference mosaic; checked 18 Oct 2026",
};
export function rectangle(x, z, w, d, rotation = 0) {
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([u, v]) => [
    x + u * Math.cos(rotation) + v * Math.sin(rotation),
    z - u * Math.sin(rotation) + v * Math.cos(rotation),
  ]);
}
export const circle = (x, z, r, n = 32) =>
  Array.from({ length: n }, (_, i) => [
    x + Math.cos((i / n) * Math.PI * 2) * r,
    z + Math.sin((i / n) * Math.PI * 2) * r,
  ]);
const polygon = (r) => [r];
export const area = (g) =>
  g.reduce(
    (sum, p) =>
      sum +
      p.reduce(
        (a, r, i) =>
          a +
          (i ? -1 : 1) *
            Math.abs(
              r.reduce((v, q, j) => {
                const n = r[(j + 1) % r.length];
                return v + q[0] * n[1] - n[0] * q[1];
              }, 0) / 2,
            ),
        0,
      ),
    0,
  );
export function stroke(points, width) {
  const r = width / 2,
    parts = points.map((p) => polygon(circle(...p, r, 16)));
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    if (len < 1e-6) continue;
    const sx = (-dz / len) * r,
      sz = (dx / len) * r;
    parts.push(
      polygon([
        [a[0] + sx, a[1] + sz],
        [b[0] + sx, b[1] + sz],
        [b[0] - sx, b[1] - sz],
        [a[0] - sx, a[1] - sz],
      ]),
    );
  }
  return clip.union(...parts);
}
export const roadNetwork = [
  {
    id: "inner-loop",
    width: 6.5,
    points: [
      [-53, -173],
      [-53, -125],
      [-53, -80],
      [-53, -38],
      [-54, 0],
      [-53, 23],
      [-49, 40],
      [-41, 56],
      [-31, 71],
      [-18, 84],
      [-2, 92],
      [18, 97],
      [47, 98],
      [110, 98],
      [160, 98],
      [176, 92],
      [184, 79],
      [184, 24],
      [184, -12],
      [183, -19],
      [180, -24],
      [177, -28],
    ],
  },
  {
    id: "north-lane",
    width: 5.5,
    points: [
      [-53, -173],
      [15, -173],
      [91, -173],
      [101, -173],
      [107, -168],
      [109, -160],
      [109, -129],
      [109, -106],
      [104, -100],
      [97, -96],
    ],
  },
  {
    id: "cb-north-connection",
    width: 5.5,
    points: [
      [101, -173],
      [155, -173],
      [210, -173],
      [284, -173],
    ],
  },
  {
    id: "civil-north-east",
    width: 6,
    points: [
      [38.5, -96],
      [115, -96],
      [149, -96],
      [157, -96],
      [162, -88],
      [167, -72],
      [170, -50],
      [177, -28],
    ],
  },
  {
    id: "civil-west-alley",
    width: 4.5,
    surface: "pavers",
    points: [
      [38.5, -96],
      [38.5, -61],
      [38.5, -40],
      [42, -28],
    ],
  },
  {
    id: "pien-east-access",
    width: 5.5,
    surface: "pavers",
    points: [
      [42, -28],
      [49, -24.5],
      [89, -24.5],
      [111, -28],
    ],
  },
  {
    id: "middle-cross",
    width: 5.5,
    points: [
      [111, -28],
      [177, -28],
      [284, -28],
    ],
  },
  {
    id: "east-lane",
    width: 6.5,
    points: [
      [284, -176],
      [284, -90],
      [284, -28],
      [284, 50],
      [284, 139],
    ],
  },
  {
    id: "northwest-entry",
    width: 9,
    points: [
      [-53, -173],
      [-68, -188],
      [-95, -198],
      [-121, -182],
      [-151, -153],
      [-191, -127],
      [-225, -109],
      [-246, -82],
    ],
  },
  {
    id: "outer-avenue",
    width: 10,
    points: [
      [-246, -82],
      [-234, -53],
      [-214, -24],
      [-190, 8],
      [-170, 36],
      [-160, 60],
      [-145, 78],
      [-132, 83],
      [-105, 99],
      [-75, 113],
      [-43, 125],
      [-10, 134],
      [49, 139],
      [126, 142],
      [284, 139],
    ],
  },
  {
    id: "agri-north-entry",
    width: 4,
    points: [
      [-191, -127],
      [-163, -144],
      [-123, -149],
      [-53, -149],
    ],
  },
  {
    id: "west-stub-south",
    width: 9,
    points: [
      [-246, -82],
      [-291, -49],
    ],
  },
  {
    id: "west-stub-north",
    width: 9,
    points: [
      [-246, -82],
      [-285, -136],
    ],
  },
  {
    id: "west-service",
    width: 4,
    points: [
      [-214, -24],
      [-197, -6],
      [-187, -9],
      [-153, -9],
      [-145, 4],
      [-132, 4],
    ],
  },
];
export const roundabouts = [
  {
    id: "west-roundabout",
    center: [-246, -82],
    outerRadius: 15,
    innerRadius: 6.5,
  },
];
export const parkingAreas = [
  {
    id: "PC-EN13", kind: "car", surface: "pavers", spacing: 2.6,
    polygon: rectangle(en13Site.parking.x, en13Site.parking.z, en13Site.parking.w, en13Site.parking.d),
    entry: [[178, 90], [174, 87], [161, 87]],
    rows: [{ from: [154, 80], to: [167, 80], angle: Math.PI }],
  },
  {
    id: "PC-EE-SIDE",
    entryWidth: 6,
    kind: "car",
    surface: "pavers",
    bayWidth: 2.5,
    bayDepth: 5,
    spacing: 2.5,
    polygon: rectangle(222, 73.5, 57, 13.6),
    entry: [[184, 70], [195, 70], [249, 70]],
    rows: [{ from: [195.75, 77.5], to: [248.25, 77.5], angle: Math.PI }],
  },
  {
    id: "MC-CPE",
    kind: "motorcycle",
    surface: "pavers",
    polygon: [
      [191, -5],
      [212, -5],
      [212, 0],
      [191, 0],
    ],
    entry: [
      [184, 4],
      [192, 4],
      [192, -2],
    ],
    rows: [{ from: [193, -2], to: [210, -2], angle: 0 }],
  },
  {
    id: "MC-EE",
    kind: "motorcycle",
    surface: "pavers",
    polygon: [
      [191, 35.5],
      [224, 35.5],
      [224, 43],
      [191, 43],
    ],
    entry: [
      [184, 39],
      [192, 39],
    ],
    rows: [
      { from: [193, 37.6], to: [222, 37.6], angle: 0 },
      { from: [193, 41], to: [222, 41], angle: Math.PI },
    ],
  },
  {
    id: "PC-EE-N",
    kind: "car",
    surface: "pavers",
    bayWidth: 2.5,
    bayDepth: 5,
    spacing: 2.5,
    polygon: [
      [196, 7.7],
      [224, 7.7],
      [224, 12.8],
      [196, 12.8],
    ],
    entry: [
      [184, 4],
      [195, 4],
      [197.25, 10.25],
    ],
    rows: [{ from: [197.25, 10.25], to: [222.25, 10.25], angle: 0 }],
  },
  {
    id: "PC-EE-S",
    kind: "car",
    surface: "pavers",
    bayWidth: 2.5,
    bayDepth: 5,
    spacing: 2.5,
    polygon: [
      [196, 25.2],
      [224, 25.2],
      [224, 30.3],
      [196, 30.3],
    ],
    entry: [
      [184, 35],
      [195, 35],
      [197.25, 27.75],
    ],
    rows: [{ from: [197.25, 27.75], to: [222.25, 27.75], angle: Math.PI }],
  },
  {
    id: "MC-CENTRAL",
    kind: "motorcycle",
    polygon: [
      [91, -12],
      [131, -12],
      [131, 28],
      [91, 28],
    ],
    entry: [
      [184, 18],
      [160, 18],
      [160, 24],
      [131, 24],
    ],
    rows: [
      { from: [95, -8], to: [127, -8], angle: 0 },
      { from: [95, 0], to: [127, 0], angle: 0 },
      { from: [95, 8], to: [127, 8], angle: 0 },
      { from: [95, 16], to: [127, 16], angle: 0 },
    ],
  },
  {
    id: "MC-WEST",
    kind: "motorcycle",
    polygon: [
      [-127, 4.8],
      [-85, 4.8],
      [-85, 8.2],
      [-127, 8.2],
    ],
    entry: [
      [-132, 4],
      [-129, 6.5],
      [-127, 6.5],
    ],
    rows: [
      { from: [-125, 6.5], to: [-114, 6.5], angle: 0 },
      { from: [-102, 6.5], to: [-87, 6.5], angle: 0 },
    ],
  },
  {
    id: "PC-FRONT-CHEM",
    kind: "car",
    covered: true,
    polygon: [
      [-39, 43],
      [-15, 67],
      [-10, 62],
      [-34, 38],
    ],
    accessVia: "chemical-apron", // No separate driveway through the front lawn.
    rows: [{ from: [-34, 43], to: [-15, 62], angle: Math.PI * 0.75 }],
  },
  {
    id: "PC-A",
    kind: "car",
    covered: true,
    polygon: [
      [-64, 92],
      [-53, 82],
      [-43, 95],
      [-20, 105],
      [-15, 116],
      [-45, 111],
    ],
    entry: [
      [-18, 84],
      [-28, 91],
      [-40, 96],
    ],
    rows: [{ from: [-52, 94], to: [-32, 105], angle: -0.5 }],
  },
  {
    id: "PC-B",
    kind: "car",
    polygon: [
      [19, 105],
      [52, 105],
      [52, 119],
      [19, 119],
    ],
    entry: [
      [18, 97],
      [18, 112],
      [21, 112],
    ],
    rows: [{ from: [23, 115], to: [48, 115], angle: 0 }],
  },
  {
    id: "PC-C",
    kind: "car",
    polygon: [
      [67, 111],
      [99, 111],
      [99, 124],
      [67, 124],
    ],
    entry: [
      [68, 98],
      [68, 117],
      [70, 117],
    ],
    rows: [{ from: [72, 120], to: [94, 120], angle: 0 }],
  },
  {
    id: "PC-D",
    kind: "car",
    polygon: [
      [126, 105],
      [156, 105],
      [156, 126],
      [126, 126],
    ],
    entry: [
      [160, 98],
      [160, 115],
      [154, 115],
    ],
    rows: [
      { from: [130, 109], to: [151, 109], angle: 0 },
      { from: [130, 122], to: [151, 122], angle: Math.PI },
    ],
  },
];
export const pedestrianLinks = [
  {
    id: "west-front-north",
    covered: true,
    width: 2.65,
    points: [
      [-40, -42],
      [-40, -9],
    ],
  },
  {
    id: "anniversary-front",
    covered: false,
    width: 2.4,
    points: [
      [-46, -170],
      [-46, -84],
      [-43, -51],
      [-40, -42],
    ],
  },
  {
    id: "west-front-south",
    covered: false,
    width: 2.65,
    points: [
      [-40, 18],
      [-42, 33],
      [-42, 43],
      [-36, 56],
      [-27, 67],
      [-16, 78],
    ],
  },
  {
    id: "south-covered-link",
    covered: true,
    width: 2.5,
    points: [
      [28, 24],
      [42, 28],
      [72, 30],
      [133, 30],
      [173, 30],
    ],
  },
  {
    id: "outer-west-path",
    covered: false,
    width: 2,
    points: [
      [-60, -130],
      [-60, -40],
      [-61, 15],
      [-56, 39],
      [-44, 60],
    ],
  },
];
export const plazas = [
  { id: "agri-east-entrance", clearBuildings: true, polygon: rectangle(-62.5,-84,13,5.2) },
  { id: "agri-north-apron", clearBuildings: true, polygon: rectangle(-85,-130,39,10) },
  { id: "agri-lab-access", clearBuildings: true, polygon: rectangle(-63,-59,15,6) },
  { id: "agri-lab-front", clearBuildings: true, polygon: rectangle(-62.5,-42,12,6) },
  { id: "agri-south-apron", clearBuildings: true, polygon: rectangle(-97,-16,40,18) },
  {
    id: "mechanical-inner-court", clearBuildings: true,
    polygon: [[-210,-83],[-173,-98],[-118,-58],[-119,-18],[-165,-10],[-202,-36]],
  },
  { id: "en13-entry", clearBuildings: true, polygon: rectangle(en13Site.entry.x, en13Site.entry.z, en13Site.entry.w, en13Site.entry.d) },
  {
    id: "en17-entrance-court",
    clearBuildings: true,
    polygon: [
      [172, -73],
      [232, -73],
      [232, -30.75],
      [174, -30.75],
    ],
  },
  {
    id: "cb-en17-rear-path",
    polygon: [
      [165.5, -108.5],
      [211, -108.5],
      [211, -104.8],
      [165.5, -104.8],
    ],
  },
  {
    id: "cb-side-apron",
    polygon: [
      [202.5, -136],
      [213, -136],
      [213, -114],
      [202.5, -114],
    ],
  },
  {
    id: "cb-forecourt",
    polygon: [
      [162, -168],
      [244, -168],
      [244, -136],
      [162, -136],
    ],
  },
  {
    id: "east-courtyard",
    polygon: [
      [187.25, -8],
      [259, -8],
      [259, 45],
      [187.25, 45],
    ],
  },
  {
    id: "pien-apron",
    polygon: [
      [-36, -33],
      [35, -33],
      [35, 27],
      [15, 37],
      [-27, 37],
      [-36, 18],
    ],
  },
  {
    id: "anniversary-apron",
    polygon: [
      [-45, -139],
      [-19, -146],
      [37, -112],
      [39, -53],
      [25, -42],
      [-32, -42],
      [-44, -61],
    ],
  },
  {
    id: "gear-plaza",
    polygon: circle(en14Garden.x, en14Garden.z, en14Garden.radius, 48),
  },
  {
    id: "chemical-apron",
    clearBuildings: true,
    polygon: [
      [-35, 38],
      [-8, 50],
      [0, 59],
      [63, 59],
      [63, 76],
      [24, 76],
      [12, 81],
      [-18, 82],
      [-31, 65],
    ],
  },
];
export function buildingFootprints() {
  return [...buildings, ...auxiliaries].map((b) => ({
    id: b.id,
    geometry:
      b.footprint
        ? polygon(b.footprint)
        : clip.union(
            ...b.parts.map((p) =>
              polygon(rectangle(p.x, p.z, p.w, p.d, p.rotation || 0)),
            ),
          ),
  }));
}
export function makeSiteLayout() {
  const footprints = buildingFootprints(),
    occupied = clip.union(...footprints.map((b) => b.geometry)),
    roads = roadNetwork.map((r) => ({
      ...r,
      geometry: stroke(r.points, r.width),
    })),
    roadSurface = clip.difference(
      clip.union(
        ...roads.map((r) => r.geometry),
        ...roundabouts.map((r) => [circle(...r.center, r.outerRadius, 48)]),
      ),
      ...roundabouts.map((r) => [circle(...r.center, r.innerRadius, 48)]),
    ),
    driveways = [
      {
        id: "mechanical-garage-entry",
        surface: "pavers",
        geometry: stroke(mechanicalGarage.entry, mechanicalGarage.aisle),
        pavingGeometry: clip.difference(stroke(mechanicalGarage.entry, mechanicalGarage.aisle), roadSurface),
      },
      (() => {
        // Chemical Engineering access is east of the gear garden, per user photos.
        // Flared mouth joins the public road; the inner end opens onto the court.
        const geometry = clip.union(
          stroke(
            [
              [34, 98],
              [33, 88],
              [29, 75],
            ],
            5.8,
          ),
          polygon([
            [28.5, 98],
            [39, 98],
            [36, 92],
            [35.9, 87],
            [30.1, 87],
            [30, 92],
          ]),
        );
        return {
          id: "chemical-entrance",
          surface: "pavers",
          geometry,
          pavingGeometry: clip.difference(geometry, roadSurface),
        };
      })(),
      ...parkingAreas
        .filter((p) => p.entry)
        .map((p) => {
          const geometry = stroke(p.entry, p.entryWidth || (p.kind === "car" ? 4 : 2.4));
          return {
            id: p.id,
            surface: p.surface,
            geometry,
            pavingGeometry:
              p.surface === "pavers"
                ? clip.difference(geometry, roadSurface)
                : [],
          };
        }),
      (() => {
        const geometry = clip.union(
          stroke(
            [
              [185, -28],
              [185, -38],
            ],
            7.5,
          ),
          polygon([
            [179, -28],
            [191, -28],
            [190, -32],
            [188.75, -35],
            [181.25, -35],
            [180, -32],
          ]),
        );
        return {
          id: "en17-entrance",
          surface: "pavers",
          geometry,
          pavingGeometry: clip.difference(geometry, roadSurface),
        };
      })(),
    ],
    vehicleSurface = clip.union(
      roadSurface,
      ...driveways.map((d) => d.geometry),
    ),
    parking = parkingAreas.map((p) => ({
      ...p,
      geometry: [polygon(p.polygon)],
    })),
    paving = plazas.map((p) => ({
      ...p,
      geometry: clip.difference(
        polygon(p.polygon),
        ...(p.clearBuildings ? [occupied] : []),
        ...(p.id === "en17-entrance-court"
          ? [
              polygon([
                [174, -51],
                [177, -51],
                [181.3, -46],
                [181.3, -36],
                [180.6, -33],
                [178.8, -31],
                [174, -31],
              ]),
            ]
          : []),
        vehicleSurface,
        ...parking.map((p) => p.geometry),
      ),
    })),
    walks = pedestrianLinks.map((p) => ({
      ...p,
      geometry: clip.difference(
        stroke(p.points, p.width),
        vehicleSurface,
        occupied,
        ...parking.map((p) => p.geometry),
      ),
    }));
  return {
    roundabouts,
    footprints,
    occupied,
    roads,
    roadSurface,
    driveways,
    vehicleSurface,
    parking,
    paving,
    walks,
  };
}
export function auditSite(layout = makeSiteLayout()) {
  const conflicts = [];
  for (const r of layout.roads)
    for (const b of layout.footprints) {
      const overlap = area(clip.intersection(r.geometry, b.geometry));
      if (overlap > 0.02)
        conflicts.push({
          type: "road-building",
          road: r.id,
          building: b.id,
          area: +overlap.toFixed(3),
        });
    }
  for (const p of layout.parking) {
    const overlap = area(clip.intersection(p.geometry, layout.roadSurface));
    if (overlap > 0.02)
      conflicts.push({
        type: "parking-road",
        parking: p.id,
        area: +overlap.toFixed(3),
      });
    for (const b of layout.footprints) {
      const overlap = area(clip.intersection(p.geometry, b.geometry));
      if (overlap > 0.02)
        conflicts.push({
          type: "parking-building",
          parking: p.id,
          building: b.id,
          area: +overlap.toFixed(3),
        });
    }
  }
  for (const p of layout.paving) {
    const overlap = area(clip.intersection(p.geometry, layout.vehicleSurface));
    if (overlap > 0.02)
      conflicts.push({
        type: "paving-road",
        plaza: p.id,
        area: +overlap.toFixed(3),
      });
  }
  for (const d of layout.driveways)
    for (const b of layout.footprints) {
      const overlap = area(clip.intersection(d.geometry, b.geometry));
      if (overlap > 0.02)
        conflicts.push({
          type: "driveway-building",
          driveway: d.id,
          building: b.id,
          area: +overlap.toFixed(3),
        });
    }
  return {
    conflicts,
    roadComponents: layout.vehicleSurface.length,
    roads: layout.roads.length,
    parking: layout.parking.length,
    roadArea: +area(layout.roadSurface).toFixed(2),
  };
}
