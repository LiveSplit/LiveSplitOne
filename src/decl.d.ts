/*
* Declarations file for modules that do not have typings
* to supress Typescript Errors
*/

interface Window {
	wrapSize(): void;
	setSize(width: number, height: number): void;
	openNewWindow(path: string, modal?: boolean, title?: string, width?: number, height?: number): void;
}
