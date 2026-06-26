const SHOP_HANDLE = "skino";
const SHOP_ID = "14261";
const SHOP_NAME = "Skino";
const SHOP_DOMAIN = "https://skino.myselldone.com";
const XAPI_BASE = "https://xapi.selldone.com";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/storefront/")) {
      return handleStorefrontApi(request, url);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleStorefrontApi(request, url) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: JSON_HEADERS });
  }

  const path = normalizePath(url.pathname);
  const method = request.method.toUpperCase();

  try {
    if (path === "/api/storefront/session" && method === "GET") {
      return jsonResponse({
        authenticated: false,
        user: null,
        loginUrl: "",
        login_url: "",
        source: "cloudflare_worker",
      });
    }

    if (path === "/api/storefront/products" && method === "GET") {
      return jsonResponse(await fetchProducts(url, request));
    }

    const productReviewsId = matchPath(path, /^\/api\/storefront\/products\/([^/]+)\/reviews$/);
    if (productReviewsId && method === "GET") {
      return jsonResponse(emptyProductReviewsPayload(productReviewsId));
    }

    if (productReviewsId) {
      return jsonResponse({ ok: false, error: "Please sign in before reviewing products." }, 401);
    }

    const productId = matchPath(path, /^\/api\/storefront\/products\/([^/]+)$/);
    if (productId && method === "GET") {
      return jsonResponse(await fetchProduct(productId, request));
    }

    if ((path === "/api/storefront/blogs" || path === "/api/storefront/blog") && method === "GET") {
      return jsonResponse(await fetchBlogs(url));
    }

    const blogId = matchPath(path, /^\/api\/storefront\/blogs?\/([^/]+)$/);
    if (blogId && method === "GET") {
      return jsonResponse(await fetchBlog(blogId));
    }

    if (path === "/api/storefront/shop/info" && method === "GET") {
      return jsonResponse(await fetchShopInfo());
    }

    const profileType = matchPath(path, /^\/api\/storefront\/profiles\/([^/]+)$/);
    if (profileType && method === "GET") {
      return jsonResponse(await fetchProfile(profileType));
    }

    if (path === "/api/storefront/basket" && method === "GET") {
      return jsonResponse({ ok: true, basket: { items: [] }, bill: null, source: "cloudflare_worker_guest_basket" });
    }

    if (path === "/api/storefront/newsletter" && method === "POST") {
      return jsonResponse({ ok: true, subscribed: true, source: "cloudflare_worker_newsletter_stub" });
    }

    return jsonResponse({ ok: false, error: "Storefront API route not found." }, 404);
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        status: error?.status || 502,
        error: error?.message || "Storefront request failed.",
        source: "cloudflare_worker_proxy",
      },
      error?.status || 502,
    );
  }
}

async function fetchProducts(url, request) {
  const endpoint = xapiUrl(`/shops/@${SHOP_HANDLE}/products/all`);
  endpoint.searchParams.set("dir", url.searchParams.get("dir") || "*");
  endpoint.searchParams.set("offset", url.searchParams.get("offset") || "0");
  endpoint.searchParams.set("limit", clamp(url.searchParams.get("limit"), 1, 1500, 200));
  endpoint.searchParams.set("with_total", "true");
  endpoint.searchParams.set("with_category", "true");
  endpoint.searchParams.set("products_only", "false");
  endpoint.searchParams.set("categories_only", "false");
  endpoint.searchParams.set("with_parent", "true");
  endpoint.searchParams.set("with_page", "true");
  endpoint.searchParams.set("available", url.searchParams.get("available") || "true");
  endpoint.searchParams.set("surrounded", "false");
  endpoint.searchParams.set("sort", url.searchParams.get("sort") || "newest");
  if (url.searchParams.get("search")) endpoint.searchParams.set("search", url.searchParams.get("search"));

  try {
    const payload = await requestXapi(endpoint);
    return decorateXapiPayload(payload, endpoint, "products");
  } catch (error) {
    if (error?.status && error.status < 500 && error.status !== 403) throw error;
    return fallbackCatalogPayload(request, endpoint, error);
  }
}

async function fetchProduct(productId, request) {
  const endpoint = xapiUrl(`/shops/@${SHOP_HANDLE}/products/${encodeURIComponent(productId)}/info`);
  try {
    const payload = await requestXapi(endpoint);
    return {
      ...decorateXapiPayload(payload, endpoint, "product"),
      product: firstValue(payload.product, payload.data?.product, payload.result?.product, payload.payload?.product, payload.data, payload.result, payload.payload, payload),
    };
  } catch (error) {
    if (error?.status && error.status < 500 && error.status !== 403) throw error;
    const fallback = fallbackProducts(request).find((product) => String(product.id) === String(productId));
    if (!fallback) throw error;
    return {
      ...fallbackCatalogPayload(request, endpoint, error),
      product: fallback,
      products: [fallback],
      items: [fallback],
      total: 1,
    };
  }
}

