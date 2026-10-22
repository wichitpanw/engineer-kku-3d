import * as THREE from "three";
import { en01Parts, en02Parts, civilSite } from "./civil-layout.js?v=handoff-4";
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra });
const M = {
  cream: mat("#e6dfcd"), white: mat("#efede6"), plinth: mat("#d9d6cc"), pink: mat("#e3cfc6"),
  whiteRoof: mat("#e4e1d8", { metalness: 0.15 }), greyRoof: mat("#a8a79f", { metalness: 0.2 }),
  slate: mat("#4b4d57"), darkRoof: mat("#5a5d62", { metalness: 0.2 }), aisleRoof: mat("#b9bcbc", { metalness: 0.2 }),
  glass: mat("#33403f", { metalness: 0.4, roughness: 0.3 }), frame: mat("#5d625f"),
  louvre: mat("#d6c39e"), eave: mat("#565b5c", { metalness: 0.3 }), steel: mat("#6f7a80", { metalness: 0.4 }),
  red: mat("#b45a3c", { metalness: 0.3 }), tank: mat("#e9e9e2"), concrete: mat("#bdbab0"),
};
for (const m of Object.values(M)) m.side = THREE.DoubleSide;
function box(g, x, y, z, w, h, d, m) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
function mesh(g, verts, faces, m) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(faces.flat().flatMap((i) => verts[i]), 3));
  geo.computeVertexNormals();
  const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
