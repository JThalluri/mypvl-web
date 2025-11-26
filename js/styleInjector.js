class StyleInjector {
    constructor() {
        this.injected = false;
        this.styleId = 'pwa-injected-styles';
        this.stylesCache = null;
        this.isLoading = false;
    }

    async injectStyles(iframeDoc) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Use Promise.race for timeout fallback
            const styles = await Promise.race([
                this.loadStylesFromFile(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 2000)
                )
            ]);
            
            // Use requestAnimationFrame for smoother injection
            await new Promise(resolve => requestAnimationFrame(() => {
                this.addStylesToIframe(iframeDoc, styles);
                this.injected = true;
                resolve();
            }));
            
            console.log('PWA: Styles injected successfully');
        } catch (error) {
            console.error('PWA: Failed to inject styles, using fallback', error);
            // Use minimal critical styles only
            this.injectCriticalStyles(iframeDoc);
        } finally {
            this.isLoading = false;
        }
    }

    // Load styles from external CSS file
    async loadStylesFromFile() {
        // Return cached styles if already loaded
        if (this.stylesCache) return this.stylesCache;
        
        try {
            const response = await fetch('/css/pwa-injected-styles.css');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let css = await response.text();
            
            // Optimize CSS for performance on low-end devices
            css = this.optimizeCSS(css);
            
            this.stylesCache = css;
            return this.stylesCache;
        } catch (error) {
            console.error('PWA: Failed to load CSS file, using fallback', error);
            // Fallback to performance-optimized styles
            return this.getPerformanceOptimizedFallback();
        }
    }

    // Optimize CSS for performance
    optimizeCSS(css) {
        // Remove expensive selectors on low-end devices
        if (this.isLowEndDevice()) {
            css = css.replace(/box-shadow[^;]*;/g, '/* shadow-removed */');
            css = css.replace(/filter[^;]*;/g, '/* filter-removed */');
            css = css.replace(/transform[^;]*scale[^;]*;/g, '/* transform-removed */');
        }
        return css;
    }

    // Check if device is low-end
    isLowEndDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Performance-optimized fallback styles
    getPerformanceOptimizedFallback() {
        return `
            /* Performance-optimized fallback styles */
            :root {
                --header-height: 48px !important;
            }
            
            /* Hide unnecessary elements */
            .brand-logo-container,
            .page-header > img,
            header > img,
            .header-banner,
            .site-branding {
                display: none !important;
            }
            
            /* Header adjustments */
            header {
                height: var(--header-height) !important;
                min-height: var(--header-height) !important;
                padding: 0 15px !important;
                will-change: transform;
                transform: translateZ(0); /* GPU layer */
            }
            
            /* Clear filters button handling */
            .clear-filters-btn:not(.mobile-only):not(.mobile-clear-btn) {
                display: none !important;
            }
            
            /* Mobile clear filters button in header controls */
            .header-controls .mobile-clear-btn,
            .header-controls .clear-filters-btn.mobile-only {
                background: #dc3545 !important;
                border: none !important;
                border-radius: 50% !important;
                padding: 8px !important;
                color: white !important;
                font-size: 14px !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: background 0.2s !important;
                flex-shrink: 0 !important;
                margin: 0 !important;
                width: 36px !important;
                height: 36px !important;
                min-width: 36px !important;
                min-height: 36px !important;
                will-change: transform;
                transform: translateZ(0); /* GPU acceleration */
            }
            
            /* Search container layout */
            .header-controls .search-container {
                flex: 1 !important;
                min-width: 0 !important;
                max-width: 70% !important;
            }
            
            .header-controls #searchBox {
                flex: 1 !important;
                min-width: 120px !important;
                width: 100% !important;
            }
            
            /* Layout adjustments */
            #sidebar {
                height: calc(100vh - var(--header-height)) !important;
            }
            
            #layout {
                height: calc(100vh - var(--header-height)) !important;
            }
            
            /* Hide footer elements */
            footer,
            .site-footer,
            .page-footer {
                display: none !important;
            }
            
            /* Content adjustments */
            .content, main, .page-content {
                margin-top: 0 !important;
                padding-top: 10px !important;
            }
            
            /* Performance optimizations */
            * {
                /* Reduce expensive properties on low-end devices */
                box-shadow: none !important;
                filter: none !important;
            }
            
            /* Tablet-specific styles */
            @media (max-width: 1024px) {
                footer, .site-footer, .page-footer {
                    height: 55px !important;
                    min-height: 55px !important;
                    padding: 10px 15px !important;
                }
            }
            
            @media (max-width: 768px) {
                footer, .site-footer, .page-footer {
                    height: 50px !important;
                    min-height: 50px !important;
                    padding: 8px 12px !important;
                }
                
                .header-controls {
                    bottom: 1px !important;
                    left: 6px !important;
                    right: 6px !important;
                }
            }
            
            @media (max-width: 480px) {
                footer, .site-footer, .page-footer {
                    height: 45px !important;
                    min-height: 45px !important;
                    padding: 6px 10px !important;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            }
        `;
    }

    // Inject only critical styles for immediate visual stability
    injectCriticalStyles(iframeDoc) {
        const criticalStyles = `
            :root { 
                --header-height: 48px !important; 
            }
            .brand-logo-container, 
            header > img, 
            .header-banner {
                display: none !important;
            }
            header { 
                height: var(--header-height) !important;
                min-height: var(--header-height) !important;
                padding: 0 15px !important;
            }
            footer,
            .site-footer {
                display: none !important;
            }
        `;
        this.addStylesToIframe(iframeDoc, criticalStyles);
        this.injected = true;
    }

    // Inject styles into iframe
    addStylesToIframe(iframeDoc, css) {
        // Remove existing injected styles
        const existing = iframeDoc.getElementById(this.styleId);
        if (existing) existing.remove();
        
        // Create new style element
        const style = iframeDoc.createElement('style');
        style.id = this.styleId;
        style.textContent = css;
        
        // Add to iframe head
        iframeDoc.head.appendChild(style);
    }

    // Method to update specific styles dynamically
    updateStyles(iframeDoc, newStyles) {
        const existing = iframeDoc.getElementById(this.styleId);
        if (existing) {
            existing.textContent += newStyles;
        } else {
            this.addStylesToIframe(iframeDoc, newStyles);
        }
    }

    // Method to remove injected styles
    removeStyles(iframeDoc) {
        const existing = iframeDoc.getElementById(this.styleId);
        if (existing) {
            existing.remove();
            this.injected = false;
        }
    }
}

// Create global instance
window.pwaStyleInjector = new StyleInjector();