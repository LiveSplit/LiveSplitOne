const fs = require("fs");
const path = require("path");
const { fork } = require("child_process");
const {
    Builder,
    By,
    until,
} = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");
const imghash = require("imghash");
const hex64 = require("hex64");
const pixelmatch = require("pixelmatch");
const PNG = require("pngjs").PNG;

describe("Layout Rendering Tests", () => {
    let driver, serverProcess;

    const LAYOUTS_FOLDER = "test/layouts";
    const SCREENSHOTS_FOLDER = "test/screenshots";
    const SPLITS_FOLDER = "test/splits";

    const findElement = async (selector) => {
        return driver.wait(until.elementLocated(selector));
    };

    const clickElement = async (selector) => {
        const element = await driver.wait(until.elementLocated(selector));
        await element.click();
    }

    const loadFile = async (filePath) => {
        const inputElement = await findElement(By.id("file-input"));
        await inputElement.sendKeys(path.resolve(filePath));
    }

    before(async () => {
        serverProcess = fork("./node_modules/webpack-dev-server/bin/webpack-dev-server.js");

        const service = new chrome.ServiceBuilder(chromedriver.path).build();
        chrome.setDefaultService(service);
        const options = new chrome.Options().windowSize({ width: 1200, height: 2400 }).headless();
        driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

        await driver.get("http://localhost:8080");

        await driver.executeScript(() => {
            HTMLInputElement.prototype.click = function() {
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
    });

    const testRendering = (layoutName, splitsName, expectedHash) => {
        it(`Renders the ${layoutName} layout with the ${splitsName} splits correctly`, async () => {
            await clickElement(By.xpath(".//button[contains(text(), 'Layout')]"));
            await clickElement(By.xpath(".//button[contains(text(), 'Import')]"));
            await loadFile(`${LAYOUTS_FOLDER}/${layoutName}.ls1l`);
            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            await clickElement(By.xpath(".//button[contains(text(), 'Splits')]"));
            await clickElement(By.xpath(".//button[contains(text(), 'Import')]"));
            await loadFile(`${SPLITS_FOLDER}/${splitsName}.lss`);
            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));
    
            const layoutElement = await findElement(By.className("layout"));
            const layoutScreenshot = await layoutElement.takeScreenshot();

            const tempFilePath = `${SCREENSHOTS_FOLDER}/${layoutName}.png`;

            fs.writeFileSync(tempFilePath, layoutScreenshot, "base64");
            const actualHashHex = await imghash.hash(tempFilePath, 12);
            const actualHash = hex64.encode(actualHashHex);

            const actualScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${actualHash.replace("/", "$")}.png`;
            const expectedScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${expectedHash.replace("/", "$")}.png`;

            fs.renameSync(tempFilePath, actualScreenshotPath);

            if (actualHash !== expectedHash) {
                let showWarning = false;
                try {
                    if (fs.existsSync(expectedScreenshotPath)) {
                        const actualImage = PNG.sync.read(fs.readFileSync(actualScreenshotPath));
                        const expectedImage = PNG.sync.read(fs.readFileSync(expectedScreenshotPath));
                        const { width, height } = actualImage;
                        const diff = new PNG({ width, height });
        
                        const numPixelsDifferent = pixelmatch(actualImage.data, expectedImage.data, diff.data, width, height);

                        if (numPixelsDifferent === 0) {
                            showWarning = true;
                        }
        
                        fs.writeFileSync(`${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_diff.png`, PNG.sync.write(diff));
                    }
                }
                finally {
                    if (showWarning) {
                        console.warn(`Render match despite mismatching hashes! Expected hash: ${expectedHash}, actual hash: ${actualHash}`);
                    } else {
                        throw Error(`Render mismatch! Expected hash: ${expectedHash}, actual hash: ${actualHash}`)
                    }
                }
            }
        });
    }

    testRendering("all_components", "default", "8AAD____-BAAAAAAAALABv_j");
    testRendering("all_components", "pmw3", "8AAD__8A-B_DuDvDLDACRP-_");
    testRendering("default", "default", "__wBAAAAAAAAAAAAAAAAAP__");
    testRendering("default", "pmw3", "_4uBiDvDODPDvDLDPDrDAP-H");
    testRendering("splits_two_rows", "celeste", "-D-D0B_DyB8D0B_D1D_jxDwD");
    testRendering("splits_with_labels", "celeste", "AKAL__8D8DkAgDsD_86D-D-A");
    testRendering("title_centered_no_game_icon", "celeste", "__BgDw__BwAAAwDxDx__DwAA");
    testRendering("title_centered_with_game_icon", "celeste", "__AwRw__wwwAwYx5x5__x4AA");
    testRendering("title_left_no_attempt_count", "celeste", "__4A4A__4AAAMA8A8A__cAAA");

    after(async () => {
        await driver.quit();
        serverProcess.kill();
    });
});
