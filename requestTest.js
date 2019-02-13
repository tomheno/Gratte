const unirest = require("unirest");
const fs = require("fs");

var req = unirest("GET", "https://www.webimm.com/immobilier-entreprise/ile-de-france/75/paris/vente/local-commercial.html");

req.headers({
  "Postman-Token": "55a12165-f51b-3914-aa02-382f11a84e51",
  "Cache-Control": "no-cache"
});


req.end(function (res) {
  if (res.error) throw new Error(res.error);

  console.log(res.body);

  fs.writeFile('html-returned.html', 
  res.body, 
  (err)=> console.log('File successfully written!'))
});
