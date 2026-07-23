import {
    CommandError,
    CommandResult,
    CommandSink,
    CommandSinkRef,
    Event,
    ImageCacheRefMut,
    Language,
    LayoutEditorRefMut,
    LayoutRefMut,
    LayoutStateRefMut,
    Run,
    RunRef,
    TimeRef,
    TimeSpanRef,
    Timer,
    TimerPhase,
    TimingMethod,
    isEvent,
} from "../livesplit-core";
import { WebCommandSink } from "../livesplit-core/livesplit_core";
import { assert } from "./OptionUtil";
import { showDialog } from "../ui/components/Dialog";
import { Label, orAutoLang, resolve } from "../localization";

interface Callbacks {
    handleEvent(event: Event): void;
    runChanged(): void;
    runNotModifiedAnymore(): void;
    encounteredCustomVariable(name: string): void;
    getLang(): Language | undefined;
}

export class LSOCommandSink {
    private commandSink: CommandSink;
    // We don't want to the timer to be interacted with while we are in menus
    // where the timer is not visible or otherwise meant to be interacted with,
    // nor do we want it to to be interacted with while dialogs are open.
    // Multiple of these conditions can be true at the same time, so we count
    // them.
    private locked = 0;

    constructor(
        private timer: Timer,
        private callbacks: Callbacks,
    ) {
        this.commandSink = new CommandSink(
            new WebCommandSink(this).intoGeneric(),
        );
    }

    public [Symbol.dispose](): void {
        this.commandSink[Symbol.dispose]();
        this.timer[Symbol.dispose]();
    }

    public getCommandSink(): CommandSinkRef {
        return this.commandSink;
    }

    public isLocked(): boolean {
        return this.locked > 0;
    }

    public lockInteraction() {
        this.locked++;
    }

    public unlockInteraction() {
        this.locked--;
        assert(this.locked >= 0, "The lock count should never be negative.", this.callbacks.getLang());
    }

    public start(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.start();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public split(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.split();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public splitOrStart(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.splitOrStart();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public async reset(updateSplits?: boolean): Promise<CommandResult> {
        if (this.locked) {
            return CommandError.Busy;
        }

        if (updateSplits === undefined && this.timer.currentAttemptHasNewBestTimes()) {
            const lang = this.callbacks.getLang();
            const [result] = await showDialog({
                title: resolve(Label.SaveBestTimesTitle, lang),
                description:
                    resolve(Label.SaveBestTimesDescription, lang),
                buttons: [
                    resolve(Label.Yes, lang),
                    resolve(Label.No, lang),
                    resolve(Label.DontReset, lang),
                ],
            });
            if (result === 2) {
                return CommandError.RunnerDecidedAgainstReset;
            }
            updateSplits = result === 0;
        }

        const result: CommandResult = this.timer.reset(updateSplits ?? true);

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public undoSplit(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.undoSplit();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public skipSplit(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.skipSplit();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public togglePauseOrStart(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.togglePauseOrStart();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public pause(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.pause();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public resume(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.resume();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public undoAllPauses(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.undoAllPauses();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public switchToPreviousComparison(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        this.timer.switchToPreviousComparison();
        const result = Event.ComparisonChanged;

        this.callbacks.handleEvent(result);

        return result;
    }

    public switchToNextComparison(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        this.timer.switchToNextComparison();
        const result = Event.ComparisonChanged;

        this.callbacks.handleEvent(result);

        return result;
    }

    public setCurrentComparison(comparison: string): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.setCurrentComparison(
            comparison,
        );

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public toggleTimingMethod(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        this.timer.toggleTimingMethod();
        const result = Event.TimingMethodChanged;

        this.callbacks.handleEvent(result);

        return result;
    }

    public setCurrentTimingMethod(method: TimingMethod): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        this.timer.setCurrentTimingMethod(method);
        const result = Event.TimingMethodChanged;

        this.callbacks.handleEvent(result);

        return result;
    }

    public initializeGameTime(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.initializeGameTime();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public setGameTime(timeSpanPtr: number): CommandResult {
        const timeSpan = new TimeSpanRef(timeSpanPtr);
        return this.setGameTimeInner(timeSpan);
    }

    public setGameTimeInner(timeSpan: TimeSpanRef): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.setGameTime(timeSpan);

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public pauseGameTime(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.pauseGameTime();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public resumeGameTime(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result: CommandResult = this.timer.resumeGameTime();

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public setLoadingTimes(timeSpanPtr: number): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const timeSpan = new TimeSpanRef(timeSpanPtr);
        const result: CommandResult = this.timer.setLoadingTimes(timeSpan);

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public setCustomVariable(name: string, value: string): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        this.timer.setCustomVariable(name, value);
        const result = Event.CustomVariableSet;

        this.callbacks.handleEvent(result);
        this.callbacks.encounteredCustomVariable(name);

        return result;
    }

    public setRun(run: Run): Run | null {
        const result = this.timer.setRun(run);

        this.callbacks.runChanged();

        return result;
    }

    public hasBeenModified(): boolean {
        return this.timer.getRun().hasBeenModified();
    }

    public markAsUnmodified(): void {
        this.timer.markAsUnmodified();
        this.callbacks.runNotModifiedAnymore();
    }

    public getRun(): RunRef {
        return this.timer.getRun();
    }

    public extendedFileName(useExtendedCategoryName: boolean): string {
        return this.timer.getRun().extendedFileName(useExtendedCategoryName);
    }

    public saveAsLssBytes(): Uint8Array<ArrayBuffer> {
        return this.timer.saveAsLssBytes();
    }

    public updateLayoutState(
        layout: LayoutRefMut,
        layoutState: LayoutStateRefMut,
        imageCache: ImageCacheRefMut,
        lang: Language | undefined,
    ): void {
        layout.updateState(layoutState, imageCache, this.timer, orAutoLang(lang));
    }

    public updateLayoutEditorLayoutState(
        layoutEditor: LayoutEditorRefMut,
        layoutState: LayoutStateRefMut,
        imageCache: ImageCacheRefMut,
        lang: Language | undefined,
    ): void {
        layoutEditor.updateLayoutState(layoutState, imageCache, this.timer, orAutoLang(lang));
    }

    public currentTime(): TimeRef {
        return this.timer.currentTime();
    }

    public currentSplitIndex(): number {
        return this.timer.currentSplitIndex();
    }

    public segmentsCount(): number {
        return this.timer.getRun().segmentsLen();
    }

    public currentPhase(): TimerPhase {
        return this.timer.currentPhase();
    }

    public currentComparison(): string {
        return this.timer.currentComparison();
    }

    public getAllComparisons(): string[] {
        const run = this.timer.getRun();
        const len = run.comparisonsLen();
        const comparisons = [];
        for (let i = 0; i < len; i++) {
            comparisons.push(run.comparison(i));
        }
        return comparisons;
    }

    public getAllCustomVariables(): Set<string> {
        const customVariables = new Set<string>();
        using customVariablesIter = this.getRun().metadata().customVariables();
        while (true) {
            const element = customVariablesIter.next();
            if (element === null) {
                break;
            }
            customVariables.add(element.name());
        }
        return customVariables;
    }

    public currentTimingMethod(): TimingMethod {
        return this.timer.currentTimingMethod();
    }

    getTimer(): number {
        return this.timer.ptr;
    }
}
