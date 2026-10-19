import * as THREE from "three";
export const ambientStrength = { value: 0.85 };
const patched = new WeakSet();
function shadeMaterial(material) {
  if (patched.has(material) || !material.isMeshStandardMaterial) return;
  patched.add(material);
  const prior = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prior.call(material, shader, renderer);
    shader.uniforms.uCampusAmbient = ambientStrength;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aCampusAmbient;\nvarying float vCampusAmbient;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvCampusAmbient=aCampusAmbient;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uCampusAmbient;\nvarying float vCampusAmbient;",
      )
      .replace(
        "#include <aomap_fragment>",
        "#include <aomap_fragment>\nfloat campusAccessibility=mix(1.0,vCampusAmbient,uCampusAmbient);\nreflectedLight.indirectDiffuse*=campusAccessibility;\nreflectedLight.indirectSpecular*=mix(1.0,campusAccessibility,0.55);",
      );
  };
  material.customProgramCacheKey = () => "campus-ambient-v1";
  material.defaultAttributeValues = {
    ...material.defaultAttributeValues,
    aCampusAmbient: [1],
  };
  material.needsUpdate = true;
}
// One-time short-range ambient accessibility against structural box proxies.
// Structural meshes opt in; railings, glass and vegetation are not occluders.
export function bakeAmbientDetail(root) {
  root.updateMatrixWorld(true);
  const proxies = [],
    receivers = [],
    cells = new Map(),
    cellSize = 4,
    radius = 1.7;
  const key = (x, y, z) => `${x},${y},${z}`;
  root.traverse((o) => {
    if (!o.isMesh || !o.userData.ambientStructure) return;
    o.geometry.computeBoundingBox();
    const bounds = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    const record = { object: o, bounds };
    proxies.push(record);
    receivers.push(record);
    const lo = bounds.min
        .clone()
        .addScalar(-radius)
        .divideScalar(cellSize)
        .floor(),
      hi = bounds.max.clone().addScalar(radius).divideScalar(cellSize).floor();
    for (let x = lo.x; x <= hi.x; x++)
      for (let y = lo.y; y <= hi.y; y++)
        for (let z = lo.z; z <= hi.z; z++) {
          const k = key(x, y, z);
          if (!cells.has(k)) cells.set(k, []);
          cells.get(k).push(record);
        }
  });
  const origin = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    tangent = new THREE.Vector3(),
    bitangent = new THREE.Vector3(),
    direction = new THREE.Vector3(),
    hit = new THREE.Vector3(),
    ray = new THREE.Ray();
  for (const { object: o } of receivers) {
    const pos = o.geometry.attributes.position,
      norm = o.geometry.attributes.normal,
      values = new Float32Array(pos.count),
      nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < pos.count; i++) {
      normal.fromBufferAttribute(norm, i).applyMatrix3(nm).normalize();
      origin
        .fromBufferAttribute(pos, i)
        .applyMatrix4(o.matrixWorld)
        .addScaledVector(normal, 0.035);
      tangent
        .set(
          Math.abs(normal.y) < 0.9 ? 0 : 1,
          Math.abs(normal.y) < 0.9 ? 1 : 0,
          0,
        )
        .cross(normal)
        .normalize();
      bitangent.crossVectors(normal, tangent);
      const nearby =
        cells.get(
          key(
            Math.floor(origin.x / cellSize),
            Math.floor(origin.y / cellSize),
            Math.floor(origin.z / cellSize),
          ),
        ) || [];
      let blocked = 0;
      for (let s = 0; s < 8; s++) {
        const angle = (s * Math.PI) / 4;
        direction
          .copy(normal)
          .multiplyScalar(0.65)
          .addScaledVector(tangent, Math.cos(angle) * 0.76)
          .addScaledVector(bitangent, Math.sin(angle) * 0.76)
          .normalize();
        ray.set(origin, direction);
        let nearest = radius;
        for (const proxy of nearby) {
          if (proxy.object === o) continue;
          if (proxy.bounds.containsPoint(origin)) {
            nearest = 0;
            break;
          }
          if (ray.intersectBox(proxy.bounds, hit))
            nearest = Math.min(nearest, origin.distanceTo(hit));
        }
        blocked += 1 - nearest / radius;
      }
      values[i] = Math.max(0.35, 1 - (blocked / 8) * 0.82);
    }
    o.geometry.setAttribute(
      "aCampusAmbient",
      new THREE.BufferAttribute(values, 1),
    );
    shadeMaterial(o.material);
  }
}
let contactMaterial;
export function addContactShadow(parent, x, z, width, depth, y = 0.07) {
  if (!contactMaterial) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d"),
      g = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
    g.addColorStop(0, "rgba(29,38,26,.25)");
    g.addColorStop(0.4, "rgba(29,38,26,.14)");
    g.addColorStop(1, "rgba(29,38,26,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    contactMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    contactMaterial,
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.renderOrder = 1;
  parent.add(mesh);
  return mesh;
}
