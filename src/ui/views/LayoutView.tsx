import * as React from "react";
import {
    Language,
    Layout,
    LayoutStateRefMut,
    TimerPhase,
    TimingMethod,
} from "../../livesplit-core";
import { TimerView } from "./TimerView";
import { UrlCache } from "../../util/UrlCache";
import { WebRenderer } from "../../livesplit-core/livesplit_core";
import { GeneralSettings } from "./MainSettings";
import { LiveSplitServer } from "../../api/LiveSplitServer";
import { Option } from "../../util/OptionUtil";
import { LSOCommandSink } from "../../util/LSOCommandSink";
import {
    ArrowLeft,
    Circle,
    Download,
    ListRestart,
    Save,
    SquarePen,
    Upload,
} from "lucide-react";
import { Label, resolve } from "../../localization";

import * as sidebarClasses from "../../css/Sidebar.module.css";

export interface Props {
    isDesktop: boolean;
    layout: Layout;
    layoutState: LayoutStateRefMut;
    layoutUrlCache: UrlCache;
    layoutWidth: number;
    layoutHeight: number;
    generalSettings: GeneralSettings;
    renderWithSidebar: boolean;
    sidebarOpen: boolean;
    commandSink: LSOCommandSink;
    renderer: WebRenderer;
    serverConnection: Option<LiveSplitServer>;
    callbacks: Callbacks;
    currentComparison: string;
    currentTimingMethod: TimingMethod;
    currentPhase: TimerPhase;
    currentSplitIndex: number;
    allComparisons: string[];
    splitsModified: boolean;
    layoutModified: boolean;
}

interface Callbacks {
    exportLayout(): void;
    importLayout(): void;
    importLayoutFromFile(file: File): Promise<void>;
    importSplitsFromFile(file: File): Promise<void>;
    loadDefaultLayout(): void;
    onResize(width: number, height: number): void;
    openAboutView(): void;
    openLayoutEditor(): void;
    openLayoutView(): void;
    openSplitsView(): void;
    openMainSettings(): void;
    openTimerView(): void;
    renderViewWithSidebar(
        renderedView: React.JSX.Element,
        sidebarContent: React.JSX.Element,
    ): React.JSX.Element;
    saveLayout(): void;
    onServerConnectionOpened(serverConnection: LiveSplitServer): void;
    onServerConnectionClosed(): void;
    popOut(): void;
}

export function LayoutView(props: Props) {
    return props.callbacks.renderViewWithSidebar(
        <TimerView {...props} renderWithSidebar={false} />,
        <SideBar
            callbacks={props.callbacks}
            layoutModified={props.layoutModified}
            lang={props.generalSettings.lang}
        />,
    );
}

function SideBar({
    callbacks,
    layoutModified,
    lang,
}: {
    callbacks: Callbacks;
    layoutModified: boolean;
    lang: Language | undefined;
}) {
    return (
        <>
            <h1>{resolve(Label.Layout, lang)}</h1>
            <hr />
            <button onClick={(_) => callbacks.openLayoutEditor()}>
                <SquarePen strokeWidth={2.5} />
                {resolve(Label.Edit, lang)}
            </button>
            <button onClick={(_) => callbacks.saveLayout()}>
                <Save strokeWidth={2.5} />
                <span>
                    {resolve(Label.Save, lang)}
                    {layoutModified && (
                        <Circle
                            strokeWidth={0}
                            size={12}
                            fill="currentColor"
                            className={sidebarClasses.modifiedIcon}
                        />
                    )}
                </span>
            </button>
            <button onClick={(_) => callbacks.importLayout()}>
                <Download strokeWidth={2.5} />
                {resolve(Label.Import, lang)}
            </button>
            <button onClick={(_) => callbacks.exportLayout()}>
                <Upload strokeWidth={2.5} />
                {resolve(Label.Export, lang)}
            </button>
            <button onClick={(_) => callbacks.loadDefaultLayout()}>
                <ListRestart strokeWidth={2.5} />
                {resolve(Label.Default, lang)}
            </button>
            <hr />
            <button onClick={(_) => callbacks.openTimerView()}>
                <ArrowLeft strokeWidth={2.5} />
                {resolve(Label.Back, lang)}
            </button>
        </>
    );
}
