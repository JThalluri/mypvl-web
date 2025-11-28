package com.mypvl.app;

import android.net.Uri;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        TwaLauncher launcher = new TwaLauncher(this);
        launcher.launch(Uri.parse("https://my-pvl.com/wrapper.html"));
    }
}