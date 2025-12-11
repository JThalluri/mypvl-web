// mobile_hybrid/resources/js/core/VideoCore.js
class VideoCore {
    constructor(config) {
        this.config = config;
        
        // Data storage
        this._videos = null;
        this._videoOrder = [];
        this._videoMap = new Map(); // id → video object
        this._categories = null;
        
        // Search index
        this._searchIndex = {
            tokens: new Map(), // token → Set(videoIds)
            videoTokens: new Map() // videoId → Set(tokens)
        };
        
        // State
        this._isInitialized = false;
        this._isLoading = false;
        this._loadPromise = null;
        this._errors = [];
        
        // Event target for progressive updates
        this._eventTarget = document.createElement('div');
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Initialize core - loads categories first, then videos in background
     * @returns {Promise<Object>} Initial data with categories
     */
    async initialize() {
        if (this._loadPromise) return this._loadPromise;
        
        this._loadPromise = (async () => {
            this._isLoading = true;
            this._dispatchEvent('loadStart');
            
            try {
                // Stage 1: Load categories (fast, small file)
                await this._loadCategories();
                this._dispatchEvent('categoriesLoaded', { 
                    categories: this._categories 
                });
                
                // Stage 2: Load videos in background
                this._loadVideosAsync();
                
                return {
                    categories: this._categories,
                    isVideosLoading: true
                };
                
            } catch (error) {
                this._errors.push(error);
                this._dispatchEvent('loadError', { 
                    error, 
                    stage: 'initialization' 
                });
                throw error;
            } finally {
                this._isLoading = false;
            }
        })();
        
        return this._loadPromise;
    }
    
    /**
     * Get video by ID
     * @param {string} id - Video ID
     * @returns {Object|null} Video object or null if not found
     */
    getVideo(id) {
        return this._videoMap.get(id) || null;
    }
    
    /**
     * Get all videos in original order
     * @returns {Array} Ordered video objects
     */
    getOrderedVideos() {
        if (!this._isInitialized) return [];
        return this._videoOrder
            .map(id => this._videoMap.get(id))
            .filter(video => video !== undefined);
    }
    
    /**
     * Get total video count
     * @returns {number}
     */
    getTotalVideoCount() {
        return this._videos ? this._videos.length : 0;
    }
    
    /**
     * Get category hierarchy
     * @returns {Object|null}
     */
    getCategories() {
        return this._categories;
    }
    
    /**
     * Check if videos are loaded
     * @returns {boolean}
     */
    isVideosLoaded() {
        return this._videos !== null;
    }
    
    /**
     * Check if search index is ready
     * @returns {boolean}
     */
    isSearchReady() {
        return this._searchIndex.tokens.size > 0;
    }
    
    /**
     * Filter videos by category path (3-case logic)
     * @param {string} categoryPath - e.g., "హోమియోపతి|మెటీరియా మెడికా"
     * @returns {Array} Filtered videos in original order
     */
    filterByCategory(categoryPath) {
        if (!categoryPath || !this._isInitialized) {
            return this.getOrderedVideos();
        }
        
        const parts = categoryPath.split('|');
        
        return this.getOrderedVideos().filter(video => {
            const paths = video.category_data?.exact_paths || [];
            
            if (parts.length === 1) {
                // Case 1: Main category - match paths starting with main
                return paths.some(p => p === parts[0] || p.startsWith(parts[0] + '|'));
            }
            else if (parts.length === 2) {
                // Case 2: Sub category - match paths starting with main|sub
                return paths.some(p => p === categoryPath || p.startsWith(categoryPath + '|'));
            }
            else if (parts.length === 3) {
                // Case 3: Subsub category - exact match only
                return paths.includes(categoryPath);
            }
            return false;
        });
    }
    
    /**
     * Search videos using built index
     * @param {string} query - Search query
     * @param {string} withinCategory - Optional category constraint
     * @returns {Array} Search results in original order
     */
    searchVideos(query, withinCategory = null) {
        if (!query.trim()) {
            return withinCategory ? 
                this.filterByCategory(withinCategory) : 
                this.getOrderedVideos();
        }
        
        if (!this.isSearchReady()) {
            console.warn('Search index not ready, falling back to linear search');
            return this._linearSearch(query, withinCategory);
        }
        
        const queryTokens = this._tokenize(query.toLowerCase());
        let matchingVideoIds = null;
        
        // Find videos matching ALL tokens (AND logic)
        queryTokens.forEach(token => {
            const videosForToken = this._searchIndex.tokens.get(token);
            
            if (!videosForToken) {
                // Token not found in any video = no matches
                matchingVideoIds = new Set();
                return;
            }
            
            if (matchingVideoIds === null) {
                // First token: start with all matches
                matchingVideoIds = new Set(videosForToken);
            } else {
                // Subsequent tokens: intersect with existing matches
                const intersection = new Set();
                videosForToken.forEach(id => {
                    if (matchingVideoIds.has(id)) intersection.add(id);
                });
                matchingVideoIds = intersection;
            }
        });
        
        // Convert IDs to video objects
        let results = matchingVideoIds ? 
            Array.from(matchingVideoIds)
                .map(id => this.getVideo(id))
                .filter(video => video !== null) :
            [];
        
        // Apply category filter if specified
        if (withinCategory) {
            results = results.filter(video => 
                this._videoMatchesCategory(video, withinCategory)
            );
        }
        
        // Preserve original video order
        results.sort((a, b) => {
            const indexA = this._videoOrder.indexOf(a.id);
            const indexB = this._videoOrder.indexOf(b.id);
            return indexA - indexB;
        });
        
        return results;
    }
    
    /**
     * Subscribe to core events
     * @param {string} eventName - Event name
     * @param {Function} callback - Event handler
     */
    on(eventName, callback) {
        this._eventTarget.addEventListener(`videocore:${eventName}`, (e) => {
            callback(e.detail);
        });
    }
    
    // ===== PRIVATE METHODS =====
    
    async _loadCategories() {
        const url = `${this.config.dataBaseUrl}categories.json`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to load categories: ${response.status}`);
        }
        
        this._categories = await response.json();
    }
    
    async _loadVideosAsync() {
        try {
            this._dispatchEvent('videosLoadStart');
            
            const url = `${this.config.dataBaseUrl}videos.json`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load videos: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store data
            this._videos = data.videos || [];
            this._videoOrder = data.video_order || [];
            
            // Build video map for O(1) lookups
            this._videoMap.clear();
            this._videos.forEach(video => {
                this._videoMap.set(video.id, video);
            });
            
            // If no explicit order, use natural order
            if (this._videoOrder.length === 0) {
                this._videoOrder = this._videos.map(v => v.id);
            }
            
            // Build search index
            this._buildSearchIndex();
            
            this._isInitialized = true;
            
            this._dispatchEvent('videosLoaded', {
                count: this._videos.length,
                videoOrder: this._videoOrder.length > 0
            });
            
            this._dispatchEvent('searchIndexReady', {
                tokenCount: this._searchIndex.tokens.size
            });
            
        } catch (error) {
            this._errors.push(error);
            this._dispatchEvent('loadError', {
                error,
                stage: 'videos'
            });
        }
    }
    
    _buildSearchIndex() {
        console.time('buildSearchIndex');
        
        // Reset index
        this._searchIndex.tokens.clear();
        this._searchIndex.videoTokens.clear();
        
        this._videos.forEach(video => {
            const searchableText = this._getSearchableText(video);
            const tokens = this._tokenize(searchableText);
            
            // Store tokens for this video
            this._searchIndex.videoTokens.set(video.id, new Set(tokens));
            
            // Update inverted index
            tokens.forEach(token => {
                if (!this._searchIndex.tokens.has(token)) {
                    this._searchIndex.tokens.set(token, new Set());
                }
                this._searchIndex.tokens.get(token).add(video.id);
            });
        });
        
        console.timeEnd('buildSearchIndex');
        console.log(`Search index built: ${this._searchIndex.tokens.size} tokens for ${this._videos.length} videos`);
    }
    
    _getSearchableText(video) {
        // Combine all searchable fields
        const parts = [];
        
        // Title (highest priority)
        if (video.title) {
            parts.push(video.title.toLowerCase());
        }
        
        // Search tags
        if (video.search_tags && Array.isArray(video.search_tags)) {
            video.search_tags.forEach(tag => {
                parts.push(tag.toLowerCase());
            });
        }
        
        // Category names
        if (video.category_data?.flat_categories) {
            video.category_data.flat_categories.forEach(cat => {
                parts.push(cat.toLowerCase());
            });
        }
        
        return parts.join(' ');
    }
    
    _tokenize(text) {
        const tokens = new Set();
        
        // Split by spaces and common punctuation
        const words = text.split(/[\s.,;!?()\[\]{}'"`\-–—]+/).filter(w => w.length > 0);
        
