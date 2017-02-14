declare var LiveSplitCore: any;
var ls = LiveSplitCore({});

var TimeSpan_clone = ls.cwrap('TimeSpan_clone', 'number', ['number']);
var TimeSpan_drop = ls.cwrap('TimeSpan_drop', null, ['number']);
var TimeSpan_total_seconds = ls.cwrap('TimeSpan_total_seconds', 'number', ['number']);

var Time_clone = ls.cwrap('Time_clone', 'number', ['number']);
var Time_drop = ls.cwrap('Time_drop', null, ['number']);
var Time_real_time = ls.cwrap('Time_real_time', 'number', ['number']);
var Time_game_time = ls.cwrap('Time_game_time', 'number', ['number']);
var Time_index = ls.cwrap('Time_index', 'number', ['number', 'number']);

var Segment_new = ls.cwrap('Segment_new', 'number', ['string']);
var Segment_drop = ls.cwrap('Segment_drop', null, ['number']);
var Segment_name = ls.cwrap('Segment_name', 'string', ['number']);
var Segment_icon = ls.cwrap('Segment_icon', 'string', ['number']);
var Segment_comparison = ls.cwrap('Segment_comparison', 'number', ['number', 'string']);
var Segment_personal_best_split_time = ls.cwrap('Segment_personal_best_split_time', 'number', ['number']);
var Segment_best_segment_time = ls.cwrap('Segment_best_segment_time', 'number', ['number']);
var Segment_segment_history = ls.cwrap('Segment_segment_history', 'number', ['number']);

var SegmentHistory_iter = ls.cwrap('SegmentHistory_iter', 'number', ['number']);

var SegmentHistoryIter_drop = ls.cwrap('SegmentHistoryIter_drop', null, ['number']);
var SegmentHistoryIter_next = ls.cwrap('SegmentHistoryIter_next', 'number', ['number']);

var SegmentHistoryElement_index = ls.cwrap('SegmentHistoryElement_index', 'number', ['number']);
var SegmentHistoryElement_time = ls.cwrap('SegmentHistoryElement_time', 'number', ['number']);

var SegmentList_new = ls.cwrap('SegmentList_new', 'number', []);
var SegmentList_push = ls.cwrap('SegmentList_push', null, ['number', 'number']);

var Run_new = ls.cwrap('Run_new', 'number', ['number']);
var Run_drop = ls.cwrap('Run_drop', null, ['number']);
var Run_parse = ls.cwrap('Run_parse', 'number', ['number', 'number']);
var Run_game_name = ls.cwrap('Run_game_name', 'string', ['number']);
var Run_set_game_name = ls.cwrap('Run_set_game_name', null, ['number', 'string']);
var Run_game_icon = ls.cwrap('Run_game_icon', 'string', ['number']);
var Run_category_name = ls.cwrap('Run_category_name', 'string', ['number']);
var Run_set_category_name = ls.cwrap('Run_set_category_name', null, ['number', 'string']);
var Run_extended_file_name = ls.cwrap('Run_extended_file_name', 'string', ['number', 'number']);
var Run_extended_name = ls.cwrap('Run_extended_name', 'string', ['number', 'number']);
var Run_extended_category_name = ls.cwrap('Run_extended_category_name', 'string', ['number', 'number', 'number', 'number']);
var Run_attempt_count = ls.cwrap('Run_attempt_count', 'number', ['number']);
var Run_metadata = ls.cwrap('Run_metadata', 'number', ['number']);
var Run_offset = ls.cwrap('Run_offset', 'number', ['number']);
var Run_len = ls.cwrap('Run_len', 'number', ['number']);
var Run_segment = ls.cwrap('Run_segment', 'number', ['number', 'number']);
var Run_attempt_history_len = ls.cwrap('Run_attempt_history_len', 'number', ['number']);
var Run_attempt_history_index = ls.cwrap('Run_attempt_history_index', 'number', ['number', 'number']);

var Attempt_index = ls.cwrap('Attempt_index', 'number', ['number']);
var Attempt_time = ls.cwrap('Attempt_time', 'number', ['number']);

