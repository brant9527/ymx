const puppeteer = require('puppeteer');
const fs = require('fs')
const db = require('./mongodb')
const Bluebird = require('Bluebird')
    // 等待3000毫秒
const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
})

const url = `http://chn.lottedfs.cn/kr/display/category/first?dispShopNo1=1200001&treDpth=1`;
const loginUrl = " https://chn.lps.lottedfs.cn/kr/member/login";
(async() => {
    let dispShopNo1 = ''
    let pageNum = 1
        // 启动一个浏览器
    const brower = await puppeteer.launch({
        // args: ['--no-sandbox'],
        // dumpio: false,
        headless: false,
        // See flags at https://peter.sh/experiments/chromium-command-line-switches/.
        args: [
            '--disable-infobars', // Removes the butter bar.
            '--start-maximized',
            '--start-fullscreen',
            '--window-size=1920,1080',
            // '--kiosk',
        ],
    });

    const page = await brower.newPage() // 开启一个新页面

    async function ctn() {
        pageNum = 0
        await page.waitForSelector('.paging');

        await page.evaluate(pageNum => {
            let $ = window.$
            window.fn_movePage(pageNum)

        }, pageNum)
        let finalResponse = await page.waitForResponse(response => response.url() === 'http://chn.lottedfs.cn/kr/member/getLoginSessAjax' && response.status() === 200, {
            timeout: 60000
        });
    }
    async function changeShopNo() {
        await page.evaluate(pageNum => {
            let $ = window.$
            $('#prdBestCateAll > a:nth-child(' + pageNum + ')')[0].click()
        }, pageNum)
    }

    async function login() {
        await page.waitForSelector('#lpointBtn')
        await page.evaluate(() => {
            let $ = window.$
            $('#lpointBtn').click()
            $('#loginLpId').val('398707650@qq.com')
            $('#password').val('!q2w3e4r')
            $('#lpointTabBody .formGroup .inputArea .right .btnL').click()

        })
    }
    async function getData() {

        await page.waitForSelector('.productMd');
        let items = await page.evaluate(() => {
            // 拿到页面上的jQuery
            let $ = window.$;
            let items = $('.productMd >a');
            return items

        });
        items.forEach(async(item, index) => {
                item.click()
                page.waitForSelector('.infoData')
                let info = await page.evaluate(() => {
                    let $ = window.$
                    let title = $('#prdDetailTopArea > div.productName.newProductName > span').text()
                    let price = $('.infoData .normal .priceArea').text()

                    let priceOff = $('.infoData .member .priceArea').text()
                    let cashScore = $('.infoData .dreamMoney .priceArea').text()
                    let productId = $('.productCode').text().match(/\d+/)[0]
                    let discountD = $('.guide').text()

                    let info = {
                        title,
                        price,
                        productId,
                        productInfo,
                        priceOff,
                        discountD,
                        discountR,
                    }
                    return info
                })
            })
            // let log = fs.readFileSync('./log.txt')
            // fs.writeFileSync('log.txt', log + '\n' + JSON.stringify(result))
        let res = db.top100.insertMany(result)
        console.log('pageNum:' + pageNum, 'selectNoIndex:' + selectNoIndex)
        console.log('插入数据')

        console.log('flag:' + flag)
        if (flag) {
            await nextPage()
        } else {
            dispShopNo1 = await changeShopNo()
            if (dispShopNo1) {
                await page.waitForSelector('.paging');
                await nextPage()
            }
        }
    }
    async function nextPage() {
        pageNum++
        if (pageNum > 2) {
            return console.log('爬数据完毕')
        }
        await page.evaluate(pageNum => {
            let $ = window.$
            window.fn_movePage(pageNum)
            $('#gnbArea > div > div > ul > li:nth-child(' + pageNum + ') > a')
        }, pageNum)
        const finalResponse = await page.waitForResponse(response => response.url().indexOf('http://chn.lottedfs.cn/kr/display/best/getPrdBestListAjax') > -1 && response.status() === 200, {
            timeout: 60000
        });
        await page.waitForSelector('.first');

        await getData()
    }
    await page.goto(loginUrl, {
        waitUntil: 'networkidle2', // 网络空闲说明已加载完毕
    });

    await login();
    console.log('登录成功')
        // await page.waitFor(1000)


    await page.waitForSelector('#category')

    dispShopNo1 = await changeShopNo()

    await nextPage()


    // 关闭浏览器
    brower.close();

})();