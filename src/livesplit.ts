// tslint:disable
let wasm: WebAssembly.ResultObject | null = null;

declare namespace WebAssembly {
    class Module {
        constructor(bufferSource: ArrayBuffer | Uint8Array);

        public static customSections(module: Module, sectionName: string): ArrayBuffer[];
        public static exports(module: Module): Array<{
            name: string;
            kind: string;
        }>;
        public static imports(module: Module): Array<{
            module: string;
            name: string;
            kind: string;
        }>;
    }

    class Instance {
        public readonly exports: any;
        constructor(module: Module, importObject?: any);
    }

    interface ResultObject {
        module: Module;
        instance: Instance;
    }

    function instantiate(bufferSource: ArrayBuffer | Uint8Array, importObject?: any): Promise<ResultObject>;
    function instantiateStreaming(source: Response | Promise<Response>, importObject?: any): Promise<ResultObject>;
}

declare class TextEncoder {
    constructor(label?: string, options?: TextEncoding.TextEncoderOptions);
    encoding: string;
    encode(input?: string, options?: TextEncoding.TextEncodeOptions): Uint8Array;
}

declare class TextDecoder {
    constructor(utfLabel?: string, options?: TextEncoding.TextDecoderOptions)
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;
    decode(input?: ArrayBufferView, options?: TextEncoding.TextDecodeOptions): string;
}

declare namespace TextEncoding {
    interface TextDecoderOptions {
        fatal?: boolean;
        ignoreBOM?: boolean;
    }

    interface TextDecodeOptions {
        stream?: boolean;
    }

    interface TextEncoderOptions {
        NONSTANDARD_allowLegacyEncoding?: boolean;
    }

    interface TextEncodeOptions {
        stream?: boolean;
    }

    interface TextEncodingStatic {
        TextDecoder: typeof TextDecoder;
        TextEncoder: typeof TextEncoder;
    }
}

function instance(): WebAssembly.Instance {
    if (wasm == null) {
        throw "You need to await load()";
    }
    return wasm.instance;
}

const handleMap: Map<number, any> = new Map();

export async function load(path?: string) {
    const imports = {
        env: {
            Instant_now: function (): number {
                return performance.now() / 1000;
            },
            Date_now: function (ptr: number) {
                const date = new Date();
                const milliseconds = date.valueOf();
                const u32Max = 0x100000000;
                const seconds = milliseconds / 1000;
                const secondsHigh = (seconds / u32Max) | 0;
                const secondsLow = (seconds % u32Max) | 0;
                const nanos = ((milliseconds % 1000) * 1000000) | 0;
                const u32Slice = new Uint32Array(instance().exports.memory.buffer, ptr);
                u32Slice[0] = secondsLow;
                u32Slice[1] = secondsHigh;
                u32Slice[2] = nanos;
            },
            HotkeyHook_new: function (handle: number) {
                const listener = (ev: KeyboardEvent) => {
                    const { ptr, len } = allocString(ev.code);
                    instance().exports.HotkeyHook_callback(ptr, len - 1, handle);
                    dealloc({ ptr, len });
                };
                window.addEventListener("keypress", listener);
                handleMap.set(handle, listener);
            },
            HotkeyHook_drop: function (handle: number) {
                window.removeEventListener("keypress", handleMap.get(handle));
                handleMap.delete(handle);
            },
        },
    };

    let request = fetch(path || 'livesplit_core.wasm');
    if (typeof WebAssembly.instantiateStreaming === "function") {
        try {
            wasm = await WebAssembly.instantiateStreaming(request, imports);
            return;
        } catch { }
        // We retry with the normal instantiate here because Chrome 60 seems to
        // have instantiateStreaming, but it doesn't actually work.
        request = fetch(path || 'livesplit_core.wasm');
    }
    const response = await request;
    const bytes = await response.arrayBuffer();
    wasm = await WebAssembly.instantiate(bytes, imports);
}

let encodeUtf8: (str: string) => Uint8Array;
if (!(global as any)["TextEncoder"]) {
    encodeUtf8 = (str) => {
        var utf8 = [];
        for (var i = 0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) {
                utf8.push(charcode);
            } else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6),
                    0x80 | (charcode & 0x3f));
            } else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            } else {
                i++;
                charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                    | (str.charCodeAt(i) & 0x3ff))
                utf8.push(0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            }
        }
        return new Uint8Array(utf8);
    };
} else {
    const encoder = new TextEncoder("UTF-8");
    encodeUtf8 = (str) => encoder.encode(str);
}

let decodeUtf8: (data: Uint8Array) => string;
if (!(global as any)["TextDecoder"]) {
    decodeUtf8 = (data) => {
        var str = '',
            i;

        for (i = 0; i < data.length; i++) {
            var value = data[i];

            if (value < 0x80) {
                str += String.fromCharCode(value);
            } else if (value > 0xBF && value < 0xE0) {
                str += String.fromCharCode((value & 0x1F) << 6 | data[i + 1] & 0x3F);
                i += 1;
            } else if (value > 0xDF && value < 0xF0) {
                str += String.fromCharCode((value & 0x0F) << 12 | (data[i + 1] & 0x3F) << 6 | data[i + 2] & 0x3F);
                i += 2;
            } else {
                var charCode = ((value & 0x07) << 18 | (data[i + 1] & 0x3F) << 12 | (data[i + 2] & 0x3F) << 6 | data[i + 3] & 0x3F) - 0x010000;

                str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
                i += 3;
            }
        }

        return str;
    };
} else {
    const decoder = new TextDecoder("UTF-8");
    decodeUtf8 = (data) => decoder.decode(data);
}

interface Slice {
    ptr: number,
    len: number,
}

function allocInt8Array(src: Int8Array): Slice {
    const len = src.length;
    const ptr = instance().exports.alloc(len);
    const slice = new Uint8Array(instance().exports.memory.buffer, ptr, len);

    slice.set(src);

    return { ptr, len };
}

function allocString(str: string): Slice {
    const stringBuffer = encodeUtf8(str);
    const len = stringBuffer.length + 1;
    const ptr = instance().exports.alloc(len);
    const slice = new Uint8Array(instance().exports.memory.buffer, ptr, len);

    slice.set(stringBuffer);
    slice[len - 1] = 0;

    return { ptr, len };
}

function decodeString(ptr: number): string {
    const memory = new Uint8Array(instance().exports.memory.buffer);
    let end = ptr;
    while (memory[end] !== 0) {
        end += 1;
    }
    const slice = memory.slice(ptr, end);
    return decodeUtf8(slice);
}

function dealloc(slice: Slice) {
    instance().exports.dealloc(slice.ptr, slice.len);
}

/** The state object for one of the components available. */
export type ComponentStateJson =
    { BlankSpace: BlankSpaceComponentStateJson } |
    { DetailedTimer: DetailedTimerComponentStateJson } |
    { Graph: GraphComponentStateJson } |
    { KeyValue: KeyValueComponentStateJson } |
    { Separator: null } |
    { Splits: SplitsComponentStateJson } |
    { Text: TextComponentStateJson } |
    { Timer: TimerComponentStateJson } |
    { Title: TitleComponentStateJson };

/**
 * Colors can be used to describe what color to use for visualizing backgrounds,
 * texts, lines and various other elements that are being shown. They are stored
 * as RGBA colors with float point numbers ranging from 0.0 to 1.0 per channel.
 */
export type Color = number[];

/**
 * Describes a Gradient for coloring a region with more than just a single
 * color.
 */
export type Gradient =
    "Transparent" |
    { Plain: Color } |
    { Vertical: Color[] } |
    { Horizontal: Color[] };

/**
 * Describes an extended form of a gradient, specifically made for use with
 * lists. It allows specifying different coloration for the rows in a list.
 */
export type ListGradient =
    { Same: Gradient } |
    { Alternating: Color[] };

/** Describes the Alignment of the Title in the Title Component. */
export type Alignment = "Auto" | "Left" | "Center";

/** The state object describes the information to visualize for the layout. */
export interface LayoutStateJson {
    /** The state objects for all of the components in the layout. */
    components: ComponentStateJson[],
    /** The background to show behind the layout. */
    background: Gradient,
    /** The color of thin separators. */
    thin_separators_color: Color,
    /** The color of normal separators. */
    separators_color: Color,
    /** The text color to use for text that doesn't specify its own color. */
    text_color: Color,
}

/**
 * A Timing Method describes which form of timing is used. This can either be
 * Real Time or Game Time.
 */
export enum TimingMethod {
    /**
     * Real Time is the unmodified timing that is as close to an atomic clock as
     * possible.
     */
    RealTime = 0,
    /**
     * Game Time describes the timing that is provided by the game that is being
     * run. This is entirely optional and may either be Real Time with loading
     * times removed or some time provided by the game.
     */
    GameTime = 1,
}

/**
 * Describes which phase the timer is currently in. This tells you if there's an
 * active speedrun attempt and whether it is paused or it ended.
 */
export enum TimerPhase {
    /** There's currently no active attempt. */
    NotRunning = 0,
    /** There's an active attempt that didn't end yet and isn't paused. */
    Running = 1,
    /** There's an attempt that already ended, but didn't get reset yet. */
    Ended = 2,
    /** There's an active attempt that is currently paused. */
    Paused = 3,
}

/** The state object describes the information to visualize for this component. */
export interface BlankSpaceComponentStateJson {
    /** The background shown behind the component. */
    background: Gradient,
    /** The size of the component. */
    size: number,
}

/** The state object describes the information to visualize for this component. */
export interface TimerComponentStateJson {
    /** The background shown behind the component. */
    background: Gradient,
    /** The time shown by the component without the fractional part. */
    time: string,
    /** The fractional part of the time shown (including the dot). */
    fraction: string,
    /** The semantic coloring information the time carries. */
    semantic_color: SemanticColor,
    /** The top color of the timer's gradient. */
    top_color: Color,
    /** The bottom color of the timer's gradient. */
    bottom_color: Color,
    /** The height of the timer. */
    height: number,
}

/** The state object describes the information to visualize for this component. */
export interface TitleComponentStateJson {
    /** The background shown behind the component. */
    background: Gradient,
    /**
     * The color of the text. If `null` is specified, the color is taken from
     * the layout.
     */
    text_color: Color | null,
    /**
     * The game's icon encoded as a Data URL. This value is only specified
     * whenever the icon changes. If you explicitly want to query this value,
     * remount the component. The String itself may be empty. This indicates
     * that there is no icon.
     */
    icon_change: string | null,
    /**
     * The first title line to show. This is either the game's name, or a
     * combination of the game's name and the category.
     */
    line1: string,
    /**
     * By default the category name is shown on the second line. Based on the
     * settings, it can however instead be shown in a single line together with
     * the game name.
     */
    line2: string | null,
    /**
     * Specifies whether the title should centered or aligned to the left
     * instead.
     */
    is_centered: boolean,
    /**
     * The amount of successfully finished attempts. If `null` is specified, the
     * amount of successfully finished attempts isn't supposed to be shown.
     */
    finished_runs: number | null,
    /**
     * The amount of total attempts. If `null` is specified, the amount of total
     * attempts isn't supposed to be shown.
     */
    attempts: number | null,
}

/** The state object describes the information to visualize for this component. */
export interface SplitsComponentStateJson {
    /** The background shown behind the splits. */
    background: ListGradient,
    /**
     * The column labels to visualize about the list of splits. If this is
     * `null`, no labels are supposed to be visualized. The list is specified
     * from right to left.
     */
    column_labels: string[] | null,
    /** The list of all the segments to visualize. */
    splits: SplitStateJson[],
    /**
     * This list describes all the icon changes that happened. Each time a
     * segment is first shown or its icon changes, the new icon is provided in
     * this list. If necessary, you may remount this component to reset the
     * component into a state where these icons are provided again.
     */
    icon_changes: SplitsComponentIconChangeJson[],
    /**
     * Specifies whether the current run has any icons, even those that are not
     * currently visible by the splits component. This allows for properly
     * indenting the icon column, even when the icons are scrolled outside the
     * splits component.
     */
    has_icons: boolean,
    /**
     * Specifies whether thin separators should be shown between the individual
     * segments shown by the component.
     */
    show_thin_separators: boolean,
    /**
     * Describes whether a more pronounced separator should be shown in front of
     * the last segment provided.
     */
    show_final_separator: boolean,
    /**
     * Specifies whether to display each split as two rows, with the segment
     * name being in one row and the times being in the other.
     */
    display_two_rows: boolean,
    /**
     * The gradient to show behind the current segment as an indicator of it
     * being the current segment.
     */
    current_split_gradient: Gradient,
}

/**
 * Describes the icon to be shown for a certain segment. This is provided
 * whenever a segment is first shown or whenever its icon changes. If necessary,
 * you may remount this component to reset the component into a state where
 * these icons are provided again.
 */
export interface SplitsComponentIconChangeJson {
    /**
     * The index of the segment of which the icon changed. This is based on the
     * index in the run, not on the index of the `SplitStateJson` in the
     * `SplitsComponentStateJson` object. The corresponding index is the `index`
     * field of the `SplitStateJson` object.
     */
    segment_index: number,
    /**
     * The segment's icon encoded as a Data URL. The String itself may be empty.
     * This indicates that there is no icon.
     */
    icon: string,
}

/** The state object that describes a single segment's information to visualize. */
export interface SplitStateJson {
    /** The name of the segment. */
    name: string,
    /**
     * The state of each column from right to left. The amount of columns is
     * not guaranteed to be the same across different splits.
     */
    columns: SplitColumnState[],
    /**
     * Describes if this segment is the segment the active attempt is currently
     * on.
     */
    is_current_split: boolean,
    /**
     * The index of the segment based on all the segments of the run. This may
     * differ from the index of this `SplitStateJson` in the
     * `SplitsComponentStateJson` object, as there can be a scrolling window,
     * showing only a subset of segments. Each index is guaranteed to be unique.
     */
    index: number,
}

/** Describes the state of a single segment's column to visualize. */
export interface SplitColumnState {
    /** The value shown in the column. */
    value: string,
    /** The semantic coloring information the value carries. */
    semantic_color: SemanticColor,
    /** The visual color of the value. */
    visual_color: Color,
}

/**
 * The state object describes the information to visualize for a key value based
 * component.
 */
export interface KeyValueComponentStateJson {
    /** The background shown behind the component. */
    background: Gradient,
    /**
     * The color of the key. If `null` is specified, the color is taken from the
     * layout.
     */
    key_color: Color | null,
    /**
     * The color of the key. If `null` is specified, the color is taken from the
     * layout.
     */
    value_color: Color | null,
    /** The semantic coloring information the value carries. */
    semantic_color: SemanticColor,
    /** The key to visualize. */
    key: string,
    /** The value to visualize. */
    value: string,
    /** The visual color of the delta time. */
    visual_color: Color,
    /**
     * Specifies additional abbreviations for the key that can be used instead
     * of the key, if there is not enough space to show the whole key.
     */
    key_abbreviations: string[],
    /**
     * Specifies whether to display the name of the component and its value in
     * two separate rows.
     */
    display_two_rows: boolean,
}

/**
 * The state object describes the information to visualize for this component.
 * All the coordinates are in the range 0..1.
 */
export interface GraphComponentStateJson {
    /**
     * All of the graph's points. Connect all of them to visualize the graph. If
     * the live delta is active, the last point is to be interpreted as a
     * preview of the next split that is about to happen. Use the partial fill
     * color to visualize the region beneath that graph segment.
     */
    points: GraphComponentStatePointJson[],
    /** Contains the y coordinates of all the horizontal grid lines. */
    horizontal_grid_lines: number[],
    /** Contains the x coordinates of all the vertical grid lines. */
    vertical_grid_lines: number[],
    /**
     * The y coordinate that separates the region that shows the times that are
     * ahead of the comparison and those that are behind.
     */
    middle: number,
    /**
     * If the live delta is active, the last point is to be interpreted as a
     * preview of the next split that is about to happen. Use the partial fill
     * color to visualize the region beneath that graph segment.
     */
    is_live_delta_active: boolean,
    /**
     * Describes whether the graph is flipped vertically. For visualizing the
     * graph, this usually doesn't need to be interpreted, as this information
     * is entirely encoded into the other variables.
     */
    is_flipped: boolean,
    /**
     * The background color to use for the top region of the graph. The top
     * region ends at the y coordinate of the middle.
     */
    top_background_color: Color,
    /**
     * The background color to use for the bottom region of the graph. The top
     * region begins at the y coordinate of the middle.
     */
    bottom_background_color: Color,
    /** The color of the grid lines on the graph. */
    grid_lines_color: Color,
    /** The color of the lines connecting all the graph's points. */
    graph_lines_color: Color,
    /**
     * The color of the polygon connecting all the graph's points. The partial
     * fill color is only used for live changes.
     */
    partial_fill_color: Color,
    /** The color of the polygon connecting all the graph's points. */
    complete_fill_color: Color,
    /**
     * The best segment color to use for coloring graph segments that achieved a
     * new best segment time.
     */
    best_segment_color: Color,
    /** The height of the graph. */
    height: number,
}

