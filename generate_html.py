#!/usr/bin/env python3
"""
HTML Generator for Personal Video Library Website
Generates a standalone HTML file with embedded resources
Updated for modular CSS structure with theme support
Now includes policy page generation with config system
"""

import base64
import os
import json
from pathlib import Path

def read_file(file_path):
    """Read a file and return its content"""
    if not os.path.exists(file_path):
        print(f"Warning: File {file_path} not found.")
        return ""
    
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def read_config():
    """Read and parse the config.json file"""
    config_path = "config.json"
    if not os.path.exists(config_path):
        # Create default config if it doesn't exist
        default_config = {
            "generate_main_page": True,
            "generate_policy_pages": {
                "privacy_policy": False,
                "cookies_policy": False,
                "terms_of_use": False,
                "thirdparty_attributions": False
            },
            "theme": "dark"
        }
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2)
        print("📝 Created default config.json")
        return default_config
    
    with open(config_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def encode_file_to_base64(file_path):
    """Encode a file to base64 string"""
    if not os.path.exists(file_path):
        print(f"Warning: File {file_path} not found. Using placeholder.")
        return None
    
    with open(file_path, 'rb') as file:
        encoded_string = base64.b64encode(file.read()).decode('utf-8')
    return encoded_string

def get_mime_type(file_path):
    """Get MIME type based on file extension"""
    ext = Path(file_path).suffix.lower()
    mime_types = {
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.gif': 'image/gif'
    }
    return mime_types.get(ext, 'application/octet-stream')

def combine_css_files(css_dir="css", theme="dark"):
    """Combine all modular CSS files into one string"""
    css_content = ""
    
    # Define the order of CSS imports to maintain proper cascade
    css_files = [
        # Base styles
        "base/reset.css",
        "base/variables.css",
        "base/typography.css",
        
        # Theme (load only one)
        f"themes/{theme}.css",
        
        # Components
        "components/header.css",
        "components/navigation.css",
        "components/sections.css",
        "components/cards.css",
        "components/carousels.css",
        "components/forms.css",
        "components/modal.css",
        "components/footer.css",
        
        # Layout & Responsive
        "layout/responsive.css"
    ]
    
    for css_file in css_files:
        file_path = os.path.join(css_dir, css_file)
        if os.path.exists(file_path):
            print(f"📦 Including CSS: {css_file}")
            css_content += f"\n\n/* === {css_file} === */\n"
            css_content += read_file(file_path)
        else:
            print(f"⚠️  CSS file not found: {file_path}")
    
    return css_content

def generate_html(theme="dark"):
    """Generate the main HTML file with embedded resources"""
    
    # Resource paths
    resources_dir = "resources"
    favicon_path = os.path.join(resources_dir, "favicon.ico")
    banner_path = os.path.join(resources_dir, "banner.png")
    logo_path = os.path.join(resources_dir, "logo.png")
    
    # Encode resources to base64
    favicon_b64 = encode_file_to_base64(favicon_path)
    banner_b64 = encode_file_to_base64(banner_path)
    logo_b64 = encode_file_to_base64(logo_path)
    
    # Read all CSS modules and combine them
    css_content = combine_css_files(theme=theme)
    js_content = read_file("scripts.js")
    
    # Read all sections
    sections_dir = "sections"
    header_content = read_file(os.path.join(sections_dir, "header.html"))
    navigation_content = read_file(os.path.join(sections_dir, "navigation.html"))
    about_content = read_file(os.path.join(sections_dir, "about.html"))
    features_content = read_file(os.path.join(sections_dir, "features.html"))
    categories_content = read_file(os.path.join(sections_dir, "categories.html"))
    testimonials_content = read_file(os.path.join(sections_dir, "testimonials.html"))
    implementations_content = read_file(os.path.join(sections_dir, "implementations.html"))
    pricing_content = read_file(os.path.join(sections_dir, "pricing.html"))
    contact_content = read_file(os.path.join(sections_dir, "contact.html"))
    footer_content = read_file(os.path.join(sections_dir, "footer.html"))
    
    # Replace placeholders in header with actual images
    if banner_b64:
        header_content = header_content.replace('{{BANNER_IMAGE}}', f'data:image/png;base64,{banner_b64}')
    else:
        header_content = header_content.replace('{{BANNER_IMAGE}}', '')
    
    if logo_b64:
        logo_html = f'<img src="data:image/png;base64,{logo_b64}" alt="PVL Logo" class="logo-img">'
        header_content = header_content.replace('{{LOGO_IMAGE}}', logo_html)
    else:
        header_content = header_content.replace('{{LOGO_IMAGE}}', '<div class="logo">PVL</div>')
    
    # HTML Template
    html_content = f"""<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.youtube.com https://www.google.com https://www.gstatic.com https://scripts.clarity.ms https://www.clarity.ms https://embed.tawk.to https://cdnjs.cloudflare.com https://static.cloudflareinsights.com 'unsafe-inline'; style-src 'self' https://cdnjs.cloudflare.com https://embed.tawk.to 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https://cdnjs.cloudflare.com https://embed.tawk.to data:; connect-src 'self' https://www.google.com https://va.tawk.to https://embed.tawk.to https://www.clarity.ms https://q.clarity.ms wss:; frame-src https://www.youtube.com https://www.google.com;">
        <title>My PVL - Personal Video Library</title>
        {f'<link rel="icon" href="data:{get_mime_type(favicon_path)};base64,{favicon_b64}" type="{get_mime_type(favicon_path)}">' if favicon_b64 else '<!-- Favicon not found -->'}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            {css_content}
        </style>
        <!-- reCAPTCHA v3 -->
        <script src="https://www.google.com/recaptcha/api.js?render=6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm"></script>
        <!--Start of Tawk.to Script-->
        <script type="text/javascript">
        //<![CDATA[
        var Tawk_API=Tawk_API||{{}}, Tawk_LoadStart=new Date();
        (function(){{
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/69193bbcf0cd89195c96cea0/1ja592m87';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        }})();
        //]]>
        </script>
        <!--End of Tawk.to Script-->
        <!-- Microsoft Clarity Analytics -->
        <script type="text/javascript">
            (function(c,l,a,r,i,t,y){{
                c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            }})(window, document, "clarity", "script", "u71fendq3r");
        </script>
    </head>
<body>
    {header_content}
    {navigation_content}
    
    <main>
        {about_content}
        {features_content}
        {categories_content}
        {testimonials_content}
        {implementations_content}
        {pricing_content}
        {contact_content}
    </main>
    
    {footer_content}
    
    <script>
        {js_content}
    </script>
    <!-- Floating Contact Button -->
    <button class="floating-contact-btn" id="floatingContactBtn">
        <i class="fas fa-envelope"></i>
        Contact
    </button>

    <!-- Contact Modal -->
    <div class="modal contact-modal" id="contactModal">
        <div class="modal-content">
            <button class="modal-close" id="contactModalClose">&times;</button>
            <h2 class="section-title" style="margin-bottom: 1.5rem; border-bottom: none; display: block; text-align: center;">Contact Us</h2>
            <form class="contact-form" id="modalContactForm" action="https://formspree.io/f/xldallkz" method="POST">
                <div class="form-group">
                    <label for="modalName">Name *</label>
                    <input type="text" id="modalName" name="name" required>
                </div>
                <div class="form-group">
                    <label for="modalEmail">Email *</label>
                    <input type="email" id="modalEmail" name="email" required>
                </div>
                <div class="form-group">
                    <label for="modalSubject">Subject *</label>
                    <input type="text" id="modalSubject" name="subject" required>
                </div>
                <div class="form-group">
                    <label for="modalMessage">Message *</label>
                    <textarea id="modalMessage" name="message" rows="4" required></textarea>
                </div>
                <button type="submit" class="btn">Send Message</button>
            </form>
        </div>
    </div>

    <!-- Exit Intent Popup -->
    <div class="exit-popup" id="exitPopup">
        <div class="exit-popup-content">
            <button class="exit-popup-close" id="exitPopupClose">&times;</button>
            
            <div class="exit-popup-icon">💬</div>
            <h2 class="exit-popup-title">Wait! Don't Go Yet...</h2>
            
            <p class="exit-popup-message">
                Get a <strong>free 15-minute consultation</strong> to discuss your video library needs. 
                Let's explore how we can organize your content and boost your productivity!
            </p>
            
            <div class="exit-popup-actions">
                <button class="exit-popup-btn primary" id="exitPopupYes">
                    <i class="fas fa-calendar-check"></i> Yes, I'm Interested!
                </button>
                <button class="exit-popup-btn secondary" id="exitPopupNo">
                    No Thanks, Continue Browsing
                </button>
            </div>
        </div>
    </div>
    <!-- Quick Contact Modal -->
    <div class="modal quick-contact-modal" id="quickContactModal">
        <div class="modal-content">
            <button class="modal-close" id="quickContactModalClose">&times;</button>
            <h2 class="section-title" style="margin-bottom: 1.5rem; border-bottom: none; display: block; text-align: center;">Quick Inquiry</h2>
            
            <form class="quick-contact-form" id="quickContactForm" action="https://formspree.io/f/xldallkz" method="POST">
                <div class="quick-contact-field">
                    <label for="quickName">Name *</label>
                    <input type="text" id="quickName" name="name" required>
                </div>
                
                <div class="quick-contact-field">
                    <label for="quickEmail">Email *</label>
                    <input type="email" id="quickEmail" name="email" required>
                </div>
                
                <div class="quick-contact-field">
                    <label for="quickInterest">I'm interested in *</label>
                    <select id="quickInterest" name="interest" required>
                        <option value="">Select a plan...</option>
                        <option value="Personal Plan">Personal Plan (up to 100 videos)</option>
                        <option value="Creator Plan">Creator Plan (entire channel)</option>
                        <option value="Pro Plan">Pro Plan (unlimited customization)</option>
                        <option value="Not sure">Not sure - need guidance</option>
                    </select>
                </div>
                
                <div class="quick-contact-field">
                    <label for="quickMessage">Brief Message</label>
                    <textarea id="quickMessage" name="message" placeholder="Tell us a bit about your video library needs..."></textarea>
                </div>
                
                <input type="hidden" id="quickSubject" name="subject" value="Quick Inquiry">
                
                <button type="submit" class="btn quick-contact-btn">
                    <i class="fas fa-paper-plane"></i> Send Quick Inquiry
                </button>
            </form>
            
            <p style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: var(--text-tertiary);">
                Or <a href="#contact" style="color: var(--primary-color);">use our full contact form</a> for detailed requests
            </p>
        </div>
    </div>    
</body>
</html>"""
    
    return html_content

def generate_policy_page(policy_name, title, theme="dark"):
    """Generate individual policy pages with external CSS"""
    
    # Resource paths
    resources_dir = "resources"
    favicon_path = os.path.join(resources_dir, "favicon.ico")
    banner_path = os.path.join(resources_dir, "banner.png")
    logo_path = os.path.join(resources_dir, "logo.png")
    
    # Encode resources to base64
    favicon_b64 = encode_file_to_base64(favicon_path)
    banner_b64 = encode_file_to_base64(banner_path)
    logo_b64 = encode_file_to_base64(logo_path)
    
    # Read policy content
    policy_content = read_file(f"sections/{policy_name}.html")
    
    # Read header, navigation, footer
    header_content = read_file("sections/header.html")
    navigation_content = read_file("sections/policy_navigation.html")
    footer_content = read_file("sections/footer.html")
    
    # SPECIAL HANDLING FOR CONTACT PAGES
    success_modal_content = ""
    contact_javascript = ""
    
    if policy_name == "contact_us":
        # Include success modal for contact pages
        success_modal_content = read_file("sections/contact_success_modal.html")
        
        # Add contact-specific JavaScript
        contact_javascript = """
        <script>
            // Contact form handling for standalone page
            document.addEventListener('DOMContentLoaded', function() {
                const contactForm = document.getElementById('contactForm');
                const successModal = document.getElementById('successModal');
                const closeModalBtn = document.getElementById('closeModalBtn');
                
                if (contactForm) {
                    contactForm.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const submitBtn = contactForm.querySelector('button[type="submit"]');
                        if (!submitBtn) return;
                        
                        // Show loading state
                        const originalText = submitBtn.textContent;
                        submitBtn.textContent = 'Sending...';
                        submitBtn.disabled = true;
                        
                        try {
                            // Get reCAPTCHA token
                            const recaptchaToken = await grecaptcha.execute('6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm', {action: 'submit'});
                            
                            // Get form data
                            const formData = new FormData(contactForm);
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
                                contactForm.reset();
                                if (successModal) {
                                    successModal.style.display = 'flex';
                                }
                            } else {
                                throw new Error('Form submission failed');
                            }
                            
                        } catch (error) {
                            console.error('Contact form submission error:', error);
                            // Fallback - still show success to user
                            contactForm.reset();
                            if (successModal) {
                                successModal.style.display = 'flex';
                            }
                        } finally {
                            submitBtn.textContent = originalText;
                            submitBtn.disabled = false;
                        }
                    });
                }
                
                // Success modal close handlers
                if (closeModalBtn && successModal) {
                    closeModalBtn.addEventListener('click', function() {
                        successModal.style.display = 'none';
                    });
                    
                    successModal.addEventListener('click', function(e) {
                        if (e.target === successModal) {
                            successModal.style.display = 'none';
                        }
                    });
                }
            });
        </script>
        """
    
    # Replace image placeholders
    if banner_b64:
        header_content = header_content.replace('{{BANNER_IMAGE}}', f'data:image/png;base64,{banner_b64}')
    else:
        header_content = header_content.replace('{{BANNER_IMAGE}}', '')
    
    if logo_b64:
        logo_html = f'<img src="data:image/png;base64,{logo_b64}" alt="PVL Logo" class="logo-img">'
        header_content = header_content.replace('{{LOGO_IMAGE}}', logo_html)
    else:
        header_content = header_content.replace('{{LOGO_IMAGE}}', '<div class="logo">PVL</div>')
    
    # FIX: Use relative paths in navigation and footer
    navigation_content = navigation_content.replace('href="/', 'href="')
    footer_content = footer_content.replace('href="/', 'href="')
    
    # Highlight current page in navigation
    navigation_content = navigation_content.replace(
        f'href="{policy_name}.html" class="nav-link"',
        f'href="{policy_name}.html" class="nav-link active"'
    )
    
    # Highlight current page in footer
    footer_content = footer_content.replace(
        f'href="{policy_name}.html" class="footer-link"',
        f'href="{policy_name}.html" class="footer-link current-page"'
    )
    
    # HTML Template for Policy Pages
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://www.youtube.com https://www.google.com https://www.gstatic.com https://scripts.clarity.ms https://www.clarity.ms https://embed.tawk.to https://cdnjs.cloudflare.com https://static.cloudflareinsights.com 'unsafe-inline'; style-src 'self' https://cdnjs.cloudflare.com https://embed.tawk.to 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https://cdnjs.cloudflare.com https://embed.tawk.to data:; connect-src 'self' https://www.google.com https://va.tawk.to https://embed.tawk.to https://www.clarity.ms https://q.clarity.ms wss:; frame-src https://www.youtube.com https://www.google.com;">
    <title>{title} - My PVL Services</title>
    {f'<link rel="icon" href="data:{get_mime_type(favicon_path)};base64,{favicon_b64}" type="{get_mime_type(favicon_path)}">' if favicon_b64 else '<!-- Favicon not found -->'}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    {'<!-- reCAPTCHA v3 --><script src="https://www.google.com/recaptcha/api.js?render=6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm"></script>' if policy_name == "contact_us" else ''}
    <link rel="stylesheet" href="css/policy-pages.css">  
</head>
<body>
    {header_content}
    {navigation_content}
    
    <main>
        {policy_content}
    </main>
    
    {footer_content}
    
    {success_modal_content}
    
    <!-- Mobile Navigation JavaScript -->
    <script>
        // Mobile Navigation - Consistent with main site
        document.addEventListener('DOMContentLoaded', function() {{
            const mobileNavToggle = document.getElementById('mobileNavToggle');
            const navContainer = document.getElementById('navContainer');
            
            if (mobileNavToggle && navContainer) {{
                mobileNavToggle.addEventListener('click', function() {{
                    navContainer.classList.toggle('active');
                    const icon = this.querySelector('i');
                    if (navContainer.classList.contains('active')) {{
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    }} else {{
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }}
                }});
                
                // Close mobile menu when clicking on a link (optional enhancement)
                document.querySelectorAll('.nav-link').forEach(link => {{
                    link.addEventListener('click', function() {{
                        navContainer.classList.remove('active');
                        const icon = mobileNavToggle.querySelector('i');
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }});
                }});
            }}
        }});
    </script>
    {contact_javascript if policy_name == "contact_us" else ''}
</body>
</html>"""
    
    return html_content

def create_directories():
    """Create necessary directories for modular CSS structure"""
    # Create main directories
    os.makedirs("resources", exist_ok=True)
    os.makedirs("sections", exist_ok=True)
    os.makedirs("css", exist_ok=True)  # Ensure css directory exists
    
    # Create CSS directory structure
    css_dirs = [
        "css/base",
        "css/components", 
        "css/themes",
        "css/layout"
    ]
    
    for css_dir in css_dirs:
        os.makedirs(css_dir, exist_ok=True)
    
    # Create placeholder CSS files if they don't exist
    css_files = {
        "css/base/reset.css": """/* ===== RESET & BASE STYLES ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    min-height: 100vh;
}

html {
    scroll-padding-top: 80px;
}

section {
    scroll-margin-top: 80px;
}""",

        "css/base/variables.css": """/* ===== CSS VARIABLES ===== */
:root {
    /* Core Brand Colors */
    --primary-color: #F79C19;
    --primary-dark: #d8850a;
    --primary-light: #FFB74D;
    --primary-bg: #FFF3E0;
    
    /* Neutral Palette */
    --secondary-color: #1a1a1a;
    --background-color: #2d2d2d;
    --surface-color: #3a3a3a;
    --surface-light: #4a4a4a;
    --surface-dark: #222;
    
    /* Text Colors */
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --text-tertiary: #999999;
    --text-on-primary: #1a1a1a;
    
    /* UI Elements */
    --border-color: #444444;
    --shadow: 0 4px 12px rgba(0,0,0,0.25);
    --border-radius: 12px;
}""",

        "css/base/typography.css": """/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.section {
    animation: fadeIn 0.6s ease-out;
}""",

        "css/themes/dark.css": """/* ===== DARK THEME ===== */
:root {
    /* Core Brand Colors */
    --primary-color: #F79C19;
    --primary-dark: #d8850a;
    --primary-light: #FFB74D;
    --primary-bg: #FFF3E0;
    
    /* Neutral Palette */
    --secondary-color: #1a1a1a;
    --background-color: #2d2d2d;
    --surface-color: #3a3a3a;
    --surface-light: #4a4a4a;
    --surface-dark: #222;
    
    /* Text Colors */
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --text-tertiary: #999999;
    --text-on-primary: #1a1a1a;
    
    /* UI Elements */
    --border-color: #444444;
    --shadow: 0 4px 12px rgba(0,0,0,0.25);
    --border-radius: 12px;
}

body {
    color: var(--text-primary);
    background: var(--background-color);
}""",

        "css/themes/light.css": """/* ===== LIGHT THEME ===== */
:root {
    /* Core Brand Colors */
    --primary-color: #F79C19;
    --primary-dark: #d8850a;
    --primary-light: #FFB74D;
    --primary-bg: #FFF3E0;
    
    /* Neutral Palette */
    --secondary-color: #f8f9fa;
    --background-color: #ffffff;
    --surface-color: #f5f5f5;
    --surface-light: #e9ecef;
    --surface-dark: #e0e0e0;
    
    /* Text Colors */
    --text-primary: #333333;
    --text-secondary: #666666;
    --text-tertiary: #999999;
    --text-on-primary: #1a1a1a;
    
    /* UI Elements */
    --border-color: #dddddd;
    --shadow: 0 4px 12px rgba(0,0,0,0.1);
    --border-radius: 12px;
}

body {
    color: var(--text-primary);
    background: var(--background-color);
}""",

        "css/components/header.css": "/* ===== HEADER COMPONENT STYLES ===== */\n/* Header styles will be added here */",
        "css/components/navigation.css": "/* ===== NAVIGATION COMPONENT STYLES ===== */\n/* Navigation styles will be added here */",
        "css/components/sections.css": "/* ===== SECTIONS COMPONENT STYLES ===== */\n/* Section styles will be added here */",
        "css/components/cards.css": "/* ===== CARDS COMPONENT STYLES ===== */\n/* Card styles will be added here */",
        "css/components/carousels.css": "/* ===== CAROUSELS COMPONENT STYLES ===== */\n/* Carousel styles will be added here */",
        "css/components/forms.css": "/* ===== FORMS COMPONENT STYLES ===== */\n/* Form styles will be added here */",
        "css/components/footer.css": "/* ===== FOOTER COMPONENT STYLES ===== */\n/* Footer styles will be added here */",
        
        "css/layout/responsive.css": "/* ===== RESPONSIVE LAYOUT STYLES ===== */\n/* Responsive styles will be added here */"
    }
    
    for file_path, content in css_files.items():
        if not os.path.exists(file_path):
            print(f"Creating placeholder {file_path}...")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
    
    # Create main.css file
    main_css_content = """/* ===== MAIN CSS FILE - IMPORTS ALL MODULES ===== */

/* Base Styles */
@import url('base/reset.css');
@import url('base/variables.css');
@import url('base/typography.css');

/* Theme (load only one) */
/* @import url('themes/light.css'); */ /* Uncomment for light theme */
@import url('themes/dark.css'); /* Default dark theme */

/* Components */
@import url('components/header.css');
@import url('components/navigation.css');
@import url('components/sections.css');
@import url('components/cards.css');
@import url('components/carousels.css');
@import url('components/forms.css');
@import url('components/footer.css');

/* Layout & Responsive */
@import url('layout/responsive.css');
"""
    
    if not os.path.exists("css/main.css"):
        print("Creating css/main.css...")
        with open("css/main.css", "w", encoding="utf-8") as f:
            f.write(main_css_content)
    
    # Create policy-pages.css if it doesn't exist
    if not os.path.exists("css/policy-pages.css"):
        print("Creating css/policy-pages.css...")
        # We'll use the policy-pages.css content provided earlier
        policy_css_content = read_file("policy-pages.css")  # This will be empty if file doesn't exist yet
        if not policy_css_content:
            # Fallback content
            policy_css_content = "/* Policy Pages CSS - will be generated */"
        with open("css/policy-pages.css", "w", encoding="utf-8") as f:
            f.write(policy_css_content)
    
    if not os.path.exists("scripts.js"):
        print("Creating placeholder scripts.js...")
        with open("scripts.js", "w") as f:
            f.write("// JavaScript will be added here")
    
    # Create sections directory and placeholder files
    sections = [
        "header.html", "navigation.html", "about.html", "features.html",
        "categories.html", "testimonials.html", "implementations.html",
        "pricing.html", "contact.html", "footer.html",
        # Policy page sections
        "privacy_policy.html", "cookies_policy.html", "terms_of_use.html", 
        "thirdparty_attributions.html", "policy_navigation.html"
    ]
    
    for section in sections:
        section_path = os.path.join("sections", section)
        if not os.path.exists(section_path):
            print(f"Creating placeholder {section}...")
            with open(section_path, "w") as f:
                f.write(f"<!-- {section.replace('.html', '').title()} section -->")

def main():
    """Main function to generate and save the HTML files"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate HTML with modular CSS')
    parser.add_argument('--theme', choices=['dark', 'light'], default='dark',
                       help='Choose theme: dark or light (default: dark)')
    
    args = parser.parse_args()
    
    create_directories()
    
    # Read configuration
    config = read_config()
    
    # Generate main page if enabled
    if config.get('generate_main_page', True):
        print(f"🎨 Generating main HTML with {args.theme} theme...")
        html_content = generate_html(theme=args.theme)
        
        # Save to file
        with open("index.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        print("✅ Main HTML file generated successfully: index.html")
    else:
        print("⏭️  Skipping main page generation (disabled in config)")
    
    # Generate policy pages if enabled
    policy_pages_config = config.get('generate_policy_pages', {})
    policy_pages = [
        ("privacy_policy", "Privacy Policy"),
        ("cookies_policy", "Cookie Policy"), 
        ("terms_of_use", "Terms of Use"),
        ("thirdparty_attributions", "Third-Party Credits"),
        ("contact_us", "Contact Us")
    ]
    
    for policy_file, title in policy_pages:
        if policy_pages_config.get(policy_file, False):
            print(f"📄 Generating {title}...")
            policy_html = generate_policy_page(policy_file, title, theme=args.theme)
            with open(f"{policy_file}.html", "w", encoding="utf-8") as f:
                f.write(policy_html)
            print(f"✅ Generated: {policy_file}.html")
        else:
            print(f"⏭️  Skipping {title} (disabled in config)")
    
    print("\n📁 Generation complete!")
    print("🎨 Current theme:", args.theme)
    print("⚙️  To enable policy pages, edit config.json and set flags to true")
    print("🔄 Run this script again after updating config.json")

if __name__ == "__main__":
    main()