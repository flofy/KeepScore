//! JNI bridge between the Android app (`com.keepscore`) and the Rust game logic.

use std::sync::{Mutex, OnceLock};

use jni::objects::{JObject, JString};
use jni::sys::{jboolean, jint, JNI_FALSE, JNI_TRUE};
use jni::JNIEnv;

mod game;
mod ui;

use game::StorageManager;
use ui::UIState;

/// Global application state, owned by the Rust library and driven from Java via JNI.
struct AppState {
    state: UIState,
    storage: StorageManager,
}

fn app_state() -> &'static Mutex<AppState> {
    static APP_STATE: OnceLock<Mutex<AppState>> = OnceLock::new();
    APP_STATE.get_or_init(|| {
        Mutex::new(AppState {
            state: UIState::new(),
            storage: StorageManager::new(std::env::temp_dir()),
        })
    })
}

fn read_string(env: &mut JNIEnv, value: &JString) -> String {
    env.get_string(value).map(|s| s.into()).unwrap_or_default()
}

fn as_jboolean(value: bool) -> jboolean {
    if value {
        JNI_TRUE
    } else {
        JNI_FALSE
    }
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeInit<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    files_dir: JString<'local>,
) {
    let files_dir = read_string(&mut env, &files_dir);
    let mut app = app_state().lock().unwrap();
    app.storage = StorageManager::new(&files_dir);
    if let Ok(Some(game)) = app.storage.load_game() {
        app.state.game = game;
    }
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeAddPlayer<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    name: JString<'local>,
    color: JString<'local>,
) {
    let name = read_string(&mut env, &name);
    let color = read_string(&mut env, &color);
    let mut app = app_state().lock().unwrap();
    app.state.add_player(name, color);
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeRenamePlayer<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    player_id: JString<'local>,
    name: JString<'local>,
) -> jboolean {
    let player_id = read_string(&mut env, &player_id);
    let name = read_string(&mut env, &name);
    let mut app = app_state().lock().unwrap();
    as_jboolean(app.state.rename_player(player_id, name))
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeAddScore<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    player_id: JString<'local>,
    delta: jint,
) {
    let player_id = read_string(&mut env, &player_id);
    let mut app = app_state().lock().unwrap();
    app.state.add_score(player_id, delta);
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeSetScore<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    player_id: JString<'local>,
    score: jint,
) {
    let player_id = read_string(&mut env, &player_id);
    let mut app = app_state().lock().unwrap();
    app.state.set_score(player_id, score);
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeResetScores(
    _env: JNIEnv,
    _this: JObject,
) {
    let mut app = app_state().lock().unwrap();
    app.state.reset_scores();
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeUndo(
    _env: JNIEnv,
    _this: JObject,
) -> jboolean {
    let mut app = app_state().lock().unwrap();
    as_jboolean(app.state.undo())
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeRedo(
    _env: JNIEnv,
    _this: JObject,
) -> jboolean {
    let mut app = app_state().lock().unwrap();
    as_jboolean(app.state.redo())
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeSave(
    _env: JNIEnv,
    _this: JObject,
) -> jboolean {
    let mut app = app_state().lock().unwrap();
    let result = app.storage.save_game(&app.state.game);
    as_jboolean(result.is_ok())
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeExport<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    path: JString<'local>,
) -> jboolean {
    let path = read_string(&mut env, &path);
    let mut app = app_state().lock().unwrap();
    let result = app.storage.export_game(&app.state.game, &path);
    as_jboolean(result.is_ok())
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeImport<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
    path: JString<'local>,
) -> jboolean {
    let path = read_string(&mut env, &path);
    let mut app = app_state().lock().unwrap();
    match app.storage.import_game(&path) {
        Ok(Some(game)) => {
            app.state.game = game;
            JNI_TRUE
        }
        _ => JNI_FALSE,
    }
}

#[no_mangle]
pub extern "system" fn Java_com_keepscore_MainActivity_nativeGetState<'local>(
    mut env: JNIEnv<'local>,
    _this: JObject<'local>,
) -> JString<'local> {
    let json = {
        let app = app_state().lock().unwrap();
        app.state.game.export_to_json()
    };
    env.new_string(json).unwrap_or_else(|_| {
        env.new_string(String::new())
            .expect("Failed to allocate Java string")
    })
}
