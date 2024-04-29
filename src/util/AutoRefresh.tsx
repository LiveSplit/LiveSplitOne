import * as React from "react";
import { assert } from "./OptionUtil";

export interface Props {
    update(): void,
}

export default class AutoRefresh extends React.Component<Props> {
    private readonly fpsInterval = 1000 / 30;
    private reqId: number | null;
    private previousTime: number | undefined;

    constructor(props: Props) {
        super(props);

        this.reqId = null;
    }

    public componentWillMount() {
        this.startAnimation();
    }

    public componentWillUnmount() {
        if (this.reqId) {
            cancelAnimationFrame(this.reqId);
        }
    }

    public render() {
        return this.props.children;
    }

    private startAnimation() {
        this.previousTime = performance.now();
        this.animate();
    }

    private animate() {
        this.reqId = requestAnimationFrame(() => this.animate());

        assert(this.previousTime !== undefined, "Previous time must be defined");

        const currentTime = performance.now();
        const elapsed = currentTime - this.previousTime;

        if (elapsed > this.fpsInterval) {
            this.previousTime = currentTime - (elapsed % this.fpsInterval);
            this.props.update();
        }
    }
}
