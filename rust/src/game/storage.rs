use std::fs;
use std::path::PathBuf;

use crate::game::score::Game;

/// Persists games to the local filesystem (e.g. the Android files dir).
pub struct StorageManager {
    base_dir: PathBuf,
}

impl StorageManager {
    pub fn new(base_dir: impl Into<PathBuf>) -> Self {
        Self {
            base_dir: base_dir.into(),
        }
    }

    fn save_path(&self) -> PathBuf {
        self.base_dir.join("keepscore_save.json")
    }

    pub fn save_game(&self, game: &Game) -> Result<(), String> {
        let json = game.export_to_json();
        fs::write(self.save_path(), json).map_err(|e| e.to_string())
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
        let json = game.export_to_json();
        fs::write(PathBuf::from(export_path), json).map_err(|e| e.to_string())
    }

    pub fn import_game(&self, import_path: &str) -> Result<Option<Game>, String> {
        let path = PathBuf::from(import_path);
        if !path.exists() {
            return Ok(None);
        }
        let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
        Ok(Game::import_from_json(&json))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game::player::Player;

    fn temp_dir() -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "keepscore_storage_test_{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn player(name: &str) -> Player {
        Player::new("p1".to_string(), name.to_string(), "#F44336".to_string())
    }

    #[test]
    fn save_and_load_round_trip() {
        let dir = temp_dir();
        let storage = StorageManager::new(&dir);

        let mut game = Game::new("Partie test".to_string());
        game.add_player(player("Alice"));

        storage.save_game(&game).unwrap();
        let loaded = storage.load_game().unwrap().unwrap();
        assert_eq!(loaded.game_name, "Partie test");
        assert_eq!(loaded.players.len(), 1);
        assert_eq!(loaded.players[0].name, "Alice");
    }

    #[test]
    fn load_missing_file_returns_none() {
        let dir = temp_dir();
        let storage = StorageManager::new(dir.join("nonexistent"));
        assert!(storage.load_game().unwrap().is_none());
    }

    #[test]
    fn export_and_import_game() {
        let dir = temp_dir();
        let storage = StorageManager::new(&dir);

        let mut game = Game::new("Export".to_string());
        game.add_player(player("Alice"));

        let export_path = dir.join("export.json");
        let export_path = export_path.to_str().unwrap();
        storage.export_game(&game, export_path).unwrap();

        let imported = storage.import_game(export_path).unwrap().unwrap();
        assert_eq!(imported.game_name, "Export");
        assert_eq!(imported.players.len(), 1);

        let missing = dir.join("missing.json");
        assert!(storage
            .import_game(missing.to_str().unwrap())
            .unwrap()
            .is_none());
    }
}
