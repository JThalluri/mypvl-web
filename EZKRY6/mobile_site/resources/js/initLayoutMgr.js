// Initialize LayoutManager after everything loads
document.addEventListener('DOMContentLoaded', function () {
    // Small delay to ensure DOM is ready
    setTimeout(function () {
        if (window.LayoutManager) {
            window.layoutManager = new LayoutManager();

            // Refresh layout when app is fully initialized
            if (window.app) {
                // Hook into app initialization if possible
                const originalInit = window.app.init || function () { };
                window.app.init = function () {
                    originalInit.apply(this, arguments);
                    setTimeout(() => {
                        if (window.layoutManager) {
                            window.layoutManager.refresh();
                        }
                    }, 300);
                };
            }

            // Also refresh after a bit to catch any dynamic content
            setTimeout(() => {
                if (window.layoutManager) {
                    window.layoutManager.refresh();
                }
            }, 1000);
        }
    }, 100);
});

// Also update on window load
window.addEventListener('load', function () {
    setTimeout(() => {
        if (window.layoutManager) {
            window.layoutManager.refresh();
        }
    }, 500);
});
