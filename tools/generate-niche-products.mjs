import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "storefront", "assets", "generated-products");

const categories = [
  {
    title: "Fragrance Wardrobe",
    slug: "fragrance-wardrobe",
    description: "Minimal perfumes, mists, and scent layering pieces for daily rituals.",
    hue: "#d8c6b8",
    accent: "#9b6a54",
    kind: "perfume",
    brands: ["Maison Veyra", "Aurum Vale", "Noema Scent", "Liri Studio"],
    items: ["Soft Veil Eau de Parfum", "Amber Linen Mist", "Cedar Fig Parfum", "Iris Cloud Scent", "Milk Wood Extrait", "Rose Ash Perfume Oil", "Solar Tea Fragrance", "Velvet Peony Spray", "Quiet Musk Eau de Parfum", "Rain Neroli Mist"],
  },
  {
    title: "Sun Care & SPF",
    slug: "sun-care-spf",
    description: "Modern sunscreen, after-sun care, and warm-weather skin essentials.",
    hue: "#f4d59d",
    accent: "#d49a35",
    kind: "tube",
    brands: ["Solenne Lab", "Dayfield Skin", "Ray & Root", "Helio Muse"],
    items: ["Daily Sheer SPF 50", "Sun Silk Mineral Cream", "Golden Hour SPF Stick", "Afterglow Cooling Gel", "Tinted Shield SPF 40", "Beach Calm Face Fluid", "Solar Reset Body Milk", "Soft Shade Lip SPF", "Sunwake Defense Drops", "Cloud Screen Serum"],
  },
  {
    title: "Face Treatments",
    slug: "face-treatments",
    description: "Serums, masks, and targeted treatments for polished daily skin.",
    hue: "#eadfd6",
    accent: "#b58a73",
    kind: "dropper",
    brands: ["Elyra Science", "Mira Derm", "Clinea Works", "Velouté Lab"],
    items: ["Peptide Lift Serum", "Glass Calm Ampoule", "Overnight Barrier Mask", "Vitamin Dew Drops", "Soft Peel Tonic", "Ceramide Reset Cream", "Lactic Glow Gel", "Blue Calm Concentrate", "Firming Silk Serum", "Hydra Cloud Mask"],
  },
  {
    title: "Bath & Shower",
    slug: "bath-shower",
    description: "Bath oils, body washes, and shower textures with a spa-like finish.",
    hue: "#d9d0c3",
    accent: "#7f6d5f",
    kind: "pump",
    brands: ["Bath Theory", "Casa Foam", "Sable Body", "Morn Ritual"],
    items: ["Fig Milk Body Wash", "Amber Foam Cleanser", "Silk Steam Bath Oil", "Salt Flower Scrub", "Oat Cloud Shower Cream", "Citrus Clay Body Polish", "Mineral Soft Soak", "Hinoki Body Cleanser", "Rosewater Bath Milk", "Santal Shower Gel"],
  },
  {
    title: "Beauty Supplements",
    slug: "beauty-supplements",
    description: "Beauty-focused capsules and powders with clean shelf styling.",
    hue: "#dbe2d3",
    accent: "#6d8363",
    kind: "jar",
    brands: ["Inner Bloom", "Nutra Vale", "Glow Habit", "Forma Daily"],
    items: ["Skin Ritual Capsules", "Collagen Glow Powder", "Hair Root Complex", "Calm Sleep Beauty Blend", "Daily Dew Sachets", "Bright Biome Capsules", "Nail Strength Minis", "Hydra Mineral Drops", "Skin Reset Powder", "Marine Glow Softgels"],
  },
  {
    title: "Men's Grooming",
    slug: "mens-grooming",
    description: "Quiet grooming staples for beard, face, shave, and aftercare.",
    hue: "#d7d7d2",
    accent: "#40423f",
    kind: "groom",
    brands: ["North Vale", "Barber Field", "Moss & Flint", "Greywell"],
    items: ["Clean Shave Cream", "Cedar Beard Oil", "Daily Face Fuel", "Post Shave Balm", "Matte Clay Styler", "Mineral Deodorant Stick", "Scalp & Beard Wash", "Quiet Cologne Balm", "Texture Grooming Paste", "Black Tea Face Scrub"],
  },
];

const formats = ["30 ml", "50 ml", "75 ml", "100 ml", "120 ml", "150 ml", "200 ml", "250 ml", "30 capsules", "10 sachets"];
const textures = ["silky", "weightless", "cream-soft", "satin", "fresh", "balmy", "gel-light", "powder-fine", "mineral", "velvet"];

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[ch]);
}

