export const FRAME_RATE_MATCH_SCREEN = "Match Screen";
export const FRAME_RATE_AUTOMATIC = "Battery Aware";

const FRAME_RATE_LOW_POWER = 30;
const FRAME_RATE_SERIOUS = 30;
const FRAME_RATE_CRITICAL = 10;

export type FrameRate = number | typeof FRAME_RATE_MATCH_SCREEN;
export type FrameRateSetting = FrameRate | typeof FRAME_RATE_AUTOMATIC;

// In case the battery API is not available, we use try to use the name of the
// platform to determine whether it's usually a battery-powered device or not.
let batteryFrameRate: FrameRate = FRAME_RATE_MATCH_SCREEN;
switch (navigator.platform) {
    case "iPhone":
    case "iPad":
    case "Android":
        batteryFrameRate = FRAME_RATE_LOW_POWER;
}

export let batteryAwareFrameRate: FrameRate = batteryFrameRate;

if ('PressureObserver' in window) {
    try {
        const observer = new (window as any).PressureObserver((records: any) => {
            const state = records[0].state;
            switch (state) {
                case "serious":
                    batteryAwareFrameRate = FRAME_RATE_SERIOUS;
                    break;
                case "critical":
                    batteryAwareFrameRate = FRAME_RATE_CRITICAL;
                    break;
                default:
                    batteryAwareFrameRate = batteryFrameRate;
            }
        });
        observer.observe("cpu", { sampleInterval: 2_000 });
    } catch {
        // The Compute Pressure API is not supported by the browser.
    }
}

(async () => {
    try {
        const batteryApi = await (navigator as any).getBattery();
        batteryApi.onchargingchange = () => {
            batteryFrameRate = batteryApi.charging === true
                ? FRAME_RATE_MATCH_SCREEN
                : FRAME_RATE_LOW_POWER;
        };
    } catch {
        // The battery API is not supported by every browser.
    }
})();