/** Describes a point on the graph to visualize. */
export interface GraphComponentStatePointJson {
    /** The x coordinate of the point. */
    x: number,
    /** The y coordinate of the point. */
    y: number,
    /**
     * Describes whether the segment this point is visualizing achieved a new
     * best segment time. Use the best segment color for it, in that case.
     */
    is_best_segment: boolean,
}

/** The state object describes the information to visualize for this component. */
export interface TextComponentStateJson {
    /** The background shown behind the component. */
    background: Gradient,
    /**
     * Specifies whether to display the left and right text is supposed to be
     * displayed as two rows.
     */
    display_two_rows: boolean,
    /**
     * The color of the left part of the split up text or the whole text if
     * it's not split up. If `None` is specified, the color is taken from the
     * layout.
     */
    left_center_color: Color,
    /**
     * The color of the right part of the split up text. This can be ignored if
     * the text is not split up. If `None` is specified, the color is taken
     * from the layout.
     */
    right_color: Color,
    /** The text to show for the component. */
    text: TextComponentStateText,
}

/** The text that is supposed to be shown. */
export type TextComponentStateText =
    { Center: string } |
    { Split: string[] };

/** The state object describes the information to visualize for this component. */
export interface DetailedTimerComponentStateJson {
    /** The background shown behind the component. */
    background: Gradient,
    /** The state of the attempt timer. */
    timer: TimerComponentStateJson,
    /** The state of the segment timer. */
    segment_timer: TimerComponentStateJson,
    /** The first comparison to visualize. */
    comparison1: DetailedTimerComponentComparisonStateJson | null,
    /** The second comparison to visualize. */
    comparison2: DetailedTimerComponentComparisonStateJson | null,
    /**
     * The name of the segment. This may be `null` if it's not supposed to be
     * visualized.
     */
    segment_name: string | null,
    /**
     * The segment's icon encoded as a Data URL. This value is only specified
     * whenever the icon changes. If you explicitly want to query this value,
     * remount the component. The String itself may be empty. This indicates
     * that there is no icon.
     */
    icon_change: string | null,
}

/** The state object describing a comparison to visualize. */
export interface DetailedTimerComponentComparisonStateJson {
    /** The name of the comparison. */
    name: string,
    /** The time to show for the comparison. */
    time: string,
}

/**
 * Represents the current state of the Layout Editor in order to visualize it
 * properly.
 */
export interface LayoutEditorStateJson {
    /** The name of all the components in the layout. */
    components: string[],
    /** Describes which actions are currently available. */
    buttons: LayoutEditorButtonsJson,
    /** The index of the currently selected component. */
    selected_component: number,
    /**
     * A generic description of the settings available for the selected
     * component and their current values.
     */
    component_settings: SettingsDescriptionJson,
    /**
     * A generic description of the general settings available for the layout
     * and their current values.
     */
    general_settings: SettingsDescriptionJson,
}

/**
 * Describes which actions are currently available. Depending on how many
 * components exist and which one is selected, only some actions can be executed
 * successfully.
 */
export interface LayoutEditorButtonsJson {
    /**
     * Describes whether the currently selected component can be removed. If
     * there's only one component in the layout, it can't be removed.
     */
    can_remove: boolean,
    /**
     * Describes whether the currently selected component can be moved up. If
     * the first component is selected, it can't be moved.
     */
    can_move_up: boolean,
    /**
     * Describes whether the currently selected component can be moved down. If
     * the last component is selected, it can't be moved.
     */
    can_move_down: boolean,
}

/** A generic description of the settings available and their current values. */
export interface SettingsDescriptionJson {
    /**
     * All of the different settings that are available and their current
     * values.
     */
    fields: SettingsDescriptionFieldJson[],
}

/** A Field describes a single setting by its name and its current value. */
export interface SettingsDescriptionFieldJson {
    /** The name of the setting. */
    text: string,
    /** The current value of the setting. */
    value: SettingsDescriptionValueJson,
}

/**
 * Describes a setting's value. Such a value can be of a variety of different
 * types.
 */
export type SettingsDescriptionValueJson =
    { Bool: boolean } |
    { UInt: number } |
    { Int: number } |
    { String: string } |
    { OptionalString: string | null } |
    { Float: number } |
    { Accuracy: AccuracyJson } |
    { DigitsFormat: DigitsFormatJson } |
    { OptionalTimingMethod: TimingMethodJson | null } |
    { Color: Color } |
    { OptionalColor: Color | null } |
    { Gradient: Gradient } |
    { ListGradient: ListGradient } |
    { Alignment: Alignment } |
    { ColumnStartWith: ColumnStartWith } |
    { ColumnUpdateWith: ColumnUpdateWith } |
    { ColumnUpdateTrigger: ColumnUpdateTrigger } |
    { Hotkey: string } |
    { LayoutDirection: LayoutDirection } |
    { CustomCombobox: CustomCombobox };

/** Describes the direction the components of a layout are laid out in. */
export type LayoutDirection = "Vertical" | "Horizontal";

/**
 * A custom Combobox containing its current value and a list of possible
 * values.
 */
export interface CustomCombobox {
    value: string | undefined,
    list: string[],
    mandatory: boolean,
}

/**
 * Specifies the value a segment starts out with before it gets replaced
 * with the current attempt's information when splitting.
 */
export type ColumnStartWith =
    "Empty" |
    "ComparisonTime" |
    "ComparisonSegmentTime" |
    "PossibleTimeSave";

/**
 * Once a certain condition is met, which is usually being on the split or
 * already having completed the split, the time gets updated with the value
 * specified here.
 */
export type ColumnUpdateWith =
    "DontUpdate" |
    "SplitTime" |
    "Delta" |
    "DeltaWithFallback" |
    "SegmentTime" |
    "SegmentDelta" |
    "SegmentDeltaWithFallback";

/** Specifies when a column's value gets updated. */
export type ColumnUpdateTrigger =
    "OnStartingSegment" |
    "Contextual" |
    "OnEndingSegment";

/**
 * The Accuracy describes how many digits to show for the fractional part of a
 * time.
 */
export type AccuracyJson = "Seconds" | "Tenths" | "Hundredths" | "Milliseconds";

/**
 * A Timing Method describes which form of timing is used. This can either be
 * Real Time or Game Time.
 */
export type TimingMethodJson = "RealTime" | "GameTime";

/**
 * A Digits Format describes how many digits of a time to always shown. The
 * times are prefixed by zeros to fill up the remaining digits.
 */
export type DigitsFormatJson =
    "SingleDigitSeconds" |
    "DoubleDigitSeconds" |
    "SingleDigitMinutes" |
    "DoubleDigitMinutes" |
    "SingleDigitHours" |
    "DoubleDigitHours";

/**
 * Represents the current state of the Run Editor in order to visualize it
 * properly.
 */
export interface RunEditorStateJson {
    /**
     * The game's icon encoded as a Data URL. This value is only specified
     * whenever the icon changes. The String itself may be empty. This
     * indicates that there is no icon.
     */
    icon_change: string | null,
    /** The name of the game the Run is for. */
    game: string,
    /** The name of the category the Run is for. */
    category: string,
    /**
     * The timer offset specifies the time that the timer starts at when starting a
     * new attempt.
     */
    offset: string,
    /**
     * The number of times this Run has been attempted by the runner. This
     * is mostly just a visual number and has no effect on any history.
     */
    attempts: number,
    /**
     * The timing method that is currently selected to be visualized and
     * edited.
     */
    timing_method: TimingMethodJson,
    /** The state of all the segments. */
    segments: RunEditorRowJson[],
    /** The names of all the custom comparisons that exist for this Run. */
    comparison_names: string[],
    /** Describes which actions are currently available. */
    buttons: RunEditorButtonsJson,
    /**
     * Additional metadata of this Run, like the platform and region of the
     * game.
     */
    metadata: RunMetadataJson,
}

/**
 * The Run Metadata stores additional information about a run, like the
 * platform and region of the game. All of this information is optional.
 */
export interface RunMetadataJson {
    /**
     * The speedrun.com Run ID of the run. You need to ensure that the record
     * on speedrun.com matches up with the Personal Best of this run. This may
     * be empty if there's no association.
     */
    run_id: string,
    /**
     * The name of the platform this game is run on. This may be empty if it's
     * not specified.
     */
    platform_name: string,
    /**
     * Specifies whether this speedrun is done on an emulator. Keep in mind
     * that `false` may also mean that this information is simply not known.
     */
    uses_emulator: boolean,
    /**
     * The name of the region this game is from. This may be empty if it's not
     * specified.
     */
    region_name: string,
    /**
     * Stores all the speedrun.com variables. A variable is an arbitrary key
     * value pair storing additional information about the category. An example
     * of this may be whether Amiibos are used in this category.
     */
    speedrun_com_variables: { [key: string]: string | undefined },
    custom_variables: { [key: string]: CustomVariableJson | undefined },
}

export interface CustomVariableJson {
    // TODO:
    value: string,
    /**
     * States whether the variable is permanent. Temporary variables don't get
     * stored in splits files. They also don't get shown in the run editor.
     */
    is_permanent: boolean,
}

/**
 * Describes which actions are currently available. Depending on how many
 * segments exist and which ones are selected, only some actions can be
 * executed successfully.
 */
export interface RunEditorButtonsJson {
    /**
     * Describes whether the currently selected segments can be removed. If all
     * segments are selected, they can't be removed.
     */
    can_remove: boolean,
    /**
     * Describes whether the currently selected segments can be moved up. If
     * any one of the selected segments is the first segment, then they can't
     * be moved.
     */
    can_move_up: boolean,
    /**
     * Describes whether the currently selected segments can be moved down. If
     * any one of the selected segments is the last segment, then they can't be
     * moved.
     */
    can_move_down: boolean,
}

/** Describes the current state of a segment. */
export interface RunEditorRowJson {
    /**
     * The segment's icon encoded as a Data URL. This value is only specified
     * whenever the icon changes. The String itself may be empty. This
     * indicates that there is no icon.
     */
    icon_change: string | null,
    /** The name of the segment. */
    name: string,
    /** The segment's split time for the active timing method. */
    split_time: string,
    /** The segment time for the active timing method. */
    segment_time: string,
    /** The best segment time for the active timing method. */
    best_segment_time: string,
    /**
     * All of the times of the custom comparison for the active timing method.
     * The order of these matches up with the order of the custom comparisons
     * provided by the Run Editor's State object.
     */
    comparison_times: string[],
    /** Describes the segment's selection state. */
    selected: "NotSelected" | "Selected" | "Active",
}

/**
 * A Semantic Color describes a color by some meaningful event that is
 * happening. This information can be visualized as a color, but can also be
 * interpreted in other ways by the consumer of this API.
 */
export type SemanticColor = "Default" |
    "AheadGainingTime" |
    "AheadLosingTime" |
    "BehindLosingTime" |
    "BehindGainingTime" |
    "BestSegment" |
    "NotRunning" |
    "Paused" |
    "PersonalBest";


/**
 * The analysis module provides a variety of functions for calculating
 * information about runs.
 */
export class AnalysisRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The analysis module provides a variety of functions for calculating
 * information about runs.
 */
export class AnalysisRefMut extends AnalysisRef {
}

/**
 * The analysis module provides a variety of functions for calculating
 * information about runs.
 */
export class Analysis extends AnalysisRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Analysis) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
    /**
     * Calculates the Sum of Best Segments for the timing method provided. This is
     * the fastest time possible to complete a run of a category, based on
     * information collected from all the previous attempts. This often matches up
     * with the sum of the best segment times of all the segments, but that may not
     * always be the case, as skipped segments may introduce combined segments that
     * may be faster than the actual sum of their best segment times. The name is
     * therefore a bit misleading, but sticks around for historical reasons. You
     * can choose to do a simple calculation instead, which excludes the Segment
     * History from the calculation process. If there's an active attempt, you can
     * choose to take it into account as well. Can return null.
     */
    static calculateSumOfBest(run: RunRef, simpleCalculation: boolean, useCurrentRun: boolean, method: number): TimeSpan | null {
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const result = new TimeSpan(instance().exports.Analysis_calculate_sum_of_best(run.ptr, simpleCalculation ? 1 : 0, useCurrentRun ? 1 : 0, method));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Calculates the total playtime of the passed Run.
     */
    static calculateTotalPlaytimeForRun(run: RunRef): TimeSpan {
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const result = new TimeSpan(instance().exports.Analysis_calculate_total_playtime_for_run(run.ptr));
        return result;
    }
    /**
     * Calculates the total playtime of the passed Timer.
     */
    static calculateTotalPlaytimeForTimer(timer: TimerRef): TimeSpan {
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new TimeSpan(instance().exports.Analysis_calculate_total_playtime_for_timer(timer.ptr));
        return result;
    }
}

/**
 * An Atomic Date Time represents a UTC Date Time that tries to be as close to
 * an atomic clock as possible.
 */
