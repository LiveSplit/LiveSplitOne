export function formatLeaderboardTime(totalSeconds: number, hideMilliseconds: boolean): string {
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    const secondsOptions = {
        minimumIntegerDigits: 2,
        minimumFractionDigits: hideMilliseconds ? 0 : 3,
        maximumFractionDigits: hideMilliseconds ? 0 : 3,
    };

    if (hours > 0) {
        return `${
            hours
            }:${
            minutes.toLocaleString("en-GB", {
                minimumIntegerDigits: 2,
            })
            }:${
            seconds.toLocaleString("en-GB", secondsOptions)
            }`;
    } else {
        return `${
            minutes
            }:${
            seconds.toLocaleString("en-GB", secondsOptions)
            }`;
    }
}

export function formatTimeForServer(totalSeconds: number, hideMilliseconds: boolean): string {
    let t = formatLeaderboardTime(totalSeconds, hideMilliseconds);
    let parts = t.split(":");
    if (parts[0].length < 2) {
        return "0" + parts[0] + ":" + parts[1].slice(0, parts[1].length - 1);
    } else {
        return parts[0] + ":" + parts[1].slice(0, parts[1].length - 1);
    }
}
