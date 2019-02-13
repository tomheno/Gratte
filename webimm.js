const puppeteer = require('puppeteer');
var _ = require('lodash');
const fs = require('fs');
const rootUrl = 'https://www.webimm.com';

async function run() {
  const browser = await puppeteer.launch({
    //headless: false
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

  page.on('request', request => {
    if (request.resourceType() === 'image')
      request.abort();
    else
      request.continue();
  });

  page.on('load', () => console.log("Loaded: " + page.url()));

  await page.goto('https://www.webimm.com/immobilier-entreprise/ile-de-france/75/paris/vente/local-commercial.html'); // Root URL
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
      return (!$('.pagination-last').length);
    })) {
    await page.evaluate(() => {      
      return $('a.pagination-next').first().attr('href');
    }).then(newUrl => {
      console.log(rootUrl + newUrl);
      nextUrl = rootUrl + newUrl;
    });

    console.log('nextUrl', nextUrl);
    await page.goto(nextUrl, {timeout:0}).then(async function(response) {
      console.log('url loaded'); //WORKS FINE
    })


    await page.waitForNavigation().then(console.log('new page loaded'));
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
    return Array.from(document.querySelectorAll('.annonces_list-item .annonce_title')).map(link => link.href);
  });
};

async function saveToFile(array) {
  fs.writeFile(
    './urls/urls' + +new Date() + '.json',
    JSON.stringify(array, null, 2),
    (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('Les addresses sont dans la boîte ;)'))
}