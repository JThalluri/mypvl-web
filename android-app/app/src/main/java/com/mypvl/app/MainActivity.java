package com.mypvl.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.content.SharedPreferences;
import android.app.AlertDialog;
import android.os.Handler;
import android.provider.Settings;

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
        
        // 5. Add JavaScript interface for menu item
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
        
        // 6. Custom WebViewClient to handle URL schemes
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                
                // Handle Facebook app deep link
                if (url.startsWith("fb://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        // Fallback to Facebook website
                        String webUrl = url.replace("fb://profile/", "https://facebook.com/");
                        view.loadUrl(webUrl);
                        return true;
                    }
                }
                
                // Handle other common app links
                if (url.startsWith("intent://") || 
                    url.startsWith("twitter://") || 
                    url.startsWith("instagram://") ||
                    url.startsWith("whatsapp://")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        // If app not installed, stay in WebView
                        return false;
                    }
                }
                
                // For ALL http/https links, load in WebView
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    // Allow navigation within the app
                    return false; // This tells WebView to handle the link
                }
                
                // For unknown schemes, try to handle them
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    // Can't handle, block it
                    return true;
                }
            }
        });
        
        // 7. Load your PWA
        webView.loadUrl("https://my-pvl.com/wrapper.html");
    }

    // ===== FIRST LAUNCH PERMISSION CHECK =====
    private void checkAppLinksPermission() {
        SharedPreferences prefs = getSharedPreferences("app_settings", MODE_PRIVATE);
        boolean permissionAsked = prefs.getBoolean("app_links_permission_asked", false);
        boolean permissionGranted = prefs.getBoolean("app_links_permission_granted", false);
        
        // Ask only once if not already granted
        if (!permissionAsked && !permissionGranted) {
            new Handler().postDelayed(() -> {
                showFirstTimePermissionDialog(prefs);
            }, 1500); // Wait for app to load
        }
    }

    private void showFirstTimePermissionDialog(SharedPreferences prefs) {
        new AlertDialog.Builder(this)
            .setTitle("✨ Better Experience")
            .setMessage("Allow My PVL to open library links directly in the app?\n\n" +
                       "This ensures links from messages, emails, and other apps open directly here.")
            .setPositiveButton("Yes, open settings", (dialog, which) -> {
                // Directly open Android settings
                openLinkSettingsIntent();
                
                // Mark as granted
                prefs.edit()
                    .putBoolean("app_links_permission_asked", true)
                    .putBoolean("app_links_permission_granted", true)
                    .apply();
            })
            .setNegativeButton("No thanks", (dialog, which) -> {
                // Mark as asked but not granted
                prefs.edit()
                    .putBoolean("app_links_permission_asked", true)
                    .putBoolean("app_links_permission_granted", false)
                    .apply();
            })
            .setCancelable(false)
            .show();
    }

    // ===== JAVASCRIPT INTERFACE FOR MENU ITEM =====
    public class WebAppInterface {
        @android.webkit.JavascriptInterface
        public void openLinkSettings() {
            runOnUiThread(() -> {
                openLinkSettingsIntent();
            });
        }
    }

    // ===== HELPER METHOD TO OPEN SETTINGS =====
    private void openLinkSettingsIntent() {
        try {
            // Android 6.0+ specific setting
            Intent intent = new Intent(Settings.ACTION_APP_OPEN_BY_DEFAULT_SETTINGS);
            intent.setData(Uri.parse("package:" + getPackageName()));
            startActivity(intent);
        } catch (Exception e) {
            // Fallback for older Android
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
}