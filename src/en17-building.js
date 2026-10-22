import * as THREE from "three";
import clip from "../vendor/polygon-clipping/index.js";
import { en17FlatParts, en17Garage, en17EastWing } from "./en17-layout.js";
import { rectangle } from "./site-layout.js?v=handoff-1";
const material = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const M = {
  wall: material("#e4dfcf"),
  soffit: material("#b9b6a8"),
  tile: material("#b56f57"),
  dark: material("#32494b"),
  trim: material("#8a938f"),
  roof: material("#a77361"),
  flatRoof: material("#96988a"),
  light: material("#c6ba92", { transparent: true, opacity: 0.84 }),
  tan: material("#ae9065"),
  glass: material("#526e74", { roughness: 0.28, metalness: 0.25 }),
};
function box(p, x, y, z, w, h, d, m = M.wall) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}
function beam(p, a, b, size = 0.12, m = M.soffit) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    v = bv.clone().sub(av);
  const o = box(p, 0, 0, 0, size, v.length(), size, m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
}
function roofSheet(p, z1, y1, z2, y2, x = 200, w = 55, m = M.roof) {
  const o = box(
    p,
    x,
    (y1 + y2) / 2,
    (z1 + z2) / 2,
    w,
    0.14,
    Math.hypot(z2 - z1, y2 - y1),
    m,
  );
  o.rotation.x = -Math.atan2(y2 - y1, z2 - z1);
}
function annex(p, x, z, w, d, h, rotation = 0, gable = false, detail = true) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotation;
  p.add(g);
  const garage = x < 185 && rotation === 0;
  if (garage) {
    box(g, 0, h / 2, -d / 2, w, h, 0.25);
    for (const side of [-1, 1]) box(g, (side * w) / 2, h / 2, 0, 0.25, h, d);
    for (const side of [-1, 1])
      box(g, side * (w / 4 + 1.2), h / 2, d / 2, (w - 4.8) / 2, h, 0.25);
    box(g, 0, 5.05, d / 2, 4.8, 2.1, 0.25);
    box(g, 0, 2, d / 2 - 1.2, 4.8, 3.7, 0.12, M.soffit);
    if (detail) {
      for (let y = 4.2; y < 5.8; y += 0.24)
        box(g, 0, y, d / 2 + 0.13, 4.7, 0.13, 0.25, M.tan);
      for (let y = 0.3; y < 3.9; y += 0.16)
        box(g, 0, y, d / 2 - 1.12, 4.7, 0.024, 0.03, M.trim);
    }
  } else box(g, 0, h / 2, 0, w, h, d);
  box(g, 0, 0.22, 0, w + 0.2, 0.44, d + 0.2, M.soffit);
  if (gable) {
    for (const side of [-1, 1]) {
      const r = box(
        g,
        (side * w) / 4,
        h + 0.8,
        0,
        Math.hypot(w / 2, 1.6),
        0.14,
        d + 1,
        M.tile,
      );
      r.rotation.z = -side * Math.atan2(1.6, w / 2);
    }
  } else {
    box(g, 0, h + 0.1, 0, w + 0.3, 0.2, d + 0.3, M.flatRoof);
    for (const side of [-1, 1])
      box(g, 0, h + 0.35, (side * d) / 2, w, 0.5, 0.12);
  }
  // The supplied photo confirms the garage opening. Other annex doors were
  // previously guessed; no automatic door/window row is generated here.
}
function departmentSign(p) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 200;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#9c9f8d";
  ctx.fillRect(0, 0, 1024, 200);
  ctx.textAlign = "center";
  ctx.fillStyle = "#253536";
  ctx.font = 'bold 58px "IBM Plex Sans Thai", sans-serif';
  ctx.fillText("อาคารปฏิบัติการวิศวกรรมอุตสาหการ", 512, 86, 980);
  ctx.fillStyle = "#944c40";
  ctx.font = "38px Arial";
  ctx.fillText("Industrial Engineering Laboratories", 512, 152, 960);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  box(p, 193, 1.15, -44.8, 7.5, 1.4, 0.3, M.soffit);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 1.25),
    new THREE.MeshStandardMaterial({ map: t }),
  );
  sign.position.set(193, 1.2, -44.63);
  p.add(sign);
}
/** The photographed north wall of EN17. Other faces retain their provisional envelope. */
export function createEN17(root, detail) {
  const beige = material("#b3a18a"),
    shutter = material("#a29b8c"),
    white = M.wall;
  const p = new THREE.Group();
  root.add(p);
  // Long laboratory hall, with a high ventilated wall rather than two rows of classroom windows.
  box(p, 200, 0.15, -86, 54, 0.3, 29, M.soffit);
  box(p, 200, 3.3, -85.9, 53.6, 6.6, 28.6, white);
  box(p, 200, 3.3, -100.3, 53.6, 6.6, 0.3, beige);
  // Aerial shows one long red roof with an off-centre ridge and pale rooflight bands.
  // Pitch is estimated; do not duplicate it as three small classroom roofs.
  roofSheet(p, -101.1, 7.05, -92, 10.1);
  roofSheet(p, -92, 10.1, -70.9, 7.05);
  const garage = en17Garage,
    east = en17EastWing;
  annex(p, garage.x, garage.z, garage.w, garage.d, garage.h, 0, false, detail);
  connectedFlatAnnex(p, detail);
  annex(p, east.x, east.z, east.w, east.d, 5.5, 0, true, detail);
  if (!detail) return;
  // Concrete frame, deep parapet slots, beige horizontal louver courses and roll-up doors.
  for (let x = 173.4; x < 227; x += 6.6) {
    box(p, x, 3.4, -100.55, 0.32, 6.8, 0.42, white);
    box(p, x + 3.15, 6.35, -100.55, 5.95, 0.6, 0.12, M.dark);
  }
  for (const y of [0.42, 4.25, 5.75, 6.9])
    box(p, 200, y, -100.7, 54, 0.3, 0.55, white);
  for (let y = 0.75; y < 5.7; y += 0.28) {
    const louver = box(p, 200, y, -100.52, 53.4, 0.13, 0.18, beige);
    louver.rotation.x = -0.2;
  }
  for (const x of [179.5, 199.4, 219.2]) {
    box(p, x, 2.2, -100.77, 4.1, 4.2, 0.12, shutter);
    for (let y = 0.25; y < 4.3; y += 0.14)
      box(p, x, y, -100.85, 4.1, 0.025, 0.025, M.trim);
    for (const dx of [-2.2, 2.2])
      box(p, x + dx, 2.2, -100.82, 0.16, 4.4, 0.18, white);
  }
  for (const x of [188, 208]) {
    box(p, x, 3.5, -100.8, 0.85, 0.8, 0.12, M.dark);
    for (let y = 3.2; y < 3.9; y += 0.1)
      box(p, x, y, -100.89, 0.74, 0.035, 0.04, M.trim);
  }
  for (const x of [174.5, 193.2, 225.6])
    box(p, x, 3.3, -100.9, 0.11, 6.4, 0.14, white);
  // South entrance facade inferred only where visible in the supplied street photo.
  for (let x = 175; x <= 226; x += 6.6)
    box(p, x, 3.4, -71.45, 0.35, 6.8, 0.42, white);
  for (const y of [4.4, 5, 5.6, 6.2])
    box(p, 200, y, -71.35, 53, 0.18, 0.14, beige);

  for (let x = 177; x < 226; x += 6.2) {
    roofSheet(p, -99.9, 7.48, -92, 10.18, x, 1.05, M.light);
    roofSheet(p, -92, 10.18, -72, 7.28, x, 1.05, M.light);
  }
  for (let x = 173; x <= 227; x += 1.35) {
    beam(p, [x, 7.15, -101], [x, 10.2, -92], 0.018, M.trim);
    beam(p, [x, 10.2, -92], [x, 7.15, -71], 0.018, M.trim);
  }
  // East gable end and drainage pipes. No internal machinery is built.
  const tri = new THREE.BufferGeometry();
  tri.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [227, 6.6, -100.5, 227, 10, -92, 227, 6.6, -71.5],
      3,
    ),
  );
  tri.setIndex([0, 1, 2]);
  tri.computeVertexNormals();
  const gable = new THREE.Mesh(
    tri,
    new THREE.MeshStandardMaterial({
      color: "#e4dfcf",
      side: THREE.DoubleSide,
    }),
  );
  p.add(gable);
  const west = new THREE.Mesh(tri.clone().translate(-54, 0, 0), gable.material);
  p.add(west);
  for (const z of [-99, -73]) box(p, 227.4, 3.4, z, 0.12, 6.8, 0.12, white);
  departmentSign(p);
  entranceGates(p);
  // Covered pedestrian link at the eastern edge of the forecourt, clear of the drive.
  for (let x = 195; x <= 213; x += 4.5) {
    for (const z of [-36, -33]) box(p, x, 1.65, z, 0.12, 3.3, 0.12, M.tan);
    beam(p, [x, 2.7, -36], [x, 3.3, -34.5], 0.09, M.tan);
  }
  for (let i = 0; i < 12; i++) {
    const z = -36.3 + i * 0.3;
    box(
      p,
      204,
      3.35 + Math.sin((i / 11) * Math.PI) * 0.28,
      z,
      19,
      0.07,
      0.32,
      M.soffit,
    );
  }
}

