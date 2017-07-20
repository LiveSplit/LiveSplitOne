import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.DeltaComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    render() {
        return (
            <div className="delta-component">
                <table>
                    <tbody>
                        <tr>
                            <td className="delta-component-text">{this.props.state.text}</td>
                            <td
                                className={"delta-component-time time"}
                                style={{
                                    color: colorToCss(this.props.state.visual_color),
                                }}
                            >
                                {this.props.state.time}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
