import { CommandError, CommandResult, CommandSink, CommandSinkRef, Event, ImageCacheRefMut, LayoutEditorRefMut, LayoutRefMut, LayoutStateRefMut, Run, RunRef, TimeRef, TimeSpan, TimeSpanRef, Timer, TimerPhase, TimingMethod, isEvent } from "../livesplit-core";
import { WebCommandSink } from "../livesplit-core/livesplit_core";
import { assert } from "../util/OptionUtil";
import { showDialog } from "./Dialog";

interface Callbacks {
    handleEvent(event: Event): void,
    runChanged(): void,
    runNotModifiedAnymore(): void,
    encounteredCustomVariable(name: string): void,
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
        this.commandSink = new CommandSink(new WebCommandSink(this).intoGeneric());
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
        assert(this.locked >= 0, "The lock count should never be negative.");
    }

    public start(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.start() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public split(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.split() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public splitOrStart(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.splitOrStart() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public async reset(): Promise<CommandResult> {
        if (this.locked) {
            return CommandError.Busy;
        }

        let updateSplits = true;
        if (this.timer.currentAttemptHasNewBestTimes()) {
            const [result] = await showDialog({
                title: "Save Best Times?",
                description: "You have beaten some of your best times. Do you want to update them?",
                buttons: ["Yes", "No", "Don't Reset"],
            });
            if (result === 2) {
                return CommandError.RunnerDecidedAgainstReset;
            }
            updateSplits = result === 0;
        }

        const result = this.timer.reset(updateSplits) as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public undoSplit(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.undoSplit() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public skipSplit(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.skipSplit() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public togglePauseOrStart(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.togglePauseOrStart() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public pause(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.pause() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public resume(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.resume() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public undoAllPauses(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.undoAllPauses() as CommandResult;

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

        const result = this.timer.setCurrentComparison(comparison) as CommandResult;

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

        const result = this.timer.initializeGameTime() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public setGameTime(timeSpanPtr: number): CommandResult {
        const timeSpan = new TimeSpanRef(timeSpanPtr);
        return this.setGameTimeInner(timeSpan);
    }

    public setGameTimeString(gameTime: string): CommandResult {
        using time = TimeSpan.parse(gameTime);
        if (time !== null) {
            return this.setGameTimeInner(time);
        } else {
            return CommandError.CouldNotParseTime;
        }
    }

    public setGameTimeInner(timeSpan: TimeSpanRef): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.setGameTime(timeSpan) as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public pauseGameTime(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.pauseGameTime() as CommandResult;

        if (isEvent(result)) {
            this.callbacks.handleEvent(result);
        }

        return result;
    }

    public resumeGameTime(): CommandResult {
        if (this.locked) {
            return CommandError.Busy;
        }

        const result = this.timer.resumeGameTime() as CommandResult;

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
        const result = this.timer.setLoadingTimes(timeSpan) as CommandResult;

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

    public saveAsLssBytes(): Uint8Array {
        return this.timer.saveAsLssBytes();
    }

    public updateLayoutState(
        layout: LayoutRefMut,
        layoutState: LayoutStateRefMut,
        imageCache: ImageCacheRefMut,
    ): void {
        layout.updateState(layoutState, imageCache, this.timer);
    }

    public updateLayoutEditorLayoutState(
        layoutEditor: LayoutEditorRefMut,
        layoutState: LayoutStateRefMut,
        imageCache: ImageCacheRefMut,
    ): void {
        layoutEditor.updateLayoutState(layoutState, imageCache, this.timer);
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
