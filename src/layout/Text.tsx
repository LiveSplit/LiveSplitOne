import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.TextComponentStateJson }

export default class Text extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const componentState: any = this.props.state;
        const text = componentState.Center != null ? (
            <tr>
                <td className="text-component-text center-text">{componentState.Center}</td>
            </tr>
        ) : (
                <tr>
                    <td className="text-component-text">{componentState.Split[0]}</td>
                    <td className="text-component-text">{componentState.Split[1]}</td>
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
        )
    }
}
