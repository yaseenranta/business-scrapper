import puppeteer from 'puppeteer';
import fs from 'fs'

const args = process.argv;
const jsonFile = args[2];

const scrapeEmails = async (websiteUrl) => {
    // Launch a new browser instance
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Go to the homepage
        await page.goto(websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // Look for the contact page link
        const contactPageUrl = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const contactLink = links.find(link => 
                /contact/i.test(link.textContent) || /contact/i.test(link.href)
                
            );
            return contactLink ? contactLink.href : null;
        });

        if (!contactPageUrl) {
            console.log('Contact page not found.');
            await browser.close();
            return;
        }

        // Go to the contact page
        await page.goto(contactPageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Extract email addresses from the contact page
        const emails = await page.evaluate(() => {
            const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const bodyText = document.body.innerText;
            return bodyText.match(regex) || [];
        });

        return emails ?? null;

    } catch (error) {
        // console.error('Error:', error);
    } finally {
        await browser.close();
    }
};

let openJSON = fs.readFileSync(jsonFile, 'utf-8');
let parseJSON = JSON.parse(openJSON);
let updatedResults = [];

for(let i = 0; i < parseJSON.length; i++){ 
    updatedResults[i] = parseJSON[i] 

    let website = parseJSON[i]["website"]
    if (website) {
        let emails = await scrapeEmails(website)

        if (emails) {
            updatedResults[i]["emails"] = emails;
        }
    }    

    if(updatedResults.length == parseJSON.length){
        fs.writeFile(jsonFile,JSON.stringify(updatedResults),function(err) {
            if (err) throw err;
             console.log(`Emails updated in ${jsonFile} file`);
            });
    }

}

