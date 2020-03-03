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
        const element = await findElement(selector);
        await element.click();
    }

    const loadFile = async (filePath) => {
        const inputElement = await findElement(By.id("file-input"));
        await inputElement.sendKeys(path.resolve(filePath));
    }

    before(async () => {
        serverProcess = fork("./node_modules/webpack-dev-server/bin/webpack-dev-server.js", ["-p"]);

        const service = new chrome.ServiceBuilder(chromedriver.path).build();
        chrome.setDefaultService(service);
        const options = new chrome.Options().windowSize({ width: 1200, height: 2400 }).headless();
        driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

        console.log('temp1');
        //const temp1 = await driver.takeScreenshot();
        //fs.writeFileSync('temp1.png', temp1, "base64");

        await driver.get("http://localhost:8080");

        console.log('temp2');
        //const temp2 = await driver.takeScreenshot();
        //fs.writeFileSync('temp2.png', temp2, "base64");

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

        console.log('temp3');
        //const temp3 = await driver.takeScreenshot();
        //fs.writeFileSync('temp3.png', temp3, "base64");

        if (!fs.existsSync(SCREENSHOTS_FOLDER)) {
            fs.mkdirSync(SCREENSHOTS_FOLDER);
        }

        console.log('temp4');
        //const temp4 = await driver.takeScreenshot();
        //fs.writeFileSync('temp4.png', temp4, "base64");
    });

    const testRendering = (layoutName, splitsName, expectedHash) => {
        it(`Renders the ${layoutName} layout with the ${splitsName} splits correctly`, async () => {
            console.log('temp5');
            //const temp5 = await driver.takeScreenshot();
            //fs.writeFileSync('temp5.png', temp5, "base64");

            await clickElement(By.xpath(".//button[contains(text(), 'Layout')]"));

            console.log('temp69');
            //const temp69 = await driver.takeScreenshot();
            //fs.writeFileSync('temp69.png', temp69, "base64");

            await clickElement(By.xpath(".//button[contains(text(), 'Import')]"));

            console.log('temp6');
            //const temp6 = await driver.takeScreenshot();
            //fs.writeFileSync('temp6.png', temp6, "base64");

            await loadFile(`${LAYOUTS_FOLDER}/${layoutName}.ls1l`);

            console.log('temp7');
            //const temp7 = await driver.takeScreenshot();
            //fs.writeFileSync('temp7.png', temp7, "base64");

            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            console.log('temp8');
            //const temp8 = await driver.takeScreenshot();
            //fs.writeFileSync('temp8.png', temp8, "base64");

            await clickElement(By.xpath(".//button[contains(text(), 'Splits')]"));

            console.log('temp9');
            //const temp9 = await driver.takeScreenshot();
            //fs.writeFileSync('temp9.png', temp9, "base64");

            await clickElement(By.xpath(".//button[contains(text(), 'Import')]"));

            console.log('temp10');
            //const temp10 = await driver.takeScreenshot();
            //fs.writeFileSync('temp10.png', temp10, "base64");

            await loadFile(`${SPLITS_FOLDER}/${splitsName}.lss`);

            console.log('temp11');
            //const temp11 = await driver.takeScreenshot();
            //fs.writeFileSync('temp11.png', temp11, "base64");

            await clickElement(By.xpath(".//button[contains(text(), 'Back')]"));

            console.log('temp12');
            //const temp12 = await driver.takeScreenshot();
            //fs.writeFileSync('temp12.png', temp12, "base64");
    
            const layoutElement = await findElement(By.className("layout"));

            console.log('temp13');
            //const temp13 = await driver.takeScreenshot();
            //fs.writeFileSync('temp13.png', temp13, "base64");

            const layoutScreenshot = await layoutElement.takeScreenshot();

            console.log('temp14');
            //const temp14 = await driver.takeScreenshot();
            //fs.writeFileSync('temp14.png', temp14, "base64");

            console.log('temp15');
            const tempFilePath = `${SCREENSHOTS_FOLDER}/${layoutName}.png`;

            fs.writeFileSync(tempFilePath, layoutScreenshot, "base64");
            console.log('temp16');
            const actualHashHex = await imghash.hash(tempFilePath, 24);
            console.log('temp17');
            const actualHash = hex64.encode(actualHashHex);
            console.log('temp18');

            const actualScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${actualHash.replace("/", "$")}.png`;
            const expectedScreenshotPath = `${SCREENSHOTS_FOLDER}/${layoutName}_${splitsName}_${expectedHash.replace("/", "$")}.png`;

            fs.renameSync(tempFilePath, actualScreenshotPath);
            console.log('temp19');

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
                        console.warn(`Render match despite mismatching hashes (${layoutName} layout with ${splitsName} splits)! ` +
                            `Expected hash: ${expectedHash}, actual hash: ${actualHash}`);
                    } else {
                        throw Error(`Render mismatch (${layoutName} layout with ${splitsName} splits)! ` +
                            `Expected hash: ${expectedHash}, actual hash: ${actualHash}`)
                    }
                }
            }
            console.log('temp20');
        });
    }

    testRendering("all_components", "default", "f4H-QgAAAAAaAAAO____________________AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA__wCAAAAAABv______4Hb4AG");
    testRendering("all_components", "pmw3", "f4H-QgAAAAAaAAAO________fmAOf6AAX4AG3_gH3_AOX_APVkgOX-AOVvAPX_AeX_AeWrAebvgfAAAAAABvf_5_f___JIBO");
    testRendering("default", "default", "________8AAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAD_________");
    testRendering("default", "pmw3", "f_4Ab__mX2AG3-gGUNgGSkgOX3AOW9gOX-APVlwOH_APX8AO1uAPUnAOX1AOXLAeHvAeX_wf__AfAAAAAABgAAD_AAB_____");
    testRendering("splits_two_rows", "celeste", "f8AAcAAHf8AA____d4AAcAAHf_gAcAAPd_AAYAAHf4AA____f4AAYAAH__AA____Z_gAYAAHf_8A9VVfb_wAcAAPf_AAYAAP");
    testRendering("splits_with_labels", "celeste", "AABAAABMAADPAADPAADP____7AAP_wAP_wAP_wAPwgAA____QAAH2oAP_4AH34APX4AA____wAAP9EAP38AP38AP38AAAAAA");
    testRendering("title_centered_no_game_icon", "celeste", "________AAAAADQAAHQAAH4A____________AAAAAAAAAAAA____AAkAAL8DAP8DAP8DAP8D_________-n9AAAAAAAAAAAA");
    testRendering("title_centered_with_game_icon", "celeste", "________AAAAIB0AIB8AYB8A________cB8AcAAAcAAAcAAAcAAAcAZAcC_DcD_DcD_DcD_D_________9Z9cAAAAAAAAAAA");
    testRendering("title_left_no_attempt_count", "celeste", "________AAAA-AAA-AAA-AAA____________AAAAAAAAAAAA____CQAA_wAA_4AA_4AA_4AA________qf__AAAAAAAAAAAA");

    after(async () => {
        await driver.quit();
        serverProcess.kill();
    });
});
