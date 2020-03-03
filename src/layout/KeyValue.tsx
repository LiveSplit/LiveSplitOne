import * as React from "react";
import * as LiveSplit from "../livesplit-core";
import KeyValueGeneric, { KeyValueDisplay } from "./KeyValueGeneric";

import "../css/KeyValue.scss";

export interface Props { state: LiveSplit.KeyValueComponentStateJson }

export default class KeyValue extends React.Component<Props> {
    public render() {
        return <KeyValueGeneric
            display={this.props.state.display_two_rows ?
                KeyValueDisplay.SplitTwoRows :
                KeyValueDisplay.SplitOneRow
            }
            keyText={this.props.state.key}
            keyAbbreviations={this.props.state.key_abbreviations}
            keyColor={this.props.state.key_color}
            valueText={this.props.state.value}
            valueColor={this.props.state.value_color}
            wrapperBackground={this.props.state.background}
        />;
    }
}
