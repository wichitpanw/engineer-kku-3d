import * as THREE from "three";
import { createCB, createEN17North } from "./cb-building.js";
import { batch } from "./model.js";
import { buildings, auxiliaries } from "./campus-data.js";
import {
  createComputerElectrical,
  createElectricalConnected,
  createEastCourtyard,
} from "./east-engineering.js";
const mat = (c, extra = {}) =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.83, ...extra });
const M = {
  wall: mat("#deded0"),
  base: mat("#bdab97"),
  roof: mat("#b77967"),
  metal: mat("#a6aaa1", { metalness: 0.2 }),
  white: mat("#ede9db"),
  glass: mat("#416675", { metalness: 0.6, roughness: 0.22 }),
  frame: mat("#6c7670"),
  concrete: mat("#a7a99f"),
  edge: mat("#c5c5b8"),
  dark: mat("#414d4d"),
};
for (const material of Object.values(M)) material.shadowSide = THREE.FrontSide;
function box(p, x, y, z, w, h, d, m = M.wall) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}
function beam(p, a, b, w, d = w, m = M.concrete) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    v = bv.clone().sub(av);
  const o = box(p, 0, 0, 0, w, v.length(), d, m);
  o.position.copy(av).add(bv).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
  return o;
}
function facadeText(p, text, x, y, z, width, height, rotation = 0) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  context.font = '500 78px "IBM Plex Sans Thai", sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#e8e8df";
  context.fillText(text, 768, 88, 1470);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      roughness: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  label.position.set(x, y, z);
  label.rotation.y = rotation;
  p.add(label);
}
function roof(p, w, d, eave, form, material = M.roof) {
  const rise = Math.min(d * 0.24, 4.4);
  if (form === "flat") {
    box(p, 0, eave + 0.15, 0, w + 0.6, 0.3, d + 0.6, M.white);
    return;
  }
  if (form === "barrel") {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = -w / 2 + (w * i) / 24;
      pts.push(
        new THREE.Vector2(x, eave + Math.sin((i / 24) * Math.PI) * rise),
      );
    }
    pts.push(
      new THREE.Vector2(w / 2, eave - 0.15),
      new THREE.Vector2(-w / 2, eave - 0.15),
    );
    const s = new THREE.Shape(pts),
      g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    const o = new THREE.Mesh(g, material);
    o.castShadow = o.receiveShadow = true;
    p.add(o);
    for (let i = 0; i <= Math.round(d / 2); i++) {
      const z = -d / 2 + (i * d) / Math.round(d / 2);
      const points = pts
        .slice(0, 25)
        .map((q) => new THREE.Vector3(q.x, q.y + 0.035, z));
      const line = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          24,
          0.045,
          4,
          false,
        ),
        M.edge,
      );
      p.add(line);
    }
    return;
  }
  const n = form === "sheds" ? 3 : 1;
  for (let k = 0; k < n; k++) {
    const dd = d / n,
      z = -d / 2 + dd * (k + 0.5),
      r = form === "sheds" ? Math.min(2.1, dd * 0.26) : rise;
    const vertices = [
      -w / 2,
      eave,
      z - dd / 2,
      w / 2,
      eave,
      z - dd / 2,
      w / 2,
      eave + r,
      z,
      -w / 2,
      eave + r,
      z,
      -w / 2,
      eave + r,
      z,
      w / 2,
      eave + r,
      z,
      w / 2,
      eave,
      z + dd / 2,
      -w / 2,
      eave,
      z + dd / 2,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex([0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6]);
    g.computeVertexNormals();
    const o = new THREE.Mesh(g, material);
    o.material.side = THREE.DoubleSide;
    o.castShadow = true;
    p.add(o);
    for (let x = -w / 2; x <= w / 2; x += 2.2) {
      beam(p, [x, eave, z - dd / 2], [x, eave + r, z], 0.045, 0.045, M.edge);
      beam(p, [x, eave + r, z], [x, eave, z + dd / 2], 0.045, 0.045, M.edge);
    }
    beam(p, [-w / 2, eave + r, z], [w / 2, eave + r, z], 0.11, 0.11, M.edge);
  }
}
function genericPart(root, s, detail, id) {
  const w = s.w - 0.8,
    d = s.d - 0.8;
  const p = new THREE.Group();
  p.position.set(s.x, 0, s.z);
  p.rotation.y = s.rotation || 0;
  root.add(p);
  const shed = s.roof === "sheds",
    library = id === "EN15",
    h = s.h;
  box(p, 0, 0.13, 0, w + 0.8, 0.26, d + 0.8, M.base);
  box(p, 0, h / 2, 0, w, h, d, library ? M.white : M.wall);
  box(p, 0, 0.65, 0, w + 0.06, 0.85, d + 0.06, M.base);
  const roofMat = library ? M.metal : shed ? M.roof : M.roof;
  if (library) {
    for (let k = 0; k < 4; k++) {
      const segment = new THREE.Group();
      segment.position.x = -w / 2 + ((k + 0.5) * w) / 4;
      p.add(segment);
      roof(segment, w / 4 + 0.12, d + 1.3, h + 0.2, "barrel", M.roof);
    }
  } else roof(p, w + 0.8, d + 0.8, h + 0.2, s.roof, roofMat);
  if (!detail) return;
  const floors = shed || library ? 2 : Math.max(1, Math.round(h / 3.5));
  for (let f = 0; f < floors; f++) {
    const y = 1.7 + f * (h / floors),
      wh = Math.min(1.7, h / floors - 1.1);
    for (const side of [-1, 1]) {
      for (let x = -w / 2 + 2; x < w / 2 - 1; x += 4.2) {
        box(
          p,
          x,
          y,
          side * (d / 2 + 0.035),
          Math.min(2.8, w / 6),
          wh,
          0.1,
          M.glass,
        );
        box(p, x, y, side * (d / 2 + 0.1), 0.055, wh, 0.045, M.frame);
        if (!shed)
          box(
            p,
            x,
            y + wh / 2 + 0.14,
            side * (d / 2 + 0.32),
            3.2,
            0.12,
            0.65,
            M.white,
          );
      }
      for (let z = -d / 2 + 2; z < d / 2 - 1; z += 4.5)
        box(p, side * (w / 2 + 0.04), y, z, 0.1, wh, 2.6, M.glass);
    }
    if (f > 0) {
      box(p, 0, (f * h) / floors, 0, w + 0.16, 0.18, d + 0.16, M.white);
    }
  }
  // Recessed entrance and a shallow stair, deliberately separate from unseen room layouts.
  box(p, 0, 1.3, d / 2 + 0.07, 3.2, 2.6, 0.12, M.glass);
  if (shed)
    for (let x = -w / 2 + 0.8; x < w / 2; x += 6)
      box(p, x, h / 2, d / 2 + 0.12, 0.3, h, 0.3, M.white);
  if (library) {
    for (const side of [-1, 1]) {
      box(p, 0, 4.2, side * (d / 2 + 0.1), w - 3, 4.8, 0.12, M.glass);
      for (let x = -w / 2 + 1; x < w / 2; x += 3)
        box(p, x, 4.5, side * (d / 2 + 0.22), 0.22, 8.6, 0.24, M.white);
    }
  }
}
function panel(p, points, m) {
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points.flat(), 3),
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  const o = new THREE.Mesh(g, m);
  o.material.side = THREE.DoubleSide;
  o.castShadow = true;
  o.receiveShadow = !points.every((p) => p[1] >= 21);
  p.add(o);
}
function anniversary(root, detail) {
  // Two folded concrete wings with glazed diagonal openings and an open lower hall.
  for (const s of [
    { x: -13, z: -100, w: 24, d: 70, r: 0.58 },
    { x: 7, z: -69, w: 28, d: 36, r: -0.45 },
  ]) {
    const g = new THREE.Group();
    g.position.set(s.x, 0, s.z);
    g.rotation.y = s.r;
    root.add(g);
    const w = s.w,
      d = s.d;
    box(g, 0, 0.2, 0, w, 0.4, d, M.concrete);
    // The public ground floor remains open. Service volume is confined to one end.
    box(g, 0, 3, -d / 2 + 4, w - 3, 6, 7, M.concrete);
    box(g, 0, 9.2, 0, w, 0.45, d, M.concrete);
    box(g, 0, 17.1, 0, w, 0.4, d, M.concrete);
    box(g, 0, 23.6, 0, w, 0.4, d, M.concrete);
    for (const side of [-1, 1]) {
      const x = (side * w) / 2;
      // Upper folded wall rises towards the north, with diagonal lower edge.
      panel(
        g,
        [
          [x, 9.4, -d / 2],
          [x, 25, -d / 2],
          [x, 21.8, d / 2],
          [x, 17.4, d / 2],
        ],
        M.concrete,
      );
      for (let z = -d / 2 + 4; z < d / 2; z += 8) {
        beam(g, [x, 0, z - 3.7], [x, 9, z + 3.7], 0.85, 1.1);
        beam(g, [x, 9, z - 3.7], [x, 0, z + 3.7], 0.85, 1.1);
        beam(g, [x, 9, z - 3.7], [x, 17, z + 3.7], 0.65, 0.9);
        beam(g, [x, 17, z - 3.7], [x, 9, z + 3.7], 0.65, 0.9);
      }
      if (detail) {
        box(g, x - side * 0.4, 13.3, 0, 0.12, 7.4, d - 2, M.glass);
        for (let z = -d / 2; z < d / 2; z += 4)
          box(g, x + side * 0.035, 19.8, z, 0.045, 5.4, 0.035, M.edge);
        for (let yy = 18; yy < 24; yy += 2.7)
          box(g, x + side * 0.04, yy, 0, 0.035, 0.035, d, M.edge);
      }
    }
    box(g, 0, 20.6, -d / 2, w, 8, 0.35, M.concrete);
    box(g, 0, 17.5, d / 2, w, 7.4, 0.35, M.concrete);
    if (detail) {
      facadeText(g, "อาคาร 50 ปี วิศวะรวมใจ", 0, 16, d / 2 + 0.22, w - 2, 1.4);
      box(g, 0, 12.8, d / 2 + 0.06, w - 2.5, 7.6, 0.12, M.glass);
      for (let x = -w / 2 + 2; x < w / 2; x += 3)
        box(g, x, 12.8, d / 2 + 0.14, 0.09, 7.6, 0.1, M.dark);
      for (let z = -d / 2 + 8; z < d / 2; z += 8)
        beam(g, [-w / 2, 8.8, z], [w / 2, 8.8, z], 0.3, 0.5, M.dark);
    }
    panel(
      g,
      [
        [-w / 2, 25.1, -d / 2],
        [w / 2, 25.1, -d / 2],
        [w / 2, 22, d / 2],
        [-w / 2, 22, d / 2],
      ],
      M.concrete,
    );
  }
  if (detail) {
    for (let k = 0; k < 6; k++)
      box(root, 4, k * 0.13 + 0.08, -44 - k * 0.45, 25, 0.16, 1.1, M.concrete);
    box(root, 0, 9, -69, 22, 0.3, 18, M.concrete);
    // Beam grid and permanent suspended services under the open hall.
    for (let z = -121; z < -55; z += 6) {
      box(root, -4, 8.5, z, 21, 0.45, 0.35, M.dark);
      box(root, -4, 8.05, z + 0.6, 20, 0.045, 0.045, M.roof);
    }
    for (const x of [-18, -4, 10])
      for (const z of [-110, -96, -80]) {
        box(root, x, 0.75, z, 2.8, 0.1, 1, M.dark);
        for (const dx of [-1, 1])
          box(root, x + dx, 0.38, z, 0.06, 0.75, 0.7, M.frame);
      }
  }
}
export function createCampusBuildings(scene, pien) {
  const root = new THREE.Group();
  scene.add(root);
  const entries = new Map();
  let selectedId = null;
  for (const b of buildings) {
    if (!b.bounds) continue;
    if (b.id === "EN16") {
      pien.root.userData.buildingId = b.id;
      entries.set(b.id, { data: b, object: pien.root });
      continue;
    }
    const group = new THREE.LOD();
    group.position.set(b.center[0], 0, b.center[1]);
    group.userData.buildingId = b.id;
    for (const [detail, distance] of [
      [true, 0],
      [false, 260],
    ]) {
      const level = new THREE.Group();
      if (b.id === "EN18") anniversary(level, detail);
      else if (b.id === "EN09") createCB(level, detail);
      else if (b.id === "EN17") {
        createEN17North(level, detail);
        for (const s of b.parts.slice(1)) genericPart(level, s, detail, b.id);
      } else if (b.id === "EN04") createComputerElectrical(level, detail);
      else if (b.id === "EN11") createElectricalConnected(level, detail);
      else for (const s of b.parts) genericPart(level, s, detail, b.id);
      batch(level);
      level.position.set(-b.center[0], 0, -b.center[1]);
      group.addLevel(level, distance);
    }
    root.add(group);
    entries.set(b.id, { data: b, object: group });
  }
  const services = new THREE.Group();
  root.add(services);
  const eastCourt = createEastCourtyard(services);
  batch(eastCourt);
  for (const b of auxiliaries)
    for (const p of b.parts) genericPart(services, p, true, b.id);
  batch(services);
  const outline = new THREE.LineLoop(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: "#e7b74c", depthTest: false }),
  );
  outline.renderOrder = 10;
  scene.add(outline);
  function select(id) {
    selectedId = id;
    const b = entries.get(id)?.data;
    if (!b) {
      outline.visible = false;
      return;
    }
    const r = b.bounds,
      pad = 1.8;
    const pts = [
      [r.minX - pad, 0.5, r.minZ - pad],
      [r.maxX + pad, 0.5, r.minZ - pad],
      [r.maxX + pad, 0.5, r.maxZ + pad],
      [r.minX - pad, 0.5, r.maxZ + pad],
    ].map((p) => new THREE.Vector3(...p));
    outline.geometry.dispose();
    outline.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    outline.visible = true;
  }
  outline.visible = false;
  return {
    root,
    entries,
    services,
    select,
    update(camera) {
      outline.visible = !!selectedId && camera.position.y > 8;
      for (const [id, e] of entries)
        if (e.object.isLOD) {
          e.object.autoUpdate = id !== selectedId;
          if (id === selectedId)
            e.object.levels.forEach(
              (level, i) => (level.object.visible = i === 0),
            );
          else e.object.update(camera);
        }
    },
    setOtherBuildings(show, selected) {
      for (const [id, e] of entries) e.object.visible = show || id === selected;
      services.visible = show;
    },
  };
}
