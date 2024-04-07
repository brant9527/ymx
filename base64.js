const fs = require('fs')
let img64 = async function base64(src) {
    let bitmap = await fs.readdirSync(src)
    if (!bitmap) return ''
    let base64 = Buffer.from(bitmap, 'binary').toString('base64')
    console.log(base64)
    return base64
}
exports = img64