package com.mypvl.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Remove the Android ActionBar/TitleBar
        if (getSupportActionBar() != null) {
            getSupportActionBar().hide();
        }
        
        webView = new WebView(this);
        setContentView(webView);
        
        // Configure WebView for full PWA support
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true); // Local storage
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false); // Auto-play audio
        
        // Handle links within WebView (not external browser)
        webView.setWebViewClient(new WebViewClient());
        
        // Load your PWA
        webView.loadUrl("https://my-pvl.com/wrapper.html");
    }

    @Override
    public void onBackPressed() {
        // Handle back button in WebView
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}