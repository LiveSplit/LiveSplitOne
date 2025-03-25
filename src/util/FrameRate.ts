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

let computePressure: FrameRate = FRAME_RATE_MATCH_SCREEN;

if ("PressureObserver" in window) {
    (async () => {
        try {
            const observer = new (window as any).PressureObserver(
                (records: any) => {
                    const state = records[0].state;
                    switch (state) {
                        case "serious":
                            computePressure = FRAME_RATE_SERIOUS;
                            break;
                        case "critical":
                            computePressure = FRAME_RATE_CRITICAL;
                            break;
                        default:
                            computePressure = FRAME_RATE_MATCH_SCREEN;
                    }
                    updateBatteryAwareFrameRate();
                },
            );
            await observer.observe("cpu", { sampleInterval: 2_000 });
        } catch {
            // The Compute Pressure API is not supported by every browser.
        }
    })();
}

(async () => {
    try {
        const batteryApi = await (navigator as any).getBattery();
        batteryApi.onchargingchange = () => {
            batteryFrameRate =
                batteryApi.charging === true
                    ? FRAME_RATE_MATCH_SCREEN
                    : FRAME_RATE_LOW_POWER;
            updateBatteryAwareFrameRate();
        };
    } catch {
        // The battery API is not supported by every browser.
    }
})();

function updateBatteryAwareFrameRate() {
    // Choose the lower of the two frame rates. If one of them is a string, it
    // is "Match Screen", which has the lowest priority.

    if (typeof batteryFrameRate === "string") {
        batteryAwareFrameRate = computePressure;
    } else if (typeof computePressure === "string") {
        batteryAwareFrameRate = batteryFrameRate;
    } else {
        batteryAwareFrameRate = Math.min(batteryFrameRate, computePressure);
    }
}
