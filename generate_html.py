#!/usr/bin/env python3
"""
HTML Generator for Personal Video Library Website
Generates a standalone HTML file with embedded resources
Updated for modular CSS structure with theme support
"""

import base64
import os
from pathlib import Path

def read_file(file_path):
    """Read a file and return its content"""
    if not os.path.exists(file_path):
        print(f"Warning: File {file_path} not found.")
        return ""
    
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

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
    """Generate the complete HTML file with embedded resources"""
    
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
    <title>My PVL - Personal Video Library</title>
    {f'<link rel="icon" href="data:{get_mime_type(favicon_path)};base64,{favicon_b64}" type="{get_mime_type(favicon_path)}">' if favicon_b64 else '<!-- Favicon not found -->'}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        {css_content}
    </style>
    <script src="https://www.google.com/recaptcha/api.js?render=6Lf49g0sAAAAAOLKadjqtuRVxlONX9d7v7ENr3pm"></script>
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
</body>
</html>"""
    
    return html_content

def create_directories():
    """Create necessary directories for modular CSS structure"""
    # Create main directories
    os.makedirs("resources", exist_ok=True)
    os.makedirs("sections", exist_ok=True)
    
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
    
    if not os.path.exists("scripts.js"):
        print("Creating placeholder scripts.js...")
        with open("scripts.js", "w") as f:
            f.write("// JavaScript will be added here")
    
    # Create sections directory and placeholder files
    sections = [
        "header.html", "navigation.html", "about.html", "features.html",
        "categories.html", "testimonials.html", "implementations.html",
        "pricing.html", "contact.html", "footer.html"
    ]
    
    for section in sections:
        section_path = os.path.join("sections", section)
        if not os.path.exists(section_path):
            print(f"Creating placeholder {section}...")
            with open(section_path, "w") as f:
                f.write(f"<!-- {section.replace('.html', '').title()} section -->")

def main():
    """Main function to generate and save the HTML file"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate HTML with modular CSS')
    parser.add_argument('--theme', choices=['dark', 'light'], default='dark',
                       help='Choose theme: dark or light (default: dark)')
    
    args = parser.parse_args()
    
    create_directories()
    
    # Generate HTML with selected theme
    print(f"🎨 Generating HTML with {args.theme} theme...")
    html_content = generate_html(theme=args.theme)
    
    # Save to file
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("✅ HTML file generated successfully: index.html")
    print("📁 Modular CSS structure created:")
    print("   - css/base/ (reset, variables, typography)")
    print("   - css/components/ (header, navigation, cards, etc.)")
    print("   - css/themes/ (dark.css, light.css)")
    print("   - css/layout/ (responsive styles)")
    print("   - css/main.css (main import file)")
    print("   - sections/ (HTML sections)")
    print("   - resources/ (branding files)")
    print("")
    print("🎨 Current theme:", args.theme)
    print("🔄 To switch themes, run:")
    print("   python generate_html.py --theme light")
    print("")
    print("📝 To update the website:")
    print("   1. Edit individual CSS files in their respective directories")
    print("   2. Add your branding files to resources/")
    print("   3. Run this script again")

if __name__ == "__main__":
    main()