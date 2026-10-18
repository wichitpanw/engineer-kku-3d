import * as THREE from "three";

const material = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });
const M = {
  steel: material("#bd542e"),
  wall: material("#ede9db"),
  pier: material("#777f80"),
  roof: material("#858681", { metalness: 0.3 }),
  dark: material("#273b43"),
  trim: material("#81898a"),
  tile: material("#a77563"),
  soffit: material("#c9c5b7"),
};
function box(p, x, y, z, w, h, d, m = M.wall) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}
function beam(p, a, b, size = 0.11, m = M.steel) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    v = bv.clone().sub(av);
  const o = box(p, 0, 0, 0, size, v.length(), size, m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
}
function rail(p, a, b, y) {
  beam(p, [a[0], y + 1, a[1]], [b[0], y + 1, b[1]], 0.065);
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.55);
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / n,
      z = a[1] + ((b[1] - a[1]) * i) / n;
    beam(p, [x, y, z], [x, y + 1, z], 0.045);
  }
}
function sign(p) {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 400;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#eeeee7";
  ctx.fillRect(0, 0, 2048, 400);
  ctx.textAlign = "center";
  ctx.fillStyle = "#20282b";
  ctx.font = "bold 125px Arial";
  ctx.fillText("FACULTY OF ENGINEERING", 1024, 175, 1930);
  ctx.font = "bold 95px Georgia";
  ctx.fillText("KHON KAEN UNIVERSITY", 1024, 310, 1740);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  // The sign faces the north court; all child geometry uses a south-facing local facade.
  box(p, 6.3, 10.1, 14.34, 15.2, 2.65, 0.15);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(15.1, 2.6),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
  );
  plane.position.set(6.3, 10.1, 14.43);
  p.add(plane);
  const gear = new THREE.Shape();
  for (let i = 0; i < 128; i++) {
    const a = (i / 128) * Math.PI * 2,
      r = i % 4 < 2 ? 1.34 : 1.17;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    i ? gear.lineTo(x, y) : gear.moveTo(x, y);
  }
  const badge = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gear, { depth: 0.13, bevelEnabled: false }),
    M.wall,
  );
  badge.position.set(-3.45, 10.1, 14.38);
  p.add(badge);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.02, 48), M.dark);
  disc.position.set(-3.45, 10.1, 14.53);
  p.add(disc);
  const cc = document.createElement("canvas");
  cc.width = 256;
  cc.height = 256;
  const cx = cc.getContext("2d");
  cx.textAlign = "center";
  cx.font = "bold 92px Arial";
  cx.fillStyle = "#c45254";
  cx.fillText("EN", 128, 111);
  cx.fillStyle = "#f4f1e7";
  cx.fillText("09", 128, 209);
  const tex = new THREE.CanvasTexture(cc);
  tex.colorSpace = THREE.SRGBColorSpace;
  const letters = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.9),
    new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    }),
  );
  letters.position.set(-3.45, 10.1, 14.55);
  p.add(letters);
}
function stairs(p, x, z, width, startY, endY, direction = 1, run = 6.8) {
  const n = Math.ceil(run / 0.3);
  for (let i = 0; i < n; i++) {
    const h = startY + ((endY - startY) * (i + 1)) / n;
    box(
      p,
      x,
      h - 0.12,
      z + (direction * run * (i + 0.5)) / n,
      width,
      0.24,
      run / n + 0.015,
    );
  }
  for (const side of [-1, 1]) {
    beam(
      p,
      [x + (side * width) / 2, startY + 1, z],
      [x + (side * width) / 2, endY + 1, z + direction * run],
      0.065,
    );
    for (let i = 0; i <= n; i += 2) {
      const yy = startY + ((endY - startY) * i) / n,
        zz = z + (direction * run * i) / n;
      beam(
        p,
        [x + (side * width) / 2, yy, zz],
        [x + (side * width) / 2, yy + 1, zz],
        0.045,
      );
    }
  }
}

