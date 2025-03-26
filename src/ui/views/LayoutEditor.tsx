import React, { useState } from "react";
import * as LiveSplit from "../../livesplit-core";
import { SettingsComponent } from "../components/Settings";
import { UrlCache } from "../../util/UrlCache";
import Layout from "../components/Layout";
import { WebRenderer } from "../../livesplit-core/livesplit_core";
import { GeneralSettings } from "./MainSettings";
import { LSOCommandSink } from "../LSOCommandSink";
import {
    ContextMenu,
    MenuItem,
    Separator,
    Position,
} from "../components/ContextMenu";
import { ArrowDown, ArrowUp, Check, Copy, Plus, Trash, X } from "lucide-react";

import "../../css/LayoutEditor.scss";

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
export interface State {
    editor: LiveSplit.LayoutEditorStateJson;
    showComponentSettings: boolean;
}

interface Callbacks {
    onResize(width: number, height: number): void;
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    closeLayoutEditor(save: boolean): void;
}

export class LayoutEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            editor: props.editor.stateAsJson(
                props.layoutEditorUrlCache.imageCache,
            ),
            showComponentSettings: true,
        };

        props.layoutEditorUrlCache.collect();
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(
            renderedView,
            sidebarContent,
        );
    }

    private renderView() {
        const components = this.state.editor.components.map((c, i) => {
            let className = "layout-editor-component";
            if (i === this.state.editor.selected_component) {
                className += " selected";
            }
            return (
                <tr
                    key={i}
                    onClick={(_) => this.selectComponent(i)}
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", "");
                        this.props.editor.select(i);
                        this.update();
                    }}
                    onDragOver={(e) => {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        e.dataTransfer.dropEffect = "move";
                    }}
                    onDragEnd={(_) => this.update()}
                    onDrop={(e) => {
                        if (e.stopPropagation) {
                            e.stopPropagation();
                        }
                        this.props.editor.moveComponent(i);
                        return false;
                    }}
                >
                    <td className={className}>{c}</td>
                </tr>
            );
        });

        const settings = this.state.showComponentSettings ? (
            <SettingsComponent
                context={`component-settings$${this.state.editor.selected_component}`}
                factory={LiveSplit.SettingValue}
                state={this.state.editor.component_settings}
                editorUrlCache={this.props.layoutEditorUrlCache}
                allComparisons={this.props.allComparisons}
                allVariables={this.props.allVariables}
                setValue={(index, value) => {
                    this.props.editor.setComponentSettingsValue(index, value);
                    this.update();
                }}
            />
        ) : (
            <SettingsComponent
                context={`layout-settings`}
                factory={LiveSplit.SettingValue}
                state={this.state.editor.general_settings}
                editorUrlCache={this.props.layoutEditorUrlCache}
                allComparisons={this.props.allComparisons}
                allVariables={this.props.allVariables}
                setValue={(index, value) => {
                    this.props.editor.setGeneralSettingsValue(
                        index,
                        value,
                        this.props.layoutEditorUrlCache.imageCache,
                    );
                    this.update();
                }}
            />
        );

        return (
            <div className="layout-editor-outer">
                <div className="layout-editor-inner-container">
                    <div className="layout-editor-inner">
                        <div className="btn-group">
                            <AddComponentButton
                                allVariables={this.props.allVariables}
                                addVariable={(v) => this.addVariable(v)}
                                addComponent={(v) => this.addComponent(v)}
                            />
                            <button
                                aria-label="Remove Component"
                                onClick={(_) => this.removeComponent()}
                                disabled={!this.state.editor.buttons.can_remove}
                            >
                                <Trash strokeWidth={2.5} />
                            </button>
                            <button
                                aria-label="Duplicate Component"
                                onClick={(_) => this.duplicateComponent()}
                            >
                                <Copy strokeWidth={2.5} />
                            </button>
                            <button
                                aria-label="Move Component Up"
                                onClick={(_) => this.moveComponentUp()}
                                disabled={
                                    !this.state.editor.buttons.can_move_up
                                }
                            >
                                <ArrowUp strokeWidth={2.5} />
                            </button>
                            <button
                                aria-label="Move Component Down"
                                onClick={(_) => this.moveComponentDown()}
                                disabled={
                                    !this.state.editor.buttons.can_move_down
                                }
                            >
                                <ArrowDown strokeWidth={2.5} />
                            </button>
                        </div>
                        <table className="layout-editor-component-list table">
                            <tbody className="table-body">{components}</tbody>
                        </table>
                    </div>
                    <div className="tab-bar layout-editor-tabs">
                        <button
                            className={
                                "toggle-left" +
                                (!this.state.showComponentSettings
                                    ? " button-pressed"
                                    : "")
                            }
                            onClick={(_) => {
                                this.setState({
                                    showComponentSettings: false,
                                });
                            }}
                        >
                            Layout
                        </button>
                        <button
                            className={
                                "toggle-right" +
                                (this.state.showComponentSettings
                                    ? " button-pressed"
                                    : "")
                            }
                            onClick={(_) => {
                                this.setState({
                                    showComponentSettings: true,
                                });
                            }}
                        >
                            Component
                        </button>
                    </div>
                    <div>{settings}</div>
                </div>
                <div className="layout-container">
                    <Layout
                        getState={() => {
                            this.props.commandSink.updateLayoutEditorLayoutState(
                                this.props.editor,
                                this.props.layoutState,
                                this.props.layoutUrlCache.imageCache,
                            );
                            this.props.layoutUrlCache.collect();
                            return this.props.layoutState;
                        }}
                        layoutUrlCache={this.props.layoutUrlCache}
                        allowResize={this.props.isDesktop}
                        width={this.props.layoutWidth}
                        height={this.props.layoutHeight}
                        generalSettings={this.props.generalSettings}
                        renderer={this.props.renderer}
                        onResize={(width, height) =>
                            this.props.callbacks.onResize(width, height)
                        }
                    />
                </div>
            </div>
        );
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Layout Editor</h1>
                <hr />
                <div className="small">
                    <button
                        className="toggle-left"
                        onClick={(_) =>
                            this.props.callbacks.closeLayoutEditor(true)
                        }
                    >
                        <Check strokeWidth={2.5} /> OK
                    </button>
                    <button
                        className="toggle-right"
                        onClick={(_) =>
                            this.props.callbacks.closeLayoutEditor(false)
                        }
                    >
                        <X strokeWidth={2.5} /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    private update(showComponentSettings?: boolean) {
        this.setState({
            editor: this.props.editor.stateAsJson(
                this.props.layoutEditorUrlCache.imageCache,
            ),
            showComponentSettings:
                showComponentSettings ?? this.state.showComponentSettings,
        });
        this.props.layoutEditorUrlCache.collect();
    }

    private selectComponent(i: number) {
        this.props.editor.select(i);
        this.update(true);
    }

    private addComponent(componentClass: any) {
        this.props.editor.addComponent(componentClass.new().intoGeneric());
        this.update(true);
    }

    private addVariable(name: string) {
        const textComponent = LiveSplit.TextComponent.new();
        textComponent.useVariable(name, true);
        this.props.editor.addComponent(textComponent.intoGeneric());
        this.update(true);
    }

    private removeComponent() {
        this.props.editor.removeComponent();
        this.update();
    }

    private moveComponentUp() {
        this.props.editor.moveComponentUp();
        this.update();
    }

    private moveComponentDown() {
        this.props.editor.moveComponentDown();
        this.update();
    }

    private duplicateComponent() {
        this.props.editor.duplicateComponent();
        this.update();
    }
}

