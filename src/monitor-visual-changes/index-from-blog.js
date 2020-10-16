
const puppeteer = require('puppeteer');
const fs = require('fs');
const compareImages = require("resemblejs/compareImages");
const fsz = require("mz/fs");
const siteName = 'cinecalidad';
// I used a popular movie download site

(async () => {


    const path = `./screenshots/${siteName}-prev.png`
    let prevImage = null;
    try {
        if (fs.existsSync(path)) {
            //file exists
            prevImage = fs.readFileSync(path);
        }
    } catch (err) {
        console.error(err)
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Adjustments particular to this page to ensure we hit desktop breakpoint.
    page.setViewport({ width: 1000, height: 900, deviceScaleFactor: 1 });

    await page.goto(`https://${siteName}.mx`, { waitUntil: 'networkidle0' });


    const fileName = prevImage ? `${siteName}-new.png` : `${siteName}-prev.png`;
    if(fileName.includes('new.png')){
        try {
            if (fs.existsSync(`./screenshots/${siteName}-new.png`)) {
                //file exists
                fs.rename(`./screenshots/${siteName}-new.png`,`./screenshots/${siteName}-prev.png`,(err)=> {
                    console.log(err);
                });
            }
        } catch (err) {
            console.error(err)
        }
    }
    await screenshotDOMElement(page,{
        path: `screenshots/${fileName}`,
        selector: 'div#content',
        padding: 0
    });

    browser.close();

    try {
        if (fs.existsSync(`./screenshots/${siteName}-new.png`) && fs.existsSync(`./screenshots/${siteName}-prev.png`)) {
            //file exists
            console.log('file exists');
            getDiff(siteName);
        }
    } catch (err) {
        console.error(err)
    }

})();

async function screenshotDOMElement(page,opts = {}) {
    const padding = 'padding' in opts ? opts.padding : 0;
    const path = 'path' in opts ? opts.path : null;
    const selector = opts.selector;

    if (!selector)
        throw Error('Please provide a selector.');

    const rect = await page.evaluate(selector => {
        const element = document.querySelector(selector);
        if (!element)
            return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { left: x, top: y, width, height, id: element.id };
    }, selector);

    if (!rect)
        throw Error(`Could not find element that matches selector: ${selector}.`);

    return await page.screenshot({
        path,
        clip: {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2
        }
    });
}

async function getDiff() {
    const options = {
        output: {
            errorColor: {
                red: 255,
                green: 0,
                blue: 0
            },
            errorType: "diffOnly",
            largeImageThreshold: 1200,
            useCrossOrigin: false,
            outputDiff: true
        },
        scaleToSameSize: true,
        ignore: "antialiasing",
        
    };
 
    const data = await compareImages(
        await fsz.readFile(`./screenshots/${siteName}-new.png`),
        await fsz.readFile(`./screenshots/${siteName}-prev.png`),
        options
    );
    console.log(data);
    await fsz.writeFile(`./screenshots/${siteName}-diff.png`, data.getBuffer());
}
