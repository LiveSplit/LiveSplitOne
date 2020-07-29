import { formatLeaderboardTime } from './TimeUtil';

export function mapPhaseEnumToString(phase: number) : string {
    const phases = ["NotRunning", "Running", "Ended", "Paused"];
    if (phase > 0 && phase < phases.length) {
        return phases[phase];
    } else {
        return "";
    }
}

export function formatTimeForServer(totalSeconds: number): string {
    const t = formatLeaderboardTime(totalSeconds, false);
    const parts = t.split(":");
    if (parts[0].length < 2) {
        return "0" + parts[0] + ":" + parts[1].slice(0, parts[1].length - 1);
    } else {
        return parts[0] + ":" + parts[1].slice(0, parts[1].length - 1);
    }
}