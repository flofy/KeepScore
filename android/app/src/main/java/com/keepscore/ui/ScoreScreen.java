package com.keepscore.ui;

import android.content.Context;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class ScoreScreen extends LinearLayout {
    private static final int BG = Color.rgb(15, 23, 42);
    private static final int MUTED = Color.rgb(148, 163, 184);

    private final LinearLayout playersContainer;
    private final TextView emptyState;

    public ScoreScreen(Context context) {
        super(context);
        setOrientation(VERTICAL);
        setBackgroundColor(BG);

        ScrollView scroll = new ScrollView(context);
        scroll.setFillViewport(true);

        playersContainer = new LinearLayout(context);
        playersContainer.setOrientation(VERTICAL);
        scroll.addView(playersContainer);

        addView(scroll, new LayoutParams(-1, 0, 1));

        emptyState = UiUtils.text(
                context,
                "Aucun joueur. Ajoutez un joueur pour commencer.",
                16,
                MUTED);
        emptyState.setGravity(Gravity.CENTER);
        emptyState.setPadding(
                UiUtils.dp(context, 24),
                UiUtils.dp(context, 48),
                UiUtils.dp(context, 24),
                UiUtils.dp(context, 48));
    }

    public void showEmpty() {
        playersContainer.removeAllViews();
        playersContainer.addView(emptyState);
    }

    public void clearPlayers() {
        playersContainer.removeAllViews();
    }

    public void addPlayer(
            String id,
            String name,
            int score,
            String color,
            PlayerCard.Listener listener) {
        playersContainer.addView(new PlayerCard(
                getContext(),
                id,
                name,
                score,
                color,
                listener));
    }
}
