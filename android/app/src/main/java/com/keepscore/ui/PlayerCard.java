package com.keepscore.ui;

import android.content.Context;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class PlayerCard extends LinearLayout {
    public interface Listener {
        void onScoreChange(String playerId, int delta);
        void onScoreEdit(String playerId, int score);
    }

    private static final int SURFACE = Color.rgb(30, 41, 59);
    private static final int TEXT = Color.rgb(248, 250, 252);
    private static final int CARD_HEIGHT = 260;

    public PlayerCard(
            Context context,
            String playerId,
            String name,
            int score,
            String color,
            Listener listener) {
        super(context);
        setOrientation(VERTICAL);
        setGravity(Gravity.CENTER_HORIZONTAL);
        int padding = UiUtils.dp(context, 14);
        setPadding(padding, UiUtils.dp(context, 12), padding, padding);
        setBackground(UiUtils.round(context, Color.rgb(15, 23, 42), 22, UiUtils.parseColor(color)));

        TextView nameView = UiUtils.text(context, name, 16, TEXT);
        UiUtils.bold(nameView);
        nameView.setGravity(Gravity.CENTER);
        addView(nameView, new LayoutParams(-1, UiUtils.dp(context, 42)));

        TextView scoreView = UiUtils.text(context, String.valueOf(score), 52, TEXT);
        UiUtils.bold(scoreView);
        scoreView.setGravity(Gravity.CENTER);
        scoreView.setOnClickListener(v -> listener.onScoreEdit(playerId, score));
        addView(scoreView, new LayoutParams(-1, 0, 1));

        LinearLayout quick = new LinearLayout(context);
        quick.setGravity(Gravity.CENTER);
        addQuick(quick, "-3", () -> listener.onScoreChange(playerId, -3));
        addQuick(quick, "-2", () -> listener.onScoreChange(playerId, -2));
        addQuick(quick, "+2", () -> listener.onScoreChange(playerId, 2));
        addQuick(quick, "+3", () -> listener.onScoreChange(playerId, 3));
        addView(quick, new LayoutParams(-1, UiUtils.dp(context, 38)));

        LinearLayout controls = new LinearLayout(context);
        controls.setGravity(Gravity.CENTER);
        addStep(controls, "−", () -> listener.onScoreChange(playerId, -1));
        addStep(controls, "+", () -> listener.onScoreChange(playerId, 1));
        addView(controls, new LayoutParams(-1, UiUtils.dp(context, 50)));

        setMinimumHeight(UiUtils.dp(context, CARD_HEIGHT));
    }

    private void addQuick(LinearLayout container, String label, Runnable action) {
        Button button = UiUtils.compactButton(
                getContext(),
                label,
                TEXT,
                SURFACE,
                Color.rgb(71, 85, 105));
        button.setOnClickListener(v -> {
            action.run();
            performHaptic();
        });
        LayoutParams params = new LayoutParams(0, UiUtils.dp(getContext(), 36), 1);
        int margin = UiUtils.dp(getContext(), 3);
        params.setMargins(margin, 0, margin, 0);
        container.addView(button, params);
    }

    private void addStep(LinearLayout container, String label, Runnable action) {
        Button button = new Button(getContext());
        button.setText(label);
        button.setTextSize(24);
        button.setTextColor(TEXT);
        button.setAllCaps(false);
        button.setBackground(UiUtils.round(
                getContext(),
                SURFACE,
                16,
                Color.rgb(71, 85, 105)));
        button.setOnClickListener(v -> {
            action.run();
            performHaptic();
        });
        LayoutParams params = new LayoutParams(0, UiUtils.dp(getContext(), 48), 1);
        int margin = UiUtils.dp(getContext(), 4);
        params.setMargins(margin, 0, margin, 0);
        container.addView(button, params);
    }

    private void performHaptic() {
        android.os.Vibrator vibrator =
                (android.os.Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
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
}
