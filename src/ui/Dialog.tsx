import * as React from "react";

import "../css/Dialog.scss";

export interface Options {
    title: string | JSX.Element,
    description: string | JSX.Element,
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

export function showDialog(options: Options): Promise<[number, string]> {
    if (dialogElement) {
        dialogElement.showModal();
        const closeWith = options.buttons.length - 1;
        dialogElement.onclose = () => {
            resolveFn?.([closeWith, ""]);
        };
    }
    setState?.(options);
    return new Promise((resolve) => resolveFn = resolve);
}

export default class DialogContainer extends React.Component<unknown, State> {
    constructor(props: unknown) {
        super(props);

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
        setState = (options) => this.setState({
            options,
            input: options.defaultText ?? "",
        });
    }

    public render() {
        return <dialog
            tabIndex={-1}
            ref={(element) => dialogElement = element}
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
                            dialogElement?.close();
                            resolveFn?.([0, this.state.input]);
                        }
                    }}
                />
            }
            <div className="buttons">
                {
                    this.state.options.buttons.map((button, i) => {
                        return <button
                            autoFocus={i === 0 && !this.state.options.textInput}
                            onClick={() => {
                                dialogElement?.close();
                                resolveFn?.([i, this.state.input]);
                            }}
                        >
                            {button}
                        </button>;
                    })
                }
            </div>
        </dialog>;
    }
}
