pub mod player;
pub mod score;
pub mod storage;

pub use player::Player;
pub use score::{Game, ScoreAction};
pub use storage::StorageManager;