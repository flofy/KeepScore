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
        // Initialize the Rust core with the app's files directory.
        nativeInit(getFilesDir().getAbsolutePath());
        // TODO: native UI, see rust/src/ui/components.rs
    }

    // --- JNI bridge, implemented in rust/src/lib.rs ---

    public native void nativeInit(String filesDir);

    public native void nativeAddPlayer(String name, String color);

    public native void nativeAddScore(String playerId, int delta);

    public native void nativeSetScore(String playerId, int score);

    public native void nativeResetScores();

    public native boolean nativeUndo();

    public native boolean nativeRedo();

    public native boolean nativeSave();

    public native boolean nativeExport(String path);

    public native boolean nativeImport(String path);

    public native String nativeGetState();
}
