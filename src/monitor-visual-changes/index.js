const joinPath      = require('path.join');
const puppeteer     = require('puppeteer');
const fs            = require('fs');
const compareImages = require('resemblejs/compareImages');
const fsz           = require('mz/fs');

const siteName = 'cinecalidad';

// function to take a screenshot of a specific element in a web page
async function screenshotDOMElement(page, opts = {})
{
    // getting some properties from the webSite
    const padding   = 'padding' in opts ? opts.padding : 0;
    const path      = 'path' in opts ? opts.path : null;
    const selector  = opts.selector;
    // checking if the selector is empty
    if(!selector)
        throw Error('Please provide a selector.');
    // analyzing the website
    const rect = await page.evaluate(selector => {
        const element = document.querySelector(selector);
        
        if(!element)        
            return null;

        const {x, y, width, height} = element.getBoundingClientRect();
        return {left: x, top: y, width, height, id: element.id};

    }, selector);
    
    if(!rect)
        throw Error(`Could not find element that matches selector : ${selector}.`);
    
    return await page.screenshot({
        path,
        clip: 
        {
            x: rect.left - padding,
            y: rect.top - padding,
            width: rect.width + padding * 2,
            height: rect.height - padding * 2,
        }
    });
}

// function to compare the differences between two images
async function getDiff()
{
    const options = 
    {
        output :
        {
            errorColor :
            {
                red : 255,
                green : 0,
                blue : 0
            },
            errorType : "diffOnly",
            largeImageThreshold : 1200,
            useCrossOrigin : false,
            outputDiff : true
        },
        scaleToSameSize : true,
        ignore : "antialiasing",
    };

    const data = await compareImages(
        await fsz.readFile(joinPath(__dirname,`/screenshots/${siteName}-new.png`)),
        await fsz.readFile(joinPath(__dirname,`/screenshots/${siteName}-prev.png`)),
        options
    );

    console.log(data.misMatchPercentage);

    await fsz.writeFile(joinPath(__dirname,`/screenshots/${siteName}-diff.png`), data.getBuffer());
}

// =======

(async () => {
    const path = joinPath(__dirname,`/screenshots/${siteName}-prev.png`);
    let prevImage = null;

    try
    {
        // Check if previous screenshot exists
        if(fs.existsSync(path))
        {
            // if file exists
            prevImage = fs.readFileSync(path);
        }
    } catch(err)
    {
        console.error(err);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Adjustments particular to this page to ensure we hit desktop breakpoints
    page.setViewport({width: 1000, height: 900, deviceScaleFactor: 1});
    // going to the website
    await page.goto(`https://${siteName}.is`, {waitUntil: 'networkidle0'});

    const fileName = prevImage ? `${siteName}-new.png` : `${siteName}-prev.png`;

    if(fileName.includes('new.png'))
    {
        try
        {
            if(fs.existsSync(`./screenshots/${siteName}-new.png`))
            {
                // file exists
                fs.rename(`./screenshots/${siteName}-new.png`,
                          `./screenshots/${siteName}-prev.png`, (err) => {
                            console.log(err);
                          });
            }
        } catch(err)
        {
            console.error(err);
        }
    }
    // taking screenshot
    console.log(joinPath(__dirname,`/screenshots/${fileName}`));
    await screenshotDOMElement(page, 
        {   path : joinPath(__dirname,`/screenshots/${fileName}`),
            selector : 'div#main_container',
            padding : 0
        }
    );

    browser.close();

    try
    {
        if(fs.existsSync(joinPath(__dirname,`/screenshots/${siteName}-new.png`)) && 
           fs.existsSync(joinPath(__dirname,`/screenshots/${siteName}-prev.png`)))
           {
               // file exists
               console.log('file exists');
               getDiff(siteName);
           } else
           {
            console.log('file does not exist');
           }
    } catch(err)
    {
        console.error(err);
    }

})();