var RunMetadata_run_id = ls.cwrap('RunMetadata_run_id', 'string', ['number']);
var RunMetadata_platform_name = ls.cwrap('RunMetadata_platform_name', 'string', ['number']);
var RunMetadata_uses_emulator = ls.cwrap('RunMetadata_uses_emulator', 'number', ['number']);
var RunMetadata_region_name = ls.cwrap('RunMetadata_region_name', 'string', ['number']);

var Timer_new = ls.cwrap('Timer_new', 'number', ['number']);
var Timer_drop = ls.cwrap('Timer_drop', null, ['number']);
var Timer_start = ls.cwrap('Timer_start', null, ['number']);
var Timer_split = ls.cwrap('Timer_split', null, ['number']);
var Timer_skip_split = ls.cwrap('Timer_skip_split', null, ['number']);
var Timer_undo_split = ls.cwrap('Timer_undo_split', null, ['number']);
var Timer_reset = ls.cwrap('Timer_reset', null, ['number', 'number']);
var Timer_pause = ls.cwrap('Timer_pause', null, ['number']);
var Timer_current_timing_method = ls.cwrap('Timer_current_timing_method', 'number', ['number']);
var Timer_set_current_timing_method = ls.cwrap('Timer_set_current_timing_method', null, ['number', 'number']);
var Timer_current_comparison = ls.cwrap('Timer_current_comparison', 'string', ['number']);
var Timer_switch_to_next_comparison = ls.cwrap('Timer_switch_to_next_comparison', null, ['number']);
var Timer_switch_to_previous_comparison = ls.cwrap('Timer_switch_to_previous_comparison', null, ['number']);
var Timer_current_phase = ls.cwrap('Timer_current_phase', 'number', ['number']);
var Timer_get_run = ls.cwrap('Timer_get_run', 'number', ['number']);
var Timer_clone_run = ls.cwrap('Timer_clone_run', 'number', ['number']);
var Timer_print_debug = ls.cwrap('Timer_print_debug', null, ['number']);
var Timer_save_run_as_lss = ls.cwrap('Timer_save_run_as_lss', 'string', ['number']);

var TimerComponent_new = ls.cwrap('TimerComponent_new', 'number', []);
var TimerComponent_drop = ls.cwrap('TimerComponent_drop', null, ['number']);
var TimerComponent_state = ls.cwrap('TimerComponent_state', 'string', ['number', 'number']);

var TitleComponent_new = ls.cwrap('TitleComponent_new', 'number', []);
var TitleComponent_drop = ls.cwrap('TitleComponent_drop', null, ['number']);
var TitleComponent_state = ls.cwrap('TitleComponent_state', 'string', ['number', 'number']);

var SplitsComponent_new = ls.cwrap('SplitsComponent_new', 'number', []);
var SplitsComponent_drop = ls.cwrap('SplitsComponent_drop', null, ['number']);
var SplitsComponent_state = ls.cwrap('SplitsComponent_state', 'string', ['number', 'number']);
var SplitsComponent_scroll_up = ls.cwrap('SplitsComponent_scroll_up', null, ['number']);
var SplitsComponent_scroll_down = ls.cwrap('SplitsComponent_scroll_down', null, ['number']);

var PreviousSegmentComponent_new = ls.cwrap('PreviousSegmentComponent_new', 'number', []);
var PreviousSegmentComponent_drop = ls.cwrap('PreviousSegmentComponent_drop', null, ['number']);
var PreviousSegmentComponent_state = ls.cwrap('PreviousSegmentComponent_state', 'string', ['number', 'number']);

var SumOfBestComponent_new = ls.cwrap('SumOfBestComponent_new', 'number', []);
var SumOfBestComponent_drop = ls.cwrap('SumOfBestComponent_drop', null, ['number']);
var SumOfBestComponent_state = ls.cwrap('SumOfBestComponent_state', 'string', ['number', 'number']);

var PossibleTimeSaveComponent_new = ls.cwrap('PossibleTimeSaveComponent_new', 'number', []);
var PossibleTimeSaveComponent_drop = ls.cwrap('PossibleTimeSaveComponent_drop', null, ['number']);
var PossibleTimeSaveComponent_state = ls.cwrap('PossibleTimeSaveComponent_state', 'string', ['number', 'number']);

