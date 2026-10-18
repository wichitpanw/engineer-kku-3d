import * as THREE from "three";
import { buildings } from "./campus-data.js";
import clip from "../vendor/polygon-clipping/index.js";
import {
  makeSiteLayout,
  auditSite,
  rectangle,
  stroke,
  area,
} from "./site-layout.js";
const material = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.96, ...extra });
const M = {
  ground: material("#9aaa7e"),
  grass: material("#91a573"),
  grass2: material("#82986a"),
  soil: material("#817563"),
  path: material("#b5b1a1"),
  paving: material("#c5c1b1"),
  asphalt: material("#737b7b"),
  edge: material("#d1cfc2"),
  red: material("#ab6155"),
  white: material("#e1dfcf"),
  yellow: material("#dfbc6a"),
  metal: material("#727e7c", { metalness: 0.5, roughness: 0.5 }),
  dark: material("#465650"),
  roof: material("#969e94", { metalness: 0.25, roughness: 0.8 }),
  trunk: material("#80725c"),
  leaves: [
    material("#46654a"),
    material("#55744b"),
    material("#638052"),
    material("#73895b"),
  ],
  stone: material("#c2beac"),
  glass: material("#354e59", { metalness: 0.45, roughness: 0.25 }),
  car: [
    material("#d5d8cc"),
    material("#59717b"),
    material("#b2b7b3"),
    material("#7e877f"),
  ],
  rubber: material("#39413d"),
};
let seed = 20261018;
function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
function mesh(p, g, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  p.add(o);
  return o;
}
function box(p, x, y, z, w, h, d, m) {
  return mesh(p, new THREE.BoxGeometry(w, h, d), m, x, y, z);
}
function cylinder(p, x, y, z, r, h, m, n = 10) {
  return mesh(p, new THREE.CylinderGeometry(r * 0.8, r, h, n), m, x, y, z);
}
function beam(p, a, b, r, m = M.metal) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    d = bv.clone().sub(av),
    o = mesh(p, new THREE.CylinderGeometry(r, r, d.length(), 6), m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return o;
}
function strip(p, a, b, width, height, y, m) {
  const av = new THREE.Vector3(a[0], y, a[1]),
    bv = new THREE.Vector3(b[0], y, b[1]),
    d = bv.clone().sub(av),
    o = box(p, 0, 0, 0, width, height, d.length(), m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.rotation.y = Math.atan2(d.x, d.z);
  return o;
}
function batch(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(),
    groups = new Map(),
    old = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    if (!groups.has(o.material)) groups.set(o.material, []);
    groups.get(o.material).push(g);
    old.push(o);
  });
  old.forEach((o) => o.removeFromParent());
  for (const [m, parts] of groups) {
    const count = parts.reduce((n, g) => n + g.attributes.position.count, 0),
      pos = new Float32Array(count * 3),
      normal = new Float32Array(count * 3);
    let k = 0;
    for (const g of parts) {
      pos.set(g.attributes.position.array, k * 3);
      if (g.attributes.normal) normal.set(g.attributes.normal.array, k * 3);
      k += g.attributes.position.count;
      g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
    g.computeBoundingSphere();
    mesh(root, g, m);
  }
}
function road(p, points, width = 8, markings = true, curbs = true) {
  const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    ),
    length = curve.getLength(),
    count = Math.ceil(length / 1.1),
    centers = curve.getSpacedPoints(count),
    edges = [];
  for (let i = 0; i <= count; i++) {
    const t = curve.getTangent(i / count),
      side = new THREE.Vector3(-t.z, 0, t.x);
    edges.push({ center: centers[i], side, t });
  }
  const vertices = [];
  for (let i = 0; i < count; i++) {
    for (const [j, s] of [
      [i, -1],
      [i, 1],
      [i + 1, 1],
      [i, -1],
      [i + 1, 1],
      [i + 1, -1],
    ]) {
      const q = edges[j].center
        .clone()
        .addScaledVector(edges[j].side, (width / 2) * s);
      vertices.push(q.x, 0.02, q.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.computeVertexNormals();
  const asphalt = mesh(p, g, M.asphalt);
  asphalt.material.side = THREE.DoubleSide;
  for (let i = 0; i < count; i++) {
    const a = edges[i],
      b = edges[i + 1];
    if (markings) {
      strip(
        p,
        [a.center.x, a.center.z],
        [b.center.x, b.center.z],
        0.1,
        0.012,
        0.035,
        M.yellow,
      );
      for (const side of [-1, 1]) {
        const av = a.center
            .clone()
            .addScaledVector(a.side, side * (width / 2 - 0.4)),
          bv = b.center
            .clone()
            .addScaledVector(b.side, side * (width / 2 - 0.4));
        strip(p, [av.x, av.z], [bv.x, bv.z], 0.08, 0.012, 0.036, M.white);
      }
    }
    if (curbs)
      for (const side of [-1, 1]) {
        const av = a.center
            .clone()
            .addScaledVector(a.side, side * (width / 2 + 0.12)),
          bv = b.center
            .clone()
            .addScaledVector(b.side, side * (width / 2 + 0.12));
        strip(
          p,
          [av.x, av.z],
          [bv.x, bv.z],
          0.25,
          0.22,
          0.1,
          i % 2 ? M.white : M.red,
        );
      }
  }
  return curve;
}
function path(p, points, width = 2.3, y = 0.13, m = M.path) {
  for (let i = 0; i < points.length - 1; i++)
    strip(p, points[i], points[i + 1], width, 0.15, y, m);
}
function coveredWalk(p, points, width = 2.7) {
  const curve = new THREE.CatmullRomCurve3(
      points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    ),
    len = curve.getLength(),
    n = Math.ceil(len / 2),
    samples = curve.getSpacedPoints(n);
  for (let i = 0; i < n; i++) {
    const a = samples[i],
      b = samples[i + 1],
      t = curve.getTangent(i / n),
      s = new THREE.Vector3(-t.z, 0, t.x);
    strip(p, [a.x, a.z], [b.x, b.z], width, 0.15, 0.16, M.path);
    strip(p, [a.x, a.z], [b.x, b.z], width + 0.35, 0.12, 3.15, M.roof);
    for (const side of [-1, 1]) {
      const aa = a.clone().addScaledVector(s, side * (width / 2 - 0.1)),
        bb = b.clone().addScaledVector(s, side * (width / 2 - 0.1));
      beam(p, [aa.x, 2.95, aa.z], [bb.x, 2.95, bb.z], 0.06);
    }
    if (i % 3 === 0) {
      for (const side of [-1, 1]) {
        const q = a.clone().addScaledVector(s, side * (width / 2 - 0.15));
        box(p, q.x, 1.5, q.z, 0.1, 3, 0.1, M.metal);
        box(p, q.x, 0.25, q.z, 0.35, 0.35, 0.35, M.edge);
      }
    }
    for (let k = 0; k < 3; k++) {
      const u = ((k - 0.8) * width) / 3,
        aa = a.clone().addScaledVector(s, u),
        bb = b.clone().addScaledVector(s, u);
      beam(p, [aa.x, 3.23, aa.z], [bb.x, 3.23, bb.z], 0.018, M.edge);
    }
  }
}
function tree(p, x, z, h = 8) {
  const r = 2.3 + random() * 1.2;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  p.add(g);
  cylinder(g, 0, h * 0.28, 0, 0.22, h * 0.56, M.trunk, 8);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    beam(
      g,
      [0, h * 0.34, 0],
      [Math.cos(a) * r * 0.55, h * 0.67, Math.sin(a) * r * 0.55],
      0.09,
      M.trunk,
    );
  }
  for (let k = 0; k < 9; k++) {
    const a = k * 2.39996,
      rr = k === 0 ? 0 : r * (0.4 + random() * 0.35),
      o = mesh(
        g,
        new THREE.IcosahedronGeometry(r * (0.5 + random() * 0.24), 2),
        M.leaves[k % 4],
        Math.cos(a) * rr,
        h * 0.71 + (random() - 0.35) * r,
        Math.sin(a) * rr,
      );
    o.scale.set(1, 0.7 + random() * 0.4, 1);
  }
  cylinder(g, 0, 0.04, 0, 0.9, 0.07, M.soil, 20);
}
// Woodland beside CB: tall visible trunks, branching above head height and an
// irregular high canopy. Keep the ornamental round-tree model elsewhere.
function woodlandTree(p, x, z, h) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  p.add(g);
  const lean = (random() - 0.5) * 0.7;
  beam(g, [0, 0, 0], [lean, h * 0.76, 0.2], 0.16 + random() * 0.1, M.trunk);
  for (let k = 0; k < 5; k++) {
    const a = k * 2.39996,
      r = 2.3 + random() * 1.2;
    const end = [
      lean + Math.cos(a) * r,
      h * (0.77 + random() * 0.16),
      Math.sin(a) * r,
    ];
    beam(g, [lean, h * 0.56, 0.1], end, 0.065, M.trunk);
    const crown = mesh(
      g,
      new THREE.IcosahedronGeometry(1.8 + random() * 0.85, 1),
      M.leaves[k % 4],
      ...end,
    );
    crown.scale.set(1.25, 0.65, 1.15);
  }
}
function hedge(p, a, b, h = 0.75) {
  const av = new THREE.Vector3(a[0], 0, a[1]),
    bv = new THREE.Vector3(b[0], 0, b[1]),
    n = Math.ceil(av.distanceTo(bv) / 1.1);
  for (let i = 0; i <= n; i++) {
    const q = av.clone().lerp(bv, i / n);
    box(p, q.x, h / 2, q.z, 0.9, h, 0.95, M.leaves[(i % 2) + 1]);
    const o = mesh(
      p,
      new THREE.IcosahedronGeometry(0.62, 1),
      M.leaves[2],
      q.x,
      h,
      q.z,
    );
    o.scale.y = 0.38;
  }
}
function car(p, x, z, color, angle = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.03, z);
  g.rotation.y = angle;
  p.add(g);
  box(g, 0, 0.65, 0, 1.8, 0.7, 4.15, M.car[color % 4]);
  box(g, 0, 1.13, -0.2, 1.63, 0.58, 2.1, M.glass);
  box(g, 0, 1.45, -0.22, 1.54, 0.1, 1.87, M.car[color % 4]);
  box(g, 0, 0.73, 2.09, 1.4, 0.14, 0.03, M.white);
  box(g, 0, 0.76, -2.09, 1.4, 0.13, 0.03, M.red);
  for (const xx of [-0.91, 0.91])
    for (const zz of [-1.25, 1.25]) {
      const w = mesh(
        g,
        new THREE.CylinderGeometry(0.33, 0.33, 0.2, 12),
        M.rubber,
        xx,
        0.37,
        zz,
      );
      w.rotation.z = Math.PI / 2;
    }
}
function parking(p, cx, cz, w, d, details) {
  box(p, cx, 0.005, cz, w, 0.05, d, M.asphalt);
  for (let x = cx - w / 2 + 1; x < cx + w / 2; x += 2.8) {
    box(p, x, 0.04, cz - d / 2 + 3.1, 0.06, 0.01, 5, M.white);
    box(p, x, 0.04, cz + d / 2 - 3.1, 0.06, 0.01, 5, M.white);
  }
  for (let i = 0; i < Math.floor(w / 2.8) - 1; i++) {
    if (i % 3 !== 0)
      car(
        details,
        cx - w / 2 + 2.4 + i * 2.8,
        cz + (i % 2 ? 1 : -1) * (d / 2 - 3),
        i,
        i % 2 ? Math.PI : 0,
      );
  }
}
function lamp(p, x, z, angle = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = angle;
  p.add(g);
  cylinder(g, 0, 3.8, 0, 0.065, 7.6, M.metal);
  beam(g, [0, 7.5, 0], [1.2, 7.8, 0], 0.055);
  box(g, 1.25, 7.77, 0, 0.65, 0.14, 0.28, M.edge);
  box(g, 0, 0.2, 0, 0.3, 0.4, 0.3, M.edge);
}
function picnicTable(p, x, z) {
  box(p, x, 0.78, z, 1.8, 0.11, 1.3, M.stone);
  for (const dx of [-0.62, 0.62])
    box(p, x + dx, 0.4, z, 0.16, 0.74, 0.82, M.stone);
  for (const dz of [-1.05, 1.05]) {
    box(p, x, 0.45, z + dz, 1.8, 0.1, 0.4, M.stone);
    for (const dx of [-0.6, 0.6])
      box(p, x + dx, 0.23, z + dz, 0.16, 0.44, 0.28, M.stone);
  }
}
function flag(p, x, z, yellow = false) {
  cylinder(p, x, 1.6, z, 0.025, 3.2, M.metal, 6);
  if (yellow) {
    box(p, x, 2.7, z + 0.45, 0.025, 0.62, 0.85, M.yellow);
    return;
  }
  const colors = [M.red, M.white, material("#374d78"), M.white, M.red],
    sizes = [0.1, 0.1, 0.2, 0.1, 0.1];
  let y = 3.02;
  colors.forEach((m, i) => {
    box(p, x, y - sizes[i] / 2, z + 0.45, 0.025, sizes[i], 0.85, m);
    y -= sizes[i];
  });
}
// All shared surfaces are built from one planar layout. No independent paving boxes
// can cover a road, and the exact rendered lane union is used by the overlap audit.
export function createTerrain(scene) {
  const root = new THREE.Group(),
    details = new THREE.Group();
  scene.add(root, details);
  const layout = makeSiteLayout(),
    audit = auditSite(layout);
  if (audit.conflicts.length)
    console.error("Campus layout conflicts", audit.conflicts);
  box(root, 20, -0.65, -20, 640, 1.2, 470, M.ground);
  function surface(geometry, y, material, parent = root) {
    for (const polygon of geometry) {
      const shape = new THREE.Shape(
        polygon[0].map(([x, z]) => new THREE.Vector2(x, -z)),
      );
      for (const hole of polygon.slice(1))
        shape.holes.push(
          new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))),
        );
      const g = new THREE.ShapeGeometry(shape);
      g.rotateX(-Math.PI / 2);
      mesh(parent, g, material, 0, y, 0);
    }
  }
  // Paving is deliberately below the asphalt and geometrically excludes lanes.
  for (const p of layout.paving) surface(p.geometry, 0, M.paving);
  surface(layout.vehicleSurface, 0.035, M.asphalt);
  const pavedLanes = layout.roads.filter((r) => r.surface === "pavers");
  for (const r of pavedLanes) surface(r.geometry, 0.043, M.paving);
  for (const d of layout.driveways)
    if (d.surface === "pavers") surface(d.pavingGeometry, 0.044, M.paving);
  for (const r of pavedLanes)
    for (let x = 20; x < 120; x += 4) {
      const joints = clip.intersection(
        stroke(
          [
            [x, -40],
            [x + 25, -15],
          ],
          0.055,
        ),
        r.geometry,
      );
      surface(joints, 0.05, M.edge);
    }
  for (const p of layout.parking)
    surface(p.geometry, 0.04, p.surface === "pavers" ? M.paving : M.asphalt);
  for (const p of layout.walks) surface(p.geometry, 0.12, M.path);
  const drivingAndParking = clip.union(
    layout.vehicleSurface,
    ...layout.parking.map((p) => p.geometry),
  );
  // A shared outer boundary eliminates kerbs running across T junctions/driveways.
  for (const polygon of drivingAndParking)
    for (const ring of polygon) {
      let distance = 0;
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1],
          b = ring[i],
          len = Math.hypot(b[0] - a[0], b[1] - a[1]),
          n = Math.max(1, Math.ceil(len / 1.4));
        for (let j = 0; j < n; j++) {
          const u = j / n,
            v = (j + 1) / n,
            aa = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u],
            bb = [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v];
          const middle = [(aa[0] + bb[0]) / 2, (aa[1] + bb[1]) / 2],
            probe = [rectangle(...middle, 0.5, 0.5)];
          const inOpenCourt = layout.paving.some(
            (p) =>
              ["east-courtyard", "en17-entrance-court"].includes(p.id) &&
              area(clip.intersection(probe, p.geometry)) > 0.01,
          );
          if (inOpenCourt) {
            distance += len / n;
            continue; // Painted bays on a continuous court, not raised parking islands.
          }
          const plain = [...layout.parking, ...pavedLanes].some(
            (p) => area(clip.intersection(probe, p.geometry)) > 0.01,
          );
          strip(
            root,
            aa,
            bb,
            0.2,
            0.18,
            0.12,
            plain ? M.edge : Math.floor(distance / 1.4) % 2 ? M.white : M.red,
          );
          distance += len / n;
        }
      }
    }
  // Markings stop at intersections rather than being drawn through crossing lanes.
  for (const r of layout.roads) {
    if (r.width < 5 || r.surface === "pavers") continue;
    const others = layout.roads
      .filter((o) => o.id !== r.id)
      .map((o) => o.geometry);
    let marking = clip.difference(
      stroke(r.points, 0.095),
      ...others,
      ...layout.driveways.map((d) => d.geometry),
    );
    if (r.id === "inner-loop")
      marking = clip.difference(marking, [rectangle(184, 33.5, 0.3, 92)]);
    surface(clip.intersection(marking, layout.roadSurface), 0.051, M.yellow);
  }
  // Front of EN04/EN11 is a continuous apron beside the lane. Dashed yellow
  // centre paint and dashed white frontage replace the previous concrete fingers.
  for (let z = -12; z < 79; z += 5.2)
    surface(
      clip.intersection(
        [rectangle(184, z + 1.1, 0.095, 2.2)],
        layout.roadSurface,
      ),
      0.052,
      M.yellow,
    );
  surface(
    clip.intersection(
      stroke(
        [
          [181.05, -12],
          [181.05, 79],
        ],
        0.09,
      ),
      layout.roadSurface,
    ),
    0.053,
    M.white,
  );
  for (const [a, b] of [
    [-12, -8],
    [45, 79],
  ])
    surface(
      clip.intersection(
        stroke(
          [
            [186.95, a],
            [186.95, b],
          ],
          0.09,
        ),
        layout.roadSurface,
      ),
      0.053,
      M.white,
    );
  for (let z = -8; z < 45; z += 3.1)
    surface(
      clip.intersection(
        [rectangle(186.95, z + 0.65, 0.09, 1.3)],
        layout.roadSurface,
      ),
      0.053,
      M.white,
    );
  function contains(point, geometry) {
    let inside = false;
    for (const polygon of geometry) {
      let included = false;
      for (let k = 0; k < polygon.length; k++) {
        const ring = polygon[k];
        let hit = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const a = ring[i],
            b = ring[j];
          if (
            a[1] > point[1] !== b[1] > point[1] &&
            point[0] <
              ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
          )
            hit = !hit;
        }
        if (k === 0) included = hit;
        else if (hit) included = false;
      }
      inside ||= included;
    }
    return inside;
  }
  let vehicleCount = 0,
    vehicleConflicts = 0,
    canopyCount = 0;
  function motorcycle(parent, x, z, angle, index) {
    const g = new THREE.Group();
    g.position.set(x, 0.04, z);
    g.rotation.y = angle;
    parent.add(g);
    box(g, 0, 0.56, 0, 0.43, 0.2, 1.25, M.car[index % 4]);
    box(g, 0, 0.75, 0.15, 0.36, 0.12, 0.65, M.dark);
    for (const zz of [-0.6, 0.6]) {
      const wheel = mesh(
        g,
        new THREE.CylinderGeometry(0.22, 0.22, 0.1, 8),
        M.rubber,
        0,
        0.28,
        zz,
      );
      wheel.rotation.z = Math.PI / 2;
    }
    beam(g, [-0.28, 0.9, -0.55], [0.28, 0.9, -0.55], 0.025, M.metal);
  }
  for (const p of layout.parking) {
    for (const row of p.rows) {
      const dx = row.to[0] - row.from[0],
        dz = row.to[1] - row.from[1],
        len = Math.hypot(dx, dz),
        spacing = p.spacing || (p.kind === "car" ? 2.8 : 0.9),
        n = Math.floor(len / spacing);
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0,
          x = row.from[0] + dx * t,
          z = row.from[1] + dz * t,
          w = p.bayWidth || (p.kind === "car" ? 2.6 : 0.8),
          d = p.bayDepth || (p.kind === "car" ? 5 : 1.9),
          foot = [rectangle(x, z, w, d, row.angle)];
        if (area(clip.difference(foot, p.geometry)) > 0.005) continue;
        const painted = clip.intersection(
          stroke([...foot[0], foot[0][0]], 0.045),
          p.geometry,
        );
        surface(painted, 0.055, p.surface === "pavers" ? M.yellow : M.white);
        if (i % 4 === 0) continue;
        if (area(clip.intersection(foot, layout.roadSurface)) > 0.005) {
          vehicleConflicts++;
          continue;
        }
        if (p.kind === "car") car(details, x, z, i, row.angle);
        else motorcycle(details, x, z, row.angle, i);
        vehicleCount++;
      }
      if (p.covered && p.kind === "car") {
        const cx = (row.from[0] + row.to[0]) / 2,
          cz = (row.from[1] + row.to[1]) / 2,
          rotation = -Math.atan2(dz, dx),
          roof = [rectangle(cx, cz, len + 1, 5.8, rotation)];
        if (area(clip.intersection(roof, layout.roadSurface)) < 0.005) {
          const g = new THREE.Group();
          g.position.set(cx, 0, cz);
          g.rotation.y = rotation;
          details.add(g);
          box(g, 0, 3.05, 0, len + 1, 0.14, 5.8, M.roof);
          for (let x = -len / 2; x <= len / 2; x += 5)
            for (const z of [-2.5, 2.5])
              box(g, x, 1.5, z, 0.1, 3, 0.1, M.metal);
          canopyCount++;
        }
      }
    }
  }
  // Roofed pedestrian sections are sampled linearly, with explicit road/building
  // clearance. A blocked section remains an open sidewalk/crossing, never a roof
  // through an occupied footprint or across a traffic lane.
  for (const walk of layout.walks) {
    if (!walk.covered) continue;
    for (let i = 1; i < walk.points.length; i++) {
      const a = walk.points[i - 1],
        b = walk.points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz),
        n = Math.ceil(len / 3),
        rotation = -Math.atan2(dz, dx);
      for (let j = 0; j < n; j++) {
        const t = (j + 0.5) / n,
          x = a[0] + dx * t,
          z = a[1] + dz * t,
          foot = [rectangle(x, z, len / n + 0.04, walk.width + 0.25, rotation)];
        if (
          area(clip.intersection(foot, drivingAndParking)) > 0.005 ||
          area(clip.intersection(foot, layout.occupied)) > 0.005
        )
          continue;
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.rotation.y = rotation;
        details.add(g);
        box(g, 0, 3.15, 0, len / n + 0.04, 0.13, walk.width + 0.25, M.roof);
        for (const zz of [-walk.width / 2 + 0.1, walk.width / 2 - 0.1])
          box(g, -len / n / 2, 1.5, zz, 0.09, 3, 0.09, M.metal);
      }
    }
  }
  for (const r of layout.roundabouts) {
    cylinder(
      root,
      r.center[0],
      0.08,
      r.center[1],
      r.innerRadius - 0.1,
      0.14,
      M.grass2,
      48,
    );
    cylinder(details, r.center[0], 0.6, r.center[1], 2.2, 1, M.leaves[1], 16);
  }
  // The small landscaped circle is beside the lane, not a vehicle roundabout.
  cylinder(root, -9, 0.1, 73, 8.1, 0.18, M.grass2, 64);
  cylinder(root, -9, 0.25, 73, 2.2, 0.45, M.stone, 32);
  const gear = mesh(
    details,
    new THREE.TorusGeometry(1.4, 0.18, 6, 28),
    M.metal,
    -9,
    2,
    73,
  );
  gear.rotation.x = 0.2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2,
      t = box(
        details,
        -9 + Math.cos(a) * 1.6,
        2 + Math.sin(a) * 1.6,
        73,
        0.4,
        0.3,
        0.3,
        M.metal,
      );
    t.rotation.z = a;
  }
  // Planting is restricted to traced green courts/strips, and excludes all hard
  // surfaces plus a canopy clearance. This prevents trees growing through cars.
  const greenPolygons = [
    [
      [-242, -124],
      [-210, -170],
      [-90, -215],
      [-61, -184],
      [-77, -146],
      [-177, -109],
    ],
    [
      [-222, -40],
      [-168, -29],
      [-150, 79],
      [-69, 105],
      [-45, 126],
      [-111, 105],
      [-207, 21],
    ],
    [
      [-55, 82],
      [-19, 100],
      [180, 101],
      [180, 135],
      [-34, 121],
    ],
    [
      [87, 21],
      [169, 19],
      [173, 91],
      [49, 91],
      [49, 64],
      [90, 42],
    ],
    [
      [194, 4],
      [252, 4],
      [252, 40],
      [194, 40],
    ],
    [
      [172, -163],
      [274, -163],
      [274, -39],
      [232, -36],
      [232, -110],
      [173, -105],
    ],
    [
      [-41, -208],
      [149, -208],
      [149, -183],
      [-41, -183],
    ],
  ];
  const roadClearance = clip.union(
    ...layout.roads.map((r) => stroke(r.points, r.width + 8)),
    ...layout.driveways.map((d) => d.geometry),
  );
  const hard = clip.union(
    layout.occupied,
    drivingAndParking,
    ...layout.paving.map((p) => p.geometry),
    ...layout.walks.map((w) => w.geometry),
  );
  const green = clip.difference(
    clip.union(...greenPolygons.map((p) => [p])),
    hard,
    roadClearance,
  );
  for (let z = -204; z < 138; z += 11)
    for (let x = -235; x < 287; x += 12) {
      const xx = x + (random() - 0.5) * 4,
        zz = z + (random() - 0.5) * 4;
      const inCBWood = xx > 113 && xx < 164 && zz > -168 && zz < -101;
      if (!inCBWood && contains([xx, zz], green) && random() > 0.2)
        tree(details, xx, zz, 6 + random() * 4);
    }
  // Dense woodland west of CB, traced from the supplied aerial. Keep trunks
  // clear of roads, covered walks and building footprints; do not scatter across its court.
  const cbForest = clip.difference(
    [
      [
        [
          [116, -166],
          [159, -166],
          [162, -139],
          [163, -107],
          [146, -102],
          [115, -104],
        ],
      ],
    ],
    hard,
    roadClearance,
  );
  for (let z = -164; z < -101; z += 6.9)
    for (let x = 116; x < 162; x += 6.7) {
      const xx = x + (random() - 0.5) * 4.2,
        zz = z + (random() - 0.5) * 4.2;
      if (contains([xx, zz], cbForest))
        woodlandTree(details, xx, zz, 12 + random() * 7);
    }
  // Mature entrance trees shown in the EN17 south approach photo, off the lab
  // footprints and the covered walk. Small planting beds stay above the court.
  for (const [x, z, h] of [
    [177.5, -46, 12],
    [178.5, -39, 13],
    [195, -46.5, 14],
    [207, -46, 12],
  ]) {
    if (
      !contains([x, z], layout.occupied) &&
      !contains([x, z], drivingAndParking)
    ) {
      cylinder(details, x, 0.08, z, 1.2, 0.14, M.soil, 20);
      tree(details, x, z, h);
    }
  }
  hedge(details, [179.4, -33], [179.4, -35], 0.7);
  hedge(details, [179.4, -35], [180, -43], 0.7);
  // Planted island in front of the department sign, visible in the close entrance photo.
  box(details, 194, 0.065, -45, 15, 0.13, 4, M.soil);
  hedge(details, [187, -43.1], [201, -43.1], 0.55);
  // Lamps follow the verified public lanes and remain off their surfaces.
  for (const [x, z] of [
    [-61, -120],
    [-61, -71],
    [-61, -15],
    [-58, 29],
    [-39, 83],
    [18, 104],
    [70, 105],
    [130, 105],
  ])
    lamp(details, x, z);
  for (const z of [-19, 13]) {
    const crossing = clip.intersection(
      [
        [
          [-57, z - 1.6],
          [-49, z - 1.6],
          [-49, z + 1.6],
          [-57, z + 1.6],
        ],
      ],
      layout.roadSurface,
    );
    for (let x = -57; x < -49; x += 1.1)
      surface(
        clip.intersection([rectangle(x, z, 0.65, 3.2)], crossing),
        0.055,
        M.white,
      );
  }
  batch(root);
  batch(details);
  return {
    root,
    details,
    audit: { ...audit, vehicleCount, vehicleConflicts, canopyCount },
    layout,
    setDetails(show) {
      details.visible = show;
    },
  };
}
