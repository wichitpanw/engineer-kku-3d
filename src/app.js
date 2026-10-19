import { campusPoints } from "./campus-points.js";
import { photosForBuilding } from "./building-photos.js?v=one-photo";
import { createSceneTools } from "./scene-tools.js?v=20261019-tools";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createPienvichit, createEnvironment } from "./model.js";
import { createTerrain } from "./terrain.js?v=20261019-tools2";
import { createCampusBuildings } from "./campus-buildings.js?v=20261019-tools";
import { buildings, STATUS, CAMPUS_BOUNDS } from "./campus-data.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const escapeHTML = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
start().catch((error) => {
  console.error(error);
  $("#loading").hidden = true;
  $("#webglError").hidden = false;
  $("#webglError").textContent =
    "เปิดฉาก 3D ไม่สำเร็จ กรุณารีเฟรชหรือตรวจว่าเบราว์เซอร์รองรับ WebGL";
});
async function start() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  $("#viewer").append(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#b4cfdc");
  scene.fog = new THREE.Fog("#b4cfdc", 850, 1600);
  scene.environment = createEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(
      45,
      innerWidth / innerHeight,
      0.15,
      2200,
    ),
    controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 10;
  controls.maxDistance = 1200;
  controls.maxPolarAngle = Math.PI / 2 - 0.015;
  controls.screenSpacePanning = false;
  const allView = { position: [-350, 440, 510], target: [30, 4, -35] };
  camera.position.fromArray(allView.position);
  controls.target.fromArray(allView.target);
  const hemi = new THREE.HemisphereLight("#ecf3fa", "#78826c", 1.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff2d8", 2.8);
  sun.position.set(-150, 320, 160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -310,
    right: 310,
    top: 310,
    bottom: -310,
    near: 1,
    far: 850,
  });
  sun.shadow.normalBias = 0.3;
  sun.shadow.bias = -0.0006;
  sun.target.position.set(20, 0, -35);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#d8e7ef", 0.45);
  fill.position.set(170, 70, -100);
  scene.add(fill);
  const model = createPienvichit(scene),
    campus = createCampusBuildings(scene, model),
    terrain = createTerrain(scene);
  $("#viewer").dataset.siteAudit = JSON.stringify(terrain.audit);
  const mapMeta = await fetch("assets/faculty-map-metadata.json").then((r) => {
    if (!r.ok) throw Error("Missing minimap calibration");
    return r.json();
  });
  let selected = null,
    walking = false,
    photoMode = false,
    activePoint = null,
    pointLabelsVisible = true,
    transition = null,
    toastTimer,
    labelsVisible = true,
    walkYaw = 0,
    walkPitch = 0,
    lastTime = performance.now(),
    dragging = false,
    startX = 0,
    startY = 0,
    lastX = 0,
    lastY = 0,
    moved = 0;
  let frames = 0,
    frameStart = performance.now(),
    fps = 0;
  const keys = new Set(),
    raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let sidebarOpen = innerWidth > 760;
  function setSidebarOpen(open) {
    sidebarOpen = open;
    document.body.classList.toggle("sidebar-collapsed", !open);
    $("#panel").classList.toggle("mobile-open", open);
    $("#panel").inert = !open;
    $("#panel").setAttribute("aria-hidden", String(!open));
    $("#panelToggle").setAttribute("aria-expanded", String(open));
    const label = open ? "หุบแถบด้านซ้าย" : "เปิดแถบด้านซ้าย";
    $("#panelToggle").setAttribute("aria-label", label);
    $("#panelToggle").title = label;
    resize();
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.clearViewOffset();
    $("#panelToggle").textContent =
      innerWidth > 760 ? (sidebarOpen ? "‹" : "›") : sidebarOpen ? "×" : "☰";
    if (innerWidth > 760 && sidebarOpen && !walking && !photoMode)
      camera.setViewOffset(
        innerWidth,
        innerHeight,
        -160,
        0,
        innerWidth,
        innerHeight,
      );
    camera.updateProjectionMatrix();
  }
  setSidebarOpen(sidebarOpen);
  window.addEventListener("resize", resize);
  function toast(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 3400);
  }
  function fly(position, target, fov = 45) {
    if (walking) stopWalk(false);
    transition = null;
    // Ground reference views need to look upward; the global orbit clamp otherwise
    // silently lifts the camera above its requested Street View height.
    controls.maxPolarAngle =
      target[1] >= position[1] ? Math.PI * 0.56 : Math.PI / 2 - 0.015;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.target.fromArray(target);
    camera.position.fromArray(position);
    camera.lookAt(controls.target);
    controls.update();
    controls.enableDamping = damping;
  }
  controls.addEventListener("start", () => {
    transition = null;
  });
  function focusBuilding(b, side = "front") {
    if (!b?.bounds) return;
    if (b.id === "EN14" && side === "front") {
      fly([1, 6.4, 96], [1, 6, 52], 84);
      return;
    }
    if (b.id === "EN09" && side === "front") {
      fly([232, 10, -186], [205, 7, -128], 54);
      return;
    }

    const [x, z] = b.center,
      r = b.bounds,
      w = r.maxX - r.minX,
      d = r.maxZ - r.minZ,
      dist = Math.max(65, Math.max(w, d) * 1.65, b.height * 2.4),
      target = [x, b.height * 0.4, z];
    const positions = {
      front: [x - dist * 0.6, b.height + dist * 0.55, z + dist],
      east: [x + dist, b.height + dist * 0.42, z + dist * 0.1],
      rear: [x + dist * 0.45, b.height + dist * 0.55, z - dist],
      west: [x - dist, b.height + dist * 0.4, z + dist * 0.05],
    };
    fly(positions[side] || positions.front, target, 45);
  }
  let currentPhotos = [],
    photoRequest = 0;
  function activateTab(name) {
    $$(".panel-tabs button").forEach((b) =>
      b.setAttribute("aria-selected", String(b.dataset.tab === name)),
    );
    $("#buildingTab").hidden = name !== "building";
    $("#referencesTab").hidden = name !== "references";
  }
  function references(b) {
    currentPhotos = photosForBuilding(b);
    $("#referenceHeading").textContent = b
      ? `${b.id} · ${b.name}`
      : "เลือกอาคารเพื่อดูภาพจริง";
    $("#referenceCount").textContent = "";
    showReference();
  }
  function showReference() {
    const request = ++photoRequest;
    const p = currentPhotos[0],
      img = $("#referenceImage"),
      open = $("#referenceOpen");
    img.hidden = true;
    img.removeAttribute("src");
    open.disabled = true;
    $("#referenceMissing").hidden = false;
    $("#referenceTitle").textContent = p?.title || "ภาพจริงของอาคาร";
    $("#referenceDescription").textContent =
      p?.description || "เลือกรหัสอาคารจากแท็บสำรวจอาคาร";
    $("#referencePath").textContent = p ? p.file.replace("assets/", "") : "";
    $("#referenceMissingText").textContent = p
      ? "ยังไม่มีภาพสำหรับอาคารนี้"
      : "ยังไม่ได้เลือกอาคาร";
    if (!p) return;
    img.alt = p.title;
    let extension = 0;
    const base = p.file.replace(/\.(jpg|png|webp)$/i, ""),
      types = ["jpg", "png", "webp"];
    function load() {
      if (request !== photoRequest) return;
      img.onload = () => {
        if (request !== photoRequest) return;
        img.hidden = false;
        open.disabled = false;
        $("#referenceMissing").hidden = true;
      };
      img.onerror = () => {
        if (request !== photoRequest) return;
        if (++extension < types.length) load();
      };
      img.src = `${base}.${types[extension]}?v=${Date.now()}`;
    }
    load();
  }
  $("#referenceReload").addEventListener("click", () => showReference());
  $("#referenceOpen").addEventListener("click", () => {
    const p = currentPhotos[0];
    if (!p || $("#referenceImage").hidden) return;
    $("#photoImage").src = $("#referenceImage").src;
    $("#photoImage").alt = p.title;
    $("#photoTitle").textContent = p.title;
    $("#photoDescription").textContent = p.description;
    $("#photoDialog").showModal();
  });
  const pointElements = new Map();
  function renderPointList() {
    const points = campusPoints.filter((p) => p.building === selected?.id);
    $("#pointExplorer").hidden = !points.length;
    $("#pointList").replaceChildren();
    for (const p of points) {
      const button = document.createElement("button");
      button.textContent = `${p.number} · ${p.title}`;
      button.setAttribute("aria-pressed", String(activePoint?.id === p.id));
      button.addEventListener("click", () => selectPoint(p));
      $("#pointList").append(button);
      pointElements
        .get(p.id)
        ?.classList.toggle("selected", activePoint?.id === p.id);
    }
  }
  function selectPoint(point) {
    activePoint = point;
    if (selected?.id !== point.building) selectBuilding(point.building, false);
    fly(point.camera, point.target, point.fov);
    renderPointList();
    references(selected);
    activateTab("references");
    setSidebarOpen(true);
  }
  for (const point of campusPoints) {
    const button = document.createElement("button");
    button.className = "point-tag";
    button.innerHTML = `<b>${point.number}</b><span>${escapeHTML(point.title)}</span>`;
    button.setAttribute("aria-label", `สำรวจ ${point.title}`);
    button.hidden = true;
    button.addEventListener("click", () => selectPoint(point));
    $("#pointLabels").append(button);
    pointElements.set(point.id, button);
  }
  $("#pointLabelsToggle").addEventListener("change", (e) => {
    pointLabelsVisible = e.target.checked;
  });
  const labelElements = new Map(),
    miniElements = new Map(),
    NS = "http://www.w3.org/2000/svg";
  function miniPoint(x, z) {
    return [
      mapMeta.originPixelX + x / mapMeta.metersPerPixel,
      mapMeta.originPixelY + z / mapMeta.metersPerPixel,
    ];
  }
  for (const b of buildings) {
    const label = document.createElement("button");
    label.className = "building-tag";
    label.innerHTML = `<b>${b.id}</b><span>${escapeHTML(b.name)}</span>`;
    label.title = `${b.id} ${b.name}`;
    label.setAttribute("aria-label", `เลือก ${b.id} ${b.name}`);
    label.addEventListener("click", () => selectBuilding(b.id));
    $("#buildingLabels").append(label);
    labelElements.set(b.id, label);
    const poly = document.createElementNS(NS, "polygon");
    const r = b.bounds,
      points = b.footprint || [
        [r.minX, r.minZ],
        [r.maxX, r.minZ],
        [r.maxX, r.maxZ],
        [r.minX, r.maxZ],
      ];
    poly.setAttribute(
      "points",
      points.map((p) => miniPoint(...p).join(",")).join(" "),
    );
    poly.setAttribute("tabindex", "0");
    poly.setAttribute("role", "button");
    poly.setAttribute("aria-label", `เลือก ${b.id} จากแผนที่เล็ก`);
    poly.addEventListener("click", () => selectBuilding(b.id));
    poly.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectBuilding(b.id);
      }
    });
    $("#minimapOverlay").append(poly);
    miniElements.set(b.id, poly);
  }
  const cameraDot = document.createElementNS(NS, "circle");
  cameraDot.setAttribute("r", "10");
  cameraDot.setAttribute("class", "camera-dot");
  $("#minimapOverlay").append(cameraDot);
  function renderList() {
    const query = $("#buildingSearch")
      .value.trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    const matches = buildings.filter((b) =>
      [b.id, b.name, b.en, ...(b.aliases || [])].some((t) =>
        t.toLowerCase().replace(/\s+/g, "").includes(query),
      ),
    );
    $("#resultCount").textContent =
      `${matches.length} / ${buildings.length} อาคาร`;
    $("#buildingList").replaceChildren();
    for (const b of matches) {
      const button = document.createElement("button");
      button.className =
        "building-row" + (selected?.id === b.id ? " active" : "");
      button.setAttribute(
        "aria-pressed",
        selected?.id === b.id ? "true" : "false",
      );
      button.innerHTML = `<b>${b.id}</b><span>${escapeHTML(b.id === "EN09" ? "CB · ชื่อเรียก" : b.name)}</span><i class="status-dot ${b.status}" title="${STATUS[b.status]}"></i>`;
      button.addEventListener("click", () => selectBuilding(b.id));
      $("#buildingList").append(button);
    }
    if (!matches.length) {
      const p = document.createElement("p");
      p.className = "empty-list";
      p.textContent = "ไม่พบอาคาร ลองค้นหารหัส EN หรือชื่อสาขา";
      $("#buildingList").append(p);
    }
  }
  $("#buildingSearch").addEventListener("input", renderList);
  $("#buildingSearch").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#buildingList button")?.click();
  });
  function selectBuilding(id, focus = true) {
    const b = buildings.find((b) => b.id === id);
    if (!b) return;
    selected = b;
    activePoint = null;
    renderPointList();
    campus.select(id);
    campus.setOtherBuildings($("#contextToggle").checked, id);
    $("#selectedBuilding").innerHTML =
      `<div class="selected-heading"><span class="eyebrow">${b.id} / ${escapeHTML(b.en)}</span><button id="clearSelection" aria-label="กลับภาพรวมทั้งคณะ">×</button></div><h2>${escapeHTML(b.name)}</h2><span class="status-badge ${b.status}">${STATUS[b.status]}</span>${b.usage ? `<p class="building-usage">${escapeHTML(b.usage)}</p>` : ""}<p class="evidence-note">${escapeHTML(b.confidence)}</p>`;
    $("#clearSelection").addEventListener("click", () => view("overview"));
    $("#buildingViews").hidden = false;
    $$("[data-en14]").forEach((e) => (e.hidden = id !== "EN14"));
    $$("[data-en17]").forEach((e) => (e.hidden = id !== "EN17"));
    $$("[data-cb]").forEach((e) => (e.hidden = id !== "EN09"));
    $$("[data-pien]").forEach((e) => (e.hidden = id !== "EN16"));
    $$("[data-east]").forEach(
      (e) => (e.hidden = !["EN04", "EN11"].includes(id)),
    );
    $("#miniSelected").textContent = id;
    for (const [key, e] of labelElements)
      e.classList.toggle("selected", key === id);
    for (const [key, e] of miniElements)
      e.classList.toggle("selected", key === id);
    $("#sceneLabel b").textContent = b.name;
    $("#sceneLabel small").textContent = b.id;
    renderList();
    references(b);
    if (focus) focusBuilding(b);
    $$("[data-view]").forEach((e) => e.classList.remove("selected"));
  }
  function clearSelection() {
    selected = null;
    activePoint = null;
    renderPointList();
    $("#buildingSearch").value = "";
    campus.select(null);
    $("#contextToggle").checked = true;
    campus.setOtherBuildings($("#contextToggle").checked, null);
    $("#selectedBuilding").innerHTML =
      '<span class="eyebrow">CAMPUS OVERVIEW</span><h2>เริ่มสำรวจทั้งคณะ</h2><p>คลิกอาคารบนแผนที่ หรือค้นหาชื่อและรหัสตึก</p>';
    $("#buildingViews").hidden = true;
    $("#miniSelected").textContent = "CAMPUS";
    for (const e of [...labelElements.values(), ...miniElements.values()])
      e.classList.remove("selected");
    renderList();
    references(null);
  }
  function view(name) {
    if (name === "overview" || name === "top") {
      clearSelection();
      fly(
        name === "top" ? [30, 680, -35] : allView.position,
        name === "top" ? [30, 0, -35] : allView.target,
        45,
      );
    } else if (
      selected?.id === "EN16" &&
      ["entrance", "hall", "bridge"].includes(name)
    ) {
      const presets = {
        entrance: [[-51, 4.4, 21], [-27, 6, 3], 55],
        hall: [[43, 2.3, -8], [2, 3, -12], 65],
        bridge: [[-37, 8, 24], [-10, 7.8, 4], 55],
      };
      fly(...presets[name]);
    } else if (
      ["EN04", "EN11"].includes(selected?.id) &&
      ["east-court", "ee-entry", "cpe-entry", "ee-old", "east-street"].includes(
        name,
      )
    ) {
      const presets = {
        "east-court": [[184, 3.2, 20], [244, 7.5, 12], 65],
        "ee-entry": [[219, 3.0, 25], [239, 5.5, 25], 62],
        "cpe-entry": [[210, 3.2, 11], [218, 5.8, -10], 60],
        "ee-old": [[182, 3.2, 43], [207, 3.8, 53], 62],
        "east-street": [[184, 2.7, 58], [184, 2.7, -12], 65],
      };
      fly(...presets[name]);
    } else if (
      selected?.id === "EN09" &&
      [
        "cb-front",
        "cb-hall",
        "cb-stair",
        "cb-site",
        "cb-rear",
        "cb-wood",
      ].includes(name)
    ) {
      const presets = {
        "cb-rear": [[167, 2.2, -105.8], [205, 3.2, -105.8], 66],
        "cb-wood": [[154, 2.1, -139], [135, 6, -134], 62],
        "cb-site": [[179, 165, -83], [179, 0, -132], 45],
        "cb-front": [[184, 3.5, -162], [184, 8, -134], 58],
        "cb-hall": [[184, 1.7, -138], [184, 2, -119], 65],
        "cb-stair": [[219, 4.5, -163], [206, 6, -125], 60],
      };
      fly(...presets[name]);
    } else if (
      selected?.id === "EN17" &&
      ["en17-entry", "en17-roof", "en17-north", "en17-door"].includes(name)
    ) {
      const presets = {
        "en17-door": [[187, 4.2, -44], [197.8, 1.4, -54], 54],
        "en17-entry": [[185, 2.6, -22], [192, 4, -59], 62],
        "en17-roof": [[242, 100, -32], [200, 0, -75], 48],
        "en17-north": [[169, 2.2, -105.8], [207, 3.1, -105.8], 66],
      };
      fly(...presets[name]);
    } else if (
      selected?.id === "EN14" &&
      ["chem-front", "chem-rear", "chem-site", "chem-entry"].includes(name)
    ) {
      const presets = {
        "chem-front": [[1, 6.4, 96], [1, 6, 52], 84],
        "chem-entry": [[42, 5.2, 112], [21, 3.5, 71], 67],
        "chem-rear": [[0, 4.3, 31], [16, 5.2, 47], 78],
        "chem-site": [[-30, 130, 115], [8, 0, 43], 47],
      };
      fly(...presets[name]);
    } else if (selected) focusBuilding(selected, name);
    $$("[data-view]").forEach((e) =>
      e.classList.toggle("selected", e.dataset.view === name),
    );
  }
  $$("[data-view]").forEach((e) =>
    e.addEventListener("click", () => view(e.dataset.view)),
  );
  $("#resetButton").addEventListener("click", () => view("overview"));
  $("#labelsButton").addEventListener("click", () => {
    labelsVisible = !labelsVisible;
    $("#labelsButton").setAttribute("aria-pressed", labelsVisible);
  });
  $("#contextToggle").addEventListener("change", (e) => {
    if (!selected && !e.target.checked) {
      e.target.checked = true;
      toast("เลือกอาคารก่อน เพื่อแสดงเฉพาะตึกที่ต้องการ");
      return;
    }
    campus.setOtherBuildings(e.target.checked, selected?.id);
  });
  $("#landscapeToggle").addEventListener("change", (e) => {
    terrain.setDetails(e.target.checked);
    model.landscape.visible = e.target.checked;
  });
  $("#northButton").addEventListener("click", () => {
    if (walking) return;
    const t = controls.target,
      d = camera.position.distanceTo(t);
    fly([t.x, t.y + d * 0.7, t.z + d * 0.75], t.toArray());
  });
  function zoom(f) {
    if (walking) return;
    transition = null;
    camera.position.sub(controls.target).multiplyScalar(f).add(controls.target);
    controls.update();
  }
  $("#zoomIn").addEventListener("click", () => zoom(0.8));
  $("#zoomOut").addEventListener("click", () => zoom(1.25));
  $("#fullscreenButton").addEventListener("click", () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
  function walkLook() {
    camera.rotation.order = "YXZ";
    camera.rotation.set(walkPitch, walkYaw, 0, "YXZ");
  }
  function startWalk() {
    transition = null;
    walking = true;
    controls.enabled = false;
    camera.fov = 65;
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    const b = selected;
    let x = -42,
      z = 4.5;
    if (b) {
      x = b.center[0];
      z = b.bounds.maxZ + 6;
    }
    camera.position.set(x, 1.7 + model.groundHeight(x, z), z);
    if (b?.id === "EN09") {
      camera.position.set(184, 1.7, -151);
    }
    walkYaw = b?.id === "EN09" ? Math.PI : 0;
    walkPitch = 0;
    walkLook();
    renderer.domElement.focus();
    $("#walkHud").hidden = false;
    $("#walkButton").innerHTML = "ออกจากโหมดเดินชม <span>×</span>";
    toast("WASD / ลูกศร · Shift เดินเร็ว · ลากเพื่อมอง · Esc เพื่อออก");
  }
  function stopWalk(reset = true) {
    walking = false;
    keys.clear();
    controls.enabled = true;
    $("#walkHud").hidden = true;
    $("#walkButton").innerHTML = "เข้าโหมดเดินชม <span>↗</span>";
    camera.fov = 45;
    resize();
    if (reset) {
      if (selected) focusBuilding(selected);
      else fly(allView.position, allView.target);
    }
  }
  $("#walkButton").addEventListener("click", () =>
    walking ? stopWalk() : startWalk(),
  );
  $("#exitWalk").addEventListener("click", () => stopWalk());
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && walking) {
      stopWalk();
      return;
    }
    if (e.target.closest("input,button,dialog")) return;
    const k = e.key.toLowerCase();
    if (
      walking &&
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "shift",
      ].includes(k)
    ) {
      keys.add(k);
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => keys.clear());
  function hitBuilding(e) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      (-(e.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(
      [...campus.entries.values()].map((v) => v.object),
      true,
    )) {
      let o = hit.object,
        id = null,
        visible = true;
      while (o) {
        if (!o.visible) visible = false;
        if (o.userData.buildingId) id = o.userData.buildingId;
        o = o.parent;
      }
      if (id && visible) return id;
    }
    return null;
  }
  renderer.domElement.addEventListener("pointerdown", (e) => {
    transition = null;
    dragging = true;
    startX = lastX = e.clientX;
    startY = lastY = e.clientY;
    moved = 0;
    if (walking) renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (dragging) {
      moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (walking) {
        walkYaw -= (e.clientX - lastX) * 0.004;
        walkPitch = Math.max(
          -1.3,
          Math.min(1.3, walkPitch - (e.clientY - lastY) * 0.003),
        );
        walkLook();
      }
      lastX = e.clientX;
      lastY = e.clientY;
    } else if (!walking)
      renderer.domElement.style.cursor = hitBuilding(e) ? "pointer" : "grab";
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!walking && moved < 5 && e.button === 0) {
      const id = hitBuilding(e);
      if (id) selectBuilding(id);
    }
    dragging = false;
  });
  renderer.domElement.addEventListener(
    "pointercancel",
    () => (dragging = false),
  );
  function moveWalk(dt) {
    const forward =
        (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
        (keys.has("s") || keys.has("arrowdown") ? 1 : 0),
      side =
        (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
        (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
      norm = Math.hypot(forward, side) || 1,
      speed = (dt * (keys.has("shift") ? 9 : 3.8)) / norm,
      dx = (-Math.sin(walkYaw) * forward + Math.cos(walkYaw) * side) * speed,
      dz = (-Math.cos(walkYaw) * forward - Math.sin(walkYaw) * side) * speed;
    const nx = camera.position.x + dx,
      nz = camera.position.z + dz;
    const blocked = (x, z) =>
      [-15, -5, 5, 15].some((px) =>
        [-10.5, 11.8].some(
          (pz) => Math.abs(x - (184 - px)) < 1 && Math.abs(z - (-122 - pz)) < 1,
        ),
      ) ||
      buildings.some(
        (b) =>
          b.id !== "EN16" &&
          b.id !== "EN18" &&
          b.id !== "EN09" &&
          b.parts.some((p) => {
            const xx =
                (x - p.x) * Math.cos(p.rotation) -
                (z - p.z) * Math.sin(p.rotation),
              zz =
                (x - p.x) * Math.sin(p.rotation) +
                (z - p.z) * Math.cos(p.rotation);
            return Math.abs(xx) < p.w / 2 + 0.3 && Math.abs(zz) < p.d / 2 + 0.3;
          }),
      );
    if (!blocked(nx, camera.position.z))
      camera.position.x = THREE.MathUtils.clamp(
        nx,
        CAMPUS_BOUNDS.minX,
        CAMPUS_BOUNDS.maxX,
      );
    if (!blocked(camera.position.x, nz))
      camera.position.z = THREE.MathUtils.clamp(
        nz,
        CAMPUS_BOUNDS.minZ,
        CAMPUS_BOUNDS.maxZ,
      );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      1.7 + model.groundHeight(camera.position.x, camera.position.z),
      Math.min(1, dt * 12),
    );
  }
  $$(".panel-tabs button").forEach((b) =>
    b.addEventListener("click", () => activateTab(b.dataset.tab)),
  );
  $("#panelToggle").addEventListener("click", () =>
    setSidebarOpen(!sidebarOpen),
  );
  $("#accuracyButton").addEventListener("click", () =>
    $("#infoDialog").showModal(),
  );
  $("#helpButton").addEventListener("click", () =>
    $("#helpDialog").showModal(),
  );
  $$(".dialog-close").forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
  $$("dialog").forEach((d) =>
    d.addEventListener("click", (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          d.close();
      }
    }),
  );
  const projected = new THREE.Vector3();
  let frameNumber = 0;
  function overlay() {
    const candidates = [];
    for (const b of buildings) {
      const e = labelElements.get(b.id),
        object = campus.entries.get(b.id).object;
      projected.set(b.center[0], b.height + 3, b.center[1]).project(camera);
      const visible =
        !walking &&
        !photoMode &&
        camera.position.y > 18 &&
        labelsVisible &&
        object.visible &&
        projected.z < 1 &&
        projected.z > -1 &&
        Math.abs(projected.x) < 0.95 &&
        Math.abs(projected.y) < 0.88;
      e.hidden = !visible;
      if (visible)
        candidates.push({
          b,
          e,
          x: (projected.x * 0.5 + 0.5) * innerWidth,
          y: (-projected.y * 0.5 + 0.5) * innerHeight,
        });
    }
    candidates.sort(
      (a, b) =>
        (b.b.id === selected?.id ? 1 : 0) - (a.b.id === selected?.id ? 1 : 0),
    );
    const occupied = [];
    for (const c of candidates) {
      if (sidebarOpen && c.x < 350 && innerWidth > 760) {
        c.e.hidden = true;
        continue;
      }
      if (
        c.b.id !== selected?.id &&
        occupied.some(
          (p) => Math.abs(p.x - c.x) < 125 && Math.abs(p.y - c.y) < 38,
        )
      ) {
        c.e.hidden = true;
        continue;
      }
      c.e.style.transform = `translate(${c.x}px,${c.y}px) translate(-50%,-50%)`;
      occupied.push(c);
    }
    const pointRects = [];
    for (const point of campusPoints) {
      const e = pointElements.get(point.id);
      e.hidden = true;
      if (
        photoMode ||
        !pointLabelsVisible ||
        selected?.id !== point.building ||
        walking
      )
        continue;
      projected.fromArray(point.anchor).project(camera);
      const x = (projected.x * 0.5 + 0.5) * innerWidth,
        y = (-projected.y * 0.5 + 0.5) * innerHeight;
      if (
        projected.z > 1 ||
        projected.z < -1 ||
        x < 24 ||
        x > innerWidth - 24 ||
        y < 100 ||
        y > innerHeight - 90 ||
        (sidebarOpen && x < 365 && innerWidth > 760) ||
        (!$("#atmospherePanel").hidden && x > innerWidth - 320) ||
        (x > innerWidth - 220 && y > innerHeight - 290)
      )
        continue;
      if (
        pointRects.some(
          (p) => Math.abs(p.x - x) < 150 && Math.abs(p.y - y) < 38,
        ) &&
        activePoint?.id !== point.id
      )
        continue;
      e.hidden = false;
      e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      pointRects.push({ x, y });
    }
    $("#compassNeedle").style.transform =
      `rotate(${(-controls.getAzimuthalAngle() * 180) / Math.PI}deg)`;
    const [mx, my] = miniPoint(camera.position.x, camera.position.z);
    cameraDot.setAttribute("cx", mx);
    cameraDot.setAttribute("cy", my);
    const dist = camera.position.distanceTo(controls.target),
      meters =
        ((dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 2) /
          innerHeight) *
        64;
    $("#scaleLabel").textContent =
      `${Math.max(1, Math.round(meters / 5) * 5)} m`;
  }
  createSceneTools({
    renderer,
    scene,
    camera,
    sun,
    hemi,
    fill,
    model,
    terrain,
    toast,
    onCapture: (value) => campus.setPhotoMode(value || photoMode),
    getCaption: () =>
      selected
        ? `${selected.id} ${activePoint?.title || selected.name}`
        : "Faculty Campus",
    onPhotoMode: (value) => {
      photoMode = value;
      campus.setPhotoMode(value);
      $("#panel").inert = value || !sidebarOpen;
      resize();
    },
  });
  renderList();
  references(null);
  controls.update();
  campus.update(camera);
  renderer.render(scene, camera);
  $("#loading").hidden = true;
  function frame(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (walking) moveWalk(dt);
    else if (transition) {
      const t = Math.max(0, Math.min((now - transition.start) / 900, 1)),
        s = t * t * (3 - 2 * t);
      camera.position.lerpVectors(transition.from, transition.to, s);
      controls.target.lerpVectors(transition.fromTarget, transition.target, s);
      controls.update();
      if (t === 1) transition = null;
    } else controls.update();
    campus.update(camera);
    terrain.streetLights.update(camera);
    if (++frameNumber % 3 === 0) overlay();
    renderer.render(scene, camera);
    frames++;
    if (now - frameStart > 1000) {
      fps = Math.round((frames * 1000) / (now - frameStart));
      $("#viewer").dataset.fps = String(fps);
      $("#viewer").dataset.drawCalls = String(renderer.info.render.calls);
      $("#viewer").dataset.camera = JSON.stringify(
        camera.position.toArray().map((v) => +v.toFixed(2)),
      );
      frames = 0;
      frameStart = now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.campusDiagnostics = () => ({
    renderer: "Three.js WebGL",
    buildings: buildings.length,
    renderedBuildings: campus.entries.size,
    selected: selected?.id || null,
    walking,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    fps,
    ground: "modeled geometry",
    satelliteInMainScene: false,
    referenceImages: currentPhotos.length,
    coordinateSystem: "metres +X east -Z north, reference at EN16",
    statuses: Object.fromEntries(buildings.map((b) => [b.id, b.status])),
    siteAudit: terrain.audit,
  });
}
