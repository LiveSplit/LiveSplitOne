import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer };

export class Component extends React.Component<Props, LiveSplit.SumOfBestComponentStateJson> {
	inner: LiveSplit.SumOfBestComponent;
	timerID: number;

	constructor(props: Props) {
		super(props);

		this.inner = LiveSplit.SumOfBestComponent.new();

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
			<div className="sum-of-best">
				<table>
					<tbody>
						<tr>
							<td className="sum-of-best-text">{this.state.text}</td>
							<td className={"sum-of-best-time time"}>{this.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
