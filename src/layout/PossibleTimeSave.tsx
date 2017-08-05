import * as React from "react";
import * as LiveSplit from "../livesplit";
import { gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.PossibleTimeSaveComponentStateJson };

export default class PossibleTimeSave extends React.Component<Props> {
	render() {
		return (
			<div
				className="possible-time-save"
				style={{
					background: gradientToCss(this.props.state.background),
				}}
			>
				<table>
					<tbody>
						<tr>
							<td className="possible-time-save-text">{this.props.state.text}</td>
							<td className={"possible-time-save-time time"}>{this.props.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}

}
