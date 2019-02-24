var _ = require('lodash');
var axios = require('axios');
var fs = require('fs');
var cheerio = require('cheerio');
const json2csv = require('json2csv').parse;


const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
const entryPoint = 'https://www.tripadvisor.fr/ShowUserReviews-g187147-d12614068-r639567978-Bus_Burger-Paris_Ile_de_France.html#review639567978';
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

    console.log(propertiesDatas.length + ' restos grattés');
    console.log(restoDatas);
}


const runThroughUrlFiles = async () => {
    await asyncForEach(restosUrls, async (url) => {
        await waitFor(50);
        await getDatasFromPage(await getData(url), url);
    });
    console.log('Done');
}

async function saveToFile(array) {
    try {
        const csv = json2csv(array, optsCSV);
        console.log(csv);

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
    await runThroughUrlFiles();

    await saveToFile(propertiesDatas); // Sauvegarde des résultats en JSON
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}


run();