function sideStairHall(p, detail) {
  // Local +Z faces the north entrance, between x=-18 and x=-28.
  for (const x of [-27, -18.5])
    for (const z of [-7.5, 3.2, 12.5]) box(p, x, 5.1, z, 0.34, 10.2, 0.34);
  box(p, -22.75, 2.8, 4.4, 8.85, 0.28, 2.6);
  box(p, -22.75, 6.35, 10.8, 8.85, 0.3, 3.8);
  // Short links bridge the air gaps to both wings. The eastern wing is staggered
  // 5 m towards the north; the landing meets its open inner face behind the front.
  box(p, -28.3, 6.35, 10.8, 3.1, 0.3, 3.8);
  box(p, -17.8, 6.35, 10.8, 2.5, 0.3, 3.8);
  box(p, -22.75, 6.35, -3.5, 8.85, 0.3, 8);
  box(p, -22.75, 4.55, 3, 8.85, 3.25, 0.25);
  box(p, -22.75, 10.2, 2.4, 10.2, 0.35, 22);
  // Concrete roof edge / upper metal coping follows the photo's white folded roof.
  box(p, -22.75, 10.55, 13.25, 10.2, 0.5, 0.12, M.trim);
  stairs(p, -25.4, 11.8, 2.55, 0.45, 2.8, -1, 6.1);
  stairs(p, -20.1, 5.7, 2.55, 2.8, 6.35, 1, 6.1);
  // Lower portico: wide shallow steps, flat concrete cover and slender white columns.
  box(p, -22.75, 0.35, 21, 9, 0.25, 16);
  box(p, -22.75, 3.8, 21, 9.3, 0.28, 16.4);
  for (const x of [-27, -18.5])
    for (const z of [14.5, 21, 28.5]) box(p, x, 2.1, z, 0.25, 3.6, 0.25);
  for (let i = 0; i < 4; i++)
    box(p, -22.75, 0.06 + i * 0.08, 30 - i * 0.42, 9, 0.12 + i * 0.16, 0.6);
  if (!detail) return;
  rail(p, [-27, 5.5], [-27, 12.5], 2.95);
  rail(p, [-27, 12.5], [-23.9, 12.5], 2.95);
  rail(p, [-23.9, 5.5], [-18.5, 5.5], 2.95);
  rail(p, [-27, 12.5], [-18.5, 12.5], 6.5);
  rail(p, [-29.8, 12.5], [-27, 12.5], 6.5);
  rail(p, [-18.5, 12.5], [-16.55, 12.5], 6.5);
  rail(p, [-27, -7.5], [-27, 0.5], 6.5);
  rail(p, [-27, 14.5], [-27, 28.5], 0.5);
  rail(p, [-18.5, 14.5], [-18.5, 28.5], 0.5);
  // White beams and discreet conduit below the canopy, no invented room interiors.
  for (const z of [-7, 3.2, 12.5]) box(p, -22.75, 9.8, z, 8.8, 0.42, 0.26);
  for (const z of [16, 23, 28]) box(p, -22.75, 3.58, z, 8.5, 0.2, 0.2);
  for (const y of [6.1, 9.95])
    beam(p, [-26.4, y, -6.5], [-26.4, y, 11.5], 0.025, M.trim);
  // Low permanent planting trough beside the first stair.
  box(p, -27.1, 0.26, 7, 0.6, 0.45, 7);
}

