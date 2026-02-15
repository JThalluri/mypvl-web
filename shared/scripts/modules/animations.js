export function initSectionAnimations() {
  const sections = document.querySelectorAll(".section");
  if (sections.length === 0 || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("section-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
  );

  sections.forEach((section) => {
    section.classList.add("section-enter");
    observer.observe(section);
  });
}
