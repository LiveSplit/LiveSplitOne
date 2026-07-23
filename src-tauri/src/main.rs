#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    borrow::Cow,
    collections::HashMap,
    future::Future,
    net::SocketAddr,
    str::FromStr,
    sync::{Arc, RwLock},
    time::Duration,
};

use futures_util::{SinkExt, StreamExt};
use livesplit_core::{
    event::{CommandSink, Event, Result},
    hotkey::KeyCode,
    networking::server_protocol::Command,
    HotkeyConfig, HotkeySystem, TimeSpan, TimingMethod,
};
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, WebviewWindow};
use tokio::sync::broadcast;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WebSocketMessage {
    #[serde(rename = "heartbeat")]
    Heartbeat {
        timestamp: u64,
    },
    #[serde(rename = "split")]
    Split {
        split_index: u32,
        split_name: String,
        timestamp: u64,
    },
    #[serde(rename = "start")]
    Start {
        timestamp: u64,
    },
    #[serde(rename = "reset")]
    Reset {
        timestamp: u64,
    },
    #[serde(rename = "pause")]
    Pause {
        timestamp: u64,
    },
    #[serde(rename = "resume")]
    Resume {
        timestamp: u64,
    },
    #[serde(rename = "undo_split")]
    UndoSplit {
        timestamp: u64,
    },
    #[serde(rename = "skip_split")]
    SkipSplit {
        timestamp: u64,
    },
}

struct State {
    hotkey_system: RwLock<Option<HotkeySystem<TauriCommandSink>>>,
    window: RwLock<Option<WebviewWindow>>,
    websocket_tx: broadcast::Sender<WebSocketMessage>,
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

#[tauri::command]
async fn start_websocket_server(
    state: tauri::State<'_, State>,
    port: u16,
) -> Result<String, String> {
    let addr = format!("127.0.0.1:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| format!("Failed to bind to {}: {}", addr, e))?;

    let tx = state.websocket_tx.clone();
    
    tokio::spawn(async move {
        println!("WebSocket server listening on: {}", addr);
        
        while let Ok((stream, addr)) = listener.accept().await {
            let tx = tx.clone();
            tokio::spawn(handle_connection(stream, addr, tx));
        }
    });

    Ok(format!("WebSocket server started on {}", addr))
}

async fn handle_connection(
    stream: tokio::net::TcpStream,
    addr: SocketAddr,
    tx: broadcast::Sender<WebSocketMessage>,
) {
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            println!("WebSocket connection error from {}: {}", addr, e);
            return;
        }
    };

    println!("New WebSocket connection from: {}", addr);

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let mut rx = tx.subscribe();
    
    // Send initial heartbeat
    let heartbeat = WebSocketMessage::Heartbeat {
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };
    
    if let Ok(json) = serde_json::to_string(&heartbeat) {
        if ws_sender.send(Message::Text(json)).await.is_err() {
            return;
        }
    }

    // Spawn heartbeat task
    let mut heartbeat_sender = ws_sender.clone();
    let heartbeat_task = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            let heartbeat = WebSocketMessage::Heartbeat {
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            };
            
            if let Ok(json) = serde_json::to_string(&heartbeat) {
                if heartbeat_sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            } else {
                break;
            }
        }
    });

    // Handle incoming messages and broadcast events
    let broadcast_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                // Handle incoming WebSocket messages (if any)
                msg = ws_receiver.next() => {
                    match msg {
                        Some(Ok(Message::Text(_))) => {
                            // For now, we just acknowledge text messages
                            // Could be used for client requests in the future
                        }
                        Some(Ok(Message::Close(_))) | None => {
                            println!("WebSocket connection closed: {}", addr);
                            break;
                        }
                        Some(Err(e)) => {
                            println!("WebSocket error from {}: {}", addr, e);
                            break;
                        }
                        _ => {}
                    }
                }
                // Broadcast events to client
                event = rx.recv() => {
                    match event {
                        Ok(msg) => {
                            if let Ok(json) = serde_json::to_string(&msg) {
                                if ws_sender.send(Message::Text(json)).await.is_err() {
                                    break;
                                }
                            }
                        }
                        Err(broadcast::error::RecvError::Closed) => break,
                        Err(broadcast::error::RecvError::Lagged(_)) => {
                            // Skip lagged messages
                            continue;
                        }
                    }
                }
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = heartbeat_task => {},
        _ = broadcast_task => {},
    }

    println!("WebSocket connection handler finished for: {}", addr);
}

#[derive(Clone)]
struct TauriCommandSink {
    window: Arc<RwLock<Option<WebviewWindow>>>,
    websocket_tx: broadcast::Sender<WebSocketMessage>,
}

impl TauriCommandSink {
    fn send(&self, command: Command) {
        self.window
            .read()
            .unwrap()
            .as_ref()
            .unwrap()
            .emit("command", command)
            .unwrap();
    }

    fn send_websocket_event(&self, event: WebSocketMessage) {
        let _ = self.websocket_tx.send(event);
    }

    fn get_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }
}

impl CommandSink for TauriCommandSink {
    fn start(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Start);
        self.send_websocket_event(WebSocketMessage::Start {
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn split(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Split);
        
        // For now, we'll use placeholder values for split info
        // In a real implementation, you'd get this from the timer state
        self.send_websocket_event(WebSocketMessage::Split {
            split_index: 0, // This should come from actual timer state
            split_name: "Split".to_string(), // This should come from actual split data
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn split_or_start(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::SplitOrStart);
        // This could be either a start or split, ideally you'd check timer state
        self.send_websocket_event(WebSocketMessage::Split {
            split_index: 0,
            split_name: "Split".to_string(),
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn reset(&self, save_attempt: Option<bool>) -> impl Future<Output = Result> + 'static {
        self.send(Command::Reset { save_attempt });
        self.send_websocket_event(WebSocketMessage::Reset {
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn undo_split(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::UndoSplit);
        self.send_websocket_event(WebSocketMessage::UndoSplit {
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn skip_split(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::SkipSplit);
        self.send_websocket_event(WebSocketMessage::SkipSplit {
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn toggle_pause_or_start(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::TogglePauseOrStart);
        // This could be either pause or resume, ideally you'd check timer state
        self.send_websocket_event(WebSocketMessage::Pause {
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn pause(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Pause);
        self.send_websocket_event(WebSocketMessage::Pause {
            timestamp: Self::get_timestamp(),
        });
        async { Ok(Event::Unknown) }
    }

    fn resume(&self) -> impl Future<Output = Result> + 'static {
        self.send(Command::Resume);
        self.send_websocket_event(WebSocketMessage::Resume {
            timestamp: Self::get_timestamp(),
        });
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

#[tokio::main]
async fn main() {
    let (websocket_tx, _) = broadcast::channel(100);
    
    let sink = TauriCommandSink {
        window: Arc::new(RwLock::new(None)),
        websocket_tx: websocket_tx.clone(),
    };
    
    let hotkey_system = RwLock::new(HotkeySystem::new(sink.clone()).ok());
    
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(State {
            hotkey_system,
            window: RwLock::new(None),
            websocket_tx,
        })
        .setup(move |app| {
            let main_window = app.webview_windows().values().next().unwrap().clone();
            app.state::<State>()
                .window
                .write()
                .unwrap()
                .replace(main_window.clone());
            *sink.window.write().unwrap() = Some(main_window);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_hotkey_config,
            set_hotkey_activation,
            get_hotkey_config,
            resolve_hotkey,
            settings_changed,
            start_websocket_server,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}