import * as React from "react";

import { SettingsComponent } from "./Settings";
import { SettingsDescriptionJson, SettingValue, HotkeyConfig } from "../livesplit-core";
import { toast } from "react-toastify";
import { UrlCache } from "../util/UrlCache";

import "../css/SettingsEditor.scss";

export interface Props {
    hotkeyConfig: HotkeyConfig,
    urlCache: UrlCache,
    callbacks: Callbacks,
}

export interface State {
    settings: SettingsDescriptionJson,
}

interface Callbacks {
    renderViewWithSidebar(renderedView: JSX.Element, sidebarContent: JSX.Element): JSX.Element,
    closeSettingsEditor(save: boolean): void,
}

export class SettingsEditor extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            settings: props.hotkeyConfig.settingsDescriptionAsJson(),
        };
    }

    public render() {
        const renderedView = this.renderView();
        const sidebarContent = this.renderSidebarContent();
        return this.props.callbacks.renderViewWithSidebar(renderedView, sidebarContent);
    }

    private renderView() {
        return (
            <div className="settings-editor">
                <SettingsComponent
                    context="settings-editor"
                    factory={SettingValue}
                    state={this.state.settings}
                    editorUrlCache={this.props.urlCache}
                    setValue={(index, value) => {
                        if (!this.props.hotkeyConfig.setValue(index, value)) {
                            toast.error("The hotkey is already in use.");
                            return;
                        }
                        this.update();
                    }}
                />
            </div>
        );
    }

    private renderSidebarContent() {
        return (
            <div className="sidebar-buttons">
                <h1>Settings</h1>
                <hr />
                <div className="small">
                    <button
                        className="toggle-left"
                        onClick={(_) => this.props.callbacks.closeSettingsEditor(true)}
                    >
                        <i className="fa fa-check" aria-hidden="true" /> OK
                    </button>
                    <button
                        className="toggle-right"
                        onClick={(_) => this.props.callbacks.closeSettingsEditor(false)}
                    >
                        <i className="fa fa-times" aria-hidden="true" /> Cancel
                    </button>
                </div>
            </div>
        );
    }

    private update() {
        this.setState({
            ...this.state,
            settings: this.props.hotkeyConfig.settingsDescriptionAsJson(),
        });
    }
}