function AddComponentButton({
    allVariables,
    addVariable,
    addComponent,
}: {
    allVariables: Set<string>;
    addVariable: (name: string) => void;
    addComponent: (componentClass: any) => void;
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
                        className="contextmenu-item tooltip"
                        onClick={() => addComponent(LiveSplit.TitleComponent)}
                    >
                        Title
                        <span className="tooltip-text">
                            Shows the name of the game and the category that is
                            being run. Additionally, the game icon, the attempt
                            count, and the total number of successfully finished
                            runs can be shown.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() => addComponent(LiveSplit.GraphComponent)}
                    >
                        Graph
                        <span className="tooltip-text">
                            Visualizes how far the current run has been ahead or
                            behind the chosen comparison throughout the whole
                            run. All the individual deltas are shown as points
                            on the graph.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() => addComponent(LiveSplit.SplitsComponent)}
                    >
                        Splits
                        <span className="tooltip-text">
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
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.DetailedTimerComponent)
                        }
                    >
                        Detailed Timer
                        <span className="tooltip-text">
                            Shows two timers, one for the total time of the
                            current run and one showing the time of just the
                            current segment. Other information, like segment
                            times of up to two comparisons, the segment icon,
                            and the segment name, can also be shown.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() => addComponent(LiveSplit.TimerComponent)}
                    >
                        Timer
                        <span className="tooltip-text">
                            Shows the total time of the current run as a digital
                            clock. The color of the time shown is based on a how
                            well the current run is doing compared to the chosen
                            comparison.
                        </span>
                    </MenuItem>
                    <Separator />
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.CurrentComparisonComponent)
                        }
                    >
                        Current Comparison
                        <span className="tooltip-text">
                            Shows the name of the comparison that the timer is
                            currently comparing against.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.CurrentPaceComponent)
                        }
                    >
                        Current Pace
                        <span className="tooltip-text">
                            Shows a prediction for the current run's final time.
                            The remainder of the run is predicted based on the
                            chosen comparison for the component. For example,
                            the "Best Segments" comparison can be chosen to show
                            the best possible final time for the current run
                            based on the Sum of Best Segments.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() => addComponent(LiveSplit.DeltaComponent)}
                    >
                        Delta
                        <span className="tooltip-text">
                            Shows how far ahead or behind the current run is
                            compared to the chosen comparison.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.PbChanceComponent)
                        }
                    >
                        PB Chance
                        <span className="tooltip-text">
                            Shows how likely it is for the active run to beat
                            the personal best. If there is no active run, it
                            shows the general chance of beating the personal
                            best. During a run, it actively changes based on how
                            well the run is going.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.PossibleTimeSaveComponent)
                        }
                    >
                        Possible Time Save
                        <span className="tooltip-text">
                            Shows how much time you can save on the current
                            segment compared to the chosen comparison, based on
                            the best segment time of the segment. This component
                            also allows showing the "Total Possible Time Save"
                            for the remainder of the current run.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.PreviousSegmentComponent)
                        }
                    >
                        Previous Segment
                        <span className="tooltip-text">
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
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.SegmentTimeComponent)
                        }
                    >
                        Segment Time
                        <span className="tooltip-text">
                            Shows the time for the current segment for the
                            chosen comparison. If no comparison is specified it
                            uses the timer's current comparison.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.SumOfBestComponent)
                        }
                    >
                        Sum of Best Segments
                        <span className="tooltip-text">
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
                        className="contextmenu-item tooltip"
                        onClick={() => addComponent(LiveSplit.TextComponent)}
                    >
                        Text
                        <span className="tooltip-text">
                            Shows the text that you specify. This can either be
                            a single centered text, or split up into a left and
                            right text, which is suitable for a situation where
                            you have a label and a value. There is also the
                            option of showing a custom variable that you specify
                            in the splits editor.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.TotalPlaytimeComponent)
                        }
                    >
                        Total Playtime
                        <span className="tooltip-text">
                            Shows the total amount of time that the current
                            category has been played for.
                        </span>
                    </MenuItem>
                    {allVariables.size > 0 && <Separator />}
                    {allVariables.size > 0 &&
                        Array.from(allVariables).map((name) => {
                            return (
                                <MenuItem
                                    className="contextmenu-item tooltip"
                                    key={name}
                                    onClick={() => addVariable(name)}
                                >
                                    {name}
                                    <span className="tooltip-text">
                                        Creates a text component that shows the
                                        value of the custom variable "{name}".
                                    </span>
                                </MenuItem>
                            );
                        })}
                    <Separator />
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.BlankSpaceComponent)
                        }
                    >
                        Blank Space
                        <span className="tooltip-text">
                            An empty component that doesn't show anything other
                            than a background. It mostly serves as padding
                            between other components.
                        </span>
                    </MenuItem>
                    <MenuItem
                        className="contextmenu-item tooltip"
                        onClick={() =>
                            addComponent(LiveSplit.SeparatorComponent)
                        }
                    >
                        Separator
                        <span className="tooltip-text">
                            A simple component that just renders a separator
                            between components.
                        </span>
                    </MenuItem>
                </ContextMenu>
            )}
        </>
    );
}
