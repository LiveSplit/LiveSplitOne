import * as React from "react";

export interface Props {
    update(): void,
}

export default class AutoRefresh extends React.Component<Props> {
    private reqId: number | null;

    constructor(props: Props) {
        super(props);

        this.reqId = null;
    }

    public componentWillMount() {
        this.requestFrame();
    }

    public componentWillUnmount() {
        if (this.reqId) {
            cancelAnimationFrame(this.reqId);
        }
    }

    public render() {
        return this.props.children;
    }

    private requestFrame() {
        this.reqId = requestAnimationFrame(() => this.tick());
    }

    private tick() {
        this.props.update();
        this.requestFrame();
    }
}
