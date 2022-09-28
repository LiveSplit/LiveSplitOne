const fs = require("fs");
const path = require("path");
const { createServer } = require('http-server');
const {
    Builder,
    By,
    until,
} = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");
const imghash = require("imghash");
const hex64 = require("hex64");
const leven = require("leven");
const pixelmatch = require("pixelmatch");
const PNG = require("pngjs").PNG;

describe("Layout Rendering Tests", function () {
    this.timeout(90000);

    let driver, serverProcess;

    const LAYOUTS_FOLDER = "test/layouts";
    const SCREENSHOTS_FOLDER = "test/screenshots";
    const SPLITS_FOLDER = "test/splits";

    const startServer = async () => {
        return new Promise((resolve) => {
            serverProcess = createServer({ root: "./dist" });
            serverProcess.listen(8080, () => {
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
    }

    const loadFile = async (filePath) => {
        const inputElement = await findElement(By.id("file-input"));
        await inputElement.sendKeys(path.resolve(filePath));
        await driver.sleep(500);
    }

    const hashToBinary = (hash) => {
        const buffer = Buffer.from(hash, "base64");
        const values = Array.from(buffer.values());
        return values.map((value) => value.toString(2).padStart(8, "0")).join("");
    };

    before(async () => {
        console.log('Starting server...');

        await startServer();

        console.log('Server started!');
        console.log('Preparing WebDriver for tests...');

        const service = new chrome.ServiceBuilder(chromedriver.path).build();
        chrome.setDefaultService(service);
        const options = new chrome.Options().windowSize({ width: 1200, height: 2400 }).headless();
        driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

        await driver.get("http://localhost:8080");

        await driver.executeScript(() => {
            HTMLInputElement.prototype.click = function () {
                const existingFileInput = document.getElementById("file-input");
                if (existingFileInput) {
                    existingFileInput.remove();
                }
                this.style.display = "none";
                this.id = "file-input";
                document.body.appendChild(this);
            }
        });

        if (!fs.existsSync(SCREENSHOTS_FOLDER)) {
            fs.mkdirSync(SCREENSHOTS_FOLDER);
        }

        console.log('Ready to run tests!');
    });

    const testRendering = (layoutName, splitsName, expectedHash) => {
        it(`Renders the ${layoutName} layout with the ${splitsName} splits correctly`, async function () {
            this.timeout(10000);

            await clickElement(By.xpath(".//button[contains(text(), 'Layout')]"));
            await clickElement(By.xpath(".//button[contains(text(), 'Import')]"));
            await loadFile(`${LAYOUTS_FOLDER}/${layoutName}.ls1l`);
            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            await clickElement(By.xpath(".//button[contains(text(), 'Splits')]"));
            await clickElement(By.xpath(".//button[contains(text(), 'Import')]"));
            await loadFile(`${SPLITS_FOLDER}/${splitsName}.lss`);
            await clickElement(By.xpath("(.//button[contains(@aria-label, 'Open Splits')])[last()]"));
            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            const layoutElement = await findElement(By.className("layout"));
            const layoutScreenshot = await layoutElement.takeScreenshot();

            const tempFilePath = `${SCREENSHOTS_FOLDER}/${layoutName}.png`;

            fs.writeFileSync(tempFilePath, layoutScreenshot, "base64");
            const actualHashHex = await imghash.hash(tempFilePath, 24);
            const actualHash = hex64.encode(actualHashHex);

            const actualScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${actualHash.replace("/", "$")}.png`;
            const expectedScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${expectedHash.replace("/", "$")}.png`;

            fs.renameSync(tempFilePath, actualScreenshotPath);

            const actualBinary = hashToBinary(actualHash);
            const expectedBinary = hashToBinary(expectedHash);
            const distance = leven(actualBinary, expectedBinary);

            if (distance > 1) {
                let showWarning = false;
                try {
                    if (fs.existsSync(expectedScreenshotPath)) {
                        const actualImage = PNG.sync.read(fs.readFileSync(actualScreenshotPath));
                        const expectedImage = PNG.sync.read(fs.readFileSync(expectedScreenshotPath));
                        const { width, height } = actualImage;
                        const diff = new PNG({ width, height });

                        const numPixelsDifferent = pixelmatch(actualImage.data, expectedImage.data, diff.data, width, height, { threshold: 0.2 });

                        if (numPixelsDifferent === 0) {
                            showWarning = true;
                        }

                        fs.writeFileSync(`${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_diff.png`, PNG.sync.write(diff));
                    }
                }
                finally {
                    if (showWarning) {
                        console.warn(`Render match despite mismatching hashes (${layoutName} layout with ${splitsName} splits)! ` +
                            `Expected hash: ${expectedHash}, actual hash: ${actualHash}`);
                    } else {
                        throw Error(`Render mismatch (${layoutName} layout with ${splitsName} splits)! ` +
                            `Expected hash: ${expectedHash}, actual hash: ${actualHash}`)
                    }
                }
            }
        });
    }

    testRendering("all_components", "default", "f4G-QgAAAAAeAAAO____________________AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA__wCAAAAAABv______4Hb4AG");
    testRendering("all_components", "pmw3", "f4G-QgAAAAAeAAAO________fmAOf6AAX4AG3_gH3_AOX_APVkgOX-AOVvAPX_AeX_AeWrAeb_gfAAAAAABv__x-____JABO");
    testRendering("default", "default", "____________AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAD_________");
    testRendering("default", "pmw3", "__wA___GX2AG3-gGUNgGSkAOXnAOW9gOX-APVtwOH_APX8AOX_APRnAOXVAOXJAeHvAeX_wf__AfAAAAAABgAAD_AAB_____");
    testRendering("splits_two_rows", "celeste", "f8AAcAAHf8AA____d4AAcAAHf_gAcAAPd_AAYAAHf4AA____f4AAYAAH__AA____Z_gAYAAHf_8A9VVfb_wAcAAPf_AAYAAP");
    testRendering("splits_with_labels", "celeste", "AABEAADPAADPAADPAADA____fAAH_wAP_wAP_wAPxgAA____QgAH34AP_4AH34APQYAA____0EAP_8AP38AP38APwAAAAAAA");
    testRendering("title_centered_no_game_icon", "celeste", "________AAAAADQAAHQAAH4A______3_____AAAAAAAAAAAA____AAkAAL8DAP8DAP8DAP8D_________-n9AAAAAAAAAAAA");
    testRendering("title_centered_with_game_icon", "celeste", "________AAAAQBoAQBoAYB8A________4B8A4AAA4AAA4AAA4AAA4ASA4H_D4H_D4H_D4H_D_________9T94AAAAAAAAAAA");
    testRendering("title_left_no_attempt_count", "celeste", "________AAAA-AAA-AAA-AAA____________AAAAAAAAAAAA____CQAA_wAA_4AA_4AA_4AA________qf__AAAAAAAAAAAA");

    after(async () => {
        await driver.quit();
        serverProcess.close();
    });
});
