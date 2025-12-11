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
        
        // Intersection Observer for lazy loading
        this.observer = null;
        this.observedImages = new Set();
        
        // Throttle scroll handler
        this.scrollHandler = this._throttle(this._handleScroll.bind(this), 200);
    }
    
    async render(videos = null) {
        if (!this.container) {
            console.error('VideoGrid: Container not found');
            return;
        }
        
        // If no videos provided, get all ordered videos
        this.currentVideos = videos || this.core.getOrderedVideos();
        this.currentPage = 1;
        this.hasMoreVideos = this.currentVideos.length > this.pageSize;
        
        // Clear container
        this.container.innerHTML = '';
        
        // Render first page
        this._renderPage();
        
        // Setup lazy loading
        this._setupLazyLoading();
        
        // Setup scroll pagination if needed
        if (this.currentVideos.length > this.pageSize) {
            this._setupScrollPagination();
        }
        
        console.log(`VideoGrid: Rendered ${Math.min(this.pageSize, this.currentVideos.length)} of ${this.currentVideos.length} videos`);
    }
    
    _renderPage() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.currentVideos.length);
        const pageVideos = this.currentVideos.slice(startIndex, endIndex);
        
        // Create video cards
        pageVideos.forEach(video => {
            const card = this._createVideoCard(video);
            this.container.appendChild(card);
        });
        
        // Update loading state
        this.hasMoreVideos = endIndex < this.currentVideos.length;
    }
    
    _createVideoCard(video) {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.videoId = video.id;
        
        // Extract first category for color coding
        const firstCategory = video.category_data?.main_categories?.[0] || '';
        const categoryClass = firstCategory ? `category-${firstCategory.replace(/\s+/g, '-').toLowerCase()}` : '';
        
        card.innerHTML = `
            <div class="video-thumbnail">
                <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect fill='%232a2a2a' width='100%25' height='100%25'/%3E%3C/svg%3E"
                    data-src="${video.thumbnail}"
                    alt="${video.title}"
                    loading="lazy"
                    class="lazy-image"
                >
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title" title="${video.title}">${video.title}</h3>
                <div class="video-meta">
                    <span class="video-category ${categoryClass}">
                        ${firstCategory || 'Uncategorized'}
                    </span>
                    <button class="watch-button" data-video-id="${video.id}">
                        <i class="fas fa-external-link-alt"></i> Watch
                    </button>
                </div>
            </div>
        `;
        
        // Add click handlers
        const thumbnail = card.querySelector('.video-thumbnail');
        const watchButton = card.querySelector('.watch-button');
        
        thumbnail.addEventListener('click', () => this._playVideo(video.id));
        watchButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this._openYouTube(video.youtube_url);
        });
        
        return card;
    }
    
    _setupLazyLoading() {
        if (this.observer) {
            this.observer.disconnect();
            this.observedImages.clear();
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this._loadImage(img);
                    this.observer.unobserve(img);
                    this.observedImages.delete(img);
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });
        
        // Observe all lazy images
        this.container.querySelectorAll('.lazy-image').forEach(img => {
            if (!this.observedImages.has(img)) {
                this.observer.observe(img);
                this.observedImages.add(img);
            }
        });
    }
    
    _loadImage(img) {
        if (img.dataset.src && !img.dataset.loaded) {
            img.src = img.dataset.src;
            img.dataset.loaded = 'true';
            
            img.onload = () => {
                img.style.opacity = '1';
            };
            
            img.onerror = () => {
                // Fallback to placeholder
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="180"%3E%3Crect fill="%23f79c19" width="100%25" height="100%25"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="14"%3EThumbnail%3C/text%3E%3C/svg%3E';
            };
        }
    }
    
    _setupScrollPagination() {
        window.addEventListener('scroll', this.scrollHandler);
        window.addEventListener('resize', this.scrollHandler);
    }
    
    _handleScroll() {
        if (this.isLoading || !this.hasMoreVideos) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageBottom = this.container.offsetTop + this.container.offsetHeight;
        const threshold = 300; // pixels before bottom
        
        if (scrollPosition >= pageBottom - threshold) {
            this._loadNextPage();
        }
    }
    
    async _loadNextPage() {
        if (this.isLoading || !this.hasMoreVideos) return;
        
        this.isLoading = true;
        this.currentPage++;
        
        // Show loading indicator
        const loader = document.createElement('div');
        loader.className = 'video-grid-loader';
        loader.innerHTML = '<div class="spinner"></div><p>Loading more videos...</p>';
        this.container.appendChild(loader);
        
        // Simulate loading for smooth UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Remove loader
        loader.remove();
        
        // Render next page
        this._renderPage();
        this._setupLazyLoading();
        
        this.isLoading = false;
    }
    
    _playVideo(videoId) {
        // Dispatch event for player to handle
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
        if (width < 640) return 12;      // Mobile
        if (width < 1024) return 24;     // Tablet
        return 48;                       // Desktop
    }
    
    _throttle(func, limit) {
        let inThrottle;
        return function() {
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
            this.render(this.currentVideos); // Re-render with new page size
        }
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        window.removeEventListener('scroll', this.scrollHandler);
        window.removeEventListener('resize', this.scrollHandler);
        this.observedImages.clear();
    }
}