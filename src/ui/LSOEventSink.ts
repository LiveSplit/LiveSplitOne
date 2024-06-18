import { EventSink, EventSinkRef, ImageCacheRefMut, LayoutEditorRefMut, LayoutRefMut, LayoutStateRefMut, Run, RunRef, TimeSpan, TimeSpanRef, Timer, TimerPhase, TimingMethod } from "../livesplit-core";
import { WebEventSink } from "../livesplit-core/livesplit_core";
import { showDialog } from "./Dialog";

export class LSOEventSink {
    private eventSink: EventSink;

    constructor(
        private timer: Timer,
        private currentComparisonChanged: () => void,
        private currentTimingMethodChanged: () => void,
        private currentPhaseChanged: () => void,
        private currentSplitChanged: () => void,
        private comparisonListChanged: () => void,
        private splitsModifiedChanged: () => void,
        private onReset: () => void,
    ) {
        this.eventSink = new EventSink(new WebEventSink(this).intoGeneric());
    }

    public [Symbol.dispose](): void {
        this.eventSink[Symbol.dispose]();
        this.timer[Symbol.dispose]();
    }

    public getEventSink(): EventSinkRef {
        return this.eventSink;
    }

    public start(): void {
        this.timer.start();

        this.currentPhaseChanged();
        this.currentSplitChanged();
        this.splitsModifiedChanged();
    }

    public split(): void {
        this.timer.split();

        this.currentPhaseChanged();
        this.currentSplitChanged();
    }

    public splitOrStart(): void {
        this.timer.splitOrStart();

        this.currentPhaseChanged();
        this.currentSplitChanged();
        this.splitsModifiedChanged();
    }

    public async reset(): Promise<void> {
        let updateSplits = true;
        if (this.timer.currentAttemptHasNewBestTimes()) {
            const [result] = await showDialog({
                title: "Save Best Times?",
                description: "You have beaten some of your best times. Do you want to update them?",
                buttons: ["Yes", "No", "Don't Reset"],
            });
            if (result === 2) {
                return;
            }
            updateSplits = result === 0;
        }

        this.timer.reset(updateSplits);

        this.currentPhaseChanged();
        this.currentSplitChanged();
        this.onReset();
    }

    public undoSplit(): void {
        this.timer.undoSplit();

        this.currentPhaseChanged();
        this.currentSplitChanged();
    }

    public skipSplit(): void {
        this.timer.skipSplit();

        this.currentSplitChanged();
    }

    public togglePauseOrStart(): void {
        this.timer.togglePauseOrStart();

        this.currentPhaseChanged();
        this.currentSplitChanged();
        this.splitsModifiedChanged();
    }

    public pause(): void {
        this.timer.pause();

        this.currentPhaseChanged();
    }

    public resume(): void {
        this.timer.resume();

        this.currentPhaseChanged();
    }

    public undoAllPauses(): void {
        this.timer.undoAllPauses();

        this.currentPhaseChanged();
    }

    public switchToPreviousComparison(): void {
        this.timer.switchToPreviousComparison();
        this.currentComparisonChanged();
    }

    public switchToNextComparison(): void {
        this.timer.switchToNextComparison();
        this.currentComparisonChanged();
    }

    public setCurrentComparison(comparison: string): void {
        this.timer.setCurrentComparison(comparison);
        this.currentComparisonChanged();
    }

    public toggleTimingMethod(): void {
        this.timer.toggleTimingMethod();
        this.currentTimingMethodChanged();
    }

    public setGameTime(timeSpanPtr: number): void {
        const timeSpan = new TimeSpanRef(timeSpanPtr);
        this.timer.setGameTime(timeSpan);
    }

    public setGameTimeInner(timeSpan: TimeSpanRef): void {
        this.timer.setGameTime(timeSpan);
    }

    public setGameTimeString(gameTime: string): void {
        using time = TimeSpan.parse(gameTime);
        if (time !== null) {
            this.setGameTimeInner(time);
        }
    }

    public setLoadingTimesString(loadingTimes: string): void {
        using time = TimeSpan.parse(loadingTimes);
        if (time !== null) {
            this.setLoadingTimesInner(time);
        }
    }

    public pauseGameTime(): void {
        this.timer.pauseGameTime();
    }

    public resumeGameTime(): void {
        this.timer.resumeGameTime();
    }

    public setCustomVariable(name: string, value: string): void {
        this.timer.setCustomVariable(name, value);
    }

    public initializeGameTime(): void {
        this.timer.initializeGameTime();
    }

    public setLoadingTimesInner(timeSpan: TimeSpanRef): void {
        this.timer.setLoadingTimes(timeSpan);
    }

    public setRun(run: Run): Run | null {
        const result = this.timer.setRun(run);

        this.currentComparisonChanged();
        this.currentPhaseChanged();
        this.currentSplitChanged();
        this.comparisonListChanged();
        this.splitsModifiedChanged();

        return result;
    }

    public hasBeenModified(): boolean {
        return this.timer.getRun().hasBeenModified();
    }

    public markAsUnmodified(): void {
        this.timer.markAsUnmodified();
        this.splitsModifiedChanged();
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

    public currentTimingMethod(): TimingMethod {
        return this.timer.currentTimingMethod();
    }

    public setCurrentTimingMethod(method: TimingMethod): void {
        this.timer.setCurrentTimingMethod(method);
        this.currentTimingMethodChanged();
    }
}