var RunEditor_new = ls.cwrap('RunEditor_new', 'number', ['number']);
var RunEditor_close = ls.cwrap('RunEditor_close', 'number', ['number']);
var RunEditor_state = ls.cwrap('RunEditor_state', 'string', ['number']);
var RunEditor_select_timing_method = ls.cwrap('RunEditor_select_timing_method', null, ['number', 'number']);
var RunEditor_unselect = ls.cwrap('RunEditor_unselect', null, ['number', 'number']);
var RunEditor_select_additionally = ls.cwrap('RunEditor_select_additionally', null, ['number', 'number']);
var RunEditor_select_only = ls.cwrap('RunEditor_select_only', null, ['number', 'number']);
var RunEditor_set_game_name = ls.cwrap('RunEditor_set_game_name', null, ['number', 'string']);
var RunEditor_set_category_name = ls.cwrap('RunEditor_set_category_name', null, ['number', 'string']);
var RunEditor_parse_and_set_offset = ls.cwrap('RunEditor_parse_and_set_offset', 'number', ['number', 'string']);
var RunEditor_parse_and_set_attempt_count = ls.cwrap('RunEditor_parse_and_set_attempt_count', 'number', ['number', 'string']);
var RunEditor_set_game_icon = ls.cwrap('RunEditor_set_game_icon', null, ['number', 'number', 'number']);
var RunEditor_insert_segment_above = ls.cwrap('RunEditor_insert_segment_above', null, ['number']);
var RunEditor_insert_segment_below = ls.cwrap('RunEditor_insert_segment_below', null, ['number']);
var RunEditor_remove_segments = ls.cwrap('RunEditor_remove_segments', null, ['number']);
var RunEditor_move_segments_up = ls.cwrap('RunEditor_move_segments_up', null, ['number']);
var RunEditor_move_segments_down = ls.cwrap('RunEditor_move_segments_down', null, ['number']);
var RunEditor_selected_set_icon = ls.cwrap('RunEditor_selected_set_icon', null, ['number', 'number', 'number']);
var RunEditor_selected_set_name = ls.cwrap('RunEditor_selected_set_name', null, ['number', 'string']);
var RunEditor_selected_parse_and_set_split_time = ls.cwrap('RunEditor_selected_parse_and_set_split_time', 'number', ['number', 'string']);
var RunEditor_selected_parse_and_set_segment_time = ls.cwrap('RunEditor_selected_parse_and_set_segment_time', 'number', ['number', 'string']);
var RunEditor_selected_parse_and_set_best_segment_time = ls.cwrap('RunEditor_selected_parse_and_set_best_segment_time', 'number', ['number', 'string']);
var RunEditor_selected_parse_and_set_comparison_time = ls.cwrap('RunEditor_selected_parse_and_set_comparison_time', 'number', ['number', 'string', 'string']);

class LSClass {
    constructor(public ptr: number) { }

    dropped() {
        this.ptr = undefined;
    }
}

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

export class TimeSpan extends LSClass {
    clone(): TimeSpan {
        return new TimeSpan(TimeSpan_clone(this.ptr));
    }

    drop() {
        TimeSpan_drop(this.ptr);
        this.dropped();
    }

    totalSeconds(): number {
        return TimeSpan_total_seconds(this.ptr);
    }
}

export class Time extends LSClass {
    clone(): Time {
        return new Time(Time_clone(this.ptr));
    }

    drop() {
        Time_drop(this.ptr);
        this.dropped();
    }

    realTime(): TimeSpan {
        let ptr = Time_real_time(this.ptr);
        if (ptr != 0) {
            return new TimeSpan(ptr);
        } else {
            return null;
        }
    }

    gameTime(): TimeSpan {
        let ptr = Time_game_time(this.ptr);
        if (ptr != 0) {
            return new TimeSpan(ptr);
        } else {
            return null;
        }
    }

    index(timing_method: TimingMethod): TimeSpan {
        let ptr = Time_index(this.ptr, timing_method);
        if (ptr != 0) {
            return new TimeSpan(ptr);
        } else {
            return null;
        }
    }
}

export class Segment extends LSClass {
    static new(name: string): Segment {
        return new Segment(Segment_new(name));
    }

    drop() {
        Segment_drop(this.ptr);
        this.dropped();
    }

    name(): string {
        return Segment_name(this.ptr);
    }

    icon(): string {
        return Segment_icon(this.ptr);
    }

    comparison(comparison: string): Time {
        return new Time(Segment_comparison(this.ptr, comparison));
    }

