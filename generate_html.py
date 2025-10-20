#!/usr/bin/env python3
"""
HTML Generator for Personal Video Library Website
Generates a standalone HTML file with embedded resources
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

def generate_html():
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
    
    # Read all components
    css_content = read_file("styles.css")
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
    """Create necessary directories"""
    os.makedirs("resources", exist_ok=True)
    os.makedirs("sections", exist_ok=True)
    
    # Create placeholder files if they don't exist
    if not os.path.exists("styles.css"):
        print("Creating placeholder styles.css...")
        with open("styles.css", "w") as f:
            f.write("/* CSS styles will be added here */")
    
    if not os.path.exists("scripts.js"):
        print("Creating placeholder scripts.js...")
        with open("scripts.js", "w") as f:
            f.write("// JavaScript will be added here")
    
    # Create sections directory and placeholder files
    sections = [
        "header.html", "navigation.html", "about.html", "features.html",
        "categories.html", "pricing.html", "contact.html", "footer.html"
    ]
    
    for section in sections:
        section_path = os.path.join("sections", section)
        if not os.path.exists(section_path):
            print(f"Creating placeholder {section}...")
            with open(section_path, "w") as f:
                f.write(f"<!-- {section.replace('.html', '').title()} section -->")

def main():
    """Main function to generate and save the HTML file"""
    create_directories()
    
    # Generate HTML
    html_content = generate_html()
    
    # Save to file
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("✅ HTML file generated successfully: index.html")
    print("📁 File structure created:")
    print("   - styles.css (CSS styles)")
    print("   - scripts.js (JavaScript)")
    print("   - sections/ (HTML sections)")
    print("   - resources/ (branding files)")
    print("")
    print("🔄 To update the website:")
    print("   1. Edit individual CSS/JS/section files")
    print("   2. Add your branding files to resources/")
    print("   3. Run this script again")

if __name__ == "__main__":
    main()
