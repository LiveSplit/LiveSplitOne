import { RunRef, TimeRef, TimingMethod } from "../livesplit-core";
import { formatLeaderboardTime } from "./TimeUtil";

// The comparison name that livesplit-core always stores for the Personal Best.
const PERSONAL_BEST_COMPARISON = "Personal Best";

// The FPS value is only considered sensible within this open range.
const FPS_MIN = 10;
const FPS_MAX = 600;

// Where the split times used for the export are taken from.
export type CsvSource =
    | { kind: "comparison"; comparison: string }
    | { kind: "attempt"; attemptIndex: number };

export interface SelectionEntry {
    value: string;
    label: string;
    source: CsvSource;
}

export interface YoutubeOffset {
    valid: boolean;
    offsetSeconds: number;
}

export interface LosslessCutOffset {
    valid: boolean;
    // Whether the FPS was derived from the offset. When true, the FPS field is
    // shown pre-filled and disabled; otherwise it's editable.
    fpsDerived: boolean;
    offsetSeconds: number;
    offsetFrames: number;
    fps: number | null;
    // A hard error disables the output; warnings keep it enabled.
    error: string | null;
    warnings: string[];
}

// The frame based format: `HH:MM:SS.FF{whitespace}TOTAL`. `FF` are exactly the
// two digits right after the period (the frame within the current second).
const FRAME_REGEX = /^(\d+):(\d{1,2}):(\d{1,2})\.(\d{2})\s*(\d*)$/;

const NUMBER_INT = /^\d+$/;
const NUMBER_FRACTIONAL = /^\d+(?:\.\d+)?$/;

function parseFpsInput(fpsInput: string): number | null {
    const trimmed = fpsInput.trim();
    if (trimmed === "" || !NUMBER_FRACTIONAL.test(trimmed)) {
        return null;
    }
    const value = Number.parseFloat(trimmed);
    return Number.isFinite(value) && value > 0 ? value : null;
}

function padTwo(value: number): string {
    return value.toString().padStart(2, "0");
}

function formatHmsFrames(wholeSeconds: number, frames: number): string {
    const seconds = wholeSeconds % 60;
    const minutes = Math.floor(wholeSeconds / 60) % 60;
    const hours = Math.floor(wholeSeconds / 3600);
    return `${padTwo(hours)}:${padTwo(minutes)}:${padTwo(seconds)}.${padTwo(frames)}`;
}

// Parses a plain `{s}` / `{m}:{s}` / `{h}:{m}:{s}` timestamp into seconds.
function parseTimestampSeconds(input: string): number | null {
    const parts = input.split(":");
    if (parts.length > 3) {
        return null;
    }

    const secondsPart = parts[parts.length - 1];
    if (!NUMBER_FRACTIONAL.test(secondsPart)) {
        return null;
    }
    let total = Number.parseFloat(secondsPart);
    let multiplier = 60;
    for (let i = parts.length - 2; i >= 0; i -= 1) {
        if (!NUMBER_INT.test(parts[i])) {
            return null;
        }
        total += Number.parseInt(parts[i], 10) * multiplier;
        multiplier *= 60;
    }
    return total;
}

export function parseYoutubeOffset(input: string): YoutubeOffset {
    const trimmed = input.trim();
    if (trimmed === "") {
        return { valid: true, offsetSeconds: 0 };
    }
    const seconds = parseTimestampSeconds(trimmed);
    if (seconds === null) {
        return { valid: false, offsetSeconds: 0 };
    }
    return { valid: true, offsetSeconds: seconds };
}

