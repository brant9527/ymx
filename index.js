const puppeteer = require('puppeteer');
const fs = require('fs')

const Bluebird = require('Bluebird')



const loginUrl = " https://chn.lps.lottedfs.cn/kr/member/login";
(async() => {
    let dispShopNo1 = ''
    let selectNoIndex = 0

    let pageNum = 0
    let isFirst = true
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
            '--disable-web-security' // 禁用 web 安全性，亚马逊可能会拒绝非正常请求

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

        await page.waitForSelector('.paging');
        let result = await page.evaluate(temp => {
            // 拿到页面上的jQuery
            let $ = window.$;
            let items = $('.imgType .productMd');
            let links = [];
            if (items.length >= 1) {
                items.each((index, item) => {
                    let it = $(item)
                    let imgsrc = it.find('.img img').attr('src')
                    let title = it.find('.brand') && it.find('.brand').text()
                    let price = it.find('.price .cancel').text()
                    let priceOff = it.find('.price .off') && it.find('.price .off').text()
                    let productInfo = it.find('.price .off') && it.find('.product').text()
                    let productId = it.find('.link.gaEvtTg.js-contextmenu').attr('href').match(/[0-9]+/)[0]
                    let discountD = it.find('.discount strong').text()
                    let discountR = it.find('.discount span').text()
                    let star = it.find('.evaluation .starIcon').hasClass('five') && '5' ||
                        it.find('.evaluation .starIcon').hasClass('four') && '4' ||
                        it.find('.evaluation .starIcon').hasClass('three') && '3' ||
                        it.find('.evaluation .starIcon').hasClass('two') && '2' ||
                        it.find('.evaluation .starIcon').hasClass('one') && '1' || '0'
                    let num = it.find('.evaluation .num').text()
                    links.push({
                        imgsrc,
                        title,
                        price,
                        productId,
                        productInfo,
                        priceOff,
                        discountD,
                        discountR,
                        dispShopNo1: temp.dispShopNo1,
                        pageNum: temp.pageNum,
                        selectNoIndex: temp.selectNoIndex,
                        star,
                        num
                    })
                });
            }
            return links

        }, {
            dispShopNo1,
            pageNum,
            selectNoIndex
        });
        // let log = fs.readFileSync('./log.txt')
        // fs.writeFileSync('log.txt', log + '\n' + JSON.stringify(result))
        let res = db.product.insertMany(result)
        console.log('pageNum:' + pageNum, 'selectNoIndex:' + selectNoIndex)
        console.log('插入数据')
        let flag = await page.evaluate(pageNum => {
            let $ = window.$
            return $('.next').length || $('#prdList > div.pagingArea.pt15 > div > a:last-child').text() != pageNum

        }, pageNum)
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
   
    await page.goto(loginUrl, {
        waitUntil: 'networkidle2', // 网络空闲说明已加载完毕
    });

    await login();
    console.log('登录成功')
        // await page.waitFor(1000)


    await page.waitForSelector('#category')

    dispShopNo1 = await changeShopNo()

    // await ctn()


    await page.waitForSelector('.paging');

    await nextPage()


    // 关闭浏览器
    brower.close();

})();