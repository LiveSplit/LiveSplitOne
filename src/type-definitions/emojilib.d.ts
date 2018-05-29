declare module "emojilib" {
    export const lib: {
        [emoji_name: string]: Emoji;
    }

    export interface Emoji {
        char: string,
    }
}
