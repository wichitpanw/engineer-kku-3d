import * as THREE from "three";
import { createEntrance } from "./entrance.js";
const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra });
const M = {
  white: mat("#e8e6db"),
  cream: mat("#d6d1c3"),
  pink: mat("#bd9391"),
  tile: mat("#bda49a"),
  terrazzo: mat("#bda57e"),
  skirting: mat("#b8bfba"),
  dark: mat("#35444a", { metalness: 0.4, roughness: 0.42 }),
  glass: mat("#789ba7", {
    metalness: 0.7,
    roughness: 0.17,
    envMapIntensity: 1.65,
  }),
  glassDark: mat("#365864", {
    metalness: 0.65,
    roughness: 0.22,
    envMapIntensity: 1.2,
  }),
  steel: mat("#61463d", { metalness: 0.5, roughness: 0.5 }),
  roof: mat("#a79b82", { metalness: 0.2, roughness: 0.76 }),
  concrete: mat("#aaa99e"),
  paving: mat("#b4b1a0"),
  grass: mat("#7e915d"),
  leaf: mat("#476446"),
  leafLight: mat("#6f8452"),
  trunk: mat("#86775b"),
  inside: mat("#a8b5ae"),
  rail: mat("#929c97", { metalness: 0.65, roughness: 0.32 }),
  ac: mat("#d3d6c9"),
  sign: mat("#eceadd"),
};
function mesh(g, material, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(p, x, y, z, w, h, d, m) {
  return mesh(new THREE.BoxGeometry(w, h, d), m, p, x, y, z);
}
function cyl(p, x, y, z, r, h, m, segments = 36) {
  return mesh(new THREE.CylinderGeometry(r, r, h, segments), m, p, x, y, z);
}
function beam(p, a, b, r, m = M.steel) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    dir = bv.clone().sub(av);
  const o = mesh(new THREE.CylinderGeometry(r, r, dir.length(), 6), m, p);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return o;
}
function polygon(p, points, h, y, m) {
  const s = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return mesh(g, m, p, 0, y, 0);
}
function ring(p, x, y, z, r, t, m) {
  const o = mesh(new THREE.TorusGeometry(r, t, 6, 64), m, p, x, y, z);
  o.rotation.x = Math.PI / 2;
  return o;
}
function windowPane(
  p,
  x,
  y,
  z,
  w,
  h,
  orientation = "front",
  material = M.glassDark,
) {
  const wmesh = box(
    p,
    x,
    y,
    z,
    orientation === "side" ? 0.1 : w,
    h,
    orientation === "side" ? w : 0.1,
    material,
  );
  if (orientation === "side") {
    box(p, x + 0.06, y, z, 0.04, h, 0.06, M.dark);
    box(p, x + 0.06, y, z, 0.04, 0.06, w, M.dark);
  } else {
    box(p, x, y, z + 0.065, 0.06, h, 0.04, M.dark);
    box(p, x, y, z + 0.065, w, 0.06, 0.04, M.dark);
  }
  return wmesh;
}
// Reduce draw calls while keeping every storey independently selectable and sliceable.
export function batch(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    groups = new Map(),
    old = [];
  root.traverse((o) => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    const a = groups.get(o.material) || [];
    a.push(g);
    groups.set(o.material, a);
    old.push(o);
  });
  old.forEach((o) => o.removeFromParent());
  for (const [material, geos] of groups) {
    const count = geos.reduce((s, g) => s + g.attributes.position.count, 0),
      positions = new Float32Array(count * 3),
      normals = new Float32Array(count * 3),
      uvs = new Float32Array(count * 2),
      hasAmbient = geos.some((g) => g.attributes.aCampusAmbient),
      ambient = hasAmbient ? new Float32Array(count).fill(1) : null;
    let offset = 0;
    for (const g of geos) {
      positions.set(g.attributes.position.array, offset * 3);
      if (ambient && g.attributes.aCampusAmbient)
        ambient.set(g.attributes.aCampusAmbient.array, offset);
      if (g.attributes.normal)
        normals.set(g.attributes.normal.array, offset * 3);
      if (g.attributes.uv) uvs.set(g.attributes.uv.array, offset * 2);
      offset += g.attributes.position.count;
      g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    if (ambient)
      g.setAttribute("aCampusAmbient", new THREE.BufferAttribute(ambient, 1));
    g.computeBoundingSphere();
    mesh(g, material, root);
  }
}
const levels = [0, 4.5, 8.5, 12.2, 15.8, 19.4, 23, 26.6, 30.2, 33.8];
function cylinderFacade(parent, cx, cz, bottom, height, radius) {
  cyl(parent, cx, bottom + height / 2, cz, radius, height, M.glass, 64);
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    box(
      parent,
      cx + Math.cos(a) * (radius + 0.055),
      bottom + height / 2,
      cz + Math.sin(a) * (radius + 0.055),
      0.085,
      height,
      0.085,
      M.dark,
    );
  }
  const rows = Math.max(1, Math.round(height / 1.8));
  for (let k = 0; k <= rows; k++)
    ring(
      parent,
      cx,
      bottom + (k * height) / rows,
      cz,
      radius + 0.06,
      0.045,
      M.dark,
    );
}
function balcony(p, y) {
  const points = [
    [32.6, -4.6],
    [32.6, 4.6],
  ];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI / 2 - (i / 24) * Math.PI;
    points.push([32.6 + Math.cos(a) * 2.5, Math.sin(a) * 4.6]);
  }
  polygon(p, points, 0.25, y, M.white);
  for (let i = 0; i < 25; i++) {
    const a = -Math.PI / 2 + (i / 24) * Math.PI,
      b = -Math.PI / 2 + ((i + 1) / 24) * Math.PI;
    const aa = [32.6 + Math.cos(a) * 2.5, y + 0.52, Math.sin(a) * 4.6],
      bb = [32.6 + Math.cos(b) * 2.5, y + 0.52, Math.sin(b) * 4.6];
    const av = new THREE.Vector3(...aa),
      bv = new THREE.Vector3(...bb),
      d = bv.clone().sub(av);
    const slab = box(p, 0, 0, 0, d.length() + 0.03, 0.85, 0.18, M.white);
    slab.position.copy(av).add(bv).multiplyScalar(0.5);
    slab.rotation.y = -Math.atan2(d.z, d.x);
  }
}
function staircase(p, y, h) {
  const x = 20,
    z = -14.4,
    run = 5.6,
    half = h / 2;
  box(p, x, y + h / 2, z, 2.8, h, 2.1, M.inside);
  for (let f = 0; f < 2; f++) {
    const zz = z - 2.2 - f * 2.1;
    for (let s = 0; s < 12; s++) {
      const xx =
        f === 0
          ? x - 2.7 + ((s + 0.5) * run) / 12
          : x + 2.9 - ((s + 0.5) * run) / 12;
      box(
        p,
        xx,
        y + f * half + ((s + 1) * half) / 12 - 0.09,
        zz,
        run / 12 + 0.02,
        0.18,
        1.8,
        M.concrete,
      );
    }
    const a =
      f === 0
        ? [x - 2.9, y + 1.0, zz - 0.98]
        : [x + 2.9, y + half + 1, zz - 0.98];
    const b =
      f === 0
        ? [x + 2.9, y + half + 1, zz - 0.98]
        : [x - 2.9, y + h + 1, zz - 0.98];
    const mid = new THREE.Vector3(...a)
        .add(new THREE.Vector3(...b))
        .multiplyScalar(0.5),
      d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const parapet = box(p, mid.x, mid.y, mid.z, d.length(), 0.8, 0.19, M.white);
    parapet.rotation.z = Math.atan2(d.y, d.x);
    beam(
      p,
      [a[0], a[1] + 0.48, a[2]],
      [b[0], b[1] + 0.48, b[2]],
      0.035,
      M.steel,
    );
  }
  box(p, x + 3.3, y + half - 0.1, z - 3.2, 1.8, 0.2, 4.5, M.white);
  box(p, x - 3.3, y + h - 0.1, z - 3.2, 1.8, 0.2, 4.5, M.white);
}
function frontGrid(p, y, h, side) {
  const z = side * 11.65;
  for (let bay = 0; bay < 8; bay++) {
    const x = -7.5 + bay * 5.05;
    box(p, x, y + h / 2, z, 0.55, h, 2.7, M.white);
    windowPane(
      p,
      x + 2.52,
      y + 1.75,
      side * 8.9,
      4.25,
      2.45,
      "front",
      M.glassDark,
    );
    box(p, x + 2.52, y + 0.22, side * 10.2, 4.5, 0.26, 3.4, M.cream);
    box(p, x + 2.52, y + h - 0.22, side * 10.2, 4.5, 0.32, 3.4, M.white);
    for (let k = 0; k < 3; k++)
      box(
        p,
        x + 2.5,
        y + 0.92 + k * 0.13,
        z + side * 0.15,
        4.45,
        0.035,
        0.035,
        M.rail,
      );
    if ((bay + Math.round(y)) % 3 === 0) {
      box(p, x + 3.6, y + 0.72, side * 9.6, 0.85, 0.58, 0.44, M.ac);
      box(p, x + 3.6, y + 0.72, side * 9.86, 0.55, 0.4, 0.025, M.dark);
    }
  }
  box(p, 32.8, y + h / 2, z, 0.55, h, 2.7, M.white);
}
function roofGable(p, x, z, w, d, eave, ridge, m) {
  const v = [
    x - w / 2,
    eave,
    z - d / 2,
    x + w / 2,
    eave,
    z - d / 2,
    x + w / 2,
    ridge,
    z,
    x - w / 2,
    ridge,
    z,
    x - w / 2,
    ridge,
    z,
    x + w / 2,
    ridge,
    z,
    x + w / 2,
    eave,
    z + d / 2,
    x - w / 2,
    eave,
    z + d / 2,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.setIndex([0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6]);
  g.computeVertexNormals();
  const r = mesh(g, m, p);
  r.material.side = THREE.DoubleSide;
  for (let i = 0; i <= Math.round(w / 0.65); i++) {
    const xx = x - w / 2 + (i * w) / Math.round(w / 0.65);
    beam(p, [xx, eave + 0.03, z - d / 2], [xx, ridge + 0.03, z], 0.045, m);
    beam(p, [xx, ridge + 0.03, z], [xx, eave + 0.03, z + d / 2], 0.045, m);
  }
  return r;
}
function bridge(p) {
  const a = new THREE.Vector3(-15, 0, 14),
    b = new THREE.Vector3(-8, 0, 28),
    dir = b.clone().sub(a),
    len = dir.length(),
    ang = -Math.atan2(dir.z, dir.x),
    g = new THREE.Group();
  g.position.copy(a).add(b).multiplyScalar(0.5);
  g.rotation.y = ang;
  p.add(g);
  for (const deck of [4.5, 8.5]) box(g, 0, deck, 0, len, 0.3, 4.7, M.concrete);
  box(g, 0, 12.2, 0, len + 1, 0.18, 5.7, M.roof);
  for (const side of [-1, 1]) {
    for (const height of [4.65, 8.65, 12.05])
      box(g, 0, height, side * 2.2, len, 0.22, 0.22, M.steel);
    for (let i = 0; i < 4; i++) {
      const x = -len / 2 + (i * len) / 3;
      box(g, x, 8.25, side * 2.2, 0.19, 7.8, 0.19, M.steel);
      if (i < 3) {
        for (const [bottom, top] of [
          [4.7, 8.35],
          [8.7, 12.05],
        ]) {
          beam(
            g,
            [x, bottom, side * 2.2],
            [x + len / 3, top, side * 2.2],
            0.11,
          );
          beam(
            g,
            [x, top, side * 2.2],
            [x + len / 3, bottom, side * 2.2],
            0.11,
          );
        }
      }
    }
    for (const deck of [4.5, 8.5])
      for (let i = 0; i < 4; i++)
        box(
          g,
          0,
          deck + 0.45 + i * 0.22,
          side * 2.25,
          len,
          0.045,
          0.045,
          M.rail,
        );
  }
  for (const xx of [-len / 2, len / 2])
    for (const zz of [-2, 2]) box(g, xx, 2.6, zz, 0.28, 5.2, 0.28, M.steel);
}
export function palm(p, x, z, h, seed = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  p.add(g);
  const trunk = mesh(
    new THREE.CylinderGeometry(0.14, 0.29, h, 9),
    M.trunk,
    g,
    0.25,
    h / 2,
    0,
  );
  trunk.rotation.z = -0.035;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + seed,
      dx = Math.cos(a),
      dz = Math.sin(a),
      points = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12,
        r = t * 3.9;
      points.push(
        new THREE.Vector3(
          dx * r,
          h + Math.sin(t * Math.PI) * 1.4 - t * 1.6,
          dz * r,
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(curve, 12, 0.045, 4, false), M.leaf, g);
    for (let k = 2; k < 12; k++) {
      const t = k / 12,
        center = curve.getPoint(t),
        width = (1 - t) * 1.1;
      for (const side of [-1, 1]) {
        const end = center
          .clone()
          .add(new THREE.Vector3(-dz * width * side, -0.42, dx * width * side));
        beam(
          g,
          center.toArray(),
          end.toArray(),
          0.045,
          i % 2 ? M.leaf : M.leafLight,
        );
      }
    }
  }
  return g;
}
// The pink podium stands on tall piers. Ground-level public bays are open;
// the first-floor office facade is recessed behind that outer colonnade.
function podiumStorey(p, storey, y, h) {
  const piers = [];
  for (const x of [-7, 1, 9, 17, 25, 33.1]) piers.push([x, 16.8]);
  for (const x of [-29, -17, -5, 7, 19, 31]) piers.push([x, -10]);
  for (const z of [-10, 3.4]) piers.push([33.1, z]);
  for (const z of [-9, 0.5, 9]) piers.push([-32.5, z]);
  for (const [x, z] of piers) {
    const west = x < -30;
    box(p, x, y + h / 2, z, 1.25, h, 1.25, west ? M.white : M.tile);
    if (!west) box(p, x, y + 0.35, z, 1.27, 0.055, 1.27, M.pink);
  }
  if (storey === 0) {
    // Limited service cores leave a genuine north–south sightline through the hall.
    box(p, -22, 2.1, -6.6, 10, 4.2, 5.4, M.white);
    box(p, 24.5, 2.1, -6.6, 7, 4.2, 5.4, M.white);
    box(p, -12.5, 2.1, -5.7, 4.2, 4.2, 4.2, M.cream);
    windowPane(p, -12.5, 1.35, -3.54, 1.35, 2.5, "front", M.rail);
    box(p, 1, 0.16, 4.3, 64, 0.18, 23.5, M.concrete);
    // Permanent terrazzo grid visible in the public hall photographs.
    for (let x = -30; x <= 31; x += 4)
      box(p, x, 0.259, 4.3, 0.42, 0.012, 23.5, M.terrazzo);
    for (let z = -6; z <= 15; z += 4)
      box(p, 1, 0.26, z, 64, 0.012, 0.42, M.terrazzo);
    for (const x of [-23, -7, 9, 25])
      for (const z of [-3, 7]) {
        box(p, x, 2.35, z, 0.85, 4.2, 0.85, M.white);
        box(p, x, 1.0, z, 0.88, 1.5, 0.88, M.skirting);
      }
    // Side rails frame the west portals; the entrance axis itself stays open.
    for (const z of [-8, -3, 2, 7]) {
      box(p, -32.1, 0.65, z, 0.055, 1.15, 0.055, M.rail);
      for (const height of [0.35, 0.65, 0.95])
        box(p, -32.1, height, z + 2.25, 0.035, 0.035, 4.5, M.rail);
    }
    // Shared seating belongs in the open hall rather than behind a glass wall.
    for (const x of [0, 7, 14, 21])
      for (const z of [5.5, 11]) {
        box(p, x, 0.83, z, 2.5, 0.11, 1.0, M.steel);
        for (const dx of [-0.9, 0.9])
          box(p, x + dx, 0.45, z, 0.07, 0.8, 0.7, M.rail);
        for (const dz of [-0.95, 0.95]) {
          box(p, x, 0.48, z + dz, 2.5, 0.09, 0.38, M.steel);
          for (const dx of [-0.9, 0.9])
            box(p, x + dx, 0.27, z + dz, 0.07, 0.45, 0.3, M.rail);
        }
      }
  } else {
    // The mezzanine stops well short of the tall outer piers.
    box(p, 12, y + 0.12, -0.7, 41, 0.24, 22.6, M.white);
    box(p, -25.2, y + 0.12, -0.5, 15.6, 0.24, 22.8, M.white);
    box(p, 10.4, y + h / 2, -1, 36.2, h - 0.25, 22, M.white);
    box(p, -25.2, y + h / 2, -0.8, 14.8, h - 0.25, 21.4, M.white);
    for (let x = -4.8; x < 27; x += 5.25)
      windowPane(p, x, y + 2.05, 10.05, 4.65, 2.1, "front");
    windowPane(p, -25.2, y + 2.1, 9.96, 13, 0.65);
    for (const z of [-6.4, -0.2, 6.0])
      windowPane(p, -32.66, y + 2.1, z, 5.5, 0.65, "side");
    for (const z of [-6, 0, 6])
      windowPane(p, 28.57, y + 2.05, z, 5.4, 2.1, "side");
    // Continuous ceiling above the two-storey void, with shallow structural beams.
    box(p, 12.75, y + h - 0.18, 2.7, 42.7, 0.36, 29.3, M.white);
    box(p, -25, y + h - 0.18, 0, 16, 0.36, 24, M.white);
    for (const x of [-5, 3, 11, 19, 27, 33]) {
      box(p, x, y + h - 0.47, 5.5, 0.45, 0.55, 22.5, M.cream);
      for (const z of [7, 13])
        box(p, x + 2, y + h - 0.39, z, 1.15, 0.055, 0.24, M.ac);
    }
    box(p, 11, y + 0.62, 10.25, 37.5, 1.0, 0.18, M.white);
    box(p, 28.72, y + 0.62, 0, 0.18, 1.0, 15.6, M.white);
  }
}
export function createPienvichit(scene) {
  const root = new THREE.Group();
  root.position.set(0, 0.12, -19);
  root.rotation.y = -0.025;
  scene.add(root);
  const floorGroups = [];
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Group();
    p.userData.floor = i + 1;
    root.add(p);
    floorGroups.push(p);
    const y = levels[i],
      h = levels[i + 1] - y;
    if (i === 0) box(p, 0, 0.08, 0, 66, 0.16, 24, M.concrete);
    else if (i !== 1) box(p, 0, y + 0.15, 0, 66, 0.3, 24, M.white);
    cyl(p, -15, y + 0.14, 12.2, 4.65, 0.28, M.cream);
    if (i < 2) {
      podiumStorey(p, i, y, h);
    } else if (i === 2) {
      box(p, 12.75, y + h / 2, 16.9, 40.5, h, 0.65, M.tile);
      box(p, -26.5, y + h / 2, 11.2, 13, h, 0.6, M.white);
      windowPane(p, -26.5, y + 2.0, 11.55, 12, 0.6);
      box(p, 32.8, y + h / 2, 2.8, 0.7, h, 29, M.tile);
      box(p, -32.8, y + h / 2, -6, 0.7, h, 11, M.white);
      windowPane(p, -33.2, y + 2.0, -6, 10, 0.6, "side");
      box(p, 0, y + h / 2, -11.5, 66, h, 0.5, M.tile);
      for (let x = -29; x <= 30; x += 6.55) {
        if (x > -7.5) windowPane(p, x, y + 1.8, 17.25, 2.65, 2.05);
        windowPane(p, x, y + 1.8, -11.8, 2.65, 2.05);
      }
      for (const z of [-7, 0, 8])
        windowPane(p, 33.2, y + 1.8, z, 2.65, 2.05, "side");
    } else {
      box(p, -23.7, y + h / 2, 11.2, 18.6, h, 0.5, M.white);
      box(p, -23.7, y + h / 2, -11.2, 18.6, h, 0.5, M.white);
      box(p, -32.8, y + h / 2, 0, 0.5, h, 22.8, M.white);
      box(p, -23.7, y + h / 2, 0, 18.6, h, 0.22, M.inside);
      windowPane(p, -23.4, y + 2.15, 11.47, 17.2, 0.62);
      windowPane(p, -23.4, y + 2.15, -11.47, 17.2, 0.65);
      windowPane(p, -33.06, y + 2.15, 0, 17.6, 0.62, "side");
      box(p, -33.13, y + h / 2, -6, 0.12, h, 10.5, M.pink);
      frontGrid(p, y, h, 1);
      frontGrid(p, y, h, -1);
      box(p, 32.6, y + h / 2, 0, 0.8, h, 22.9, M.white);
      box(p, 33.05, y + h / 2, -11.35, 0.18, h, 0.3, M.pink);
      for (const z of [-6.8, 6.8])
        windowPane(p, 33.11, y + 1.9, z, 3.2, 2.25, "side");
      for (const z of [-10.6, 10.6])
        windowPane(p, 33.11, y + 1.9, z, 0.85, 2.25, "side");
      windowPane(p, 33.1, y + 1.9, 0, 8, 2.3, "side");
      balcony(p, y);
      box(p, 0, y + 0.18, 0, 66, 0.16, 2.6, M.cream);
    }
    cylinderFacade(p, -15, 12.2, y, h, 4.55);
    staircase(p, y, h);
    batch(p);
  }
  const roof = new THREE.Group();
  root.add(roof);
  box(roof, 0, 34.0, 0, 67, 0.4, 24.8, M.white);
  box(roof, -23.5, 35.4, 0, 18.9, 2.8, 24, M.white);
  box(roof, -23.5, 36.9, 0, 19.5, 0.23, 24.5, M.white);
  windowPane(roof, -23.5, 36.25, 12.05, 17.9, 0.35);
  roofGable(roof, 18.5, 0, 31.5, 26, 35, 36.25, M.roof);
  for (const z of [-12.4, 12.4])
    box(roof, 17.8, 34.9, z, 33.8, 0.9, 0.22, M.white);
  cyl(roof, -15, 35.15, 12.2, 4.6, 3.3, M.pink, 64);
  ring(roof, -15, 36.8, 12.2, 4.65, 0.15, M.cream);
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2,
      b = ((k + 1) / 10) * Math.PI * 2;
    beam(
      roof,
      [-15 + Math.cos(a) * 4.7, 36.8, 12.2 + Math.sin(a) * 4.7],
      [-15 + Math.cos(a) * 5.8, 39.4, 12.2 + Math.sin(a) * 5.8],
      0.12,
    );
    beam(
      roof,
      [-15 + Math.cos(a) * 5.8, 39.4, 12.2 + Math.sin(a) * 5.8],
      [-15 + Math.cos(b) * 5.8, 39.4, 12.2 + Math.sin(b) * 5.8],
      0.14,
    );
    beam(
      roof,
      [-15 + Math.cos(a) * 4.8, 37.2, 12.2 + Math.sin(a) * 4.8],
      [-15 + Math.cos(b) * 4.8, 37.2, 12.2 + Math.sin(b) * 4.8],
      0.04,
      M.rail,
    );
  }
  for (let k = 0; k < 4; k++) {
    box(roof, -6 + k * 2.5, 34.8, -4, 1.5, 1.4, 2.3, M.ac);
    box(roof, -6 + k * 2.5, 35.55, -4, 1.2, 0.1, 1.5, M.dark);
  }
  for (let k = 0; k < 3; k++)
    beam(
      roof,
      [-15 + k * 1.5, 37, 12],
      [-15 + k * 1.5, 39.2, 12],
      0.035,
      M.rail,
    );
  batch(roof);
  const site = new THREE.Group();
  root.add(site);
  bridge(site);
  cyl(site, -8, 0.14, 29, 5.8, 0.28, M.white);
  for (const height of [3.4, 6.8]) {
    cyl(site, -8, height, 29, 5.8, 0.24, M.white);
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * Math.PI * 2,
        b = ((k + 1) / 64) * Math.PI * 2;
      const aa = new THREE.Vector3(
        -8 + Math.cos(a) * 5.65,
        height + 0.48,
        29 + Math.sin(a) * 5.65,
      );
      const bb = new THREE.Vector3(
        -8 + Math.cos(b) * 5.65,
        height + 0.48,
        29 + Math.sin(b) * 5.65,
      );
      const d = bb.clone().sub(aa);
      const panel = box(site, 0, 0, 0, d.length() + 0.02, 0.8, 0.22, M.white);
      panel.position.copy(aa).add(bb).multiplyScalar(0.5);
      panel.rotation.y = -Math.atan2(d.z, d.x);
    }
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    box(
      site,
      -8 + Math.cos(a) * 5.2,
      3.4,
      29 + Math.sin(a) * 5.2,
      0.85,
      6.8,
      0.85,
      M.white,
    );
  }
  cyl(site, -8, 3.4, 29, 0.6, 6.8, M.cream);
  for (let k = 0; k < 48; k++) {
    const a = (k / 24) * Math.PI * 2;
    const tread = box(
      site,
      -8 + Math.cos(a) * 2.2,
      0.3 + k * 0.135,
      29 + Math.sin(a) * 2.2,
      3.1,
      0.13,
      0.48,
      M.cream,
    );
    tread.rotation.y = -a;
  }
  cylinderFacade(site, -8, 29, 6.8, 9.4, 5.8);
  cyl(site, -8, 16.4, 29, 6.05, 0.4, M.white);
  cyl(site, -8, 16.63, 29, 5.65, 0.13, M.roof);
  const lower = new THREE.Group();
  // Fitted between the tower podium (piers at z 16.8) and EN14's east block: the
  // satellite shows the hall touching both, so it is scaled to a 24 m square.
  lower.position.set(7, 0, 37);
  lower.scale.set(24 / 27, 1, 24 / 27);
  lower.rotation.y = Math.PI / 4;
  site.add(lower);
  box(lower, 0, 4, 0, 27, 8, 27, M.white);
  for (const s of [-1, 1])
    for (let x = -10; x <= 10; x += 4.2)
      windowPane(lower, x, 4.5, s * 13.55, 3.4, 4.8);
  const geo = new THREE.BufferGeometry(),
    verts = [
      -15, 9, -15, 15, 9, -15, 0, 16, 0, 15, 9, -15, 15, 9, 15, 0, 16, 0, 15, 9,
      15, -15, 9, 15, 0, 16, 0, -15, 9, 15, -15, 9, -15, 0, 16, 0,
    ];
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  mesh(geo, M.roof, lower);
  for (const [x, z] of [
    [-15, -15],
    [15, -15],
    [15, 15],
    [-15, 15],
  ])
    beam(lower, [x, 9.07, z], [0, 16.06, 0], 0.07, M.cream);
  batch(site);
  const landscape = new THREE.Group();
  root.add(landscape);
  for (const [x, z, h] of [
    [-17, 40, 8],
    [-20, 43, 9],
    [28, 24, 10],
    [39, 12, 7],
    [38, -6, 8],
    [-36, 5, 7],
    [-27, 39, 8],
    [20, 57, 7],
  ])
    palm(landscape, x, z, h, x);
  batch(landscape);
  const entrance = createEntrance(root);
  batch(entrance.group);
  const slice = new THREE.Mesh(
    new THREE.BoxGeometry(67, 0.08, 25),
    new THREE.MeshBasicMaterial({
      color: "#d4ed8b",
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    }),
  );
  slice.visible = false;
  root.add(slice);
  return {
    root,
    floorGroups,
    roof,
    site,
    landscape,
    levels,
    slice,
    entrance,
    groundHeight(x, z) {
      const local = root.worldToLocal(new THREE.Vector3(x, 0, z));
      return root.position.y + entrance.heightAt(local.x, local.z);
    },
    setFloor(n) {
      floorGroups.forEach((g, i) => (g.visible = !n || i < n));
      roof.visible = !n;
      slice.visible = !!n;
      if (n) slice.position.y = levels[n] + 0.05;
    },
    worldPoint(x, y, z) {
      return root.localToWorld(new THREE.Vector3(x, y, z));
    },
    materials: M,
  };
}
export function createContext(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const m = mat("#bfc6b5", { transparent: true, opacity: 0.82 });
  const g = new THREE.Group();
  g.position.set(3, 0, -81);
  g.rotation.y = 0.53;
  root.add(g);
  box(g, 0, 8, 0, 49, 16, 27, m);
  roofGable(g, 0, 0, 51, 30, 17, 21, M.cream);
  for (const side of [-1, 1])
    for (let i = -2; i < 3; i++) {
      const x = i * 9;
      beam(
        g,
        [x - 5, 2, side * 13.9],
        [x + 5, 17, side * 13.9],
        0.55,
        M.concrete,
      );
      beam(
        g,
        [x + 5, 2, side * 13.9],
        [x - 5, 17, side * 13.9],
        0.55,
        M.concrete,
      );
    }
  const red = mat("#b37565");
  for (const [x, z, w, d, r] of [
    [23, 56, 43, 15, 0.05],
    [-11, 49, 34, 15, -0.7],
    [66, -9, 36, 30, 0],
    [-74, -26, 39, 18, 0],
    [-73, 21, 37, 13, 0],
  ]) {
    const b = new THREE.Group();
    b.position.set(x, 0, z);
    b.rotation.y = r;
    root.add(b);
    box(b, 0, 3.2, 0, w, 6.4, d, M.cream);
    roofGable(b, 0, 0, w + 1, d + 1, 6.7, 8.7, red);
  }
  batch(root);
  return root;
}
export function createEnvironment(renderer) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d"),
    gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#6a9cbd");
  gradient.addColorStop(0.48, "#d3e2e8");
  gradient.addColorStop(0.52, "#c9d6cc");
  gradient.addColorStop(1, "#758472");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 30; i++) {
    const x = (i * 173) % 1024,
      y = 80 + ((i * 47) % 130);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 100);
    g.addColorStop(0, "rgba(255,255,250,.5)");
    g.addColorStop(1, "rgba(255,255,250,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 100, y - 100, 200, 200);
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer),
    env = pmrem.fromEquirectangular(t).texture;
  t.dispose();
  pmrem.dispose();
  return env;
}
