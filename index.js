const puppeteer = require('puppeteer');
const fs = require('fs')

const xlsx = require('xlsx');
const workbook = xlsx.readFile('./file.xlsx');
// 获取第一个工作表的名称
const firstSheetName = workbook.SheetNames[0];
const SheetKeys = []
// 获取第一个工作表的数据
const worksheet = workbook.Sheets[firstSheetName];
// 从第一个工作表中提取第一列数据
let firstColumnData = [];
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
firstColumnData = firstColumnData.splice(1)
console.log('第一列数据:', firstColumnData);
const searchUrl = 'https://sellercentral.amazon.com/productsearch/v2/search'

// 等待3000毫秒
const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
})


const loginUrl = "https://sellercentral.amazon.com/";

(async () => {


    // 启动一个浏览器
    const brower = await puppeteer.launch({
        // args: ['--no-sandbox'],
        // dumpio: false,
        headless: false,
        executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        userDataDir:'C:\\workspace',
        // See flags at https://peter.sh/experiments/chromium-command-line-switches/.
        args: [
            // '--disable-infobars', // Removes the butter bar.
            '--start-maximized',
            // '--start-fullscreen',
            '--window-size=1920,2080',
            // '--disable-web-security'
            // '--kiosk',
        ],
    });

    const page = await brower.newPage() // 开启一个新页面
    // 等待进入查询页面

    const refreshPage = async () => {
        try{
            // await page.evaluate(() => {
            //     window.addEventListener('beforeunload', (event) => {
            //       event.preventDefault();
            //       event.returnValue = '';
            //     });
            //   });
            
            await page.reload({ waitUntil: 'domcontentloaded' ，timeout:50000}); // 重新加载页面
            
        } catch (error) {
              // 如果5秒内特定请求未出现，刷新页面
        console.log(error)
        }
    };

    const watch  =async ()=>{
        console.log('开始循环');
            let timer = null

            try {
                page.on('request', request => {
                     
                        if (request.url().includes(searchUrl)) {

                                    clearInterval(timer);
                          
                                    timer = setInterval(async ()=>{
                                    await refreshPage();
                                    },60000)
                                
                              
                        }
                      });

          // 等待特定请求出现或者5秒超时
              
              
              // 如果在5秒内特定请求出现，结束循环
              
            } catch (error) {
              // 如果5秒内特定请求未出现，刷新页面
            }
          
    }
   
    // 遍历xlsx数组
    async function loop() {
      
        for (let i = 0; i < firstColumnData.length; i++) {
        console.log('bianli',i)

            await getResult(firstColumnData[i])
            // break
        }
    }


    // 开始查询功能
    page.on('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
      });
    async function startWork() {

        await page.waitFor(4000)
        try{
         watch()
         await loop()
         await toXlsx()
        }catch{
            toXlsx()
        }

        


        //  等待查询结果挑书
    }

    async function getResult(key) {
        // 输入编码
        console.log('key>>',key)
        try {

            await page.waitFor(500)
            const ele = await page.$('#SearchInputContent > div > section.kat-col-md-10 > kat-input-group')
            if(!ele){
                    return   
            }
            const {x,y} =await ele.boundingBox()
            console.log('x=>',x,y)
            await page.mouse.click(x+40,y+30)
            // await page.$eval('input[type=text]',input=>input.value = '')
            await page.keyboard.down('Control')
            await page.waitFor(100)

            await page.keyboard.press('A')
            await page.waitFor(100)

            await page.keyboard.up('Control')
            await page.waitFor(100)

            await page.keyboard.press('Delete')
            await page.waitFor(1000)
            
           
            await page.keyboard.type(key)
            await page.waitFor(100)

            await page.click('#SearchInputContent > div > section.kat-col-md-2 > div > kat-button')
            // await page.evaluate((key) => {
            //     let $ = window.$
            //     console.log('jq打印')
                
            //     $('#katal-id-11').val(key)
            //     $('#lpointBtn').click()
            //     // document.querySelector("#search-recommendations-element-id").shadowRoot.querySelector("#katal-id-11").value=key
            //     // document.querySelector("#SearchInputContent > div > section.kat-col-md-2 > div > kat-button").shadowRoot.querySelector("button").click()
            // }, key)
            console.log('等待请求响应')

            const finalResponse = await page.waitForResponse(response => response.url().indexOf(searchUrl) > -1 && response.status() === 200, {
                timeout: 0
            });
            console.log('xiangyingjieshu')
            page.waitFor(1000)
            // 判断是否可销售
           let obj = await page.evaluate(() => {
                // let $ = window.$
                const applyBtn = document.querySelector("#search-result > div > kat-box > div > section.kat-col-md-7.search-row-info > div:nth-child(1) > section.kat-col-xs-5.actions > div > div > kat-dropdown-button")
                if(!applyBtn){
                    return
                }
                let btnCountTxt =  document.querySelector("#search-result > div:nth-child(1) > kat-box > div > section.kat-col-md-7.search-row-info > div:nth-child(1) > section.kat-col-xs-7.attributes > div > section.kat-col-xs-6.search-row-sales-attributes > p:nth-child(2) > a")?.text
                
                let btnText = applyBtn.shadowRoot.querySelector("div.button-group-header > button.button").innerText
                console.log(btnText)
                if (btnText === '销售此商品') {
                    let href = document.querySelector("#search-result > div:nth-child(1) > kat-box > div > section.kat-col-xs-4.search-row-title > a").getAttribute('href')
                    return {href,btnCountTxt}
                }
            })
           if(obj?.href){
             SheetKeys.push({key,...obj})
           }
           

            console.log('SheetKeys=>>',SheetKeys)
        } catch (error) {
            console.log(error)
        }
    }
    async function toXlsx() {
        // 创建一个新的工作簿
        const workbook = xlsx.utils.book_new();
        console.log('SheetKeys=>',SheetKeys)
        // 创建一个新的工作表
        const worksheet = xlsx.utils.json_to_sheet(SheetKeys);

        // 将工作表添加到工作簿中
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // 将工作簿写入文件
        xlsx.writeFile(workbook, 'output.xlsx');
    }
    await page.goto(loginUrl, {
        // waitUntil: 'networkidle2', // 网络空闲说明已加载完毕
    });

    await page.waitForSelector('#product-search-container > div.product-search > div > div.side-nav > div.main-content > div > div.results-header',{timeout:0})
   
    
   
    await startWork()
    console.log('开始')
    // await page.waitFor(1000)
    // 关闭浏览器
    // brower.close();

})();