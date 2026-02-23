import React, { useState } from "react";
import * as LiveSplit from "../../livesplit-core";
import { SettingsComponent } from "../components/Settings";
import { UrlCache } from "../../util/UrlCache";
import { Layout } from "../components/Layout";
import { WebRenderer } from "../../livesplit-core/livesplit_core";
import { GeneralSettings } from "./MainSettings";
import { LSOCommandSink } from "../../util/LSOCommandSink";
import {
    ContextMenu,
    MenuItem,
    Separator,
    Position,
} from "../components/ContextMenu";
import { ArrowDown, ArrowUp, Check, Copy, Plus, Trash, X } from "lucide-react";
import { Label, orAutoLang, resolve } from "../../localization";

import classes from "../../css/LayoutEditor.module.css";
import buttonGroupClasses from "../../css/ButtonGroup.module.css";
import tableClasses from "../../css/Table.module.css";
import tooltipClasses from "../../css/Tooltip.module.css";

export interface Props {
    editor: LiveSplit.LayoutEditor;
    layoutState: LiveSplit.LayoutStateRefMut;
    layoutEditorUrlCache: UrlCache;
    layoutUrlCache: UrlCache;
    layoutWidth: number;
    layoutHeight: number;
    generalSettings: GeneralSettings;
    allComparisons: string[];
    allVariables: Set<string>;
    isDesktop: boolean;
    commandSink: LSOCommandSink;
    renderer: WebRenderer;
    callbacks: Callbacks;
}

interface Callbacks {
    onResize(width: number, height: number): void;
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    closeLayoutEditor(save: boolean): void;
}

interface ComponentClass {
    new: () => {
        intoGeneric(): LiveSplit.Component;
    };
}

export function LayoutEditor(props: Props) {
    return props.callbacks.renderViewWithSidebar(
        <View {...props} />,
        <SideBar
            callbacks={props.callbacks}
            lang={props.generalSettings.lang}
        />,
    );
}

