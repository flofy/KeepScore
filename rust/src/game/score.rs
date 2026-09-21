use serde::{Serialize, Deserialize};
use std::collections::VecDeque;
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

    pub fn apply_action(&mut self, action: ScoreAction) {
        match action.clone() {
            ScoreAction::Add { player_id, delta } => {
                if let Some(player) = self.get_player_mut(&player_id) {
                    player.add_score(delta);
                }
            }
            ScoreAction::Set { player_id, score } => {
                if let Some(player) = self.get_player_mut(&player_id) {
                    player.set_score(score);
                }
            }
            ScoreAction::ResetAll => {
                for player in &mut self.players {
                    player.set_score(0);
                }
            }
            ScoreAction::TogglePlayer { player_id } => {
                if let Some(player) = self.get_player_mut(&player_id) {
                    player.toggle_active();
                }
            }
        }

        // Truncate redo history
        while self.history.len() > self.current_index {
            self.history.pop_back();
        }

        self.history.push_back(action);
        self.current_index = self.history.len();
    }

    pub fn undo(&mut self) -> Option<ScoreAction> {
        if self.current_index > 0 {
            self.current_index -= 1;
            let action = self.history[self.current_index].clone();

            // Reverse the action
            match &action {
                ScoreAction::Add { player_id, delta } => {
                    if let Some(player) = self.get_player_mut(player_id) {
                        player.add_score(-delta);
                    }
                }
                ScoreAction::Set { player_id, score: new_score } => {
                    // For set actions, we need to restore the previous score
                    // This is simplified - in a real implementation, we'd store the previous score
                    if let Some(player) = self.get_player_mut(player_id) {
                        player.set_score(0);
                    }
                }
                ScoreAction::ResetAll => {
                    // Cannot properly undo reset without storing previous scores
                }
                ScoreAction::TogglePlayer { player_id } => {
                    if let Some(player) = self.get_player_mut(player_id) {
                        player.toggle_active();
                    }
                }
            }

            Some(action)
        } else {
            None
        }
    }

    pub fn redo(&mut self) -> Option<ScoreAction> {
        if self.current_index < self.history.len() {
            let action = self.history[self.current_index].clone();
            self.current_index += 1;

            // Reapply the action
            self.apply_action(action.clone());
            Some(action)
        } else {
            None
        }
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