function secondWing(p, detail) {
  // Additional eastern roof mass visible in the supplied aerial; same EN09 identity.
  const g = new THREE.Group();
  g.position.set(-43, 0, 5);
  p.add(g);
  box(g, 0, 0.16, 0, 30, 0.32, 27, M.tile);
  box(g, 0, 6.2, 0, 28, 0.3, 24.5, M.soffit);
  box(g, 0, 9.3, -11.8, 28, 6.1, 0.25);
  box(g, -13.9, 9.3, 0, 0.25, 6.1, 24);
  box(g, 0, 12.4, 0, 28.2, 0.25, 24.5);
  box(g, 0, 10.95, 11.8, 28, 2.8, 0.25);
  box(g, 0, 6.55, 11.8, 28, 0.6, 0.25);
  for (const x of [-12, -4, 4, 12])
    for (const z of [-10.7, 11.5]) {
      box(g, x, 2, z, 0.65, 4, 0.7, M.pier);
    }
  for (let x = -14; x <= 14; x += 2.8) {
    box(g, x, 8.25, 11.8, 0.32, 3.4, 0.28);
    for (const z of [-13.5, 13.5]) {
      beam(g, [x, 3.7, z], [x, 13.6, z], 0.12);
      if (x < 13.9)
        for (const y of [3.7, 6.1, 8.6, 11.1]) {
          beam(g, [x, y, z], [x + 2.8, y + 2.5, z], 0.08);
          beam(g, [x, y + 2.5, z], [x + 2.8, y, z], 0.08);
        }
    }
  }
  for (const z of [-13.5, 13.5])
    for (const y of [3.7, 6.1, 8.6, 11.1, 13.6])
      beam(g, [-14, y, z], [14, y, z], 0.12);
  // Outer end of the wing retains the same visible orange braced cage.
  for (let z = -13.5; z < 13.5; z += 3.375)
    for (const y of [3.7, 6.1, 8.6, 11.1]) {
      beam(g, [-14, y, z], [-14, y + 2.5, z + 3.375], 0.08);
      beam(g, [-14, y + 2.5, z], [-14, y, z + 3.375], 0.08);
    }
  const roof = box(g, 0, 14.1, 0, 32, 0.15, 30.3, M.roof);
  roof.rotation.x = -0.025;
  box(g, 0, 6.35, 12.65, 28, 0.2, 1.7);
  if (!detail) return;
  for (let x = -12.6; x < 14; x += 2.8) {
    box(g, x, 8.25, 11.86, 2.4, 3.3, 0.09, M.dark);
    box(g, x, 8.25, 11.95, 0.06, 3.3, 0.04, M.trim);
    box(g, x, 8.25, 11.95, 2.4, 0.06, 0.04, M.trim);
  }
  rail(g, [-13.7, 13.1], [13.7, 13.1], 6.5);
  for (let x = -15; x <= 15; x += 1.2)
    beam(g, [x, 14.4, -15], [x, 13.7, 15], 0.025, M.trim);
}

