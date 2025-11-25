class LibrarySearch {
    constructor() {
        this.libraryRegistry = [];
        this.isLoaded = false;
        this.loadLibraryRegistry();
    }

    async loadLibraryRegistry() {
        try {
            const response = await fetch('/library/library_metadata.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.libraryRegistry = await response.json();
            this.isLoaded = true;
            console.log('Library registry loaded successfully');
        } catch (error) {
            console.error('Failed to load library registry:', error);
            this.libraryRegistry = [];
            this.isLoaded = true;
        }
    }

    searchLibraries(query) {
        if (!this.isLoaded) {
            console.log('Library data still loading...');
            return [];
        }
        
        if (!query.trim()) return [];
        
        const searchTerm = query.toLowerCase().trim();
        
        return this.libraryRegistry.filter(lib => 
            lib.name.toLowerCase().includes(searchTerm) ||
            lib.description.toLowerCase().includes(searchTerm) ||
            lib.keywords.some(keyword => keyword.includes(searchTerm)) ||
            lib.id.toLowerCase().includes(searchTerm)
        );
    }

    getLibraryByPath(path) {
        if (!this.isLoaded) {
            console.log('Library data still loading...');
            return null;
        }
        return this.libraryRegistry.find(lib => lib.path === path);
    }
    
    getLibraryById(id) {
        if (!this.isLoaded) {
            console.log('Library data still loading...');
            return null;
        }
        return this.libraryRegistry.find(lib => lib.id === id);
    }
}

class PWAWrapper {
    constructor() {
        this.clientFrame = document.getElementById('clientFrame');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.appHeader = document.querySelector('.app-header');
        
        // Header elements (right side)
        this.shareBtn = document.getElementById('shareBtn');
        this.reloadBtn = document.getElementById('reloadBtn');
        this.socialLinksContainer = document.getElementById('socialLinksContainer');
        
        // Footer elements
        this.sidepaneToggle = document.getElementById('sidepaneToggle');
        this.librarySearchTrigger = document.getElementById('librarySearchTrigger');
        this.appMenuTrigger = document.getElementById('appMenuTrigger');
        
        // Modal elements
        this.librarySearchBackdrop = document.getElementById('librarySearchBackdrop');
        this.librarySearchModal = document.getElementById('librarySearchModal');
        this.librarySearchInput = document.getElementById('librarySearchInput');
        this.librarySearchResults = document.getElementById('librarySearchResults');
        this.closeLibrarySearch = document.getElementById('closeLibrarySearch');
        this.recentLibraries = document.getElementById('recentLibraries');
        
        this.appMenuBackdrop = document.getElementById('appMenuBackdrop');
        this.appMenuModal = document.getElementById('appMenuModal');
        this.closeAppMenu = document.getElementById('closeAppMenu');
        this.clearAppData = document.getElementById('clearAppData');
        
        // Scroll behavior variables
        this.lastScrollTop = 0;
        this.scrollThreshold = 50; // YouTube-like sensitivity
        this.headerHeight = 60;
        this.headerControlsRight = document.getElementById('headerControlsRight');
        this.clearFiltersBtn = null;        
        this.init();
    }
    
    init() {
        this.search = new LibrarySearch();
        this.setupEventListeners();
        this.setupOnlineOfflineDetection();
        this.setupScrollBehavior();
        this.hideClientUI();
        this.setupPolicyLinks();
        this.setupMessageListener();
        this.loadRecentLibrary();
    }
    
    setupEventListeners() {
        // Footer controls
        this.sidepaneToggle.addEventListener('click', () => this.toggleClientSidepane());
        this.librarySearchTrigger.addEventListener('click', () => this.showLibrarySearch());
        this.appMenuTrigger.addEventListener('click', () => this.showAppMenu());
        
        // Header controls (right side)
        this.shareBtn.addEventListener('click', () => this.shareCurrentLibrary());
        this.reloadBtn.addEventListener('click', () => this.clientFrame.src = this.clientFrame.src);
        
        // Library search modal
        this.librarySearchInput.addEventListener('input', (e) => this.handleLibrarySearch(e.target.value));
        this.closeLibrarySearch.addEventListener('click', () => this.hideLibrarySearch());
        this.librarySearchBackdrop.addEventListener('click', () => this.hideLibrarySearch());
        
        // App menu modal
        this.closeAppMenu.addEventListener('click', () => this.hideAppMenu());
        this.appMenuBackdrop.addEventListener('click', () => this.hideAppMenu());
        this.clearAppData.addEventListener('click', () => this.clearAppDataHandler());
        
        // Frame events
        this.clientFrame.addEventListener('load', () => {
            this.hideLoading();
            this.saveRecentLibrary(this.clientFrame.src);
            this.updateRecentLibraries();
            this.hideClientUI();
            this.extractSocialLinks();
        });
        
        this.clientFrame.addEventListener('loadstart', () => this.showLoading());
    }

    setupScrollBehavior() {
        let ticking = false;
        
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleHeaderVisibility(scrollTop);
                    this.lastScrollTop = scrollTop;
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // Use passive listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    handleHeaderVisibility(scrollTop) {
        const scrollDelta = scrollTop - this.lastScrollTop;
        
        if (scrollDelta > 0 && scrollTop > this.scrollThreshold) {
            // Scrolling down and past threshold - hide header
            this.appHeader.classList.add('hidden');
            this.appHeader.classList.remove('visible');
        } else if (scrollDelta < 0) {
            // Scrolling up - show header immediately
            this.appHeader.classList.remove('hidden');
            this.appHeader.classList.add('visible');
        }
        
        // Always show header at the very top
        if (scrollTop <= this.scrollThreshold) {
            this.appHeader.classList.remove('hidden');
            this.appHeader.classList.add('visible');
        }
    }

    setupMessageListener() {
        window.addEventListener('message', function(event) {
            if (event.data.type === 'TOGGLE_SIDEPANE' && event.data.source === 'pwa-wrapper') {
                console.log('CLIENT: Simulating real button click');
                
                const toggleBtn = document.getElementById('toggleBtn');
                if (toggleBtn) {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    
                    toggleBtn.dispatchEvent(clickEvent);
                    
                    console.log('CLIENT: Real click event dispatched');
                }
                
                window.parent.postMessage({
                    type: 'SIDEPANE_TOGGLED',
                    source: 'pwa-client', 
                    timestamp: Date.now()
                }, '*');
            }
        });                
    }

    setupOnlineOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('PWA: Online');
        });
        
        window.addEventListener('offline', () => {
            console.log('PWA: Offline');
        });
    }

    setupPolicyLinks() {
        const policyLinks = document.querySelectorAll('.menu-item[href]');
        policyLinks.forEach(link => {
            link.replaceWith(link.cloneNode(true));
        });
        
        document.querySelectorAll('.menu-item[href]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const url = link.href;
                console.log('PWA: Opening policy link externally:', url);
                
                if (navigator.userAgent.includes('Android') && window.Android) {
                    window.Android.openInBrowser(url);
                } else {
                    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
                    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                        window.location.href = url;
                    }
                }
            });
        });
    }

    // Library Search functionality
    showLibrarySearch() {
        this.librarySearchBackdrop.classList.add('active');
        this.librarySearchModal.classList.add('active');
        this.librarySearchInput.focus();
        this.updateRecentLibraries();
    }
    
    hideLibrarySearch() {
        this.librarySearchBackdrop.classList.remove('active');
        this.librarySearchModal.classList.remove('active');
        this.librarySearchInput.value = '';
        this.librarySearchResults.innerHTML = '';
    }
    
    handleLibrarySearch(query) {
        const results = this.search.searchLibraries(query);
        this.displayLibrarySearchResults(results);
    }
    
    displayLibrarySearchResults(results) {
        if (results.length === 0) {
            this.librarySearchResults.innerHTML = '<div class="search-result-item">No libraries found</div>';
        } else {
            this.librarySearchResults.innerHTML = results.map(lib => `
                <div class="search-result-item" data-path="${lib.path}">
                    <div class="search-result-name">${lib.name}</div>
                    <div class="search-result-desc">${lib.description}</div>
                </div>
            `).join('');
            
            this.librarySearchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const path = item.getAttribute('data-path');
                    this.loadClient(path);
                    this.hideLibrarySearch();
                });
            });
        }
    }
    
    updateRecentLibraries() {
        try {
            const recent = JSON.parse(localStorage.getItem('pwa_recent_libraries') || '[]');
            const recentHtml = recent.slice(0, 3).map(path => {
                const library = this.search.getLibraryByPath(path);
                return library ? `
                    <div class="search-result-item" data-path="${library.path}">
                        <div class="search-result-name">${library.name}</div>
                        <div class="search-result-desc">${library.description}</div>
                    </div>
                ` : '';
            }).join('');
            
            this.recentLibraries.innerHTML = recentHtml ? `
                <h3>Recently Viewed</h3>
                ${recentHtml}
            ` : '<div class="search-result-item">No recent libraries</div>';
            
            this.recentLibraries.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const path = item.getAttribute('data-path');
                    this.loadClient(path);
                    this.hideLibrarySearch();
                });
            });
        } catch (error) {
            console.log('PWA: Could not load recent libraries', error);
            this.recentLibraries.innerHTML = '<div class="search-result-item">Error loading recent libraries</div>';
        }
    }
    
    // App Menu functionality
    showAppMenu() {
        this.appMenuBackdrop.classList.add('active');
        this.appMenuModal.classList.add('active');
    }
    
    hideAppMenu() {
        this.appMenuBackdrop.classList.remove('active');
        this.appMenuModal.classList.remove('active');
    }
    
    clearAppDataHandler() {
        if (confirm('Clear all app data? This will reset your recent libraries.')) {
            localStorage.clear();
            this.hideAppMenu();
            alert('App data cleared successfully.');
        }
    }
    
    // Client Integration
    toggleClientSidepane() {
        console.log('PWA: Sending toggle message to client');
        
        try {
            this.clientFrame.contentWindow.postMessage({
                type: 'TOGGLE_SIDEPANE',
                source: 'pwa-wrapper',
                timestamp: Date.now()
            }, '*');
            
            console.log('PWA: Toggle message sent');
        } catch (error) {
            console.log('PWA: Failed to send toggle message:', error);
        }
    }
    
    hideClientUI() {
        this.clientFrame.addEventListener('load', () => {
            try {
                const iframeDoc = this.clientFrame.contentDocument;
                const hideCSS = `
                    :root {
                        --header-height: 50px !important;
                    }
                    
                    .brand-logo-container,
                    .page-header > img,
                    header > img,
                    .header-banner,
                    .site-branding {
                        display: none !important;
                    }
                    
                    .header {
                        height: var(--header-height) !important;
                        min-height: var(--header-height) !important;
                        padding: 0px!important;
                    }
                    
                    /* REMOVE the hiding rule for mobile clear button */
                    /* .mobile-clear-btn,
                    .clear-filters-btn.mobile-only {
                        display: none !important;
                    } */
                    
                    /* Hide the desktop clear filters button instead */
                    .clear-filters-btn:not(.mobile-only):not(.mobile-clear-btn) {
                        display: none !important;
                    }
                    
                    /* Adjust sidebar height for reduced header */
                    #sidebar {
                        height: calc(100vh - var(--header-height)) !important;
                    }
                    
                    /* Adjust layout for reduced header */
                    #layout {
                        height: calc(100vh - var(--header-height)) !important;
                    }
                    
                    footer,
                    .site-footer,
                    .page-footer {
                        display: none !important;
                    }
                    
                    #content {
                        margin-top: 0 !important;
                        padding: 8px!important;
                    }
                    
                    .header-controls{
                        max-width:98%!important;
                        display:flex!important;
                        justify-content: flex-start !important;
                        gap:4px!important;
                    }    

                    .header-controls .mobile-clear-btn,
                    .header-controls .clear-filters-btn.mobile-only {
                        background: #dc3545 !important;
                        border: none !important;
                        border-radius: 25% !important; /* Circular */
                        padding: 10px !important;
                        color: white !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: flex-start !important;
                        transition: background 0.2s !important;
                        flex-shrink: 0 !important;
                        margin: 0 !important;
                        width: 36px !important;
                        height: 36px !important;
                        min-width: 36px !important;
                        min-height: 36px !important;
                    }                        
                `;
                const style = iframeDoc.createElement('style');
                style.textContent = hideCSS;
                iframeDoc.head.appendChild(style);
                
                // Extract and move the mobile clear filters button
                this.extractClearFiltersButton(iframeDoc);
                
            } catch (error) {
                console.log('PWA: Could not adjust client UI', error);
            }
        });
    }

    // extractClearFiltersButton(iframeDoc) {
    //     try {
    //         // Find the clear filters button in the client
    //         const clearFiltersBtn = iframeDoc.querySelector('.clear-filters-btn');
            
    //         if (clearFiltersBtn) {
    //             // Remove existing clear filters button from wrapper if it exists
    //             if (this.clearFiltersBtn) {
    //                 this.clearFiltersBtn.remove();
    //             }
                
    //             // Create a new button for our header
    //             this.clearFiltersBtn = document.createElement('button');
    //             this.clearFiltersBtn.className = 'clear-filters-header-btn';
    //             this.clearFiltersBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                
    //             // Copy the click behavior from the original button
    //             this.clearFiltersBtn.addEventListener('click', () => {
    //                 // Trigger the original button's click handler
    //                 clearFiltersBtn.click();
    //             });
                
    //             // Add to header controls
    //             this.headerControlsRight.prepend(this.clearFiltersBtn);
                
    //             // Monitor when filters are applied to show/hide the button
    //             this.setupFilterMonitoring(iframeDoc);
    //         }
    //     } catch (error) {
    //         console.log('PWA: Could not extract clear filters button', error);
    //     }
    // }

    extractClearFiltersButton(iframeDoc) {
        try {
            // Find the mobile-specific clear filters button in the client
            const mobileClearBtn = iframeDoc.querySelector('.mobile-clear-btn, .clear-filters-btn.mobile-only');
            
            if (mobileClearBtn) {
                // Remove the hiding rule from our CSS and show the mobile button
                mobileClearBtn.style.display = 'flex';
                
                // Find the header controls in the iframe
                const headerControls = iframeDoc.querySelector('.header-controls');
                const searchContainer = headerControls?.querySelector('.search-container');
                
                if (headerControls && searchContainer) {
                    // Move the mobile button to the header controls (within search container)
                    searchContainer.appendChild(mobileClearBtn);
                    
                    // Ensure proper layout
                    this.optimizeHeaderControlsLayout(headerControls, mobileClearBtn);
                }
                
                // Monitor when filters are applied to show/hide the button
                this.setupFilterMonitoring(iframeDoc);
                
                console.log('PWA: Mobile clear filters button moved to header controls');
            } else {
                console.log('PWA: No mobile clear filters button found');
            }
        } catch (error) {
            console.log('PWA: Could not extract mobile clear filters button', error);
        }
    }

    optimizeHeaderControlsLayout(headerControls, mobileClearBtn) {
        // Remove text, keep only the icon
        const icon = mobileClearBtn.querySelector('i');
        if (icon) {
            mobileClearBtn.innerHTML = icon.outerHTML;
            mobileClearBtn.title = 'Clear Filters'; // Keep accessibility
            mobileClearBtn.setAttribute('aria-label', 'Clear Filters');
        }
        
        // Ensure the header controls uses proper flex layout
        Object.assign(headerControls.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            justifyContent: 'flex-start'
        });
        
        // Optimize search container to take most of the space
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
            
            // Ensure search box takes most of the search container space
            const searchBox = searchContainer.querySelector('#searchBox');
            if (searchBox) {
                Object.assign(searchBox.style, {
                    flex: '1',
                    minWidth: '120px',
                    width: '100%'
                });
            }
            
            // Style the mobile clear filters button to be compact (icon only)
            Object.assign(mobileClearBtn.style, {
                background: '#dc3545',
                border: 'none',
                borderRadius: '50%', // Circular for icon-only button
                padding: '8px !important', // Equal padding for circle
                color: 'white',
                fontSize: '14px !important',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                flexShrink: '0',
                margin: '0',
                width: '36px !important', // Fixed width for circle
                height: '36px !important', // Fixed height for circle
                minWidth: '36px !important',
                minHeight: '36px !important'
            });
        }
        
        // Style the toggle button to be compact
        const toggleBtn = headerControls.querySelector('#toggleBtn');
        if (toggleBtn) {
            Object.assign(toggleBtn.style, {
                flexShrink: '0',
                width: '40px',
                minWidth: '40px',
                height: '40px'
            });
        }
        
        // Add hover effect for clear button
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
            // Sync visibility between original button and our extracted button
            const isVisible = clearFiltersBtn.style.display !== 'none' && 
                            clearFiltersBtn.offsetParent !== null;
            
            if (this.clearFiltersBtn) {
                this.clearFiltersBtn.style.display = isVisible ? 'flex' : 'none';
            }
        });
        
        observer.observe(clearFiltersBtn, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            childList: false,
            subtree: false
        });
        
        // Initial sync
        const isVisible = clearFiltersBtn.style.display !== 'none' && 
                        clearFiltersBtn.offsetParent !== null;
        if (this.clearFiltersBtn) {
            this.clearFiltersBtn.style.display = isVisible ? 'flex' : 'none';
        }
    }

    checkActiveFilters(iframeDoc) {
        // Implement logic to check if any filters are active
        // This is client-specific - you'll need to adjust based on your app
        const activeFilters = iframeDoc.querySelectorAll(
            '.category.selected, .filter.active, [class*="active"][class*="filter"]'
        );
        return activeFilters.length > 0;
    }

    extractSocialLinks() {
        try {
            const iframeDoc = this.clientFrame.contentDocument;
            const socialContainer = iframeDoc.querySelector('.social-links-container');
            
            if (socialContainer && socialContainer.querySelector('a')) {
                this.socialLinksContainer.innerHTML = '';
                
                const links = socialContainer.querySelectorAll('a');
                links.forEach(link => {
                    // Create new link with app styling but preserve the original href
                    const newLink = document.createElement('a');
                    newLink.href = link.href; // This is the key - preserve original URL
                    
                    // Copy the icon HTML to preserve the social media icon
                    newLink.innerHTML = link.innerHTML;
                    
                    // Set for external opening
                    newLink.target = '_blank';
                    newLink.rel = 'noopener noreferrer';
                    
                    // Add title/aria-label for accessibility if they exist
                    if (link.title) newLink.title = link.title;
                    if (link.getAttribute('aria-label')) {
                        newLink.setAttribute('aria-label', link.getAttribute('aria-label'));
                    }
                    
                    // Apply app styling
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
                    
                    this.socialLinksContainer.appendChild(newLink);
                });
                
                // Hide the original container
                socialContainer.style.display = 'none';
            } else {
                this.socialLinksContainer.innerHTML = '';
            }
        } catch (error) {
            console.log('PWA: Could not extract social links', error);
        }
    }
    
    // Client loading and state management
    loadClient(url) {
        this.showLoading();
        this.clientFrame.src = url;
    }
    
    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }
    
    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
    
    async shareCurrentLibrary() {
        const currentUrl = this.clientFrame.src;
        const library = this.search.getLibraryByPath(new URL(currentUrl).pathname);
        const libraryName = library ? library.name : 'Music Video Library';
        
        const shareData = {
            title: `Music Video Library - ${libraryName}`,
            text: 'Check out this amazing music video collection!',
            url: currentUrl,
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(currentUrl);
                alert('Library URL copied to clipboard!');
            }
        } catch (error) {
            console.log('PWA: Sharing cancelled', error);
        }
    }
    
    saveRecentLibrary(url) {
        try {
            const recent = JSON.parse(localStorage.getItem('pwa_recent_libraries') || '[]');
            const updated = [url, ...recent.filter(item => item !== url)].slice(0, 5);
            localStorage.setItem('pwa_recent_libraries', JSON.stringify(updated));
        } catch (error) {
            console.log('PWA: Could not save recent library', error);
        }
    }
    
    loadRecentLibrary() {
        try {
            const recent = JSON.parse(localStorage.getItem('pwa_recent_libraries') || '[]');
            if (recent.length > 0) {
                this.clientFrame.src = recent[0];
            }
        } catch (error) {
            console.log('PWA: Could not load recent library', error);
        }
    }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PWAWrapper();
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/sw.js')
            .then((registration) => {
                console.log('PWA: ServiceWorker registered');
            })
            .catch((error) => {
                console.log('PWA: ServiceWorker registration failed');
            });
    });
}