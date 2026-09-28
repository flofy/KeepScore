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
        nativeInit(getFilesDir().getAbsolutePath());
    }

    private static native void nativeInit(String filesDir);
}
