// templates/mobile_hybrid/resources/js/ui/PlaylistManager.js
class PlaylistManager {
    constructor() {
        this.storageKey = 'videoLibrary_playlists';
        this.defaultPlaylists = {
            'favorites': {
                name: 'Favorites',
                videos: [],
                created: new Date().toISOString()
            },
            'watch_later': {
                name: 'Watch Later',
                videos: [],
                created: new Date().toISOString()
            }
        };

        this.playlists = this._loadFromStorage();
        this._ensureDefaultPlaylists();
    }

    _loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Failed to load playlists:', error);
            return {};
        }
    }

    _saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.playlists));
        } catch (error) {
            console.error('Failed to save playlists:', error);
        }
    }

    _ensureDefaultPlaylists() {
        let needsSave = false;

        Object.keys(this.defaultPlaylists).forEach(key => {
            if (!this.playlists[key]) {
                this.playlists[key] = { ...this.defaultPlaylists[key] };
                needsSave = true;
            }
        });

        if (needsSave) {
            this._saveToStorage();
        }
    }

    // Core methods
    addVideo(video, playlistId = 'watch_later') {
        if (!this.playlists[playlistId]) {
            console.error(`Playlist ${playlistId} not found`);
            return false;
        }

        const playlist = this.playlists[playlistId];

        // Check if already in playlist
        const exists = playlist.videos.some(v => v.id === video.id);
        if (exists) {
            console.log(`Video already in ${playlist.name}`);
            return false;
        }

        // Add video
        playlist.videos.push({
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            youtube_url: video.youtube_url,
            addedAt: new Date().toISOString()
        });

        this._saveToStorage();
        console.log(`Added to ${playlist.name}: ${video.title}`);
        return true;
    }

    removeVideo(videoId, playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;

        const initialLength = playlist.videos.length;
        playlist.videos = playlist.videos.filter(v => v.id !== videoId);

        if (playlist.videos.length < initialLength) {
            this._saveToStorage();
            console.log(`Removed video from ${playlist.name}`);
            return true;
        }

        return false;
    }

    getPlaylist(playlistId) {
        return this.playlists[playlistId];
    }

    getAllPlaylists() {
        return this.playlists;
    }

    // Check if video is in playlist
    isInPlaylist(videoId, playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;

        return playlist.videos.some(v => v.id === videoId);
    }

    // Get count for a playlist
    getPlaylistCount(playlistId) {
        const playlist = this.playlists[playlistId];
        return playlist ? playlist.videos.length : 0;
    }

    // Get videos for a playlist
    getPlaylistVideos(playlistId) {
        const playlist = this.playlists[playlistId];
        return playlist ? playlist.videos : [];
    }

    // Remove all videos from playlist
    clearPlaylist(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;

        const hadVideos = playlist.videos.length > 0;
        playlist.videos = [];

        if (hadVideos) {
            this._saveToStorage();
            console.log(`Cleared playlist: ${playlist.name}`);
            return true;
        }

        return false;
    }

    // Get playlist name
    getPlaylistName(playlistId) {
        const playlist = this.playlists[playlistId];
        return playlist ? playlist.name : playlistId;
    }

    // Get playlist as a playable queue
    getPlaylistQueue(playlistId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return [];

        return [...playlist.videos]; // Return a copy
    }

    // Get next video in playlist (with optional current index)
    getNextVideo(playlistId, currentVideoId = null) {
        const playlist = this.playlists[playlistId];
        if (!playlist || playlist.videos.length === 0) return null;

        if (!currentVideoId) {
            // Return first video if no current
            return playlist.videos[0];
        }

        // Find current index and return next
        const currentIndex = playlist.videos.findIndex(v => v.id === currentVideoId);
        if (currentIndex === -1 || currentIndex >= playlist.videos.length - 1) {
            return null; // No next video
        }

        return playlist.videos[currentIndex + 1];
    }

    // Get previous video in playlist
    getPreviousVideo(playlistId, currentVideoId = null) {
        const playlist = this.playlists[playlistId];
        if (!playlist || playlist.videos.length === 0) return null;

        if (!currentVideoId) {
            // Return first video if no current
            return playlist.videos[0];
        }

        // Find current index and return previous
        const currentIndex = playlist.videos.findIndex(v => v.id === currentVideoId);
        if (currentIndex <= 0) {
            return null; // No previous video
        }

        return playlist.videos[currentIndex - 1];
    }

    // Check if there's a next video
    hasNextVideo(playlistId, currentVideoId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;

        const currentIndex = playlist.videos.findIndex(v => v.id === currentVideoId);
        return currentIndex !== -1 && currentIndex < playlist.videos.length - 1;
    }

    // Check if there's a previous video
    hasPreviousVideo(playlistId, currentVideoId) {
        const playlist = this.playlists[playlistId];
        if (!playlist) return false;

        const currentIndex = playlist.videos.findIndex(v => v.id === currentVideoId);
        return currentIndex > 0;
    }

    toggleFavorite(video) {
        const playlistId = 'favorites';
        const playlist = this.playlists[playlistId];

        if (!playlist) {
            console.error('Favorites playlist not found');
            return { added: false, action: 'error' };
        }

        // Check if already in favorites
        const existingIndex = playlist.videos.findIndex(v => v.id === video.id);

        if (existingIndex !== -1) {
            // Remove from favorites
            playlist.videos.splice(existingIndex, 1);
            this._saveToStorage();
            console.log(`Removed from favorites: ${video.title}`);
            return { added: false, action: 'removed', playlistId };
        } else {
            // Add to favorites
            playlist.videos.push({
                id: video.id,
                title: video.title,
                thumbnail: video.thumbnail,
                youtube_url: video.youtube_url,
                addedAt: new Date().toISOString()
            });

            this._saveToStorage();
            console.log(`Added to favorites: ${video.title}`);
            return { added: true, action: 'added', playlistId };
        }
    }

    // Check if video is in favorites
    isFavorite(videoId) {
        const playlist = this.playlists['favorites'];
        if (!playlist) return false;

        return playlist.videos.some(v => v.id === videoId);
    }

    // Get all favorite videos
    getFavorites() {
        return this.getPlaylistVideos('favorites');
    }

    // Get count of favorites
    getFavoritesCount() {
        return this.getPlaylistCount('favorites');
    }

    // Clear favorites
    clearFavorites() {
        return this.clearPlaylist('favorites');
    }

}