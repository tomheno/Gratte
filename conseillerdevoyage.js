const puppeteer = require('puppeteer');
var _ = require('lodash');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({
    // headless: false
  });
  

  praticiensUrls = [];
  const page = await browser.newPage();
  page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1");
  

  page.on('console', msg => {
    for (let i = 0; i < msg.args.length; ++i)
      console.log(`${i}: ${msg.args[i]}`);
  });
  page.setDefaultNavigationTimeout(0);

  await page.setRequestInterception(true);
  page.on('request', (request) => {
      if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
          request.abort();
      } else {
          request.continue();
      }
  });

  await page.on('load', () => console.log("Loaded: " + page.url()));
  
  page.setJavaScriptEnabled(false);

  await page.goto('https://www.tripadvisor.fr/Restaurants-g187147-Paris_Ile_de_France.html#EATERY_LIST_CONTENTS', {
    waitLoad: true, 
    timeout: 3000000
  }); // Root URL

  page.setJavaScriptEnabled(false);  

  await collectFromPagination(page);
  await saveToFile(praticiensUrls)

  // browser.close();
}

run();

async function selectPageAndSearch(page) {
  console.log('selecting page and searching, wait end !');

  let goNext = true;
  var pagesPassed = 1;
  var categoryPraticiensUrlsCount = 0;

  while (goNext) {
    console.log('goNext again');

    await getFacilitiesUrls(page).then(newPraticiensUrl => {
      console.log(newPraticiensUrl);
      categoryPraticiensUrlsCount += newPraticiensUrl.length;
      praticiensUrls = _.concat(praticiensUrls, newPraticiensUrl)
    });
    await paginateNext(page, pagesPassed).then(runAgain => {
      goNext = runAgain;
      pagesPassed++;
      console.log(pagesPassed);
    });
  }
  console.log('[Total] ' + praticiensUrls.length, '[Récoltés] ' + categoryPraticiensUrlsCount, );
}

async function paginateNext(page, count) {
  console.log('Page ' + count);
  var nextUrl;

  if (await page.evaluate(() => {
      return (!document.querySelector('.next').classList.contains('disabled'));
    })) {
    await page.evaluate(() => {      
      return document.querySelector('.next').href;
    }).then(newUrl => {
      console.log(newUrl);
      nextUrl = newUrl;
    });

    console.log('nextUrl', nextUrl);
    await page.goto(nextUrl, {
      waitLoad: true, 
      timeout: 3000000
    }).then(async function(response) {
      console.log('url loaded'); //WORKS FINE

      page.on('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.dismiss();
      });
    })

    return true;
  } else {
    return false;
  }
}


async function collectFromPagination(page) {
  console.log('collecting from pagination');
    await selectPageAndSearch(page);
}

async function getFacilitiesUrls(page) {
  console.log('getting facilities url');

  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.locationList .listing a.details.detailsLLR.details_bauhaus_simple')).map(link => link.href);
  });
};

async function saveToFile(array) {
  fs.writeFile(
    './urls/urls' + +new Date() + '.json',
    JSON.stringify(array, null, 2),
    (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('Nouvelles URLS stockées'))
    
  fs.writeFile(
    './urls/restosUrls.json',
    JSON.stringify(array, null, 2),
    (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('Nouvelle liste prête ;)'))
}

