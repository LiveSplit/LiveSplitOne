import * as React from "react";
import * as LiveSplit from "../livesplit";
import { gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.CurrentPaceComponentStateJson };

export default class CurrentPace extends React.Component<Props> {
	render() {
		return (
			<div
				className="current-pace"
				style={{
					background: gradientToCss(this.props.state.background),
				}}
			>
				<table>
					<tbody>
						<tr>
							<td className="current-pace-text">{this.props.state.text}</td>
							<td className={"current-pace-time time"}>{this.props.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
