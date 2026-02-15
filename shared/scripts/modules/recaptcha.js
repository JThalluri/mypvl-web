function isTouchPrimaryInput() {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

function setupTouchBadgeToggle(badge) {
  if (badge.dataset.recaptchaTouchInit === "1") {
    return;
  }

  badge.dataset.recaptchaTouchInit = "1";

  badge.addEventListener("pointerdown", (event) => {
    if (!isTouchPrimaryInput()) {
      return;
    }

    event.stopPropagation();
    badge.classList.toggle("is-expanded");
  });

  document.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (!badge.contains(event.target)) {
      badge.classList.remove("is-expanded");
    }
  });
}

export function initRecaptchaBadgeBehavior() {
  if (!isTouchPrimaryInput()) {
    return;
  }

  const findAndSetup = () => {
    const badge = document.querySelector(".grecaptcha-badge");
    if (!badge) {
      return false;
    }

    setupTouchBadgeToggle(badge);
    return true;
  };

  if (findAndSetup()) {
    return;
  }

  const observer = new window.MutationObserver(() => {
    if (findAndSetup()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  window.setTimeout(() => observer.disconnect(), 15000);
}
