package com.keepscore.ui;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.widget.Button;
import java.util.List;
import android.widget.LinearLayout;
import android.widget.TextView;

public class PlayerCard extends LinearLayout {
    public interface Listener {
        void onScoreChange(String playerId, int delta);
        void onScoreEdit(String playerId, int score);
        void onPlayerNameEdit(String playerId, String name);
    }

    private static final int SURFACE = Color.rgb(30, 41, 59);
    private static final int TEXT = Color.rgb(248, 250, 252);

    public PlayerCard(Context context, String playerId, String name, int score, String color,
                      List<Integer> history, Listener listener) {
        super(context);
        setOrientation(VERTICAL);
        setGravity(Gravity.CENTER_HORIZONTAL);
        int padding = UiUtils.dp(context, 14);
        setPadding(padding, UiUtils.dp(context, 12), padding, padding);
        setBackground(UiUtils.round(context, Color.rgb(15, 23, 42), 22, UiUtils.parseColor(color)));

        TextView nameView = UiUtils.text(context, name, 16, TEXT);
        UiUtils.bold(nameView);
        nameView.setGravity(Gravity.CENTER);
        nameView.setOnClickListener(v -> {
            android.widget.EditText input = new android.widget.EditText(getContext());
            input.setSingleLine(true);
            input.setText(name);
            input.selectAll();

            new AlertDialog.Builder(getContext())
                    .setTitle("Modifier le nom")
                    .setView(input)
                    .setNegativeButton(android.R.string.cancel, null)
                    .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                        String updatedName = input.getText().toString().trim();
                        if (updatedName.isEmpty()) {
                            input.setError("Le nom est obligatoire");
                            return;
                        }
                        listener.onPlayerNameEdit(playerId, updatedName);
                        performHaptic();
                    })
                    .show();
        });
        addView(nameView, new LayoutParams(-1, UiUtils.dp(context, 42)));
        LinearLayout historyView = new LinearLayout(context);
        historyView.setGravity(Gravity.CENTER);
        historyView.setOrientation(HORIZONTAL);
        for (Integer delta : history) {
            TextView badge = UiUtils.text(context,
                    formatDelta(delta),
                    12,
                    delta >= 0 ? Color.rgb(134, 239, 172) : Color.rgb(252, 165, 165));
            badge.setGravity(Gravity.CENTER);
            badge.setBackground(UiUtils.round(context, SURFACE, 10, Color.rgb(71, 85, 105)));
            int horizontal = UiUtils.dp(context, 5);
            badge.setPadding(horizontal, UiUtils.dp(context, 2), horizontal, UiUtils.dp(context, 2));
            LayoutParams badgeParams = new LayoutParams(-2, UiUtils.dp(context, 26));
            badgeParams.setMargins(UiUtils.dp(context, 2), 0, UiUtils.dp(context, 2), 0);
            historyView.addView(badge, badgeParams);
        }
        addView(historyView, new LayoutParams(-1, UiUtils.dp(context, 30)));


        LinearLayout scoreRow = new LinearLayout(context);
        scoreRow.setGravity(Gravity.CENTER);
        addStepColumn(scoreRow, false, playerId, listener);
        addCustomDeltaButton(scoreRow, playerId, listener);
        TextView scoreView = UiUtils.text(context, String.valueOf(score), 52, TEXT);
        UiUtils.bold(scoreView);
        scoreView.setGravity(Gravity.CENTER);
        scoreView.setOnClickListener(v -> listener.onScoreEdit(playerId, score));
        scoreRow.addView(scoreView, new LayoutParams(0, -1, 1));
        addStepColumn(scoreRow, true, playerId, listener);
        addView(scoreRow, new LayoutParams(-1, 0, 1));

        LayoutParams params = new LayoutParams(-1, UiUtils.dp(context, 260));
        params.setMargins(0, 0, 0, UiUtils.dp(context, 12));
        setLayoutParams(params);
    }


    private String formatDelta(int delta) {
        return delta >= 0 ? "+" + delta : String.valueOf(delta);
    }

    private void addCustomDeltaButton(LinearLayout row, String playerId, Listener listener) {
        Button button = UiUtils.compactButton(getContext(), "⋯", TEXT, SURFACE,
                Color.rgb(71, 85, 105));
        button.setTextSize(18);
        button.setContentDescription("Modifier le score");
        button.setOnClickListener(v -> showCustomDelta(playerId, listener));
        LayoutParams params = new LayoutParams(UiUtils.dp(getContext(), 42), UiUtils.dp(getContext(), 42));
        params.gravity = Gravity.CENTER_VERTICAL;
        params.setMargins(UiUtils.dp(getContext(), 4), 0, UiUtils.dp(getContext(), 4), 0);
        row.addView(button, params);
    }

    private void showCustomDelta(String playerId, Listener listener) {
        final android.widget.EditText input = new android.widget.EditText(getContext());
        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER
                | android.text.InputType.TYPE_NUMBER_FLAG_SIGNED);
        input.setSingleLine(true);
        input.setHint("Ex. +7 ou -7");

        new AlertDialog.Builder(getContext())
                .setTitle("Modifier le score")
                .setView(input)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    String value = input.getText().toString().trim();
                    try {
                        int delta = Integer.parseInt(value);
                        if (delta == 0) return;
                        listener.onScoreChange(playerId, delta);
                        performHaptic();
                    } catch (NumberFormatException ignored) {
                        input.setError("Nombre invalide");
                    }
                })
                .show();
    }

    private void addStepColumn(LinearLayout row, boolean positive, String playerId, Listener listener) {
        LinearLayout column = new LinearLayout(getContext());
        column.setOrientation(VERTICAL);
        column.setGravity(Gravity.CENTER);
        addStep(column, positive ? "+" : "−", positive ? 1 : -1, playerId, listener, 52);
        addQuick(column, positive ? "+2" : "−2", positive ? 2 : -2, playerId, listener);
        addQuick(column, positive ? "+3" : "−3", positive ? 3 : -3, playerId, listener);
        row.addView(column, new LayoutParams(UiUtils.dp(getContext(), 58), -1));
    }

    private void addQuick(LinearLayout container, String label, int delta, String playerId, Listener listener) {
        Button button = UiUtils.compactButton(getContext(), label, TEXT, SURFACE,
                Color.rgb(71, 85, 105));
        button.setOnLongClickListener(v -> {
            showQuickDeltas(delta > 0, playerId, listener);
            performHaptic();
            return true;
        });
        button.setOnClickListener(v -> {
            listener.onScoreChange(playerId, delta);
            performHaptic();
        });
        container.addView(button, new LayoutParams(-1, UiUtils.dp(getContext(), 34)));
    }

    private void addStep(
            LinearLayout container,
            String label,
            int delta,
            String playerId,
            Listener listener,
            int size) {
        Button button = new Button(getContext());
        button.setText(label);
        button.setTextSize(24);
        button.setTextColor(TEXT);
        button.setAllCaps(false);
        button.setBackground(UiUtils.round(getContext(), SURFACE, 16,
                Color.rgb(71, 85, 105)));
        button.setOnLongClickListener(v -> {
            showQuickDeltas(delta > 0, playerId, listener);
            performHaptic();
            return true;
        });
        button.setOnClickListener(v -> {
            listener.onScoreChange(playerId, delta);
            performHaptic();
        });
        container.addView(button, new LayoutParams(-1, UiUtils.dp(getContext(), size)));
    }

    private void showQuickDeltas(boolean positive, String playerId, Listener listener) {
        int[] values = {5, 10, 20};
        String[] labels = positive ? new String[]{"+5", "+10", "+20"} : new String[]{"−5", "−10", "−20"};
        new AlertDialog.Builder(getContext())
                .setTitle("Score rapide")
                .setItems(labels, (dialog, which) -> {
                    listener.onScoreChange(playerId, positive ? values[which] : -values[which]);
                    performHaptic();
                })
                .show();
    }

    private void performHaptic() {
        Vibrator vibrator = (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(8, VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(8);
        }
    }
}
