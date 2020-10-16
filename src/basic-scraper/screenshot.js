const puppeteer = require('puppeteer');
// Getting url from console
const url = process.argv[2];

if(!url)
{
    throw "Please provide a URL as the first argument";
}

async function run()
{
    // launching the puppeteer browser
    const browser = await puppeteer.launch();
    // opnening a new page
    const page = await browser.newPage();
    // setting the url
    await page.goto(url);
    // taking a screenshot of the first view of the web
    await page.screenshot({ path : 'screenshot.png' });
    // closing the browser
    browser.close();
}

run();