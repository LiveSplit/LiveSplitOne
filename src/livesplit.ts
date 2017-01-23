declare var LiveSplitCore: any;
var ls = LiveSplitCore({});

var Segment_new = ls.cwrap('Segment_new', 'number', ['string']);

var SegmentList_new = ls.cwrap('SegmentList_new', 'number', []);
var SegmentList_push = ls.cwrap('SegmentList_push', null, ['number', 'number']);

var Run_new = ls.cwrap('Run_new', 'number', []);
var Run_parse = ls.cwrap('Run_parse', 'number', ['number', 'number']);
var Run_set_game = ls.cwrap('Run_set_game', null, ['number', 'string']);
var Run_set_category = ls.cwrap('Run_set_category', null, ['number', 'string']);

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
var Timer_switch_to_next_comparison = ls.cwrap('Timer_switch_to_next_comparison', 'string', ['number']);
var Timer_switch_to_previous_comparison = ls.cwrap('Timer_switch_to_previous_comparison', 'string', ['number']);
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

export class Segment extends LSClass {
    constructor(name: string) {
        super(Segment_new(name));
    }
}

export class SegmentList extends LSClass {
    constructor() {
        super(SegmentList_new());
    }

    push(segment: Segment) {
        SegmentList_push(this.ptr, segment.ptr);
        segment.dropped();
    }
}

export class Run extends LSClass {
    constructor(segments?: SegmentList) {
        if (segments) {
            super(Run_new(segments.ptr));
            segments.dropped();
        }
    }

    static parse(data: Int32Array): Run {
        let run = new Run();

        let buf = ls._malloc(data.length);
        ls.writeArrayToMemory(data, buf);
        run.ptr = Run_parse(buf, data.length);
        ls._free(buf);

        return run;
    }

    static parseString(text: string): Run {
        let run = new Run();

        let len = (text.length << 2) + 1;
        let buf = ls._malloc(len);
        let actualLen = ls.stringToUTF8(text, buf, len);
        run.ptr = Run_parse(buf, actualLen);
        ls._free(buf);

        return run;
    }

    setGame(game: string) {
        Run_set_game(this.ptr, game);
    }

    setCategory(category: string) {
        Run_set_category(this.ptr, category);
    }
}

export class Timer extends LSClass {
    constructor(run: Run) {
        super(Timer_new(run.ptr));
        run.dropped();
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

    getState(timer: Timer): TimerComponentState {
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

    getState(timer: Timer): TitleComponentState {
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

    getState(timer: Timer): SplitsComponentState {
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

    getState(timer: Timer): PreviousSegmentComponentState {
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

    getState(timer: Timer): SumOfBestComponentState {
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

    getState(timer: Timer): SumOfBestComponentState {
        return JSON.parse(PossibleTimeSaveComponent_state(this.ptr, timer.ptr));
    }
}
