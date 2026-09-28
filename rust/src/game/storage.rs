use std::fs;
use std::path::{Path, PathBuf};

use crate::game::score::Game;

pub struct StorageManager {
    files_dir: PathBuf,
}

impl StorageManager {
    pub fn new(files_dir: impl Into<PathBuf>) -> Self {
        Self {
            files_dir: files_dir.into(),
        }
    }

    fn save_path(&self) -> PathBuf {
        self.files_dir.join("keepscore_save.json")
    }

    pub fn save_game(&self, game: &Game) -> Result<(), String> {
        fs::create_dir_all(Path::new(&self.files_dir)).map_err(|e| e.to_string())?;
        fs::write(self.save_path(), game.export_to_json()).map_err(|e| e.to_string())
    }

    pub fn load_game(&self) -> Result<Option<Game>, String> {
        let path = self.save_path();
        if !path.exists() {
            return Ok(None);
        }

        let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
        Ok(Game::import_from_json(&json))
    }

    pub fn export_game(&self, game: &Game, export_path: &str) -> Result<(), String> {
        fs::write(export_path, game.export_to_json()).map_err(|e| e.to_string())
    }

    pub fn import_game(&self, import_path: &str) -> Result<Option<Game>, String> {
        if !Path::new(import_path).exists() {
            return Ok(None);
        }

        let json = fs::read_to_string(import_path).map_err(|e| e.to_string())?;
        Ok(Game::import_from_json(&json))
    }
}
