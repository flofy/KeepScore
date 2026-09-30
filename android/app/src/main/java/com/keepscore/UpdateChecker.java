package com.keepscore;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

import androidx.annotation.Nullable;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONObject;

final class UpdateChecker {
    private static final String RELEASES_URL =
            "https://api.github.com/repos/flofy/KeepScore/releases/latest";

    private final Context context;
    private final RequestQueue queue;

    UpdateChecker(Context context) {
        this.context = context.getApplicationContext();
        this.queue = Volley.newRequestQueue(context);
    }

    void check(@Nullable Runnable onUpdateAvailable) {
        JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.GET,
                RELEASES_URL,
                null,
                response -> {
                    String tag = response.optString("tag_name", "");
                    String url = response.optString("html_url", "");
                    if (isNewerVersion(tag) && !url.isEmpty() && onUpdateAvailable != null) {
                        onUpdateAvailable.run();
                    }
                },
                error -> {
                    // Update checks are best-effort and must never block the app.
                });

        request.setShouldCache(false);
        queue.add(request);
    }

    private boolean isNewerVersion(String tag) {
        String latest = tag.startsWith("v") ? tag.substring(1) : tag;
        String current = BuildConfig.VERSION_NAME;

        try {
            String[] latestParts = latest.split("\\.");
            String[] currentParts = current.split("\\.");
            int length = Math.max(latestParts.length, currentParts.length);

            for (int i = 0; i < length; i++) {
                int latestPart = i < latestParts.length ? parsePart(latestParts[i]) : 0;
                int currentPart = i < currentParts.length ? parsePart(currentParts[i]) : 0;
                if (latestPart != currentPart) {
                    return latestPart > currentPart;
                }
            }
        } catch (NumberFormatException ignored) {
            return false;
        }

        return false;
    }

    private int parsePart(String value) {
        return Integer.parseInt(value.replaceAll("[^0-9].*", ""));
    }

    void openLatestRelease(String url) {
        context.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
    }
}