// Resolves the LosslessCut offset. The offset must be the full frame format
// `HH:MM:SS.FF{ws}TOTAL` (or empty); the plain seconds shortcut is not accepted.
export function resolveLosslessCutOffset(
    input: string,
    fpsInput: string,
): LosslessCutOffset {
    const trimmed = input.trim();
    const offsetEmpty = trimmed === "";

    let wholeSeconds = 0;
    let framesInSecond = 0;
    let totalFrames = 0;

    if (!offsetEmpty) {
        const match = FRAME_REGEX.exec(trimmed);
        if (match === null) {
            return {
                valid: false,
                fpsDerived: false,
                offsetSeconds: 0,
                offsetFrames: 0,
                fps: null,
                error: "Enter a full offset like 00:17:39.0731777 (HH:MM:SS.FF followed by the total frame number).",
                warnings: [],
            };
        }
        const hours = Number.parseInt(match[1], 10);
        const minutes = Number.parseInt(match[2], 10);
        const seconds = Number.parseInt(match[3], 10);
        // Parse in base 10 explicitly so a leading zero isn't treated as octal.
        framesInSecond = Number.parseInt(match[4], 10);
        totalFrames = match[5] === "" ? 0 : Number.parseInt(match[5], 10);
        wholeSeconds = hours * 3600 + minutes * 60 + seconds;
    }

    const frameDelta = totalFrames - framesInSecond;
    const calculatedFps =
        totalFrames > 0 && wholeSeconds > 0 && frameDelta > 0
            ? frameDelta / wholeSeconds
            : null;

    let fps: number | null;
    let fpsDerived: boolean;
    let error: string | null = null;
    if (calculatedFps !== null) {
        fps = calculatedFps;
        fpsDerived = true;
    } else {
        fpsDerived = false;
        fps = parseFpsInput(fpsInput);
        // Don't complain about a missing FPS until an offset has been entered.
        if (fps === null && !offsetEmpty) {
            error = "An FPS value is required, as it can't be calculated from the offset.";
        }
    }

    const warnings: string[] = [];
    if (error === null && fps !== null) {
        if (fps <= FPS_MIN || fps >= FPS_MAX) {
            warnings.push(
                `The FPS value (${formatFps(
                    fps,
                )}) is outside the expected range of ${FPS_MIN}–${FPS_MAX}.`,
            );
        }

        // The time part and the total frame number should describe the same
        // point in time. If they don't (only possible when the FPS was provided
        // rather than calculated), warn about it.
        const expectedFrames = wholeSeconds * fps + framesInSecond;
        if (Math.abs(expectedFrames - totalFrames) > 0.5) {
            const given = formatHmsFrames(wholeSeconds, framesInSecond);
            const expectedWholeSeconds = Math.floor(totalFrames / fps);
            const expectedFrameInSecond = Math.round(
                totalFrames - expectedWholeSeconds * fps,
            );
            const expected = formatHmsFrames(
                expectedWholeSeconds,
                expectedFrameInSecond,
            );
            warnings.push(
                `The offset time (${given}) doesn't match the frame offset: ${totalFrames} frames at ${formatFps(
                    fps,
                )} FPS would be ${expected}.`,
            );
        }
    }

    const offsetSeconds = fps !== null ? totalFrames / fps : 0;

    return {
        valid: true,
        fpsDerived,
        offsetSeconds,
        offsetFrames: totalFrames,
        fps,
        error,
        warnings,
    };
}

export function formatFps(fps: number): string {
    return String(Math.round(fps * 1e6) / 1e6);
}

function timeValue(time: TimeRef, method: TimingMethod): number | null {
    const span =
        method === TimingMethod.GameTime ? time.gameTime() : time.realTime();
    return span?.totalSeconds() ?? null;
}

// Real Time is preferred if the run has any real times, otherwise Game Time.
export function chooseTimingMethod(run: RunRef): TimingMethod {
    const len = run.segmentsLen();
    for (let i = len - 1; i >= 0; i -= 1) {
        const pb = run.segment(i).personalBestSplitTime();
        if (pb.realTime() != null) {
            return TimingMethod.RealTime;
        }
        if (pb.gameTime() != null) {
            return TimingMethod.GameTime;
        }
    }

    const attempts = run.attemptHistoryLen();
    for (let i = attempts - 1; i >= 0; i -= 1) {
        const time = run.attemptHistoryIndex(i).time();
        if (time.realTime() != null) {
            return TimingMethod.RealTime;
        }
        if (time.gameTime() != null) {
            return TimingMethod.GameTime;
        }
    }

    return TimingMethod.RealTime;
}

function formatDateTime(rfc3339: string): string {
    const date = new Date(rfc3339);
    if (Number.isNaN(date.getTime())) {
        return rfc3339;
    }
    return date.toLocaleString();
}

function attemptLabel(
    id: number,
    timeSeconds: number,
    started: string | null,
): string {
    const time = formatLeaderboardTime(timeSeconds, false, undefined);
    let label = `Run #${id}, ${time}`;
    if (started !== null) {
        label += `, started at ${started}`;
    }
    return label;
}

// Personal Best first (the default), then completed numbered attempts from most
// recent to least recent, then all other named comparisons.
export function buildSelectionEntries(
    run: RunRef,
    method: TimingMethod,
): SelectionEntry[] {
    const customComparisons: string[] = [];
    const customLen = run.customComparisonsLen();
    for (let i = 0; i < customLen; i += 1) {
        customComparisons.push(run.customComparison(i));
    }

    const entries: SelectionEntry[] = [];

    if (customComparisons.includes(PERSONAL_BEST_COMPARISON)) {
        entries.push({
            value: `cmp:${PERSONAL_BEST_COMPARISON}`,
            label: PERSONAL_BEST_COMPARISON,
            source: {
                kind: "comparison",
                comparison: PERSONAL_BEST_COMPARISON,
            },
        });
    }

    // The attempt history is stored oldest to newest, so collect and reverse.
    const attemptEntries: SelectionEntry[] = [];
    const attempts = run.attemptHistoryLen();
    for (let i = 0; i < attempts; i += 1) {
        const attempt = run.attemptHistoryIndex(i);
        const id = attempt.index();

        const finish = timeValue(attempt.time(), method);
        if (finish === null) {
            // Only completed attempts have a finish time.
            continue;
        }

        const started = attempt.started();
        const start = started !== null ? formatDateTime(started.toRfc3339()) : null;
        started?.[Symbol.dispose]();

        attemptEntries.push({
            value: `att:${id}`,
            label: attemptLabel(id, finish, start),
            source: { kind: "attempt", attemptIndex: id },
        });
    }
    attemptEntries.reverse();
    entries.push(...attemptEntries);

    for (const comparison of customComparisons) {
        if (comparison === PERSONAL_BEST_COMPARISON) {
            continue;
        }
        entries.push({
            value: `cmp:${comparison}`,
            label: comparison,
            source: { kind: "comparison", comparison },
        });
    }

    return entries;
}

