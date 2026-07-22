import React from "react";
import { toast } from "react-toastify";

import * as LiveSplit from "../../../livesplit-core";
import { FILE_EXT_IMAGES, openFileAsArrayBuffer } from "../../../util/FileUtil";
import { Label, resolve } from "../../../localization";
import { ContextMenu, MenuItem, Position } from "../../components/ContextMenu";

import classes from "../../../css/RunEditor.module.css";
import tooltipClasses from "../../../css/Tooltip.module.css";

export function SegmentIcon({
    segmentIcon,
    changeSegmentIcon,
    removeSegmentIcon,
    className,
    isPlaceholder = false,
    canRemoveIcon = true,
    lang,
}: {
    segmentIcon: string | undefined;
    changeSegmentIcon: () => void;
    removeSegmentIcon: () => void;
    className?: string;
    isPlaceholder?: boolean;
    canRemoveIcon?: boolean;
    lang: LiveSplit.Language | undefined;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <td
            className={[classes.segmentIconContainer, className]
                .filter(Boolean)
                .join(" ")}
            onClick={(e) => {
                if (position !== null) {
                    return;
                }
                if (segmentIcon !== undefined) {
                    setPosition({ x: e.clientX, y: e.clientY });
                } else {
                    changeSegmentIcon();
                }
            }}
        >
            {segmentIcon !== undefined && (
                <img
                    className={
                        isPlaceholder ? classes.placeholderSegmentIcon : ""
                    }
                    src={segmentIcon}
                />
            )}
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={changeSegmentIcon}
                        lang={lang}
                    >
                        {resolve(Label.SetSegmentIcon, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.SetSegmentIconDescription, lang)}
                        </span>
                    </MenuItem>
                    {canRemoveIcon && (
                        <MenuItem
                            className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                            onClick={removeSegmentIcon}
                            lang={lang}
                        >
                            {resolve(Label.RemoveSegmentIcon, lang)}
                            <span className={tooltipClasses.tooltipText}>
                                {resolve(
                                    Label.RemoveSegmentIconDescription,
                                    lang,
                                )}
                            </span>
                        </MenuItem>
                    )}
                </ContextMenu>
            )}
        </td>
    );
}

export function CustomComparison({
    comparison,
    onDragStart,
    onDragEnd,
    onDrop,
    renameComparison,
    copyComparison,
    removeComparison,
    lang,
}: {
    comparison: string;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    renameComparison: () => void;
    copyComparison: () => void;
    removeComparison: () => void;
    lang: LiveSplit.Language | undefined;
}) {
    const [position, setPosition] = React.useState<Position | null>(null);

    return (
        <th
            style={{
                cursor: "pointer",
            }}
            onClick={(e) => {
                if (position === null) {
                    setPosition({ x: e.clientX, y: e.clientY });
                }
            }}
            draggable
            onDragStart={onDragStart}
            onDragOver={(e) => {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                e.dataTransfer.dropEffect = "move";
            }}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
        >
            {comparison}
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={renameComparison}
                        lang={lang}
                    >
                        {resolve(Label.Rename, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.RenameDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={copyComparison}
                        lang={lang}
                    >
                        {resolve(Label.CopyAction, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.CopyDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={removeComparison}
                        lang={lang}
                    >
                        {resolve(Label.Remove, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.RemoveDescription, lang)}
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </th>
    );
}

export async function changeSegmentIcon(
    index: number,
    editor: LiveSplit.RunEditorRefMut,
    maybeUpdate: () => void,
    lang: LiveSplit.Language | undefined,
) {
    editor.selectOnly(index);
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(
            `${resolve(Label.FailedToReadFile, lang)} ${maybeFile.message}`,
        );
        return;
    }
    const [file] = maybeFile;
    // FIXME: Editor may not exist anymore if we close the view. Happens in
    // other places too.
    editor.activeSetIconFromArray(new Uint8Array(file));
    maybeUpdate();
}

export function removeSegmentIcon(
    index: number,
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    editor.selectOnly(index);
    editor.activeRemoveIcon();
    update();
}

export async function changeSegmentGroupIcon(
    groupIndex: number,
    editor: LiveSplit.RunEditorRefMut,
    maybeUpdate: () => void,
    lang: LiveSplit.Language | undefined,
) {
    const maybeFile = await openFileAsArrayBuffer(FILE_EXT_IMAGES);
    if (maybeFile === undefined) {
        return;
    }
    if (maybeFile instanceof Error) {
        toast.error(
            `${resolve(Label.FailedToReadFile, lang)} ${maybeFile.message}`,
        );
        return;
    }
    const [file] = maybeFile;
    if (editor.setSegmentGroupIconFromArray(groupIndex, new Uint8Array(file))) {
        maybeUpdate();
    }
}

export function removeSegmentGroupIcon(
    groupIndex: number,
    editor: LiveSplit.RunEditorRefMut,
    update: () => void,
) {
    if (editor.removeSegmentGroupIcon(groupIndex)) {
        update();
    }
}
