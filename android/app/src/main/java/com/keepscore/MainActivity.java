package com.keepscore;

import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.GridLayout;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import android.content.Context;\nimport android.content.Intent;
import android.net.Uri;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private LinearLayout playersContainer;
    private TextView emptyState;
    private UpdateChecker updateChecker;
    private static final int BG = Color.rgb(15, 23, 42);
    private static final int SURFACE = Color.rgb(30, 41, 59);
    private static final int TEXT = Color.rgb(248, 250, 252);
    private static final int MUTED = Color.rgb(148, 163, 184);

    static {
        System.loadLibrary("keepscore");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        nativeInit(getFilesDir().getAbsolutePath());
        buildScreen();
        refreshPlayers();
        updateChecker = new UpdateChecker(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (updateChecker != null) {
            updateChecker.check(release -> runOnUiThread(() -> showUpdateDialog(
                    release.version,
                    release.url)));
        }
    }

    private void showUpdateDialog(String version, String url) {
        new AlertDialog.Builder(this)
                .setTitle(R.string.update_available_title)
                .setMessage(getString(R.string.update_available_message, version))
                .setNegativeButton(R.string.update_later, null)
                .setPositiveButton(R.string.update_now, (dialog, which) -> {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                })
                .show();
    }

    private void buildScreen() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(14), dp(10), dp(14), dp(14));

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = text(getString(R.string.app_name), 22, TEXT);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        header.addView(title, new LinearLayout.LayoutParams(0, dp(52), 1));
        Button addPlayer = compactButton("+", TEXT);
        addPlayer.setOnClickListener(v -> showAddPlayerDialog());
        header.addView(addPlayer, new LinearLayout.LayoutParams(dp(48), dp(48)));
        root.addView(header);

        LinearLayout actions = new LinearLayout(this);
        actions.setGravity(Gravity.CENTER_VERTICAL);
        actions.setPadding(0, 0, 0, dp(10));
        actions.addView(actionButton(R.string.undo, v -> { nativeUndo(); refreshPlayers(); }), weightParams());
        actions.addView(actionButton(R.string.redo, v -> { nativeRedo(); refreshPlayers(); }), weightParams());
        actions.addView(actionButton(R.string.reset, v -> confirmReset()), weightParams());
        root.addView(actions);

        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        playersContainer = new LinearLayout(this);
        playersContainer.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(playersContainer);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        emptyState = text("Aucun joueur. Ajoutez un joueur pour commencer.", 16, MUTED);
        emptyState.setGravity(Gravity.CENTER);
        emptyState.setPadding(dp(24), dp(48), dp(24), dp(48));
        setContentView(root);
    }

    private LinearLayout.LayoutParams weightParams() {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, dp(42), 1);
        p.setMargins(dp(3), 0, dp(3), 0);
        return p;
    }

    private Button actionButton(int label, View.OnClickListener listener) {
        Button b = compactButton(getString(label), TEXT);
        b.setOnClickListener(listener);
        return b;
    }

    private Button compactButton(String label, int color) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextColor(color);
        b.setTextSize(13);
        b.setAllCaps(false);
        b.setPadding(dp(6), 0, dp(6), 0);
        b.setBackground(round(SURFACE, 12, Color.rgb(71, 85, 105)));
        return b;
    }

    private TextView text(String value, float size, int color) {
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(size);
        v.setTextColor(color);
        return v;
    }

    private void refreshPlayers() {
        if (playersContainer == null) {
            return;
        }

        playersContainer.removeAllViews();

        try {
            JSONObject state = new JSONObject(nativeGetState());
            JSONArray players = state.optJSONArray("players");

            if (players == null || players.length() == 0) {
                playersContainer.addView(emptyState);
                return;
            }

    private void addQuick(LinearLayout container, String label, Runnable action) {
        Button button = compactButton(label, TEXT);
        button.setOnClickListener(v -> {
            action.run();
            haptic();
        });
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, dp(36), 1);
        params.setMargins(dp(3), 0, dp(3), 0);
        container.addView(button, params);
    }

    private void addStep(LinearLayout container, String label, Runnable action) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextSize(24);
        button.setTextColor(TEXT);
        button.setAllCaps(false);
        button.setBackground(round(SURFACE, 16, Color.rgb(71, 85, 105)));
        button.setOnClickListener(v -> {
            action.run();
            haptic();
        });
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, dp(48), 1);
        params.setMargins(dp(4), 0, dp(4), 0);
        container.addView(button, params);
    }

    private void change(String id, int delta) {
        nativeAddScore(id, delta);
        nativeSave();
        refreshPlayers();
    }

    private void editScore(String id, int currentScore) {
        EditText input = new EditText(this);
        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER |
                android.text.InputType.TYPE_NUMBER_FLAG_SIGNED);
        input.setText(String.valueOf(currentScore));
        input.selectAll();

        new AlertDialog.Builder(this)
                .setTitle("Modifier le score")
                .setView(input)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    try {
                        nativeSetScore(id, Integer.parseInt(input.getText().toString().trim()));
                        nativeSave();
                        refreshPlayers();
                        haptic();
                    } catch (NumberFormatException ignored) {
                        Toast.makeText(this, "Score invalide", Toast.LENGTH_SHORT).show();
                    }
                })
                .show();
    }

    private void confirmReset() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.reset)
                .setMessage("Réinitialiser tous les scores ?")
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    nativeResetScores();
                    nativeSave();
                    refreshPlayers();
                    haptic();
                })
                .show();
    }

    private android.graphics.drawable.GradientDrawable round(int fill, int radius, int stroke) {
        android.graphics.drawable.GradientDrawable drawable =
                new android.graphics.drawable.GradientDrawable();
        drawable.setColor(fill);
        drawable.setCornerRadius(dp(radius));
        drawable.setStroke(dp(1), stroke);
        return drawable;
    }

    private void haptic() {
        android.os.Vibrator vibrator =
                (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) {
            return;
        }
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            vibrator.vibrate(android.os.VibrationEffect.createOneShot(
                    20,
                    android.os.VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(20);
        }
    }

    private void showAddPlayerDialog() {
        EditText name = new EditText(this);
        name.setHint(R.string.player_name);
        name.setSingleLine(true);

        new AlertDialog.Builder(this)
                .setTitle(R.string.add_player)
                .setView(name)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    String playerName = name.getText().toString().trim();
                    if (playerName.isEmpty()) {
                        Toast.makeText(this, "Le nom est obligatoire", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    nativeAddPlayer(playerName, "#F44336");
                    nativeSave();
                    refreshPlayers();
                })
                .show();
    }

    private int parseColor(String value) {
        try {
            return Color.parseColor(value);
        } catch (IllegalArgumentException ignored) {
            return Color.rgb(244, 67, 54);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

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
