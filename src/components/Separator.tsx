import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

export interface Props {
	layoutState: LiveSplit.LayoutStateJson,
}

export class Component extends React.Component<Props, undefined> {
	render() {
		return (
			<div
				className="separator"
				style={{
					backgroundColor: colorToCss(this.props.layoutState.separators_color),
				}}
			/>
		)
	}
}
