import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.TextComponentStateJson }

export default class Text extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const { state } = this.props;
        const text = "Center" in state ? (
            <tr>
                <td className="text-component-text center-text">{state.Center}</td>
            </tr>
        ) : (
                <tr>
                    <td className="text-component-text">{state.Split[0]}</td>
                    <td className="text-component-text">{state.Split[1]}</td>
                </tr>
            );
        return (
            <div className="text-component">
                <table>
                    <tbody>
                        {text}
                    </tbody>
                </table>
            </div>
        );
    }
}