// Gable prism: ridge along z ("z") or x ("x"), eaves at y, closed gable ends.
function gable(g, cx, y, cz, w, d, rise, axis, m) {
  const [hw, hd] = [w / 2, d / 2];
  const v = axis === "z"
    ? [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd], [0, rise, -hd], [0, rise, hd]]
    : [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd], [-hw, rise, 0], [hw, rise, 0]];
  const f = axis === "z"
    ? [[0, 4, 1], [3, 2, 5], [0, 3, 5], [0, 5, 4], [1, 4, 5], [1, 5, 2]]
    : [[0, 4, 5], [0, 5, 1], [2, 5, 4], [2, 4, 3], [3, 4, 0], [1, 5, 2]];
  return mesh(g, v.map(([a, b, c]) => [cx + a, y + b, cz + c]), f, m);
}
// Hipped roof, ridge along the longer side.
function hip(g, cx, y, cz, w, d, rise, m) {
  const [hw, hd] = [w / 2, d / 2], r = Math.abs(hw - hd), alongX = w >= d;
  const v = [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd],
    alongX ? [-r, rise, 0] : [0, rise, -r], alongX ? [r, rise, 0] : [0, rise, r]];
  const f = alongX ? [[0, 4, 5], [0, 5, 1], [1, 5, 2], [2, 5, 4], [2, 4, 3], [3, 4, 0]]
    : [[0, 4, 1], [1, 4, 5], [1, 5, 2], [2, 5, 3], [3, 5, 4], [3, 4, 0]];
  return mesh(g, v.map(([a, b, c]) => [cx + a, y + b, cz + c]), f, m);
}
// Mono-pitch steel canopy on posts, falling towards `low` ("n", "s", "e", "w").
function canopy(g, x0, x1, z0, z1, h, low, roof = M.darkRoof, step = 4.2) {
  const fall = 0.45, [cx, cz, w, d] = [(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0];
  const slab = box(g, cx, h + fall / 2, cz, w + 0.4, 0.08, d + 0.4, roof);
  if (low === "n" || low === "s") slab.rotation.x = (low === "s" ? 1 : -1) * Math.atan2(fall, d);
  else slab.rotation.z = (low === "w" ? 1 : -1) * Math.atan2(fall, w);
  const along = low === "n" || low === "s" ? [x0, x1] : [z0, z1];
  const n = Math.max(1, Math.round((along[1] - along[0]) / step));
  for (let i = 0; i <= n; i++) {
    const t = along[0] + 0.2 + (i / n) * (along[1] - along[0] - 0.4);
    for (const s of [0.2, -0.2]) {
      const [px, pz] = low === "n" || low === "s" ? [t, s > 0 ? z0 + s : z1 + s] : [s > 0 ? x0 + s : x1 + s, t];
      box(g, px, h / 2 + 0.1, pz, 0.14, h + 0.2, 0.14, M.steel);
    }
  }
}
// Two-storey civil wing: open ground floor between piers, ribbon windows above,
// white metal roof of small N-S gables (striped on the satellite).
function wing(g, s, detail) {
  const [x0, x1, z0, z1] = [s.x - s.w / 2, s.x + s.w / 2, s.z - s.d / 2, s.z + s.d / 2];
  box(g, s.x, 0.12, s.z, s.w + 0.6, 0.24, s.d + 0.6, M.concrete);
  box(g, s.x, s.h / 2, s.z, s.w - 1.2, s.h, s.d - 1.2, M.cream);
  box(g, s.x, 3.6, s.z, s.w + 0.4, 0.3, s.d + 0.4, M.white);
  box(g, s.x, s.h - 0.25, s.z, s.w + 0.5, 0.5, s.d + 0.5, M.white);
  const bw = s.w / s.bays;
  for (let k = 0; k < s.bays; k++) gable(g, x0 + (k + 0.5) * bw, s.h, s.z, bw + 0.02, s.d + 1.2, 1.5, "z", M.whiteRoof);
  for (let x = x0 + 0.2; x <= x1; x += bw) for (const z of [z0 + 0.2, z1 - 0.2]) box(g, x, s.h / 2, z, 0.4, s.h, 0.4, M.white);
  for (const z of [z0 + 0.6, z1 - 0.6]) {
    box(g, s.x, 5.4, z + Math.sign(z - s.z) * 0.02, s.w - 1.6, 1.5, 0.06, M.glass);
    box(g, s.x, 1.7, z + Math.sign(z - s.z) * 0.02, s.w - 1.6, 2.2, 0.06, M.glass);
  }
  if (!detail) return;
  for (const z of [z0 + 0.6, z1 - 0.6]) {
    const out = z + Math.sign(z - s.z) * 0.08;
    for (let x = x0 + 1; x < x1 - 0.5; x += 1.45) box(g, x, 5.4, out, 0.06, 1.5, 0.06, M.frame);
    box(g, s.x, 6.25, out, s.w - 1.6, 0.18, 0.2, M.white);
  }
  for (const x of [x0 + 0.6, x1 - 0.6]) for (const y of [1.7, 5.4])
    for (let z = z0 + 2.5; z < z1 - 2; z += 3.4) box(g, x + Math.sign(x - s.x) * 0.02, y, z, 0.06, 1.3, 1.6, M.glass);
}
function link(g, s) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.cream);
  box(g, s.x, s.h + 0.1, s.z, s.w + 0.3, 0.2, s.d + 0.3, M.concrete);
  for (const z of [s.z - s.d / 2, s.z + s.d / 2]) box(g, s.x, 1.6, z, s.w - 2, 1.4, 0.08, M.glass);
}
function annex(g, s, detail) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.cream);
  box(g, s.x, s.h + 0.15, s.z, s.w + 0.6, 0.3, s.d + 0.6, M.slate);
  for (const z of [s.z - s.d / 2, s.z + s.d / 2]) box(g, s.x, 1.8, z, s.w - 2, 1.5, 0.08, M.glass);
  if (detail) for (const dx of [-4.5, -1.5]) box(g, s.x + dx, s.h + 0.33, s.z - 2.5, 2.2, 0.06, 1, M.white);
}
// Canteen: low pink-cream walls with long windows under a deep dark hipped roof.
function canteen(g, s, detail) {
  box(g, s.x, 0.6, s.z, s.w - 1, 1.2, s.d - 1, M.pink);
  box(g, s.x, s.h / 2 + 0.6, s.z, s.w - 1.6, s.h - 1.2, s.d - 1.6, M.glass);
  box(g, s.x, s.h - 0.3, s.z, s.w - 0.8, 0.6, s.d - 0.8, M.cream);
  hip(g, s.x, s.h, s.z, s.w + 1.6, s.d + 1.6, 3.4, M.slate);
  if (!detail) return;
  for (const z of [s.z - s.d / 2 + 0.5, s.z + s.d / 2 - 0.5])
    for (let x = s.x - s.w / 2 + 0.5; x <= s.x + s.w / 2; x += 2.35) box(g, x, s.h / 2, z, 0.3, s.h, 0.3, M.cream);
}
function aisle(g, s) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d - 0.6, M.cream);
  box(g, s.x, s.h + 0.2, s.z, s.w + 0.4, 0.12, s.d + 0.4, M.aisleRoof).rotation.z = -0.12;
}
function verandah(g, s, detail) {
  canopy(g, s.x - s.w / 2, s.x + s.w / 2, s.z - s.d / 2, s.z + s.d / 2, s.h, "s", M.slate, 4.6);
  // Skylight strips follow the canopy's fall to the south.
  if (detail) for (const x of [55, 61.5, 68, 74.5])
    box(g, x, s.h + 0.29, s.z, 1.1, 0.06, s.d + 0.3, M.white).rotation.x = Math.atan2(0.45, s.d);
}
function store(g, s) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.cream);
  gable(g, s.x, s.h, s.z, s.w + 0.6, s.d + 0.6, 1.1, "z", M.slate);
}
// EN02 lab hall: white plinth, glazing, beige louvre band and upper windows under a dark eave.
function hall(g, s, detail) {
  const [x0, x1, z0, z1] = [s.x - s.w / 2, s.x + s.w / 2, s.z - s.d / 2, s.z + s.d / 2];
  box(g, s.x, s.h / 2, s.z, s.w - 0.4, s.h, s.d - 0.4, M.cream);
  const faces = [["z", z0, s.w], ["z", z1, s.w], ["x", x0, s.d], ["x", x1, s.d]];
  for (const [axis, c, len] of faces) {
    const out = (c < (axis === "z" ? s.z : s.x) ? -1 : 1) * 0.04;
    const put = (y, h, t, m) => axis === "z"
      ? box(g, s.x, y, c + out, len - 0.6, h, t, m) : box(g, c + out, y, s.z, t, h, len - 0.6, m);
    put(0.55, 1.1, 0.1, M.plinth); put(1.85, 1.5, 0.08, M.glass); put(3.8, 2.4, 0.08, M.louvre);
    put(5.65, 1.3, 0.08, M.glass); put(6.75, 0.9, 0.16, M.eave);
    if (!detail) continue;
    for (let y = 2.75; y < 5; y += 0.3) put(y, 0.05, 0.14, M.white);
    for (let t = -len / 2 + 2; t < len / 2 - 1; t += 6)
      axis === "z" ? box(g, s.x + t, 3.6, c + out * 3, 0.3, 7.2, 0.3, M.steel) : box(g, c + out * 3, 3.6, s.z + t, 0.3, 7.2, 0.3, M.steel);
  }
  gable(g, s.x, s.h, s.z, s.w + 1.4, s.d + 1.6, s.rise, "x", M.greyRoof);
  // Raised ridge monitor with dark louvred sides.
  const [m0, m1] = s.monitor, mw = s.monitorWidth, ry = s.h + s.rise * (1 - mw / s.d);
  box(g, (m0 + m1) / 2, ry + 0.55, s.z, m1 - m0, 1.1 + s.rise * mw / s.d, mw - 0.3, M.eave);
  gable(g, (m0 + m1) / 2, s.h + s.rise + 0.8, s.z, m1 - m0 + 0.6, mw + 0.8, 0.5, "x", M.greyRoof);
  if (detail) {
    // Doors on the east gable (Street View): a grey roller door and a side door.
    box(g, x1 + 0.08, 1.6, -58, 0.1, 3.2, 3.6, M.steel);
    box(g, x1 + 0.08, 1.1, -50, 0.1, 2.2, 1.2, M.steel);
  }
}
function simple(g, s, roof) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d, s.kind === "shed" ? M.steel : M.cream);
  gable(g, s.x, s.h, s.z, s.w + 0.8, s.d + 0.8, 0.9, "x", roof);
  if (s.kind !== "shed") for (const z of [s.z - s.d / 2, s.z + s.d / 2]) box(g, s.x, 1.9, z, s.w - 3, 1.4, 0.08, M.glass);
}
function waterTower(g, { x, z, h }, detail) {
  const a = 1.3;
  for (const [dx, dz] of [[-a, -a], [a, -a], [a, a], [-a, a]]) box(g, x + dx, h / 2, z + dz, 0.3, h, 0.3, M.red);
  for (let y = 2.2; y < h; y += 2.3) {
    box(g, x, y, z - a, 2 * a, 0.2, 0.2, M.red); box(g, x, y, z + a, 2 * a, 0.2, 0.2, M.red);
    box(g, x - a, y, z, 0.2, 0.2, 2 * a, M.red); box(g, x + a, y, z, 0.2, 0.2, 2 * a, M.red);
  }
  if (detail) for (const side of [-1, 1]) for (let y = 0; y < h - 2; y += 2.3) {
    const len = Math.hypot(2 * a, 2.3);
    const b1 = box(g, x, y + 1.15, z + side * a, 0.14, len, 0.14, M.red); b1.rotation.z = Math.atan2(2 * a, 2.3);
    const b2 = box(g, x + side * a, y + 1.15, z, 0.14, len, 0.14, M.red); b2.rotation.x = Math.atan2(2 * a, 2.3);
  }
  box(g, x, h + 0.1, z, 3.6, 0.2, 3.6, M.red);
  box(g, x, h + 1.3, z, 2.6, 2.2, 2.6, M.tank);
  hip(g, x, h + 2.4, z, 2.8, 2.8, 1.1, M.tank);
  if (detail) for (const s of [-1, 1]) {
    box(g, x, h + 0.7, z + s * 1.75, 3.6, 0.06, 0.06, M.steel); box(g, x + s * 1.75, h + 0.7, z, 0.06, 0.06, 3.6, M.steel);
  }
}
export function createEN01(root, detail = true) {
  for (const s of en01Parts) {
    if (s.kind === "wing") wing(root, s, detail);
    else if (s.kind === "link") link(root, s);
    else if (s.kind === "annex") annex(root, s, detail);
    else if (s.kind === "canteen") canteen(root, s, detail);
    else if (s.kind === "aisle") aisle(root, s);
    else if (s.kind === "verandah") verandah(root, s, detail);
    else store(root, s);
  }
}
export function createEN02(root, detail = true) {
  for (const s of en02Parts) {
    if (s.kind === "hall") hall(root, s, detail);
    else simple(root, s, s.kind === "shed" ? M.darkRoof : M.whiteRoof);
  }
  const lows = ["s", "e", "e"];
  civilSite.canopies.forEach((c, i) => canopy(root, c.x0, c.x1, c.z0, c.z1, c.h, lows[i]));
  waterTower(root, civilSite.tower, detail);
}
