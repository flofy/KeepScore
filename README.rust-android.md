# KeepScore Rust (Android)

Portage Rust de KeepScore pour Android.

## Fonctionnalités implémentées

- Gestion multi-joueurs
- Historique des scores avec undo/redo
- Sauvegarde locale automatique (JSON dans le répertoire files de l'app)
- Export / import JSON des parties
- Architecture Rust (logique métier) + Android (JNI) via rust-android-gradle
- Tests unitaires Rust (`cargo test`)
- CI GitHub Actions : formatage, tests, build de l'APK debug

## Fonctionnalités à implémenter

- Interface utilisateur native complète
- i18n (Français / Anglais)
- Support tablettes

## Prérequis

- Rust (version stable) avec les cibles Android : `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android`
- Android SDK avec le NDK `29.0.14206865`
- Java JDK 17
- Gradle 8.7+ (ou Android Studio)

## Build

Le projet Android compile le crate Rust via rust-android-gradle et produit un APK :

```sh
cd android
gradle assembleDebug
```

L'APK debug est généré dans `android/app/build/outputs/apk/debug/`.

Pour travailler sur la logique Rust seule :

```sh
cd rust
cargo test
cargo fmt
```

## Architecture

### Structure du projet

- `android/` : projet Android (Gradle, package `com.keepscore`)
- `rust/` : crate Rust (`keepscore`) compilé en `libkeepscore.so`

### Modules Rust

- `game/player.rs` : structure `Player`
- `game/score.rs` : logique des scores, historique undo/redo, sérialisation JSON
- `game/storage.rs` : sauvegarde / chargement / export / import des parties
- `ui/components.rs` : état UI partagé entre Rust et Java
- `lib.rs` : pont JNI (`Java_com_keepscore_MainActivity_*`)

### Pont JNI

`MainActivity` charge `libkeepscore.so` et appelle les fonctions natives :

- `nativeInit(filesDir)` : initialise le stockage et recharge la partie sauvegardée
- `nativeAddPlayer(name, color)`
- `nativeAddScore(playerId, delta)`, `nativeSetScore(playerId, score)`, `nativeResetScores()`
- `nativeUndo()`, `nativeRedo()`, `nativeSave()`
- `nativeExport(path)`, `nativeImport(path)`, `nativeGetState()`

## Contribuer

Les PR sont les bienvenues.
