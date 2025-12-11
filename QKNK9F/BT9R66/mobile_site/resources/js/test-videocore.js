// templates/mobile_hybrid/resources/js/test-videocore.js
async function testVideoCore() {
    console.log('🧪 Testing VideoCore...');
    
    // IMPORTANT: Update this path to match your generated site location
    const config = {
        dataBaseUrl: '/home/jay/Development/VideoLibraryManager/clients/client-QKNK9F/client-BT9R66/generated/site/mobile_site/data/'
    };
    
    const core = new VideoCore(config);
    
    // Test event listeners
    console.log('📡 Setting up event listeners...');
    
    core.on('loadStart', () => {
        console.log('   ⏳ Load started');
    });
    
    core.on('categoriesLoaded', (data) => {
        console.log('   ✅ Categories loaded');
        console.log('      Total categories:', data.categories.metadata?.total_categories || 'unknown');
    });
    
    core.on('videosLoadStart', () => {
        console.log('   ⏳ Videos loading started');
    });
    
    core.on('videosLoaded', (data) => {
        console.log(`   ✅ Videos loaded: ${data.count} videos`);
        console.log('      Has video order:', data.videoOrder ? 'Yes' : 'No');
    });
    
    core.on('searchIndexReady', (data) => {
        console.log(`   ✅ Search index ready: ${data.tokenCount} tokens`);
    });
    
    core.on('loadError', (data) => {
        console.error('   ❌ Load error:', data.error);
        console.error('      Stage:', data.stage);
    });
    
    try {
        console.log('🚀 Initializing VideoCore...');
        
        // Initialize (loads categories first)
        const initData = await core.initialize();
        console.log('✅ Core initialized with categories');
        
        // Give videos a moment to load in background
        console.log('⏳ Waiting for videos to load...');
        
        // Wait for videos to load with timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout waiting for videos'));
            }, 5000);
            
            if (core.isVideosLoaded()) {
                clearTimeout(timeout);
                resolve();
            } else {
                core.on('videosLoaded', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                core.on('loadError', (data) => {
                    clearTimeout(timeout);
                    reject(data.error);
                });
            }
        });
        
        console.log('📊 Running tests...');
        
        // Test 1: Basic data access
        const total = core.getTotalVideoCount();
        console.log(`   Test 1 - Total videos: ${total} ${total > 0 ? '✅' : '⚠'}`);
        
        // Test 2: Ordered videos
        const ordered = core.getOrderedVideos();
        console.log(`   Test 2 - Ordered videos: ${ordered.length} ${ordered.length === total ? '✅' : '⚠'}`);
        
        // Test 3: Video lookup
        if (ordered.length > 0) {
            const firstVideo = ordered[0];
            const lookedUp = core.getVideo(firstVideo.id);
            console.log(`   Test 3 - Video lookup: ${lookedUp ? '✅' : '❌'}`);
        }
        
        // Test 4: Category filter
        const categories = core.getCategories();
        if (categories?.hierarchy) {
            const firstMainCat = Object.keys(categories.hierarchy)[0];
            if (firstMainCat) {
                const mainCatVideos = core.filterByCategory(firstMainCat);
                console.log(`   Test 4 - Category filter (${firstMainCat}): ${mainCatVideos.length} videos ✅`);
            }
        }
        
        // Test 5: Search (if index ready)
        if (core.isSearchReady() && ordered.length > 0) {
            // Try to find a common word in titles
            const sampleVideo = ordered[0];
            const words = sampleVideo.title.split(' ');
            if (words.length > 0) {
                const testWord = words[0].toLowerCase();
                const searchResults = core.searchVideos(testWord);
                console.log(`   Test 5 - Search for "${testWord}": ${searchResults.length} results ✅`);
            }
        }
        
        // Test 6: Search within category
        if (categories?.hierarchy && core.isSearchReady()) {
            const firstMainCat = Object.keys(categories.hierarchy)[0];
            if (firstMainCat) {
                const searchResults = core.searchVideos('', firstMainCat);
                const filterResults = core.filterByCategory(firstMainCat);
                console.log(`   Test 6 - Search within category: ${searchResults.length} = ${filterResults.length} ${searchResults.length === filterResults.length ? '✅' : '⚠'}`);
            }
        }
        
        console.log('🎉 All tests completed!');
        
        // Print summary
        console.log('\n📋 VideoCore Status:');
        console.log(`   Videos loaded: ${core.isVideosLoaded() ? '✅' : '❌'}`);
        console.log(`   Search index: ${core.isSearchReady() ? '✅' : '❌'}`);
        console.log(`   Total videos: ${total}`);
        console.log(`   Total categories: ${categories?.metadata?.total_categories || 'unknown'}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
        return false;
    }
}

// Export for use in browser console
window.testVideoCore = testVideoCore;