// One representative photo per building, supplied by the project owner.
export function photosForBuilding(building) {
  if (!building) return [];
  return [
    {
      file: `assets/building-photos/${building.id}/front.jpg`,
      title: `${building.id} · ${building.name}`,
      description: "ภาพจริงของอาคาร",
    },
  ];
}
