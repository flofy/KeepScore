package com.keepscore.ui;

import android.content.Context;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.GridLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class ScoreScreen extends ScrollView {
    private static final int BG = Color.rgb(15, 23, 42);
    private static final int MUTED = Color.rgb(148, 163, 184);
    private static final int GRID_GAP = 6;

    private final GridLayout playersContainer;
    private final TextView emptyState;
    private int columns = 1;

    public ScoreScreen(Context context) {
        super(context);
        setFillViewport(true);
        setBackgroundColor(BG);

        playersContainer = new GridLayout(context);
        playersContainer.setColumnCount(columns);
        playersContainer.setUseDefaultMargins(false);
        playersContainer.setAlignmentMode(GridLayout.ALIGN_BOUNDS);
        playersContainer.setPadding(
                UiUtils.dp(context, GRID_GAP),
                0,
                UiUtils.dp(context, GRID_GAP),
                UiUtils.dp(context, GRID_GAP));
        addView(playersContainer, new LayoutParams(-1, -2));

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

    public void configurePlayers(int playerCount) {
        columns = playerCount == 2 ? 1 : 2;
        playersContainer.setColumnCount(columns);
    }

    public void showEmpty() {
        playersContainer.removeAllViews();
        playersContainer.setColumnCount(1);
        GridLayout.LayoutParams params = new GridLayout.LayoutParams();
        params.width = -1;
        params.height = -2;
        params.columnSpec = GridLayout.spec(0, 1, 1f);
        playersContainer.addView(emptyState, params);
    }

    public void clearPlayers() {
        playersContainer.removeAllViews();
    }

    public void addPlayer(
            String id,
            String name,
            int score,
            String color,
            java.util.List<Integer> history,
            PlayerCard.Listener listener) {
        PlayerCard card = new PlayerCard(
                getContext(),
                id,
                name,
                score,
                color,
                history,
                listener);

        GridLayout.LayoutParams params = new GridLayout.LayoutParams();
        params.width = 0;
        params.height = UiUtils.dp(getContext(), 260);
        int index = playersContainer.getChildCount();
        int column = index % columns;
        int row = index / columns;
        params.columnSpec = GridLayout.spec(column, 1, 1f);
        params.rowSpec = GridLayout.spec(row);
        params.setMargins(
                UiUtils.dp(getContext(), GRID_GAP),
                UiUtils.dp(getContext(), GRID_GAP),
                UiUtils.dp(getContext(), GRID_GAP),
                UiUtils.dp(getContext(), GRID_GAP));
        playersContainer.addView(card, params);
    }
}
