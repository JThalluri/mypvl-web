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
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        
        // 5. Add JavaScript interface for menu item ONLY
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
        
        // 6. SIMPLE WebViewClient - let ALL links work normally
        webView.setWebViewClient(new WebViewClient());
        
        // 7. Load your PWA
        webView.loadUrl("https://my-pvl.com/wrapper.html");
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
}