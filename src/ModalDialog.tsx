import * as React from "react";

export interface Props {
	onClose(): void,
	className?: string,
	children?: any,
}
export interface State { }

const styles = {
	dialog: {
		boxSizing: 'border-box',
		position: 'relative',
		background: 'white',
		padding: 20,
		color: '#333',
		boxShadow: '0px 2px 15px rgba(0, 0, 0, 0.4)',
		borderRadius: 10,
	}
};

export class ModalDialog extends React.Component<Props, State> {
	keyEvent: EventListenerObject;

	componentWillMount() {
		this.keyEvent = { handleEvent: (e: KeyboardEvent) => this.onKeyDown(e) };
		window.addEventListener('keydown', this.keyEvent);
	}

	componentWillUnmount() {
		window.removeEventListener('keypress', this.keyEvent);
	}

	onKeyDown(e: KeyboardEvent) {
		if (e.keyCode === 27) { // Escape Key
			this.onClose();
		}
	}

	onClose() {
		this.props.onClose();
	}

	render() {
		const style = {
			boxSizing: "border-box",
			border: "black",
			background: "white",
			borderRadius: 10,
			padding: 12,
			color: "black",
			margin: 13,
			boxShadow: "0px 2px 15px #000000",
		};

		const containerStyle = {
			position: "fixed", /* Stay in place */
			zIndex: 3, /* Sit on top */
			left: 0,
			top: 0,
			width: "100%", /* Full width */
			height: "100%", /* Full height */
			overflow: "auto", /* Enable scroll if needed */
			backgroundColor: "rgba(0,0,0,0.4)",
		}

		const closeStyle = {
			position: "absolute",
			right: 13,
			top: 6,
			left: "initial",
			margin: "initial",
			color: "black",
			fontSize: 30,
			zIndex: 4
		}

		return (
			<div className="modal-container" style={containerStyle} >
				<div className={this.props.className} style={style}>
					<span className="modal-close" style={closeStyle} onClick={(e) => this.onClose()}>&times;</span>
					{this.props.children}
				</div>
			</div>
		)
	}
}
