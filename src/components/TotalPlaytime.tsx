import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer };

export class Component extends React.Component<Props, LiveSplit.TotalPlaytimeComponentStateJson> {
	inner: LiveSplit.TotalPlaytimeComponent;
	timerID: number;

	constructor(props: Props) {
		super(props);

		this.inner = LiveSplit.TotalPlaytimeComponent.new();

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
			<div className="total-playtime">
				<table>
					<tbody>
						<tr>
							<td className="total-playtime-text">{this.state.text}</td>
							<td className={"total-playtime-time time"}>{this.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
