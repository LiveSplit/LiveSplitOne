import React, { useState } from "react";
import * as LiveSplit from "../../livesplit-core";
import { SettingsComponent } from "../components/Settings";
import { UrlCache } from "../../util/UrlCache";
import Layout from "../components/Layout";
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

import * as classes from "../../css/LayoutEditor.module.scss";
import * as buttonGroupClasses from "../../css/ButtonGroup.module.scss";
import * as tableClasses from "../../css/Table.module.scss";
import * as tooltipClasses from "../../css/Tooltip.module.scss";

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
        <SideBar callbacks={props.callbacks} />,
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
    const [state, setState] = useState(() => {
        const state = editor.stateAsJson(layoutEditorUrlCache.imageCache);
        layoutEditorUrlCache.collect();
        return state as LiveSplit.LayoutEditorStateJson;
    });
    const [showComponentSettings, setShowComponentSettings] = useState(true);

    const updateState = () => {
        setState(editor.stateAsJson(layoutEditorUrlCache.imageCache));
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
                        />
                        <button
                            aria-label="Remove Component"
                            onClick={removeComponent}
                            disabled={!state.buttons.can_remove}
                        >
                            <Trash strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label="Duplicate Component"
                            onClick={duplicateComponent}
                        >
                            <Copy strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label="Move Component Up"
                            onClick={moveComponentUp}
                            disabled={!state.buttons.can_move_up}
                        >
                            <ArrowUp strokeWidth={2.5} />
                        </button>
                        <button
                            aria-label="Move Component Down"
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
                        Layout
                    </button>
                    <button
                        className={
                            showComponentSettings
                                ? buttonGroupClasses.pressed
                                : ""
                        }
                        onClick={(_) => setShowComponentSettings(true)}
                    >
                        Component
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
                />
            </div>
        </div>
    );
}

export function SideBar({ callbacks }: { callbacks: Callbacks }) {
    return (
        <>
            <h1>Layout Editor</h1>
            <hr />
            <div className={buttonGroupClasses.group}>
                <button onClick={(_) => callbacks.closeLayoutEditor(true)}>
                    <Check strokeWidth={2.5} /> OK
                </button>
                <button onClick={(_) => callbacks.closeLayoutEditor(false)}>
                    <X strokeWidth={2.5} /> Cancel
                </button>
            </div>
        </>
    );
}

