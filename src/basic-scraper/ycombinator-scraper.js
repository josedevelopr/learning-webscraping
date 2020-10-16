const puppeteer = require('puppeteer');

// This method does not support pagination
// function run()
// {
//     return new Promise(async (resolve, reject) => 
//     {
//         try
//         {
//             const browser = await puppeteer.launch();
//             const page = await browser.newPage();
//             await page.goto("https://news.ycombinator.com/");
//             let urls = await page.evaluate(() => {
//                 let results = [];
//                 let items = document.querySelectorAll('a.storylink');
//                 items.forEach( (item) => {
//                     results.push({
//                         url : item.getAttribute('href'),
//                         text : item.innerText,
//                     });
//                 });
//                 return results;
//             });
//             browser.close();
//             return resolve(urls);
//         } catch(e)
//         {
//             return reject(e);
//         }
//     });
// }

// This method supports pagination
function run(pagesToScrape)
{
    return new Promise(async (resolve, reject) => 
    {
        try
        {
            if(!pagesToScrape)
            {
                pagesToScrape = 1;
            }
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            // Intercepting the page...
            await page.setRequestInterception(true);
            // ... in order to load only 'document' type requests from the url
            page.on('request', (request) => {
                if(request.resourceType() == 'document')
                {
                    request.continue();
                } else 
                {
                    request.abort();
                }
            });

            await page.goto("https://news.ycombinator.com/");
            let currentPage = 1;
            let urls = [];
            
            while(currentPage <= pagesToScrape)
            {
                await page.waitForSelector('a.storylink');
                let newUrls = await page.evaluate(() => {
                    let results = [];
                    let items = document.querySelectorAll('a.storyLink');
                    items.forEach((item) => {
                        results.push({
                            url : item.getAttribute('href'),
                            text : item.innerText,
                        });
                    });
                    return results;
                });
                
                urls = urls.concat(newUrls);
                if(currentPage < pagesToScrape)
                {
                    await Promise.all([
                        await page.waitForSelector('a.morelink'),
                        await page.click('a.morelink'),
                        await page.waitForSelector('a.storylink')
                    ])
                }

                currentPage++;
            }
            browser.close();
            return resolve(urls);
        } catch(e)
        {
            return reject(e);
        }
    });
}

run(5).then(console.log).catch(console.error);