import * as THREE from "three";
const presets = {
  morning: {
    name: "เช้า",
    sky: "#c0d3d8",
    sun: "#ffe4bc",
    sunPower: 2.65,
    sunPosition: [-210, 160, 240],
    hemi: 1.12,
    fill: 0.27,
    environment: 0.63,
    exposure: 1.0,
    lamps: 0,
  },
  evening: {
    name: "เย็น",
    sky: "#c7c4bb",
    sun: "#ffd0a0",
    sunPower: 2.4,
    sunPosition: [-260, 100, 170],
    hemi: 0.85,
    fill: 0.24,
    environment: 0.53,
    exposure: 1.04,
    lamps: 0,
  },
  night: {
    name: "กลางคืน",
    sky: "#172c40",
    sun: "#b3cbe8",
    sunPower: 0.28,
    sunPosition: [-180, 200, 150],
    hemi: 0.46,
    fill: 0.16,
    environment: 0.25,
    exposure: 1.08,
    lamps: 1,
  },
};
export function createSceneTools({
  renderer,
  scene,
  camera,
  sun,
  hemi,
  fill,
  model,
  terrain,
  onPhotoMode,
  onCapture,
  getCaption,
  toast,
}) {
  const $ = (s) => document.querySelector(s),
    panel = $("#atmospherePanel");
  let active = "morning",
    clean = false,
    exposure = 1;
  const lit = new Set();
  scene.traverse((o) => {
    if (o.isMesh && /glass/i.test(o.material?.name || "")) lit.add(o.material);
  });
  // A few representative exterior fixtures; emissive windows share their materials.
  const lamps = new THREE.Group();
  scene.add(lamps);
  for (const [x, y, z] of [
    [1, 2.8, 63],
    [32, 2.1, 84],
    [54, 2.8, 69],
    [-19, 2.8, 52],
  ]) {
    const light = new THREE.PointLight("#ffd19b", 0, 15, 2);
    light.position.set(x, y, z);
    lamps.add(light);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 8, 6),
      new THREE.MeshStandardMaterial({
        color: "#eedac0",
        emissive: "#ffd69f",
        emissiveIntensity: 0,
      }),
    );
    bulb.position.set(x, y + 0.15, z);
    lamps.add(bulb);
  }
  function apply() {
    const p = presets[active];
    scene.background.set(p.sky);
    scene.fog.color.set(p.sky);
    scene.environmentIntensity = p.environment;
    sun.color.set(p.sun);
    sun.intensity = p.sunPower;
    sun.position.fromArray(p.sunPosition);
    hemi.intensity = p.hemi;
    fill.intensity = p.fill;
    renderer.toneMappingExposure = p.exposure * exposure;
    for (const m of lit) {
      m.emissive.set("#d8aa6d");
      m.emissiveIntensity = p.lamps * 0.2;
    }
    model.materials.glassDark.emissive.set("#d8aa6d");
    model.materials.glassDark.emissiveIntensity = p.lamps * 0.22;
    document.body.classList.toggle("night", active === "night");
    terrain.streetLights.setNight(active === "night");
    lamps.children.forEach((o) => {
      if (o.isLight) o.intensity = p.lamps * 13;
      else o.material.emissiveIntensity = p.lamps * 1.4;
    });
    $("#lightingNote").textContent =
      p.name + (p.lamps > 0.5 ? " · บรรยากาศจำลอง" : "");
    document
      .querySelectorAll("[data-light]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", b.dataset.light === active),
      );
  }
  document.querySelectorAll("[data-light]").forEach((b) =>
    b.addEventListener("click", () => {
      active = b.dataset.light;
      apply();
    }),
  );
  $("#dayNight").addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    $("#dayNight").setAttribute("aria-expanded", String(!panel.hidden));
  });
  $("#atmosphereClose").addEventListener("click", () => {
    panel.hidden = true;
    $("#dayNight").setAttribute("aria-expanded", "false");
    $("#dayNight").focus();
  });
  function setClean(value) {
    clean = value;
    panel.hidden = true;
    $("#dayNight").setAttribute("aria-expanded", "false");
    document.body.classList.toggle("photo-mode", value);
    $("#photoExit").hidden = !value;
    $("#photoMode").setAttribute("aria-pressed", String(value));
    onPhotoMode(value);
    if (value) $("#photoExit").focus();
    else $("#photoMode").focus();
  }
  $("#photoMode").addEventListener("click", () => setClean(!clean));
  $("#photoExit").addEventListener("click", () => setClean(false));
  async function save() {
    const button = $("#snapshotButton");
    button.disabled = true;
    try {
      onCapture?.(true);
      renderer.render(scene, camera);
      const out = document.createElement("canvas");
      out.width = renderer.domElement.width;
      out.height = renderer.domElement.height;
      const ctx = out.getContext("2d");
      ctx.drawImage(renderer.domElement, 0, 0);
      const scale = out.width / 1200;
      ctx.font = `${Math.max(12, 14 * scale)}px sans-serif`;
      ctx.fillStyle = "rgba(250,251,245,.9)";
      ctx.fillRect(0, out.height - 38 * scale, out.width, 38 * scale);
      ctx.fillStyle = "#294737";
      ctx.fillText(
        `EN KKU · ${getCaption()} · ${presets[active].name} · แบบจำลองภายนอก / สัดส่วนประมาณ`,
        18 * scale,
        out.height - 14 * scale,
      );
      const blob = await new Promise((resolve) =>
        out.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error("No image");
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `en-kku-${active}-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast("บันทึกภาพ PNG แล้ว");
    } catch (error) {
      console.error(error);
      toast("บันทึกภาพไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      button.disabled = false;
      onCapture?.(false);
    }
  }
  $("#snapshotButton").addEventListener("click", save);
  window.addEventListener("keydown", (e) => {
    if (
      e.target.closest?.("input,textarea,select") ||
      document.querySelector("dialog[open]")
    )
      return;
    if (e.key === "Escape" && clean) setClean(false);
    if (e.altKey && e.code === "KeyP") {
      e.preventDefault();
      save();
    }
    if (e.code === "KeyH" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setClean(!clean);
    }
  });
  apply();
  return {
    get photoMode() {
      return clean;
    },
    get lighting() {
      return active;
    },
  };
}
