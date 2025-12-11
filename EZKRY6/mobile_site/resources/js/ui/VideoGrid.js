// templates/mobile_hybrid/resources/js/ui/VideoGrid.js
class VideoGrid {
    constructor(containerId, videoCore) {
        this.container = document.getElementById(containerId);
        this.core = videoCore;
        this.currentVideos = [];
        this.currentPage = 1;
        this.pageSize = this._calculatePageSize();
        this.isLoading = false;
        this.hasMoreVideos = true;

        // Store rendered cards
        this.renderedCards = new Map();

        // Throttle scroll handler
        this.scrollHandler = this._throttle(this._handleScroll.bind(this), 200);
        this._handleScrollBound = null;
        this.scrollContainer = null;

        this.playerManager = null;  // Will be set by app.js
        this.videoPlayer = null;    // Will be set by app.js        
    }

    async render(videos = null) {
        if (!this.container) return;

        console.log(`VideoGrid.render() called with ${videos?.length || 'all'} videos`);

        // Reset state when new videos provided
        if (videos !== null) {
            this.currentVideos = videos;
            this.currentPage = 1;
            this.hasMoreVideos = videos.length > this.pageSize;
            this.renderedCards.clear();

            // Clear container
            this.container.innerHTML = '';
        }

        // If no videos provided on initial render, get all
        if (this.currentVideos.length === 0) {
            this.currentVideos = this.core.getOrderedVideos();
            this.hasMoreVideos = this.currentVideos.length > this.pageSize;
        }

        console.log(`Total videos to render: ${this.currentVideos.length}, Page size: ${this.pageSize}`);

        // Render first page
        this._renderCurrentPage();

        // Setup lazy loading
        this._setupLazyLoading();

        // Setup scroll pagination if we have more videos
        if (this.hasMoreVideos) {
            this._setupScrollPagination();
        }
    }

