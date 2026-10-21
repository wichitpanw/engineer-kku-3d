import * as THREE from "three";
import { en08Parts, en08Site } from "./en08-layout.js?v=en08-1";
const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra });
const M = {
  render: mat("#e2d6c4"), pink: mat("#d9a99a"), band: mat("#cf9784"), concrete: mat("#c3c1b4"),
  deck: mat("#a9aaa0"), brick: mat("#9a4f3c"), white: mat("#efece2"), glass: mat("#3f5d5f", { metalness: 0.4, roughness: 0.3 }),
  teal: mat("#5d8f8b", { metalness: 0.3, roughness: 0.35 }), frame: mat("#8d9590"), louver: mat("#8f9690"),
  roof: mat("#b4553d"), tan: mat("#b9906a"), red: mat("#c0392b"), orange: mat("#d9793c"),
  stone: mat("#8b7f70"), black: mat("#24282a"), paving: mat("#b5ae9d"), grass: mat("#7f9466"),
  leaf: mat("#4f7442"), trunk: mat("#76604b"), steel: mat("#a7aca8", { metalness: 0.35 }), ac: mat("#dcdcd6"),
};
function box(p, x, y, z, w, h, d, m) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o;
}
function label(p, text, x, y, z, w, h, color, font = "600 76px", rotY = 0) {
  const c = document.createElement("canvas"); c.width = 1536; c.height = 160;
  const ctx = c.getContext("2d"); ctx.font = `${font} "IBM Plex Sans Thai", sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = color;
  ctx.fillText(text, 768, 85, 1490);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace;
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map, transparent: true }));
  o.position.set(x, y, z); o.rotation.y = rotY; p.add(o); return o;
}
// Hip roof (ridge along the longer side) or gable roof as one closed mesh.
function roof(p, s, rise, over, m, gable = false) {
  const hw = s.w / 2 + over, hd = s.d / 2 + over, y = s.h;
  const alongX = gable ? s.ridge !== "z" : s.w >= s.d;
  const inset = gable ? 0 : Math.min(hw, hd);
  const v = alongX
    ? [[-hw, y, -hd], [hw, y, -hd], [hw, y, hd], [-hw, y, hd], [-hw + inset, y + rise, 0], [hw - inset, y + rise, 0]]
    : [[-hw, y, -hd], [hw, y, -hd], [hw, y, hd], [-hw, y, hd], [0, y + rise, -hd + inset], [0, y + rise, hd - inset]];
  const f = alongX
    ? [[0, 4, 5], [0, 5, 1], [2, 5, 4], [2, 4, 3], [3, 4, 0], [1, 5, 2]]
    : [[0, 4, 1], [1, 4, 5], [1, 5, 2], [2, 5, 3], [3, 5, 4], [3, 4, 0]];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(f.flat().flatMap((i) => v[i]), 3));
  g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.material.side = THREE.DoubleSide;
  o.position.set(s.x, 0, s.z); o.castShadow = o.receiveShadow = true; p.add(o); return o;
}
// Window bands on the two long faces; `floors` sill heights in metres.
function longFaces(p, s, floors, opts = {}) {
  for (const side of [-1, 1]) {
    const z = s.z + side * (s.d / 2 + 0.05);
    for (const y of floors) {
      box(p, s.x, y + 0.75, z, s.w - 1.2, 1.4, 0.08, M.glass);
      box(p, s.x, y - 0.05, z + side * 0.1, s.w - 0.6, 0.22, 0.3, opts.sill || M.concrete);
      if (opts.mullions) for (let x = s.x - s.w / 2 + 1.4; x < s.x + s.w / 2 - 0.6; x += 1.6)
        box(p, x, y + 0.75, z + side * 0.04, 0.07, 1.4, 0.06, M.frame);
      if (opts.ac) for (let x = s.x - s.w / 2 + 2.5; x < s.x + s.w / 2 - 1; x += 4.8)
        box(p, x, y - 0.45, z + side * 0.35, 0.8, 0.55, 0.32, M.ac);
    }
  }
}
function shortFaces(p, s, floors) {
  for (const side of [-1, 1]) for (const y of floors)
    box(p, s.x + side * (s.w / 2 + 0.05), y + 0.75, s.z, 0.08, 1.3, Math.max(1.2, s.d - 6), M.glass);
}
// Two-storey wing with horizontal sun-louvres at ground level, salmon fascia and a parapet
// crowned by small red gablets (Wittayawattana Rd frontage, Street View May 2019).
function bandWing(p, s, detail) {
  box(p, s.x, s.h / 2, s.z, s.w - 0.4, s.h, s.d - 0.4, M.render);
  box(p, s.x, s.h + 0.12, s.z, s.w - 0.6, 0.2, s.d - 0.6, M.deck);
  for (const side of [-1, 1]) {
    const z = s.z + side * (s.d / 2 + 0.06);
    box(p, s.x, 3.55, z, s.w, 0.45, 0.25, M.band);
    box(p, s.x, s.h + 0.35, z, s.w, 0.7, 0.3, M.band);
    if (detail) for (let y = 0.9; y < 3.1; y += 0.32) box(p, s.x, y, z + side * 0.25, s.w - 0.8, 0.07, 0.16, M.louver);
    if (detail) for (let x = s.x - s.w / 2 + 0.9; x < s.x + s.w / 2; x += 2.4) {
      const gab = box(p, x, s.h + 0.85, z, 0.62, 0.62, 0.16, M.red); gab.rotation.z = Math.PI / 4;
    }
  }
  longFaces(p, s, [4.6], { mullions: detail, ac: detail });
  shortFaces(p, s, [4.6]);
  // Red department lettering on the ground-floor fascia facing Wittayawattana Rd.
  if (detail && s.id === "west-south")
    label(p, "ภาควิชาวิศวกรรมอุตสาหการ", s.x + s.w / 2 - 7, 3.55, s.z + s.d / 2 + 0.2, 11, 0.42, "#b0332b");
}
function brickHall(p, s, detail) {
  box(p, s.x, s.h / 2, s.z, s.w - 0.4, s.h, s.d - 0.4, M.brick);
  for (const y of [0.35, 3.85, s.h - 0.25]) box(p, s.x, y, s.z, s.w, 0.3, s.d, M.white);
  longFaces(p, s, [1.2, 4.7], { mullions: detail, sill: M.white });
  shortFaces(p, s, [1.2, 4.7]);
  roof(p, s, 2.3, 0.9, M.roof);
  // Tan monitor deck over the workshop core, as seen from above.
  box(p, s.x + 1.5, s.h + 1.6, s.z, s.w - 9, 0.25, s.d - 5.5, M.tan);
}
function pinkWing(p, s, detail) {
  const floors = s.h > 9 ? [1.1, 4.4, 7.7] : [1.1, 4.6];
  box(p, s.x, s.h / 2, s.z, s.w - 0.4, s.h, s.d - 0.4, M.pink);
  for (const y of floors.slice(1)) box(p, s.x, y - 0.25, s.z, s.w, 0.25, s.d, M.render);
  longFaces(p, s, floors, { mullions: detail, ac: detail, sill: M.render });
  shortFaces(p, s, floors);
  roof(p, s, s.roof === "gable" ? 2.8 : 2.4, 1.1, M.roof, s.roof === "gable");
  box(p, s.x, s.h + 0.05, s.z, s.w + 2.2, 0.18, s.d + 2.2, M.render);
}
function endBlock(p, s, detail) {
  box(p, s.x, s.h / 2, s.z, s.w - 0.2, s.h, s.d - 0.2, M.render);
  box(p, s.x, s.h + 0.25, s.z, s.w, 0.5, s.d, M.concrete);
  box(p, s.x, 3.55, s.z, s.w + 0.2, 0.45, s.d + 0.2, M.band);
  if (detail) {
    // Vertical "INDUSTRIAL ENGINEERING" lettering on the west-facing end wall.
    const c = label(p, "INDUSTRIAL ENGINEERING", s.x - s.w / 2 - 0.06, 5.2, s.z + 4.5, 5.2, 0.5, "#a0312a", "700 76px", -Math.PI / 2);
    c.rotation.z = Math.PI / 2;
  }
}
function office(p, s, detail) {
  // Single-storey glazed office facing the inner road; white fascia sign band.
  box(p, s.x - 0.6, 1.7, s.z, s.w - 1.4, 3.4, s.d - 0.4, M.render);
  box(p, s.x + s.w / 2 - 0.25, 1.55, s.z, 0.12, 2.6, s.d - 1.2, M.teal);
  for (let z = s.z - s.d / 2 + 0.6; z <= s.z + s.d / 2 - 0.5; z += 2.45)
    box(p, s.x + s.w / 2 - 0.1, 1.7, z, 0.35, 3.2, 0.35, M.pink);
  box(p, s.x + 0.2, 3.85, s.z, s.w + 0.6, 1.1, s.d + 0.6, M.white);
  box(p, s.x + s.w / 2 + 0.05, 0.3, s.z, 0.7, 0.6, s.d, M.stone);
  if (detail) {
    label(p, "ภาควิชาวิศวกรรมอุตสาหการ", s.x + s.w / 2 + 0.62, 4.05, s.z - 0.8, 10, 0.62, "#6d6a63", "600 76px", Math.PI / 2);
    label(p, "Department of Industrial Engineering", s.x + s.w / 2 + 0.62, 3.6, s.z - 0.8, 10, 0.4, "#6d6a63", "500 76px", Math.PI / 2);
    // Red triangular department emblem left of the lettering (south end, seen from the road).
    const logo = new THREE.Mesh(new THREE.CircleGeometry(0.42, 3), M.red);
    logo.position.set(s.x + s.w / 2 + 0.63, 3.9, s.z + 5.4); logo.rotation.set(0, Math.PI / 2, Math.PI / 2); p.add(logo);
    for (let z = s.z - s.d / 2 + 1; z < s.z + s.d / 2; z += 1.2) box(p, s.x + s.w / 2 + 0.75, 0.78, z, 0.5, 0.4, 0.9, M.leaf);
  }
}
function tree(p, x, z, h, r) {
  box(p, x, h * 0.32, z, 0.3, h * 0.64, 0.3, M.trunk);
  for (let k = 0; k < 4; k++) {
    const o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.leaf);
    o.position.set(x + Math.cos(k * 1.7) * r * 0.4, h * 0.75 + (k % 2) * 0.6, z + Math.sin(k * 1.7) * r * 0.4);
    o.scale.y = 0.75; o.castShadow = o.receiveShadow = true; p.add(o);
  }
}
export function createEN08(root, detail = true) {
  for (const s of en08Parts) {
    if (s.kind === "band") bandWing(root, s, detail);
    else if (s.kind === "end") endBlock(root, s, detail);
    else if (s.kind === "brick") brickHall(root, s, detail);
    else if (s.kind === "pink") pinkWing(root, s, detail);
    else office(root, s, detail);
  }
  const { walk, westCourt, eastCourt, sign, carport } = en08Site;
  // Covered walk: flat slab on round orange columns.
  box(root, walk.x, 3.1, walk.z, walk.w, 0.22, walk.d, M.white);
  box(root, walk.x, 0.08, walk.z, walk.w, 0.1, walk.d, M.paving);
  for (let x = walk.x - walk.w / 2 + 1; x <= walk.x + walk.w / 2; x += 3.6) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 12), M.orange);
    col.position.set(x, 1.5, walk.z + walk.d / 2 - 0.3); col.castShadow = true; root.add(col);
  }
  // Tree courts open to the sky (crowns kept inside the court walls).
  for (const c of [westCourt, eastCourt]) {
    box(root, c.x, 0.06, c.z, c.w - 1, 0.06, c.d - 1, M.grass);
    if (!detail) continue;
    const r = Math.min(c.w, c.d) * 0.17;
    for (const [fx, fz] of [[-0.25, -0.2], [0.22, 0.18], [0.05, -0.05]])
      tree(root, c.x + fx * c.w, c.z + fz * c.d, 7, r);
  }
  if (detail) {
    // Curved black signboard with orange English lettering on a stone base.
    const g = new THREE.Group(); g.position.set(sign.x, 0, sign.z); g.rotation.y = Math.PI / 2; root.add(g);
    box(g, 0, 0.35, 0, sign.w + 0.4, 0.7, 1.1, M.stone);
    box(g, 0, 1.25, 0, sign.w, 1.1, 0.18, M.black);
    label(g, "วิศวกรรมอุตสาหการ", 0.4, 1.15, 0.1, sign.w - 1.2, 0.55, "#f1eee6", "700 76px");
    label(g, "Industrial Engineering", 0.6, 1.62, 0.1, sign.w - 2, 0.32, "#e2552f", "700 76px");
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.42, 28), M.red);
    emblem.position.set(-sign.w / 2 + 0.6, 1.25, 0.1); g.add(emblem);
    for (let x = -sign.w / 2; x <= sign.w / 2; x += 0.7) box(g, x, 0.85, 0.75, 0.6, 0.35, 0.5, M.leaf);
    // Steel carport over the west driveway.
    const cp = carport;
    box(root, cp.x, 2.75, cp.z, cp.w, 0.12, cp.d, M.steel);
    for (let z = cp.z - cp.d / 2 + 0.5; z <= cp.z + cp.d / 2; z += 3.6)
      for (const dx of [-cp.w / 2 + 0.3, cp.w / 2 - 0.3]) box(root, cp.x + dx, 1.35, z, 0.12, 2.7, 0.12, M.frame);
  }
}
