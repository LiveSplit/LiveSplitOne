import * as React from "react";
import { expect } from "../util/OptionUtil";
import { install } from "resize-observer";

import "../css/Abbreviated.scss";

if (!(window as any).ResizeObserver) { install(); }

export interface Props {
    abbreviations: string[],
}

export default class Abbreviated extends React.Component<Props> {
    public sorted: string[];
    public oldAbbreviations: string[];
    public element: React.RefObject<HTMLDivElement>;

    constructor(props: Props) {
        super(props);
        this.element = React.createRef();
        this.sorted = [...this.props.abbreviations];
        this.sorted.sort((a, b) => b.length - a.length);
        this.oldAbbreviations = this.props.abbreviations;
    }

    public componentDidMount() {
        const element = expect(this.element.current, "Element should exist by now.");
        new (window as any).ResizeObserver(() => {
            this.chooseAbbreviation();
        }).observe(element);

        this.chooseAbbreviation();
    }

    public componentDidUpdate() {
        const arrEq = (a: string[], b: string[]) => {
            if (a.length !== b.length) {
                return false;
            }
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
            return true;
        };
        if (!arrEq(this.props.abbreviations, this.oldAbbreviations)) {
            this.oldAbbreviations = this.props.abbreviations;
            this.sorted = [...this.props.abbreviations];
            this.sorted.sort((a, b) => b.length - a.length);
            this.chooseAbbreviation();
        }
    }

    public render() {
        return <div
            className="abbreviated"
            ref={this.element}
        />;
    }

    private chooseAbbreviation() {
        if (this.element.current === null) {
            // We can still get here for a short time when unmounting.
            return;
        }

        for (const abbrev of this.sorted) {
            this.element.current.innerText = abbrev;
            if (this.element.current.scrollWidth <= this.element.current.clientWidth) {
                return;
            }
        }
        this.element.current.innerText = this.sorted[0];
    }
}
