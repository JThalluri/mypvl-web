import { initNavigation, initSmoothScrolling } from "./modules/navigation.js";
import { initSectionAnimations } from "./modules/animations.js";
import { initCarousels } from "./modules/carousels.js";
import { initModalFeatures } from "./modules/modals.js";
import { initRecaptchaBadgeBehavior } from "./modules/recaptcha.js";

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initSmoothScrolling();
  initSectionAnimations();
  initCarousels();
  initModalFeatures();
  initRecaptchaBadgeBehavior();
});
