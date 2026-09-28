use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use jni::objects::{JObject, JString};
use jni::JNIEnv;

mod game;
mod ui;

use game::StorageManager;
use ui::UIState;

static APP_STATE: OnceLock<Mutex<UIState>> = OnceLock::new();

fn initialize(files_dir: PathBuf) {
    let storage = StorageManager::new(files_dir);
    let mut state = UIState::new();

    if let Ok(Some(saved_game)) = storage.load_game() {
        state.game = saved_game;
    }

    let _ = APP_STATE.set(Mutex::new(state));
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeInit(
    mut env: JNIEnv,
    _: JObject,
    files_dir: JString,
) {
    android_logger::init_once(
        android_logger::Config::default().with_min_level(log::Level::Info),
    );

    let files_dir = match env.get_string(&files_dir) {
        Ok(value) => value.to_string_lossy().into_owned(),
        Err(error) => {
            log::error!("Unable to read Android files directory: {error}");
            return;
        }
    };

    initialize(PathBuf::from(files_dir));
    log::info!("KeepScore Rust core initialized");
}