function AddComponentButton({
    allVariables,
    addVariable,
    addComponent,
}: {
    allVariables: Set<string>;
    addVariable: (name: string) => void;
    addComponent: (componentClass: ComponentClass) => void;
}) {
    const [position, setPosition] = useState<Position | null>(null);

    return (
        <>
            <button
                aria-label="Add Component"
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
                    >
                        Title
                        <span className={tooltipClasses.tooltipText}>
                            Shows the name of the game and the category that is
                            being run. Additionally, the game icon, the attempt
                            count, and the total number of successfully finished
                            runs can be shown.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.GraphComponent)}
                    >
                        Graph
                        <span className={tooltipClasses.tooltipText}>
                            Visualizes how far the current run has been ahead or
                            behind the chosen comparison throughout the whole
                            run. All the individual deltas are shown as points
                            on the graph.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.SplitsComponent)}
                    >
                        Splits
                        <span className={tooltipClasses.tooltipText}>
                            The main component for visualizing all the split
                            times. Each segment is shown in a tabular fashion
                            showing the segment icon, segment name, the delta
                            compared to the chosen comparison, and the split
                            time. The list provides scrolling functionality, so
                            not every segment needs to be shown all the time.
                        </span>
                    </MenuItem>
                    <Separator />
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.DetailedTimerComponent)
                        }
                    >
                        Detailed Timer
                        <span className={tooltipClasses.tooltipText}>
                            Shows two timers, one for the total time of the
                            current run and one showing the time of just the
                            current segment. Other information, like segment
                            times of up to two comparisons, the segment icon,
                            and the segment name, can also be shown.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.TimerComponent)}
                    >
                        Timer
                        <span className={tooltipClasses.tooltipText}>
                            Shows the total time of the current run as a digital
                            clock. The color of the time shown is based on a how
                            well the current run is doing compared to the chosen
                            comparison.
                        </span>
                    </MenuItem>
                    <Separator />
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.CurrentComparisonComponent)
                        }
                    >
                        Current Comparison
                        <span className={tooltipClasses.tooltipText}>
                            Shows the name of the comparison that the timer is
                            currently comparing against.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.CurrentPaceComponent)
                        }
                    >
                        Current Pace
                        <span className={tooltipClasses.tooltipText}>
                            Shows a prediction for the current run's final time.
                            The remainder of the run is predicted based on the
                            chosen comparison for the component. For example,
                            the "Best Segments" comparison can be chosen to show
                            the best possible final time for the current run
                            based on the Sum of Best Segments.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.DeltaComponent)}
                    >
                        Delta
                        <span className={tooltipClasses.tooltipText}>
                            Shows how far ahead or behind the current run is
                            compared to the chosen comparison.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.PbChanceComponent)
                        }
                    >
                        PB Chance
                        <span className={tooltipClasses.tooltipText}>
                            Shows how likely it is for the active run to beat
                            the personal best. If there is no active run, it
                            shows the general chance of beating the personal
                            best. During a run, it actively changes based on how
                            well the run is going.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.PossibleTimeSaveComponent)
                        }
                    >
                        Possible Time Save
                        <span className={tooltipClasses.tooltipText}>
                            Shows how much time you can save on the current
                            segment compared to the chosen comparison, based on
                            the best segment time of the segment. This component
                            also allows showing the "Total Possible Time Save"
                            for the remainder of the current run.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.PreviousSegmentComponent)
                        }
                    >
                        Previous Segment
                        <span className={tooltipClasses.tooltipText}>
                            Shows how much time was saved or lost during the
                            previous segment based on the chosen comparison.
                            Additionally, the potential time save for the
                            previous segment can be displayed. This component
                            switches to a "Live Segment" view that shows the
                            active time loss whenever you are losing time on the
                            current segment.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.SegmentTimeComponent)
                        }
                    >
                        Segment Time
                        <span className={tooltipClasses.tooltipText}>
                            Shows the time for the current segment for the
                            chosen comparison. If no comparison is specified it
                            uses the timer's current comparison.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.SumOfBestComponent)
                        }
                    >
                        Sum of Best Segments
                        <span className={tooltipClasses.tooltipText}>
                            Shows the fastest possible time to complete a run of
                            the current category, based on information collected
                            from all the previous runs. This often matches up
                            with the sum of the best segment times of all the
                            segments, but that may not always be the case, as
                            skipped segments may introduce combined segments
                            that may be faster than the actual sum of their best
                            segment times. The name is therefore a bit
                            misleading, but sticks around for historical
                            reasons.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() => addComponent(LiveSplit.TextComponent)}
                    >
                        Text
                        <span className={tooltipClasses.tooltipText}>
                            Shows the text that you specify. This can either be
                            a single centered text, or split up into a left and
                            right text, which is suitable for a situation where
                            you have a label and a value. There is also the
                            option of showing a custom variable that you specify
                            in the splits editor.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.TotalPlaytimeComponent)
                        }
                    >
                        Total Playtime
                        <span className={tooltipClasses.tooltipText}>
                            Shows the total amount of time that the current
                            category has been played for.
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
                                >
                                    {name}
                                    <span
                                        className={tooltipClasses.tooltipText}
                                    >
                                        Creates a text component that shows the
                                        value of the custom variable "{name}".
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
                    >
                        Blank Space
                        <span className={tooltipClasses.tooltipText}>
                            An empty component that doesn't show anything other
                            than a background. It mostly serves as padding
                            between other components.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className={`${tooltipClasses.contextMenuItem} ${tooltipClasses.tooltip}`}
                        onClick={() =>
                            addComponent(LiveSplit.SeparatorComponent)
                        }
                    >
                        Separator
                        <span className={tooltipClasses.tooltipText}>
                            A simple component that just renders a separator
                            between components.
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </>
    );
}
