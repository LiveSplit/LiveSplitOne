import * as React from "react";
import * as LiveSplit from "../livesplit";
import { Component as Split } from "./Split";

export interface Props { timer: LiveSplit.Timer }

export class Component extends React.Component<Props, LiveSplit.SplitsComponentState> {
    inner: LiveSplit.SplitsComponent;
    timerID: number;
    iconUrls: string[];
    event: EventListenerObject;

    constructor(props: Props) {
        super(props);

        this.inner = new LiveSplit.SplitsComponent();
        this.iconUrls = [];

        this.state = this.inner.state(this.props.timer);
    }

    getIconUrl(index: number): string {
        while (index >= this.iconUrls.length) {
            this.iconUrls.push("");
        }
        if (this.state.splits[index].icon_change != null) {
            this.iconUrls[index] = this.state.splits[index].icon_change;
        }
        return this.iconUrls[index];
    }

    componentDidMount() {
        this.event = { handleEvent: (e: MouseWheelEvent) => this.onScroll(e) };
        window.addEventListener('mousewheel', this.event);
        this.timerID = setInterval(
            () => this.update(),
            1000 / 30
        );
    }

    componentWillUnmount() {
        window.removeEventListener('mousewheel', this.event);
        clearInterval(this.timerID);
        this.inner.drop();
    }

    onScroll(e: MouseWheelEvent) {
        var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
        if (delta == 1) {
            this.inner.scrollUp();
        } else if (delta == -1) {
            this.inner.scrollDown();
        }
    }

    update() {
        this.setState(this.inner.state(this.props.timer));
    }

    render() {
        return (
            <div className="splits">
                {
                    this.state.splits.map((s, i) =>
                        <Split
                            split={s}
                            icon={this.getIconUrl(i)}
                            key={i.toString()}
                            separatorInFrontOfSplit={this.state.show_final_separator && i + 1 == this.state.splits.length}
                            />)
                }
            </div>
        );
    }
}
