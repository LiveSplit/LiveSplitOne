import * as React from "react";
import * as LiveSplit from "../livesplit";
import { colorToCss } from "../util/ColorUtil";

export interface Props { state: LiveSplit.GraphComponentStateJson }

export default class Graph extends React.Component<Props> {
    public render() {
        const width = 300;
        const height = 110;

        const middle = height * this.props.state.middle;

        const colorTop = colorToCss(this.props.state.top_background_color);
        const colorBottom = colorToCss(this.props.state.bottom_background_color);
        const colorGridLines = colorToCss(this.props.state.grid_lines_color);
        const colorGraphLines = colorToCss(this.props.state.graph_lines_color);
        const colorPartialFill = colorToCss(this.props.state.partial_fill_color);
        const colorCompleteFill = colorToCss(this.props.state.complete_fill_color);
        const colorBestSegment = colorToCss(this.props.state.best_segment_color);

        const rect1 = <rect width="100%" height={middle} style={{ fill: colorTop }} />;
        const rect2 = <rect y={middle} width="100%" height={height - middle} style={{ fill: colorBottom }} />;
        const children = [rect1, rect2];

        for (const y of this.props.state.horizontal_grid_lines) {
            const line = <line x1="0" y1={height * y} x2="100%" y2={height * y} style={{
                "stroke": colorGridLines,
                "stroke-width": "2",
            }} />;
            children.push(line);
        }

        for (const x of this.props.state.vertical_grid_lines) {
            const line = <line x1={`${x * 100}%`} y1="0" x2={`${x * 100}%`} y2={height} style={{
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

        for (const point of this.props.state.points) {
            points += `${width * point.x},${height * point.y} `;
        }

        points += `${width * this.props.state.points[length - 1].x},${middle}`;

        const fill = <polygon points={points} style={{
            fill: colorCompleteFill,
        }} />;

        children.push(fill);

        if (this.props.state.is_live_delta_active) {
            const x1 = width * this.props.state.points[length - 1].x;
            const y1 = height * this.props.state.points[length - 1].y;
            const x2 = width * this.props.state.points[length].x;
            const y2 = height * this.props.state.points[length].y;

            const fill = <polygon
                points={`${x1},${middle} ${x1},${y1} ${x2},${y2} ${x2},${middle}`}
                style={{
                    fill: colorPartialFill,
                }} />;

            children.push(fill);
        }

        const childrenPoints = [];

        for (let i = 1; i < this.props.state.points.length; i++) {
            const px = `${100 * this.props.state.points[i - 1].x}%`;
            const py = height * this.props.state.points[i - 1].y;
            const x = `${100 * this.props.state.points[i].x}%`;
            const y = height * this.props.state.points[i].y;

            const fill = this.props.state.points[i].is_best_segment
                ? colorBestSegment
                : colorGraphLines;

            const line = <line x1={px} y1={py} x2={x} y2={y} style={{
                "stroke": fill,
                "stroke-width": "2",
            }} />;
            children.push(line);

            if (i !== this.props.state.points.length - 1 || !this.props.state.is_live_delta_active) {
                const circle = <ellipse cx={x} cy={y} rx="2.5" ry="2.5" style={{ fill }} />;
                childrenPoints.push(circle);
            }
        }

        children.push(...childrenPoints);

        return (<svg className="graph" height={height}>{children}</svg>);
    }
}
