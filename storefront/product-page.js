import { renderProductCommentsSection } from "./product-comments.js?v=storefront-my-rating-prefill-aliases-20260621";
import { renderProductRatingSection } from "./product-rating.js?v=storefront-my-rating-prefill-aliases-20260621";

const favoriteStorageKey = "pajulina:favorites";

function productIsFavorite(productId = "") {
  try {
    const raw = window.localStorage?.getItem(favoriteStorageKey);
    const ids = JSON.parse(raw || "[]");
    return Array.isArray(ids) && ids.map(String).includes(String(productId));
  } catch {
    return false;
  }
}

function localEscapeHtml(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function firstObject(...values) {
  return values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};
}

function firstArray(...values) {
  return values.find((value) => Array.isArray(value)) || [];
}

function productArticleContent(item = {}, firstNonNull) {
  const article = firstObject(
    item.article,
    item.product_article,
    item.productArticle,
    item.article_data,
    item.articleData,
    item.article_pack?.article,
    item.articlePack?.article,
    item.blog,
    item.data?.article,
    item.payload?.article,
  );
  return String(firstNonNull(
    article.body_html,
    article.content_html,
    article.bodyHtml,
    article.contentHtml,
    article.article_body,
    article.articleBody,
    article.html,
    article.body,
    article.content,
    article.text,
    item.article_body_html,
    item.articleBodyHtml,
    item.article_body,
    item.articleBody,
    item.article_html,
    item.articleHtml,
    item.content_html,
    item.contentHtml,
    "",
  ) || "").trim();
}

function productArticleTitle(item = {}, firstNonNull) {
  const article = firstObject(
    item.article,
    item.product_article,
    item.productArticle,
    item.article_data,
    item.articleData,
    item.article_pack?.article,
    item.articlePack?.article,
    item.blog,
    item.data?.article,
    item.payload?.article,
  );
  return String(firstNonNull(article.title, article.name, item.article_title, item.articleTitle, "Product article") || "Product article").trim();
}

