const request = require('request');
const domParser = require('dom-parser');
const fs = require('fs');
const parser = new domParser();
const https = require('https');

const seedUrl = 'https://www.google.com/search?q=lion&tbm=isch&ved=2ahUKEwiOz5mS-vn2AhWdz4sBHZmtDu0Q2-cCegQIABAA&oq=lion&gs_lcp=CgNpbWcQAzIICAAQgAQQsQMyCAgAEIAEELEDMgUIABCABDIFCAAQgAQyBQgAEIAEMgUIABCABDIFCAAQgAQyBQgAEIAEMgUIABCABDIFCAAQgAQ6CwgAEIAEELEDEIMBOgQIABADUPMFWL4XYP0YaAJwAHgAgAF7iAG5B5IBAzAuOJgBAKABAaoBC2d3cy13aXotaW1nsAEAwAEB&sclient=img&ei=fqdKYo6YMJ2fr7wPmdu66A4&bih=722&biw=1536';

async function getResponse(url) {
    option = {
        url: url,
        method: 'GET',
        timeout: 10000,

    }
    try {
        return new Promise((resolve, reject) => {
            request.get(option, (err, result) => {
                if (err) {
                    reject(new Error('Not Found Page'));
                } else {
                    resolve(result)
                }
            })
        })
    } catch (err) {
        console.log(err)
    }
}
async function getImgSrc(url) {
    try {
        const response = await getResponse(url);
        if (response.request.responseContent.statusCode != 200) {
            throw new Error('ネットワークエラー');
        }
        const dom = parser.parseFromString(response.body);
        const imgList = dom.getElementsByTagName('img');
        const srcList = imgList.map((el) => {
            let src = el.getAttribute('src');
            src = src.replace(/&amp;/g, '&')
            const protocol = response.req.protocol;
            let originHost = response.request.originalHost;
            if (src.indexOf('//') == 0) {
                return protocol + src
            }
            return src
        })
        return srcList
    } catch (err) {
        console.log(err)
    }
}
function downloadImg(url, filepath) {
    https.get(url, (res) => {
        res.pipe(fs.createWriteStream(filepath))
    })
}
async function test() {
    let a = await getImgSrc(seedUrl);
    for (var i = 1; i < a.length; i++) {
        downloadImg(a[i], './img/lion' + i + '.jpg')
    }
}


test()