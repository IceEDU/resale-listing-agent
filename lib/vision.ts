import type { Condition } from "./types";

export type VisionResult = {
  title: string;
  description: string;
  category: string;
  brand: string;
  condition: Condition;
  basePrice: number;
};

/**
 * Mock vision model. Returns canned item details as if extracted from the
 * uploaded photos. Replace with a real vision model call (DESIGN.md §3) —
 * photos must only be sent after the consent gate.
 */
const TEMPLATES: VisionResult[] = [
  {
    title: "Apple iPhone 12, 64GB, unlocked",
    description:
      "Unlocked iPhone 12 in good working order. Battery health above 85%, screen free of cracks, light wear on the edges. Ships reset to factory settings.",
    category: "Cell phones",
    brand: "Apple",
    condition: "good",
    basePrice: 210,
  },
  {
    title: "KitchenAid Classic stand mixer, white",
    description:
      "KitchenAid Classic 4.5-quart stand mixer. Runs smoothly on all speeds, includes bowl and three attachments. Normal cosmetic wear.",
    category: "Kitchen appliances",
    brand: "KitchenAid",
    condition: "good",
    basePrice: 180,
  },
  {
    title: "Trek FX 2 hybrid bike, size M",
    description:
      "Trek FX 2 hybrid, medium frame. Recently tuned, new brake pads, tires hold air. Some scratches on the top tube.",
    category: "Bikes",
    brand: "Trek",
    condition: "good",
    basePrice: 320,
  },
  {
    title: "LEGO Star Wars X-Wing 75355, sealed",
    description:
      "Factory-sealed LEGO Ultimate Collector Series X-Wing. Box in excellent shape, kept in a smoke-free home.",
    category: "Toys & hobbies",
    brand: "LEGO",
    condition: "new",
    basePrice: 190,
  },
  {
    title: "DeWalt DWE575 circular saw",
    description:
      "DeWalt DWE575 7-1/4 inch circular saw. Strong motor, accurate bevel, blade has plenty of life left. Light scuffs on the shoe from normal jobsite use.",
    category: "Power tools",
    brand: "DeWalt",
    condition: "good",
    basePrice: 140,
  },
  {
    title: "Makita MAC2400 air compressor",
    description:
      "Makita MAC2400 Big Bore 2.5 HP air compressor. Builds pressure quickly, holds air overnight, oil recently changed. Runs quiet for its class.",
    category: "Power tools",
    brand: "Makita",
    condition: "good",
    basePrice: 260,
  },
  {
    title: "UDM power drill",
    description: "UDM cordless drill. Works, includes one battery.",
    category: "Power tools",
    brand: "UDM",
    condition: "good",
    basePrice: 50,
  },
  {
    title: "Patagonia Better Sweater fleece, men's M",
    description:
      "Patagonia Better Sweater quarter-zip in navy, men's medium. No pilling, holes, or stains. From a pet-free home.",
    category: "Clothing",
    brand: "Patagonia",
    condition: "like_new",
    basePrice: 55,
  },
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function mockVision(hint: string, photoCount: number): VisionResult {
  const cleaned = hint.trim();
  if (!cleaned) {
    return TEMPLATES[hash(`photos-${photoCount}-${Date.now()}`) % TEMPLATES.length];
  }
  const words = cleaned.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const byBrand = TEMPLATES.find((t) => words.includes(t.brand.toLowerCase()));
  const matched =
    byBrand ??
    TEMPLATES.find((t) => {
      const haystack = `${t.title} ${t.brand} ${t.category}`.toLowerCase();
      return words.some((w) => haystack.includes(w));
    });
  const template = matched ?? TEMPLATES[hash(cleaned) % TEMPLATES.length];
  return {
    ...template,
    title: cleaned.charAt(0).toUpperCase() + cleaned.slice(1),
  };
}
