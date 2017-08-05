import * as React from "react";
import * as LiveSplit from "../livesplit";
import DragAutoRefreshLayout from "../layout/DragAutoRefreshLayout";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";
import SettingsComponent from "./Settings";

export interface Props {
    editor: LiveSplit.LayoutEditor,
    timer: LiveSplit.TimerRef,
};
export interface State {
    editor: LiveSplit.LayoutEditorStateJson,
    showComponentSettings: boolean,
}

export class LayoutEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            editor: props.editor.stateAsJson(),
            showComponentSettings: true,
        };
    }

    update() {
        this.setState({
            ...this.state,
            editor: this.props.editor.stateAsJson(),
        });
    }

    selectComponent(i: number) {
        this.props.editor.select(i);
        this.update();
    }

    addComponent(componentClass: any) {
        this.props.editor.addComponent(componentClass.new().intoGeneric());
        this.update();
    }

    removeComponent() {
        this.props.editor.removeComponent();
        this.update();
    }

    moveComponentUp() {
        this.props.editor.moveComponentUp();
        this.update();
    }

    moveComponentDown() {
        this.props.editor.moveComponentDown();
        this.update();
    }

    render() {
        const components = this.state.editor.components.map((c, i) => {
            let className = "layout-editor-component";
            if (i == this.state.editor.selected_component) {
                className += " selected";
            }
            return (
                <tr key={i}
                    onClick={_ => this.selectComponent(i)}
                    draggable={true}
                    onDragStart={_ => {
                        this.props.editor.select(i);
                        this.update();
                    }}
                    onDragOver={e => {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragEnd={_ => this.update()}
                    onDrop={e => {
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
                    state={this.state.editor.component_settings}
                    setValue={(index, value) => {
                        this.props.editor.setComponentSettingsValue(index, value);
                        this.update();
                    }}
                />
            ) : (
                <SettingsComponent
                    state={this.state.editor.general_settings}
                    setValue={(index, value) => {
                        this.props.editor.setGeneralSettingsValue(index, value);
                        this.update();
                    }}
                />
            );

        return (
            <div className="layout-editor-outer">
                <div style={{ display: "initial" }}>
                    <div className="layout-editor-inner">
                        <div className="btn-group">
                            <ContextMenuTrigger id="add-button-context-menu" ref={c => contextTrigger = c}>
                                <button onClick={toggleMenu}><i className="fa fa-plus" aria-hidden="true"></i></button>
                            </ContextMenuTrigger>
                            <ContextMenu id="add-button-context-menu">
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.CurrentComparisonComponent)}>
                                    Current Comparison
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.CurrentPaceComponent)}>
                                    Current Pace
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.DeltaComponent)}>
                                    Delta
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.DetailedTimerComponent)}>
                                    Detailed Timer
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.GraphComponent)}>
                                    Graph
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.PossibleTimeSaveComponent)}>
                                    Possible Time Save
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.PreviousSegmentComponent)}>
                                    Previous Segment
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.SplitsComponent)}>
                                    Splits
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.SumOfBestComponent)}>
                                    Sum of Best Segments
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.TextComponent)}>
                                    Text
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.TimerComponent)}>
                                    Timer
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.TitleComponent)}>
                                    Title
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.TotalPlaytimeComponent)}>
                                    Total Playtime
                                </MenuItem>
                                <MenuItem divider />
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.BlankSpaceComponent)}>
                                    Blank Space
                                </MenuItem>
                                <MenuItem onClick={_ => this.addComponent(LiveSplit.SeparatorComponent)}>
                                    Separator
                                </MenuItem>
                            </ContextMenu>
                            <button
                                onClick={_ => this.removeComponent()}
                                className={this.state.editor.buttons.can_remove ? "" : "disabled"}
                            >
                                <i className="fa fa-minus" aria-hidden="true"></i>
                            </button>
                            <button
                                onClick={_ => this.moveComponentUp()}
                                className={this.state.editor.buttons.can_move_up ? "" : "disabled"}
                            >
                                <i className="fa fa-arrow-up" aria-hidden="true"></i>
                            </button>
                            <button
                                onClick={_ => this.moveComponentDown()}
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
                            onClick={_ => {
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
                            onClick={_ => {
                                this.setState({
                                    ...this.state,
                                    showComponentSettings: true,
                                });
                            }}
                        >
                            Component
                        </button>
                    </div>
                    {settings}
                </div>
                <div style={{
                    margin: "20px",
                    marginLeft: "15px",
                }}>
                    <DragAutoRefreshLayout
                        getState={() => this.props.editor.layoutStateAsJson(this.props.timer)}
                        onClick={i => this.selectComponent(i)}
                        onDrag={i => {
                            this.props.editor.select(i);
                            this.update();
                        }}
                        onDragEnd={_ => this.update()}
                        onDrop={i => this.props.editor.moveComponent(i)}
                        isSelected={i => this.state.editor.selected_component == i}
                    />
                </div>
            </div>
        );
    }
}