    personalBestSplitTime(): Time {
        return new Time(Segment_personal_best_split_time(this.ptr));
    }

    bestSegmentTime(): Time {
        return new Time(Segment_best_segment_time(this.ptr));
    }

    segmentHistory(): SegmentHistory {
        return new SegmentHistory(Segment_segment_history(this.ptr));
    }
}

export class SegmentHistory extends LSClass {
    iter(): SegmentHistoryIter {
        return new SegmentHistoryIter(SegmentHistory_iter(this.ptr));
    }
}

export class SegmentHistoryIter extends LSClass {
    next(): SegmentHistoryElement {
        let ptr = SegmentHistoryIter_next(this.ptr);
        if (ptr != 0) {
            return new SegmentHistoryElement(ptr);
        } else {
            return null;
        }
    }
}

export class SegmentHistoryElement extends LSClass {
    index(): number {
        return SegmentHistoryElement_index(this.ptr);
    }

    time(): Time {
        return new Time(SegmentHistoryElement_time(this.ptr));
    }
}

export class SegmentList extends LSClass {
    static new(): SegmentList {
        return new SegmentList(SegmentList_new());
    }

    push(segment: Segment) {
        SegmentList_push(this.ptr, segment.ptr);
        segment.dropped();
    }
}

export class Run extends LSClass {
    static new(segments: SegmentList): Run {
        let run = new Run(Run_new(segments.ptr));
        segments.dropped();
        return run;
    }

    drop() {
        Run_drop(this.ptr);
        this.dropped();
    }

    static parse(data: Int8Array): Run {
        let buf = ls._malloc(data.length);
        ls.writeArrayToMemory(data, buf);
        let ptr = Run_parse(buf, data.length);
        ls._free(buf);

        if (ptr == 0) {
            return null;
        }
        return new Run(ptr);
    }

    static parseString(text: string): Run {
        let len = (text.length << 2) + 1;
        let buf = ls._malloc(len);
        let actualLen = ls.stringToUTF8(text, buf, len);
        let ptr = Run_parse(buf, actualLen);
        ls._free(buf);

        if (ptr == 0) {
            return null;
        }
        return new Run(ptr);
    }

    gameName(): string {
        return Run_game_name(this.ptr);
    }

    setGameName(game: string) {
        Run_set_game_name(this.ptr, game);
    }

    gameIcon(): string {
        return Run_game_icon(this.ptr);
    }

    categoryName(): string {
        return Run_category_name(this.ptr);
    }

    setCategoryName(category: string) {
        Run_set_category_name(this.ptr, category);
    }

    extendedFileName(useExtendedCategoryName: boolean): string {
        return Run_extended_file_name(this.ptr, useExtendedCategoryName ? 1 : 0);
    }

    extendedName(useExtendedCategoryName: boolean): string {
        return Run_extended_name(this.ptr, useExtendedCategoryName ? 1 : 0);
    }

    extendedCategoryName(showRegion: boolean, showPlatform: boolean, showVariables: boolean): string {
        return Run_extended_category_name(this.ptr, showRegion ? 1 : 0, showPlatform ? 1 : 0, showVariables ? 1 : 0);
    }

    attemptCount(): number {
        return Run_attempt_count(this.ptr);
    }

    metadata(): RunMetadata {
        return Run_metadata(this.ptr);
    }

    offset(): TimeSpan {
        return new TimeSpan(Run_offset(this.ptr));
    }

    len(): number {
        return Run_len(this.ptr);
    }

    segment(index: number): Segment {
        return new Segment(Run_segment(this.ptr, index));
    }

    attemptHistoryLen(): number {
        return Run_attempt_history_len(this.ptr);
    }

    attemptHistoryIndex(index: number): Attempt {
        return new Attempt(Run_attempt_history_index(this.ptr, index));
    }
}

export class Attempt extends LSClass {
    index(): number {
        return Attempt_index(this.ptr);
    }

    time(): Time {
        return new Time(Attempt_time(this.ptr));
    }
}

export class RunMetadata extends LSClass {
    runId(): string {
        return RunMetadata_run_id(this.ptr);
    }

    platformName(): string {
        return RunMetadata_platform_name(this.ptr);
    }

    usesEmulator(): boolean {
        return RunMetadata_uses_emulator(this.ptr) != 0;
    }