async function fetchBlogs(url) {
  const endpoint = xapiUrl(`/shops/@${SHOP_HANDLE}/blogs`);
  endpoint.searchParams.set("offset", url.searchParams.get("offset") || "0");
  endpoint.searchParams.set("limit", clamp(url.searchParams.get("limit"), 1, 100, 24));
  if (url.searchParams.get("category")) endpoint.searchParams.set("category", url.searchParams.get("category"));
  if (url.searchParams.get("search")) endpoint.searchParams.set("search", url.searchParams.get("search"));

  const payload = await requestXapi(endpoint);
  const blogs = firstArray(payload.blogs, payload.articles, payload.data?.blogs, payload.data?.articles, payload.result?.blogs, payload.result?.articles, payload.payload?.blogs, payload.items, payload.data, payload.result);
  return {
    ...payload,
    ok: true,
    source: "cloudflare_worker_xapi_blogs",
    blogs,
    articles: blogs,
    total: firstValue(payload.total, payload.data?.total, payload.result?.total, payload.count, blogs.length),
    xapi_endpoint: endpoint.toString(),
  };
}

async function fetchBlog(blogId) {
  const endpoint = xapiUrl(`/shops/@${SHOP_HANDLE}/blogs/${encodeURIComponent(blogId)}`);
  const payload = await requestXapi(endpoint);
  return {
    ...payload,
    ok: true,
    source: "cloudflare_worker_xapi_blog",
    blog: firstValue(payload.blog, payload.article, payload.data?.blog, payload.data?.article, payload.result?.blog, payload.result?.article, payload.payload?.blog, payload.data, payload.result, payload.payload, payload),
    xapi_endpoint: endpoint.toString(),
  };
}

async function fetchShopInfo() {
  const endpoint = xapiUrl(`/shops/@${SHOP_HANDLE}/info`);
  const payload = await requestXapi(endpoint);
  return {
    ...payload,
    ok: true,
    source: "cloudflare_worker_xapi_shop",
    shop: firstValue(payload.shop, payload.data?.shop, payload.result?.shop, payload.payload?.shop, payload.data, payload.result, payload.payload, payload),
    xapi_endpoint: endpoint.toString(),
  };
}

async function fetchProfile(type) {
  const endpoint = xapiUrl(`/shops/@${SHOP_HANDLE}/profiles/${encodeURIComponent(type)}`);
  const payload = await requestXapi(endpoint);
  return {
    ...payload,
    ok: true,
    source: "cloudflare_worker_xapi_profile",
    profile: firstValue(payload.profile, payload.data?.profile, payload.result?.profile, payload.payload?.profile, payload.data, payload.result, payload.payload, payload),
    xapi_endpoint: endpoint.toString(),
  };
}

async function requestXapi(endpoint, options = {}) {
  const response = await fetch(endpoint.toString(), {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throw statusError(readApiMessage(payload) || `Selldone XAPI request failed (${response.status}).`, response.status);
  }
  return payload;
}

async function readResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    message: text.replace(/\s+/g, " ").trim().slice(0, 300),
  };
}

function decorateXapiPayload(payload, endpoint, source) {
  const products = firstArray(
    payload.products,
    payload.items,
    payload.data?.products,
    payload.data?.items,
    payload.result?.products,
    payload.result?.items,
    payload.payload?.products,
    payload.data,
    payload.result,
  );
  const categories = firstArray(
    payload.categories,
    payload.folders,
    payload.data?.categories,
    payload.data?.folders,
    payload.result?.categories,
    payload.result?.folders,
    payload.payload?.categories,
  );

  return {
    ...payload,
    ok: true,
    source: `cloudflare_worker_xapi_${source}`,
    shop_id: SHOP_ID,
    shop_name: SHOP_NAME,
    shop_domain: SHOP_DOMAIN,
    products,
    items: products,
    categories,
    folders: categories,
    total: firstValue(payload.total, payload.data?.total, payload.result?.total, payload.count, products.length),
    xapi_endpoint: endpoint.toString(),
  };
}

function emptyProductReviewsPayload(productId) {
  return {
    ok: true,
    product_id: String(productId || ""),
    comments: [],
    reviews: [],
    ratings: [],
    source: "cloudflare_worker_empty_reviews",
  };
}

function fallbackCatalogPayload(request, endpoint, error) {
  const products = fallbackProducts(request);
  const categories = fallbackCategories(request);
  return {
    ok: true,
    source: "cloudflare_worker_fallback_catalog",
    upstream_error: error?.message || "",
    upstream_status: error?.status || 0,
    shop_id: SHOP_ID,
    shop_name: SHOP_NAME,
    shop_domain: SHOP_DOMAIN,
    products,
    items: products,
    categories,
    folders: categories,
    total: products.length,
    xapi_endpoint: endpoint.toString(),
  };
}