/** Photo-derived visible facades; unphotographed rear details remain provisional. */
export function createCB(root, detail) {
  const p = new THREE.Group();
  p.position.set(184, 0, -122);
  p.rotation.y = Math.PI;
  root.add(p);
  // Main footprint remains registered at 37 x 27 m. Steel sits outside the white envelope.
  box(p, 0, 0.16, 0, 37, 0.32, 27, M.tile);
  box(p, 0, 6.2, -0.3, 34.5, 0.35, 24.7, M.soffit);
  // Upper hall: exterior walls only, leaving the entire lower level open between piers.
  box(p, 0, 9.3, -11.8, 34.5, 6.1, 0.28);
  box(p, 17.1, 9.3, 0, 0.28, 6.1, 24);
  // Leave a real doorway from the high stair landing into the occupied wing.
  box(p, -17.1, 9.3, -3, 0.28, 6.1, 18);
  box(p, -17.1, 11.1, 9, 0.28, 2.5, 6);
  box(p, 0, 12.42, 0, 34.7, 0.24, 24.6, M.soffit);
  // Front wall made from piers and spandrels rather than glass painted over solid walls.
  box(p, 0, 6.55, 11.9, 34.4, 0.6, 0.25);
  box(p, 0, 10.95, 11.9, 34.4, 2.8, 0.25);
  const openings = [-12, -5, 2, 9];
  for (let x = -17.2; x < 17.2; x += 0.4) {
    if (!openings.some((c) => Math.abs(x - c) < 1.35))
      box(p, x, 8.3, 11.9, 0.4, 3.3, 0.25);
  }
  for (const x of [-15, -5, 5, 15])
    for (const z of [-10.5, 11.8]) {
      const g = new THREE.CylinderGeometry(0.44, 0.78, 3.85, 4);
      g.rotateY(Math.PI / 4);
      const pier = new THREE.Mesh(g, M.pier);
      pier.position.set(x, 2.03, z);
      pier.castShadow = pier.receiveShadow = true;
      p.add(pier);
    }
  box(p, 0, 6.3, 13.05, 36.6, 0.22, 2.6);
  // Permanent roof is a shallow sheet with a generous overhang, not an extra storey.
  const roof = box(p, 0, 14.12, 0, 39.4, 0.16, 30.3, M.roof);
  roof.rotation.x = -0.025;
  for (const z of [-13.6, 13.6]) {
    for (let x = -18; x <= 18.01; x += 3)
      beam(p, [x, 3.7, z], [x, 13.7, z], detail ? 0.14 : 0.18);
    for (const y of [3.7, 6.1, 8.6, 11.1, 13.65])
      beam(p, [-18, y, z], [18, y, z], 0.13);
    // Orange X bracing is retained in the distant silhouette as the building's defining form.
    for (let x = -18; x < 18; x += 3)
      for (const [a, b] of [
        [3.7, 6.1],
        [6.1, 8.6],
        [8.6, 11.1],
        [11.1, 13.65],
      ]) {
        beam(p, [x, a, z], [x + 3, b, z], 0.085);
        beam(p, [x, b, z], [x + 3, a, z], 0.085);
      }
  }
  for (const side of [-1, 1]) {
    const x = side * 18;
    for (let z = -13.6; z <= 13.61; z += 3.4)
      beam(p, [x, 3.7, z], [x, 13.7, z], 0.13);
    for (const y of [3.7, 6.1, 8.6, 11.1, 13.65])
      beam(p, [x, y, -13.6], [x, y, 13.6], 0.13);
    for (let z = -13.6; z < 13.5; z += 3.4)
      for (const [a, b] of [
        [3.7, 6.1],
        [6.1, 8.6],
        [8.6, 11.1],
        [11.1, 13.65],
      ]) {
        if (side === -1 && z > 6 && z < 13 && a < 8.6) continue;
        beam(p, [x, a, z], [x, b, z + 3.4], 0.085);
        beam(p, [x, b, z], [x, a, z + 3.4], 0.085);
      }
  }
  // Two-level concrete stair hall between the two orange steel wings.
  sideStairHall(p, detail);
  secondWing(p, detail);
  if (!detail) return;
  for (const x of openings) {
    box(p, x, 8.3, 11.96, 2.6, 3.3, 0.09, M.dark);
    for (const dx of [-1.3, 0, 1.3])
      box(p, x + dx, 8.3, 12.03, 0.065, 3.3, 0.05, M.trim);
    box(p, x, 8.3, 12.04, 2.6, 0.06, 0.05, M.trim);
  }
  // Balcony is open to the air and its railing sits in front of the wall.
  rail(p, [-17.7, 13.2], [17.7, 13.2], 6.43);
  for (const x of [-15, -5, 5, 15]) {
    beam(p, [x, 3.8, -11.5], [x, 3.8, 13.4], 0.2);
    for (let z = -11.5; z < 13; z += 3.4)
      beam(p, [x, 3.8, z], [x + Math.min(5, 18 - x), 3.8, z], 0.12);
  }
  for (let x = -19.2; x <= 19.2; x += 1.05) {
    beam(p, [x, 14.44, -15], [x, 13.7, 15], 0.028, M.trim);
  }
  for (let x = -18; x <= 18; x += 6) {
    beam(p, [x, 13.6, -14.9], [x, 13.6, 14.9], 0.13);
    for (let z = -14; z < 14; z += 3.5) {
      beam(p, [x, 13.6, z], [x, 14.1, z + 1.75], 0.055);
      beam(p, [x, 14.1, z + 1.75], [x, 13.6, z + 3.5], 0.055);
    }
  }

  stairs(p, 16, 12, 2, 0.28, 6.3, -1, 11.6);
  for (let i = 0; i < 3; i++)
    box(
      p,
      0,
      0.05 + i * 0.055,
      14.4 - i * 0.45,
      27,
      0.1 + i * 0.11,
      0.8,
      M.tile,
    );
  // Quiet paving joints on the photographed forecourt; no temporary event objects.
  for (let x = -23; x <= 20; x += 2)
    box(p, x, 0.012, 29, 0.022, 0.012, 29, M.soffit);
  for (let z = 15; z <= 43; z += 2)
    box(p, -1.5, 0.012, z, 43, 0.012, 0.022, M.soffit);
  sign(p);
  // Rear stair apron faces EN17 across the narrow concrete path.
  for (let i = 0; i < 3; i++)
    box(
      p,
      0,
      0.07 + i * 0.055,
      -14.4 + i * 0.45,
      32,
      0.12 + i * 0.11,
      0.8,
      M.tile,
    );
  for (let z = -11.5; z < 13; z += 3.4)
    beam(p, [-17.7, 3.72, z], [17.7, 3.72, z], 0.13);
}
