use std::fs;
use std::path::PathBuf;
use android_activity::AndroidApp;
use crate::game::score::Game;

pub struct StorageManager {
    app: AndroidApp,
}

impl StorageManager {
    pub fn new(app: AndroidApp) -> Self {
        Self { app }
    }

    pub fn get_files_dir(&self) -> PathBuf {
        let context = self.app.context();
        let files_dir = context.get_files_dir().unwrap();
        PathBuf::from(files_dir.to_string_lossy().into_owned())
    }

    pub fn save_game(&self, game: &Game) -> Result<(), String> {
        let json = game.export_to_json();
        let path = self.get_files_dir().join("keepscore_save.json");
        fs::write(path, json).map_err(|e| e.to_string())
    }

    pub fn load_game(&self) -> Result<Option<Game>, String> {
        let path = self.get_files_dir().join("keepscore_save.json");
        if path.exists() {
            let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
            Ok(Game::import_from_json(&json))
        } else {
            Ok(None)
        }
    }

    pub fn export_game(&self, game: &Game, export_path: &str) -> Result<(), String> {
        let json = game.export_to_json();
        let path = PathBuf::from(export_path);
        fs::write(path, json).map_err(|e| e.to_string())
    }

    pub fn import_game(&self, import_path: &str) -> Result<Option<Game>, String> {
        let path = PathBuf::from(import_path);
        if path.exists() {
            let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
            Ok(Game::import_from_json(&json))
        } else {
            Ok(None)
        }
    }
}