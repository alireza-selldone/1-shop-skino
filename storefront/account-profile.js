function profileCartQuantity(entry = {}, firstNonNull) {
  const source = entry?.item && typeof entry.item === "object" ? entry.item : entry;
  const qty = Number(firstNonNull(entry?.count, entry?.quantity, entry?.qty, source?.count, source?.quantity, source?.qty, 1));
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function profileCartProduct(entry = {}, firstNonNull) {
  const source = entry?.item && typeof entry.item === "object" ? entry.item : entry;
  const product = source?.product && typeof source.product === "object" ? source.product : {};
  const title = String(firstNonNull(entry?.title, source?.title, source?.name, source?.product_title, source?.productTitle, product.title, product.name, "Product") || "Product").trim();
  const productId = String(firstNonNull(entry?.product_id, entry?.productId, source?.product_id, source?.productId, product.id, "") || "").trim();
  return {
    href: productId ? `#product/${encodeURIComponent(productId)}` : "#cart",
    title,
    quantity: profileCartQuantity(entry, firstNonNull),
  };
}

function profileCartImage(entry = {}, firstNonNull) {
  const source = entry?.item && typeof entry.item === "object" ? entry.item : entry;
  const product = source?.product && typeof source.product === "object" ? source.product : {};
  const images = [
    entry?.image,
    entry?.photo,
    entry?.icon,
    source?.image,
    source?.photo,
    source?.icon,
    source?.thumbnail,
    product.image,
    product.photo,
    product.icon,
    product.thumbnail,
    Array.isArray(source?.images) ? source.images[0] : null,
    Array.isArray(product?.images) ? product.images[0] : null,
    Array.isArray(source?.gallery) ? source.gallery[0] : null,
    Array.isArray(product?.gallery) ? product.gallery[0] : null,
  ];
  const candidate = firstNonNull(...images);
  if (!candidate) return "";
  if (typeof candidate === "string") return candidate.trim();
  if (candidate && typeof candidate === "object") {
    return String(firstNonNull(candidate.url, candidate.src, candidate.path, candidate.image, candidate.photo, "") || "").trim();
  }
  return "";
}

function profileVariantValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return String(value.value || value.name || value.title || value.label || value.text || "").trim();
  }
  return String(value).trim();
}

function profileIsTechnicalColor(value) {
  const color = profileVariantValue(value);
  return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) || /^(rgba?|hsla?)\(/i.test(color);
}

function profileSafeSwatchColor(value) {
  const color = profileVariantValue(value);
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)) return color;
  if (/^[a-zA-Z]+$/.test(color)) return color;
  if (/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(color)) return color;
  return "";
}

