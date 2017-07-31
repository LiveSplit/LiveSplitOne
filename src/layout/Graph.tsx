import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.GraphComponentStateJson }

export default class Graph extends React.Component<Props, {}> {
    render() {
        let width = 300;
        let height = 110;

        let middle = height * this.props.state.middle;

        let colorTop = colorToCss(this.props.state.top_background_color);
        let colorBottom = colorToCss(this.props.state.bottom_background_color);
        let colorGridLines = colorToCss(this.props.state.grid_lines_color);
        let colorGraphLines = colorToCss(this.props.state.graph_lines_color);
        let colorPartialFill = colorToCss(this.props.state.partial_fill_color);
        let colorCompleteFill = colorToCss(this.props.state.complete_fill_color);
        let colorBestSegment = colorToCss(this.props.state.best_segment_color);

        let rect1 = <rect width="100%" height={middle} style={{ "fill": colorTop }} />;
        let rect2 = <rect y={middle} width="100%" height={height - middle} style={{ "fill": colorBottom }} />;
        let children = [rect1, rect2];

        for (let y of this.props.state.horizontal_grid_lines) {
            let line = <line x1="0" y1={height * y} x2="100%" y2={height * y} style={{
                "stroke": colorGridLines,
                "stroke-width": "2",
            }} />;
            children.push(line);
        }

        for (let x of this.props.state.vertical_grid_lines) {
            let line = <line x1={(x * 100) + "%"} y1="0" x2={(x * 100) + "%"} y2={height} style={{
                "stroke": colorGridLines,
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
            points += (width * point.x) + "," + (height * point.y) + " ";
        }

        points += (width * this.props.state.points[length - 1].x) + "," + (middle);

        let fill = <polygon points={points} style={{
            "fill": colorCompleteFill
        }} />;

        children.push(fill);

        if (this.props.state.is_live_delta_active) {
            let x1 = width * this.props.state.points[length - 1].x;
            let y1 = height * this.props.state.points[length - 1].y;
            let x2 = width * this.props.state.points[length].x;
            let y2 = height * this.props.state.points[length].y;

            let fill = <polygon points={
                x1 + "," + middle + " " +
                x1 + "," + y1 + " " +
                x2 + "," + y2 + " " +
                x2 + "," + middle} style={{
                    "fill": colorPartialFill
                }} />;

            children.push(fill);
        }

        let childrenPoints = [];

        for (var i = 1; i < this.props.state.points.length; i++) {
            let px = (100 * this.props.state.points[i - 1].x) + "%";
            let py = height * this.props.state.points[i - 1].y;
            let x = (100 * this.props.state.points[i].x) + "%";
            let y = height * this.props.state.points[i].y;

            let fill = this.props.state.points[i].is_best_segment
                ? colorBestSegment
                : colorGraphLines;

            let line = <line x1={px} y1={py} x2={x} y2={y} style={{
                "stroke": fill,
                "stroke-width": "2",
            }} />;
            children.push(line);

            if (i != this.props.state.points.length - 1 || !this.props.state.is_live_delta_active) {
                let circle = <ellipse cx={x} cy={y} rx="2.5" ry="2.5" style={{ "fill": fill }} />;
                childrenPoints.push(circle);
            }
        }

        children.push(...childrenPoints);

        return (<svg className="graph" height={height}>{children}</svg>);
    }
}
