function renderHeroCarousel({ state, heroSlides, escapeHtml }) {
  const total = heroSlides.length;
  const activeIndex = ((state.activeHeroSlide % total) + total) % total;
  const trackOffset = activeIndex * 100;

  return `
    <section class="hero-carousel" aria-label="Cosmetic shop highlights" data-hero-carousel>
      <div class="hero-carousel-track" data-hero-track style="transform: translateX(-${trackOffset}%);">
        ${heroSlides
          .map(
            (slide, index) => `
              <article
                class="hero-slide ${index === activeIndex ? "is-active" : ""}"
                style="background-image:linear-gradient(90deg,rgba(255,255,255,.9) 0%,rgba(255,255,255,.68) 34%,rgba(255,255,255,.08) 67%),url('${slide.image}');background-position:center,${slide.position};background-size:cover,cover;--hero-accent:${slide.accent};"
                aria-hidden="${index === activeIndex ? "false" : "true"}"
              >
                <div class="hero-copy">
                  <span class="eyebrow">${escapeHtml(slide.eyebrow)}</span>
                  <h1>${escapeHtml(slide.title)}</h1>
                  <p>${escapeHtml(slide.body)}</p>
                  <a class="pill-button" href="${escapeHtml(slide.href)}">${escapeHtml(slide.cta)}</a>
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="hero-controls" aria-label="Hero carousel controls">
        <button class="hero-arrow" type="button" data-hero-step="-1" aria-label="Previous hero slide">&lsaquo;</button>
        <div class="hero-dots" role="tablist" aria-label="Hero slides">
          ${heroSlides
            .map(
              (slide, index) => `
                <button
                  class="hero-dot ${index === activeIndex ? "is-active" : ""}"
                  type="button"
                  data-hero-slide="${index}"
                  role="tab"
                  aria-label="${escapeHtml(slide.eyebrow)}"
                  aria-selected="${index === activeIndex ? "true" : "false"}"
                ></button>
              `,
            )
            .join("")}
        </div>
        <button class="hero-arrow" type="button" data-hero-step="1" aria-label="Next hero slide">&rsaquo;</button>
      </div>
    </section>
  `;
}

function withoutSelectedProducts(products, selectedProducts) {
  const selectedIds = new Set(selectedProducts.map((item) => String(item?.id ?? item?.key ?? "")));
  return products.filter((item) => !selectedIds.has(String(item?.id ?? item?.key ?? "")));
}

function renderInstagramReelCard({ title, caption, image, href, position, label }, escapeHtml) {
  return `
    <article class="instagram-reel-card">
      <a class="instagram-reel-media" href="${escapeHtml(href)}" style="background-image:url('${escapeHtml(image)}');background-position:${position};" aria-label="${escapeHtml(title)}">
        <span class="instagram-reel-label">${escapeHtml(label)}</span>
        <span class="instagram-reel-play" aria-hidden="true">&#9654;</span>
        <span class="instagram-reel-copy">
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(caption)}</small>
        </span>
      </a>
    </article>
  `;
}

export function renderHomePage(deps) {
  const {
    state,
    els,
    heroSlides,
    escapeHtml,
    getProductsForUi,
    renderLiveCatalogEmptyState,
    homeDeals,
    homeRecommended,
    homeNewProducts,
    renderDataStatus,
    renderProductSection,
    renderRoutineEditSection,
    renderFreshShelfSection,
    renderDealStrip,
    featureCard,
    renderHomeBlogBand,
    storyCard,
    getCategoryCards,
    categoryCard,
  } = deps;

  const products = getProductsForUi();
  if (!products.length) {
    renderLiveCatalogEmptyState("Selldone XAPI catalog is unavailable", "The storefront is configured to use live Selldone XAPI data only.");
    return;
  }

  const deals = homeDeals(products, 4);
  const today = homeDeals(products, 6, 4);
  const recommended = homeRecommended(withoutSelectedProducts(products, deals), 4);
  const newItems = homeNewProducts(withoutSelectedProducts(products, [...deals, ...recommended]), 4);
  const categoryCards = getCategoryCards();
  const homeCreativeImages = {
    routine: "assets/home-favorite-daily-skin-reset.png",
    fragrant: "assets/home-favorite-signature-scents.png",
    bestLoved: "assets/home-favorite-best-loved.png",
    softGlow: "assets/home-favorite-soft-glow.png",
  };
  const magazineImages = {
    pride: "assets/home-magazine-pride.png",
    muse: "assets/home-magazine-muse.png",
    community: "assets/home-magazine-community.png",
    giftCard: "assets/home-magazine-gift-card.png",
  };

  els.app.innerHTML = `
    <div class="page-shell">
      ${renderDataStatus()}
      ${renderHeroCarousel({ state, heroSlides, escapeHtml })}
      <section class="promo-grid promo-grid--editorial" aria-label="Featured offers">
        <article class="promo-card hot promo-card--membership">
          <div class="promo-body">
            <span class="eyebrow">Rewards are glowing</span>
            <h1>Members save up to 20%</h1>
            <p>Fresh color, daily skin care, and easy gifts for every routine.</p>
            <a class="pill-button light" href="#shop?discount=1">Shop discounts</a>
            <div class="promo-discs" aria-hidden="true">
              <span><strong>diamond</strong><em>20%</em></span>
              <span><strong>platinum</strong><em>15%</em></span>
              <span><strong>member</strong><em>10%</em></span>
            </div>
          </div>
        </article>
        <article class="promo-card orange promo-card--image promo-card--ritual">
          <img src="assets/promo-ritual-warm.png" alt="" />
          <div class="promo-body">
            <span class="eyebrow">Only here</span>
            <h2>Worth the obsession</h2>
            <p>Soft-focus essentials for lips, skin, and everyday glow.</p>
            <a class="pill-button" href="#shop">Shop now</a>
          </div>
        </article>
        <article class="promo-card blue promo-card--image promo-card--summer">
          <img src="assets/promo-summer-warm.png" alt="" />
          <div class="promo-body">
            <span class="eyebrow">Summer beauty</span>
            <h2>New arrivals, glowing now</h2>
            <p>Sunlit skin care, sheer color, and fresh shine.</p>
            <a class="pill-button" href="#shop?category=skincare">Shop new</a>
          </div>
        </article>
      </section>

      ${renderProductSection("Deals for you", `${deals.length} items`, deals, "product-row")}
      ${renderDealStrip("Today's deals", today)}

      <section class="section">
        <div class="section-head">
          <div>
            <h2>Shop by category</h2>
            <p>Explore Skino Beauty categories with their storefront images.</p>
          </div>
        </div>
        <div class="category-grid category-grid--home">
          ${categoryCards.map(([key, label, image]) => categoryCard(key, label, image)).join("")}
        </div>
      </section>

      ${renderRoutineEditSection("Ritual-ready essentials", "A focused edit for a simple morning-to-night routine.", recommended)}

      <section class="section">
        <div class="gift-banner">
          <div class="gift-copy">
            <h2>Beauty essentials for every day</h2>
            <p>Discover skin care, body care, and everyday favorites for a fresh and simple routine.</p>
            <a class="text-link" href="#shop">Shop now</a>
          </div>
          <div class="gift-image" role="img" aria-label="Skin care and body care essentials"></div>
        </div>
      </section>

      <section class="section">
        <div class="obsession-strip">
          <div class="obsession-copy">
            <h2>Shop by favorite</h2>
            <a class="text-link" href="#shop">Explore all</a>
          </div>
          ${storyCard("Daily skin reset", "Gentle essentials for a clean and easy routine.", "50% 50%", false, homeCreativeImages.routine)}
          ${storyCard("Signature scents", "Fragrance picks for everyday wear and special moments.", "50% 50%", false, homeCreativeImages.fragrant)}
          ${storyCard("Best-loved picks", "Customer favorites worth a spot on your shelf.", "50% 50%", false, homeCreativeImages.bestLoved)}
          ${storyCard("Soft glow care", "Comforting care picks for smooth and nourished skin.", "50% 50%", false, homeCreativeImages.softGlow)}
        </div>
      </section>

      ${renderFreshShelfSection("Fresh from the shelf", "Recently added beauty and personal care, selected for right now.", newItems)}

      <section class="section-tight">
        <div class="coupon-band">
          <div>
            <strong>20% off your first purchase</strong>
            <span>When you sign up for Skino emails. Exclusions apply.</span>
          </div>
          <a class="text-link" href="#shop">See details</a>
        </div>
      </section>

      <section class="section instagram-reels-section">
        <div class="instagram-reels-head">
          <div>
            <span class="eyebrow">Instagram reels</span>
            <h2>Beauty in motion</h2>
            <p>Quick routines, fresh looks, and everyday beauty from Skino.</p>
          </div>
          <a class="text-link" href="#shop">Shop the looks</a>
        </div>
        <div class="instagram-reels-grid">
          ${renderInstagramReelCard({ title: "Peach glow in one swipe", caption: "A soft color routine for brighter days.", image: magazineImages.pride, href: "#shop?category=makeup", position: "50% 42%", label: "Reel 01" }, escapeHtml)}
          ${renderInstagramReelCard({ title: "The soft-focus liner edit", caption: "Simple definition with a polished finish.", image: magazineImages.muse, href: "#shop?category=makeup", position: "52% 36%", label: "Reel 02" }, escapeHtml)}
          ${renderInstagramReelCard({ title: "Get ready with Skino", caption: "Community routines and fresh favorites.", image: magazineImages.community, href: "#shop", position: "50% 38%", label: "Reel 03" }, escapeHtml)}
          ${renderInstagramReelCard({ title: "Unbox the evening look", caption: "Care, color, and finishing touches.", image: magazineImages.giftCard, href: "#shop", position: "50% 36%", label: "Reel 04" }, escapeHtml)}
        </div>
      </section>

      ${renderHomeBlogBand()}
    </div>
  `;
}