function productShape(kind, color, accent, index, label) {
  const x = 300;
  const y = 130;
  if (kind === "tube") {
    return `
      <path d="M270 126h120l-16 438H286z" fill="${color}" stroke="#222" stroke-width="3"/>
      <path d="M292 146h76l-10 392h-56z" fill="rgba(255,255,255,.42)"/>
      <rect x="284" y="558" width="92" height="34" rx="9" fill="${accent}"/>
      <text x="330" y="334" text-anchor="middle" transform="rotate(-90 330 334)" font-family="Arial" font-size="28" font-weight="700" fill="#191715">${esc(label)}</text>`;
  }
  if (kind === "dropper") {
    return `
      <rect x="304" y="84" width="52" height="88" rx="23" fill="#1f1f1f"/>
      <rect x="286" y="150" width="88" height="58" rx="10" fill="${accent}"/>
      <rect x="270" y="202" width="120" height="360" rx="28" fill="${color}" stroke="#222" stroke-width="3"/>
      <rect x="296" y="248" width="68" height="188" rx="4" fill="rgba(255,255,255,.72)"/>
      <text x="330" y="338" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#24201d">${esc(label)}</text>`;
  }
  if (kind === "jar") {
    return `
      <ellipse cx="330" cy="268" rx="116" ry="30" fill="${accent}"/>
      <rect x="216" y="268" width="228" height="64" rx="18" fill="${accent}"/>
      <rect x="230" y="322" width="200" height="190" rx="46" fill="${color}" stroke="#222" stroke-width="3"/>
      <ellipse cx="330" cy="322" rx="100" ry="24" fill="rgba(255,255,255,.45)"/>
      <rect x="272" y="378" width="116" height="72" rx="8" fill="rgba(255,255,255,.72)"/>
      <text x="330" y="422" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#24201d">${esc(label)}</text>`;
  }
  if (kind === "pump" || kind === "groom") {
    return `
      <rect x="304" y="98" width="54" height="80" rx="13" fill="${kind === "groom" ? "#111" : accent}"/>
      <path d="M330 100h104v30h-76" fill="none" stroke="${kind === "groom" ? "#111" : accent}" stroke-width="22" stroke-linecap="round"/>
      <rect x="242" y="174" width="176" height="386" rx="38" fill="${color}" stroke="#222" stroke-width="3"/>
      <rect x="278" y="252" width="104" height="164" rx="6" fill="rgba(255,255,255,.74)"/>
      <text x="330" y="334" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#24201d">${esc(label)}</text>`;
  }
  return `
    <rect x="274" y="116" width="112" height="446" rx="44" fill="${color}" stroke="#222" stroke-width="3"/>
    <rect x="292" y="82" width="76" height="70" rx="14" fill="${accent}"/>
    <rect x="292" y="244" width="76" height="154" rx="6" fill="rgba(255,255,255,.68)"/>
    <text x="330" y="328" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#24201d">${esc(label)}</text>`;
}

function productSvg(category, index, product) {
  const label = product.brand.split(" ")[0].toUpperCase();
  const shadow = `<ellipse cx="330" cy="612" rx="${132 + (index % 3) * 9}" ry="22" fill="rgba(0,0,0,.13)"/>`;
  const decor = `
    <circle cx="${130 + (index % 4) * 22}" cy="${154 + (index % 5) * 14}" r="${8 + (index % 3) * 3}" fill="${category.hue}" opacity=".55"/>
    <path d="M482 ${154 + index * 3}c34 28 50 58 38 86-26-22-54-34-84-36 10-22 26-38 46-50z" fill="${category.accent}" opacity=".16"/>
    <path d="M152 ${504 - index * 2}c36-18 72-18 108 0-32 18-68 22-108 0z" fill="${category.accent}" opacity=".2"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 660 700">
    <title>${esc(product.title)}</title>
    <rect width="660" height="700" fill="none"/>
    ${decor}
    ${shadow}
    ${productShape(category.kind, category.hue, category.accent, index, label)}
  </svg>`;
}

function categorySvg(category) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 640 640">
    <title>${esc(category.title)}</title>
    <rect width="640" height="640" fill="none"/>
    <circle cx="320" cy="320" r="286" fill="#f4f1eb"/>
    <circle cx="320" cy="320" r="246" fill="${category.hue}" opacity=".75"/>
    ${productShape(category.kind, "#ffffff", category.accent, 1, category.title.split(" ")[0].toUpperCase())}
  </svg>`;
}

await mkdir(outDir, { recursive: true });

const manifest = [];
for (const category of categories) {
  await writeFile(path.join(outDir, `${category.slug}-category.svg`), categorySvg(category), "utf8");

  const products = category.items.map((title, index) => {
    const price = Number((24 + index * 4.75 + (category.slug.length % 7) * 1.15).toFixed(2));
    const discount = index < 5 ? Number((price * 0.2).toFixed(2)) : 0;
    return {
      title,
      title_en: `${category.title} essential with a minimal transparent packshot`,
      brand: category.brands[index % category.brands.length],
      sku: `SK-${category.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}-${String(index + 1).padStart(2, "0")}`,
      price,
      discount,
      quantity: 80 + index * 7,
      unit: category.kind === "jar" ? "jar" : category.kind === "tube" ? "tube" : "bottle",
      size: formats[index % formats.length],
      texture: textures[index % textures.length],
      image: `${category.slug}-${String(index + 1).padStart(2, "0")}.svg`,
      description: `${title} by ${category.brands[index % category.brands.length]} is a fake editorial beauty product created for the Skino storefront. It has a minimal transparent packshot, a clean shelf presence, and a concise routine-focused description for a premium catalog feel.`,
    };
  });

  for (const [index, product] of products.entries()) {
    await writeFile(path.join(outDir, product.image), productSvg(category, index, product), "utf8");
  }

  manifest.push({
    title: category.title,
    slug: category.slug,
    description: category.description,
    icon: `${category.slug}-category.svg`,
    products,
  });
}

await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Generated ${manifest.length} categories and ${manifest.reduce((sum, category) => sum + category.products.length, 0)} products in ${outDir}`);
