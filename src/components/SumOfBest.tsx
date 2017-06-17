import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.SumOfBestComponentStateJson };

export class Component extends React.Component<Props, undefined> {
	render() {
		return (
			<div className="sum-of-best">
				<table>
					<tbody>
						<tr>
							<td className="sum-of-best-text">{this.props.state.text}</td>
							<td className={"sum-of-best-time time"}>{this.props.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
