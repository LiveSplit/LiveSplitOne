declare module "react-linkifier" {
    import { Component } from "react";

    export interface Props {
        target?: string,
    }

    export default class Linkifier extends Component<Props> { }
}
