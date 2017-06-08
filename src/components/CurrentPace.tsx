import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer };

export class Component extends React.Component<Props, LiveSplit.CurrentPaceComponentStateJson> {
	inner: LiveSplit.CurrentPaceComponent;
	timerID: number;

	constructor(props: Props) {
		super(props);

		this.inner = LiveSplit.CurrentPaceComponent.new();

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
			<div className="current-pace">
				<table>
					<tbody>
						<tr>
							<td className="current-pace-text">{this.state.text}</td>
							<td className={"current-pace-time time"}>{this.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}
}
