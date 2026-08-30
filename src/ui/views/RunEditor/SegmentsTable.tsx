import React, { useRef, useState } from "react";
import type * as LiveSplit from "../../../livesplit-core";
import { Label, resolve } from "../../../localization";
import { type UrlCache } from "../../../util/UrlCache";
import {
    changeSegmentGroupIcon,
    changeSegmentIcon,
    CustomComparison,
    removeSegmentGroupIcon,
    removeSegmentIcon,
    SegmentIcon,
} from "./SegmentTableCells";
import {
    changeSegmentSelection,
    createRowState,
    focusSegment,
    getActiveSegmentIndex,
    handleBestSegmentTimeBlur,
    handleComparisonTimeBlur,
    handleSegmentTimeBlur,
    handleSplitTimeBlur,
    type RowState,
    type SegmentSelectionState,
    setFocusedSegmentRowState,
} from "./SegmentTableRowState";

import classes from "../../../css/RunEditor.module.css";
import tableClasses from "../../../css/Table.module.css";

type SegmentGroupSelectionMode = "Exclusive" | "Toggle" | "Range";

function commitFocusedInputBeforeSelectionChange() {
    const focusedElement = document.activeElement;
    if (focusedElement instanceof HTMLInputElement) {
        // Time editors commit through livesplit-core's `active_*` APIs on blur.
        // Row selection moved to mouse-down to support modifier selection, but
        // the browser normally blurs the old input only after mouse-down. Blur
        // it explicitly so its handler still sees the segment that owns the
        // draft, before selection changes the active segment and clears the
        // shared row-local edit state.
        focusedElement.blur();
        return focusedElement;
    }

    return undefined;
}

