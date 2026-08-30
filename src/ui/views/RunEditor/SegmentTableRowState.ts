import type React from "react";
import type * as LiveSplit from "../../../livesplit-core";
import { orAutoLang } from "../../../localization";

export interface RowState {
    splitTime: string;
    splitTimeChanged: boolean;
    segmentTime: string;
    segmentTimeChanged: boolean;
    bestSegmentTime: string;
    bestSegmentTimeChanged: boolean;
    comparisonTimes: string[];
    comparisonTimesChanged: boolean[];
    index: number;
}

export type SegmentSelectionState =
    LiveSplit.RunEditorSegmentRowJson["selected"];

export function createRowState(): RowState {
    return {
        bestSegmentTime: "",
        bestSegmentTimeChanged: false,
        comparisonTimes: [],
        comparisonTimesChanged: [],
        index: 0,
        segmentTime: "",
        segmentTimeChanged: false,
        splitTime: "",
        splitTimeChanged: false,
    };
}

export function changeSegmentSelection(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    index: number,
    selectionState: SegmentSelectionState,
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => LiveSplit.RunEditorStateJson,
) {
    if (event.shiftKey) {
        editor.selectRange(index);
    } else if (event.ctrlKey || event.metaKey) {
        if (selectionState === "Selected") {
            editor.unselect(index);
        } else {
            editor.selectAdditionally(index);
        }
    } else {
        editor.selectOnly(index);
    }

    const editorState = update();
    setFocusedSegmentRowState(
        editorState,
        getActiveSegmentIndex(editorState, index),
        rowState,
        setRowState,
    );
}

export function getActiveSegmentIndex(
    editorState: LiveSplit.RunEditorStateJson,
    fallbackIndex: number,
) {
    const activeSegment = editorState.rows.find(
        (row): row is LiveSplit.RunEditorSegmentRowJson =>
            row.kind === "Segment" && row.selected === "Active",
    );

    return activeSegment?.segment_index ?? fallbackIndex;
}

export function focusSegment(
    index: number,
    editor: LiveSplit.RunEditorRefMut,
    skipNextFocusedSelection: React.MutableRefObject<boolean>,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => LiveSplit.RunEditorStateJson,
) {
    // Mouse-based selection is handled on mousedown so modifier keys can change
    // selection without the subsequent focus event collapsing it back to a
    // single row. Keyboard focus still falls back to exclusive selection.
    if (skipNextFocusedSelection.current) {
        skipNextFocusedSelection.current = false;
        const editorState = update();
        setFocusedSegmentRowState(
            editorState,
            getActiveSegmentIndex(editorState, index),
            rowState,
            setRowState,
        );
        return;
    }

    editor.selectOnly(index);
    const editorState = update();
    setFocusedSegmentRowState(
        editorState,
        getActiveSegmentIndex(editorState, index),
        rowState,
        setRowState,
    );
}

export function setFocusedSegmentRowState(
    editorState: LiveSplit.RunEditorStateJson,
    index: number,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
) {
    const segment = getSegmentRow(editorState, index);
    if (segment === undefined) {
        return;
    }
    const comparisonTimes = segment.comparison_times;
    setRowState({
        ...rowState,
        splitTimeChanged: false,
        segmentTimeChanged: false,
        bestSegmentTimeChanged: false,
        comparisonTimes,
        comparisonTimesChanged: comparisonTimes.map(() => false),
        index,
    });
}

export function handleSplitTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.splitTimeChanged) {
        editor.activeParseAndSetSplitTime(rowState.splitTime, orAutoLang(lang));
        update();
        setRowState({ ...rowState, splitTimeChanged: false });
    }
}

export function handleSegmentTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.segmentTimeChanged) {
        editor.activeParseAndSetSegmentTime(
            rowState.segmentTime,
            orAutoLang(lang),
        );
        update();
        setRowState({ ...rowState, segmentTimeChanged: false });
    }
}

export function handleBestSegmentTimeBlur(
    editor: LiveSplit.RunEditorRefMut,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.bestSegmentTimeChanged) {
        editor.activeParseAndSetBestSegmentTime(
            rowState.bestSegmentTime,
            orAutoLang(lang),
        );
        update();
        setRowState({ ...rowState, bestSegmentTimeChanged: false });
    }
}

export function handleComparisonTimeBlur(
    comparisonIndex: number,
    editor: LiveSplit.RunEditorRefMut,
    editorState: LiveSplit.RunEditorStateJson,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => void,
    lang: LiveSplit.Language | undefined,
) {
    if (rowState.comparisonTimesChanged[comparisonIndex]) {
        const comparisonName = editorState.comparison_names[comparisonIndex];
        const comparisonTime = rowState.comparisonTimes[comparisonIndex];
        if (comparisonName === undefined || comparisonTime === undefined) {
            // The comparison names and row-local edit values are parallel
            // arrays. A missing entry means the editor state is inconsistent,
            // so fail before sending an invalid comparison to livesplit-core.
            throw new Error("Missing comparison time editor state.");
        }
        editor.activeParseAndSetComparisonTime(
            comparisonName,
            comparisonTime,
            orAutoLang(lang),
        );
        update();

        const comparisonTimesChanged = [...rowState.comparisonTimesChanged];
        comparisonTimesChanged[comparisonIndex] = false;
        setRowState({ ...rowState, comparisonTimesChanged });
    }
}

function getSegmentRow(
    editorState: LiveSplit.RunEditorStateJson,
    segmentIndex: number,
): LiveSplit.RunEditorSegmentRowJson | undefined {
    return editorState.rows.find(
        (row): row is LiveSplit.RunEditorSegmentRowJson =>
            row.kind === "Segment" && row.segment_index === segmentIndex,
    );
}