    regionName(): string {
        return RunMetadata_region_name(this.ptr);
    }
}

export class Timer extends LSClass {
    static new(run: Run): Timer {
        let timer = new Timer(Timer_new(run.ptr));
        run.dropped();
        return timer;
    }

    drop() {
        Timer_drop(this.ptr);
        this.dropped();
    }

    start() {
        Timer_start(this.ptr);
    }

    split() {
        Timer_split(this.ptr);
    }

    skipSplit() {
        Timer_skip_split(this.ptr);
    }

    undoSplit() {
        Timer_undo_split(this.ptr);
    }

    reset(updateSplits: boolean) {
        Timer_reset(this.ptr, updateSplits ? 1 : 0);
    }

    pause() {
        Timer_pause(this.ptr);
    }

    currentTimingMethod(): TimingMethod {
        return Timer_current_timing_method(this.ptr);
    }

    setCurrentTimingMethod(method: TimingMethod) {
        Timer_set_current_timing_method(this.ptr, method);
    }

    currentComparison(): string {
        return Timer_current_comparison(this.ptr);
    }

    switchToNextComparison() {
        Timer_switch_to_next_comparison(this.ptr);
    }

    switchToPreviousComparison() {
        Timer_switch_to_previous_comparison(this.ptr);
    }

    getCurrentPhase(): TimerPhase {
        return Timer_current_phase(this.ptr);
    }

    getRun(): Run {
        return new Run(Timer_get_run(this.ptr));
    }

    cloneRun(): Run {
        return new Run(Timer_clone_run(this.ptr));
    }

    printDebug() {
        Timer_print_debug(this.ptr);
    }

    saveRunAsLSS(): string {
        return Timer_save_run_as_lss(this.ptr);
    }
}

export interface TimerComponentState {
    time: string;
    fraction: string;
    color: Color;
}

export class TimerComponent extends LSClass {
    constructor() {
        super(TimerComponent_new());
    }

    drop() {
        TimerComponent_drop(this.ptr);
        this.dropped();
    }

    state(timer: Timer): TimerComponentState {
        return JSON.parse(TimerComponent_state(this.ptr, timer.ptr));
    }
}

export interface TitleComponentState {
    icon_change?: string;
    game: string;
    category: string;
    attempts: number;
}

export class TitleComponent extends LSClass {
    constructor() {
        super(TitleComponent_new());
    }

    drop() {
        TitleComponent_drop(this.ptr);
        this.dropped();
    }

    state(timer: Timer): TitleComponentState {
        return JSON.parse(TitleComponent_state(this.ptr, timer.ptr));
    }
}

export interface SplitsComponentState {
    splits: SplitState[];
    show_final_separator: boolean;
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

export interface SplitState {
    icon_change?: string;
    name: string;
    delta: string;
    time: string;
    color: Color;
    is_current_split: boolean;
}

export class SplitsComponent extends LSClass {
    constructor() {
        super(SplitsComponent_new());
    }

    drop() {
        SplitsComponent_drop(this.ptr);
        this.dropped();
    }

    state(timer: Timer): SplitsComponentState {
        return JSON.parse(SplitsComponent_state(this.ptr, timer.ptr));
    }

    scrollUp() {
        SplitsComponent_scroll_up(this.ptr);
    }

    scrollDown() {
        SplitsComponent_scroll_down(this.ptr);
    }
}

export interface PreviousSegmentComponentState {
    text: string;
    time: string;
    color: Color;
}

export class PreviousSegmentComponent extends LSClass {
    constructor() {
        super(PreviousSegmentComponent_new());
    }

    drop() {
        PreviousSegmentComponent_drop(this.ptr);
        this.dropped();
    }

    state(timer: Timer): PreviousSegmentComponentState {
        return JSON.parse(PreviousSegmentComponent_state(this.ptr, timer.ptr));
    }
}

export interface SumOfBestComponentState {
    text: string;
    time: string;
}

export class SumOfBestComponent extends LSClass {
    constructor() {
        super(SumOfBestComponent_new());
    }

    drop() {
        SumOfBestComponent_drop(this.ptr);
        this.dropped();
    }

