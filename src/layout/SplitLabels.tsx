import * as React from "react";

export interface Props {
    labels: string[],
}

export default class SplitLabels extends React.Component<Props> {
    public render() {
        return (
            <span
                className="split split-label"
            >
                <div className="current-split-background" />
                <div className="split-icon-container-empty" />
                <div className="split-rows">
                    <div className="split-row split-first-row">
                        <div className="split-name" />
                    </div>
                    <div className="split-row split-second-row">
                        {
                            this.props.labels.map((label, i) =>
                                <div
                                    key={i}
                                    className={`split-time split-label ${i < this.props.labels.length - 1 ? "split-time-full" : ""}`}
                                >
                                    {label}
                                </div>,
                            ).reverse()
                        }
                    </div>
                </div>
            </span>
        );
    }
}
