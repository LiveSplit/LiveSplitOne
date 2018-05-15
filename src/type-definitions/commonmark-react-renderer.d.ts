

declare module "commonmark-react-renderer" {
    class ReactRenderer {
        constructor();
        render(ast: any): JSX.Element;
    }
    export = ReactRenderer;
}
