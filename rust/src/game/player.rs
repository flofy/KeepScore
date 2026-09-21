use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub color: String,
    pub score: i32,
    pub is_active: bool,
}

impl Player {
    pub fn new(id: String, name: String, color: String) -> Self {
        Self {
            id,
            name,
            color,
            score: 0,
            is_active: true,
        }
    }

    pub fn add_score(&mut self, delta: i32) -> i32 {
        self.score += delta;
        self.score
    }

    pub fn set_score(&mut self, score: i32) {
        self.score = score;
    }

    pub fn toggle_active(&mut self) {
        self.is_active = !self.is_active;
    }
}