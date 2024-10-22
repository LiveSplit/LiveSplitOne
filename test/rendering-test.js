import fs from "fs";
import path from "path";
import { createServer } from "http-server";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import {} from "chromedriver";
import imghash from "imghash";
import hex64 from "hex64";
import leven from "leven";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

describe("Layout Rendering Tests", function () {
    this.timeout(90000);

    let driver, serverProcess;

    const LAYOUTS_FOLDER = "test/layouts";
    const SCREENSHOTS_FOLDER = "test/screenshots";
    const SPLITS_FOLDER = "test/splits";

    const startServer = async () => {
        return new Promise((resolve) => {
            serverProcess = createServer({ root: "./dist" });
            serverProcess.listen(8081, () => {
                resolve();
            });
        });
    };

    const findElement = async (selector) => {
        return driver.wait(until.elementLocated(selector));
    };

    const clickElement = async (selector) => {
        const element = await findElement(selector);
        await element.click();
    };

    const loadFile = async (filePath) => {
        const inputElement = await findElement(By.id("file-input"));
        await inputElement.sendKeys(path.resolve(filePath));
        await driver.sleep(500);
    };

    const hashToBinary = (hash) => {
        const buffer = Buffer.from(hash, "base64");
        const values = Array.from(buffer.values());
        return values
            .map((value) => value.toString(2).padStart(8, "0"))
            .join("");
    };

    before(async () => {
        console.log("Starting server...");

        await startServer();

        console.log("Server started!");
        console.log("Preparing WebDriver for tests...");

        const options = new chrome.Options()
            .windowSize({ width: 1200, height: 2400 })
            .addArguments("--headless");
        driver = await new Builder()
            .forBrowser("chrome")
            .setChromeOptions(options)
            .build();

        await driver.get("http://localhost:8081");

        await driver.executeScript(() => {
            HTMLInputElement.prototype.click = function () {
                const existingFileInput = document.getElementById("file-input");
                if (existingFileInput) {
                    existingFileInput.remove();
                }
                this.style.display = "none";
                this.id = "file-input";
                document.body.appendChild(this);
            };
        });

        if (!fs.existsSync(SCREENSHOTS_FOLDER)) {
            fs.mkdirSync(SCREENSHOTS_FOLDER);
        }

        console.log("Ready to run tests!");
    });

    const testRendering = (layoutName, splitsName, expectedHash) => {
        it(`Renders the ${layoutName} layout with the ${splitsName} splits correctly`, async function () {
            this.timeout(10000);

            await clickElement(
                By.xpath(".//button[contains(text(), 'Layout')]")
            );
            await clickElement(
                By.xpath(".//button[contains(text(), 'Import')]")
            );
            await loadFile(`${LAYOUTS_FOLDER}/${layoutName}.ls1l`);
            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            await clickElement(
                By.xpath(".//button[contains(text(), 'Splits')]")
            );
            await clickElement(
                By.xpath(".//button[contains(text(), 'Import')]")
            );
            await loadFile(`${SPLITS_FOLDER}/${splitsName}.lss`);
            await clickElement(
                By.xpath(
                    "(.//button[contains(@aria-label, 'Open Splits')])[last()]"
                )
            );
            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            const layoutElement = await findElement(By.className("layout"));

            // The icons load asynchronously, so we need to wait for them to load.
            await driver.sleep(500);

            const layoutScreenshot = await layoutElement.takeScreenshot();

            const tempFilePath = `${SCREENSHOTS_FOLDER}/${layoutName}.png`;

            fs.writeFileSync(tempFilePath, layoutScreenshot, "base64");
            const actualHashHex = await imghash.hash(tempFilePath, 24);
            const actualHash = hex64.encode(actualHashHex);

            const actualScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${actualHash.replace(
                "/",
                "$"
            )}.png`;
            const expectedScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${expectedHash.replace(
                "/",
                "$"
            )}.png`;

            fs.renameSync(tempFilePath, actualScreenshotPath);

            const actualBinary = hashToBinary(actualHash);
            const expectedBinary = hashToBinary(expectedHash);
            const distance = leven(actualBinary, expectedBinary);

            if (distance > 1) {
                let showWarning = false;
                try {
                    if (fs.existsSync(expectedScreenshotPath)) {
                        const actualImage = PNG.sync.read(
                            fs.readFileSync(actualScreenshotPath)
                        );
                        const expectedImage = PNG.sync.read(
                            fs.readFileSync(expectedScreenshotPath)
                        );
                        const { width, height } = actualImage;
                        const diff = new PNG({ width, height });

                        const numPixelsDifferent = pixelmatch(
                            actualImage.data,
                            expectedImage.data,
                            diff.data,
                            width,
                            height,
                            { threshold: 0.2 }
                        );

                        if (numPixelsDifferent === 0) {
                            showWarning = true;
                        }

                        fs.writeFileSync(
                            `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_diff.png`,
                            PNG.sync.write(diff)
                        );
                    }
                } finally {
                    if (showWarning) {
                        console.warn(
                            `Render match despite mismatching hashes (${layoutName} layout with ${splitsName} splits)! ` +
                                `Expected hash: ${expectedHash}, actual hash: ${actualHash}`
                        );
                    } else {
                        throw Error(
                            `Render mismatch (${layoutName} layout with ${splitsName} splits)! ` +
                                `Expected hash: ${expectedHash}, actual hash: ${actualHash}`
                        );
                    }
                }
            }
        });
    };

    testRendering(
        "all_components",
        "default",
        "fwB-WgAAAAA2AAAO____________________AAAAAAAAAAAA____AAAA____AAAA____AAAAf_AAf_AAAAD-Mj___34HbwAG"
    );
    testRendering(
        "all_components",
        "pmw3",
        "fwB-WgAAAAA2AAAO_________8AGf8AAf4AC3_AH_-APX-APXfAGX-APV8AOX-APX-APX-AOL_AOQIAIAAD-b_j_____LgAs"
    );
    testRendering(
        "default",
        "default",
        "________8AADVVVVAAAAAAAAAAAA____________AAAAAAAAAAAA____VVVVAAAA____AAAAVVVVAAAAAADgAAD_________"
    );
    testRendering(
        "default",
        "pmw3",
        "b_gAb_-GV8AG3_AHV_AGXuAGX-AGV-AOX-AOX_AOX-AP38AO3-APX-APXeAOWWAOXeAOX_gO_-AfAAAAAADgAAD_q97_____"
    );
    testRendering(
        "splits_two_rows",
        "celeste",
        "b4AAYAAH________bwAA4AAHb-AA4AAHb-AAYAAHbwAA____bwAAYAAH_9VV____b_AAYAAH__wA____b_AAYAAPb8AAYAAP"
    );
    testRendering(
        "splits_with_labels",
        "celeste",
        "AAAAAAA8AAA_AAA3AAAn________WAAHfwAHfwAHXwAHVVVVAAAA2wAH_wAH_wAH3wAH________9IAP_4AP34AP34APAAAA"
    );
    testRendering(
        "title_centered_no_game_icon",
        "celeste",
        "________MzMzADwAADwAADwA________VX1VADwAAAAAAAAA____ABkDAP8DAP8DAP8DAP8D________V_1XACEAAAAAAAAA"
    );
    testRendering(
        "title_centered_with_game_icon",
        "celeste",
        "________AjIiQDwAYDwAYDwA________YDwAYDwAYAAAYAAAczszYBkDYP8DYP8DYP8DYP8D________d_1XYCEAAAAAAAAA"
    );
    testRendering(
        "title_left_no_attempt_count",
        "celeste",
        "________IiIi8AAA-AAA-AAA_________VVV-AAAAAAAAAAA____GQAA_wAA_wAA_wAA_wAA________f_1XKQAAAAAAAAAA"
    );

    after(async () => {
        await driver.quit();
        serverProcess.close();
    });
});
