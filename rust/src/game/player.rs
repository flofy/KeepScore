use serde::{Deserialize, Serialize};

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

#[cfg(test)]
mod tests {
    use super::*;

    fn player() -> Player {
        Player::new("p1".to_string(), "Alice".to_string(), "#F44336".to_string())
    }

    #[test]
    fn new_player_starts_at_zero() {
        let player = player();
        assert_eq!(player.score, 0);
        assert!(player.is_active);
        assert_eq!(player.name, "Alice");
    }

    #[test]
    fn add_score_accumulates() {
        let mut player = player();
        assert_eq!(player.add_score(10), 10);
        player.add_score(-3);
        assert_eq!(player.score, 7);
    }

    #[test]
    fn set_score_and_toggle_active() {
        let mut player = player();
        player.set_score(42);
        assert_eq!(player.score, 42);
        player.toggle_active();
        assert!(!player.is_active);
        player.toggle_active();
        assert!(player.is_active);
    }
}
