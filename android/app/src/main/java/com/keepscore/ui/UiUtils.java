package com.keepscore.ui;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class UiUtils {
    private UiUtils() {
    }

    public static int dp(Context context, int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }

    public static TextView text(Context context, String value, float size, int color) {
        TextView view = new TextView(context);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        return view;
    }

    public static Button compactButton(Context context, String label, int color, int background, int stroke) {
        Button button = new Button(context);
        button.setText(label);
        button.setTextColor(color);
        button.setTextSize(13);
        button.setAllCaps(false);
        button.setGravity(android.view.Gravity.CENTER);
        int padding = dp(context, 6);
        button.setPadding(padding, 0, padding, 0);
        button.setBackground(round(context, background, 12, stroke));
        return button;
    }

    public static Button accentButton(
            Context context,
            String label,
            int textColor,
            int startColor,
            int endColor,
            int strokeColor) {
        Button button = new Button(context);
        button.setText(label);
        button.setTextColor(textColor);
        button.setTextSize(13);
        button.setAllCaps(false);
        button.setGravity(android.view.Gravity.CENTER);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        int padding = dp(context, 6);
        button.setPadding(padding, 0, padding, 0);

        GradientDrawable background = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{startColor, endColor});
        background.setCornerRadius(dp(context, 14));
        background.setStroke(dp(context, 1), strokeColor);
        button.setBackground(background);
        return button;
    }

    public static void styleDialog(AlertDialog dialog) {
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(
                    round(dialog.getContext(), Color.rgb(15, 23, 42), 22, Color.rgb(71, 85, 105)));
        }
        Button negative = dialog.getButton(AlertDialog.BUTTON_NEGATIVE);
        Button positive = dialog.getButton(AlertDialog.BUTTON_POSITIVE);
        if (negative != null) {
            negative.setTextColor(Color.rgb(148, 163, 184));
            negative.setAllCaps(false);
        }
        if (positive != null) {
            positive.setTextColor(Color.rgb(74, 222, 128));
            positive.setAllCaps(false);
        }
    }

    public static GradientDrawable round(Context context, int fill, int radius, int stroke) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fill);
        drawable.setCornerRadius(dp(context, radius));
        drawable.setStroke(dp(context, 1), stroke);
        return drawable;
    }

    public static void bold(TextView view) {
        view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
    }

    public static LinearLayout.LayoutParams weightParams(Context context) {
        LinearLayout.LayoutParams params =
                new LinearLayout.LayoutParams(0, dp(context, 42), 1);
        int margin = dp(context, 3);
        params.setMargins(margin, 0, margin, 0);
        return params;
    }

    public static int parseColor(String value) {
        try {
            return Color.parseColor(value);
        } catch (IllegalArgumentException ignored) {
            return Color.rgb(56, 189, 248);
        }
    }
}
