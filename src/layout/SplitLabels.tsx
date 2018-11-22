import * as React from "react";

export interface Props {
    labels: string[],
}

export default class SplitLabels extends React.Component<Props> {
    public render() {
        return (
            <span
                className="split"
                style={{
                    height: 22,
                }}
            >
                <div key="split-icon" />
                <div key="split-name" />
                {
                    this.props.labels.map((label, i) =>
                        <div
                            key={i}
                            className="split-time"
                        >
                            {label}
                        </div>,
                    ).reverse()
                }
            </span>
        );
    }
}
