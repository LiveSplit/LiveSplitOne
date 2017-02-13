import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { timer: LiveSplit.Timer };

export class Component extends React.Component<Props, LiveSplit.PossibleTimeSaveComponentState> {
	inner: LiveSplit.PossibleTimeSaveComponent;
	timerID: number;

	constructor(props: Props) {
		super(props);

		this.inner = new LiveSplit.PossibleTimeSaveComponent();

		this.state = this.inner.state(this.props.timer);
	}

	componentDidMount() {
		this.timerID = setInterval(
			() => this.update(),
			1000 / 30
		);
	}

	componentWillUnmount() {
		clearInterval(this.timerID);
		this.inner.drop();
	}

	update() {
		this.setState(this.inner.state(this.props.timer));
	}

	render() {
		return (
			<div className="possible-time-save">
				<table>
					<tbody>
						<tr>
							<td className="possible-time-save-text">{this.state.text}</td>
							<td className={"possible-time-save-time time"}>{this.state.time}</td>
						</tr>
					</tbody>
				</table>
			</div>
		)
	}

}
