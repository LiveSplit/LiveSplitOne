import * as React from "react";
import * as LiveSplit from "../livesplit";
import { gradientToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.CurrentComparisonComponentStateJson };

export default class CurrentComparison extends React.Component<Props> {
	render() {
		return (
			<div
				className="current-comparison"
				style={{
					background: gradientToCss(this.props.state.background),
				}}
			>
				<table>
					<tbody>
						<tr>
							<td className="current-comparison-text">{this.props.state.text}</td>
							<td className={"current-comparison-comparison"}>{this.props.state.comparison}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
