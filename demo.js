const puppeteer = require('puppeteer');
const fs = require('fs')
const db = require('./mongodb')
const xlsx = require('xlsx');
const workbook = xlsx.readFile('./file.xlsx');
// 获取第一个工作表的名称
const firstSheetName = workbook.SheetNames[0];
const SheetKeys = []
// 获取第一个工作表的数据
const worksheet = workbook.Sheets[firstSheetName];
// 从第一个工作表中提取第一列数据
const firstColumnData = [];
for (let rowNum = 1;; rowNum++) {
    // 构建 Excel 单元格地址
    const cellAddress = 'A' + rowNum;
    // 从单元格中获取数据
    const cellData = worksheet[cellAddress];
    // 如果单元格为空，说明到达了数据末尾
    if (!cellData) {
        break;
    }
    // 将数据添加到数组中
    firstColumnData.push(cellData.v);
}
console.log('第一列数据:', firstColumnData);

// 等待3000毫秒
const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
})


const loginUrl = "https://www.amazon.com/";
(async () => {


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
            // '--disable-web-security'
            // '--kiosk',
        ],
    });

    const page = await brower.newPage() // 开启一个新页面
    // 等待进入查询页面
    await page.waitForSelector('#SearchInputContent > div > section.kat-col-md-2 > div > kat-button')

    // 遍历xlsx数组
    async function loop() {
        for (let i = 0; i < firstColumnData.length; i++) {
            await getResult(firstColumnData[i])
            break
        }
    }


    // 开始查询功能

    async function startWork() {
        await loop()
        await toXlsx()

        //  等待查询结果挑书
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
    async function getResult(key) {
        // 输入编码
        try {


            await page.evaluate((key) => {
                let $ = window.$
                $('#katal-id-11').val(key)
                $('#lpointBtn').click()
                const searchUrl = 'https://sellercentral.amazon.com/productsearch/v2/search'

            }, key)
            const finalResponse = await page.waitForResponse(response => response.url().indexOf('searchUrl') > -1 && response.status() === 200, {
                timeout: 0
            });
            // 判断是否可销售
            await page.evaluate(({
                SheetKeys,
                key
            }) => {
                let $ = window.$
                let btnText = document.querySelector("#search-result > div > kat-box > div > section.kat-col-md-7.search-row-info > div:nth-child(1) > section.kat-col-xs-5.actions > div > div > kat-dropdown-button").shadowRoot.querySelector("div.button-group-header > button.button").innerText
                if (btnText === '销售此商品') {
                    let href = $('#search-result > div:nth-child(1) > kat-box > div > section.kat-col-xs-4.search-row-title > a').getAttribute('href')
                    SheetKeys.push({
                        key,
                        href
                    })

                }
            }, {
                SheetKeys,
                key
            })
        } catch (error) {
            console.log(error)
        }
    }
    async function toXlsx() {
        // 创建一个新的工作簿
        const workbook = xlsx.utils.book_new();

        // 创建一个新的工作表
        const worksheet = xlsx.utils.json_to_sheet(data);

        // 将工作表添加到工作簿中
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // 将工作簿写入文件
        xlsx.writeFile(workbook, 'output.xlsx');
    }
    await page.goto(loginUrl, {
        waitUntil: 'networkidle2', // 网络空闲说明已加载完毕
    });

    await startWork()
    console.log('开始')
    // await page.waitFor(1000)
    // 关闭浏览器
    brower.close();

})();