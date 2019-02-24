var _ = require('lodash');
var axios = require('axios');
var fs = require('fs');
var cheerio = require('cheerio');
const json2csv = require('json2csv').parse;
const fieldsCSV = ['nom', 'mail', 'tel', 'addresse', 'url'];
const optsCSV = {
    fieldsCSV
};

const parse = require('csv-parse/lib/sync')
const assert = require('assert')
const fileName = "totreat.csv";

var notClearedDatas;
var clearedDatas;
var mailsToRemove;

var argv = require('minimist')(process.argv.slice(2));
var runDomainsCheck = false;

if (argv.domains) {
    runDomainsCheck = true;
    console.log('Vérification des domaines');
} else {
    console.log('Pas de vérification des domaines');
}

function run() {
    fs.readFile("urls/mailstoremove.csv", "utf8", function (err, data) {
        mailsToRemove = _.flatten(parse(data, {
            columns: false,
            skip_empty_lines: true
        }));

        fs.readFile("urls/" + fileName, "utf8", function (err, data) {
            notClearedDatas = parse(data, {
                columns: false,
                skip_empty_lines: true
            });

            var compactedDatas = _.compact(notClearedDatas);
            var previousLength = compactedDatas.length;

            var datasWithMails = _.remove(compactedDatas, function (data) {
                if (data[1].length < 1) {
                    return false;
                } else {
                    return true
                }
            });

            console.log('Données avec mails : ' + datasWithMails.length);

            var datasWithoutDoubles = _.remove(datasWithMails, function (data) {
                if (_.includes(mailsToRemove, data[1])) {
                    return false;
                } else {
                    return true
                }
            });

            console.log('Données avec mails et non exclues : ' + datasWithoutDoubles.length);

            if (runDomainsCheck) {
                var datasWithoutDomains = _.remove(datasWithoutDoubles, function (data) {
                    var valueToReturn = true;

                    _.each(domains, function (domain) {
                        if (_.includes(data[1], domain)) {
                            valueToReturn = false;
                            return false;
                        }
                    });

                    return valueToReturn;
                });

                console.log('Données avec mails, non exclues et avec domaine personnalisé : ' + datasWithoutDomains.length);
            }



            if (!runDomainsCheck) {
                console.log('🛈 On passe de ' + previousLength + ' à ' + datasWithoutDoubles.length + ' contacts');

                saveToFile(datasWithoutDoubles);
            } else {
                console.log('🛈 On passe de ' + previousLength + ' à ' + datasWithoutDomains.length + ' contacts');

                saveToFileWithRest(datasWithoutDomains, datasWithoutDoubles);
            }
        });
    });
}



async function saveToFile(array) {
    try {
        const csv = json2csv(array, {
            header: false
        });

        fs.writeFile(
            './cleaned/cleaned_' + fileName,
            csv,
            (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('✅  Infos bien nettoyées'))
    } catch (err) {
        console.error(err);
    }
}

async function saveToFileWithRest(array, arrayRest) {
    try {
        const csv = json2csv(array, {
            header: false
        });

        fs.writeFile(
            './cleaned/cleaned_customMail_' + fileName,
            csv,
            (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('✅  Infos avec mails perso bien enregistrées'))
    } catch (err) {
        console.error(err);
    }

    try {
        const csv = json2csv(arrayRest, {
            header: false
        });

        fs.writeFile(
            './cleaned/cleaned_classic_' + fileName,
            csv,
            (err) => err ? console.error('Erreur d\'écriture :', err) : console.log('✅  Infos avec mails classiques bien enregistrées'))
    } catch (err) {
        console.error(err);
    }
}

var domains = [
    /* Default domains included */
    "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
    "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
    "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",

    /* Other global domains */
    "email.com", "fastmail.fm", "games.com" /* AOL */ , "gmx.net", "hush.com", "hushmail.com", "icloud.com",
    "iname.com", "inbox.com", "lavabit.com", "love.com" /* AOL */ , "outlook.com", "pobox.com", "protonmail.com",
    "rocketmail.com" /* Yahoo */ , "safe-mail.net", "wow.com" /* AOL */ , "ygm.com" /* AOL */ ,
    "ymail.com" /* Yahoo */ , "zoho.com", "yandex.com",

    /* United States ISP domains */
    "bellsouth.net", "charter.net", "cox.net", "earthlink.net", "juno.com",

    /* British ISP domains */
    "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
    "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
    "virgin.net", "wanadoo.co.uk", "bt.com",

    /* Domains used in Asia */
    "sina.com", "sina.cn", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph", "163.com", "126.com", "aliyun.com", "foxmail.com",

    /* French ISP domains */
    "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",

    /* German ISP domains */
    "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */ , "web.de", "yahoo.de",

    /* Italian ISP domains */
    "libero.it", "virgilio.it", "hotmail.it", "aol.it", "tiscali.it", "alice.it", "live.it", "yahoo.it", "email.it", "tin.it", "poste.it", "teletu.it",

    /* Russian ISP domains */
    "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",

    /* Belgian ISP domains */
    "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",

    /* Argentinian ISP domains */
    "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",

    /* Domains used in Mexico */
    "yahoo.com.mx", "live.com.mx", "hotmail.es", "hotmail.com.mx", "prodigy.net.mx",

    /* Domains used in Brazil */
    "yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br"
];

run();