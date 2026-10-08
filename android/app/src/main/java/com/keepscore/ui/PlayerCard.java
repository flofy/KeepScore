package com.keepscore.ui;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Gravity;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.List;

public class PlayerCard extends LinearLayout {
    public interface Listener {
        void onScoreChange(String playerId, int delta);
        void onScoreEdit(String playerId, int score);
        void onPlayerNameEdit(String playerId, String name);
        void onPlayerRemove(String playerId, String name);
    }

    private static final int CARD = Color.rgb(15, 23, 42);
    private static final int SURFACE = Color.rgb(30, 41, 59);
    private static final int BORDER = Color.rgb(71, 85, 105);
    private static final int TEXT = Color.rgb(248, 250, 252);
    private static final int MUTED = Color.rgb(148, 163, 184);
    private static final int POSITIVE = Color.rgb(34, 197, 94);
    private static final int POSITIVE_DARK = Color.rgb(21, 128, 61);
    private static final int NEGATIVE = Color.rgb(239, 68, 68);
    private static final int NEGATIVE_DARK = Color.rgb(185, 28, 28);

    public PlayerCard(
            Context context,
            String playerId,
            String name,
            int score,
            String color,
            List<Integer> history,
            boolean canRemove,
            Listener listener) {
        super(context);
        setOrientation(VERTICAL);
        setGravity(Gravity.CENTER_HORIZONTAL);

        int padding = UiUtils.dp(context, 12);
        setPadding(padding, padding, padding, padding);
        setBackground(UiUtils.round(context, CARD, 22, UiUtils.parseColor(color)));

        LinearLayout header = new LinearLayout(context);
        header.setGravity(Gravity.CENTER_VERTICAL);

        TextView nameView = UiUtils.text(context, name, 16, TEXT);
        UiUtils.bold(nameView);
        nameView.setGravity(Gravity.CENTER_VERTICAL);
        nameView.setSingleLine(true);
        nameView.setEllipsize(android.text.TextUtils.TruncateAt.END);
        nameView.setOnClickListener(v -> showRenameDialog(playerId, name, listener));
        header.addView(nameView, new LayoutParams(0, UiUtils.dp(context, 42), 1));

        if (canRemove) {
            TextView removeView = UiUtils.text(context, "✕", 17, Color.rgb(252, 165, 165));
            removeView.setGravity(Gravity.CENTER);
            removeView.setBackground(UiUtils.round(
                    context,
                    Color.TRANSPARENT,
                    12,
                    Color.rgb(127, 29, 29)));
            removeView.setContentDescription("Supprimer " + name);
            removeView.setOnClickListener(v -> listener.onPlayerRemove(playerId, name));
            header.addView(removeView, new LayoutParams(
                    UiUtils.dp(context, 38),
                    UiUtils.dp(context, 38)));
        }
        addView(header, new LayoutParams(-1, UiUtils.dp(context, 42)));

        LinearLayout historyView = new LinearLayout(context);
        historyView.setGravity(Gravity.CENTER);
        historyView.setOrientation(HORIZONTAL);

        for (Integer delta : history) {
            TextView badge = UiUtils.text(
                    context,
                    formatDelta(delta),
                    12,
                    delta >= 0 ? Color.rgb(134, 239, 172) : Color.rgb(252, 165, 165));
            badge.setGravity(Gravity.CENTER);
            badge.setBackground(UiUtils.round(context, SURFACE, 10, BORDER));
            int horizontal = UiUtils.dp(context, 5);
            badge.setPadding(
                    horizontal,
                    UiUtils.dp(context, 2),
                    horizontal,
                    UiUtils.dp(context, 2));
            LayoutParams badgeParams = new LayoutParams(-2, UiUtils.dp(context, 26));
            badgeParams.setMargins(UiUtils.dp(context, 2), 0, UiUtils.dp(context, 2), 0);
            historyView.addView(badge, badgeParams);
        }
        addView(historyView, new LayoutParams(-1, UiUtils.dp(context, 32)));

        LinearLayout scoreRow = new LinearLayout(context);
        scoreRow.setGravity(Gravity.CENTER_VERTICAL);

        addStepColumn(scoreRow, false, playerId, listener);

        LinearLayout scoreCenter = new LinearLayout(context);
        scoreCenter.setOrientation(VERTICAL);
        scoreCenter.setGravity(Gravity.CENTER);

        TextView scoreView = UiUtils.text(context, String.valueOf(score), 56, TEXT);
        UiUtils.bold(scoreView);
        scoreView.setGravity(Gravity.CENTER);
        scoreView.setMaxLines(1);
        scoreView.setOnClickListener(v -> listener.onScoreEdit(playerId, score));
        scoreCenter.addView(scoreView, new LayoutParams(-1, 0, 1));

        Button custom = UiUtils.compactButton(
                context,
                "⋯",
                TEXT,
                SURFACE,
                BORDER);
        custom.setTextSize(18);
        custom.setContentDescription("Score personnalisé");
        custom.setOnClickListener(v -> showCustomDelta(playerId, listener));
        LayoutParams customParams = new LayoutParams(
                UiUtils.dp(context, 44),
                UiUtils.dp(context, 36));
        scoreCenter.addView(custom, customParams);

        scoreRow.addView(scoreCenter, new LayoutParams(0, -1, 1));
        addStepColumn(scoreRow, true, playerId, listener);
        addView(scoreRow, new LayoutParams(-1, 0, 1));

        LayoutParams params = new LayoutParams(-1, UiUtils.dp(context, 270));
        params.setMargins(0, 0, 0, UiUtils.dp(context, 12));
        setLayoutParams(params);
    }

