var _ = require('lodash');
var axios = require('axios');
var fs = require('fs');
var cheerio = require('cheerio');
const json2csv = require('json2csv').parse;
const { forEach } = require('p-iteration');
var moment = require('moment');
var startTime;
var endTime;
var total;

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
const requestConfig = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "fr-FR,fr;q=0.9,en-IE;q=0.8,en-CA;q=0.7,en-US;q=0.6,en;q=0.5,la;q=0.4",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-metadata": "cause=\"forced\", destination=\"document\", site=\"cross-site\"",
    "sec-origin-policy": "0",
    "upgrade-insecure-requests": "1"
};
var restosUrlsFile = fs.readFileSync("urls/restosUrls.json");
var restosUrls = JSON.parse(restosUrlsFile);

const fieldsCSV = ['nom', 'mail', 'tel', 'addresse', 'url'];
const optsCSV = {
    fieldsCSV
};

const listCardLinkSelector = '.annonces_list';
var propertiesDatas = {};

axios.defaults.headers.get = requestConfig;

const getData = async url => {
    try {
        const response = await axios.get(url);
        const data = response.data;
        return (data);
    } catch (error) {
        return error;
    }
};


const getDatasFromPage = async (data, url) => {
    const $ = await cheerio.load(data);

    var name = $('.restaurantName h1').text();
    var mail = $('a[href*="mailto"]') != null && $('a[href*="mailto"]').attr('href') ? $('a[href*="mailto"]').attr('href').replace('mailto:', '').replace('?subject=?', '') : '';
    var phone = $('.blEntry.phone .detail').text();
    var address = $('.street-address').text();
    // var url = rootUrl + $('restaurantName h1').find('a.annonce_action.annonce_action--details')[0].href;
    var restoDatas = {
        'name': name,
        'mail': mail,
        'phone': phone,
        'address': address,
        'url': url
    };

    if (url !== undefined || url !== null) {
        propertiesDatas = _.concat(propertiesDatas, restoDatas);
    }

   // console.log(restoDatas);
   var elapsed = moment().diff(startTime, 'seconds');
   var passed = propertiesDatas.length;
   var remaining = total - passed;

   console.log(passed + '/' + total +' ('+ Math.round(passed/total * 100) +'%) en ' + fmtMSS(elapsed)+ 'min, ' + remaining + ' restant en ~' + fmtMSS(Math.round((remaining / (passed / elapsed)))) + 'min');
}


const runThroughUrlFiles = async () => {
    var chunkedUrls = _.chunk(restosUrls, 30);
    startTime = moment();
    total = restosUrls.length;

    console.log('Le grattage de ' + total + ' urls commence à ' + startTime.format("HH:mm:ss")) 

    await forEach(chunkedUrls, async (urls) =>{
        await forEach(urls, async (url) => {
            getDatasFromPage(await getData(url), url);
        });
    });

    console.log('Le grattage se finit en ' + fmtMSS(moment().diff(startTime, 'seconds')) + ' min'); 

    await saveToFile(propertiesDatas) // Sauvegarde des résultats en JSON

}

async function saveToFile(array) {
    try {
        const csv = json2csv(array, optsCSV);
        fs.writeFile(
            './urls/restosInfos' + +new Date() + '.csv',
            csv,
            (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('Infos Restos bien stockés'))
        fs.writeFile(
            './urls/restosInfos.csv',
            csv,
            (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('Infos Restos bien mises à jour'))
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    runThroughUrlFiles();
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


 run();

// runTime();

async function runTime(){
    startTime = moment();
    console.log('On commence, il est ' + startTime.format("HH:mm:ss")) 

    await waitFor(10000);

    endTime = moment();
    console.log('Il s\'est passé ' + fmtMSS(endTime.diff(startTime, 'seconds'))+ ' minutes')
}

function fmtMSS(s){return(s-(s%=60))/60+(9<s?':':':0')+s}
