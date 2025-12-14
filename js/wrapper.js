    // --- History stack for iframe navigation ---
    iframeHistory = [];
    historyPointer = -1;
class PWAWrapper {
    constructor() {
        this.APP_VERSION = '3.2.0'; 
        this.clientFrame = document.getElementById('clientFrame');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.appHeader = document.querySelector('.app-header');
        
        // Header elements (right side)
        this.shareBtn = document.getElementById('shareBtn');
        this.reloadBtn = document.getElementById('reloadBtn');
        this.socialLinksContainer = document.getElementById('socialLinksContainer');
        
        // Footer elements
        // this.sidepaneToggle = document.getElementById('sidepaneToggle');
        this.libraryDisplay = document.getElementById('libraryDisplay');
        this.libraryNameElement = this.libraryDisplay.querySelector('.library-name');        
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
        this.clearAppData = document.getElementById('clearPreferences');
        
        // Scroll behavior variables
        this.lastScrollTop = 0;
        this.scrollThreshold = 50;
        this.headerHeight = 60;
        
        this.uiExtractor = null;
        this.isInitialized = false;

        this.performanceMode = this.detectPerformanceMode();
        this.isBackground = false;        

        // Enhanced error recovery variables
        this.maxRetries = 3;
        this.retryCount = 0;
        this.isRecovering = false;
        this.currentLibraryId = null;

        this.init();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        await this.checkForUpdates();

        // ADD these lines at the beginning:
        this.setupBatteryOptimizations();
        this.setupVisibilityMonitoring();
        this.setupMemoryManagement();
        
        // Your existing init code:
        await this.loadCriticalResources();
        this.deferNonCriticalInit();
        this.setupPerformanceMonitoring();
        
        this.isInitialized = true;
    }

    async handleInitialLoad() {
        console.log('PWA: handleInitialLoad START');
        const urlParams = new URLSearchParams(window.location.search);
        const libraryId = urlParams.get('l') || urlParams.get('library');
        const source = urlParams.get('source');
        
        console.log('PWA: URL parameters:', {
            library: libraryId,
            source: source,
            fullURL: window.location.href
        });
        
        if (libraryId) {
            console.log(`PWA: Attempting to load library: ${libraryId}`);
            await this.loadLibraryById(libraryId);
        } else {
            console.log('PWA: No library parameter, loading recent library');
            this.loadRecentLibrary();
        }
        console.log('PWA: handleInitialLoad END');
        // this.updateLibraryDisplay();
    }


    async loadLibraryById(libraryId) {
        console.log('PWA: loadLibraryById called with:', libraryId);
        console.log('PWA: Search object exists:', !!this.search);
        console.log('PWA: Search is loaded:', this.search?.isLoaded);
        
        if (!this.search || !this.search.isLoaded) {
            console.error('PWA: LibrarySearch not ready!');
            this.loadRecentLibrary();
            return;
        }
        
        const library = this.search.getLibraryById(libraryId);
        console.log('PWA: Library search result:', library);
        
        if (library) {
            console.log(`PWA: SUCCESS - Loading library path: ${library.path}`);
            this.currentLibraryId = libraryId;
            this.loadClient(library.path);
            this.updateLibraryDisplay();
        } else {
            console.error(`PWA: FAILED - Library not found: ${libraryId}`);
            console.log('PWA: Available library IDs:', this.search.libraryRegistry.map(lib => lib.id));
            await this.loadRecentLibrary();
        }
    }
    
