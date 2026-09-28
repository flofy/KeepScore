use serde::{Deserialize, Serialize};

use crate::game::player::Player;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScoreAction {
    Add { player_id: String, delta: i32 },
    Set {
        player_id: String,
        previous_score: i32,
        score: i32,
    },
    ResetAll {
        previous_scores: Vec<(String, i32)>,
    },
    TogglePlayer {
        player_id: String,
        previous_active: bool,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub players: Vec<Player>,
    pub history: Vec<ScoreAction>,
    pub current_index: usize,
    pub game_name: String,
}

impl Game {
    pub fn new(game_name: String) -> Self {
        Self {
            players: Vec::new(),
            history: Vec::new(),
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

    pub fn apply_action(&mut self, action: ScoreAction) {
        self.apply_action_without_history(&action);

        if self.current_index < self.history.len() {
            self.history.truncate(self.current_index);
        }

        self.history.push(action);
        self.current_index = self.history.len();
    }

    fn apply_action_without_history(&mut self, action: &ScoreAction) {
        match action {
            ScoreAction::Add { player_id, delta } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.add_score(*delta);
                }
            }
            ScoreAction::Set {
                player_id, score, ..
            } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.set_score(*score);
                }
            }
            ScoreAction::ResetAll { .. } => {
                for player in &mut self.players {
                    player.set_score(0);
                }
            }
            ScoreAction::TogglePlayer { player_id, .. } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.toggle_active();
                }
            }
        }
    }

    pub fn set_score(&mut self, player_id: &str, score: i32) -> bool {
        let Some(previous_score) = self.get_player(player_id).map(|p| p.score) else {
            return false;
        };

        self.apply_action(ScoreAction::Set {
            player_id: player_id.to_owned(),
            previous_score,
            score,
        });
        true
    }

    pub fn reset_all(&mut self) {
        let previous_scores = self
            .players
            .iter()
            .map(|player| (player.id.clone(), player.score))
            .collect();

        self.apply_action(ScoreAction::ResetAll { previous_scores });
    }

    pub fn toggle_player(&mut self, player_id: &str) -> bool {
        let Some(previous_active) = self.get_player(player_id).map(|p| p.is_active) else {
            return false;
        };

        self.apply_action(ScoreAction::TogglePlayer {
            player_id: player_id.to_owned(),
            previous_active,
        });
        true
    }

    pub fn undo(&mut self) -> Option<ScoreAction> {
        if self.current_index == 0 {
            return None;
        }

        self.current_index -= 1;
        let action = self.history[self.current_index].clone();

        match &action {
            ScoreAction::Add { player_id, delta } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.add_score(-delta);
                }
            }
            ScoreAction::Set {
                player_id,
                previous_score,
                ..
            } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.set_score(*previous_score);
                }
            }
            ScoreAction::ResetAll { previous_scores } => {
                for (player_id, score) in previous_scores {
                    if let Some(player) = self.get_player_mut(player_id) {
                        player.set_score(*score);
                    }
                }
            }
            ScoreAction::TogglePlayer {
                player_id,
                previous_active,
            } => {
                if let Some(player) = self.get_player_mut(player_id) {
                    player.is_active = *previous_active;
                }
            }
        }

        Some(action)
    }

    pub fn redo(&mut self) -> Option<ScoreAction> {
        if self.current_index >= self.history.len() {
            return None;
        }

        let action = self.history[self.current_index].clone();
        self.apply_action_without_history(&action);
        self.current_index += 1;
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

    fn game() -> Game {
        let mut game = Game::new("test".into());
        game.add_player(Player::new("p1".into(), "Alice".into(), "#fff".into()));
        game
    }

    #[test]
    fn undo_redo_add_score() {
        let mut game = game();
        game.apply_action(ScoreAction::Add {
            player_id: "p1".into(),
            delta: 10,
        });

        assert_eq!(game.get_player("p1").unwrap().score, 10);
        game.undo();
        assert_eq!(game.get_player("p1").unwrap().score, 0);
        game.redo();
        assert_eq!(game.get_player("p1").unwrap().score, 10);
    }

    #[test]
    fn undo_set_restores_previous_score() {
        let mut game = game();
        game.apply_action(ScoreAction::Add {
            player_id: "p1".into(),
            delta: 10,
        });
        assert!(game.set_score("p1", 42));

        game.undo();
        assert_eq!(game.get_player("p1").unwrap().score, 10);
        game.undo();
        assert_eq!(game.get_player("p1").unwrap().score, 0);
    }

    #[test]
    fn undo_reset_restores_all_scores() {
        let mut game = game();
        game.apply_action(ScoreAction::Add {
            player_id: "p1".into(),
            delta: 10,
        });
        game.reset_all();

        assert_eq!(game.get_player("p1").unwrap().score, 0);
        game.undo();
        assert_eq!(game.get_player("p1").unwrap().score, 10);
    }

    #[test]
    fn new_action_after_undo_discards_redo_history() {
        let mut game = game();
        game.apply_action(ScoreAction::Add {
            player_id: "p1".into(),
            delta: 10,
        });
        game.apply_action(ScoreAction::Add {
            player_id: "p1".into(),
            delta: 5,
        });
        game.undo();

        game.apply_action(ScoreAction::Add {
            player_id: "p1".into(),
            delta: 2,
        });

        assert!(!game.can_redo());
        assert_eq!(game.get_player("p1").unwrap().score, 12);
    }
}
