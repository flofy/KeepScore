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

            for (int i = 0; i < players.length(); i++) {
                JSONObject player = players.getJSONObject(i);
                addPlayerView(
                        player.optString("id"),
                        player.optString("name", "Joueur"),
                        player.optInt("score", 0),
                        player.optString("color", "#F44336"));
            }
        } catch (Exception error) {
            Toast.makeText(this, "Impossible de charger la partie", Toast.LENGTH_LONG).show();
        }
    }

    private void addPlayerView(String id, String name, int score, String color) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);
        card.setPadding(dp(14), dp(12), dp(14), dp(14));
        card.setBackground(round(BG, 22, parseColor(color)));

        EditText nameView = new EditText(this);
        nameView.setText(name);
        nameView.setTextColor(TEXT);
        nameView.setTextSize(16);
        nameView.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        nameView.setSingleLine(true);
        nameView.setGravity(Gravity.CENTER);
        nameView.setBackgroundColor(Color.TRANSPARENT);
        card.addView(nameView, new LinearLayout.LayoutParams(-1, dp(42)));

        TextView scoreView = text(String.valueOf(score), 52, TEXT);
        scoreView.setGravity(Gravity.CENTER);
        scoreView.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        scoreView.setOnClickListener(v -> editScore(id, score));
        card.addView(scoreView, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout quick = new LinearLayout(this);
        quick.setGravity(Gravity.CENTER);
        addQuick(quick, "-3", () -> change(id, -3));
        addQuick(quick, "-2", () -> change(id, -2));
        addQuick(quick, "+2", () -> change(id, 2));
        addQuick(quick, "+3", () -> change(id, 3));
        card.addView(quick, new LinearLayout.LayoutParams(-1, dp(38)));

        LinearLayout controls = new LinearLayout(this);
        controls.setGravity(Gravity.CENTER);
        addStep(controls, "−", () -> change(id, -1));
        addStep(controls, "+", () -> change(id, 1));
        card.addView(controls, new LinearLayout.LayoutParams(-1, dp(50)));

        nameView.setOnFocusChangeListener((v, focused) -> {
            if (!focused) {
                String newName = nameView.getText().toString().trim();
                if (!newName.isEmpty() && !newName.equals(name)) {
                    nativeRenamePlayer(id, newName);
                    nativeSave();
                }
            }
        });

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, dp(260));
        params.setMargins(dp(5), dp(5), dp(5), dp(5));
        playersContainer.addView(card, params);
    }

    private void addQuick(LinearLayout parent, String label, Runnable action) {
        Button b = compactButton(label, TEXT);
        b.setOnClickListener(v -> { action.run(); haptic(); });
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, dp(34), 1);
        p.setMargins(dp(2), 0, dp(2), 0);
        parent.addView(b, p);
    }

    private void addStep(LinearLayout parent, String label, Runnable action) {
        Button b = new Button(this);
        b.setText(label);
        b.setTextSize(25);
        b.setTextColor(TEXT);
        b.setAllCaps(false);
        b.setBackground(round(SURFACE, 14, Color.rgb(71, 85, 105)));
        b.setOnClickListener(v -> { action.run(); haptic(); });
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, dp(48), 1);
        p.setMargins(dp(3), 0, dp(3), 0);
        parent.addView(b, p);
    }

    private void change(String id, int delta) {
        nativeAddScore(id, delta);
        nativeSave();
        refreshPlayers();
    }

    private void editScore(String id, int current) {
        EditText input = new EditText(this);
        input.setInputType(2 | 8192);
        input.setText(String.valueOf(current));
        input.selectAll();
        new AlertDialog.Builder(this).setTitle("Modifier le score").setView(input)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (d, w) -> {
                    try { nativeSetScore(id, Integer.parseInt(input.getText().toString())); nativeSave(); refreshPlayers(); }
                    catch (NumberFormatException ignored) {}
                }).show();
    }

    private void confirmReset() {
        new AlertDialog.Builder(this).setTitle(R.string.reset)
                .setMessage("Réinitialiser tous les scores ?")
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (d, w) -> { nativeResetScores(); nativeSave(); refreshPlayers(); })
                .show();
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

    private GradientDrawable round(int fill, int radius, int stroke) {\n        GradientDrawable d = new GradientDrawable();\n        d.setColor(fill); d.setCornerRadius(dp(radius)); d.setStroke(dp(1), stroke);\n        return d;\n    }\n\n    private void haptic() {\n        android.os.Vibrator v = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);\n        if (v != null && v.hasVibrator()) v.vibrate(android.os.VibrationEffect.createOneShot(8, android.os.VibrationEffect.DEFAULT_AMPLITUDE));\n    }\n\n    private int parseColor(String value) {
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
    public native void nativeResetScores();\n    public native void nativeRenamePlayer(String playerId, String name);
    public native boolean nativeUndo();
    public native boolean nativeRedo();
    public native boolean nativeSave();
    public native boolean nativeExport(String path);
    public native boolean nativeImport(String path);
    public native String nativeGetState();
}
