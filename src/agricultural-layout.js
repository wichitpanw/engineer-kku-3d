// Metres, north = -Z. Traced against the supplied aerial and the campus mosaic.
// Four wings preserve the small open courtyard instead of filling it with a roof.
const part = (x,z,w,d,h=7.4) => ({x,z,w,d,h,roof:'custom',rotation:0});
export const agriculturalMainParts = [
  part(-78,-92,20,60),
  part(-95.5,-112.5,15,19),
  part(-101.5,-98,3,10),
  part(-95.5,-77.5,15,29),
  part(-84,-139,32,7,3.4),
];
export const agriculturalLabParts = [
  part(-93,-42,47,28,7),
  part(-87,-59,35,6,4),
  part(-103,-7,21,12,3.3),
];
export const agriculturalCourt = {x:-94,z:-98,w:12,d:10};
export const agriculturalSign = {x:-60.8,z:-105.5,w:6,d:2.5};
// Explicit planting: trunks and crowns stay outside roofs and the eastern footpath.
export const agriculturalTrees = [
  [-63,-119,10,2.8],[-63,-109,9.5,2.5],[-63,-90.5,10.5,2.5],
  [-63,-76.5,10,2.5],[-63,-66,11,2.8],[-63,-52,10,2.6],
  [-63,-31,10,2.5],[-77,-20,8,2.6],[-93,-20,8.5,2.8],
  [-110,-124,9,2.6],[-107,-94,8,2.2],
];
