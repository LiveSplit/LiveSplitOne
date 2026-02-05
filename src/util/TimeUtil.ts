import { Language } from "../livesplit-core";
import { getLocale } from "../localization";

export function formatLeaderboardTime(
    totalSeconds: number,
    hideMilliseconds: boolean,
    lang: Language | undefined,
): string {
    const locale = getLocale(lang);
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
        return `${hours}:${minutes.toLocaleString(locale, {
            minimumIntegerDigits: 2,
        })}:${seconds.toLocaleString(locale, secondsOptions)}`;
    } else {
        return `${minutes}:${seconds.toLocaleString(locale, secondsOptions)}`;
    }
}
