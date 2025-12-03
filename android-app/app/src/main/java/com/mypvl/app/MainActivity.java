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

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Hide ActionBar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        
        // Create container with proper insets
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
        
        // Configure WebView
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // Custom WebViewClient to handle URL schemes
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
                
                // For http/https, stay in WebView
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return false;
                }
                
                // Block other unknown schemes
                return true;
            }
        });
        
        webView.loadUrl("https://my-pvl.com/wrapper.html");
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