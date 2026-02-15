class Carousel {
  constructor(container, options = {}) {
    this.container = container;
    this.track = container.querySelector(options.trackSelector ?? ".carousel-track");
    this.slides = Array.from(container.querySelectorAll(options.slideSelector ?? ".carousel-slide"));
    this.dots = Array.from(container.querySelectorAll(".carousel-dot"));
    this.prevBtn = container.querySelector(".carousel-btn.prev");
    this.nextBtn = container.querySelector(".carousel-btn.next");
    this.autoAdvanceMs = options.autoAdvanceMs ?? 0;
    this.current = 0;
    this.timer = null;
  }

  init() {
    if (!this.track || this.slides.length === 0) {
      return;
    }

    this.prevBtn?.addEventListener("click", () => this.move(-1));
    this.nextBtn?.addEventListener("click", () => this.move(1));

    this.dots.forEach((dot, index) => {
      dot.addEventListener("click", () => this.go(index));
    });

    if (this.autoAdvanceMs > 0) {
      this.startAutoAdvance();
      this.container.addEventListener("mouseenter", () => this.stopAutoAdvance());
      this.container.addEventListener("mouseleave", () => this.startAutoAdvance());
    }

    this.render();
  }

  move(delta) {
    this.current = (this.current + delta + this.slides.length) % this.slides.length;
    this.render();
  }

  go(index) {
    this.current = index;
    this.render();
  }

  render() {
    this.track.style.transform = `translateX(${-100 * this.current}%)`;
    this.dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === this.current);
    });
  }

  startAutoAdvance() {
    this.stopAutoAdvance();
    this.timer = window.setInterval(() => this.move(1), this.autoAdvanceMs);
  }

  stopAutoAdvance() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export function initCarousels() {
  const testimonials = document.querySelector(".testimonials-container");
  if (testimonials) {
    new Carousel(testimonials, {
      trackSelector: ".testimonial-track",
      slideSelector: ".testimonial-slide",
      autoAdvanceMs: 5500,
    }).init();
  }

  const implementations = document.querySelector(".implementation-carousel-container");
  if (implementations) {
    new Carousel(implementations, {
      trackSelector: ".implementation-track",
      slideSelector: ".implementation-slide",
    }).init();
  }
}