function selectSegmentGroup(
    editor: LiveSplit.RunEditorRefMut,
    groupIndex: number,
    selectionMode: SegmentGroupSelectionMode,
    rowState: RowState,
    setRowState: React.Dispatch<React.SetStateAction<RowState>>,
    update: () => LiveSplit.RunEditorStateJson,
) {
    // Group membership and the Run Editor's non-empty-selection invariant are
    // backend concerns. Dispatch the user's selection intent by group identity
    // instead of reconstructing or mutating the group's segment range here.
    const selectionSucceeded =
        selectionMode === "Range"
            ? editor.selectSegmentGroupRange(groupIndex)
            : selectionMode === "Toggle"
              ? editor.toggleSegmentGroupSelection(groupIndex)
              : editor.selectSegmentGroup(groupIndex);
    if (!selectionSucceeded) {
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

function segmentGroupSelectionMode(
    event: React.MouseEvent<HTMLElement, MouseEvent>,
): SegmentGroupSelectionMode {
    if (event.shiftKey) {
        return "Range";
    }
    if (event.ctrlKey || event.metaKey) {
        return "Toggle";
    }
    return "Exclusive";
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
    const skipNextFocusedSelection = useRef(false);
    const segmentNameInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [rowState, setRowState] = useState<RowState>(createRowState);

    const handleSegmentInputMouseDown = (
        event: React.MouseEvent<HTMLInputElement, MouseEvent>,
        index: number,
        selectionState: SegmentSelectionState,
    ) => {
        const previouslyFocusedInput =
            commitFocusedInputBeforeSelectionChange();
        event.stopPropagation();

        const preserveCurrentFocus = shouldPreserveCurrentFocus(
            event,
            selectionState,
        );
        const focusClickedRow = shouldFocusClickedRow(event, selectionState);

        if (event.shiftKey || preserveCurrentFocus) {
            event.preventDefault();
        }

        // Only suppress a focus event that will actually occur. An already
        // focused input does not emit another focus event, so leaving a token
        // behind here would make later keyboard navigation skip selection.
        skipNextFocusedSelection.current =
            focusClickedRow && document.activeElement !== event.currentTarget;

        changeSegmentSelection(
            event,
            index,
            selectionState,
            editor,
            rowState,
            setRowState,
            update,
        );

        if (preserveCurrentFocus && previouslyFocusedInput?.isConnected) {
            // Ctrl / Command deselection deliberately preserves the field the
            // user was editing. The explicit pre-selection blur above is only
            // needed to commit it in the correct order, so restore that focus
            // without letting its focus handler collapse the multi-selection.
            skipNextFocusedSelection.current = true;
            previouslyFocusedInput.focus({ preventScroll: true });
        } else if (event.shiftKey && focusClickedRow) {
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
        const previouslyFocusedInput =
            commitFocusedInputBeforeSelectionChange();
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

        const segmentNameInput = segmentNameInputRefs.current[index];
        skipNextFocusedSelection.current =
            focusClickedRow && document.activeElement !== segmentNameInput;

        changeSegmentSelection(
            event,
            index,
            selectionState,
            editor,
            rowState,
            setRowState,
            update,
        );

        if (preserveCurrentFocus && previouslyFocusedInput?.isConnected) {
            skipNextFocusedSelection.current = true;
            previouslyFocusedInput.focus({ preventScroll: true });
        } else if (focusClickedRow) {
            segmentNameInput?.focus();
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
                                    // A pending token belongs to a textbox
                                    // mouse-down. The header background prevents
                                    // focus and starts a new selection operation,
                                    // so it must not affect later keyboard focus.
                                    skipNextFocusedSelection.current = false;
                                    selectSegmentGroup(
                                        editor,
                                        groupIndex,
                                        segmentGroupSelectionMode(e),
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
                                        onMouseDown={(e) => {
                                            // The input stops propagation to
                                            // retain normal caret placement,
                                            // so it needs to dispatch the same
                                            // modifier-aware selection as the
                                            // surrounding header itself. Blur
                                            // first to commit a pending time
                                            // edit while its segment is active.
                                            commitFocusedInputBeforeSelectionChange();
                                            e.stopPropagation();

                                            const selectionMode =
                                                segmentGroupSelectionMode(e);
                                            const state = selectSegmentGroup(
                                                editor,
                                                groupIndex,
                                                selectionMode,
                                                rowState,
                                                setRowState,
                                                update,
                                            );
                                            // Toggling the sole selected group
                                            // succeeds but intentionally leaves
                                            // it selected, matching the current
                                            // segment's non-empty-selection rule.
                                            // Use the backend-produced state
                                            // instead of inferring the result
                                            // from the requested operation.
                                            const groupIsStillSelected =
                                                state?.rows.some(
                                                    (updatedRow) =>
                                                        updatedRow.kind ===
                                                            "SegmentGroup" &&
                                                        updatedRow.group_index ===
                                                            groupIndex &&
                                                        updatedRow.selected,
                                                ) ?? row.selected;
                                            const groupWasDeselected =
                                                row.selected &&
                                                !groupIsStillSelected;

                                            // A deselected group must not retain
                                            // an editable input. Blurring above
                                            // commits any pending edit, while
                                            // preventing the default action
                                            // keeps the mouse-down from focusing
                                            // the textbox again afterwards.
                                            if (groupWasDeselected) {
                                                e.preventDefault();
                                            }
                                            skipNextFocusedSelection.current =
                                                !groupWasDeselected &&
                                                document.activeElement !==
                                                    e.currentTarget;
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onFocus={(_) => {
                                            if (
                                                skipNextFocusedSelection.current
                                            ) {
                                                skipNextFocusedSelection.current = false;
                                                return;
                                            }
                                            // Keyboard focus has no modifier
                                            // selection to preserve, so it
                                            // activates this group exclusively.
                                            selectSegmentGroup(
                                                editor,
                                                groupIndex,
                                                "Exclusive",
                                                rowState,
                                                setRowState,
                                                update,
                                            );
                                        }}
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
                                            skipNextFocusedSelection,
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
                                            skipNextFocusedSelection,
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
                                            skipNextFocusedSelection,
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
                                            skipNextFocusedSelection,
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
                                                    skipNextFocusedSelection,
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