    state(timer: Timer): SumOfBestComponentState {
        return JSON.parse(SumOfBestComponent_state(this.ptr, timer.ptr));
    }
}

export interface PossibleTimeSaveComponentState {
    text: string;
    time: string;
}

export class PossibleTimeSaveComponent extends LSClass {
    constructor() {
        super(PossibleTimeSaveComponent_new());
    }

    drop() {
        PossibleTimeSaveComponent_drop(this.ptr);
        this.dropped();
    }

    state(timer: Timer): SumOfBestComponentState {
        return JSON.parse(PossibleTimeSaveComponent_state(this.ptr, timer.ptr));
    }
}

export interface RunEditorState {
    icon_change?: string,
    game: string,
    category: string,
    offset: string,
    attempts: string,
    timing_method: "RealTime" | "GameTime",
    segments: RunEditorRow[],
    comparison_names: string[],
    buttons: RunEditorButtons,
}

export interface RunEditorButtons {
    can_remove: boolean,
    can_move_up: boolean,
    can_move_down: boolean,
}

export interface RunEditorRow {
    icon_change?: string,
    name: string,
    split_time: string,
    segment_time: string,
    best_segment_time: string,
    comparison_times: string[],
    selected: "NotSelected" | "Selected" | "CurrentRow",
}

export class RunEditor extends LSClass {
    static new(run: Run): RunEditor {
        let ptr = RunEditor_new(run.ptr);
        run.dropped();
        return new RunEditor(ptr);
    }

    drop() {
        let run = RunEditor_close(this.ptr);
        Run_drop(run);
        this.dropped();
    }

    close(): Run {
        let run = new Run(RunEditor_close(this.ptr));
        this.dropped();
        return run;
    }

    state(): RunEditorState {
        return JSON.parse(RunEditor_state(this.ptr));
    }

    selectTimingMethod(method: TimingMethod) {
        RunEditor_select_timing_method(this.ptr, method);
    }

    unselect(index: number) {
        RunEditor_unselect(this.ptr, index);
    }

    selectAdditionally(index: number) {
        RunEditor_select_additionally(this.ptr, index);
    }

    selectOnly(index: number) {
        RunEditor_select_only(this.ptr, index);
    }

    setGameName(name: string) {
        RunEditor_set_game_name(this.ptr, name);
    }

    setCategoryName(name: string) {
        RunEditor_set_category_name(this.ptr, name);
    }

    parseAndSetOffset(offset: string): boolean {
        return RunEditor_parse_and_set_offset(this.ptr, offset) != 0;
    }

    parseAndSetAttemptCount(attempts: string): boolean {
        return RunEditor_parse_and_set_attempt_count(this.ptr, attempts) != 0;
    }

    setGameIcon(data: Int8Array) {
        let buf = ls._malloc(data.length);
        ls.writeArrayToMemory(data, buf);
        RunEditor_set_game_icon(this.ptr, buf, data.length);
        ls._free(buf);
    }

    insertSegmentAbove() {
        RunEditor_insert_segment_above(this.ptr);
    }

    insertSegmentBelow() {
        RunEditor_insert_segment_below(this.ptr);
    }

    removeSegments() {
        RunEditor_remove_segments(this.ptr);
    }

    moveSegmentsUp() {
        RunEditor_move_segments_up(this.ptr);
    }

    moveSegmentsDown() {
        RunEditor_move_segments_down(this.ptr);
    }

    selectedSetIcon(data: Int8Array) {
        let buf = ls._malloc(data.length);
        ls.writeArrayToMemory(data, buf);
        RunEditor_selected_set_icon(this.ptr, buf, data.length);
        ls._free(buf);
    }

    selectedSetName(name: string) {
        RunEditor_selected_set_name(this.ptr, name);
    }

    selectedParseAndSetSplitTime(time: string): boolean {
        return RunEditor_selected_parse_and_set_split_time(this.ptr, time) != 0;
    }

    selectedParseAndSetSegmentTime(time: string): boolean {
        return RunEditor_selected_parse_and_set_segment_time(this.ptr, time) != 0;
    }

    selectedParseAndSetBestSegmentTime(time: string): boolean {
        return RunEditor_selected_parse_and_set_best_segment_time(this.ptr, time) != 0;
    }

    selectedParseAndSetComparisonTime(comparison: string, time: string): boolean {
        return RunEditor_selected_parse_and_set_comparison_time(this.ptr, comparison, time) != 0;
    }
}
