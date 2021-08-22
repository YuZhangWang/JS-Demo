// pages/takeout/index.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var commHandle = require("../template/commHandle.js");
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, goodsDetailHandle, commHandle, {
    data: {
        app: app,
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        logoImg: "http://p0.meituan.net/xianfu/83f5fa588ae12840f2d68e72d1cfc40b46851.jpg",
        selectedCatIndex: 0,
        openGoodsShare: false,
        goodsList: [],
        showGoods: '',
        foodType: "",
        bannerHeight: {},
        mainBannerHeight: 562,
        usenewspecShow: false, // 规格框的显示
        takeOutPosterUrl: "",
        decoration: {},
        playBgMusic: true,
        isFirstShowPage: true,
        overReduceType: 0,
        overReduceRule: {},
        showCardPrice: true,
        othersAdd:[], //其他人添加数据
        mySelfAdd:[]
    },
    //商品视频
    toPlayVideo(e) {
        var ctx = this;
        wx.navigateTo({
            url: '/pages/single_video/video_play?id=' + ctx.data.showGoods.id,
        })
    },
    viewImg: function (e) { // 预览图片
        var ctx = this;
        var idx = e.currentTarget.dataset.id;
        var type = e.currentTarget.dataset.type;
        var relaPathPic = [];
        if ("banner" == type) {
            relaPathPic = ctx.data.gImgs;
        }
        var absoultPathPic = [];
        for (var i = 0; i < relaPathPic.length; i++) {
            let imgUrl = ""
            if (relaPathPic[i].indexOf("http") != 0) {
                imgUrl = ctx.data.userImagePath + relaPathPic[i]
            } else {
                imgUrl = relaPathPic[i]
            }
            absoultPathPic.push(imgUrl);
        }
        wx.previewImage({
            current: absoultPathPic[idx],
            urls: absoultPathPic
        })
    },
    handleShoperLbs: function () {
        var shoperInfo = this.data.shoperInfo;
        wx.openLocation({
            latitude: Number(shoperInfo.latitude),
            longitude: Number(shoperInfo.longitude),
            scale: 28,
            name: shoperInfo.name,
            address: shoperInfo.localtion
        })
    },

    /* 获取所有商品信息 */
    allDataList:function(){
        wx.showLoading({
            title: "数据载入...",
        })
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/siteBar/findSiteBar',
            data: {
                siteId: mallSiteId,
                start: 0,
                limit: 1000,
                type: 2,
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var categoryList = [];
                    categoryList.push({"id": "", "name": "全部"});
                    categoryList = categoryList.concat(res.data.model.result);
                    that.setData({
                        allCategoryList: categoryList
                    });
                    let cat=categoryList[0];
                    wx.request({
                        url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
                        data: {
                            cusmallToken: cusmallToken,
                            mallsiteId: mallSiteId,
                            goodsType: 2,
                            foodType: 3,
                            start: 0,
                            limit: 1000
                        },
                        header: {
                            'content-type': 'application/json'
                        },
                        success: function (res) {
                            if (res.data.ret == 0) {
                                if (!cat.mallGoodsList) {
                                    cat.mallGoodsList = [];
                                }
                                var mallGoodsList = cat.mallGoodsList.concat(res.data.model.result);
                                for (let i = 0; i < mallGoodsList.length; i++) {
                                    var goods = mallGoodsList[i];

                                    /* 如果商品还存在库存 */
                                    if (goods.usenewspec) {
                                        var specArray = goods.spec ? JSON.parse(goods.spec) : [];
                                        // goods.specData = specArray
                                        /* 数据过长的化 微信解析器会报错 */
                                        if (specArray.length > 360) {
                                            goods.spec = '';
                                            goods.specData = [];
                                            /*  规格数据格式化 */
                                            var specObject = {};
                                            specObject.goodsId = goods.id;
                                            specObject.data = specArray;
                                            definedSpecArray.push(specObject);
                                        } else {
                                            goods.specData = specArray
                                        }
                                    }
                                    // 如果在所有分类中已存在该商品，则把商品信息(已添加的数量等)复制过去
                                    let allCatGoods = that.data.allCategoryList[0].mallGoodsList;
                                    if (allCatGoods && allCatGoods.length > 0) {
                                        for (let j = 0; j < allCatGoods.length; j++) {
                                            if (goods.id == allCatGoods[j].id) {
                                                mallGoodsList[i] = allCatGoods[j];
                                                if (allCatGoods[j].usenewspec) {
                                                    var specArray2 = allCatGoods[j].spec ? JSON.parse(allCatGoods[j].spec) : [];
                                                    // goods.specData = specArray
                                                    if (specArray2.length > 260) {
                                                        allCatGoods[j].spec = '';
                                                        allCatGoods[j].specData = [];
                                                    } else {
                                                        allCatGoods[j].specData = specArray2
                                                    }
                                                }
                                                /*  规格数据格式化 */
                                                definedSpecArray.forEach(function (item) {
                                                    if (item.goodsId == allCatGoods[j].id) {
                                                        item.data = allCatGoods[j].spec ? JSON.parse(allCatGoods[j].spec) : []
                                                    }
                                                })
                                            }
                                        }
                                    }
                                }
                                cat.mallGoodsList = mallGoodsList;
                                let catIndex=0;
                                that.setData({
                                    ["allCategoryList[" + catIndex + "]"]: cat,
                                });
                                wx.hideLoading();
                                that.calculateCart(that.data.allMultiData)
                                wx.hideLoading()
                            }else {
                                that.setData({
                                    allCategoryList: [],
                                });
                            }
                        }
                    })
                }else {
                    that.setData({
                        allCategoryList: [],
                    });
                }
            }
        })
    },

    /* 商品增加事件 */
    addFood: function (goodsId, specIds) {
        let that = this;
        if (!this.checkUserInfo()) {
            return false;
        }
        that.setData({
            goodsId: '', specIds: '', cartType: 1 //自己添加标志
        })
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null; //分类位置
        var goodsIndex = goodsPos ? goodsPos[1] : null; //商品位置
        if (goodsIndex != null) {
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];  //当前操作商品
            let paramsData = {
                goodsId: goods.id,
                "sku": goods.selectedSku ? goods.selectedSku.sku : '',
                "specName": goods.selectedSku ? goods.selectedSku.names : '',
                "operateType": 1
            }
            /* websocket 发送数据给后台*/
            wx.sendSocketMessage({
                data: JSON.stringify(paramsData),
                success(res) {
                    that.setData({
                        goodsId: goodsId, specIds: specIds ? specIds : '',
                        goodsInfo: {
                            goodsName: goods.name,
                            headPic: app.globalData.userInfo.avatarUrl,
                            nickName: app.globalData.userInfo.nickName,
                        }
                    })
                }
            })

        }
    },
    /* 其他人添加的位置 */
    othersPosition:function(goodsId){
        let otherGoodsList=this.data.othersAdd;
        let otherIndex=null;
        otherGoodsList.forEach(function (item,index) {
            if(item.id===goodsId){
                otherIndex=index
            }
        })
        return otherIndex
    },
    /* 自己添加商品的位置 */
    selfPosition:function(goodsId){
        let selfGoodsList=this.data.mySelfAdd;
        let selfIndex=null;
        selfGoodsList.forEach(function (item,index) {
            if(item.id===goodsId){
                selfIndex=index
            }
        })
        return selfIndex
    },
    /* 总商品位置 */
    allPosition:function(goodsId){
        let allGoodsList=this.data.allCategoryList[0].mallGoodsList;
        let posIndex=null;
        allGoodsList.forEach(function (item,index) {
            if(item.id===goodsId){
                posIndex=index
            }
        })
        return posIndex
    },
    /* 其他人添加购物车回显 */
    othersSocket:function(goodsId, addData){
        let that=this;
        var allIndex = that.allPosition(goodsId); //在所有商品位置
        var goodsData=this.data.allCategoryList[0].mallGoodsList[allIndex];
        var mCart = that.data.takeOutShoppingCart || [];
        var selectIndex='';
        mCart.forEach(function (item,index) {
            if (item.id==goodsData.id && item.openid==addData.openid){
                goodsData=item;
                selectIndex=index;
            }
        })
        goodsData.headPic = addData.headPic;
        goodsData.openid = addData.openid;
        if (typeof (goodsData.selectedCount) === "undefined") {
            goodsData.selectedCount = 1;
        } else {
            goodsData.selectedCount++;
        }
        if (addData.sku) {
            /* 规格数据重绘 */
            if (goodsData.spec == '') {
                definedSpecArray.forEach(function (item) {
                    if (goodsData.id == item.goodsId) {
                        goodsData.specData = item.data;
                        goodsData.spec = JSON.stringify(item.data)
                    }
                })
            }
            for (var j = 0; j < goodsData.specData.length; j++) {
                console.log(goodsData.specData[j])
                console.log(addData.sku)
                if (goodsData.specData[j].sku == addData.sku) {
                    if (typeof (goodsData.specData[j].selectedCount) === "undefined") {
                        goodsData.specData[j].selectedCount = 1;
                    } else {
                        goodsData.specData[j].selectedCount++;
                    }
                }
            }
        }
        let otherPos=that.othersPosition(goodsData.id);
        if(otherPos!==null){
            that.data.othersAdd[otherPos]=goodsData
        }else {
            that.data.othersAdd.push(goodsData)
        }
        that.fillShoppingCart();
    },
    /* 商品增加事件 */
    addSocket: function (goodsId, specIds) {
        let that = this;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null; //分类位置
        var goodsIndex = goodsPos ? goodsPos[1] : null; //商品位置
        if (goodsIndex != null) {
            //T T 购物车还原
            var mCart = that.data.takeOutShoppingCart || [];
            var sGList = that.data.categoryList[catIndex].mallGoodsList || []; //商品列表
            for (let gItem of mCart) {//把购物车中商品的信息同步到当前商品展示列表中
                for (let j = 0; j < sGList.length; j++) {
                    if (gItem.id == sGList[j].id && gItem.openid==app.globalData.myOpenid) {
                        that.setData({
                            ["categoryList[" + catIndex + "].mallGoodsList[" + j + "]"]: gItem
                        });
                        break;
                    }
                }
            }
            //T T 购物车还原
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];  //当前操作商品
            goods.headPic = app.globalData.userInfo.avatarUrl;
            goods.openid = app.globalData.myOpenid;
            console.log(goods.selectedNum);
            if (typeof (goods.selectedNum) === "undefined") {
                goods.selectedNum = 1;
            } else {
                goods.selectedNum++;
            }
            if (goods.usenewspec) {
                if (!specIds) {
                    specIds = that.data.selectedGoods.selectedSku.ids;
                }
                /* 规格数据重绘 */
                if (goods.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goods.id == item.goodsId) {
                            goods.specData = item.data;
                            goods.spec = JSON.stringify(item.data)
                        }
                    })
                }
                for (var j = 0; j < goods.specData.length; j++) {
                    if (goods.specData[j].ids == specIds) {
                        if (typeof (goods.specData[j].selectedNum) === "undefined") {
                            goods.specData[j].selectedNum = 1;
                        } else {
                            goods.specData[j].selectedNum++;
                        }
                    }
                }
            } else {

            }
            // if (that.data.showGoods) {
            //     that.setData({
            //         "showGoods": goods,
            //     });
            // }
            that.setData({
                "selectedGoods": goods,
                ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
            });
            // 同步所有分类里面的商品信息
            var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
            if (goodsCatIndex != null) {
                that.setData({
                    ["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods,
                });
            }

            var allIndex = that.allPosition(goodsId); //在所有商品位置
            if (allIndex != null) {
                that.setData({
                    ["allCategoryList[0].mallGoodsList[" + allIndex + "]"]: goods
                });
            }
            let selfPos=that.selfPosition(goodsId);
            if(selfPos!==null){
                that.data.mySelfAdd[selfPos]=goods
            }else {
                that.data.mySelfAdd.push(goods)
            }
            that.fillShoppingCart();
        }
    },
    /* 商品删除事件 */
    delFood: function (goodsId, specIds) {
        var that = this;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        that.setData({
            goodsId: '', specIds: '', cartType: 0
        })
        if (goodsIndex != null) {
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
            let paramsData = {
                goodsId: goods.id,
                "sku": goods.selectedSku ? goods.selectedSku.sku : '',
                "specName": goods.selectedSku ? goods.selectedSku.names : '',
                "operateType": 0
            }
            /* websocket 发送数据给后台*/
            wx.sendSocketMessage({
                data: JSON.stringify(paramsData),
                success(res) {
                    console.log(res)
                    that.setData({
                        goodsId: goodsId, specIds: specIds ? specIds : ''
                    })
                }
            })

        }
    },
    /* 商品删除事件 */
    othersDel:function(goodsId,Data){
        let that=this;
        var mCart = that.data.takeOutShoppingCart || [];
        let otherPos=that.othersPosition(goodsId);
        var goodsData=that.data.othersAdd[otherPos];
        if(otherPos!==null) {
            if (typeof (goodsData.selectedCount) === "undefined") {
                goodsData.selectedCount = 0;
            } else if (goodsData.selectedCount > 0) {
                goodsData.selectedNum--;
            }
            if (goodsData.usenewspec) {
                /* 规格数据重绘 */
                if (goodsData.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goodsData.id == item.goodsId) {
                            goodsData.specData = item.data;
                            goodsData.spec = JSON.stringify(item.data)
                        }
                    })
                }
                for (var j = 0; j < goodsData.specData.length; j++) {
                    var spec = goodsData.specData[j];
                    if (spec.sku == Data.sku) {
                        if (typeof (spec.selectedCount) === "undefined") {
                            spec.selectedCount = 0;
                        } else if (spec.selectedCount > 0) {
                            spec.selectedCount--;
                        }
                    }
                }
                that.fillShoppingCart();
            }
        }
    },
    delSocket: function (goodsId, specIds) {
        var that = this;
        /* 视图端数据处理 */
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        if (goodsIndex != null) {
            //T T 购物车还原
            var mCart = that.data.mySelfAdd || [];
            // var sGList = that.data.categoryList[catIndex].mallGoodsList || []; //商品列表
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
            for (let gItem of mCart) {//把购物车中商品的信息同步到当前商品展示列表中
                if (gItem.id == goods.id && gItem.openid==app.globalData.myOpenid) {
                    goods=gItem;
                    that.setData({
                        ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: gItem
                    });
                    break;
                }
            }
            if (typeof (goods.selectedNum) === "undefined") {
                goods.selectedNum = 0;
            } else if (goods.selectedNum > 0) {
                goods.selectedNum--;
            }
            if (goods.usenewspec) {
                if (!specIds) {
                    specIds = that.data.selectedGoods.selectedSku.ids;
                }
                /* 规格数据重绘 */
                if (goods.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goods.id == item.goodsId) {
                            goods.specData = item.data;
                            goods.spec = JSON.stringify(item.data)
                        }
                    })
                }
                for (var j = 0; j < goods.specData.length; j++) {
                    var spec = goods.specData[j];
                    if (spec.ids == specIds) {
                        if (typeof (spec.selectedNum) === "undefined") {
                            spec.selectedNum = 0;
                        } else if (spec.selectedNum > 0) {
                            spec.selectedNum--;
                        }
                    }
                }
            }
            // if (that.data.showGoods) {
            //     that.setData({
            //         "showGoods": goods,
            //     });
            // }
            that.setData({
                "selectedGoods": goods,
                ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
            });
            // 同步所有分类里面的商品信息
            var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
            if (goodsCatIndex != null) {
                that.setData({
                    ["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods,
                });
            }

            // var allIndex = that.allPosition(goodsId); //在所有商品位置
            // if (allIndex != null) {
            //     that.setData({
            //         ["allCategoryList[0].mallGoodsList[" + allIndex + "]"]: goods
            //     });
            // }
            if (that.data.sumInfo.totalMoney <= 0) {
                that.setData({
                    "showShoppingCart": false,
                    "selectedGoods": null
                });
            }
            /* 同步到myselfAdd数据 */
            let selfPos=that.selfPosition(goodsId);
            if(selfPos!==null){
                that.data.mySelfAdd[selfPos]=goods
            }else {
                that.data.mySelfAdd.push(goods)
            }

        }

        /* 自己数据添加调整 */
        // var mCart = that.data.mySelfAdd || [];
        // mCart.forEach(function (item) {
        //     if (item.id==goodsId){
        //         let goodsData=item;
        //         if (goodsData.usenewspec) {
        //             /* 规格数据重绘 */
        //             if (goodsData.spec == '') {
        //                 definedSpecArray.forEach(function (item) {
        //                     if (goodsData.id == item.goodsId) {
        //                         goodsData.specData = item.data;
        //                         goodsData.spec = JSON.stringify(item.data)
        //                     }
        //                 })
        //             }
        //             for (let y = 0; y < goodsData.specData.length; y++) {
        //                 if (goodsData.specData[y].ids == specIds) {
        //                     if (typeof (goodsData.specData[y].selectedNum) === "undefined") {
        //                         goodsData.specData[y].selectedNum = 0;
        //                     } else {
        //                         goodsData.specData[y].selectedNum--;
        //                     }
        //                 }
        //             }
        //         }else {
        //             if (typeof (goodsData.selectedNum) === "undefined") {
        //                 goodsData.selectedNum = 0;
        //             } else {
        //                 goodsData.selectedNum--;
        //             }
        //         }
        //     }
        // })
        that.fillShoppingCart();
    },
