import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.DeltaComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    getColor(): string {
        return "color-" + this.props.state.color.toLowerCase();
    }

    render() {
        return (
            <div className="delta-component">
                <table>
                    <tbody>
                        <tr>
                            <td className="delta-component-text">{this.props.state.text}</td>
                            <td className={"delta-component-time time " + this.getColor()}>{this.props.state.time}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
}
