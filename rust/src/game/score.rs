use std::collections::VecDeque;

use serde::{Deserialize, Serialize};

use crate::game::player::Player;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ScoreAction {
    Add { player_id: String, delta: i32 },
    Set { player_id: String, score: i32 },
    ResetAll,
    TogglePlayer { player_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub players: Vec<Player>,
    pub history: VecDeque<ScoreAction>,
    pub current_index: usize,
    pub game_name: String,
}

impl Game {
    pub fn new(game_name: String) -> Self {
        Self {
            players: Vec::new(),
            history: VecDeque::new(),
            current_index: 0,
            game_name,
        }
    }

    pub fn add_player(&mut self, player: Player) {
        self.players.push(player);
    }

    pub fn remove_player(&mut self, player_id: &str) -> bool {
        if let Some(index) = self.players.iter().position(|p| p.id == player_id) {
            self.players.remove(index);
            true
        } else {
            false
        }
    }

    pub fn get_player(&self, player_id: &str) -> Option<&Player> {
        self.players.iter().find(|p| p.id == player_id)
    }

    pub fn get_player_mut(&mut self, player_id: &str) -> Option<&mut Player> {
        self.players.iter_mut().find(|p| p.id == player_id)
    }

    /// Applies an action to the players, without touching the history.
    fn apply_to_players(&mut self, action: &ScoreAction) {
        match action {
            ScoreAction::Add { player_id, delta } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.add_score(*delta);
                }
            }
            ScoreAction::Set { player_id, score } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.set_score(*score);
                }
            }
            ScoreAction::ResetAll => {
                for player in &mut self.players {
                    player.set_score(0);
                }
            }
            ScoreAction::TogglePlayer { player_id } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.toggle_active();
                }
            }
        }
    }

    pub fn apply_action(&mut self, action: ScoreAction) {
        self.apply_to_players(&action);

        // Drop any redo history, then record the action.
        while self.history.len() > self.current_index {
            self.history.pop_back();
        }

        self.history.push_back(action);
        self.current_index = self.history.len();
    }

    pub fn undo(&mut self) -> Option<ScoreAction> {
        if !self.can_undo() {
            return None;
        }

        let action = self.history[self.current_index - 1].clone();
        self.current_index -= 1;

        match &action {
            ScoreAction::Add { player_id, delta } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.add_score(-delta);
                }
            }
            ScoreAction::Set { player_id, .. } => {
                // Best-effort: the previous score is not stored in the history,
                // so undoing a `Set` resets the player's score.
                if let Some(player) = self.get_player_mut(player_id) {
                    player.set_score(0);
                }
            }
            ScoreAction::ResetAll => {
                // `ResetAll` cannot be undone exactly: previous scores are not stored.
            }
            ScoreAction::TogglePlayer { player_id } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.toggle_active();
                }
            }
        }

        Some(action)
    }

    pub fn redo(&mut self) -> Option<ScoreAction> {
        if !self.can_redo() {
            return None;
        }

        let action = self.history[self.current_index].clone();
        self.current_index += 1;
        self.apply_to_players(&action);

        Some(action)
    }

    pub fn can_undo(&self) -> bool {
        self.current_index > 0
    }

    pub fn can_redo(&self) -> bool {
        self.current_index < self.history.len()
    }

    pub fn export_to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    pub fn import_from_json(json: &str) -> Option<Self> {
        serde_json::from_str(json).ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn player(id: &str, name: &str) -> Player {
        Player::new(id.to_string(), name.to_string(), "#F44336".to_string())
    }

    fn game_with_two_players() -> Game {
        let mut game = Game::new("Test".to_string());
        game.add_player(player("p1", "Alice"));
        game.add_player(player("p2", "Bob"));
        game
    }

    #[test]
    fn add_and_remove_players() {
        let mut game = game_with_two_players();
        assert_eq!(game.players.len(), 2);
        assert!(game.remove_player("p1"));
        assert_eq!(game.players.len(), 1);
        assert!(!game.remove_player("p1"));
    }

    #[test]
    fn add_score_updates_player() {
        let mut game = game_with_two_players();
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 5 });
        assert_eq!(game.get_player("p1").unwrap().score, 5);
        assert_eq!(game.get_player("p2").unwrap().score, 0);
    }

    #[test]
    fn reset_all_zeroes_every_player() {
        let mut game = game_with_two_players();
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 5 });
        game.apply_action(ScoreAction::Add { player_id: "p2".to_string(), delta: 9 });
        game.apply_action(ScoreAction::ResetAll);
        assert_eq!(game.get_player("p1").unwrap().score, 0);
        assert_eq!(game.get_player("p2").unwrap().score, 0);
    }

    #[test]
    fn undo_and_redo_add() {
        let mut game = game_with_two_players();
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 5 });
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 3 });
        assert_eq!(game.get_player("p1").unwrap().score, 8);

        assert!(game.undo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 5);
        assert!(game.undo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 0);
        assert!(!game.can_undo());

        assert!(game.redo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 5);
        assert!(game.redo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 8);
        assert!(!game.can_redo());
    }

    #[test]
    fn redo_allows_multiple_steps_after_undo() {
        let mut game = game_with_two_players();
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 5 });
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 3 });
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 2 });

        assert!(game.undo().is_some());
        assert!(game.undo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 5);

        assert!(game.redo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 8);
        assert!(game.redo().is_some());
        assert_eq!(game.get_player("p1").unwrap().score, 10);
        assert!(!game.can_redo());
    }

    #[test]
    fn new_action_drops_redo_history() {
        let mut game = game_with_two_players();
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 5 });
        game.undo();
        game.apply_action(ScoreAction::Add { player_id: "p2".to_string(), delta: 1 });
        assert!(!game.can_redo());
        assert_eq!(game.get_player("p2").unwrap().score, 1);
        assert_eq!(game.get_player("p1").unwrap().score, 0);
    }

    #[test]
    fn json_round_trip() {
        let mut game = game_with_two_players();
        game.apply_action(ScoreAction::Add { player_id: "p1".to_string(), delta: 7 });
        let json = game.export_to_json();
        let restored = Game::import_from_json(&json).unwrap();
        assert_eq!(restored.players.len(), 2);
        assert_eq!(restored.get_player("p1").unwrap().score, 7);
        assert_eq!(restored.game_name, "Test");
    }
}