export function View({
    editor,
    layoutState,
    layoutEditorUrlCache,
    layoutUrlCache,
    layoutWidth,
    layoutHeight,
    generalSettings,
    allComparisons,
    allVariables,
    isDesktop,
    commandSink,
    renderer,
    callbacks,
}: Props) {
    const lang = generalSettings.lang;
    const [state, setState] = useState(() => {
        const state = editor.stateAsJson(
            layoutEditorUrlCache.imageCache,
            orAutoLang(generalSettings.lang),
        );
        layoutEditorUrlCache.collect();
        return state as LiveSplit.LayoutEditorStateJson;
    });
    const [showComponentSettings, setShowComponentSettings] = useState(true);

    const updateState = () => {
        setState(
            editor.stateAsJson(
                layoutEditorUrlCache.imageCache,
                orAutoLang(generalSettings.lang),
            ),
        );
        layoutEditorUrlCache.collect();
    };

    const selectComponent = (i: number) => {
        editor.select(i);
        updateState();
        setShowComponentSettings(true);
    };
    const addComponent = (componentClass: ComponentClass) => {
        editor.addComponent(componentClass.new().intoGeneric());
        updateState();
    };
    const addVariable = (name: string) => {
        const textComponent = LiveSplit.TextComponent.new();
        textComponent.useVariable(name, true);
        editor.addComponent(textComponent.intoGeneric());
        updateState();
    };
    const removeComponent = () => {
        editor.removeComponent();
        updateState();
    };
    const moveComponentUp = () => {
        editor.moveComponentUp();
        updateState();
    };
    const moveComponentDown = () => {
        editor.moveComponentDown();
        updateState();
    };
    const duplicateComponent = () => {
        editor.duplicateComponent();
        updateState();
    };

    const components = state.components.map((c, i) => {
        let className = classes.layoutEditorComponent;
        if (i === state.selected_component) {
            className += " " + tableClasses.selected;
        }
        return (
            <tr
                key={i}
                onClick={(_) => selectComponent(i)}
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", "");
                    editor.select(i);
                    updateState();
                }}
                onDragOver={(e) => {
                    if (e.preventDefault) {
                        e.preventDefault();
                    }
                    e.dataTransfer.dropEffect = "move";
                }}
                onDragEnd={(_) => updateState()}
                onDrop={(e) => {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    editor.moveComponent(i);
                    return false;
                }}
            >
                <td className={className}>{c}</td>
            </tr>
        );
    });

    const settings = showComponentSettings ? (
        <SettingsComponent
            context={`component-settings$${state.selected_component}`}
            factory={LiveSplit.SettingValue}
            state={state.component_settings}
            editorUrlCache={layoutEditorUrlCache}
            allComparisons={allComparisons}
            allVariables={allVariables}
            lang={lang}
            setValue={(index, value) => {
                editor.setComponentSettingsValue(index, value);
                updateState();
            }}
        />
    ) : (
        <SettingsComponent
            context={`layout-settings`}
            factory={LiveSplit.SettingValue}
            state={state.general_settings}
            editorUrlCache={layoutEditorUrlCache}
            allComparisons={allComparisons}
            allVariables={allVariables}
            lang={lang}
            setValue={(index, value) => {
                editor.setGeneralSettingsValue(
                    index,
                    value,
                    layoutEditorUrlCache.imageCache,
                );
                updateState();
            }}
        />
    );

    return (
        <div className={classes.layoutEditorOuter}>
            <div className={classes.layoutEditorInnerContainer}>
                <div className={classes.layoutEditorInner}>
                    <div className={classes.btnGroup}>
                        <AddComponentButton
                            allVariables={allVariables}
                            addVariable={(v) => addVariable(v)}
                            addComponent={(v) => addComponent(v)}
                            lang={lang}
                        />
                        <button
                            aria-label={resolve(Label.RemoveComponent, lang)}
                            onClick={removeComponent}
                            disabled={!state.buttons.can_remove}
                        >
                            <Trash strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label={resolve(Label.DuplicateComponent, lang)}
                            onClick={duplicateComponent}
                        >
                            <Copy strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label={resolve(Label.MoveComponentUp, lang)}
                            onClick={moveComponentUp}
                            disabled={!state.buttons.can_move_up}
                        >
                            <ArrowUp strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label={resolve(Label.MoveComponentDown, lang)}
                            onClick={moveComponentDown}
                            disabled={!state.buttons.can_move_down}
                        >
                            <ArrowDown strokeWidth={2.5} />
                        </button>
                    </div>
                    <table className={classes.layoutEditorComponentList}>
                        <tbody className={tableClasses.tableBody}>
                            {components}
                        </tbody>
                    </table>
                </div>
                <div className={buttonGroupClasses.tabBar}>
                    <button
                        className={
                            !showComponentSettings
                                ? buttonGroupClasses.pressed
                                : ""
                        }
                        onClick={(_) => setShowComponentSettings(false)}
                    >
                        {resolve(Label.Layout, lang)}
                    </button>
                    <button
                        className={
                            showComponentSettings
                                ? buttonGroupClasses.pressed
                                : ""
                        }
                        onClick={(_) => setShowComponentSettings(true)}
                    >
                        {resolve(Label.Component, lang)}
                    </button>
                </div>
                <div>{settings}</div>
            </div>
            <div className={classes.layoutContainer}>
                <Layout
                    getState={() => {
                        commandSink.updateLayoutEditorLayoutState(
                            editor,
                            layoutState,
                            layoutUrlCache.imageCache,
                            generalSettings.lang,
                        );
                        layoutUrlCache.collect();
                        return layoutState;
                    }}
                    layoutUrlCache={layoutUrlCache}
                    allowResize={isDesktop}
                    width={layoutWidth}
                    height={layoutHeight}
                    generalSettings={generalSettings}
                    renderer={renderer}
                    onResize={(width, height) =>
                        callbacks.onResize(width, height)
                    }
                    window={window}
                />
            </div>
        </div>
    );
}

