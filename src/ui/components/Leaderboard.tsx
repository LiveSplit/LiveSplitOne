import * as React from "react";
import { expect, map, Option } from "../../util/OptionUtil";
import {
    Category,
    Game,
    PlayersEmbedded,
    Run,
    Variable,
} from "../../api/SpeedrunCom";
import { getGameInfo, getPlatforms, getRegions } from "../../api/GameList";
import { resolveEmbed } from "../Embed";
import { Markdown, replaceFlag } from "./Markdown";
import { formatLeaderboardTime } from "../../util/TimeUtil";
import { formatDate, Label, resolve } from "../../localization";

import * as classes from "../../css/Leaderboard.module.scss";
import * as runEditorClasses from "../../css/RunEditor.module.scss";
import * as tableClasses from "../../css/Table.module.scss";
import * as markdownClasses from "../../css/Markdown.module.scss";
import { Language } from "../../livesplit-core";

export interface Filters {
    region?: string;
    platform?: string;
    isEmulated?: boolean;
    showObsolete: boolean;
    variables: Map<string, string>;
}

export function Leaderboard({
    game,
    category,
    leaderboard,
    filters,
    expandedLeaderboardRows,
    toggleExpandLeaderboardRow,
    lang,
}: {
    game: string;
    category: Option<Category>;
    leaderboard: Run<PlayersEmbedded>[];
    filters: Filters;
    expandedLeaderboardRows: Map<number, boolean>;
    toggleExpandLeaderboardRow: (rowIndex: number) => void;
    lang: Language | undefined;
}) {
    const gameInfo = getGameInfo(game);
    const platformList = getPlatforms();
    const regionList = getRegions();

    let hideMilliseconds: boolean;
    if (gameInfo !== undefined) {
        hideMilliseconds = !gameInfo.ruleset["show-milliseconds"];
    } else {
        hideMilliseconds = leaderboard.every(
            (r) => r.times.primary_t === Math.floor(r.times.primary_t),
        );
    }

    let rank = 0;
    let visibleRowCount = 0;
    let uniqueCount = 0;
    let lastTime = "";

    const uniquenessSet = new Set();

    const allVariables = gameInfo?.variables;
    const variables = allVariables?.data.filter((variable) =>
        isVariableValidForCategory(variable, category),
    );
    const variableColumns = variables?.filter(
        (variable) => !filters.variables.get(variable.name),
    );

    return (
        <table
            className={`${runEditorClasses.runEditorTab} ${classes.leaderboardTable}`}
        >
            <thead className={runEditorClasses.tableHeader}>
                <tr>
                    <th>{resolve(Label.Rank, lang)}</th>
                    <th>{resolve(Label.Player, lang)}</th>
                    <th>{resolve(Label.Time, lang)}</th>
                    {variableColumns?.map((variable) => (
                        <th>{variable.name}</th>
                    ))}
                </tr>
            </thead>
            <tbody className={tableClasses.tableBody}>
                {leaderboard.map((run) => {
                    const platform = platformList.get(run.system.platform);
                    if (isFiltered(platform, filters.platform)) {
                        return null;
                    }

                    const region = map(run.system.region, (r) =>
                        regionList.get(r),
                    );
                    if (isFiltered(region, filters.region)) {
                        return null;
                    }

                    if (
                        filters.isEmulated !== undefined &&
                        run.system.emulated !== filters.isEmulated
                    ) {
                        return null;
                    }

                    const renderedVariables = [];

                    if (variables !== undefined) {
                        for (const variable of variables) {
                            if (
                                isVariableValidForCategory(variable, category)
                            ) {
                                const variableValueId = run.values[variable.id];
                                const variableValue = map(
                                    variableValueId,
                                    (i) => variable.values.values[i],
                                );
                                const filterValue = filters.variables.get(
                                    variable.name,
                                );
                                if (
                                    isFiltered(
                                        variableValue?.label,
                                        filterValue,
                                    )
                                ) {
                                    return null;
                                }
                            }
                        }
                    }

                    if (variableColumns !== undefined) {
                        for (const variable of variableColumns) {
                            const valueId = run.values[variable.id];
                            let valueName;
                            if (valueId) {
                                const value = Object.entries(
                                    variable.values.values,
                                ).find(
                                    ([listValueId]) => listValueId === valueId,
                                );
                                valueName = map(value, (v) => v[1].label);
                            }
                            renderedVariables.push(
                                <td className={classes.variableColumn}>
                                    {valueName ?? ""}
                                </td>,
                            );
                        }
                    }

                    const uniquenessKeys = run.players.data.map((p) =>
                        p.rel === "guest" ? `guest:${p.name}` : p.id,
                    );

                    const uniquenessKey = JSON.stringify(uniquenessKeys);
                    const isUnique = !uniquenessSet.has(uniquenessKey);
                    if (!isUnique && !filters.showObsolete) {
                        return null;
                    }
                    uniquenessSet.add(uniquenessKey);

                    const rowIndex = visibleRowCount;
                    const evenOdd =
                        rowIndex % 2 === 0
                            ? tableClasses.explicitOdd
                            : tableClasses.explicitEven;
                    let expandedRow = null;

                    if (expandedLeaderboardRows.get(rowIndex) === true) {
                        let embed = null;
                        if (
                            run.videos != null &&
                            run.videos.links != null &&
                            run.videos.links.length > 0
                        ) {
                            const videoUri =
                                run.videos.links[run.videos.links.length - 1]
                                    .uri;
                            embed = resolveEmbed(videoUri);
                        }
                        const comment = run.comment ?? "";

                        expandedRow = (
                            <tr
                                key={`${run.id}_expanded`}
                                className={`${classes.leaderboardExpandedRow} ${evenOdd}`}
                            >
                                <td
                                    colSpan={4 + (variableColumns?.length ?? 0)}
                                >
                                    {embed}
                                    <div
                                        // FIXME: Move this into the
                                        // Markdown component, probably
                                        className={markdownClasses.markdown}
                                        style={{
                                            minHeight: 5,
                                        }}
                                    >
                                        <Markdown
                                            markdown={comment}
                                            speedrunCom
                                        />
                                    </div>
                                    <table className={classes.runMetaTable}>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    {resolve(Label.Date, lang)}
                                                </td>
                                                <td>
                                                    {run.date != null
                                                        ? formatDate(
                                                              run.date,
                                                              lang,
                                                          )
                                                        : ""}
                                                </td>
                                            </tr>
                                            {map(region, (r) => (
                                                <tr>
                                                    <td>
                                                        {resolve(
                                                            Label.Region,
                                                            lang,
                                                        )}
                                                        :
                                                    </td>
                                                    <td>{r}</td>
                                                </tr>
                                            ))}
                                            {map(platform, (p) => (
                                                <tr>
                                                    <td>
                                                        {resolve(
                                                            Label.Platform,
                                                            lang,
                                                        )}
                                                        :
                                                    </td>
                                                    <td>
                                                        {p}
                                                        {run.system.emulated &&
                                                            ` ${resolve(
                                                                Label.EmulatorTag,
                                                                lang,
                                                            )}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        );
                    }

                    visibleRowCount += 1;
                    if (isUnique) {
                        uniqueCount += 1;
                        if (run.times.primary !== lastTime) {
                            rank = uniqueCount;
                            lastTime = run.times.primary;
                        }
                    }

                    return [
                        <tr
                            key={run.id}
                            title={run.comment ?? ""}
                            className={`${classes.leaderboardRow} ${evenOdd}`}
                            onClick={(_) =>
                                toggleExpandLeaderboardRow(rowIndex)
                            }
                            style={{
                                cursor: "pointer",
                            }}
                        >
                            <td
                                className={`${classes.leaderboardRankColumn} ${tableClasses.number}`}
                            >
                                {isUnique ? rank : "—"}
                            </td>
                            <td>
                                {run.players.data.map((p, i) => {
                                    if (p.rel === "user") {
                                        const style = p["name-style"];
                                        let color;
                                        if (style.style === "gradient") {
                                            color = style["color-from"].dark;
                                        } else {
                                            color = style.color.dark;
                                        }
                                        const flag = map(p.location, (l) =>
                                            replaceFlag(l.country.code),
                                        );
                                        return [
                                            i !== 0 ? ", " : null,
                                            <a
                                                target="_blank"
                                                href={p.weblink}
                                                style={{ color }}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {flag}
                                                {p.names.international}
                                            </a>,
                                        ];
                                    } else {
                                        const possibleMatch =
                                            /^\[([a-z]+)\](.+)$/.exec(p.name);
                                        let name = p.name;
                                        let flag;
                                        if (possibleMatch !== null) {
                                            flag = replaceFlag(
                                                possibleMatch[1],
                                            );
                                            name = possibleMatch[2];
                                        }
                                        return [
                                            i !== 0 ? ", " : null,
                                            <span
                                                className={
                                                    classes.unregisteredUser
                                                }
                                            >
                                                {flag}
                                                {name}
                                            </span>,
                                        ];
                                    }
                                })}
                            </td>
                            <td
                                className={`${classes.leaderboardTimeColumn} ${tableClasses.number}`}
                            >
                                <a
                                    href={run.weblink}
                                    target="_blank"
                                    style={{ color: "white" }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {formatLeaderboardTime(
                                        run.times.primary_t,
                                        hideMilliseconds,
                                        lang,
                                    )}
                                </a>
                            </td>
                            {renderedVariables}
                        </tr>,
                        expandedRow,
                    ];
                })}
            </tbody>
        </table>
    );
}

export function LeaderboardButtons({
    gameInfo,
    category,
    filters,
    speedrunComVariables,
    runId,
    updateFilters,
    interactiveAssociateRunOrOpenPage,
    lang,
}: {
    gameInfo: Game;
    category: Option<Category>;
    filters: Filters;
    speedrunComVariables: {
        [key: string]: string | undefined;
    };
    runId: string;
    updateFilters: () => void;
    interactiveAssociateRunOrOpenPage: () => void;
    lang: Language | undefined;
}) {
    const regionList = [""];
    const platformList = [""];
    const allRegions = getRegions();
    const allPlatforms = getPlatforms();

    const filterList = [];
    const subcategoryBoxes = [];

    if (allRegions.size !== 0) {
        for (const regionId of gameInfo.regions) {
            const regionName = allRegions.get(regionId);
            if (regionName !== undefined) {
                regionList.push(regionName);
            }
        }
    }

    if (allPlatforms.size !== 0) {
        for (const platformId of gameInfo.platforms) {
            const platformName = allPlatforms.get(platformId);
            if (platformName !== undefined) {
                platformList.push(platformName);
            }
        }
    }

    if (regionList.length > 2) {
        filterList.push(
            <tr>
                <td>{resolve(Label.Region, lang)}:</td>
            </tr>,
        );
        filterList.push(
            <tr>
                <td>
                    <select
                        value={filters.region ?? ""}
                        style={{
                            width: "100%",
                        }}
                        onChange={(e) => {
                            filters.region = e.target.value;
                            updateFilters();
                        }}
                    >
                        {regionList.map((v) => (
                            <option value={v}>{v}</option>
                        ))}
                    </select>
                </td>
            </tr>,
        );
    }

    if (platformList.length > 2) {
        filterList.push(
            <tr>
                <td>{resolve(Label.Platform, lang)}:</td>
            </tr>,
        );
        filterList.push(
            <tr>
                <td>
                    <select
                        value={filters.platform ?? ""}
                        style={{
                            width: "100%",
                        }}
                        onChange={(e) => {
                            filters.platform = e.target.value;
                            updateFilters();
                        }}
                    >
                        {platformList.map((v) => (
                            <option value={v}>{v}</option>
                        ))}
                    </select>
                </td>
            </tr>,
        );
    }

    if (gameInfo.ruleset["emulators-allowed"]) {
        filterList.push(
            <tr>
                <td>{resolve(Label.Emulator, lang)}:</td>
            </tr>,
        );
        filterList.push(
            <tr>
                <td>
                    <select
                        value={
                            filters.isEmulated === true
                                ? "yes"
                                : filters.isEmulated === false
                                  ? "no"
                                  : ""
                        }
                        style={{
                            width: "100%",
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "yes") {
                                filters.isEmulated = true;
                            } else if (value === "no") {
                                filters.isEmulated = false;
                            } else {
                                filters.isEmulated = undefined;
                            }
                            updateFilters();
                        }}
                    >
                        {[
                            { value: "", label: "" },
                            { value: "yes", label: resolve(Label.Yes, lang) },
                            { value: "no", label: resolve(Label.No, lang) },
                        ].map((v) => (
                            <option value={v.value}>{v.label}</option>
                        ))}
                    </select>
                </td>
            </tr>,
        );
    }

    const variables = expect(
        gameInfo.variables,
        "We need the variables to be embedded",
        lang,
    );
    for (const variable of variables.data) {
        if (isVariableValidForCategory(variable, category)) {
            if (variable["is-subcategory"]) {
                let currentFilterValue = filters.variables.get(variable.name);
                if (currentFilterValue === undefined) {
                    const runValue = speedrunComVariables[variable.name];
                    if (runValue !== undefined) {
                        currentFilterValue = runValue;
                        filters.variables.set(
                            variable.name,
                            currentFilterValue,
                        );
                    } else {
                        const defaultValueId = variable.values.default;
                        if (defaultValueId != null) {
                            currentFilterValue =
                                variable.values.values[defaultValueId].label;
                            filters.variables.set(
                                variable.name,
                                currentFilterValue,
                            );
                        }
                    }
                }
                subcategoryBoxes.push(
                    <table className={classes.subcategoryTable}>
                        <thead className={runEditorClasses.tableHeader}>
                            <tr>
                                <th>{variable.name}</th>
                            </tr>
                        </thead>
                        <tbody className={tableClasses.tableBody}>
                            {Object.values(variable.values.values).map(
                                ({ label }) => {
                                    const isSelected =
                                        currentFilterValue === label;
                                    return (
                                        <tr>
                                            <td
                                                className={
                                                    isSelected
                                                        ? classes.selected
                                                        : ""
                                                }
                                                onClick={(_) => {
                                                    filters.variables.set(
                                                        variable.name,
                                                        isSelected ? "" : label,
                                                    );
                                                    updateFilters();
                                                }}
                                            >
                                                {label}
                                            </td>
                                        </tr>
                                    );
                                },
                            )}
                        </tbody>
                    </table>,
                );
            } else {
                filterList.push(
                    <tr>
                        <td>{variable.name}:</td>
                    </tr>,
                );
                filterList.push(
                    <tr>
                        <td>
                            <select
                                value={
                                    filters.variables.get(variable.name) ?? ""
                                }
                                style={{
                                    width: "100%",
                                }}
                                onChange={(e) => {
                                    filters.variables.set(
                                        variable.name,
                                        e.target.value,
                                    );
                                    updateFilters();
                                }}
                            >
                                <option value="" />
                                {Object.values(variable.values.values).map(
                                    ({ label }) => (
                                        <option value={label}>{label}</option>
                                    ),
                                )}
                            </select>
                        </td>
                    </tr>,
                );
            }
        }
    }

    filterList.push(
        <tr>
            <td>{resolve(Label.ObsoleteRuns, lang)}:</td>
        </tr>,
    );
    filterList.push(
        <tr>
            <td>
                <select
                    value={filters.showObsolete ? "shown" : "hidden"}
                    style={{
                        width: "100%",
                    }}
                    onChange={(e) => {
                        const value = e.target.value;
                        filters.showObsolete = value === "shown";
                        updateFilters();
                    }}
                >
                    {[
                        {
                            value: "shown",
                            label: resolve(Label.Shown, lang),
                        },
                        {
                            value: "hidden",
                            label: resolve(Label.Hidden, lang),
                        },
                    ].map((v) => (
                        <option value={v.value}>{v.label}</option>
                    ))}
                </select>
            </td>
        </tr>,
    );

    return (
        <>
            <button
                onClick={(_) => {
                    if (category != null) {
                        window.open(
                            `${gameInfo.weblink}?x=${category.id}`,
                            "_blank",
                        );
                    }
                }}
                disabled={category == null}
            >
                {resolve(Label.OpenLeaderboard, lang)}
            </button>
            <button onClick={interactiveAssociateRunOrOpenPage}>
                {runId !== ""
                    ? resolve(Label.OpenPbPage, lang)
                    : resolve(Label.AssociateRun, lang)}
            </button>
            {subcategoryBoxes}
            <table className={classes.filterTable}>
                <thead className={runEditorClasses.tableHeader}>
                    <tr>
                        <th>{resolve(Label.Filters, lang)}</th>
                    </tr>
                </thead>
                <tbody className={tableClasses.tableBody}>{filterList}</tbody>
            </table>
        </>
    );
}

// TODO: Not sure if Run editor should use this.
export function isVariableValidForCategory(
    variable: Variable,
    category: Option<Category>,
) {
    return (
        (variable.category == null || variable.category === category?.id) &&
        (variable.scope.type === "full-game" ||
            variable.scope.type === "global")
    );
}

function isFiltered(
    value: string | undefined,
    filter: string | undefined,
): boolean {
    return filter !== undefined && filter !== "" && value !== filter;
}