    _renderCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.currentVideos.length);
        const pageVideos = this.currentVideos.slice(startIndex, endIndex);

        console.log(`Rendering page ${this.currentPage}: videos ${startIndex}-${endIndex}`);

        let cardsAdded = 0;
        pageVideos.forEach(video => {
            // Only create card if not already rendered
            if (!this.renderedCards.has(video.id)) {
                const card = this._createVideoCard(video);
                this.container.appendChild(card);
                this.renderedCards.set(video.id, card);
                cardsAdded++;
            }
        });

        // Update loading state
        this.hasMoreVideos = endIndex < this.currentVideos.length;

        console.log(`Page ${this.currentPage} rendered. Added ${cardsAdded} cards. Has more: ${this.hasMoreVideos}`);
    }

    _createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;

        // Get category
        const firstCategory = video.category_data?.main_categories?.[0] || 'uncategorized';
        const categoryClass = `category-${firstCategory.replace(/\s+/g, '-').toLowerCase()}`;

        // Check if video is in favorites (we'll need to pass this info)
        const isFavorite = video.isFavorite || false; // Will be set by app.js

        card.innerHTML = `
        <div class="video-thumbnail">
            <img 
                src="${video.thumbnail}" 
                alt="${video.title}"
                onload="this.style.opacity='1'"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22180%22%3E%3Crect fill=%22%232a2a2a%22 width=%22100%25%22 height=%22100%25%22/%3E%3C/svg%3E'"
                style="opacity:0; transition: opacity 0.3s"
            >
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
            <div class="player-container"></div>
        </div>
        <div class="video-info">
            <h3 class="video-title" title="${video.title}">${video.title}</h3>
            <div class="video-meta">
                <span class="video-category ${categoryClass}">
                    ${firstCategory}
                </span>
                <button class="watch-button" data-video-id="${video.id}">
                    <i class="fas fa-play-circle"></i> 
                </button>
                <button class="add-to-playlist-button" data-video-id="${video.id}" title="Add to playlist">
                    <i class="fas fa-plus"></i>
                </button>
                <!-- NEW: Favorite button -->
                <button class="favorite-button ${isFavorite ? 'favorited' : ''}" 
                        data-video-id="${video.id}" 
                        title="${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}">
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
    `;

        // Click handlers - UPDATED to match new design
        const thumbnail = card.querySelector('.video-thumbnail');
        const playOverlay = card.querySelector('.play-overlay');
        const watchButton = card.querySelector('.watch-button');
        const addToPlaylistButton = card.querySelector('.add-to-playlist-button');

        // Quick preview (in-card mini-player)
        thumbnail.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons or player container
            if (e.target.closest('.watch-button') ||
                e.target.closest('.add-to-playlist-button') ||
                e.target.closest('.player-container')) {
                return;
            }
            this._playVideoInCard(video, card);
        });

        // Watch in overlay (full player)
        watchButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this._playVideoInOverlay(video);
        });

        // Add to playlist
        addToPlaylistButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this._addToPlaylist(video);
        });

        const favoriteButton = card.querySelector('.favorite-button');
        favoriteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleFavorite(video);
        });

        return card;
    }

    _setupScrollPagination() {
        console.log('Setting up scroll pagination');

        // Find the actual scroll container (.app-content)
        this.scrollContainer = document.querySelector('.app-content') || window;

        // Remove existing listeners
        if (this._handleScrollBound) {
            this.scrollContainer.removeEventListener('scroll', this._handleScrollBound);
            window.removeEventListener('resize', this._handleScrollBound);
        }

        // Create bound handler if not exists
        if (!this._handleScrollBound) {
            this._handleScrollBound = this._handleScroll.bind(this);
        }

        // Add listeners to correct container
        this.scrollContainer.addEventListener('scroll', this._handleScrollBound);
        window.addEventListener('resize', this._handleScrollBound);

        // Initial check
        setTimeout(() => this._handleScrollBound(), 100);
    }

    _setupLazyLoading() {
        // Simplified - just load images directly
        this.container.querySelectorAll('img').forEach(img => {
            if (!img.complete) {
                img.style.opacity = '0';
                img.onload = () => {
                    img.style.opacity = '1';
                };
                img.onerror = () => {
                    console.warn('Failed to load thumbnail:', img.src);
                    img.style.opacity = '1';
                };
            }
        });
    }

    _handleScroll() {
        if (this.isLoading || !this.hasMoreVideos) {
            return;
        }

        let scrollTop, scrollHeight, clientHeight;

        // Get metrics from correct container
        if (this.scrollContainer === window) {
            scrollTop = window.scrollY || document.documentElement.scrollTop;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
        } else {
            scrollTop = this.scrollContainer.scrollTop;
            scrollHeight = this.scrollContainer.scrollHeight;
            clientHeight = this.scrollContainer.clientHeight;
        }

        // Load when 80% scrolled
        const scrollPercent = (scrollTop + clientHeight) / scrollHeight;

        if (scrollPercent > 0.8) {
            console.log('Scrolled to 80%, loading next page...');
            this._loadNextPage();
        }
    }

    async _loadNextPage() {
        if (this.isLoading || !this.hasMoreVideos) {
            console.log('Cannot load next page');
            return;
        }

        console.log(`Loading page ${this.currentPage + 1}`);
        this.isLoading = true;

        // Show loader
        const loader = document.createElement('div');
        loader.className = 'video-grid-loader';
        loader.innerHTML = '<div class="spinner"></div>';
        loader.style.textAlign = 'center';
        loader.style.padding = '20px';
        this.container.appendChild(loader);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 200));

        // Increment page and render
        this.currentPage++;
        this._renderCurrentPage();

        // Remove loader
        loader.remove();

        this.isLoading = false;

        console.log(`Page ${this.currentPage} loaded successfully`);
    }

    _playVideo(videoId) {
        const event = new CustomEvent('videogrid:play', {
            detail: { videoId }
        });
        this.container.dispatchEvent(event);
        console.log(`Play video: ${videoId}`);
    }

    _openYouTube(url) {
        window.open(url, '_blank');
    }

    _calculatePageSize() {
        const width = window.innerWidth;
        if (width < 640) return 6;      // Mobile
        if (width < 1024) return 12;    // Tablet
        return 24;                      // Desktop
    }

    _throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    updateViewport() {
        const newPageSize = this._calculatePageSize();
        if (newPageSize !== this.pageSize) {
            this.pageSize = newPageSize;
            this.render(this.currentVideos);
        }
    }

    destroy() {
        // Remove scroll listeners
        if (this.scrollContainer && this._handleScrollBound) {
            this.scrollContainer.removeEventListener('scroll', this._handleScrollBound);
        }
        window.removeEventListener('resize', this._handleScrollBound);
    }

    _playVideoInCard(video, card) {
        console.log('Playing video in card:', video.id);

        // Dispatch event for app.js to handle
        const event = new CustomEvent('videogrid:playincard', {
            detail: { video, card }
        });
        this.container.dispatchEvent(event);
    }

    setPlayerManager(manager) {
        this.playerManager = manager;
    }

    setVideoPlayer(player) {
        this.videoPlayer = player;
    }

    _playVideoInOverlay(video) {
        console.log('Playing video in overlay:', video.id);
        const event = new CustomEvent('videogrid:playinoverlay', {
            detail: { video }
        });
        this.container.dispatchEvent(event);
    }

    _addToPlaylist(video) {
        console.log('Adding to playlist:', video.id);
        const event = new CustomEvent('videogrid:addtoplaylist', {
            detail: { video }
        });
        this.container.dispatchEvent(event);
    }

    _toggleFavorite(video) {
        const event = new CustomEvent('videogrid:togglefavorite', {
            detail: { video }
        });
        this.container.dispatchEvent(event);
    }
}