const request = require('request');//リクエストするためのモジュール
const domParser = require('dom-parser');//HTTPコードを分析してくれるモジュール
const parser = new domParser();//dom-parserのインスタンスを生成

seedUrl = 'https://yandex.com/images/search?text=lion';
//今は固定urlだけどreadlineモジュールでいつでも入力して有働的に変更可能

async function getResposne(url) {
    //リクエストした全般的な応答を戻り値にする関数
    option = {//リクエストオプション
        url: url,
        method: 'GET',//リクエストする方式
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
        //この'User-Agent'値をこめてリクエストしないとブラウザがクローリングを認識する可能性が高い
    }
    try {
        return new Promise((resolve, reject) => {
            request.get(option, (err, resp) => {
                if (err) {
                    //非同期処理するとerrorを関数の中で処理可能
                    reject(err)
                } else {
                    resolve(resp)
                }
            })
        })
    } catch (err) {
        console.log(err);
        return null;//リクエストが伝えてないときとか処理上の問題があったら戻り値がいる必要は今まではない
    }
}
async function getUrlLinks(url) {
    //応答の中で必要な情報以外には全部削除する
    try {
        const response = await getResposne(url);
        if (response.request.responseContent.statusCode != 200) {//ネットワークエラー確認
            return null;//エラーがあったら何も返せないようにする
        }
        const dom = parser.parseFromString(response.body);
        const aList = dom.getElementsByTagName('a');
        let urlList = aList.map(el => {
            const url = el.getAttribute('href')
            if (url == null || url.indexOf('#') == 0 || url.indexOf('mailto') == 0 || url == 'javascript') {//いらないurl情報
                return null;
            }
            if (url.indexOf('http') == 0) {//ちゃんとしたurl情報
                return url;
            }
            const protocol = response.req.protocol;
            let originHost = response.request.originalHost;
            if (url.indexOf('/') == 0) {//もし'/'で始めるurlがあったら同じdomainを使っているということだから
                return protocol + "//" + originHost + url;//元のprotocolto hosturlを返す
            } else {
                return protocol + "//" + originHost + "/" + url;
            }
        })
        return urlList.filter(url => url != undefined);//さっきいらなかったurlのnull情報をフィルター
    } catch (err) {
        return console.log(err)
    }
}
let resultUrl = [];
let skipUrl = new Set();//一回でも出たらいらない情報ということだから重複値はいらない
let seedOriginalHost;//元のhosturlと比べるための変数

async function filterUrlLinks(urls) {
    try {
        for (var i = 0; i < urls.length; i++) {
            const newUrl = removeSlashLast(urls[i]);//最後に’/’が来るのはあまりありがたくないから削除
            if (skipUrl.has(newUrl)) {//一回通ったurlだったら
                console.log('skip url : ' + newUrl);
                continue;//resultに入れずにスキップ
            }
            skipUrl.add(newUrl);//新しいurlだったら追加(skipのため)
            console.log("newUrl : " + newUrl);
            console.log("resultUrl.includes(newUrl) : " + resultUrl.includes(newUrl))
            if (!resultUrl.includes(newUrl)) {
                const response = await getResposne(newUrl);
                if (seedOriginalHost === response.request.originalHost) {
                    resultUrl.push(newUrl)//同じホストだったら結果リストに入れる
                    console.log("resultUrl.push(newUrl) : " + newUrl);
                    console.log(resultUrl);
                }
            }
        }
    } catch (error) {
        console.log(error)
    }
}

function removeSlashLast(url) {//最後に/がくるurlはディレクトリで認識するので消します
    if (url[url.length - 1] == '/') {
        return url.slice(0, -1);
    }
    return url;
}



async function getSeedOriginalHost(seedUrl) {//元のhosturlを探す
    try {
        const seedResponse = await getResposne(seedUrl);
        console.log("seedOriginalHost : ", seedResponse.request.originalHost);
        return seedResponse.request.originalHost;
    } catch (err) {
        return null;
    }
}

async function bfs() {
    let cur = 0;//resultUrlのインデックスとして使われる変数
    resultUrl.push(seedUrl)//seedになるUrlを入れる
    while (cur < resultUrl.length) {//新しいurlがなくなるまで繰り返す
        try {
            const tempUrls = await getUrlLinks(resultUrl[cur++]);
            //resultUrlで込めてあるurlでurl情報を集める
            await filterUrlLinks(tempUrls);
            //それから出たことない新しいurlだったらresultUrlに追加
        } catch (err) {
            console.log(err);
        }
    }
}
//===========================================
//==================実行部分===================
//===========================================
async function crawlWebPage() {
    try {
        seedOriginalHost = await getSeedOriginalHost(seedUrl);
        await bfs();
    } catch (err) {
        console.log(err);
    }
}

crawlWebPage();