function fallbackCategories(request) {
  return [
    { id: "skincare", slug: "skincare", title: "Skincare", name: "Skincare", image: assetUrl(request, "shop-hero-fresh.png") },
    { id: "makeup", slug: "makeup", title: "Makeup", name: "Makeup", image: assetUrl(request, "shop-face-summer.png") },
    { id: "fragrance", slug: "fragrance", title: "Fragrance", name: "Fragrance", image: assetUrl(request, "home-magazine-pride.png") },
    { id: "body-care", slug: "body-care", title: "Body Care", name: "Body Care", image: assetUrl(request, "shop-beauty-assembled.png") },
    { id: "gifts", slug: "gifts", title: "Gifts", name: "Gifts", image: assetUrl(request, "shop-gifts-glow.png") },
    { id: "hair-care", slug: "hair-care", title: "Hair Care", name: "Hair Care", image: assetUrl(request, "home-magazine-community.png") },
  ];
}

function fallbackProducts(request) {
  const categories = fallbackCategories(request);
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const images = [
    "shop-hero-fresh.png",
    "shop-face-summer.png",
    "shop-gifts-glow.png",
    "shop-glossy-lips.png",
    "shop-beauty-assembled.png",
    "product-sheet.png",
    "home-magazine-pride.png",
    "home-magazine-muse.png",
    "home-magazine-community.png",
    "home-magazine-gift-card.png",
  ];
  const rows = [
    ["skino-fallback-001", "Vela Cloud Moisture Cream", "Velaire Lab", "skincare", 48, 60, 20],
    ["skino-fallback-002", "Aure Mist Barrier Serum", "Aure Studio", "skincare", 56, 70, 20],
    ["skino-fallback-003", "Lumi Soft Gel Cleanser", "Lumiere Haus", "skincare", 29, 0, 0],
    ["skino-fallback-004", "Nera Satin Lip Veil", "Nera Color", "makeup", 24, 30, 20],
    ["skino-fallback-005", "Rosa Skin Tint Drops", "Rosa Edit", "makeup", 38, 0, 0],
    ["skino-fallback-006", "Mira Cream Blush Wand", "Mira Beauty", "makeup", 27, 34, 20],
    ["skino-fallback-007", "Maison Solaire Eau de Peau", "Maison Solaire", "fragrance", 82, 0, 0],
    ["skino-fallback-008", "Amber Leaf Body Oil", "Amber Leaf", "body-care", 44, 55, 20],
    ["skino-fallback-009", "Coco Silk Body Balm", "Coco & Silk", "body-care", 36, 0, 0],
    ["skino-fallback-010", "Gloss Ritual Discovery Set", "Skino Edit", "gifts", 64, 80, 20],
    ["skino-fallback-011", "Botanic Hair Gloss Milk", "Botanic Room", "hair-care", 32, 0, 0],
    ["skino-fallback-012", "Gold Veil Night Mask", "Or Atelier", "skincare", 52, 65, 20],
  ];

  return rows.map(([id, title, brand, categorySlug, price, original, discount], index) => ({
    id,
    product_id: id,
    shop_id: SHOP_ID,
    title,
    name: title,
    brand,
    brand_name: brand,
    category: categoryBySlug.get(categorySlug),
    category_id: categorySlug,
    price,
    final_price: price,
    regular_price: original || price,
    currency: "USD",
    discount,
    tax_rate: 10,
    quantity: 24 + index,
    status: "Open",
    image: assetUrl(request, images[index % images.length]),
    images: [assetUrl(request, images[index % images.length])],
    rate: 4.4 + ((index % 5) * 0.1),
    rate_count: 18 + index * 3,
    sku: `SKINO-${String(index + 1).padStart(3, "0")}`,
    type: "PHYSICAL",
    description: `${title} is a polished Skino beauty pick with a clean feel, premium presentation, and a simple routine-friendly finish.`,
    overview: "Created for a refined daily beauty routine with soft textures, easy layering, and modern shelf appeal.",
    specs: {
      Brand: brand,
      Category: categoryBySlug.get(categorySlug)?.title || categorySlug,
      "Tax Rate": "10%",
      "Product Type": "Physical beauty product",
      "Routine Step": index % 2 ? "Daily finish" : "Base routine",
    },
  }));
}

function assetUrl(request, filename) {
  return new URL(`/assets/${filename}`, request.url).toString();
}

function xapiUrl(path) {
  return new URL(`${XAPI_BASE}${path}`);
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

function normalizePath(pathname) {
  const clean = String(pathname || "/").replace(/\/{2,}/g, "/");
  return clean.length > 1 ? clean.replace(/\/$/, "") : clean;
}

function matchPath(path, pattern) {
  const match = path.match(pattern);
  return match ? decodeURIComponent(match[1] || "") : "";
}

function clamp(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return String(fallback);
  return String(Math.min(max, Math.max(min, parsed)));
}

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.data)) return value.data;
  }
  return [];
}

function readApiMessage(payload) {
  if (!payload || typeof payload !== "object") return "";
  return String(
    firstValue(
      payload.message,
      payload.error,
      payload.error_description,
      payload.data?.message,
      payload.result?.message,
      payload.payload?.message,
      "",
    ) || "",
  );
}

function statusError(message, status = 502) {
  const error = new Error(message);
  error.status = status;
  return error;
}
