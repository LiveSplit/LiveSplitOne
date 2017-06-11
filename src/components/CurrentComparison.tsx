import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer };

export class Component extends React.Component<Props, LiveSplit.CurrentComparisonComponentStateJson> {
	inner: LiveSplit.CurrentComparisonComponent;
	timerID: number;

	constructor(props: Props) {
		super(props);

		this.inner = LiveSplit.CurrentComparisonComponent.new();

		this.state = this.inner.stateAsJson(this.props.timer);
	}

	componentDidMount() {
		this.timerID = setInterval(
			() => this.update(),
			1000 / 30
		);
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
		this.inner.dispose();
	}

	update() {
		this.setState(this.inner.stateAsJson(this.props.timer));
	}

	render() {
		return (
			<div className="current-comparison">
				<table>
					<tbody>
						<tr>
							<td className="current-comparison-text">{this.state.text}</td>
							<td className={"current-comparison-comparison"}>{this.state.comparison}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
