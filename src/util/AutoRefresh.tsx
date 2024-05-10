import * as React from "react";
import { FRAME_RATE_AUTOMATIC, FrameRateSetting, batteryAwareFrameRate } from "./FrameRate";

export interface Props {
    frameRate: FrameRateSetting,
    update(): void,
}

export default class AutoRefresh extends React.Component<Props> {
    private reqId: number | null = null;
    private previousTime: number = 0;

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
        this.previousTime = 0;
        this.animate();
    }

    private animate() {
        this.reqId = requestAnimationFrame(() => this.animate());

        let frameRate = this.props.frameRate;
        if (frameRate === FRAME_RATE_AUTOMATIC) {
            frameRate = batteryAwareFrameRate;
        }

        if (typeof frameRate === "number") {
            const currentTime = performance.now();
            const elapsed = currentTime - this.previousTime;

            const refreshInterval = 1000 / frameRate;

            if (elapsed < refreshInterval) {
                return;
            }
            this.previousTime = currentTime - (elapsed % refreshInterval);
        }

        this.props.update();
    }
}
