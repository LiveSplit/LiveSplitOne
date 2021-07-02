if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");
}

import "./css/main.scss";
import("./main");
import("./css/font-awesome.css");
