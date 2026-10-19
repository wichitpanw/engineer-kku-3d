// Mechanical precinct traced from the user's two aerial images (19 Oct 2026).
// Existing campus registration retained; plan positions are aerial estimates; elevations follow the supplied street photographs.
export const mechanicalLabParts = [
  { x:-150,z:-84,w:69,d:54,h:8,roof:'custom',rotation:.48 },
  { x:-158.7,z:-116.7,w:54,d:12,h:7,roof:'custom',rotation:.48 },
  { x:-169.6,z:-121.7,w:69,d:7,h:7,roof:'flat',rotation:.48 },
];
export const mechanicalTeachingParts = [
  { x:-184,z:-49,w:20,d:35,h:10.8,roof:'custom',rotation:.45 },
  { x:-200,z:-70,w:30,d:12,h:6,roof:'gable',rotation:.45 },
  { x:-170,z:-25,w:17,d:17,h:3.2,roof:'gable',rotation:.45 },
  { x:-129.5,z:-42.5,w:16,d:14,h:5,roof:'custom',rotation:0 },
  { x:-132,z:-28,w:21,d:15,h:5,roof:'custom',rotation:0 },
];

// Separate pale-roof garage south of the red-roof annex, from the user's aerial
// and street photographs. Two rows flank a clear central driving aisle.
export const mechanicalGarage = {
  x: -166, z: 13, w: 21, d: 22, h: 3.15, rotation: .55,
  aisle: 5, rowWidth: 8,
  entry: [[-176, -9], [-171.75, 3.62], [-166, 13]],
};
export const mechanicalGarageRoofs = [-1, 1].map(side => {
  const offset = side * (mechanicalGarage.aisle + mechanicalGarage.rowWidth) / 2;
  return {
    x: mechanicalGarage.x + offset * Math.cos(mechanicalGarage.rotation),
    z: mechanicalGarage.z - offset * Math.sin(mechanicalGarage.rotation),
    w: mechanicalGarage.rowWidth, d: mechanicalGarage.d,
    h: mechanicalGarage.h, roof: 'custom', rotation: mechanicalGarage.rotation,
  };
});
mechanicalTeachingParts.push(...mechanicalGarageRoofs);
