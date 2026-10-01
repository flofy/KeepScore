package com.keepscore;

import android.app.AlertDialog;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import android.content.Intent;
import android.net.Uri;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private LinearLayout playersContainer;
    private TextView emptyState;
    private UpdateChecker updateChecker;

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
        root.setPadding(dp(16), dp(16), dp(16), dp(16));

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);

        TextView title = new TextView(this);
        title.setText(getString(R.string.app_name));
        title.setTextSize(26);
        title.setTextColor(Color.BLACK);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, -2, 1));

        Button addPlayer = new Button(this);
        addPlayer.setText(getString(R.string.add_player));
        addPlayer.setOnClickListener(v -> showAddPlayerDialog());
        toolbar.addView(addPlayer);

        root.addView(toolbar);

        LinearLayout actions = new LinearLayout(this);
        actions.setGravity(Gravity.CENTER);
        Button undo = actionButton(R.string.undo, v -> {
            nativeUndo();
            refreshPlayers();
        });
        Button redo = actionButton(R.string.redo, v -> {
            nativeRedo();
            refreshPlayers();
        });
        Button reset = actionButton(R.string.reset, v -> {
            new AlertDialog.Builder(this)
                    .setTitle(R.string.reset)
                    .setMessage("Réinitialiser tous les scores ?")
                    .setNegativeButton(android.R.string.cancel, null)
                    .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                        nativeResetScores();
                        refreshPlayers();
                    })
                    .show();
        });
        actions.addView(undo);
        actions.addView(redo);
        actions.addView(reset);
        root.addView(actions);

        ScrollView scroll = new ScrollView(this);
        playersContainer = new LinearLayout(this);
        playersContainer.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(playersContainer);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        emptyState = new TextView(this);
        emptyState.setText("Aucun joueur. Ajoutez un joueur pour commencer.");
        emptyState.setGravity(Gravity.CENTER);
        emptyState.setTextSize(18);
        emptyState.setPadding(dp(24), dp(48), dp(24), dp(48));

        setContentView(root);
    }

    private Button actionButton(int label, View.OnClickListener listener) {
        Button button = new Button(this);
        button.setText(label);
        button.setOnClickListener(listener);
        return button;
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
        card.setPadding(dp(12), dp(12), dp(12), dp(12));
        card.setBackgroundColor(parseColor(color));

        TextView nameView = new TextView(this);
        nameView.setText(name);
        nameView.setTextSize(20);
        nameView.setTextColor(Color.WHITE);
        nameView.setTypeface(null, android.graphics.Typeface.BOLD);
        card.addView(nameView);

        TextView scoreView = new TextView(this);
        scoreView.setText(String.valueOf(score));
        scoreView.setTextSize(40);
        scoreView.setGravity(Gravity.CENTER);
        scoreView.setTextColor(Color.WHITE);
        card.addView(scoreView, new LinearLayout.LayoutParams(-1, dp(72)));

        LinearLayout controls = new LinearLayout(this);
        controls.setGravity(Gravity.CENTER);

        Button minus = new Button(this);
        minus.setText("−");
        minus.setTextSize(24);
        minus.setOnClickListener(v -> {
            nativeAddScore(id, -1);
            refreshPlayers();
        });

        Button plus = new Button(this);
        plus.setText("+");
        plus.setTextSize(24);
        plus.setOnClickListener(v -> {
            nativeAddScore(id, 1);
            refreshPlayers();
        });

        controls.addView(minus, new LinearLayout.LayoutParams(0, -2, 1));
        controls.addView(plus, new LinearLayout.LayoutParams(0, -2, 1));
        card.addView(controls);

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.setMargins(0, 0, 0, dp(12));
        playersContainer.addView(card, params);
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