export function SideBar({
    callbacks,
    lang,
}: {
    callbacks: Callbacks;
    lang?: LiveSplit.Language;
}) {
    return (
        <>
            <h1>{resolve(Label.LayoutEditor, lang)}</h1>
            <hr />
            <div className={buttonGroupClasses.group}>
                <button onClick={(_) => callbacks.closeLayoutEditor(true)}>
                    <Check strokeWidth={2.5} />
                    {resolve(Label.Ok, lang)}
                </button>
                <button onClick={(_) => callbacks.closeLayoutEditor(false)}>
                    <X strokeWidth={2.5} />
                    {resolve(Label.Cancel, lang)}
                </button>
            </div>
        </>
    );
}

function AddComponentButton({
    allVariables,
    addVariable,
    addComponent,
    lang,
}: {
    allVariables: Set<string>;
    addVariable: (name: string) => void;
    addComponent: (componentClass: ComponentClass) => void;
    lang?: LiveSplit.Language;
}) {
    const [position, setPosition] = useState<Position | null>(null);

    return (
        <>
            <button
                aria-label={resolve(Label.AddComponent, lang)}
                onClick={(e) => setPosition({ x: e.clientX, y: e.clientY })}
            >
                <Plus strokeWidth={2.5} />
            </button>
            {position && (
                <ContextMenu
                    position={position}
                    onClose={() => setPosition(null)}
                >
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.TitleComponent)}
                        lang={lang}
                    >
                        {resolve(Label.ComponentTitle, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentTitleDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.GraphComponent)}
                        lang={lang}
                    >
                        {resolve(Label.ComponentGraph, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentGraphDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent({
                                new: () => {
                                    return LiveSplit.SplitsComponent.new(
                                        orAutoLang(lang),
                                    );
                                },
                            })
                        }
                        lang={lang}
                    >
                        {resolve(Label.Splits, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentSplitsDescription, lang)}
                        </span>
                    </MenuItem>
                    <Separator />
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.DetailedTimerComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentDetailedTimer, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentDetailedTimerDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.TimerComponent)}
                        lang={lang}
                    >
                        {resolve(Label.ComponentTimer, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentTimerDescription, lang)}
                        </span>
                    </MenuItem>
                    <Separator />
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.CurrentComparisonComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentCurrentComparison, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentCurrentComparisonDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.CurrentPaceComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentCurrentPace, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentCurrentPaceDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.DeltaComponent)}
                        lang={lang}
                    >
                        {resolve(Label.ComponentDelta, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentDeltaDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.PbChanceComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentPbChance, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentPbChanceDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.PossibleTimeSaveComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentPossibleTimeSave, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentPossibleTimeSaveDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.PreviousSegmentComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentPreviousSegment, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentPreviousSegmentDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.SegmentTimeComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentSegmentTime, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentSegmentTimeDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.SumOfBestComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentSumOfBest, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentSumOfBestDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.TextComponent)}
                        lang={lang}
                    >
                        {resolve(Label.ComponentText, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentTextDescription, lang)}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.TotalPlaytimeComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentTotalPlaytime, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentTotalPlaytimeDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    {allVariables.size > 0 && <Separator />}
                    {allVariables.size > 0 &&
                        Array.from(allVariables).map((name) => {
                            return (
                                <MenuItem
                                    className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                                    key={name}
                                    onClick={() => addVariable(name)}
                                    lang={lang}
                                >
                                    {name}
                                    <span
                                        className={tooltipClasses.tooltipText}
                                    >
                                        {resolve(
                                            Label.ComponentVariableDescription,
                                            lang,
                                        ).replace("{name}", name)}
                                    </span>
                                </MenuItem>
                            );
                        })}
                    <Separator />
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.BlankSpaceComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentBlankSpace, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(
                                Label.ComponentBlankSpaceDescription,
                                lang,
                            )}
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.SeparatorComponent)
                        }
                        lang={lang}
                    >
                        {resolve(Label.ComponentSeparator, lang)}
                        <span className={tooltipClasses.tooltipText}>
                            {resolve(Label.ComponentSeparatorDescription, lang)}
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </>
    );
}
