import * as React from "react";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import * as LiveSplit from "../livesplit-core";
import { SettingsComponent } from "./Settings";
import { UrlCache } from "../util/UrlCache";
import Layout from "../layout/Layout";
import { WebRenderer } from "../livesplit-core/livesplit_core";
import { GeneralSettings } from "./SettingsEditor";

import "../css/LayoutEditor.scss";

export interface Props {
    editor: LiveSplit.LayoutEditor,
    layoutState: LiveSplit.LayoutStateRefMut,
    layoutEditorUrlCache: UrlCache,
    layoutUrlCache: UrlCache,
    layoutWidth: number,
    layoutHeight: number,
    generalSettings: GeneralSettings,
    isDesktop: boolean,
    timer: LiveSplit.SharedTimerRef,
    renderer: WebRenderer,
    callbacks: Callbacks,
}
export interface State {
    editor: LiveSplit.LayoutEditorStateJson,
    showComponentSettings: boolean,
}

interface Callbacks {
    onResize(width: number, height: number): Promise<void>,
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    closeLayoutEditor(save: boolean): void,
}

export class LayoutEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            editor: props.editor.stateAsJson(props.layoutEditorUrlCache.imageCache),
            showComponentSettings: true,
        };

        props.layoutEditorUrlCache.collect();
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        const components = this.state.editor.components.map((c, i) => {
            let className = "layout-editor-component";
            if (i === this.state.editor.selected_component) {
                className += " selected";
            }
            return (
                <tr key={i}
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
                    <td className={className}>
                        {c}
                    </td>
                </tr >
            );
        });

        let contextTrigger: any = null;
        const toggleMenu = (e: any) => {
            if (contextTrigger) {
                contextTrigger.handleContextClick(e);
            }
        };

        const settings = this.state.showComponentSettings
            ? (
                <SettingsComponent
                    context={`component-settings$${this.state.editor.selected_component}`}
                    factory={LiveSplit.SettingValue}
                    state={this.state.editor.component_settings}
                    editorUrlCache={this.props.layoutEditorUrlCache}
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
                            <ContextMenuTrigger id="add-button-context-menu" ref={(c) => contextTrigger = c}>
                                <button
                                    aria-label="Add Component"
                                    onClick={toggleMenu}
                                >
                                    <i className="fa fa-plus" aria-hidden="true"></i>
                                </button>
                            </ContextMenuTrigger>
                            <ContextMenu id="add-button-context-menu">
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.CurrentComparisonComponent)}>
                                    Current Comparison
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.CurrentPaceComponent)}>
                                    Current Pace
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.DeltaComponent)}>
                                    Delta
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.DetailedTimerComponent)}>
                                    Detailed Timer
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.GraphComponent)}>
                                    Graph
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.PbChanceComponent)}>
                                    PB Chance
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.PossibleTimeSaveComponent)}>
                                    Possible Time Save
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.PreviousSegmentComponent)}>
                                    Previous Segment
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.SegmentTimeComponent)}>
                                    Segment Time
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.SplitsComponent)}>
                                    Splits
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.SumOfBestComponent)}>
                                    Sum of Best Segments
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.TextComponent)}>
                                    Text
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.TimerComponent)}>
                                    Timer
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.TitleComponent)}>
                                    Title
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.TotalPlaytimeComponent)}>
                                    Total Playtime
                                </MenuItem>
                                <MenuItem divider />
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.BlankSpaceComponent)}>
                                    Blank Space
                                </MenuItem>
                                <MenuItem onClick={(_) => this.addComponent(LiveSplit.SeparatorComponent)}>
                                    Separator
                                </MenuItem>
                            </ContextMenu>
                            <button
                                aria-label="Remove Component"
                                onClick={(_) => this.removeComponent()}
                                className={this.state.editor.buttons.can_remove ? "" : "disabled"}
                            >
                                <i className="fa fa-minus" aria-hidden="true"></i>
                            </button>
                            <button
                                aria-label="Duplicate Component"
                                onClick={(_) => this.duplicateComponent()}
                            >
                                <i className="fa fa-clone" aria-hidden="true"></i>
                            </button>
                            <button
                                aria-label="Move Component Up"
                                onClick={(_) => this.moveComponentUp()}
                                className={this.state.editor.buttons.can_move_up ? "" : "disabled"}
                            >
                                <i className="fa fa-arrow-up" aria-hidden="true"></i>
                            </button>
                            <button
                                aria-label="Move Component Down"
                                onClick={(_) => this.moveComponentDown()}
                                className={this.state.editor.buttons.can_move_down ? "" : "disabled"}
                            >
                                <i className="fa fa-arrow-down" aria-hidden="true"></i>
                            </button>
                        </div>
                        <table className="layout-editor-component-list table">
                            <tbody className="table-body">
                                {components}
                            </tbody>
                        </table>
                    </div>
                    <div className="tab-bar layout-editor-tabs">
                        <button
                            className={"toggle-left" + (
                                !this.state.showComponentSettings
                                    ? " button-pressed"
                                    : ""
                            )}
                            onClick={(_) => {
                                this.setState({
                                    ...this.state,
                                    showComponentSettings: false,
                                });
                            }}
                        >
                            Layout
                        </button>
                        <button
                            className={"toggle-right" + (
                                this.state.showComponentSettings
                                    ? " button-pressed"
                                    : ""
                            )}
                            onClick={(_) => {
                                this.setState({
                                    ...this.state,
                                    showComponentSettings: true,
                                });
                            }}
                        >
                            Component
                        </button>
                    </div>
                    <div>
                        {settings}
                    </div>
                </div>
                <div className="layout-container">
                    <Layout
                        getState={() => this.props.timer.readWith(
                            (t) => {
                                this.props.editor.updateLayoutState(this.props.layoutState, this.props.layoutUrlCache.imageCache, t);
                                this.props.layoutUrlCache.collect();
                                return this.props.layoutState;
                            },
                        )}
                        layoutUrlCache={this.props.layoutUrlCache}
                        allowResize={this.props.isDesktop}
                        width={this.props.layoutWidth}
                        height={this.props.layoutHeight}
                        generalSettings={this.props.generalSettings}
                        renderer={this.props.renderer}
                        onResize={(width, height) => this.props.callbacks.onResize(width, height)}
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
                        onClick={(_) => this.props.callbacks.closeLayoutEditor(true)}
                    >
                        <i className="fa fa-check" aria-hidden="true" /> OK
                    </button>
                    <button
                        className="toggle-right"
                        onClick={(_) => this.props.callbacks.closeLayoutEditor(false)}
                    >
                        <i className="fa fa-times" aria-hidden="true" /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    private update() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(this.props.layoutEditorUrlCache.imageCache),
        });
        this.props.layoutEditorUrlCache.collect();
    }

    private selectComponent(i: number) {
        this.props.editor.select(i);
        this.update();
    }

    private addComponent(componentClass: any) {
        this.props.editor.addComponent(componentClass.new().intoGeneric());
        this.update();
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