    // NEW: Cache busting for library content
    addCacheBuster(url) {
        if (this.isLibraryUrl(url)) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}_t=${Date.now()}`;
        }
        return url;
    }

    isLibraryUrl(url) {
        return url.includes('/QKNK9F/') || 
            url.match(/\/[A-Z0-9]{6}\//) ||
            url.startsWith('/@');
    }

    isErrorPage() {
        try {
            const iframeDoc = this.clientFrame.contentDocument || 
                            this.clientFrame.contentWindow.document;
            const content = iframeDoc.body.innerHTML;
            const title = iframeDoc.title.toLowerCase();
            
            // Check for SUCCESS indicators first (positive validation)
            const successIndicators = [
                'pvl video library',
                'video library', 
                'music video',
                'youtube api ready',
                'application initialized'
            ];
            
            // If we see success indicators, it's definitely NOT an error
            const hasSuccessContent = successIndicators.some(indicator => 
                content.toLowerCase().includes(indicator) || title.includes(indicator)
            );
            
            if (hasSuccessContent) {
                return false; // Definitely not an error
            }
            
            // Only then check for error indicators
            const errorIndicators = [
                '404',
                'error',
                'not found',
                'page not found', 
                'failed to load',
                'this page isn\'t working',
                'cannot load',
                'failed to fetch'
            ];
            
            const hasErrorContent = errorIndicators.some(indicator => 
                content.toLowerCase().includes(indicator) || title.includes(indicator)
            );
            
            // Also check for very little content (potential error)
            const hasVeryLittleContent = iframeDoc.body.textContent.trim().length < 50;
            
            return hasErrorContent || hasVeryLittleContent;
        } catch (e) {
            // Cross-origin restriction, assume it's OK
            console.log('PWA: Cannot access iframe content (cross-origin), assuming successful load');
            return false;
        }
    }

    // NEW: Success timeout to prevent false error detection
    setupSuccessTimeout() {
        return new Promise((resolve) => {
            this.successTimeout = setTimeout(() => {
                console.log('PWA: Success timeout - page loaded without errors');
                resolve(true);
            }, 3000); // If no errors detected within 3 seconds, assume success
        });
    }    

    // NEW: Critical error handling
    async handleCriticalError(failedUrl) {
        this.isRecovering = true;
        this.hideLoading();
        
        // Clear all related caches
        await this.clearCacheForUrl(failedUrl);
        
        // Show user-friendly error
        this.showErrorModal(
            'Trouble loading this library. ' +
            'We\'re switching to your recent library instead.'
        );
        
        // Fallback to recent library after delay
        setTimeout(async () => {
            try {
                await this.loadRecentLibrary();
                this.isRecovering = false;
            } catch (fallbackError) {
                console.error('PWA: Fallback also failed', fallbackError);
                this.showErrorModal(
                    'We\'re having trouble loading content. ' +
                    'Please check your connection or try the reset option.'
                );
            }
        }, 2000);
    }

    // NEW: Clear cache for specific URL
    async clearCacheForUrl(url) {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const key of cacheNames) {
                    const cache = await caches.open(key);
                    const requests = await cache.keys();
                    for (const request of requests) {
                        if (request.url.includes(url.split('?')[0])) { // Ignore query params
                            await cache.delete(request);
                            console.log('PWA: Cleared cache for', request.url);
                        }
                    }
                }
            }
        } catch (error) {
            console.log('PWA: Cache clearing failed', error);
        }
    }

    // NEW: App install prompt for Android
    checkAppInstallPrompt() {
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source');
        
        const isDeepLink = source === 'deeplink';
        const isAndroid = /Android/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isDeepLink && isAndroid && !isStandalone) {
            // This is a deep link opened in browser on Android
            // Show install prompt after a delay
            setTimeout(() => {
                this.showAppInstallPrompt();
            }, 3000);
        }
    }

    // NEW: App install prompt
    showAppInstallPrompt() {
        if (confirm('Get the full app experience from Play Store?')) {
            // Redirect to Play Store when available
            // For now, just inform the user
            alert('App coming soon to Play Store!');
        }
    }

    // NEW: Error modal
    showErrorModal(message) {
        // Remove existing modals
        document.querySelectorAll('.pwa-error-modal').forEach(modal => modal.remove());
        
        const modal = document.createElement('div');
        modal.className = 'pwa-error-modal';
        modal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000; max-width: 300px; text-align: center; border-left: 4px solid #ff4444;
        `;
        modal.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #333;">Oops!</h3>
            <p style="margin: 0 0 15px 0; color: #666; line-height: 1.4;">${message}</p>
            <button onclick="this.closest('.pwa-error-modal').remove()" 
                    style="background: #007bff; color: white; border: none; padding: 8px 16px; 
                        border-radius: 4px; cursor: pointer;">OK</button>
        `;
        document.body.appendChild(modal);
    }

    async loadCriticalResources() {
        // Load search functionality
        this.search = new LibrarySearch();
        
        // WAIT for search to load before proceeding
        console.log('PWA: Waiting for library search to load...');
        await this.search.loadLibraryRegistry();
        console.log('PWA: Library search loaded, registry:', this.search.libraryRegistry);
        
        // Initialize basic event listeners
        this.setupCriticalEventListeners();
        
        // Load initial content based on URL or recent library
        await this.handleInitialLoad();
    }
    
    deferNonCriticalInit() {
        // Use requestIdleCallback for non-critical tasks
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.uiExtractor = new UIExtractor(this);
                this.setupNonCriticalEventListeners();
                this.setupScrollBehavior();
                // this.setupPolicyLinks();
                this.setupMessageListener();
            });
        } else {
            // Fallback: delay non-critical init
            setTimeout(() => {
                this.uiExtractor = new UIExtractor(this);
                this.setupNonCriticalEventListeners();
                this.setupScrollBehavior();
                // this.setupPolicyLinks();
                this.setupMessageListener();
            }, 1000);
        }
    }
    
    setupCriticalEventListeners() {
        // Only essential listeners for initial load
        this.clientFrame.addEventListener('load', () => this.onFrameLoad());
        this.clientFrame.addEventListener('loadstart', () => this.showLoading());
        
        // Essential footer controls
        this.librarySearchTrigger.addEventListener('click', () => this.showLibrarySearch());
        this.appMenuTrigger.addEventListener('click', () => this.showAppMenu());
    }
    
    setupNonCriticalEventListeners() {
        // All other non-essential listeners
        // this.sidepaneToggle.addEventListener('click', () => this.toggleClientSidepane());
        
        // Header controls (right side)
        this.shareBtn.addEventListener('click', () => this.shareCurrentLibrary());
        this.reloadBtn.addEventListener('click', () => this.clientFrame.src = this.clientFrame.src);
        // Back button navigation
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.handleBackNavigation());
        }
        
        // Library search modal
        this.librarySearchInput.addEventListener('input', (e) => this.handleLibrarySearch(e.target.value));
        this.closeLibrarySearch.addEventListener('click', () => this.hideLibrarySearch());
        this.librarySearchBackdrop.addEventListener('click', () => this.hideLibrarySearch());
        
        // App menu modal
        this.closeAppMenu.addEventListener('click', () => this.hideAppMenu());
        this.appMenuBackdrop.addEventListener('click', () => this.hideAppMenu());
        this.clearAppData.addEventListener('click', () => this.clearPreferencesHandler());
        this.fullReset = document.getElementById('fullReset');
        this.fullReset.addEventListener('click', () => this.fullResetHandler());        
    }

    async onFrameLoad() {
        this.hideLoading();
        this.saveRecentLibrary(this.clientFrame.src);
        await this.staggerUIAdjustments();
        this.setupContentChangeMonitoring();
    }
    
    // In your staggerUIAdjustments method, add small delays between operations
    async staggerUIAdjustments() {
        // Add yield points to break up work
        await this.yieldToMainThread();
        
        // Phase 1: Styles
        if (window.pwaStyleInjector) {
            await window.pwaStyleInjector.injectStyles(this.clientFrame.contentDocument);
        }
        
        await this.yieldToMainThread(30); // 30ms delay
        
        // Phase 2: Clear filters
        if (this.uiExtractor) {
            await this.uiExtractor.extractClearFiltersButton(this.clientFrame.contentDocument);
        }
        
        await this.yieldToMainThread(30);
        
        // Phase 3: Social links (deferred)
        if (this.uiExtractor) {
            this.uiExtractor.scheduleExtraction('extractSocialLinks');
        }
    }

    setupContentChangeMonitoring() {
        let lastUrl = this.clientFrame.src;
        
        const checkForUrlChange = () => {
            try {
                const currentUrl = this.clientFrame.src;
                if (currentUrl !== lastUrl) {
                    console.log('PWA: URL changed, reapplying UI adjustments');
                    lastUrl = currentUrl;
                    this.staggerUIAdjustments();
                }
            } catch (error) {
                // Ignore cross-origin errors
            }
        };
        
        // Check for URL changes every 500ms
        this.urlCheckInterval = setInterval(checkForUrlChange, 500);
        
        // Also listen for navigation events from the iframe
        window.addEventListener('message', (event) => {
            if (event.data?.type === 'CONTENT_CHANGED' || event.data?.type === 'PAGE_NAVIGATED') {
                console.log('PWA: Content change detected via message');
                setTimeout(() => this.staggerUIAdjustments(), 100);
            }
        });
    } 
       
    // Helper method to yield to main thread
    yieldToMainThread(ms = 0) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    setupPerformanceMonitoring() {
        // Monitor long tasks
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // 50ms threshold
                        console.warn('PWA: Long task detected', entry);
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        }
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

    // setupPolicyLinks() {
    //     const policyLinks = document.querySelectorAll('.menu-item[href]');
    //     policyLinks.forEach(link => {
    //         link.replaceWith(link.cloneNode(true));
    //     });
        
    //     document.querySelectorAll('.menu-item[href]').forEach(link => {
    //         link.addEventListener('click', (e) => {
    //             e.preventDefault();
    //             e.stopPropagation();
                
    //             const url = link.href;
    //             console.log('PWA: Opening policy link externally:', url);
                
    //             if (navigator.userAgent.includes('Android') && window.Android) {
    //                 window.Android.openInBrowser(url);
    //             } else {
    //                 const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    //                 if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    //                     window.location.href = url;
    //                 }
    //             }
    //         });
    //     });
    // }

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
            // FIX: Make non-clickable and add proper styling
            this.librarySearchResults.innerHTML = '<div class="search-result-item no-results">No libraries found</div>';
        } else {
            this.librarySearchResults.innerHTML = results.map(lib => `
                <div class="search-result-item" data-path="${lib.path}">
                    <div class="search-result-name">${lib.name}</div>
                    <div class="search-result-desc">${lib.description}</div>
                </div>
            `).join('');
            
            // FIX: Only add click listeners to valid library items
            this.librarySearchResults.querySelectorAll('.search-result-item[data-path]').forEach(item => {
                item.addEventListener('click', () => {
                    const path = item.getAttribute('data-path');
                    
                    // Find the library by path to get the ID, then use loadLibraryById
                    const library = this.search.getLibraryByPath(path);
                    if (library) {
                        this.loadLibraryById(library.id); // This will update the display
                    } else {
                        this.loadClient(path); // Fallback
                    }
                    
                    this.hideLibrarySearch();
                });
            });
        }
    }
    
    updateRecentLibraries() {
        try {
            const recent = JSON.parse(localStorage.getItem('pwa_recent_libraries') || '[]');
            const validRecentLibraries = recent.slice(0, 3).filter(path => {
                const library = this.search.getLibraryByPath(path);
                return library !== null && library !== undefined;
            });
            
            let recentHtml = '';
            
            if (validRecentLibraries.length > 0) {
                recentHtml = validRecentLibraries.map(path => {
                    const library = this.search.getLibraryByPath(path);
                    return library ? `
                        <div class="search-result-item" data-path="${library.path}">
                            <div class="search-result-name">${library.name}</div>
                            <div class="search-result-desc">${library.description}</div>
                        </div>
                    ` : '';
                }).join('');
            }
            
            this.recentLibraries.innerHTML = recentHtml ? `
                <h3>Recently Viewed</h3>
                ${recentHtml}
            ` : '<div class="search-result-item no-results">No recent libraries</div>';
            
            // FIX: Update click handlers to use loadLibraryById
            this.recentLibraries.querySelectorAll('.search-result-item[data-path]').forEach(item => {
                item.addEventListener('click', () => {
                    const path = item.getAttribute('data-path');
                    
                    // Find the library by path to get the ID
                    const library = this.search.getLibraryByPath(path);
                    if (library) {
                        this.loadLibraryById(library.id); // This will update the display
                    } else {
                        this.loadClient(path); // Fallback
                    }
                    
                    this.hideLibrarySearch();
                });
            });
        } catch (error) {
            console.log('PWA: Could not load recent libraries', error);
            this.recentLibraries.innerHTML = '<div class="search-result-item no-results">Error loading recent libraries</div>';
        }
    }    

    updateLibraryDisplay() {
        console.log('PWA: updateLibraryDisplay called');
        console.log('PWA: currentLibraryId:', this.currentLibraryId);
        
        if (!this.libraryNameElement) {
            console.error('PWA: libraryNameElement not found!');
            return;
        }
        
        if (this.currentLibraryId && this.search?.isLoaded) {
            const library = this.search.getLibraryById(this.currentLibraryId);
            console.log('PWA: Library found:', library);
            if (library) {
                this.libraryNameElement.textContent = library.name;
                this.libraryNameElement.style.opacity = '1';
                console.log('PWA: Updated library name to:', library.name);
                return;
            }
        }
        
        // Show loading or default state
        this.libraryNameElement.textContent = 'Select a Library';
        this.libraryNameElement.style.opacity = '0.7';
        console.log('PWA: Set default library name');
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
    
    clearPreferencesHandler() {
        openConfirmationModal(
            'Clear preferences?',
            'This will:\n• Reset your app settings\n• Clear search history\n• Keep your recent libraries',
            () => {
                // Clear preferences logic
                const recentLibraries = localStorage.getItem('pwa_recent_libraries');
                
                localStorage.clear();
                
                if (recentLibraries) {
                    localStorage.setItem('pwa_recent_libraries', recentLibraries);
                }
                
                localStorage.setItem('pwa_version', this.APP_VERSION);
                
                this.hideAppMenu();
                
                // Show success
                openConfirmationModal(
                    'Success',
                    'Preferences cleared successfully!\n\nLoading default library...',
                    () => {
                        window.location.href = '/wrapper.html';
                    },
                    null,
                    'success'
                );
            },
            null,
            'warning'
        );
    }
        
    hideConfirmationModal() {
        document.getElementById('confirmBackdrop').classList.remove('active');
        document.getElementById('confirmModal').classList.remove('active');
    }

    // Client loading and state management
    async loadClient(url) {
        this.showLoading();
        console.log('PWA: Loading client URL:', url);
        
        try {
            this.clientFrame.src = url;
            
            // Wait for frame to load
            await new Promise((resolve) => {
                this.clientFrame.onload = () => {
                    this.hideLoading();
                    this.saveRecentLibrary(url);
                    resolve();
                };
                
                this.clientFrame.onerror = () => {
                    this.hideLoading();
                    console.error('PWA: Failed to load URL:', url);
                    resolve(); // Still resolve to avoid hanging
                };
            });
        } catch (error) {
            console.error('PWA: Error loading client:', error);
            this.hideLoading();
        }
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
        let shareUrl;
        if (library) {
            // Use query parameter format for sharing - full deep link with domain
            shareUrl = `https://my-pvl.com/wrapper.html?l=${library.id}`;
        } else {
            shareUrl = currentUrl;
        }
        const libraryName = library ? library.name : 'Music Video Library';
        const shareTitle = `My Personal Video Library - ${libraryName}`;
        const shareText = 'Check out this amazing video collection on My PVL!';
        try {
            // Prefer Android native share if available
            if (window.AndroidInterface && typeof window.AndroidInterface.shareLibrary === 'function') {
                setTimeout(() => {
                    window.AndroidInterface.shareLibrary(shareUrl, shareTitle, shareText);
                }, 0);
                return;
            }
            if (typeof Android !== 'undefined' && Android && typeof Android.shareLibrary === 'function') {
                Android.shareLibrary(shareUrl, shareTitle, shareText);
                return;
            } else if (window.Android && typeof window.Android.shareLibrary === 'function') {
                window.Android.shareLibrary(shareUrl, shareTitle, shareText);
                return;
            }
            // Fallback to Web Share API
            const shareData = {
                title: shareTitle,
                text: shareText,
                url: shareUrl,
            };
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareUrl);
                alert('Library URL copied to clipboard!');
            }
        } catch (error) {
            console.error('PWA: Share error:', error);
        }
    }

    handleBackNavigation() {
        if (this.clientFrame && this.historyPointer > -1) {
            this.clientFrame.src = this.iframeHistory[this.historyPointer];
            this.historyPointer--;
            // Update library display after navigation
            this.updateLibraryDisplay();
        } else {
            // Fallback: reload default library
            this.loadRecentLibrary();
        }
    }

    showShareFallback(url, title, text) {
        // Try Android native share one more time as fallback
        if (typeof Android !== 'undefined' && Android && typeof Android.shareLibrary === 'function') {
            console.log('PWA: Fallback using Android native share');
            Android.shareLibrary(url, title, text);
            return;
        }
        
        // Create WhatsApp, Email, and copy options
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
        const emailLink = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        
        // Create a simple share menu
        const shareMenu = document.createElement('div');
        shareMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 280px;
            animation: slideUp 0.3s ease-out;
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        }

    showShareFallback(url, title, text) {
        // Try Android native share one more time as fallback
        if (typeof Android !== 'undefined' && Android && typeof Android.shareLibrary === 'function') {
            console.log('PWA: Fallback using Android native share');
            Android.shareLibrary(url, title, text);
            return;
        }
        
        // Create WhatsApp, Email, and copy options
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
        const emailLink = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        
        // Create a simple share menu
        const shareMenu = document.createElement('div');
        shareMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            min-width: 280px;
            animation: slideUp 0.3s ease-out;
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        `;
        
        const title_el = document.createElement('h3');
        title_el.textContent = 'Share Library';
        title_el.style.cssText = 'margin: 0 0 15px 0; font-size: 18px;';
        shareMenu.appendChild(title_el);
        
        const options = [
            {
                name: 'WhatsApp',
                icon: '💬',
                action: () => window.open(whatsappLink, '_blank')
            },
            {
                name: 'Email',
                icon: '✉️',
                action: () => window.open(emailLink)
            },
            {
                name: 'Copy Link',
                icon: '📋',
                action: () => {
                    navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard!');
                }
            }
        ];
        
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                display: flex;
                align-items: center;
                width: 100%;
                padding: 12px;
                margin-bottom: 10px;
                border: none;
                border-radius: 8px;
                background: #f0f0f0;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            `;
            btn.innerHTML = `<span style="font-size: 20px; margin-right: 10px;">${option.icon}</span>${option.name}`;
            btn.onmouseover = () => btn.style.background = '#e0e0e0';
            btn.onmouseout = () => btn.style.background = '#f0f0f0';
            btn.onclick = () => {
                option.action();
                cleanup();
            };
            shareMenu.appendChild(btn);
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cancel';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: #ddd;
            cursor: pointer;
            font-size: 14px;
            margin-top: 5px;
        `;
        closeBtn.onclick = cleanup;
        shareMenu.appendChild(closeBtn);
        
        const cleanup = () => {
            overlay.remove();
            shareMenu.remove();
        };
        
        overlay.onclick = cleanup;
        
        document.body.appendChild(overlay);
        document.body.appendChild(shareMenu);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translate(-50%, -40%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }
        `;
        document.head.appendChild(style);
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
    
    async loadRecentLibrary() {
        try {
            const recent = JSON.parse(localStorage.getItem('pwa_recent_libraries') || '[]');
            if (recent.length > 0) {
                const recentPath = recent[0];
                console.log('PWA: Loading recent library:', recentPath);
                
                // Extract library ID from path
                const library = this.search.getLibraryByPath(recentPath);
                if (library) {
                    this.currentLibraryId = library.id;
                    this.updateLibraryDisplay(); // Update display HERE
                }
                
                this.clientFrame.src = recentPath;
            } else {
                console.log('PWA: No recent libraries, using default');
                this.updateLibraryDisplay(); // Update for default state
            }
        } catch (error) {
            console.log('PWA: Could not load recent library', error);
            this.updateLibraryDisplay(); // Update for error state
        }
    }

    detectPerformanceMode() {
        const isLowEndDevice = 
            navigator.hardwareConcurrency <= 4 ||
            (navigator.deviceMemory || 4) <= 4 ||
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        return isLowEndDevice ? 'conservative' : 'normal';
    }

    setupBatteryOptimizations() {
        if (this.performanceMode === 'conservative') {
            this.reduceAnimations();
        }
        this.setupBatteryMonitoring();
    }

    reduceAnimations() {
        const reducedMotionCSS = `
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
            .app-header {
                transition: none !important;
            }
        `;
        const style = document.createElement('style');
        style.textContent = reducedMotionCSS;
        document.head.appendChild(style);
    }

    setupBatteryMonitoring() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    this.handleBatteryLevel(battery.level);
                });
                this.handleBatteryLevel(battery.level);
            });
        }
    }

    handleBatteryLevel(level) {
        if (level < 0.2) {
            this.enablePowerSavingMode();
        }
    }

    enablePowerSavingMode() {
        console.log('PWA: Enabling power saving mode');
        if (this.frameRateMonitor) {
            clearInterval(this.frameRateMonitor);
        }
    }

    setupVisibilityMonitoring() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.enterBackgroundMode();
            } else {
                this.enterForegroundMode();
            }
        });
    }

    enterBackgroundMode() {
        this.isBackground = true;
        console.log('PWA: Entering background mode');
    }

    enterForegroundMode() {
        this.isBackground = false;
        console.log('PWA: Entering foreground mode');
    }

    setupMemoryManagement() {
        if ('memory' in performance) {
            setInterval(() => {
                const usedJSHeapSize = performance.memory.usedJSHeapSize;
                const limit = performance.memory.jsHeapSizeLimit;
                if (usedJSHeapSize > limit * 0.8) {
                    this.triggerGarbageCollection();
                }
            }, 30000);
        }
    }

    triggerGarbageCollection() {
        console.log('PWA: Memory pressure detected');
        if (window.gc) {
            window.gc();
        }
        if (this.uiExtractor) {
            this.uiExtractor.clearCache();
        }
    }

    async checkForUpdates() {
        const storedVersion = localStorage.getItem('pwa_version');
        console.log('PWA: Version check - stored:', storedVersion, 'current:', this.APP_VERSION);
        
        // Handle first load or corrupted version
        if (!storedVersion || storedVersion === 'undefined' || storedVersion === 'null') {
            console.log('PWA: First load, setting version to', this.APP_VERSION);
            localStorage.setItem('pwa_version', this.APP_VERSION);
            return; // Don't trigger update on first load
        }
        
        // Version changed - handle update
        if (storedVersion !== this.APP_VERSION) {
            console.log(`PWA: New version detected (${storedVersion} -> ${this.APP_VERSION}). Clearing caches...`);
            
            // Update version FIRST to prevent infinite loop
            localStorage.setItem('pwa_version', this.APP_VERSION);
            
            // Clear caches (milder than full reset)
            await this.clearAllCaches();
            
            console.log('PWA: Version update complete, reloading...');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            console.log('PWA: Version is current:', this.APP_VERSION);
        }
    }

    async clearAllCaches() {
        try {
            // Clear service worker caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => {
                        console.log(`PWA: Deleting cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    })
                );
            }
            
            console.log('PWA: All caches cleared');
        } catch (error) {
            console.error('PWA: Error clearing caches', error);
        }
    }

    async forceSWUpdate() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Send skip waiting message to activate immediately
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                
                // Force update check
                await registration.update();
                
                console.log('PWA: Service Worker update forced');
                
                // Only reload if there was a previous version (not first load)
                const storedVersion = localStorage.getItem('pwa_version');
                if (storedVersion && storedVersion !== 'undefined') {
                    setTimeout(() => {
                        console.log('PWA: Reloading to apply update...');
                        window.location.reload();
                    }, 1000);
                }
                
            } catch (error) {
                console.error('PWA: Failed to force SW update', error);
            }
        }
    }

    fullResetHandler() {
        openConfirmationModal(
            'Full reset?',
            'This will:\n• Clear ALL app data\n• Clear ALL cache\n• Reset to main site\n• Requires internet connection',
            () => {
                this.showLoading();
                const resetBtn = document.getElementById('fullReset');
                const originalText = resetBtn.innerHTML;
                resetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting...';
                resetBtn.disabled = true;
                
                // Clear everything
                localStorage.clear();
                sessionStorage.clear();
                
                this.clearAllIndexedDB();
                this.unregisterServiceWorker();
                this.clearAllCaches();
                
                setTimeout(() => {
                    resetBtn.innerHTML = originalText;
                    resetBtn.disabled = false;
                    this.hideLoading();
                    
                    openConfirmationModal(
                        'Reset Complete',
                        '✅ Full reset complete!\n\nLoading fresh from server...',
                        () => {
                            window.location.href = '/wrapper.html';
                        },
                        null,
                        'success'
                    );
                }, 2000);
            },
            null,
            'danger'
        );
    }

    clearAllIndexedDB() {
        if (window.indexedDB) {
            // Modern browsers
            if (indexedDB.databases) {
                indexedDB.databases().then(databases => {
                    databases.forEach(db => {
                        indexedDB.deleteDatabase(db.name);
                        console.log(`PWA: Deleted IndexedDB: ${db.name}`);
                    });
                }).catch(() => {
                    this.fallbackClearIndexedDB();
                });
            } else {
                // Fallback for older browsers
                this.fallbackClearIndexedDB();
            }
        }
    }

    fallbackClearIndexedDB() {
        // Try to delete known database names
        const knownDBs = ['pwa-wrapper', 'library-cache', 'video-cache', 'app-database'];
        knownDBs.forEach(dbName => {
            try {
                indexedDB.deleteDatabase(dbName);
                console.log(`PWA: Deleted IndexedDB: ${dbName}`);
            } catch (e) {
                console.log(`PWA: Could not delete ${dbName}:`, e);
            }
        });
    }

    unregisterServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                    console.log('PWA: Unregistered service worker');
                });
            });
        }
    }    
}

function openConfirmationModal(title, message, confirmCallback, cancelCallback, modalType = '') {
    // Set content
    document.getElementById('confirmTitle').innerHTML = 
        `<i class="fa-solid fa-question-circle"></i> ${title}`;
    document.getElementById('confirmMessage').textContent = message;
    
    // Set modal type for styling
    const modal = document.getElementById('confirmModal');
    modal.className = 'link-settings-modal'; // Reset classes
    if (modalType) {
        modal.classList.add(modalType);
    }
    
    // Show modal
    document.getElementById('confirmBackdrop').classList.add('active');
    modal.classList.add('active');
    
    // Setup close handlers
    const closeModal = () => {
        document.getElementById('confirmBackdrop').classList.remove('active');
        document.getElementById('confirmModal').classList.remove('active');
        removeEventListeners();
        if (cancelCallback) cancelCallback();
    };
    
    document.getElementById('closeConfirmModal').addEventListener('click', closeModal);
    document.getElementById('confirmCancel').addEventListener('click', closeModal);
    document.getElementById('confirmBackdrop').addEventListener('click', closeModal);
    
    // OK Button
    document.getElementById('confirmOK').addEventListener('click', function() {
        document.getElementById('confirmBackdrop').classList.remove('active');
        document.getElementById('confirmModal').classList.remove('active');
        removeEventListeners();
        if (confirmCallback) confirmCallback();
    });
    
    // Store references to remove later (following your pattern)
    function removeEventListeners() {
        // Event listeners will be garbage collected
    }
}

// ===== COLLAPSIBLE MENU FUNCTIONALITY =====
function initCollapsibleMenu() {
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    });
}

// ===== LINK SETTINGS MODAL FUNCTIONALITY =====
function initLinkSettingsModal() {
    const openLinkSettingsBtn = document.getElementById('openLinkSettings');
    if (openLinkSettingsBtn) {
        openLinkSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openLinkSettingsModal();
        });
    }
}

function openLinkSettingsModal() {
    // Show modal
    document.getElementById('linkSettingsBackdrop').classList.add('active');
    document.getElementById('linkSettingsModal').classList.add('active');
    
    // Setup close handlers
    const closeModal = () => {
        document.getElementById('linkSettingsBackdrop').classList.remove('active');
        document.getElementById('linkSettingsModal').classList.remove('active');
        removeEventListeners();
    };
    
    document.getElementById('closeLinkSettings').addEventListener('click', closeModal);
    document.getElementById('cancelLinkSettings').addEventListener('click', closeModal);
    document.getElementById('linkSettingsBackdrop').addEventListener('click', closeModal);
    
    // CTA Button - OPEN ANDROID SETTINGS
    document.getElementById('openAndroidSettings').addEventListener('click', function() {
        if (/; wv\)/.test(navigator.userAgent)) {
            // In Android app - open settings directly
            if (window.Android && typeof window.Android.openLinkSettings === 'function') {
                window.Android.openLinkSettings();
            } else {
                alert('Android interface not available. Please manually enable "Open supported links" in app settings.');
            }
        } else {
            // In browser
            alert('Please install the My PVL app from Play Store, then enable "Open supported links" in app settings.');
        }
        closeModal();
    });
    
    // Store references to remove later
    function removeEventListeners() {
        // Event listeners will be garbage collected when modal is removed from DOM
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCollapsibleMenu();
    initLinkSettingsModal();
    window.pwaWrapper = new PWAWrapper(); 
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swPath = '/js/sw.js'; // Correct path to your service worker
        
        // First, check if the service worker file exists
        fetch(swPath, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    // File exists, register it with the correct path
                    return navigator.serviceWorker.register(swPath);
                } else {
                    // File doesn't exist, skip registration
                    console.log('PWA: Service Worker file not found at', swPath);
                    return Promise.reject('SW file not found');
                }
            })
            .then((registration) => {
                console.log('PWA: ServiceWorker registered successfully at', swPath);
                
                // Optional: Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('PWA: New Service Worker found');
                });
            })
            .catch((error) => {
                console.log('PWA: ServiceWorker registration skipped -', error);
            });
    });
}

