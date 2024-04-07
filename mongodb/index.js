// const MongoClient = require('mongodb').MongoClient
let mongoose = require('mongoose')
let url = "mongodb://127.0.0.1:27017/shop";
const Promise = require("bluebird")
mongoose.Promise = Promise
let db = mongoose.connect(url, {
    useNewUrlParser: true
}, function(err) {
    if (err) {
        console.log('数据库链接失败')
    } else {
        console.log('数据库连接成功')
    }
})
let Scheme = mongoose.Schema

let mongoDo = {}



let product = Scheme({
    imgsrc: String,
    title: String,
    price: String,
    productId: String,
    productInfo: String,
    priceOff: String,
    discountD: String,
    discountR: String,
    dispShopNo1: String,
    star: String,
    num: String


})
let top100 = Scheme({
    imgList: String,
    title: String,
    price: String,
    productId: String,
    productInfo: String,
    priceOff: String,
    discountD: String,
    discountR: String,
    dispShopNo1: String,
    star: String,
    num: String,
    detailInfo: String
})

mongoDo.product = mongoose.model('product', product);
mongoDo.top100 = mongoose.model('top100', top100);
module.exports = mongoDo