// 把已选商品加入购物车后进行去重，计算总数和总金额
    fillShoppingCart: function () {
        var that = this,takeOutShoppingCart = [],totalMoney = 0,totalCount = 0;
        let selfGoods=[],othersGoods=[];
        // var mallGoodsList = cat.mallGoodsList;
        var mallGoodsList = that.data.mySelfAdd;
        console.log(mallGoodsList)
        /* 当前本人用户选中的商品的重整 */
        if (mallGoodsList.length>0) {
            for (var i = 0; i < mallGoodsList.length; i++) {
                var goods = mallGoodsList[i];
                if (goods.selectedNum > 0 && goods.openid==app.globalData.myOpenid) {
                    if (goods.usenewspec) {
                        /* 规格数据重绘 */
                        if (goods.spec == '') {
                            definedSpecArray.forEach(function (item) {
                                if (goods.id == item.goodsId) {
                                    goods.specData = item.data;
                                    goods.spec = JSON.stringify(item.data)
                                }
                            })
                        }
                        /*console.log(definedSpecArray)*/
                        for (var m = 0; m < goods.specData.length; m++) {
                            var spec = goods.specData[m];
                            if (spec.selectedNum > 0) {
                                totalMoney += spec.price * spec.selectedNum;
                                totalCount += spec.selectedNum;
                            }
                        }
                    } else {
                        totalMoney += goods.price * goods.selectedNum;
                        totalCount += goods.selectedNum;
                    }
                    // takeOutShoppingCart.push(goods);
                    selfGoods.push(goods);
                }
            }
        }

        /* 其他人选中的商品的重整 */
        if(that.data.othersAdd.length > 0){
            that.data.othersAdd.forEach(function (item,index) {
                console.log(item)
                if (item.selectedCount>0) {
                    if (item.usenewspec) {
                        /* 规格数据重绘 */
                        if (item.spec == '') {
                            definedSpecArray.forEach(function (item2) {
                                if (item.id == item2.goodsId) {
                                    item.specData = item2.data;
                                    item.spec = JSON.stringify(item2.data)
                                }
                            })
                        }
                        /*console.log(definedSpecArray)*/
                        for (var z = 0; z < item.specData.length; z++) {
                            var spec = item.specData[z];
                            if (spec.selectedCount > 0) {
                                totalMoney += spec.price * spec.selectedCount;
                                totalCount += spec.selectedCount;
                            }
                        }
                    } else {
                        totalMoney += item.price * item.selectedCount;
                        totalCount += item.selectedCount;
                    }
                    othersGoods.push(item);
                }
            })
        }
        // console.log(takeOutShoppingCart)
        let  allShoppingCart=othersGoods.concat(selfGoods);
        if(allShoppingCart.length==0){
            that.setData({
                "selectedGoods": null,
                "showShoppingCart": false,
                "othersAdd":[],
                "mySelfAdd":[],
                sumInfo: {
                    "totalMoney": 0,
                    "totalCount": 0
                },
                takeOutShoppingCart: [],
            });
        }
        that.setData({
            addInfo: null,
            takeOutShoppingCart: allShoppingCart,
            sumInfo: {
                "totalMoney": totalMoney,
                "totalCount": totalCount
            }
        })
        return that.data.sumInfo;
    },
    // 把已选商品加入购物车，去重，计算总数和总金额


    /* 计算购物车总额 */
    calculateCart: function (array) {
        let totalMoney = 0, totalCount = 0, that = this;
        let selfGoods=[],othersGoods=[];
        var categoryList = that.data.allCategoryList;
        for (let w = 0; w < array.length; w++) {
            let goodsId = array[w].goodsId;

            var cat = categoryList[0];
            var mallGoodsList = cat.mallGoodsList;
            if (mallGoodsList) {
                for (var z = 0; z < mallGoodsList.length; z++) {
                    // var goodsCart = mallGoodsList[z];
                    if (mallGoodsList[z].id == goodsId) {
                        // delete mallGoodsList[z].headPic;
                        if(array[w].openid==app.globalData.myOpenid){
                            let goodsCart=mallGoodsList[z];
                            goodsCart.headPic = array[w].headPic;
                            goodsCart.openid=array[w].openid;
                            if(goodsCart.selectedNum){
                                goodsCart.selectedNum = goodsCart.selectedNum + array[w].count;
                            }else {
                                goodsCart.selectedNum = array[w].count;
                            }
                            if (array[w].sku) {
                                for (var x = 0; x < goodsCart.specData.length; x++) {
                                    let spec = goodsCart.specData[x];
                                    if (spec.sku === array[w].sku) {
                                        spec.selectedNum = array[w].count;
                                        // localGoods.specData[x].selectedNum = array[w].count;
                                        totalMoney +=spec.price * spec.selectedNum;
                                        totalCount += spec.selectedNum;
                                    }
                                }
                            } else {
                                totalCount += goodsCart.selectedNum;
                                totalMoney += goodsCart.price * goodsCart.selectedNum;
                            }
                            that.setData({
                                ["allCategoryList[0].mallGoodsList[" + z + "]"]: goodsCart
                            })
                            let selfPos=that.selfPosition(goodsCart.id);
                            if(selfPos!==null){
                                that.data.mySelfAdd[selfPos]=goodsCart
                            }else {
                                that.data.mySelfAdd.push(goodsCart)
                            }
                            // that.data.mySelfAdd.push(Object.assign({},array[w],localGoods));

                        }else {
                            // let othersCart=Object.assign({},mallGoodsList[z]);
                            let othersCart=JSON.parse(JSON.stringify(mallGoodsList[z]));
                            delete othersCart.selectedNum;
                            othersCart.headPic = array[w].headPic;
                            othersCart.openid=array[w].openid;
                            othersCart.selectedCount = array[w].count;
                            if (array[w].sku) {
                                for (var x = 0; x < othersCart.specData.length; x++) {
                                    let spec = othersCart.specData[x];
                                    delete spec.selectedNum;
                                    if (spec.sku == array[w].sku) {
                                        spec.selectedCount = array[w].count;
                                        totalMoney += spec.price * spec.selectedCount;
                                        totalCount += spec.selectedCount;

                                        /* 同步othersAdd数据 */
                                        let otherPos=that.othersPosition(othersCart.id);
                                        if(otherPos!==null){
                                            // that.data.othersAdd[otherPos]=othersCart
                                            if(that.data.othersAdd[otherPos].usenewspec){
                                                that.data.othersAdd[otherPos].specData.forEach(function (item,specIndex) {
                                                    if (item.sku == spec.sku) {
                                                        item.selectedCount = spec.selectedCount;
                                                        if(that.data.othersAdd[otherPos].selectedCount){
                                                            that.data.othersAdd[otherPos].selectedCount = that.data.othersAdd[otherPos].selectedCount + spec.selectedCount
                                                        }else {
                                                            that.data.othersAdd[otherPos].selectedCount = spec.selectedCount
                                                        }

                                                    }
                                                })
                                            }

                                        }else {
                                            that.data.othersAdd.push(othersCart)
                                        }

                                    }
                                }
                            } else {
                                totalMoney += othersCart.price * othersCart.selectedCount;
                                totalCount += othersCart.selectedCount;
                                othersCart.selectedCount = array[w].count;
                                /* 同步othersAdd数据 */
                                let otherPos=that.othersPosition(othersCart.id);
                                if(otherPos!==null){
                                    that.data.othersAdd[otherPos]=othersCart

                                }else {
                                    that.data.othersAdd.push(othersCart)
                                }
                            }
                            othersGoods.push(othersCart);


                            // that.data.othersAdd.push(Object.assign({},array[w],othersCart))

                        }
                        break;
                    }
                }
            }

            if(w==array.length-1){
                /* 所有商品数据重置 */
                // that.allDataList();
            }
        }
        console.log(that.data.othersAdd)
        let allGoodsCart=that.data.othersAdd.concat(that.data.mySelfAdd);

        that.setData({    //
            takeOutShoppingCart: allGoodsCart,  //购物车数据
            sumInfo: {
                totalMoney, totalCount
            }, //
            toType: ''  //
        });
    },

    handleShoppingCartTap: function (e) {
        if (!this.checkUserInfo()) {
            return false;
        }
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            if ("showShoppingCart" == action) {
                if (that.data.sumInfo.totalMoney > 0) {
                    that.setData({
                        "showShoppingCart": true
                    });
                }
            } else if ("hideShoppingCart" == action) {
                that.setData({
                    "selectedGoods": null
                });
                that.setData({
                    "showShoppingCart": false
                });
            } else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            } else if ("delFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            } else if ("clearShoppingCart" == action) {
                var goods = that.data.showGoods;
                goods.selectedNum = 0;
                if (goods.usenewspec) {
                    for (let item of goods.specData) {
                        item.selectedNum = 0;
                    }
                }
                that.setData({
                    showGoods: goods,
                    selectedGoods: null,
                    "showShoppingCart": false,
                    takeOutShoppingCart: [],
                    sumInfo: {
                        totalMoney: 0,
                        totalCount: 0,
                    }
                });
                wx.setStorageSync(that.data.cartKey, {
                    takeOutShoppingCart: [],
                    sumInfo: {
                        "totalMoney": 0,
                        "totalCount": 0
                    }
                })
            }
        }
    },
    handleGoodsItemTap: function (e) {
        var that = this;
        var target = e.currentTarget;
        var goodsId = target.dataset.id;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            if (action) {
                return;
            }
        }
        if (!goods.selectedSku) {
            goods.selectedSku = JSON.parse(goods.spec)[0];
        }

        that.setData({
            "showGoods": goods
        });

    },
    selectedSpec: function (e) {
        this.setData({
            "selectedGoods": this.data.showGoods
        });
    },
    handleTabItemTap: function (e) {
        if (!this.checkUserInfo()) {
            return false;
        }
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            console.log(action);
            if ("selectSpec" == action) {
                var goods = that.data.showGoods;
                if (!goods.selectedSku) {
                    goods.selectedSku = JSON.parse(goods.spec)[0];
                    var ids = goods.selectedSku.ids.split(',');
                    console.log(ids)
                    if (ids.length > 1) {
                        for (var i = 0; i < goods.specJsonArray.length; i++) {
                            goods.specJsonArray[i].selectedId = ids[i]
                        }
                    }
                }
                that.setData({
                    "selectedGoods": goods,
                    usenewspecShow: true,
                    isSelectSpec: true
                });

            } else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            } else if ("delFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            } else if ("showShoppingCart" == action) {
                if (that.data.sumInfo.totalMoney > 0) {
                    that.setData({
                        "showShoppingCart": true
                    });
                }
            } else if ("submit" == action) {
                that.setData({"isSubmitIng": true});
                let paramsData = {
                    operateType: 2
                };
                wx.sendSocketMessage({
                    data: JSON.stringify(paramsData),
                    success(res) {
                        console.log(res)
                        that.setData({
                            cartType: 2
                        })
                    }
                })
                that.data.leaveStatus = true;
                wx.closeSocket({})
                wx.redirectTo({
                    url: './orderList?tableNo=' + that.data.options.tableNo
                })
            }
        }
    },

    handleCatTap: function (e) {
        var that = this;
        var catId = e.currentTarget.dataset.id;
        that.findGoods(catId, true);
        that.setData({
            selectedCategory: that.findCategoryFromList(catId),
            selectedCatIndex: that.findCatIndexFromList(catId)
        });
    },
    findGoodsIndexFromList(catIndex, goodsId) {
        var that = this;
        var goodsList = that.data.categoryList[catIndex].mallGoodsList;
        if (goodsList && goodsList.length > 0) {
            for (var i = 0; i < goodsList.length; i++) {
                if (goodsId == goodsList[i].id) {
                    return i;
                }
            }
        }
        return null
    },

    findGoodsPos(goodsId) {
        var catList = this.data.categoryList;
        if (catList && catList.length > 0) {
            for (var j = catList.length - 1; j >= 0; j--) {
                var goodsList = catList[j].mallGoodsList;
                if (goodsList && goodsList.length > 0) {
                    for (var i = 0; i < goodsList.length; i++) {
                        if (goodsId == goodsList[i].id) {
                            return [j, i];
                        }
                    }
                }
            }
        }
        return null;
    },

    findCategoryFromList(catId) {
        var categoryList = this.data.categoryList;
        if (categoryList && categoryList.length > 0) {
            for (var i = 0; i < categoryList.length; i++) {
                if (catId == categoryList[i].id) {
                    return categoryList[i];
                }
            }
        }
        return null;
    },

    findCatIndexFromList(catId) {
        var categoryList = this.data.categoryList;
        if (categoryList && categoryList.length > 0) {
            for (var i = 0; i < categoryList.length; i++) {
                if (catId == categoryList[i].id) {
                    return i
                }
            }
        }
        return 0;
    },

    findSkuFromGoods(goods, skuId) {
        var specList = JSON.parse(goods.spec);
        for (var i = 0; i < specList.length; i++) {
            if (specList[i].ids == skuId) {
                return specList[i];
            }
        }
        return null;
    },
    findSelectedSpec: function (specId, groupId, goods) {
        var that = this;
        console.log(goods)
        var selectedIdArray = [];
        for (var i = 0; i < goods.specJsonArray.length; i++) {
            var specGroup = goods.specJsonArray[i];
            if (specGroup.id == groupId) {
                specGroup.selectedId = specId;
            } else {
                if (specGroup.selectedId) {

                } else {
                    specGroup.selectedId = specGroup.specValue[0].id;
                }
            }
            selectedIdArray.push(specGroup.selectedId);
        }
        var selectedIds = selectedIdArray.join(",");
        goods.specData = JSON.parse(goods.spec);
        for (var k = 0; k < goods.specData.length; k++) {
            if (goods.specData[k].ids == selectedIds) {
                return goods.specData[k];
            }
        }
        return null;
    },
    handleSkuModalTap(e) {
        console.log(e);
        if (!this.checkUserInfo()) {
            return false;
        }
        var that = this;
        var target = e.target;
        var selectedGoods = that.data.showGoods;
        if (target) {
            var action = target.dataset.action;
            if ("closeModal" == action) {
                that.setData({
                    "selectedGoods": null,
                    usenewspecShow: false
                });
            } else if ("changeSku" == action) {
                var specId = target.dataset.id;
                var groupId = target.dataset.groupid;
                var sku = that.findSelectedSpec(specId, groupId, selectedGoods);
                that.setData({
                    "selectedGoods.selectedSku": sku
                });
                that.setData({
                    "selectedGoods.specJsonArray": selectedGoods.specJsonArray
                });
                var goodsPos = that.findGoodsPos(selectedGoods.id);
                var catIndex = goodsPos ? goodsPos[0] : null;
                var goodsIndex = goodsPos ? goodsPos[1] : null;
                that.setData({
                    ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: selectedGoods
                });
            } else if ("addToCart" == action) {
                if (that.data.distance) {
                    if (!that.data.tostore && that.data.distance > that.data.shoperInfo.distributionRange * 1000) {
                        wx.showModal({
                            title: '提示',
                            showCancel: false,
                            content: "对不起，您当前位置不在配送范围内"
                        })
                        return false;
                    }
                }
                //selectedGoods.selectedNum = 1;
                that.addFood(selectedGoods.id);
                //var goodsIndex = that.findGoodsPos(selectedGoods.id);
                //that.setData({ ["goodsList[" + goodsIndex + "]"]: selectedGoods });
                //that.setData({ "selectedGoods":selectedGoods});
            } else if ("removeFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            } else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            }
        }
    },


    handleProductScrollToLower: function () {
        let that = this;
        var cat = that.findCategoryFromList(that.data.selectedCategory.id);
        if (cat.mallGoodsList.length < cat.total) {
            that.findGoods(cat.id, false);
        }
    },

    findGoods: function (categoryId, isReload) {
        var that = this;
        var cat = that.findCategoryFromList(categoryId);
        var catIndex = that.findCatIndexFromList(categoryId);
        if (cat.loading) {
            return false;
        }
        if (cat && cat.hasLoaded && cat.nomoreGoods) {
            return false;
        }
        var submitData = {
            cusmallToken: cusmallToken,
            mallsiteId: mallSiteId,
            goodsType: 2,
            start: 0,
            limit: 10
        };
        if (categoryId) {
            submitData.siteBarId = categoryId;
        }
        if (that.data.foodType) {
            submitData.foodType = that.data.foodType;
        }

        if (cat.mallGoodsList && cat.mallGoodsList.length) {
            submitData.start = cat.mallGoodsList.length;
        }

        if (cat) {
            cat.hasLoaded = true;
        }
        wx.showLoading({
            title: "加载中",
        })
        cat.loading = true;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
            data: submitData,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    if (!cat.mallGoodsList) {
                        cat.mallGoodsList = [];
                    }

                    var mallGoodsList = cat.mallGoodsList.concat(res.data.model.result);

                    cat.total = res.data.model.total;

                    for (let i = 0; i < mallGoodsList.length; i++) {
                        var goods = mallGoodsList[i];
                        if ((goods.foodType & Math.pow(2, 0)) != 0) {
                            goods.tc = 1;
                        }
                        if ((goods.foodType & Math.pow(2, 1)) != 0) {
                            goods.zq = 1;
                        }
                        if ((goods.foodType & Math.pow(2, 2)) != 0) {
                            goods.ta = 1;
                        }
                        if (goods.usenewspec) {
                            goods.specData = JSON.parse(goods.spec);
                        }
                        // 如果在所有分类中已存在该商品，则把商品信息(已添加的数量等)复制过去
                        let allCatGoods = that.data.categoryList[0].mallGoodsList;
                        if (allCatGoods && allCatGoods.length > 0) {
                            for (let j = 0; j < allCatGoods.length; j++) {
                                if (goods.id == allCatGoods[j].id) {
                                    mallGoodsList[i] = allCatGoods[j];
                                }
                            }
                        }
                    }
                    cat.mallGoodsList = mallGoodsList;
                    if (res.data.model.total == 0) {
                        cat.nomoreGoods = false;
                    } else {
                        if (cat.mallGoodsList.length >= res.data.model.total) {
                            cat.nomoreGoods = true;
                        } else {
                            cat.nomoreGoods = false;
                        }
                    }
                    cat.loading = false;
                    that.setData({
                        ["categoryList[" + catIndex + "]"]: cat,
                        selectedCategory: cat
                    });
                    wx.hideLoading();
                }
            }
        })
    },

    findCategory: function (categoryId) {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/siteBar/findSiteBar',
            data: {
                siteId: mallSiteId,
                start: 0,
                limit: 50,
                type: 2,
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var categoryList = [];
                    categoryList.push({
                        "id": "",
                        "name": "全部"
                    });
                    categoryList = categoryList.concat(res.data.model.result);
                    that.setData({
                        categoryList: categoryList
                    });

                    that.setData({
                        selectedCategory: categoryList[0]
                    });
                    that.findGoods(categoryList[0].id, true);

                }
            }
        })
    },
    getTakeOutGood: function (id, cb) {
        let that = this;
        cusmallToken = wx.getStorageSync('cusmallToken');
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
            data: {
                goodsId: id,
                cusmallToken: cusmallToken,
                addFootprint: false,
                showCardPrice: false
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                console.log(res);
                if (res.data.ret == 0) {
                    let mCard = that.data.takeOutShoppingCart;
                    let goods = res.data.model.goods;
                    let memberCardId = res.data.model.memberCardId || 0;
                    let memberCardPrice = res.data.model.memberCardPrice || 0;
                    let memberCardName = res.data.model.memberCardName || '';
                    wx.setNavigationBarTitle({
                        title: goods.name,
                    })
                    if ((goods.configSuperSwitch & (Math.pow(2, 0))) != 0 || !memberCardId) {
                        that.setData({
                            showCardPrice: false
                        })

                    }
                    if (goods.usenewspec) {
                        goods.specData = JSON.parse(goods.spec);
                        // goods.spec = goods.spec;
                        // goods.selectedSku = goods.spec[0];
                    }
                    if (goods.pics) {

                        var gImgs = goods.pics.split(",");
                    }
                    that.setData({
                        showGoods: goods,
                        selectedGoods: goods,
                        gImgs: gImgs,
                        memberCardId: memberCardId,
                        memberCardPrice: memberCardPrice,
                        memberCardName: memberCardName

                    })
                    // for (let item of mCard) {
                    //     if (item.id == res.data.model.goods.id) {
                    //         that.setData({
                    //             showGoods: item,
                    //             selectedGoods: item,
                    //
                    //         })
                    //         break;
                    //     }
                    // }

                    var decorationData = JSON.parse(goods.decoration);
                    // 处理decorationData
                    util.processDecorationData(decorationData, that);
                    that.setData({
                        decoration: decorationData,
                    });
                    if (that.data.bgMusic) {
                        that.audioCtx = wx.createAudioContext('bgMusic');
                        that.audioCtx.play();
                    }

                    cb && cb();
                }
            },
            complete: function () {
                wx.hideLoading();
                that.setData({
                    isDone: true
                })
            }
        })
    },
    getTakeOutPosterUrl: function () {
        let that = this;
        // let cusmallToken = wx.getStorageSync('cusmallToken');
        if (that.data.takeOutPosterUrl) {
            wx.previewImage({
                current: that.data.takeOutPosterUrl, // 当前显示图片的http链接
                urls: [that.data.takeOutPosterUrl] // 需要预览的图片http链接列表
            });
            return;
        }
        wx.showLoading({
            title: '加载中',
        });
        var postData = {
            cusmallToken: cusmallToken,
            page: "pages/takeout/indexDetail",
            goodsId: that.data.showGoods.id,
            toType: that.data.toType,
            fromuid: app.globalData.fromuid
        };
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/distributor/genGoodsPoster',
            data: postData,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                wx.hideLoading();
                if (data && 0 == data.ret && data.model.qrcodeUrl) {
                    that.setData({
                        takeOutPosterUrl: data.model.qrcodeUrl
                    });
                    wx.previewImage({
                        current: data.model.qrcodeUrl, // 当前显示图片的http链接
                        urls: [data.model.qrcodeUrl] // 需要预览的图片http链接列表
                    });
                }
            }
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        that.data.options = options;
        that.setData({
            tableNo:options.tableNo
        })
        wx.removeStorageSync("toStoreTableInfo");
        /*
        * 判断用户是否授权 （skipUserInfoOauth+options.scene+options.shareType && options.shareType == "FX"）
        * */
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');  //
            mallSiteId = wx.getStorageSync('mallSiteId'); //
            let goodsId = options.goodsId || options.id || "";
            that.findCategory();   //商品列表左侧分类
            // that.findShoperInfo(); // 商家信息
            that.setData({
                goodsId: goodsId
            })
            that.getTakeOutGood(goodsId);
            that.setData({
                tostore: true
            })
            that.setData({
                foodType: 3
            });
            if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
                console.log(app.globalData.userInfo)
                /* 与后台发起通讯连接 保持不间断 */
                wx.connectSocket({
                    url: cf.config.socketDomain + 'ws_connection/multi_per_order/' + that.data.options.tableNo + '/' + cusmallToken,
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function (res) {
                        console.log("成功")
                        console.log(res)
                    },
                    error: function (error) {
                        console.log("失败")
                        console.log(error)
                    },
                    complete(result) {
                        console.log("完成")
                        console.log(result)
                    }
                });
                /* 监控websocket打开事件 */
                wx.onSocketOpen(function (res) {
                    console.log("打开");
                    console.log(res)
                })
                wx.onSocketMessage(function (res) {
                    console.log("消息推送")
                    let data = JSON.parse(res.data)
                    console.log(data)
                    if (data.ret == 0) {
                        if (data.model && data.model.result.length >= 0) {
                            that.setData({
                                allMultiData: data.model.result //
                            })
                            /* 将购物车数据进行筛选 */
                            that.allDataList();
                        }
                        if (that.data.cartType == 1) {  //自己增加goodsInfo
                            that.addSocket(that.data.goodsId, that.data.specIds)
                            that.setData({
                                addInfo: that.data.goodsInfo
                            })
                        } else if (that.data.cartType === 0) { //自己减少
                            that.delSocket(that.data.goodsId, that.data.specIds)
                        } else if (that.data.cartType === -1) {  //清空购物车
                            /* 清空购物车 */
                            var categoryList = that.data.categoryList;
                            for (var j = 0; j < categoryList.length; j++) {
                                var cat = categoryList[j];
                                var goodsList = cat.mallGoodsList;
                                if (goodsList) {
                                    for (var i = 0; i < goodsList.length; i++) {
                                        var goods = goodsList[i];
                                        goods.selectedNum = 0;
                                    }
                                }
                            }
                            that.setData({
                                "categoryList": categoryList,
                                "selectedGoods": null,
                                "showShoppingCart": false,
                                "othersAdd":[],
                                "mySelfAdd":[],
                                sumInfo: {
                                    "totalMoney": 0,
                                    "totalCount": 0
                                },
                                takeOutShoppingCart: [],
                            });
                            // that.fillShoppingCart();
                        }
                    } else if (data.operateType == 1) {           //别人增加
                        that.othersSocket(data.goodsId,data);
                        that.setData({
                            addInfo: data,  //新增气泡
                        })
                    } else if (data.operateType === 0) {            //别人减少
                        that.othersDel(data.goodsId, data)
                    } else if (data.operateType == 1) {           //别人清空购物车
                        /* 清空购物车 */
                        var categoryList = that.data.categoryList;
                        for (var j = 0; j < categoryList.length; j++) {
                            var cat = categoryList[j];
                            var goodsList = cat.mallGoodsList;
                            if (goodsList) {
                                for (var i = 0; i < goodsList.length; i++) {
                                    var goods = goodsList[i];
                                    goods.selectedNum = 0;
                                }
                            }
                        }
                        that.setData({
                            "categoryList": categoryList,
                            "selectedGoods": null,
                            "showShoppingCart": false,
                            "othersAdd":[],
                            "mySelfAdd":[],
                            sumInfo: {
                                "totalMoney": 0,
                                "totalCount": 0
                            },
                            takeOutShoppingCart: [],
                        });
                    }else if (data.operateType == 2) {  //选好了
                        that.data.leaveStatus = true;
                        wx.closeSocket({})
                        wx.navigateTo({
                            url: './orderList?tableNo=' + that.data.options.tableNo
                        })
                    } else if (data.operateType == 4) { //下单
                        that.data.leaveStatus = true;
                        wx.closeSocket({})
                        wx.navigateTo({
                            url: './orderReceive?tableNo=' + that.data.options.tableNo
                        })
                    }  else if (data.ret == -1) {
                        wx.showToast({
                            title: data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    }else if (data.ret == -3001) {
                        wx.showToast({
                            title: data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })

                /* 监听会话关闭事件 */
                wx.onSocketClose(function () {
                    console.log("连接已断开")
                    if (!that.data.leaveStatus) {
                        wx.showToast({
                            title: "网络开小差，请下拉刷新",
                            icon: 'none',
                            duration: 2000
                        });
                    }

                })

                /* 监听websocket错误事件 */
                wx.onSocketError(function (error) {
                    console.log("错误信息")
                    console.log(error)
                })
            }
            //util.afterPageLoad(this);
            // 获取当前位置
            // that.fetchDistance();  //配送距离
            // that.findConfig();  //  查询配置信息

            //开始处理分销
            // that.setData({
            //     showFX: app.globalData.isOpenDistribution
            // });
            // that.setData({
            //     isSalesmen: app.globalData.isDistributor
            // });
            // if (that.data.showFX && that.data.isSalesmen) {
            //     that.getDistributorConfig();
            // }
            util.afterPageLoad(that);  //底部菜单处理
        });
    },

    closeOpeningModal: function () {
        this.setData({
            showOpeningModal: false
        })
    },

    // show modal

    showModel: function () {
        var that = this;
        that.setData({
            showTrack: false
        })
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        let that = this;
        that.setData({
            "isSubmitIng": false
        });
        if (that.data.bgMusic && that.data.playBgMusic) {
            that.audioCtx.play();
        }
        this.data.leaveStatus=true;
        that.setData({
            currentIndex: 0, //当前索引
            step: 0,
        })
        //当下单完毕的时候 返回页面 清空购物车数据
        if (!that.data.isFirstShowPage) {
            var mShopCart = wx.getStorageSync(that.data.cartKey);
            if (mShopCart.takeOutShoppingCart && 0 == mShopCart.takeOutShoppingCart.length) {
                var goods = that.data.showGoods;
                goods.selectedNum = 0;
                if (goods.usenewspec) {
                    for (let item of goods.specData) {
                        item.selectedNum = 0;
                    }
                }
                that.setData({
                    showGoods: goods,
                    selectedGoods: null,
                    "showShoppingCart": false,
                    takeOutShoppingCart: [],
                    sumInfo: {
                        totalMoney: 0,
                        totalCount: 0,
                    }
                });
            }

        } else {
            that.setData({
                isFirstShowPage: false
            })
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        this.data.leaveStatus = true;
        wx.closeSocket({})
        if (this.audioCtx) {
            this.audioCtx.pause();
        }
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        this.data.leaveStatus = true;
        wx.closeSocket({})
        // if (app.globalData.shopuid) {
        //   app.globalData.shopuid = null;
        //   app.globalData.fromuid = null;
        //   // 从子店铺首页切换回主店铺首页时需要重新获取mallSite
        //   app.globalData.needReloadIndexPage = true;
        // }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        console.log("1")
        let ctx = this;
        if (ctx.data.trackList.length > 0) {
            ctx.setData({
                showTrack: true
            })
        }
        wx.stopPullDownRefresh();

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
    },

    /**
     * 用户点击右上角
     */
    onShareAppMessage: function () {
      let that = this;
      let shareObj = that.getShareConfig();
      return shareObj;

    },

}));
