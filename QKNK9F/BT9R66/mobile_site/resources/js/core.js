// core.js - MINIMAL FAST VERSION
class MobileVideoCore {
    constructor(config) {
        this.config = config;
        this._core = new VideoCore(config);
        this.data = null;
    }
    
    async loadData() {
        // Initialize VideoCore
        const initData = await this._core.initialize();
        
        // Wait for videos
        await new Promise((resolve) => {
            if (this._core.isVideosLoaded()) {
                resolve();
            } else {
                this._core.on('videosLoaded', resolve);
            }
        });
        
        // Populate data
        this.data = {
            videos: this._core.getOrderedVideos(),
            categories: this._core.getCategories()
        };
        
        return this.data;
    }
    
    getVideo(id) {
        return this._core.getVideo(id);
    }
    
    getOrderedVideos() {
        return this._core.getOrderedVideos();
    }
    
    filterByCategory(categoryPath) {
        return this._core.filterByCategory(categoryPath);
    }
    
    searchVideos(query, withinCategory = null) {
        return this._core.searchVideos(query, withinCategory);
    }
    
    on(eventName, callback) {
        return this._core.on(eventName, callback);
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.MobileVideoCore = MobileVideoCore;
}