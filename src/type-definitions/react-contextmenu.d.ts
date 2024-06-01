declare module "react-contextmenu" {
    import { ReactNode } from "react";

    export interface ContextMenuProps {
        children?: ReactNode,
    }

    export interface ContextMenuTriggerProps {
        children?: ReactNode,
    }

    export interface MenuItemProps {
        children?: ReactNode,
    }
}