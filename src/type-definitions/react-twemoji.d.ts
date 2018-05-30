declare module "react-twemoji" {
    import { Component } from "react";

    export interface Props {
        className?: string,
        options: Options,
    }

    export interface Options {
        base?: string,         // default MaxCDN
        ext?: string,          // default ".png"
        className?: string,    // default "emoji"
        size?: string | number,  // default "36x36"
        folder?: string        // in case it's specified
    }

    export default class Twemoji extends Component<Props> { }
}