// Cumulative split time (in seconds) at each segment, or `null` where no time is
// known (a skipped segment in an attempt, or a missing comparison time).
function splitTimesInSeconds(
    run: RunRef,
    source: CsvSource,
    method: TimingMethod,
): Array<number | null> {
    const len = run.segmentsLen();
    const result: Array<number | null> = [];

    if (source.kind === "comparison") {
        // Comparisons store cumulative split times directly.
        for (let i = 0; i < len; i += 1) {
            result.push(timeValue(run.segment(i).comparison(source.comparison), method));
        }
        return result;
    }

    // The segment history stores individual segment times (durations), so the
    // cumulative split time is the running sum for the selected attempt. A
    // skipped segment has no entry; its duration rolls into a later segment, so
    // the running sum stays correct.
    let cumulative = 0;
    for (let i = 0; i < len; i += 1) {
        using iter = run.segment(i).segmentHistory().iter();
        let segmentTime: number | null = null;
        while (true) {
            const element = iter.next();
            if (element === null) {
                break;
            }
            if (element.index() === source.attemptIndex) {
                segmentTime = timeValue(element.time(), method);
                break;
            }
        }

        if (segmentTime !== null) {
            cumulative += segmentTime;
            result.push(cumulative);
        } else {
            result.push(null);
        }
    }

    return result;
}

interface CsvRow {
    start: number;
    // The end time in seconds, or `null` for the trailing "End" row.
    end: number | null;
    name: string;
}

// Rows in seconds. Segments without a time are skipped. A leading `Start` row is
// added when the offset is non-zero, and a trailing `End` row is always added.
export function buildRows(
    run: RunRef,
    source: CsvSource,
    method: TimingMethod,
    offsetSeconds: number,
): CsvRow[] {
    const splitTimes = splitTimesInSeconds(run, source, method);
    const len = run.segmentsLen();

    const rows: CsvRow[] = [];

    if (offsetSeconds !== 0) {
        rows.push({ start: 0, end: offsetSeconds, name: "Start" });
    }

    let previousEnd = offsetSeconds;
    for (let i = 0; i < len; i += 1) {
        const cumulative = splitTimes[i];
        if (cumulative === null) {
            continue;
        }
        const end = cumulative + offsetSeconds;
        rows.push({ start: previousEnd, end, name: run.segment(i).name() });
        previousEnd = end;
    }

    rows.push({ start: previousEnd, end: null, name: "End" });

    return rows;
}

function escapeCsv(value: string): string {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

// An empty end value works too, but this large sentinel fits LosslessCut better.
const LOSSLESSCUT_END_FRAME = 999999999;

export function rowsToFramesCsv(rows: CsvRow[], fps: number): string {
    const lines = ["Start,End,Name"];
    for (const row of rows) {
        const start = Math.round(row.start * fps);
        const end =
            row.end === null
                ? LOSSLESSCUT_END_FRAME
                : Math.round(row.end * fps);
        lines.push(`${start},${end},${escapeCsv(row.name)}`);
    }
    return lines.join("\n") + "\n";
}

function youtubeTimestamp(totalSeconds: number): string {
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    if (hours > 0) {
        return `${hours}:${padTwo(minutes)}:${padTwo(seconds)}`;
    }
    return `${minutes}:${padTwo(seconds)}`;
}

const YOUTUBE_MIN_CHAPTER_GAP = 10;

export interface YoutubeResult {
    text: string;
    // Whether chapters had to be dropped to satisfy YouTube's chapter format.
    adjusted: boolean;
}

// YouTube requires chapters to have unique start times at least 10 seconds
// apart. Chapters that round to the previous timestamp, or land less than 10
// seconds after the previous kept chapter, are dropped.
export function rowsToYoutube(rows: CsvRow[]): YoutubeResult {
    const kept: Array<{ seconds: number; name: string }> = [];
    let adjusted = false;

    for (const row of rows) {
        const seconds = Math.floor(row.start);
        if (kept.length === 0) {
            kept.push({ seconds, name: row.name });
            continue;
        }

        const previous = kept[kept.length - 1];
        if (seconds === previous.seconds) {
            // Same timestamp: drop the earlier chapter, keep the later one.
            kept[kept.length - 1] = { seconds, name: row.name };
            adjusted = true;
        } else if (seconds - previous.seconds < YOUTUBE_MIN_CHAPTER_GAP) {
            // Too close to the previous kept chapter: drop this one.
            adjusted = true;
        } else {
            kept.push({ seconds, name: row.name });
        }
    }

    const text = kept
        .map((chapter) => `${youtubeTimestamp(chapter.seconds)} ${chapter.name}`)
        .join("\n");

    return { text, adjusted };
}
