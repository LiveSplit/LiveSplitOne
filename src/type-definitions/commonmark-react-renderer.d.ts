

declare module "commonmark-react-renderer" {
    class ReactRenderer {
        constructor(options?: Options);
        render(ast: any): JSX.Element;
    }
    interface Options {
        escapeHtml?: boolean,
        linkTarget?: string,
        softBreak?: string,
    }
    export = ReactRenderer;
}
