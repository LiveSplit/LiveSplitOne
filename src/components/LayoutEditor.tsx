import * as React from "react";
import * as LiveSplit from "../livesplit";
import { ContextMenu, ContextMenuTrigger, MenuItem } from "react-contextmenu";

export interface Props { editor: LiveSplit.LayoutEditor };
export interface State {
    editor: LiveSplit.LayoutEditorStateJson,
}

export class LayoutEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            editor: props.editor.stateAsJson(),
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
        let components = this.state.editor.components.map((c, i) => {
            let className = "layout-editor-component";
            if (i == this.state.editor.selected_component) {
                className += " selected";
            }
            return (
                <tr key={i}
                    onClick={(e) => this.selectComponent(i)}
                    draggable={true}
                    onDragStart={(e) => {
                        this.props.editor.select(i);
                        this.update();
                    }}
                    onDragOver={(e) => {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragEnd={(e) => this.update()}
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

        let settingsRows: any[] = [];

        this.state.editor.settings_description.fields.forEach((field, valueIndex) => {
            var component;
            let value: any = field.value;
            switch (Object.keys(value)[0]) {
                case "Bool": {
                    component =
                        <input
                            type="checkbox"
                            checked={value.Bool}
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsBool(valueIndex, e.target.checked);
                                this.update();
                            }}
                        />;
                    break;
                }
                case "UInt": {
                    component =
                        <input
                            type="number"
                            className="number"
                            value={value.UInt}
                            min="0"
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsUint(valueIndex, e.target.valueAsNumber);
                                this.update();
                            }}
                        />;
                    break;
                }
                case "Int": {
                    component =
                        <input
                            type="number"
                            className="number"
                            value={value.Int}
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsInt(valueIndex, e.target.valueAsNumber);
                                this.update();
                            }}
                        />;
                    break;
                }
                case "String": {
                    component =
                        <input
                            value={value.String}
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsString(valueIndex, e.target.value);
                                this.update();
                            }}
                        />;
                    break;
                }
                case "OptionalString": {
                    let children = [
                        <input
                            type="checkbox"
                            checked={value.OptionalString != null}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    this.props.editor.setComponentSettingsOptionalString(valueIndex, "");
                                } else {
                                    this.props.editor.setComponentSettingsOptionalStringToEmpty(valueIndex);
                                }
                                this.update();
                            }}
                        />
                    ];

                    if (value.OptionalString != null) {
                        children.push(
                            <input
                                value={value.OptionalString}
                                disabled={value.OptionalString == null}
                                onChange={(e) => {
                                    this.props.editor.setComponentSettingsOptionalString(valueIndex, e.target.value);
                                    this.update();
                                }}
                            />
                        );
                    }

                    component =
                        <span>
                            {children}
                        </span>;
                    break;
                }
                case "Float": {
                    component =
                        <input
                            type="number"
                            value={value.Float}
                            className="number"
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsFloat(valueIndex, e.target.valueAsNumber);
                                this.update();
                            }}
                        />;
                    break;
                }
                case "Accuracy": {
                    component =
                        <select
                            value={value.Accuracy}
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsAccuracy(valueIndex, e.target.value);
                                this.update();
                            }}
                        >
                            <option value="Seconds">Seconds</option>
                            <option value="Tenths">Tenths</option>
                            <option value="Hundredths">Hundredths</option>
                        </select>;
                    break;
                }
                case "DigitsFormat": {
                    component =
                        <select
                            value={value.DigitsFormat}
                            onChange={(e) => {
                                this.props.editor.setComponentSettingsDigitsFormat(valueIndex, e.target.value);
                                this.update();
                            }}
                        >
                            <option value="SingleDigitSeconds">1</option>
                            <option value="DoubleDigitSeconds">01</option>
                            <option value="SingleDigitMinutes">0:01</option>
                            <option value="DoubleDigitMinutes">00:01</option>
                            <option value="SingleDigitHours">0:00:01</option>
                            <option value="DoubleDigitHours">00:00:01</option>
                        </select>;
                    break;
                }
                case "OptionalTimingMethod": {
                    let children = [
                        <input
                            type="checkbox"
                            checked={value.OptionalTimingMethod != null}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    this.props.editor.setComponentSettingsOptionalTimingMethod(valueIndex, "RealTime");
                                } else {
                                    this.props.editor.setComponentSettingsOptionalTimingMethodToEmpty(valueIndex);
                                }
                                this.update();
                            }}
                        />
                    ];

                    if (value.OptionalTimingMethod != null) {
                        children.push(
                            <select
                                value={value.OptionalTimingMethod}
                                disabled={value.OptionalTimingMethod == null}
                                onChange={(e) => {
                                    this.props.editor.setComponentSettingsOptionalTimingMethod(valueIndex, e.target.value);
                                    this.update();
                                }}
                            >
                                <option value="RealTime">Real Time</option>
                                <option value="GameTime">Game Time</option>
                            </select>
                        );
                    }

                    component =
                        <span>
                            {children}
                        </span>;
                    break;
                }
            }
            settingsRows.push(
                <tr>
                    <td>{field.text}</td>
                    <td>{component}</td>
                </tr>
            );
        });

        return (
            <div>
                <div className="layout-editor">
                    <div className="btn-group">
                        <ContextMenuTrigger id="add-button-context-menu" ref={c => contextTrigger = c}>
                            <button onClick={toggleMenu}><i className="fa fa-plus" aria-hidden="true"></i></button>
                        </ContextMenuTrigger>
                        <ContextMenu id="add-button-context-menu">
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.CurrentComparisonComponent)}>
                                Current Comparison
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.CurrentPaceComponent)}>
                                Current Pace
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.DeltaComponent)}>
                                Delta
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.DetailedTimerComponent)}>
                                Detailed Timer
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.GraphComponent)}>
                                Graph
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.PossibleTimeSaveComponent)}>
                                Possible Time Save
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.PreviousSegmentComponent)}>
                                Previous Segment
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.SplitsComponent)}>
                                Splits
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.SumOfBestComponent)}>
                                Sum of Best Segments
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.TextComponent)}>
                                Text
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.TimerComponent)}>
                                Timer
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.TitleComponent)}>
                                Title
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.TotalPlaytimeComponent)}>
                                Total Playtime
                            </MenuItem>
                            <MenuItem divider />
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.BlankSpaceComponent)}>
                                Blank Space
                            </MenuItem>
                            <MenuItem onClick={(e) => this.addComponent(LiveSplit.SeparatorComponent)}>
                                Separator
                            </MenuItem>
                        </ContextMenu>
                        <button
                            onClick={(e) => this.removeComponent()}
                            className={this.state.editor.buttons.can_remove ? "" : "disabled"}
                        >
                            <i className="fa fa-minus" aria-hidden="true"></i>
                        </button>
                        <button
                            onClick={(e) => this.moveComponentUp()}
                            className={this.state.editor.buttons.can_move_up ? "" : "disabled"}
                        >
                            <i className="fa fa-arrow-up" aria-hidden="true"></i>
                        </button>
                        <button
                            onClick={(e) => this.moveComponentDown()}
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
                <table className="component-settings table">
                    <tbody className="table-body">
                        {settingsRows}
                    </tbody>
                </table>
            </div>
        );
    }
}
