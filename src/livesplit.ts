declare var LiveSplitCore: any;
var emscriptenModule = LiveSplitCore({});
var liveSplitCoreNative: any = {};

export enum TimingMethod {
    RealTime = 0,
    GameTime = 1,
}

export enum TimerPhase {
    NotRunning = 0,
    Running = 1,
    Ended = 2,
    Paused = 3,
}

export interface TimerComponentStateJson {
    time: string;
    fraction: string;
    color: Color;
}

export interface TitleComponentStateJson {
    icon_change?: string;
    game: string;
    category: string;
    attempts: number;
}

export interface SplitsComponentStateJson {
    splits: SplitStateJson[];
    show_final_separator: boolean;
}

export interface SplitStateJson {
    icon_change?: string;
    name: string;
    delta: string;
    time: string;
    color: Color;
    is_current_split: boolean;
}

export interface PreviousSegmentComponentStateJson {
    text: string;
    time: string;
    color: Color;
}

export interface SumOfBestComponentStateJson {
    text: string;
    time: string;
}

export interface PossibleTimeSaveComponentStateJson {
    text: string;
    time: string;
}

export interface GraphComponentStateJson {
    points: number[][];
    horizontal_grid_lines: number[];
    vertical_grid_lines: number[];
    middle: number;
    is_live_delta_active: boolean;
}

export interface RunEditorStateJson {
    icon_change?: string,
    game: string,
    category: string,
    offset: string,
    attempts: string,
    timing_method: "RealTime" | "GameTime",
    segments: RunEditorRowJson[],
    comparison_names: string[],
    buttons: RunEditorButtonsJson,
}

export interface RunEditorButtonsJson {
    can_remove: boolean,
    can_move_up: boolean,
    can_move_down: boolean,
}

export interface RunEditorRowJson {
    icon_change?: string,
    name: string,
    split_time: string,
    segment_time: string,
    best_segment_time: string,
    comparison_times: string[],
    selected: "NotSelected" | "Selected" | "CurrentRow",
}

export type Color = "Default" |
    "AheadGainingTime" |
    "AheadLosingTime" |
    "BehindLosingTime" |
    "BehindGainingTime" |
    "BestSegment" |
    "NotRunning" |
    "Paused" |
    "PersonalBest";

