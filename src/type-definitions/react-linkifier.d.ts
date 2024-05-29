declare module "react-linkifier" {
    import { Component, ReactNode } from "react";

    export interface Props {
        target?: string,
        children: ReactNode,
    }

    export default class Linkifier extends Component<Props> { }
}
