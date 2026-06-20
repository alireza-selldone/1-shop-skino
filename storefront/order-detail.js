function valueIsObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function firstDateValue(order = {}) {
  return order.created_at || order.createdAt || order.reserved_at || order.payed_at || order.updated_at || order.date || "";
}

function formatOrderDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function scalarValue(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function normalizeSelldoneImageUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalizeCdnPath = (path) => {
    const match = path.match(/^(.*?)shops_(\d+)_(products|categories|blogs|avatars)_(.+)$/i);
    if (match) return `${match[1]}shops/${match[2]}/${match[3]}/${match[4]}`;
    return path;
  };
  if (/^https?:\/\//i.test(raw)) return normalizeCdnPath(raw);
  const path = raw.replace(/^\/+/, "");
  if (path.startsWith("app/")) return `https://cdn.selldone.com/${normalizeCdnPath(path)}`;
  if (path.startsWith("shops_")) return `https://cdn.selldone.com/app/${normalizeCdnPath(path)}`;
  if (path.startsWith("shops/")) return `https://cdn.selldone.com/app/${path}`;
  return `https://cdn.selldone.com/app/${normalizeCdnPath(path)}`;
}

function imageFromList(value, firstArrayValue, firstNonNull) {
  const list = firstArrayValue(value);
  for (const entry of list) {
    if (typeof entry === "string" && entry.trim()) return entry.trim();
    if (valueIsObject(entry)) {
      const found = firstNonNull(entry.url, entry.src, entry.path, entry.image, entry.icon, "");
      if (found) return String(found).trim();
    }
  }
  return "";
}

function orderFromPayload(payload = {}, firstNonNull) {
  const order = firstNonNull(
    payload?.basket,
    payload?.order,
    payload?.data?.basket,
    payload?.data?.order,
    payload?.result?.basket,
    payload?.result?.order,
    payload?.payload?.basket,
    payload?.payload?.order,
    payload?.data,
    payload?.result,
    payload?.payload,
    payload,
  );
  return valueIsObject(order) ? order : {};
}

function normalizeOrderItems(order = {}, firstArrayValue) {
  return firstArrayValue(
    order.items,
    order.basket_items,
    order.lines,
    order.products,
    order.order_items,
    order.data?.items,
    order.bill?.items,
  );
}

function itemProductId(item = {}, firstNonNull) {
  const product = valueIsObject(item.product) ? item.product : {};
  return String(firstNonNull(item.product_id, item.productId, item.product?.id, product.id, product.product_id, "") || "").trim();
}

function itemQuantity(item = {}, firstNonNull) {
  const qty = Number(firstNonNull(item.count, item.quantity, item.qty, item.num, 1));
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function itemProductHref(item = {}, firstNonNull) {
  const id = itemProductId(item, firstNonNull);
  return id ? `#product/${encodeURIComponent(id)}` : "#account/orders";
}

function productFromPayload(payload = {}, firstNonNull) {
  const product = firstNonNull(
    payload?.product,
    payload?.item,
    payload?.data?.product,
    payload?.data?.item,
    payload?.result?.product,
    payload?.result?.item,
    payload?.payload?.product,
    payload?.payload?.item,
    payload?.data,
    payload?.result,
    payload?.payload,
    payload,
  );
  return valueIsObject(product) ? product : {};
}

function productTitleFromProduct(product = {}, firstNonNull) {
  return String(firstNonNull(product.title, product.name, product.product_title, product.productTitle, "Product") || "Product").trim();
}

function productImageFromProduct(product = {}, firstArrayValue, firstNonNull) {
  const raw = firstNonNull(
    product.image,
    product.image_url,
    product.imageUrl,
    product.photo,
    product.icon,
    product.thumbnail,
    imageFromList(product.images, firstArrayValue, firstNonNull),
    imageFromList(product.gallery, firstArrayValue, firstNonNull),
    "",
  );
  return normalizeSelldoneImageUrl(raw);
}

async function fetchProductCards(items = [], deps) {
  const { firstArrayValue, firstNonNull } = deps;
  const ids = [...new Set(items.map((item) => itemProductId(item, firstNonNull)).filter(Boolean))].slice(0, 60);
  if (!ids.length) return new Map();

  const settled = await Promise.allSettled(ids.map(async (id) => {
    const response = await fetch(`/api/storefront/products/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) return [id, null];
    const product = productFromPayload(payload, firstNonNull);
    return [
      id,
      {
        image: productImageFromProduct(product, firstArrayValue, firstNonNull),
        title: productTitleFromProduct(product, firstNonNull),
      },
    ];
  }));

  const cards = new Map();
  settled.forEach((entry) => {
    if (entry.status !== "fulfilled" || !entry.value?.[0] || !entry.value?.[1]) return;
    cards.set(entry.value[0], entry.value[1]);
  });
  return cards;
}

function orderIdentifier(order = {}, firstNonNull) {
  return String(firstNonNull(order.code, order.order_code, order.orderCode, order.id, order.basket_id, order.basketId, "") || "").trim();
}

function orderStatus(order = {}, firstNonNull) {
  return String(firstNonNull(order.status, order.delivery_state, order.payment_status, order.state, order.order_state, order.reserved ? "Reserved" : "", "Processing") || "Processing").trim();
}

function orderStatusTone(status = "") {
  const normalized = String(status || "").toLowerCase();
  if (/(complete|deliver|fulfilled|paid|accept|sent|done|success)/.test(normalized)) return "success";
  if (/(cancel|reject|fail|refund|void|expired)/.test(normalized)) return "danger";
  if (/(pending|wait|reserv|process|review|hold)/.test(normalized)) return "warning";
  return "neutral";
}

function orderStatusStepIndex(status = "") {
  const normalized = String(status || "").toLowerCase();
  if (/(deliver|complete|fulfilled|done|success)/.test(normalized)) return 4;
  if (/(ship|sent|transport)/.test(normalized)) return 3;
  if (/(pack|prepare|prepar|accept)/.test(normalized)) return 2;
  if (/(paid|payment|pay)/.test(normalized)) return 1;
  return 0;
}

function renderOrderStatusVisual(status = "", tone = "", escapeHtml) {
  const steps = ["Placed", "Paid", "Packed", "Shipped", "Delivered"];
  const activeIndex = orderStatusStepIndex(status);
  const progress = Math.max(0, Math.min(100, (activeIndex / (steps.length - 1)) * 100));
  const danger = tone === "danger";
  return `
    <div class="account-order-status-visual account-order-status-visual--${escapeHtml(tone)}" style="--order-progress:${progress}%">
      <div class="account-order-status-line" aria-hidden="true"><span></span></div>
      <div class="account-order-steps" aria-label="Order status progress">
        ${steps
          .map((step, index) => {
            const complete = !danger && index <= activeIndex;
            const current = !danger && index === activeIndex;
            return `<span class="account-order-step ${complete ? "is-complete" : ""} ${current ? "is-current" : ""} ${danger && index === 0 ? "is-danger" : ""}"><i aria-hidden="true"></i><small>${escapeHtml(step)}</small></span>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function pickNumeric(source = {}, keys = []) {
  for (const key of keys) {
    const value = source?.[key];
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return NaN;
}

function orderCurrency(order = {}, firstNonNull) {
  return String(firstNonNull(order.currency, order.currency_code, order.bill?.currency, order.payment?.currency, "USD") || "USD").trim();
}

function orderTotal(order = {}) {
  return pickNumeric(order, ["final_total", "grand_total", "total", "payable", "payment_amount", "pay_amount", "amount", "price", "sum"]);
}

function renderFieldRows(rows = [], escapeHtml) {
  const visible = rows.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
  if (!visible.length) return `<p class="product-meta">No Selldone data was returned for this section.</p>`;
  return `
    <dl class="order-detail-fields">
      ${visible.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join("")}
    </dl>
  `;
}

function addressRows(order = {}, firstNonNull) {
  const receiver = valueIsObject(order.receiver_info) ? order.receiver_info : valueIsObject(order.receiverInfo) ? order.receiverInfo : {};
  const address = valueIsObject(order.address) ? order.address : valueIsObject(order.shipping_address) ? order.shipping_address : {};
  const source = { ...address, ...receiver };
  return [
    ["Name", firstNonNull(source.name, source.full_name, source.receiver, order.receiver_name, order.name, "")],
    ["Phone", firstNonNull(source.phone, source.phone_number, order.receiver_phone, order.phone, "")],
    ["Email", firstNonNull(source.email, order.receiver_email, order.email, "")],
    ["Address", firstNonNull(source.address, source.address_line, source.address1, source.street, order.receiver_address, order.address_text, "")],
    ["City", firstNonNull(source.city, order.city, "")],
    ["State", firstNonNull(source.state, source.province, order.state, "")],
    ["Country", firstNonNull(source.country, order.country, "")],
    ["Postal code", firstNonNull(source.postal, source.zip, source.zipcode, source.postal_code, order.postal, "")],
  ];
}

function paymentRows(order = {}, firstNonNull, formatPrice) {
  const currency = orderCurrency(order, firstNonNull);
  const total = orderTotal(order);
  return [
    ["Payment status", firstNonNull(order.payment_status, order.paymentStatus, order.pay_status, order.status_pay, "")],
    ["Gateway", firstNonNull(order.gateway, order.gateway_code, order.gatewayCode, order.payment?.gateway, order.payment?.gateway_code, "")],
    ["Currency", currency],
    ["Total", Number.isFinite(total) ? formatPrice(total, currency) : ""],
    ["Tax", Number.isFinite(Number(order.tax)) ? formatPrice(Number(order.tax), currency) : ""],
    ["Shipping", Number.isFinite(Number(order.shipping)) ? formatPrice(Number(order.shipping), currency) : ""],
    ["Discount", Number.isFinite(Number(order.discount)) ? formatPrice(Number(order.discount), currency) : ""],
  ];
}

function fulfillmentRows(order = {}, firstNonNull) {
  return [
    ["Delivery state", firstNonNull(order.delivery_state, order.deliveryState, order.delivery?.state, "")],
    ["Delivery service", firstNonNull(order.delivery_service, order.deliveryService, order.transportation, order.delivery?.service, "")],
    ["Tracking code", firstNonNull(order.tracking_code, order.trackingCode, order.delivery?.tracking_code, order.delivery?.trackingCode, "")],
    ["Reserved at", firstNonNull(order.reserved_at, order.reservedAt, "")],
    ["Paid at", firstNonNull(order.payed_at, order.paid_at, order.paidAt, "")],
    ["Updated at", firstNonNull(order.updated_at, order.updatedAt, "")],
  ];
}

function scalarRows(order = {}) {
  const blocked = new Set(["items", "basket_items", "products", "lines", "order_items", "bill", "address", "receiver_info", "receiverInfo", "payment", "delivery", "data"]);
  return Object.entries(order)
    .filter(([key, value]) => !blocked.has(key) && scalarValue(value))
    .slice(0, 18)
    .map(([key, value]) => [key.replace(/_/g, " "), value]);
}

function shopSupportEmail(state = {}, order = {}, firstNonNull) {
  const shop = valueIsObject(state.storefrontShopInfo?.shop) ? state.storefrontShopInfo.shop : state.storefrontShopInfo || {};
  return String(firstNonNull(order.support_email, shop.support_email, shop.email, shop.info?.email, "") || "").trim();
}

function chatHref(state = {}, order = {}, firstNonNull) {
  const shop = valueIsObject(state.storefrontShopInfo?.shop) ? state.storefrontShopInfo.shop : state.storefrontShopInfo || {};
  const direct = firstNonNull(order.chat_url, order.chatUrl, order.support_chat_url, order.supportChatUrl, shop.chat_url, shop.chatUrl, shop.support_chat_url, shop.supportChatUrl, "");
  if (direct) return String(direct);
  const email = shopSupportEmail(state, order, firstNonNull);
  return email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Order ${orderIdentifier(order, firstNonNull)} support`)}` : "#contact";
}

function addressChangeHref(state = {}, order = {}, firstNonNull) {
  const direct = firstNonNull(order.change_address_url, order.changeAddressUrl, order.address_change_url, order.addressChangeUrl, "");
  if (direct) return String(direct);
  const email = shopSupportEmail(state, order, firstNonNull);
  return email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Change address for order ${orderIdentifier(order, firstNonNull)}`)}`
    : "#account/profile";
}

function renderProducts(items = [], productCards = new Map(), deps) {
  const { escapeHtml, firstNonNull } = deps;
  if (!items.length) return `<div class="account-order-items-empty">No product items were returned by Selldone for this order.</div>`;
  return `
    <div class="order-detail-products">
      ${items.map((item) => {
        const productId = itemProductId(item, firstNonNull);
        const product = productCards.get(productId) || {};
        const title = product.title || "Product";
        const image = product.image || "";
        const quantity = itemQuantity(item, firstNonNull);
        const href = itemProductHref(item, firstNonNull);
        return `
          <a class="order-detail-product" href="${escapeHtml(href)}">
            <span>${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" />` : `<i aria-hidden="true"></i>`}</span>
            <strong>${escapeHtml(title)}</strong>
            <b>${escapeHtml(`x${quantity}`)}</b>
          </a>
        `;
      }).join("")}
    </div>
  `;
}

export async function renderOrderDetailPage(deps) {
  const { orderId, state, els, escapeHtml, firstArrayValue, firstNonNull, formatPrice, showToast } = deps;
  const safeOrderId = String(orderId || "").trim();

  els.app.innerHTML = `
    <div class="page-shell">
      <nav class="breadcrumbs" aria-label="Order path">
        <a href="#home">Home</a><span>/</span><a href="#account/orders">Orders</a><span>/</span><strong>Details</strong>
      </nav>
      <section class="section">
        <div class="account-profile-panel">
          <div class="account-order-history-empty">
            <strong>Loading order details...</strong>
            <p>Selldone is returning the complete physical basket information.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  try {
    const response = await fetch(`/api/storefront/orders/${encodeURIComponent(safeOrderId)}`, {
      headers: { Accept: "application/json" },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || "Could not load order details.");
    }

    const order = orderFromPayload(payload, firstNonNull);
    const items = normalizeOrderItems(order, firstArrayValue);
    const productCards = await fetchProductCards(items, { firstArrayValue, firstNonNull });
    const displayId = orderIdentifier(order, firstNonNull) || safeOrderId;
    const status = orderStatus(order, firstNonNull);
    const tone = orderStatusTone(status);
    const currency = orderCurrency(order, firstNonNull);
    const total = orderTotal(order);
    const totalLabel = Number.isFinite(total) ? formatPrice(total, currency) : "Unavailable";
    const supportUrl = chatHref(state, order, firstNonNull);
    const addressUrl = addressChangeHref(state, order, firstNonNull);

    els.app.innerHTML = `
      <div class="page-shell">
        <nav class="breadcrumbs" aria-label="Order path">
          <a href="#home">Home</a><span>/</span><a href="#account/orders">Orders</a><span>/</span><strong>${escapeHtml(displayId)}</strong>
        </nav>
        <section class="section">
          <div class="order-detail-shell">
            <div class="order-detail-hero">
              <div>
                <span class="account-order-eyebrow">Physical order detail</span>
                <h1>Order ${escapeHtml(displayId)}</h1>
                <p>Complete order information loaded from Selldone.</p>
              </div>
              <div class="order-detail-actions">
                <a class="black-button" href="${escapeHtml(supportUrl)}">Chat with store</a>
                <a class="text-link" href="${escapeHtml(addressUrl)}">Change address</a>
              </div>
            </div>

            <div class="order-detail-grid">
              <article class="order-detail-card order-detail-card--wide">
                <div class="order-detail-card-head">
                  <div>
                    <h2>Status</h2>
                    <p>${escapeHtml(formatOrderDate(firstDateValue(order)))}</p>
                  </div>
                  <span class="account-order-status account-order-status--${escapeHtml(tone)}">${escapeHtml(status)}</span>
                </div>
                ${renderOrderStatusVisual(status, tone, escapeHtml)}
              </article>

              <article class="order-detail-card">
                <h2>Summary</h2>
                ${renderFieldRows([
                  ["Order", displayId],
                  ["Total", totalLabel],
                  ["Items", items.length],
                  ["Type", firstNonNull(order.type, order.basket_type, "Physical")],
                ], escapeHtml)}
              </article>

              <article class="order-detail-card order-detail-card--wide">
                <h2>Products</h2>
                ${renderProducts(items, productCards, { escapeHtml, firstNonNull })}
              </article>

              <article class="order-detail-card">
                <h2>Delivery address</h2>
                ${renderFieldRows(addressRows(order, firstNonNull), escapeHtml)}
              </article>

              <article class="order-detail-card">
                <h2>Payment</h2>
                ${renderFieldRows(paymentRows(order, firstNonNull, formatPrice), escapeHtml)}
              </article>

              <article class="order-detail-card">
                <h2>Fulfillment</h2>
                ${renderFieldRows(fulfillmentRows(order, firstNonNull), escapeHtml)}
              </article>

              <article class="order-detail-card order-detail-card--wide">
                <h2>Selldone fields</h2>
                ${renderFieldRows(scalarRows(order), escapeHtml)}
              </article>
            </div>
          </div>
        </section>
      </div>
    `;
  } catch (error) {
    const message = error?.message || "Could not load order details.";
    showToast(message);
    els.app.innerHTML = `
      <div class="page-shell">
        <nav class="breadcrumbs" aria-label="Order path">
          <a href="#home">Home</a><span>/</span><a href="#account/orders">Orders</a><span>/</span><strong>Details</strong>
        </nav>
        <section class="section">
          <div class="account-profile-panel">
            <div class="account-order-history-empty">
              <strong>Could not load order details</strong>
              <p>${escapeHtml(message)}</p>
              <div class="account-profile-actions">
                <a class="black-button" href="#account/orders">Back to orders</a>
                <a class="text-link" href="#shop">Back to shop</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