liveSplitCoreNative.Attempt_index = emscriptenModule.cwrap('Attempt_index', "number", ["number"]);
liveSplitCoreNative.Attempt_time = emscriptenModule.cwrap('Attempt_time', "number", ["number"]);
liveSplitCoreNative.GraphComponent_new = emscriptenModule.cwrap('GraphComponent_new', "number", []);
liveSplitCoreNative.GraphComponent_drop = emscriptenModule.cwrap('GraphComponent_drop', null, ["number"]);
liveSplitCoreNative.GraphComponent_state_as_json = emscriptenModule.cwrap('GraphComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.GraphComponent_state = emscriptenModule.cwrap('GraphComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.GraphComponentState_drop = emscriptenModule.cwrap('GraphComponentState_drop', null, ["number"]);
liveSplitCoreNative.GraphComponentState_points_len = emscriptenModule.cwrap('GraphComponentState_points_len', "number", ["number"]);
liveSplitCoreNative.GraphComponentState_point_x = emscriptenModule.cwrap('GraphComponentState_point_x', "number", ["number", "number"]);
liveSplitCoreNative.GraphComponentState_point_y = emscriptenModule.cwrap('GraphComponentState_point_y', "number", ["number", "number"]);
liveSplitCoreNative.GraphComponentState_horizontal_grid_lines_len = emscriptenModule.cwrap('GraphComponentState_horizontal_grid_lines_len', "number", ["number"]);
liveSplitCoreNative.GraphComponentState_horizontal_grid_line = emscriptenModule.cwrap('GraphComponentState_horizontal_grid_line', "number", ["number", "number"]);
liveSplitCoreNative.GraphComponentState_vertical_grid_lines_len = emscriptenModule.cwrap('GraphComponentState_vertical_grid_lines_len', "number", ["number"]);
liveSplitCoreNative.GraphComponentState_vertical_grid_line = emscriptenModule.cwrap('GraphComponentState_vertical_grid_line', "number", ["number", "number"]);
liveSplitCoreNative.GraphComponentState_middle = emscriptenModule.cwrap('GraphComponentState_middle', "number", ["number"]);
liveSplitCoreNative.GraphComponentState_is_live_delta_active = emscriptenModule.cwrap('GraphComponentState_is_live_delta_active', "number", ["number"]);
liveSplitCoreNative.HotkeySystem_new = emscriptenModule.cwrap('HotkeySystem_new', "number", ["number"]);
liveSplitCoreNative.HotkeySystem_drop = emscriptenModule.cwrap('HotkeySystem_drop', null, ["number"]);
liveSplitCoreNative.PossibleTimeSaveComponent_new = emscriptenModule.cwrap('PossibleTimeSaveComponent_new', "number", []);
liveSplitCoreNative.PossibleTimeSaveComponent_drop = emscriptenModule.cwrap('PossibleTimeSaveComponent_drop', null, ["number"]);
liveSplitCoreNative.PossibleTimeSaveComponent_state_as_json = emscriptenModule.cwrap('PossibleTimeSaveComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.PossibleTimeSaveComponent_state = emscriptenModule.cwrap('PossibleTimeSaveComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.PossibleTimeSaveComponentState_drop = emscriptenModule.cwrap('PossibleTimeSaveComponentState_drop', null, ["number"]);
liveSplitCoreNative.PossibleTimeSaveComponentState_text = emscriptenModule.cwrap('PossibleTimeSaveComponentState_text', "string", ["number"]);
liveSplitCoreNative.PossibleTimeSaveComponentState_time = emscriptenModule.cwrap('PossibleTimeSaveComponentState_time', "string", ["number"]);
liveSplitCoreNative.PreviousSegmentComponent_new = emscriptenModule.cwrap('PreviousSegmentComponent_new', "number", []);
liveSplitCoreNative.PreviousSegmentComponent_drop = emscriptenModule.cwrap('PreviousSegmentComponent_drop', null, ["number"]);
liveSplitCoreNative.PreviousSegmentComponent_state_as_json = emscriptenModule.cwrap('PreviousSegmentComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.PreviousSegmentComponent_state = emscriptenModule.cwrap('PreviousSegmentComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.PreviousSegmentComponentState_drop = emscriptenModule.cwrap('PreviousSegmentComponentState_drop', null, ["number"]);
liveSplitCoreNative.PreviousSegmentComponentState_text = emscriptenModule.cwrap('PreviousSegmentComponentState_text', "string", ["number"]);
liveSplitCoreNative.PreviousSegmentComponentState_time = emscriptenModule.cwrap('PreviousSegmentComponentState_time', "string", ["number"]);
liveSplitCoreNative.Run_new = emscriptenModule.cwrap('Run_new', "number", []);
liveSplitCoreNative.Run_parse = emscriptenModule.cwrap('Run_parse', "number", ["number", "number"]);
liveSplitCoreNative.Run_drop = emscriptenModule.cwrap('Run_drop', null, ["number"]);
liveSplitCoreNative.Run_clone = emscriptenModule.cwrap('Run_clone', "number", ["number"]);
liveSplitCoreNative.Run_game_name = emscriptenModule.cwrap('Run_game_name', "string", ["number"]);
liveSplitCoreNative.Run_game_icon = emscriptenModule.cwrap('Run_game_icon', "string", ["number"]);
liveSplitCoreNative.Run_category_name = emscriptenModule.cwrap('Run_category_name', "string", ["number"]);
liveSplitCoreNative.Run_extended_file_name = emscriptenModule.cwrap('Run_extended_file_name', "string", ["number", "number"]);
liveSplitCoreNative.Run_extended_name = emscriptenModule.cwrap('Run_extended_name', "string", ["number", "number"]);
liveSplitCoreNative.Run_extended_category_name = emscriptenModule.cwrap('Run_extended_category_name', "string", ["number", "number", "number", "number"]);
liveSplitCoreNative.Run_attempt_count = emscriptenModule.cwrap('Run_attempt_count', "number", ["number"]);
liveSplitCoreNative.Run_metadata = emscriptenModule.cwrap('Run_metadata', "number", ["number"]);
liveSplitCoreNative.Run_offset = emscriptenModule.cwrap('Run_offset', "number", ["number"]);
liveSplitCoreNative.Run_len = emscriptenModule.cwrap('Run_len', "number", ["number"]);
liveSplitCoreNative.Run_segment = emscriptenModule.cwrap('Run_segment', "number", ["number", "number"]);
liveSplitCoreNative.Run_attempt_history_len = emscriptenModule.cwrap('Run_attempt_history_len', "number", ["number"]);
liveSplitCoreNative.Run_attempt_history_index = emscriptenModule.cwrap('Run_attempt_history_index', "number", ["number", "number"]);
liveSplitCoreNative.Run_save_as_lss = emscriptenModule.cwrap('Run_save_as_lss', "string", ["number"]);
liveSplitCoreNative.Run_push_segment = emscriptenModule.cwrap('Run_push_segment', null, ["number", "number"]);
liveSplitCoreNative.Run_set_game_name = emscriptenModule.cwrap('Run_set_game_name', null, ["number", "string"]);
liveSplitCoreNative.Run_set_category_name = emscriptenModule.cwrap('Run_set_category_name', null, ["number", "string"]);
liveSplitCoreNative.RunEditor_new = emscriptenModule.cwrap('RunEditor_new', "number", ["number"]);
liveSplitCoreNative.RunEditor_close = emscriptenModule.cwrap('RunEditor_close', "number", ["number"]);
liveSplitCoreNative.RunEditor_state_as_json = emscriptenModule.cwrap('RunEditor_state_as_json', "string", ["number"]);
liveSplitCoreNative.RunEditor_select_timing_method = emscriptenModule.cwrap('RunEditor_select_timing_method', null, ["number", "number"]);
liveSplitCoreNative.RunEditor_unselect = emscriptenModule.cwrap('RunEditor_unselect', null, ["number", "number"]);
liveSplitCoreNative.RunEditor_select_additionally = emscriptenModule.cwrap('RunEditor_select_additionally', null, ["number", "number"]);
liveSplitCoreNative.RunEditor_select_only = emscriptenModule.cwrap('RunEditor_select_only', null, ["number", "number"]);
liveSplitCoreNative.RunEditor_set_game_name = emscriptenModule.cwrap('RunEditor_set_game_name', null, ["number", "string"]);
liveSplitCoreNative.RunEditor_set_category_name = emscriptenModule.cwrap('RunEditor_set_category_name', null, ["number", "string"]);
liveSplitCoreNative.RunEditor_parse_and_set_offset = emscriptenModule.cwrap('RunEditor_parse_and_set_offset', "number", ["number", "string"]);
liveSplitCoreNative.RunEditor_parse_and_set_attempt_count = emscriptenModule.cwrap('RunEditor_parse_and_set_attempt_count', "number", ["number", "string"]);
liveSplitCoreNative.RunEditor_set_game_icon = emscriptenModule.cwrap('RunEditor_set_game_icon', null, ["number", "number", "number"]);
liveSplitCoreNative.RunEditor_insert_segment_above = emscriptenModule.cwrap('RunEditor_insert_segment_above', null, ["number"]);
liveSplitCoreNative.RunEditor_insert_segment_below = emscriptenModule.cwrap('RunEditor_insert_segment_below', null, ["number"]);
liveSplitCoreNative.RunEditor_remove_segments = emscriptenModule.cwrap('RunEditor_remove_segments', null, ["number"]);
liveSplitCoreNative.RunEditor_move_segments_up = emscriptenModule.cwrap('RunEditor_move_segments_up', null, ["number"]);
liveSplitCoreNative.RunEditor_move_segments_down = emscriptenModule.cwrap('RunEditor_move_segments_down', null, ["number"]);
liveSplitCoreNative.RunEditor_selected_set_icon = emscriptenModule.cwrap('RunEditor_selected_set_icon', null, ["number", "number", "number"]);
liveSplitCoreNative.RunEditor_selected_set_name = emscriptenModule.cwrap('RunEditor_selected_set_name', null, ["number", "string"]);
liveSplitCoreNative.RunEditor_selected_parse_and_set_split_time = emscriptenModule.cwrap('RunEditor_selected_parse_and_set_split_time', "number", ["number", "string"]);
liveSplitCoreNative.RunEditor_selected_parse_and_set_segment_time = emscriptenModule.cwrap('RunEditor_selected_parse_and_set_segment_time', "number", ["number", "string"]);
liveSplitCoreNative.RunEditor_selected_parse_and_set_best_segment_time = emscriptenModule.cwrap('RunEditor_selected_parse_and_set_best_segment_time', "number", ["number", "string"]);
liveSplitCoreNative.RunEditor_selected_parse_and_set_comparison_time = emscriptenModule.cwrap('RunEditor_selected_parse_and_set_comparison_time', "number", ["number", "string", "string"]);
liveSplitCoreNative.RunMetadata_run_id = emscriptenModule.cwrap('RunMetadata_run_id', "string", ["number"]);
liveSplitCoreNative.RunMetadata_platform_name = emscriptenModule.cwrap('RunMetadata_platform_name', "string", ["number"]);
liveSplitCoreNative.RunMetadata_uses_emulator = emscriptenModule.cwrap('RunMetadata_uses_emulator', "number", ["number"]);
liveSplitCoreNative.RunMetadata_region_name = emscriptenModule.cwrap('RunMetadata_region_name', "string", ["number"]);
liveSplitCoreNative.Segment_new = emscriptenModule.cwrap('Segment_new', "number", ["string"]);
liveSplitCoreNative.Segment_drop = emscriptenModule.cwrap('Segment_drop', null, ["number"]);
liveSplitCoreNative.Segment_name = emscriptenModule.cwrap('Segment_name', "string", ["number"]);
liveSplitCoreNative.Segment_icon = emscriptenModule.cwrap('Segment_icon', "string", ["number"]);
liveSplitCoreNative.Segment_comparison = emscriptenModule.cwrap('Segment_comparison', "number", ["number", "string"]);
liveSplitCoreNative.Segment_personal_best_split_time = emscriptenModule.cwrap('Segment_personal_best_split_time', "number", ["number"]);
liveSplitCoreNative.Segment_best_segment_time = emscriptenModule.cwrap('Segment_best_segment_time', "number", ["number"]);
liveSplitCoreNative.Segment_segment_history = emscriptenModule.cwrap('Segment_segment_history', "number", ["number"]);
liveSplitCoreNative.SegmentHistory_iter = emscriptenModule.cwrap('SegmentHistory_iter', "number", ["number"]);
liveSplitCoreNative.SegmentHistoryElement_index = emscriptenModule.cwrap('SegmentHistoryElement_index', "number", ["number"]);
liveSplitCoreNative.SegmentHistoryElement_time = emscriptenModule.cwrap('SegmentHistoryElement_time', "number", ["number"]);
liveSplitCoreNative.SegmentHistoryIter_drop = emscriptenModule.cwrap('SegmentHistoryIter_drop', null, ["number"]);
liveSplitCoreNative.SegmentHistoryIter_next = emscriptenModule.cwrap('SegmentHistoryIter_next', "number", ["number"]);
liveSplitCoreNative.SharedTimer_drop = emscriptenModule.cwrap('SharedTimer_drop', null, ["number"]);
liveSplitCoreNative.SharedTimer_share = emscriptenModule.cwrap('SharedTimer_share', "number", ["number"]);
liveSplitCoreNative.SharedTimer_read = emscriptenModule.cwrap('SharedTimer_read', "number", ["number"]);
liveSplitCoreNative.SharedTimer_write = emscriptenModule.cwrap('SharedTimer_write', "number", ["number"]);
liveSplitCoreNative.SplitsComponent_new = emscriptenModule.cwrap('SplitsComponent_new', "number", []);
liveSplitCoreNative.SplitsComponent_drop = emscriptenModule.cwrap('SplitsComponent_drop', null, ["number"]);
liveSplitCoreNative.SplitsComponent_state_as_json = emscriptenModule.cwrap('SplitsComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.SplitsComponent_state = emscriptenModule.cwrap('SplitsComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.SplitsComponent_scroll_up = emscriptenModule.cwrap('SplitsComponent_scroll_up', null, ["number"]);
liveSplitCoreNative.SplitsComponent_scroll_down = emscriptenModule.cwrap('SplitsComponent_scroll_down', null, ["number"]);
liveSplitCoreNative.SplitsComponent_set_visual_split_count = emscriptenModule.cwrap('SplitsComponent_set_visual_split_count', null, ["number", "number"]);
liveSplitCoreNative.SplitsComponent_set_split_preview_count = emscriptenModule.cwrap('SplitsComponent_set_split_preview_count', null, ["number", "number"]);
liveSplitCoreNative.SplitsComponent_set_always_show_last_split = emscriptenModule.cwrap('SplitsComponent_set_always_show_last_split', null, ["number", "number"]);
liveSplitCoreNative.SplitsComponent_set_separator_last_split = emscriptenModule.cwrap('SplitsComponent_set_separator_last_split', null, ["number", "number"]);
liveSplitCoreNative.SplitsComponentState_drop = emscriptenModule.cwrap('SplitsComponentState_drop', null, ["number"]);
liveSplitCoreNative.SplitsComponentState_final_separator_shown = emscriptenModule.cwrap('SplitsComponentState_final_separator_shown', "number", ["number"]);
liveSplitCoreNative.SplitsComponentState_len = emscriptenModule.cwrap('SplitsComponentState_len', "number", ["number"]);
liveSplitCoreNative.SplitsComponentState_icon_change = emscriptenModule.cwrap('SplitsComponentState_icon_change', "string", ["number", "number"]);
liveSplitCoreNative.SplitsComponentState_name = emscriptenModule.cwrap('SplitsComponentState_name', "string", ["number", "number"]);
liveSplitCoreNative.SplitsComponentState_delta = emscriptenModule.cwrap('SplitsComponentState_delta', "string", ["number", "number"]);
liveSplitCoreNative.SplitsComponentState_time = emscriptenModule.cwrap('SplitsComponentState_time', "string", ["number", "number"]);
liveSplitCoreNative.SplitsComponentState_color = emscriptenModule.cwrap('SplitsComponentState_color', "string", ["number", "number"]);
liveSplitCoreNative.SplitsComponentState_is_current_split = emscriptenModule.cwrap('SplitsComponentState_is_current_split', "number", ["number", "number"]);
liveSplitCoreNative.SumOfBestComponent_new = emscriptenModule.cwrap('SumOfBestComponent_new', "number", []);
liveSplitCoreNative.SumOfBestComponent_drop = emscriptenModule.cwrap('SumOfBestComponent_drop', null, ["number"]);
liveSplitCoreNative.SumOfBestComponent_state_as_json = emscriptenModule.cwrap('SumOfBestComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.SumOfBestComponent_state = emscriptenModule.cwrap('SumOfBestComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.SumOfBestComponentState_drop = emscriptenModule.cwrap('SumOfBestComponentState_drop', null, ["number"]);
liveSplitCoreNative.SumOfBestComponentState_text = emscriptenModule.cwrap('SumOfBestComponentState_text', "string", ["number"]);
liveSplitCoreNative.SumOfBestComponentState_time = emscriptenModule.cwrap('SumOfBestComponentState_time', "string", ["number"]);
liveSplitCoreNative.TextComponent_new = emscriptenModule.cwrap('TextComponent_new', "number", []);
liveSplitCoreNative.TextComponent_drop = emscriptenModule.cwrap('TextComponent_drop', null, ["number"]);
liveSplitCoreNative.TextComponent_state_as_json = emscriptenModule.cwrap('TextComponent_state_as_json', "string", ["number"]);
liveSplitCoreNative.TextComponent_state = emscriptenModule.cwrap('TextComponent_state', "number", ["number"]);
liveSplitCoreNative.TextComponent_set_center = emscriptenModule.cwrap('TextComponent_set_center', null, ["number", "string"]);
liveSplitCoreNative.TextComponent_set_left = emscriptenModule.cwrap('TextComponent_set_left', null, ["number", "string"]);
liveSplitCoreNative.TextComponent_set_right = emscriptenModule.cwrap('TextComponent_set_right', null, ["number", "string"]);
liveSplitCoreNative.TextComponentState_drop = emscriptenModule.cwrap('TextComponentState_drop', null, ["number"]);
liveSplitCoreNative.TextComponentState_left = emscriptenModule.cwrap('TextComponentState_left', "string", ["number"]);
liveSplitCoreNative.TextComponentState_right = emscriptenModule.cwrap('TextComponentState_right', "string", ["number"]);
liveSplitCoreNative.TextComponentState_center = emscriptenModule.cwrap('TextComponentState_center', "string", ["number"]);
liveSplitCoreNative.TextComponentState_is_split = emscriptenModule.cwrap('TextComponentState_is_split', "number", ["number"]);
liveSplitCoreNative.Time_drop = emscriptenModule.cwrap('Time_drop', null, ["number"]);
liveSplitCoreNative.Time_clone = emscriptenModule.cwrap('Time_clone', "number", ["number"]);
liveSplitCoreNative.Time_real_time = emscriptenModule.cwrap('Time_real_time', "number", ["number"]);
liveSplitCoreNative.Time_game_time = emscriptenModule.cwrap('Time_game_time', "number", ["number"]);
liveSplitCoreNative.Time_index = emscriptenModule.cwrap('Time_index', "number", ["number", "number"]);
liveSplitCoreNative.TimeSpan_from_seconds = emscriptenModule.cwrap('TimeSpan_from_seconds', "number", ["number"]);
liveSplitCoreNative.TimeSpan_drop = emscriptenModule.cwrap('TimeSpan_drop', null, ["number"]);
liveSplitCoreNative.TimeSpan_clone = emscriptenModule.cwrap('TimeSpan_clone', "number", ["number"]);
liveSplitCoreNative.TimeSpan_total_seconds = emscriptenModule.cwrap('TimeSpan_total_seconds', "number", ["number"]);
liveSplitCoreNative.Timer_new = emscriptenModule.cwrap('Timer_new', "number", ["number"]);
liveSplitCoreNative.Timer_into_shared = emscriptenModule.cwrap('Timer_into_shared', "number", ["number"]);
liveSplitCoreNative.Timer_drop = emscriptenModule.cwrap('Timer_drop', null, ["number"]);
liveSplitCoreNative.Timer_current_timing_method = emscriptenModule.cwrap('Timer_current_timing_method', "number", ["number"]);
liveSplitCoreNative.Timer_current_comparison = emscriptenModule.cwrap('Timer_current_comparison', "string", ["number"]);
liveSplitCoreNative.Timer_is_game_time_initialized = emscriptenModule.cwrap('Timer_is_game_time_initialized', "number", ["number"]);
liveSplitCoreNative.Timer_is_game_time_paused = emscriptenModule.cwrap('Timer_is_game_time_paused', "number", ["number"]);
liveSplitCoreNative.Timer_loading_times = emscriptenModule.cwrap('Timer_loading_times', "number", ["number"]);
liveSplitCoreNative.Timer_current_phase = emscriptenModule.cwrap('Timer_current_phase', "number", ["number"]);
liveSplitCoreNative.Timer_get_run = emscriptenModule.cwrap('Timer_get_run', "number", ["number"]);
liveSplitCoreNative.Timer_print_debug = emscriptenModule.cwrap('Timer_print_debug', null, ["number"]);
liveSplitCoreNative.Timer_split = emscriptenModule.cwrap('Timer_split', null, ["number"]);
liveSplitCoreNative.Timer_skip_split = emscriptenModule.cwrap('Timer_skip_split', null, ["number"]);
liveSplitCoreNative.Timer_undo_split = emscriptenModule.cwrap('Timer_undo_split', null, ["number"]);
liveSplitCoreNative.Timer_reset = emscriptenModule.cwrap('Timer_reset', null, ["number", "number"]);
liveSplitCoreNative.Timer_pause = emscriptenModule.cwrap('Timer_pause', null, ["number"]);
liveSplitCoreNative.Timer_undo_all_pauses = emscriptenModule.cwrap('Timer_undo_all_pauses', null, ["number"]);
liveSplitCoreNative.Timer_set_current_timing_method = emscriptenModule.cwrap('Timer_set_current_timing_method', null, ["number", "number"]);
liveSplitCoreNative.Timer_switch_to_next_comparison = emscriptenModule.cwrap('Timer_switch_to_next_comparison', null, ["number"]);
liveSplitCoreNative.Timer_switch_to_previous_comparison = emscriptenModule.cwrap('Timer_switch_to_previous_comparison', null, ["number"]);
liveSplitCoreNative.Timer_initialize_game_time = emscriptenModule.cwrap('Timer_initialize_game_time', null, ["number"]);
liveSplitCoreNative.Timer_uninitialize_game_time = emscriptenModule.cwrap('Timer_uninitialize_game_time', null, ["number"]);
liveSplitCoreNative.Timer_pause_game_time = emscriptenModule.cwrap('Timer_pause_game_time', null, ["number"]);
liveSplitCoreNative.Timer_unpause_game_time = emscriptenModule.cwrap('Timer_unpause_game_time', null, ["number"]);
liveSplitCoreNative.Timer_set_game_time = emscriptenModule.cwrap('Timer_set_game_time', null, ["number", "number"]);
liveSplitCoreNative.Timer_set_loading_times = emscriptenModule.cwrap('Timer_set_loading_times', null, ["number", "number"]);
liveSplitCoreNative.TimerComponent_new = emscriptenModule.cwrap('TimerComponent_new', "number", []);
liveSplitCoreNative.TimerComponent_drop = emscriptenModule.cwrap('TimerComponent_drop', null, ["number"]);
liveSplitCoreNative.TimerComponent_state_as_json = emscriptenModule.cwrap('TimerComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.TimerComponent_state = emscriptenModule.cwrap('TimerComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.TimerComponentState_drop = emscriptenModule.cwrap('TimerComponentState_drop', null, ["number"]);
liveSplitCoreNative.TimerComponentState_time = emscriptenModule.cwrap('TimerComponentState_time', "string", ["number"]);
liveSplitCoreNative.TimerComponentState_fraction = emscriptenModule.cwrap('TimerComponentState_fraction', "string", ["number"]);
liveSplitCoreNative.TimerComponentState_color = emscriptenModule.cwrap('TimerComponentState_color', "string", ["number"]);
liveSplitCoreNative.TimerReadLock_drop = emscriptenModule.cwrap('TimerReadLock_drop', null, ["number"]);
liveSplitCoreNative.TimerReadLock_timer = emscriptenModule.cwrap('TimerReadLock_timer', "number", ["number"]);
liveSplitCoreNative.TimerWriteLock_drop = emscriptenModule.cwrap('TimerWriteLock_drop', null, ["number"]);
liveSplitCoreNative.TimerWriteLock_timer = emscriptenModule.cwrap('TimerWriteLock_timer', "number", ["number"]);
liveSplitCoreNative.TitleComponent_new = emscriptenModule.cwrap('TitleComponent_new', "number", []);
liveSplitCoreNative.TitleComponent_drop = emscriptenModule.cwrap('TitleComponent_drop', null, ["number"]);
liveSplitCoreNative.TitleComponent_state_as_json = emscriptenModule.cwrap('TitleComponent_state_as_json', "string", ["number", "number"]);
liveSplitCoreNative.TitleComponent_state = emscriptenModule.cwrap('TitleComponent_state', "number", ["number", "number"]);
liveSplitCoreNative.TitleComponentState_drop = emscriptenModule.cwrap('TitleComponentState_drop', null, ["number"]);
liveSplitCoreNative.TitleComponentState_icon_change = emscriptenModule.cwrap('TitleComponentState_icon_change', "string", ["number"]);
liveSplitCoreNative.TitleComponentState_game = emscriptenModule.cwrap('TitleComponentState_game', "string", ["number"]);
liveSplitCoreNative.TitleComponentState_category = emscriptenModule.cwrap('TitleComponentState_category', "string", ["number"]);
liveSplitCoreNative.TitleComponentState_attempts = emscriptenModule.cwrap('TitleComponentState_attempts', "number", ["number"]);

export class AttemptRef {
    ptr: number;
    index(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Attempt_index(this.ptr);
        return result;
    }
    time(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Attempt_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class AttemptRefMut extends AttemptRef {
}

export class Attempt extends AttemptRefMut {
    with(closure: (obj: Attempt) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

export class GraphComponentRef {
    ptr: number;
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.GraphComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): GraphComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new GraphComponentState(liveSplitCoreNative.GraphComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class GraphComponentRefMut extends GraphComponentRef {
}

export class GraphComponent extends GraphComponentRefMut {
    with(closure: (obj: GraphComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.GraphComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): GraphComponent {
        var result = new GraphComponent(liveSplitCoreNative.GraphComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class GraphComponentStateRef {
    ptr: number;
    pointsLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_points_len(this.ptr);
        return result;
    }
    pointX(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_point_x(this.ptr, index);
        return result;
    }
    pointY(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_point_y(this.ptr, index);
        return result;
    }
    horizontalGridLinesLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_horizontal_grid_lines_len(this.ptr);
        return result;
    }
    horizontalGridLine(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_horizontal_grid_line(this.ptr, index);
        return result;
    }
    verticalGridLinesLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_vertical_grid_lines_len(this.ptr);
        return result;
    }
    verticalGridLine(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_vertical_grid_line(this.ptr, index);
        return result;
    }
    middle(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_middle(this.ptr);
        return result;
    }
    isLiveDeltaActive(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_is_live_delta_active(this.ptr) != 0;
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class GraphComponentStateRefMut extends GraphComponentStateRef {
}

export class GraphComponentState extends GraphComponentStateRefMut {
    with(closure: (obj: GraphComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.GraphComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class HotkeySystemRef {
    ptr: number;
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class HotkeySystemRefMut extends HotkeySystemRef {
}

export class HotkeySystem extends HotkeySystemRefMut {
    with(closure: (obj: HotkeySystem) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.HotkeySystem_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(sharedTimer: SharedTimer): HotkeySystem {
        if (sharedTimer.ptr == 0) {
            throw "sharedTimer is disposed";
        }
        var result = new HotkeySystem(liveSplitCoreNative.HotkeySystem_new(sharedTimer.ptr));
        sharedTimer.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class PossibleTimeSaveComponentRef {
    ptr: number;
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.PossibleTimeSaveComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): PossibleTimeSaveComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new PossibleTimeSaveComponentState(liveSplitCoreNative.PossibleTimeSaveComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class PossibleTimeSaveComponentRefMut extends PossibleTimeSaveComponentRef {
}

export class PossibleTimeSaveComponent extends PossibleTimeSaveComponentRefMut {
    with(closure: (obj: PossibleTimeSaveComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.PossibleTimeSaveComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): PossibleTimeSaveComponent {
        var result = new PossibleTimeSaveComponent(liveSplitCoreNative.PossibleTimeSaveComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class PossibleTimeSaveComponentStateRef {
    ptr: number;
    text(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PossibleTimeSaveComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PossibleTimeSaveComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class PossibleTimeSaveComponentStateRefMut extends PossibleTimeSaveComponentStateRef {
}

export class PossibleTimeSaveComponentState extends PossibleTimeSaveComponentStateRefMut {
    with(closure: (obj: PossibleTimeSaveComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.PossibleTimeSaveComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class PreviousSegmentComponentRef {
    ptr: number;
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): PreviousSegmentComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new PreviousSegmentComponentState(liveSplitCoreNative.PreviousSegmentComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class PreviousSegmentComponentRefMut extends PreviousSegmentComponentRef {
}

export class PreviousSegmentComponent extends PreviousSegmentComponentRefMut {
    with(closure: (obj: PreviousSegmentComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.PreviousSegmentComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): PreviousSegmentComponent {
        var result = new PreviousSegmentComponent(liveSplitCoreNative.PreviousSegmentComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class PreviousSegmentComponentStateRef {
    ptr: number;
    text(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class PreviousSegmentComponentStateRefMut extends PreviousSegmentComponentStateRef {
}

export class PreviousSegmentComponentState extends PreviousSegmentComponentStateRefMut {
    with(closure: (obj: PreviousSegmentComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.PreviousSegmentComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class RunRef {
    ptr: number;
    clone(): Run {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new Run(liveSplitCoreNative.Run_clone(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    gameName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_game_name(this.ptr);
        return result;
    }
    gameIcon(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_game_icon(this.ptr);
        return result;
    }
    categoryName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_category_name(this.ptr);
        return result;
    }
    extendedFileName(useExtendedCategoryName: boolean): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_extended_file_name(this.ptr, useExtendedCategoryName ? 1 : 0);
        return result;
    }
    extendedName(useExtendedCategoryName: boolean): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_extended_name(this.ptr, useExtendedCategoryName ? 1 : 0);
        return result;
    }
    extendedCategoryName(showRegion: boolean, showPlatform: boolean, showVariables: boolean): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_extended_category_name(this.ptr, showRegion ? 1 : 0, showPlatform ? 1 : 0, showVariables ? 1 : 0);
        return result;
    }
    attemptCount(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_attempt_count(this.ptr);
        return result;
    }
    metadata(): RunMetadataRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new RunMetadataRef(liveSplitCoreNative.Run_metadata(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    offset(): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Run_offset(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    len(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_len(this.ptr);
        return result;
    }
    segment(index: number): SegmentRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new SegmentRef(liveSplitCoreNative.Run_segment(this.ptr, index));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    attemptHistoryLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_attempt_history_len(this.ptr);
        return result;
    }
    attemptHistoryIndex(index: number): AttemptRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new AttemptRef(liveSplitCoreNative.Run_attempt_history_index(this.ptr, index));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    saveAsLss(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_save_as_lss(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class RunRefMut extends RunRef {
    pushSegment(segment: Segment) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (segment.ptr == 0) {
            throw "segment is disposed";
        }
        liveSplitCoreNative.Run_push_segment(this.ptr, segment.ptr);
        segment.ptr = 0;
    }
    setGameName(game: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Run_set_game_name(this.ptr, game);
    }
    setCategoryName(category: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Run_set_category_name(this.ptr, category);
    }
}

export class Run extends RunRefMut {
    with(closure: (obj: Run) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.Run_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): Run {
        var result = new Run(liveSplitCoreNative.Run_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    static parse(data: number, length: number): Run {
        var result = new Run(liveSplitCoreNative.Run_parse(data, length));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    static parseArray(data: Int8Array): Run {
        let buf = emscriptenModule._malloc(data.length);
        emscriptenModule.writeArrayToMemory(data, buf);
        let ptr = liveSplitCoreNative.Run_parse(buf, data.length);
        emscriptenModule._free(buf);

        if (ptr == 0) {
            return null;
        }
        return new Run(ptr);
    }
    static parseString(text: string): Run {
        let len = (text.length << 2) + 1;
        let buf = emscriptenModule._malloc(len);
        let actualLen = emscriptenModule.stringToUTF8(text, buf, len);
        let ptr = liveSplitCoreNative.Run_parse(buf, actualLen);
        emscriptenModule._free(buf);

        if (ptr == 0) {
            return null;
        }
        return new Run(ptr);
    }
}

export class RunEditorRef {
    ptr: number;
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class RunEditorRefMut extends RunEditorRef {
    stateAsJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_state_as_json(this.ptr);
        return JSON.parse(result);
    }
    selectTimingMethod(method: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_select_timing_method(this.ptr, method);
    }
    unselect(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_unselect(this.ptr, index);
    }
    selectAdditionally(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_select_additionally(this.ptr, index);
    }
    selectOnly(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_select_only(this.ptr, index);
    }
    setGameName(game: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_set_game_name(this.ptr, game);
    }
    setCategoryName(category: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_set_category_name(this.ptr, category);
    }
    parseAndSetOffset(offset: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_parse_and_set_offset(this.ptr, offset) != 0;
        return result;
    }
    parseAndSetAttemptCount(attempts: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_parse_and_set_attempt_count(this.ptr, attempts) != 0;
        return result;
    }
    setGameIcon(data: number, length: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_set_game_icon(this.ptr, data, length);
    }
    insertSegmentAbove() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_insert_segment_above(this.ptr);
    }
    insertSegmentBelow() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_insert_segment_below(this.ptr);
    }
    removeSegments() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_remove_segments(this.ptr);
    }
    moveSegmentsUp() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_move_segments_up(this.ptr);
    }
    moveSegmentsDown() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_move_segments_down(this.ptr);
    }
    selectedSetIcon(data: number, length: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_selected_set_icon(this.ptr, data, length);
    }
    selectedSetName(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_selected_set_name(this.ptr, name);
    }
    selectedParseAndSetSplitTime(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_split_time(this.ptr, time) != 0;
        return result;
    }
    selectedParseAndSetSegmentTime(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_segment_time(this.ptr, time) != 0;
        return result;
    }
    selectedParseAndSetBestSegmentTime(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_best_segment_time(this.ptr, time) != 0;
        return result;
    }
    selectedParseAndSetComparisonTime(comparison: string, time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_comparison_time(this.ptr, comparison, time) != 0;
        return result;
    }
}

export class RunEditor extends RunEditorRefMut {
    with(closure: (obj: RunEditor) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
    static new(run: Run): RunEditor {
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        var result = new RunEditor(liveSplitCoreNative.RunEditor_new(run.ptr));
        run.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    close(): Run {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new Run(liveSplitCoreNative.RunEditor_close(this.ptr));
        this.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class RunMetadataRef {
    ptr: number;
    runId(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_run_id(this.ptr);
        return result;
    }
    platformName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_platform_name(this.ptr);
        return result;
    }
    usesEmulator(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_uses_emulator(this.ptr) != 0;
        return result;
    }
    regionName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_region_name(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class RunMetadataRefMut extends RunMetadataRef {
}

export class RunMetadata extends RunMetadataRefMut {
    with(closure: (obj: RunMetadata) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

export class SegmentRef {
    ptr: number;
    name(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Segment_name(this.ptr);
        return result;
    }
    icon(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Segment_icon(this.ptr);
        return result;
    }
    comparison(comparison: string): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Segment_comparison(this.ptr, comparison));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    personalBestSplitTime(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Segment_personal_best_split_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    bestSegmentTime(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Segment_best_segment_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    segmentHistory(): SegmentHistoryRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new SegmentHistoryRef(liveSplitCoreNative.Segment_segment_history(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SegmentRefMut extends SegmentRef {
}

export class Segment extends SegmentRefMut {
    with(closure: (obj: Segment) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.Segment_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(name: string): Segment {
        var result = new Segment(liveSplitCoreNative.Segment_new(name));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class SegmentHistoryRef {
    ptr: number;
    iter(): SegmentHistoryIter {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new SegmentHistoryIter(liveSplitCoreNative.SegmentHistory_iter(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SegmentHistoryRefMut extends SegmentHistoryRef {
}

export class SegmentHistory extends SegmentHistoryRefMut {
    with(closure: (obj: SegmentHistory) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

export class SegmentHistoryElementRef {
    ptr: number;
    index(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SegmentHistoryElement_index(this.ptr);
        return result;
    }
    time(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.SegmentHistoryElement_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SegmentHistoryElementRefMut extends SegmentHistoryElementRef {
}

export class SegmentHistoryElement extends SegmentHistoryElementRefMut {
    with(closure: (obj: SegmentHistoryElement) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

export class SegmentHistoryIterRef {
    ptr: number;
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SegmentHistoryIterRefMut extends SegmentHistoryIterRef {
    next(): SegmentHistoryElementRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new SegmentHistoryElementRef(liveSplitCoreNative.SegmentHistoryIter_next(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class SegmentHistoryIter extends SegmentHistoryIterRefMut {
    with(closure: (obj: SegmentHistoryIter) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.SegmentHistoryIter_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class SharedTimerRef {
    ptr: number;
    share(): SharedTimer {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new SharedTimer(liveSplitCoreNative.SharedTimer_share(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    read(): TimerReadLock {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimerReadLock(liveSplitCoreNative.SharedTimer_read(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    write(): TimerWriteLock {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimerWriteLock(liveSplitCoreNative.SharedTimer_write(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    readWith(action: (timer: TimerRef) => void) {
        this.read().with(function (lock) {
            action(lock.timer());
        });
    }
    writeWith(action: (timer: TimerRefMut) => void) {
        this.write().with(function (lock) {
            action(lock.timer());
        });
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SharedTimerRefMut extends SharedTimerRef {
}

export class SharedTimer extends SharedTimerRefMut {
    with(closure: (obj: SharedTimer) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.SharedTimer_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class SplitsComponentRef {
    ptr: number;
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SplitsComponentRefMut extends SplitsComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): SplitsComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new SplitsComponentState(liveSplitCoreNative.SplitsComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    scrollUp() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_scroll_up(this.ptr);
    }
    scrollDown() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_scroll_down(this.ptr);
    }
    setVisualSplitCount(count: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_visual_split_count(this.ptr, count);
    }
    setSplitPreviewCount(count: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_split_preview_count(this.ptr, count);
    }
    setAlwaysShowLastSplit(alwaysShowLastSplit: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_always_show_last_split(this.ptr, alwaysShowLastSplit ? 1 : 0);
    }
    setSeparatorLastSplit(separatorLastSplit: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_separator_last_split(this.ptr, separatorLastSplit ? 1 : 0);
    }
}

export class SplitsComponent extends SplitsComponentRefMut {
    with(closure: (obj: SplitsComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.SplitsComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): SplitsComponent {
        var result = new SplitsComponent(liveSplitCoreNative.SplitsComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class SplitsComponentStateRef {
    ptr: number;
    finalSeparatorShown(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_final_separator_shown(this.ptr) != 0;
        return result;
    }
    len(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_len(this.ptr);
        return result;
    }
    iconChange(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_icon_change(this.ptr, index);
        return result;
    }
    name(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_name(this.ptr, index);
        return result;
    }
    delta(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_delta(this.ptr, index);
        return result;
    }
    time(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_time(this.ptr, index);
        return result;
    }
    color(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_color(this.ptr, index);
        return result;
    }
    isCurrentSplit(index: number): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_is_current_split(this.ptr, index) != 0;
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SplitsComponentStateRefMut extends SplitsComponentStateRef {
}

export class SplitsComponentState extends SplitsComponentStateRefMut {
    with(closure: (obj: SplitsComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.SplitsComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class SumOfBestComponentRef {
    ptr: number;
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.SumOfBestComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): SumOfBestComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new SumOfBestComponentState(liveSplitCoreNative.SumOfBestComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SumOfBestComponentRefMut extends SumOfBestComponentRef {
}

export class SumOfBestComponent extends SumOfBestComponentRefMut {
    with(closure: (obj: SumOfBestComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.SumOfBestComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): SumOfBestComponent {
        var result = new SumOfBestComponent(liveSplitCoreNative.SumOfBestComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class SumOfBestComponentStateRef {
    ptr: number;
    text(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SumOfBestComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SumOfBestComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class SumOfBestComponentStateRefMut extends SumOfBestComponentStateRef {
}

export class SumOfBestComponentState extends SumOfBestComponentStateRefMut {
    with(closure: (obj: SumOfBestComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.SumOfBestComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class TextComponentRef {
    ptr: number;
    stateAsJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponent_state_as_json(this.ptr);
        return JSON.parse(result);
    }
    state(): TextComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TextComponentState(liveSplitCoreNative.TextComponent_state(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TextComponentRefMut extends TextComponentRef {
    setCenter(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.TextComponent_set_center(this.ptr, text);
    }
    setLeft(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.TextComponent_set_left(this.ptr, text);
    }
    setRight(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.TextComponent_set_right(this.ptr, text);
    }
}

export class TextComponent extends TextComponentRefMut {
    with(closure: (obj: TextComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TextComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): TextComponent {
        var result = new TextComponent(liveSplitCoreNative.TextComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TextComponentStateRef {
    ptr: number;
    left(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_left(this.ptr);
        return result;
    }
    right(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_right(this.ptr);
        return result;
    }
    center(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_center(this.ptr);
        return result;
    }
    isSplit(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_is_split(this.ptr) != 0;
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TextComponentStateRefMut extends TextComponentStateRef {
}

export class TextComponentState extends TextComponentStateRefMut {
    with(closure: (obj: TextComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TextComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class TimeRef {
    ptr: number;
    clone(): Time {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new Time(liveSplitCoreNative.Time_clone(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    realTime(): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Time_real_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    gameTime(): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Time_game_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    index(timingMethod: number): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Time_index(this.ptr, timingMethod));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimeRefMut extends TimeRef {
}

export class Time extends TimeRefMut {
    with(closure: (obj: Time) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.Time_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class TimeSpanRef {
    ptr: number;
    clone(): TimeSpan {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeSpan(liveSplitCoreNative.TimeSpan_clone(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    totalSeconds(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimeSpan_total_seconds(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimeSpanRefMut extends TimeSpanRef {
}

export class TimeSpan extends TimeSpanRefMut {
    with(closure: (obj: TimeSpan) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TimeSpan_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static fromSeconds(seconds: number): TimeSpan {
        var result = new TimeSpan(liveSplitCoreNative.TimeSpan_from_seconds(seconds));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TimerRef {
    ptr: number;
    currentTimingMethod(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_current_timing_method(this.ptr);
        return result;
    }
    currentComparison(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_current_comparison(this.ptr);
        return result;
    }
    isGameTimeInitialized(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_is_game_time_initialized(this.ptr) != 0;
        return result;
    }
    isGameTimePaused(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_is_game_time_paused(this.ptr) != 0;
        return result;
    }
    loadingTimes(): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Timer_loading_times(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    currentPhase(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_current_phase(this.ptr);
        return result;
    }
    getRun(): RunRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new RunRef(liveSplitCoreNative.Timer_get_run(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    printDebug() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_print_debug(this.ptr);
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimerRefMut extends TimerRef {
    split() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_split(this.ptr);
    }
    skipSplit() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_skip_split(this.ptr);
    }
    undoSplit() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_undo_split(this.ptr);
    }
    reset(updateSplits: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_reset(this.ptr, updateSplits ? 1 : 0);
    }
    pause() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_pause(this.ptr);
    }
    undoAllPauses() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_undo_all_pauses(this.ptr);
    }
    setCurrentTimingMethod(method: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_set_current_timing_method(this.ptr, method);
    }
    switchToNextComparison() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_switch_to_next_comparison(this.ptr);
    }
    switchToPreviousComparison() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_switch_to_previous_comparison(this.ptr);
    }
    initializeGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_initialize_game_time(this.ptr);
    }
    uninitializeGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_uninitialize_game_time(this.ptr);
    }
    pauseGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_pause_game_time(this.ptr);
    }
    unpauseGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_unpause_game_time(this.ptr);
    }
    setGameTime(time: TimeSpanRef) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (time.ptr == 0) {
            throw "time is disposed";
        }
        liveSplitCoreNative.Timer_set_game_time(this.ptr, time.ptr);
    }
    setLoadingTimes(time: TimeSpanRef) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (time.ptr == 0) {
            throw "time is disposed";
        }
        liveSplitCoreNative.Timer_set_loading_times(this.ptr, time.ptr);
    }
}

export class Timer extends TimerRefMut {
    with(closure: (obj: Timer) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.Timer_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(run: Run): Timer {
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        var result = new Timer(liveSplitCoreNative.Timer_new(run.ptr));
        run.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    intoShared(): SharedTimer {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new SharedTimer(liveSplitCoreNative.Timer_into_shared(this.ptr));
        this.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TimerComponentRef {
    ptr: number;
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.TimerComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): TimerComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new TimerComponentState(liveSplitCoreNative.TimerComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimerComponentRefMut extends TimerComponentRef {
}

export class TimerComponent extends TimerComponentRefMut {
    with(closure: (obj: TimerComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TimerComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): TimerComponent {
        var result = new TimerComponent(liveSplitCoreNative.TimerComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TimerComponentStateRef {
    ptr: number;
    time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimerComponentState_time(this.ptr);
        return result;
    }
    fraction(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimerComponentState_fraction(this.ptr);
        return result;
    }
    color(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimerComponentState_color(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimerComponentStateRefMut extends TimerComponentStateRef {
}

export class TimerComponentState extends TimerComponentStateRefMut {
    with(closure: (obj: TimerComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TimerComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class TimerReadLockRef {
    ptr: number;
    timer(): TimerRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimerRef(liveSplitCoreNative.TimerReadLock_timer(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimerReadLockRefMut extends TimerReadLockRef {
}

export class TimerReadLock extends TimerReadLockRefMut {
    with(closure: (obj: TimerReadLock) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TimerReadLock_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class TimerWriteLockRef {
    ptr: number;
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TimerWriteLockRefMut extends TimerWriteLockRef {
    timer(): TimerRefMut {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = new TimerRefMut(liveSplitCoreNative.TimerWriteLock_timer(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TimerWriteLock extends TimerWriteLockRefMut {
    with(closure: (obj: TimerWriteLock) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TimerWriteLock_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

export class TitleComponentRef {
    ptr: number;
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TitleComponentRefMut extends TitleComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.TitleComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): TitleComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        var result = new TitleComponentState(liveSplitCoreNative.TitleComponent_state(this.ptr, timer.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TitleComponent extends TitleComponentRefMut {
    with(closure: (obj: TitleComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TitleComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    static new(): TitleComponent {
        var result = new TitleComponent(liveSplitCoreNative.TitleComponent_new());
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

export class TitleComponentStateRef {
    ptr: number;
    iconChange(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_icon_change(this.ptr);
        return result;
    }
    game(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_game(this.ptr);
        return result;
    }
    category(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_category(this.ptr);
        return result;
    }
    attempts(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_attempts(this.ptr);
        return result;
    }
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

export class TitleComponentStateRefMut extends TitleComponentStateRef {
}

export class TitleComponentState extends TitleComponentStateRefMut {
    with(closure: (obj: TitleComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (this.ptr != 0) {
            liveSplitCoreNative.TitleComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}
