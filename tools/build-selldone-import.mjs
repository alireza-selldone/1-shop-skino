import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const manifestPath = path.join(root, "storefront", "assets", "generated-products", "manifest.json");
const outPath = path.join(root, "storefront", "assets", "generated-products", "selldone-import.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const imageBase = "https://possession-purpose-coleman-max.trycloudflare.com/assets/generated-products";
const existingIds = {
  "SK-FRAGRANCE-WARDROBE-01": 702905,
  "SK-FRAGRANCE-WARDROBE-02": 702906,
  "SK-FRAGRANCE-WARDROBE-03": 702907,
};

const headers = [
  "Product ID",
  "Title",
  "Title En",
  "Type",
  "Price",
  "Currency",
  "Commission",
  "Discount",
  "Discount Start Date",
  "Discount End Date",
  "Status",
  "Quantity",
  "SKU",
  "MPN",
  "GTIN",
  "GPC",
  "Condition",
  "Brand",
  "Warranty",
  "Spec",
  "Spec Order",
  "Pros",
  "Cons",
  "Image",
  "Outputs",
  "Inputs",
  "Content Title",
  "Content Body (Html)",
  "Content Description",
  "Content Image",
  "Content FAQ",
  "Content Structure Data",
  "Category",
  "Lead Time",
  "Extra",
  "Image Contain",
  "Return Warranty",
  "Original",
  "Slug",
  "Images",
  "V_Color",
  "V_Style",
  "V_Volume",
  "V_Weight",
  "V_Pack",
  "V_Type",
];

const specsFor = (category, product) => ({
  Brand: product.brand,
  Category: category.title,
  Size: product.size,
  Texture: product.texture,
  "Pack style": "Minimal transparent packshot",
  "Tax class": "Flat 10% shop tax",
});

const bodyFor = (category, product) => {
  const discountLine = product.discount
    ? "Launch price includes 20% off."
    : "Standard catalog price.";
  const shortDescription = `${product.title} by ${product.brand} is a fictional ${category.title.toLowerCase()} item for Skino, styled with a minimal transparent packshot and clean premium shelf presence.`;
  return [
    `<p>${shortDescription}</p>`,
    `<ul>`,
    `<li>${product.brand}</li><li>${category.title}</li><li>${product.size}</li><li>${product.texture}</li><li>${discountLine}</li>`,
    `</ul>`,
  ].join("");
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const rows = [headers];

for (const category of manifest) {
  for (const product of category.products) {
    const image = `${imageBase}/${product.image}`;
    const spec = specsFor(category, product);
    rows.push([
      existingIds[product.sku] || "",
      product.title,
      product.title_en,
      "PHYSICAL",
      product.price,
      "USD",
      0,
      product.discount,
      "",
      "",
      "Open",
      product.quantity,
      product.sku,
      "",
      "",
      "Beauty & Personal Care",
      "new",
      product.brand,
      "30-day quality guarantee",
      JSON.stringify(spec),
      JSON.stringify(Object.keys(spec)),
      JSON.stringify(["Transparent minimal product image", "Fictional premium beauty positioning"]),
      JSON.stringify(["Demo catalog product", "Formula claims are fictional"]),
      image,
      "[]",
      "[]",
      product.title,
      bodyFor(category, product),
      `${product.title} by ${product.brand}: a fictional ${category.title.toLowerCase()} product with a transparent minimal packshot.`,
      image,
      "[]",
      "[]",
      category.title,
      0,
      JSON.stringify({ weight: 0.2, width: 7, length: 7, height: 15 }),
      true,
      true,
      true,
      slugify(product.title),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
  }
}

const payload = { endpoint_id: "api.imports.products.create", confirm: true, body: { dataset: rows, keep_image_urls: false } };
fs.writeFileSync(outPath, JSON.stringify(payload));
console.log(`Wrote ${rows.length - 1} product rows to ${outPath}`);
