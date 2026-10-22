import * as THREE from "three";
import { en06Parts } from "./en06-layout.js?v=en06-1";
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra });
const M = {
  wall: mat("#ddd8c9"), plinth: mat("#bdb8aa"), roof: mat("#7d8486", { metalness: 0.3, side: THREE.DoubleSide }),
  rib: mat("#d9dcd8", { metalness: 0.3 }), glass: mat("#34403f", { metalness: 0.4, roughness: 0.3 }),
  dark: mat("#55595d"), steel: mat("#7c868b", { metalness: 0.4 }),
};
function box(g, x, y, z, w, h, d, m) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o;
}
// Segmental vault spanning east-west, running north-south.
function vault(g, s, detail) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.wall);
  box(g, s.x, 0.4, s.z, s.w + 0.3, 0.8, s.d + 0.3, M.plinth);
  const half = s.w / 2 + 0.5, r = (half * half + s.rise * s.rise) / (2 * s.rise), a = Math.asin(half / r);
  const arc = (rad, len) => {
    const geo = new THREE.CylinderGeometry(rad, rad, len, 32, 1, true, -a, 2 * a);
    geo.rotateX(-Math.PI / 2);
    return geo;
  };
  const roof = new THREE.Mesh(arc(r, s.d + 1), M.roof);
  roof.position.set(s.x, s.h + s.rise - r, s.z); roof.castShadow = roof.receiveShadow = true; g.add(roof);
  // Gable infill under the vault at both ends.
  const shape = new THREE.Shape();
  shape.moveTo(-s.w / 2, 0);
  for (let i = 0; i <= 24; i++) {
    const t = -a + (2 * a * i) / 24, x = r * Math.sin(t);
    if (Math.abs(x) <= s.w / 2) shape.lineTo(x, r * Math.cos(t) - (r - s.rise));
  }
  shape.lineTo(s.w / 2, 0);
  for (const side of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.ShapeGeometry(shape), M.wall);
    o.material.side = THREE.DoubleSide;
    o.position.set(s.x, s.h, s.z + side * (s.d / 2)); g.add(o);
  }
  for (let k = 0; k <= s.ribs; k++) {
    const z = s.z - s.d / 2 + (k * s.d) / s.ribs;
    const rib = new THREE.Mesh(arc(r + 0.08, 0.25), M.rib);
    rib.position.set(s.x, s.h + s.rise - r, z); g.add(rib);
  }
  for (const side of [-1, 1]) box(g, s.x + side * (s.w / 2 + 0.03), 2.2, s.z, 0.06, 1.3, s.d - 3, M.glass);
  if (!detail) return;
  for (const side of [-1, 1]) {
    const z = s.z + side * (s.d / 2 + 0.05);
    box(g, s.x, 1.6, z, 3.4, 3.2, 0.1, M.steel);
    for (const dx of [-6, 6]) box(g, s.x + dx, 2.2, z, 2.4, 1.2, 0.08, M.glass);
  }
}
function annex(g, s) {
  box(g, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.wall);
  box(g, s.x, s.h + 0.12, s.z, s.w + 0.6, 0.24, s.d + 0.6, M.dark);
  box(g, s.x, 1.5, s.z - s.d / 2 - 0.04, s.w - 2, 1.2, 0.08, M.glass);
}
export function createEN06(root, detail = true) {
  for (const s of en06Parts) s.kind === "vault" ? vault(root, s, detail) : annex(root, s);
}