export class AtomicDateTimeRef {
    ptr: number;
    /**
     * Represents whether the date time is actually properly derived from an
     * atomic clock. If the synchronization with the atomic clock didn't happen
     * yet or failed, this is set to false.
     */
    isSynchronized(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.AtomicDateTime_is_synchronized(this.ptr) != 0;
        return result;
    }
    /**
     * Converts this atomic date time into a RFC 2822 formatted date time.
     */
    toRfc2822(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.AtomicDateTime_to_rfc2822(this.ptr);
        return decodeString(result);
    }
    /**
     * Converts this atomic date time into a RFC 3339 formatted date time.
     */
    toRfc3339(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.AtomicDateTime_to_rfc3339(this.ptr);
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * An Atomic Date Time represents a UTC Date Time that tries to be as close to
 * an atomic clock as possible.
 */
export class AtomicDateTimeRefMut extends AtomicDateTimeRef {
}

/**
 * An Atomic Date Time represents a UTC Date Time that tries to be as close to
 * an atomic clock as possible.
 */
export class AtomicDateTime extends AtomicDateTimeRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: AtomicDateTime) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.AtomicDateTime_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * An Attempt describes information about an attempt to run a specific category
 * by a specific runner in the past. Every time a new attempt is started and
 * then reset, an Attempt describing general information about it is created.
 */
export class AttemptRef {
    ptr: number;
    /**
     * Accesses the unique index of the attempt. This index is unique for the
     * Run, not for all of them.
     */
    index(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Attempt_index(this.ptr);
        return result;
    }
    /**
     * Accesses the split time of the last segment. If the attempt got reset
     * early and didn't finish, this may be empty.
     */
    time(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeRef(instance().exports.Attempt_time(this.ptr));
        return result;
    }
    /**
     * Accesses the amount of time the attempt has been paused for. If it is not
     * known, this returns null. This means that it may not necessarily be
     * possible to differentiate whether a Run has not been paused or it simply
     * wasn't stored.
     */
    pauseTime(): TimeSpanRef | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpanRef(instance().exports.Attempt_pause_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Accesses the point in time the attempt was started at. This returns null
     * if this information is not known.
     */
    started(): AtomicDateTime | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new AtomicDateTime(instance().exports.Attempt_started(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Accesses the point in time the attempt was ended at. This returns null if
     * this information is not known.
     */
    ended(): AtomicDateTime | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new AtomicDateTime(instance().exports.Attempt_ended(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * An Attempt describes information about an attempt to run a specific category
 * by a specific runner in the past. Every time a new attempt is started and
 * then reset, an Attempt describing general information about it is created.
 */
export class AttemptRefMut extends AttemptRef {
}

/**
 * An Attempt describes information about an attempt to run a specific category
 * by a specific runner in the past. Every time a new attempt is started and
 * then reset, an Attempt describing general information about it is created.
 */
export class Attempt extends AttemptRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Attempt) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

/**
 * The Blank Space Component is simply an empty component that doesn't show
 * anything other than a background. It mostly serves as padding between other
 * components.
 */
export class BlankSpaceComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Blank Space Component is simply an empty component that doesn't show
 * anything other than a background. It mostly serves as padding between other
 * components.
 */
export class BlankSpaceComponentRefMut extends BlankSpaceComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.BlankSpaceComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): BlankSpaceComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new BlankSpaceComponentState(instance().exports.BlankSpaceComponent_state(this.ptr, timer.ptr));
        return result;
    }
}

/**
 * The Blank Space Component is simply an empty component that doesn't show
 * anything other than a background. It mostly serves as padding between other
 * components.
 */
export class BlankSpaceComponent extends BlankSpaceComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: BlankSpaceComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.BlankSpaceComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Blank Space Component.
     */
    static new(): BlankSpaceComponent {
        const result = new BlankSpaceComponent(instance().exports.BlankSpaceComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.BlankSpaceComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class BlankSpaceComponentStateRef {
    ptr: number;
    /**
     * The size of the component.
     */
    size(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.BlankSpaceComponentState_size(this.ptr);
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class BlankSpaceComponentStateRefMut extends BlankSpaceComponentStateRef {
}

/**
 * The state object describes the information to visualize for this component.
 */
export class BlankSpaceComponentState extends BlankSpaceComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: BlankSpaceComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.BlankSpaceComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Component provides information about a run in a way that is easy to
 * visualize. This type can store any of the components provided by this crate.
 */
export class ComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Component provides information about a run in a way that is easy to
 * visualize. This type can store any of the components provided by this crate.
 */
export class ComponentRefMut extends ComponentRef {
}

/**
 * A Component provides information about a run in a way that is easy to
 * visualize. This type can store any of the components provided by this crate.
 */
export class Component extends ComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Component) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.Component_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The Current Comparison Component is a component that shows the name of the
 * comparison that is currently selected to be compared against.
 */
export class CurrentComparisonComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Current Comparison Component is a component that shows the name of the
 * comparison that is currently selected to be compared against.
 */
export class CurrentComparisonComponentRefMut extends CurrentComparisonComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.CurrentComparisonComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.CurrentComparisonComponent_state(this.ptr, timer.ptr));
        return result;
    }
}

/**
 * The Current Comparison Component is a component that shows the name of the
 * comparison that is currently selected to be compared against.
 */
export class CurrentComparisonComponent extends CurrentComparisonComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: CurrentComparisonComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.CurrentComparisonComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Current Comparison Component.
     */
    static new(): CurrentComparisonComponent {
        const result = new CurrentComparisonComponent(instance().exports.CurrentComparisonComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.CurrentComparisonComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Current Pace Component is a component that shows a prediction of the
 * current attempt's final time, if the current attempt's pace matches the
 * chosen comparison for the remainder of the run.
 */
export class CurrentPaceComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Current Pace Component is a component that shows a prediction of the
 * current attempt's final time, if the current attempt's pace matches the
 * chosen comparison for the remainder of the run.
 */
export class CurrentPaceComponentRefMut extends CurrentPaceComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.CurrentPaceComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.CurrentPaceComponent_state(this.ptr, timer.ptr));
        return result;
    }
}

/**
 * The Current Pace Component is a component that shows a prediction of the
 * current attempt's final time, if the current attempt's pace matches the
 * chosen comparison for the remainder of the run.
 */
export class CurrentPaceComponent extends CurrentPaceComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: CurrentPaceComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.CurrentPaceComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Current Pace Component.
     */
    static new(): CurrentPaceComponent {
        const result = new CurrentPaceComponent(instance().exports.CurrentPaceComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.CurrentPaceComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Delta Component is a component that shows the how far ahead or behind
 * the current attempt is compared to the chosen comparison.
 */
export class DeltaComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Delta Component is a component that shows the how far ahead or behind
 * the current attempt is compared to the chosen comparison.
 */
export class DeltaComponentRefMut extends DeltaComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = instance().exports.DeltaComponent_state_as_json(this.ptr, timer.ptr, layoutSettings.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer and the layout
     * settings provided.
     */
    state(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.DeltaComponent_state(this.ptr, timer.ptr, layoutSettings.ptr));
        return result;
    }
}

/**
 * The Delta Component is a component that shows the how far ahead or behind
 * the current attempt is compared to the chosen comparison.
 */
export class DeltaComponent extends DeltaComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: DeltaComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.DeltaComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Delta Component.
     */
    static new(): DeltaComponent {
        const result = new DeltaComponent(instance().exports.DeltaComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.DeltaComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Detailed Timer Component is a component that shows two timers, one for
 * the total time of the current attempt and one showing the time of just the
 * current segment. Other information, like segment times of up to two
 * comparisons, the segment icon, and the segment's name, can also be shown.
 */
export class DetailedTimerComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Detailed Timer Component is a component that shows two timers, one for
 * the total time of the current attempt and one showing the time of just the
 * current segment. Other information, like segment times of up to two
 * comparisons, the segment icon, and the segment's name, can also be shown.
 */
export class DetailedTimerComponentRefMut extends DetailedTimerComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = instance().exports.DetailedTimerComponent_state_as_json(this.ptr, timer.ptr, layoutSettings.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer and layout settings
     * provided.
     */
    state(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): DetailedTimerComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = new DetailedTimerComponentState(instance().exports.DetailedTimerComponent_state(this.ptr, timer.ptr, layoutSettings.ptr));
        return result;
    }
}

/**
 * The Detailed Timer Component is a component that shows two timers, one for
 * the total time of the current attempt and one showing the time of just the
 * current segment. Other information, like segment times of up to two
 * comparisons, the segment icon, and the segment's name, can also be shown.
 */
export class DetailedTimerComponent extends DetailedTimerComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: DetailedTimerComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.DetailedTimerComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Detailed Timer Component.
     */
    static new(): DetailedTimerComponent {
        const result = new DetailedTimerComponent(instance().exports.DetailedTimerComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.DetailedTimerComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class DetailedTimerComponentStateRef {
    ptr: number;
    /**
     * The time shown by the component's main timer without the fractional part.
     */
    timerTime(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_timer_time(this.ptr);
        return decodeString(result);
    }
    /**
     * The fractional part of the time shown by the main timer (including the dot).
     */
    timerFraction(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_timer_fraction(this.ptr);
        return decodeString(result);
    }
    /**
     * The semantic coloring information the main timer's time carries.
     */
    timerSemanticColor(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_timer_semantic_color(this.ptr);
        return decodeString(result);
    }
    /**
     * The time shown by the component's segment timer without the fractional part.
     */
    segmentTimerTime(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_segment_timer_time(this.ptr);
        return decodeString(result);
    }
    /**
     * The fractional part of the time shown by the segment timer (including the
     * dot).
     */
    segmentTimerFraction(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_segment_timer_fraction(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns whether the first comparison is visible.
     */
    comparison1Visible(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_comparison1_visible(this.ptr) != 0;
        return result;
    }
    /**
     * Returns the name of the first comparison. You may not call this if the first
     * comparison is not visible.
     */
    comparison1Name(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_comparison1_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns the time of the first comparison. You may not call this if the first
     * comparison is not visible.
     */
    comparison1Time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_comparison1_time(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns whether the second comparison is visible.
     */
    comparison2Visible(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_comparison2_visible(this.ptr) != 0;
        return result;
    }
    /**
     * Returns the name of the second comparison. You may not call this if the
     * second comparison is not visible.
     */
    comparison2Name(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_comparison2_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns the time of the second comparison. You may not call this if the
     * second comparison is not visible.
     */
    comparison2Time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_comparison2_time(this.ptr);
        return decodeString(result);
    }
    /**
     * The data of the segment's icon. This value is only specified whenever the
     * icon changes. If you explicitly want to query this value, remount the
     * component. The buffer itself may be empty. This indicates that there is no
     * icon.
     */
    iconChangePtr(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_icon_change_ptr(this.ptr);
        return result;
    }
    /**
     * The length of the data of the segment's icon.
     */
    iconChangeLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_icon_change_len(this.ptr);
        return result;
    }
    /**
     * The name of the segment. This may be null if it's not supposed to be
     * visualized.
     */
    segmentName(): string | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.DetailedTimerComponentState_segment_name(this.ptr);
        if (result == 0) {
            return null;
        }
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class DetailedTimerComponentStateRefMut extends DetailedTimerComponentStateRef {
}

/**
 * The state object describes the information to visualize for this component.
 */
export class DetailedTimerComponentState extends DetailedTimerComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: DetailedTimerComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.DetailedTimerComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * With a Fuzzy List, you can implement a fuzzy searching algorithm. The list
 * stores all the items that can be searched for. With the `search` method you
 * can then execute the actual fuzzy search which returns a list of all the
 * elements found. This can be used to implement searching in a list of games.
 */
export class FuzzyListRef {
    ptr: number;
    /**
     * Searches for the pattern provided in the list. A list of all the
     * matching elements is returned. The returned list has a maximum amount of
     * elements provided to this method.
     */
    search(pattern: string, max: number): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const pattern_allocated = allocString(pattern);
        const result = instance().exports.FuzzyList_search(this.ptr, pattern_allocated.ptr, max);
        dealloc(pattern_allocated);
        return JSON.parse(decodeString(result));
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * With a Fuzzy List, you can implement a fuzzy searching algorithm. The list
 * stores all the items that can be searched for. With the `search` method you
 * can then execute the actual fuzzy search which returns a list of all the
 * elements found. This can be used to implement searching in a list of games.
 */
export class FuzzyListRefMut extends FuzzyListRef {
    /**
     * Adds a new element to the list.
     */
    push(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const text_allocated = allocString(text);
        instance().exports.FuzzyList_push(this.ptr, text_allocated.ptr);
        dealloc(text_allocated);
    }
}

/**
 * With a Fuzzy List, you can implement a fuzzy searching algorithm. The list
 * stores all the items that can be searched for. With the `search` method you
 * can then execute the actual fuzzy search which returns a list of all the
 * elements found. This can be used to implement searching in a list of games.
 */
export class FuzzyList extends FuzzyListRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: FuzzyList) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.FuzzyList_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Fuzzy List.
     */
    static new(): FuzzyList {
        const result = new FuzzyList(instance().exports.FuzzyList_new());
        return result;
    }
}

/**
 * The general settings of the layout that apply to all components.
 */
export class GeneralLayoutSettingsRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The general settings of the layout that apply to all components.
 */
export class GeneralLayoutSettingsRefMut extends GeneralLayoutSettingsRef {
}

/**
 * The general settings of the layout that apply to all components.
 */
export class GeneralLayoutSettings extends GeneralLayoutSettingsRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: GeneralLayoutSettings) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.GeneralLayoutSettings_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a default general layout settings configuration.
     */
    static default(): GeneralLayoutSettings {
        const result = new GeneralLayoutSettings(instance().exports.GeneralLayoutSettings_default());
        return result;
    }
}

/**
 * The Graph Component visualizes how far the current attempt has been ahead or
 * behind the chosen comparison throughout the whole attempt. All the
 * individual deltas are shown as points in a graph.
 */
export class GraphComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = instance().exports.GraphComponent_state_as_json(this.ptr, timer.ptr, layoutSettings.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer and layout settings
     * provided.
     */
    state(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): GraphComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = new GraphComponentState(instance().exports.GraphComponent_state(this.ptr, timer.ptr, layoutSettings.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Graph Component visualizes how far the current attempt has been ahead or
 * behind the chosen comparison throughout the whole attempt. All the
 * individual deltas are shown as points in a graph.
 */
export class GraphComponentRefMut extends GraphComponentRef {
}

/**
 * The Graph Component visualizes how far the current attempt has been ahead or
 * behind the chosen comparison throughout the whole attempt. All the
 * individual deltas are shown as points in a graph.
 */
export class GraphComponent extends GraphComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: GraphComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.GraphComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Graph Component.
     */
    static new(): GraphComponent {
        const result = new GraphComponent(instance().exports.GraphComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.GraphComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object describes the information to visualize for this component.
 * All the coordinates are in the range 0..1.
 */
export class GraphComponentStateRef {
    ptr: number;
    /**
     * Returns the amount of points to visualize. Connect all of them to visualize
     * the graph. If the live delta is active, the last point is to be interpreted
     * as a preview of the next split that is about to happen. Use the partial fill
     * color to visualize the region beneath that graph segment.
     */
    pointsLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_points_len(this.ptr);
        return result;
    }
    /**
     * Returns the x coordinate of the point specified. You may not provide an out
     * of bounds index.
     */
    pointX(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_point_x(this.ptr, index);
        return result;
    }
    /**
     * Returns the y coordinate of the point specified. You may not provide an out
     * of bounds index.
     */
    pointY(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_point_y(this.ptr, index);
        return result;
    }
    /**
     * Describes whether the segment the point specified is visualizing achieved a
     * new best segment time. Use the best segment color for it, in that case. You
     * may not provide an out of bounds index.
     */
    pointIsBestSegment(index: number): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_point_is_best_segment(this.ptr, index) != 0;
        return result;
    }
    /**
     * Describes how many horizontal grid lines to visualize.
     */
    horizontalGridLinesLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_horizontal_grid_lines_len(this.ptr);
        return result;
    }
    /**
     * Accesses the y coordinate of the horizontal grid line specified. You may not
     * provide an out of bounds index.
     */
    horizontalGridLine(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_horizontal_grid_line(this.ptr, index);
        return result;
    }
    /**
     * Describes how many vertical grid lines to visualize.
     */
    verticalGridLinesLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_vertical_grid_lines_len(this.ptr);
        return result;
    }
    /**
     * Accesses the x coordinate of the vertical grid line specified. You may not
     * provide an out of bounds index.
     */
    verticalGridLine(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_vertical_grid_line(this.ptr, index);
        return result;
    }
    /**
     * The y coordinate that separates the region that shows the times that are
     * ahead of the comparison and those that are behind.
     */
    middle(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_middle(this.ptr);
        return result;
    }
    /**
     * If the live delta is active, the last point is to be interpreted as a
     * preview of the next split that is about to happen. Use the partial fill
     * color to visualize the region beneath that graph segment.
     */
    isLiveDeltaActive(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_is_live_delta_active(this.ptr) != 0;
        return result;
    }
    /**
     * Describes whether the graph is flipped vertically. For visualizing the
     * graph, this usually doesn't need to be interpreted, as this information is
     * entirely encoded into the other variables.
     */
    isFlipped(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.GraphComponentState_is_flipped(this.ptr) != 0;
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for this component.
 * All the coordinates are in the range 0..1.
 */
export class GraphComponentStateRefMut extends GraphComponentStateRef {
}

/**
 * The state object describes the information to visualize for this component.
 * All the coordinates are in the range 0..1.
 */
export class GraphComponentState extends GraphComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: GraphComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.GraphComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The configuration to use for a Hotkey System. It describes with keys to use
 * as hotkeys for the different actions.
 */
export class HotkeyConfigRef {
    ptr: number;
    /**
     * Encodes generic description of the settings available for the hotkey
     * configuration and their current values as JSON.
     */
    settingsDescriptionAsJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.HotkeyConfig_settings_description_as_json(this.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Encodes the hotkey configuration as JSON.
     */
    asJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.HotkeyConfig_as_json(this.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The configuration to use for a Hotkey System. It describes with keys to use
 * as hotkeys for the different actions.
 */
export class HotkeyConfigRefMut extends HotkeyConfigRef {
    /**
     * Sets a setting's value by its index to the given value.
     * 
     * false is returned if a hotkey is already in use by a different action.
     * 
     * This panics if the type of the value to be set is not compatible with the
     * type of the setting's value. A panic can also occur if the index of the
     * setting provided is out of bounds.
     */
    setValue(index: number, value: SettingValue): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (value.ptr == 0) {
            throw "value is disposed";
        }
        const result = instance().exports.HotkeyConfig_set_value(this.ptr, index, value.ptr) != 0;
        value.ptr = 0;
        return result;
    }
}

/**
 * The configuration to use for a Hotkey System. It describes with keys to use
 * as hotkeys for the different actions.
 */
export class HotkeyConfig extends HotkeyConfigRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: HotkeyConfig) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.HotkeyConfig_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Parses a hotkey configuration from the given JSON description. null is
     * returned if it couldn't be parsed.
     */
    static parseJson(settings: any): HotkeyConfig | null {
        const settings_allocated = allocString(JSON.stringify(settings));
        const result = new HotkeyConfig(instance().exports.HotkeyConfig_parse_json(settings_allocated.ptr));
        dealloc(settings_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

/**
 * With a Hotkey System the runner can use hotkeys on their keyboard to control
 * the Timer. The hotkeys are global, so the application doesn't need to be in
 * focus. The behavior of the hotkeys depends on the platform and is stubbed
 * out on platforms that don't support hotkeys. You can turn off a Hotkey
 * System temporarily. By default the Hotkey System is activated.
 */
export class HotkeySystemRef {
    ptr: number;
    /**
     * Deactivates the Hotkey System. No hotkeys will go through until it gets
     * activated again. If it's already deactivated, nothing happens.
     */
    deactivate() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.HotkeySystem_deactivate(this.ptr);
    }
    /**
     * Activates a previously deactivated Hotkey System. If it's already
     * active, nothing happens.
     */
    activate() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.HotkeySystem_activate(this.ptr);
    }
    /**
     * Returns the hotkey configuration currently in use by the Hotkey System.
     */
    config(): HotkeyConfig {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new HotkeyConfig(instance().exports.HotkeySystem_config(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * With a Hotkey System the runner can use hotkeys on their keyboard to control
 * the Timer. The hotkeys are global, so the application doesn't need to be in
 * focus. The behavior of the hotkeys depends on the platform and is stubbed
 * out on platforms that don't support hotkeys. You can turn off a Hotkey
 * System temporarily. By default the Hotkey System is activated.
 */
export class HotkeySystemRefMut extends HotkeySystemRef {
    /**
     * Applies a new hotkey configuration to the Hotkey System. Each hotkey is
     * changed to the one specified in the configuration. This operation may fail
     * if you provide a hotkey configuration where a hotkey is used for multiple
     * operations. Returns false if the operation failed.
     */
    setConfig(config: HotkeyConfig): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (config.ptr == 0) {
            throw "config is disposed";
        }
        const result = instance().exports.HotkeySystem_set_config(this.ptr, config.ptr) != 0;
        config.ptr = 0;
        return result;
    }
}

/**
 * With a Hotkey System the runner can use hotkeys on their keyboard to control
 * the Timer. The hotkeys are global, so the application doesn't need to be in
 * focus. The behavior of the hotkeys depends on the platform and is stubbed
 * out on platforms that don't support hotkeys. You can turn off a Hotkey
 * System temporarily. By default the Hotkey System is activated.
 */
export class HotkeySystem extends HotkeySystemRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: HotkeySystem) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.HotkeySystem_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Hotkey System for a Timer with the default hotkeys.
     */
    static new(sharedTimer: SharedTimer): HotkeySystem | null {
        if (sharedTimer.ptr == 0) {
            throw "sharedTimer is disposed";
        }
        const result = new HotkeySystem(instance().exports.HotkeySystem_new(sharedTimer.ptr));
        sharedTimer.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new Hotkey System for a Timer with a custom configuration for the
     * hotkeys.
     */
    static withConfig(sharedTimer: SharedTimer, config: HotkeyConfig): HotkeySystem | null {
        if (sharedTimer.ptr == 0) {
            throw "sharedTimer is disposed";
        }
        if (config.ptr == 0) {
            throw "config is disposed";
        }
        const result = new HotkeySystem(instance().exports.HotkeySystem_with_config(sharedTimer.ptr, config.ptr));
        sharedTimer.ptr = 0;
        config.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

/**
 * The state object describes the information to visualize for a key value based component.
 */
export class KeyValueComponentStateRef {
    ptr: number;
    /**
     * The key to visualize.
     */
    key(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.KeyValueComponentState_key(this.ptr);
        return decodeString(result);
    }
    /**
     * The value to visualize.
     */
    value(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.KeyValueComponentState_value(this.ptr);
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for a key value based component.
 */
export class KeyValueComponentStateRefMut extends KeyValueComponentStateRef {
}

/**
 * The state object describes the information to visualize for a key value based component.
 */
export class KeyValueComponentState extends KeyValueComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: KeyValueComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.KeyValueComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Layout allows you to combine multiple components together to visualize a
 * variety of information the runner is interested in.
 */
export class LayoutRef {
    ptr: number;
    /**
     * Clones the layout.
     */
    clone(): Layout {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Layout(instance().exports.Layout_clone(this.ptr));
        return result;
    }
    /**
     * Encodes the settings of the layout as JSON.
     */
    settingsAsJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Layout_settings_as_json(this.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Layout allows you to combine multiple components together to visualize a
 * variety of information the runner is interested in.
 */
export class LayoutRefMut extends LayoutRef {
    /**
     * Calculates the layout's state based on the timer provided and encodes it as
     * JSON. You can use this to visualize all of the components of a layout.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.Layout_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Adds a new component to the end of the layout.
     */
    push(component: Component) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (component.ptr == 0) {
            throw "component is disposed";
        }
        instance().exports.Layout_push(this.ptr, component.ptr);
        component.ptr = 0;
    }
    /**
     * Scrolls up all the components in the layout that can be scrolled up.
     */
    scrollUp() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Layout_scroll_up(this.ptr);
    }
    /**
     * Scrolls down all the components in the layout that can be scrolled down.
     */
    scrollDown() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Layout_scroll_down(this.ptr);
    }
    /**
     * Remounts all the components as if they were freshly initialized. Some
     * components may only provide some information whenever it changes or when
     * their state is first queried. Remounting returns this information again,
     * whenever the layout's state is queried the next time.
     */
    remount() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Layout_remount(this.ptr);
    }
}

/**
 * A Layout allows you to combine multiple components together to visualize a
 * variety of information the runner is interested in.
 */
export class Layout extends LayoutRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Layout) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.Layout_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new empty layout with no components.
     */
    static new(): Layout {
        const result = new Layout(instance().exports.Layout_new());
        return result;
    }
    /**
     * Creates a new default layout that contains a default set of components
     * in order to provide a good default layout for runners. Which components
     * are provided by this and how they are configured may change in the
     * future.
     */
    static defaultLayout(): Layout {
        const result = new Layout(instance().exports.Layout_default_layout());
        return result;
    }
    /**
     * Parses a layout from the given JSON description of its settings. null is
     * returned if it couldn't be parsed.
     */
    static parseJson(settings: any): Layout | null {
        const settings_allocated = allocString(JSON.stringify(settings));
        const result = new Layout(instance().exports.Layout_parse_json(settings_allocated.ptr));
        dealloc(settings_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Parses a layout saved by the original LiveSplit. This is lossy, as not
     * everything can be converted completely. null is returned if it couldn't be
     * parsed at all.
     */
    static parseOriginalLivesplit(data: number, length: number): Layout | null {
        const result = new Layout(instance().exports.Layout_parse_original_livesplit(data, length));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    static parseOriginalLivesplitArray(data: Int8Array): Layout | null {
        const slice = allocInt8Array(data);
        const result = Layout.parseOriginalLivesplit(slice.ptr, slice.len);
        dealloc(slice);
        return result;
    }
    static parseOriginalLivesplitString(text: string): Layout | null {
        const slice = allocString(text);
        const result = Layout.parseOriginalLivesplit(slice.ptr, slice.len);
        dealloc(slice);
        return result;
    }
}

/**
 * The Layout Editor allows modifying Layouts while ensuring all the different
 * invariants of the Layout objects are upheld no matter what kind of
 * operations are being applied. It provides the current state of the editor as
 * state objects that can be visualized by any kind of User Interface.
 */
export class LayoutEditorRef {
    ptr: number;
    /**
     * Encodes the Layout Editor's state as JSON in order to visualize it.
     */
    stateAsJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.LayoutEditor_state_as_json(this.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Layout Editor allows modifying Layouts while ensuring all the different
 * invariants of the Layout objects are upheld no matter what kind of
 * operations are being applied. It provides the current state of the editor as
 * state objects that can be visualized by any kind of User Interface.
 */
export class LayoutEditorRefMut extends LayoutEditorRef {
    /**
     * Encodes the layout's state as JSON based on the timer provided. You can use
     * this to visualize all of the components of a layout, while it is still being
     * edited by the Layout Editor.
     */
    layoutStateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.LayoutEditor_layout_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Selects the component with the given index in order to modify its
     * settings. Only a single component is selected at any given time. You may
     * not provide an invalid index.
     */
    select(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.LayoutEditor_select(this.ptr, index);
    }
    /**
     * Adds the component provided to the end of the layout. The newly added
     * component becomes the selected component.
     */
    addComponent(component: Component) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (component.ptr == 0) {
            throw "component is disposed";
        }
        instance().exports.LayoutEditor_add_component(this.ptr, component.ptr);
        component.ptr = 0;
    }
    /**
     * Removes the currently selected component, unless there's only one
     * component in the layout. The next component becomes the selected
     * component. If there's none, the previous component becomes the selected
     * component instead.
     */
    removeComponent() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.LayoutEditor_remove_component(this.ptr);
    }
    /**
     * Moves the selected component up, unless the first component is selected.
     */
    moveComponentUp() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.LayoutEditor_move_component_up(this.ptr);
    }
    /**
     * Moves the selected component down, unless the last component is
     * selected.
     */
    moveComponentDown() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.LayoutEditor_move_component_down(this.ptr);
    }
    /**
     * Moves the selected component to the index provided. You may not provide
     * an invalid index.
     */
    moveComponent(dstIndex: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.LayoutEditor_move_component(this.ptr, dstIndex);
    }
    /**
     * Duplicates the currently selected component. The copy gets placed right
     * after the selected component and becomes the newly selected component.
     */
    duplicateComponent() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.LayoutEditor_duplicate_component(this.ptr);
    }
    /**
     * Sets a setting's value of the selected component by its setting index
     * to the given value.
     * 
     * This panics if the type of the value to be set is not compatible with
     * the type of the setting's value. A panic can also occur if the index of
     * the setting provided is out of bounds.
     */
    setComponentSettingsValue(index: number, value: SettingValue) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (value.ptr == 0) {
            throw "value is disposed";
        }
        instance().exports.LayoutEditor_set_component_settings_value(this.ptr, index, value.ptr);
        value.ptr = 0;
    }
    /**
     * Sets a setting's value of the general settings by its setting index to
     * the given value.
     * 
     * This panics if the type of the value to be set is not compatible with
     * the type of the setting's value. A panic can also occur if the index of
     * the setting provided is out of bounds.
     */
    setGeneralSettingsValue(index: number, value: SettingValue) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (value.ptr == 0) {
            throw "value is disposed";
        }
        instance().exports.LayoutEditor_set_general_settings_value(this.ptr, index, value.ptr);
        value.ptr = 0;
    }
}

/**
 * The Layout Editor allows modifying Layouts while ensuring all the different
 * invariants of the Layout objects are upheld no matter what kind of
 * operations are being applied. It provides the current state of the editor as
 * state objects that can be visualized by any kind of User Interface.
 */
export class LayoutEditor extends LayoutEditorRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: LayoutEditor) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Layout Editor that modifies the Layout provided. Creation of
     * the Layout Editor fails when a Layout with no components is provided. In
     * that case null is returned instead.
     */
    static new(layout: Layout): LayoutEditor | null {
        if (layout.ptr == 0) {
            throw "layout is disposed";
        }
        const result = new LayoutEditor(instance().exports.LayoutEditor_new(layout.ptr));
        layout.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Closes the Layout Editor and gives back access to the modified Layout. In
     * case you want to implement a Cancel Button, just dispose the Layout object
     * you get here.
     */
    close(): Layout {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Layout(instance().exports.LayoutEditor_close(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * A run parsed by the Composite Parser. This contains the Run itself and
 * information about which parser parsed it.
 */
export class ParseRunResultRef {
    ptr: number;
    /**
     * Returns true if the Run got parsed successfully. false is returned otherwise.
     */
    parsedSuccessfully(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.ParseRunResult_parsed_successfully(this.ptr) != 0;
        return result;
    }
    /**
     * Accesses the name of the Parser that parsed the Run. You may not call this
     * if the Run wasn't parsed successfully.
     */
    timerKind(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.ParseRunResult_timer_kind(this.ptr);
        return decodeString(result);
    }
    /**
     * Checks whether the Parser parsed a generic timer. Since a generic timer can
     * have any name, it may clash with the specific timer formats that
     * livesplit-core supports. With this function you can determine if a generic
     * timer format was parsed, instead of one of the more specific timer formats.
     */
    isGenericTimer(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.ParseRunResult_is_generic_timer(this.ptr) != 0;
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A run parsed by the Composite Parser. This contains the Run itself and
 * information about which parser parsed it.
 */
export class ParseRunResultRefMut extends ParseRunResultRef {
}

/**
 * A run parsed by the Composite Parser. This contains the Run itself and
 * information about which parser parsed it.
 */
export class ParseRunResult extends ParseRunResultRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: ParseRunResult) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.ParseRunResult_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Moves the actual Run object out of the Result. You may not call this if the
     * Run wasn't parsed successfully.
     */
    unwrap(): Run {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Run(instance().exports.ParseRunResult_unwrap(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The PB Chance Component is a component that shows how likely it is to beat
 * the Personal Best. If there is no active attempt it shows the general chance
 * of beating the Personal Best. During an attempt it actively changes based on
 * how well the attempt is going.
 */
export class PbChanceComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.PbChanceComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.PbChanceComponent_state(this.ptr, timer.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The PB Chance Component is a component that shows how likely it is to beat
 * the Personal Best. If there is no active attempt it shows the general chance
 * of beating the Personal Best. During an attempt it actively changes based on
 * how well the attempt is going.
 */
export class PbChanceComponentRefMut extends PbChanceComponentRef {
}

/**
 * The PB Chance Component is a component that shows how likely it is to beat
 * the Personal Best. If there is no active attempt it shows the general chance
 * of beating the Personal Best. During an attempt it actively changes based on
 * how well the attempt is going.
 */
export class PbChanceComponent extends PbChanceComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: PbChanceComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.PbChanceComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new PB Chance Component.
     */
    static new(): PbChanceComponent {
        const result = new PbChanceComponent(instance().exports.PbChanceComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.PbChanceComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Possible Time Save Component is a component that shows how much time the
 * chosen comparison could've saved for the current segment, based on the Best
 * Segments. This component also allows showing the Total Possible Time Save
 * for the remainder of the current attempt.
 */
export class PossibleTimeSaveComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.PossibleTimeSaveComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.PossibleTimeSaveComponent_state(this.ptr, timer.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Possible Time Save Component is a component that shows how much time the
 * chosen comparison could've saved for the current segment, based on the Best
 * Segments. This component also allows showing the Total Possible Time Save
 * for the remainder of the current attempt.
 */
export class PossibleTimeSaveComponentRefMut extends PossibleTimeSaveComponentRef {
}

/**
 * The Possible Time Save Component is a component that shows how much time the
 * chosen comparison could've saved for the current segment, based on the Best
 * Segments. This component also allows showing the Total Possible Time Save
 * for the remainder of the current attempt.
 */
export class PossibleTimeSaveComponent extends PossibleTimeSaveComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: PossibleTimeSaveComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.PossibleTimeSaveComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Possible Time Save Component.
     */
    static new(): PossibleTimeSaveComponent {
        const result = new PossibleTimeSaveComponent(instance().exports.PossibleTimeSaveComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.PossibleTimeSaveComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * Describes a potential clean up that could be applied. You can query a
 * message describing the details of this potential clean up. A potential clean
 * up can then be turned into an actual clean up in order to apply it to the
 * Run.
 */
export class PotentialCleanUpRef {
    ptr: number;
    /**
     * Accesses the message describing the potential clean up that can be applied
     * to a Run.
     */
    message(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.PotentialCleanUp_message(this.ptr);
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * Describes a potential clean up that could be applied. You can query a
 * message describing the details of this potential clean up. A potential clean
 * up can then be turned into an actual clean up in order to apply it to the
 * Run.
 */
export class PotentialCleanUpRefMut extends PotentialCleanUpRef {
}

/**
 * Describes a potential clean up that could be applied. You can query a
 * message describing the details of this potential clean up. A potential clean
 * up can then be turned into an actual clean up in order to apply it to the
 * Run.
 */
export class PotentialCleanUp extends PotentialCleanUpRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: PotentialCleanUp) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.PotentialCleanUp_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The Previous Segment Component is a component that shows how much time was
 * saved or lost during the previous segment based on the chosen comparison.
 * Additionally, the potential time save for the previous segment can be
 * displayed. This component switches to a `Live Segment` view that shows
 * active time loss whenever the runner is losing time on the current segment.
 */
export class PreviousSegmentComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = instance().exports.PreviousSegmentComponent_state_as_json(this.ptr, timer.ptr, layoutSettings.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer and the layout
     * settings provided.
     */
    state(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.PreviousSegmentComponent_state(this.ptr, timer.ptr, layoutSettings.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Previous Segment Component is a component that shows how much time was
 * saved or lost during the previous segment based on the chosen comparison.
 * Additionally, the potential time save for the previous segment can be
 * displayed. This component switches to a `Live Segment` view that shows
 * active time loss whenever the runner is losing time on the current segment.
 */
export class PreviousSegmentComponentRefMut extends PreviousSegmentComponentRef {
}

/**
 * The Previous Segment Component is a component that shows how much time was
 * saved or lost during the previous segment based on the chosen comparison.
 * Additionally, the potential time save for the previous segment can be
 * displayed. This component switches to a `Live Segment` view that shows
 * active time loss whenever the runner is losing time on the current segment.
 */
export class PreviousSegmentComponent extends PreviousSegmentComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: PreviousSegmentComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.PreviousSegmentComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Previous Segment Component.
     */
    static new(): PreviousSegmentComponent {
        const result = new PreviousSegmentComponent(instance().exports.PreviousSegmentComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.PreviousSegmentComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * A Run stores the split times for a specific game and category of a runner.
 */
export class RunRef {
    ptr: number;
    /**
     * Clones the Run object.
     */
    clone(): Run {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Run(instance().exports.Run_clone(this.ptr));
        return result;
    }
    /**
     * Accesses the name of the game this Run is for.
     */
    gameName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_game_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Accesses the game icon's data. If there is no game icon, this returns an
     * empty buffer.
     */
    gameIconPtr(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_game_icon_ptr(this.ptr);
        return result;
    }
    /**
     * Accesses the amount of bytes the game icon's data takes up.
     */
    gameIconLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_game_icon_len(this.ptr);
        return result;
    }
    /**
     * Accesses the name of the category this Run is for.
     */
    categoryName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_category_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns a file name (without the extension) suitable for this Run that
     * is built the following way:
     * 
     * Game Name - Category Name
     * 
     * If either is empty, the dash is omitted. Special characters that cause
     * problems in file names are also omitted. If an extended category name is
     * used, the variables of the category are appended in a parenthesis.
     */
    extendedFileName(useExtendedCategoryName: boolean): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_extended_file_name(this.ptr, useExtendedCategoryName ? 1 : 0);
        return decodeString(result);
    }
    /**
     * Returns a name suitable for this Run that is built the following way:
     * 
     * Game Name - Category Name
     * 
     * If either is empty, the dash is omitted. If an extended category name is
     * used, the variables of the category are appended in a parenthesis.
     */
    extendedName(useExtendedCategoryName: boolean): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_extended_name(this.ptr, useExtendedCategoryName ? 1 : 0);
        return decodeString(result);
    }
    /**
     * Returns an extended category name that possibly includes the region,
     * platform and variables, depending on the arguments provided. An extended
     * category name may look like this:
     * 
     * Any% (No Tuner, JPN, Wii Emulator)
     */
    extendedCategoryName(showRegion: boolean, showPlatform: boolean, showVariables: boolean): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_extended_category_name(this.ptr, showRegion ? 1 : 0, showPlatform ? 1 : 0, showVariables ? 1 : 0);
        return decodeString(result);
    }
    /**
     * Returns the amount of runs that have been attempted with these splits.
     */
    attemptCount(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_attempt_count(this.ptr);
        return result;
    }
    /**
     * Accesses additional metadata of this Run, like the platform and region
     * of the game.
     */
    metadata(): RunMetadataRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new RunMetadataRef(instance().exports.Run_metadata(this.ptr));
        return result;
    }
    /**
     * Accesses the time an attempt of this Run should start at.
     */
    offset(): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpanRef(instance().exports.Run_offset(this.ptr));
        return result;
    }
    /**
     * Returns the amount of segments stored in this Run.
     */
    len(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_len(this.ptr);
        return result;
    }
    /**
     * Returns whether the Run has been modified and should be saved so that the
     * changes don't get lost.
     */
    hasBeenModified(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_has_been_modified(this.ptr) != 0;
        return result;
    }
    /**
     * Accesses a certain segment of this Run. You may not provide an out of bounds
     * index.
     */
    segment(index: number): SegmentRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SegmentRef(instance().exports.Run_segment(this.ptr, index));
        return result;
    }
    /**
     * Returns the amount attempt history elements are stored in this Run.
     */
    attemptHistoryLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_attempt_history_len(this.ptr);
        return result;
    }
    /**
     * Accesses the an attempt history element by its index. This does not store
     * the actual segment times, just the overall attempt information. Information
     * about the individual segments is stored within each segment. You may not
     * provide an out of bounds index.
     */
    attemptHistoryIndex(index: number): AttemptRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new AttemptRef(instance().exports.Run_attempt_history_index(this.ptr, index));
        return result;
    }
    /**
     * Saves a Run as a LiveSplit splits file (*.lss). If the run is actively in
     * use by a timer, use the appropriate method on the timer instead, in order to
     * properly save the current attempt as well.
     */
    saveAsLss(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_save_as_lss(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns the amount of custom comparisons stored in this Run.
     */
    customComparisonsLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_custom_comparisons_len(this.ptr);
        return result;
    }
    /**
     * Accesses a custom comparison stored in this Run by its index. This includes
     * `Personal Best` but excludes all the other Comparison Generators. You may
     * not provide an out of bounds index.
     */
    customComparison(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_custom_comparison(this.ptr, index);
        return decodeString(result);
    }
    /**
     * Accesses the Auto Splitter Settings that are encoded as XML.
     */
    autoSplitterSettings(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Run_auto_splitter_settings(this.ptr);
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Run stores the split times for a specific game and category of a runner.
 */
export class RunRefMut extends RunRef {
    /**
     * Pushes the segment provided to the end of the list of segments of this Run.
     */
    pushSegment(segment: Segment) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (segment.ptr == 0) {
            throw "segment is disposed";
        }
        instance().exports.Run_push_segment(this.ptr, segment.ptr);
        segment.ptr = 0;
    }
    /**
     * Sets the name of the game this Run is for.
     */
    setGameName(game: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const game_allocated = allocString(game);
        instance().exports.Run_set_game_name(this.ptr, game_allocated.ptr);
        dealloc(game_allocated);
    }
    /**
     * Sets the name of the category this Run is for.
     */
    setCategoryName(category: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const category_allocated = allocString(category);
        instance().exports.Run_set_category_name(this.ptr, category_allocated.ptr);
        dealloc(category_allocated);
    }
    /**
     * Marks the Run as modified, so that it is known that there are changes
     * that should be saved.
     */
    markAsModified() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Run_mark_as_modified(this.ptr);
    }
}

/**
 * A Run stores the split times for a specific game and category of a runner.
 */
export class Run extends RunRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Run) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.Run_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Run object with no segments.
     */
    static new(): Run {
        const result = new Run(instance().exports.Run_new());
        return result;
    }
    /**
     * Attempts to parse a splits file from an array by invoking the corresponding
     * parser for the file format detected. A path to the splits file can be
     * provided, which helps saving the splits file again later. Additionally you
     * need to specify if additional files, like external images are allowed to be
     * loaded. If you are using livesplit-core in a server-like environment, set
     * this to false. Only client-side applications should set this to true.
     */
    static parse(data: number, length: number, path: string, loadFiles: boolean): ParseRunResult {
        const path_allocated = allocString(path);
        const result = new ParseRunResult(instance().exports.Run_parse(data, length, path_allocated.ptr, loadFiles ? 1 : 0));
        dealloc(path_allocated);
        return result;
    }
    /**
     * Attempts to parse a splits file from a file by invoking the corresponding
     * parser for the file format detected. A path to the splits file can be
     * provided, which helps saving the splits file again later. Additionally you
     * need to specify if additional files, like external images are allowed to be
     * loaded. If you are using livesplit-core in a server-like environment, set
     * this to false. Only client-side applications should set this to true. On
     * Unix you pass a file descriptor to this function. On Windows you pass a file
     * handle to this function. The file descriptor / handle does not get closed.
     */
    static parseFileHandle(handle: number, path: string, loadFiles: boolean): ParseRunResult {
        const path_allocated = allocString(path);
        const result = new ParseRunResult(instance().exports.Run_parse_file_handle(handle, path_allocated.ptr, loadFiles ? 1 : 0));
        dealloc(path_allocated);
        return result;
    }
    static parseArray(data: Int8Array, path: string, loadFiles: boolean): ParseRunResult {
        const slice = allocInt8Array(data);
        const result = Run.parse(slice.ptr, slice.len, path, loadFiles);
        dealloc(slice);
        return result;
    }
    static parseString(text: string, path: string, loadFiles: boolean): ParseRunResult {
        const slice = allocString(text);
        const result = Run.parse(slice.ptr, slice.len, path, loadFiles);
        dealloc(slice);
        return result;
    }
}

/**
 * The Run Editor allows modifying Runs while ensuring that all the different
 * invariants of the Run objects are upheld no matter what kind of operations
 * are being applied to the Run. It provides the current state of the editor as
 * state objects that can be visualized by any kind of User Interface.
 */
export class RunEditorRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Run Editor allows modifying Runs while ensuring that all the different
 * invariants of the Run objects are upheld no matter what kind of operations
 * are being applied to the Run. It provides the current state of the editor as
 * state objects that can be visualized by any kind of User Interface.
 */
export class RunEditorRefMut extends RunEditorRef {
    /**
     * Calculates the Run Editor's state and encodes it as
     * JSON in order to visualize it.
     */
    stateAsJson(): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunEditor_state_as_json(this.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Selects a different timing method for being modified.
     */
    selectTimingMethod(method: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_select_timing_method(this.ptr, method);
    }
    /**
     * Unselects the segment with the given index. If it's not selected or the
     * index is out of bounds, nothing happens. The segment is not unselected,
     * when it is the only segment that is selected. If the active segment is
     * unselected, the most recently selected segment remaining becomes the
     * active segment.
     */
    unselect(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_unselect(this.ptr, index);
    }
    /**
     * In addition to the segments that are already selected, the segment with
     * the given index is being selected. The segment chosen also becomes the
     * active segment.
     * 
     * This panics if the index of the segment provided is out of bounds.
     */
    selectAdditionally(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_select_additionally(this.ptr, index);
    }
    /**
     * Selects the segment with the given index. All other segments are
     * unselected. The segment chosen also becomes the active segment.
     * 
     * This panics if the index of the segment provided is out of bounds.
     */
    selectOnly(index: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_select_only(this.ptr, index);
    }
    /**
     * Sets the name of the game.
     */
    setGameName(game: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const game_allocated = allocString(game);
        instance().exports.RunEditor_set_game_name(this.ptr, game_allocated.ptr);
        dealloc(game_allocated);
    }
    /**
     * Sets the name of the category.
     */
    setCategoryName(category: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const category_allocated = allocString(category);
        instance().exports.RunEditor_set_category_name(this.ptr, category_allocated.ptr);
        dealloc(category_allocated);
    }
    /**
     * Parses and sets the timer offset from the string provided. The timer
     * offset specifies the time, the timer starts at when starting a new
     * attempt.
     */
    parseAndSetOffset(offset: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const offset_allocated = allocString(offset);
        const result = instance().exports.RunEditor_parse_and_set_offset(this.ptr, offset_allocated.ptr) != 0;
        dealloc(offset_allocated);
        return result;
    }
    /**
     * Parses and sets the attempt count from the string provided. Changing
     * this has no affect on the attempt history or the segment history. This
     * number is mostly just a visual number for the runner.
     */
    parseAndSetAttemptCount(attempts: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const attempts_allocated = allocString(attempts);
        const result = instance().exports.RunEditor_parse_and_set_attempt_count(this.ptr, attempts_allocated.ptr) != 0;
        dealloc(attempts_allocated);
        return result;
    }
    /**
     * Sets the game's icon.
     */
    setGameIcon(data: number, length: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_set_game_icon(this.ptr, data, length);
    }
    /**
     * Removes the game's icon.
     */
    removeGameIcon() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_remove_game_icon(this.ptr);
    }
    /**
     * Sets the speedrun.com Run ID of the run. You need to ensure that the
     * record on speedrun.com matches up with the Personal Best of this run.
     * This may be empty if there's no association.
     */
    setRunId(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        instance().exports.RunEditor_set_run_id(this.ptr, name_allocated.ptr);
        dealloc(name_allocated);
    }
    /**
     * Sets the name of the region this game is from. This may be empty if it's
     * not specified.
     */
    setRegionName(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        instance().exports.RunEditor_set_region_name(this.ptr, name_allocated.ptr);
        dealloc(name_allocated);
    }
    /**
     * Sets the name of the platform this game is run on. This may be empty if
     * it's not specified.
     */
    setPlatformName(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        instance().exports.RunEditor_set_platform_name(this.ptr, name_allocated.ptr);
        dealloc(name_allocated);
    }
    /**
     * Specifies whether this speedrun is done on an emulator. Keep in mind
     * that false may also mean that this information is simply not known.
     */
    setEmulatorUsage(usesEmulator: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_set_emulator_usage(this.ptr, usesEmulator ? 1 : 0);
    }
    /**
     * Sets the variable with the name specified to the value specified. A
     * variable is an arbitrary key value pair storing additional information
     * about the category. An example of this may be whether Amiibos are used
     * in this category. If the variable doesn't exist yet, it is being
     * inserted.
     */
    setSpeedrunComVariable(name: string, value: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        const value_allocated = allocString(value);
        instance().exports.RunEditor_set_speedrun_com_variable(this.ptr, name_allocated.ptr, value_allocated.ptr);
        dealloc(name_allocated);
        dealloc(value_allocated);
    }
    /**
     * Removes the variable with the name specified.
     */
    removeSpeedrunComVariable(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        instance().exports.RunEditor_remove_speedrun_com_variable(this.ptr, name_allocated.ptr);
        dealloc(name_allocated);
    }
    addCustomVariable(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        instance().exports.RunEditor_add_custom_variable(this.ptr, name_allocated.ptr);
        dealloc(name_allocated);
    }
    setCustomVariable(name: string, value: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        const value_allocated = allocString(value);
        instance().exports.RunEditor_set_custom_variable(this.ptr, name_allocated.ptr, value_allocated.ptr);
        dealloc(name_allocated);
        dealloc(value_allocated);
    }
    /**
     * Resets all the Metadata Information.
     */
    clearMetadata() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_clear_metadata(this.ptr);
    }
    /**
     * Inserts a new empty segment above the active segment and adjusts the
     * Run's history information accordingly. The newly created segment is then
     * the only selected segment and also the active segment.
     */
    insertSegmentAbove() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_insert_segment_above(this.ptr);
    }
    /**
     * Inserts a new empty segment below the active segment and adjusts the
     * Run's history information accordingly. The newly created segment is then
     * the only selected segment and also the active segment.
     */
    insertSegmentBelow() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_insert_segment_below(this.ptr);
    }
    /**
     * Removes all the selected segments, unless all of them are selected. The
     * run's information is automatically adjusted properly. The next
     * not-to-be-removed segment after the active segment becomes the new
     * active segment. If there's none, then the next not-to-be-removed segment
     * before the active segment, becomes the new active segment.
     */
    removeSegments() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_remove_segments(this.ptr);
    }
    /**
     * Moves all the selected segments up, unless the first segment is
     * selected. The run's information is automatically adjusted properly. The
     * active segment stays the active segment.
     */
    moveSegmentsUp() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_move_segments_up(this.ptr);
    }
    /**
     * Moves all the selected segments down, unless the last segment is
     * selected. The run's information is automatically adjusted properly. The
     * active segment stays the active segment.
     */
    moveSegmentsDown() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_move_segments_down(this.ptr);
    }
    /**
     * Sets the icon of the active segment.
     */
    activeSetIcon(data: number, length: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_active_set_icon(this.ptr, data, length);
    }
    /**
     * Removes the icon of the active segment.
     */
    activeRemoveIcon() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_active_remove_icon(this.ptr);
    }
    /**
     * Sets the name of the active segment.
     */
    activeSetName(name: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const name_allocated = allocString(name);
        instance().exports.RunEditor_active_set_name(this.ptr, name_allocated.ptr);
        dealloc(name_allocated);
    }
    /**
     * Parses a split time from a string and sets it for the active segment with
     * the chosen timing method.
     */
    activeParseAndSetSplitTime(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const time_allocated = allocString(time);
        const result = instance().exports.RunEditor_active_parse_and_set_split_time(this.ptr, time_allocated.ptr) != 0;
        dealloc(time_allocated);
        return result;
    }
    /**
     * Parses a segment time from a string and sets it for the active segment with
     * the chosen timing method.
     */
    activeParseAndSetSegmentTime(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const time_allocated = allocString(time);
        const result = instance().exports.RunEditor_active_parse_and_set_segment_time(this.ptr, time_allocated.ptr) != 0;
        dealloc(time_allocated);
        return result;
    }
    /**
     * Parses a best segment time from a string and sets it for the active segment
     * with the chosen timing method.
     */
    activeParseAndSetBestSegmentTime(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const time_allocated = allocString(time);
        const result = instance().exports.RunEditor_active_parse_and_set_best_segment_time(this.ptr, time_allocated.ptr) != 0;
        dealloc(time_allocated);
        return result;
    }
    /**
     * Parses a comparison time for the provided comparison and sets it for the
     * active active segment with the chosen timing method.
     */
    activeParseAndSetComparisonTime(comparison: string, time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const comparison_allocated = allocString(comparison);
        const time_allocated = allocString(time);
        const result = instance().exports.RunEditor_active_parse_and_set_comparison_time(this.ptr, comparison_allocated.ptr, time_allocated.ptr) != 0;
        dealloc(comparison_allocated);
        dealloc(time_allocated);
        return result;
    }
    /**
     * Adds a new custom comparison. It can't be added if it starts with
     * `[Race]` or already exists.
     */
    addComparison(comparison: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const comparison_allocated = allocString(comparison);
        const result = instance().exports.RunEditor_add_comparison(this.ptr, comparison_allocated.ptr) != 0;
        dealloc(comparison_allocated);
        return result;
    }
    /**
     * Imports the Personal Best from the provided run as a comparison. The
     * comparison can't be added if its name starts with `[Race]` or it already
     * exists.
     */
    importComparison(run: RunRef, comparison: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const comparison_allocated = allocString(comparison);
        const result = instance().exports.RunEditor_import_comparison(this.ptr, run.ptr, comparison_allocated.ptr) != 0;
        dealloc(comparison_allocated);
        return result;
    }
    /**
     * Removes the chosen custom comparison. You can't remove a Comparison
     * Generator's Comparison or the Personal Best.
     */
    removeComparison(comparison: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const comparison_allocated = allocString(comparison);
        instance().exports.RunEditor_remove_comparison(this.ptr, comparison_allocated.ptr);
        dealloc(comparison_allocated);
    }
    /**
     * Renames a comparison. The comparison can't be renamed if the new name of
     * the comparison starts with `[Race]` or it already exists.
     */
    renameComparison(oldName: string, newName: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const oldName_allocated = allocString(oldName);
        const newName_allocated = allocString(newName);
        const result = instance().exports.RunEditor_rename_comparison(this.ptr, oldName_allocated.ptr, newName_allocated.ptr) != 0;
        dealloc(oldName_allocated);
        dealloc(newName_allocated);
        return result;
    }
    /**
     * Reorders the custom comparisons by moving the comparison with the source
     * index specified to the destination index specified. Returns false if one
     * of the indices is invalid. The indices are based on the comparison names of
     * the Run Editor's state.
     */
    moveComparison(srcIndex: number, dstIndex: number): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunEditor_move_comparison(this.ptr, srcIndex, dstIndex) != 0;
        return result;
    }
    /**
     * Parses a goal time and generates a custom goal comparison based on the
     * parsed value. The comparison's times are automatically balanced based on the
     * runner's history such that it roughly represents what split times for the
     * goal time would roughly look like. Since it is populated by the runner's
     * history, only goal times within the sum of the best segments and the sum of
     * the worst segments are supported. Everything else is automatically capped by
     * that range. The comparison is only populated for the selected timing method.
     * The other timing method's comparison times are not modified by this, so you
     * can call this again with the other timing method to generate the comparison
     * times for both timing methods.
     */
    parseAndGenerateGoalComparison(time: string): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const time_allocated = allocString(time);
        const result = instance().exports.RunEditor_parse_and_generate_goal_comparison(this.ptr, time_allocated.ptr) != 0;
        dealloc(time_allocated);
        return result;
    }
    /**
     * Clears out the Attempt History and the Segment Histories of all the
     * segments.
     */
    clearHistory() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_clear_history(this.ptr);
    }
    /**
     * Clears out the Attempt History, the Segment Histories, all the times,
     * sets the Attempt Count to 0 and clears the speedrun.com run id
     * association. All Custom Comparisons other than `Personal Best` are
     * deleted as well.
     */
    clearTimes() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.RunEditor_clear_times(this.ptr);
    }
    /**
     * Creates a Sum of Best Cleaner which allows you to interactively remove
     * potential issues in the segment history that lead to an inaccurate Sum
     * of Best. If you skip a split, whenever you will do the next split, the
     * combined segment time might be faster than the sum of the individual
     * best segments. The Sum of Best Cleaner will point out all of these and
     * allows you to delete them individually if any of them seem wrong.
     */
    cleanSumOfBest(): SumOfBestCleaner {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SumOfBestCleaner(instance().exports.RunEditor_clean_sum_of_best(this.ptr));
        return result;
    }
    setGameIconFromArray(data: Int8Array) {
        const slice = allocInt8Array(data);
        this.setGameIcon(slice.ptr, slice.len);
        dealloc(slice);
    }
    activeSetIconFromArray(data: Int8Array) {
        const slice = allocInt8Array(data);
        this.activeSetIcon(slice.ptr, slice.len);
        dealloc(slice);
    }
}

/**
 * The Run Editor allows modifying Runs while ensuring that all the different
 * invariants of the Run objects are upheld no matter what kind of operations
 * are being applied to the Run. It provides the current state of the editor as
 * state objects that can be visualized by any kind of User Interface.
 */
export class RunEditor extends RunEditorRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: RunEditor) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Run Editor that modifies the Run provided. Creation of the Run
     * Editor fails when a Run with no segments is provided. If a Run object with
     * no segments is provided, the Run Editor creation fails and null is
     * returned.
     */
    static new(run: Run): RunEditor | null {
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const result = new RunEditor(instance().exports.RunEditor_new(run.ptr));
        run.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Closes the Run Editor and gives back access to the modified Run object. In
     * case you want to implement a Cancel Button, just dispose the Run object you
     * get here.
     */
    close(): Run {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Run(instance().exports.RunEditor_close(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Run Metadata stores additional information about a run, like the
 * platform and region of the game. All of this information is optional.
 */
export class RunMetadataRef {
    ptr: number;
    /**
     * Accesses the speedrun.com Run ID of the run. This Run ID specify which
     * Record on speedrun.com this run is associated with. This should be
     * changed once the Personal Best doesn't match up with that record
     * anymore. This may be empty if there's no association.
     */
    runId(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunMetadata_run_id(this.ptr);
        return decodeString(result);
    }
    /**
     * Accesses the name of the platform this game is run on. This may be empty
     * if it's not specified.
     */
    platformName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunMetadata_platform_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns true if this speedrun is done on an emulator. However false
     * may also indicate that this information is simply not known.
     */
    usesEmulator(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunMetadata_uses_emulator(this.ptr) != 0;
        return result;
    }
    /**
     * Accesses the name of the region this game is from. This may be empty if
     * it's not specified.
     */
    regionName(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunMetadata_region_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns an iterator iterating over all the variables and their values
     * that have been specified.
     */
    speedrunComVariables(): RunMetadataSpeedrunComVariablesIter {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new RunMetadataSpeedrunComVariablesIter(instance().exports.RunMetadata_speedrun_com_variables(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Run Metadata stores additional information about a run, like the
 * platform and region of the game. All of this information is optional.
 */
export class RunMetadataRefMut extends RunMetadataRef {
}

/**
 * The Run Metadata stores additional information about a run, like the
 * platform and region of the game. All of this information is optional.
 */
export class RunMetadata extends RunMetadataRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: RunMetadata) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

/**
 * A Run Metadata variable is an arbitrary key value pair storing additional
 * information about the category. An example of this may be whether Amiibos
 * are used in the category.
 */
export class RunMetadataSpeedrunComVariableRef {
    ptr: number;
    /**
     * Accesses the name of this Run Metadata variable.
     */
    name(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunMetadataSpeedrunComVariable_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Accesses the value of this Run Metadata variable.
     */
    value(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.RunMetadataSpeedrunComVariable_value(this.ptr);
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Run Metadata variable is an arbitrary key value pair storing additional
 * information about the category. An example of this may be whether Amiibos
 * are used in the category.
 */
export class RunMetadataSpeedrunComVariableRefMut extends RunMetadataSpeedrunComVariableRef {
}

/**
 * A Run Metadata variable is an arbitrary key value pair storing additional
 * information about the category. An example of this may be whether Amiibos
 * are used in the category.
 */
export class RunMetadataSpeedrunComVariable extends RunMetadataSpeedrunComVariableRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: RunMetadataSpeedrunComVariable) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.RunMetadataSpeedrunComVariable_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * An iterator iterating over all the Run Metadata variables and their values
 * that have been specified.
 */
export class RunMetadataSpeedrunComVariablesIterRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * An iterator iterating over all the Run Metadata variables and their values
 * that have been specified.
 */
export class RunMetadataSpeedrunComVariablesIterRefMut extends RunMetadataSpeedrunComVariablesIterRef {
    /**
     * Accesses the next Run Metadata variable. Returns null if there are no more
     * variables.
     */
    next(): RunMetadataSpeedrunComVariableRef | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new RunMetadataSpeedrunComVariableRef(instance().exports.RunMetadataSpeedrunComVariablesIter_next(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

/**
 * An iterator iterating over all the Run Metadata variables and their values
 * that have been specified.
 */
export class RunMetadataSpeedrunComVariablesIter extends RunMetadataSpeedrunComVariablesIterRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: RunMetadataSpeedrunComVariablesIter) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.RunMetadataSpeedrunComVariablesIter_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Segment describes a point in a speedrun that is suitable for storing a
 * split time. This stores the name of that segment, an icon, the split times
 * of different comparisons, and a history of segment times.
 */
export class SegmentRef {
    ptr: number;
    /**
     * Accesses the name of the segment.
     */
    name(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Segment_name(this.ptr);
        return decodeString(result);
    }
    /**
     * Accesses the segment icon's data. If there is no segment icon, this returns
     * an empty buffer.
     */
    iconPtr(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Segment_icon_ptr(this.ptr);
        return result;
    }
    /**
     * Accesses the amount of bytes the segment icon's data takes up.
     */
    iconLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Segment_icon_len(this.ptr);
        return result;
    }
    /**
     * Accesses the specified comparison's time. If there's none for this
     * comparison, an empty time is being returned (but not stored in the
     * segment).
     */
    comparison(comparison: string): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const comparison_allocated = allocString(comparison);
        const result = new TimeRef(instance().exports.Segment_comparison(this.ptr, comparison_allocated.ptr));
        dealloc(comparison_allocated);
        return result;
    }
    /**
     * Accesses the split time of the Personal Best for this segment. If it
     * doesn't exist, an empty time is returned.
     */
    personalBestSplitTime(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeRef(instance().exports.Segment_personal_best_split_time(this.ptr));
        return result;
    }
    /**
     * Accesses the Best Segment Time.
     */
    bestSegmentTime(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeRef(instance().exports.Segment_best_segment_time(this.ptr));
        return result;
    }
    /**
     * Accesses the Segment History of this segment.
     */
    segmentHistory(): SegmentHistoryRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SegmentHistoryRef(instance().exports.Segment_segment_history(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Segment describes a point in a speedrun that is suitable for storing a
 * split time. This stores the name of that segment, an icon, the split times
 * of different comparisons, and a history of segment times.
 */
export class SegmentRefMut extends SegmentRef {
}

/**
 * A Segment describes a point in a speedrun that is suitable for storing a
 * split time. This stores the name of that segment, an icon, the split times
 * of different comparisons, and a history of segment times.
 */
export class Segment extends SegmentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Segment) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.Segment_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Segment with the name given.
     */
    static new(name: string): Segment {
        const name_allocated = allocString(name);
        const result = new Segment(instance().exports.Segment_new(name_allocated.ptr));
        dealloc(name_allocated);
        return result;
    }
}

/**
 * Stores the segment times achieved for a certain segment. Each segment is
 * tagged with an index. Only segment times with an index larger than 0 are
 * considered times actually achieved by the runner, while the others are
 * artifacts of route changes and similar algorithmic changes.
 */
export class SegmentHistoryRef {
    ptr: number;
    /**
     * Iterates over all the segment times and their indices.
     */
    iter(): SegmentHistoryIter {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SegmentHistoryIter(instance().exports.SegmentHistory_iter(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * Stores the segment times achieved for a certain segment. Each segment is
 * tagged with an index. Only segment times with an index larger than 0 are
 * considered times actually achieved by the runner, while the others are
 * artifacts of route changes and similar algorithmic changes.
 */
export class SegmentHistoryRefMut extends SegmentHistoryRef {
}

/**
 * Stores the segment times achieved for a certain segment. Each segment is
 * tagged with an index. Only segment times with an index larger than 0 are
 * considered times actually achieved by the runner, while the others are
 * artifacts of route changes and similar algorithmic changes.
 */
export class SegmentHistory extends SegmentHistoryRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SegmentHistory) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

/**
 * A segment time achieved for a segment. It is tagged with an index. Only
 * segment times with an index larger than 0 are considered times actually
 * achieved by the runner, while the others are artifacts of route changes and
 * similar algorithmic changes.
 */
export class SegmentHistoryElementRef {
    ptr: number;
    /**
     * Accesses the index of the segment history element.
     */
    index(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SegmentHistoryElement_index(this.ptr);
        return result;
    }
    /**
     * Accesses the segment time of the segment history element.
     */
    time(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeRef(instance().exports.SegmentHistoryElement_time(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A segment time achieved for a segment. It is tagged with an index. Only
 * segment times with an index larger than 0 are considered times actually
 * achieved by the runner, while the others are artifacts of route changes and
 * similar algorithmic changes.
 */
export class SegmentHistoryElementRefMut extends SegmentHistoryElementRef {
}

/**
 * A segment time achieved for a segment. It is tagged with an index. Only
 * segment times with an index larger than 0 are considered times actually
 * achieved by the runner, while the others are artifacts of route changes and
 * similar algorithmic changes.
 */
export class SegmentHistoryElement extends SegmentHistoryElementRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SegmentHistoryElement) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

/**
 * Iterates over all the segment times of a segment and their indices.
 */
export class SegmentHistoryIterRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * Iterates over all the segment times of a segment and their indices.
 */
export class SegmentHistoryIterRefMut extends SegmentHistoryIterRef {
    /**
     * Accesses the next Segment History element. Returns null if there are no
     * more elements.
     */
    next(): SegmentHistoryElementRef | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SegmentHistoryElementRef(instance().exports.SegmentHistoryIter_next(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

/**
 * Iterates over all the segment times of a segment and their indices.
 */
export class SegmentHistoryIter extends SegmentHistoryIterRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SegmentHistoryIter) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SegmentHistoryIter_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The Separator Component is a simple component that only serves to render
 * separators between components.
 */
export class SeparatorComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Separator Component is a simple component that only serves to render
 * separators between components.
 */
export class SeparatorComponentRefMut extends SeparatorComponentRef {
}

/**
 * The Separator Component is a simple component that only serves to render
 * separators between components.
 */
export class SeparatorComponent extends SeparatorComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SeparatorComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SeparatorComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Separator Component.
     */
    static new(): SeparatorComponent {
        const result = new SeparatorComponent(instance().exports.SeparatorComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.SeparatorComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * Describes a setting's value. Such a value can be of a variety of different
 * types.
 */
export class SettingValueRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * Describes a setting's value. Such a value can be of a variety of different
 * types.
 */
export class SettingValueRefMut extends SettingValueRef {
}

/**
 * Describes a setting's value. Such a value can be of a variety of different
 * types.
 */
export class SettingValue extends SettingValueRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SettingValue) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SettingValue_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new setting value from a boolean value.
     */
    static fromBool(value: boolean): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_bool(value ? 1 : 0));
        return result;
    }
    /**
     * Creates a new setting value from an unsigned integer.
     */
    static fromUint(value: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_uint(value));
        return result;
    }
    /**
     * Creates a new setting value from a signed integer.
     */
    static fromInt(value: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_int(value));
        return result;
    }
    /**
     * Creates a new setting value from a string.
     */
    static fromString(value: string): SettingValue {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_string(value_allocated.ptr));
        dealloc(value_allocated);
        return result;
    }
    /**
     * Creates a new setting value from a string that has the type `optional string`.
     */
    static fromOptionalString(value: string): SettingValue {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_optional_string(value_allocated.ptr));
        dealloc(value_allocated);
        return result;
    }
    /**
     * Creates a new empty setting value that has the type `optional string`.
     */
    static fromOptionalEmptyString(): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_optional_empty_string());
        return result;
    }
    /**
     * Creates a new setting value from a floating point number.
     */
    static fromFloat(value: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_float(value));
        return result;
    }
    /**
     * Creates a new setting value from an accuracy name. If it doesn't match a
     * known accuracy, null is returned.
     */
    static fromAccuracy(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_accuracy(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new setting value from a digits format name. If it doesn't match a
     * known digits format, null is returned.
     */
    static fromDigitsFormat(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_digits_format(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new setting value from a timing method name with the type
     * `optional timing method`. If it doesn't match a known timing method, null
     * is returned.
     */
    static fromOptionalTimingMethod(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_optional_timing_method(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new empty setting value with the type `optional timing method`.
     */
    static fromOptionalEmptyTimingMethod(): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_optional_empty_timing_method());
        return result;
    }
    /**
     * Creates a new setting value from the color provided as RGBA.
     */
    static fromColor(r: number, g: number, b: number, a: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_color(r, g, b, a));
        return result;
    }
    /**
     * Creates a new setting value from the color provided as RGBA with the type
     * `optional color`.
     */
    static fromOptionalColor(r: number, g: number, b: number, a: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_optional_color(r, g, b, a));
        return result;
    }
    /**
     * Creates a new empty setting value with the type `optional color`.
     */
    static fromOptionalEmptyColor(): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_optional_empty_color());
        return result;
    }
    /**
     * Creates a new setting value that is a transparent gradient.
     */
    static fromTransparentGradient(): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_transparent_gradient());
        return result;
    }
    /**
     * Creates a new setting value from the vertical gradient provided as two RGBA colors.
     */
    static fromVerticalGradient(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_vertical_gradient(r1, g1, b1, a1, r2, g2, b2, a2));
        return result;
    }
    /**
     * Creates a new setting value from the horizontal gradient provided as two RGBA colors.
     */
    static fromHorizontalGradient(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_horizontal_gradient(r1, g1, b1, a1, r2, g2, b2, a2));
        return result;
    }
    /**
     * Creates a new setting value from the alternating gradient provided as two RGBA colors.
     */
    static fromAlternatingGradient(r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number): SettingValue {
        const result = new SettingValue(instance().exports.SettingValue_from_alternating_gradient(r1, g1, b1, a1, r2, g2, b2, a2));
        return result;
    }
    /**
     * Creates a new setting value from the alignment name provided. If it doesn't
     * match a known alignment, null is returned.
     */
    static fromAlignment(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_alignment(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new setting value from the column start with name provided. If it
     * doesn't match a known column start with, null is returned.
     */
    static fromColumnStartWith(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_column_start_with(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new setting value from the column update with name provided. If it
     * doesn't match a known column update with, null is returned.
     */
    static fromColumnUpdateWith(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_column_update_with(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new setting value from the column update trigger. If it doesn't
     * match a known column update trigger, null is returned.
     */
    static fromColumnUpdateTrigger(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_column_update_trigger(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Creates a new setting value from the layout direction. If it doesn't
     * match a known layout direction, null is returned.
     */
    static fromLayoutDirection(value: string): SettingValue | null {
        const value_allocated = allocString(value);
        const result = new SettingValue(instance().exports.SettingValue_from_layout_direction(value_allocated.ptr));
        dealloc(value_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

/**
 * A Shared Timer that can be used to share a single timer object with multiple
 * owners.
 */
export class SharedTimerRef {
    ptr: number;
    /**
     * Creates a new shared timer handle that shares the same timer. The inner
     * timer object only gets disposed when the final handle gets disposed.
     */
    share(): SharedTimer {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SharedTimer(instance().exports.SharedTimer_share(this.ptr));
        return result;
    }
    /**
     * Requests read access to the timer that is being shared. This blocks the
     * thread as long as there is an active write lock. Dispose the read lock when
     * you are done using the timer.
     */
    read(): TimerReadLock {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimerReadLock(instance().exports.SharedTimer_read(this.ptr));
        return result;
    }
    /**
     * Requests write access to the timer that is being shared. This blocks the
     * thread as long as there are active write or read locks. Dispose the write
     * lock when you are done using the timer.
     */
    write(): TimerWriteLock {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimerWriteLock(instance().exports.SharedTimer_write(this.ptr));
        return result;
    }
    /**
     * Replaces the timer that is being shared by the timer provided. This blocks
     * the thread as long as there are active write or read locks. Everyone who is
     * sharing the old timer will share the provided timer after successful
     * completion.
     */
    replaceInner(timer: Timer) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        instance().exports.SharedTimer_replace_inner(this.ptr, timer.ptr);
        timer.ptr = 0;
    }
    readWith<T>(action: (timer: TimerRef) => T): T {
        return this.read().with(function (lock) {
            return action(lock.timer());
        });
    }
    writeWith<T>(action: (timer: TimerRefMut) => T): T {
        return this.write().with(function (lock) {
            return action(lock.timer());
        });
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Shared Timer that can be used to share a single timer object with multiple
 * owners.
 */
export class SharedTimerRefMut extends SharedTimerRef {
}

/**
 * A Shared Timer that can be used to share a single timer object with multiple
 * owners.
 */
export class SharedTimer extends SharedTimerRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SharedTimer) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SharedTimer_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The state object that describes a single segment's information to visualize.
 */
export class SplitComponentStateRef {
    ptr: number;
    /**
     * The amount of columns to visualize for the segment with the specified index.
     * The columns are specified from right to left. You may not provide an out of
     * bounds index. The amount of columns to visualize may differ from segment to
     * segment.
     */
    columnsLen(index: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitComponentState_columns_len(this.ptr, index);
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object that describes a single segment's information to visualize.
 */
export class SplitComponentStateRefMut extends SplitComponentStateRef {
}

/**
 * The state object that describes a single segment's information to visualize.
 */
export class SplitComponentState extends SplitComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SplitComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            this.ptr = 0;
        }
    }
}

/**
 * The Splits Component is the main component for visualizing all the split
 * times. Each segment is shown in a tabular fashion showing the segment icon,
 * segment name, the delta compared to the chosen comparison, and the split
 * time. The list provides scrolling functionality, so not every segment needs
 * to be shown all the time.
 */
export class SplitsComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Splits Component is the main component for visualizing all the split
 * times. Each segment is shown in a tabular fashion showing the segment icon,
 * segment name, the delta compared to the chosen comparison, and the split
 * time. The list provides scrolling functionality, so not every segment needs
 * to be shown all the time.
 */
export class SplitsComponentRefMut extends SplitsComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = instance().exports.SplitsComponent_state_as_json(this.ptr, timer.ptr, layoutSettings.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer and layout settings
     * provided.
     */
    state(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): SplitsComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = new SplitsComponentState(instance().exports.SplitsComponent_state(this.ptr, timer.ptr, layoutSettings.ptr));
        return result;
    }
    /**
     * Scrolls up the window of the segments that are shown. Doesn't move the
     * scroll window if it reaches the top of the segments.
     */
    scrollUp() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.SplitsComponent_scroll_up(this.ptr);
    }
    /**
     * Scrolls down the window of the segments that are shown. Doesn't move the
     * scroll window if it reaches the bottom of the segments.
     */
    scrollDown() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.SplitsComponent_scroll_down(this.ptr);
    }
    /**
     * The amount of segments to show in the list at any given time. If this is
     * set to 0, all the segments are shown. If this is set to a number lower
     * than the total amount of segments, only a certain window of all the
     * segments is shown. This window can scroll up or down.
     */
    setVisualSplitCount(count: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.SplitsComponent_set_visual_split_count(this.ptr, count);
    }
    /**
     * If there's more segments than segments that are shown, the window
     * showing the segments automatically scrolls up and down when the current
     * segment changes. This count determines the minimum number of future
     * segments to be shown in this scrolling window when it automatically
     * scrolls.
     */
    setSplitPreviewCount(count: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.SplitsComponent_set_split_preview_count(this.ptr, count);
    }
    /**
     * If not every segment is shown in the scrolling window of segments, then
     * this determines whether the final segment is always to be shown, as it
     * contains valuable information about the total duration of the chosen
     * comparison, which is often the runner's Personal Best.
     */
    setAlwaysShowLastSplit(alwaysShowLastSplit: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.SplitsComponent_set_always_show_last_split(this.ptr, alwaysShowLastSplit ? 1 : 0);
    }
    /**
     * If the last segment is to always be shown, this determines whether to
     * show a more pronounced separator in front of the last segment, if it is
     * not directly adjacent to the segment shown right before it in the
     * scrolling window.
     */
    setSeparatorLastSplit(separatorLastSplit: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.SplitsComponent_set_separator_last_split(this.ptr, separatorLastSplit ? 1 : 0);
    }
}

/**
 * The Splits Component is the main component for visualizing all the split
 * times. Each segment is shown in a tabular fashion showing the segment icon,
 * segment name, the delta compared to the chosen comparison, and the split
 * time. The list provides scrolling functionality, so not every segment needs
 * to be shown all the time.
 */
export class SplitsComponent extends SplitsComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SplitsComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SplitsComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Splits Component.
     */
    static new(): SplitsComponent {
        const result = new SplitsComponent(instance().exports.SplitsComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.SplitsComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object that describes a single segment's information to visualize.
 */
export class SplitsComponentStateRef {
    ptr: number;
    /**
     * Describes whether a more pronounced separator should be shown in front of
     * the last segment provided.
     */
    finalSeparatorShown(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_final_separator_shown(this.ptr) != 0;
        return result;
    }
    /**
     * Returns the amount of segments to visualize.
     */
    len(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_len(this.ptr);
        return result;
    }
    /**
     * Returns the amount of icon changes that happened in this state object.
     */
    iconChangeCount(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_icon_change_count(this.ptr);
        return result;
    }
    /**
     * Accesses the index of the segment of the icon change with the specified
     * index. This is based on the index in the run, not on the index of the
     * SplitState in the State object. The corresponding index is the index field
     * of the SplitState object. You may not provide an out of bounds index.
     */
    iconChangeSegmentIndex(iconChangeIndex: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_icon_change_segment_index(this.ptr, iconChangeIndex);
        return result;
    }
    /**
     * The icon data of the segment of the icon change with the specified index.
     * The buffer may be empty. This indicates that there is no icon. You may not
     * provide an out of bounds index.
     */
    iconChangeIconPtr(iconChangeIndex: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_icon_change_icon_ptr(this.ptr, iconChangeIndex);
        return result;
    }
    /**
     * The length of the icon data of the segment of the icon change with the
     * specified index.
     */
    iconChangeIconLen(iconChangeIndex: number): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_icon_change_icon_len(this.ptr, iconChangeIndex);
        return result;
    }
    /**
     * The name of the segment with the specified index. You may not provide an out
     * of bounds index.
     */
    name(index: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_name(this.ptr, index);
        return decodeString(result);
    }
    /**
     * The column's value to show for the split and column with the specified
     * index. The columns are specified from right to left. You may not provide an
     * out of bounds index.
     */
    columnValue(index: number, columnIndex: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_column_value(this.ptr, index, columnIndex);
        return decodeString(result);
    }
    /**
     * The semantic coloring information the column's value carries of the segment
     * and column with the specified index. The columns are specified from right to
     * left. You may not provide an out of bounds index.
     */
    columnSemanticColor(index: number, columnIndex: number): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_column_semantic_color(this.ptr, index, columnIndex);
        return decodeString(result);
    }
    /**
     * Describes if the segment with the specified index is the segment the active
     * attempt is currently on.
     */
    isCurrentSplit(index: number): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.SplitsComponentState_is_current_split(this.ptr, index) != 0;
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object that describes a single segment's information to visualize.
 */
export class SplitsComponentStateRefMut extends SplitsComponentStateRef {
}

/**
 * The state object that describes a single segment's information to visualize.
 */
export class SplitsComponentState extends SplitsComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SplitsComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SplitsComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Sum of Best Cleaner allows you to interactively remove potential issues in
 * the Segment History that lead to an inaccurate Sum of Best. If you skip a
 * split, whenever you get to the next split, the combined segment time might
 * be faster than the sum of the individual best segments. The Sum of Best
 * Cleaner will point out all of occurrences of this and allows you to delete
 * them individually if any of them seem wrong.
 */
export class SumOfBestCleanerRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Sum of Best Cleaner allows you to interactively remove potential issues in
 * the Segment History that lead to an inaccurate Sum of Best. If you skip a
 * split, whenever you get to the next split, the combined segment time might
 * be faster than the sum of the individual best segments. The Sum of Best
 * Cleaner will point out all of occurrences of this and allows you to delete
 * them individually if any of them seem wrong.
 */
export class SumOfBestCleanerRefMut extends SumOfBestCleanerRef {
    /**
     * Returns the next potential clean up. If there are no more potential
     * clean ups, null is returned.
     */
    nextPotentialCleanUp(): PotentialCleanUp | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new PotentialCleanUp(instance().exports.SumOfBestCleaner_next_potential_clean_up(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Applies a clean up to the Run.
     */
    apply(cleanUp: PotentialCleanUp) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (cleanUp.ptr == 0) {
            throw "cleanUp is disposed";
        }
        instance().exports.SumOfBestCleaner_apply(this.ptr, cleanUp.ptr);
        cleanUp.ptr = 0;
    }
}

/**
 * A Sum of Best Cleaner allows you to interactively remove potential issues in
 * the Segment History that lead to an inaccurate Sum of Best. If you skip a
 * split, whenever you get to the next split, the combined segment time might
 * be faster than the sum of the individual best segments. The Sum of Best
 * Cleaner will point out all of occurrences of this and allows you to delete
 * them individually if any of them seem wrong.
 */
export class SumOfBestCleaner extends SumOfBestCleanerRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SumOfBestCleaner) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SumOfBestCleaner_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The Sum of Best Segments Component shows the fastest possible time to
 * complete a run of this category, based on information collected from all the
 * previous attempts. This often matches up with the sum of the best segment
 * times of all the segments, but that may not always be the case, as skipped
 * segments may introduce combined segments that may be faster than the actual
 * sum of their best segment times. The name is therefore a bit misleading, but
 * sticks around for historical reasons.
 */
export class SumOfBestComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.SumOfBestComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.SumOfBestComponent_state(this.ptr, timer.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Sum of Best Segments Component shows the fastest possible time to
 * complete a run of this category, based on information collected from all the
 * previous attempts. This often matches up with the sum of the best segment
 * times of all the segments, but that may not always be the case, as skipped
 * segments may introduce combined segments that may be faster than the actual
 * sum of their best segment times. The name is therefore a bit misleading, but
 * sticks around for historical reasons.
 */
export class SumOfBestComponentRefMut extends SumOfBestComponentRef {
}

/**
 * The Sum of Best Segments Component shows the fastest possible time to
 * complete a run of this category, based on information collected from all the
 * previous attempts. This often matches up with the sum of the best segment
 * times of all the segments, but that may not always be the case, as skipped
 * segments may introduce combined segments that may be faster than the actual
 * sum of their best segment times. The name is therefore a bit misleading, but
 * sticks around for historical reasons.
 */
export class SumOfBestComponent extends SumOfBestComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: SumOfBestComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.SumOfBestComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Sum of Best Segments Component.
     */
    static new(): SumOfBestComponent {
        const result = new SumOfBestComponent(instance().exports.SumOfBestComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.SumOfBestComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Text Component simply visualizes any given text. This can either be a
 * single centered text, or split up into a left and right text, which is
 * suitable for a situation where you have a label and a value.
 */
export class TextComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.TextComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state.
     */
    state(timer: TimerRef): TextComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new TextComponentState(instance().exports.TextComponent_state(this.ptr, timer.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Text Component simply visualizes any given text. This can either be a
 * single centered text, or split up into a left and right text, which is
 * suitable for a situation where you have a label and a value.
 */
export class TextComponentRefMut extends TextComponentRef {
    /**
     * Sets the centered text. If the current mode is split, it is switched to
     * centered mode.
     */
    setCenter(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const text_allocated = allocString(text);
        instance().exports.TextComponent_set_center(this.ptr, text_allocated.ptr);
        dealloc(text_allocated);
    }
    /**
     * Sets the left text. If the current mode is centered, it is switched to
     * split mode, with the right text being empty.
     */
    setLeft(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const text_allocated = allocString(text);
        instance().exports.TextComponent_set_left(this.ptr, text_allocated.ptr);
        dealloc(text_allocated);
    }
    /**
     * Sets the right text. If the current mode is centered, it is switched to
     * split mode, with the left text being empty.
     */
    setRight(text: string) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const text_allocated = allocString(text);
        instance().exports.TextComponent_set_right(this.ptr, text_allocated.ptr);
        dealloc(text_allocated);
    }
}

/**
 * The Text Component simply visualizes any given text. This can either be a
 * single centered text, or split up into a left and right text, which is
 * suitable for a situation where you have a label and a value.
 */
export class TextComponent extends TextComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TextComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TextComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Text Component.
     */
    static new(): TextComponent {
        const result = new TextComponent(instance().exports.TextComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.TextComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TextComponentStateRef {
    ptr: number;
    /**
     * Accesses the left part of the text. If the text isn't split up, an empty
     * string is returned instead.
     */
    left(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TextComponentState_left(this.ptr);
        return decodeString(result);
    }
    /**
     * Accesses the right part of the text. If the text isn't split up, an empty
     * string is returned instead.
     */
    right(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TextComponentState_right(this.ptr);
        return decodeString(result);
    }
    /**
     * Accesses the centered text. If the text isn't centered, an empty string is
     * returned instead.
     */
    center(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TextComponentState_center(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns whether the text is split up into a left and right part.
     */
    isSplit(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TextComponentState_is_split(this.ptr) != 0;
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TextComponentStateRefMut extends TextComponentStateRef {
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TextComponentState extends TextComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TextComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TextComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A time that can store a Real Time and a Game Time. Both of them are
 * optional.
 */
export class TimeRef {
    ptr: number;
    /**
     * Clones the time.
     */
    clone(): Time {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Time(instance().exports.Time_clone(this.ptr));
        return result;
    }
    /**
     * The Real Time value. This may be null if this time has no Real Time value.
     */
    realTime(): TimeSpanRef | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpanRef(instance().exports.Time_real_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * The Game Time value. This may be null if this time has no Game Time value.
     */
    gameTime(): TimeSpanRef | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpanRef(instance().exports.Time_game_time(this.ptr));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Access the time's value for the timing method specified.
     */
    index(timingMethod: number): TimeSpanRef | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpanRef(instance().exports.Time_index(this.ptr, timingMethod));
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A time that can store a Real Time and a Game Time. Both of them are
 * optional.
 */
export class TimeRefMut extends TimeRef {
}

/**
 * A time that can store a Real Time and a Game Time. Both of them are
 * optional.
 */
export class Time extends TimeRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Time) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.Time_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Time Span represents a certain span of time.
 */
export class TimeSpanRef {
    ptr: number;
    /**
     * Clones the Time Span.
     */
    clone(): TimeSpan {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpan(instance().exports.TimeSpan_clone(this.ptr));
        return result;
    }
    /**
     * Returns the total amount of seconds (including decimals) this Time Span
     * represents.
     */
    totalSeconds(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TimeSpan_total_seconds(this.ptr);
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Time Span represents a certain span of time.
 */
export class TimeSpanRefMut extends TimeSpanRef {
}

/**
 * A Time Span represents a certain span of time.
 */
export class TimeSpan extends TimeSpanRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TimeSpan) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TimeSpan_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Time Span from a given amount of seconds.
     */
    static fromSeconds(seconds: number): TimeSpan {
        const result = new TimeSpan(instance().exports.TimeSpan_from_seconds(seconds));
        return result;
    }
    /**
     * Parses a Time Span from a string. Returns null if the time can't be
     * parsed.
     */
    static parse(text: string): TimeSpan | null {
        const text_allocated = allocString(text);
        const result = new TimeSpan(instance().exports.TimeSpan_parse(text_allocated.ptr));
        dealloc(text_allocated);
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
}

/**
 * A Timer provides all the capabilities necessary for doing speedrun attempts.
 */
export class TimerRef {
    ptr: number;
    /**
     * Returns the currently selected Timing Method.
     */
    currentTimingMethod(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Timer_current_timing_method(this.ptr);
        return result;
    }
    /**
     * Returns the current comparison that is being compared against. This may
     * be a custom comparison or one of the Comparison Generators.
     */
    currentComparison(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Timer_current_comparison(this.ptr);
        return decodeString(result);
    }
    /**
     * Returns whether Game Time is currently initialized. Game Time
     * automatically gets uninitialized for each new attempt.
     */
    isGameTimeInitialized(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Timer_is_game_time_initialized(this.ptr) != 0;
        return result;
    }
    /**
     * Returns whether the Game Timer is currently paused. If the Game Timer is
     * not paused, it automatically increments similar to Real Time.
     */
    isGameTimePaused(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Timer_is_game_time_paused(this.ptr) != 0;
        return result;
    }
    /**
     * Accesses the loading times. Loading times are defined as Game Time - Real Time.
     */
    loadingTimes(): TimeSpanRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeSpanRef(instance().exports.Timer_loading_times(this.ptr));
        return result;
    }
    /**
     * Returns the current Timer Phase.
     */
    currentPhase(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Timer_current_phase(this.ptr);
        return result;
    }
    /**
     * Accesses the Run in use by the Timer.
     */
    getRun(): RunRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new RunRef(instance().exports.Timer_get_run(this.ptr));
        return result;
    }
    /**
     * Saves the Run in use by the Timer as a LiveSplit splits file (*.lss).
     */
    saveAsLss(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.Timer_save_as_lss(this.ptr);
        return decodeString(result);
    }
    /**
     * Prints out debug information representing the whole state of the Timer. This
     * is being written to stdout.
     */
    printDebug() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_print_debug(this.ptr);
    }
    /**
     * Returns the current time of the Timer. The Game Time is null if the Game
     * Time has not been initialized.
     */
    currentTime(): TimeRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimeRef(instance().exports.Timer_current_time(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Timer provides all the capabilities necessary for doing speedrun attempts.
 */
export class TimerRefMut extends TimerRef {
    /**
     * Replaces the Run object used by the Timer with the Run object provided. If
     * the Run provided contains no segments, it can't be used for timing and is
     * not being modified. Otherwise the Run that was in use by the Timer gets
     * stored in the Run object provided. Before the Run is returned, the current
     * attempt is reset and the splits are being updated depending on the
     * `update_splits` parameter. The return value indicates whether the Run got
     * replaced successfully.
     */
    replaceRun(run: RunRefMut, updateSplits: boolean): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const result = instance().exports.Timer_replace_run(this.ptr, run.ptr, updateSplits ? 1 : 0) != 0;
        return result;
    }
    /**
     * Sets the Run object used by the Timer with the Run object provided. If the
     * Run provided contains no segments, it can't be used for timing and gets
     * returned again. If the Run object can be set, the original Run object in use
     * by the Timer is disposed by this method and null is returned.
     */
    setRun(run: Run): Run | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const result = new Run(instance().exports.Timer_set_run(this.ptr, run.ptr));
        run.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Starts the Timer if there is no attempt in progress. If that's not the
     * case, nothing happens.
     */
    start() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_start(this.ptr);
    }
    /**
     * If an attempt is in progress, stores the current time as the time of the
     * current split. The attempt ends if the last split time is stored.
     */
    split() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_split(this.ptr);
    }
    /**
     * Starts a new attempt or stores the current time as the time of the
     * current split. The attempt ends if the last split time is stored.
     */
    splitOrStart() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_split_or_start(this.ptr);
    }
    /**
     * Skips the current split if an attempt is in progress and the
     * current split is not the last split.
     */
    skipSplit() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_skip_split(this.ptr);
    }
    /**
     * Removes the split time from the last split if an attempt is in progress
     * and there is a previous split. The Timer Phase also switches to
     * `Running` if it previously was `Ended`.
     */
    undoSplit() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_undo_split(this.ptr);
    }
    /**
     * Resets the current attempt if there is one in progress. If the splits
     * are to be updated, all the information of the current attempt is stored
     * in the Run's history. Otherwise the current attempt's information is
     * discarded.
     */
    reset(updateSplits: boolean) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_reset(this.ptr, updateSplits ? 1 : 0);
    }
    /**
     * Resets the current attempt if there is one in progress. The splits are
     * updated such that the current attempt's split times are being stored as
     * the new Personal Best.
     */
    resetAndSetAttemptAsPb() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_reset_and_set_attempt_as_pb(this.ptr);
    }
    /**
     * Pauses an active attempt that is not paused.
     */
    pause() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_pause(this.ptr);
    }
    /**
     * Resumes an attempt that is paused.
     */
    resume() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_resume(this.ptr);
    }
    /**
     * Toggles an active attempt between `Paused` and `Running`.
     */
    togglePause() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_toggle_pause(this.ptr);
    }
    /**
     * Toggles an active attempt between `Paused` and `Running` or starts an
     * attempt if there's none in progress.
     */
    togglePauseOrStart() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_toggle_pause_or_start(this.ptr);
    }
    /**
     * Removes all the pause times from the current time. If the current
     * attempt is paused, it also resumes that attempt. Additionally, if the
     * attempt is finished, the final split time is adjusted to not include the
     * pause times as well.
     * 
     * # Warning
     * 
     * This behavior is not entirely optimal, as generally only the final split
     * time is modified, while all other split times are left unmodified, which
     * may not be what actually happened during the run.
     */
    undoAllPauses() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_undo_all_pauses(this.ptr);
    }
    /**
     * Sets the current Timing Method to the Timing Method provided.
     */
    setCurrentTimingMethod(method: number) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_set_current_timing_method(this.ptr, method);
    }
    /**
     * Switches the current comparison to the next comparison in the list.
     */
    switchToNextComparison() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_switch_to_next_comparison(this.ptr);
    }
    /**
     * Switches the current comparison to the previous comparison in the list.
     */
    switchToPreviousComparison() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_switch_to_previous_comparison(this.ptr);
    }
    /**
     * Initializes Game Time for the current attempt. Game Time automatically
     * gets uninitialized for each new attempt.
     */
    initializeGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_initialize_game_time(this.ptr);
    }
    /**
     * Deinitializes Game Time for the current attempt.
     */
    deinitializeGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_deinitialize_game_time(this.ptr);
    }
    /**
     * Pauses the Game Timer such that it doesn't automatically increment
     * similar to Real Time.
     */
    pauseGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_pause_game_time(this.ptr);
    }
    /**
     * Resumes the Game Timer such that it automatically increments similar to
     * Real Time, starting from the Game Time it was paused at.
     */
    resumeGameTime() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_resume_game_time(this.ptr);
    }
    /**
     * Sets the Game Time to the time specified. This also works if the Game
     * Time is paused, which can be used as a way of updating the Game Timer
     * periodically without it automatically moving forward. This ensures that
     * the Game Timer never shows any time that is not coming from the game.
     */
    setGameTime(time: TimeSpanRef) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (time.ptr == 0) {
            throw "time is disposed";
        }
        instance().exports.Timer_set_game_time(this.ptr, time.ptr);
    }
    /**
     * Instead of setting the Game Time directly, this method can be used to
     * just specify the amount of time the game has been loading. The Game Time
     * is then automatically determined by Real Time - Loading Times.
     */
    setLoadingTimes(time: TimeSpanRef) {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (time.ptr == 0) {
            throw "time is disposed";
        }
        instance().exports.Timer_set_loading_times(this.ptr, time.ptr);
    }
    /**
     * Marks the Run as unmodified, so that it is known that all the changes
     * have been saved.
     */
    markAsUnmodified() {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        instance().exports.Timer_mark_as_unmodified(this.ptr);
    }
}

/**
 * A Timer provides all the capabilities necessary for doing speedrun attempts.
 */
export class Timer extends TimerRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: Timer) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.Timer_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Timer based on a Run object storing all the information
     * about the splits. The Run object needs to have at least one segment, so
     * that the Timer can store the final time. If a Run object with no
     * segments is provided, the Timer creation fails and null is returned.
     */
    static new(run: Run): Timer | null {
        if (run.ptr == 0) {
            throw "run is disposed";
        }
        const result = new Timer(instance().exports.Timer_new(run.ptr));
        run.ptr = 0;
        if (result.ptr == 0) {
            return null;
        }
        return result;
    }
    /**
     * Consumes the Timer and creates a Shared Timer that can be shared across
     * multiple threads with multiple owners.
     */
    intoShared(): SharedTimer {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new SharedTimer(instance().exports.Timer_into_shared(this.ptr));
        this.ptr = 0;
        return result;
    }
    /**
     * Takes out the Run from the Timer and resets the current attempt if there
     * is one in progress. If the splits are to be updated, all the information
     * of the current attempt is stored in the Run's history. Otherwise the
     * current attempt's information is discarded.
     */
    intoRun(updateSplits: boolean): Run {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Run(instance().exports.Timer_into_run(this.ptr, updateSplits ? 1 : 0));
        this.ptr = 0;
        return result;
    }
}

/**
 * The Timer Component is a component that shows the total time of the current
 * attempt as a digital clock. The color of the time shown is based on a how
 * well the current attempt is doing compared to the chosen comparison.
 */
export class TimerComponentRef {
    ptr: number;
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = instance().exports.TimerComponent_state_as_json(this.ptr, timer.ptr, layoutSettings.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer and the layout
     * settings provided.
     */
    state(timer: TimerRef, layoutSettings: GeneralLayoutSettingsRef): TimerComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        if (layoutSettings.ptr == 0) {
            throw "layoutSettings is disposed";
        }
        const result = new TimerComponentState(instance().exports.TimerComponent_state(this.ptr, timer.ptr, layoutSettings.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Timer Component is a component that shows the total time of the current
 * attempt as a digital clock. The color of the time shown is based on a how
 * well the current attempt is doing compared to the chosen comparison.
 */
export class TimerComponentRefMut extends TimerComponentRef {
}

/**
 * The Timer Component is a component that shows the total time of the current
 * attempt as a digital clock. The color of the time shown is based on a how
 * well the current attempt is doing compared to the chosen comparison.
 */
export class TimerComponent extends TimerComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TimerComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TimerComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Timer Component.
     */
    static new(): TimerComponent {
        const result = new TimerComponent(instance().exports.TimerComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.TimerComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TimerComponentStateRef {
    ptr: number;
    /**
     * The time shown by the component without the fractional part.
     */
    time(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TimerComponentState_time(this.ptr);
        return decodeString(result);
    }
    /**
     * The fractional part of the time shown (including the dot).
     */
    fraction(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TimerComponentState_fraction(this.ptr);
        return decodeString(result);
    }
    /**
     * The semantic coloring information the time carries.
     */
    semanticColor(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TimerComponentState_semantic_color(this.ptr);
        return decodeString(result);
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TimerComponentStateRefMut extends TimerComponentStateRef {
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TimerComponentState extends TimerComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TimerComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TimerComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Timer Read Lock allows temporary read access to a timer. Dispose this to
 * release the read lock.
 */
export class TimerReadLockRef {
    ptr: number;
    /**
     * Accesses the timer.
     */
    timer(): TimerRef {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimerRef(instance().exports.TimerReadLock_timer(this.ptr));
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Timer Read Lock allows temporary read access to a timer. Dispose this to
 * release the read lock.
 */
export class TimerReadLockRefMut extends TimerReadLockRef {
}

/**
 * A Timer Read Lock allows temporary read access to a timer. Dispose this to
 * release the read lock.
 */
export class TimerReadLock extends TimerReadLockRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TimerReadLock) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TimerReadLock_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * A Timer Write Lock allows temporary write access to a timer. Dispose this to
 * release the write lock.
 */
export class TimerWriteLockRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * A Timer Write Lock allows temporary write access to a timer. Dispose this to
 * release the write lock.
 */
export class TimerWriteLockRefMut extends TimerWriteLockRef {
    /**
     * Accesses the timer.
     */
    timer(): TimerRefMut {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new TimerRefMut(instance().exports.TimerWriteLock_timer(this.ptr));
        return result;
    }
}

/**
 * A Timer Write Lock allows temporary write access to a timer. Dispose this to
 * release the write lock.
 */
export class TimerWriteLock extends TimerWriteLockRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TimerWriteLock) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TimerWriteLock_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The Title Component is a component that shows the name of the game and the
 * category that is being run. Additionally, the game icon, the attempt count,
 * and the total number of successfully finished runs can be shown.
 */
export class TitleComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Title Component is a component that shows the name of the game and the
 * category that is being run. Additionally, the game icon, the attempt count,
 * and the total number of successfully finished runs can be shown.
 */
export class TitleComponentRefMut extends TitleComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.TitleComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): TitleComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new TitleComponentState(instance().exports.TitleComponent_state(this.ptr, timer.ptr));
        return result;
    }
}

/**
 * The Title Component is a component that shows the name of the game and the
 * category that is being run. Additionally, the game icon, the attempt count,
 * and the total number of successfully finished runs can be shown.
 */
export class TitleComponent extends TitleComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TitleComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TitleComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Title Component.
     */
    static new(): TitleComponent {
        const result = new TitleComponent(instance().exports.TitleComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.TitleComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TitleComponentStateRef {
    ptr: number;
    /**
     * The data of the game's icon. This value is only specified whenever the icon
     * changes. If you explicitly want to query this value, remount the component.
     * The buffer may be empty. This indicates that there is no icon. If no change
     * occurred, null is returned instead.
     */
    iconChangePtr(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_icon_change_ptr(this.ptr);
        return result;
    }
    /**
     * The length of the game's icon data.
     */
    iconChangeLen(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_icon_change_len(this.ptr);
        return result;
    }
    /**
     * The first title line to show. This is either the game's name, or a
     * combination of the game's name and the category.
     */
    line1(): string {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_line1(this.ptr);
        return decodeString(result);
    }
    /**
     * By default the category name is shown on the second line. Based on the
     * settings, it can however instead be shown in a single line together with
     * the game name. In that case null is returned instead.
     */
    line2(): string | null {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_line2(this.ptr);
        if (result == 0) {
            return null;
        }
        return decodeString(result);
    }
    /**
     * Specifies whether the title should centered or aligned to the left
     * instead.
     */
    isCentered(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_is_centered(this.ptr) != 0;
        return result;
    }
    /**
     * Returns whether the amount of successfully finished attempts is supposed to
     * be shown.
     */
    showsFinishedRuns(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_shows_finished_runs(this.ptr) != 0;
        return result;
    }
    /**
     * Returns the amount of successfully finished attempts.
     */
    finishedRuns(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_finished_runs(this.ptr);
        return result;
    }
    /**
     * Returns whether the amount of total attempts is supposed to be shown.
     */
    showsAttempts(): boolean {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_shows_attempts(this.ptr) != 0;
        return result;
    }
    /**
     * Returns the amount of total attempts.
     */
    attempts(): number {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = instance().exports.TitleComponentState_attempts(this.ptr);
        return result;
    }
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TitleComponentStateRefMut extends TitleComponentStateRef {
}

/**
 * The state object describes the information to visualize for this component.
 */
export class TitleComponentState extends TitleComponentStateRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TitleComponentState) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TitleComponentState_drop(this.ptr);
            this.ptr = 0;
        }
    }
}

/**
 * The Total Playtime Component is a component that shows the total amount of
 * time that the current category has been played for.
 */
export class TotalPlaytimeComponentRef {
    ptr: number;
    /**
     * This constructor is an implementation detail. Do not use this.
     */
    constructor(ptr: number) {
        this.ptr = ptr;
    }
}

/**
 * The Total Playtime Component is a component that shows the total amount of
 * time that the current category has been played for.
 */
export class TotalPlaytimeComponentRefMut extends TotalPlaytimeComponentRef {
    /**
     * Encodes the component's state information as JSON.
     */
    stateAsJson(timer: TimerRef): any {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = instance().exports.TotalPlaytimeComponent_state_as_json(this.ptr, timer.ptr);
        return JSON.parse(decodeString(result));
    }
    /**
     * Calculates the component's state based on the timer provided.
     */
    state(timer: TimerRef): KeyValueComponentState {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        if (timer.ptr == 0) {
            throw "timer is disposed";
        }
        const result = new KeyValueComponentState(instance().exports.TotalPlaytimeComponent_state(this.ptr, timer.ptr));
        return result;
    }
}

/**
 * The Total Playtime Component is a component that shows the total amount of
 * time that the current category has been played for.
 */
export class TotalPlaytimeComponent extends TotalPlaytimeComponentRefMut {
    /**
     * Allows for scoped usage of the object. The object is guaranteed to get
     * disposed once this function returns. You are free to dispose the object
     * early yourself anywhere within the scope. The scope's return value gets
     * carried to the outside of this function.
     */
    with<T>(closure: (obj: TotalPlaytimeComponent) => T): T {
        try {
            return closure(this);
        } finally {
            this.dispose();
        }
    }
    /**
     * Disposes the object, allowing it to clean up all of its memory. You need
     * to call this for every object that you don't use anymore and hasn't
     * already been disposed.
     */
    dispose() {
        if (this.ptr != 0) {
            instance().exports.TotalPlaytimeComponent_drop(this.ptr);
            this.ptr = 0;
        }
    }
    /**
     * Creates a new Total Playtime Component.
     */
    static new(): TotalPlaytimeComponent {
        const result = new TotalPlaytimeComponent(instance().exports.TotalPlaytimeComponent_new());
        return result;
    }
    /**
     * Converts the component into a generic component suitable for using with a
     * layout.
     */
    intoGeneric(): Component {
        if (this.ptr == 0) {
            throw "this is disposed";
        }
        const result = new Component(instance().exports.TotalPlaytimeComponent_into_generic(this.ptr));
        this.ptr = 0;
        return result;
    }
}
