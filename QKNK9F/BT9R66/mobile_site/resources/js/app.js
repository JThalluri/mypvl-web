// mobile_hybrid/app.js - Complete Implementation
class MobileVideoApp {
    constructor(config) {
        this.config = {
            ...config,
            dataBaseUrl: config.dataBaseUrl || './data/'
        };

        // Core components
        this.core = new MobileVideoCore(this.config);
        this.categoryTree = null;
        this.videoGrid = null;

        // State
        this.currentFilters = {
            category: null,
            search: ''
        };

        // Initialize
        this.init();
    }

    async init() {
        console.log('🚀 MobileVideoApp initializing...');

        try {
            // Show loading
            this._showLoading(true);

            // Load data via MobileVideoCore
            const data = await this.core.loadData();
            console.log('✅ Data loaded:', {
                videos: data.videos.length,
                categories: Object.keys(data.categories).length
            });

            // Initialize UI components
            this._initCategoryTree();
            this._initVideoGrid();
            this._initEventListeners();

            // Hide loading
            this._showLoading(false);
            this._updateCounts(data.videos.length, data.videos.length);

            console.log('✅ MobileVideoApp ready');

        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this._showError('Failed to load videos. Please refresh.');
        }
    }

    _initCategoryTree() {
        const container = document.getElementById('categoryList');
        if (!container) {
            console.warn('Category container not found');
            return;
        }

        // Use VideoCore instance directly (exposed via _core)
        this.categoryTree = new CategoryTree('categoryList', this.core._core);
        this.categoryTree.render();

        // Listen for category selection
        container.addEventListener('categorytree:selected', (e) => {
            this.currentFilters.category = e.detail.categoryPath;
            this._applyFilters();
        });

        console.log('✅ CategoryTree initialized');
    }

    _initVideoGrid() {
        const container = document.getElementById('videoGrid');
        if (!container) {
            console.warn('Video grid container not found');
            return;
        }

        this.videoGrid = new VideoGrid('videoGrid', this.core._core);
        // Show all videos initially
        this.videoGrid.render();

        console.log('✅ VideoGrid initialized');
    }

    _initEventListeners() {
        // Search box
        const searchBox = document.getElementById('searchBox');
        const clearSearchBtn = document.getElementById('clearSearch');

        if (searchBox) {
            // Debounced search
            let searchTimeout;
            searchBox.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value.trim();
                    this._applyFilters();
                }, 300);
            });
        }

        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchBox.value = '';
                this.currentFilters.search = '';
                this._applyFilters();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        const resetFiltersBtn = document.getElementById('resetFilters');

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this._clearFilters());
        }

        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => this._clearFilters());
        }

        // Mobile sidebar toggle
        const menuToggle = document.getElementById('menuToggle');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => this._toggleSidebar(true));
        }

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => this._toggleSidebar(false));
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this._toggleSidebar(false));
        }

        console.log('✅ Event listeners initialized');
    }

    _applyFilters() {
        console.log('Applying filters:', this.currentFilters);

        let videos;

        // Apply search if present
        if (this.currentFilters.search) {
            videos = this.core.searchVideos(
                this.currentFilters.search,
                this.currentFilters.category
            );
        }
        // Apply category filter if present
        else if (this.currentFilters.category) {
            videos = this.core.filterByCategory(this.currentFilters.category);
        }
        // Show all videos
        else {
            videos = this.core.getOrderedVideos();
        }

        // Update UI
        if (this.videoGrid) {
            this.videoGrid.render(videos);
        }

        // Update counts
        this._updateCounts(videos.length, this.core.getOrderedVideos().length);

        // Show/hide empty state
        this._toggleEmptyState(videos.length === 0);

        // Close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            this._toggleSidebar(false);
        }
    }

    _clearFilters() {
        console.log('Clearing all filters');

        // Reset state
        this.currentFilters = {
            category: null,
            search: ''
        };

        // Clear search box
        const searchBox = document.getElementById('searchBox');
        if (searchBox) searchBox.value = '';

        // Clear category selection
        if (this.categoryTree) {
            this.categoryTree.clearSelection();
        }

        // Show all videos
        if (this.videoGrid) {
            this.videoGrid.render();
        }

        // Update counts
        const totalVideos = this.core.getOrderedVideos().length;
        this._updateCounts(totalVideos, totalVideos);
        this._toggleEmptyState(false);
    }

    _updateCounts(visible, total) {
        const visibleEl = document.getElementById('visibleCount');
        const totalEl = document.getElementById('totalCount');

        if (visibleEl) visibleEl.textContent = visible;
        if (totalEl) totalEl.textContent = total;
    }

    _toggleEmptyState(show) {
        const emptyState = document.getElementById('emptyState');
        const videoGrid = document.getElementById('videoGrid');

        if (emptyState) {
            emptyState.style.display = show ? 'block' : 'none';
        }

        if (videoGrid) {
            videoGrid.style.display = show ? 'none' : 'grid';
        }
    }

    _showLoading(show) {
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
    }

    _showError(message) {
        const loadingEl = document.getElementById('loadingIndicator');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button onclick="location.reload()">Retry</button>
            `;
        }
    }

    // Unified sidebar toggle function
    _toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!sidebar) return;

        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile behavior: slide in/out with overlay
            const isActive = sidebar.classList.contains('active');

            if (isActive) {
                sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                document.body.classList.remove('sidebar-open');
            } else {
                sidebar.classList.add('active');
                if (overlay) overlay.classList.add('active');
                document.body.classList.add('sidebar-open');
            }
        } else {
            // Desktop behavior: toggle collapsed state
            const isCollapsed = sidebar.classList.contains('collapsed');

            if (isCollapsed) {
                sidebar.classList.remove('collapsed');
                // Update menu icon if needed
                const menuToggle = document.getElementById('menuToggle');
                if (menuToggle) {
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            } else {
                sidebar.classList.add('collapsed');
                // Update menu icon if needed
                const menuToggle = document.getElementById('menuToggle');
                if (menuToggle) {
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        }
    }

    // Update hamburger menu listener
    _initEventListeners() {
        // Hamburger menu - unified toggle
        const menuToggle = document.getElementById('menuToggle');
        const clearFiltersBtn = document.getElementById('clearFilters');
        const resetFiltersBtn = document.getElementById('resetFilters');

        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this._toggleSidebar();
            });
        }

        // Mobile close button
        const closeSidebar = document.getElementById('closeSidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                this._toggleSidebar();
            });
        }

        // Mobile overlay click to close
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this._toggleSidebar();
            });
        }

        if (clearFiltersBtn) {
            // Remove any existing listeners first
            clearFiltersBtn.replaceWith(clearFiltersBtn.cloneNode(true));
            // Get fresh reference
            const freshClearBtn = document.getElementById('clearFilters');
            freshClearBtn.addEventListener('click', () => {
                console.log('Clear filters button clicked');
                this._clearFilters();
            });
        }

        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                console.log('Reset filters button clicked');
                this._clearFilters();
            });
        }
        // ... rest of event listeners
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.MobileVideoApp = MobileVideoApp;
}