const scrape = {
    filename : null,
    feedsCount : 0,
    results : new Set(),
    init : (fname) => {
        scrape.filename = fname;
        scrape.results.clear()

        scrape.feedsCount = document.querySelectorAll('[role="feed"]  > div [jsaction^="mouseover:pane."]').length;
    },    
    safeGetText : (selector) => {                                    
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : null;
    },    
    safeGetHref : (selector) => {
        const element = document.querySelector(selector) ?? null;                                    
        return element ? element.href : null;
    },
    delay : ms => new Promise(res => setTimeout(res, ms)),
    business : async() => {
        const feeds = document.querySelectorAll('[role="feed"]  > div [jsaction^="mouseover:pane."]')
        for (const f of feeds) {
        f.querySelector('a').click()
           await scrape.delay(3000)
            const businessDataDiv = document.querySelector('.bJzME.Hu9e2e.tTVLSc .m6QErb.DxyBCb.kA9KIf.dS8AEf.XiKgde');
            if (businessDataDiv) {        
                scrape.results.add({
                    name: scrape.safeGetText('h1.DUwDvf.lfPIob'),
                    
                    rating: scrape.safeGetText('span[aria-label$="reviews"]'),
                    address: scrape.safeGetText('button[data-tooltip="Copy address"] .Io6YTe.fontBodyMedium.kR99db.fdkmkc'),
                    phone: (() => {
                        const phoneElement = document.querySelector('[aria-label^="Phone:"]');
                        return phoneElement ? phoneElement.getAttribute('aria-label')?.replace('Phone: ', '') : null;
                    })(),
                    website: scrape.safeGetHref('a[data-tooltip="Open website"]'),
                    emails : null,
                })
                
    
                document.querySelector('.k7jAl.miFGmb.lJ3Kh button[aria-label="Close"]').click()
            await scrape.delay(3000)
            }
        }
    
        await scrape.delay(1000)
    
        await scrape.downloadJson()
    },
    downloadJson : async () => {
        let data = scrape.results.values().toArray()
        let filename = scrape.filename;
        if (!data) {
            console.error('Console.save: No data')
            return;
        }
        if (!filename) console.error('download file name required')

        if (typeof data === "object") {
            data = JSON.stringify(data, undefined, 4)
        }
        var blob = new Blob([data], { type: 'text/json' }),
            a = document.createElement('a')
        var e = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
        });

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
        a.dispatchEvent(e)
    }
}

javascript: void ((async() =>{
var e = document.createElement('script');
e.setAttribute('type', 'text/javascript');
e.setAttribute('charset', 'UTF-8');
e.setAttribute('src', 'http://localhost/business-scrapper/console-business-scrapper.js');
document.body.appendChild(e);
var filename = prompt("Please enter filename: ", "");
if (filename != null){scrape.init(`${filename}.json`)}
await scrape.business()
})());

    
