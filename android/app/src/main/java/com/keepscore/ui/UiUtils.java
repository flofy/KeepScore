package com.keepscore.ui;

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
        int padding = dp(context, 6);
        button.setPadding(padding, 0, padding, 0);
        button.setBackground(round(context, background, 12, stroke));
        return button;
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
            return Color.rgb(244, 67, 54);
        }
    }
}
