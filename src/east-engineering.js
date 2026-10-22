import * as THREE from "three";
import { palm } from "./model.js?v=en16-hall2";
import { eastPlanting } from "./east-planting.js";
import { eastCanopies } from "./east-canopies.js";

// EN04/EN11: aerial footprint + May 2019 Street View and 2018/2019 gallery.
// Exterior reconstruction in campus metres. Concealed rooms are not invented.
const material = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.86, ...extra });
const M = {
  ivory: material("#deded2"),
  white: material("#eeeede"),
  trim: material("#c7c9bc"),
  floor: material("#b6b8ac"),
  recess: material("#38443b"),
  glass: material("#526b68", { roughness: 0.34, metalness: 0.3 }),
  frame: material("#777e71", { metalness: 0.35 }),
  blue: material("#728e8d"),
  dark: material("#374943"),
  green: material("#8f9d71"),
  roof: material("#a8b59a"),
  steel: material("#536c62"),
  brown: material("#8b6848"),
  tan: material("#ac9675"),
  gold: material("#c7aa56"),
  black: material("#303d35"),
  lawn: material("#819e65"),
  leaves: material("#517a47"),
  flower: material("#bb8462"),
  soil: material("#867258"),
  vent: material("#8c9385"),
  red: material("#a26559"),
  fan: material("#9aae58"),
  fanShade: material("#7c984b"),
};
for (const m of Object.values(M)) m.shadowSide = THREE.FrontSide;
M.fan.side = M.fanShade.side = THREE.DoubleSide;
function box(p, x, y, z, w, h, d, m = M.ivory) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}
function cylinder(p, x, y, z, r, h, m, n = 12) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, n), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}
function beam(p, a, b, width, m = M.frame) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    v = bv.clone().sub(av);
  const o = box(p, 0, 0, 0, width, v.length(), width, m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return o;
}
function text(p, lines, x, y, z, w, h, rotation = 0, color = "#26372f") {
  const canvas = document.createElement("canvas");
  canvas.width = lines.length === 1 ? 256 : 1536;
  canvas.height = 256;
  const c = canvas.getContext("2d");
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = color;
  lines.forEach((line, i) => {
    c.font = `600 ${lines.length === 1 ? 210 : i ? 48 : 76}px "IBM Plex Sans Thai", sans-serif`;
    c.fillText(
      line,
      canvas.width / 2,
      lines.length === 1 ? 133 : i ? 188 : 81,
      canvas.width * 0.96,
    );
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const o = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      roughness: 0.9,
    }),
  );
  o.position.set(x, y, z);
  o.rotation.y = rotation;
  p.add(o);
}
function window(p, x, y, z, w, h, detail = true, glazing = M.glass) {
  box(p, x, y, z, w, h, 0.1, glazing);
  if (!detail) return;
  for (const xx of [-w / 2, 0, w / 2])
    box(p, x + xx, y, z + 0.065, 0.045, h + 0.08, 0.06, M.frame);
  for (const yy of [-h / 2, h / 2, h * 0.22])
    box(p, x, y + yy, z + 0.066, w + 0.08, 0.045, 0.06, M.frame);
  for (let xx = -w / 2 + 0.22; xx < w / 2; xx += 0.24)
    box(p, x + xx, y + h * 0.34, z + 0.075, 0.018, h * 0.3, 0.025, M.frame);
}
function aircon(p, x, y, z) {
  box(p, x, y, z, 0.92, 0.67, 0.38, M.trim);
  cylinder(p, x, y, z + 0.22, 0.23, 0.04, M.vent, 12).rotation.x = Math.PI / 2;
  for (let i = 0; i < 5; i++)
    box(
      p,
      x - 0.34,
      y - 0.23 + i * 0.11,
      z + 0.21,
      0.18,
      0.025,
      0.025,
      M.frame,
    );
  beam(p, [x - 0.4, y - 0.42, z - 0.04], [x + 0.4, y - 0.42, z - 0.04], 0.045);
}
function pitchedRoof(p, w, d, eave, rise, m = M.roof) {
  for (const side of [-1, 1]) {
    const o = box(
      p,
      0,
      eave + rise / 2,
      (side * d) / 4,
      w,
      0.13,
      Math.hypot(d / 2, rise),
      m,
    );
    o.rotation.x = side * Math.atan2(rise, d / 2);
  }
  box(p, 0, eave + rise, 0, w, 0.16, 0.22, M.trim);
  for (let x = -w / 2; x <= w / 2; x += 0.8)
    for (const side of [-1, 1])
      beam(
        p,
        [x, eave + 0.08, (side * d) / 2],
        [x, eave + rise + 0.08, 0],
        0.025,
        M.trim,
      );
}
function curvedCanopy(p, w, d, eave, rise) {
  const vertices = [],
    indices = [],
    n = 20;
  for (let i = 0; i <= n; i++) {
    const z = -d / 2 + (d * i) / n,
      y = eave + Math.sin((i / n) * Math.PI) * rise;
    vertices.push(-w / 2, y, z, w / 2, y, z);
    if (i < n) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  const roofMaterial = M.green.clone();
  roofMaterial.side = THREE.DoubleSide;
  const o = new THREE.Mesh(g, roofMaterial);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  for (let x = -w / 2; x <= w / 2; x += 0.8)
    for (let i = 0; i < n; i++) {
      const a = i / n,
        b = (i + 1) / n;
      beam(
        p,
        [x, eave + Math.sin(a * Math.PI) * rise + 0.025, -d / 2 + d * a],
        [x, eave + Math.sin(b * Math.PI) * rise + 0.025, -d / 2 + d * b],
        0.022,
        M.trim,
      );
    }
}
function corridorWing(root, { x, z, w, d, h, rotation = 0 }, detail) {
  const p = new THREE.Group();
  p.position.set(x, 0, z);
  p.rotation.y = rotation;
  root.add(p);
  const floors = 5,
    step = h / floors,
    front = d / 2 - 0.35,
    back = -d / 2 + 0.35,
    wallZ = front - 2.2;
  // Two-metre deep real corridor: dark recess behind parapet, not glass pasted on the outer face.
  box(p, 0, h / 2, (back + wallZ) / 2, w - 0.65, h, wallZ - back, M.ivory);
  for (let f = 0; f < floors; f++) {
    const y = 0.32 + f * step;
    box(p, 0, y, 0, w - 0.3, 0.24, d - 0.35, M.floor);
    box(p, 0, y + step - 0.19, front - 1.0, w - 0.25, 0.3, 2.35, M.white);
    box(p, 0, y + 0.59, front, w - 0.35, 0.66, 0.18, M.ivory);
    box(p, 0, y + step - 0.48, front + 0.19, w - 0.3, 0.48, 0.08, M.blue);
    if (detail) {
      box(p, 0, y + 2.0, wallZ + 0.012, w - 0.65, 2.65, 0.025, M.recess);
      for (let q = 0; q < 5; q++)
        box(
          p,
          0,
          y + step - 0.68 + q * 0.085,
          front + 0.235,
          w - 0.4,
          0.018,
          0.015,
          M.trim,
        );
      box(p, 0, y + 1.12, front + 0.02, w - 0.35, 0.055, 0.065, M.frame);
      for (let xx = -w / 2 + 2.3; xx < w / 2 - 1; xx += 4.4) {
        window(p, xx, y + 1.95, wallZ + 0.055, 3.35, 1.72, true, M.dark);
        // Rear bay treatment is provisional where vegetation blocks Street View.
        const r = new THREE.Group();
        r.position.set(xx, y + 1.9, back - 0.065);
        r.rotation.y = Math.PI;
        p.add(r);
        window(r, 0, 0, 0, 3.1, 1.65);
        box(r, 0, 1.02, 0.34, 3.45, 0.12, 0.9, M.blue);
        if (f > 0 && Math.round(xx) % 3 === 0) aircon(r, 1.2, -0.6, 0.32);
      }
      for (let xx = -w / 2 + 0.3; xx <= w / 2; xx += 4.4)
        box(p, xx, y + step / 2, front + 0.08, 0.3, step, 0.65, M.white);
    }
  }
  for (const side of [-1, 1])
    box(p, side * (w / 2 - 0.2), h / 2, 0, 0.4, h, d - 0.2, M.ivory);
  box(p, 0, h + 0.1, 0, w, 0.24, d, M.trim);
  for (const side of [-1, 1])
    box(p, 0, h + 0.48, side * (d / 2 - 0.16), w, 0.65, 0.23, M.ivory);
  for (const side of [-1, 1])
    box(p, side * (w / 2 - 0.16), h + 0.48, 0, 0.23, 0.65, d, M.ivory);
  if (detail) {
    box(p, 0, h + 0.26, 0, w - 0.9, 0.04, d - 0.9, M.floor);
    box(p, 0, h + 0.87, front, w, 0.1, 0.35, M.trim);
    for (const xx of [-w / 2 + 0.6, w / 2 - 0.6])
      box(p, xx, h / 2, back - 0.25, 0.09, h, 0.09, M.frame);
  }
}
function electricalOffice(root, detail) {
  // Three-storey entrance projection on the inner west face of the tall east wing.
  const p = new THREE.Group();
  p.position.set(245, 0, 22);
  p.rotation.y = -Math.PI / 2;
  root.add(p);
  const w = 25,
    d = 18,
    h = 11.6,
    front = d / 2;
  box(p, 0, h / 2, -0.15, w - 0.6, h, d - 0.4);
  box(p, 0, 0.45, 0, w, 0.75, d, M.tan);
  box(p, 0, h + 0.16, 0, w + 0.35, 0.32, d + 0.25, M.trim);
  box(p, 0, h - 0.18, front - 1.35, w, 0.25, 2.6, M.dark);
  for (const x of [-12, -6, 0, 6, 12])
    box(p, x, h / 2, front + 0.1, 0.55, h, 0.7, M.white);
  for (let f = 0; f < 3; f++)
    for (let k = 0; k < 4; k++) {
      const xx = -9 + k * 6;
      if (f === 0 && (k === 1 || k === 2)) continue;
      window(p, xx, 2.0 + f * 3.5, front + 0.07, 3.55, 1.8, detail);
      if (detail && f === 1)
        for (let a = -1.5; a <= 1.5; a += 0.22)
          box(p, xx + a, 5.5, front + 0.17, 0.022, 1.83, 0.03, M.frame);
    }
  const entrance = new THREE.Group();
  entrance.position.x = 3;
  p.add(entrance);
  // Permanent portal with a dark glazed door, six broad brown entrance treads.
  for (const side of [-1, 1])
    box(entrance, side * 3.25, 2.8, front + 1.75, 0.65, 4.25, 3.5, M.white);
  box(entrance, 0, 4.92, front + 1.75, 7.5, 0.68, 3.8, M.white);
  box(entrance, 0, 5.33, front + 1.8, 7.85, 0.17, 4.05, M.trim);
  window(entrance, 0, 2.2, front + 0.12, 3.8, 2.9, detail);
  for (let k = 0; k < 6; k++)
    box(
      entrance,
      0,
      0.1 + (6 - k) * 0.115,
      front + 2 + k * 0.37,
      6.2,
      0.22,
      1.05,
      M.tan,
    );
  const pyramid = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.8, 4), M.blue);
  pyramid.position.set(0, 5.83, front + 1.5);
  pyramid.rotation.y = Math.PI / 4;
  entrance.add(pyramid);
  if (detail) {
    text(
      entrance,
      ["ภาควิชาวิศวกรรมไฟฟ้า", "DEPARTMENT OF ELECTRICAL ENGINEERING"],
      0,
      4.97,
      front + 3.68,
      6.8,
      0.62,
    );
    for (const side of [-1, 1]) {
      box(entrance, side * 4.1, 0.65, front + 3.35, 1.55, 1.2, 1.6, M.tan);
      const crown = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 10, 7),
        M.leaves,
      );
      crown.position.set(side * 4.1, 1.7, front + 3.35);
      entrance.add(crown);
    }
  }
}
export function createComputerElectrical(root, detail) {
  corridorWing(root, { x: 232, z: -17, w: 84, d: 16, h: 18 }, detail);
  // Closed stair/service bays at the western end differ from the open corridor bays.
  box(root, 198, 9, -9.25, 15.5, 18, 0.22, M.ivory);
  for (let f = 0; f < 5; f++)
    for (const x of [194, 201.6]) {
      window(root, x, 2.1 + f * 3.6, -9.08, 3.6, 1.55, detail);
      box(root, x, 3.28 + f * 3.6, -8.92, 4.15, 0.42, 0.16, M.blue);
    }
  if (detail) {
    // Blank west end wall carrying the computer department name, as photographed.
    text(
      root,
      ["ภาควิชาวิศวกรรมคอมพิวเตอร์", "DEPARTMENT OF COMPUTER ENGINEERING"],
      189.92,
      4.8,
      -17,
      12,
      1.1,
      -Math.PI / 2,
    );
    box(root, 190.1, 4, -23, 0.1, 8, 0.1, M.frame);
    // Separate computer department entrance on the inner long facade.
    window(root, 217, 1.6, -8.48, 4.0, 2.9, true);
    for (const x of [214.3, 219.7])
      box(root, x, 1.9, -7.7, 0.38, 3.4, 2.7, M.white);
    box(root, 217, 3.76, -7.7, 6.2, 0.5, 2.9, M.white);
    text(
      root,
      ["ภาควิชาวิศวกรรมคอมพิวเตอร์", "DEPARTMENT OF COMPUTER ENGINEERING"],
      217,
      3.78,
      -6.2,
      5.8,
      0.58,
    );
    for (let i = 0; i < 4; i++)
      box(
        root,
        217,
        0.12 + (4 - i) * 0.09,
        -6.4 + i * 0.32,
        5.7,
        0.18,
        0.8,
        M.tan,
      );
  }
}
export function createElectricalConnected(root, detail) {
  corridorWing(
    root,
    { x: 263, z: 24, w: 66, d: 22, h: 18, rotation: -Math.PI / 2 },
    detail,
  );
  electricalOffice(root, detail);
  createElectricalOld(root, detail);
  // Low enclosed connection to the old two-storey teaching building.
  box(root, 255, 1.75, 53, 8, 3.5, 8, M.white);
  box(root, 255, 3.6, 53, 8.2, 0.22, 8.2, M.trim);
  if (detail) {
    box(root, 265, 18.55, 36, 8, 0.6, 8, M.floor);
    for (let i = 0; i < 3; i++)
      box(root, 265, 19.05, 33 + i * 2.7, 2, 0.7, 1.6, M.trim);
  }
}
export function createElectricalOld(root, detail) {
  const p = new THREE.Group();
  p.position.set(221, 0, 53);
  root.add(p);
  const w = 60,
    d = 15,
    h = 6.7;
  // Light two-storey panel building. North side has an open upper access balcony.
  // Ground-floor through passage toward the south-side car park.
  const passageX = 14.3, passageWidth = 4.7, passageHeight = 3.15;
  const leftEdge = passageX - passageWidth / 2;
  const rightEdge = passageX + passageWidth / 2;
  const halfWall = (w - 0.8) / 2;
  box(p, (leftEdge - halfWall) / 2, h / 2, 1,
    leftEdge + halfWall, h, d - 3.2, M.white);
  box(p, (rightEdge + halfWall) / 2, h / 2, 1,
    halfWall - rightEdge, h, d - 3.2, M.white);
  box(p, passageX, (h + passageHeight) / 2, 1,
    passageWidth, h - passageHeight, d - 3.2, M.white);
  box(p, passageX, 0.20, 1.5, passageWidth, 0.12, 29, M.floor);
  for (const y of [0.25, 3.45, 6.7])
    box(p, 0, y, -0.3, w, 0.18, d - 0.2, M.trim);
  for (const x of [-29.7, 29.7])
    box(p, x, 3.35, 0, 0.25, 6.7, d - 0.2, M.white);
  pitchedRoof(p, w + 0.4, d + 0.25, h + 0.12, 1.45, M.roof);
  for (const side of [-1, 1]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          (side * w) / 2,
          h + 0.12,
          -d / 2,
          (side * w) / 2,
          h + 0.12,
          d / 2,
          (side * w) / 2,
          h + 1.57,
          0,
        ],
        3,
      ),
    );
    g.setIndex(side === -1 ? [0, 1, 2] : [0, 2, 1]);
    g.computeVertexNormals();
    const triangle = new THREE.Mesh(g, M.white);
    triangle.castShadow = true;
    p.add(triangle);
  }
  if (!detail) return;
  // Exposed longitudinal balcony, glazed classroom doors behind it.
  for (let x = -28; x <= 28; x += 4.7) {
    const north = new THREE.Group();
    north.position.set(x, 0, -4.96);
    north.rotation.y = Math.PI;
    p.add(north);
    const inPassage = Math.abs(x - passageX) < passageWidth / 2;
    if (!inPassage) window(north, 0, 1.75, 0, 3.65, 2.5);
    window(north, 0, 5.0, 0, 3.65, 2.5);
    box(p, x, 5.1, -7.05, 0.09, 3.2, 0.09, M.frame);
    aircon(p, x, 4.5, 7.05);
    if (!inPassage) window(p, x, 1.75, 7.02, 3.15, 1.7);
    window(p, x, 5.02, 7.02, 3.15, 1.7);
  }
  for (const y of [3.62, 4.4, 4.55])
    box(p, 0, y, -7.08, w - 0.6, 0.055, 0.07, M.frame);
  // Panel joints, end-wall ladder and visible AC rather than uniform generic windows.
  for (let z = -6.6; z <= 6.8; z += 0.48)
    box(p, -29.86, 3.4, z, 0.025, 6.35, 0.018, M.trim);
  for (const z of [-0.28, 0.28])
    box(p, -30.05, 4.85, z, 0.07, 4.9, 0.07, M.frame);
  for (let y = 2.5; y < 7.4; y += 0.4)
    box(p, -30.08, y, 0, 0.06, 0.06, 0.62, M.frame);
  const end = new THREE.Group();
  end.position.set(-30.12, 0, 0);
  end.rotation.y = -Math.PI / 2;
  p.add(end);
  box(end, -3.3, 2.1, 0.02, 1.3, 1.65, 0.06, M.dark);
  text(end, ["11"], -3.3, 2.1, 0.08, 1.0, 1.4, 0, "#e6e3cc");
  aircon(end, 2.2, 4.6, 0.2);
  // Fixed covered pavement around the gable end and along the northern classroom face.
  const north = eastCanopies.oldNorth,
    west = eastCanopies.oldWest;
  const northRoof = box(
    p,
    north.x - 221,
    2.82,
    north.z - 53,
    north.w,
    0.1,
    north.d,
    M.trim,
  );
  northRoof.rotation.x = -0.06;
  for (let x = -29; x <= 29; x += 4.8)
    box(p, x, 1.42, -10.3, 0.085, 2.84, 0.085, M.frame);
  box(p, west.x - 221, 2.83, west.z - 53, west.w, 0.1, west.d, M.trim);
  for (const z of [-9, 0, 9])
    box(p, -32.1, 1.42, z, 0.085, 2.84, 0.085, M.frame);
  for (let x = -26; x < 25; x += 7) {
    box(p, x, 0.8, -8.2, 2.1, 0.09, 0.7, M.brown);
    for (const dx of [-0.8, 0.8])
      box(p, x + dx, 0.4, -8.2, 0.07, 0.8, 0.5, M.frame);
  }
}
// Side parking south of the old EN11 block, from user aerial / Street View.
// Dimensions are approximate; the west mouth remains open to the campus road.
function electricalSideParking(root) {
  const c = eastCanopies.electricalParking;
  const p = new THREE.Group();
  p.name = "EN11 south side car park";
  p.position.set(c.x, 0, c.z);
  root.add(p);
  const roof = box(p, 0, 3.18, 0, c.w, 0.12, c.d, M.roof);
  roof.rotation.x = -0.10;
  // Red steel frames and diagonal knee braces under a shallow mono-pitch roof.
  for (let x = -28; x <= 28; x += 7) {
    for (const z of [-2.7, 2.7]) {
      const h = 3.12 + z * 0.10;
      box(p, x, h / 2, z, 0.11, h, 0.11, M.red);
      box(p, x, 0.14, z, 0.38, 0.24, 0.38, M.floor);
      beam(p, [x, h - 0.85, z], [x, 3.08, z - Math.sign(z) * 1.25], 0.065, M.red);
    }
    beam(p, [x, 2.84, -3.15], [x, 3.47, 3.15], 0.10, M.red);
  }
  for (const z of [-2.9, 0, 2.9])
    box(p, 0, 3.1 + z * 0.10, z, c.w, 0.08, 0.08, M.red);
  for (let x = -28.5; x < 29; x += 0.75) {
    const rib = box(p, x, 3.26, 0, 0.025, 0.025, c.d, M.trim);
    rib.rotation.x = -0.10;
  }
  // Low covered walkway follows the south facade, separate from the car roof.
  const walk = eastCanopies.oldSouth;
  box(root, walk.x, 0.11, walk.z, walk.w, 0.16, walk.d, M.tan);
  box(root, walk.x, 2.86, walk.z, walk.w + 0.3, 0.12, walk.d + 0.3, M.trim);
  for (let x = 192; x <= 250; x += 4.8)
    box(root, x, 1.43, 63, 0.10, 2.86, 0.10, M.blue);
  // Short return along the street stops before the driveway mouth.
  box(root, 189.8, 2.86, 65, 2.25, 0.12, 3, M.trim);
  box(root, 189.8, 1.43, 66.2, 0.10, 2.86, 0.10, M.blue);
  for (const [x, z, w, d] of [[208, 65.6, 34, 3.1], [222, 83, 58, 3.5]])
    box(root, x, 0.09, z, w, 0.08, d, M.soil);
  // Small drain beside the access, clear of the driving lane.
  box(root, 189, 0.08, 73.1, 1.7, 0.07, 0.55, M.dark);
  for (let x = 188.2; x < 189.9; x += 0.14)
    box(root, x, 0.13, 73.1, 0.04, 0.035, 0.5, M.frame);
}
export function createEastCourtyard(scene) {
  const root = new THREE.Group();
  root.name = "EN04-EN11 permanent courtyard";
  electricalSideParking(root);
  scene.add(root);
  // Lawn island occupies the space between the two circulation lanes, as in the aerial.
  box(root, 207, 0.19, 19, 27, 0.25, 12.4, M.trim);
  box(root, 207, 0.33, 19, 26.4, 0.08, 11.8, M.lawn);
  for (let z = 13.3, i = 0; z < 25; z += 1.2, i++)
    box(root, 193.5, 0.27, z, 0.24, 0.2, 1.16, i % 2 ? M.white : M.red);
  for (const z of [12.8, 25.2])
    for (let x = 194, i = 0; x < 220; x += 1.3, i++)
      box(root, x, 0.27, z, 1.25, 0.2, 0.22, i % 2 ? M.white : M.dark);
  // Small permanent circular basin behind the sign, visible from inside the court.
  cylinder(root, 219, 0.35, 21.8, 1.22, 0.4, M.tan, 32);
  cylinder(root, 219, 0.57, 21.8, 1.02, 0.025, M.lawn, 32);
  const basinRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.11, 6, 32),
    M.trim,
  );
  basinRim.rotation.x = Math.PI / 2;
  basinRim.position.set(219, 0.58, 21.8);
  root.add(basinRim);
  for (const [x, z, angle] of [
    [202, 4, 0],
    [222, 4, 0],
    [202, 33, Math.PI],
    [222, 33, Math.PI],
  ]) {
    const p = new THREE.Group();
    p.position.set(x, 0.078, z);
    p.rotation.y = angle;
    root.add(p);
    box(p, -0.2, 0, 0, 1.4, 0.012, 0.24, M.gold);
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [0.9, 0, 0, -0.1, 0, -0.6, -0.1, 0, 0.6],
        3,
      ),
    );
    g.setIndex([0, 1, 2]);
    g.computeVertexNormals();
    p.add(new THREE.Mesh(g, M.gold));
  }
  for (const t of eastPlanting) {
    if (t.kind === "palm") {
      palm(root, t.x, t.z, t.h, t.x);
      continue;
    }
    const p = new THREE.Group();
    p.position.set(t.x, 0, t.z);
    root.add(p);
    if (t.kind === "fan-cluster") {
      for (let k = 0; k < 3; k++) {
        const x = (k - 1) * 0.4,
          z = (k % 2) * 0.35,
          h = t.h + (k - 1) * 0.6;
        cylinder(p, x, h / 2, z, 0.065, h, M.brown, 8);
        for (let n = 0; n < 9; n++) {
          const a = (n / 9) * Math.PI * 2,
            dx = Math.cos(a),
            dz = Math.sin(a);
          const hub = [x + dx * 0.7, h + 0.1, z + dz * 0.7];
          beam(p, [x, h - 0.1, z], hub, 0.035, M.fanShade);
          const v = [];
          for (let j = 0; j < 7; j++) {
            const a0 = a - 0.9 + j * 0.3,
              a1 = a0 + 0.3;
            v.push(
              ...hub,
              hub[0] + Math.cos(a0) * 1.05,
              h + 0.25,
              hub[2] + Math.sin(a0) * 1.05,
              hub[0] + Math.cos(a1) * 1.05,
              h + 0.05,
              hub[2] + Math.sin(a1) * 1.05,
            );
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
          g.computeVertexNormals();
          const m = n % 2 ? M.fan : M.fanShade;
          const leaf = new THREE.Mesh(g, m);
          leaf.castShadow = true;
          p.add(leaf);
        }
      }
    } else if (t.kind === "column-tree") {
      cylinder(p, 0, t.h * 0.22, 0, 0.1, t.h * 0.44, M.brown, 8);
      for (let k = 0; k < 4; k++) {
        const o = new THREE.Mesh(
          new THREE.ConeGeometry(1.1 - k * 0.15, t.h * 0.52, 9),
          M.leaves,
        );
        o.position.y = t.h * 0.4 + k * t.h * 0.14;
        o.castShadow = true;
        p.add(o);
      }
    } else {
      cylinder(
        p,
        0,
        t.h * 0.32,
        0,
        t.kind === "shrub-tree" ? 0.1 : 0.25,
        t.h * 0.64,
        M.brown,
        10,
      );
      const r = t.kind === "shrub-tree" ? 1.15 : 3.8;
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2,
          o = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), M.leaves);
        o.scale.set(1, 0.7, 1);
        o.position.set(
          Math.cos(a) * r * 0.42,
          t.h * 0.72 + (k % 2) * r * 0.3,
          Math.sin(a) * r * 0.42,
        );
        o.castShadow = o.receiveShadow = true;
        p.add(o);
      }
    }
  }
  // Flowerbed and black/gold department sign face the road to the west.
  box(root, 201.1, 0.48, 19, 3.5, 0.27, 9.3, M.soil);
  for (let x = 199.6; x <= 202.6; x += 0.62)
    for (let z = 15.9; z <= 22.1; z += 0.7) {
      const o = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 7, 5),
        Math.round(x * 10 + z * 10) % 3 ? M.leaves : M.flower,
      );
      o.position.set(x, 0.7, z);
      root.add(o);
    }
  box(root, 203.2, 1.57, 19, 0.28, 1.5, 9.2, M.black);
  const labelGroup = new THREE.Group();
  labelGroup.rotation.y = -Math.PI / 2;
  labelGroup.position.set(203.03, 1.58, 19);
  root.add(labelGroup);
  text(
    labelGroup,
    ["ภาควิชาวิศวกรรมไฟฟ้า", "DEPARTMENT OF ELECTRICAL ENGINEERING"],
    0,
    0,
    0,
    8.8,
    1.25,
    0,
    "#c9ae61",
  );
  for (const z of [14.1, 23.9]) {
    box(root, 203.2, 1.4, z, 0.55, 2.4, 0.55, M.brown);
    for (let y = 0.4; y < 2.6; y += 0.2)
      box(root, 203.2, y, z, 0.6, 0.035, 0.6, M.trim);
    cylinder(root, 203.2, 2.68, z, 0.32, 0.16, M.frame);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 8),
      M.white,
    );
    globe.position.set(203.2, 2.96, z);
    root.add(globe);
  }
  // Concrete joints stop at the planted island and do not extend over the public road.
  for (let x = 190; x <= 256; x += 6)
    for (const [z, d] of [
      [1.0, 14],
      [36, 14],
    ])
      box(root, x, 0.067, z, 0.025, 0.012, d, M.tan);
  // Main green motorcycle shelter, detached from the classroom building.
  const shelter = new THREE.Group();
  const mc = eastCanopies.motorcycle,
    cpe = eastCanopies.computer,
    coveredLink = eastCanopies.link;
  shelter.position.set(mc.x, 0, mc.z);
  root.add(shelter);
  curvedCanopy(shelter, mc.w, mc.d, 2.65, 0.7);
  for (let x = -16; x <= 16; x += 4)
    for (const z of [-2.8, 2.8])
      box(shelter, x, 1.35, z, 0.1, 2.7, 0.1, M.brown);
  // Permanent north shade frame seen in the May 2019 imagery.
  for (let x = 192; x <= 212; x += 4) {
    box(root, x, 1.4, -1.9, 0.09, 2.8, 0.09, M.steel);
    box(root, x, 2.83, -2.3, 0.07, 0.08, 5.3, M.steel);
  }
  box(root, cpe.x, 2.82, cpe.z, cpe.w, 0.045, cpe.d, M.green);
  for (const z of [-4.9, 0.3])
    box(root, 201.5, 2.85, z, 21, 0.08, 0.08, M.steel);
  // Low covered connection from the office to the motorcycle shelter.
  const link = new THREE.Group();
  link.position.set(coveredLink.x, 0, coveredLink.z);
  root.add(link);
  pitchedRoof(link, coveredLink.w, coveredLink.d, 2.65, 0.36, M.green);
  for (const x of [-4.5, 4.5])
    for (const z of [-1.1, 1.1]) box(link, x, 1.35, z, 0.1, 2.7, 0.1, M.brown);
  // Drain grates at the two courtyard mouths, fixed street furniture only.
  for (const z of [4, 35]) {
    box(root, 189.3, 0.08, z, 1.5, 0.08, 1, M.dark);
    for (let x = 188.65; x < 190; x += 0.13)
      box(root, x, 0.13, z, 0.035, 0.03, 0.93, M.frame);
  }
  return root;
}
