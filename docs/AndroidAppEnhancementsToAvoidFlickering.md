Absolutely! Let’s consolidate **everything** we discussed, including the incremental decisions, rationale, CSS/JS handling, wrapper/iframe flow, and responsive strategies into a single, detailed, ready-to-implement Product Backlog Item (PBI). I’ll structure it so nothing is left out, including device detection, CSS separation, media queries, flicker mitigation, and wrapper injection.

---

# PBI: Mobile-Optimized PWA Wrapper for PVL Libraries (Full Version)

## Description

Enhance PVL libraries’ PWA wrapper to deliver a seamless mobile experience. Move mobile-specific CSS handling into a dedicated `responsive.css` file to reduce JS overhead and flickering. Keep desktop pages unaffected, maintain a desktop-first codebase, and allow dynamic injection of mobile styles into iframe content in the wrapper.

---

## Goals

1. Provide a **desktop-first experience** for static PVL pages.
2. Automatically redirect mobile users to the PWA wrapper (`wrapper.html`) for:

   * Consistent header, footer, and menu layout.
   * Responsive sidebar/content layout inside iframe.
   * Injected mobile-specific styles (`responsive.css`) to adjust static pages loaded in iframe.
3. Reduce JS manipulation in the wrapper by handling mobile layout purely via CSS.
4. Eliminate flickering of elements by ensuring mobile styles are applied immediately.
5. Allow scalable, maintainable CSS with separate files for desktop and mobile.

---

## User Stories

### 1. Desktop User

* **As a** desktop user
* **I want** to load static PVL pages directly
* **So that** I get the full desktop layout without unnecessary wrapper or mobile logic
* **Acceptance Criteria**

  * Desktop pages load `desktop.css` only.
  * No wrapper is used.
  * No mobile CSS is injected.

### 2. Mobile User

* **As a** mobile user
* **I want** to be redirected to `wrapper.html`
* **So that** I get a mobile-optimized experience with consistent header/footer/menu
* **Acceptance Criteria**

  * Mobile device detection handled via static page redirect or wrapper launch.
  * Wrapper loads `wrapper.css` for layout and controls.
  * Library content loads inside iframe.
  * `responsive.css` is injected into iframe **immediately**.
  * Mobile-specific overrides and media queries in `responsive.css` handle:

    * Hiding unnecessary header elements
    * Moving social links to wrapper header
    * Adjusting sidebar and content layout
    * Responsive adjustments for various screen widths
  * No flickering of hidden elements occurs.
  * Sidebar toggling and absence of footer handled with CSS (`grid` + `.no-footer` class).

---

## Implementation Details

### CSS Strategy

#### Files

1. **desktop.css** – Base styles for static pages, desktop-first layout.
2. **wrapper.css** – Wrapper layout for header, footer, menu, and overlays.
3. **responsive.css** – Mobile-specific overrides.

   * **Top**: Common mobile overrides (applied to all mobile devices)
   * **Media queries**: Device-size-specific adjustments.
   * Loaded after `desktop.css` to ensure overrides.

#### Example Structure in `responsive.css`

```css
/* Common mobile overrides (applies to all mobile devices) */
body { font-size: 14px; }
#sidebar { width: 200px; }

/* Small screens (phones) */
@media (max-width: 480px) {
    #sidebar { display: none; }
    header { flex-direction: column; }
}

/* Medium screens (small tablets) */
@media (min-width: 481px) and (max-width: 768px) {
    #sidebar { width: 180px; }
    header { flex-direction: row; }
}
```

### HTML Structure

* **Static Pages**: Serve desktop users directly.
* **Wrapper (`wrapper.html`)**:

  ```text
  <head>
      ├─ wrapper.css
      ├─ responsive.css (loaded dynamically via JS on mobile)
  <body>
      ├─ <header> wrapper header (app controls, logo, social links) </header>
      ├─ <iframe> static library page </iframe>
      ├─ <footer> wrapper footer/menu </footer>
  ```

### JavaScript Handling

* **Wrapper JS** handles:

  * Injecting `responsive.css` into the iframe **before content is displayed**:

    ```javascript
    const iframe = document.getElementById('clientFrame');
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const link = iframeDoc.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/responsive.css';
    iframeDoc.head.appendChild(link);
    ```
  * Extracting dynamic elements (e.g., social links) from iframe and placing them in wrapper header.
  * Managing sidebar toggles, content expansion, and footer absence handling.

* **Device Detection**:

  * Original mobile detection in static pages removed.
  * Wrapper is served directly to mobile users via deeplinks or app.
  * Wrapper JS ensures mobile CSS injection and UI adjustments.

### Layout Handling via CSS (Desktop-First)

* **Header**: 3 equal columns (`1fr 1fr 1fr`) for controls, logo/image, social & brand.
* **Sidebar**: Fixed width, always left; content expands if sidebar is toggled off.
* **Footer**:

  * Sticky if present.
  * Optional; absence handled by `.no-footer` class to let content/sidebar expand.
* **Grid Layout Example**:

```css
#layout {
    display: grid;
    grid-template-columns: var(--sidebar-width) 1fr;
    grid-template-rows: var(--header-height) 1fr auto; /* header, content, footer */
    grid-template-areas:
        "header header"
        "sidebar content"
        "footer footer";
}
#layout.no-footer {
    grid-template-rows: var(--header-height) 1fr;
    grid-template-areas:
        "header header"
        "sidebar content";
}
```

---

## Device Flow Diagram

```
User Device
├─ Desktop Browser
│   └─ Loads static page
│       └─ Applies desktop.css
└─ Mobile Device
    └─ Static page detects mobile (or app deeplink)
        └─ Redirects to wrapper.html
            ├─ Loads wrapper.css (wrapper layout)
            ├─ iframe loads original static page
            └─ wrapper.js injects responsive.css into iframe
                └─ Mobile layout applied immediately
                    ├─ Hide/move header elements
                    ├─ Adjust sidebar & content layout
                    └─ Media queries for various mobile sizes
```

---

## Benefits

* Cleaner separation of desktop and mobile concerns.
* Reduced JS overhead; mobile layout handled via CSS.
* Eliminates flickering of elements before hiding.
* Scales easily for future device-specific media queries.
* Simplified maintenance and readability of codebase.
* Mobile users get optimized experience without breaking desktop pages.

---

## Notes / Implementation Tips

* Always load `responsive.css` **after** desktop/base CSS to ensure proper overriding.
* Sidebar toggling and absence of footer handled with `.toggled-off` or `.no-footer` CSS classes.
* Media queries in `responsive.css` should only target devices smaller than desktop (no duplicate desktop rules).
* Wrapper JS must inject mobile CSS **before rendering iframe content** to avoid flicker.
* Future static page templates should not include mobile-specific adjustments; those are handled by `responsive.css` in wrapper.
