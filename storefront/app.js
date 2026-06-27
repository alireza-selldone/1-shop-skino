import { installStaticStorefrontApi } from "./static-storefront-api.js?v=product-article-comments-20260622";
import { registerStorefrontInteractions } from "./app-events.js?v=skino-instagram-reels-20260627";

if (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) {
  installStaticStorefrontApi();
}
registerStorefrontInteractions();





