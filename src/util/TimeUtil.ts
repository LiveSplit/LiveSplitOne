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
