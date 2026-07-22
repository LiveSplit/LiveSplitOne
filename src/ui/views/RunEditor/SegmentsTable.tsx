import React, { useRef, useState } from "react";
import * as LiveSplit from "../../../livesplit-core";
import { Label, orAutoLang, resolve } from "../../../localization";
import { UrlCache } from "../../../util/UrlCache";
import {
    changeSegmentGroupIcon,
    changeSegmentIcon,
    CustomComparison,
    removeSegmentGroupIcon,
    removeSegmentIcon,
    SegmentIcon,
} from "./SegmentTableCells";

import classes from "../../../css/RunEditor.module.css";
import tableClasses from "../../../css/Table.module.css";

interface RowState {
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

type SegmentSelectionState = LiveSplit.RunEditorSegmentRowJson["selected"];

function commitFocusedInputBeforeSelectionChange() {
    const focusedElement = document.activeElement;
    if (focusedElement instanceof HTMLInputElement) {
        // The time editors deliberately commit their parsed value on blur. A
        // group header prevents the browser's default mouse-down behavior so
        // that the header itself never takes focus, which also suppresses the
        // browser-generated blur. Trigger it explicitly while the old segment
        // is still active; its handler runs synchronously and commits the edit
        // before selecting the group's range resets the row-local draft state.
        focusedElement.blur();
    }
}

function selectSegmentGroup(
    editor: LiveSplit.RunEditorRefMut,
    groupIndex: number,
    rowState: RowState,
    setRowState: React.Dispatch<React.SetStateAction<RowState>>,
    update: () => LiveSplit.RunEditorStateJson,
) {
    if (!editor.selectSegmentGroup(groupIndex)) {
        return;
    }

    const state = update();
    setFocusedSegmentRowState(
        state,
        getActiveSegmentIndex(state, rowState.index),
        rowState,
        setRowState,
    );
    return state;
}

export function SegmentsTable({
    editor,
    editorState,
    runEditorUrlCache,
    maybeUpdate,
    update,
    renameComparison,
    copyComparison,
    lang,
}: {
    editor: LiveSplit.RunEditorRefMut;
    editorState: LiveSplit.RunEditorStateJson;
    runEditorUrlCache: UrlCache;
    maybeUpdate: () => void;
    update: () => LiveSplit.RunEditorStateJson;
    renameComparison: (comparison: string) => void;
    copyComparison: (comparison: string) => void;
    lang: LiveSplit.Language | undefined;
}) {
    const [dragIndex, setDragIndex] = useState(0);
    const skipNextFocusedSegmentSelection = useRef(false);
    const segmentNameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [rowState, setRowState] = useState<RowState>(() => ({
        bestSegmentTime: "",
        bestSegmentTimeChanged: false,
        comparisonTimes: [],
        comparisonTimesChanged: [],
        index: 0,
        segmentTime: "",
        segmentTimeChanged: false,
        splitTime: "",
        splitTimeChanged: false,
    }));

    const handleSegmentInputMouseDown = (
        event: React.MouseEvent<HTMLInputElement, MouseEvent>,
        index: number,
        selectionState: SegmentSelectionState,
    ) => {
        event.stopPropagation();

        const preserveCurrentFocus = shouldPreserveCurrentFocus(
            event,
            selectionState,
        );
        const focusClickedRow = shouldFocusClickedRow(event, selectionState);

        if (event.shiftKey || preserveCurrentFocus) {
            event.preventDefault();
        }

        skipNextFocusedSegmentSelection.current = focusClickedRow;

        changeSegmentSelection(
            event,
            index,
            selectionState,
            editor,
            rowState,
            setRowState,
            update,
        );

        if (event.shiftKey && focusClickedRow) {
            event.currentTarget.focus();
        }
    };

    const handleSegmentInputClick = (
        event: React.MouseEvent<HTMLInputElement, MouseEvent>,
    ) => {
        // Input selection is already handled on mousedown so the row's click
        // handler must not run again on mouseup.
        event.stopPropagation();
    };

    const handleSegmentRowMouseDown = (
        event: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
        index: number,
        selectionState: SegmentSelectionState,
    ) => {
        const preserveCurrentFocus = shouldPreserveCurrentFocus(
            event,
            selectionState,
        );
        const focusClickedRow = shouldFocusClickedRow(event, selectionState);

        if (event.shiftKey || preserveCurrentFocus) {
            // Modifier-based selection should not trigger native text selection
            // behavior or move focus away from the currently edited field.
            event.preventDefault();
        }

        skipNextFocusedSegmentSelection.current = focusClickedRow;

        changeSegmentSelection(
            event,
            index,
            selectionState,
            editor,
            rowState,
            setRowState,
            update,
        );

        if (focusClickedRow) {
            segmentNameInputRefs.current[index]?.focus();
        }
    };

    const columnCount = 5 + editorState.comparison_names.length;

    return (
        <table className={`${classes.runEditorTab} ${classes.runEditorTable}`}>
            <thead className={classes.tableHeader}>
                <tr>
                    <th>{resolve(Label.Icon, lang)}</th>
                    <th>{resolve(Label.SegmentName, lang)}</th>
                    <th>{resolve(Label.SplitTime, lang)}</th>
                    <th>{resolve(Label.SegmentTime, lang)}</th>
                    <th>{resolve(Label.BestSegment, lang)}</th>
                    {editorState.comparison_names.map(
                        (comparison, comparisonIndex) => {
                            return (
                                <CustomComparison
                                    comparison={comparison}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData(
                                            "text/plain",
                                            "",
                                        );
                                        setDragIndex(comparisonIndex);
                                    }}
                                    onDragEnd={(_) => update()}
                                    onDrop={(e) => {
                                        if (e.stopPropagation) {
                                            e.stopPropagation();
                                        }
                                        editor.moveComparison(
                                            dragIndex,
                                            comparisonIndex,
                                        );
                                        // No update necessary, as we do it in onDragEnd.
                                        return false;
                                    }}
                                    renameComparison={() =>
                                        renameComparison(comparison)
                                    }
                                    copyComparison={() =>
                                        copyComparison(comparison)
                                    }
                                    removeComparison={() => {
                                        editor.removeComparison(comparison);
                                        update();
                                    }}
                                    lang={lang}
                                />
                            );
                        },
                    )}
                </tr>
            </thead>
            <tbody className={tableClasses.tableBody}>
                {editorState.rows.map((row) => {
                    if (row.kind === "SegmentGroup") {
                        const groupIndex = row.group_index;

                        return (
                            <tr
                                key={`group-${groupIndex}`}
                                className={[
                                    classes.segmentGroupHeader,
                                    row.selected ? tableClasses.selected : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onMouseDown={(e) => {
                                    commitFocusedInputBeforeSelectionChange();
                                    e.preventDefault();
                                    selectSegmentGroup(
                                        editor,
                                        groupIndex,
                                        rowState,
                                        setRowState,
                                        update,
                                    );
                                }}
                            >
                                <SegmentIcon
                                    segmentIcon={runEditorUrlCache.cache(
                                        row.icon,
                                    )}
                                    changeSegmentIcon={() =>
                                        changeSegmentGroupIcon(
                                            groupIndex,
                                            editor,
                                            maybeUpdate,
                                            lang,
                                        )
                                    }
                                    removeSegmentIcon={() =>
                                        removeSegmentGroupIcon(
                                            groupIndex,
                                            editor,
                                            update,
                                        )
                                    }
                                    className={classes.segmentGroupHeaderIcon}
                                    isPlaceholder={!row.has_explicit_icon}
                                    canRemoveIcon={row.has_explicit_icon}
                                    lang={lang}
                                />
                                <td colSpan={columnCount - 1}>
                                    <input
                                        className={`${tableClasses.textBox} ${classes.segmentGroupHeaderInput}`}
                                        type="text"
                                        value={row.explicit_name ?? ""}
                                        placeholder={row.name}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(_) =>
                                            selectSegmentGroup(
                                                editor,
                                                groupIndex,
                                                rowState,
                                                setRowState,
                                                update,
                                            )
                                        }
                                        onChange={(e) => {
                                            editor.renameSegmentGroup(
                                                groupIndex,
                                                e.target.value,
                                            );
                                            update();
                                        }}
                                    />
                                </td>
                            </tr>
                        );
                    }

                    const s = row;
                    const segmentIndex = s.segment_index;
                    const segmentIcon = runEditorUrlCache.cache(s.icon);
                    const isSelected =
                        s.selected === "Selected" || s.selected === "Active";
                    const rowClassName = [
                        isSelected ? tableClasses.selected : "",
                        s.starts_new_section
                            ? classes.segmentGroupBoundary
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" ");
                    return (
                        <tr
                            key={`segment-${segmentIndex}`}
                            className={rowClassName}
                            onMouseDown={(e) =>
                                handleSegmentRowMouseDown(
                                    e,
                                    segmentIndex,
                                    s.selected,
                                )
                            }
                        >
                            <SegmentIcon
                                segmentIcon={segmentIcon}
                                changeSegmentIcon={() =>
                                    changeSegmentIcon(
                                        segmentIndex,
                                        editor,
                                        maybeUpdate,
                                        lang,
                                    )
                                }
                                removeSegmentIcon={() =>
                                    removeSegmentIcon(
                                        segmentIndex,
                                        editor,
                                        update,
                                    )
                                }
                                lang={lang}
                            />
                            <td
                                className={
                                    s.is_indented
                                        ? classes.segmentGroupName
                                        : ""
                                }
                            >
                                <input
                                    className={tableClasses.textBox}
                                    type="text"
                                    ref={(element) => {
                                        segmentNameInputRefs.current[
                                            segmentIndex
                                        ] = element;
                                    }}
                                    value={s.name}
                                    onClick={handleSegmentInputClick}
                                    onMouseDown={(e) =>
                                        handleSegmentInputMouseDown(
                                            e,
                                            segmentIndex,
                                            s.selected,
                                        )
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            skipNextFocusedSegmentSelection,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) => {
                                        editor.activeSetName(e.target.value);
                                        update();
                                    }}
                                />
                            </td>
                            <td>
                                <input
                                    className={`${tableClasses.number} ${tableClasses.textBox}`}
                                    type="text"
                                    value={
                                        segmentIndex === rowState.index &&
                                        rowState.splitTimeChanged
                                            ? rowState.splitTime
                                            : s.split_time
                                    }
                                    onClick={handleSegmentInputClick}
                                    onMouseDown={(e) =>
                                        handleSegmentInputMouseDown(
                                            e,
                                            segmentIndex,
                                            s.selected,
                                        )
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            skipNextFocusedSegmentSelection,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) =>
                                        setRowState({
                                            ...rowState,
                                            splitTime: e.target.value,
                                            splitTimeChanged: true,
                                        })
                                    }
                                    onBlur={(_) =>
                                        handleSplitTimeBlur(
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                            lang,
                                        )
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    className={
                                        (segmentIndex !== rowState.index ||
                                            !rowState.segmentTimeChanged) &&
                                        s.segment_time === s.best_segment_time
                                            ? `${tableClasses.number} ${tableClasses.textBox} ${classes.bestSegmentTime}`
                                            : `${tableClasses.number} ${tableClasses.textBox}`
                                    }
                                    type="text"
                                    value={
                                        segmentIndex === rowState.index &&
                                        rowState.segmentTimeChanged
                                            ? rowState.segmentTime
                                            : s.segment_time
                                    }
                                    onClick={handleSegmentInputClick}
                                    onMouseDown={(e) =>
                                        handleSegmentInputMouseDown(
                                            e,
                                            segmentIndex,
                                            s.selected,
                                        )
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            skipNextFocusedSegmentSelection,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) =>
                                        setRowState({
                                            ...rowState,
                                            segmentTime: e.target.value,
                                            segmentTimeChanged: true,
                                        })
                                    }
                                    onBlur={(_) =>
                                        handleSegmentTimeBlur(
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                            lang,
                                        )
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    className={`${tableClasses.number} ${tableClasses.textBox}`}
                                    type="text"
                                    value={
                                        segmentIndex === rowState.index &&
                                        rowState.bestSegmentTimeChanged
                                            ? rowState.bestSegmentTime
                                            : s.best_segment_time
                                    }
                                    onClick={handleSegmentInputClick}
                                    onMouseDown={(e) =>
                                        handleSegmentInputMouseDown(
                                            e,
                                            segmentIndex,
                                            s.selected,
                                        )
                                    }
                                    onFocus={(_) =>
                                        focusSegment(
                                            segmentIndex,
                                            editor,
                                            skipNextFocusedSegmentSelection,
                                            rowState,
                                            setRowState,
                                            update,
                                        )
                                    }
                                    onChange={(e) =>
                                        setRowState({
                                            ...rowState,
                                            bestSegmentTime: e.target.value,
                                            bestSegmentTimeChanged: true,
                                        })
                                    }
                                    onBlur={(_) =>
                                        handleBestSegmentTimeBlur(
                                            editor,
                                            rowState,
                                            setRowState,
                                            update,
                                            lang,
                                        )
                                    }
                                />
                            </td>
                            {s.comparison_times.map(
                                (comparisonTime, comparisonIndex) => (
                                    <td key={comparisonIndex}>
                                        <input
                                            className={`${tableClasses.number} ${tableClasses.textBox}`}
                                            type="text"
                                            value={
                                                segmentIndex ===
                                                    rowState.index &&
                                                rowState.comparisonTimesChanged[
                                                    comparisonIndex
                                                ]
                                                    ? rowState.comparisonTimes[
                                                          comparisonIndex
                                                      ]
                                                    : comparisonTime
                                            }
                                            onClick={handleSegmentInputClick}
                                            onMouseDown={(e) =>
                                                handleSegmentInputMouseDown(
                                                    e,
                                                    segmentIndex,
                                                    s.selected,
                                                )
                                            }
                                            onFocus={(_) =>
                                                focusSegment(
                                                    segmentIndex,
                                                    editor,
                                                    skipNextFocusedSegmentSelection,
                                                    rowState,
                                                    setRowState,
                                                    update,
                                                )
                                            }
                                            onChange={(e) => {
                                                const comparisonTimes = [
                                                    ...rowState.comparisonTimes,
                                                ];
                                                comparisonTimes[
                                                    comparisonIndex
                                                ] = e.target.value;
                                                const comparisonTimesChanged = [
                                                    ...rowState.comparisonTimesChanged,
                                                ];
                                                comparisonTimesChanged[
                                                    comparisonIndex
                                                ] = true;

                                                setRowState({
                                                    ...rowState,
                                                    comparisonTimes,
                                                    comparisonTimesChanged,
                                                });
                                            }}
                                            onBlur={(_) =>
                                                handleComparisonTimeBlur(
                                                    comparisonIndex,
                                                    editor,
                                                    editorState,
                                                    rowState,
                                                    setRowState,
                                                    update,
                                                    lang,
                                                )
                                            }
                                        />
                                    </td>
                                ),
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

function changeSegmentSelection(
    event:
        | React.MouseEvent<HTMLElement, MouseEvent>
        | React.MouseEvent<HTMLTableRowElement, MouseEvent>,
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

function shouldPreserveCurrentFocus(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    selectionState: SegmentSelectionState,
) {
    return (event.ctrlKey || event.metaKey) && selectionState === "Selected";
}

function shouldFocusClickedRow(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    selectionState: SegmentSelectionState,
) {
    if (event.shiftKey) {
        return true;
    }

    if (event.ctrlKey || event.metaKey) {
        return selectionState !== "Selected";
    }

    return true;
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

function getActiveSegmentIndex(
    editorState: LiveSplit.RunEditorStateJson,
    fallbackIndex: number,
) {
    const activeSegment = editorState.rows.find(
        (row): row is LiveSplit.RunEditorSegmentRowJson =>
            row.kind === "Segment" && row.selected === "Active",
    );

    return activeSegment?.segment_index ?? fallbackIndex;
}

function focusSegment(
    index: number,
    editor: LiveSplit.RunEditorRefMut,
    skipNextFocusedSegmentSelection: React.MutableRefObject<boolean>,
    rowState: RowState,
    setRowState: (rowState: RowState) => void,
    update: () => LiveSplit.RunEditorStateJson,
) {
    // Mouse-based selection is handled on mousedown so modifier keys can change
    // selection without the subsequent focus event collapsing it back to a
    // single row. Keyboard focus still falls back to exclusive selection.
    if (skipNextFocusedSegmentSelection.current) {
        skipNextFocusedSegmentSelection.current = false;
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

function setFocusedSegmentRowState(
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

function handleSplitTimeBlur(
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

function handleSegmentTimeBlur(
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

function handleBestSegmentTimeBlur(
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

function handleComparisonTimeBlur(
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
