import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import KeyValueGeneric, { KeyValueDisplay } from "./KeyValueGeneric";

import "../css/KeyValue.scss";

export interface Props { state: LiveSplit.TextComponentStateJson }

export default class Text extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    public render() {
        const { text } = this.props.state;

        if ("Center" in text) {
            return <KeyValueGeneric
                display={KeyValueDisplay.Center}
                keyColor={this.props.state.left_center_color}
                keyText={text.Center}
                keyAbbreviations={[]}
                valueColor={null}
                valueText={null}
                wrapperBackground={this.props.state.background}
            />;
        }

        return <KeyValueGeneric
            display={this.props.state.display_two_rows ?
                KeyValueDisplay.SplitTwoRows :
                KeyValueDisplay.SplitOneRow
            }
            keyColor={this.props.state.left_center_color}
            keyText={text.Split[0]}
            keyAbbreviations={[]}
            valueColor={this.props.state.right_color}
            valueText={text.Split[1]}
            wrapperBackground={this.props.state.background}
        />;
    }
}
