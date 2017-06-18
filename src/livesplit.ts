"use strict";
import ffi = require('ffi');
import fs = require('fs');
import ref = require('ref');

export type ComponentStateJson =
    { CurrentComparison: CurrentComparisonComponentStateJson } |
    { CurrentPace: CurrentPaceComponentStateJson } |
    { Delta: DeltaComponentStateJson } |
    { Graph: GraphComponentStateJson } |
    { PossibleTimeSave: PossibleTimeSaveComponentStateJson } |
    { PreviousSegment: PreviousSegmentComponentStateJson } |
    { Splits: SplitsComponentStateJson } |
    { SumOfBest: SumOfBestComponentStateJson } |
    { Text: TextComponentStateJson } |
    { Timer: TimerComponentStateJson } |
    { Title: TitleComponentStateJson } |
    { TotalPLaytime: TotalPlaytimeComponentStateJson };

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

export type TextComponentStateJson =
	{ Center: String } |
	{ Split: String[2] };

export interface TotalPlaytimeComponentStateJson {
    text: string;
    time: string;
}

export interface CurrentPaceComponentStateJson {
    text: string;
    time: string;
}

export interface DeltaComponentStateJson {
    text: string;
    time: string;
    color: Color;
}

export interface CurrentComparisonComponentStateJson {
    text: string;
    comparison: string;
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

var liveSplitCoreNative = ffi.Library('livesplit_core', {
    'AtomicDateTime_drop': ['void', ['pointer']],
    'AtomicDateTime_is_synchronized': ['bool', ['pointer']],
    'AtomicDateTime_to_rfc2822': ['CString', ['pointer']],
    'AtomicDateTime_to_rfc3339': ['CString', ['pointer']],
    'Attempt_index': ['int32', ['pointer']],
    'Attempt_time': ['pointer', ['pointer']],
    'Attempt_pause_time': ['pointer', ['pointer']],
    'Attempt_started': ['pointer', ['pointer']],
    'Attempt_ended': ['pointer', ['pointer']],
    'Component_drop': ['void', ['pointer']],
    'CurrentComparisonComponent_new': ['pointer', []],
    'CurrentComparisonComponent_drop': ['void', ['pointer']],
    'CurrentComparisonComponent_into_generic': ['pointer', ['pointer']],
    'CurrentComparisonComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'CurrentComparisonComponent_state': ['pointer', ['pointer', 'pointer']],
    'CurrentComparisonComponentState_drop': ['void', ['pointer']],
    'CurrentComparisonComponentState_text': ['CString', ['pointer']],
    'CurrentComparisonComponentState_comparison': ['CString', ['pointer']],
    'CurrentPaceComponent_new': ['pointer', []],
    'CurrentPaceComponent_drop': ['void', ['pointer']],
    'CurrentPaceComponent_into_generic': ['pointer', ['pointer']],
    'CurrentPaceComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'CurrentPaceComponent_state': ['pointer', ['pointer', 'pointer']],
    'CurrentPaceComponentState_drop': ['void', ['pointer']],
    'CurrentPaceComponentState_text': ['CString', ['pointer']],
    'CurrentPaceComponentState_time': ['CString', ['pointer']],
    'DeltaComponent_new': ['pointer', []],
    'DeltaComponent_drop': ['void', ['pointer']],
    'DeltaComponent_into_generic': ['pointer', ['pointer']],
    'DeltaComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'DeltaComponent_state': ['pointer', ['pointer', 'pointer']],
    'DeltaComponentState_drop': ['void', ['pointer']],
    'DeltaComponentState_text': ['CString', ['pointer']],
    'DeltaComponentState_time': ['CString', ['pointer']],
    'DeltaComponentState_color': ['CString', ['pointer']],
    'GraphComponent_new': ['pointer', []],
    'GraphComponent_drop': ['void', ['pointer']],
    'GraphComponent_into_generic': ['pointer', ['pointer']],
    'GraphComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'GraphComponent_state': ['pointer', ['pointer', 'pointer']],
    'GraphComponentState_drop': ['void', ['pointer']],
    'GraphComponentState_points_len': ['size_t', ['pointer']],
    'GraphComponentState_point_x': ['float', ['pointer', 'size_t']],
    'GraphComponentState_point_y': ['float', ['pointer', 'size_t']],
    'GraphComponentState_horizontal_grid_lines_len': ['size_t', ['pointer']],
    'GraphComponentState_horizontal_grid_line': ['float', ['pointer', 'size_t']],
    'GraphComponentState_vertical_grid_lines_len': ['size_t', ['pointer']],
    'GraphComponentState_vertical_grid_line': ['float', ['pointer', 'size_t']],
    'GraphComponentState_middle': ['float', ['pointer']],
    'GraphComponentState_is_live_delta_active': ['bool', ['pointer']],
    'HotkeySystem_new': ['pointer', ['pointer']],
    'HotkeySystem_drop': ['void', ['pointer']],
    'Layout_new': ['pointer', []],
    'Layout_parse_json': ['pointer', ['CString']],
    'Layout_drop': ['void', ['pointer']],
    'Layout_settings_as_json': ['CString', ['pointer']],
    'Layout_state_as_json': ['CString', ['pointer', 'pointer']],
    'Layout_push': ['void', ['pointer', 'pointer']],
    'Layout_scroll_up': ['void', ['pointer']],
    'Layout_scroll_down': ['void', ['pointer']],
    'Layout_remount': ['void', ['pointer']],
    'PossibleTimeSaveComponent_new': ['pointer', []],
    'PossibleTimeSaveComponent_drop': ['void', ['pointer']],
    'PossibleTimeSaveComponent_into_generic': ['pointer', ['pointer']],
    'PossibleTimeSaveComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'PossibleTimeSaveComponent_state': ['pointer', ['pointer', 'pointer']],
    'PossibleTimeSaveComponentState_drop': ['void', ['pointer']],
    'PossibleTimeSaveComponentState_text': ['CString', ['pointer']],
    'PossibleTimeSaveComponentState_time': ['CString', ['pointer']],
    'PreviousSegmentComponent_new': ['pointer', []],
    'PreviousSegmentComponent_drop': ['void', ['pointer']],
    'PreviousSegmentComponent_into_generic': ['pointer', ['pointer']],
    'PreviousSegmentComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'PreviousSegmentComponent_state': ['pointer', ['pointer', 'pointer']],
    'PreviousSegmentComponentState_drop': ['void', ['pointer']],
    'PreviousSegmentComponentState_text': ['CString', ['pointer']],
    'PreviousSegmentComponentState_time': ['CString', ['pointer']],
    'PreviousSegmentComponentState_color': ['CString', ['pointer']],
    'Run_new': ['pointer', []],
    'Run_parse': ['pointer', ['pointer', 'size_t']],
    'Run_drop': ['void', ['pointer']],
    'Run_clone': ['pointer', ['pointer']],
    'Run_game_name': ['CString', ['pointer']],
    'Run_game_icon': ['CString', ['pointer']],
    'Run_category_name': ['CString', ['pointer']],
    'Run_extended_file_name': ['CString', ['pointer', 'bool']],
    'Run_extended_name': ['CString', ['pointer', 'bool']],
    'Run_extended_category_name': ['CString', ['pointer', 'bool', 'bool', 'bool']],
    'Run_attempt_count': ['uint32', ['pointer']],
    'Run_metadata': ['pointer', ['pointer']],
    'Run_offset': ['pointer', ['pointer']],
    'Run_len': ['size_t', ['pointer']],
    'Run_segment': ['pointer', ['pointer', 'size_t']],
    'Run_attempt_history_len': ['size_t', ['pointer']],
    'Run_attempt_history_index': ['pointer', ['pointer', 'size_t']],
    'Run_save_as_lss': ['CString', ['pointer']],
    'Run_push_segment': ['void', ['pointer', 'pointer']],
    'Run_set_game_name': ['void', ['pointer', 'CString']],
    'Run_set_category_name': ['void', ['pointer', 'CString']],
    'RunEditor_new': ['pointer', ['pointer']],
    'RunEditor_close': ['pointer', ['pointer']],
    'RunEditor_state_as_json': ['CString', ['pointer']],
    'RunEditor_select_timing_method': ['void', ['pointer', 'uint8']],
    'RunEditor_unselect': ['void', ['pointer', 'size_t']],
    'RunEditor_select_additionally': ['void', ['pointer', 'size_t']],
    'RunEditor_select_only': ['void', ['pointer', 'size_t']],
    'RunEditor_set_game_name': ['void', ['pointer', 'CString']],
    'RunEditor_set_category_name': ['void', ['pointer', 'CString']],
    'RunEditor_parse_and_set_offset': ['bool', ['pointer', 'CString']],
    'RunEditor_parse_and_set_attempt_count': ['bool', ['pointer', 'CString']],
    'RunEditor_set_game_icon': ['void', ['pointer', 'pointer', 'size_t']],
    'RunEditor_insert_segment_above': ['void', ['pointer']],
    'RunEditor_insert_segment_below': ['void', ['pointer']],
    'RunEditor_remove_segments': ['void', ['pointer']],
    'RunEditor_move_segments_up': ['void', ['pointer']],
    'RunEditor_move_segments_down': ['void', ['pointer']],
    'RunEditor_selected_set_icon': ['void', ['pointer', 'pointer', 'size_t']],
    'RunEditor_selected_set_name': ['void', ['pointer', 'CString']],
    'RunEditor_selected_parse_and_set_split_time': ['bool', ['pointer', 'CString']],
    'RunEditor_selected_parse_and_set_segment_time': ['bool', ['pointer', 'CString']],
    'RunEditor_selected_parse_and_set_best_segment_time': ['bool', ['pointer', 'CString']],
    'RunEditor_selected_parse_and_set_comparison_time': ['bool', ['pointer', 'CString', 'CString']],
    'RunMetadata_run_id': ['CString', ['pointer']],
    'RunMetadata_platform_name': ['CString', ['pointer']],
    'RunMetadata_uses_emulator': ['bool', ['pointer']],
    'RunMetadata_region_name': ['CString', ['pointer']],
    'RunMetadata_variables': ['pointer', ['pointer']],
    'RunMetadataVariable_drop': ['void', ['pointer']],
    'RunMetadataVariable_name': ['CString', ['pointer']],
    'RunMetadataVariable_value': ['CString', ['pointer']],
    'RunMetadataVariablesIter_drop': ['void', ['pointer']],
    'RunMetadataVariablesIter_next': ['pointer', ['pointer']],
    'Segment_new': ['pointer', ['CString']],
    'Segment_drop': ['void', ['pointer']],
    'Segment_name': ['CString', ['pointer']],
    'Segment_icon': ['CString', ['pointer']],
    'Segment_comparison': ['pointer', ['pointer', 'CString']],
    'Segment_personal_best_split_time': ['pointer', ['pointer']],
    'Segment_best_segment_time': ['pointer', ['pointer']],
    'Segment_segment_history': ['pointer', ['pointer']],
    'SegmentHistory_iter': ['pointer', ['pointer']],
    'SegmentHistoryElement_index': ['int32', ['pointer']],
    'SegmentHistoryElement_time': ['pointer', ['pointer']],
    'SegmentHistoryIter_drop': ['void', ['pointer']],
    'SegmentHistoryIter_next': ['pointer', ['pointer']],
    'SharedTimer_drop': ['void', ['pointer']],
    'SharedTimer_share': ['pointer', ['pointer']],
    'SharedTimer_read': ['pointer', ['pointer']],
    'SharedTimer_write': ['pointer', ['pointer']],
    'SharedTimer_replace_inner': ['void', ['pointer', 'pointer']],
    'SplitsComponent_new': ['pointer', []],
    'SplitsComponent_drop': ['void', ['pointer']],
    'SplitsComponent_into_generic': ['pointer', ['pointer']],
    'SplitsComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'SplitsComponent_state': ['pointer', ['pointer', 'pointer']],
    'SplitsComponent_scroll_up': ['void', ['pointer']],
    'SplitsComponent_scroll_down': ['void', ['pointer']],
    'SplitsComponent_set_visual_split_count': ['void', ['pointer', 'size_t']],
    'SplitsComponent_set_split_preview_count': ['void', ['pointer', 'size_t']],
    'SplitsComponent_set_always_show_last_split': ['void', ['pointer', 'bool']],
    'SplitsComponent_set_separator_last_split': ['void', ['pointer', 'bool']],
    'SplitsComponentState_drop': ['void', ['pointer']],
    'SplitsComponentState_final_separator_shown': ['bool', ['pointer']],
    'SplitsComponentState_len': ['size_t', ['pointer']],
    'SplitsComponentState_icon_change': ['CString', ['pointer', 'size_t']],
    'SplitsComponentState_name': ['CString', ['pointer', 'size_t']],
    'SplitsComponentState_delta': ['CString', ['pointer', 'size_t']],
    'SplitsComponentState_time': ['CString', ['pointer', 'size_t']],
    'SplitsComponentState_color': ['CString', ['pointer', 'size_t']],
    'SplitsComponentState_is_current_split': ['bool', ['pointer', 'size_t']],
    'SumOfBestComponent_new': ['pointer', []],
    'SumOfBestComponent_drop': ['void', ['pointer']],
    'SumOfBestComponent_into_generic': ['pointer', ['pointer']],
    'SumOfBestComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'SumOfBestComponent_state': ['pointer', ['pointer', 'pointer']],
    'SumOfBestComponentState_drop': ['void', ['pointer']],
    'SumOfBestComponentState_text': ['CString', ['pointer']],
    'SumOfBestComponentState_time': ['CString', ['pointer']],
    'TextComponent_new': ['pointer', []],
    'TextComponent_drop': ['void', ['pointer']],
    'TextComponent_into_generic': ['pointer', ['pointer']],
    'TextComponent_state_as_json': ['CString', ['pointer']],
    'TextComponent_state': ['pointer', ['pointer']],
    'TextComponent_set_center': ['void', ['pointer', 'CString']],
    'TextComponent_set_left': ['void', ['pointer', 'CString']],
    'TextComponent_set_right': ['void', ['pointer', 'CString']],
    'TextComponentState_drop': ['void', ['pointer']],
    'TextComponentState_left': ['CString', ['pointer']],
    'TextComponentState_right': ['CString', ['pointer']],
    'TextComponentState_center': ['CString', ['pointer']],
    'TextComponentState_is_split': ['bool', ['pointer']],
    'Time_drop': ['void', ['pointer']],
    'Time_clone': ['pointer', ['pointer']],
    'Time_real_time': ['pointer', ['pointer']],
    'Time_game_time': ['pointer', ['pointer']],
    'Time_index': ['pointer', ['pointer', 'uint8']],
    'TimeSpan_from_seconds': ['pointer', ['double']],
    'TimeSpan_drop': ['void', ['pointer']],
    'TimeSpan_clone': ['pointer', ['pointer']],
    'TimeSpan_total_seconds': ['double', ['pointer']],
    'Timer_new': ['pointer', ['pointer']],
    'Timer_into_shared': ['pointer', ['pointer']],
    'Timer_drop': ['void', ['pointer']],
    'Timer_current_timing_method': ['uint8', ['pointer']],
    'Timer_current_comparison': ['CString', ['pointer']],
    'Timer_is_game_time_initialized': ['bool', ['pointer']],
    'Timer_is_game_time_paused': ['bool', ['pointer']],
    'Timer_loading_times': ['pointer', ['pointer']],
    'Timer_current_phase': ['uint8', ['pointer']],
    'Timer_get_run': ['pointer', ['pointer']],
    'Timer_print_debug': ['void', ['pointer']],
    'Timer_split': ['void', ['pointer']],
    'Timer_skip_split': ['void', ['pointer']],
    'Timer_undo_split': ['void', ['pointer']],
    'Timer_reset': ['void', ['pointer', 'bool']],
    'Timer_pause': ['void', ['pointer']],
    'Timer_undo_all_pauses': ['void', ['pointer']],
    'Timer_set_current_timing_method': ['void', ['pointer', 'uint8']],
    'Timer_switch_to_next_comparison': ['void', ['pointer']],
    'Timer_switch_to_previous_comparison': ['void', ['pointer']],
    'Timer_initialize_game_time': ['void', ['pointer']],
    'Timer_uninitialize_game_time': ['void', ['pointer']],
    'Timer_pause_game_time': ['void', ['pointer']],
    'Timer_unpause_game_time': ['void', ['pointer']],
    'Timer_set_game_time': ['void', ['pointer', 'pointer']],
    'Timer_set_loading_times': ['void', ['pointer', 'pointer']],
    'TimerComponent_new': ['pointer', []],
    'TimerComponent_drop': ['void', ['pointer']],
    'TimerComponent_into_generic': ['pointer', ['pointer']],
    'TimerComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'TimerComponent_state': ['pointer', ['pointer', 'pointer']],
    'TimerComponentState_drop': ['void', ['pointer']],
    'TimerComponentState_time': ['CString', ['pointer']],
    'TimerComponentState_fraction': ['CString', ['pointer']],
    'TimerComponentState_color': ['CString', ['pointer']],
    'TimerReadLock_drop': ['void', ['pointer']],
    'TimerReadLock_timer': ['pointer', ['pointer']],
    'TimerWriteLock_drop': ['void', ['pointer']],
    'TimerWriteLock_timer': ['pointer', ['pointer']],
    'TitleComponent_new': ['pointer', []],
    'TitleComponent_drop': ['void', ['pointer']],
    'TitleComponent_into_generic': ['pointer', ['pointer']],
    'TitleComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'TitleComponent_state': ['pointer', ['pointer', 'pointer']],
    'TitleComponentState_drop': ['void', ['pointer']],
    'TitleComponentState_icon_change': ['CString', ['pointer']],
    'TitleComponentState_game': ['CString', ['pointer']],
    'TitleComponentState_category': ['CString', ['pointer']],
    'TitleComponentState_attempts': ['uint32', ['pointer']],
    'TotalPlaytimeComponent_new': ['pointer', []],
    'TotalPlaytimeComponent_drop': ['void', ['pointer']],
    'TotalPlaytimeComponent_into_generic': ['pointer', ['pointer']],
    'TotalPlaytimeComponent_state_as_json': ['CString', ['pointer', 'pointer']],
    'TotalPlaytimeComponent_state': ['pointer', ['pointer', 'pointer']],
    'TotalPlaytimeComponentState_drop': ['void', ['pointer']],
    'TotalPlaytimeComponentState_text': ['CString', ['pointer']],
    'TotalPlaytimeComponentState_time': ['CString', ['pointer']],
});

export class AtomicDateTimeRef {
    ptr: Buffer;
    isSynchronized(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.AtomicDateTime_is_synchronized(this.ptr);
        return result;
    }
    toRfc2822(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.AtomicDateTime_to_rfc2822(this.ptr);
        return result;
    }
    toRfc3339(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.AtomicDateTime_to_rfc3339(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class AtomicDateTimeRefMut extends AtomicDateTimeRef {
}

export class AtomicDateTime extends AtomicDateTimeRefMut {
    with(closure: (obj: AtomicDateTime) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.AtomicDateTime_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class AttemptRef {
    ptr: Buffer;
    index(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Attempt_index(this.ptr);
        return result;
    }
    time(): TimeRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Attempt_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    pauseTime(): TimeSpanRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Attempt_pause_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    started(): AtomicDateTime {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new AtomicDateTime(liveSplitCoreNative.Attempt_started(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    ended(): AtomicDateTime {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new AtomicDateTime(liveSplitCoreNative.Attempt_ended(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            this.ptr = ref.NULL;
        }
    }
}

export class ComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class ComponentRefMut extends ComponentRef {
}

export class Component extends ComponentRefMut {
    with(closure: (obj: Component) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.Component_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class CurrentComparisonComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class CurrentComparisonComponentRefMut extends CurrentComparisonComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.CurrentComparisonComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): CurrentComparisonComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new CurrentComparisonComponentState(liveSplitCoreNative.CurrentComparisonComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class CurrentComparisonComponent extends CurrentComparisonComponentRefMut {
    with(closure: (obj: CurrentComparisonComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.CurrentComparisonComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): CurrentComparisonComponent {
        var result = new CurrentComparisonComponent(liveSplitCoreNative.CurrentComparisonComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.CurrentComparisonComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class CurrentComparisonComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.CurrentComparisonComponentState_text(this.ptr);
        return result;
    }
    comparison(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.CurrentComparisonComponentState_comparison(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class CurrentComparisonComponentStateRefMut extends CurrentComparisonComponentStateRef {
}

export class CurrentComparisonComponentState extends CurrentComparisonComponentStateRefMut {
    with(closure: (obj: CurrentComparisonComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.CurrentComparisonComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class CurrentPaceComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class CurrentPaceComponentRefMut extends CurrentPaceComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.CurrentPaceComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): CurrentPaceComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new CurrentPaceComponentState(liveSplitCoreNative.CurrentPaceComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class CurrentPaceComponent extends CurrentPaceComponentRefMut {
    with(closure: (obj: CurrentPaceComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.CurrentPaceComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): CurrentPaceComponent {
        var result = new CurrentPaceComponent(liveSplitCoreNative.CurrentPaceComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.CurrentPaceComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class CurrentPaceComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.CurrentPaceComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.CurrentPaceComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class CurrentPaceComponentStateRefMut extends CurrentPaceComponentStateRef {
}

export class CurrentPaceComponentState extends CurrentPaceComponentStateRefMut {
    with(closure: (obj: CurrentPaceComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.CurrentPaceComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class DeltaComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class DeltaComponentRefMut extends DeltaComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.DeltaComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): DeltaComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new DeltaComponentState(liveSplitCoreNative.DeltaComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class DeltaComponent extends DeltaComponentRefMut {
    with(closure: (obj: DeltaComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.DeltaComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): DeltaComponent {
        var result = new DeltaComponent(liveSplitCoreNative.DeltaComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.DeltaComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class DeltaComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.DeltaComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.DeltaComponentState_time(this.ptr);
        return result;
    }
    color(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.DeltaComponentState_color(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class DeltaComponentStateRefMut extends DeltaComponentStateRef {
}

export class DeltaComponentState extends DeltaComponentStateRefMut {
    with(closure: (obj: DeltaComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.DeltaComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class GraphComponentRef {
    ptr: Buffer;
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.GraphComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): GraphComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new GraphComponentState(liveSplitCoreNative.GraphComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.GraphComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): GraphComponent {
        var result = new GraphComponent(liveSplitCoreNative.GraphComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.GraphComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class GraphComponentStateRef {
    ptr: Buffer;
    pointsLen(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_points_len(this.ptr);
        return result;
    }
    pointX(index: number): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_point_x(this.ptr, index);
        return result;
    }
    pointY(index: number): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_point_y(this.ptr, index);
        return result;
    }
    horizontalGridLinesLen(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_horizontal_grid_lines_len(this.ptr);
        return result;
    }
    horizontalGridLine(index: number): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_horizontal_grid_line(this.ptr, index);
        return result;
    }
    verticalGridLinesLen(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_vertical_grid_lines_len(this.ptr);
        return result;
    }
    verticalGridLine(index: number): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_vertical_grid_line(this.ptr, index);
        return result;
    }
    middle(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_middle(this.ptr);
        return result;
    }
    isLiveDeltaActive(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.GraphComponentState_is_live_delta_active(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.GraphComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class HotkeySystemRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.HotkeySystem_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(sharedTimer: SharedTimer): HotkeySystem {
        if (ref.isNull(sharedTimer.ptr)) {
            throw "sharedTimer is disposed";
        }
        var result = new HotkeySystem(liveSplitCoreNative.HotkeySystem_new(sharedTimer.ptr));
        sharedTimer.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class LayoutRef {
    ptr: Buffer;
    settingsAsJson(): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Layout_settings_as_json(this.ptr);
        return JSON.parse(result);
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class LayoutRefMut extends LayoutRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.Layout_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    push(component: Component) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(component.ptr)) {
            throw "component is disposed";
        }
        liveSplitCoreNative.Layout_push(this.ptr, component.ptr);
        component.ptr = ref.NULL;
    }
    scrollUp() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Layout_scroll_up(this.ptr);
    }
    scrollDown() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Layout_scroll_down(this.ptr);
    }
    remount() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Layout_remount(this.ptr);
    }
}

export class Layout extends LayoutRefMut {
    with(closure: (obj: Layout) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.Layout_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): Layout {
        var result = new Layout(liveSplitCoreNative.Layout_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    static parseJson(settings: any): Layout {
        var result = new Layout(liveSplitCoreNative.Layout_parse_json(JSON.stringify(settings)));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class PossibleTimeSaveComponentRef {
    ptr: Buffer;
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.PossibleTimeSaveComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): PossibleTimeSaveComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new PossibleTimeSaveComponentState(liveSplitCoreNative.PossibleTimeSaveComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.PossibleTimeSaveComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): PossibleTimeSaveComponent {
        var result = new PossibleTimeSaveComponent(liveSplitCoreNative.PossibleTimeSaveComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.PossibleTimeSaveComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class PossibleTimeSaveComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PossibleTimeSaveComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PossibleTimeSaveComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.PossibleTimeSaveComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class PreviousSegmentComponentRef {
    ptr: Buffer;
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): PreviousSegmentComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new PreviousSegmentComponentState(liveSplitCoreNative.PreviousSegmentComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.PreviousSegmentComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): PreviousSegmentComponent {
        var result = new PreviousSegmentComponent(liveSplitCoreNative.PreviousSegmentComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.PreviousSegmentComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class PreviousSegmentComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponentState_time(this.ptr);
        return result;
    }
    color(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.PreviousSegmentComponentState_color(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.PreviousSegmentComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class RunRef {
    ptr: Buffer;
    clone(): Run {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Run(liveSplitCoreNative.Run_clone(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    gameName(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_game_name(this.ptr);
        return result;
    }
    gameIcon(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_game_icon(this.ptr);
        return result;
    }
    categoryName(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_category_name(this.ptr);
        return result;
    }
    extendedFileName(useExtendedCategoryName: boolean): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_extended_file_name(this.ptr, useExtendedCategoryName);
        return result;
    }
    extendedName(useExtendedCategoryName: boolean): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_extended_name(this.ptr, useExtendedCategoryName);
        return result;
    }
    extendedCategoryName(showRegion: boolean, showPlatform: boolean, showVariables: boolean): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_extended_category_name(this.ptr, showRegion, showPlatform, showVariables);
        return result;
    }
    attemptCount(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_attempt_count(this.ptr);
        return result;
    }
    metadata(): RunMetadataRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new RunMetadataRef(liveSplitCoreNative.Run_metadata(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    offset(): TimeSpanRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Run_offset(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    len(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_len(this.ptr);
        return result;
    }
    segment(index: number): SegmentRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new SegmentRef(liveSplitCoreNative.Run_segment(this.ptr, index));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    attemptHistoryLen(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_attempt_history_len(this.ptr);
        return result;
    }
    attemptHistoryIndex(index: number): AttemptRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new AttemptRef(liveSplitCoreNative.Run_attempt_history_index(this.ptr, index));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    saveAsLss(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Run_save_as_lss(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class RunRefMut extends RunRef {
    pushSegment(segment: Segment) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(segment.ptr)) {
            throw "segment is disposed";
        }
        liveSplitCoreNative.Run_push_segment(this.ptr, segment.ptr);
        segment.ptr = ref.NULL;
    }
    setGameName(game: string) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Run_set_game_name(this.ptr, game);
    }
    setCategoryName(category: string) {
        if (ref.isNull(this.ptr)) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.Run_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): Run {
        var result = new Run(liveSplitCoreNative.Run_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    static parse(data: Buffer, length: number): Run {
        var result = new Run(liveSplitCoreNative.Run_parse(data, length));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    static parseArray(data: Int8Array): Run {
        var buf = Buffer.from(data.buffer);
        if (data.byteLength !== data.buffer.byteLength) {
            buf = buf.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }
        return Run.parse(buf, buf.byteLength);
    }
    static parseFile(file: any) {
        var data = fs.readFileSync(file);
        return Run.parse(data, data.byteLength);
    }
    static parseString(text: string): Run {
        let data = new Buffer(text);
        return Run.parse(data, data.byteLength);
    }
}

export class RunEditorRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class RunEditorRefMut extends RunEditorRef {
    stateAsJson(): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_state_as_json(this.ptr);
        return JSON.parse(result);
    }
    selectTimingMethod(method: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_select_timing_method(this.ptr, method);
    }
    unselect(index: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_unselect(this.ptr, index);
    }
    selectAdditionally(index: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_select_additionally(this.ptr, index);
    }
    selectOnly(index: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_select_only(this.ptr, index);
    }
    setGameName(game: string) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_set_game_name(this.ptr, game);
    }
    setCategoryName(category: string) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_set_category_name(this.ptr, category);
    }
    parseAndSetOffset(offset: string): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_parse_and_set_offset(this.ptr, offset);
        return result;
    }
    parseAndSetAttemptCount(attempts: string): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_parse_and_set_attempt_count(this.ptr, attempts);
        return result;
    }
    setGameIcon(data: Buffer, length: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_set_game_icon(this.ptr, data, length);
    }
    insertSegmentAbove() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_insert_segment_above(this.ptr);
    }
    insertSegmentBelow() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_insert_segment_below(this.ptr);
    }
    removeSegments() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_remove_segments(this.ptr);
    }
    moveSegmentsUp() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_move_segments_up(this.ptr);
    }
    moveSegmentsDown() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_move_segments_down(this.ptr);
    }
    selectedSetIcon(data: Buffer, length: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_selected_set_icon(this.ptr, data, length);
    }
    selectedSetName(name: string) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.RunEditor_selected_set_name(this.ptr, name);
    }
    selectedParseAndSetSplitTime(time: string): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_split_time(this.ptr, time);
        return result;
    }
    selectedParseAndSetSegmentTime(time: string): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_segment_time(this.ptr, time);
        return result;
    }
    selectedParseAndSetBestSegmentTime(time: string): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_best_segment_time(this.ptr, time);
        return result;
    }
    selectedParseAndSetComparisonTime(comparison: string, time: string): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunEditor_selected_parse_and_set_comparison_time(this.ptr, comparison, time);
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
        if (!ref.isNull(this.ptr)) {
            this.ptr = ref.NULL;
        }
    }
    static new(run: Run): RunEditor {
        if (ref.isNull(run.ptr)) {
            throw "run is disposed";
        }
        var result = new RunEditor(liveSplitCoreNative.RunEditor_new(run.ptr));
        run.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    close(): Run {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Run(liveSplitCoreNative.RunEditor_close(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class RunMetadataRef {
    ptr: Buffer;
    runId(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_run_id(this.ptr);
        return result;
    }
    platformName(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_platform_name(this.ptr);
        return result;
    }
    usesEmulator(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_uses_emulator(this.ptr);
        return result;
    }
    regionName(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadata_region_name(this.ptr);
        return result;
    }
    variables(): RunMetadataVariablesIter {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new RunMetadataVariablesIter(liveSplitCoreNative.RunMetadata_variables(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            this.ptr = ref.NULL;
        }
    }
}

export class RunMetadataVariableRef {
    ptr: Buffer;
    name(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadataVariable_name(this.ptr);
        return result;
    }
    value(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.RunMetadataVariable_value(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class RunMetadataVariableRefMut extends RunMetadataVariableRef {
}

export class RunMetadataVariable extends RunMetadataVariableRefMut {
    with(closure: (obj: RunMetadataVariable) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.RunMetadataVariable_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class RunMetadataVariablesIterRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class RunMetadataVariablesIterRefMut extends RunMetadataVariablesIterRef {
    next(): RunMetadataVariableRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new RunMetadataVariableRef(liveSplitCoreNative.RunMetadataVariablesIter_next(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class RunMetadataVariablesIter extends RunMetadataVariablesIterRefMut {
    with(closure: (obj: RunMetadataVariablesIter) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.RunMetadataVariablesIter_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class SegmentRef {
    ptr: Buffer;
    name(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Segment_name(this.ptr);
        return result;
    }
    icon(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Segment_icon(this.ptr);
        return result;
    }
    comparison(comparison: string): TimeRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Segment_comparison(this.ptr, comparison));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    personalBestSplitTime(): TimeRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Segment_personal_best_split_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    bestSegmentTime(): TimeRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.Segment_best_segment_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    segmentHistory(): SegmentHistoryRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new SegmentHistoryRef(liveSplitCoreNative.Segment_segment_history(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.Segment_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(name: string): Segment {
        var result = new Segment(liveSplitCoreNative.Segment_new(name));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class SegmentHistoryRef {
    ptr: Buffer;
    iter(): SegmentHistoryIter {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new SegmentHistoryIter(liveSplitCoreNative.SegmentHistory_iter(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            this.ptr = ref.NULL;
        }
    }
}

export class SegmentHistoryElementRef {
    ptr: Buffer;
    index(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SegmentHistoryElement_index(this.ptr);
        return result;
    }
    time(): TimeRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeRef(liveSplitCoreNative.SegmentHistoryElement_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            this.ptr = ref.NULL;
        }
    }
}

export class SegmentHistoryIterRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class SegmentHistoryIterRefMut extends SegmentHistoryIterRef {
    next(): SegmentHistoryElementRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new SegmentHistoryElementRef(liveSplitCoreNative.SegmentHistoryIter_next(this.ptr));
        if (ref.isNull(result.ptr)) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.SegmentHistoryIter_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class SharedTimerRef {
    ptr: Buffer;
    share(): SharedTimer {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new SharedTimer(liveSplitCoreNative.SharedTimer_share(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    read(): TimerReadLock {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimerReadLock(liveSplitCoreNative.SharedTimer_read(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    write(): TimerWriteLock {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimerWriteLock(liveSplitCoreNative.SharedTimer_write(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    replaceInner(timer: Timer) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        liveSplitCoreNative.SharedTimer_replace_inner(this.ptr, timer.ptr);
        timer.ptr = ref.NULL;
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
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.SharedTimer_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class SplitsComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class SplitsComponentRefMut extends SplitsComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): SplitsComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new SplitsComponentState(liveSplitCoreNative.SplitsComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    scrollUp() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_scroll_up(this.ptr);
    }
    scrollDown() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_scroll_down(this.ptr);
    }
    setVisualSplitCount(count: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_visual_split_count(this.ptr, count);
    }
    setSplitPreviewCount(count: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_split_preview_count(this.ptr, count);
    }
    setAlwaysShowLastSplit(alwaysShowLastSplit: boolean) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_always_show_last_split(this.ptr, alwaysShowLastSplit);
    }
    setSeparatorLastSplit(separatorLastSplit: boolean) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.SplitsComponent_set_separator_last_split(this.ptr, separatorLastSplit);
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.SplitsComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): SplitsComponent {
        var result = new SplitsComponent(liveSplitCoreNative.SplitsComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.SplitsComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class SplitsComponentStateRef {
    ptr: Buffer;
    finalSeparatorShown(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_final_separator_shown(this.ptr);
        return result;
    }
    len(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_len(this.ptr);
        return result;
    }
    iconChange(index: number): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_icon_change(this.ptr, index);
        return result;
    }
    name(index: number): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_name(this.ptr, index);
        return result;
    }
    delta(index: number): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_delta(this.ptr, index);
        return result;
    }
    time(index: number): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_time(this.ptr, index);
        return result;
    }
    color(index: number): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_color(this.ptr, index);
        return result;
    }
    isCurrentSplit(index: number): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SplitsComponentState_is_current_split(this.ptr, index);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.SplitsComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class SumOfBestComponentRef {
    ptr: Buffer;
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.SumOfBestComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): SumOfBestComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new SumOfBestComponentState(liveSplitCoreNative.SumOfBestComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.SumOfBestComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): SumOfBestComponent {
        var result = new SumOfBestComponent(liveSplitCoreNative.SumOfBestComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.SumOfBestComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class SumOfBestComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SumOfBestComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.SumOfBestComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.SumOfBestComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TextComponentRef {
    ptr: Buffer;
    stateAsJson(): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponent_state_as_json(this.ptr);
        return JSON.parse(result);
    }
    state(): TextComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TextComponentState(liveSplitCoreNative.TextComponent_state(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class TextComponentRefMut extends TextComponentRef {
    setCenter(text: string) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.TextComponent_set_center(this.ptr, text);
    }
    setLeft(text: string) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.TextComponent_set_left(this.ptr, text);
    }
    setRight(text: string) {
        if (ref.isNull(this.ptr)) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TextComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): TextComponent {
        var result = new TextComponent(liveSplitCoreNative.TextComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.TextComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TextComponentStateRef {
    ptr: Buffer;
    left(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_left(this.ptr);
        return result;
    }
    right(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_right(this.ptr);
        return result;
    }
    center(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_center(this.ptr);
        return result;
    }
    isSplit(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TextComponentState_is_split(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TextComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TimeRef {
    ptr: Buffer;
    clone(): Time {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Time(liveSplitCoreNative.Time_clone(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    realTime(): TimeSpanRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Time_real_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    gameTime(): TimeSpanRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Time_game_time(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    index(timingMethod: number): TimeSpanRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Time_index(this.ptr, timingMethod));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.Time_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TimeSpanRef {
    ptr: Buffer;
    clone(): TimeSpan {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpan(liveSplitCoreNative.TimeSpan_clone(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    totalSeconds(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimeSpan_total_seconds(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TimeSpan_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static fromSeconds(seconds: number): TimeSpan {
        var result = new TimeSpan(liveSplitCoreNative.TimeSpan_from_seconds(seconds));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TimerRef {
    ptr: Buffer;
    currentTimingMethod(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_current_timing_method(this.ptr);
        return result;
    }
    currentComparison(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_current_comparison(this.ptr);
        return result;
    }
    isGameTimeInitialized(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_is_game_time_initialized(this.ptr);
        return result;
    }
    isGameTimePaused(): boolean {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_is_game_time_paused(this.ptr);
        return result;
    }
    loadingTimes(): TimeSpanRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimeSpanRef(liveSplitCoreNative.Timer_loading_times(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    currentPhase(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.Timer_current_phase(this.ptr);
        return result;
    }
    getRun(): RunRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new RunRef(liveSplitCoreNative.Timer_get_run(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    printDebug() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_print_debug(this.ptr);
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class TimerRefMut extends TimerRef {
    split() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_split(this.ptr);
    }
    skipSplit() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_skip_split(this.ptr);
    }
    undoSplit() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_undo_split(this.ptr);
    }
    reset(updateSplits: boolean) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_reset(this.ptr, updateSplits);
    }
    pause() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_pause(this.ptr);
    }
    undoAllPauses() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_undo_all_pauses(this.ptr);
    }
    setCurrentTimingMethod(method: number) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_set_current_timing_method(this.ptr, method);
    }
    switchToNextComparison() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_switch_to_next_comparison(this.ptr);
    }
    switchToPreviousComparison() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_switch_to_previous_comparison(this.ptr);
    }
    initializeGameTime() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_initialize_game_time(this.ptr);
    }
    uninitializeGameTime() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_uninitialize_game_time(this.ptr);
    }
    pauseGameTime() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_pause_game_time(this.ptr);
    }
    unpauseGameTime() {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        liveSplitCoreNative.Timer_unpause_game_time(this.ptr);
    }
    setGameTime(time: TimeSpanRef) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(time.ptr)) {
            throw "time is disposed";
        }
        liveSplitCoreNative.Timer_set_game_time(this.ptr, time.ptr);
    }
    setLoadingTimes(time: TimeSpanRef) {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(time.ptr)) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.Timer_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(run: Run): Timer {
        if (ref.isNull(run.ptr)) {
            throw "run is disposed";
        }
        var result = new Timer(liveSplitCoreNative.Timer_new(run.ptr));
        run.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoShared(): SharedTimer {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new SharedTimer(liveSplitCoreNative.Timer_into_shared(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TimerComponentRef {
    ptr: Buffer;
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.TimerComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): TimerComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new TimerComponentState(liveSplitCoreNative.TimerComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TimerComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): TimerComponent {
        var result = new TimerComponent(liveSplitCoreNative.TimerComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.TimerComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TimerComponentStateRef {
    ptr: Buffer;
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimerComponentState_time(this.ptr);
        return result;
    }
    fraction(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimerComponentState_fraction(this.ptr);
        return result;
    }
    color(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TimerComponentState_color(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TimerComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TimerReadLockRef {
    ptr: Buffer;
    timer(): TimerRef {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimerRef(liveSplitCoreNative.TimerReadLock_timer(this.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TimerReadLock_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TimerWriteLockRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class TimerWriteLockRefMut extends TimerWriteLockRef {
    timer(): TimerRefMut {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new TimerRefMut(liveSplitCoreNative.TimerWriteLock_timer(this.ptr));
        if (ref.isNull(result.ptr)) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TimerWriteLock_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TitleComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class TitleComponentRefMut extends TitleComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.TitleComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): TitleComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new TitleComponentState(liveSplitCoreNative.TitleComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TitleComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): TitleComponent {
        var result = new TitleComponent(liveSplitCoreNative.TitleComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.TitleComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TitleComponentStateRef {
    ptr: Buffer;
    iconChange(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_icon_change(this.ptr);
        return result;
    }
    game(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_game(this.ptr);
        return result;
    }
    category(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_category(this.ptr);
        return result;
    }
    attempts(): number {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TitleComponentState_attempts(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
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
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TitleComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}

export class TotalPlaytimeComponentRef {
    ptr: Buffer;
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class TotalPlaytimeComponentRefMut extends TotalPlaytimeComponentRef {
    stateAsJson(timer: TimerRef): any {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = liveSplitCoreNative.TotalPlaytimeComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(result);
    }
    state(timer: TimerRef): TotalPlaytimeComponentState {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        if (ref.isNull(timer.ptr)) {
            throw "timer is disposed";
        }
        var result = new TotalPlaytimeComponentState(liveSplitCoreNative.TotalPlaytimeComponent_state(this.ptr, timer.ptr));
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TotalPlaytimeComponent extends TotalPlaytimeComponentRefMut {
    with(closure: (obj: TotalPlaytimeComponent) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TotalPlaytimeComponent_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
    static new(): TotalPlaytimeComponent {
        var result = new TotalPlaytimeComponent(liveSplitCoreNative.TotalPlaytimeComponent_new());
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
    intoGeneric(): Component {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = new Component(liveSplitCoreNative.TotalPlaytimeComponent_into_generic(this.ptr));
        this.ptr = ref.NULL;
        if (ref.isNull(result.ptr)) {
            return null;
        }
        return result;
    }
}

export class TotalPlaytimeComponentStateRef {
    ptr: Buffer;
    text(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TotalPlaytimeComponentState_text(this.ptr);
        return result;
    }
    time(): string {
        if (ref.isNull(this.ptr)) {
            throw "this is disposed";
        }
        var result = liveSplitCoreNative.TotalPlaytimeComponentState_time(this.ptr);
        return result;
    }
    constructor(ptr: Buffer) {
        this.ptr = ptr;
    }
}

export class TotalPlaytimeComponentStateRefMut extends TotalPlaytimeComponentStateRef {
}

export class TotalPlaytimeComponentState extends TotalPlaytimeComponentStateRefMut {
    with(closure: (obj: TotalPlaytimeComponentState) => void) {
        try {
            closure(this);
        } finally {
            this.dispose();
        }
    }
    dispose() {
        if (!ref.isNull(this.ptr)) {
            liveSplitCoreNative.TotalPlaytimeComponentState_drop(this.ptr);
            this.ptr = ref.NULL;
        }
    }
}
