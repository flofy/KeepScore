use android_activity::{
    AndroidApp, MainEvent, PollEvent, WindowEvent,
    apk::AssetFile, input::Keycode
};
use jni::{
    objects::{JObject, JValue},
    sys::{jobject, JNIEnv},
};
use std::sync::{Arc, Mutex};
use android_logger::Config;
use log::{info, error};

mod game;
mod ui;

use game::{Game, Player, ScoreAction, StorageManager};
use ui::UIState;

struct KeepScoreApp {
    app: AndroidApp,
    state: Arc<Mutex<UIState>>,
    storage: StorageManager,
}

impl KeepScoreApp {
    fn new(app: AndroidApp) -> Self {
        android_logger::init_once(Config::default().with_min_level(log::Level::Info));

        let storage = StorageManager::new(app.clone());

        // Charger la partie existante ou créer une nouvelle
        let mut state = UIState::new();
        if let Ok(Some(saved_game)) = storage.load_game() {
            state.game = saved_game;
        }

        Self {
            app,
            state: Arc::new(Mutex::new(state)),
            storage,
        }
    }

    fn handle_input(&mut self, event: &MainEvent) -> bool {
        match event {
            MainEvent::Window { win_event, .. } => {
                match win_event {
                    WindowEvent::RedrawRequested => {
                        self.render();
                        true
                    }
                    WindowEvent::Key(key_event) => {
                        if key_event.pressed && key_event.keycode == Keycode::Back {
                            self.app.exit();
                            true
                        } else {
                            false
                        }
                    }
                    _ => false,
                }
            }
            MainEvent::Poll => {
                // Gérer les événements de polling
                false
            }
            _ => false,
        }
    }

    fn render(&self) {
        let state = self.state.lock().unwrap();
        info!("Rendering UI with {} players", state.game.players.len());
    }
}

#[no_mangle]
#[allow(non_snake_case)]
pub extern "C" fn nativeInit(activity: jobject) {
    android_activity::initialize_main_thread(|app: AndroidApp| {
        let mut app_state = KeepScoreApp::new(app);

        app_state.app.set_event_loop(Box::new(move |event| {
            app_state.handle_input(&event)
        }));

        // Charger et afficher l'UI initiale
        app_state.render();
    });
}

// JNI Export
#[no_mangle]
#[allow(non_snake_case)]
pub extern "C" fn Java_com_keepscore_MainActivity_nativeInit(
    _env: JNIEnv,
    _: JObject,
    activity: JObject,
) {
    nativeInit(activity.into_raw());
}