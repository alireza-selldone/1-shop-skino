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
  const recommended = homeRecommended(products, 4);
  const newItems = homeNewProducts(products, 4);
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

      ${renderHomeBlogBand()}

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

      ${renderProductSection("We think you'll like", `${recommended.length} items`, recommended, "product-row")}

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

      ${renderProductSection("New for you", `${newItems.length} items`, newItems, "product-row")}

      <section class="section-tight">
        <div class="coupon-band">
          <div>
            <strong>20% off your first purchase</strong>
            <span>When you sign up for Skino emails. Exclusions apply.</span>
          </div>
          <a class="text-link" href="#shop">See details</a>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>All things Skino Beauty</h2>
        </div>
        <div class="magazine-row">
          ${storyCard("Pride, Amplified", "Joyful color made for every day.", "50% 50%", true, magazineImages.pride)}
          ${storyCard("Apply to be a part of the 2026 Muse cohort", "Creators, artists, and beauty voices.", "50% 50%", true, magazineImages.muse)}
          ${storyCard("Join the Skino Beauty Community today", "Tips, events, and new favorites.", "50% 50%", true, magazineImages.community)}
          ${storyCard("Give a Skino Beauty gift card", "The easiest gift for every routine.", "50% 50%", true, magazineImages.giftCard)}
        </div>
      </section>
    </div>
  `;
}
