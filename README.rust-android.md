# KeepScore Rust (Android)

Portage Rust de KeepScore pour Android.

## Fonctionnalités implémentées
- Gestion multi-joueurs
- Historique des scores avec undo/redo
- Sauvegarde locale automatique
- Architecture Rust + Android NDK

## Fonctionnalités à implémenter
- Export/Import JSON
- Interface utilisateur native complète
- i18n (Français/Anglais)
- Tests unitaires

## Prérequis
- Rust (version stable)
- Android NDK (version 25+)
- Java JDK 17
- Android Studio (optionnel)

## Build

### Depuis la ligne de commande
Depuis le dossier android/: ./gradlew assembleDebug

## Architecture

### Structure du projet
keepscore-rust/
 android/ (Projet Android avec Gradle)
 rust/ (Code Rust avec Cargo)

### Modules Rust
- game/player.rs: Définition de la struct Player
- game/score.rs: Logique de gestion des scores
- game/storage.rs: Sauvegarde des parties
- ui/components.rs: Gestion de l'état UI

## Contribuer
Les PR sont les bienvenues.
