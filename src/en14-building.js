import { bakeAmbientDetail, addContactShadow } from "./ambient-detail.js";
import * as THREE from "three";
import { en14Parts, en14Garden } from "./en14-layout.js";
import { palm } from "./model.js";
const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra });
const M = {
  white: mat("#e7e5d9"),
  wall: mat("#d8d8ca"),
  tile: mat("#897366"),
  roof: mat("#b78071"),
  labRoof: mat("#9c9c8b"),
  fascia: mat("#c29689"),
  glass: mat("#466467", { metalness: 0.35, roughness: 0.32 }),
  frame: mat("#747b70"),
  shadow: mat("#525a51"),
  gold: mat("#baa16c"),
  barrier: mat("#8c4646"),
  pave: mat("#b7ad98"),
  steel: mat("#81928d"),
  grass: mat("#8c9e6d"),
  leaf: mat("#617e4c"),
  yellow: mat("#c9bc66"),
  flower: mat("#bc9970"),
  rock: mat("#aaa392"),
};
for (const [name, m] of Object.entries(M)) m.name = `en14-${name}`;
function mesh(p, g, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}
function box(p, x, y, z, w, h, d, m = M.white) {
  const structural =
    [M.white, M.wall, M.tile, M.pave].includes(m) && w * h * d > 0.45;
  const subdivisions = (value) =>
    structural ? Math.min(20, Math.max(1, Math.ceil(value / 2))) : 1;
  const o = mesh(
    p,
    new THREE.BoxGeometry(
      w,
      h,
      d,
      subdivisions(w),
      subdivisions(h),
      subdivisions(d),
    ),
    m,
    x,
    y,
    z,
  );
  o.userData.ambientStructure = structural;
  return o;
}
function beam(p, a, b, r = 0.04, m = M.white) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    v = bv.clone().sub(av);
  const o = mesh(p, new THREE.CylinderGeometry(r, r, v.length(), 5), m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return o;
}
function text(p, t, x, y, z, w, h, color = "#544d3d") {
  const c = document.createElement("canvas");
  c.width = 1536;
  c.height = 192;
  const a = c.getContext("2d");
  a.fillStyle = color;
  a.font = '600 88px "IBM Plex Sans Thai",sans-serif';
  a.textAlign = "center";
  a.textBaseline = "middle";
  a.fillText(t, 768, 100, 1490);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return mesh(
    p,
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: tx,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    x,
    y,
    z,
  );
}
// Solid diagonal bars retain the diamond pattern at oblique viewing angles.
function lattice(p, x, y, z, w, h) {
  for (const slope of [-1, 1])
    for (let c = -h / 2 - w / 2; c <= h / 2 + w / 2; c += 0.52) {
      const points = [];
      for (const xx of [-w / 2, w / 2]) {
        const yy = slope * xx + c;
        if (yy >= -h / 2 && yy <= h / 2) points.push([xx, yy]);
      }
      for (const yy of [-h / 2, h / 2]) {
        const xx = (yy - c) / slope;
        if (xx >= -w / 2 && xx <= w / 2) points.push([xx, yy]);
      }
      if (points.length >= 2)
        beam(
          p,
          [x + points[0][0], y + points[0][1], z],
          [x + points[1][0], y + points[1][1], z],
          0.022,
        );
    }
  box(p, x, y - h / 2, z, w, 0.1, 0.12);
  box(p, x, y + h / 2, z, w, 0.1, 0.12);
}
function window(p, x, y, z, w = 2, h = 1.7) {
  box(p, x, y, z, w, h, 0.1, M.glass);
  box(p, x, y, z + 0.07, 0.06, h, 0.04, M.frame);
  box(p, x, y, z + 0.07, w, 0.06, 0.04, M.frame);
}
// Each little gable spans a bay along X, with the ridge running across the depth.
function gables(p, w, d, eave, count, detail = true, rise = 1.65) {
  const bay = w / count;
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + bay * (i + 0.5),
      a = bay / 2 + 0.13;
    const s = new THREE.Shape();
    s.moveTo(-a, 0);
    s.lineTo(0, rise);
    s.lineTo(a, 0);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: d + 0.8,
      bevelEnabled: false,
    });
    mesh(p, geo, M.roof, x, eave, -d / 2 - 0.4);
    for (const z of [-d / 2 - 0.42, d / 2 + 0.42]) {
      mesh(p, new THREE.ShapeGeometry(s), M.white, x, eave, z).material.side =
        THREE.DoubleSide;
      beam(p, [x - a, eave, z], [x, eave + rise, z], 0.105, M.fascia);
      beam(p, [x, eave + rise, z], [x + a, eave, z], 0.105, M.fascia);
    }
    if (detail)
      for (let q = -d / 2; q <= d / 2; q += 1.3) {
        beam(
          p,
          [x - a, eave + 0.035, q],
          [x, eave + rise + 0.035, q],
          0.023,
          M.fascia,
        );
        beam(
          p,
          [x, eave + rise + 0.035, q],
          [x + a, eave + 0.035, q],
          0.023,
          M.fascia,
        );
      }
  }
}
function wing(root, s, detail) {
  const p = new THREE.Group();
  p.position.set(s.x, 0, s.z);
  p.rotation.y = s.rotation;
  root.add(p);
  const w = s.w,
    d = s.d,
    n = 9,
    bay = w / n;
  // Recessed classrooms leave an open balcony facing the forecourt.
  box(p, 0, 5.4, -0.8, w, 10.2, d - 3.8, M.wall);
  for (let level = 0; level < 3; level++) {
    const y = 0.25 + level * 3.5;
    box(p, 0, y, 0, w + 0.3, 0.23, d + 0.35);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + bay * (i + 0.5);
      box(p, x, y + 1.7, d / 2 - 1.65, bay - 0.3, 3.25, 0.18, M.tile);
      window(p, x, y + 1.75, d / 2 - 1.52, bay - 1.15, 1.8);
      window(
        p,
        x,
        level === 0 ? y + 2.55 : y + 1.85,
        level === 0 ? -d / 2 - 0.035 : -(d - 3.8) / 2 - 0.86,
        bay - 1.2,
        level === 0 ? 0.65 : 1.7,
      );
      if (detail && level > 0) {
        lattice(p, x, y + 0.65, d / 2 + 0.12, bay - 0.23, 1.05);
        for (let q = 0; q <= 8; q++)
          box(
            p,
            x - bay / 2 + (q * bay) / 8,
            y + 0.6,
            -d / 2 - 0.08,
            0.035,
            1.05,
            0.035,
            M.frame,
          );
        box(p, x, y + 1.15, -d / 2 - 0.08, bay, 0.045, 0.045, M.frame);
      }
    }
  }
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + i * bay;
    box(p, x, 5.5, d / 2, 0.24, 10.8, 0.3);
    box(p, x, 5.5, -d / 2, 0.22, 10.8, 0.22);
  }
  box(p, 0, 10.85, 0, w + 0.7, 0.25, d + 0.75);
  gables(p, w, d, 11.1, n, detail);
  if (detail) box(p, w * 0.23, 1.2, -d / 2 - 0.06, 1.25, 2.3, 0.12, M.shadow);
  if (detail) {
    for (let k = 0; k < 4; k++)
      box(
        p,
        0,
        0.13 + k * 0.11,
        d / 2 + 0.45 + (3 - k) * 0.22,
        w * 0.8,
        0.18,
        0.32,
        M.tile,
      );
  }
}
function tower(root, s, detail) {
  const p = new THREE.Group();
  p.position.set(s.x, 0, s.z);
  root.add(p);
  box(p, 0, 8.25, 0, s.w, 10.5, s.d, M.tile);
  box(p, 0, 1.5, -s.d / 2 + 0.12, s.w, 3, 0.24, M.tile);
  box(p, -s.w / 2 + 0.2, 7, s.d / 2, 0.4, 14, 0.45);
  box(p, s.w / 2 - 0.2, 7, s.d / 2, 0.4, 14, 0.45);
  box(p, 0, 3.1, s.d / 2, s.w, 0.45, 0.5);
  box(p, 0, 1.6, s.d / 2 + 0.03, s.w - 0.9, 2.8, 0.18, M.glass);
  for (let x = -3.5; x <= 3.5; x += 1.75)
    box(p, x, 1.6, s.d / 2 + 0.15, 0.07, 2.8, 0.08, M.white);
  if (detail) {
    lattice(p, 0, 8.1, s.d / 2 + 0.1, s.w - 0.85, 9.3);
    box(p, 0, 6.65, s.d / 2 + 0.21, 8.1, 0.95, 0.18, M.gold);
    text(p, "ภาควิชาวิศวกรรมเคมี", 0, 6.8, s.d / 2 + 0.32, 7.8, 0.65);
    text(
      p,
      "DEPT. OF CHEMICAL ENGINEERING",
      0,
      6.35,
      s.d / 2 + 0.32,
      7.7,
      0.26,
    );
    const crest = mesh(
      p,
      new THREE.CylinderGeometry(1.05, 1.05, 0.13, 48),
      M.gold,
      0,
      9,
      s.d / 2 + 0.27,
    );
    crest.rotation.x = Math.PI / 2;
    for (let k = 0; k < 24; k++) {
      const a = (k * Math.PI) / 12;
      const o = box(
        p,
        Math.sin(a) * 1.08,
        9 + Math.cos(a) * 1.08,
        s.d / 2 + 0.3,
        0.2,
        0.28,
        0.15,
        M.gold,
      );
      o.rotation.z = -a;
    }
    text(p, "มข.", 0, 9, s.d / 2 + 0.38, 1.35, 0.7, "#eee9d5");
  }
  gables(p, s.w, s.d, 12.75, 3, detail, 1.55);
  for (let k = 0; k < 5; k++)
    box(
      p,
      0,
      0.12 + k * 0.12,
      s.d / 2 + 0.4 + (4 - k) * 0.32,
      s.w + 0.8,
      0.2,
      0.45,
      M.tile,
    );
}
function lab(root, s, detail) {
  const p = new THREE.Group();
  p.position.set(s.x, 0, s.z);
  root.add(p);
  box(p, 0, 3, 0, s.w, 6, s.d, M.wall);
  box(p, 0, 1.15, s.d / 2 + 0.03, s.w, 2.3, 0.15, M.steel);
  box(p, 0, 1.4, s.d / 2 + 0.14, 6, 2.7, 0.12, M.shadow);
  box(p, 0, 1.3, s.d / 2 + 0.2, 4.6, 2.5, 0.1, M.glass);
  gables(p, s.w, s.d, 6.1, 3, detail, 1.4);
  p.traverse((o) => {
    if (o.isMesh && o.material === M.roof) o.material = M.labRoof;
  });
  if (detail) {
    text(p, "อาคารปฏิบัติการ", 0, 4.2, s.d / 2 + 0.14, 8, 0.8);
    for (let x of [-6, 6]) window(p, x, 1.7, s.d / 2 + 0.15, 2.7, 1.7);
  }
  // Shallow barrel canopy, open sides and steel supports.
  const canopy = new THREE.Group();
  canopy.position.set(0, 0, s.d / 2 + 3);
  p.add(canopy);
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 16,
      b = ((i + 1) * Math.PI) / 16;
    beam(
      canopy,
      [-8, 2.6 + Math.sin(a) * 0.8, Math.cos(a) * 2],
      [-8, 2.6 + Math.sin(b) * 0.8, Math.cos(b) * 2],
      0.04,
      M.steel,
    );
  }
  for (let q = -8; q <= 8; q += 4) {
    box(canopy, q, 1.3, -2, 0.1, 2.6, 0.1, M.steel);
    box(canopy, q, 1.3, 2, 0.1, 2.6, 0.1, M.steel);
  }
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) * Math.PI) / 12;
    const o = box(
      canopy,
      0,
      2.6 + Math.sin(a) * 0.8,
      Math.cos(a) * 2,
      17,
      0.08,
      0.55,
      M.white,
    );
    o.rotation.x = (a - Math.PI / 2) * 0.4;
  }
}
function office(root, s, detail) {
  box(root, s.x, 1.7, s.z, s.w, 3.4, s.d, M.tile);
  box(root, s.x, 3.55, s.z, s.w + 0.7, 0.24, s.d + 0.7, M.white);
  if (detail) {
    for (let x = s.x - 8; x <= s.x + 8; x += 3.2)
      window(root, x, 1.9, s.z - s.d / 2 - 0.07, 2.6, 1.8);
    for (let z = s.z - 5; z <= s.z + 4; z += 3)
      box(root, s.x + s.w / 2 + 0.06, 1.9, z, 0.1, 1.8, 2.3, M.glass);
  }
  if (detail)
    for (let z = s.z - 5; z <= s.z + 4; z += 3)
      box(root, s.x - s.w / 2 - 0.06, 1.9, z, 0.1, 1.8, 2.3, M.glass);
}
function shrub(p, x, z, r, m = M.leaf) {
  mesh(
    p,
    new THREE.IcosahedronGeometry(r, 2),
    m,
    x,
    r * 0.65 + 0.15,
    z,
  ).scale.y = 0.7;
}
function garden(root, detail) {
  const p = new THREE.Group();
  root.add(p);
  const { x, z } = en14Garden;
  const disk = mesh(
    p,
    new THREE.CylinderGeometry(8.4, 8.4, 0.16, 64),
    M.grass,
    x,
    0.28,
    z,
  );
  mesh(
    p,
    new THREE.TorusGeometry(8.4, 0.12, 5, 80),
    M.white,
    x,
    0.36,
    z,
  ).rotation.x = Math.PI / 2;
  // Open, toothed half gear. Extruded annular arc has no wall in the opening.
  const shape = new THREE.Shape(),
    outer = 4.1,
    inner = 3.05;
  shape.moveTo(outer, 0);
  for (let i = 0; i <= 96; i++) {
    const a = (i * Math.PI) / 96,
      r = outer + (i % 8 < 4 ? 0.52 : 0);
    shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.lineTo(-inner, 0);
  for (let i = 96; i >= 0; i--) {
    const a = (i * Math.PI) / 96;
    shape.lineTo(Math.cos(a) * inner, Math.sin(a) * inner);
  }
  shape.closePath();
  mesh(
    p,
    new THREE.ExtrudeGeometry(shape, { depth: 0.48, bevelEnabled: false }),
    M.white,
    x,
    0.4,
    z - 0.3,
  );
  if (detail) {
    const c = document.createElement("canvas");
    c.width = 1536;
    c.height = 768;
    const a = c.getContext("2d");
    a.font = '600 82px "IBM Plex Sans Thai",sans-serif';
    a.fillStyle = "#35413c";
    a.textAlign = "center";
    const letters = [
      ...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(
        "คณะวิศวกรรมศาสตร์",
      ),
    ].map((v) => v.segment);
    letters.forEach((l, i) => {
      const t = Math.PI * 0.87 - (i / (letters.length - 1)) * Math.PI * 0.74;
      a.save();
      a.translate(768 + Math.cos(t) * 620, 700 - Math.sin(t) * 620);
      a.rotate(Math.PI / 2 - t);
      a.fillText(l, 0, 0);
      a.restore();
    });
    const tx = new THREE.CanvasTexture(c);
    mesh(
      p,
      new THREE.PlaneGeometry(8.3, 4.15),
      new THREE.MeshStandardMaterial({
        map: tx,
        transparent: true,
        depthWrite: false,
      }),
      x,
      2.45,
      z + 0.2,
    );
    for (let i = 0; i < 60; i++) {
      const a = (i * Math.PI * 2) / 60;
      shrub(
        p,
        x + Math.cos(a) * 7.7,
        z + Math.sin(a) * 7.7,
        0.36,
        i % 3 ? M.yellow : M.flower,
      );
    }
    for (const [dx, dz, r] of [
      [-4, 2, 1.5],
      [4, 2, 1.3],
      [-3, -3, 1],
      [3, -3, 1],
    ])
      shrub(p, x + dx, z + dz, r);
    mesh(
      p,
      new THREE.IcosahedronGeometry(1, 1),
      M.rock,
      x - 3,
      0.65,
      z + 3,
    ).scale.set(1.6, 0.6, 1);
  }
}
export function createEN14(root, detail) {
  for (const s of en14Parts) {
    if (["west", "east"].includes(s.id)) wing(root, s, detail);
    else if (s.id === "tower") tower(root, s, detail);
    else if (s.id === "lab") lab(root, s, detail);
    else office(root, s, detail);
  }
  if (detail) bakeAmbientDetail(root);
  garden(root, detail);
  if (detail) {
    addContactShadow(root, 1, 63.7, 13, 3, 0.075);
    addContactShadow(root, 24, 29, 22, 2, 0.08);
    for (const [dx, dz, r] of [
      [-4, 2, 1.5],
      [4, 2, 1.3],
      [-3, -3, 1],
      [3, -3, 1],
    ])
      addContactShadow(
        root,
        en14Garden.x + dx,
        en14Garden.z + dz,
        r * 2.7,
        r * 2.2,
        0.375,
      );
  }
  if (detail) {
    // A single permanent boom gate at the right-hand driveway (photo supplied).
    box(root, 35.4, 0.65, 87, 0.5, 1.3, 0.5, M.barrier);
    box(root, 32.6, 1.12, 87, 5.35, 0.12, 0.14, M.white);
    for (let x = 30.4; x < 35.1; x += 1.3)
      box(root, x, 1.12, 87.078, 0.48, 0.12, 0.02, M.barrier);
    box(root, 29.85, 0.58, 87, 0.1, 1.16, 0.1, M.white);
  }
  if (detail) {
    for (const [x, z, h] of [
      [-20, 13, 5],
      [-9, 23, 5.8],
      [-6, 32, 5.5],
    ])
      palm(root, x, z, h, x * 0.17);
  }
}
