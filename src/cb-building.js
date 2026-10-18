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

/** Photo-derived north facade. Hidden rear remains a provisional exterior envelope. */
export function createCB(root, detail) {
  const p = new THREE.Group();
  p.position.set(184, 0, -122);
  p.rotation.y = Math.PI;
  root.add(p);
  // Main footprint remains registered at 37 x 27 m. Steel sits outside the white envelope.
  box(p, 0, 0.16, 0, 37, 0.32, 27, M.tile);
  box(p, 0, 4.05, -0.3, 34.5, 0.35, 24.7, M.soffit);
  // Upper hall: exterior walls only, leaving the entire lower level open between piers.
  box(p, 0, 8.3, -11.8, 34.5, 8.15, 0.28);
  for (const side of [-1, 1]) box(p, side * 17.1, 8.3, 0, 0.28, 8.15, 24);
  box(p, 0, 12.42, 0, 34.7, 0.24, 24.6, M.soffit);
  // Front wall made from piers and spandrels rather than glass painted over solid walls.
  box(p, 0, 4.55, 11.9, 34.4, 0.6, 0.25);
  box(p, 0, 10.3, 11.9, 34.4, 4.1, 0.25);
  const openings = [-12, -5, 2, 9];
  for (let x = -17.2; x < 17.2; x += 0.4) {
    if (!openings.some((c) => Math.abs(x - c) < 1.35))
      box(p, x, 6.6, 11.9, 0.4, 3.7, 0.25);
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
  box(p, 0, 4.1, 13.05, 36.6, 0.22, 2.6);
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
        if (side === -1 && z > 6 && z < 11 && a === 3.7) continue;
        beam(p, [x, a, z], [x, b, z + 3.4], 0.085);
        beam(p, [x, b, z], [x, a, z + 3.4], 0.085);
      }
  }
  // Eastern switchback stair: thin treads keep the space beneath it open.
  stairs(p, -22.2, 9.7, 2.1, 0.28, 2.2, -1, 3.6);
  box(p, -21, 2.2, 5.5, 6, 0.25, 1.4);
  stairs(p, -19.7, 6.1, 2.1, 2.2, 4.2, 1, 3.6);
  box(p, -19.4, 4.2, 10.5, 3.8, 0.25, 1.6);
  box(p, -21, 4.2, -0.6, 6, 0.25, 11);
  box(p, -21, 7.25, 2.5, 6.3, 0.2, 18.8, M.roof);
  for (const x of [-23.5, -18.5])
    for (const z of [-6, 5.4, 11.7]) box(p, x, 3.65, z, 0.3, 7.3, 0.3);
  if (detail) {
    rail(p, [-23.5, -6], [-23.5, 5], 4.35);
    rail(p, [-23.5, 4.9], [-18.5, 4.9], 2.35);
    rail(p, [-20.8, 11.2], [-17.6, 11.2], 4.35);
  }
  if (!detail) return;
  for (const x of openings) {
    box(p, x, 6.6, 11.96, 2.6, 3.7, 0.09, M.dark);
    for (const dx of [-1.3, 0, 1.3])
      box(p, x + dx, 6.6, 12.03, 0.065, 3.7, 0.05, M.trim);
    box(p, x, 6.6, 12.04, 2.6, 0.06, 0.05, M.trim);
  }
  // Balcony is open to the air and its railing sits in front of the wall.
  rail(p, [-17.7, 13.2], [17.7, 13.2], 4.23);
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

  stairs(p, 16, 9.5, 2, 0.28, 4, -1);
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
  // White portal at the foot of the side stair, visible in the additional photos.
  for (const x of [-23.5, -18.5]) box(p, x, 1.85, 13.4, 0.28, 3.7, 0.3);
  box(p, -21, 3.62, 13.4, 5.3, 0.3, 0.4);
}

/** The photographed north wall of EN17. Other faces retain their provisional envelope. */
export function createEN17North(root, detail) {
  const beige = material("#b3a18a"),
    shutter = material("#a29b8c"),
    white = M.wall;
  const p = new THREE.Group();
  root.add(p);
  // Long laboratory hall, with a high ventilated wall rather than two rows of classroom windows.
  box(p, 200, 0.15, -86, 54, 0.3, 29, M.soffit);
  box(p, 200, 3.3, -85.9, 53.6, 6.6, 28.6, white);
  box(p, 200, 3.3, -100.3, 53.6, 6.6, 0.3, beige);
  for (let k = 0; k < 3; k++) {
    const z = -100.5 + ((k + 0.5) * 29) / 3;
    for (const side of [-1, 1]) {
      const roof = box(
        p,
        200,
        7.05,
        z + (side * 29) / 12,
        55,
        0.15,
        Math.hypot(29 / 6, 1.05),
        M.tile,
      );
      roof.rotation.x = side * Math.atan2(1.05, 29 / 6);
    }
  }
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
}
