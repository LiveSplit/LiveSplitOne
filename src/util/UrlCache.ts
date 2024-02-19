import { ImageCache, ImageId } from "../livesplit-core";

export class UrlCache {
    private urls: Map<ImageId, string> = new Map();
    public imageCache: ImageCache = ImageCache.new();

    public cache(imageId: ImageId): string | undefined {
        const inCache = this.urls.get(imageId);
        if (inCache !== undefined) {
            return inCache;
        }
        const data = this.imageCache.lookupData(imageId);
        if (data === undefined) {
            return undefined;
        }
        const url = URL.createObjectURL(new Blob([data]));
        this.urls.set(imageId, url);
        return url;
    }

    public collect() {
        if (this.imageCache.collect() !== 0) {
            for (const [key, url] of this.urls) {
                if (this.imageCache.lookupDataPtr(key) === 0) {
                    this.urls.delete(key);
                    URL.revokeObjectURL(url);
                }
            }
        }
    }
}
