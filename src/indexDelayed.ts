// This bundles all the imports that are used in the `index.ts` file. They are
// not imported directly there, because we want to keep the size of the
// `index.html` as small as possible, so it can focus on requesting the WASM
// file as soon as possible. This should result in the `indexDelayed.ts` bundle
// containing basically all the JS. This JS bundle and the WASM file should then
// be requested in parallel. While it would be possible to request these all
// individually over in the `index.ts`, browsers don't actually like doing too
// many requests in parallel and it turns out that big JavaScript files actually
// compress better than having many small ones. The WASM file also is pretty
// big, so ideally we are not bottlenecked by the large JS file. If necessary,
// we could do some more bundle splitting for stuff that isn't used until much
// later, like the Markdown library.

// FIXME: Look into pulling even more CSS out of the index.ts as well.

import { LiveSplit } from "./ui/LiveSplit";
import React from "react";
import { createRoot } from "react-dom/client";

export { LiveSplit, React, createRoot };
