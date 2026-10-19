# EN KKU · Faculty Campus Explorer

Interactive Three.js exterior model of the Faculty of Engineering, Khon Kaen University. Seventeen current building codes are modeled, with geometric roads, pedestrian links, forecourts and planting. The current scene is a progressive architectural reconstruction; geometry and photographic coverage are labelled per building.

## Repository and handoff

- GitHub: [wichitpanw/engineer-kku-3d](https://github.com/wichitpanw/engineer-kku-3d)
- ผู้ใช้แจ้งว่า push โครงการขึ้น GitHub แล้วเมื่อ 18 ต.ค. 2026; local `origin` ตรงกับ repository นี้
- สถานะล่าสุด งานค้าง ข้อตกลง และตำแหน่งไฟล์: [CONTEXT.md](CONTEXT.md)
- การเปลี่ยนแปลงภายหลังการ push ต้อง commit/push เพิ่มตามขั้นตอนปกติ

## Run

```powershell
npm run dev
```

Open http://localhost:8089/. No package installation is needed for the app. Three.js/OrbitControls are vendored from the user-selected reference project, cloned into `reference-home/` at `86f8aa462e8c6fa2ba30f2b6fe99d5810b374e88`.

## Explore

- Search EN code, Thai/English name or CB. Select from the list, a model surface, floating tag, or the satellite minimap.
- View the entire faculty, overhead plan, or four sides of a selected building. EN16 also has entrance, public hall and bridge presets.
- Drag to orbit; wheel to zoom; right-drag to pan. Use the surrounding-building switch to isolate a selected building.
- Walk: WASD/arrows, drag to look, Shift to move faster, Esc to exit. Floor selection and internal room layouts are outside the current scope.
- Main terrain is entirely modeled. Satellite imagery appears only in the calibrated minimap, with Esri attribution.

## Structure

- `src/campus-data.js`: registry, identities, multi-part footprints, local/metre geographic transforms, evidence and status. Reference origin: EN16 Maps pin, +X east / -Z north.
- `src/campus-buildings.js`: independent building models, material batches, near/far LOD and selection outline. Selected buildings always show their detailed geometry.
- `src/model.js` / `src/entrance.js`: the existing EN16 facade, open hall, cylinders, bridge, broad stairs, landing and rails.
- `src/en14-building.js` / `src/en14-layout.js`: โมเดลเคมีและพิกัดร่วม
- `src/en17-building.js`: EN17 Workshop และส่วนต่อ
- `src/cb-building.js`: EN09 สองปีก โครงเหล็กและโถงบันได
- `src/east-engineering.js`: EN04–EN11 และลานกลาง พร้อมโมดูลหลังคาและต้นไม้เฉพาะพื้นที่.
- `src/site-layout.js`: ถนนและพื้นส่วนกลางแบบ polygon union พร้อมตรวจการทับซ้อน.
- `src/terrain.js`: shared campus roads, paths, parking, planting and street details.
- `src/app.js`: selection/search, cameras, raycasting, labels, minimap, references and exterior walking.

## Development checks

```powershell
node research/check-campus.mjs
node --check src/app.js
node --check src/campus-buildings.js
node --check src/campus-data.js
node --check src/model.js
node --check src/terrain.js
```

EN09 is the official code; CB is the colloquial name. EN15 is the former library, repurposed for other uses; the present library is at EN18. EN06 is at its original mapped location. Temporary cones, barriers, road closures and event decorations are excluded.

Dimensions are estimated from photographs and aerial imagery. EN16/EN18, EN04/EN11 and EN09 have bespoke exterior detail; EN17 has a photo-derived wall facing CB. Unseen faces remain preliminary. A `detail` status indicates additional modeling, not a measured or fully surveyed replica. The prototype does not certify building access or real navigation routes.

## ภาพจริงของคุณ

วางรูปใน `assets/building-photos/` แยกตามรหัสอาคาร ดูชื่อไฟล์และวิธีวางรูปใน [คู่มือรูป](assets/building-photos/README.md)
แท็บ ภาพจริง ใช้รูปเดียวต่ออาคาร วางไฟล์ front.jpg (หรือ PNG/WebP) ในโฟลเดอร์รหัสตึก ไม่มีรูปแยกตามจุดหรือปุ่มเลื่อนรูป
แสงสำเร็จรูปอยู่ใน แสงและภาพ; H ซ่อน/คืนหน้าจอ, Alt+P บันทึก PNG

## ไฟทางเท้าและแสง

เลือกเช้า / เย็น / กลางคืนในแผง แสงและภาพ ไฟหัวเฟืองตามแนวทางเท้าจะสว่างเฉพาะกลางคืน ตำแหน่งและระยะห่างเป็นแบบจำลอง
