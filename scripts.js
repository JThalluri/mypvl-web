// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Contact Form Handling with Modal
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    const submitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModal');
    
    if (contactForm && submitBtn) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Submit to Formspree
            const formData = new FormData(contactForm);
            
            fetch('https://formspree.io/f/xwprjezy', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Show success modal
                    if (successModal) {
                        successModal.style.display = 'flex';
                    }
                    // Reset form
                    contactForm.reset();
                } else {
                    alert('There was an error submitting your form. Please try again.');
                }
            })
            .catch(error => {
                alert('There was an error submitting your form. Please try again.');
            })
            .finally(() => {
                // Reset button
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            });
        });
    }
    
    // Close modal handlers
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            if (successModal) {
                successModal.style.display = 'none';
            }
        });
    }
    
    if (successModal) {
        // Close modal when clicking outside content
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && successModal.style.display === 'flex') {
                successModal.style.display = 'none';
            }
        });
    }
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for animation
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Testimonials Carousel
class TestimonialCarousel {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.testimonial-track');
        this.slides = container.querySelectorAll('.testimonial-slide');
        this.dots = container.querySelectorAll('.carousel-dot');
        this.prevBtn = container.querySelector('.carousel-btn.prev');
        this.nextBtn = container.querySelector('.carousel-btn.next');
        
        this.currentIndex = 0;
        this.slideCount = this.slides.length;
        
        this.init();
    }
    
    init() {
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());
        
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Auto-advance every 5 seconds
        this.autoAdvance = setInterval(() => this.next(), 5000);
        
        // Pause auto-advance on hover
        this.container.addEventListener('mouseenter', () => {
            clearInterval(this.autoAdvance);
        });
        
        this.container.addEventListener('mouseleave', () => {
            this.autoAdvance = setInterval(() => this.next(), 5000);
        });
        
        this.updateCarousel();
    }
    
    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.slideCount) % this.slideCount;
        this.updateCarousel();
    }
    
    next() {
        this.currentIndex = (this.currentIndex + 1) % this.slideCount;
        this.updateCarousel();
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    updateCarousel() {
        const translateX = -this.currentIndex * 100;
        this.track.style.transform = `translateX(${translateX}%)`;
        
        // Update dots
        this.dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }
}

// Implementation Carousel - FINAL WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    const carouselContainer = document.querySelector('.implementation-carousel-container');
    if (!carouselContainer) {
        console.error('Carousel container not found!');
        return;
    }

    const track = carouselContainer.querySelector('.implementation-track');
    const slides = carouselContainer.querySelectorAll('.implementation-slide');
    const dots = carouselContainer.querySelectorAll('.carousel-dot');
    const prevBtn = carouselContainer.querySelector('.carousel-btn.prev');
    const nextBtn = carouselContainer.querySelector('.carousel-btn.next');

    let currentIndex = 0;
    const slideCount = slides.length;

    console.log(`Found ${slideCount} slides and ${dots.length} dots`);

    function updateCarousel() {
        // Move track to show current slide
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        console.log(`Now showing slide ${currentIndex + 1} of ${slideCount}`);
    }

    // Previous button click
    prevBtn.addEventListener('click', () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : slideCount - 1;
        updateCarousel();
    });

    // Next button click
    nextBtn.addEventListener('click', () => {
        currentIndex = currentIndex < slideCount - 1 ? currentIndex + 1 : 0;
        updateCarousel();
    });

    // Dot clicks
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentIndex = index;
            updateCarousel();
        });
    });

    // Initialize
    updateCarousel();
});

// ===== MOBILE NAVIGATION =====
class MobileNavigation {
    constructor() {
        this.navContainer = document.querySelector('.nav-container');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.createMobileToggle();
        this.init();
    }
    
    createMobileToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'mobile-nav-toggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        
        document.querySelector('nav').prepend(toggle);
        this.toggle = toggle;
    }
    
    init() {
        this.toggle.addEventListener('click', () => this.toggleMenu());
        
        // Close menu when clicking on a link
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav') && this.navContainer.classList.contains('active')) {
                this.closeMenu();
            }
        });
        
        // Update active link on scroll
        this.updateActiveLink();
        window.addEventListener('scroll', () => this.updateActiveLink());
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    toggleMenu() {
        this.navContainer.classList.toggle('active');
        const icon = this.toggle.querySelector('i');
        if (this.navContainer.classList.contains('active')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    }
    
    closeMenu() {
        this.navContainer.classList.remove('active');
        const icon = this.toggle.querySelector('i');
        icon.className = 'fas fa-bars';
    }
    
    updateActiveLink() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    handleResize() {
        if (window.innerWidth > 768 && this.navContainer.classList.contains('active')) {
            this.closeMenu();
        }
    }
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Your existing carousel initialization code should be here
    // Initialize testimonial carousel
    const testimonialContainer = document.querySelector('.testimonials-container');
    if (testimonialContainer) {
        new TestimonialCarousel(testimonialContainer);
    }
    
    // Initialize implementation carousel
    const implementationContainer = document.querySelector('.implementation-carousel-container');
    if (implementationContainer) {
        new ImplementationCarousel(implementationContainer);
    }
    
    // ===== ADD THIS LINE =====
    // Initialize mobile navigation
    new MobileNavigation();
    
    // ===== REPLACE YOUR EXISTING SMOOTH SCROLL CODE =====
    // Smooth scrolling with offset for fixed header
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});