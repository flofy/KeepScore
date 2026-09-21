use android_activity::{AndroidApp, MainEvent, WindowEvent};
use crate::game::{Game, Player, ScoreAction};

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
            game: Game::new("Nouvelle Partie".to_string()),
            selected_player_id: None,
            show_player_form: false,
            new_player_name: String::new(),
            new_player_color: "#F44336".to_string(), // Rouge par défaut
        }
    }

    pub fn add_player(&mut self, name: String, color: String) {
        let id = format!("player_{}", self.game.players.len() + 1);
        self.game.add_player(Player::new(id, name, color));
        self.show_player_form = false;
        self.new_player_name.clear();
    }

    pub fn add_score(&mut self, player_id: String, delta: i32) {
        self.game.apply_action(ScoreAction::Add { player_id, delta });
    }

    pub fn reset_scores(&mut self) {
        self.game.apply_action(ScoreAction::ResetAll);
    }

    pub fn undo(&mut self) {
        self.game.undo();
    }

    pub fn redo(&mut self) {
        self.game.redo();
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
}