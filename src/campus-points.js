import { en14Garden } from "./en14-layout.js";
// Exterior landmarks retain the same campus coordinates as the building model.
export const campusPoints = [
  {
    id: "chem-entry",
    building: "EN14",
    number: "01",
    title: "ทางรถเข้าเคมี",
    anchor: [33, 1.5, 87],
    camera: [42, 5.2, 112],
    target: [21, 3.5, 71],
    fov: 67,
    description:
      "ทางเข้าฝั่งขวาของลานเกียร์ เชื่อมถนนกับลานหน้าอาคารและลานจอดด้านใน",
    detail:
      "แนวทางเข้าและไม้กั้นรถปรับตามภาพและคำยืนยันของผู้ใช้ ระยะยังประมาณจากภาพ",
  },
  {
    id: "chem-gear",
    building: "EN14",
    number: "02",
    title: "ลานเกียร์",
    anchor: [en14Garden.x, 3.8, en14Garden.z],
    camera: [1, 6.4, 96],
    target: [1, 6, 52],
    fov: 84,
    description: "สวนและซุ้มครึ่งเฟืองสีขาว อยู่ตรงแนวหอป้ายและประตูหน้าตึก",
    detail:
      "ผู้ใช้ยืนยันแนวกึ่งกลางลานเกียร์กับหน้าตึก รูปทรงสวนและตราสัญลักษณ์เป็นแบบจำลอง",
  },
  {
    id: "chem-front-detail",
    building: "EN14",
    number: "03",
    title: "หน้าอาคารและตะแกรง",
    anchor: [1, 8.8, 62.3],
    camera: [-7, 5, 90],
    target: [1, 7, 60],
    fov: 56,
    description:
      "หอป้ายภาควิชาวิศวกรรมเคมี แผงข้าวหลามตัด ประตูกระจก และระเบียงเปิด",
    detail:
      "ใช้ภาพจริงเทียบเสาขาว ตะแกรง หน้าจั่ว และทางเข้า ความสูงและจำนวนช่องบางช่วงยังประมาณ",
  },
  {
    id: "chem-lab",
    building: "EN14",
    number: "04",
    title: "อาคารปฏิบัติการ",
    anchor: [54, 5.5, 67],
    camera: [43, 6, 86],
    target: [54, 3.5, 60],
    fov: 65,
    description: "อาคารเตี้ยด้านขวา หน้าจั่วสามช่วงและทางเดินมีหลังคาด้านหน้า",
    detail: "ผู้ใช้ยืนยันอาคารปฏิบัติการนี้อยู่ในรหัส EN14 เดียวกับตึกเคมี",
  },
  {
    id: "chem-rear-detail",
    building: "EN14",
    number: "05",
    title: "ด้านหลังและส่วนต่อ",
    anchor: [16, 4, 40],
    camera: [0, 4.3, 31],
    target: [16, 5.2, 47],
    fov: 78,
    description: "ระเบียงราวเส้นตั้ง สนามหญ้า และส่วนต่อชั้นเดียวสีน้ำตาล",
    detail:
      "ภาพนี้เป็นด้านหลังตามคำยืนยันของผู้ใช้ ตำแหน่งและขนาดส่วนต่อยังประมาณจากภาพ",
  },
];
