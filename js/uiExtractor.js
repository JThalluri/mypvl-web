class UIExtractor {
    constructor(pwaWrapper) {
        this.pwaWrapper = pwaWrapper;
        this.extractionQueue = new Set();
        this.isProcessing = false;
        this.observerCache = new WeakMap();
        this.extractionCache = new Map();
    }

    // Debounced extraction to avoid multiple rapid calls
    scheduleExtraction(methodName, ...args) {
        this.extractionQueue.add({ methodName, args });
        
        if (!this.isProcessing) {
            this.isProcessing = true;
            // Use requestIdleCallback for non-critical extractions
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => this.processQueue());
            } else {
                setTimeout(() => this.processQueue(), 100);
            }
        }
    }

    async processQueue() {
        for (const task of this.extractionQueue) {
            try {
                await this[task.methodName](...task.args);
            } catch (error) {
                console.error(`PWA: Extraction failed for ${task.methodName}`, error);
            }
        }
        this.extractionQueue.clear();
        this.isProcessing = false;
    }

    extractClearFiltersButton(iframeDoc) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                try {
                    const mobileClearBtn = iframeDoc.querySelector('.mobile-clear-btn, .clear-filters-btn.mobile-only');
                    
                    if (mobileClearBtn) {
                        mobileClearBtn.style.display = 'none';
                        
                        const headerControls = iframeDoc.querySelector('.header-controls');
                        const searchContainer = headerControls?.querySelector('.search-container');
                        
                        if (headerControls && searchContainer) {
                            searchContainer.appendChild(mobileClearBtn);
                            this.optimizeHeaderControlsLayout(headerControls, mobileClearBtn);
                        }
                        
                        this.setupFilterMonitoring(iframeDoc);
                        console.log('PWA: Mobile clear filters button moved to header controls');
                    } else {
                        console.log('PWA: No mobile clear filters button found');
                    }
                    resolve();
                } catch (error) {
                    console.error('PWA: Clear filters extraction failed', error);
                    resolve();
                }
            });
        });
    }

    optimizeHeaderControlsLayout(headerControls, mobileClearBtn) {
        const icon = mobileClearBtn.querySelector('i');
        if (icon) {
            mobileClearBtn.innerHTML = icon.outerHTML;
            mobileClearBtn.title = 'Clear Filters';
            mobileClearBtn.setAttribute('aria-label', 'Clear Filters');
        }
        
        Object.assign(headerControls.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            justifyContent: 'flex-start'
        });
        
        const searchContainer = headerControls.querySelector('.search-container');
        if (searchContainer) {
            Object.assign(searchContainer.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: '1',
                minWidth: '0',
                maxWidth: '90%'
            });
            
            const searchBox = searchContainer.querySelector('#searchBox');
            if (searchBox) {
                Object.assign(searchBox.style, {
                    flex: '1',
                    minWidth: '120px',
                    width: '100%'
                });
            }
            
            Object.assign(mobileClearBtn.style, {
                background: '#dc3545',
                border: 'none',
                borderRadius: '50%',
                padding: '8px !important',
                color: 'white',
                fontSize: '14px !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                flexShrink: '0',
                margin: '0',
                width: '36px !important',
                height: '36px !important',
                minWidth: '36px !important',
                minHeight: '36px !important'
            });
        }
        
        const toggleBtn = headerControls.querySelector('#toggleBtn');
        if (toggleBtn) {
            Object.assign(toggleBtn.style, {
                flexShrink: '0',
                width: '40px',
                minWidth: '40px',
                height: '40px'
            });
        }
        
        mobileClearBtn.addEventListener('mouseenter', () => {
            mobileClearBtn.style.background = '#c82333';
            mobileClearBtn.style.transform = 'scale(1.05)';
        });
        
        mobileClearBtn.addEventListener('mouseleave', () => {
            mobileClearBtn.style.background = '#dc3545';
            mobileClearBtn.style.transform = 'scale(1)';
        });
    }
    
    setupFilterMonitoring(iframeDoc) {
        const clearFiltersBtn = iframeDoc.querySelector('.clear-filters-btn');
        const observer = new MutationObserver(() => {
            const isVisible = clearFiltersBtn.style.display !== 'none' && 
                            clearFiltersBtn.offsetParent !== null;
            
            if (this.pwaWrapper.clearFiltersBtn) {
                this.pwaWrapper.clearFiltersBtn.style.display = isVisible ? 'flex' : 'none';
            }
        });
        
        observer.observe(clearFiltersBtn, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            childList: false,
            subtree: false
        });
    }

    extractSocialLinks() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                try {
                    const iframeDoc = this.pwaWrapper.clientFrame.contentDocument;
                    const socialContainer = iframeDoc.querySelector('.social-links-container');
                    
                    if (socialContainer && socialContainer.querySelector('a')) {
                        this.pwaWrapper.socialLinksContainer.innerHTML = '';
                        
                        const links = socialContainer.querySelectorAll('a');
                        links.forEach(link => {
                            const newLink = document.createElement('a');
                            newLink.href = link.href;
                            newLink.innerHTML = link.innerHTML;
                            newLink.target = '_blank';
                            newLink.rel = 'noopener noreferrer';
                            
                            if (link.title) newLink.title = link.title;
                            if (link.getAttribute('aria-label')) {
                                newLink.setAttribute('aria-label', link.getAttribute('aria-label'));
                            }
                            
                            Object.assign(newLink.style, {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#2d2d2d',
                                color: 'white',
                                textDecoration: 'none',
                                transition: 'background 0.2s'
                            });
                            
                            newLink.addEventListener('mouseenter', () => {
                                newLink.style.background = '#3d3d3d';
                            });
                            newLink.addEventListener('mouseleave', () => {
                                newLink.style.background = '#2d2d2d';
                            });
                            
                            this.pwaWrapper.socialLinksContainer.appendChild(newLink);
                        });
                        
                        socialContainer.style.display = 'none';
                    } else {
                        this.pwaWrapper.socialLinksContainer.innerHTML = '';
                    }
                    resolve();
                } catch (error) {
                    console.error('PWA: Social links extraction failed', error);
                    resolve();
                }
            });
        });
    }

    clearCache() {
        this.extractionCache.clear();
        this.observerCache.forEach((observer, element) => {
            if (!document.body.contains(element)) {
                observer.disconnect();
                this.observerCache.delete(element);
            }
        });
    }    
}