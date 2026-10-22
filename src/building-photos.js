// One representative photo per building, supplied by the project owner.
// Only files listed in assets/building-photos/photos.json are requested, so
// buildings without a photo do not trigger 404s.
const MANIFEST = "assets/building-photos/photos.json";
let manifest = null;
export function loadPhotoManifest(force = false) {
  if (!manifest || force)
    manifest = fetch(`${MANIFEST}?v=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  return manifest;
}
export function photosForBuilding(building) {
  if (!building) return [];
  return [
    {
      id: building.id,
      title: `${building.id} · ${building.name}`,
      description: "ภาพจริงของอาคาร",
    },
  ];
}
