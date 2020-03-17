import * as React from "react";
import { getSplitsInfos, SplitsInfo } from "../storage";

export interface Props {
    callbacks: Callbacks,
}

interface State {
    splitsInfos?: Array<[number, SplitsInfo]>,
}

interface Callbacks {
    openTimerView(arg0: boolean): void;
    loadDefaultSplits(): void;
    uploadToSplitsIO(): void;
    openFromSplitsIO(): void;
    exportSplits(): void;
    importSplits(): void;
    saveSplits(): void;
    openRunEditor(): void;
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
}

export class SplitsSelection extends React.Component<Props, State> {
    constructor(props: Props) {
        getSplitsInfos().then(async (splitsInfos) => {
            this.setState({
                splitsInfos,
            });
        });

        super(props);

        this.state = {};
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        if (this.state.splitsInfos === undefined) {
            return <p>Loading...</p>;
        }
        return <div>
            <div>
                <button onClick={() => this.addNewSplits()}>
                    <i className="fa fa-plus" aria-hidden="true" /> Add
                </button>
                <button onClick={() => this.importSplits()}>
                    <i className="fa fa-download" aria-hidden="true" /> Import
                </button>
            </div>
            <div>
                {
                    this.state.splitsInfos.map(([key, info]) => {
                        return <div>
                            <button onClick={() => this.editSplits(key)}>
                                <i className="fa fa-edit" aria-hidden="true" />
                            </button>
                            <button onClick={() => this.copySplits(key)}>
                                <i className="fa fa-clone" aria-hidden="true" />
                            </button>
                            <button onClick={() => this.deleteSplits(key)}>
                                <i className="fa fa-trash" aria-hidden="true" />
                            </button>
                            {info.game} - {info.category}
                        </div>;
                    })
                }
            </div>
        </div>;
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Splits</h1>
                <hr />
                <button onClick={(_) => this.props.callbacks.openRunEditor()}>
                    <i className="fa fa-edit" aria-hidden="true" /> Edit
                </button>
                <button onClick={(_) => this.props.callbacks.saveSplits()}>
                    <i className="fa fa-save" aria-hidden="true" /> Save
                </button>
                <button onClick={(_) => this.props.callbacks.importSplits()}>
                    <i className="fa fa-download" aria-hidden="true" /> Import
                </button>
                <button onClick={(_) => this.props.callbacks.exportSplits()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Export
                </button>
                <button onClick={(_) => this.props.callbacks.openFromSplitsIO()}>
                    <i className="fa fa-download" aria-hidden="true" /> From Splits.io
                </button>
                <button onClick={(_) => this.props.callbacks.uploadToSplitsIO()}>
                    <i className="fa fa-upload" aria-hidden="true" /> Upload to Splits.io
                </button>
                <button onClick={(_) => this.props.callbacks.loadDefaultSplits()}>
                    <i className="fa fa-sync" aria-hidden="true" /> Default
                </button>
                <hr />
                <button onClick={(_) => this.props.callbacks.openTimerView(true)}>
                    <i className="fa fa-caret-left" aria-hidden="true" /> Back
                </button>
            </div>
        );
    }

    private editSplits(_key: number): void {
        throw new Error("Method not implemented.");
    }

    private copySplits(_key: number): void {
        throw new Error("Method not implemented.");
    }

    private deleteSplits(_key: number): void {
        throw new Error("Method not implemented.");
    }

    private importSplits() {
        throw new Error("Method not implemented.");
    }

    private addNewSplits() {
        console.log("hi");
    }
}
