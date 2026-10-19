import { en13Site } from "./en13-layout.js";
import { agriculturalSign } from "./agricultural-layout.js";
import * as THREE from "three";
// Repeated stainless-steel pedestrian fixtures. Positions follow the modeled
// paths; spacing is illustrative rather than a surveyed inventory of poles.
export function createStreetLights(scene, layout, canPlace) {
  const root = new THREE.Group();
  root.name = "campus-walkway-lights";
  scene.add(root);
  const anchors = [];
  function add(x, z, rotation) {
    if (
      x < -240 ||
      x > 300 ||
      z < -220 ||
      z > 160 ||
      !canPlace(x, z) ||
      (Math.abs(x-en13Site.sign.x) < en13Site.sign.w/2+2 &&
        Math.abs(z-en13Site.sign.z) < 4) ||
      (Math.abs(x-agriculturalSign.x) < agriculturalSign.w/2+2.5 &&
        Math.abs(z-agriculturalSign.z) < 4) ||
      anchors.some((p) => Math.hypot(p.x - x, p.z - z) < 8)
    )
      return;
    anchors.push({ x, z, rotation });
  }
  function follow(points, offset, spacing, sides) {
    let carried = spacing * 0.3;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        length = Math.hypot(dx, dz);
      if (length < 0.01) continue;
      const nx = -dz / length,
        nz = dx / length;
      for (let distance = carried; distance < length; distance += spacing) {
        const t = distance / length;
        for (const side of sides)
          add(
            a[0] + dx * t + nx * offset * side,
            a[1] + dz * t + nz * offset * side,
            Math.atan2(-nx * side, -nz * side),
          );
      }
      carried = (carried - length) % spacing;
      if (carried < 0) carried += spacing;
    }
  }
  for (const walk of layout.walks)
    follow(walk.points, Math.max(0.4, walk.width / 2 - 0.3), 17, [1]);
  for (const road of layout.roads)
    follow(road.points, road.width / 2 + 1.15, 21, [1, -1]);
  // Keep half the fixtures, choosing separated positions across the whole site.
  const candidates = anchors.splice(0),
    keep = Math.ceil(candidates.length / 2),
    distance = candidates.map(() => Infinity),
    used = new Set();
  let next = 0;
  for (let n = 0; n < keep; n++) {
    used.add(next);
    const selected = candidates[next];
    anchors.push(selected);
    let farthest = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (used.has(i)) continue;
      distance[i] = Math.min(
        distance[i],
        (candidates[i].x - selected.x) ** 2 +
          (candidates[i].z - selected.z) ** 2,
      );
      if (distance[i] > farthest) {
        farthest = distance[i];
        next = i;
      }
    }
  }
  const steel = new THREE.MeshStandardMaterial({
    color: "#a2aaa3",
    metalness: 0.78,
    roughness: 0.32,
  });
  const darkSteel = new THREE.MeshStandardMaterial({
    color: "#8d968d",
    metalness: 0.7,
    roughness: 0.38,
  });
  const lens = new THREE.MeshStandardMaterial({
    color: "#e8e6ce",
    roughness: 0.48,
    emissive: "#ffe1a4",
    emissiveIntensity: 0,
  });
  const transform = new THREE.Object3D();
  function instances(geometry, material, cast = true) {
    const mesh = new THREE.InstancedMesh(geometry, material, anchors.length);
    anchors.forEach((p, i) => {
      transform.position.set(p.x, 0, p.z);
      transform.rotation.set(0, p.rotation, 0);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    root.add(mesh);
    return mesh;
  }
  instances(
    new THREE.CylinderGeometry(0.048, 0.052, 3, 8).translate(0, 1.68, 0),
    steel,
  );
  instances(
    new THREE.CylinderGeometry(0.083, 0.09, 0.85, 10).translate(0, 0.56, 0),
    steel,
  );
  instances(
    new THREE.BoxGeometry(0.32, 0.055, 0.32).translate(0, 0.15, 0),
    darkSteel,
  );
  for (const x of [-0.11, 0.11])
    for (const z of [-0.11, 0.11])
      instances(
        new THREE.CylinderGeometry(0.022, 0.022, 0.025, 6).translate(
          x,
          0.19,
          z,
        ),
        darkSteel,
        false,
      );
  const gear = new THREE.Shape();
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20,
      r = i % 4 < 2 ? 0.43 : 0.36;
    const x = Math.cos(a) * r,
      y = Math.sin(a) * r;
    i ? gear.lineTo(x, y) : gear.moveTo(x, y);
  }
  gear.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, 0.27, 0, Math.PI * 2, true);
  gear.holes.push(hole);
  instances(
    new THREE.ExtrudeGeometry(gear, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.012,
      bevelThickness: 0.008,
    }).translate(0, 3.48, -0.0325),
    steel,
  );
  const profile = [
    [0, -0.24],
    [0.035, -0.19],
    [0.105, -0.06],
    [0.153, 0.1],
    [0.145, 0.18],
    [0.09, 0.23],
    [0, 0.24],
  ].map((p) => new THREE.Vector2(...p));
  instances(
    new THREE.LatheGeometry(profile, 12).translate(0, 3.48, 0.025),
    lens,
    false,
  );
  instances(
    new THREE.CylinderGeometry(0.065, 0.11, 0.055, 10).translate(0, 3.75, 0),
    darkSteel,
  );
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d"),
    gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,221,153,.62)");
  gradient.addColorStop(0.25, "rgba(255,213,134,.34)");
  gradient.addColorStop(1, "rgba(255,210,130,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const poolMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(c),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pools = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2),
    poolMaterial,
    anchors.length,
  );
  anchors.forEach((p, i) => {
    transform.position.set(p.x, 0.165, p.z);
    transform.rotation.set(0, 0, 0);
    transform.updateMatrix();
    pools.setMatrixAt(i, transform.matrix);
  });
  pools.computeBoundingSphere();
  root.add(pools);
  const lights = Array.from({ length: 6 }, () => {
    const light = new THREE.PointLight("#ffdc9c", 0, 11, 2);
    root.add(light);
    return light;
  });
  let enabled = false,
    ticks = 0;
  function setNight(value) {
    enabled = value;
    lens.emissiveIntensity = value ? 2.1 : 0;
    poolMaterial.opacity = value ? 0.7 : 0;
    pools.visible = value;
    if (!value)
      lights.forEach((l) => {
        l.intensity = 0;
      });
    ticks = 0;
  }
  function update(camera) {
    if (!enabled || !root.visible) return;
    if (ticks++ % 12) return;
    const nearest = anchors
      .map((p) => ({
        p,
        d: (p.x - camera.position.x) ** 2 + (p.z - camera.position.z) ** 2,
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 6);
    lights.forEach((light, i) => {
      const p = nearest[i]?.p;
      if (!p) return;
      light.position.set(p.x, 3.45, p.z);
      light.intensity = nearest[i].d < 80 * 80 ? 20 : 0;
    });
  }
  setNight(false);
  return { root, count: anchors.length, setNight, update };
}
