# EN KKU · Faculty Campus Explorer

Interactive Three.js exterior model of the Faculty of Engineering, Khon Kaen University. Seventeen current building codes are modeled, with geometric roads, pedestrian links, forecourts and planting. The current scene is a progressive architectural reconstruction; geometry and photographic coverage are labelled per building.

## Run

```powershell
npm run dev
```

Open http://localhost:8089/. No package installation is needed for the app. Three.js/OrbitControls are vendored from the user-selected reference project, cloned into `reference-home/` at `86f8aa462e8c6fa2ba30f2b6fe99d5810b374e88`.

## Explore

- Search EN code, Thai/English name or CB. Select from the list, a model surface, floating tag, or the satellite minimap.
- View the entire faculty, overhead plan, or four sides of a selected building. EN16 also has entrance, public hall and bridge presets.
- Drag to orbit; wheel to zoom; right-drag to pan. Use the surrounding-building switch to isolate a selected building.
- Walk: WASD/arrows, drag to look, Shift to move faster, Esc to exit. Floor selection and internal room layouts are outside the current scope.
- Main terrain is entirely modeled. Satellite imagery appears only in the calibrated minimap, with Esri attribution.

## Structure

- `src/campus-data.js`: registry, identities, multi-part footprints, local/metre geographic transforms, evidence and status. Reference origin: EN16 Maps pin, +X east / -Z north.
- `src/campus-buildings.js`: independent building models, material batches, near/far LOD and selection outline. Selected buildings always show their detailed geometry.
- `src/model.js` / `src/entrance.js`: the existing EN16 facade, open hall, cylinders, bridge, broad stairs, landing and rails.
- `src/terrain.js`: shared campus roads, paths, parking, planting and street details.
- `src/app.js`: selection/search, cameras, raycasting, labels, minimap, references and exterior walking.

## Checks and evidence

```powershell
node research/check-campus.mjs
node --check src/app.js
node --check src/campus-buildings.js
node --check src/campus-data.js
node --check src/model.js
node --check src/terrain.js
```

See `research/campus-audit.md` for imagery observations, limitations and user corrections. EN09 is the official code; CB is the colloquial name. EN15 is the former library, repurposed for other uses; the present library is at EN18. EN06 is at its original mapped location. Temporary cones, barriers, road closures and event decorations are excluded.

Dimensions are estimated from photographs and aerial imagery. EN16/EN18 have additional bespoke detail; other facades remain preliminary. A `detail` status indicates additional modeling, not a measured or fully surveyed replica. The prototype does not certify building access or real navigation routes.
