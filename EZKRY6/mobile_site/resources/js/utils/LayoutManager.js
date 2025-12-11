/**
 * LayoutManager - Comprehensive layout management
 * Handles: 
 * 1. Footer overlap prevention for main content
 * 2. Sidebar height adjustment for footer
 * 3. Safe area insets for mobile
 * 4. Responsive layout updates
 */
class LayoutManager {
    constructor() {
        this.footer = document.getElementById('modernFooter');
        this.sidebar = document.getElementById('sidebar');
        this.appContent = document.getElementById('main-content');
        this.videoGrid = document.getElementById('videoGrid');
        this.categoryList = document.getElementById('categoryList');
        
        // State
        this.footerHeight = 0;
        this.headerHeight = 0;
        this.safeAreaBottom = 0;
        this.initialized = false;
        
        // Configuration
        this.config = {
            extraPadding: 30, // Extra space between content and footer
            minSidebarHeight: 300, // Minimum sidebar height
            updateDebounceMs: 100,
            debug: false // Set to true for debugging
        };
        
        this.init();
    }
    
    init() {
        if (!this.footer) {
            console.warn('LayoutManager: Footer not found');
            return;
        }
        
        // Calculate initial dimensions
        this.calculateDimensions();
        
        // Apply all layout fixes
        this.applyAllFixes();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up mutation observers
        this.setupMutationObservers();
        
        this.initialized = true;
        
        if (this.config.debug) {
            console.log('🎯 LayoutManager initialized');
            this.logDimensions();
        }
    }
    
    // ===== DIMENSION CALCULATIONS =====
    
    calculateDimensions() {
        this.footerHeight = this.footer.offsetHeight;
        this.headerHeight = document.querySelector('.app-header')?.offsetHeight || 100;
        this.safeAreaBottom = this.getSafeAreaInsetBottom();
        
        // Adjust for mobile safe areas
        if (window.innerWidth < 768) {
            this.footerHeight += this.safeAreaBottom;
        }
        
        // Update CSS variables
        this.updateCSSVariables();
    }
    
    getSafeAreaInsetBottom() {
        // Try to get from CSS custom property first
        const root = document.documentElement;
        const style = getComputedStyle(root);
        const safeArea = style.getPropertyValue('--safe-area-inset-bottom').trim();
        
        if (safeArea.includes('px')) {
            return parseInt(safeArea) || 0;
        }
        
        // Fallback for browsers without CSS env()
        if ('visualViewport' in window && window.visualViewport) {
            return window.visualViewport.height < window.innerHeight ? 
                   window.innerHeight - window.visualViewport.height : 0;
        }
        
        return 0;
    }
    
    updateCSSVariables() {
        const root = document.documentElement;
        
        // Update footer height variable
        root.style.setProperty('--footer-height', `${this.footerHeight}px`);
        
        // Update sidebar-specific footer height
        root.style.setProperty('--footer-height-sidebar', `${this.footerHeight + 10}px`);
        
        // Update safe padding (footer height + extra)
        const safePadding = this.footerHeight + this.config.extraPadding;
        root.style.setProperty('--footer-safe-padding', `${safePadding}px`);
        
        // Update mobile safe area padding
        const mobileSafePadding = this.footerHeight + this.config.extraPadding + this.safeAreaBottom;
        root.style.setProperty('--sidebar-mobile-bottom-padding', `${mobileSafePadding}px`);
    }
    
    // ===== LAYOUT FIXES =====
    
    applyAllFixes() {
        this.fixMainContentOverlap();
        this.fixSidebarOverlap();
        this.adjustSidebarHeight();
    }
    
    fixMainContentOverlap() {
        // Main content area padding
        if (this.appContent) {
            const paddingNeeded = this.footerHeight + this.config.extraPadding;
            
            // Modern scroll-padding
            this.appContent.style.scrollPaddingBottom = `${paddingNeeded}px`;
            
            // Fallback padding
            const currentPadding = parseInt(getComputedStyle(this.appContent).paddingBottom) || 0;
            if (currentPadding < paddingNeeded) {
                this.appContent.style.paddingBottom = `${paddingNeeded}px`;
            }
        }
        
        // Video grid padding
        if (this.videoGrid) {
            const gridPadding = this.footerHeight + this.config.extraPadding + 10;
            this.videoGrid.style.paddingBottom = `${gridPadding}px`;
        }
    }
    