function profileCartVariantEntries(entry = {}, firstNonNull) {
  const source = entry?.item && typeof entry.item === "object" ? entry.item : entry;
  const variant = entry?.variant && typeof entry.variant === "object" ? entry.variant : source?.variant && typeof source.variant === "object" ? source.variant : null;
  if (!variant) return [];

  const entries = [];
  const seen = new Set();
  const push = (label, value, key = label, swatchValue = "") => {
    let display = profileVariantValue(value);
    const swatch = key === "color" ? profileSafeSwatchColor(firstNonNull(swatchValue, value)) : "";
    if (key === "color" && profileIsTechnicalColor(display)) display = "";
    if (!label || (!display && !swatch)) return;
    const signature = `${key}:${display.toLowerCase()}:${swatch.toLowerCase()}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    entries.push({ label, display, swatch });
  };

  if (Array.isArray(variant.__options)) {
    variant.__options.forEach((option) => {
      const key = String(option?.key || option?.label || "").trim().toLowerCase();
      const label = option?.label || (key ? key[0].toUpperCase() + key.slice(1) : "Variant");
      const display = key === "color" ? firstNonNull(variant.color_name, variant.colour_name, option?.display) : option?.display;
      push(label, display, key, firstNonNull(option?.swatch, variant.__swatchColor, variant.hex, variant.color_code, variant.colour_code, variant.swatch_color, variant.color, variant.colour));
    });
  }

  push(
    "Color",
    firstNonNull(variant.color_name, variant.colour_name, variant.color_title, variant.colour_title, variant.color, variant.colour),
    "color",
    firstNonNull(variant.__swatchColor, variant.hex, variant.color_code, variant.colour_code, variant.swatch_color, variant.color, variant.colour),
  );
  push("Size", firstNonNull(variant.size, variant.size_name, variant.option_size), "size");
  push("Volume", firstNonNull(variant.volume, variant.volume_name, variant.capacity, variant.ml), "volume");
  push("Weight", firstNonNull(variant.weight, variant.weight_name, variant.g, variant.gr), "weight");
  push("Scent", firstNonNull(variant.scent, variant.fragrance, variant.perfume), "scent");
  push("Pack", firstNonNull(variant.pack, variant.package, variant.bundle), "pack");
  push("Style", firstNonNull(variant.style, variant.model), "style");

  if (!entries.length) {
    push("Variant", firstNonNull(variant.title, variant.name, variant.label, variant.option_name), "variant");
  }

  return entries;
}

function renderCartPreview(entries = [], escapeHtml, firstNonNull) {
  return entries.slice(0, 4).map((entry) => {
    const item = profileCartProduct(entry, firstNonNull);
    const image = profileCartImage(entry, firstNonNull);
    const variantEntries = profileCartVariantEntries(entry, firstNonNull);
    const variantMarkup = variantEntries.length
      ? `<span class="account-profile-cart-variant">${variantEntries.map((variant) => `<span class="account-profile-cart-variant-item">${variant.swatch ? `<span class="account-profile-cart-swatch" style="--variant-swatch:${escapeHtml(variant.swatch)}" aria-hidden="true"></span>` : ""}<span>${escapeHtml(variant.display ? `${variant.label}: ${variant.display}` : variant.label)}</span></span>`).join("")}</span>`
      : "";
    return `
      <a class="account-profile-cart-line" href="${escapeHtml(item.href)}">
        <span class="account-profile-cart-product">
          <span class="account-profile-cart-thumb" aria-hidden="true">
            ${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" />` : `<span>${escapeHtml(item.title.slice(0, 1).toUpperCase() || "P")}</span>`}
          </span>
          <span class="account-profile-cart-text">
            <span class="account-profile-cart-title">${escapeHtml(item.title)}</span>
            ${variantMarkup}
          </span>
        </span>
        <strong>${escapeHtml(`x${item.quantity}`)}</strong>
      </a>
    `;
  }).join("");
}

function cartTotalLabel(entries = [], deps) {
  const { formatOrderCurrency, cartTotalsSummary, formatOrderLineTotal, firstNonNull, formatPrice } = deps;
  if (!entries.length) return "";
  const currency = formatOrderCurrency(entries);
  const totals = cartTotalsSummary(entries);
  const totalValue = Number(firstNonNull(
    totals.total,
    totals.grandTotal,
    totals.finalTotal,
    totals.subtotal,
    formatOrderLineTotal(entries),
  ));
  return Number.isFinite(totalValue) ? formatPrice(totalValue, currency) : "";
}

export async function renderAccountProfileOverviewPage(deps) {
  const {
    state,
    els,
    hydrateStorefrontCart,
    cartEntries,
    formatOrderCurrency,
    cartTotalsSummary,
    formatOrderLineTotal,
    firstNonNull,
    formatPrice,
    escapeHtml,
    buildAccountLogoutUrl,
    userDisplayName,
    resolveUserAvatarUrl,
    userInitials,
  } = deps;

  const user = state.sessionUser || {};
  const name = userDisplayName(user) || "Selldone user";
  const email = user.email || "Not provided";
  const phone = user.phone || "Not provided";
  const username = user.username || "Not provided";
  const address = firstNonNull(user.address, "Not provided");
  const city = firstNonNull(user.city, "Not provided");
  const id = Number(user.id || 0);
  const avatar = resolveUserAvatarUrl(user, "big");

  await hydrateStorefrontCart(true);
  const profileCartEntries = cartEntries();
  const profileCartTotal = cartTotalLabel(profileCartEntries, {
    formatOrderCurrency,
    cartTotalsSummary,
    formatOrderLineTotal,
    firstNonNull,
    formatPrice,
  });
  const profileCartItemCount = profileCartEntries.reduce((sum, entry) => sum + profileCartQuantity(entry, firstNonNull), 0);
  const profileCartPreview = renderCartPreview(profileCartEntries, escapeHtml, firstNonNull);

  els.app.innerHTML = `
    <div class="page-shell">
      <nav class="breadcrumbs" aria-label="Account path">
        <a href="#home">Home</a><span>/</span><strong>Account</strong>
      </nav>
      <section class="section">
        <div class="account-profile-panel account-profile-panel--minimal">
          <div class="account-profile-hero">
            <div class="account-profile-head">
              <div class="account-menu-avatar account-menu-avatar--large" aria-hidden="true">
                ${avatar ? `<img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)} avatar" />` : `<span>${escapeHtml(userInitials(user))}</span>`}
              </div>
              <div>
                <span class="account-profile-kicker">Storefront account</span>
                <h1>${escapeHtml(name)}</h1>
                <p>Minimal profile overview for your current shopping session.</p>
              </div>
            </div>
            <div class="account-profile-actions account-profile-actions--top">
              <a class="text-link" href="#account/orders">Order history</a>
              <a class="black-button" href="${buildAccountLogoutUrl()}">Log out</a>
            </div>
          </div>

          <div class="account-profile-grid">
            <article class="account-profile-card">
              <div class="account-profile-card-head">
                <span>Profile</span>
                <a class="text-link" href="#account/profile">View</a>
              </div>
              <div class="account-profile-fields">
                <div class="account-profile-field"><span>Email</span><strong>${escapeHtml(email)}</strong></div>
                <div class="account-profile-field"><span>Phone</span><strong>${escapeHtml(phone)}</strong></div>
                <div class="account-profile-field"><span>Username</span><strong>${escapeHtml(username)}</strong></div>
                <div class="account-profile-field"><span>City</span><strong>${escapeHtml(city)}</strong></div>
                <div class="account-profile-field"><span>Address</span><strong>${escapeHtml(address)}</strong></div>
                <div class="account-profile-field"><span>Profile ID</span><strong>${id || "Not available"}</strong></div>
              </div>
            </article>

            <aside class="account-profile-side">
              <article class="account-profile-card account-profile-cart-card">
                <div class="account-profile-card-head">
                  <span>Current cart</span>
                  <a class="text-link" href="#cart">Open cart</a>
                </div>
                ${
                  profileCartEntries.length
                    ? `
                      <div class="account-profile-cart-summary">
                        <strong>${escapeHtml(String(profileCartItemCount))}</strong>
                        <span>${escapeHtml(profileCartItemCount === 1 ? "item in your cart" : "items in your cart")}</span>
                        ${profileCartTotal ? `<em>${escapeHtml(profileCartTotal)}</em>` : ""}
                      </div>
                      <div class="account-profile-cart-preview">
                        ${profileCartPreview}
                        ${profileCartEntries.length > 4 ? `<a class="account-profile-cart-line account-profile-cart-line--more" href="#cart"><span class="account-profile-cart-title">More items</span><strong>+${profileCartEntries.length - 4}</strong></a>` : ""}
                      </div>
                    `
                    : `
                      <div class="account-profile-empty">
                        <strong>Your cart is empty</strong>
                        <p>Start shopping and your current physical cart will appear here.</p>
                        <a class="black-button" href="#shop">Shop products</a>
                      </div>
                    `
                }
              </article>

              <article class="account-profile-card account-profile-shortcut-card">
                <div>
                  <span class="account-profile-kicker">Orders</span>
                  <h2>Order history</h2>
                  <p>Review your physical orders, details, delivery status, and support options.</p>
                </div>
                <a class="black-button" href="#account/orders">View orders</a>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </div>
  `;
}
