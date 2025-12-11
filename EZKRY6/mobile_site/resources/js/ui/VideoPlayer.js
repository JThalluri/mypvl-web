// templates/mobile_hybrid/resources/js/ui/VideoPlayer.js
class VideoPlayer {
    constructor(options = {}) {
        this.options = {
            autoplay: true,
            showControls: true,
            closeOnEnd: false,
            enablePlaylistNavigation: true,
            ...options
        };
        
        this.youtubePlayer = null;
        this.currentVideo = null;
        this.modal = null;
        this.playerContainer = null;
        this.playerInstance = null;
        
        // Playlist state
        this.currentPlaylist = null;
        this.playlistQueue = [];
        this.currentPlaylistIndex = -1;
        this.isPlaylistMode = false;
        
        this._createModal();
        this._setupEventListeners();
    }
    
    setYouTubePlayer(player) {
        this.youtubePlayer = player;
    }
    
    // NEW: Set playlist for autoplay
    setPlaylist(playlistId, videos) {
        this.currentPlaylist = playlistId;
        this.playlistQueue = videos || [];
        this.currentPlaylistIndex = -1;
        this.isPlaylistMode = videos && videos.length > 0;
        
        // Update UI if modal is visible
        this._updatePlaylistInfo();
    }
    
    // NEW: Clear playlist state
    clearPlaylist() {
        this.currentPlaylist = null;
        this.playlistQueue = [];
        this.currentPlaylistIndex = -1;
        this.isPlaylistMode = false;
        
        // Update UI
        this._updatePlaylistInfo();
    }
    
