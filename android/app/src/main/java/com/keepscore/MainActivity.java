package com.keepscore;

import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.keepscore.ui.PlayerCard;
import com.keepscore.ui.ScoreScreen;
import com.keepscore.ui.UiUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {
    private static final int BG = Color.rgb(15, 23, 42);
    private static final int SURFACE = Color.rgb(30, 41, 59);
    private static final int TEXT = Color.rgb(248, 250, 252);

    private ScoreScreen scoreScreen;
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
        root.setBackgroundColor(BG);
        root.setPadding(
                UiUtils.dp(this, 14),
                UiUtils.dp(this, 10),
                UiUtils.dp(this, 14),
                UiUtils.dp(this, 14));

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);

        android.widget.TextView title = UiUtils.text(
                this,
                getString(R.string.app_name),
                22,
                TEXT);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        header.addView(title, new LinearLayout.LayoutParams(0, UiUtils.dp(this, 52), 1));

        Button addPlayer = UiUtils.compactButton(
                this,
                "+",
                TEXT,
                SURFACE,
                Color.rgb(71, 85, 105));
        addPlayer.setOnClickListener(v -> showAddPlayerDialog());
        header.addView(addPlayer, new LinearLayout.LayoutParams(
                UiUtils.dp(this, 48),
                UiUtils.dp(this, 48)));
        root.addView(header);

        LinearLayout actions = new LinearLayout(this);
        actions.setGravity(Gravity.CENTER_VERTICAL);
        actions.setPadding(0, 0, 0, UiUtils.dp(this, 10));
        actions.addView(actionButton(R.string.undo, v -> {
            nativeUndo();
            refreshPlayers();
        }), UiUtils.weightParams(this));
        actions.addView(actionButton(R.string.redo, v -> {
            nativeRedo();
            refreshPlayers();
        }), UiUtils.weightParams(this));
        actions.addView(actionButton(R.string.reset, v -> confirmReset()), UiUtils.weightParams(this));
        root.addView(actions);

        scoreScreen = new ScoreScreen(this);
        root.addView(scoreScreen, new LinearLayout.LayoutParams(-1, 0, 1));

        setContentView(root);
    }

    private Button actionButton(int label, View.OnClickListener listener) {
        Button button = UiUtils.compactButton(
                this,
                getString(label),
                TEXT,
                SURFACE,
                Color.rgb(71, 85, 105));
        button.setOnClickListener(listener);
        return button;
    }

    private void refreshPlayers() {
        if (scoreScreen == null) {
            return;
        }

        try {
            JSONObject state = new JSONObject(nativeGetState());
            JSONArray players = state.optJSONArray("players");

            if (players == null || players.length() == 0) {
                scoreScreen.showEmpty();
                return;
            }

            scoreScreen.configurePlayers(players.length());
            scoreScreen.clearPlayers();
            PlayerCard.Listener listener = new PlayerCard.Listener() {
                @Override
                public void onScoreChange(String playerId, int delta) {
                    change(playerId, delta);
                }

                @Override
                public void onScoreEdit(String playerId, int score) {
                    editScore(playerId, score);
                }
            };

            for (int i = 0; i < players.length(); i++) {
                JSONObject player = players.getJSONObject(i);
                scoreScreen.addPlayer(
                        player.optString("id"),
                        player.optString("name", "Joueur"),
                        player.optInt("score", 0),
                        player.optString("color", "#F44336"),
                        scoreHistory(state, player.optString("id")),
                        listener);
            }
        } catch (Exception error) {
            Toast.makeText(this, "Impossible de charger la partie", Toast.LENGTH_LONG).show();
        }
    }

    private List<Integer> scoreHistory(JSONObject state, String playerId) {
        List<Integer> result = new ArrayList<>();
        JSONArray history = state.optJSONArray("history");
        int currentIndex = state.optInt("current_index", history == null ? 0 : history.length());
        if (history == null) {
            return result;
        }

        int end = Math.min(currentIndex, history.length());
        for (int i = end - 1; i >= 0 && result.size() < 5; i--) {
            JSONObject action = history.optJSONObject(i);
            if (action == null) {
                continue;
            }

            JSONObject add = action.optJSONObject("Add");
            if (add != null && playerId.equals(add.optString("player_id"))) {
                result.add(0, add.optInt("delta"));
                continue;
            }

            JSONObject set = action.optJSONObject("Set");
            if (set != null && playerId.equals(set.optString("player_id"))) {
                result.add(0, set.optInt("score") - set.optInt("previous_score"));
                continue;
            }

            JSONObject reset = action.optJSONObject("ResetAll");
            if (reset != null) {
                JSONArray previous = reset.optJSONArray("previous_scores");
                if (previous != null) {
                    for (int j = 0; j < previous.length(); j++) {
                        JSONArray entry = previous.optJSONArray(j);
                        if (entry != null && entry.length() >= 2
                                && playerId.equals(entry.optString(0))) {
                            result.add(0, -entry.optInt(1));
                            break;
                        }
                    }
                }
            }
        }
        return result;
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
