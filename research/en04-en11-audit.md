# EN04 / EN11 exterior reconstruction — 18 October 2026

## Evidence inspected directly

- User's requested Street View point: 16.47205141275577, 102.82562367267558. Maps snaps to panorama `9hjibyR49b3Xp723NuLXTg`, 16.4720426, 102.8256099, May 2019. Inspected north toward Computer Engineering, east toward the three-storey Electrical Engineering entrance, and south toward the motorcycle shelter. This reveals five open-corridor levels behind the three-storey projection, the separate two entrances, and the circulation space around the central lawn.
- `FtCKK01eHJuPS3cL-L2suQ`, 16.4723002, 102.8252863, May 2019: blank Computer Engineering west end wall, Thai/English lettering, rainwater pipe, paved sidewalk and drainage. Screenshot: `research/en04-west-streetview.png`.
- `fzhghcCrr2CqGA9v39-eIQ`, 16.4718249, 102.8252753, May 2019: number 11 on the old white two-storey teaching block; upper balcony, corrugated gable, external ladder, air conditioners and fixed covered sidewalk.
- Electrical Engineering Maps gallery: first exterior attributed to the department, published October 2018, capture footer September 2018. June 2019 exterior by oh san confirms the green motorcycle canopy and covered link beside the entrance. Gallery also contains unrelated logos, equipment and other campus buildings; these do not establish unseen elevations.
- Google satellite and Esri reference mosaic, compared with the supplied north-up and rotated aerial captures. Roof edges in oblique imagery are displaced from the ground by height; not treated as surveyed coordinates.
- User confirms EN11 is Electrical Engineering, EN04 is Computer Engineering, and they are connected. The registry keeps separate selectable codes while the model shares the corner and connections.

## Geometry changes

- Replaced the two generic pitched-roof tall blocks with a connected flat-roof L: north computer wing, east electrical wing. Five levels, recessed corridors, horizontal railings, concrete piers, blue/grey upper shade bands and closed stair/service bays at the computer wing's west end.
- Electrical office is a lower three-storey projection attached to the east wing. Corrected its projection depth from the initial over-wide reconstruction, with full-height white piers, barred middle-level windows, recessed entrance, six treads, white name portal and small blue roof ornament.
- Old EN11 block is two storeys, not the previous four-storey generic mass. Long gable roof, glazed classroom fronts, external upper access balcony, white panel joints, number plate, end ladder, air conditioning and covered pedestrian perimeter.
- Heights, bay widths and concealed surfaces remain approximate. No room layout, cutaway or floor exploration is added.

## Court corrections from repeated comparison

- Continuous concrete court, not asphalt parking slabs or raised islands surrounding individual rows. Only the actual central lawn has a curb.
- Black/gold department sign sits toward the road end of the lawn, with flowering bed in front and separate palm groups behind. Fixed circular basin represented behind the sign. No cones, graduation banner or temporary signs.
- Computer motorcycle canopy and parking shortened together to the western portion, ending before the computer entrance. Initial 51-metre placeholder canopy was excessive; current estimated length is 21 metres. Entrance apron stays open.
- Electrical motorcycle roof is curved, with a low covered connection. Its parking and roof moved south together to preserve a traffic aisle, rather than compress cars against motorcycle bays.
- Car bay noses now meet the lawn curb on both long sides. Estimated 2.5 × 5 metre bays; southern motorcycle boundary is 5.2 metres beyond the southern car bay boundary. These are reconstruction parameters, not measured survey results.
- Ground paint shows opposite circulation directions on the two sides of the island. No invented covered walkway runs across the front of the lawn.
- Front road correction: paved entry strokes are clipped at the asphalt boundary, removing rounded concrete caps that intruded into the lane. The east apron meets the lane continuously, with dashed white frontage and dashed yellow centre paint. Northern bend moved to the corner rather than drifting diagonally along the entire frontage. A street-level camera preset exposes this boundary for review.
- Planting is an explicit trunk list (`src/east-planting.js`), not a random court scatter: feather-palm group toward the western part of the island, shorter multi-stem fan-palm group toward the office end, a smaller broad-leaf tree, separate tall palms beside the office, narrow trees at the computer wing and shade trees by the old building. Re-inspected the panorama looking back west/northwest (295.39°) to distinguish these groups. Canopy reach and exact trunk offsets remain estimates.

## Checks

- Shared site audit: 13 road traces, 11 parking areas, one connected vehicle network, no detected roads/parking intersecting registered building footprints.
- All parking entrances connect to their own lot and the road network. All painted walks remain outside vehicle surfaces and building bodies.
- Added regression checks for the shortened computer shelter extent, the electrical circulation aisle, and parking remaining outside the lawn island. Triangle area also matches the planar vehicle-surface area.
- A close-view review caught the motorcycle roof overlapping the old north sidewalk roof, a street lamp piercing that sidewalk roof, and a palm root inside the covered link. These were outside the former building-footprint-only audit. Low canopy envelopes now share `src/east-canopies.js` between the renderer and checks: separated motorcycle/sidewalk roofs, edge-aligned covered link, removed unverified lamp, moved palm outside the link. Checks reject low-roof pair intersections and tree trunks inside low roofs.
- Fixed inward-facing gable-end triangles on the old block, the number-11 plate text scale, the office portal alignment between structural piers and a camera orbit clamp that had lifted ground reference presets above their intended height.
- Browser inspection includes the court, both entrances, the old EN11 and the building overview. The reference gallery for either code includes the supplied comparison images and Maps source links.

Remaining limits: no full photographic coverage of the outer east and north rear faces beneath vegetation; rear window treatment remains provisional. Dimensions and plant positions are estimates. This is not a claim of a 100% measured replica.
