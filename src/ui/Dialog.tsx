import * as React from "react";

import "../css/Dialog.scss";

export interface Props {
    onShow: () => void,
    onClose: () => void,
}

export interface Options {
    title: string | React.JSX.Element,
    description: string | React.JSX.Element,
    textInput?: boolean,
    defaultText?: string,
    buttons: string[],
}

export interface State {
    options: Options,
    input: string,
}

let dialogElement: HTMLDialogElement | null = null;
let setState: ((options: Options) => void) | undefined;
let resolveFn: ((_: [number, string]) => void) | undefined;
let onCloseFn: (() => void) | undefined;
let alreadyClosed = false;

export function showDialog(options: Options): Promise<[number, string]> {
    if (dialogElement) {
        dialogElement.showModal();
        alreadyClosed = false;
        dialogElement.setAttribute("disabled", "");
        const closeWith = options.buttons.length - 1;
        dialogElement.onclose = () => {
            if (!alreadyClosed) {
                resolveFn?.([closeWith, ""]);
                onCloseFn?.();
            }
        };
    }
    setState?.(options);
    return new Promise((resolve) => resolveFn = resolve);
}

export default class DialogContainer extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        onCloseFn = props.onClose;

        this.state = {
            options: {
                title: "",
                description: "",
                buttons: [],
            },
            input: "",
        };
    }

    public componentDidMount(): void {
        setState = (options) => {
            this.props.onShow();
            this.setState({
                options,
                input: options.defaultText ?? "",
            });
        };
    }

    public render() {
        return <dialog
            ref={(element) => { dialogElement = element; }}
            onKeyDown={(e) => {
                if (e?.key === "ArrowLeft") {
                    e.preventDefault();
                    (document.activeElement?.previousElementSibling as any)?.focus();
                } else if (e?.key === "ArrowRight") {
                    e.preventDefault();
                    (document.activeElement?.nextElementSibling as any)?.focus();
                }
            }}
        >
            <div className="dialog">
                <h1>{this.state.options.title}</h1>
                <p>{this.state.options.description}</p>
                {
                    this.state.options.textInput && <input
                        type="text"
                        value={this.state.input}
                        autoFocus={true}
                        onChange={(e) => this.setState({ input: e.target.value })}
                        onKeyDown={(e) => {
                            if (e?.key === "Enter") {
                                e.preventDefault();
                                this.close(0);
                            }
                        }}
                    />
                }
                <div className="buttons">
                    {
                        this.state.options.buttons.map((button, i) => {
                            return <button
                                autoFocus={i === 0 && !this.state.options.textInput}
                                onClick={() => this.close(i)}
                            >
                                {button}
                            </button>;
                        })
                    }
                </div>
            </div>
        </dialog>;
    }

    private close(i: number) {
        alreadyClosed = true;
        dialogElement?.close();
        resolveFn?.([i, this.state.input]);
        this.props.onClose();
    }
}
