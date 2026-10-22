import * as THREE from "three";
import { en15Parts, en15Vault, en15Site } from "./en15-layout.js?v=en15-1";
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra });
const M = {
  render: mat("#e8e0cc"), white: mat("#f0ede4"), concrete: mat("#b9b6aa"), roof: mat("#bf6a55"),
  fascia: mat("#7a3f2c"), glass: mat("#2f3d40", { metalness: 0.4, roughness: 0.3 }), frame: mat("#5b5348"),
  base: mat("#a39c8c"), steel: mat("#9da3a2", { metalness: 0.35 }), tank: mat("#c9ccc6", { metalness: 0.2 }),
  hedge: mat("#5f8a46"),
};
// Beige diamond lattice screen on the upper storey (Street View, north road).
function latticeMaterial(w, h) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.strokeStyle = "#d9c7a0"; ctx.lineWidth = 14;
  for (const [a, b] of [[[0, 0], [128, 128]], [[128, 0], [0, 128]], [[64, -64], [192, 64]], [[-64, 64], [64, 192]], [[64, -64], [-64, 64]], [[192, 64], [64, 192]]]) {
    ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(w / 0.62, h / 0.62);
  return new THREE.MeshStandardMaterial({ map, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9 });
}
function box(p, x, y, z, w, h, d, m) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o;
}
function lettering(p, x, y, z) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 256;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#f2f0ea"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = '600 92px "IBM Plex Sans", sans-serif';
  ctx.fillText("E N G I N E E R I N G", 512, 70, 1000);
  ctx.fillText("L I B R A R Y", 512, 190, 760);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const o = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.25), new THREE.MeshStandardMaterial({ map, transparent: true }));
  o.position.set(x, y, z); o.rotation.y = Math.PI; p.add(o);
}
// Small gables (ridge along x) over a strip, used on the lower side wings.
function gables(p, s, count, rise) {
  const d = s.d / count;
  for (let k = 0; k < count; k++) {
    const z = s.z - s.d / 2 + (k + 0.5) * d, hw = s.w / 2 + 0.3, hd = d / 2;
    const v = [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd], [-hw, rise, 0], [hw, rise, 0]];
    const f = [[0, 4, 5], [0, 5, 1], [2, 5, 4], [2, 4, 3], [3, 4, 0], [1, 5, 2]];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(f.flat().flatMap((i) => v[i]), 3));
    g.computeVertexNormals();
    const o = new THREE.Mesh(g, M.roof); o.material.side = THREE.DoubleSide;
    o.position.set(s.x, s.h, z); o.castShadow = o.receiveShadow = true; p.add(o);
  }
}
// Folded-plate vault profile: steep shoulders, shallower upper facets, pointed crown
// (gable ends seen from the north-east road). Caps are bare concrete, slopes red.
function vaults(p, s) {
  const { bays, rise, over } = en15Vault, bw = s.w / bays, hw = bw / 2;
  const half = [[-1, 0], [-0.86, 0.45], [-0.55, 0.82], [0, 1]];
  const pts = [...half, ...half.slice(0, -1).reverse().map(([u, v]) => [-u, v])];
  const shape = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u * hw, v * rise)));
  const depth = s.d + over * 2;
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  for (let k = 0; k < bays; k++) {
    const o = new THREE.Mesh(geo, [M.concrete, M.roof]);
    o.position.set(s.x - s.w / 2 + (k + 0.5) * bw, s.h, s.z - depth / 2);
    o.castShadow = o.receiveShadow = true; p.add(o);
    if (k) box(p, s.x - s.w / 2 + k * bw, s.h + 0.1, s.z, 0.5, 0.2, depth, M.concrete);
  }
}
function hall(p, s, detail, lattice) {
  box(p, s.x, 0.15, s.z, s.w + 0.8, 0.3, s.d + 0.8, M.base);
  box(p, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.render);
  vaults(p, s);
  const bay = s.w / 8;
  for (const side of [-1, 1]) {
    const face = s.z + side * (s.d / 2);
    // Ground floor: continuous glazing between cream piers, deep sill below.
    box(p, s.x, 2.3, face + side * 0.05, s.w - 1, 2.6, 0.08, M.glass);
    box(p, s.x, 0.62, face + side * 0.15, s.w, 0.5, 0.3, M.render);
    box(p, s.x, 3.85, face + side * 0.3, s.w + 0.2, 0.5, 0.6, M.white);
    for (let i = 0; i <= 8; i++) box(p, s.x - s.w / 2 + i * bay, 2.1, face + side * 0.15, 0.5, 3.9, 0.3, M.render);
    // Upper storey: egg-crate fin grid in front of a window band, lattice screen above.
    box(p, s.x, 5.75, face + side * 0.05, s.w - 1, 2.4, 0.08, M.glass);
    box(p, s.x, 8.65, face + side * 0.98, s.w + 0.1, 2.5, 0.02, lattice);
    box(p, s.x, 10.15, face + side * 1.0, s.w + 0.6, 0.6, 0.22, M.fascia);
    for (let i = 0; i <= 8; i++) box(p, s.x - s.w / 2 + i * bay, 7.2, face + side * 0.5, 0.22, 5.9, 1.0, M.white);
    if (!detail) continue;
    for (const y of [4.45, 5.15, 5.85, 6.55, 7.3]) box(p, s.x, y, face + side * 0.5, s.w, 0.1, 0.96, M.white);
    for (let i = 0; i < 8; i++) for (const f of [0.25, 0.5, 0.75])
      box(p, s.x - s.w / 2 + (i + f) * bay, 5.85, face + side * 0.5, 0.08, 2.9, 0.92, M.white);
    for (let x = s.x - s.w / 2 + 1; x < s.x + s.w / 2; x += 1.35) box(p, x, 2.3, face + side * 0.08, 0.06, 2.6, 0.06, M.frame);
  }
  if (!detail) return;
  // Gable ends: a few small windows in otherwise plain rendered walls.
  for (const side of [-1, 1]) for (const y of [2.2, 5.8])
    for (let z = s.z - s.d / 2 + 4; z < s.z + s.d / 2 - 3; z += 5)
      box(p, s.x + side * (s.w / 2 + 0.04), y, z, 0.08, 1.4, 1.6, M.glass);
}
function stairHall(p, s, detail) {
  box(p, s.x, 5.6, s.z, s.w, 3.6, s.d, M.white);
  box(p, s.x, 3.7, s.z, s.w + 0.4, 0.3, s.d + 0.4, M.white);
  gables(p, s, 3, 1.2);
  // Open ground floor on columns with a white concrete stair (Street View, west end).
  for (const x of [s.x - s.w / 2 + 0.3, s.x + s.w / 2 - 0.3]) for (const z of [s.z - s.d / 2 + 0.3, s.z, s.z + s.d / 2 - 0.3])
    box(p, x, 1.85, z, 0.4, 3.7, 0.4, M.white);
  if (!detail) return;
  for (let i = 0; i < 18; i++) box(p, s.x, 0.1 + i * 0.205, s.z + s.d / 2 - 1.2 - i * 0.28, 2.2, 0.2, 0.3, M.white);
  for (let z = s.z - s.d / 2 + 1.6; z < s.z + s.d / 2 - 1; z += 2.6) box(p, s.x - s.w / 2 - 0.04, 5.6, z, 0.08, 1.3, 1.5, M.glass);
}
function serviceWing(p, s, detail) {
  box(p, s.x, s.h / 2, s.z, s.w, s.h, s.d, M.white);
  box(p, s.x, 3.8, s.z, s.w + 0.5, 0.25, s.d + 0.5, M.white);
  // Six low roofs behind a parapet: striped on the satellite, hidden from the road.
  if (s.kind === "wing") {
    gables(p, s, 6, 0.55);
    for (const side of [-1, 1]) {
      box(p, s.x + side * (s.w / 2 + 0.1), s.h + 0.35, s.z, 0.2, 0.7, s.d + 0.4, M.white);
      box(p, s.x, s.h + 0.35, s.z + side * (s.d / 2 + 0.1), s.w + 0.4, 0.7, 0.2, M.white);
    }
  }
  else box(p, s.x, s.h + 0.3, s.z, s.w, 0.6, s.d, M.white);
  if (!detail || s.kind !== "wing") return;
  for (const y of [1.8, 5.5]) {
    for (let z = s.z - s.d / 2 + 2; z < s.z + s.d / 2 - 1; z += 3.2) box(p, s.x + s.w / 2 + 0.04, y, z, 0.08, 1.3, 1.6, M.glass);
    for (const side of [-1, 1]) box(p, s.x, y, s.z + side * (s.d / 2 + 0.04), 2.4, 1.3, 0.08, M.glass);
  }
}
export function createEN15(root, detail = true) {
  const lattice = latticeMaterial(31, 2.5);
  for (const s of en15Parts) {
    if (s.kind === "hall") hall(root, s, detail, lattice);
    else if (s.kind === "stair") stairHall(root, s, detail);
    else serviceWing(root, s, detail);
  }
  const { verandah: v, stair: st, tank, letters } = en15Site;
  box(root, v.x, v.h, v.z, v.w, 0.15, v.d, M.white);
  for (let z = v.z - v.d / 2 + 0.3; z <= v.z + v.d / 2; z += 3.3) box(root, v.x + v.w / 2 - 0.2, v.h / 2, z, 0.2, v.h, 0.2, M.white);
  if (!detail) return;
  lettering(root, letters.x, 2.45, letters.z - 0.12);
  // External stair along the service wing's north face, landing and steel awning at the top.
  const n = 19, run = (st.x1 - st.x0) / n;
  for (let i = 0; i < n; i++) box(root, st.x0 + (i + 0.5) * run, (i + 0.5) * (st.rise / n), st.z, run + 0.02, st.rise / n, st.w, M.white);
  box(root, st.x1 + 0.7, st.rise - 0.1, st.z, 1.4, 0.2, st.w, M.white);
  box(root, (st.x0 + st.x1) / 2 + 0.7, st.rise / 2 + 0.55, st.z - st.w / 2, st.x1 - st.x0 + 1.4, 1.1, 0.12, M.white);
  box(root, st.x1, st.rise + 2.6, st.z + 0.2, 3.2, 0.08, 2, M.steel);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.7, 20), M.tank);
  t.position.set(tank.x, 0.85, tank.z); t.castShadow = true; root.add(t);
  // Clipped hedge between the north covered walk and the glazing.
  box(root, 61.25, 0.45, -18.6, 30, 0.9, 0.9, M.hedge);
}