    fixSidebarOverlap() {
        // Category list padding
        if (this.categoryList) {
            const sidebarPadding = this.footerHeight + this.config.extraPadding + 20;
            this.categoryList.style.paddingBottom = `${sidebarPadding}px`;
        }
        
        // Category tree padding
        const categoryTree = document.querySelector('.category-tree');
        if (categoryTree) {
            const treePadding = this.footerHeight + this.config.extraPadding;
            categoryTree.style.paddingBottom = `${treePadding}px`;
        }
        
        // Last category item margin
        const lastCategory = document.querySelector('.category-item:last-child');
        if (lastCategory) {
            lastCategory.style.marginBottom = `${this.config.extraPadding}px`;
        }
    }
    
    adjustSidebarHeight() {
        if (!this.sidebar) return;
        
        const viewportHeight = window.innerHeight;
        const isMobile = window.innerWidth < 768;
        const isSidebarActive = this.sidebar.classList.contains('active');
        const isSidebarCollapsed = this.sidebar.classList.contains('collapsed');
        
        // Calculate available height for sidebar
        let availableHeight;
        
        if (isMobile) {
            // Mobile: full height minus footer
            availableHeight = viewportHeight - this.footerHeight - this.safeAreaBottom;
        } else {
            // Desktop/Tablet: minus header and footer
            availableHeight = viewportHeight - this.headerHeight - this.footerHeight;
            
            // If sidebar is collapsed, it needs less height
            if (isSidebarCollapsed) {
                availableHeight += 40; // Add some back for collapsed state
            }
        }
        
        // Ensure minimum height
        availableHeight = Math.max(availableHeight, this.config.minSidebarHeight);
        
        // Apply height to sidebar
        if (isMobile && isSidebarActive) {
            // Mobile sidebar when open
            this.sidebar.style.height = `${availableHeight}px`;
            this.sidebar.style.maxHeight = `${availableHeight}px`;
        } else if (!isMobile) {
            // Desktop/Tablet sidebar (always visible or collapsed)
            this.sidebar.style.height = `${availableHeight}px`;
            this.sidebar.style.maxHeight = `${availableHeight}px`;
        }
        
        // Adjust category tree max-height for scrolling
        const categoryTree = this.sidebar.querySelector('.category-tree');
        if (categoryTree) {
            const treeMaxHeight = availableHeight - 50; // Account for padding
            categoryTree.style.maxHeight = `${treeMaxHeight}px`;
            categoryTree.style.overflowY = 'auto';
        }
        
        if (this.config.debug) {
            console.log(`📏 Sidebar height: ${availableHeight}px (mobile: ${isMobile}, active: ${isSidebarActive})`);
        }
    }
    
    // ===== EVENT HANDLING =====
    
