import * as THREE from 'three';
import { mechanicalLabParts, mechanicalTeachingParts, mechanicalGarage } from './mechanical-layout.js';
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.9,side:THREE.DoubleSide});
const M={wall:mat('#d3cbb8'),red:mat('#b87360'),light:mat('#c5c1ad'),frame:mat('#a5a99d'),glass:mat('#526660'),floor:mat('#aaa895'),leaf:mat('#53784a'),trunk:mat('#77614b'),pink:mat('#c6a8a5'),yellow:mat('#d7b953'),dark:mat('#393e39'),stone:mat('#9b9d92'),white:mat('#e2dfcb'),flower:mat('#b76147')};
function box(p,x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
function arch(p,x,z,w,d,eave,rise,m,capMaterial=M.wall){
  const pos=[],idx=[],n=24;
  for(let i=0;i<=n;i++){const u=-w/2+w*i/n,y=eave+Math.sin(i/n*Math.PI)*rise;pos.push(x+u,y,z-d/2,x+u,y,z+d/2);if(i<n){const a=2*i;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const o=new THREE.Mesh(g,m);o.castShadow=o.receiveShadow=true;p.add(o);
  for(const end of [-1,1]){
    const v=[];for(let i=0;i<n;i++){const a=-w/2+w*i/n,b=-w/2+w*(i+1)/n;v.push(x+a,eave,z+end*d/2,x+b,eave,z+end*d/2,x+b,eave+Math.sin((i+1)/n*Math.PI)*rise,z+end*d/2,x+a,eave,z+end*d/2,x+b,eave+Math.sin((i+1)/n*Math.PI)*rise,z+end*d/2,x+a,eave+Math.sin(i/n*Math.PI)*rise,z+end*d/2);}
    const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(v,3));cap.computeVertexNormals();p.add(new THREE.Mesh(cap,capMaterial));
  }
}
function part(root,s,type,detail){
 const p=new THREE.Group();p.position.set(s.x,0,s.z);p.rotation.y=s.rotation;root.add(p);
 const {w,d,h}=s;box(p,0,h/2,0,w,h,d,M.wall);box(p,0,.18,0,w+.5,.3,d+.5,M.floor);
 if(type==='barrels'||type==='triple'){const n=type==='triple'?3:4;for(let i=0;i<n;i++)arch(p,-w/2+w/n*(i+.5),0,w/n-.25,d+.6,h,type==='triple'?1:2.1,M.red);}
 else if(type==='white')arch(p,0,0,w+.4,d+.4,h,1.5,M.light);
 else if(type==='sheds')for(let i=0;i<3;i++){
   const z=-d/2+d/3*(i+.5);const roof=box(p,0,h+.7,z,w+.4,.12,d/3+.25,M.red);roof.rotation.x=.2;
   box(p,0,h+.75,z-d/6,w,.9,.1,M.frame);
 }
 else if(s.roof==='flat'){
   box(p,0,h+.1,0,w+.4,.2,d+.4,M.light);
   for(const z of [-d/2,d/2])box(p,0,h+.45,z,w,.7,.2,M.wall);
   for(const x of [-w/2,w/2])box(p,x,h+.45,0,.2,.7,d,M.wall);
   for(let x=-w/2+12;x<w/2;x+=23)box(p,x,h+.4,0,.18,.55,d,M.frame);
 }
 else for(const side of [-1,1]){const o=box(p,side*w/4,h+1.1,0,Math.hypot(w/2,2.2),.15,d+.7,M.red);o.rotation.z=-side*Math.atan2(2.2,w/2);}
 if(detail)for(const side of [-1,1])for(let x=-w/2+2;x<w/2;x+=4){box(p,x,h*.62,side*(d/2+.03),2.6,1.25,.08,M.glass);box(p,x-1.5,h/2,side*(d/2+.08),.18,h,.2,M.frame);}
}
export function createMechanicalLab(root,detail){
 mechanicalLabParts.forEach((s,i)=>part(root,s,['barrels','white','flat'][i],detail && i!==2));
 if(!detail)return;
 const s=mechanicalLabParts[2],p=placed(root,s);
 // Two-storey service frontage on the northern road, as seen in photo 6.
 for(let x=-s.w/2+3;x<s.w/2;x+=6){
   window(p,x,5,-s.d/2-.12,4.7,1.8,Math.PI);
   box(p,x,3.65,-s.d/2-.36,1,.65,.48,M.light);
   box(p,x,3.65,-s.d/2-.61,.66,.42,.02,M.dark);
 }
 for(const x of [-18,0,18]){
   box(p,x,1.55,-s.d/2-.08,5.4,3,.15,M.dark);
   for(let y=.25;y<3;y+=.18)box(p,x,y,-s.d/2-.17,5.3,.025,.025,M.frame);
 }
}
export function createMechanicalTeaching(root,detail){
 teachingBlock(root,mechanicalTeachingParts[0],detail);
 pavilion(root,mechanicalTeachingParts[1],detail);
 parkingCanopy(root,mechanicalTeachingParts[2],detail);
 mechanicalTeachingParts.slice(3,5).forEach(s=>part(root,s,'sheds',detail));
 southGarage(root,detail);
 if(detail){
   gardens(root);
   // Roadside shade trees visible along the west and south approaches.
   for(const [x,z,h,r] of [[-216,-49,8,2.7],[-209,-34,7.5,2.5],[-181,-2,8.5,2.4],[-149,23,8,2.5]])shadeTree(root,x,z,h,r);
 }
}
export function createMechanicalCourt(root){
 // Circular planted court between the teaching wing and the eastern shed.
 const ring=new THREE.Mesh(new THREE.RingGeometry(4.6,6,40),M.floor);ring.rotation.x=-Math.PI/2;ring.position.set(-151,.12,-34);root.add(ring);
 const soil=new THREE.Mesh(new THREE.CircleGeometry(4.55,32),M.leaf);soil.rotation.x=-Math.PI/2;soil.position.set(-151,.13,-34);root.add(soil);
 for(const [x,z,r] of [[-152,-35,1.8],[-149,-33,1.25],[-153,-32,1.1]])shrub(root,x,z,r,2.6);
 for(const a of [-1.3,-.4,.6,1.7,2.6]){const stone=box(root,-151+Math.cos(a)*5.2,.2,-34+Math.sin(a)*5.2,.75,.18,1.25,M.light);stone.rotation.y=-a;}
}


function placed(root,s){
 const p=new THREE.Group();p.position.set(s.x,0,s.z);p.rotation.y=s.rotation||0;root.add(p);return p;
}
function window(p,x,y,z,w,h,rotation=0){
 const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;p.add(g);
 box(g,0,0,0,w,h,.12,M.glass);
 for(const v of [-w/2,0,w/2])box(g,v,0,.08,.08,h+.12,.08,M.white);
 for(const v of [-h/2,h/2])box(g,0,v,.08,w+.08,.08,.08,M.white);
}
function label(p,text,x,y,z,w,h,color='#41443b',background=null){
 const c=document.createElement('canvas');c.width=1536;c.height=192;
 const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
 if(background){ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);}
 ctx.font='bold 82px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;
 ctx.fillText(text,768,96,1480);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.MeshStandardMaterial({map:texture,transparent:true,roughness:.9,side:THREE.DoubleSide});
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);p.add(o);return o;
}
function teachingBlock(root,s,detail){
 const p=placed(root,s),{w,d,h}=s;
 box(p,0,h/2,0,w,h,d,M.wall);
 arch(p,0,0,w+1,d+1,h,3.2,M.red,M.red);
 for(const z of [-d/2,d/2]){
   box(p,0,h-1,z+.12,12,2,.18,M.red);
   for(let y=h-1.8;y<h+2.7;y+=.32){
     const width=y>h?Math.max(2,11*(1-(y-h)/3.3)):11;
     box(p,0,y,z+Math.sign(z)*.25,width,.08,.14,M.dark);
   }
 }
 if(!detail)return;
 // Three floors and deep fins on the long elevations; each bay is recessed.
 for(const side of [-1,1]){
   const facade=new THREE.Group();facade.position.x=side*w/2;facade.rotation.y=side*Math.PI/2;p.add(facade);
   for(let u=-d/2+2.8;u<d/2;u+=5.6){
     for(const y of [1.9,5.3,8.7])window(facade,u,y,.08,3.7,1.65);
     box(facade,u,4.15,.3,3.8,.9,.18,M.red);
     for(let v=-1.7;v<1.8;v+=.35)box(facade,u+v,4.15,.42,.06,.8,.08,M.wall);
     box(facade,u-2.5,5.35,.65,.3,10.7,1.2,M.white);
     box(facade,u,10.25,.7,5,.18,1.4,M.white);
   }
 }
 // Yellow sign wall and curved gable at the garden end (photos 2, 3 and 7).
 const entrance=new THREE.Group();entrance.position.set(-w/2-.2,0,6);entrance.rotation.y=-Math.PI/2;p.add(entrance);
 const z=.18;
 arch(entrance,-2.8,-1,12,3,h,2.6,M.red,M.red);
 box(entrance,-2.8,6.2,z,9,6.2,.22,M.yellow);
 box(entrance,-7.6,6.4,z+.25,.7,9,.6,M.white);
 box(entrance,2,6.4,z+.25,.7,9,.6,M.white);
 box(entrance,-2.8,9.7,z+.25,10,.8,.6,M.white);
 label(entrance,'MECHANICAL ENGINEERING',-2.8,9.74,z+.57,9,.65);
 label(entrance,'วิศวกรรมเครื่องกล',-2.8,8.4,z+.15,7,.7,'#784b40');
 box(entrance,5.8,6.4,z-.12,5.7,5.2,.3,M.white);
 window(entrance,5.8,6.4,z+.08,4.8,4.5);
 for(let y=11;y<13;y+=.3)box(entrance,-2.8,y,.52,8-(y-11)*2,.09,.12,M.dark);
 const canopy=box(entrance,-.5,3.0,z+2.1,17,.12,4.8,M.frame);canopy.rotation.x=.18;
 for(const x of [-8,7])box(entrance,x,1.35,z+3.9,.13,2.7,.13,M.dark);
 window(entrance,-1,1.45,z+.06,7,2.7);
}
function pavilion(root,s,detail){
 const p=placed(root,s),{w,d}=s;
 box(p,0,1.65,0,w,3.3,d,M.pink);
 box(p,0,3.35,0,w+.5,.25,d+.5,M.white);
 // Upper terrace is open, not a second solid storey.
 for(let x=-w/2+.5;x<w/2;x+=4){
   for(const z of [-d/2,d/2])box(p,x,4.85,z,.12,3,.12,M.dark);
 }
 for(let i=0;i<4;i++)arch(p,-w/2+(i+.5)*w/4,0,w/4+.1,d+.8,6.2,.95,M.red,M.red);
 for(const z of [-d/2,d/2]){
   box(p,0,3.85,z,w,.7,.15,M.wall);
   box(p,0,4.3,z,w,.09,.12,M.dark);
   if(detail)for(const x of [-w*.32,0,w*.32]){
     window(p,x,1.45,z+Math.sign(z)*.1,3.8,2.6);
     arch(p,x,z+Math.sign(z)*.8,4.6,1.6,2.8,.7,M.red,M.red);
   }
 }
 if(!detail)return;
 // Display lawn is on the road-facing (west) side of the teaching wing.
 const lawn=new THREE.Group();lawn.position.set(-5,0,-d/2-5);lawn.rotation.y=Math.PI;p.add(lawn);
 box(lawn,0,.12,0,15,.2,8,M.leaf);
 for(const x of [-4.7,4.7])rotor(lawn,x,0,0);
 for(const x of [-6.5,-2,2,6.5]){
   const pot=new THREE.Mesh(new THREE.CylinderGeometry(.38,.28,.45,10),M.dark);pot.position.set(x,.35,1.7);lawn.add(pot);
   shrub(lawn,x,1.7,.55,.65);
   for(const dx of [-.28,0,.28])box(lawn,x+dx,.7,1.7,.2,.08,.3,M.flower);
 }
 for(const x of [-8,8]){
   const tree=new THREE.Group();tree.position.set(x,0,-1);lawn.add(tree);
   box(tree,0,3,0,.35,6,.35,M.trunk);
   for(const [dx,y,dz,r] of [[0,7,0,2.1],[-1.1,6.4,.3,1.6],[1,6.6,-.2,1.7]]){
     const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),M.leaf);crown.position.set(dx,y,dz);crown.castShadow=true;tree.add(crown);
   }
 }
 for(const side of [-1,1]){
   const leg=box(lawn,side*.8,1.45,0,.16,2.9,.16,M.white);leg.rotation.z=side*.19;
 }
 box(lawn,0,2.3,.05,3.7,.85,.15,M.red);
 label(lawn,'วิศวกรรมเครื่องกล',0,2.3,.14,3.5,.65,'#eee9d5');
 for(let i=0;i<3;i++){
   const shape=new THREE.Shape();const r=9+i*.7;
   for(let j=0;j<=32;j++){const a=-.7+j/32*1.4;const x=Math.sin(a)*r,z=Math.cos(a)*r-4; j?shape.lineTo(x,z):shape.moveTo(x,z);}
   for(let j=32;j>=0;j--){const a=-.7+j/32*1.4;shape.lineTo(Math.sin(a)*(r+.7),Math.cos(a)*(r+.7)-4);}
   shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.18*(3-i),bevelEnabled:false});g.rotateX(Math.PI/2);
   const step=new THREE.Mesh(g,M.red);step.position.y=.18*(3-i);lawn.add(step);
   const top=new THREE.Mesh(new THREE.ShapeGeometry(shape),M.yellow);top.rotation.x=Math.PI/2;top.position.y=.18*(3-i)+.01;lawn.add(top);
 }
}
function rotor(p,x,y,z){
 const g=new THREE.Group();g.position.set(x,y,z);p.add(g);
 for(const side of [-1,1])box(g,side*1.7,.65,0,.17,1.3,.4,M.dark);
 const axle=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,12),M.stone);axle.rotation.z=Math.PI/2;axle.position.y=1.3;g.add(axle);
 for(let i=0;i<11;i++){
   const radius=.5+Math.sin(i/10*Math.PI)*.4;
   const disc=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.1,24),i%2?M.stone:M.frame);disc.rotation.z=Math.PI/2;disc.position.set((i-5)*.18,1.3,0);g.add(disc);
 }
}
function shrub(p,x,z,r=1,h=1.2){
 const o=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),M.leaf);o.scale.set(r,h/2,r);o.position.set(x,h/2+.1,z);o.castShadow=true;p.add(o);
}
function gardens(root){
 const s=mechanicalTeachingParts[0],base=placed(root,s),p=new THREE.Group(),z=7;
 p.position.set(-s.w/2-.2,0,6);p.rotation.y=-Math.PI/2;base.add(p);
 // Stone sign and flagpoles occupy the garden, clear of the drive to its east.
 box(p,-1,.1,z,22,.15,9,M.leaf);
 box(p,-1,1.05,z-1,12,1.8,.55,M.white);
 box(p,-1,1.08,z-.7,11.3,1.35,.08,M.stone);
 label(p,'ภาควิชาวิศวกรรมเครื่องกล',-1,1.1,z-.65,10.8,1.05);
 for(let x=-10;x<=8;x+=3){
   box(p,x,2.5,z+3,.045,5,.045,M.frame);
   shrub(p,x,z+4.2,.85,.65);
 }
 for(let x=-6;x<5;x+=1.5){shrub(p,x,z+.1,.5,.45);box(p,x,.35,z+.45,.5,.25,.4,M.flower);}
 for(const x of [-9,8]){
   box(p,x,2.4,z-2,.25,4.8,.25,M.trunk);
   const crown=new THREE.Mesh(new THREE.ConeGeometry(1.3,4.5,9),M.leaf);crown.position.set(x,4,z-2);p.add(crown);
 }
 palm(p,-10,z-1);
 palm(p,9,z+1);
 // Drain across the entrance lane, matching the street approach photograph.
 box(p,14,.08,z+1,5,.08,.4,M.dark);
 for(let x=11.6;x<16.5;x+=.2)box(p,x,.13,z+1,.035,.03,.4,M.frame);
}

