function ensureMobileToggle(nav) {
  let toggle = nav.querySelector(".mobile-nav-toggle");
  if (toggle) {
    return toggle;
  }

  toggle = document.createElement("button");
  toggle.className = "mobile-nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Toggle navigation menu");
  toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
  nav.prepend(toggle);
  return toggle;
}

function closeMenu(navContainer, toggle) {
  navContainer.classList.remove("active");
  toggle.setAttribute("aria-expanded", "false");
  const icon = toggle.querySelector("i");
  if (icon) {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
  }
}

export function initNavigation() {
  const nav = document.querySelector("nav");
  const navContainer = nav?.querySelector(".nav-container");
  if (!nav || !navContainer) {
    return;
  }

  const toggle = ensureMobileToggle(nav);
  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {
    const isOpen = navContainer.classList.toggle("active");
    toggle.setAttribute("aria-expanded", String(isOpen));
    const icon = toggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  });

  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => closeMenu(navContainer, toggle));
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && !event.target.closest("nav")) {
      closeMenu(navContainer, toggle);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu(navContainer, toggle);
    }
  });
}

export function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href.length <= 1) {
        return;
      }

      const target = document.querySelector(href);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}
