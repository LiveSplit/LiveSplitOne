export const FRAME_RATE_MATCH_SCREEN = "Match Screen";
export const FRAME_RATE_AUTOMATIC = "Battery Aware";

const LOW_POWER_REFRESH_RATE = 30;

export type FrameRateSetting = FrameRate | typeof FRAME_RATE_AUTOMATIC;
export type FrameRate = number | typeof FRAME_RATE_MATCH_SCREEN;

(async () => {
    try {
        const batteryApi = await (navigator as any).getBattery();
        batteryApi.onchargingchange = () => {
            batteryAwareFrameRate = batteryApi.charging === true
                ? FRAME_RATE_MATCH_SCREEN
                : LOW_POWER_REFRESH_RATE;
        };
    } catch {
        // The battery API is not supported by every browser.
    }
})();

// In case the battery API is not available, we use try to use the name
// of the platform to determine the frame rate whether it's usually a
// battery-powered device or not.
export let batteryAwareFrameRate: FrameRate = FRAME_RATE_MATCH_SCREEN;
switch (navigator.platform) {
    case "iPhone":
    case "iPad":
    case "Android":
        batteryAwareFrameRate = LOW_POWER_REFRESH_RATE;
}
