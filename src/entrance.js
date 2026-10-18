import * as THREE from "three";
const material = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extra });
const M = {
  tread: material("#b1a18a"),
  riser: material("#9f8c73"),
  landing: material("#b6a78f"),
  joint: material("#c5bba7"),
  wall: material("#a08b74"),
  rail: material("#adb5b2", { metalness: 0.78, roughness: 0.22 }),
  sign: material("#e7e4d9"),
  soil: material("#766a4e"),
  grass: material("#718751"),
  leaf: material("#4c7144"),
  flower: material("#976b78"),
  trunk: material("#837154"),
  dark: material("#46514a"),
  red: material("#a94b46"),
  blue: material("#354974"),
  yellow: material("#d5b75b"),
  white: material("#e4e1d7"),
};
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
function cylinder(p, x, y, z, r, h, m, n = 20) {
  return mesh(p, new THREE.CylinderGeometry(r, r, h, n), m, x, y, z);
}
function beam(p, a, b, r = 0.035, m = M.rail) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    dir = bv.clone().sub(av),
    o = mesh(p, new THREE.CylinderGeometry(r, r, dir.length(), 8), m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return o;
}
function railing(p, a, b, baseA, baseB) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
    posts = Math.max(1, Math.ceil(length / 1.7));
  for (let i = 0; i <= posts; i++) {
    const t = i / posts,
      x = THREE.MathUtils.lerp(a[0], b[0], t),
      z = THREE.MathUtils.lerp(a[1], b[1], t),
      y = THREE.MathUtils.lerp(baseA, baseB, t);
    cylinder(p, x, y + 0.52, z, 0.035, 1.04, M.rail, 8);
    box(p, x, y + 0.035, z, 0.15, 0.07, 0.15, M.rail);
  }
  for (const height of [0.35, 0.68, 1.04])
    beam(
      p,
      [a[0], baseA + height, a[1]],
      [b[0], baseB + height, b[1]],
      height === 1.04 ? 0.045 : 0.025,
    );
}
function planter(p, x, z) {
  cylinder(p, x, 1.87, z, 0.85, 0.54, M.wall);
  cylinder(p, x, 2.15, z, 0.79, 0.04, M.soil);
  cylinder(p, x, 2.5, z, 0.075, 0.8, M.trunk, 10);
  for (let k = 0; k < 7; k++) {
    const a = k * 2.4,
      r = k ? 0.47 : 0;
    const o = mesh(
      p,
      new THREE.IcosahedronGeometry(0.72, 2),
      M.leaf,
      x + Math.cos(a) * r,
      2.9 + (k % 3) * 0.12,
      z + Math.sin(a) * r,
    );
    o.scale.y = 0.75;
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    mesh(
      p,
      new THREE.IcosahedronGeometry(0.08, 1),
      M.flower,
      x + Math.cos(a) * 0.94,
      2.95 + (k % 3) * 0.13,
      z + Math.sin(a) * 0.94,
    );
  }
}
function flag(p, x, z, base, yellow) {
  cylinder(p, x, base + 1.6, z, 0.025, 3.2, M.rail, 8);
  if (yellow) {
    box(p, x, base + 2.7, z + 0.43, 0.025, 0.64, 0.8, M.yellow);
    return;
  }
  const heights = [0.1, 0.1, 0.22, 0.1, 0.1],
    mats = [M.red, M.white, M.blue, M.white, M.red];
  let y = base + 3.02;
  heights.forEach((h, i) => {
    box(p, x, y - h / 2, z + 0.43, 0.025, h, 0.8, mats[i]);
    y -= h;
  });
}
function signTexture() {
  const c = document.createElement("canvas");
  c.width = 1536;
  c.height = 320;
  const g = c.getContext("2d");
  g.fillStyle = "#e7e4d9";
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#d4d0c3";
  g.lineWidth = 10;
  g.strokeRect(17, 17, 1502, 286);
  g.fillStyle = "#303a33";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = 'italic 600 152px "IBM Plex Sans Thai",sans-serif';
  g.fillText("ตึกเพียรวิจิตร", 768, 168);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
}
function gearStand(p) {
  const g = new THREE.Group();
  g.position.set(-32.3, 1.61, 0.1);
  g.rotation.y = -Math.PI / 2;
  p.add(g);
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#e6dfcc";
  ctx.fillRect(0, 0, 512, 512);
  ctx.translate(256, 256);
  ctx.fillStyle = "#8d514c";
  ctx.beginPath();
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2,
      r = i % 8 < 4 ? 160 : 135;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(0, 0, 65, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  mesh(
    g,
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide }),
    0,
    1.35,
    0.025,
  );
  for (const x of [-0.97, 0.97]) {
    box(g, x, 1.2, 0, 0.065, 2.4, 0.065, M.white);
    beam(g, [x, 2.2, 0], [x, 0, -0.8], 0.04, M.white);
  }
  box(g, 0, 0.35, 0, 2, 0.06, 0.06, M.white);
}
export function createEntrance(parent) {
  const group = new THREE.Group();
  group.name = "Main entrance: broad stair, landing, ramp and sign";
  group.position.z = 11.5;
  parent.add(group);
  const bottomX = -39,
    topX = -33.8,
    frontZ = 0.5,
    backZ = 23.5,
    width = backZ - frontZ,
    centerZ = (frontZ + backZ) / 2,
    height = 1.6,
    count = 10,
    tread = (topX - bottomX) / count;
  // Ten broad stone treads rise from the roadside footpath to the sign's continuous upper landing.
  for (let i = 0; i < count; i++) {
    const top = ((i + 1) * height) / count,
      x = bottomX + (i + 0.5) * tread;
    box(group, x, top / 2, centerZ, tread + 0.012, top, width, M.riser);
    box(
      group,
      x - 0.025,
      top + 0.012,
      centerZ,
      tread + 0.07,
      0.045,
      width + 0.04,
      M.tread,
    );
    box(
      group,
      x - 0.065,
      top + 0.038,
      centerZ,
      0.025,
      0.008,
      width - 0.15,
      M.joint,
    );
  }
  box(group, -25.65, 0.8, 12, 16.3, 1.6, 23, M.wall);
  box(group, -25.65, 1.62, 12, 16.3, 0.08, 23, M.landing);
  for (let z = 1; z < 24; z += 0.8)
    box(group, -25.7, 1.664, z, 16.15, 0.006, 0.013, M.joint);
  for (let x = -33.5; x < -17.7; x += 0.8)
    box(group, x, 1.666, 12, 0.013, 0.006, 22.9, M.joint);
  // The broad central stair is left open. Handrails run on its two outside edges and along the side ramp.
  railing(group, [bottomX, frontZ - 0.12], [topX, frontZ - 0.12], 0.13, height);
  railing(group, [bottomX, backZ + 0.12], [topX, backZ + 0.12], 0.13, height);
  railing(group, [topX, frontZ - 0.12], [-23, frontZ - 0.12], height, height);
  railing(group, [topX, backZ + 0.12], [-24, backZ + 0.12], height, height);
  const rampStart = -39,
    rampEnd = -23.5,
    rampZ = 25.9,
    rampWidth = 2.2,
    len = rampEnd - rampStart;
  const v = [
    rampStart,
    0,
    rampZ - rampWidth / 2,
    rampEnd,
    height,
    rampZ - rampWidth / 2,
    rampEnd,
    height,
    rampZ + rampWidth / 2,
    rampStart,
    0,
    rampZ - rampWidth / 2,
    rampEnd,
    height,
    rampZ + rampWidth / 2,
    rampStart,
    0,
    rampZ + rampWidth / 2,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  const ramp = mesh(group, geo, M.tread);
  ramp.material.side = THREE.DoubleSide;
  for (const zz of [rampZ - rampWidth / 2, rampZ + rampWidth / 2])
    railing(group, [rampStart, zz], [rampEnd, zz], 0.03, height);
  box(group, -20.8, 0.8, 25.25, 5.5, 1.6, 3.5, M.wall);
  box(group, -20.8, 1.63, 25.25, 5.5, 0.07, 3.5, M.landing);
  // Keep the everyday name board without the temporary graduation arch seen in newer event photos.
  box(group, -32.1, 2.9, 12.2, 0.32, 1.55, 9.3, M.sign);
  for (const z of [8.7, 15.7])
    cylinder(group, -32.1, 1.94, z, 0.12, 0.65, M.sign);
  const name = mesh(
    group,
    new THREE.PlaneGeometry(9.05, 1.4),
    signTexture(),
    -32.27,
    2.9,
    12.2,
  );
  name.rotation.y = -Math.PI / 2;
  planter(group, -32.1, 5.7);
  planter(group, -32.1, 18.8);
  gearStand(group);
  for (const z of [2.2, 22.2]) {
    cylinder(group, -33, 2.03, z, 0.075, 0.85, M.dark);
    cylinder(group, -33, 2.48, z, 0.095, 0.09, M.yellow);
  }
  flag(group, -38.5, 0.05, 0.2, false);
  flag(group, -37.2, 24.0, 0.6, true);
  // The tactile strip follows the footpath; grass and the drain stay beside the ramp rather than across the entrance.
  box(group, -41.1, 0.09, 12.0, 2.6, 0.15, 25.5, M.landing);
  box(group, -41.45, 0.174, 12, 0.33, 0.018, 25.3, M.yellow);
  for (let z = -0.4; z < 24.7; z += 0.19)
    for (const x of [-41.55, -41.44, -41.33])
      cylinder(group, x, 0.19, z, 0.02, 0.023, M.yellow, 6);
  box(group, -31, 0.12, 29.1, 20, 0.2, 3, M.grass);
  box(group, -31, 0.13, 27.45, 20, 0.16, 0.35, M.soil);
  return {
    group,
    heightAt(x, z) {
      z -= group.position.z;
      if (z >= frontZ && z <= backZ) {
        if (x >= bottomX && x < topX)
          return Math.min(
            height,
            ((Math.floor((x - bottomX) / tread) + 1) * height) / count,
          );
        if (x >= topX && x <= -17.5) return height;
      }
      if (z > 24.7 && z < 27.1) {
        if (x >= rampStart && x < rampEnd)
          return (height * (x - rampStart)) / len;
        if (x >= rampEnd && x <= -18) return height;
      }
      return 0;
    },
  };
}
