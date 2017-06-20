import * as React from "react";
import * as LiveSplit from "../livesplit";

export interface Props { state: LiveSplit.GraphComponentStateJson }

export class Component extends React.Component<Props, undefined> {
    render() {
        let width = 300;
        let height = 110;

        let middle = height * this.props.state.middle;

        let rect1 = <rect width="100%" height={middle} style={{ "fill": "rgb(115, 40, 40)" }} />;
        let rect2 = <rect y={middle} width="100%" height={height - middle} style={{ "fill": "rgb(40, 115, 52)" }} />;
        let children = [rect1, rect2];

        for (let y of this.props.state.horizontal_grid_lines) {
            let line = <line x1="0" y1={height * y} x2="100%" y2={height * y} style={{
                "stroke": "rgba(0, 0, 0, 0.15)",
                "stroke-width": "2",
            }} />;
            children.push(line);
        }

        for (let x of this.props.state.vertical_grid_lines) {
            let line = <line x1={(x * 100) + "%"} y1="0" x2={(x * 100) + "%"} y2={height} style={{
                "stroke": "rgba(0, 0, 0, 0.15)",
                "stroke-width": "2",
            }} />;
            children.push(line);
        }

        let points = "";

        let length = this.props.state.points.length;
        if (this.props.state.is_live_delta_active) {
            length -= 1;
        }

        for (var i = 0; i < length; i++) {
            let point = this.props.state.points[i];
            points += (width * point[0]) + "," + (height * point[1]) + " ";
        }

        points += (width * this.props.state.points[length - 1][0]) + "," + (middle);

        let fill = <polygon points={points} style={{
            "fill": "rgba(255, 255, 255, 0.4)"
        }} />;

        children.push(fill);

        if (this.props.state.is_live_delta_active) {
            let x1 = width * this.props.state.points[length - 1][0];
            let y1 = height * this.props.state.points[length - 1][1];
            let x2 = width * this.props.state.points[length][0];
            let y2 = height * this.props.state.points[length][1];

            let fill = <polygon points={
                x1 + "," + middle + " " +
                x1 + "," + y1 + " " +
                x2 + "," + y2 + " " +
                x2 + "," + middle} style={{
                    "fill": "rgba(255, 255, 255, 0.25)"
                }} />;

            children.push(fill);
        }

        for (var i = 1; i < this.props.state.points.length; i++) {
            let px = (100 * this.props.state.points[i - 1][0]) + "%";
            let py = height * this.props.state.points[i - 1][1];
            let x = (100 * this.props.state.points[i][0]) + "%";
            let y = height * this.props.state.points[i][1];
            let line = <line x1={px} y1={py} x2={x} y2={y} style={{
                "stroke": "white",
                "stroke-width": "2",
            }} />;
            children.push(line);
            if (i != this.props.state.points.length - 1 || !this.props.state.is_live_delta_active) {
                let circle = <ellipse cx={x} cy={y} rx="2.5" ry="2.5" style={{ "fill": "white" }} />;
                children.push(circle);
            }
        }

        let svg = React.createElement("svg", { "height": height }, children);
        let div = React.createElement("div", {"className": "graph"}, svg);
        return div;
    }
}