// Permanent two-lane entrance equipment shown in the supplied street photo.
// Cones and chained temporary bollards are deliberately omitted.
function entranceGates(p) {
  const red = material("#a54f44"),
    white = M.wall,
    black = M.dark;
  const shape = new THREE.Shape(
    [
      [189.5, -37],
      [192, -35],
      [213, -35],
      [213, -31],
      [191, -31],
      [189.5, -32.8],
    ].map(([x, z]) => new THREE.Vector2(x, -z)),
  );
  const islandGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: false,
  });
  islandGeo.rotateX(-Math.PI / 2);
  p.add(new THREE.Mesh(islandGeo, M.soffit));
  function curb(points) {
    let k = 0;
    for (let i = 1; i < points.length; i++) {
      const a = new THREE.Vector3(points[i - 1][0], 0.14, points[i - 1][1]),
        b = new THREE.Vector3(points[i][0], 0.14, points[i][1]),
        n = Math.ceil(a.distanceTo(b) / 1.2);
      for (let j = 0; j < n; j++)
        beam(
          p,
          a
            .clone()
            .lerp(b, j / n)
            .toArray(),
          a
            .clone()
            .lerp(b, (j + 1) / n)
            .toArray(),
          0.23,
          k++ % 2 ? white : red,
        );
    }
  }
  curb([
    [181.3, -44],
    [181.3, -36],
    [180.4, -33],
    [179.8, -31.3],
  ]);
  curb([
    [189.4, -37],
    [189.4, -34],
    [191, -31],
    [213, -31],
  ]);
  // Low right-hand island stays beside the driveway and rounds towards the court.
  box(p, 189.6, 0.11, -34.6, 1.3, 0.22, 4.5, red);
  for (const z of [-36.85, -32.35]) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.22, 20),
      white,
    );
    cap.position.set(189.6, 0.11, z);
    p.add(cap);
  }
  for (const z of [-36.3, -34.7, -33.1])
    box(p, 189.6, 0.12, z, 1.32, 0.24, 0.7, white);
  for (const [x, z, dir] of [
    [181.3, -38, 1],
    [189.3, -34.8, -1],
  ]) {
    box(p, x, 0.68, z, 0.52, 1.3, 0.55, black);
    box(p, x, 1.27, z, 0.55, 0.23, 0.58, red);
    const len = 3.35;
    box(p, x + (dir * len) / 2, 1.07, z, len, 0.12, 0.13, white);
    for (let k = 0; k < 4; k++)
      box(
        p,
        x + dir * (0.35 + k * 0.8),
        1.07,
        z + 0.025,
        0.35,
        0.15,
        0.17,
        red,
      );
  }
  for (const z of [-37, -34]) {
    box(p, 185, 0.65, z, 0.08, 1.3, 0.08, white);
    box(p, 185, 1.34, z, 0.24, 0.3, 0.2, black);
  }
}

