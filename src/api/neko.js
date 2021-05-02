const fetch = require('node-fetch');

async function getNeko(){
    const res = await fetch("https://neko-love.xyz/api/v1/neko");
    const mat = await res.json();

    if (mat.code !== 200) {
      return console.log("Error 01: Unable to access the json content of API");
    }

    return mat.url;
}

module.exports = {getNeko: getNeko};