function parkingCanopy(root,s,detail){
 const p=placed(root,s),{w,d,h}=s;
 box(p,0,.08,0,w,.12,d,M.floor);
 for(let i=0;i<3;i++)arch(p,-w/2+w/3*(i+.5),0,w/3-.12,d+.4,h,.65,M.red,M.red);
 for(const x of [-w/2,-w/6,w/6,w/2])for(const z of [-d/2,0,d/2])box(p,x,h/2,z,.13,h,.13,M.dark);
 for(const z of [-d/2,0,d/2])box(p,0,h-.18,z,w,.16,.16,M.frame);
 if(!detail)return;
 for(let i=0;i<4;i++){
   const x=-w/2+2+i*3.3;
   box(p,x,.6,0,1.8,.8,4.1,i%2?M.light:M.dark);
   box(p,x,1.1,-.3,1.65,.65,2.3,M.glass);
   for(const a of [-1,1])for(const z of [-1.25,1.25]){
     const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.16,12),M.dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x+a*.9,.35,z);p.add(wheel);
   }
   box(p,x-1.35,.16,0,.07,.02,5,M.white);
 }
}

function palm(p,x,z){
 box(p,x,2.4,z,.22,4.8,.22,M.trunk);
 for(let i=0;i<9;i++){
   const a=i*Math.PI*2/9;
   const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,8,4),M.leaf);
   leaf.scale.set(.45,.15,2.1);leaf.rotation.y=a;leaf.rotation.x=.25;
   leaf.position.set(x+Math.sin(a)*1.25,4.5,z+Math.cos(a)*1.25);p.add(leaf);
 }
}