    setupEventListeners() {
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), this.config.updateDebounceMs);
        });
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.refresh(), 300);
        });
        
        // Category expansion/collapse
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chevron-container')) {
                setTimeout(() => this.handleCategoryToggle(), 150);
            }
        });
        
        // Sidebar toggle events
        const menuToggle = document.getElementById('menuToggle');
        const closeSidebar = document.getElementById('closeSidebar');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                setTimeout(() => this.handleSidebarToggle(), 300);
            });
        }
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                setTimeout(() => this.handleSidebarToggle(), 300);
            });
        }
    }
    
    setupMutationObservers() {
        // Watch for footer content changes
        if (this.footer) {
            const footerObserver = new MutationObserver(() => {
                setTimeout(() => this.refresh(), 50);
            });
            
            footerObserver.observe(this.footer, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
        // Watch for sidebar class changes (open/close, collapsed/expanded)
        if (this.sidebar) {
            const sidebarObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'class') {
                        setTimeout(() => this.handleSidebarClassChange(), 100);
                    }
                });
            });
            
            sidebarObserver.observe(this.sidebar, { 
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
        // Watch for video grid changes
        if (this.videoGrid) {
            const gridObserver = new MutationObserver(() => {
                setTimeout(() => this.fixMainContentOverlap(), 100);
            });
            
            gridObserver.observe(this.videoGrid, {
                childList: true,
                subtree: false
            });
        }
    }
    
    // ===== EVENT HANDLERS =====
    
    handleResize() {
        const oldFooterHeight = this.footerHeight;
        const oldHeaderHeight = this.headerHeight;
        
        this.calculateDimensions();
        
        // Only refresh if dimensions changed significantly
        if (Math.abs(oldFooterHeight - this.footerHeight) > 5 || 
            Math.abs(oldHeaderHeight - this.headerHeight) > 5) {
            this.refresh();
            
            if (this.config.debug) {
                console.log('🔄 Resize detected, refreshing layout');
                this.logDimensions();
            }
        }
    }
    
    handleCategoryToggle() {
        // When categories expand/collapse, check sidebar
        setTimeout(() => {
            this.checkSidebarOverlap();
            this.adjustSidebarHeight();
        }, 200);
    }
    
    handleSidebarToggle() {
        // When sidebar opens/closes on mobile
        setTimeout(() => {
            this.adjustSidebarHeight();
            this.checkSidebarOverlap();
        }, 350);
    }
    
    handleSidebarClassChange() {
        // When sidebar class changes (collapsed/expanded on desktop)
        setTimeout(() => {
            this.adjustSidebarHeight();
        }, 100);
    }
    
    // ===== UTILITIES =====
    
    checkSidebarOverlap() {
        if (!this.sidebar || !this.footer || !this.categoryList) return;
        
        const footerRect = this.footer.getBoundingClientRect();
        const categories = this.sidebar.querySelectorAll('.category-item');
        let overlappingCount = 0;
        
        categories.forEach((category, index) => {
            const catRect = category.getBoundingClientRect();
            const distanceToFooter = footerRect.top - catRect.bottom;
            
            if (distanceToFooter < 5) { // 5px threshold
                overlappingCount++;
                
                if (this.config.debug) {
                    console.warn(`⚠️ Category ${index + 1} overlapping footer by ${Math.abs(distanceToFooter)}px`);
                }
            }
        });
        
        if (overlappingCount > 0) {
            // Apply extra padding
            const currentPadding = parseInt(this.categoryList.style.paddingBottom) || 0;
            const extraPadding = overlappingCount * 15; // 15px per overlapping category
            const newPadding = currentPadding + extraPadding;
            
            this.categoryList.style.paddingBottom = `${newPadding}px`;
            
            if (this.config.debug) {
                console.log(`➕ Added ${extraPadding}px padding for ${overlappingCount} overlapping categories`);
            }
        }
        
        return overlappingCount;
    }
    
    // ===== PUBLIC METHODS =====
    
    refresh() {
        if (!this.initialized) return;
        
        this.calculateDimensions();
        this.applyAllFixes();
        
        if (this.config.debug) {
            console.log('🔄 LayoutManager refreshed');
            this.logDimensions();
        }
    }
    
    testLayout() {
        console.log('🧪 Running Layout Tests...');
        
        // Test 1: Footer overlap with main content
        const contentTest = this.testContentOverlap();
        
        // Test 2: Sidebar overlap
        const sidebarTest = this.testSidebarOverlap();
        
        // Test 3: Dimensions
        this.logDimensions();
        
        console.log('📊 Test Results:');
        console.log(`  Main Content: ${contentTest ? '✅ OK' : '❌ Overlap detected'}`);
        console.log(`  Sidebar: ${sidebarTest ? '✅ OK' : '❌ Overlap detected'}`);
        
        return contentTest && sidebarTest;
    }
    
    testContentOverlap() {
        if (!this.appContent || !this.footer) return true;
        
        const contentRect = this.appContent.getBoundingClientRect();
        const footerRect = this.footer.getBoundingClientRect();
        
        // Check if content extends into footer area
        return contentRect.bottom <= footerRect.top + 10;
    }
    
    testSidebarOverlap() {
        return this.checkSidebarOverlap() === 0;
    }
    
    logDimensions() {
        console.log('📐 Current Dimensions:');
        console.log(`  Footer: ${this.footerHeight}px`);
        console.log(`  Header: ${this.headerHeight}px`);
        console.log(`  Safe Area Bottom: ${this.safeAreaBottom}px`);
        console.log(`  Viewport: ${window.innerHeight}px x ${window.innerWidth}px`);
    }
    
    // Cleanup
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleResize);
        
        if (this.config.debug) {
            console.log('🗑️ LayoutManager destroyed');
        }
    }
}