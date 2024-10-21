import puppeteer from 'puppeteer';
import fs from 'fs'

const cities = [
    "A Coruña",
    "Álava", 
    "Albacete", 
    "Alicante", 
    "Almería", 
    "Gijón", 
    "Oviedo", 
    "Ávila", 
    "Badajoz", 
    "Palma de Mallorca",
    "Ibiza",
    "Barcelona", 
    "Burgos", 
    "Cáceres", 
    "Cádiz", 
    "Cantabria", 
    "Castellón", 
    "Ciudad Real", 
    "Córdoba", 
    "Cuenca", 
    "Girona", 
    "Granada", 
    "Guadalajara", 
    "Gipuzkoa", 
    "Huelva", 
    "Huesca", 
    "Jaén", 
    "La Rioja", 
    "Las Palmas de Gran Canaria", 
    "León", 
    "Lleida", 
    "Lugo", 
    "Madrid", 
    "Málaga", 
    "Murcia", 
    "Navarra", 
    "Ourense", 
    "Palencia", 
    "Pontevedra", 
    "Salamanca", 
    "Segovia", 
    "Sevilla", 
    "Soria", 
    "Tarragona", 
    "Santa Cruz de Tenerife", 
    "Teruel", 
    "Toledo", 
    "Valencia", 
    "Valladolid", 
    "Vizcaya", 
    "Zamora", 
    "Zaragoza", 
    "Bilbao", 
    "San Sebastián", 
    "Vitoria"
]

const args = process.argv;
const businessType = args[2];

const scrapeBusinesses = async (city,businessType) => {

    const limit = 100;
    const timeLimit = 5;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setViewport({
        width: 1920,
        height: 1080,
    });

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        request.continue();
    });

    const results = [];
    const startTime = Date.now();
    const scrapedNames = new Set();

    try {
        
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(businessType)}+in+${encodeURIComponent(city)}`, {
            waitUntil: 'networkidle2',
        });

        await page.waitForSelector('[role="feed"]', { timeout: 5000 }).catch(() => console.log('Feed not found, continuing...'));

        while (results.length < limit && Date.now() - startTime < timeLimit * 60 * 1000) {
            // while (results.length < limit) {        
            const elements = await page.$$('[role="feed"]  > div [jsaction^="mouseover:pane."]');

            for (const element of elements) {
                
                if (results.length >= limit || Date.now() - startTime >= timeLimit * 60 * 1000) break;
            
                // await page.screenshot({
                //     path: Date.now()+'.jpg',
                //   });

                try {
                    const businessName = await element.evaluate(el => {
                        const nameElement = el.querySelector('.fontHeadlineSmall');
                        return nameElement ? nameElement.textContent?.trim() : null;
                    });
                    // console.log(businessName, " << scrapedNames : ", scrapedNames)
                    if (businessName && !scrapedNames.has(businessName)) {
                        scrapedNames.add(businessName);

                        const nameElement = await element.$('.fontHeadlineSmall');
                        if (nameElement) {
                            await nameElement.evaluate(el => el.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' }));
                            await nameElement.click();
                        }
                        
                            await sleep(3000)


                        const businessDataDiv = await page.waitForSelector('.bJzME.Hu9e2e.tTVLSc .m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde', { timeout: 10000 }).catch(() => console.log('Detail container not found, continuing...'));

                        if (businessDataDiv) {                            
                            
                            const businessData = await page.evaluate(() => {
                                const safeGetText = (selector) => {
                                    
                                    const element = document.querySelector(selector);
                                    return element ? element.textContent.trim() : null;
                                };

                                const safeGetHref = (selector) => {
                                    const element = document.querySelector(selector) ?? null;                                    
                                    return element ? element.href : null;
                                };

                                return {
                                    name: safeGetText('h1.DUwDvf.lfPIob'),
                                    rating: safeGetText('span[aria-label$="reviews"]'),
                                    address: safeGetText('button[data-tooltip="Copy address"] .Io6YTe.fontBodyMedium.kR99db.fdkmkc'),
                                    phone: (() => {
                                        const phoneElement = document.querySelector('[aria-label^="Phone:"]');
                                        return phoneElement ? phoneElement.getAttribute('aria-label')?.replace('Phone: ', '') : null;
                                    })(),
                                    website: safeGetHref('a[data-tooltip="Open website"]'),
                                    emails : null,
                                };
                            });

                            if (businessData) {
                                results.push(businessData);
                            }

                            await page.evaluate(() => {

                                const closeBtn = document.querySelector('.k7jAl.miFGmb.lJ3Kh button[aria-label="Close"]')  ?? null;
                                if (closeBtn) {
                                    closeBtn.click();
                                }
                            });
                            await sleep(3000)
                            // await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                } catch (error) {
                    console.error('Error processing an element:', error);
                }
            }

            // Scroll to load more results
            await page.evaluate(() => {
                const feed = document.querySelector('[role="feed"]');
                if (feed) {
                    feed.scrollTop = feed.scrollHeight;
                }
            });
            await sleep(3000)
            // await new Promise(resolve => setTimeout(resolve, 2000));
        }
       
        StoreData(businessType,city,results)


    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        await browser.close();
    }

}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const StoreData = (businessType,city,results) => {

    let dir = `./data/${businessType}`;
    // let filename = `${dir}/business_data_${city}_${businessType}_${new Date().toISOString().split('T')[0]}.json`;
    let filename = `${dir}/${city}.json`;

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir,{ recursive: true });
    }

    fs.writeFile(filename,JSON.stringify(results),function(err) {
        if (err) throw err;
         console.log(`saved ${filename}`);
        });
}


for (let index = 0; index < cities.length; index++) {
    const city = cities[index];
    const pathToFileOrDir = `./data/${businessType}/${city}.json` 

    await scrapeBusinesses(city,businessType);        



    // if (fs.existsSync(pathToFileOrDir)) {
    //     console.log(`fetched ${pathToFileOrDir}`);
    // }else{
    //     await scrapeBusinesses(city,businessType);        
    // }
}