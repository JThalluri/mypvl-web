class YouTubePlayer {
    constructor(config = {}) {
        this.config = {
            autoplay: false,
            autoplayNext: true,
            playerVars: {
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                enablejsapi: 1,
                origin: window.location.origin
            },
            ...config
        };
        
        this.players = new Map();          // videoId → YT.Player
        this.currentPlayer = null;         // Currently playing YT.Player
        this.queue = [];                   // Playback queue
        this.APIReady = false;
        this.APIReadyCallbacks = [];
    }

    async initialize() {
        if (this.APIReady) return true;
        
        return new Promise((resolve, reject) => {
            // Load YouTube API if not already loaded
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = 'https://www.youtube.com/iframe_api';
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                
                // Setup global callback
                window.onYouTubeIframeAPIReady = () => {
                    this.APIReady = true;
                    this.APIReadyCallbacks.forEach(cb => cb());
                    this.APIReadyCallbacks = [];
                    resolve(true);
                };
                
                // Set timeout for API loading
                setTimeout(() => {
                    if (!this.APIReady) {
                        reject(new Error('YouTube API failed to load'));
                    }
                }, 10000);
            } else if (window.YT.Player) {
                this.APIReady = true;
                resolve(true);
            } else {
                // Wait for API to be ready
                this.APIReadyCallbacks.push(resolve);
            }
        });
    }

    createPlayer(container, videoId, options = {}) {
        if (!this.APIReady) {
            throw new Error('YouTube API not ready');
        }

        const playerOptions = {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
                ...this.config.playerVars,
                ...options.playerVars
            },
            events: {
                onReady: (event) => {
                    console.log(`Player ready for ${videoId}`);
                    if (options.onReady) options.onReady(event);
                },
                onStateChange: (event) => {
                    this._handleStateChange(event, videoId);
                    if (options.onStateChange) options.onStateChange(event);
                },
                onError: (event) => {
                    console.error(`YouTube player error for ${videoId}:`, event.data);
                    if (options.onError) options.onError(event);
                }
            }
        };

        try {
            const player = new YT.Player(container, playerOptions);
            this.players.set(videoId, player);
            return player;
        } catch (error) {
            console.error('Failed to create YouTube player:', error);
            throw error;
        }
    }

    _handleStateChange(event, videoId) {
        const states = {
            [-1]: 'unstarted',
            [0]: 'ended',
            [1]: 'playing',
            [2]: 'paused',
            [3]: 'buffering',
            [5]: 'cued'
        };
        
        const state = states[event.data] || 'unknown';
        
        // Emit custom event
        document.dispatchEvent(new CustomEvent('youtube:statechange', {
            detail: { videoId, state, player: event.target }
        }));

        // Handle video ended (for playlist autoplay)
        if (state === 'ended' && this.config.autoplayNext && this.queue.length > 0) {
            this._playNextInQueue();
        }
    }

    play(videoId) {
        const player = this.players.get(videoId);
        if (player && player.playVideo) {
            // Pause current player if different
            if (this.currentPlayer && this.currentPlayer !== player) {
                this.pause(this.currentPlayer);
            }
            
            this.currentPlayer = player;
            player.playVideo();
            return true;
        }
        return false;
    }

    pause(playerOrVideoId) {
        let player;
        if (typeof playerOrVideoId === 'string') {
            player = this.players.get(playerOrVideoId);
        } else {
            player = playerOrVideoId;
        }
        
        if (player && player.pauseVideo) {
            player.pauseVideo();
            return true;
        }
        return false;
    }

    stop(videoId) {
        const player = this.players.get(videoId);
        if (player) {
            if (player.stopVideo) player.stopVideo();
            if (player.destroy) player.destroy();
            this.players.delete(videoId);
            
            if (this.currentPlayer === player) {
                this.currentPlayer = null;
            }
            return true;
        }
        return false;
    }

    stopAll() {
        this.players.forEach((player, videoId) => {
            this.stop(videoId);
        });
        this.currentPlayer = null;
        this.queue = [];
    }

    // Queue management for playlist autoplay
    setQueue(videos) {
        this.queue = videos;
    }

    _playNextInQueue() {
        if (this.queue.length === 0) return;
        
        const nextVideo = this.queue.shift();
        this.play(nextVideo.id);
        
        // Emit queue event
        document.dispatchEvent(new CustomEvent('youtube:queuenext', {
            detail: { 
                nextVideo, 
                remaining: this.queue.length 
            }
        }));
    }

    destroy() {
        this.stopAll();
        this.players.clear();
        this.queue = [];
        this.currentPlayer = null;
    }
}