function shadeTree(root,x,z,height,radius){
 const p=new THREE.Group();p.position.set(x,0,z);root.add(p);
 box(p,0,height*.38,0,.42,height*.76,.42,M.trunk);
 for(const [u,v,k] of [[0,0,1],[-.48,.1,.8],[.45,-.15,.85]]){
   const o=new THREE.Mesh(new THREE.IcosahedronGeometry(radius*k,1),M.leaf);
   o.position.set(u*radius,height-radius*.6,v*radius);o.scale.y=1.15;o.castShadow=true;p.add(o);
 }
}

function southGarage(root, detail) {
  const s = mechanicalGarage, p = placed(root, s);
  box(p, 0, .07, 0, s.w + .8, .12, s.d + 1, M.floor);
  // Low pale metal gables, open on all sides, with thin dark steel posts.
  for (const side of [-1, 1]) {
    const cx = side * (s.aisle + s.rowWidth) / 2;
    for (const slope of [-1, 1]) {
      const roof = box(p, cx + slope * s.rowWidth / 4, s.h + .48, 0,
        Math.hypot(s.rowWidth / 2 + .3, .96), .1, s.d + .8, M.light);
      roof.rotation.z = -slope * Math.atan2(.96, s.rowWidth / 2 + .3);
    }
    for (let z = -s.d / 2; z <= s.d / 2; z += s.d / 4) {
      for (const edge of [-1, 1]) box(p, cx + edge * s.rowWidth / 2, s.h / 2, z, .1, s.h, .1, M.dark);
      box(p, cx, s.h - .1, z, s.rowWidth, .12, .12, M.frame);
    }
    for (const edge of [-1,1]) box(p, cx + edge * s.rowWidth / 2, s.h - .1, 0, .12, .15, s.d, M.frame);
    if (!detail) continue;
    // Roof ribs and bay lines follow the same axes as the satellite footprint.
    for (let z = -s.d/2; z <= s.d/2; z += .7) {
      for (const slope of [-1,1]) {
        const rib=box(p,cx+slope*s.rowWidth/4,s.h+.54,z,Math.hypot(s.rowWidth/2,.9),.025,.035,M.frame);
        rib.rotation.z=-slope*Math.atan2(.96,s.rowWidth/2+.3);
      }
    }
    for(let z=-8.5;z<=8.5;z+=2.8) {
      box(p,cx,.145,z,s.rowWidth-.4,.02,.06,M.white);
    }
    for (const z of [-6, 0, 6]) {
      const car = new THREE.Group();car.position.set(cx,0,z);car.rotation.y=side*Math.PI/2;p.add(car);
      box(car,0,.65,0,1.85,.8,4.3,z===0?M.dark:M.wall);
      box(car,0,1.23,-.15,1.65,.65,2.3,M.glass);
      for(const u of [-1,1]) for(const v of [-1.3,1.3]) {
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.16,12),M.dark);
        wheel.rotation.z=Math.PI/2;wheel.position.set(u*.92,.35,v);car.add(wheel);
      }
    }
  }
}
