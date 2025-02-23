#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    borrow::Cow,
    future::Future,
    str::FromStr,
    sync::{Arc, RwLock},
};

use livesplit_core::{
    event::{CommandSink, Event, Result},
    hotkey::KeyCode,
    networking::server_protocol::Command,
    HotkeyConfig, HotkeySystem, TimeSpan, TimingMethod,
};
use tauri::{Emitter, Manager, WebviewWindow};

struct State {
    hotkey_system: RwLock<Option<HotkeySystem<TauriCommandSink>>>,
    window: RwLock<Option<WebviewWindow>>,
}

#[tauri::command]
fn set_hotkey_config(state: tauri::State<'_, State>, config: HotkeyConfig) -> bool {
    if let Some(hotkey_system) = &mut *state.hotkey_system.write().unwrap() {
        hotkey_system.set_config(config).is_ok()
    } else {
        false
    }
}

#[tauri::command]
fn set_hotkey_activation(state: tauri::State<'_, State>, active: bool) -> bool {
    if let Some(hotkey_system) = &mut *state.hotkey_system.write().unwrap() {
        if active {
            hotkey_system.activate()
        } else {
            hotkey_system.deactivate()
        }
        .is_ok()
    } else {
        false
    }
}

#[tauri::command]
fn get_hotkey_config(state: tauri::State<'_, State>) -> HotkeyConfig {
    if let Some(hotkey_system) = &*state.hotkey_system.read().unwrap() {
        hotkey_system.config()
    } else {
        HotkeyConfig::default()
    }
}

#[tauri::command]
fn resolve_hotkey(state: tauri::State<'_, State>, key_code: String) -> Cow<'static, str> {
    if let Some(hotkey_system) = &*state.hotkey_system.read().unwrap() {
        if let Ok(key_code) = KeyCode::from_str(&key_code) {
            return hotkey_system.resolve(key_code);
        }
    }
    key_code.into()
}

#[tauri::command]
fn settings_changed(state: tauri::State<'_, State>, always_on_top: bool) {
    if let Some(window) = &*state.window.read().unwrap() {
        window.set_always_on_top(always_on_top).unwrap();
    }
}

#[derive(Clone)]
struct TauriCommandSink(Arc<RwLock<Option<WebviewWindow>>>);

impl TauriCommandSink {
    fn send(&self, command: Command) {
        self.0
            .read()
            .unwrap()
            .as_ref()
            .unwrap()
            .emit("command", command)
            .unwrap();
    }
}

impl CommandSink for TauriCommandSink {
    fn start(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Start);
        async { Ok(Event::Unknown) }
    }

    fn split(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Split);
        async { Ok(Event::Unknown) }
    }

    fn split_or_start(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::SplitOrStart);
        async { Ok(Event::Unknown) }
    }

    fn reset(&self, save_attempt: Option<bool>) -> impl Future<Output = Result> + 'static {
        self.send(Command::Reset { save_attempt });
        async { Ok(Event::Unknown) }
    }

    fn undo_split(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::UndoSplit);
        async { Ok(Event::Unknown) }
    }

    fn skip_split(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::SkipSplit);
        async { Ok(Event::Unknown) }
    }

    fn toggle_pause_or_start(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::TogglePauseOrStart);
        async { Ok(Event::Unknown) }
    }

    fn pause(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Pause);
        async { Ok(Event::Unknown) }
    }

    fn resume(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Resume);
        async { Ok(Event::Unknown) }
    }

    fn undo_all_pauses(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::UndoAllPauses);
        async { Ok(Event::Unknown) }
    }

    fn switch_to_previous_comparison(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::SwitchToPreviousComparison);
        async { Ok(Event::Unknown) }
    }

    fn switch_to_next_comparison(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::SwitchToNextComparison);
        async { Ok(Event::Unknown) }
    }

    fn set_current_comparison(
        &self,
        comparison: Cow<'_, str>,
    ) -> impl Future<Output = Result> + 'static {
        self.send(Command::SetCurrentComparison { comparison });
        async { Ok(Event::Unknown) }
    }

    fn toggle_timing_method(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::ToggleTimingMethod);
        async { Ok(Event::Unknown) }
    }

    fn set_current_timing_method(
        &self,
        method: TimingMethod,
    ) -> impl Future<Output = Result> + 'static {
        self.send(Command::SetCurrentTimingMethod {
            timing_method: method,
        });
        async { Ok(Event::Unknown) }
    }

    fn initialize_game_time(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::InitializeGameTime);
        async { Ok(Event::Unknown) }
    }

    fn set_game_time(&self, time: TimeSpan) -> impl Future<Output = Result> + 'static {
        self.send(Command::SetGameTime { time });
        async { Ok(Event::Unknown) }
    }

    fn pause_game_time(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::PauseGameTime);
        async { Ok(Event::Unknown) }
    }

    fn resume_game_time(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::ResumeGameTime);
        async { Ok(Event::Unknown) }
    }

    fn set_loading_times(&self, time: TimeSpan) -> impl Future<Output = Result> + 'static {
        self.send(Command::SetLoadingTimes { time });
        async { Ok(Event::Unknown) }
    }

    fn set_custom_variable(
        &self,
        key: Cow<'_, str>,
        value: Cow<'_, str>,
    ) -> impl Future<Output = Result> + 'static {
        self.send(Command::SetCustomVariable { key, value });
        async { Ok(Event::Unknown) }
    }
}

fn main() {
    let sink = TauriCommandSink(Arc::new(RwLock::new(None)));
    let hotkey_system = RwLock::new(HotkeySystem::new(sink.clone()).ok());
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(State {
            hotkey_system,
            window: RwLock::new(None),
        })
        .setup(move |app| {
            let main_window = app.webview_windows().values().next().unwrap().clone();
            app.state::<State>()
                .window
                .write()
                .unwrap()
                .replace(main_window.clone());
            *sink.0.write().unwrap() = Some(main_window);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_hotkey_config,
            set_hotkey_activation,
            get_hotkey_config,
            resolve_hotkey,
            settings_changed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
