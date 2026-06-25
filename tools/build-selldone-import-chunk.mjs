import fs from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug) {
  throw new Error("Usage: node tools/build-selldone-import-chunk.mjs <category-slug>");
}

const root = path.resolve(".");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "storefront", "assets", "generated-products", "manifest.json"), "utf8"));
const category = manifest.find((item) => item.slug === slug);
if (!category) throw new Error(`Category not found: ${slug}`);

const imageBase = "https://possession-purpose-coleman-max.trycloudflare.com/assets/generated-products";
const existingIds = {
  "SK-FRAGRANCE-WARDROBE-01": 702905,
  "SK-FRAGRANCE-WARDROBE-02": 702906,
  "SK-FRAGRANCE-WARDROBE-03": 702907,
};

const headers = [
  "Product ID", "Title", "Title En", "Type", "Price", "Currency", "Commission", "Discount",
  "Discount Start Date", "Discount End Date", "Status", "Quantity", "SKU", "MPN", "GTIN",
  "GPC", "Condition", "Brand", "Warranty", "Spec", "Spec Order", "Pros", "Cons", "Image",
  "Outputs", "Inputs", "Content Title", "Content Body (Html)", "Content Description",
  "Content Image", "Content FAQ", "Content Structure Data", "Category", "Lead Time", "Extra",
  "Image Contain", "Return Warranty", "Original", "Slug", "Images", "V_Color", "V_Style",
  "V_Volume", "V_Weight", "V_Pack", "V_Type",
];

const slugify = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const rows = [headers];
for (const product of category.products) {
  const image = `${imageBase}/${product.image}`;
  const discounted = product.discount ? "20% launch discount." : "Standard catalog price.";
  const description = `${product.title} by ${product.brand}: fictional ${category.title.toLowerCase()} product with a transparent minimal packshot.`;
  const body = `<p>${description}</p><ul><li>${product.brand}</li><li>${category.title}</li><li>${product.size}</li><li>${product.texture}</li><li>${discounted}</li></ul>`;
  const spec = { Brand: product.brand, Size: product.size, Texture: product.texture };
  rows.push([
    existingIds[product.sku] || "", product.title, product.title_en, "PHYSICAL", product.price, "USD", 0, product.discount,
    "", "", "Open", product.quantity, product.sku, "", "", "Beauty & Personal Care", "new", product.brand,
    "30-day quality guarantee", JSON.stringify(spec), JSON.stringify(Object.keys(spec)),
    "[]", "[]",
    image, "[]", "[]", product.title, body, description, image, "[]", "[]", category.title, 0,
    JSON.stringify({ weight: 0.2, width: 7, length: 7, height: 15 }), true, true, true, slugify(product.title),
    "", "", "", "", "", "", "",
  ]);
}

process.stdout.write(JSON.stringify({ dataset: rows, keep_image_urls: false }));
