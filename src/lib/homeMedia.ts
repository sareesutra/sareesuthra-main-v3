export interface HomeMediaSlot {
  key: string;
  label: string;
  location: string;
  url: string;
  link?: string;
}

export const defaultHomeMediaSlots: HomeMediaSlot[] = [
  {
    key: "hero_main",
    label: "Hero Main Banner",
    location: "Homepage > Top Hero",
    url: "/home/banner-main.jpg",
    link: "/products",
  },
  {
    key: "collection_1",
    label: "Collection Card 1",
    location: "Homepage > Shop By Collection",
    url: "/home/collection-1.jpg",
    link: "/products",
  },
  {
    key: "collection_2",
    label: "Collection Card 2",
    location: "Homepage > Shop By Collection",
    url: "/home/collection-2.jpg",
    link: "/products",
  },
  {
    key: "collection_3",
    label: "Collection Card 3",
    location: "Homepage > Shop By Collection",
    url: "/home/collection-3.jpg",
    link: "/products",
  },
  {
    key: "brand_story",
    label: "Brand Story Image",
    location: "Homepage > Brand Story Split Section",
    url: "/our-story-saree.jpg",
    link: "/about",
  },
  {
    key: "gallery_1",
    label: "Gallery Image 1",
    location: "Homepage > Photo Gallery",
    url: "/home/gallery-1.jpg",
    link: "/products",
  },
  {
    key: "gallery_2",
    label: "Gallery Image 2",
    location: "Homepage > Photo Gallery",
    url: "/home/gallery-2.jpg",
    link: "/products",
  },
  {
    key: "gallery_3",
    label: "Gallery Image 3",
    location: "Homepage > Photo Gallery",
    url: "/home/gallery-3.jpg",
    link: "/products",
  },
  {
    key: "gallery_4",
    label: "Gallery Image 4",
    location: "Homepage > Photo Gallery",
    url: "/home/gallery-4.jpg",
    link: "/products",
  },
];

export const mergeHomeMediaSlots = (savedSlots: HomeMediaSlot[] | null | undefined): HomeMediaSlot[] => {
  if (!savedSlots || savedSlots.length === 0) {
    return defaultHomeMediaSlots;
  }

  const savedMap = new Map(savedSlots.map((slot) => [slot.key, slot]));

  return defaultHomeMediaSlots.map((slot) => {
    const saved = savedMap.get(slot.key);
    if (!saved) return slot;

    return {
      ...slot,
      url: saved.url || slot.url,
      link: saved.link || slot.link,
    };
  });
};
