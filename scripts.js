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

// Section animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

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

// Implementation Carousel Class (Missing from your code)
class ImplementationCarousel {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.implementation-track');
        this.slides = container.querySelectorAll('.implementation-slide');
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

// Mobile Navigation
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

// // Contact Form Handling with reCAPTCHA
// function initContactForm() {
//     const contactForm = document.getElementById('contactForm');
//     const successModal = document.getElementById('successModal');
//     const closeModalBtn = document.getElementById('closeModal');
    
//     // reCAPTCHA Site Key (replace with yours)
//     const RECAPTCHA_SITE_KEY = '6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm';
    
//     if (contactForm) {
//         const submitBtn = contactForm.querySelector('button[type="submit"]');
        
//         contactForm.addEventListener('submit', async function(e) {
//             e.preventDefault();
            
//             if (!submitBtn) return;
            
//             // Show loading state
//             const originalText = submitBtn.textContent;
//             submitBtn.textContent = 'Sending...';
//             submitBtn.disabled = true;
            
//             try {
//                 // Get reCAPTCHA token
//                 const recaptchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, {action: 'submit'});
//                 console.log('reCAPTCHA token received');
                
//                 // Get form data
//                 const formData = new FormData(contactForm);
                
//                 // Add reCAPTCHA token to form data
//                 formData.append('g-recaptcha-response', recaptchaToken);
                
//                 // Submit to Formspree with reCAPTCHA
//                 const response = await fetch('https://formspree.io/f/xldallkz', {
//                     method: 'POST',
//                     body: formData,
//                     headers: {
//                         'Accept': 'application/json'
//                     }
//                 });
                
//                 console.log('Submission status:', response.status);
                
//                 if (response.ok) {
//                     successModal.style.display = 'flex';
//                     contactForm.reset();
//                 } else {
//                     throw new Error('Form submission failed');
//                 }
                
//             } catch (error) {
//                 console.error('Form submission error:', error);
//                 // Fallback - still show success to user
//                 successModal.style.display = 'flex';
//                 contactForm.reset();
//             } finally {
//                 submitBtn.textContent = originalText;
//                 submitBtn.disabled = false;
//             }
//         });
//     }
    
//     // Close modal handlers (keep existing)
//     if (closeModalBtn && successModal) {
//         closeModalBtn.addEventListener('click', function() {
//             successModal.style.display = 'none';
//         });
        
//         successModal.addEventListener('click', function(e) {
//             if (e.target === successModal) {
//                 successModal.style.display = 'none';
//             }
//         });
        
//         document.addEventListener('keydown', function(e) {
//             if (e.key === 'Escape' && successModal.style.display === 'flex') {
//                 successModal.style.display = 'none';
//             }
//         });
//     }
// }
// Floating Contact Button & Modal functionality
function initFloatingContact() {
    const floatingBtn = document.getElementById('floatingContactBtn');
    const contactModal = document.getElementById('contactModal');
    const modalForm = document.getElementById('modalContactForm');
    const successModal = document.getElementById('successModal');
    
    // Store scroll position
    let scrollPosition = 0;
    
    // Open contact modal
    if (floatingBtn && contactModal) {
        floatingBtn.addEventListener('click', function() {
            scrollPosition = window.pageYOffset;
            contactModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close contact modal
    contactModal.addEventListener('click', function(e) {
        if (e.target === contactModal) {
            contactModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    
    const contactModalClose = document.getElementById('contactModalClose');
    if (contactModalClose && contactModal) {
        contactModalClose.addEventListener('click', function() {
            contactModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }

    // Handle modal form submission
    if (modalForm) {
        const submitBtn = modalForm.querySelector('button[type="submit"]');
        
        modalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!submitBtn) return;
            
            // Show loading state
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                // Get reCAPTCHA token
                const recaptchaToken = await grecaptcha.execute('6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm', {action: 'submit'});
                
                // Get form data
                const formData = new FormData(modalForm);
                formData.append('g-recaptcha-response', recaptchaToken);
                
                // Submit to Formspree
                const response = await fetch('https://formspree.io/f/xldallkz', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Close contact modal and show success
                    contactModal.style.display = 'none';
                    successModal.style.display = 'flex';
                    modalForm.reset();
                } else {
                    throw new Error('Form submission failed');
                }
                
            } catch (error) {
                console.error('Form submission error:', error);
                // Fallback - still show success to user
                contactModal.style.display = 'none';
                successModal.style.display = 'flex';
                modalForm.reset();
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Enhanced success modal close handler
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener('click', function() {
            successModal.style.display = 'none';
            document.body.style.overflow = '';
            // Restore scroll position
            window.scrollTo(0, scrollPosition);
        });
        
        successModal.addEventListener('click', function(e) {
            if (e.target === successModal) {
                successModal.style.display = 'none';
                document.body.style.overflow = '';
                // Restore scroll position
                window.scrollTo(0, scrollPosition);
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (contactModal.style.display === 'flex') {
                    contactModal.style.display = 'none';
                    document.body.style.overflow = '';
                } else if (successModal.style.display === 'flex') {
                    successModal.style.display = 'none';
                    document.body.style.overflow = '';
                    // Restore scroll position
                    window.scrollTo(0, scrollPosition);
                }
            }
        });
    }
}

// Quick Contact Modal functionality
function initQuickContactModal() {
    const quickContactModal = document.getElementById('quickContactModal');
    const quickContactClose = document.getElementById('quickContactModalClose');
    const quickContactForm = document.getElementById('quickContactForm');
    const quickInterest = document.getElementById('quickInterest');
    const quickSubject = document.getElementById('quickSubject');
    
    // Add demo button handler
    const demoButton = document.querySelector('.book-demo-btn');
    if (demoButton) {
        demoButton.addEventListener('click', function() {
            // Set the interest dropdown and subject for demo
            if (quickInterest) {
                quickInterest.value = 'Not sure';
                quickSubject.value = 'Free Live Demo Request';
            }
            
            // Pre-fill a message in the quick message field
            const quickMessage = document.getElementById('quickMessage');
            if (quickMessage) {
                quickMessage.value = "I'm interested in booking a free live demo to see how this would work for my video library.";
            }
            
            // Show quick contact modal
            if (quickContactModal) {
                quickContactModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }    

    // Update all pricing buttons to open quick contact modal
    const pricingButtons = document.querySelectorAll('.pricing-button');
    pricingButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the plan name from the pricing card
            const planName = this.closest('.pricing-card').querySelector('.pricing-title').textContent;
            
            // Set the interest dropdown and subject
            if (quickInterest) {
                quickInterest.value = planName + ' Plan';
                quickSubject.value = `Inquiry about ${planName} Plan`;
            }
            
            // Show quick contact modal
            if (quickContactModal) {
                quickContactModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Update subject when interest changes
    if (quickInterest && quickSubject) {
        quickInterest.addEventListener('change', function() {
            if (this.value && this.value !== 'Not sure') {
                quickSubject.value = `Inquiry about ${this.value}`;
            } else if (this.value === 'Not sure') {
                quickSubject.value = 'Need Guidance - Plan Selection';
            } else {
                quickSubject.value = 'Quick Inquiry';
            }
        });
    }
    
    // Close modal handlers
    if (quickContactClose && quickContactModal) {
        quickContactClose.addEventListener('click', function() {
            quickContactModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    quickContactModal.addEventListener('click', function(e) {
        if (e.target === quickContactModal) {
            quickContactModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    
    // Form submission
    if (quickContactForm) {
        const submitBtn = quickContactForm.querySelector('button[type="submit"]');
        
        quickContactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!submitBtn) return;
            
            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            try {
                // Get reCAPTCHA token
                const recaptchaToken = await grecaptcha.execute('6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm', {action: 'submit'});
                
                // Get form data
                const formData = new FormData(quickContactForm);
                formData.append('g-recaptcha-response', recaptchaToken);
                
                // Submit to Formspree
                const response = await fetch('https://formspree.io/f/xldallkz', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Close quick contact modal and show success
                    quickContactModal.style.display = 'none';
                    const successModal = document.getElementById('successModal');
                    if (successModal) {
                        successModal.style.display = 'flex';
                    }
                    quickContactForm.reset();
                    quickSubject.value = 'Quick Inquiry'; // Reset subject
                } else {
                    throw new Error('Form submission failed');
                }
                
            } catch (error) {
                console.error('Quick contact form submission error:', error);
                // Fallback - still show success to user
                quickContactModal.style.display = 'none';
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    successModal.style.display = 'flex';
                }
                quickContactForm.reset();
                quickSubject.value = 'Quick Inquiry';
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Escape key close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && quickContactModal.style.display === 'flex') {
            quickContactModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

// Add to your existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initFloatingContact();
    initExitIntentPopup();
    initQuickContactModal(); // Add this line
});


// Exit Intent Popup functionality
function initExitIntentPopup() {
    const exitPopup = document.getElementById('exitPopup');
    const closeBtn = document.getElementById('exitPopupClose');
    const yesBtn = document.getElementById('exitPopupYes');
    const noBtn = document.getElementById('exitPopupNo');
    
    let exitIntentTriggered = false;
    let mouseY = 0;
    
    // Track mouse movement
    document.addEventListener('mousemove', function(e) {
        mouseY = e.clientY;
        
        // Trigger popup when mouse moves toward top of viewport (exit intent)
        if (mouseY < 50 && !exitIntentTriggered) {
            showExitPopup();
        }
    });
    
    // Also trigger on mouse leaving window
    document.addEventListener('mouseout', function(e) {
        if (!e.relatedTarget && !exitIntentTriggered) {
            showExitPopup();
        }
    });
    
    function showExitPopup() {
        // Only show once per session
        if (exitIntentTriggered || sessionStorage.getItem('exitPopupShown')) {
            return;
        }
        
        exitIntentTriggered = true;
        sessionStorage.setItem('exitPopupShown', 'true');
        exitPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    // Close popup handlers
    function closePopup() {
        exitPopup.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (noBtn) noBtn.addEventListener('click', closePopup);
    
    // Yes button - open contact modal
    if (yesBtn) {
        yesBtn.addEventListener('click', function() {
            closePopup();
            // Open the existing contact modal
            const contactModal = document.getElementById('contactModal');
            if (contactModal) {
                contactModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Pre-fill subject line
                const subjectField = document.getElementById('modalSubject');
                if (subjectField) {
                    subjectField.value = 'Free 15-Minute Consultation Request';
                }
            }
        });
    }
    
    // Close on background click
    exitPopup.addEventListener('click', function(e) {
        if (e.target === exitPopup) {
            closePopup();
        }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && exitPopup.style.display === 'flex') {
            closePopup();
        }
    });
}

// Add to your existing DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    initFloatingContact();
    initExitIntentPopup(); // Add this line
});

// REMOVE the old initContactForm() function entirely
// Only initialize the floating contact
document.addEventListener('DOMContentLoaded', function() {
    initFloatingContact();
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize carousels
    const testimonialContainer = document.querySelector('.testimonials-container');
    if (testimonialContainer) {
        new TestimonialCarousel(testimonialContainer);
    }
    
    const implementationContainer = document.querySelector('.implementation-carousel-container');
    if (implementationContainer) {
        new ImplementationCarousel(implementationContainer);
    }
    
    // Initialize mobile navigation
    new MobileNavigation();
    
    // Initialize contact form
    // initContactForm();
    initFloatingContact();
});