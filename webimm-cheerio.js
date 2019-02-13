var _ = require('lodash');
var axios = require('axios');
var fs = require('fs');
var cheerio = require('cheerio');

const rootUrl = 'https://www.webimm.com';
const entryPoint = 'https://www.webimm.com/immobilier-entreprise/ile-de-france/75/paris/vente/local-commercial.html';
const requestConfig = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "fr-FR,fr;q=0.9,en-IE;q=0.8,en-CA;q=0.7,en-US;q=0.6,en;q=0.5,la;q=0.4",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-metadata": "cause=\"forced\", destination=\"document\", site=\"cross-site\"",
    "sec-origin-policy": "0",
    "upgrade-insecure-requests": "1"
};
const listCardLinkSelector = '.annonces_list';
var propertiesUrls = {};

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


const getDatasFromPage = async data => {
    const $ = await cheerio.load(data);

    console.log(data);

    $('.annonces_list').each((index, elem) => {
        var url = rootUrl + $(elem).find('a.annonce_action.annonce_action--details').attr('href');
        console.log(url);

        if (url !== undefined || url !== null) {
            propertiesUrls = _.concat(propertiesUrls, url);
        }
    });

    console.log(propertiesUrls);
}

async function saveToFile(array) {
    fs.writeFile(
        './urls/urls' + +new Date() + '.json',
        JSON.stringify(array, null, 2),
        (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('Les addresses sont dans la boîte ;)'))
}

async function run() {
    await getDatasFromPage(await getData(entryPoint)); // Récupération HTML de la page

    await saveToFile(propertiesUrls); // Sauvegarde des résultats en JSON
};

run();