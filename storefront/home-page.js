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
                style="--hero-image:url('${slide.image}');--hero-pos:${slide.position};--hero-accent:${slide.accent};"
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
    eventTile,
    featureCard,
    renderBlogTeaserSection,
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

  els.app.innerHTML = `
    <div class="page-shell">
      ${renderDataStatus()}
      ${renderHeroCarousel({ state, heroSlides, escapeHtml })}
      <section class="promo-grid" aria-label="Featured offers">
        <article class="promo-card hot">
          <div class="promo-body">
            <span class="eyebrow">Rewards are glowing</span>
            <h1>Members save up to 20%</h1>
            <p>Fresh color, daily skin care, and easy gifts for every routine.</p>
            <a class="pill-button light" href="#shop?discount=1">Shop discounts</a>
            <div class="promo-discs" aria-hidden="true">
              <span>diamond<br />20%</span>
              <span>platinum<br />15%</span>
              <span>member<br />10%</span>
            </div>
          </div>
        </article>
        <article class="promo-card orange">
          <img src="assets/beauty-hero.png" alt="" />
          <div class="promo-body">
            <span class="eyebrow">Only here</span>
            <h2>Worth the obsession</h2>
            <p>Beauty finds with color, glow, and staying power.</p>
            <a class="pill-button" href="#shop">Shop now</a>
          </div>
        </article>
        <article class="promo-card blue">
          <img src="assets/beauty-hero.png" alt="" />
          <div class="promo-body">
            <span class="eyebrow">Summer beauty</span>
            <h2>New arrivals, loading...</h2>
            <p>Bright skin, softer lips, easy shine.</p>
            <a class="pill-button" href="#shop?category=skincare">Shop new</a>
          </div>
        </article>
      </section>

      ${renderProductSection("Deals for you", `${deals.length} items`, deals, "product-row")}
      ${renderDealStrip("Today's deals", today)}

      <section class="section" id="events">
        <div class="event-band">
          <div class="event-lead">
            <span class="eyebrow">In-store inspiration</span>
            <h2>Come see us!</h2>
            <a class="pill-button light" href="#shop">Find a store</a>
          </div>
          ${eventTile("Bronze to bridal", "Warm color lessons for every glow.", "22% 55%")}
          ${eventTile("Beauty services", "Fresh styling, shade matching, and skin prep.", "54% 48%")}
          ${eventTile("In-store beauty event", "Meet new favorites and trending routines.", "70% 48%")}
          ${eventTile("Selfie-ready skin", "Soft glam looks with easy everyday steps.", "86% 45%")}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <div>
            <h2>The beauty everyone wants, only here</h2>
            <p>Curated edits for color, care, fragrance, and tools.</p>
          </div>
        </div>
        <div class="feature-grid">
          ${featureCard("Pajulina Beauty Collection", "Clean color and easy everyday shine.", "12% 55%")}
          ${featureCard("DIBS Beauty", "Cool girl color for lips and cheeks.", "35% 45%")}
          ${featureCard("Live Tinted", "Skin-first makeup for warm radiance.", "58% 48%")}
          ${featureCard("isima", "Hair care made for bounce and shine.", "80% 48%")}
        </div>
      </section>

      ${renderProductSection("We think you'll like", `${recommended.length} items`, recommended, "product-row")}
      ${renderBlogTeaserSection()}

      <section class="section">
        <div class="gift-banner">
          <div class="gift-copy">
            <h2>Find a gift Dad will love</h2>
            <p>Ask Pajulina AI for personalized picks, from skin care to fragrance.</p>
            <a class="text-link" href="#shop?category=gifts">Start chat</a>
          </div>
          <div class="gift-image" role="img" aria-label="Beauty gifts and cosmetics"></div>
        </div>
      </section>

      <section class="section">
        <div class="obsession-strip">
          <div class="obsession-copy">
            <h2>Worth the obsession</h2>
            <a class="text-link" href="#shop">Shop now</a>
          </div>
          ${storyCard("A routine that feels like a treat", "Skin care favorites for fresh starts.", "24% 52%")}
          ${storyCard("Most fragrant", "Easy scents for day and night.", "50% 52%")}
          ${storyCard("Detector mode", "Find color, texture, and glow in one place.", "66% 48%")}
          ${storyCard("Glow-worthy acts", "Care picks that keep skin feeling soft.", "85% 48%")}
        </div>
      </section>

      ${renderProductSection("New for you", `${newItems.length} items`, newItems, "product-row")}

      <section class="section-tight">
        <div class="coupon-band">
          <div>
            <strong>20% off your first purchase</strong>
            <span>When you sign up for Pajulina emails. Exclusions apply.</span>
          </div>
          <a class="text-link" href="#shop">See details</a>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Shop by Category</h2>
        </div>
        <div class="category-grid">
          ${getCategoryCards().map(([key, label, image]) => categoryCard(key, label, image)).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>All things Pajulina Beauty</h2>
        </div>
        <div class="magazine-row">
          ${storyCard("Pride, Amplified", "Joyful color made for every day.", "18% 52%", true)}
          ${storyCard("Apply to be a part of the 2026 Muse cohort", "Creators, artists, and beauty voices.", "42% 50%", true)}
          ${storyCard("Join the Pajulina Beauty Community today", "Tips, events, and new favorites.", "60% 50%", true)}
          ${storyCard("Give a Pajulina Beauty gift card", "The easiest gift for every routine.", "86% 45%", true)}
        </div>
      </section>
    </div>
  `;
}