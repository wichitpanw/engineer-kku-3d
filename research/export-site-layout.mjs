import fs from 'node:fs';
import {makeSiteLayout} from '../src/site-layout.js';
const l=makeSiteLayout();
fs.writeFileSync(new URL('site-layout-snapshot.json',import.meta.url),JSON.stringify({footprints:l.footprints,roads:l.roads.map(r=>({id:r.id,width:r.width,points:r.points})),parking:l.parking.map(p=>({id:p.id,geometry:p.geometry})),roundabouts:l.roundabouts},null,2));
