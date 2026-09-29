use crate::game::{Game, Player, ScoreAction};

/// UI state shared between the Rust core and the Java layer.
pub struct UIState {
    pub game: Game,
    pub selected_player_id: Option<String>,
    pub show_player_form: bool,
    pub new_player_name: String,
    pub new_player_color: String,
}

impl UIState {
    pub fn new() -> Self {
        Self {
            game: Game::new("Nouvelle partie".to_string()),
            selected_player_id: None,
            show_player_form: false,
            new_player_name: String::new(),
            new_player_color: "#F44336".to_string(),
        }
    }

    pub fn add_player(&mut self, name: String, color: String) {
        let id = format!("player_{}", self.game.players.len() + 1);
        self.game.add_player(Player::new(id, name, color));
        self.show_player_form = false;
        self.new_player_name.clear();
    }

    pub fn add_score(&mut self, player_id: String, delta: i32) {
        self.game
            .apply_action(ScoreAction::Add { player_id, delta });
    }

    pub fn set_score(&mut self, player_id: String, score: i32) {
        let Some(previous_score) = self.game.get_player(&player_id).map(|player| player.score) else {
            return;
        };
        self.game.apply_action(ScoreAction::Set {
            player_id,
            previous_score,
            score,
        });
    }

    pub fn reset_scores(&mut self) {
        let previous_scores = self
            .game
            .players
            .iter()
            .map(|player| (player.id.clone(), player.score))
            .collect();
        self.game
            .apply_action(ScoreAction::ResetAll { previous_scores });
    }

    pub fn undo(&mut self) -> bool {
        self.game.undo().is_some()
    }

    pub fn redo(&mut self) -> bool {
        self.game.redo().is_some()
    }

    pub fn toggle_player_form(&mut self) {
        self.show_player_form = !self.show_player_form;
    }

    pub fn set_new_player_name(&mut self, name: String) {
        self.new_player_name = name;
    }

    pub fn set_new_player_color(&mut self, color: String) {
        self.new_player_color = color;
    }

    pub fn select_player(&mut self, player_id: Option<String>) {
        self.selected_player_id = player_id;
    }

    pub fn toggle_player(&mut self, player_id: String) {
        let Some(previous_active) = self.game.get_player(&player_id).map(|player| player.is_active) else {
            return;
        };
        self.game.apply_action(ScoreAction::TogglePlayer {
            player_id,
            previous_active,
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_state_has_empty_game() {
        let state = UIState::new();
        assert_eq!(state.game.players.len(), 0);
        assert!(!state.show_player_form);
        assert_eq!(state.new_player_color, "#F44336");
    }

    #[test]
    fn add_player_and_score() {
        let mut state = UIState::new();
        state.add_player("Alice".to_string(), "#F44336".to_string());
        assert_eq!(state.game.players.len(), 1);
        assert!(!state.show_player_form);

        state.add_score("player_1".to_string(), 5);
        assert_eq!(state.game.get_player("player_1").unwrap().score, 5);
    }
}