function sanitizeProductArticleHtml(rawHtml = "") {
  const source = String(rawHtml || "").trim();
  if (!source) return "";
  if (!source.includes("<")) {
    return source
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${localEscapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  const template = document.createElement("template");
  template.innerHTML = source;
  const allowedTags = new Set([
    "P",
    "BR",
    "STRONG",
    "B",
    "EM",
    "I",
    "U",
    "UL",
    "OL",
    "LI",
    "H2",
    "H3",
    "H4",
    "BLOCKQUOTE",
    "A",
    "IMG",
    "DIV",
    "FIGURE",
    "TABLE",
    "THEAD",
    "TBODY",
    "TR",
    "TH",
    "TD",
  ]);
  const allowedAttrs = {
    A: new Set(["href", "title", "target", "rel"]),
    IMG: new Set(["src", "alt", "title", "loading"]),
  };
  Array.from(template.content.querySelectorAll("*")).forEach((node) => {
    if (!node.parentNode) return;
    if (!allowedTags.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach((child) => fragment.appendChild(child));
      node.parentNode.replaceChild(fragment, node);
      return;
    }
    Array.from(node.attributes).forEach((attr) => {
      const allowed = allowedAttrs[node.tagName]?.has(attr.name);
      if (!allowed) node.removeAttribute(attr.name);
    });
    if (node.tagName === "A") {
      const href = String(node.getAttribute("href") || "").trim();
      if (/^(javascript|data):/i.test(href)) node.removeAttribute("href");
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
    if (node.tagName === "IMG") {
      const src = String(node.getAttribute("src") || "").trim();
      if (!src || /^(javascript|data):/i.test(src)) node.remove();
      else node.setAttribute("loading", "lazy");
    }
  });
  return template.innerHTML.trim();
}

function renderProductArticleSection(item = {}, firstNonNull, escapeHtml) {
  const content = sanitizeProductArticleHtml(productArticleContent(item, firstNonNull));
  if (!content) return "";
  return `
    <section class="product-article-section">
      <span class="product-meta">Article</span>
      <h2>${escapeHtml(productArticleTitle(item, firstNonNull))}</h2>
      <div class="product-article-content">${content}</div>
    </section>
  `;
}

function crossSellProductId(entry = {}, firstNonNull) {
  if (!entry || typeof entry !== "object") return String(entry || "").trim();
  return String(firstNonNull(
    entry.product_id,
    entry.productId,
    entry.id,
    entry.item_id,
    entry.itemId,
    entry.target_id,
    entry.targetId,
    entry.product?.id,
    entry.item?.id,
    "",
  ) || "").trim();
}

function crossSellDiscount(entry = {}, product = {}, toNumber) {
  return Math.max(
    0,
    toNumber(entry?.discount, 0),
    toNumber(entry?.percent, 0),
    toNumber(entry?.offer, 0),
    toNumber(entry?.off, 0),
    toNumber(product?.discount, 0),
  );
}

function productHasDiscount(product = {}, toNumber) {
  const price = toNumber(product.price, 0);
  const original = toNumber(product.original, 0);
  return toNumber(product.discount, 0) > 0 || (original > 0 && price > 0 && original > price);
}

function reviewDateLabel(rawDate = "") {
  const parsed = Date.parse(String(rawDate || "").trim());
  if (!Number.isFinite(parsed)) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(parsed));
  } catch {
    return "";
  }
}

function reviewStarsMarkup(rating = 0) {
  const safeRating = Math.max(0, Math.min(5, Number.parseInt(String(rating || 0), 10)));
  if (!Number.isFinite(safeRating) || safeRating <= 0) return "";
  const full = "★".repeat(safeRating);
  const empty = "☆".repeat(5 - safeRating);
  return `<span class="stars" aria-label="${safeRating} out of 5 stars">${full}${empty}</span>`;
}

function reviewRatingCriterionId(value = "", fallback = "") {
  return String(value || fallback || "")
    .trim()
    .replace(/[^a-z0-9_-]/gi, "-");
}

function reviewQualityLabel(value) {
  return (
    {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very good",
      5: "Excellent",
    }[Number(value)] || "Choose"
  );
}

function reviewPayloadHasContent(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some((entry) => reviewPayloadHasContent(entry));
  if (typeof value === "object") return Object.values(value).some((entry) => reviewPayloadHasContent(entry));
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return Boolean(value);
}

function selectedReviewRatingValue(selectedRatings, criterionId = "", label = "") {
  const keys = [criterionId, label].map((entry) => String(entry || "").trim()).filter(Boolean);
  if (!keys.length || !selectedRatings) return 0;
  if (Array.isArray(selectedRatings)) {
    const match = selectedRatings.find((entry) => {
      const entryKeys = [entry?.id, entry?.rating_id, entry?.ratingId, entry?.name, entry?.title, entry?.label]
        .map((part) => String(part || "").trim())
        .filter(Boolean);
      return entryKeys.some((entryKey) => keys.includes(entryKey));
    });
    const value = Number(match?.value ?? match?.rate ?? match?.rating ?? match?.score ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(5, Math.round(value))) : 0;
  }
  if (typeof selectedRatings === "object") {
    const value = Number(keys.map((key) => selectedRatings[key]).find((entry) => entry != null) ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.min(5, Math.round(value))) : 0;
  }
  return 0;
}

function renderReviewRatingCriteria(criteria = [], options = {}) {
  const { escapeHtml, formSafeId, disabled = false, selectedRatings = {} } = options;
  if (!criteria.length) {
    return `<p class="checkout-login-note">Rating criteria are not available for this product.</p>`;
  }

  return `
    <fieldset class="review-rating-field" ${disabled ? "disabled" : ""}>
      <legend>Product ratings</legend>
      <div class="review-criteria-list">
        ${criteria
          .map((criterion, index) => {
            const criterionId = String(criterion?.id || index + 1).trim();
            const safeCriterionId = reviewRatingCriterionId(criterionId, index + 1);
            const label = String(criterion?.name || `Rating ${index + 1}`).trim();
            const selectedValue = selectedReviewRatingValue(selectedRatings, criterionId, label);
            return `
              <div class="review-criterion ${disabled ? "is-disabled" : ""}" data-rating-criterion data-rating-criterion-id="${escapeHtml(criterionId)}">
                <span class="review-criterion-label">${escapeHtml(label)}</span>
                <div class="review-rating-meter" aria-live="polite">
                  <span data-rating-quality>${disabled ? "Locked" : selectedValue ? escapeHtml(reviewQualityLabel(selectedValue)) : "Choose"}</span>
                  <b><i data-rating-progress style="--rating-progress: ${selectedValue ? selectedValue * 20 : 0}%"></i></b>
                </div>
                <div class="review-rating-scale" aria-label="${escapeHtml(label)} rating">
                  ${[1, 2, 3, 4, 5]
                    .map((value) => {
                      const inputId = `review-rating-${formSafeId}-${safeCriterionId}-${value}`;
                      return `
                        <label class="review-rating-choice" for="${escapeHtml(inputId)}">
                          <input
                            id="${escapeHtml(inputId)}"
                            name="rating_${escapeHtml(safeCriterionId)}"
                            type="radio"
                            value="${value}"
                            data-rating-input
                            data-rating-criterion-id="${escapeHtml(criterionId)}"
                            ${disabled ? "disabled" : ""}
                            ${selectedValue === value ? "checked" : ""}
                          />
                          <span><strong>${value}</strong><small>${escapeHtml(reviewQualityLabel(value))}</small></span>
                        </label>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </fieldset>
  `;
}

export async function renderProductPage(deps) {
  const {
    productId,
    state,
    DATA_SOURCE,
    els,
    getProductById,
    fetchXapiProductDetail,
    ensureProductsForPage,
    productNeedsStorefrontDetail,
    renderLiveCatalogEmptyState,
    ensureShopTransportationsLoaded,
    firstNonNull,
    transportSelectionKey,
    transportationSelectionExists,
    renderDeliveryCards,
    activeProductVariant,
    resolveVariantPrice,
    toNumber,
    resolveVariantOriginalPrice,
    normalizeGallery,
    renderVariantSection,
    getProductsForUi,
    escapeHtml,
    titleCase,
    renderProductImage,
    formatPrice,
    renderProductProsAccordion,
    miniProduct,
    routineStep,
    renderProductSection,
    reviewBar,
  } = deps;

  const id = String(productId || "").trim() || String(state.activeProductId || "").trim();
  const cachedProduct = id ? getProductById(id) : null;
  let item = cachedProduct;

  if (state.dataSource === DATA_SOURCE.xapi && id) {
    const needsDetail =
      !cachedProduct ||
      !Array.isArray(cachedProduct.images) ||
      cachedProduct.images.length <= 1 ||
      productNeedsStorefrontDetail(cachedProduct);
    if (needsDetail) {
      const detail = await fetchXapiProductDetail(id);
      if (detail) item = detail;
    }
  }

  if (!item) {
    item = state.dataSource === DATA_SOURCE.xapi ? await fetchXapiProductDetail(id) : null;
  }

  if (!item && typeof ensureProductsForPage === "function") {
    await ensureProductsForPage().catch(() => null);
    item = id ? getProductById(id) : null;
  }

  if (!item) {
    renderLiveCatalogEmptyState("Product is not available from Selldone XAPI", `Product ID ${id || "unknown"} was not returned by the live storefront API.`);
    return;
  }

  state.activeProductId = item.id;
  const transportations = await ensureShopTransportationsLoaded();
  const productTransportSelection = firstNonNull(state.activeProductShippingSelection[item.id], transportSelectionKey(transportations?.[0], "shipping"));
  if (productTransportSelection && !transportationSelectionExists(transportations, productTransportSelection)) {
    state.activeProductShippingSelection[item.id] = "";
  }
  state.activeProductShippingSelection[item.id] =
    state.activeProductShippingSelection[item.id] || (transportations.length ? transportSelectionKey(transportations[0], "shipping") : "shipping-default");
  const deliveryCards = renderDeliveryCards(transportations, {
    selectedKey: state.activeProductShippingSelection[item.id],
    productId: item.id,
    context: "product",
  });

  const selectedVariant = activeProductVariant(item);
  const itemPrice = resolveVariantPrice(selectedVariant, toNumber(item.price, 0));
  const itemOriginal = resolveVariantOriginalPrice(selectedVariant, itemPrice, toNumber(item.original, 0));
  const addButtonVariantKey = firstNonNull(
    selectedVariant?.__key,
    selectedVariant?.__index,
    selectedVariant?.id,
    selectedVariant?.variant_id,
    selectedVariant?.sku,
    selectedVariant?.code,
  ) || "";
  const itemRating = toNumber(item.rating, 0);
  const itemReviews = toNumber(item.reviews, 0);
  const category = item.category || "misc";
  const subcategory = item.subcategory || "product";
  const description = item.description || "A polished daily essential designed for fresh color, smooth wear, and an easy beauty routine.";
  const galleryMedia = normalizeGallery(item, selectedVariant) || [];
  const variantSection = renderVariantSection(item);
  state.activeProductGallery = galleryMedia.length ? galleryMedia : [item.image ?? 0];

  if (state.activeMedia === null || !state.activeProductGallery.includes(state.activeMedia)) {
    state.activeMedia = state.activeProductGallery[0];
  }

  if (typeof ensureProductsForPage === "function") {
    await ensureProductsForPage();
  }
  const catalog = getProductsForUi();
  const catalogWithoutCurrent = catalog.filter((entry) => String(entry.id) !== String(item.id));
  const pickProductRail = (primary = []) => {
    const seen = new Set();
    const picked = [];
    [...primary, ...catalogWithoutCurrent].forEach((entry) => {
      const key = String(entry?.id || "");
      if (!entry || !key || seen.has(key) || String(key) === String(item.id)) return;
      seen.add(key);
      picked.push(entry);
    });
    return picked.slice(0, 4);
  };
  const related = pickProductRail(catalogWithoutCurrent.filter((entry) => entry.category === category));
  const similar = pickProductRail(catalogWithoutCurrent.filter((entry) => entry.subcategory === subcategory));
  const crossSellSources = [
    ...firstArray(item.includes),
    ...firstArray(item.sells),
    ...firstArray(item.crossSells),
    ...firstArray(item.extraPricings),
  ];
  const crossSellSeen = new Set();
  const crossSellRoutine = crossSellSources
    .map((entry) => {
      const directProduct = firstObject(entry?.product, entry?.item, entry);
      const targetId = crossSellProductId(entry, firstNonNull);
      const matched = targetId ? catalog.find((candidate) => String(candidate.id) === String(targetId)) : null;
      const product = matched || (directProduct?.title ? directProduct : null);
      if (!product || String(product.id || "") === String(item.id)) return null;
      const id = String(product.id || targetId || product.title || "");
      if (!id || crossSellSeen.has(id)) return null;
      const discount = crossSellDiscount(entry, product, toNumber);
      const original = toNumber(product.original, 0);
      const price = toNumber(product.price, 0);
      const hasDiscount = discount > 0 || productHasDiscount(product, toNumber) || toNumber(entry?.discount_amount, 0) > 0 || toNumber(entry?.discountAmount, 0) > 0;
      if (!hasDiscount) return null;
      crossSellSeen.add(id);
      return {
        ...product,
        discount: discount || product.discount,
        original: original || (discount > 0 && price > 0 ? price / (1 - Math.min(99.9, discount) / 100) : product.original),
        crossSellLabel: String(firstNonNull(entry?.title, entry?.label, entry?.name, discount > 0 ? `${discount}% cross-sell` : "Cross-sell deal") || "Cross-sell deal"),
      };
    })
    .filter(Boolean)
    .slice(0, 3);
  const catalogItem = (index, alternate = null) => catalog[index] || alternate || null;
  const routineItems = crossSellRoutine.length ? crossSellRoutine : [catalogItem(4), item, catalogItem(11)].filter(Boolean);
  const routineTitle = crossSellRoutine.length ? "Complete the set and save" : "Make it a routine";
  const reviewSummary = typeof item.reviewSummary === "object" && item.reviewSummary !== null ? item.reviewSummary : {};
  const reviewCount = toNumber(reviewSummary.count, itemReviews);
  const reviewAverage = Number.isFinite(Number(reviewSummary.average)) ? Number(reviewSummary.average) : itemRating;
  const reviewRecommend = Number.isFinite(Number(reviewSummary.recommendPercent)) ? Number(reviewSummary.recommendPercent) : 0;
  const reviewBuckets = reviewSummary.buckets || {};
  const asNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
  };
  const reviewBucketsCount = {
    5: asNumber(reviewBuckets[5], asNumber(reviewBuckets["5"])),
    4: asNumber(reviewBuckets[4], asNumber(reviewBuckets["4"])),
    3: asNumber(reviewBuckets[3], asNumber(reviewBuckets["3"])),
    2: asNumber(reviewBuckets[2], asNumber(reviewBuckets["2"])),
    1: asNumber(reviewBuckets[1], asNumber(reviewBuckets["1"])),
  };
  const reviewBucketTotal = Object.values(reviewBucketsCount).reduce((sum, value) => sum + value, 0) || reviewCount || 1;
  const reviewBars = [5, 4, 3, 2, 1].map((star) => {
    const count = reviewBucketsCount[star] || 0;
    const percent = Math.min(100, Math.max(0, Math.round((count / reviewBucketTotal) * 100)));
    return reviewBar(`${star} star${star === 1 ? "" : "s"}`, percent);
  });

  const isFavorite = productIsFavorite(item.id);
  const productPreviouslyPurchased = Boolean(state.sessionAuthenticated && (item.hasPurchasedProduct === true || item.canRateProduct === true));
  const reviewFormSafeId = String(item.id || "product").replace(/[^a-z0-9_-]/gi, "-");
  const ratingEditorId = `product-rating-editor-${reviewFormSafeId}`;
  const commentEditorId = `product-comment-editor-${reviewFormSafeId}`;
  const productRatingCriteria = firstArray(item.ratingCriteria, item.ratings);
  const userHasRating = reviewPayloadHasContent(item.myRating);
  const productCanRate = Boolean(state.sessionAuthenticated && (item.canRateProduct === true || item.hasPurchasedProduct === true || userHasRating));
  const currentUserId = String(firstNonNull(state.sessionUser?.id, state.sessionUser?.user_id, state.sessionUser?.userId, "") || "").trim();
  const sessionUserName = String(firstNonNull(state.sessionUser?.name, state.sessionUser?.username, state.sessionUser?.email, "Customer") || "Customer").trim();
  const sessionAvatarUrl = String(firstNonNull(state.sessionUser?.avatarUrl, state.sessionUser?.avatar_url, state.sessionUser?.avatar, state.sessionUser?.image, state.sessionUser?.photo, "") || "").trim();
  const currentUserName = String(firstNonNull(state.sessionUser?.name, state.sessionUser?.username, state.sessionUser?.email, "") || "")
    .trim()
    .toLowerCase();
  const reviewBelongsToCurrentUser = (review) => {
    if (!state.sessionAuthenticated || !review) return false;
    if (review?.isMine || review?.is_mine || review?.mine || review?.my_review || review?.myReview) return true;
    const reviewUserId = String(firstNonNull(review?.userId, review?.user_id, review?.user?.id, "") || "").trim();
    if (currentUserId && reviewUserId && reviewUserId === currentUserId) return true;
    const reviewName = String(review?.name || "").trim().toLowerCase();
    return Boolean(currentUserName && reviewName && reviewName === currentUserName);
  };
  const renderReviewRatingSnapshot = (review) => {
    const reviewRatings = Array.isArray(review?.ratings) ? review.ratings : [];
    const criteria = productRatingCriteria.length ? productRatingCriteria : reviewRatings;
    const rows = criteria
      .map((criterion, index) => {
        const criterionId = String(firstNonNull(criterion?.id, criterion?.rating_id, criterion?.ratingId, criterion?.key, criterion?.name, index + 1) || "").trim();
        const label = String(firstNonNull(criterion?.name, criterion?.title, criterion?.label, criterionId, `Rating ${index + 1}`) || "").trim();
        const match = reviewRatings.find((ratingEntry) => {
          const ratingKeys = [ratingEntry?.id, ratingEntry?.rating_id, ratingEntry?.ratingId, ratingEntry?.key, ratingEntry?.name, ratingEntry?.title, ratingEntry?.label]
            .map((entry) => String(entry || "").trim())
            .filter(Boolean);
          return ratingKeys.includes(criterionId) || ratingKeys.includes(label);
        });
        const value = Number(firstNonNull(match?.value, match?.rate, match?.rating, match?.score, 0));
        if (!Number.isFinite(value) || value <= 0) return "";
        const safeValue = Math.max(1, Math.min(5, Math.round(value)));
        return `
          <div class="review-comment-rating-row">
            <span>${escapeHtml(label)}</span>
            <b><i style="--rating-progress: ${safeValue * 20}%"></i></b>
            <em>${escapeHtml(reviewQualityLabel(safeValue))}</em>
          </div>
        `;
      })
      .filter(Boolean)
      .join("");
    return rows ? `<div class="review-comment-ratings">${rows}</div>` : "";
  };
  const ratingOverviewRows = (productRatingCriteria.length ? productRatingCriteria : [{ id: "overall", name: "Overall rating", average: reviewAverage }])
    .map((criterion, index) => {
      const label = String(firstNonNull(criterion?.name, criterion?.title, criterion?.label, criterion?.id, `Rating ${index + 1}`) || "").trim();
      const rawValue = Number(firstNonNull(criterion?.average, criterion?.avg, criterion?.value, criterion?.rate, criterion?.rating, reviewAverage, 0));
      const safeValue = Number.isFinite(rawValue) && rawValue > 0 ? Math.max(1, Math.min(5, rawValue)) : Math.max(0, Math.min(5, reviewAverage));
      return `
        <div class="rating-overview-row">
          <span>${escapeHtml(label)}</span>
          <b><i style="--rating-progress: ${Math.round((safeValue / 5) * 100)}%"></i></b>
          <em>${escapeHtml(reviewQualityLabel(Math.round(safeValue)))}</em>
        </div>
      `;
    })
    .join("");

  const reviewCards = Array.isArray(item.reviewsList) ? item.reviewsList.filter((entry) => entry && typeof entry === "object") : [];
  const orderedReviewCards = [...reviewCards].sort((a, b) => Number(reviewBelongsToCurrentUser(b)) - Number(reviewBelongsToCurrentUser(a)));
  const reviewCardsMarkup = orderedReviewCards.length
    ? orderedReviewCards
        .slice(0, 6)
        .map((review) => {
          const rawReviewName = String(review.name || "Customer").trim() || "Customer";
          const reviewName = escapeHtml(rawReviewName);
          const reviewInitials = escapeHtml(
            rawReviewName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part.charAt(0))
              .join("")
              .toUpperCase() || "?",
          );
          const reviewAvatarUrl = String(review.avatarUrl || "").trim();
          const reviewAvatar = reviewAvatarUrl
            ? `<img src="${escapeHtml(reviewAvatarUrl)}" alt="" loading="lazy" />`
            : reviewInitials;
          const reviewComment = String(review.comment || "").trim();
          const reviewDate = reviewDateLabel(review.createdAt);
          const isOwnReview = reviewBelongsToCurrentUser(review);
          const reviewRatingsMarkup = renderReviewRatingSnapshot(review);
          return `
            <article class="review-card">
              <div class="review-comment-top">
                <div class="review-card-head">
                  <span class="review-avatar" aria-hidden="true">${reviewAvatar}</span>
                  <div class="review-comment-author">
                    <div class="review-comment-name-line">
                      <h3>${reviewName}</h3>
                      ${review.verified ? `<span class="review-buyer-badge">✓ Verified Buyer</span>` : ""}
                    </div>
                    <span class="review-comment-date">${reviewDate ? `On ${escapeHtml(reviewDate)}` : "Recently"}</span>
                  </div>
                </div>
                <div class="review-card-actions">
                  ${isOwnReview ? `<button type="button" class="review-card-action" data-edit-my-review="${escapeHtml(commentEditorId)}" aria-label="Edit my comment">✎</button>` : ""}
                </div>
              </div>
              <div class="review-comment-score-row">
                ${reviewRatingsMarkup}
                <span class="review-card-stars">${reviewStarsMarkup(review.rating)}</span>
              </div>
              <p class="review-comment-body">${reviewComment ? escapeHtml(reviewComment) : "No review text provided."}</p>
            </article>
          `;
        })
        .join("")
    : `
      <p class="comments-empty-state">No comments yet.</p>
    `;
  const reviewFormNotice = state.sessionAuthenticated
    ? ""
    : `<p class="checkout-login-note">Please <a href="#account">log in</a> to post a review.</p>`;
  const ownReview = state.sessionAuthenticated
    ? reviewCards.find((review) => reviewBelongsToCurrentUser(review))
    : null;
  const selectedUserRatings = item.myRating || {};
  const ownReviewPayloadComment =
    typeof item.myReview === "string" ? item.myReview : firstNonNull(item.myReview?.comment, item.myReview?.body, item.myReview?.text, "");
  const ownReviewComment = String(firstNonNull(ownReview?.comment, ownReviewPayloadComment, "") || "").trim();
  const hasExistingUserReview = Boolean(
    state.sessionAuthenticated &&
      (ownReview || reviewPayloadHasContent(item.myReview) || reviewPayloadHasContent(item.myRating)),
  );
  const reviewRatingControls = productCanRate
    ? renderReviewRatingCriteria(productRatingCriteria, {
        escapeHtml,
        formSafeId: reviewFormSafeId,
        disabled: false,
        selectedRatings: selectedUserRatings,
      })
    : "";
  const ratingAccessNotice =
    state.sessionAuthenticated && !productCanRate
      ? `<p class="checkout-login-note">Only verified buyers can rate this product. You can still leave a comment.</p>`
      : "";
  const ratingUserBadge = state.sessionAuthenticated
    ? `<span class="rating-action-user">${sessionAvatarUrl ? `<img src="${escapeHtml(sessionAvatarUrl)}" alt="" loading="lazy" />` : ""}${escapeHtml(sessionUserName)}</span>`
    : "";

  els.app.innerHTML = `
    <div class="page-shell">
      <nav class="breadcrumbs" aria-label="Breadcrumbs">
        <a href="#home">Home</a><span>/</span><a href="#shop">Shop</a><span>/</span><a href="#shop?category=${category}">${escapeHtml(titleCase(category))}</a><span>/</span><strong>${escapeHtml(subcategory)}</strong>
      </nav>
      <section class="product-detail-layout">
        <div class="gallery">
          <div class="product-gallery-badges">
            <button
              class="favorite-button product-favorite-overlay ${isFavorite ? "is-active" : ""}"
              type="button"
              data-favorite-product="${escapeHtml(item.id)}"
              data-favorite-title="${escapeHtml(item.title || "Product")}"
              aria-pressed="${isFavorite ? "true" : "false"}"
              aria-label="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
              title="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
              </svg>
            </button>
            ${productPreviouslyPurchased ? `<span class="product-purchased-badge">Purchased before</span>` : ""}
          </div>
          <div class="gallery-main">
            ${renderProductImage(item, "large-sprite", state.activeMedia)}
            <button class="try-on" type="button">TRY IT ON</button>
          </div>
          <div class="thumb-row" aria-label="Product media">
            ${state.activeProductGallery
              .map(
                (image, index) => `
                  <button class="thumb ${state.activeMedia === image ? "is-active" : ""}" type="button" data-media-index="${index}" aria-label="View product image">
                    ${renderProductImage(item, "thumbnail-sprite", image)}
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>

        <article class="product-info">
          <span class="brand">${escapeHtml(item.brand)}</span>
          <h1>${escapeHtml(item.title)}</h1>
          <div class="detail-rating">
            <span class="stars" aria-label="${reviewAverage.toFixed(1)} out of 5 stars">*****</span>
            <strong>${reviewAverage.toFixed(1)}</strong>
            <a href="#reviews" data-review-scroll="#reviews">${reviewCount.toLocaleString()} reviews</a>
          </div>
          <div class="detail-price">
            ${formatPrice(itemPrice, item.currency)}
            ${itemOriginal ? `<s>${formatPrice(itemOriginal, item.currency)}</s>` : ""}
          </div>
          <p class="points-note">Earn points on this purchase as a Pajulina Rewards member.</p>
          ${variantSection}

          <section class="delivery-section">
            <h2 class="product-meta">Pickup and delivery options</h2>
            ${deliveryCards}
          </section>

          <div class="detail-actions">
            <button class="black-button" type="button" data-add-to-cart-product="${item.id}" data-variant-key="${escapeHtml(addButtonVariantKey)}">Add to bag</button>
            <button class="quick-buy-trigger" type="button" data-quick-buy-product="${item.id}" data-variant-key="${escapeHtml(addButtonVariantKey)}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 2 5 13h6l-1 9 9-12h-6l1-8Z" />
              </svg>
              <span>Buy now</span>
            </button>
          </div>
          <div data-quick-buy-mount></div>
          <div class="promo-box">
            Members save up to 20% on almost everything in stores and online. Use code <strong>NEWROUTINE</strong>.
          </div>

          <div class="accordion">
            ${renderProductProsAccordion(item, description)}
          </div>

          <section class="bought-box">
            <h2>Frequently bought together</h2>
            ${miniProduct(item)}
            ${miniProduct(catalogItem(2))}
            ${miniProduct(catalogItem(9))}
            <button class="black-button" type="button" data-add-to-cart-product="${item.id}" data-variant-key="${escapeHtml(addButtonVariantKey)}">Add set to bag</button>
          </section>

          <section class="routine-box">
            <h2>${escapeHtml(routineTitle)}</h2>
            ${routineItems.map((entry, index) => routineStep(crossSellRoutine.length ? `Deal ${index + 1}` : `Step ${index + 1}`, entry)).join("")}
            <button class="black-button" type="button" data-add-to-cart-product="${item.id}" data-variant-key="${escapeHtml(addButtonVariantKey)}">Add set to bag</button>
          </section>
        </article>
      </section>

      ${renderProductArticleSection(item, firstNonNull, escapeHtml)}

      ${renderProductSection("We think you'll like", `${related.length} ${related.length === 1 ? "item" : "items"}`, related, "product-row")}
      ${renderProductSection("Similar items for you", `${similar.length} ${similar.length === 1 ? "item" : "items"}`, similar, "product-row")}

      ${renderProductRatingSection({
        escapeHtml,
        firstNonNull,
        reviewStarsMarkup,
        state,
        item,
        reviewAverage,
        reviewCount,
        productRatingCriteria,
        productCanRate,
        userHasRating,
        selectedUserRatings,
        ratingEditorId,
        reviewFormSafeId,
        reviewFormNotice,
        sessionUserName,
        sessionAvatarUrl,
      })}

      ${renderProductCommentsSection({
        escapeHtml,
        firstNonNull,
        reviewStarsMarkup,
        state,
        item,
        reviewCards,
        productRatingCriteria,
        hasExistingUserReview,
        ownReviewComment,
        commentEditorId,
        reviewFormNotice,
      })}
    </div>
  `;
}
