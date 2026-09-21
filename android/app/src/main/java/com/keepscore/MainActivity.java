package com.keepscore;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    static {
        System.loadLibrary("keepscore");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Initialisation via Rust
        nativeInit(this);
    }

    // Appel natif vers Rust
    public native void nativeInit(MainActivity activity);
}