        words.forEach(word => {
            // Add full word
            tokens.add(word);
            
            // Add partial words for prefix search (min 2 chars for Telugu, 3 for English)
            const minLength = this._isTelugu(word) ? 2 : 3;
            
            if (word.length >= minLength) {
                for (let i = minLength; i <= word.length; i++) {
                    tokens.add(word.substring(0, i));
                }
            }
        });
        
        return Array.from(tokens);
    }
    
    _isTelugu(text) {
        // Simple heuristic: check for Telugu Unicode range
        return /[\u0C00-\u0C7F]/.test(text);
    }
    
    _videoMatchesCategory(video, categoryPath) {
        const paths = video.category_data?.exact_paths || [];
        const parts = categoryPath.split('|');
        
        if (parts.length === 1) {
            return paths.some(p => p === parts[0] || p.startsWith(parts[0] + '|'));
        }
        else if (parts.length === 2) {
            return paths.some(p => p === categoryPath || p.startsWith(categoryPath + '|'));
        }
        else if (parts.length === 3) {
            return paths.includes(categoryPath);
        }
        return false;
    }
    
    _linearSearch(query, withinCategory = null) {
        const searchQuery = query.toLowerCase().trim();
        let videosToSearch = withinCategory ? 
            this.filterByCategory(withinCategory) : 
            this.getOrderedVideos();
        
        return videosToSearch.filter(video => {
            // Check title
            if (video.title.toLowerCase().includes(searchQuery)) return true;
            
            // Check search tags
            if (video.search_tags) {
                for (const tag of video.search_tags) {
                    if (tag.toLowerCase().includes(searchQuery)) return true;
                }
            }
            
            // Check category names
            if (video.category_data?.flat_categories) {
                for (const cat of video.category_data.flat_categories) {
                    if (cat.toLowerCase().includes(searchQuery)) return true;
                }
            }
            
            return false;
        });
    }
    
    _dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`videocore:${eventName}`, { detail });
        this._eventTarget.dispatchEvent(event);
        
        // Also dispatch to document for broader listening
        document.dispatchEvent(new CustomEvent(`videocore:${eventName}`, { detail }));
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    // Node.js/CommonJS
    module.exports = VideoCore;
} else if (typeof define === 'function' && define.amd) {
    // AMD/RequireJS
    define([], function() { return VideoCore; });
} else {
    // Browser global
    window.VideoCore = VideoCore;
}