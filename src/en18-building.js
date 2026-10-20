import * as THREE from 'three';
import {
  en18MainBlock,
  en18SolarWing,
  en18GearGallery,
  en18Annexes,
} from './en18-layout.js';

// Generate realistic cast-in-place architectural concrete texture (ปูนเปลือยมีคราบแนวตั้งธรรมชาติ ไม่เป็นตารางหมากรุก)
function makeConcreteTexture(baseRgb = [156, 160, 154], seamHex = '#858983') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = `rgb(${baseRgb[0]}, ${baseRgb[1]}, ${baseRgb[2]})`;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle vertical rain/formwork streaks matching real concrete photos
  for (let x = 0; x < 512; x += 2) {
    const wave = Math.sin(x * 0.09) * 3 + Math.cos(x * 0.27) * 2 + ((x * 17) % 5 - 2);
    const r = Math.max(0, Math.min(255, Math.round(baseRgb[0] + wave)));
    const g = Math.max(0, Math.min(255, Math.round(baseRgb[1] + wave)));
    const b = Math.max(0, Math.min(255, Math.round(baseRgb[2] + wave)));
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.55)`;
    ctx.fillRect(x, 0, 2, 512);
  }

  // Subtle formwork panel seams and tie-rod holes
  const cols = 4, rows = 2;
  const pw = 512 / cols, ph = 512 / rows;
  ctx.strokeStyle = seamHex;
  ctx.lineWidth = 1.2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.strokeRect(c * pw + 0.5, r * ph + 0.5, pw - 1, ph - 1);
      ctx.fillStyle = 'rgba(95, 99, 94, 0.55)';
      for (const [tx, ty] of [[16, 22], [pw - 16, 22], [16, ph - 22], [pw - 16, ph - 22]]) {
        ctx.beginPath();
        ctx.arc(c * pw + tx, r * ph + ty, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const concreteTex = makeConcreteTexture([156, 160, 154], '#838780');
const concreteDarkTex = makeConcreteTexture([122, 126, 120], '#686c66');

const mat = (color, roughness = 0.86, metalness = 0.06, map = null) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, map, side: THREE.DoubleSide });

const M = {
  concrete: mat('#ffffff', 0.86, 0.05, concreteTex),
  concreteDark: mat('#ffffff', 0.9, 0.06, concreteDarkTex),
  concreteSmooth: mat('#c4c8c0', 0.76, 0.06),
  concreteSoffit: mat('#363a38', 0.9, 0.05),
  roofCream: mat('#dfddd2', 0.82, 0.05),
  roofDark: mat('#3d4340', 0.78, 0.1),
  glass: mat('#172628', 0.16, 0.7),
  glassSky: mat('#58767e', 0.14, 0.78),
  glassLight: mat('#395458', 0.2, 0.6),
  louverDark: mat('#222624', 0.75, 0.35),
  metalDark: mat('#252a28', 0.4, 0.72),
  metalGrey: mat('#7e8480', 0.38, 0.75),
  gear: mat('#ffffff', 0.84, 0.08, concreteTex),
  whiteSign: mat('#f2f3ee', 0.62, 0.08),
  pipeRed: mat('#c4241e', 0.42, 0.32),
  curbRed: mat('#b83228', 0.85, 0.05),
  curbWhite: mat('#e6e7df', 0.85, 0.05),
  hedge: mat('#3a5527', 0.92, 0.02),
  lawn: mat('#557538', 0.92, 0.02),
  shrubRed: mat('#7c2f26', 0.9, 0.02),
  foliage: mat('#355224', 0.9, 0.02),
  trunk: mat('#5c4938', 0.92, 0.02),
  paving: mat('#c4c6bc', 0.82, 0.05),
  solar: mat('#162638', 0.2, 0.82),
  solarFrame: mat('#a4aba8', 0.35, 0.8),
  gold: mat('#d4bc6a', 0.35, 0.65),
  binBlue: mat('#2262a8', 0.6, 0.1),
  binYellow: mat('#d9a520', 0.6, 0.1),
  binGreen: mat('#2e6f46', 0.65, 0.1),
};

function scaleBoxUVs(geom, w, h, d, scale = 5.5) {
  const pos = geom.attributes.position;
  const norm = geom.attributes.normal;
  const uv = geom.attributes.uv;
  if (!pos || !norm || !uv) return;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const nz = Math.abs(norm.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (nx > ny && nx > nz) {
      uv.setXY(i, (z + d / 2) / scale, (y + h / 2) / scale);
    } else if (ny > nx && ny > nz) {
      uv.setXY(i, (x + w / 2) / scale, (z + d / 2) / scale);
    } else {
      uv.setXY(i, (x + w / 2) / scale, (y + h / 2) / scale);
    }
  }
  uv.needsUpdate = true;
}

function box(p, x, y, z, w, h, d, m = M.concrete) {
  const geom = new THREE.BoxGeometry(w, h, d);
  if (m === M.concrete || m === M.concreteDark || m === M.gear) {
    scaleBoxUVs(geom, w, h, d, 5.5);
  }
  const o = new THREE.Mesh(geom, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}

function beam(p, from, to, w = 0.4, h = 0.4, m = M.concrete) {
  const vFrom = new THREE.Vector3(...from);
  const vTo = new THREE.Vector3(...to);
  const dir = new THREE.Vector3().subVectors(vTo, vFrom);
  const len = dir.length();
  if (len < 0.01) return null;
  const geom = new THREE.BoxGeometry(w, h, len);
  if (m === M.concrete || m === M.concreteDark) {
    scaleBoxUVs(geom, w, h, len, 5.5);
  }
  const o = new THREE.Mesh(geom, m);
  o.position.copy(vFrom).addScaledVector(dir, 0.5);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}

function wallBetween(p, p1, p2, yBot, yTop, m = M.concrete, thickness = 0.45) {
  const dx = p2[0] - p1[0];
  const dz = p2[1] - p1[1];
  const len = Math.hypot(dx, dz);
  if (len < 0.01) return null;
  const cx = (p1[0] + p2[0]) / 2;
  const cz = (p1[1] + p2[1]) / 2;
  const cy = (yBot + yTop) / 2;
  const h = yTop - yBot;
  const angle = Math.atan2(dz, dx);
  const o = box(p, cx, cy, cz, len, h, thickness, m);
  o.rotation.y = -angle;
  return o;
}

function polyMesh(p, vertices, indices, m = M.concrete) {
  const g = new THREE.BufferGeometry();
  const flatPos = vertices.flat();
  g.setAttribute('position', new THREE.Float32BufferAttribute(flatPos, 3));
  g.setIndex(indices);
  g.computeVertexNormals();

  const uvs = [];
  const p0 = new THREE.Vector3(...vertices[0]);
  const p1 = new THREE.Vector3(...vertices[1]);
  const tangent = new THREE.Vector3().subVectors(p1, p0);
  if (tangent.lengthSq() < 1e-4 && vertices.length > 2) {
    tangent.subVectors(new THREE.Vector3(...vertices[2]), p0);
  }
  tangent.normalize();
  for (const v of vertices) {
    const d = new THREE.Vector3(...v).sub(p0);
    const u = d.x * tangent.x + d.z * tangent.z;
    const vv = v[1];
    uvs.push(u / 5.5, vv / 5.5);
  }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  const o = new THREE.Mesh(g, m);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}

function extrudeShape(p, shape, depth, m = M.concrete) {
  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
  const uv = geom.attributes.uv;
  if (uv) {
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) / 5.5, uv.getY(i) / 5.5);
    }
    uv.needsUpdate = true;
  }
  const o = new THREE.Mesh(geom, m);
  o.castShadow = o.receiveShadow = true;
  p.add(o);
  return o;
}

function textLabel(p, text, x, y, z, w, h, rotationY = 0, color = '#444846') {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = color;
  ctx.font = '700 102px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 1024, 128, 1960);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const o = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide })
  );
  o.position.set(x, y, z);
  o.rotation.y = rotationY;
  p.add(o);
  return o;
}

// ==============================================================================
// SCULPTED 3D DIAMOND & GLAZED TRIANGLE HELPERS
// ==============================================================================
function addSculptedDiamond(parent, x, y, z, w, h, rotationY = 0, kind = 'relief', depth = 0.55) {
  const dg = new THREE.Group();
  dg.position.set(x, y, z);
  dg.rotation.y = rotationY;
  parent.add(dg);

  const hw = w / 2, hh = h / 2;
  const ribW = 0.44;

  // 1. Thick 3D Bevelled Outer Diamond Concrete Ribs
  beam(dg, [0, hh, depth / 2], [hw, 0, depth / 2], ribW, depth, M.concrete);
  beam(dg, [hw, 0, depth / 2], [0, -hh, depth / 2], ribW, depth, M.concrete);
  beam(dg, [0, -hh, depth / 2], [-hw, 0, depth / 2], ribW, depth, M.concrete);
  beam(dg, [-hw, 0, depth / 2], [0, hh, depth / 2], ribW, depth, M.concrete);

  // Crisp light-grey chamfer highlight along the front face of the diamond ribs
  beam(dg, [0, hh, depth + 0.02], [hw, 0, depth + 0.02], 0.18, 0.08, M.concreteSmooth);
  beam(dg, [hw, 0, depth + 0.02], [0, -hh, depth + 0.02], 0.18, 0.08, M.concreteSmooth);
  beam(dg, [0, -hh, depth + 0.02], [-hw, 0, depth + 0.02], 0.18, 0.08, M.concreteSmooth);
  beam(dg, [-hw, 0, depth + 0.02], [0, hh, depth + 0.02], 0.18, 0.08, M.concreteSmooth);

  // 2. Inner Diamond Backing Plate
  const shape = new THREE.Shape();
  shape.moveTo(0, hh - 0.16);
  shape.lineTo(hw - 0.16, 0);
  shape.lineTo(0, -hh + 0.16);
  shape.lineTo(-hw + 0.16, 0);
  shape.closePath();

  const backMat =
    kind === 'glass-sky'
      ? M.glassSky
      : kind === 'glass' || kind === 'glass-open'
      ? M.glass
      : kind === 'relief'
      ? M.concrete
      : M.louverDark;

  const plate = extrudeShape(dg, shape, 0.16, backMat);
  plate.position.z = 0.02;

  // 3. Horizontal Louver Blades for 'louver' diamonds
  if (kind === 'louver') {
    const numBlades = 18;
    for (let i = 1; i < numBlades; i++) {
      const t = i / numBlades;
      const by = -hh + 0.35 + t * (h - 0.7);
      const frac = 1 - Math.abs(by) / (hh - 0.15);
      const bw = Math.max(0.2, (w - 0.5) * frac);
      box(dg, 0, by, 0.22, bw, 0.06, 0.12, M.metalDark);
    }
  }

  // 4. Central Solid Concrete Mini-Diamond
  if (kind !== 'glass-open') {
    const scale = kind === 'glass' || kind === 'glass-sky' ? 0.36 : 0.42;
    const innerShape = new THREE.Shape();
    innerShape.moveTo(0, hh * scale);
    innerShape.lineTo(hw * scale, 0);
    innerShape.lineTo(0, -hh * scale);
    innerShape.lineTo(-hw * scale, 0);
    innerShape.closePath();

    const centerDepth = kind === 'louver' ? 0.36 : 0.26;
    const centerDiamond = extrudeShape(dg, innerShape, centerDepth, M.concreteSmooth);
    centerDiamond.position.z = 0.08;

    const rimS = scale * 0.65;
    beam(dg, [0, hh * rimS, centerDepth + 0.09], [hw * rimS, 0, centerDepth + 0.09], 0.08, 0.06, M.concreteDark);
    beam(dg, [hw * rimS, 0, centerDepth + 0.09], [0, -hh * rimS, centerDepth + 0.09], 0.08, 0.06, M.concreteDark);
    beam(dg, [0, -hh * rimS, centerDepth + 0.09], [-hw * rimS, 0, centerDepth + 0.09], 0.08, 0.06, M.concreteDark);
    beam(dg, [-hw * rimS, 0, centerDepth + 0.09], [0, hh * rimS, centerDepth + 0.09], 0.08, 0.06, M.concreteDark);
  }

  // 5. Window Mullion Grid for Glazed Diamonds
  if (kind === 'glass' || kind === 'glass-sky' || kind === 'glass-open') {
    for (const f of [-0.5, -0.25, 0, 0.25, 0.5]) {
      const yLine = f * hh;
      const spanX = (1 - Math.abs(f)) * (hw - 0.25) * 2;
      if (spanX > 0.3) {
        box(dg, 0, yLine, 0.2, spanX, 0.05, 0.06, M.metalDark);
      }
      const xLine = f * hw;
      const spanY = (1 - Math.abs(f)) * (hh - 0.25) * 2;
      if (spanY > 0.3) {
        box(dg, xLine, 0, 0.2, 0.05, spanY, 0.06, M.metalDark);
      }
    }
    beam(dg, [-hw * 0.48, hh * 0.48, 0.21], [hw * 0.48, -hh * 0.48, 0.21], 0.06, 0.06, M.metalGrey);
    beam(dg, [-hw * 0.48, -hh * 0.48, 0.21], [hw * 0.48, hh * 0.48, 0.21], 0.06, 0.06, M.metalGrey);
  }

  return dg;
}

// Upward-pointing glazed triangle at ground level with a small solid concrete triangle at its base
function addBottomGlazedTriangle(parent, x, yBot, z, w, h, rotationY = 0, depth = 0.5) {
  const tg = new THREE.Group();
  tg.position.set(x, yBot, z);
  tg.rotation.y = rotationY;
  parent.add(tg);

  const hw = w / 2;
  beam(tg, [-hw, 0, depth / 2], [0, h, depth / 2], 0.4, depth, M.concrete);
  beam(tg, [hw, 0, depth / 2], [0, h, depth / 2], 0.4, depth, M.concrete);
  box(tg, 0, 0.18, depth / 2, w, 0.36, depth, M.concrete);

  const glassShape = new THREE.Shape();
  glassShape.moveTo(-hw + 0.2, 0.2);
  glassShape.lineTo(hw - 0.2, 0.2);
  glassShape.lineTo(0, h - 0.2);
  glassShape.closePath();
  const glassMesh = extrudeShape(tg, glassShape, 0.14, M.glass);
  glassMesh.position.z = 0.04;

  const miniShape = new THREE.Shape();
  miniShape.moveTo(-hw * 0.38, 0.25);
  miniShape.lineTo(hw * 0.38, 0.25);
  miniShape.lineTo(0, h * 0.42);
  miniShape.closePath();
  const miniTri = extrudeShape(tg, miniShape, 0.28, M.concreteSmooth);
  miniTri.position.z = 0.08;

  beam(tg, [-hw * 0.4, 0.25, 0.2], [0, h * 0.42, 0.2], 0.05, 0.05, M.metalGrey);
  beam(tg, [hw * 0.4, 0.25, 0.2], [0, h * 0.42, 0.2], 0.05, 0.05, M.metalGrey);
  box(tg, 0, h * 0.52, 0.2, w * 0.45, 0.05, 0.05, M.metalDark);
  return tg;
}

// ==============================================================================
// 1. UNIFIED MAIN BLOCK, CENTRAL PASS-THROUGH HALL, SE REAR & SHARP WEST/SW WING
// ==============================================================================
function createMainBlock(root, detail) {
  const { cx, cz, w, d, rotation, recessDepth, lobbyH } = en18MainBlock;

  const g = new THREE.Group();
  g.name = 'en18-main-block';
  g.position.set(cx, 0, cz);
  g.rotation.y = rotation;
  root.add(g);

  const hw = w / 2;    // 13.3m
  const hd = d / 2;    // 22.01m
  const hallX1 = 3.5;  // Left edge of Central Pass-Through Hall
  const hallX2 = 13.3; // Right edge of Central Pass-Through Hall (width = 9.8m)
  const facadeH = 15.6;

  // --------------------------------------------------------------------------
  // A. North-West Front Cantilevered Box ("อาคาร 50 ปี วิศวะรวมใจ") & Lobby
  // --------------------------------------------------------------------------
  const upperFrontH = 16.2 - lobbyH;
  // Cantilevered box spans x = -6.5m to +11.5m at the NW front (-hd to -hd + 14.0m)
  // Leaving the West Corner (x < -6.5m) free for the dramatic Sharp West Wing!
  const cantFrontW = 18.0;
  const cantFrontCX = 2.5;
  box(g, cantFrontCX, lobbyH + upperFrontH / 2, -hd + 7.0, cantFrontW, upperFrontH, 14.0, M.concrete);

  // Main West solid building core (`x = -13.3m` to `+3.5m`, width `16.8m`) from `z = -hd + 10.0m` to `+hd`
  const westCoreW = hallX1 - (-hw); // 16.8m
  const westCoreCX = (-hw + hallX1) / 2; // -4.9m
  const rearD = d - 10.0;
  box(g, westCoreCX, facadeH / 2, 5.0, westCoreW, facadeH, rearD, M.concrete);

  // Ground floor slab under the cantilevered NW front lobby
  box(g, cantFrontCX, 0.2, -hd + recessDepth / 2, cantFrontW + 1.0, 0.4, recessDepth + 1.2, M.paving);

  // Deep Coffered / Waffle Concrete Ceiling Soffit under the NW Front Cantilever
  const soffitZ = -hd + recessDepth / 2;
  box(g, cantFrontCX, lobbyH - 0.12, soffitZ, cantFrontW, 0.28, recessDepth, M.concreteDark);
  for (let rx = cantFrontCX - cantFrontW / 2 + 0.4; rx <= cantFrontCX + cantFrontW / 2 - 0.3; rx += 2.0) {
    box(g, rx, lobbyH - 0.45, soffitZ, 0.26, 0.48, recessDepth - 0.1, M.concrete);
  }
  for (let rz = -hd + 0.35; rz <= -hd + recessDepth - 0.2; rz += 1.55) {
    box(g, cantFrontCX, lobbyH - 0.45, rz, cantFrontW - 0.2, 0.48, 0.26, M.concrete);
  }

  // 3D Channel Lettering: "อาคาร 50 ปี วิศวะรวมใจ"
  textLabel(
    g,
    'อาคาร 50 ปี วิศวะรวมใจ',
    cantFrontCX,
    lobbyH + 1.6,
    -hd - 0.08,
    cantFrontW - 2.2,
    1.55,
    Math.PI,
    '#464a48'
  );

  // 2-Storey Recessed Glass Curtain Wall at NW Front Lobby
  const glassW = 13.5;
  const glassCX = -1.2;
  const glassZ = -hd + recessDepth - 0.2;
  box(g, glassCX, lobbyH / 2, glassZ, glassW, lobbyH - 0.5, 0.2, M.glass);

  for (let colX = glassCX - 4.5; colX <= glassCX + 4.5; colX += 4.5) {
    box(g, colX, lobbyH / 2, glassZ - 1.2, 0.68, lobbyH - 0.4, 0.68, M.concreteSmooth);
  }
  box(g, glassCX, 4.2, glassZ - 1.0, glassW - 0.4, 0.36, 2.2, M.concreteSmooth);

  if (detail) {
    for (let mx = glassCX - glassW / 2 + 1.5; mx <= glassCX + glassW / 2 - 1.0; mx += 1.7) {
      box(g, mx, lobbyH / 2, glassZ - 0.12, 0.08, lobbyH - 0.5, 0.12, M.metalDark);
    }
    for (const ty of [2.4, 4.2, 6.1]) {
      box(g, glassCX, ty, glassZ - 0.12, glassW, 0.1, 0.12, M.metalDark);
    }
    box(g, -5.5, 0.85, -hd + 3.2, 0.65, 1.1, 0.65, M.binYellow);
    box(g, -4.7, 0.85, -hd + 3.2, 0.65, 1.1, 0.65, M.binBlue);
  }

  // --------------------------------------------------------------------------
  // B. CENTRAL PASS-THROUGH HALL (Spans NW-to-SE at x = +3.5m .. +13.3m!)
  // --------------------------------------------------------------------------
  const hallW = hallX2 - hallX1; // 9.8m
  const hallCX = (hallX1 + hallX2) / 2; // +8.4m
  const hallCeilY = 5.2;
  const hallLen = d - 2.0;

  box(g, hallCX, 0.48, 0.5, hallW + 0.6, 0.96, hallLen, M.paving);
  box(g, hallCX, hallCeilY + 0.22, 0.5, hallW + 0.4, 0.44, hallLen, M.concreteDark);
  for (let wx = hallX1 + 0.6; wx <= hallX2 - 0.5; wx += 1.8) {
    box(g, wx, hallCeilY - 0.2, 0.5, 0.24, 0.44, hallLen - 0.6, M.concrete);
  }
  for (let wz = -hd + 2.5; wz <= hd - 0.8; wz += 1.9) {
    box(g, hallCX, hallCeilY - 0.2, wz, hallW - 0.2, 0.44, 0.24, M.concrete);
  }

  box(g, hallCX, 9.2, 0.0, hallW, 0.42, hallLen - 1.0, M.concreteSmooth);
  box(g, hallCX, 14.5, 0.0, hallW + 0.6, 1.8, hallLen, M.concrete);
  box(g, hallCX + 1.2, 16.6, 2.0, hallW - 1.5, 3.6, hallLen - 6.0, M.concrete);

  if (detail) {
    for (const py of [hallCeilY - 0.46, 8.6, 12.8]) {
      box(g, hallX1 + 2.2, py, 0.5, 0.09, 0.09, hallLen - 1.5, M.pipeRed);
      box(g, hallX2 - 2.2, py, 0.5, 0.09, 0.09, hallLen - 1.5, M.pipeRed);
      for (let pz = -hd + 4.0; pz <= hd - 1.5; pz += 5.2) {
        box(g, hallCX, py, pz, hallW - 1.0, 0.07, 0.07, M.pipeRed);
      }
    }
    for (let pz = -hd + 3.5; pz <= hd - 2.0; pz += 3.8) {
      for (const lx of [hallX1 + 2.6, hallCX, hallX2 - 2.6]) {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.22, 10), M.whiteSign);
        lamp.position.set(lx, hallCeilY - 0.22, pz);
        g.add(lamp);
      }
    }
  }

  for (let vz = -hd + 5.5; vz <= hd - 3.5; vz += 6.2) {
    beam(g, [hallX2 - 0.5, 0.9, vz], [hallX2 - 0.5, hallCeilY + 0.1, vz - 2.7], 0.62, 0.78, M.concrete);
    beam(g, [hallX2 - 0.5, 0.9, vz], [hallX2 - 0.5, hallCeilY + 0.1, vz + 2.7], 0.62, 0.78, M.concrete);
    beam(g, [hallX1 + 0.5, 0.9, vz], [hallX1 + 0.5, hallCeilY + 0.1, vz - 2.7], 0.58, 0.72, M.concrete);
    beam(g, [hallX1 + 0.5, 0.9, vz], [hallX1 + 0.5, hallCeilY + 0.1, vz + 2.7], 0.58, 0.72, M.concrete);
  }
  beam(g, [hallX1 + 3.2, 0.9, hd - 2.2], [hallX1 + 1.2, hallCeilY, hd - 2.2], 0.65, 0.75, M.concrete);

  box(g, hallCX, 3.85, -2.0, hallW, 0.5, 3.6, M.concrete);
  box(g, hallCX, 4.65, -0.2, hallW, 1.1, 0.14, M.glassLight);

  // --------------------------------------------------------------------------
  // C. SOUTH-EAST REAR FACADE — ZONE 1 (LEFT): Staggered Interlocking Diamond Wall
  // --------------------------------------------------------------------------
  const rearZ = hd + 0.05;

  polyMesh(
    g,
    [
      [-hw, facadeH, hd - 6.0],
      [-hw, 16.85, hd],
      [-hw + 6.5, facadeH, hd],
      [-hw, facadeH, hd],
    ],
    [0, 1, 3, 1, 2, 3, 0, 2, 1],
    M.concrete
  );

  addSculptedDiamond(g, -11.35, 4.15, rearZ, 3.85, 7.5, 0, 'louver', 0.72);
  addSculptedDiamond(g, -7.50, 4.15, rearZ, 3.85, 7.5, 0, 'relief', 0.52);

  addBottomGlazedTriangle(g, -4.3, 0.35, rearZ, 2.75, 3.8, 0, 0.48);
  addBottomGlazedTriangle(g, -1.5, 0.35, rearZ, 2.75, 3.8, 0, 0.48);
  addBottomGlazedTriangle(g,  1.3, 0.35, rearZ, 2.75, 3.8, 0, 0.48);

  addSculptedDiamond(g, -1.50, 5.95, rearZ, 3.65, 6.8, 0, 'glass', 0.52);
  addSculptedDiamond(g, -9.42, 9.40, rearZ, 3.85, 7.4, 0, 'relief', 0.55);
  beam(g, [-11.35, 9.4, rearZ + 0.28], [-hw - 0.1, 14.8, rearZ + 0.28], 0.48, 0.58, M.concrete);

  addSculptedDiamond(g, -4.80, 9.60, rearZ, 3.95, 7.5, 0, 'glass-sky', 0.55);
  addSculptedDiamond(g,  0.20, 9.60, rearZ, 3.95, 7.5, 0, 'glass-sky', 0.55);

  const upperBlkX = -8.2, upperBlkZ = hd - 6.8;
  const upperBlkW = 9.2, upperBlkD = 10.5, upperBlkH = 3.8;
  box(g, upperBlkX, facadeH + upperBlkH / 2, upperBlkZ, upperBlkW, upperBlkH, upperBlkD, M.concreteSmooth);
  box(g, upperBlkX - 2.0, facadeH + 2.1, upperBlkZ + upperBlkD / 2 + 0.06, 1.8, 1.1, 0.12, M.glass);
  box(g, upperBlkX + 0.8, facadeH + 2.1, upperBlkZ + upperBlkD / 2 + 0.06, 1.8, 1.1, 0.12, M.glass);
  const archRoofShape = new THREE.Shape();
  archRoofShape.moveTo(-upperBlkW / 2 - 0.9, 0);
  archRoofShape.quadraticCurveTo(0, 1.45, upperBlkW / 2 + 0.9, 0.2);
  archRoofShape.lineTo(upperBlkW / 2 + 0.9, -0.35);
  archRoofShape.quadraticCurveTo(0, 1.05, -upperBlkW / 2 - 0.9, -0.35);
  archRoofShape.closePath();
  const archRoof = extrudeShape(g, archRoofShape, upperBlkD + 1.4, M.roofCream);
  archRoof.position.set(upperBlkX, facadeH + upperBlkH - 0.2, upperBlkZ - upperBlkD / 2 - 0.7);

  // --------------------------------------------------------------------------
  // D. SOUTH-EAST REAR FACADE — ZONE 2 (CENTER):
  //    2-Storey Curved Glass Hall + Wide 11-Step Stairs + Giant Folded Concrete Hood
  // --------------------------------------------------------------------------
  const curveSegs = 6;
  const glassBotY = 5.2, glassTopY = 13.8, glassMidH = glassTopY - glassBotY;
  for (let i = 0; i < curveSegs; i++) {
    const t1 = i / curveSegs, t2 = (i + 1) / curveSegs;
    const x1 = hallX1 + t1 * hallW;
    const x2 = hallX1 + t2 * hallW;
    const z1 = hd - 0.1 + Math.sin(t1 * Math.PI) * 0.85;
    const z2 = hd - 0.1 + Math.sin(t2 * Math.PI) * 0.85;

    wallBetween(g, [x1, z1], [x2, z2], glassBotY, 9.6, M.glassSky, 0.18);
    wallBetween(g, [x1, z1], [x2, z2], 9.6, glassTopY, M.glass, 0.18);
    wallBetween(g, [x1, z1 + 0.06], [x2, z2 + 0.06], glassBotY - 0.18, glassBotY + 0.18, M.concreteSmooth, 0.32);
    wallBetween(g, [x1, z1 + 0.05], [x2, z2 + 0.05], 9.35, 9.65, M.whiteSign, 0.24);

    if (detail) {
      box(g, x1, (glassBotY + glassTopY) / 2, z1 + 0.08, 0.07, glassMidH, 0.1, M.metalDark);
      const xm = (x1 + x2) / 2, zm = (z1 + z2) / 2;
      box(g, xm, (glassBotY + glassTopY) / 2, zm + 0.08, 0.06, glassMidH, 0.08, M.metalDark);
      for (const my of [6.6, 8.0, 11.0, 12.4]) {
        wallBetween(g, [x1, z1 + 0.08], [x2, z2 + 0.08], my - 0.04, my + 0.04, M.metalDark, 0.08);
      }
      wallBetween(g, [x1, z1 - 0.25], [x2, z2 - 0.25], 5.9, 6.02, M.whiteSign, 0.06);
    }
  }

  const stairW = 9.0;
  const stairCX = hallX1 + stairW / 2;
  const numSteps = 11;
  const stepRun = 0.44;
  const stepRise = 0.95 / numSteps;
  for (let s = 0; s < numSteps; s++) {
    const sh = (numSteps - s) * stepRise;
    const sz = hd + 0.35 + s * stepRun;
    box(g, stairCX, sh / 2, sz, stairW, sh, stepRun + 0.04, M.paving);
    box(g, stairCX, sh - 0.02, sz + stepRun / 2 + 0.01, stairW, 0.03, 0.04, M.concreteDark);
  }

  beam(g, [hallX1 - 0.15, 1.35, hd], [hallX1 - 0.15, 0.35, hd + 5.0], 0.38, 0.55, M.concrete);
  if (detail) {
    for (const lz of [hd + 1.0, hd + 2.2, hd + 3.4, hd + 4.6]) {
      box(g, hallX1 + 0.08, 0.45 + (hd + 5.0 - lz) * 0.18, lz, 0.08, 0.22, 0.18, M.metalDark);
    }
    box(g, hallX1 - 1.1, 0.55, hd + 1.1, 1.25, 0.95, 0.75, M.binGreen);
    box(g, -5.8, 0.42, hd + 1.1, 14.2, 0.72, 1.2, M.hedge);
  }

  const rampX = hallX1 + stairW + 0.2; // +12.7m
  // Main cheek/ramp wall going forward along the right side of the stairs, sloping gently down toward the front
  const rampWallShape = new THREE.Shape();
  rampWallShape.moveTo(0, 0);
  rampWallShape.lineTo(7.2, 0);
  rampWallShape.lineTo(7.2, 1.05);
  rampWallShape.lineTo(0, 1.55);
  rampWallShape.closePath();
  const rampWall = extrudeShape(g, rampWallShape, 0.55, M.concrete);
  rampWall.rotation.y = -Math.PI / 2;
  rampWall.position.set(rampX + 0.28, 0, hd + 0.2);
  // Crisp light-grey top coping along the sloped ramp wall (foreground right of 5ae7b208.png!)
  beam(g, [rampX, 1.58, hd + 0.2], [rampX, 1.08, hd + 7.4], 0.62, 0.14, M.concreteSmooth);

  // Secondary parallel low concrete curb wall & grass strip in front of the ramp wall
  wallBetween(g, [rampX, hd + 7.4], [20.5, hd + 4.2], 0, 0.95, M.concrete, 0.45);
  polyMesh(
    g,
    [
      [rampX - 1.8, 0.08, hd + 5.4],
      [rampX + 0.3, 0.08, hd + 7.5],
      [20.5, 0.08, hd + 4.3],
      [20.5, 0.08, hd + 6.5],
      [rampX - 1.2, 0.08, hd + 8.6],
    ],
    [0, 1, 4, 1, 2, 3, 1, 3, 4],
    M.lawn
  );

  if (detail) {
    // Signature conical green shrub in front of the stairs & ramp wall (5ae7b208.png bottom-center!)
    const bushGroup = new THREE.Group();
    bushGroup.position.set(rampX - 1.1, 0, hd + 5.8);
    g.add(bushGroup);
    const bushBase = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.95, 14), M.foliage);
    bushBase.position.y = 0.98;
    bushGroup.add(bushBase);

    // Red-and-white striped metal traffic barrier fence in the foreground of 5ae7b208.png!
    const barZ = hd + 8.4;
    for (let bx = 3.5; bx <= 13.5; bx += 1.0) {
      const bMat = Math.round(bx) % 2 === 0 ? M.curbRed : M.curbWhite;
      box(g, bx + 0.5, 0.82, barZ, 1.0, 0.08, 0.06, bMat);
      box(g, bx + 0.5, 0.28, barZ, 1.0, 0.06, 0.06, bMat);
      box(g, bx, 0.45, barZ, 0.06, 0.85, 0.06, bMat);
    }
  }

  // 3. GIANT FOLDED TRIANGULAR CONCRETE HOOD / CANOPY OVER THE REAR HALL
  //    (Matched 1:1 to 5ae7b208.png & 84a23297.png:
  //     - Apex at y = 15.8m is LOWER than the 16.8m Right Wall so it never pokes above the roof!
  //     - Back edge is 100% flush against the building wall so there is zero gap from the East side!)
  const hWallLeft    = [0.2, 13.4, hd + 0.1];
  const hWallMid     = [3.4, 15.4, hd + 0.1];
  const hWallRight   = [7.2, 15.2, hd + 0.1];
  const hApexFront   = [3.4, 15.6, hd + 5.6];
  const hApexTop     = [3.4, 16.2, hd + 5.6];
  const hLegBotFront = [13.5, 1.0, hd + 5.2];
  const hLegBotBack  = [13.3, 1.0, hd + 0.1];

  // Top concrete surface of the overhanging canopy hood
  polyMesh(
    g,
    [
      [hWallLeft[0], hWallLeft[1] + 0.45, hWallLeft[2]],
      [hWallMid[0], hWallMid[1] + 0.45, hWallMid[2]],
      [hWallRight[0], hWallRight[1] + 0.45, hWallRight[2]],
      hApexTop,
    ],
    [0, 1, 3, 1, 2, 3],
    M.concreteSmooth
  );
  // Dark shaded underside ceiling soffit of the canopy hood
  polyMesh(g, [hWallLeft, hApexFront, hWallRight], [0, 1, 2], M.concreteSoffit);
  // Left fascia edge beam of the projecting hood
  beam(g, [0.2, 13.6, hd + 0.1], [3.4, 15.9, hd + 5.6], 0.52, 0.65, M.concreteSmooth);

  // Broad Folded Slanted Concrete Wall / Buttress Leg sloping from the Apex down-right to the Ramp Wall!
  polyMesh(
    g,
    [
      hApexTop,
      [hWallRight[0], hWallRight[1] + 0.45, hWallRight[2]],
      hLegBotBack,
      hLegBotFront,
    ],
    [0, 1, 2, 0, 2, 3],
    M.concreteSmooth
  );
  // Inner (-X/hall-side) dark concrete soffit face of the slanted leg
  polyMesh(
    g,
    [
      hApexFront,
      [hLegBotFront[0] - 0.5, hLegBotFront[1], hLegBotFront[2]],
      [hLegBotBack[0] - 0.5, hLegBotBack[1], hLegBotBack[2]],
      hWallRight,
    ],
    [0, 1, 2, 0, 2, 3],
    M.concreteSoffit
  );
  // Thick bevelled front & back edges of the slanted concrete leg
  beam(g, hApexTop, hLegBotFront, 0.68, 0.62, M.concreteSmooth);
  beam(g, [hWallRight[0], hWallRight[1] + 0.45, hWallRight[2]], hLegBotBack, 0.65, 0.6, M.concrete);

  // --------------------------------------------------------------------------
  // E. SOUTH-EAST REAR FACADE — ZONE 3 (RIGHT):
  //    Tall Fair-Faced Concrete Wall (`y = 16.8m`, taller than the hood!) with 2 Large Diamond Windows
  //    (Top-right & right edge of 5ae7b208.png & 84a23297.png!)
  // --------------------------------------------------------------------------
  const rightWallW = 7.2; // spans x = +13.3m to +20.5m
  const rightWallCX = hallX2 + rightWallW / 2; // +16.9m
  const rightWallH = 16.8; // Rises ABOVE the 16.2m hood apex just like in 5ae7b208.png!
  const rightWallD = 18.0; // spans z = hd - 18.0m to +hd (+22.01m)

  box(g, rightWallCX, rightWallH / 2, hd - rightWallD / 2, rightWallW, rightWallH, rightWallD, M.concrete);
  box(g, rightWallCX, rightWallH + 0.22, hd - rightWallD / 2, rightWallW + 0.2, 0.44, rightWallD + 0.2, M.concreteDark);

  // TWO Large Glazed Diamond Windows side-by-side on the Right SE Wall (`z = hd + 0.05m` — visible on right of 5ae7b208.png & 84a23297.png!)
  addSculptedDiamond(g, 15.35, 6.2, hd + 0.05, 3.15, 7.6, 0, 'glass-sky', 0.55);
  addSculptedDiamond(g, 18.65, 6.2, hd + 0.05, 3.15, 7.6, 0, 'glass-sky', 0.55);

  // --------------------------------------------------------------------------
  // F. SOUTH-WEST SIDE FACADE — SE HALF (`z = +11.0m` to `+22.0m`, Photo dbb55ae5.png)
  // --------------------------------------------------------------------------
  const swX = -hw - 0.05; // -13.35m

  addSculptedDiamond(g, swX, 4.15, hd - 1.95, 3.85, 7.5, -Math.PI / 2, 'louver', 0.72);
  addBottomGlazedTriangle(g, swX, 8.2, hd - 1.5, 2.8, 4.6, -Math.PI / 2, 0.52);
  addSculptedDiamond(g, swX, 8.8, hd - 3.9, 3.8, 7.2, -Math.PI / 2, 'relief', 0.55);
  beam(g, [swX - 0.28, 9.2, hd - 2.0], [swX - 0.28, 16.5, hd - 0.1], 0.55, 0.48, M.concrete);

  addSculptedDiamond(g, swX, 4.8,  hd - 5.8, 3.7, 7.0, -Math.PI / 2, 'glass', 0.52);
  addSculptedDiamond(g, swX, 11.2, hd - 6.2, 3.7, 6.8, -Math.PI / 2, 'glass-sky', 0.52);
  addSculptedDiamond(g, swX, 8.2,  hd - 8.6, 3.7, 6.8, -Math.PI / 2, 'glass-sky', 0.52);
  addBottomGlazedTriangle(g, swX, 0.35, hd - 8.2, 2.8, 3.8, -Math.PI / 2, 0.48);

  if (detail) {
    for (const acZ of [hd - 0.4, hd - 1.55]) {
      box(g, -hw - 1.25, 1.05, acZ, 0.82, 1.75, 0.98, M.whiteSign);
      box(g, -hw - 1.68, 1.35, acZ, 0.05, 0.65, 0.65, M.metalDark);
    }
    box(g, -hw - 1.8, 0.48, hd + 1.4, 3.8, 0.82, 1.4, M.hedge);
    box(g, -hw - 3.2, 0.52, hd - 4.2, 2.2, 0.88, 7.5, M.hedge);
    box(g, -hw - 4.6, 0.42, hd - 3.2, 2.4, 0.72, 4.2, M.shrubRed);
    beam(g, [-hw - 2.6, 0.55, hd + 2.2], [-hw - 0.5, 0.55, hd + 2.2], 0.06, 0.75, M.whiteSign);
  }

  // --------------------------------------------------------------------------
  // G. SHARP WEST CORNER WING, 1-STOREY RECESSED PORTAL & SW CANTILEVERED WAFFLE BOX
  //    (Matching Street View Photos c916509d.jpg & 4c2a5d19.jpg 1:1!)
  // --------------------------------------------------------------------------
  const wJoinNW = [-6.5, -16.5];
  const wApex   = [-19.8, -5.8];
  const wJoinSE = [-13.3, 11.2];
  const peakH   = 18.0;
  const eaveH   = 15.6;

  const vNW_bot = [wJoinNW[0], 4.6, wJoinNW[1]];
  const vNW_top = [wJoinNW[0], eaveH, wJoinNW[1]];
  const vAP_bot = [wApex[0],   4.6, wApex[1]];
  const vAP_top = [wApex[0],   peakH, wApex[1]];
  const vSE_bot = [wJoinSE[0], 4.6, wJoinSE[1]];
  const vSE_top = [wJoinSE[0], eaveH, wJoinSE[1]];
  const vIN_bot = [-6.5,       4.6, 2.0];
  const vIN_top = [-6.5,       eaveH, 2.0];

  polyMesh(g, [vNW_bot, vAP_bot, vAP_top, vNW_top], [0, 1, 2, 0, 2, 3], M.concrete);
  polyMesh(g, [vAP_bot, vSE_bot, vSE_top, vAP_top], [0, 1, 2, 0, 2, 3], M.concrete);
  polyMesh(g, [vNW_top, vAP_top, vSE_top, vIN_top], [0, 1, 3, 1, 2, 3], M.roofCream);
  polyMesh(g, [vNW_bot, vAP_bot, vSE_bot, vIN_bot], [0, 1, 3, 1, 2, 3], M.concreteSmooth);

  // 2. Details on the LEFT FACE (NW Face: W_JOIN_NW [x=0] -> W_APEX [x=+lenL])
  const leftGroup = new THREE.Group();
  leftGroup.position.set(wJoinNW[0], 0, wJoinNW[1]);
  const dxL = wApex[0] - wJoinNW[0];
  const dzL = wApex[1] - wJoinNW[1];
  const lenL = Math.hypot(dxL, dzL);
  leftGroup.rotation.y = -Math.atan2(dzL, dxL);
  g.add(leftGroup);

  box(leftGroup, lenL * 0.25, 2.3, -1.8, lenL * 0.5, 4.6, 3.6, M.concrete);

  addSculptedDiamond(leftGroup, 3.2, 11.4, 0.05, 3.1, 5.5, 0, 'louver', 0.48);
  addSculptedDiamond(leftGroup, 3.2, 5.2,  0.05, 3.1, 5.5, 0, 'louver', 0.48);
  beam(leftGroup, [4.8, 8.3, 0.08], [lenL - 0.2, 13.2, 0.08], 0.16, 0.12, M.concreteSmooth);
  beam(leftGroup, [4.8, 8.3, 0.08], [lenL - 0.2, 4.6,  0.08], 0.16, 0.12, M.concreteSmooth);
  beam(leftGroup, [0.2, eaveH, 0.08], [lenL, peakH, 0.08], 0.42, 0.42, M.concreteSmooth);

  const apronShape = new THREE.Shape();
  apronShape.moveTo(4.6, 0.0);
  apronShape.lineTo(lenL, 0.0);
  apronShape.lineTo(lenL, 4.6);
  apronShape.lineTo(6.4, 4.6);
  apronShape.closePath();
  const leftApron = extrudeShape(leftGroup, apronShape, 0.55, M.concrete);
  leftApron.position.z = -0.25;

  beam(leftGroup, [4.5, 0.2, 0.25], [6.4, 4.65, 0.25], 0.38, 0.38, M.whiteSign);
  beam(leftGroup, [6.4, 4.65, 0.25], [lenL + 0.2, 4.65, 0.25], 0.38, 0.38, M.whiteSign);
  if (detail) {
    box(leftGroup, 8.2, 1.15, 0.32, 0.85, 2.1, 0.08, M.metalGrey);
    for (const px of [5.4, 5.85]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.05, 10), M.pipeRed);
      pipe.position.set(px, 0.52, 0.45);
      leftGroup.add(pipe);
    }
    box(leftGroup, 3.2, 0.42, 0.9, 3.8, 0.72, 1.1, M.hedge);
  }

  // 3. Details on the RIGHT FACE (SW Face: W_APEX [x=0] -> W_JOIN_SE [x=+lenR])
  const rightGroup = new THREE.Group();
  rightGroup.position.set(wApex[0], 0, wApex[1]);
  const dxR = wJoinSE[0] - wApex[0];
  const dzR = wJoinSE[1] - wApex[1];
  const lenR = Math.hypot(dxR, dzR);
  rightGroup.rotation.y = -Math.atan2(dzR, dxR);
  g.add(rightGroup);
  beam(rightGroup, [0, peakH, 0.08], [lenR, eaveH, 0.08], 0.42, 0.42, M.concreteSmooth);

  // A. 1-STOREY RECESSED CORNER PORTAL / UNDERCROFT
  box(rightGroup, 4.8, 2.3, -3.6, 9.6, 4.6, 0.4, M.concreteDark);
  box(rightGroup, 0.25, 2.3, -1.8, 0.5, 4.6, 3.6, M.concrete);
  box(rightGroup, 9.5, 2.3, -1.8, 0.5, 4.6, 3.6, M.concreteDark);
  box(rightGroup, 3.5, 2.65, -3.35, 1.35, 1.45, 0.1, M.glass);
  box(rightGroup, 3.8, 0.85, -3.35, 2.4, 1.7, 0.1, M.louverDark);

  box(rightGroup, 4.9, 4.35, -0.1, 9.8, 0.65, 0.65, M.concrete);
  beam(rightGroup, [-0.2, 4.65, 0.25], [9.9, 4.65, 0.25], 0.38, 0.38, M.whiteSign);
  beam(rightGroup, [9.9, 4.65, 0.25], [10.8, 0.2, 0.25], 0.38, 0.38, M.whiteSign);

  const pierShape = new THREE.Shape();
  pierShape.moveTo(4.5, 0.65);
  pierShape.lineTo(5.8, 0.65);
  pierShape.lineTo(6.3, 4.4);
  pierShape.lineTo(4.1, 4.4);
  pierShape.closePath();
  const mainPier = extrudeShape(rightGroup, pierShape, 0.75, M.concrete);
  mainPier.position.z = -0.35;
  box(rightGroup, 5.15, 0.32, 0.0, 1.35, 0.65, 0.72, M.concreteDark);

  const rightLegShape = new THREE.Shape();
  rightLegShape.moveTo(8.8, 4.4);
  rightLegShape.lineTo(9.3, 0.0);
  rightLegShape.lineTo(10.8, 0.0);
  rightLegShape.lineTo(9.9, 4.6);
  rightLegShape.closePath();
  const rightLeg = extrudeShape(rightGroup, rightLegShape, 0.68, M.concrete);
  rightLeg.position.z = -0.3;

  // B. UPPER & LOWER DIAMOND LOUVERS + STAGGERED EMBOSSED DIAMONDS
  addSculptedDiamond(rightGroup, 2.6, 12.2, 0.06, 3.4, 6.6, 0, 'louver', 0.55);
  addSculptedDiamond(rightGroup, 4.4, 8.2,  0.05, 3.4, 6.4, 0, 'relief', 0.45);
  addSculptedDiamond(rightGroup, 6.2, 11.6, 0.05, 3.4, 6.4, 0, 'relief', 0.45);
  addSculptedDiamond(rightGroup, 8.0, 8.2,  0.05, 3.4, 6.4, 0, 'relief', 0.45);
  addSculptedDiamond(rightGroup, 9.8, 4.8,  0.06, 3.4, 6.4, 0, 'louver', 0.52);

  // C. UPPER CANTILEVERED CONCRETE OBSERVATION BOX WITH DEEP WAFFLE SOFFIT
  const cantW = 6.2;
  const cantH = 5.0;
  const cantL = 8.4;
  const cantU = 14.2;
  const cantY = 13.1;
  const cantZ = cantW / 2;

  box(rightGroup, cantU, cantY, cantZ, cantL, cantH, cantW, M.concrete);
  box(rightGroup, cantU + 0.4, cantY - 0.25, cantW - 0.35, cantL - 2.2, 2.3, 0.8, M.concreteSoffit);
  box(rightGroup, cantU + 0.4, cantY - 0.25, cantW - 0.65, cantL - 2.4, 2.1, 0.2, M.glass);
  box(rightGroup, cantU + 0.4, cantY - 1.15, cantW + 0.04, cantL - 2.0, 0.75, 0.45, M.concreteSmooth);

  const swSoffitY = cantY - cantH / 2;
  box(rightGroup, cantU, swSoffitY + 0.12, cantZ, cantL - 0.2, 0.24, cantW - 0.2, M.concreteDark);
  for (let su = cantU - cantL / 2 + 0.4; su <= cantU + cantL / 2 - 0.3; su += 1.65) {
    box(rightGroup, su, swSoffitY - 0.22, cantZ, 0.28, 0.46, cantW - 0.2, M.concrete);
  }
  for (let sz = 0.45; sz <= cantW - 0.35; sz += 1.4) {
    box(rightGroup, cantU, swSoffitY - 0.22, sz, cantL - 0.2, 0.46, 0.28, M.concrete);
  }

  box(rightGroup, 14.9, 2.25, -0.6, 5.4, 4.5, 1.4, M.concreteSoffit);
  box(rightGroup, 14.9, 4.6, 0.35, 6.2, 0.6, 0.85, M.concrete);
  beam(rightGroup, [11.8, 0, 0.35], [12.2, 4.6, 0.35], 0.65, 0.75, M.concrete);
  beam(rightGroup, [18.0, 0, 0.35], [17.5, 4.6, 0.35], 0.65, 0.75, M.concrete);

  // D. FOREGROUND DRIVEWAY, GREEN HEDGE, RED-WHITE CURB & "ห้ามจอด" SIGN
  box(rightGroup, 9.5, 0.08, 4.2, 22.0, 0.16, 6.8, M.paving);
  box(rightGroup, 5.2, 0.48, 1.15, 9.8, 0.85, 1.15, M.hedge);
  box(rightGroup, 10.5, 0.35, 7.6, 18.0, 0.7, 0.35, M.concrete);
  box(rightGroup, 10.5, 0.12, 9.8, 18.0, 0.24, 4.2, M.lawn);

  if (detail) {
    for (let c = 0; c < 10; c++) {
      const cMat = c % 2 === 0 ? M.curbRed : M.curbWhite;
      box(rightGroup, -1.2 + c * 0.75, 0.14, 1.85 + c * 0.45, 0.72, 0.26, 0.28, cMat);
    }
    box(rightGroup, 1.2, 0.65, 2.2, 0.55, 0.72, 0.06, M.whiteSign);
    box(rightGroup, 1.2, 0.65, 2.24, 0.45, 0.62, 0.02, M.curbRed);
    box(rightGroup, 1.02, 0.35, 2.2, 0.04, 0.7, 0.04, M.metalGrey);
    box(rightGroup, 1.38, 0.35, 2.2, 0.04, 0.7, 0.04, M.metalGrey);
  }

  // --------------------------------------------------------------------------
  // H. 100% Closed Cream Roof over the Main Block
  // --------------------------------------------------------------------------
  box(g, westCoreCX, facadeH - 0.2, 5.0, westCoreW, 0.4, rearD, M.roofCream);
  box(g, cantFrontCX, 16.2 - 0.15, -hd + 7.0, cantFrontW, 0.35, 14.0, M.roofCream);
  box(g, westCoreCX, facadeH + 0.2, hd - 0.25, westCoreW, 0.4, 0.5, M.concreteDark);
}

// ==============================================================================
// 2. SOLAR WING, SOARING PROW (WITH 3D GEAR), 3-PEAK LATTICE & PLANAR SOLAR ROOF
// ==============================================================================
function createSolarWingAndProw(root, detail) {
  const g = new THREE.Group();
  g.name = 'en18-solar-wing';
  root.add(g);

  const { prowBase, innerCorner, eastEave, neMidEave, northEave, nwEave } = en18SolarWing;

  const dx = innerCorner[0] - prowBase[0];
  const dz = innerCorner[1] - prowBase[1];
  const wallLen = Math.hypot(dx, dz);
  const wallAngle = -Math.atan2(dz, dx);

  const latticeGroup = new THREE.Group();
  latticeGroup.position.set(prowBase[0], 0, prowBase[1]);
  latticeGroup.rotation.y = wallAngle;
  g.add(latticeGroup);

  // --------------------------------------------------------------------------
  // A. Upper Monolithic Concrete Wall & 3-Peak Diamond Lattice (NW Front)
  // --------------------------------------------------------------------------
  const wallShape = new THREE.Shape();
  wallShape.moveTo(0.0, 0.0);
  wallShape.lineTo(0.85, 0.0);
  wallShape.lineTo(9.0, 14.8);
  wallShape.lineTo(12.9, 8.1);
  wallShape.lineTo(15.4, 12.3);
  wallShape.lineTo(18.6, 6.8);
  wallShape.lineTo(20.5, 10.0);
  wallShape.lineTo(wallLen + 0.4, 5.2);
  wallShape.lineTo(wallLen + 0.4, 17.5);
  wallShape.lineTo(2.0, 24.5);
  wallShape.lineTo(0.0, 22.2);
  wallShape.closePath();

  const upperWall = extrudeShape(latticeGroup, wallShape, 0.9, M.concrete);
  upperWall.position.z = -0.45;

  const strutW = 0.68, strutD = 1.02;
  const upStruts = [
    [[0.4, 0, 0], [8.85, 14.55, 0]],
    [[5.8, 0, 0], [11.4, 9.7, 0]],
    [[11.2, 0, 0], [15.25, 12.05, 0]],
    [[16.6, 0, 0], [20.35, 9.75, 0]],
    [[21.4, 0, 0], [23.2, 5.2, 0]],
  ];
  const downStruts = [
    [[9.15, 14.55, 0], [17.4, 0, 0]],
    [[4.7, 7.4, 0], [9.0, 0, 0]],
    [[6.7, 10.8, 0], [12.9, 0, 0]],
    [[15.55, 12.05, 0], [22.2, 0, 0]],
    [[20.65, 9.75, 0], [24.0, 2.5, 0]],
  ];
  for (const [p1, p2] of [...upStruts, ...downStruts]) {
    beam(latticeGroup, p1, p2, strutW, strutD, M.concrete);
  }

  const glassShape = new THREE.Shape();
  glassShape.moveTo(3.4, 5.2);
  glassShape.lineTo(9.0, 14.8);
  glassShape.lineTo(12.9, 8.1);
  glassShape.lineTo(15.4, 12.3);
  glassShape.lineTo(18.6, 6.8);
  glassShape.lineTo(20.5, 10.0);
  glassShape.lineTo(wallLen, 5.2);
  glassShape.closePath();

  const atriumGlass = extrudeShape(latticeGroup, glassShape, 0.16, M.glass);
  atriumGlass.position.z = -0.55;

  if (detail) {
    for (let s = 4.0; s <= 19.0; s += 1.6) {
      const hMax = s < 9.0 ? 5.2 + (s - 3.4) * 1.6 : 14.0 - (s - 9.0) * 0.7;
      if (hMax > 5.6) {
        beam(latticeGroup, [s, 5.2, -0.35], [s + (hMax - 5.2) * 0.58, hMax, -0.35], 0.06, 0.08, M.metalGrey);
        beam(latticeGroup, [s + 2.0, 5.2, -0.35], [s + 2.0 - (hMax - 5.2) * 0.58, hMax, -0.35], 0.06, 0.08, M.metalGrey);
      }
    }
  }

  const stepsCount = 7;
  const stepRise = 0.13;
  const stepRun = 0.48;
  for (let i = 0; i < stepsCount; i++) {
    const curH = (stepsCount - i) * stepRise;
    const zOff = 0.8 + i * stepRun;
    box(latticeGroup, 13.5, curH / 2, zOff, 21.5, curH, stepRun + 0.05, M.paving);
  }

  const vestLen = 21.0;
  const vestW = 10.5;
  const vestCeilY = 5.2;
  box(latticeGroup, vestLen / 2 + 1.5, 0.48, -vestW / 2, vestLen, 0.96, vestW, M.paving);
  box(latticeGroup, vestLen / 2 + 1.5, vestCeilY + 0.22, -vestW / 2, vestLen, 0.44, vestW, M.concreteDark);
  for (let sx = 3.0; sx <= vestLen; sx += 1.9) {
    box(latticeGroup, sx, vestCeilY - 0.2, -vestW / 2, 0.24, 0.44, vestW - 0.4, M.concrete);
  }
  for (let sz = -0.8; sz >= -vestW + 0.6; sz -= 1.8) {
    box(latticeGroup, vestLen / 2 + 1.5, vestCeilY - 0.2, sz, vestLen - 1.0, 0.44, 0.24, M.concrete);
  }
  for (let vBay = 0; vBay < 3; vBay++) {
    const sMid = 5.5 + vBay * 6.0;
    beam(latticeGroup, [sMid, 0.8, -vestW + 0.8], [sMid - 2.7, vestCeilY + 0.1, -vestW + 0.8], 0.62, 0.78, M.concrete);
    beam(latticeGroup, [sMid, 0.8, -vestW + 0.8], [sMid + 2.7, vestCeilY + 0.1, -vestW + 0.8], 0.62, 0.78, M.concrete);
  }

  // --------------------------------------------------------------------------
  // B. Prow NW Wall, 3D Gear Emblem at the Peak & Seamless Planar Solar Roof
  // --------------------------------------------------------------------------
  // Exact World Coordinates of `rightWall`'s front-right corner `(x_local = +20.5m, z_local = +22.01m)`
  // so the East wall of the Solar Wing meets the Right SE Wall with ZERO step and ZERO gap!
  const seRightCorner = [25.12, -72.46];
  const seSpineJoin   = [19.30, -68.23];

  const vProwBase    = [prowBase[0], 0, prowBase[1]];
  const vProwNose    = [prowBase[0], 22.2, prowBase[1]];
  const vProwPeak    = [prowBase[0] + 1.46, 24.5, prowBase[1] + 1.37];
  const vProwPeakNW  = [prowBase[0] - 1.25, 23.4, prowBase[1] - 2.15];

  const vNwBase      = [nwEave[0], 0, nwEave[1]];
  const vNwTop       = [nwEave[0], 16.5, nwEave[1]];
  const vNorthBase   = [northEave[0], 0, northEave[1]];
  const vNorthTop    = [northEave[0], 15.6, northEave[1]];
  const vNeMidBase   = [neMidEave[0], 0, neMidEave[1]];
  const vNeMidTop    = [neMidEave[0], 15.6, neMidEave[1]];
  const vEastBase    = [eastEave[0], 0, eastEave[1]];
  const vEastTop     = [eastEave[0], 16.0, eastEave[1]];
  const vSeRightBase = [seRightCorner[0], 0, seRightCorner[1]];
  const vSeRightTop  = [seRightCorner[0], 16.8, seRightCorner[1]];
  const vSeSpineBase = [seSpineJoin[0], 0, seSpineJoin[1]];
  const vSeSpineTop  = [seSpineJoin[0], 17.2, seSpineJoin[1]];
  const vSpineCornerTop = [innerCorner[0], 17.5, innerCorner[1]];

  polyMesh(
    g,
    [vProwBase, vNwBase, vNwTop, vProwPeakNW, vProwNose],
    [0, 1, 2, 0, 2, 3, 0, 3, 4],
    M.concrete
  );
  polyMesh(
    g,
    [vProwPeak, vProwPeakNW, vNwTop, vSpineCornerTop],
    [0, 1, 2, 0, 2, 3],
    M.concrete
  );
  polyMesh(g, [vProwNose, vProwPeak, vProwPeakNW], [0, 1, 2], M.concrete);

  const triA = new THREE.Vector3(...vProwNose);
  const triB = new THREE.Vector3(...vProwPeak);
  const triC = new THREE.Vector3(...vProwPeakNW);
  const chamferNormal = new THREE.Vector3();
  new THREE.Triangle(triA, triB, triC).getNormal(chamferNormal);
  if (chamferNormal.y < 0) chamferNormal.negate();

  const centroid = new THREE.Vector3()
    .add(triA)
    .add(triB)
    .add(triC)
    .multiplyScalar(1 / 3)
    .addScaledVector(chamferNormal, 0.08);

  const emblemGroup = new THREE.Group();
  emblemGroup.position.copy(centroid);
  emblemGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), chamferNormal);
  g.add(emblemGroup);

  const emblemR = 0.88;
  const gearDisc = new THREE.Mesh(new THREE.CylinderGeometry(emblemR * 0.85, emblemR * 0.85, 0.14, 32), M.metalDark);
  gearDisc.rotation.x = Math.PI / 2;
  emblemGroup.add(gearDisc);

  const apexTeeth = 16;
  for (let i = 0; i < apexTeeth; i++) {
    const theta = (i / apexTeeth) * Math.PI * 2;
    const tx = Math.cos(theta) * (emblemR * 0.92);
    const ty = Math.sin(theta) * (emblemR * 0.92);
    const tooth = box(emblemGroup, tx, ty, 0, 0.22, 0.18, 0.16, M.gold);
    tooth.rotation.z = theta;
  }
  const goldRing = new THREE.Mesh(new THREE.TorusGeometry(emblemR * 0.72, 0.07, 12, 32), M.gold);
  goldRing.position.z = 0.05;
  emblemGroup.add(goldRing);
  const innerHub = new THREE.Mesh(new THREE.TorusGeometry(emblemR * 0.38, 0.05, 10, 24), M.gold);
  innerHub.position.z = 0.06;
  emblemGroup.add(innerHub);
  box(emblemGroup, 0, 0, 0.08, emblemR * 0.28, emblemR * 0.58, 0.06, M.curbWhite);

  // --------------------------------------------------------------------------
  // C. 100% Closed Perimeter Concrete Walls & Smooth Planar Solar Roof Deck
  // --------------------------------------------------------------------------
  polyMesh(g, [vNwBase, vNorthBase, vNorthTop, vNwTop], [0, 1, 2, 0, 2, 3], M.concrete);
  polyMesh(g, [vNorthBase, vNeMidBase, vNeMidTop, vNorthTop], [0, 1, 2, 0, 2, 3], M.concrete);
  polyMesh(g, [vNeMidBase, vEastBase, vEastTop, vNeMidTop], [0, 1, 2, 0, 2, 3], M.concrete);
  polyMesh(g, [vEastBase, vSeRightBase, vSeRightTop, vEastTop], [0, 1, 2, 0, 2, 3], M.concrete);

  // Sculpted Diamond Windows & Reliefs along the East / North-East Wall (so the East side in ef1abfa7.png has authentic architectural detail!)
  const eastAng1 = -Math.atan2(vSeRightBase[2] - vEastBase[2], vSeRightBase[0] - vEastBase[0]) + Math.PI / 2;
  addSculptedDiamond(g, 22.0, 7.2, -80.2, 3.6, 7.4, eastAng1, 'glass-sky', 0.45);
  addSculptedDiamond(g, 19.2, 7.2, -87.2, 3.6, 7.4, eastAng1, 'relief', 0.42);
  const eastAng2 = -Math.atan2(vEastBase[2] - vNeMidBase[2], vEastBase[0] - vNeMidBase[0]) + Math.PI / 2;
  addSculptedDiamond(g, 11.2, 7.2, -103.2, 3.6, 7.2, eastAng2, 'relief', 0.42);
  addSculptedDiamond(g, 6.8,  7.2, -110.6, 3.6, 7.2, eastAng2, 'louver', 0.45);

  const roofVerts = [
    vNwTop,
    vNorthTop,
    vNeMidTop,
    vEastTop,
    vSeRightTop,
    vSeSpineTop,
    vSpineCornerTop,
  ];
  const roofIndices = [
    6, 0, 1,
    6, 1, 2,
    6, 2, 3,
    6, 3, 5,
    5, 3, 4,
  ];
  polyMesh(
    g,
    roofVerts.map(([rx, ry, rz]) => [rx, ry - 0.35, rz]),
    roofIndices,
    M.concrete
  );

  const roofMesh = polyMesh(g, roofVerts, roofIndices, M.roofDark);

  beam(g, vProwNose, vProwPeak, 0.9, 0.9, M.concrete);
  beam(g, vProwNose, vProwPeakNW, 0.9, 0.9, M.concrete);
  beam(g, vProwPeak, vProwPeakNW, 0.9, 0.9, M.concrete);
  beam(g, vProwPeakNW, vNwTop, 0.65, 0.85, M.concrete);
  beam(g, vProwPeak, vSpineCornerTop, 0.65, 0.85, M.concrete);
  beam(g, vNwTop, vNorthTop, 0.55, 0.75, M.concreteDark);
  beam(g, vNorthTop, vNeMidTop, 0.55, 0.75, M.concreteDark);
  beam(g, vNeMidTop, vEastTop, 0.55, 0.75, M.concreteDark);
  beam(g, vEastTop, vSeRightTop, 0.55, 0.75, M.concreteDark);
  beam(g, vSpineCornerTop, vSeSpineTop, 0.6, 0.75, M.concreteDark);

  // 4 Parallel Rows of Solar Panels kept strictly inside the roof margins (zero overhang!)
  if (detail) {
    roofMesh.updateMatrixWorld(true);
    const raycaster = new THREE.Raycaster();
    const downDir = new THREE.Vector3(0, -1, 0);
    const spineDir = new THREE.Vector3(0.64, 0, 0.768).normalize();

    const rowsConfig = [
      { startX: -10.5, startZ: -112.0, groups: 6 },
      { startX: -7.5,  startZ: -114.2, groups: 6 },
      { startX: -4.5,  startZ: -116.4, groups: 6 },
      { startX: -1.5,  startZ: -118.6, groups: 5 },
    ];

    for (const row of rowsConfig) {
      for (let grp = 0; grp < row.groups; grp++) {
        const dist = grp * 4.8;
        const gx = row.startX + spineDir.x * dist;
        const gz = row.startZ + spineDir.z * dist;

        raycaster.set(new THREE.Vector3(gx, 40, gz), downDir);
        const hits = raycaster.intersectObject(roofMesh, false);
        if (!hits.length) continue;

        const hit = hits[0];
        const roofNormal = hit.face.normal.clone();
        if (roofNormal.y < 0) roofNormal.negate();
        roofNormal.normalize();

        const rightDir = new THREE.Vector3().crossVectors(roofNormal, spineDir).normalize();
        const alignedSpine = new THREE.Vector3().crossVectors(rightDir, roofNormal).normalize();
        const rotMatrix = new THREE.Matrix4().makeBasis(alignedSpine, roofNormal, rightDir);

        const cluster = new THREE.Group();
        cluster.position.set(gx, hit.point.y + 0.18, gz);
        cluster.quaternion.setFromRotationMatrix(rotMatrix);
        g.add(cluster);

        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 3; c++) {
            const px = (c - 1) * 1.42;
            const pz = (r - 0.5) * 1.05;
            box(cluster, px, 0.04, pz, 1.34, 0.05, 0.98, M.solarFrame);
            box(cluster, px, 0.08, pz, 1.26, 0.03, 0.90, M.solar);
          }
        }
      }
    }
  }
}

// ==============================================================================
// 3. ELEVATED CONCRETE GALLERY & GIANT GEAR WALL (100% Closed Roof)
// ==============================================================================
function createGearGallery(root, detail) {
  const { start, end, gearS, gearY, gearRadius, holeRadius, teethCount } = en18GearGallery;

  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const totalLen = Math.hypot(dx, dz);
  const angle = -Math.atan2(dz, dx);

  const g = new THREE.Group();
  g.name = 'en18-gear-gallery';
  g.position.set(start[0], 0, start[1]);
  g.rotation.y = angle;
  root.add(g);

  const wallShape = new THREE.Shape();
  wallShape.moveTo(0.0, 0.0);
  wallShape.lineTo(7.6, 0.0);
  wallShape.lineTo(9.0, 2.15);
  wallShape.lineTo(totalLen + 1.0, 2.15);
  wallShape.lineTo(totalLen + 1.0, 6.1);
  wallShape.lineTo(22.4, 6.1);
  wallShape.lineTo(22.4, 5.5);
  wallShape.lineTo(18.0, 5.5);
  wallShape.lineTo(18.0, 4.9);
  wallShape.lineTo(13.6, 4.9);
  wallShape.lineTo(13.6, 4.3);
  wallShape.lineTo(8.5, 4.3);
  wallShape.lineTo(8.5, 4.8);
  wallShape.lineTo(3.4, 4.8);
  wallShape.lineTo(1.75, 4.35);
  wallShape.lineTo(2.45, 3.85);
  wallShape.absarc(2.55, 2.35, 1.55, Math.PI * 0.46, Math.PI * 1.12, true);
  wallShape.lineTo(1.55, 2.05);
  wallShape.lineTo(0.0, 0.15);
  wallShape.closePath();

  const gearHole = new THREE.Path();
  gearHole.absarc(gearS, gearY, holeRadius, 0, Math.PI * 2, false);
  wallShape.holes.push(gearHole);

  const wallThickness = 0.55;
  const frontWall = extrudeShape(g, wallShape, wallThickness, M.concrete);
  frontWall.position.z = -wallThickness / 2;

  const canopy = box(g, 5.2, 5.05, -0.7, 7.2, 0.45, 2.6, M.concreteDark);
  canopy.rotation.z = 0.03;

  const gearGroup = new THREE.Group();
  gearGroup.position.set(gearS, gearY, 0);
  g.add(gearGroup);

  const outerRim = new THREE.Mesh(
    new THREE.RingGeometry(holeRadius + 0.35, gearRadius - 0.18, 36),
    M.gear
  );
  outerRim.position.z = wallThickness / 2 + 0.18;
  gearGroup.add(outerRim);

  const hubRing = new THREE.Mesh(
    new THREE.RingGeometry(holeRadius, holeRadius + 0.35, 32),
    M.concreteDark
  );
  hubRing.position.z = wallThickness / 2 + 0.1;
  gearGroup.add(hubRing);

  const rimBand = new THREE.Mesh(
    new THREE.CylinderGeometry(gearRadius - 0.18, gearRadius - 0.18, wallThickness + 0.36, 36, 1, true),
    M.gear
  );
  rimBand.rotation.x = Math.PI / 2;
  gearGroup.add(rimBand);

  const boreLiner = new THREE.Mesh(
    new THREE.CylinderGeometry(holeRadius, holeRadius, wallThickness + 0.22, 32, 1, true),
    M.concreteDark
  );
  boreLiner.rotation.x = Math.PI / 2;
  gearGroup.add(boreLiner);

  for (const r of [holeRadius + 0.06, holeRadius + 0.36, gearRadius - 0.22]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 12, 36), M.concrete);
    ring.position.z = wallThickness / 2 + 0.16;
    gearGroup.add(ring);
  }

  for (let i = 0; i < teethCount; i++) {
    const theta = (i / teethCount) * Math.PI * 2;
    const ty = Math.sin(theta) * gearRadius;
    if (gearY + ty < 0.1) continue;
    const tx = Math.cos(theta) * (gearRadius - 0.05);
    const tooth = box(gearGroup, tx, ty, 0.06, 0.42, 0.34, wallThickness + 0.28, M.gear);
    tooth.rotation.z = theta;
  }

  beam(g, [6.9, 0, 0.12], [9.4, 4.9, 0.12], 0.42, 0.55, M.concrete);
  if (detail) {
    const pipeFrom = new THREE.Vector3(6.6, 0.2, 0.36);
    const pipeTo = new THREE.Vector3(9.1, 4.6, 0.36);
    const pipeDir = new THREE.Vector3().subVectors(pipeTo, pipeFrom);
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, pipeDir.length(), 12),
      M.metalGrey
    );
    pipe.position.copy(pipeFrom).addScaledVector(pipeDir, 0.5);
    pipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pipeDir.clone().normalize());
    g.add(pipe);
  }

  const galleryDepth = 3.2;
  const bridgeLen = totalLen - 7.8;
  const bridgeS = 8.5 + bridgeLen / 2;
  box(g, bridgeS, 2.35, -galleryDepth / 2, bridgeLen, 0.4, galleryDepth, M.concreteDark);
  box(g, bridgeS, 3.8, -galleryDepth + 0.25, bridgeLen, 3.1, 0.45, M.concrete);

  const bays = [
    { s1: 8.6,  s2: 13.6, yWallTop: 4.3, yWinH: 0.55, yRoof: 5.12 },
    { s1: 13.6, s2: 18.0, yWallTop: 4.9, yWinH: 0.55, yRoof: 5.72 },
    { s1: 18.0, s2: 22.4, yWallTop: 5.5, yWinH: 0.55, yRoof: 6.32 },
    { s1: 22.4, s2: 26.2, yWallTop: 6.1, yWinH: 0.55, yRoof: 6.92 },
  ];
  for (const bay of bays) {
    const bw = bay.s2 - bay.s1;
    const bs = (bay.s1 + bay.s2) / 2;
    box(g, bs, bay.yWallTop + bay.yWinH / 2, -0.08, bw - 0.1, bay.yWinH, 0.25, M.glass);
    box(g, bs, bay.yRoof, -galleryDepth / 2 + 0.15, bw + 0.35, 0.55, galleryDepth + 0.5, M.concrete);
    box(g, bs, bay.yRoof - 0.6, -galleryDepth + 0.25, bw + 0.2, 1.1, 0.45, M.concrete);
  }

  const ribs = [
    { sBot: 10.5, sTop: 13.7, yTop: 5.35 },
    { sBot: 14.9, sTop: 18.1, yTop: 5.95 },
    { sBot: 19.3, sTop: 22.5, yTop: 6.55 },
    { sBot: 23.5, sTop: 25.5, yTop: 3.95 },
  ];
  for (const r of ribs) {
    beam(g, [r.sBot, 0, 0.22], [r.sTop, r.yTop, 0.22], 0.52, 0.65, M.concrete);
    beam(g, [r.sBot + 1.8, 0, -galleryDepth + 0.3], [r.sBot + 0.2, 2.35, -galleryDepth + 0.3], 0.48, 0.55, M.concreteDark);
  }

  const curbSegments = 36;
  const curbTotalLen = totalLen + 2.0;
  const segLen = curbTotalLen / curbSegments;
  for (let i = 0; i < curbSegments; i++) {
    const sx = -1.0 + (i + 0.5) * segLen;
    const curbMat = i % 2 === 0 ? M.curbRed : M.curbWhite;
    box(g, sx, 0.12, 2.35, segLen + 0.02, 0.24, 0.28, curbMat);
  }
  box(g, totalLen / 2 - 0.5, 0.48, 1.75, totalLen + 1.0, 0.72, 0.85, M.hedge);
}

// ==============================================================================
// 4. FRONT WHITE HALF-GEAR SIGN & ROOFTOP COOLING TOWERS
// ==============================================================================
function createForecourtAndAnnexes(root, detail) {
  const g = new THREE.Group();
  g.name = 'en18-forecourt-annexes';
  root.add(g);

  // --------------------------------------------------------------------------
  // A. Forecourt Concrete Apron & Zig-Zag Hedge Planters
  // --------------------------------------------------------------------------
  polyMesh(
    g,
    [
      [-35.0, 0.06, -116.0],
      [-23.0, 0.06, -120.0],
      [-6.0, 0.06, -104.0],
      [-28.0, 0.06, -88.0],
      [-37.0, 0.06, -98.0],
    ],
    [0, 1, 2, 0, 2, 3, 0, 3, 4],
    M.paving
  );

  const hedgePts = [
    [-29.5, -116.5],
    [-23.5, -118.5],
    [-19.5, -114.5],
    [-24.5, -110.5],
    [-21.5, -107.5],
  ];
  for (let i = 0; i < hedgePts.length - 1; i++) {
    wallBetween(g, hedgePts[i], hedgePts[i + 1], 0.06, 0.82, M.hedge, 0.95);
  }

  // --------------------------------------------------------------------------
  // B. White Half-Gear Arch Sign "คณะวิศวกรรมศาสตร์" on Green Mound (Photo 4)
  // --------------------------------------------------------------------------
  const signGroup = new THREE.Group();
  signGroup.position.set(-28.2, 0, -98.5);
  signGroup.rotation.y = -Math.PI * 0.68;
  g.add(signGroup);

  const mound = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.8, 0.65, 24), M.hedge);
  mound.scale.set(1.25, 1.0, 0.85);
  mound.position.set(0, 0.32, 0);
  signGroup.add(mound);

  for (let i = -5; i <= 5; i++) {
    const cMat = (i + 10) % 2 === 0 ? M.curbRed : M.curbWhite;
    box(signGroup, i * 0.72, 0.14, 2.9, 0.7, 0.26, 0.28, cMat);
  }

  const archOuterR = 2.05;
  const archInnerR = 1.28;
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0.55, archOuterR, 0, Math.PI, false);
  archShape.lineTo(-archInnerR, 0.55);
  archShape.absarc(0, 0.55, archInnerR, Math.PI, 0, true);
  archShape.closePath();

  const whiteArch = extrudeShape(signGroup, archShape, 0.38, M.whiteSign);
  whiteArch.position.z = -0.19;

  const archTeeth = 11;
  for (let i = 0; i < archTeeth; i++) {
    const theta = (i / (archTeeth - 1)) * Math.PI;
    const tx = Math.cos(theta) * (archOuterR + 0.16);
    const ty = 0.55 + Math.sin(theta) * (archOuterR + 0.16);
    const tooth = box(signGroup, tx, ty, 0, 0.38, 0.34, 0.38, M.whiteSign);
    tooth.rotation.z = theta - Math.PI / 2;
  }

  if (detail) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2d3330';
    ctx.font = '700 58px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const str = 'คณะวิศวกรรมศาสตร์';
    const chars = [...str];
    const centerX = 512, centerY = 460, radiusPx = 335;
    const startAngle = -Math.PI * 0.82;
    const endAngle = -Math.PI * 0.18;
    chars.forEach((ch, idx) => {
      const a = startAngle + (idx / (chars.length - 1)) * (endAngle - startAngle);
      ctx.save();
      ctx.translate(centerX + Math.cos(a) * radiusPx, centerY + Math.sin(a) * radiusPx);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(archOuterR * 2.1, archOuterR * 1.05),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5 })
    );
    textPlane.position.set(0, 0.55 + archOuterR * 0.5, 0.21);
    signGroup.add(textPlane);

    const treeGroup = new THREE.Group();
    treeGroup.position.set(-24.5, 0, -104.5);
    g.add(treeGroup);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 4.8, 10), M.trunk);
    trunk.position.y = 2.4;
    treeGroup.add(trunk);
    for (const [ox, oy, oz, r] of [[0, 6.2, 0, 2.6], [-1.1, 5.4, 0.8, 2.0], [1.1, 5.6, -0.7, 2.1]]) {
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), M.foliage);
      crown.position.set(ox, oy, oz);
      treeGroup.add(crown);
    }

    // 3 Rooftop Cooling Towers on the West Wing Roof Deck (visible from top/satellite view)
    const { westPlant } = en18Annexes;
    for (const [tx, tz] of westPlant.towers) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.8, 20), M.roofCream);
      tower.position.set(tx, 16.5, tz);
      tower.castShadow = true;
      g.add(tower);

      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.35, 16), M.metalDark);
      fan.position.set(tx, 17.5, tz);
      g.add(fan);
    }
  }
}

// ==============================================================================
// MAIN INTEGRATION EXPORT
// ==============================================================================
export function createEN18(root, detail = true) {
  const buildingRoot = new THREE.Group();
  buildingRoot.name = 'building-EN18';
  root.add(buildingRoot);

  createMainBlock(buildingRoot, detail);
  createSolarWingAndProw(buildingRoot, detail);
  createGearGallery(buildingRoot, detail);
  createForecourtAndAnnexes(buildingRoot, detail);
}
