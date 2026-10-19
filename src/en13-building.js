import * as THREE from "three";
import { en13Parts, en13Site } from "./en13-layout.js";
const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
const M = {
  wall: mat('#d3d0be'), concrete: mat('#c4c5b9'), brick: mat('#91614a'),
  glass: mat('#3e5350'), frame: mat('#a2aaa1'), roof: mat('#b2b3a7'),
  paving: mat('#b4af9d'), grass: mat('#819368'), leaf: mat('#507541'),
  trunk: mat('#79614c'), white: mat('#eeeade'), flower: mat('#ce895b'),
};
function box(p,x,y,z,w,h,d,m) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w/.35)),1,1),m);
  o.position.set(x,y,z); o.castShadow = o.receiveShadow = true; p.add(o); return o;
}
function label(p, text, x,y,z,w,h,color) {
  const c = document.createElement('canvas'); c.width=1536; c.height=160;
  const ctx=c.getContext('2d'); ctx.font='600 76px "IBM Plex Sans Thai", sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle=color;
  ctx.fillText(text,768,85,1490);
  const map=new THREE.CanvasTexture(c); map.colorSpace=THREE.SRGBColorSpace;
  const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h,Math.max(1,Math.ceil(w/.2)),1),new THREE.MeshStandardMaterial({map,transparent:true}));
  o.position.set(x,y,z); p.add(o);
}
function wing(root,s,detail) {
  const p=new THREE.Group(); p.position.set(s.x,0,s.z); root.add(p);
  const {w,d,h}=s;
  if (s.x === 120) {
    // East-west passage at the junction, open below the upper storey.
    box(p,0,1.5,-8.2,w-.6,3,1.8,M.wall);
    box(p,0,1.5,2.65,w-.6,3,12.9,M.wall);
    box(p,0,(h+3)/2,0,w-.6,h-3,d-.8,M.wall);
    box(p,0,.18,-6,w+7,.15,3.4,M.paving);
  } else box(p,0,h/2,0,w-.6,h,d-.8,M.wall);
  box(p,0,.2,0,w,.3,d,M.concrete);
  box(p,0,h+.12,0,w+.4,.24,d+.4,M.roof);
  for (const side of [-1,1]) {
    box(p,0,h+.48,side*(d/2-.12),w,.65,.24,M.concrete);
    for (const y of [3.4,6.65]) box(p,0,y,side*(d/2+.12),w,.3,.6,M.concrete);
    for (let x=-w/2+2.35;x<w/2;x+=4.7) {
      for (const y of [1.65,5]) {
        box(p,x,y-.85,side*(d/2+.04),4.25,.85,.12,M.brick);
        box(p,x,y+.3,side*(d/2+.1),3.8,1.65,.12,M.glass);
        if (detail) for (const dx of [-1.9,-.95,0,.95,1.9])
          box(p,x+dx,y+.3,side*(d/2+.2),.045,1.7,.045,M.frame);
      }
    }
    // Deep projecting concrete sun screen: tall uprights, horizontal rails.
    for (let x=-w/2+.2;x<=w/2;x+=2.35)
      box(p,x,h/2,side*(d/2+.75),.16,h,.2,M.concrete);
    for (const y of [.4,2.7,3.4,3.95,6.2,6.7,7.25])
      box(p,0,y,side*(d/2+.75),w,.13,.2,M.concrete);
  }
  for (const x of [-w/2,w/2]) {
    // East end of the projecting wing is the plain department-name wall.
    if (s.x === 120 && x > 0) continue;
    if (s.x === 120) {
      box(p,x,5.2,0,.22,4.4,d+.3,M.concrete);
      box(p,x,1.5,-8.2,.22,3,1.8,M.concrete);
      box(p,x,1.5,2.65,.22,3,12.9,M.concrete);
      continue;
    }
    box(p,x,3.5,0,.22,7,d+.3,M.concrete);
    if (detail) for (let z=-d/2+.6;z<d/2;z+=1.6) {
      box(p,x,3.5,z,.4,7.6,.14,M.concrete);
    }
  }
}
function shelter(p,x,z,w,d) {
  const roof=box(p,x,2.9,z,w,.14,d,M.white); roof.rotation.x=-.1;
  for(let u=-w/2;u<w/2;u+=.65) {
    const rib=box(p,x+u,3,z,.025,.025,d,M.frame); rib.rotation.x=-.1;
  }
  for(let u=-w/2+1;u<w/2;u+=4.7) for(const v of [-d/2+.3,d/2-.3]) {
    box(p,x+u,1.4,z+v,.12,2.8,.12,M.frame);
    const brace=box(p,x+u+.45,2.25,z+v,.08,1.4,.08,M.frame); brace.rotation.z=-.7;
  }
}
function tree(p,x,z,h,r=3.4) {
  // Include the full crown envelope, not just the trunk, in the clearance.
  const reach = r * 1.45 + 0.8;
  const obstacles = [...en13Parts, en13Site.shelter];
  if (obstacles.some(s => Math.hypot(
    Math.max(Math.abs(x-s.x)-s.w/2, 0),
    Math.max(Math.abs(z-s.z)-s.d/2, 0)
  ) < reach)) return;
  box(p,x,h*.32,z,.3,h*.64,.3,M.trunk);
  for(let k=0;k<4;k++) {
    const o=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),M.leaf);
    o.position.set(x+Math.cos(k*1.7)*r*.4,h*.75+(k%2)*.7,z+Math.sin(k*1.7)*r*.4);
    o.scale.y=.75; o.castShadow=o.receiveShadow=true; p.add(o);
  }
}
export function createEN13(root,detail) {
  for(const s of en13Parts) wing(root,s,detail);
  // Broad blank white end wall facing the eastern entrance court.
  box(root,129.25,5.65,73.5,.3,5.3,19.4,M.white);
  box(root,129.25,1.5,65.15,.3,3,2.3,M.white);
  box(root,129.25,1.5,76.3,.3,3,13.8,M.white);
  box(root,129.42,5.5,73.5,.018,.025,19.2,M.concrete);
  box(root,129.42,2.8,76.3,.018,.025,13.8,M.concrete);
  if (detail) {
    const wallSign = new THREE.Group();
    wallSign.position.set(129.45,0,73.5); wallSign.rotation.y=Math.PI/2;
    root.add(wallSign);
    label(wallSign,'ภาควิชาวิศวกรรมสิ่งแวดล้อม',0,4.1,0,14,.7,'#3c4240');
    label(wallSign,'DEPARTMENT OF ENVIRONMENTAL ENGINEERING',0,3.4,.01,14,.42,'#3c4240');
    box(root,129.6,8.65,73.5,.35,.35,.35,M.frame);
  }
  // Entrance at the south end of the projecting two-storey wing.
  box(root,120,1.5,83.65,3.6,2.8,.15,M.glass);
  box(root,120,.18,85,5,.25,4,M.paving);
  if(detail) {
    for(const x of [118.3,120,121.7]) box(root,x,1.5,83.8,.07,2.8,.08,M.frame);
    label(root,'ภาควิชาวิศวกรรมสิ่งแวดล้อม',120,3,83.9,12,.65,'#384639');
  }
}
export function createEN13Site(root) {
  // Lawn and planting in front of the long wing, leaving the EN14 laboratory clear.
  const lawn=en13Site.lawn, cover=en13Site.shelter, sign=en13Site.sign;
  box(root,lawn.x,.06,lawn.z,lawn.w,.06,lawn.d,M.grass);
  shelter(root,cover.x,cover.z,cover.w,cover.d);
  // Compact sign bed sits inside the south verge, clear of the road bend.
  const signGroup = new THREE.Group();
  signGroup.position.set(sign.x,0,sign.z); root.add(signGroup);
  box(signGroup,0,.18,0,sign.w,.3,sign.d,M.brick);
  box(signGroup,0,.35,0,sign.w-.25,.08,sign.d-.22,M.concrete);
  box(signGroup,0,.41,-.03,sign.w-.55,.08,sign.d-.45,M.grass);
  box(signGroup,0,.72,.15,sign.w-.65,.52,.28,M.white);
  label(signGroup,'ภาควิชาวิศวกรรมสิ่งแวดล้อม',.4,1.17,.31,8.9,.65,'#e9e6dc');
  label(signGroup,'Department of Environmental Engineering',.35,.72,.302,8.8,.36,'#433b34');
  // Circular department emblem at the left end, above the low white plinth.
  const emblem = new THREE.Mesh(new THREE.TorusGeometry(.31,.055,6,28),M.frame);
  emblem.position.set(-4.65,1.22,.32); signGroup.add(emblem);
  const seal = new THREE.Mesh(new THREE.CircleGeometry(.23,24),M.white);
  seal.position.set(-4.65,1.22,.325); signGroup.add(seal);
  for(let x=-sign.w/2+.35;x<sign.w/2;x+=.65)
    box(signGroup,x,.49,-.34,.4,.2,.25,M.leaf);
  // Brick joints keep the shallow base readable without oversized masonry.
  for(let x=-sign.w/2+.4;x<sign.w/2;x+=.6)
    box(signGroup,x,.17,sign.d/2+.005,.018,.25,.012,M.concrete);
  // Follow the sidewalk bend: a shallow continuous arc, tangent toward the
  // northeast at the east end. Bend the lettering with the plinth as one sign.
  const radius = 18;
  for (const mesh of signGroup.children) {
    if (!mesh.isMesh) continue;
    mesh.updateMatrix();
    mesh.geometry.applyMatrix4(mesh.matrix);
    mesh.position.set(0,0,0); mesh.rotation.set(0,0,0); mesh.scale.set(1,1,1);
    const positions = mesh.geometry.attributes.position;
    for (let i=0;i<positions.count;i++) {
      const x=positions.getX(i), z=positions.getZ(i), a=x/radius;
      positions.setXYZ(i,(radius+z)*Math.sin(a),positions.getY(i),
        (radius+z)*Math.cos(a)-radius);
    }
    positions.needsUpdate=true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingSphere();
  }
  signGroup.rotation.y = 0.35;
  for(const [x,z,h] of [[69,86,11],[80,86,12],[93,85,11],[159,68,12],[172,65,13],[176,76,12]]) tree(root,x,z,h);
  // Pruned trees around the parking island have compact crowns below the tall grove.
  for(const [x,z] of [[153,75],[168,75],[171,84]]) tree(root,x,z,5,1.35);
  // Clipped shrubs and yellow-green border at the base of the name wall.
  const yellow = mat('#9fa65b');
  for(const [z,r] of [[71.5,1],[74.5,1.2],[78,1]]) {
    box(root,131.3,.7,z,r*1.6,1.3,r*1.6,M.leaf);
    box(root,133.4,.32,z,1,.5,2.8,yellow);
  }
  box(root,131.5,.09,73.5,4,.1,19,M.grass);
  for(const [x,z] of [[73,79],[86,79],[99,69]]) tree(root,x,z,4,2);
  for(let x=66;x<103;x+=1.6) box(root,x,.45,91,1.7,.75,1.1,M.leaf);
  for(let z=64;z<80;z+=1.4) box(root,106,.35,z,1,.5,1.3,M.flower);
}
