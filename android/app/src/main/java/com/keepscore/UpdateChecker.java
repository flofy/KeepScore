package com.keepscore;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.JsonObjectRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONObject;

import java.util.function.Consumer;

final class UpdateChecker {
    private static final String RELEASES_URL =
            "https://api.github.com/repos/flofy/KeepScore/releases/latest";

    private final Context context;
    private final RequestQueue queue;

    UpdateChecker(Context context) {
        this.context = context.getApplicationContext();
        this.queue = Volley.newRequestQueue(context);
    }

    void check(Consumer<Release> onUpdateAvailable) {
        JsonObjectRequest request = new JsonObjectRequest(
                Request.Method.GET,
                RELEASES_URL,
                null,
                response -> {
                    String tag = response.optString("tag_name", "");
                    String url = response.optString("html_url", "");
                    if (isNewerVersion(tag) && !url.isEmpty() && onUpdateAvailable != null) {
                        onUpdateAvailable.accept(new Release(normalizeVersion(tag), url));
                    }
                },
                error -> {
                    // Update checks are best-effort and must never block the app.
                });

        request.setShouldCache(false);
        queue.add(request);
    }

    private String normalizeVersion(String tag) {
        return tag.startsWith("v") ? tag.substring(1) : tag;
    }

    private boolean isNewerVersion(String tag) {
        String latest = normalizeVersion(tag);
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

    static final class Release {
        final String version;
        final String url;

        Release(String version, String url) {
            this.version = version;
            this.url = url;
        }
    }
}