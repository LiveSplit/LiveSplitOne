import * as React from "react";
import { LayoutStateJson } from "../livesplit";
import { colorToCss, gradientToCss } from "../util/ColorUtil";
import Component from "./Component";

export interface Props {
    state: LayoutStateJson,
}

export default class Layout extends React.Component<Props> {
    public render() {
        const layoutState = this.props.state;

        return (
            <div
                className="layout"
                style={{
                    background: gradientToCss(layoutState.background),
                    color: colorToCss(layoutState.text_color),
                }}
            >
                {
                    this.props.state.components.map((c) =>
                        <Component state={c} layoutState={layoutState} />,
                    )
                }
            </div>
        );
    }
}
