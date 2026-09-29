use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MunchkinStats {
    pub level: i32,
    #[serde(rename = "equipmentBonus")]
    pub equipment_bonus: i32,
    pub gender: Option<MunchkinGender>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MunchkinGender {
    Male,
    Female,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Player {
    pub id: String,
    pub name: String,
    pub color: String,
    pub score: i32,
    #[serde(default = "default_active")]
    pub is_active: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub munchkin: Option<MunchkinStats>,
}

fn default_active() -> bool {
    true
}

impl Player {
    pub fn new(id: String, name: String, color: String) -> Self {
        Self {
            id,
            name,
            color,
            score: 0,
            is_active: true,
            munchkin: None,
        }
    }

    pub fn with_munchkin(id: String, name: String, color: String, starting_level: i32) -> Self {
        let level = starting_level.clamp(0, 10);
        Self {
            id,
            name,
            color,
            score: level,
            is_active: true,
            munchkin: Some(MunchkinStats {
                level,
                equipment_bonus: 0,
                gender: Some(MunchkinGender::Male),
            }),
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
        assert!(player.munchkin.is_none());
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

    #[test]
    fn munchkin_player_has_bounded_level() {
        let player = Player::with_munchkin(
            "p1".to_string(),
            "Alice".to_string(),
            "#F44336".to_string(),
            99,
        );
        assert_eq!(player.score, 10);
        assert_eq!(player.munchkin.unwrap().level, 10);
    }

    #[test]
    fn munchkin_stats_round_trip_with_react_field_names() {
        let player = Player::with_munchkin(
            "p1".to_string(),
            "Alice".to_string(),
            "#F44336".to_string(),
            1,
        );
        let json = serde_json::to_string(&player).unwrap();
        assert!(json.contains(""equipmentBonus":0"));
        assert!(json.contains(""gender":"male""));
        let restored: Player = serde_json::from_str(&json).unwrap();
        assert_eq!(restored, player);
    }
}