function connectedFlatAnnex(p, detail) {
  const room = en17FlatParts.find((s) => s.id === "diagonal");
  const localCutX = -room.w / 2 + 0.15;
  const cutX = room.x + localCutX * Math.cos(room.rotation),
    cutZ = room.z - localCutX * Math.sin(room.rotation);
  const doorCut = [[rectangle(cutX, cutZ, 0.8, 2.35, room.rotation)]];
  function wallLayer(polygons, height, baseY = 0) {
    for (const polygon of polygons) {
      const shape = new THREE.Shape(
        polygon[0].map(([x, z]) => new THREE.Vector2(x, -z)),
      );
      for (const ring of polygon.slice(1))
        shape.holes.push(
          new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))),
        );
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
      });
      g.rotateX(-Math.PI / 2);
      g.translate(0, baseY, 0);
      const mesh = new THREE.Mesh(g, M.wall);
      mesh.castShadow = mesh.receiveShadow = true;
      p.add(mesh);
    }
  }
  const geometry = clip.union(
    ...en17FlatParts.map((s) => [[rectangle(s.x, s.z, s.w, s.d, s.rotation)]]),
  );
  for (const polygon of geometry) {
    const shape = new THREE.Shape(
      polygon[0].map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    for (const ring of polygon.slice(1))
      shape.holes.push(
        new THREE.Path(ring.map(([x, z]) => new THREE.Vector2(x, -z))),
      );
    wallLayer(clip.difference([polygon], doorCut), 2.7);
    wallLayer([polygon], 1.8, 2.7);
    const roof = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: false,
    });
    roof.rotateX(-Math.PI / 2);
    roof.translate(0, 4.5, 0);
    const slab = new THREE.Mesh(roof, M.flatRoof);
    slab.castShadow = slab.receiveShadow = true;
    p.add(slab);
    if (detail)
      for (const ring of polygon)
        for (let i = 1; i < ring.length; i++) {
          const a = ring[i - 1],
            b = ring[i];
          // Parapets only follow the exterior union boundary, never an internal join.
          beam(p, [a[0], 4.78, a[1]], [b[0], 4.78, b[1]], 0.16, M.wall);
        }
  }
  diagonalDoor(p, room, detail);
  if (!detail) return;
  // Low windows seen on the south end of the eastern wing, facing the forecourt.
  // The diagonal doorway below is explicitly positioned by the user.
  for (const x of [214.8, 218, 221.2]) {
    box(p, x, 2, -49.94, 2.65, 1.35, 0.09, M.glass);
    box(p, x, 2, -49.87, 0.065, 1.35, 0.04, M.trim);
  }
}

function diagonalDoor(p, room, detail) {
  const g = new THREE.Group();
  g.position.set(room.x, 0, room.z);
  g.rotation.y = room.rotation;
  p.add(g);
  const face = -room.w / 2;
  // Recessed double-leaf door on the west/south-facing wall selected by the user.
  box(g, face + 0.51, 1.35, 0, 0.08, 2.5, 2.12, M.dark);
  if (!detail) return;
  for (const z of [-1.17, 1.17])
    box(g, face - 0.03, 1.37, z, 0.12, 2.74, 0.11, M.trim);
  box(g, face - 0.03, 2.73, 0, 0.12, 0.12, 2.45, M.trim);
  box(g, face - 0.05, 0.07, 0, 0.52, 0.14, 2.5, M.soffit);
  box(g, face + 0.44, 1.35, 0, 0.07, 2.5, 0.055, M.trim);
  for (const z of [-0.54, 0.54]) {
    box(g, face + 0.45, 1.65, z, 0.055, 1.6, 0.91, M.glass);
    box(g, face + 0.4, 1.05, z > 0 ? 0.13 : -0.13, 0.07, 0.33, 0.035, M.trim);
  }
}
