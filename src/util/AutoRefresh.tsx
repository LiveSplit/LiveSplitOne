import * as React from "react";
import {
    FRAME_RATE_AUTOMATIC,
    FrameRateSetting,
    batteryAwareFrameRate,
} from "./FrameRate";

interface State {
    reqId?: number;
    previousTime: number;
    frameRate: FrameRateSetting;
    update: () => void;
}

export default function AutoRefresh({
    frameRate,
    update,
    children,
}: {
    frameRate: FrameRateSetting;
    update: () => void;
    children: React.ReactNode;
}) {
    const { current: state } = React.useRef<State>({
        previousTime: 0,
        frameRate,
        update,
    });
    state.frameRate = frameRate;
    state.update = update;

    const animate = React.useCallback(() => {
        state.reqId = requestAnimationFrame(animate);

        let frameRate = state.frameRate;
        if (frameRate === FRAME_RATE_AUTOMATIC) {
            frameRate = batteryAwareFrameRate;
        }

        if (typeof frameRate === "number") {
            const currentTime = performance.now();
            const elapsed = currentTime - state.previousTime;

            const refreshInterval = 1000 / frameRate;

            if (elapsed < refreshInterval) {
                return;
            }
            state.previousTime = currentTime - (elapsed % refreshInterval);
        }

        state.update();
    }, []);

    React.useEffect(() => {
        state.previousTime = 0;
        animate();

        return () => {
            if (state.reqId) {
                cancelAnimationFrame(state.reqId);
            }
        };
    }, []);

    return children;
}
