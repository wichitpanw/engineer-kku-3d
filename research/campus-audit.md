# EN KKU campus implementation audit

Updated: 18 October 2026 (Asia/Bangkok).

## Reference frame

- Local metres, +X east, -Z north, +Y up. Geographic reference is the Google Maps EN16 pin at 16.4722497, 102.8235039. The main tower mesh centre is offset from this reference; a place pin is not a surveyed building centroid.
- The supplied enmap1.jpg, enmap2.png and enmap3.jpg establish building identities and neighbouring relationships. They are schematic, not scale drawings.
- Google Maps satellite view was compared with an Esri aerial mosaic. The latter is only displayed in the minimap. Its metadata records the pixel/metric calibration; retrieval date is not imagery capture date.
- Building footprints, height estimates and facade details remain an architectural reconstruction. Several roof locations are partly hidden by trees or displaced by image perspective.

## User-confirmed corrections

- Skip EN03 completely: it has been demolished. There is no EN03 model, list entry, map polygon or pending marker.
- EN09 is the formal code. CB is the informal name and a search alias. The current Maps CB pin is 16.4733601, 102.8251674; it was used to correct the initial placement north of EN17. A building farther north in the surrounding faculty is not included.
- EN15 is the former library, now repurposed for other uses (user confirmed; Maps pin labels ARIS). The active engineering library is at EN18 (50th Anniversary Building). The building is not described as closed or unused.
- EN06 still occupies its original position in the supplied maps. Confirmed by the user after the separate Maps search did not establish an independent EN06 pin.
- Exclude cones, road closure barriers, temporary construction and event arches. Do not add floor selection or cutaway controls.

## Geometry and interface delivered

- 17 independently selectable building codes, including multi-part footprints, courtyard buildings, L wings, workshop sheds, curved roofs and EN18 folded concrete wings. Existing EN16 detailed facade/entrance model retained; its ground floor is open and its floor grid no longer lies under a slab.
- EN15 has four roof bays. Its unverified side elevations remain explicitly marked as preliminary.
- EN18 has two oblique concrete wings, open lower hall, diagonal structural members, two upper decks, glazed openings, name lettering, entrance treads, service beams and hall seating. Structural dimensions remain estimated.
- Main campus road loop, northern and eastern connections, western boundary road, pedestrian links, covered paths, forecourts, parking, lawns and trees are modeled geometry.
- Search code, Thai/English name or alias; select via list, 3D surface, floating tag or calibrated minimap polygon. Frame selection, four directional views, overview/top, isolated selection, reference sheets and source links.
- Exterior walk mode with diagonal movement normalization, keyboard focus, bounds and collisions against the preliminary closed building footprints. EN16/EN18 public halls remain traversable; this is not a certified accessibility/navigation model.
- Batched materials per building/LOD, simplified distant geometry and full detail for selected buildings. Labels cull offscreen and at ground level, and avoid overlap.

## Detail coverage (do not overstate)

EN16 has the strongest photographic coverage: user photographs, west and east Street View, entrance and hall photographs. EN18 front exterior and lower hall were inspected in Maps reviewer images (January 2019, December 2025); roof form also follows the aerial. EN04 and EN11 now have dedicated exterior models from the inspected Street View and gallery, including the connected tall wings, lower office and old teaching block; see `en04-en11-audit.md`. Their hidden rear surfaces remain provisional. EN15 and the remaining departments/laboratories retain mapped footprint/roof reconstruction and provisional facade patterns labelled `basic`.

The progressive detail order remains EN16 → EN15 → EN18; EN01/02; EN17/04/11/09; EN06/13/14; EN08/12/05/10/07. Missing photographic directions must be gathered and reconciled before changing a record's coverage status. Do not promote a whole building to measured accuracy based on a single front photo.

## Checks

- `node research/check-campus.mjs`: 17 unique IDs; skipped EN03; finite dimensions/bounds; all source references resolve; geographic coordinate round trips; CB pin within its model bounds; library identities correct.
- `node --check` on all application modules.
- Browser: scene loads; CB/EN15/EN16/EN18 searches and selection; per-building focus; EN15 old-library usage; EN18 active-library usage; EN16 hall remains visibly open. More interaction checks are recorded as they are completed.

## Grounds comparison loop — 18 October 2026

- Replaced independent road meshes and parking rectangles with one shared planar layout. Road joins are unioned; plaza and pedestrian surfaces are cut away from traffic lanes. This removes the paving slabs that previously covered roads.
- Corrected EN14 roof-axis rotation, EN12 width, EN10 cluster position and EN18 southern wing clearance against the aerial. Removed the invented vehicle road between EN18 and EN16; this is a forecourt.
- Traced seven parking areas with individual entrances. The west roundabout has a separate island and western approach stubs. Covered car bays follow the photographed inner bend; vehicles are generated only when their entire bay fits inside parking.
- Street View, May 2019, `LeWn1gtNVHK0vJmGgYyMEQ` at 16.4716892, 102.8231792: covered car bays, separate tiled sidewalk and red/white curb at the southwest bend.
- Street View, May 2019, `3i-bS2tliw2AX5NRWIvrkw` at 16.4724638, 102.8241182: service approach north of the former library is patterned paving, with a covered pedestrian path; no yellow centre line. Updated this lane's surface and alignment accordingly.
- Street View, May 2019, `EVV0M9CszgMHSs5bLa3paw` at 16.4713709, 102.8236426: southern boundary lane has separate sidewalk, curb and green forecourt; vehicle access branches toward the building. Temporary posts/signs are not copied.
- Rechecked the satellite view after these changes, followed by close 3D views around EN08, EN14, EN15 and EN04. The southwest avenue is visibly continuous in the close view.
- `node research/check-site-layout.mjs` and the rendered scene audit: 13 road traces, one connected traffic network, seven parking areas, zero detected road/building or road/parking intersections. Runtime also reports 166 parked vehicles and zero vehicle/road conflicts. All parking entrances connect to their lots and the road network.
- This audit checks the modeled footprints and traced surfaces. It does not establish survey accuracy, unseen elevations, every narrow path beneath trees, or current conditions from older Street View imagery. Remaining facade work retains preliminary status.

## Source links

- Google Maps faculty aerial: https://www.google.co.th/maps/@16.4731,102.8236,17z/data=!3m1!1e3
- EN16 KKU 360: https://cesium.kku.ac.th/web/pienvichit12/
- EN18 Maps gallery: https://www.google.com/maps/search/?api=1&query=อาคาร+50+ปี+คณะวิศวกรรมศาสตร์+มหาวิทยาลัยขอนแก่น
- KKU procurement refers to EN09 as the steel-frame building: https://procurement.kku.ac.th/t/bidders?page=111&per-page=15&sort=name
- Active engineering library Maps search gives a pin next to EN18, corroborated by the user: https://www.google.com/maps/search/ห้องสมุดคณะวิศวกรรมศาสตร์+มหาวิทยาลัยขอนแก่น