    _createModal() {
        // Check if modal already exists
        this.modal = document.getElementById('videoModal');
        if (!this.modal) {
            // Create modal HTML
            const modalHTML = `
                <div class="video-modal" id="videoModal">
                    <div class="modal-backdrop"></div>
                    <div class="modal-container">
                        <div class="modal-header">
                            <h3 class="video-title" id="videoModalTitle">Playing Video</h3>
                            <button class="modal-close" id="videoModalClose" aria-label="Close player">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="player-wrapper">
                                <div class="youtube-player-container" id="youtubePlayerContainer"></div>
                            </div>
                            <div class="video-controls">
                                <button class="control-btn prev-btn" aria-label="Previous video">
                                    <i class="fas fa-step-backward"></i>
                                </button>
                                <button class="control-btn play-btn" aria-label="Play/Pause">
                                    <i class="fas fa-play"></i>
                                </button>
                                <button class="control-btn next-btn" aria-label="Next video">
                                    <i class="fas fa-step-forward"></i>
                                </button>
                                <button class="control-btn fullscreen-btn" aria-label="Fullscreen">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div class="playlist-info" id="playlistInfo"></div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.modal = document.getElementById('videoModal');
            this.playerContainer = document.getElementById('youtubePlayerContainer');
        } else {
            this.playerContainer = document.getElementById('youtubePlayerContainer');
        }
    }
    
    _setupEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Backdrop click
        const backdrop = this.modal.querySelector('.modal-backdrop');
        backdrop.addEventListener('click', () => this.hide());
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.hide();
            }
        });
        
        // Control buttons
        const playBtn = this.modal.querySelector('.play-btn');
        playBtn.addEventListener('click', () => this._togglePlayPause());
        
        // NEW: Next button for playlist navigation
        const nextBtn = this.modal.querySelector('.next-btn');
        nextBtn.addEventListener('click', () => this._playNextInPlaylist());
        
        // NEW: Previous button for playlist navigation
        const prevBtn = this.modal.querySelector('.prev-btn');
        prevBtn.addEventListener('click', () => this._playPreviousInPlaylist());
        
        const fullscreenBtn = this.modal.querySelector('.fullscreen-btn');
        fullscreenBtn.addEventListener('click', () => this._toggleFullscreen());
        
        // YouTube state changes
        document.addEventListener('youtube:statechange', (e) => {
            if (e.detail.videoId === this.currentVideo?.id) {
                this._updateControls(e.detail.state);
                
                // NEW: Handle autoplay when video ends
                if (e.detail.state === 'ended' && this.isPlaylistMode && this.options.enablePlaylistNavigation) {
                    this._handleVideoEnded();
                }
            }
        });
    }
    
    async play(video, options = {}) {
        this.currentVideo = video;
        
        // Check if this video is in our playlist
        if (this.isPlaylistMode) {
            const index = this.playlistQueue.findIndex(v => v.id === video.id);
            if (index !== -1) {
                this.currentPlaylistIndex = index;
            }
        }
        
        // Update title
        const titleEl = this.modal.querySelector('.video-title');
        if (this.isPlaylistMode && this.currentPlaylistIndex !== -1) {
            titleEl.textContent = `(${this.currentPlaylistIndex + 1}/${this.playlistQueue.length}) ${video.title}`;
        } else {
            titleEl.textContent = video.title || 'Playing Video';
        }
        
        // Show modal
        this.show();
        
        // Clear previous player
        if (this.playerInstance) {
            this.youtubePlayer.stop(this.currentVideo.id);
        }
        this.playerContainer.innerHTML = '';
        
        // Create player div
        const playerDiv = document.createElement('div');
        playerDiv.id = `yt-player-${Date.now()}`;
        this.playerContainer.appendChild(playerDiv);
        
        try {
            // Create YouTube player
            this.playerInstance = this.youtubePlayer.createPlayer(playerDiv.id, video.id, {
                playerVars: {
                    autoplay: this.options.autoplay ? 1 : 0,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1
                },
                onReady: (event) => {
                    console.log('YouTube player ready in modal');
                    this._updateControls('ready');
                    
                    // Update navigation buttons
                    this._updateNavigationButtons();
                },
                onStateChange: (event) => {
                    // Event will be handled by youtube:statechange
                }
            });
            
            // Update playlist info
            this._updatePlaylistInfo();
            
            return this.playerInstance;
        } catch (error) {
            console.error('Failed to play video in modal:', error);
            this.hide();
            throw error;
        }
    }
    
    // NEW: Play next video in playlist
    _playNextInPlaylist() {
        if (!this.isPlaylistMode || this.playlistQueue.length === 0) {
            console.log('Not in playlist mode or playlist empty');
            return;
        }
        
        const nextIndex = this.currentPlaylistIndex + 1;
        if (nextIndex >= this.playlistQueue.length) {
            console.log('End of playlist reached');
            // Optionally: loop back to start
            // this.currentPlaylistIndex = 0;
            return;
        }
        
        const nextVideo = this.playlistQueue[nextIndex];
        console.log('Playing next video:', nextVideo.title);
        
        // Play the next video
        this.play(nextVideo);
    }
    
    // NEW: Play previous video in playlist
    _playPreviousInPlaylist() {
        if (!this.isPlaylistMode || this.playlistQueue.length === 0) {
            console.log('Not in playlist mode or playlist empty');
            return;
        }
        
        const prevIndex = this.currentPlaylistIndex - 1;
        if (prevIndex < 0) {
            console.log('Already at first video');
            return;
        }
        
        const prevVideo = this.playlistQueue[prevIndex];
        console.log('Playing previous video:', prevVideo.title);
        
        // Play the previous video
        this.play(prevVideo);
    }
    
    // NEW: Handle video ended event
    _handleVideoEnded() {
        if (this.isPlaylistMode && this.options.enablePlaylistNavigation) {
            // Wait a moment then play next
            setTimeout(() => {
                this._playNextInPlaylist();
            }, 1500); // 1.5 second delay
        }
    }
    
    // NEW: Update navigation buttons state
    _updateNavigationButtons() {
        const prevBtn = this.modal.querySelector('.prev-btn');
        const nextBtn = this.modal.querySelector('.next-btn');
        
        if (!prevBtn || !nextBtn) return;
        
        if (this.isPlaylistMode) {
            // Enable/disable based on position in playlist
            const hasPrev = this.currentPlaylistIndex > 0;
            const hasNext = this.currentPlaylistIndex < this.playlistQueue.length - 1;
            
            prevBtn.disabled = !hasPrev;
            prevBtn.style.opacity = hasPrev ? '1' : '0.5';
            prevBtn.style.cursor = hasPrev ? 'pointer' : 'not-allowed';
            
            nextBtn.disabled = !hasNext;
            nextBtn.style.opacity = hasNext ? '1' : '0.5';
            nextBtn.style.cursor = hasNext ? 'pointer' : 'not-allowed';
        } else {
            // Not in playlist mode - disable navigation
            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.5';
            prevBtn.style.cursor = 'not-allowed';
            
            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        }
    }
    
    // NEW: Update playlist info display
    _updatePlaylistInfo() {
        const playlistInfo = document.getElementById('playlistInfo');
        if (!playlistInfo) return;
        
        if (this.isPlaylistMode && this.playlistQueue.length > 0) {
            const currentPos = this.currentPlaylistIndex + 1;
            const total = this.playlistQueue.length;
            playlistInfo.innerHTML = `
                <div class="current-playlist-info">
                    <i class="fas fa-list"></i>
                    <span>Playlist: ${currentPos}/${total}</span>
                </div>
            `;
            playlistInfo.style.display = 'block';
        } else {
            playlistInfo.innerHTML = '';
            playlistInfo.style.display = 'none';
        }
        
        // Update navigation buttons
        this._updateNavigationButtons();
    }
    
    show() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    hide() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Stop player
        if (this.currentVideo && this.youtubePlayer) {
            this.youtubePlayer.stop(this.currentVideo.id);
        }
        
        this.currentVideo = null;
        this.playerInstance = null;
        
        // Clear playlist state when hiding?
        // this.clearPlaylist(); // Optional
    }
    
    _togglePlayPause() {
        if (!this.currentVideo || !this.playerInstance) return;
        
        const player = this.youtubePlayer.players.get(this.currentVideo.id);
        if (player) {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
    }
    
    _toggleFullscreen() {
        this.modal.classList.toggle('fullscreen');
        const btn = this.modal.querySelector('.fullscreen-btn i');
        if (this.modal.classList.contains('fullscreen')) {
            btn.className = 'fas fa-compress';
        } else {
            btn.className = 'fas fa-expand';
        }
    }
    
    _updateControls(state) {
        const playBtn = this.modal.querySelector('.play-btn');
        const icon = playBtn.querySelector('i');
        
        switch(state) {
            case 'playing':
                icon.className = 'fas fa-pause';
                break;
            case 'paused':
            case 'ended':
                icon.className = 'fas fa-play';
                break;
            case 'buffering':
                icon.className = 'fas fa-spinner fa-spin';
                break;
            default:
                icon.className = 'fas fa-play';
        }
    }
    
    destroy() {
        this.hide();
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
}