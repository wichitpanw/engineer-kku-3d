import { en17FlatParts, en17Garage, en17EastWing } from "./en17-layout.js";
// Shared campus registry. Metres, +X east, -Z north; origin is EN16.
// Footprints traced from the supplied enmap sheets and the inspected Maps aerial.
// Heights and offsets are estimates, never a surveyed CAD dataset.
export const ORIGIN = { latitude: 16.4722497, longitude: 102.8235039 };
export const MAP_URL =
  "https://www.google.co.th/maps/@16.4731,102.8236,17z/data=!3m1!1e3";
export const STATUS = {
  detail: "เก็บรายละเอียดแล้ว · รอตรวจสัดส่วน",
  basic: "รูปทรงเบื้องต้น",
  pending: "รอยืนยันตำแหน่ง",
};
export const toGeo = (x, z) => ({
  latitude: ORIGIN.latitude - z / 111320,
  longitude:
    ORIGIN.longitude +
    x / (111320 * Math.cos((ORIGIN.latitude * Math.PI) / 180)),
});
export const fromGeo = (lat, lon) => [
  (lon - ORIGIN.longitude) *
    111320 *
    Math.cos((ORIGIN.latitude * Math.PI) / 180),
  -(lat - ORIGIN.latitude) * 111320,
];
const part = (x, z, w, d, h = 11, roof = "gable", rotation = 0) => ({
  x,
  z,
  w,
  d,
  h,
  roof,
  rotation,
});
const base = (id, name, en, zone, parts, extra = {}) => ({
  id,
  name,
  en,
  zone,
  parts,
  status: "basic",
  sources: ["enmap1", "enmap2", "enmap3", "maps-aerial"],
  capture: "แผนผังไม่ระบุปี / Google Maps ตรวจ 18 ต.ค. 2569",
  confidence: "ตำแหน่งเทียบผังและภาพมุมสูง; ความสูงและหน้าต่างประมาณ",
  ...extra,
});
export const buildings = [
  base(
    "EN01",
    "วิศวกรรมโยธา",
    "Civil Engineering",
    "north",
    [
      part(30, -154, 84, 16, 12),
      part(31, -133, 14, 24, 9),
      part(35, -126, 38, 18, 9),
    ],
    { aliases: ["โยธา", "civil"], phase: 2 },
  ),
  base(
    "EN02",
    "ปฏิบัติการวิศวกรรมโยธา",
    "Civil Engineering Laboratories",
    "north",
    [part(95, -59, 102, 48, 9, "sheds")],
    { phase: 2 },
  ),
  base(
    "EN04",
    "วิศวกรรมคอมพิวเตอร์",
    "Computer Engineering",
    "east",
    [part(232, -17, 84, 16, 18, "flat")],
    {
      aliases: ["คอม", "computer", "cpe"],
      phase: 3,
      status: "detail",
      usage: "ฝั่งคอมพิวเตอร์ · อาคารเชื่อมกับ EN11 ฝั่งไฟฟ้า",
      capture:
        "Street View พ.ค. 2019 / ภาพผู้ใช้ / แกลเลอรี ก.ย. 2018–มิ.ย. 2019",
      confidence:
        "ระเบียง 5 ชั้น หลังคาแบน ผนังปลายตึกและทางเข้าตรวจจากภาพจริง; ผู้ใช้ยืนยันรหัสฝั่งคอมพิวเตอร์; ระยะและด้านที่ต้นไม้บังยังประมาณ",
      sources: [
        "enmap2",
        "maps-aerial",
        "east-street",
        "east-gallery",
        "user-east",
      ],
    },
  ),
  base(
    "EN05",
    "วิศวกรรมเกษตร",
    "Agricultural Engineering",
    "west",
    [part(-85, -75, 33, 78, 11), part(-85, -115, 38, 11, 8)],
    { phase: 5 },
  ),
  base(
    "EN06",
    "ปฏิบัติการวิศวกรรมสิ่งแวดล้อม",
    "Environmental Engineering Laboratories",
    "south",
    [part(145, 3, 23, 31, 10, "barrel")],
    {
      phase: 4,
      confidence:
        "ผู้ใช้ยืนยัน EN06 อยู่ตำแหน่งเดิมตามผัง; สัดส่วนและหน้าต่างยังประมาณ",
      sources: ["enmap1", "enmap2", "enmap3", "maps-aerial", "user-en06"],
    },
  ),
  base(
    "EN07",
    "ปฏิบัติการวิศวกรรมเครื่องกล",
    "Mechanical Engineering Laboratories",
    "west",
    [part(-150, -84, 69, 54, 8, "sheds", -0.48)],
    { phase: 5 },
  ),
  base(
    "EN08",
    "วิศวกรรมอุตสาหการ",
    "Industrial Engineering",
    "west",
    [
      part(-105, 15, 80, 12, 12),
      part(-139, 37, 13, 43, 12),
      part(-71, 37, 13, 43, 12),
      part(-105, 57, 80, 12, 12),
    ],
    { phase: 5, aliases: ["industrial", "ie", "อุตสาหการ"] },
  ),
  base(
    "EN09",
    "EN09",
    "CB Building",
    "east",
    [
      part(184, -122, 37, 27, 14.5, "flat"),
      part(207, -123, 9, 22, 10.4, "flat"),
      part(227, -127, 30, 27, 14.5, "flat"),
      part(207, -143, 9, 16, 3.8, "flat"),
    ],
    {
      aliases: ["CB", "ซีบี", "ตึกโครงเหล็ก"],
      status: "detail",
      phase: 3,
      mapPin: { latitude: 16.4733601, longitude: 102.8251674 },
      confidence:
        "โครงเหล็ก โถง บันได ทางเดินหลังตึกและแนวป่าตามภาพผู้ใช้ พ.ย. 2020 / ม.ค. 2023; ขนาดจริงและด้านที่ไม่เห็นยังประมาณ",
      sources: [
        "enmap1",
        "enmap3",
        "maps-aerial",
        "user-en09",
        "kku-en09",
        "cb-photos",
        "cb-rear-photos",
      ],
    },
  ),
  base(
    "EN10",
    "วิศวกรรมเครื่องกล",
    "Mechanical Engineering",
    "west",
    [
      part(-171, -30, 20, 35, 12, "gable", -0.45),
      part(-154, -18, 28, 12, 12, "gable", -0.45),
      part(-187, -46, 14, 25, 9, "gable", -0.45),
    ],
    { phase: 5 },
  ),
  base(
    "EN11",
    "วิศวกรรมไฟฟ้า",
    "Electrical Engineering",
    "east",
    [
      part(263, 24, 22, 66, 18, "flat"),
      part(245, 22, 18, 25, 11.6, "flat"),
      part(221, 53, 60, 15, 6.7, "gable"),
      part(255, 53, 8, 8, 3.5, "flat"),
    ],
    {
      aliases: ["ไฟฟ้า", "electrical", "ee", "ตึกเก่าไฟฟ้า"],
      phase: 3,
      status: "detail",
      usage: "ฝั่งไฟฟ้า · เชื่อมกับ EN04 · รวมอาคารเรียนไฟฟ้าเดิม 2 ชั้น",
      capture:
        "Street View พ.ค. 2019 / แกลเลอรี ก.ย. 2018–มิ.ย. 2019 / ภาพผู้ใช้",
      confidence:
        "สำนักงาน 3 ชั้น เสารับชายคา ซุ้มทางเข้า และตึกเก่าเลข 11 ตรวจจาก Street View; ผู้ใช้ยืนยันฝั่งไฟฟ้าเชื่อม EN04; ขนาดและผนังด้านที่ไม่มีภาพยังประมาณ",
      sources: [
        "enmap2",
        "maps-aerial",
        "east-street",
        "east-gallery",
        "en11-old",
        "user-east",
      ],
    },
  ),
  base(
    "EN12",
    "ปฏิบัติการวิศวกรรมเกษตร",
    "Agricultural Engineering Laboratories",
    "west",
    [part(-108, -7, 32, 22, 9, "sheds")],
    { phase: 5 },
  ),
  base(
    "EN13",
    "วิศวกรรมสิ่งแวดล้อม",
    "Environmental Engineering",
    "south",
    [part(99, 54, 100, 15, 12), part(113, 71, 20, 20, 10)],
    { aliases: ["environmental", "envi"], phase: 4 },
  ),
  base(
    "EN14",
    "วิศวกรรมเคมี",
    "Chemical Engineering",
    "south",
    [part(-17, 34, 44, 14, 10, "gable", -0.78), part(25, 52, 40, 15, 10)],
    { aliases: ["chemical", "เคมี"], phase: 4 },
  ),
  base(
    "EN15",
    "ห้องสมุดเก่า",
    "Former Engineering Library",
    "central",
    [part(62, -2, 43, 29, 10, "barrel")],
    {
      phase: 1,
      aliases: ["library", "ห้องสมุดเก่า"],
      usage: "ห้องสมุดเดิม · ปัจจุบันใช้งานอื่น · ห้องสมุดย้ายไป EN18",
      confidence:
        "ผู้ใช้ยืนยันว่าเลิกใช้เป็นห้องสมุดและนำอาคารไปใช้งานอื่นแล้ว; หมุด Google Maps ระบุ ARIS; รูปหลังคาและที่ตั้งเทียบผัง; ภาพด้านข้างยังไม่ครบ",
      sources: ["enmap1", "enmap3", "maps-aerial", "user-library"],
    },
  ),
  base(
    "EN16",
    "ตึกเพียรวิจิตร",
    "Pienvichit Building",
    "central",
    [
      part(0, -19, 66, 24, 37, "custom"),
      part(7, 9, 30, 30, 16, "custom", Math.PI / 4),
    ],
    {
      status: "detail",
      phase: 1,
      aliases: ["เพียร", "pien", "สำนักงานคณบดี"],
      sources: [
        "enmap1",
        "enmap2",
        "enmap3",
        "maps-aerial",
        "pien-street",
        "pien-tour",
        "user-photos",
      ],
      confidence:
        "มีภาพหลายด้านและโถงจริง; ยังไม่ได้รังวัด; รายละเอียดส่วนปิดบังยังประมาณ",
    },
  ),
  base(
    "EN17",
    "อาคารปฏิบัติการวิศวกรรมอุตสาหการ",
    "Industrial Engineering Laboratories",
    "east",
    [
      part(200, -86, 54, 29, 10.1, "gable"),
      part(
        en17Garage.x,
        en17Garage.z,
        en17Garage.w,
        en17Garage.d,
        en17Garage.h,
        "flat",
      ),
      ...en17FlatParts.map((p) =>
        part(p.x, p.z, p.w, p.d, p.h, "flat", p.rotation),
      ),
      part(
        en17EastWing.x,
        en17EastWing.z,
        en17EastWing.w,
        en17EastWing.d,
        en17EastWing.h,
        "gable",
      ),
    ],
    {
      phase: 3,
      confidence:
        "หลังคาและส่วนต่ออ้างอิงภาพดาวเทียม; ผนัง บานเกล็ด ประตูม้วนและลานจากภาพผู้ใช้ 2019/2023; ขนาดและส่วนที่ต้นไม้บังยังประมาณ",
      status: "detail",
      aliases: [
        "workshop",
        "shop",
        "เวิร์กช็อป",
        "ปฏิบัติการวิศวกรรมอุตสาหการ",
      ],
      usage: "ชื่อเรียก: อาคาร Workshop",
      sources: [
        "enmap1",
        "enmap3",
        "maps-aerial",
        "cb-rear-photos",
        "en17-maps",
        "en17-official",
        "user-en17-name",
      ],
    },
  ),
  base(
    "EN18",
    "อาคาร 50 ปี วิศวะรวมใจ",
    "50th Anniversary Building",
    "central",
    [],
    {
      phase: 1,
      status: "detail",
      center: [-5, -90],
      height: 25,
      footprint: [
        [-37, -134],
        [-23, -140],
        [30, -108],
        [28, -89],
        [36, -58],
        [-3, -44],
        [-36, -86],
      ],
      aliases: ["50ปี", "50 ปี", "วิศวะรวมใจ", "ห้องสมุด", "library"],
      usage: "ห้องสมุดคณะวิศวกรรมศาสตร์ปัจจุบัน",
      sources: [
        "enmap1",
        "enmap2",
        "enmap3",
        "maps-aerial",
        "en18-maps",
        "user-library",
      ],
      confidence:
        "ผนังเฉียงและเสาทแยงตรวจจากรีวิว ม.ค. 2019 และ ธ.ค. 2025; หน้าที่ห้องสมุดยืนยันโดยผู้ใช้; สัดส่วนยังประมาณ",
    },
  ),
];
export const auxiliaries = [
  {
    id: "CAF01",
    name: "โรงอาหาร / พื้นที่บริการ",
    parts: [part(69, -120, 36, 28, 6, "sheds")],
  },
  {
    id: "SERVICE01",
    name: "อาคารประกอบด้านเหนือ",
    parts: [part(12, -125, 18, 12, 5)],
  },
];
export const sourceCatalog = {
  "user-en17-name": {
    label:
      "ชื่อตามป้าย อาคารปฏิบัติการวิศวกรรมอุตสาหการ · ผู้ใช้ยืนยัน 18 ต.ค. 2026",
  },
  "en17-maps": {
    label: "Google Maps · หมุด EN17 · ภาพ ส.ค. 2026",
    url: "https://maps.app.goo.gl/WaDyynRTcSH71rnt7",
  },
  "en17-official": {
    label: "คณะวิศวกรรมศาสตร์ · ข่าว 31 ส.ค. 2026 · ห้อง 17204 ชั้น 2 EN17",
    url: "https://www.en.kku.ac.th/web/วิศวะ-มข-ร่วมกับ-สวทช-เปิ/",
  },
  "cb-rear-photos": {
    label:
      "ภาพผู้ใช้ พ.ย. 2020 / ม.ค. 2023 · ด้านหลัง CB และผนัง EN17 ยืนยันโดยผู้ใช้",
    url: "assets/cb-en17-wall-reference.png",
  },
  "cb-photos": {
    label:
      "ภาพ EN09 จากผู้ใช้ · Google Maps พ.ย. 2020 / ม.ค. 2023 และภาพดาวเทียมไม่ระบุวันถ่าย",
    url: "assets/cb-front-reference.png",
  },
  "east-street": {
    label: "Google Street View · ลานไฟฟ้า–คอมพิวเตอร์ · พ.ค. 2019",
    url: "https://www.google.com/maps/@?api=1&map_action=pano&pano=9hjibyR49b3Xp723NuLXTg&heading=45&pitch=0",
  },
  "east-gallery": {
    label: "Google Maps · ภาควิชาไฟฟ้า · ภาพ ก.ย. 2018 / มิ.ย. 2019",
    url: "https://www.google.com/maps?cid=13000192910101126261",
  },
  "en11-old": {
    label: "Google Street View · ตึกเก่าเลข 11 · พ.ค. 2019",
    url: "https://www.google.com/maps/@?api=1&map_action=pano&pano=fzhghcCrr2CqGA9v39-eIQ&heading=126.68&pitch=0",
  },
  "user-east": {
    label:
      "EN11 ฝั่งไฟฟ้า / EN04 ฝั่งคอมพิวเตอร์ เป็นตึกเชื่อมกัน · ผู้ใช้ยืนยัน 18 ต.ค. 2569",
  },
  enmap1: { label: "แผนผัง enmap1", url: "enmap1.jpg" },
  enmap2: { label: "แผนผัง enmap2", url: "enmap2.png" },
  enmap3: { label: "แผนผัง enmap3", url: "enmap3.jpg" },
  "maps-aerial": { label: "Google Maps / Esri · ผังบริเวณ", url: MAP_URL },
  "pien-street": {
    label: "Google Maps · เพียรวิจิตร",
    url: "https://www.google.com/maps?cid=8293050350517873810",
  },
  "pien-tour": {
    label: "KKU 360 · เพียรวิจิตร",
    url: "https://cesium.kku.ac.th/web/pienvichit12/",
  },
  "en18-maps": {
    label: "Google Maps · อาคาร 50 ปี",
    url: "https://www.google.com/maps/search/?api=1&query=อาคาร+50+ปี+คณะวิศวกรรมศาสตร์+มหาวิทยาลัยขอนแก่น",
  },
  "kku-en09": {
    label: "มหาวิทยาลัยขอนแก่น · EN09 ตึกโครงเหล็ก",
    url: "https://procurement.kku.ac.th/t/bidders?page=111&per-page=15&sort=name",
  },
  "user-library": {
    label:
      "ห้องสมุดเก่า EN15 / ห้องสมุดปัจจุบัน EN18 · ผู้ใช้ยืนยัน 18 ต.ค. 2569",
  },
  "user-en09": { label: "ชื่อเรียก CB · ผู้ใช้ยืนยัน 18 ต.ค. 2569" },
  "user-en06": {
    label: "EN06 อยู่ตำแหน่งเดิมตามผัง · ผู้ใช้ยืนยัน 18 ต.ค. 2569",
  },
  "user-photos": { label: "ภาพ Street View และรีวิวที่ผู้ใช้ให้มา" },
};
export function buildingBounds(b) {
  if (b.footprint) {
    const xs = b.footprint.map((p) => p[0]),
      zs = b.footprint.map((p) => p[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...zs),
      maxZ: Math.max(...zs),
    };
  }
  if (!b.parts.length) return null;
  const points = b.parts.flatMap((p) =>
    [-1, 1].flatMap((s) =>
      [-1, 1].map((t) => [
        p.x +
          ((s * p.w) / 2) * Math.cos(p.rotation) +
          ((t * p.d) / 2) * Math.sin(p.rotation),
        p.z -
          ((s * p.w) / 2) * Math.sin(p.rotation) +
          ((t * p.d) / 2) * Math.cos(p.rotation),
      ]),
    ),
  );
  return {
    minX: Math.min(...points.map((p) => p[0])),
    maxX: Math.max(...points.map((p) => p[0])),
    minZ: Math.min(...points.map((p) => p[1])),
    maxZ: Math.max(...points.map((p) => p[1])),
  };
}
for (const b of buildings) {
  b.bounds = buildingBounds(b);
  if (b.bounds) {
    b.center ??= [
      (b.bounds.minX + b.bounds.maxX) / 2,
      (b.bounds.minZ + b.bounds.maxZ) / 2,
    ];
    b.height ??= Math.max(...b.parts.map((p) => p.h + 4));
    b.geo = toGeo(...b.center);
  }
}
export const CAMPUS_BOUNDS = { minX: -240, maxX: 300, minZ: -220, maxZ: 160 };
