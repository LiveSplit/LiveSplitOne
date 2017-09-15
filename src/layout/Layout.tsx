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
        const counts = new Map<string, number>();

        return (
            <div
                className="layout"
                style={{
                    background: gradientToCss(layoutState.background),
                    color: colorToCss(layoutState.text_color),
                }}
            >
                {
                    this.props.state.components.map((c) => {
                        const componentType = Object.keys(c)[0];
                        const id = counts.get(componentType) || 0;
                        counts.set(componentType, id + 1);

                        const key = `${componentType}${id}`;

                        return <Component
                            key={key}
                            state={c}
                            componentId={key}
                            layoutState={layoutState}
                        />;
                    })
                }
            </div>
        );
    }
}