    private String formatDelta(int delta) {
        return delta >= 0 ? "+" + delta : String.valueOf(delta);
    }

    private void showRenameDialog(String playerId, String currentName, Listener listener) {
        EditText input = new EditText(getContext());
        input.setSingleLine(true);
        input.setText(currentName);
        input.selectAll();

        new AlertDialog.Builder(getContext())
                .setTitle("Modifier le nom")
                .setView(input)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    String name = input.getText().toString().trim();
                    if (name.isEmpty()) {
                        input.setError("Le nom est obligatoire");
                        return;
                    }
                    listener.onPlayerNameEdit(playerId, name);
                    performHaptic();
                })
                .show();
    }

    private void showCustomDelta(String playerId, Listener listener) {
        EditText input = new EditText(getContext());
        input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER
                | android.text.InputType.TYPE_NUMBER_FLAG_SIGNED);
        input.setSingleLine(true);
        input.setHint("Ex. +7 ou -7");

        new AlertDialog.Builder(getContext())
                .setTitle("Score personnalisé")
                .setMessage("Saisissez la variation à appliquer.")
                .setView(input)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(android.R.string.ok, (dialog, which) -> {
                    try {
                        int delta = Integer.parseInt(input.getText().toString().trim());
                        if (delta == 0) return;
                        listener.onScoreChange(playerId, delta);
                        performHaptic();
                    } catch (NumberFormatException ignored) {
                        input.setError("Nombre invalide");
                    }
                })
                .show();
    }

    private void addStepColumn(
            LinearLayout row,
            boolean positive,
            String playerId,
            Listener listener) {
        LinearLayout column = new LinearLayout(getContext());
        column.setOrientation(VERTICAL);
        column.setGravity(Gravity.CENTER);
        addStep(
                column,
                positive ? "+" : "−",
                positive ? 1 : -1,
                playerId,
                listener);
        addQuick(
                column,
                positive ? "+2" : "−2",
                positive ? 2 : -2,
                playerId,
                listener);
        addQuick(
                column,
                positive ? "+3" : "−3",
                positive ? 3 : -3,
                playerId,
                listener);

        row.addView(column, new LayoutParams(UiUtils.dp(getContext(), 58), -1));
    }

    private void addQuick(
            LinearLayout container,
            String label,
            int delta,
            String playerId,
            Listener listener) {
        boolean positive = delta > 0;
        Button button = UiUtils.accentButton(
                getContext(),
                label,
                TEXT,
                positive ? Color.rgb(22, 101, 52) : Color.rgb(127, 29, 29),
                positive ? Color.rgb(34, 197, 94) : Color.rgb(239, 68, 68),
                positive ? Color.rgb(74, 222, 128) : Color.rgb(248, 113, 113));
        button.setOnLongClickListener(v -> {
            showQuickDeltas(positive, playerId, listener);
            performHaptic();
            return true;
        });
        button.setOnClickListener(v -> {
            listener.onScoreChange(playerId, delta);
            performHaptic();
        });
        LayoutParams params = new LayoutParams(-1, UiUtils.dp(getContext(), 32));
        params.setMargins(0, UiUtils.dp(getContext(), 3), 0, UiUtils.dp(getContext(), 3));
        container.addView(button, params);
    }

    private void addStep(
            LinearLayout container,
            String label,
            int delta,
            String playerId,
            Listener listener) {
        boolean positive = delta > 0;
        Button button = UiUtils.accentButton(
                getContext(),
                label,
                TEXT,
                positive ? POSITIVE_DARK : NEGATIVE_DARK,
                positive ? POSITIVE : NEGATIVE,
                positive ? Color.rgb(134, 239, 172) : Color.rgb(252, 165, 165));
        button.setTextSize(25);
        button.setOnLongClickListener(v -> {
            showQuickDeltas(positive, playerId, listener);
            performHaptic();
            return true;
        });
        button.setOnClickListener(v -> {
            listener.onScoreChange(playerId, delta);
            performHaptic();
        });
        container.addView(button, new LayoutParams(-1, UiUtils.dp(getContext(), 52)));
    }

    private void showQuickDeltas(boolean positive, String playerId, Listener listener) {
        int[] values = {5, 10, 20};
        String[] labels = positive
                ? new String[]{"+5", "+10", "+20"}
                : new String[]{"−5", "−10", "−20"};

        new AlertDialog.Builder(getContext())
                .setTitle("Score rapide")
                .setItems(labels, (dialog, which) -> {
                    listener.onScoreChange(
                            playerId,
                            positive ? values[which] : -values[which]);
                    performHaptic();
                })
                .show();
    }

    private void performHaptic() {
        Vibrator vibrator =
                (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator == null || !vibrator.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(
                    8,
                    VibrationEffect.DEFAULT_AMPLITUDE));
        } else {
            vibrator.vibrate(8);
        }
    }
}
