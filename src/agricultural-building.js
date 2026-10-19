import * as THREE from 'three';
import { agriculturalMainParts, agriculturalLabParts, agriculturalTrees } from './agricultural-layout.js';
const mat = color => new THREE.MeshStandardMaterial({color,roughness:.87,side:THREE.DoubleSide});
const M={wall:mat('#d6d1bc'),white:mat('#deded0'),roof:mat('#c2c3b7'),fascia:mat('#a3b5ad'),glass:mat('#536961'),brick:mat('#a77250'),red:mat('#a45549'),dark:mat('#424b45'),stone:mat('#b7a181'),floor:mat('#b4b09e'),leaf:mat('#527248'),trunk:mat('#786950'),blue:mat('#526f80'),gold:mat('#d3ba70'),concrete:mat('#8e9285'),ochre:mat('#a2957b')};
function box(p,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
function label(p,text,x,y,z,w,h,rotation=0,color='#ece7cd'){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=160;const ctx=canvas.getContext('2d');
 ctx.fillStyle=color;ctx.font='600 76px "IBM Plex Sans Thai", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,768,80,1480);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,transparent:true,roughness:.9,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.y=rotation;p.add(o);
}
function badgeLabel(p,text,x,y,z,w,h,color='#151a17'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=384;const ctx=canvas.getContext('2d');
 ctx.fillStyle=color;ctx.font='700 240px "IBM Plex Sans Thai", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,192);
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,transparent:true,roughness:.8,side:THREE.DoubleSide}));o.position.set(x,y,z);p.add(o);
}
function group(root,x,z,rotation=0){const p=new THREE.Group();p.position.set(x,0,z);p.rotation.y=rotation;root.add(p);return p;}
function window(p,x,y,z,w,h){
 box(p,x,y,z,w,h,.09,M.glass);
 for(const dx of [-w/2,0,w/2])box(p,x+dx,y,z+.07,.07,h+.1,.09,M.white);
 for(const dy of [-h/2,h/2])box(p,x,y+dy,z+.07,w+.12,.08,.09,M.white);
}
function ac(p,x,y,z){box(p,x,y,z,1,.65,.48,M.white);const fan=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.035,12),M.dark);fan.rotation.x=Math.PI/2;fan.position.set(x,y,z+.25);p.add(fan);}
function arch(p,w,d,h,rise,m){
 const points=[];for(let i=0;i<=24;i++)points.push(new THREE.Vector2(-w/2+w*i/24,h+Math.sin(i/24*Math.PI)*rise));
 points.push(new THREE.Vector2(w/2,h-.1),new THREE.Vector2(-w/2,h-.1));
 const g=new THREE.ExtrudeGeometry(new THREE.Shape(points),{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;p.add(o);
}
function pitchedRoof(p,x,z,w,d,h,rise,m=M.roof){
 for(const s of [-1,1]){const o=box(p,x+s*w/4,h+rise/2,z,Math.hypot(w/2,rise),.12,d,m);o.rotation.z=-s*Math.atan2(rise,w/2);}
}
function tree(p,x,z,h,r){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.34,h*.8,7),M.trunk);trunk.position.set(x,h*.4,z);trunk.castShadow=true;p.add(trunk);
 for(const [dx,dy,dz,s] of [[0,0,0,1],[-.35,-.6,.2,.76],[.3,.6,-.15,.77]]){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(r*s,1),M.leaf);o.scale.y=1.3;o.position.set(x+dx,h-r*.5+dy,z+dz);o.castShadow=o.receiveShadow=true;p.add(o);}
}
function palm(p,x,z,h=9){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.13,.24,h,8),M.trunk);trunk.position.set(x,h/2,z);p.add(trunk);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const pts=[new THREE.Vector3(x,h,z),new THREE.Vector3(x+Math.cos(a)*1.25,h+.5,z+Math.sin(a)*1.25),new THREE.Vector3(x+Math.cos(a)*2.3,h-1,z+Math.sin(a)*2.3)];const leaf=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),5,.15,3,false),M.leaf);leaf.castShadow=true;p.add(leaf);}
}
function mainRoof(root){
 // West slope has an actual hole; the courtyard remains visible from above.
 const shape=new THREE.Shape();shape.moveTo(-103,-122);shape.lineTo(-85.5,-122);shape.lineTo(-85.5,-62);shape.lineTo(-103,-62);shape.closePath();
 const hole=new THREE.Path();hole.moveTo(-100,-103);hole.lineTo(-100,-93);hole.lineTo(-88,-93);hole.lineTo(-88,-103);hole.closePath();shape.holes.push(hole);
 const g=new THREE.ShapeGeometry(shape),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getY(i);pos.setXYZ(i,x,9.1+(x+103)*.075,z);}g.computeVertexNormals();
 const o=new THREE.Mesh(g,M.roof);o.castShadow=o.receiveShadow=true;root.add(o);
 const east=box(root,-76.75,9.756,-92,Math.hypot(17.5,1.3125),.12,60,M.roof);east.rotation.z=-Math.atan2(1.3125,17.5);
 for(const x of [-103,-68])box(root,x,8.3,-92,.12,1.6,60,M.fascia);
 for(const z of [-122,-62])box(root,-85.5,8.3,z,35,1.6,.12,M.fascia);
 // Standing seams follow the long roof, with no strips crossing the courtyard.
 for(let x=-102.5;x<-68;x+=1.15){const y=9.13+Math.min(x+103,-68-x)*.075;const ranges=x>-100&&x<-88?[[-122,-103],[-93,-62]]:[[-122,-62]];for(const [a,b] of ranges)box(root,x,y,(a+b)/2,.025,.025,b-a,M.white);}
 for(const x of [-103,-68])for(let z=-121.6;z<-62;z+=.55)box(root,x,8.3,z,.18,1.55,.025,M.white);
}
function eastFacade(root,x,z,length,h,lab=false){
 const p=group(root,x,z,Math.PI/2);
 box(p,0,1.1,0,length,1.55,.18,lab?M.brick:M.stone);
 box(p,0,4.05,0,length,.3,.3,M.white);
 if(lab)box(p,0,5.6,.02,length,2.6,.12,M.ochre);
 for(let u=-length/2+1.2;u<length/2;u+=2.3){
  const entry=!lab&&Math.abs(u-8)<3.4;
  const isWallSign=!lab&&Math.abs(u-13)<2.8;
  if(!entry&&!isWallSign)window(p,u,2.6,.12,1.55,1.9);
  window(p,u,5.65,.12,lab?1:1.55,2.1);
  box(p,u-1.03,4.25,.42,.16,h-1,.72,M.white);
  if(Math.round(u+length)%3===0&&!entry&&!isWallSign)ac(p,u,3.65,.57);
 }
 if(lab){
  box(p,0,2.1,.82,17,3.2,.26,M.brick);
  // Concrete slab with crisp '12' raised proudly above the brick wall coping
  box(p,0,4.05,.97,1.8,1.1,.16,M.white);
  badgeLabel(p,'12',0,4.05,1.06,1.6,.95,'#1c221e');
  // High-contrast gold lettering on the red brick background
  label(p,'อาคารปฏิบัติการวิศวกรรมเกษตร',0,2.35,.97,15,.65,0,'#f2dc87');
 }
 else{
  const door=group(p,8,0);window(door,0,1.8,.45,4.1,2.8);
  for(let k=0;k<4;k++)box(p,8,.13+k*.16,1.7-k*.35,5.4,.25,2.5-k*.3,M.brick);
  const canopy=group(p,8,1.65);arch(canopy,5.8,3.6,4.2,1.8,M.red);
  for(const u of [5.25,10.75])box(p,u,2,3.2,.18,4,.18,M.white);
  // Department wall sign is south of the entrance at u=13 (opposite the north garden wooden sign at z=-105.5)
  box(p,13,1.8,.52,4.8,2.5,.25,M.stone);
  for(const [text,y] of [['ภาควิชาวิศวกรรมเกษตร',2.25],['Department of Agricultural Engineering',1.65]]){
   box(p,13,y,.68,4.55,.44,.1,M.dark);
   label(p,text,13,y,.75,4.4,.32,0,'#f2dc87');
  }
 }
}
function shelter(root,s,detail,color=M.blue){
 const p=group(root,s.x,s.z);box(p,0,.1,0,s.w+.6,.16,s.d+.6,M.floor);pitchedRoof(p,0,0,s.w+.5,s.d+.5,s.h,.5,color);
 for(let x=-s.w/2+.5;x<s.w/2;x+=5.1)for(const z of [-s.d/2+.3,s.d/2-.3])box(p,x,s.h/2,z,.15,s.h,.15,M.dark);
 for(const z of [-s.d/2,s.d/2])box(p,0,s.h-.2,z,s.w,.18,.12,M.dark);
 if(detail)for(let x=-s.w/2+2;x<s.w/2-1;x+=4.2){box(p,x,.65,0,1.8,.7,3.7,M.white);box(p,x,1.25,-.2,1.6,.65,1.7,M.glass);}
}
export function createAgriculturalMain(root,detail){
 for(const s of agriculturalMainParts.slice(0,4)){box(root,s.x,s.h/2,s.z,s.w,s.h,s.d,M.wall);box(root,s.x,.2,s.z,s.w,.3,s.d,M.stone);}
 mainRoof(root);shelter(root,agriculturalMainParts[4],detail);
 if(!detail)return;
 eastFacade(root,-67.95,-92,59,7.4);
 const front=group(root,-67.95,-92,Math.PI/2);
 // Narrow vertical concrete fins and the solid stair wall south of the entry.
 for(let u=-29;u<29;u+=1.15)if(Math.abs(u-8)>3.4)box(front,u,5.25,.46,.12,3.3,.8,M.white);
 box(front,-1,3.7,.52,3.2,7.4,.22,M.wall);
 // West elevations and the four inner courtyard edges.
 for(const [x,z,len,rot] of [[-103.05,-112.5,18,-Math.PI/2],[-103.05,-77.5,28,-Math.PI/2],[-88,-98,10,-Math.PI/2],[-94,-103,12,0],[-94,-93,12,Math.PI]]){
  const p=group(root,x,z,rot);for(let u=-len/2+2;u<len/2;u+=3.4)for(const y of [2.5,5.6])window(p,u,y,.1,2.6,1.5);
 }
 box(root,-94,.12,-98,12,.15,10,M.brick);
 const inner=box(root,-89.2,3.2,-98,2.2,.12,9.6,M.fascia);inner.rotation.z=.1;
 for(const z of [-101,-97,-94])box(root,-90,1.5,z,.12,3,.12,M.white);
 for(const z of [-100,-96]){box(root,-95,.8,z,2,.15,1,M.white);box(root,-95,.4,z,.2,.8,.6,M.white);}
}
export function createAgriculturalLab(root,detail){
 const s=agriculturalLabParts[0];box(root,s.x,s.h/2,s.z,s.w,s.h,s.d,M.wall);
 pitchedRoof(root,s.x,s.z,s.w+.4,s.d+.4,s.h+.4,1.15);
 for(const x of [s.x-s.w/2,s.x+s.w/2])box(root,x,s.h+.1,s.z,.18,.8,s.d+.4,M.concrete);
 for(const z of [s.z-s.d/2,s.z+s.d/2])box(root,s.x,s.h+.1,z,s.w+.4,.8,.18,M.concrete);
 const c=agriculturalLabParts[1];box(root,c.x,2,c.z,c.w,4,c.d,M.wall);box(root,c.x,4.1,c.z,c.w+.4,.2,c.d+.4,M.roof);
 const a=agriculturalLabParts[2];box(root,a.x,a.h/2,a.z,a.w,a.h,a.d,M.wall);
 for(let i=0;i<3;i++)pitchedRoof(root,a.x-a.w/2+a.w/3*(i+.5),a.z,a.w/3+.1,a.d+.4,a.h,.6,M.red);
 if(!detail)return;
 eastFacade(root,-69.45,-42,27,7,true);
 for(const side of [-1,1]){const p=group(root,s.x,s.z+side*s.d/2,side<0?Math.PI:0);for(let u=-s.w/2+3;u<s.w/2;u+=5){window(p,u,5,.1,3.5,1.4);box(p,u,1.65,.05,3.4,3,.15,M.dark);}}
 const p=group(root,-65.7,-59,Math.PI/2);arch(p,4,9,3.1,.45,M.roof);
 for(const x of [-1.8,1.8])for(const z of [-4,0,4])box(p,x,1.5,z,.12,3,.12,M.red);
 // Covered agricultural equipment display visible between the two buildings.
 for(const z of [-61,-58]){box(root,-65.5,.8,z,1.6,.65,1.8,M.red);for(const x of [-66.4,-64.6]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.22,10),M.dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.5,z);root.add(wheel);}}
}
export function createAgriculturalSite(root){
 for(const [x,z,h,r] of agriculturalTrees)tree(root,x,z,h,r);
 for(const z of [-104,-96,-44])palm(root,-63.5,z,10);
 // Low hedges with clear openings at the east entrance (z=-84), wooden sign (z=-105.5), and lab access (z=-59).
 for(const [a,b] of [[-123,-109],[-102,-87.5],[-80.5,-63],[-54,-29]])box(root,-58.9,.45,(a+b)/2,1,.85,b-a,M.leaf);
 const sign=group(root,-60.8,-105.5,Math.PI/2);
 for(const x of [-2.7,2.7])box(sign,x,1.3,0,.12,2.6,.12,M.red);
 for(const y of [.65,2.45])box(sign,0,y,0,6,.1,.1,M.red);
 box(sign,0,1.6,0,5.3,.95,.12,M.red);label(sign,'ภาควิชาวิศวกรรมเกษตร',0,1.6,.08,5.1,.65,0,'#e3c77a');
 for(const z of [-111,-115]){box(root,-64,.7,z,2,.14,1.2,M.white);for(const dz of [-1,1])box(root,-64,.43,z+dz,2,.12,.4,M.white);}
 box(root,-62.5,.75,-52,3.6,1.3,.3,M.stone);
 for(const z of [-37,-48,-78,-112])for(let i=0;i<3;i++){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),M.leaf);o.position.set(-64+i*.8,.65,z);root.add(o);}
}
