import assert from "node:assert/strict";
import clip from "../vendor/polygon-clipping/index.js";
import * as THREE from "../vendor/three/three.module.js";
import { eastPlanting } from "../src/east-planting.js";
import { eastCanopies } from "../src/east-canopies.js";
import {
  makeSiteLayout,
  auditSite,
  area,
  rectangle,
} from "../src/site-layout.js";
const layout = makeSiteLayout(),
  audit = auditSite(layout);
const lowRoofs = Object.entries(eastCanopies).map(([id, c]) => ({
  id,
  geometry: [rectangle(c.x, c.z, c.w, c.d)],
}));
for (let i = 0; i < lowRoofs.length; i++)
  for (let j = i + 1; j < lowRoofs.length; j++)
    assert(
      area(clip.intersection(lowRoofs[i].geometry, lowRoofs[j].geometry)) <
        0.005,
      `low roofs must meet at an edge or remain clear: ${lowRoofs[i].id}/${lowRoofs[j].id}`,
    );
for (const t of eastPlanting) {
  const root = [rectangle(t.x, t.z, 0.2, 0.2)];
  for (const roof of lowRoofs)
    assert(
      area(clip.intersection(root, roof.geometry)) < 0.005,
      `tree trunk must not pierce a low roof: ${t.kind}/${roof.id}`,
    );
  assert(
    area(clip.intersection(root, layout.roadSurface)) < 0.005,
    "tree roots must stay off roads",
  );
  assert(
    area(clip.intersection(root, layout.occupied)) < 0.005,
    "tree roots must stay outside buildings",
  );
  for (const p of layout.parking)
    assert(
      area(clip.intersection(root, p.geometry)) < 0.005,
      "tree roots must stay outside parking bays",
    );
}
const cpeParking = layout.parking.find((p) => p.id === "MC-CPE");
assert(
  Math.max(...cpeParking.polygon.map((p) => p[0])) <= 212,
  "CPE motorcycle shelter and bays must stop before the computer entrance",
);
const southCar = layout.parking.find((p) => p.id === "PC-EE-S");
const southMoto = layout.parking.find((p) => p.id === "MC-EE");
assert(
  Math.min(...southMoto.polygon.map((p) => p[1])) -
    Math.max(...southCar.polygon.map((p) => p[1])) >=
    5,
  "retain the circulation aisle between EE car bays and motorcycle shelter",
);
const courtIsland = [rectangle(207, 19, 27, 12.4)];
for (const p of layout.parking.filter((p) =>
  ["PC-EE-N", "PC-EE-S", "MC-CPE", "MC-EE"].includes(p.id),
))
  assert(
    area(clip.intersection(courtIsland, p.geometry)) < 0.005,
    "parking must stop at the lawn island curb",
  );
assert.deepEqual(
  audit.conflicts,
  [],
  "roads/parking/driveways must not intersect occupied footprints",
);
assert.equal(
  audit.roadComponents,
  1,
  "all vehicular lanes and parking entries must be connected",
);
for (const p of layout.parking) {
  const entry = layout.driveways.find((d) => d.id === p.id);
  assert(
    area(clip.intersection(entry.geometry, p.geometry)) > 0.05,
    `${p.id}: entry must reach parking`,
  );
  assert(
    area(clip.intersection(entry.geometry, layout.roadSurface)) > 0.05,
    `${p.id}: entry must reach the lane network`,
  );
}
for (const d of layout.driveways.filter((d) => d.surface === "pavers"))
  assert(
    area(clip.intersection(d.pavingGeometry, layout.roadSurface)) < 0.005,
    "concrete apron must stop at asphalt edge, without round caps protruding into the road",
  );
for (const w of layout.walks) {
  assert(
    area(clip.intersection(w.geometry, layout.vehicleSurface)) < 0.005,
    `${w.id}: walkway must not cover traffic lanes`,
  );
  assert(
    area(clip.intersection(w.geometry, layout.occupied)) < 0.005,
    `${w.id}: walkway must not cut through a building`,
  );
}
assert(
  area(clip.intersection([rectangle(-10, -38, 1, 1)], layout.roadSurface)) ===
    0,
  "EN18/EN16 gap is a forecourt, not an invented cross road",
);
assert(
  layout.roads.find((r) => r.id === "pien-east-access").surface === "pavers",
  "Street View confirms tiled service access",
);
assert(
  area(clip.intersection([rectangle(-246, -82, 2, 2)], layout.roadSurface)) <
    0.005,
  "west roundabout island must remain out of traffic surface",
);
// Check the same triangulation used by the renderer, including road-loop holes.
// A connected polygon alone would not catch triangles missing during rendering.
let triangleArea = 0;
for (const polygon of layout.vehicleSurface) {
  const shape = new THREE.Shape(
    polygon[0].map(([x, z]) => new THREE.Vector2(x, -z)),
  );
  for (const hole of polygon.slice(1))
    shape.holes.push(
      new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))),
    );
  const geometry = new THREE.ShapeGeometry(shape);
  const vertices = geometry.attributes.position,
    indices = geometry.index;
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.getX(i),
      b = indices.getX(i + 1),
      c = indices.getX(i + 2);
    triangleArea +=
      Math.abs(
        (vertices.getX(b) - vertices.getX(a)) *
          (vertices.getY(c) - vertices.getY(a)) -
          (vertices.getY(b) - vertices.getY(a)) *
            (vertices.getX(c) - vertices.getX(a)),
      ) / 2;
  }
  geometry.dispose();
}
assert(
  Math.abs(triangleArea - area(layout.vehicleSurface)) < 0.05,
  "rendered road triangles must cover the complete vehicle surface",
);
console.log("PASS: rendered road surface area matches planar layout");
console.log("PASS:", JSON.stringify(audit));
console.log(
  `PASS: all ${layout.parking.length} parking areas have connected entries; pedestrian paths excluded from roads/buildings; no invented forecourt road; paved service lane; roundabout island`,
);
