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

        this.youtubePlayer = null;
        this.videoPlayer = null;
        this.playlistManager = null;
        this.playlistManager = null;

        this.currentPlaylist = 'watch_later';
        this.playlistView = null;

        this.currentPlaylistId = null;
        this.currentPlaylistQueue = [];
        this.currentPlaylistIndex = -1;
        this.isPlaylistPlaying = false;

        this.favorites = new Set();
        // Initialize
        this.init();
    }

    // In app.js init()
    async init() {
        try {
            this._showLoading(true);

            // Load data
            await this.core.loadData();

            // Get all videos
            const allVideos = this.core.getOrderedVideos();

            // Initialize components
            this._initCategoryTree();
            this._initVideoGrid(allVideos); // PASS VIDEOS

            this._initEventListeners();

            this._showLoading(false);
            this._updateCounts(allVideos.length, allVideos.length);

            await this._initYouTubePlayer();
            this._initVideoPlayer();
            this._initPlaylistManager();
            this._initPlaylistSystem();
            this._setupPlayerEvents();

            if (this.playlistManager) {
                this._loadFavorites();
            }

        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this._showError('Failed to load videos. Please refresh.');
        }
    }

    // Update _initVideoGrid
    _initVideoGrid(videos) {
        const container = document.getElementById('videoGrid');
        if (!container) {
            console.warn('Video grid container not found');
            return;
        }

        this.videoGrid = new VideoGrid('videoGrid', this.core._core);
        this.videoGrid.render(videos);
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

    _initEventListeners() {
        console.log('Initializing event listeners...');

        const searchBox = document.getElementById('searchBox');
        const clearSearchBtn = document.getElementById('clearSearch');

        // Store references in app scope
        this.searchBox = null;
        let freshSearchBox = null;

        if (searchBox) {
            console.log('🔧 Setting up search box');

            // Clone to clear conflicts
            const parent = searchBox.parentNode;
            const newSearchBox = searchBox.cloneNode(true);
            parent.replaceChild(newSearchBox, searchBox);
            freshSearchBox = document.getElementById('searchBox');
            this.searchBox = freshSearchBox; // Store for later use

            // Store app instance for event handlers
            const appInstance = this;

            // Simple debounce
            let timeoutId;

            freshSearchBox.addEventListener('input', function (e) {
                console.log('⌨️ Search input:', e.target.value);
                clearTimeout(timeoutId);

                timeoutId = setTimeout(() => {
                    const query = e.target.value.trim();
                    console.log('🔍 Executing search for:', query);

                    // Use appInstance, not 'this'
                    appInstance.currentFilters.search = query;
                    appInstance._applyFilters();
                }, 300);
            });

            console.log('✅ Search event listener attached');
            this._initPlaylistViewToggle();
        }

        if (clearSearchBtn) {
            console.log('🔧 Setting up clear search');

            const clearParent = clearSearchBtn.parentNode;
            const newClearBtn = clearSearchBtn.cloneNode(true);
            clearParent.replaceChild(newClearBtn, clearSearchBtn);
            const freshClearBtn = document.getElementById('clearSearch');

            freshClearBtn.addEventListener('click', () => {
                console.log('🧹 Clear search clicked');

                // Use the stored search box reference
                if (this.searchBox) {
                    this.searchBox.value = '';
                    this.searchBox.focus();
                }

                this.currentFilters.search = '';
                this._applyFilters();
            });
        }

        // 3. Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            console.log('🔧 Setting up clear filters button');

            // Clone to clear conflicts
            const clearFiltersParent = clearFiltersBtn.parentNode;
            const newClearFiltersBtn = clearFiltersBtn.cloneNode(true);
            clearFiltersParent.replaceChild(newClearFiltersBtn, clearFiltersBtn);
            const freshClearFiltersBtn = document.getElementById('clearFilters');

            freshClearFiltersBtn.addEventListener('click', () => {
                console.log('🧹 Clear filters clicked');
                this._clearFilters();
            });
        }

        // 4. Sidebar - SIMPLE
        const menuToggle = document.getElementById('menuToggle');
        const closeSidebar = document.getElementById('closeSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        const toggleSidebar = () => this._toggleSidebar();

        if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
        if (closeSidebar) closeSidebar.addEventListener('click', toggleSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);

        console.log('✅ Event listeners initialized');
    }

    _initPlaylistSystem() {
        // 1. Initialize playlist manager (already done in _initPlaylistManager)
        // 2. Add toggle button to header
        this._initPlaylistViewToggle();

        // 3. Initialize playlist view components (if HTML exists)
        if (document.getElementById('playlistView')) {
            this._initPlaylistTabs();
            this._initPlaylistActions();
            this._updatePlaylistCounts();
        } else {
            console.warn('Playlist view HTML not found');
        }
    }

    _initPlaylistManager() {
        this.playlistManager = new PlaylistManager();
        console.log('✅ Playlist Manager initialized');
    }

    _applyFilters() {
        console.log('=== _applyFilters() called ===');
        console.log('Filters:', this.currentFilters);

        let videos;

        if (this.currentFilters.search) {
            console.log(`Searching: "${this.currentFilters.search}"`);
            videos = this.core.searchVideos(this.currentFilters.search, this.currentFilters.category);
            console.log(`Search results: ${videos?.length || 0} videos`);
        }
        else if (this.currentFilters.category) {
            console.log(`Filtering by category: "${this.currentFilters.category}"`);
            videos = this.core.filterByCategory(this.currentFilters.category);
            console.log(`Category results: ${videos?.length || 0} videos`);
        }
        else {
            console.log('Showing all videos');
            videos = this.core.getOrderedVideos();
            console.log(`All videos: ${videos?.length || 0} videos`);
        }

        if (!videos || !Array.isArray(videos)) {
            console.error('No videos returned or not an array:', videos);
            videos = [];
        }

        console.log(`Passing ${videos.length} videos to VideoGrid`);

        if (this.videoGrid) {
            this.videoGrid.render(videos);
        } else {
            console.error('videoGrid not initialized!');
        }

        this._updateCounts(videos.length, this.core.getOrderedVideos().length);
        this._updateFilterStatus();
        this._toggleEmptyState(videos.length === 0);

        // FIXED: Only close sidebar on mobile when category is selected
        if (window.innerWidth < 768 && this.currentFilters.category) {
            console.log('📱 Mobile: Closing sidebar after category selection');
            this._toggleSidebar(false);
        }

        const hasActiveFilters = this.currentFilters.search || this.currentFilters.category;
        this._toggleClearFiltersButton(hasActiveFilters);
        this._updateBulkFavoriteButton(videos.length, hasActiveFilters);
        console.log('=== _applyFilters() complete ===');
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
        if (searchBox) {
            searchBox.value = '';
        }

        // Clear category selection
        if (this.categoryTree) {
            this.categoryTree.clearSelection();
        }

        // Show all videos
        if (this.videoGrid) {
            const allVideos = this.core.getOrderedVideos();
            this.videoGrid.render(allVideos);
        }

        // Update counts
        const totalVideos = this.core.getOrderedVideos().length;
        this._updateCounts(totalVideos, totalVideos);
        this._toggleEmptyState(false);
        this._toggleClearFiltersButton(false);
        this._hideBulkFavoriteButton();
    }

    _updateCounts(visible, total) {
        const visibleCount = document.getElementById('visibleCount');
        const totalCount = document.getElementById('totalCount');

        if (visibleCount) {
            visibleCount.textContent = visible;
            visibleCount.classList.add('count-updated');
            setTimeout(() => visibleCount.classList.remove('count-updated'), 300);
        }

        if (totalCount) {
            totalCount.textContent = total;
        }
    }

    // Optional: Add filter status text
    _updateFilterStatus() {
        const filterStatus = document.getElementById('filterStatus');
        if (!filterStatus) return;

        const { search, category } = this.currentFilters;

        if (search && category) {
            filterStatus.textContent = `"${search}" in ${category}`;
        } else if (search) {
            filterStatus.textContent = `"${search}"`;
        } else if (category) {
            filterStatus.textContent = category;
        } else {
            filterStatus.textContent = 'All videos';
        }
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

    _toggleClearFiltersButton(show) {
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            if (show) {
                clearFiltersBtn.classList.add('visible');
            } else {
                clearFiltersBtn.classList.remove('visible');
            }
        }
    }

    async _initYouTubePlayer() {
        this.youtubePlayer = new YouTubePlayer({
            autoplay: false,
            autoplayNext: true,
            playerVars: {
                rel: 0,
                modestbranding: 1,
                playsinline: 1
            }
        });

        await this.youtubePlayer.initialize();
        console.log('YouTube Player initialized');
    }

    _initVideoPlayer() {
        this.videoPlayer = new VideoPlayer({
            mode: 'overlay',
            autoplay: true,
            showControls: true
        });

        this.videoPlayer.setYouTubePlayer(this.youtubePlayer);
        console.log('Video Player initialized');
    }

    _initPlaylistManager() {
        this.playlistManager = new PlaylistManager();
        console.log('Playlist Manager initialized');
    }

    _setupPlayerEvents() {
        // Listen to VideoGrid events
        if (this.videoGrid && this.videoGrid.container) {
            // In-card playback
            this.videoGrid.container.addEventListener('videogrid:playincard', (e) => {
                this._handleInCardPlayback(e.detail.video, e.detail.card);
            });

            // Overlay playback
            this.videoGrid.container.addEventListener('videogrid:playinoverlay', (e) => {
                this._handleOverlayPlayback(e.detail.video);
            });

            // Add to playlist
            this.videoGrid.container.addEventListener('videogrid:addtoplaylist', (e) => {
                this._handleAddToPlaylist(e.detail.video);
            });
        }

        // Inject player instances into VideoGrid
        if (this.videoGrid) {
            this.videoGrid.setPlayerManager(this.youtubePlayer);
            this.videoGrid.setVideoPlayer(this.videoPlayer);
        }

        if (this.videoGrid && this.videoGrid.container) {
            this.videoGrid.container.addEventListener('videogrid:togglefavorite', (e) => {
                this._handleToggleFavorite(e.detail.video);
            });
        }
    }

    _handleInCardPlayback(video, card) {
        console.log('Playing video in-card:', video.id);

        // Remove playing class from all other cards
        document.querySelectorAll('.video-card.playing').forEach(otherCard => {
            if (otherCard !== card) {
                this._cleanupCardPlayer(otherCard);
            }
        });

        // Get player container
        const playerContainer = card.querySelector('.player-container');
        const thumbnail = card.querySelector('.video-thumbnail');

        if (!playerContainer) {
            console.error('Player container not found in card');
            return;
        }

        // Check if already playing
        if (playerContainer.classList.contains('active')) {
            // Stop playback and cleanup
            this._cleanupCardPlayer(card);
            return;
        }

        // Clear other card players first (redundant but safe)
        document.querySelectorAll('.player-container.active').forEach(container => {
            const parentCard = container.closest('.video-card');
            if (parentCard && parentCard !== card) {
                this._cleanupCardPlayer(parentCard);
            }
        });

        // Clear container
        playerContainer.innerHTML = '';

        // Create player div
        const playerDiv = document.createElement('div');
        playerDiv.id = `mini-player-${Date.now()}-${video.id}`;
        playerContainer.appendChild(playerDiv);

        // Add active classes
        playerContainer.classList.add('active');
        thumbnail.classList.add('has-player');
        card.classList.add('playing');

        // Create mini player
        try {
            this.youtubePlayer.createPlayer(playerDiv.id, video.id, {
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    showinfo: 0,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1
                },
                onStateChange: (event) => {
                    // Clean up when video ends
                    if (event.data === YT.PlayerState.ENDED) {
                        setTimeout(() => {
                            this._cleanupCardPlayer(card);
                        }, 1000);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to create in-card player:', error);
            this._cleanupCardPlayer(card);
        }
    }

    _cleanupCardPlayer(card) {
        if (!card) return;

        const playerContainer = card.querySelector('.player-container');
        const thumbnail = card.querySelector('.video-thumbnail');

        // Stop YouTube player if it exists
        const videoId = card.dataset.videoId;
        if (videoId && this.youtubePlayer) {
            this.youtubePlayer.stop(videoId);
        }

        // Clean up DOM
        if (playerContainer) {
            playerContainer.classList.remove('active');
            playerContainer.innerHTML = '';
        }

        if (thumbnail) {
            thumbnail.classList.remove('has-player');
        }

        // Remove playing class
        card.classList.remove('playing');

        console.log('Cleaned up card player:', card.dataset.videoId);
    }

    _handleOverlayPlayback(video) {
        console.log('Playing video in modal:', video.id);

        // Clean up any in-card players when opening modal
        document.querySelectorAll('.video-card.playing').forEach(card => {
            this._cleanupCardPlayer(card);
        });

        if (this.videoPlayer) {
            // Clear any existing playlist when playing individual video
            this.videoPlayer.clearPlaylist();
            this.videoPlayer.play(video);
        } else {
            // Fallback
            window.open(video.youtube_url, '_blank');
        }
    }


    // Update _handleAddToPlaylist method:
    _handleAddToPlaylist(video) {
        console.log('Adding video to playlist:', video.id);

        if (!this.playlistManager) {
            console.error('Playlist manager not initialized');
            return;
        }

        // For now, always add to "watch_later"
        const added = this.playlistManager.addVideo(video, 'watch_later');

        if (added) {
            // Show notification
            this._showNotification(`Added "${video.title}" to Watch Later`);

            // Update button state if visible
            this._updatePlaylistButtonState(video.id);
        }
    }

    // Update _showNotification to return the notification element
    _showNotification(message, type = 'info', duration = 3000) {
        // Remove any existing notification
        const existing = document.getElementById('playlist-notification');
        if (existing) existing.remove();

        // Create new notification
        const notification = document.createElement('div');
        notification.id = 'playlist-notification';
        notification.className = `playlist-notification ${type}`;
        notification.innerHTML = `
        <span>${message}</span>
        ${duration > 0 ? '<button class="notification-close" aria-label="Close"><i class="fas fa-times"></i></button>' : ''}
    `;

        // Add to body
        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-hide if duration specified
        if (duration > 0) {
            const hideTimeout = setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, duration);

            // Close button handler
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    clearTimeout(hideTimeout);
                    notification.classList.remove('show');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                });
            }
        }

        return notification; // Return reference for updates
    }

    // Helper to update button state
    _updatePlaylistButtonState(videoId) {
        // Find all buttons for this video
        document.querySelectorAll(`.add-to-playlist-button[data-video-id="${videoId}"]`).forEach(button => {
            // Change icon to checkmark
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-check';
                button.title = 'Added to Watch Later';

                // Reset after 2 seconds
                setTimeout(() => {
                    icon.className = 'fas fa-plus';
                    button.title = 'Add to playlist';
                }, 2000);
            }
        });
    }

    _initPlaylistViewToggle() {
        // Check if button already exists
        if (document.getElementById('playlistToggle')) {
            return; // Already initialized
        }

        // Create playlist button
        const playlistBtn = document.createElement('button');
        playlistBtn.id = 'playlistToggle';
        playlistBtn.className = 'header-action-button playlist-toggle';
        playlistBtn.innerHTML = '<i class="fas fa-list"></i><span class="action-text">Playlists</span>';
        playlistBtn.title = 'View Playlists';

        // Try to insert after clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn && clearFiltersBtn.parentNode) {
            clearFiltersBtn.parentNode.insertBefore(playlistBtn, clearFiltersBtn.nextSibling);
        } else {
            // Fallback: insert at end of header actions
            const headerActions = document.querySelector('.header-actions');
            if (headerActions) {
                headerActions.appendChild(playlistBtn);
            }
        }

        // Add click handler
        playlistBtn.addEventListener('click', () => this._togglePlaylistView());

        console.log('✅ Playlist toggle button initialized');
    }

    _togglePlaylistView() {
        if (!this.playlistView) {
            this.playlistView = document.getElementById('playlistView');
            this.playlistBackdrop = document.getElementById('playlistBackdrop');
        }

        const isActive = this.playlistView.classList.contains('active');

        if (!isActive) {
            // SHOW PLAYLIST
            this.playlistView.classList.add('active');
            if (this.playlistBackdrop) {
                this.playlistBackdrop.classList.add('active');
            }
            document.body.classList.add('playlist-open');
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';

            // Load playlist data
            this._loadPlaylist(this.currentPlaylist);

            console.log('Playlist opened');
        } else {
            // HIDE PLAYLIST
            this.playlistView.classList.remove('active');
            if (this.playlistBackdrop) {
                this.playlistBackdrop.classList.remove('active');
            }
            document.body.classList.remove('playlist-open');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';

            console.log('Playlist closed');
        }
    }

    _loadPlaylist(playlistId) {
        if (!this.playlistManager || !this.playlistView) return;

        this.currentPlaylist = playlistId;

        // Update active tab
        document.querySelectorAll('.playlist-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.playlist === playlistId);
        });

        // Update counts
        this._updatePlaylistCounts();

        // Get videos
        const videos = this.playlistManager.getPlaylistVideos(playlistId);
        const container = document.getElementById('playlistVideos');

        if (!container) return;

        if (videos.length === 0) {
            container.innerHTML = `
            <div class="empty-playlist">
                <i class="fas fa-list"></i>
                <p>No videos in this playlist</p>
            </div>
        `;
            return;
        }

        // Render videos
        container.innerHTML = videos.map(video => `
        <div class="playlist-video-item" data-video-id="${video.id}">
            <div class="playlist-video-thumb">
                <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            </div>
            <div class="playlist-video-info">
                <h4 class="playlist-video-title" title="${video.title}">${video.title}</h4>
                <div class="playlist-video-meta">
                    <span>Added: ${new Date(video.addedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <button class="playlist-video-remove" title="Remove from playlist">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

        // Add event listeners
        this._setupPlaylistItemEvents();
    }

    _setupPlaylistItemEvents() {
        const container = document.getElementById('playlistVideos');
        if (!container) return;

        // Play video
        container.addEventListener('click', (e) => {
            const videoItem = e.target.closest('.playlist-video-item');
            if (!videoItem) return;

            const removeBtn = e.target.closest('.playlist-video-remove');
            if (removeBtn) {
                e.stopPropagation();
                this._removeFromPlaylist(videoItem.dataset.videoId);
                return;
            }

            // Play the video
            const videoId = videoItem.dataset.videoId;
            const video = this.core.getVideo(videoId);
            if (video) {
                this._handleOverlayPlayback(video);
            }
        });
    }

    _removeFromPlaylist(videoId) {
        if (!this.playlistManager) return;

        const removed = this.playlistManager.removeVideo(videoId, this.currentPlaylist);

        if (removed) {
            // Remove from UI
            const item = document.querySelector(`.playlist-video-item[data-video-id="${videoId}"]`);
            if (item) item.remove();

            // Show notification
            this._showNotification('Removed from playlist');

            // Update counts
            this._updatePlaylistCounts();

            // If no videos left, show empty state
            const videos = this.playlistManager.getPlaylistVideos(this.currentPlaylist);
            if (videos.length === 0) {
                this._loadPlaylist(this.currentPlaylist);
            }
        }
    }

    _updatePlaylistCounts() {
        if (!this.playlistManager) return;

        // Update count displays
        const watchLaterCount = document.getElementById('watchLaterCount');
        const favoritesCount = document.getElementById('favoritesCount');

        if (watchLaterCount) {
            watchLaterCount.textContent = this.playlistManager.getPlaylistCount('watch_later');
        }

        if (favoritesCount) {
            favoritesCount.textContent = this.playlistManager.getPlaylistCount('favorites');
        }
    }

    // Add tab switching
    _initPlaylistTabs() {
        document.querySelectorAll('.playlist-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const playlistId = tab.dataset.playlist;
                if (playlistId) {
                    this._loadPlaylist(playlistId);
                }
            });
        });
    }

    // Add "Play All" functionality
    _initPlaylistActions() {
        const playAllBtn = document.getElementById('playAllBtn');
        const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');
        const playlistCloseBtn = document.getElementById('playlistClose');

        if (playAllBtn) {
            playAllBtn.addEventListener('click', () => this._playAllFromPlaylist());
        }

        if (clearPlaylistBtn) {
            clearPlaylistBtn.addEventListener('click', () => this._clearCurrentPlaylist());
        }

        if (playlistCloseBtn) {
            playlistCloseBtn.addEventListener('click', () => this._togglePlaylistView());
        }

        this._setupPlaylistContextMenu();
    }

    _playAllFromPlaylist() {
        if (!this.playlistManager) {
            this._showNotification('Playlist manager not available');
            return;
        }

        const playlistId = this.currentPlaylist;
        const videos = this.playlistManager.getPlaylistQueue(playlistId);

        if (videos.length === 0) {
            this._showNotification('Playlist is empty');
            return;
        }

        // Set playlist on video player
        if (this.videoPlayer) {
            this.videoPlayer.setPlaylist(playlistId, videos);

            // Play first video
            const firstVideo = this.core.getVideo(videos[0].id);
            if (firstVideo) {
                this.videoPlayer.play(firstVideo);
            }

            // Close playlist view if open
            this._togglePlaylistView();

            this._showNotification(`Playing playlist: ${videos.length} videos`);
        } else {
            // Fallback to old behavior
            if (videos[0]) {
                const video = this.core.getVideo(videos[0].id);
                if (video) {
                    this._handleOverlayPlayback(video);
                }
            }
        }
    }


    _playVideoFromPlaylist(videoData, index) {
        // Get full video object from core
        const video = this.core.getVideo(videoData.id);
        if (!video) {
            console.error('Video not found:', videoData.id);
            return;
        }

        // Update current index
        this.currentPlaylistIndex = index;

        // Play in video player
        if (this.videoPlayer) {
            this.videoPlayer.play(video);

            // Update player UI with playlist info
            this._updatePlayerPlaylistInfo();
        } else {
            // Fallback
            this._handleOverlayPlayback(video);
        }
    }

    _showPlaylistInfo(playlistId, totalVideos) {
        const playlistInfo = document.getElementById('playlistInfo');
        if (playlistInfo) {
            const playlistName = this.playlistManager.getPlaylistName(playlistId);
            playlistInfo.innerHTML = `
            <div class="current-playlist-info">
                <i class="fas fa-list"></i>
                <span>${playlistName} (${this.currentPlaylistIndex + 1}/${totalVideos})</span>
            </div>
        `;
            playlistInfo.style.display = 'block';
        }
    }

    // New method: Update player UI with playlist controls
    _updatePlayerPlaylistInfo() {
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const playerTitle = document.getElementById('videoModalTitle');

        if (!prevBtn || !nextBtn || !playerTitle) return;

        // Update title with playlist position
        if (this.isPlaylistPlaying && this.currentPlaylistQueue.length > 0) {
            const currentVideo = this.currentPlaylistQueue[this.currentPlaylistIndex];
            if (playerTitle) {
                playerTitle.textContent = `(${this.currentPlaylistIndex + 1}/${this.currentPlaylistQueue.length}) ${currentVideo.title}`;
            }
        }

        // Enable/disable navigation buttons
        if (prevBtn) {
            const hasPrev = this.currentPlaylistIndex > 0;
            prevBtn.disabled = !hasPrev;
            prevBtn.style.opacity = hasPrev ? '1' : '0.5';
            prevBtn.style.cursor = hasPrev ? 'pointer' : 'not-allowed';
        }

        if (nextBtn) {
            const hasNext = this.currentPlaylistIndex < this.currentPlaylistQueue.length - 1;
            nextBtn.disabled = !hasNext;
            nextBtn.style.opacity = hasNext ? '1' : '0.5';
            nextBtn.style.cursor = hasNext ? 'pointer' : 'not-allowed';
        }
    }

    // New method: Play next video in playlist
    _playNextInPlaylist() {
        if (!this.isPlaylistPlaying || !this.currentPlaylistId) {
            return;
        }

        const nextIndex = this.currentPlaylistIndex + 1;
        if (nextIndex >= this.currentPlaylistQueue.length) {
            // End of playlist
            this._showNotification('End of playlist');
            this._resetPlaylistPlayback();
            return;
        }

        const nextVideo = this.currentPlaylistQueue[nextIndex];
        this._playVideoFromPlaylist(nextVideo, nextIndex);
    }

    // New method: Play previous video in playlist
    _playPreviousInPlaylist() {
        if (!this.isPlaylistPlaying || !this.currentPlaylistId) {
            return;
        }

        const prevIndex = this.currentPlaylistIndex - 1;
        if (prevIndex < 0) {
            return; // Already at first video
        }

        const prevVideo = this.currentPlaylistQueue[prevIndex];
        this._playVideoFromPlaylist(prevVideo, prevIndex);
    }

    // New method: Reset playlist playback state
    _resetPlaylistPlayback() {
        this.currentPlaylistId = null;
        this.currentPlaylistQueue = [];
        this.currentPlaylistIndex = -1;
        this.isPlaylistPlaying = false;

        // Clear playlist info from player
        const playlistInfo = document.getElementById('playlistInfo');
        if (playlistInfo) {
            playlistInfo.innerHTML = '';
            playlistInfo.style.display = 'none';
        }

        // Reset player title
        const playerTitle = document.getElementById('videoModalTitle');
        if (playerTitle) {
            playerTitle.textContent = 'Playing Video';
        }

        // Reset navigation buttons
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (prevBtn) {
            prevBtn.disabled = false;
            prevBtn.style.opacity = '1';
            prevBtn.style.cursor = 'pointer';
        }

        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }
    _clearCurrentPlaylist() {
        if (!this.playlistManager) return;

        const count = this.playlistManager.getPlaylistCount(this.currentPlaylist);
        if (count === 0) return;

        if (confirm(`Clear all ${count} videos from this playlist?`)) {
            const cleared = this.playlistManager.clearPlaylist(this.currentPlaylist);
            if (cleared) {
                this._loadPlaylist(this.currentPlaylist);
                this._showNotification(`Cleared ${count} videos`);
                this._updatePlaylistCounts();
            }
        }
    }

    _loadFavorites() {
        if (!this.playlistManager) return;

        const favorites = this.playlistManager.getFavorites();
        this.favorites = new Set(favorites.map(v => v.id));

        console.log(`Loaded ${favorites.length} favorites`);

        // Update video grid if it exists
        this._updateVideoCardsFavorites();
    }

    _updateVideoCardsFavorites() {
        if (!this.videoGrid || !this.videoGrid.container) return;

        // Update each card's favorite button
        const cards = this.videoGrid.container.querySelectorAll('.video-card');
        cards.forEach(card => {
            const videoId = card.dataset.videoId;
            const favoriteButton = card.querySelector('.favorite-button');

            if (favoriteButton && videoId) {
                const isFavorite = this.favorites.has(videoId);

                // Update button state
                favoriteButton.classList.toggle('favorited', isFavorite);
                favoriteButton.title = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';

                const icon = favoriteButton.querySelector('i');
                if (icon) {
                    icon.className = isFavorite ? 'fas fa-heart' : 'far fa-heart';
                }
            }
        });
    }

    _handleToggleFavorite(video) {
        if (!this.playlistManager) {
            console.error('Playlist manager not available');
            return;
        }

        const result = this.playlistManager.toggleFavorite(video);

        if (result.action === 'error') {
            this._showNotification('Error updating favorites', 'error');
            return;
        }

        // Update local favorites set
        if (result.added) {
            this.favorites.add(video.id);
        } else {
            this.favorites.delete(video.id);
        }

        // Update UI
        this._updateVideoCardsFavorites();
        this._updatePlaylistCounts();

        // Show notification
        const message = result.added
            ? `Added "${video.title}" to Favorites`
            : `Removed "${video.title}" from Favorites`;

        this._showNotification(message, result.added ? 'success' : 'info');

        // If in playlist view, refresh if viewing favorites
        if (this.currentPlaylist === 'favorites') {
            this._loadPlaylist('favorites');
        }
    }

    _setupPlaylistContextMenu() {
        const playlistVideos = document.getElementById('playlistVideos');
        if (!playlistVideos) return;

        playlistVideos.addEventListener('contextmenu', (e) => {
            const videoItem = e.target.closest('.playlist-video-item');
            if (!videoItem) return;

            e.preventDefault();

            const videoId = videoItem.dataset.videoId;
            const video = this.core.getVideo(videoId);

            if (!video) return;

            // Show context menu
            this._showPlaylistContextMenu(e.clientX, e.clientY, video);
        });
    }

    _showPlaylistContextMenu(x, y, video) {
        // Remove existing context menu
        const existingMenu = document.getElementById('playlist-context-menu');
        if (existingMenu) existingMenu.remove();

        const isFavorite = this.favorites.has(video.id);

        const menuHTML = `
        <div id="playlist-context-menu" class="playlist-context-menu">
            <button class="context-menu-item play-now" data-action="play">
                <i class="fas fa-play"></i> Play Now
            </button>
            <button class="context-menu-item toggle-favorite" data-action="toggleFavorite">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <button class="context-menu-item remove-from-playlist" data-action="remove">
                <i class="fas fa-trash"></i> Remove from Playlist
            </button>
            <button class="context-menu-item cancel" data-action="cancel">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;

        const menu = document.createElement('div');
        menu.innerHTML = menuHTML;
        document.body.appendChild(menu.firstElementChild);

        const contextMenu = document.getElementById('playlist-context-menu');
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        // Add event listeners
        contextMenu.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const action = button.dataset.action;

            switch (action) {
                case 'play':
                    this._handleOverlayPlayback(video);
                    break;
                case 'toggleFavorite':
                    this._handleToggleFavorite(video);
                    break;
                case 'remove':
                    this._removeFromPlaylist(video.id);
                    break;
                case 'cancel':
                    // Do nothing
                    break;
            }

            contextMenu.remove();
        });

        // Close menu when clicking outside
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 10);
    }

    // Enhanced batch add to favorites
    _batchAddToFavorites() {
        if (!this.playlistManager) {
            this._showNotification('Playlist manager not available', 'error');
            return;
        }

        // Get current filtered videos (same logic as _applyFilters)
        let videos;
        if (this.currentFilters.search) {
            videos = this.core.searchVideos(this.currentFilters.search, this.currentFilters.category);
        } else if (this.currentFilters.category) {
            videos = this.core.filterByCategory(this.currentFilters.category);
        } else {
            // If no filters, use all videos
            videos = this.core.getOrderedVideos();
        }

        if (!videos || videos.length === 0) {
            this._showNotification('No videos to add to favorites', 'info');
            return;
        }

        // Calculate how many are already favorites
        const alreadyFavorites = videos.filter(video => this.favorites.has(video.id));
        const newVideosCount = videos.length - alreadyFavorites.length;

        if (newVideosCount === 0) {
            this._showNotification(`All ${videos.length} videos are already in Favorites`, 'info');
            return;
        }

        // Show confirmation with details
        const confirmMessage = alreadyFavorites.length > 0
            ? `Add ${newVideosCount} new videos to Favorites? (${alreadyFavorites.length} are already in Favorites)`
            : `Add all ${videos.length} filtered videos to Favorites?`;

        if (!confirm(confirmMessage)) {
            return;
        }

        let addedCount = 0;
        let alreadyCount = 0;
        let errorCount = 0;

        // Show progress indicator
        const progressMsg = this._showNotification(`Adding ${newVideosCount} videos...`, 'info', 0);

        // Process in batches for better performance with large lists
        const batchSize = 50;
        const processBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + batchSize, videos.length);

            for (let i = startIndex; i < endIndex; i++) {
                const video = videos[i];

                // Skip if already in favorites
                if (this.favorites.has(video.id)) {
                    alreadyCount++;
                    continue;
                }

                const result = this.playlistManager.toggleFavorite(video);
                if (result.added) {
                    addedCount++;
                    this.favorites.add(video.id);
                } else if (result.action === 'removed') {
                    // Shouldn't happen since we checked, but just in case
                    alreadyCount++;
                } else {
                    errorCount++;
                }
            }

            // Update progress
            if (progressMsg && progressMsg.querySelector('span')) {
                const progressPercent = Math.round((endIndex / videos.length) * 100);
                progressMsg.querySelector('span').textContent =
                    `Adding videos... ${progressPercent}% (${addedCount} added)`;
            }

            // Process next batch or finish
            if (endIndex < videos.length) {
                setTimeout(() => processBatch(endIndex), 0);
            } else {
                // All done
                this._updateVideoCardsFavorites();
                this._updatePlaylistCounts();

                // Close progress notification
                if (progressMsg && progressMsg.parentNode) {
                    progressMsg.remove();
                }

                // Show summary notification
                let message = `Added ${addedCount} videos to Favorites`;
                if (alreadyCount > 0) {
                    message += ` (${alreadyCount} were already in Favorites)`;
                }
                if (errorCount > 0) {
                    message += `, ${errorCount} failed`;
                }

                this._showNotification(message, addedCount > 0 ? 'success' : 'info');

                // Update button text if still showing
                this._updateBulkFavoriteButton(videos.length, true);
            }
        };

        // Start processing
        processBatch(0);
    }

    _addBatchFavoriteButton() {
        // Check if button already exists
        if (document.getElementById('batchFavoriteBtn')) {
            return;
        }

        const bulkBtn = document.createElement('button');
        bulkBtn.id = 'batchFavoriteBtn';
        bulkBtn.className = 'header-action-button batch-favorite';
        bulkBtn.innerHTML = '<i class="fas fa-star"></i><span class="action-text">Add to Favorites</span>';
        bulkBtn.title = 'Add all filtered videos to Favorites';

        // Style adjustments
        bulkBtn.style.display = 'none'; // Hidden by default
        bulkBtn.style.marginLeft = 'auto'; // Push to right
        bulkBtn.style.background = 'linear-gradient(135deg, #f59e0b, #ef4444)';
        bulkBtn.style.color = 'white';
        bulkBtn.style.border = 'none';

        // Insert in header - before playlist button if exists
        const headerActions = document.querySelector('.header-actions');
        const playlistBtn = document.getElementById('playlistToggle');

        if (headerActions) {
            if (playlistBtn && playlistBtn.parentNode === headerActions) {
                headerActions.insertBefore(bulkBtn, playlistBtn);
            } else {
                headerActions.appendChild(bulkBtn);
            }
        }

        // Add click handler
        bulkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._batchAddToFavorites();
        });

        console.log('✅ Bulk favorite button added');
    }

    _hideBulkFavoriteButton() {
        const bulkBtn = document.getElementById('batchFavoriteBtn');
        if (bulkBtn) {
            bulkBtn.style.display = 'none';
        }
    }
    _updateBulkFavoriteButton(filteredCount, hasActiveFilters) {
        const bulkBtn = document.getElementById('batchFavoriteBtn');

        if (!bulkBtn) {
            // Button doesn't exist yet, create it if we have filters
            if (hasActiveFilters && filteredCount > 0) {
                this._addBatchFavoriteButton();
            }
            return;
        }

        if (hasActiveFilters && filteredCount > 0) {
            // Show button with count
            bulkBtn.style.display = 'flex';
            const textSpan = bulkBtn.querySelector('.action-text');
            if (textSpan) {
                textSpan.textContent = `Add ${filteredCount} to Favorites`;
            }
            bulkBtn.title = `Add all ${filteredCount} filtered videos to Favorites`;
        } else {
            // Hide button when no filters or empty results
            bulkBtn.style.display = 'none';
        }
    }

}

// Make available globally
if (typeof window !== 'undefined') {
    window.MobileVideoApp = MobileVideoApp;
}