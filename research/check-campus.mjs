import assert from "node:assert/strict";
import {
  buildings,
  sourceCatalog,
  toGeo,
  fromGeo,
} from "../src/campus-data.js";
assert.equal(buildings.length, 17);
assert.equal(new Set(buildings.map((b) => b.id)).size, 17);
assert(!buildings.some((b) => b.id === "EN03"));
for (const b of buildings) {
  assert(b.bounds && b.center && Number.isFinite(b.height), b.id);
  assert(b.bounds.maxX > b.bounds.minX && b.bounds.maxZ > b.bounds.minZ, b.id);
  for (const id of b.sources)
    assert(sourceCatalog[id], `${b.id}: missing source ${id}`);
  for (const p of b.parts)
    for (const k of ["x", "z", "w", "d", "h", "rotation"])
      assert(Number.isFinite(p[k]), `${b.id}.${k}`);
  const g = toGeo(...b.center),
    r = fromGeo(g.latitude, g.longitude);
  assert(Math.hypot(r[0] - b.center[0], r[1] - b.center[1]) < 0.00001);
}
assert(buildings.find((b) => b.id === "EN09").aliases.includes("CB"));
assert(buildings.find((b) => b.id === "EN15").name.includes("เก่า"));
assert(buildings.find((b) => b.id === "EN15").usage.includes("ใช้งานอื่น"));
assert(!buildings.find((b) => b.id === "EN15").usage.includes("ไม่ใช้งาน"));
assert(buildings.find((b) => b.id === "EN18").usage.includes("ห้องสมุด"));
const cb = buildings.find((b) => b.id === "EN09"),
  [cx, cz] = fromGeo(cb.mapPin.latitude, cb.mapPin.longitude);
assert(
  cx > cb.bounds.minX - 10 &&
    cx < cb.bounds.maxX + 10 &&
    cz > cb.bounds.minZ - 10 &&
    cz < cb.bounds.maxZ + 10,
);
console.log(
  "PASS: 17 unique buildings, skipped EN03, finite parts/bounds, geographic round trips, source references, CB pin and library identities",
);
