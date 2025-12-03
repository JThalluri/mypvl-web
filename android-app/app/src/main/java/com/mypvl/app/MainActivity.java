package com.mypvl.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import androidx.appcompat.app.AppCompatActivity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.content.Intent;
import android.net.Uri;
import android.content.SharedPreferences;
import android.app.AlertDialog;
import android.os.Handler;
import android.provider.Settings;
import android.util.Log;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 1. First launch app links permission check
        checkAppLinksPermission();
        
        // 2. Hide ActionBar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        
        // 3. Create container with proper insets
        FrameLayout container = new FrameLayout(this);
        setContentView(container);
        
        webView = new WebView(this);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        );
        
        container.setOnApplyWindowInsetsListener((v, insets) -> {
            params.topMargin = insets.getSystemWindowInsetTop();
            params.bottomMargin = insets.getSystemWindowInsetBottom();
            webView.setLayoutParams(params);
            return insets;
        });
        
        container.addView(webView);
        
        // 4. Configure WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // Allow mixed content (HTTP + HTTPS)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        
        // Enable zoom and allow user interaction
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(true);
        
        // 5. Add JavaScript interface for menu item ONLY
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
        
        // 6. Custom WebViewClient - handle all link navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                String url = request.getUrl().toString();
                Log.d("WebViewLink", "URL clicked: " + url);
                
                // Check if URL is for external social media or non-library content
                if (isSocialMediaOrExternalLink(url)) {
                    Log.d("WebViewLink", "External link detected: " + url);
                    // Try to open in native app, fallback to browser
                    openExternalLink(url);
                    return true; // We handled it
                }
                
                // Allow library and internal URLs to load within the WebView
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false; // Let WebView handle it
                }
                
                // Load relative paths in the same WebView
                return false;
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Enable zoom controls if needed
                view.getSettings().setBuiltInZoomControls(true);
            }
        });
        
        // 7. Load your PWA with intent data if available
        String urlToLoad = buildUrlWithIntentData();
        Log.d("DeepLink", "Loading URL: " + urlToLoad);
        webView.loadUrl(urlToLoad);
    }

    // ===== FIRST LAUNCH PERMISSION CHECK =====
    private void checkAppLinksPermission() {
        SharedPreferences prefs = getSharedPreferences("app_settings", MODE_PRIVATE);
        boolean permissionAsked = prefs.getBoolean("app_links_permission_asked", false);
        boolean permissionGranted = prefs.getBoolean("app_links_permission_granted", false);
        
        if (!permissionAsked && !permissionGranted) {
            new Handler().postDelayed(() -> {
                showFirstTimePermissionDialog(prefs);
            }, 1500);
        }
    }

    private void showFirstTimePermissionDialog(SharedPreferences prefs) {
        new AlertDialog.Builder(this)
            .setTitle("✨ Better Experience")
            .setMessage("Allow My PVL to open library links directly in the app?\n\n" +
                       "This ensures links from messages, emails, and other apps open directly here.")
            .setPositiveButton("Yes, open settings", (dialog, which) -> {
                openLinkSettingsIntent();
                prefs.edit()
                    .putBoolean("app_links_permission_asked", true)
                    .putBoolean("app_links_permission_granted", true)
                    .apply();
            })
            .setNegativeButton("No thanks", (dialog, which) -> {
                prefs.edit()
                    .putBoolean("app_links_permission_asked", true)
                    .putBoolean("app_links_permission_granted", false)
                    .apply();
            })
            .setCancelable(false)
            .show();
    }

    // ===== JAVASCRIPT INTERFACE =====
    public class WebAppInterface {
        @android.webkit.JavascriptInterface
        public void openLinkSettings() {
            runOnUiThread(() -> {
                openLinkSettingsIntent();
            });
        }
    }

    // ===== HELPER METHOD =====
    private void openLinkSettingsIntent() {
        try {
            Intent intent = new Intent(Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        } catch (Exception e) {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    // ===== DEEP LINK HANDLING =====
    private String buildUrlWithIntentData() {
        Intent intent = getIntent();
        Uri deepLinkUri = intent.getData();
        
        Log.d("DeepLink", "Intent action: " + intent.getAction());
        Log.d("DeepLink", "Intent data: " + deepLinkUri);
        
        // If we have deep link data, use it
        if (deepLinkUri != null) {
            String fullUrl = deepLinkUri.toString();
            Log.d("DeepLink", "Deep link detected: " + fullUrl);
            
            // If the deep link is already to our domain with parameters, use it as-is
            if (fullUrl.contains("my-pvl.com")) {
                // Ensure it has query parameters for library ID
                if (fullUrl.contains("?")) {
                    return fullUrl;
                } else if (fullUrl.contains("/")) {
                    // Extract library ID from path like: https://my-pvl.com/wrapper.html?l=QKNK9F
                    String libraryId = extractLibraryIdFromPath(fullUrl);
                    if (libraryId != null && !libraryId.isEmpty()) {
                        return "https://my-pvl.com/wrapper.html?l=" + libraryId;
                    }
                }
            }
        }
        
        // Fallback to default wrapper
        return "https://my-pvl.com/wrapper.html";
    }

    private String extractLibraryIdFromPath(String url) {
        try {
            // Try to extract from path: https://my-pvl.com/QKNK9F or https://my-pvl.com/QKNK9F/
            String[] parts = url.split("my-pvl.com/");
            if (parts.length > 1) {
                String path = parts[1];
                // Get the first path segment (library ID)
                String[] segments = path.split("/");
                if (segments.length > 0 && segments[0].length() > 0) {
                    String potential = segments[0];
                    // Library IDs are typically 6 alphanumeric characters
                    if (potential.matches("[A-Z0-9]{6}")) {
                        Log.d("DeepLink", "Extracted library ID from path: " + potential);
                        return potential;
                    }
                }
            }
        } catch (Exception e) {
            Log.e("DeepLink", "Error extracting library ID: " + e.getMessage());
        }
        return null;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Called when activity already exists and receives new deep link
        Log.d("DeepLink", "onNewIntent called with: " + intent.getData());
        setIntent(intent);
        
        // Reload with new intent data
        String urlToLoad = buildUrlWithIntentData();
        Log.d("DeepLink", "Reloading with new URL: " + urlToLoad);
        if (webView != null) {
            webView.loadUrl(urlToLoad);
        }
    }

    // ===== SOCIAL MEDIA & EXTERNAL LINK HANDLING =====
    private boolean isSocialMediaOrExternalLink(String url) {
        // Check if URL is from non-library domain
        if (!url.contains("my-pvl.com")) {
            return true;
        }
        
        // Even if on our domain, check for social media links
        String lowerUrl = url.toLowerCase();
        return lowerUrl.contains("youtube.com") || 
               lowerUrl.contains("facebook.com") || 
               lowerUrl.contains("instagram.com") || 
               lowerUrl.contains("twitter.com") || 
               lowerUrl.contains("x.com") ||
               lowerUrl.contains("tiktok.com") ||
               lowerUrl.contains("linkedin.com") ||
               lowerUrl.contains("pinterest.com");
    }

    private void openExternalLink(String url) {
        try {
            Intent intent = null;
            
            // YouTube - try to open in YouTube app
            if (url.contains("youtube.com") || url.contains("youtu.be")) {
                String videoId = extractYouTubeVideoId(url);
                if (videoId != null) {
                    intent = new Intent(Intent.ACTION_VIEW, Uri.parse("vnd.youtube:" + videoId));
                    try {
                        startActivity(intent);
                        Log.d("WebViewLink", "Opened YouTube app with video ID: " + videoId);
                        return;
                    } catch (Exception e) {
                        Log.d("WebViewLink", "YouTube app not installed, opening in browser");
                        // YouTube app not installed, fallback to browser
                    }
                }
            }
            
            // Facebook - try to open in Facebook app
            if (url.contains("facebook.com")) {
                try {
                    // Try direct intent with the full URL first - most reliable method
                    intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    intent.setPackage("com.facebook.katana");
                    
                    // Check if Facebook app is installed
                    if (intent.resolveActivity(getPackageManager()) != null) {
                        startActivity(intent);
                        Log.d("WebViewLink", "Opened Facebook app with URL: " + url);
                        return;
                    } else {
                        // Facebook app not installed, fallback to browser
                        Log.d("WebViewLink", "Facebook app not installed, opening in browser");
                        intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return;
                    }
                } catch (Exception e) {
                    Log.d("WebViewLink", "Facebook intent error: " + e.getMessage());
                    // Fallback to browser
                    try {
                        intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return;
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                }
            }
            
            // Instagram - try to open in Instagram app
            if (url.contains("instagram.com")) {
                try {
                    String username = extractInstagramUsername(url);
                    if (username != null) {
                        intent = new Intent(Intent.ACTION_VIEW, Uri.parse("http://instagram.com/_u/" + username));
                        intent.setPackage("com.instagram.android");
                        startActivity(intent);
                        Log.d("WebViewLink", "Opened Instagram app with username: " + username);
                        return;
                    }
                } catch (Exception e) {
                    Log.d("WebViewLink", "Instagram app not installed, opening in browser");
                    // Instagram app not installed, fallback to browser
                }
            }
            
            // Twitter/X - try to open in Twitter app
            if (url.contains("twitter.com") || url.contains("x.com")) {
                try {
                    String username = extractTwitterUsername(url);
                    if (username != null) {
                        intent = new Intent(Intent.ACTION_VIEW, Uri.parse("twitter://user?screen_name=" + username));
                        startActivity(intent);
                        Log.d("WebViewLink", "Opened Twitter app with username: " + username);
                        return;
                    }
                } catch (Exception e) {
                    Log.d("WebViewLink", "Twitter app not installed, opening in browser");
                    // Twitter app not installed, fallback to browser
                }
            }
            
            // TikTok
            if (url.contains("tiktok.com")) {
                try {
                    intent = new Intent(Intent.ACTION_VIEW);
                    intent.setData(Uri.parse(url));
                    intent.setPackage("com.zhiliaoapp.musically");
                    startActivity(intent);
                    Log.d("WebViewLink", "Opened TikTok app");
                    return;
                } catch (Exception e) {
                    Log.d("WebViewLink", "TikTok app not installed, opening in browser");
                    // TikTok app not installed, fallback to browser
                }
            }
            
            // LinkedIn
            if (url.contains("linkedin.com")) {
                try {
                    intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.setPackage("com.linkedin.android");
                    startActivity(intent);
                    Log.d("WebViewLink", "Opened LinkedIn app");
                    return;
                } catch (Exception e) {
                    Log.d("WebViewLink", "LinkedIn app not installed, opening in browser");
                    // LinkedIn app not installed, fallback to browser
                }
            }
            
            // Fallback: open in default browser for any external link
            Log.d("WebViewLink", "Opening in default browser: " + url);
            intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
            
        } catch (Exception e) {
            Log.e("WebViewLink", "Error opening external link: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // ===== URL EXTRACTION HELPERS =====
    private String extractYouTubeVideoId(String url) {
        try {
            if (url.contains("youtube.com/watch?v=")) {
                return url.split("v=")[1].split("&")[0];
            } else if (url.contains("youtu.be/")) {
                return url.split("youtu.be/")[1].split("\\?")[0];
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private String extractFacebookIdentifier(String url) {
        try {
            // Parse URL: facebook.com/username or facebook.com/pages/pagename/123456789 or m.facebook.com/...
            String[] parts = url.split("facebook.com/");
            if (parts.length > 1) {
                String path = parts[1];
                
                // Handle pages format: pages/name/id -> extract id
                if (path.contains("pages/")) {
                    String[] pageParts = path.split("/");
                    if (pageParts.length >= 3) {
                        // Return the numeric ID (last part before query params)
                        return pageParts[2].split("\\?")[0];
                    }
                }
                
                // Handle simple username: facebook.com/username -> extract username
                String identifier = path.split("\\?")[0].split("/")[0];
                if (!identifier.isEmpty() && !identifier.equals("index.php")) {
                    return identifier;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private String extractInstagramUsername(String url) {
        try {
            String[] parts = url.split("instagram.com/");
            if (parts.length > 1) {
                return parts[1].split("\\?")[0].split("/")[0];
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private String extractTwitterUsername(String url) {
        try {
            String[] parts = url.split("/");
            for (int i = 0; i < parts.length; i++) {
                if (parts[i].contains("twitter.com") || parts[i].contains("x.com")) {
                    if (i + 1 < parts.length && !parts[i + 1].isEmpty()) {
                        return parts[i + 1].split("\\?")[0];
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}