// pages/takeout/index.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
let definedSpecArray = [];
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, goodsDetailHandle, {
    data: {
        app: app,
        noBusiness: false,//未营业
        // 是否跳过用户信息授权
        skipUserInfoOauth: true,
        authType: 1, //拒绝授权 停留当前页
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        logoImg: "http://p0.meituan.net/xianfu/83f5fa588ae12840f2d68e72d1cfc40b46851.jpg",
        panelTab: {
            "selectedId": "0",
            "list": [
                {"id": "0", "title": "商品"},
                {"id": "1", "title": "评价"},
                {"id": "2", "title": "商家"},
                {"id": "3", "title": "搜索"}
            ]
        },
        selectedCatIndex: 0,
        openGoodsShare: false,
        goodsList: [],
        judgeList: [],
        focusOfficial: false,
        foodType: "",
        isSalesmen: false,//判断是否是销售人员
        showFX: false,//判断是开启分销,
        mainBannerHeight: 562,
        isFirstShowPage: true,
        usenewspecShow: false,// 规格框的显示,
        scrollTop: 0,
        toType: "",
        indicatorDots: false,
        autoplay: false,
        duration: 0, //可以控制动画
        indexSize: 0,
        showOverReduce: false,//满减配置
        overReduceType: 0,
        overReduceRule: {},
        showOverReduceDetail: false,//满减详情下拉
        businessCheck: true,//是否营业
    },

    /* tab切换头 如商品-->评价 */
    handlePanelTabChange(e) {
        var selectedId = e.target.dataset.id;
        this.setData({
            [`panelTab.selectedId`]: selectedId
        });
    },

    /* 搜索按钮点击 */
    handleSearch() {
        let foodType = this.data.foodType || '';
        wx.navigateTo({
            url: '../searchTakeout/searchTakeout?foodType=' + foodType + '&type=' + this.data.toType
        })
    },

    /* 左右滑动切换 */
    handlePanelContentChange(e) {
        var current = e.detail.current;
        this.setData({
            [`panelTab.selectedId`]: current
        });
        if (current == 1 && !this.data.hasLoadJudge) {
            this.fetchJudgeData();
            this.data.hasLoadJudge = true;
        }
    },

    /* 商家地址跳转 */
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

    /* 商品增加事件 */
    addFood: function (goodsId, specIds) {
        var that = this;
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

        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        if (goodsIndex != null) {
            //T T 购物车还原
            // that.initLocalCart(that.data.options.type);
            var mCart = that.data.takeOutShoppingCart || [];
            var sGList = that.data.categoryList[catIndex].mallGoodsList || [];
            for (let gItem of mCart) {

                for (let j = 0; j < sGList.length; j++) {
                    if (gItem.id == sGList[j].id) {
                        that.setData({
                            ["categoryList[" + catIndex + "].mallGoodsList[" + j + "]"]: gItem
                        });
                        break;
                    }
                }
            }
            //T T 购物车还原
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
          // 限购

          if (goods.enableLimitation == 1) {
            if ((goods.selectedNum || 0 + goods.historyCount || 0) >= goods.limitations) {
              wx.showModal({
                title: '',
                content: '该商品最多可购' + goods.limitations + '件',
              })
              return;
            }

          }
          if (goods.enableLimitation == 2) {
            if ((goods.selectedNum || 0 + goods.historyCount || 0) >= goods.limitations) {
              wx.showModal({
                title: '',
                content: '该商品每日最多可购' + goods.limitations + '件',
              })
              return;
            }

          }

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
                    var spec = goods.specData[j];
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
            if (that.data.showGoods) {
                that.setData({
                    "showGoods": goods,
                });
            }
            that.setData({
                "selectedGoods": goods,
                ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
            });
            // 同步所有分类里面的商品信息
            var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
            if (goodsCatIndex != null) {
                that.setData({["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods});
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
        if (goodsIndex != null) {
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
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
            } else {

            }
            if (that.data.showGoods) {
                that.setData({
                    "showGoods": goods,
                });
            }
            that.setData({
                "selectedGoods": goods,
                ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
            });
            // 同步所有分类里面的商品信息
            var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
            if (goodsCatIndex != null) {
                that.setData({["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods});
            }
            that.fillShoppingCart();
            if (that.data.sumInfo.totalMoney <= 0) {
                that.setData({
                    "showShoppingCart": false,
                    "selectedGoods": null
                });
            }
        }
    },
    // 把已选商品加入购物车后进行去重，计算总数和总金额
    fillShoppingCart: function () {
        var that = this;
        var takeOutShoppingCart = [];
        var totalMoney = 0;
        var totalCount = 0;
        var categoryList = that.data.categoryList;
        // for(var cat=0;cat<that.data.takeOutShoppingCart;cat++){}
        for (var j = 0; j < categoryList.length; j++) {
            var cat = categoryList[j];
            var mallGoodsList = cat.mallGoodsList;
            if (j == 0 && mallGoodsList) {  //修复加入购物车时候商品未加载完全时候回显的bug
                that.data.takeOutShoppingCart.forEach(function (cart_) {
                    // let malljudge = mallGoodsList.some(function (mall_) {
                    //     return mall_.id == cart_.id;
                    // });
                    let malljudge = false;
                    mallGoodsList.forEach(function (goodsItem,goodsIndex) {
                        if (goodsItem.id == cart_.id) {
                            malljudge = true;
                            that.setData({["categoryList[0].mallGoodsList[" + goodsIndex + "]"]: cart_});
                        }
                    });
                    if (!malljudge) {
                        mallGoodsList.push(cart_)
                    }
                })
            }

            if (mallGoodsList) {
                for (var i = 0; i < mallGoodsList.length; i++) {
                    var goods = mallGoodsList[i];
                    if (goods.selectedNum > 0) {
                        var isInCart = false;
                        for (var k = 0; k < takeOutShoppingCart.length; k++) {
                            if (takeOutShoppingCart[k].id == goods.id) {
                                isInCart = true;
                            }
                        }
                        if (!isInCart) {
                            takeOutShoppingCart.push(goods);
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
                                for (var m = 0; m < goods.specData.length; m++) {
                                    var spec = goods.specData[m];
                                    if (spec.selectedNum > 0) {
                                        totalMoney += spec.price * spec.selectedNum;
                                    }
                                }
                            } else {
                                totalMoney += goods.price * goods.selectedNum;
                            }
                            totalCount += goods.selectedNum;
                        }
                    }
                }
            }
        }
        that.setData({
            takeOutShoppingCart: takeOutShoppingCart,
            sumInfo: {
                "totalMoney": totalMoney,
                "totalCount": totalCount
            }
        })
        /**
         * 本地缓存购物车
         */
        var mShopCart = {
            takeOutShoppingCart: takeOutShoppingCart,
            sumInfo: {
                "totalMoney": totalMoney,
                "totalCount": totalCount
            }
        };
        if (app.globalData.shopuid && app.globalData.fromuid) {//子店购物车

            wx.setStorageSync(that.data.toType + "c" + app.globalData.shopuid + app.globalData.fromuid, mShopCart);
        } else {
            wx.setStorageSync(that.data.toType + "cMain", mShopCart);
        }
        /**
         * 本地缓存购物车
         */
        return that.data.sumInfo;
    },

    /* 判断点击弹出框外的关闭弹出框 */
    handleShoppingCartTap: function (e) {

        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            if ("showShoppingCart" == action) {
                if (that.data.sumInfo.totalMoney > 0) {
                    that.setData({"showShoppingCart": true});
                }
            } else if ("hideShoppingCart" == action) {
                that.setData({"selectedGoods": null});
                that.setData({"showShoppingCart": false});
            } else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            } else if ("delFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            } else if ("clearShoppingCart" == action) {
                var categoryList = that.data.categoryList;
                for (var j = 0; j < categoryList.length; j++) {
                    var cat = categoryList[j];
                    var goodsList = cat.mallGoodsList;
                    if (goodsList) {
                        for (var i = 0; i < goodsList.length; i++) {
                            var goods = goodsList[i];
                            goods.selectedNum = 0;
                            if (goods.usenewspec) {
                                for (var j = 0; j < goods.specData.length; j++) {
                                    var spec = goods.specData[j];
                                    if (typeof (spec.selectedNum) != "undefined") {
                                        delete spec.selectedNum;
                                    }
                                }
                            }

                        }
                    }
                }
                that.setData({
                    "categoryList": categoryList,
                    "selectedGoods": null,
                    "showShoppingCart": false,
                    "takeOutShoppingCart": []
                });
                that.fillShoppingCart();
            }
        }
    },
    /* 商品进入详情点击 */
    handleGoodsItemTap: function (e) {
        var that = this;
        var target = e.currentTarget;
        var goodsId = target.dataset.id;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
        var target = e.target;
        if (goodsId) {
            wx.navigateTo({
                url: './indexDetail?fromIndex=true&goodsId=' + goodsId + '&type=' + that.data.toType,
            })
        }
        if (target) {
            var action = target.dataset.action;

            if (action) {
                return;
            }
        }
        if (!goods.selectedSku) {
            /* 规格数据重绘 */
            if (goods.usenewspec && goods.spec == '') {
                definedSpecArray.forEach(function (item) {
                    if (goods.id == item.goodsId) {
                        goods.specData = item.data;
                        goods.spec = JSON.stringify(item.data)
                    }
                })
            }
            goods.selectedSku = goods.spec ? JSON.parse(goods.spec)[0] : {};
        }
        // that.setData({ "showGoods": goods });

    },

    /* 暂无了解 */
    handleCloseGoodsDetail: function (e) {
        this.setData({"showGoods": null});
    },

    /* 规格选择事件 */
    selectedSpec: function (e) {
        this.setData({"selectedGoods": this.data.showGoods});
    },

    /* 商品的各个操作 */
    handleTabItemTap: function (e) {
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            /* 规格选择操作 */
            if ("selectSpec" == action) {
                if (!this.checkUserInfo()) {
                    return false;
                }
                var goodsId = e.target.dataset.id;
                var goodsPos = that.findGoodsPos(goodsId);
                var catIndex = goodsPos ? goodsPos[0] : null;
                var goodsIndex = goodsPos ? goodsPos[1] : null;
                var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
                if (goods.usenewspec && goods.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goods.id == item.goodsId) {
                            goods.specData = item.data;
                            goods.spec = JSON.stringify(item.data)
                        }
                    })
                }
                if (!goods.selectedSku) {
                    /* 判断首次进入时选择的排列规格 */
                    let goodsSku = [];
                    goods.specJsonArray.forEach(function (item) {
                        goodsSku.push(item.specValue[0].id);
                    });
                    let goodsSpec = goods.spec ? JSON.parse(goods.spec) : [];
                    let selectedSku = [];
                    goodsSpec.forEach(function (item) {
                        if (item.ids === goodsSku.join(',')) {
                            selectedSku = item;
                        }
                    });
                    goods.selectedSku = selectedSku;
                }
                that.setData({
                    "selectedGoods": goods,
                    usenewspecShow: true
                });
            }
            /* 商品添加操作 */
            else if ("addFood" == action) {
                if (!this.checkUserInfo()) {
                    return false;
                }
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            }
            /* 商品删除操作 */
            else if ("delFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            }
            /* 展示购物车操作 */
            else if ("showShoppingCart" == action) {
                if (that.data.sumInfo.totalMoney > 0) {
                    that.setData({"showShoppingCart": true});
                }
            }
            /* 去结算操作 */
            else if ("submit" == action) {
                if (!this.checkUserInfo()) {
                    return false;
                }
                // 判断是否在营业时间内
                let businessTime = that.data.shoperInfo.businessTime;
                if (businessTime && businessTime.length > 0) {//!that.data.tostore &&
                    let nowTime = new Date();
                    let isValidTime = false;
                    for (let i = 0; i < businessTime.length; i++) {
                        let busTime = businessTime[i];
                        let startTime = new Date();
                        startTime.setHours(Number(busTime.startTime.split(":")[0]));
                        startTime.setMinutes(Number(busTime.startTime.split(":")[1]));

                        let endTime = new Date();
                        endTime.setHours(Number(busTime.endTime.split(":")[0]));
                        endTime.setMinutes(Number(busTime.endTime.split(":")[1]));

                        if (nowTime.getTime() >= startTime.getTime() &&
                            nowTime.getTime() <= endTime.getTime()) {
                            isValidTime = true;
                            break;
                        }
                    }
                    if (!isValidTime) {
                        let busTimeStr = "";
                        for (let i = 0; i < businessTime.length; i++) {
                            busTimeStr += businessTime[i].startTime + "-" + businessTime[i].endTime;
                            busTimeStr += "  ";
                        }
                        wx.showModal({
                            title: '提示',
                            showCancel: false,
                            content: "我的天，商家该时间不营业！\n商家营业时间：\n" + busTimeStr
                        });
                        return false;
                    }
                }

                that.setData({"isSubmitIng": true});

                if (that.data.tostore) {
                    wx.setStorageSync('toStoreShoppingCart', that.data.takeOutShoppingCart);
                    wx.navigateTo({
                        url: '/pages/orderinfo/orderinfo?fromToStore=true&ckey=' + that.data.cartKey
                    })
                } else {
                    wx.setStorageSync('takeOutShoppingCart', that.data.takeOutShoppingCart);
                    wx.navigateTo({
                        url: '/pages/orderinfo/orderinfo?fromTakeout=true&ckey=' + that.data.cartKey
                    })
                }
            }
        }
    },

    /* 类型选择 */
    handleCatTap: function (e) {
        var that = this;
        var catId = e.currentTarget.dataset.id;

        that.findGoods(catId, true);
        that.setData({
            catId: catId,
            selectedCategory: that.findCategoryFromList(catId),
            selectedCatIndex: that.findCatIndexFromList(catId),
            indexSize: that.findCatIndexFromList(catId),
        });

    },
    // scorllTop:function (){
    //   console.log('top')
    //   var that = this;
    //   that.setData({
    //     topScorll:true
    //   })
    //   if(that.data.selectedCatIndex !=0 && !that.data.bottomScorll && that.data.topScorll){
    //     let catIds = that.data.categoryList[that.data.selectedCatIndex - 1].id;
    //     that.findGoods(catIds, true);
    //     that.setData({
    //       catId: catIds,
    //       selectedCategory: that.findCategoryFromList(catIds),
    //       selectedCatIndex: that.findCatIndexFromList(catIds),
    //       indexSize: that.findCatIndexFromList(catIds),
    //     });
    //   }

    // },
    /* 滚动到底部 */
    scorllBottom: function (e) {
        var that = this;
        var catId = e.currentTarget.dataset.id;
        var toBottom = e.currentTarget.dataset.more;
        if (!toBottom && that.data.categoryList[that.data.selectedCatIndex].mallGoodsList.length != 0) {
            that.findGoods(catId, true);
            that.setData({
                catId: catId,
                selectedCategory: that.findCategoryFromList(catId),
                selectedCatIndex: that.findCatIndexFromList(catId),
                indexSize: that.findCatIndexFromList(catId),
            });

        }
    },
    change(e) {
        var that = this;
        var catId = "";
        for (var i = 0; i < that.data.categoryList.length; i++) {
            if (e.detail.current == i) {
                catId = that.data.categoryList[i].id;
            }
        }
        that.findGoods(catId, true);
        that.setData({
            catId: catId,
            selectedCategory: that.findCategoryFromList(catId),
            indexSize: e.detail.current,
            selectedCatIndex: that.findCatIndexFromList(catId)
        });
    },
    back: function (e) {
        this.setData({"showGoods": null});
    },
    // 同步所有分类里面的商品信息
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
        if (goods.usenewspec && goods.spec == '') {
            definedSpecArray.forEach(function (item) {
                if (goods.id == item.goodsId) {
                    goods.specData = item.data;
                    goods.spec = JSON.stringify(item.data)
                }
            })
        }
        var specList = goods.spec ? JSON.parse(goods.spec) : [];
        for (var i = 0; i < specList.length; i++) {
            if (specList[i].ids == skuId) {
                return specList[i];
            }
        }
        return null;
    },
    findSelectedSpec: function (specId, groupId, goods) {
        var that = this;
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
        //goods.specData = JSON.parse(goods.spec);
        /*console.log(definedSpecArray)*/
        if (goods.usenewspec && goods.spec == '') {
            definedSpecArray.forEach(function (item) {
                if (goods.id == item.goodsId) {
                    goods.specData = item.data;
                    goods.spec = JSON.stringify(item.data)
                }
            })
        }
        for (var k = 0; k < goods.specData.length; k++) {
            if (goods.specData[k].ids == selectedIds) {
                return goods.specData[k];
            }
        }
        return null;
    },
    handleSkuModalTap(e) {
        var that = this;
        var target = e.target;
        var selectedGoods = that.data.selectedGoods;
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

                that.setData({["selectedGoods.selectedSku"]: sku});
                that.setData({["selectedGoods.specJsonArray"]: selectedGoods.specJsonArray});
                var goodsPos = that.findGoodsPos(selectedGoods.id);
                var catIndex = goodsPos ? goodsPos[0] : null;
                var goodsIndex = goodsPos ? goodsPos[1] : null;
                that.setData({["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: selectedGoods});
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

    fetchJudgeData: function () {
        var vm = this;
        var start = vm.data.judgeList.length;
        wx.showLoading({
            title: "加载中",
        })
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/review/queryReviews',
            data: {
                cusmallToken: cusmallToken,
                mallSiteId: mallSiteId,
                "type": 2,
                start: start,
                limit: 10
            },
            header: {
                "content": "application/json"
            },
            success: function (res) {
                wx.hideLoading();
                if (res.data.ret == 0) {
                    var judgeList = res.data.model.reviews;
                    for (var i = 0; i < judgeList.length; i++) {
                        // judgeList[i].createTime = util.formatTime(new Date(judgeList[i].createTime));
                        judgeList[i].reviewTime = util.formatDate(new Date(judgeList[i].reviewTime));
                    }
                    vm.setData({"judgeList": vm.data.judgeList.concat(judgeList)});
                    vm.setData({"judgeTotal": res.data.model.total});
                }
            }
        })
    },

    handleProductScrollToLower: function () {
        let that = this;
        var cat = that.findCategoryFromList(that.data.selectedCategory.id);
        if (cat.mallGoodsList.length < cat.total) {
            that.findGoods(cat.id, false);
        }
    },

    /* 获取商品信息 */
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
                        var goods = mallGoodsList[i];/* 角标筛选 */
                        if (goods.cornerMarker && goods.cornerMarker.content) {
                            goods.cornerMarker = JSON.parse(goods.cornerMarker);
                        } else if (!goods.cornerMarker) {
                            goods.cornerMarker = ""
                        }

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
                            var specArray = goods.spec ? JSON.parse(goods.spec) : [];
                            // goods.specData = specArray
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
                        let allCatGoods = that.data.categoryList[0].mallGoodsList;
                        if (allCatGoods && allCatGoods.length > 0) {
                            for (let j = 0; j < allCatGoods.length; j++) {
                                if (goods.id == allCatGoods[j].id) {
                                    if (allCatGoods[j].usenewspec) {
                                        /*  规格数据格式化 */
                                        definedSpecArray.forEach(function (item) {
                                            if (item.goodsId == allCatGoods[j].id) {
                                                allCatGoods[j].spec = JSON.stringify(item.data)
                                            } else {
                                                allCatGoods[j].specData = allCatGoods[j].spec ? JSON.parse(allCatGoods[j].spec) : []
                                            }
                                        })
                                    }
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
                    that.initLocalCart(that.data.toType);
                    wx.hideLoading();
                }
            }
        })
    },

    /* 获取商品分类 */
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
                    categoryList.push({"id": "", "name": "全部"});
                    categoryList = categoryList.concat(res.data.model.result);
                    that.setData({
                        categoryList: categoryList
                    });
                    // console.log(that.data.indexSize)
                    // console.log(that.data.selectedCategory);
                    that.setData({
                        selectedCategory: categoryList[0]
                    });
                    if (that.data.catId) {
                        that.findGoods(that.data.catId, true);
                    }else {
                        that.findGoods(categoryList[0].id, true);
                    }


                }
            }
        })
    },

    /*商家电话*/
    handleCallShoper: function () {
        wx.makePhoneCall({
            phoneNumber: this.data.shoperInfo.tel
        })
    },
    /* 未营业提示 */
    handleBusiness: function () {
        wx.showModal({
            title: '提示',
            showCancel: false,
            content: '很抱歉，商家尚未营业',
            success(res) {
                if (res.confirm) {

                }
            }
        })
    },
    findShoperInfo: function () {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/mobile/takeAway/find',
            data: {
                siteId: mallSiteId
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var shoperInfo = res.data.model.takeAway;
                    var businessCheck = res.data.model.takeAway.businessCheck;
                    if (shoperInfo && shoperInfo.businessTime) {
                        shoperInfo.businessTime = JSON.parse(shoperInfo.businessTime);
                    }
                    that.setData({
                        shoperInfo: shoperInfo || {},
                        businessCheck: businessCheck
                    });
                    var information = (shoperInfo && shoperInfo.information) || 0;
                    if ((information & (Math.pow(2, 2))) == 0) {
                        that.setData({
                            eatTypeTipsShow: true
                        })
                    }
                    //是分享进来的 判断是否营业
                    if (that.data.businessCheckFlag && !that.data.businessCheckFlag) {
                        wx.showModal({
                            title: '提示',
                            showCancel: false,
                            content: '很抱歉，商家尚未营业',
                            success(res) {
                                if (res.confirm) {
                                    that.setData({
                                        noBusiness: true
                                    });
                                    wx.navigateBack({
                                        delta: -1
                                    });
                                } else {
                                    that.setData({
                                        noBusiness: true
                                    });
                                    wx.navigateBack({
                                        delta: -1
                                    });
                                }
                            }
                        })
                    } else {
                        that.setData({
                            noBusiness: false
                        });
                    }
                    //正常情况下进来的 判断是否营业
                    if (!businessCheck) {
                        wx.showModal({
                            title: '提示',
                            showCancel: false,
                            content: '很抱歉，商家尚未营业',
                            success(res) {
                                if (res.confirm) {
                                    that.setData({
                                        noBusiness: true
                                    });
                                    wx.navigateBack()
                                } else {
                                    that.setData({
                                        noBusiness: true
                                    });
                                    wx.navigateBack()
                                }
                            }
                        })
                    } else {
                        that.setData({
                            noBusiness: false
                        });
                    }
                }
            }
        })
    },
    // 如果是到店商品，查找位置信息
    findTableInfo: function (id) {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/mobile/takeAway/findTable',
            data: {
                id: id
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    let tableInfo = res.data.model.table;
                    wx.setStorageSync('toStoreTableInfo', tableInfo);
                    that.setData({
                        focusOfficial: tableInfo.focusOfficial
                    })
                }
            }
        })
    },

    fetchDistance: function () {
        var that = this;
        wx.getLocation({
            type: 'gcj02',
            success: function (res) {
                console.info("当前位置：", res);
                wx.request({
                    url: cf.config.pageDomain + '/mobile/takeAway/getDistance',
                    data: {
                        siteId: mallSiteId,
                        lat1: res.latitude,
                        lng1: res.longitude
                    },
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function (res) {
                        console.info("当前位置与商家地址距离", res);
                        if (res.data.ret == 0) {
                            that.setData({distance: res.data.model.distance});
                        }
                    }
                })
            }
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        // 处理多店铺分店UID
        that.setData({
            isMainShop: !app.globalData.shopuid//是否是主店
        });
        // wx.setNavigationBarTitle({
        //   title: "商品列表"
        // })
        var businessCheckFlag = options.businessCheck;
        that.setData({
            businessCheckFlag: businessCheckFlag
        })
        if (options.titleName) {
            wx.setNavigationBarTitle({
                title: decodeURIComponent(decodeURIComponent(options.titleName))
            })
        } else {
            wx.setNavigationBarTitle({
                title: "商品列表"
            })
        }
        if (options.shopuid) {
            app.globalData.shopuid = options.shopuid;
            app.globalData.fromuid = options.fromuid;
            that.data.app.globalData.shopuid = options.shopuid;
            that.data.app.globalData.fromuid = options.fromuid;
        } else if (!app.globalData.shopuid) {
            app.globalData.shopuid = "";
            app.globalData.fromuid = "";
            that.data.app.globalData.shopuid = "";
            that.data.app.globalData.fromuid = "";
        }
        /**
         * 本地缓存购物车
         */
        var mShopCart;
        if (app.globalData.shopuid && app.globalData.fromuid) {//子店购物车
            mShopCart = wx.getStorageSync(options.type + "c" + app.globalData.shopuid + app.globalData.fromuid) || {};
            that.setData({
                cartKey: options.type + "c" + app.globalData.shopuid + app.globalData.fromuid
            });
        } else {
            mShopCart = wx.getStorageSync(options.type + "cMain") || {};
            that.setData({
                cartKey: options.type + "cMain"
            });
        }
        /* 购物车商品 */
        that.setData({
            takeOutShoppingCart: mShopCart.takeOutShoppingCart || [],
            sumInfo: mShopCart.sumInfo,
            toType: options.type
        })
        /**
         * 本地缓存购物车
         */

        wx.showShareMenu({
            withShareTicket: false
        });
        wx.removeStorageSync("toStoreTableInfo");
        if (options.type && options.type == "tostore") {
            that.setData({
                tostore: true
            })
            that.setData({
                foodType: 3
            });
        }
        if (options.type && options.type == "ta") {
            that.setData({
                foodType: 4
            });
        }
        if (options.scene) {
            var scene = decodeURIComponent(options.scene);
            that.data.scene = scene.split("&");
            let sceneType = that.data.scene[1].split("=")[1];
            let tableId = that.data.scene[0].split("=")[1];
            if ("tostore" == sceneType) {
                that.setData({
                    tostore: true,
                    toType: sceneType,
                    foodType: 3
                })
            }
            that.findTableInfo(tableId);
        }
        if (options.fromIndex) {
            that.setData({
                fromIndex: true
            })

            that.setData({
                showOpeningModal: app.globalData.showOpeningModal
            })
        }
        if (that.data.tostore) {
            let titleName = "商品列表";
            if (options.titleName) {
                titleName = decodeURIComponent(decodeURIComponent(options.titleName));
            }
            wx.setNavigationBarTitle({
                title: titleName
            })
        }
        if (options.returnIndex) {
            that.setData({
                returnIndex: options.returnIndex
            })
        }
        that.data.options = options;
        // if (that.data.isMainShop) {
        //     wx.removeStorageSync('mallSiteId') //主店重新删除
        // }
        that.fetchMallInfo().then(result => {
            wx.setStorageSync('mallSiteId', result.id);
            mallSiteId = result.id;
            app.getUserInfo(this, options, function (userInfo, res) {
                cusmallToken = wx.getStorageSync('cusmallToken');
                //满减判断
                that.fetchOverReduce(result.overReduce)

                that.findCategory();
                that.findShoperInfo();
                //util.afterPageLoad(this);
                // 获取当前位置
                that.fetchDistance();
                that.findConfig();
                //开始处理分销
                that.setData({
                    showFX: app.globalData.isOpenDistribution
                });
                that.setData({
                    isSalesmen: app.globalData.isDistributor
                });
                if (that.data.showFX && that.data.isSalesmen) {
                    that.getDistributorConfig();
                }
                util.afterPageLoad(that);
            });
        });

        // this.fetchOverReduce().then(function (result) {
        //
        // });
    },
    fetchOverReduce(result) {
        let that = this;
        if (mallSite) {
            mallSite.overReduce = result
        }
        if (mallSite.overReduce) {
            let overReduce = JSON.parse(mallSite.overReduce);
            if (overReduce.ruleType && overReduce.ruleArray && (overReduce.ruleType == 1 || overReduce.ruleType == 2)) {
                let overReduceType = overReduce.ruleType;
                let overReduceRule = overReduce.ruleArray;
                if (overReduceRule.length > 0) {
                    for (let i = 0; i < overReduceRule.length; i++) {
                        overReduceRule[i].reduce = (overReduceRule[i].reduce / 100).toFixed(2);
                        if (overReduceType == 2) {
                            overReduceRule[i].over = (overReduceRule[i].over / 100).toFixed(2);
                        }
                    }
                    that.setData({
                        showOverReduce: true,
                        overReduceType: overReduceType,
                        overReduceRule: overReduceRule,
                    });
                }
            }
        }
    },
    /* 获取店铺Id */
    fetchMallInfo: function () {
        return new Promise(function (resolve, reject) {
            let submitData = {
                cusmallToken: wx.getStorageSync('cusmallToken'),
                uid: app.globalData.shopuid
            };
            wx.request({
                url: cf.config.pageDomain + '/applet/mobile/mallSite/getMallSite',
                data: submitData,
                header: {
                    'content-type': 'application/json'
                },
                fail: function (data) {
                    console.error("后台接口getMallSite失败", data);
                },
                success: function (res) {
                    if (res.data.ret == 0) {
                        let mallSiteData = res.data.model.mallSite;
                        // wx.setStorageSync('mallSiteId', mallSite.id);
                        resolve(mallSiteData);
                    }
                    //typeof cb == "function" && cb(app.globalData.userInfo, res);
                    wx.hideLoading();
                }
            })
        });

    },
    initLocalCart(gType) {
        /**
         * 初始化本地缓存购物车
         */
        var mShopCart2;
        var that = this;
        if (app.globalData.shopuid && app.globalData.fromuid && app.globalData.shopuid != app.globalData.fromuid) { //子店购物车
            mShopCart2 = wx.getStorageSync(gType + "c" + app.globalData.shopuid + app.globalData.fromuid) || {};
            that.setData({
                cartKey: gType + "c" + app.globalData.shopuid + app.globalData.fromuid
            });
        } else {
            mShopCart2 = wx.getStorageSync(gType + "cMain") || {};
            that.setData({
                cartKey: gType + "cMain"
            });
        }
        that.setData({
            takeOutShoppingCart: mShopCart2.takeOutShoppingCart || [],
            sumInfo: mShopCart2.sumInfo,
            toType: gType
        })
        /**
         * 初始化本地缓存购物车
         */
    },

    closeOpeningModal: function () {
        this.setData({
            showOpeningModal: false
        })
    },

    //点击满减箭头事件
    changeOverReduce: function () {
        var that = this;
        that.setData({
            ['showOverReduceDetail']: !that.data.showOverReduceDetail,
        });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        var that = this
        // if (!that.data.businessCheck) {
        //   wx.showModal({
        //     title: '提示',
        //     showCancel: false,
        //     content: '很抱歉，商家尚未营业',
        //     success(res) {
        //       if (res.confirm) {
        //         wx.navigateBack()
        //       }
        //     }
        //   })
        // }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var ctx = this;
        ctx.setData({"isSubmitIng": false});
        if (!ctx.data.isFirstShowPage) {
            /**
             * 本地缓存购物车
             */
            var mShopCart;
            if (app.globalData.shopuid && app.globalData.fromuid) {//子店购物车
                mShopCart = wx.getStorageSync(ctx.data.toType + "c" + app.globalData.shopuid + app.globalData.fromuid) || {};
            } else {
                mShopCart = wx.getStorageSync(ctx.data.toType + "cMain") || {};
            }
            ctx.setData({
                takeOutShoppingCart: mShopCart.takeOutShoppingCart,
                sumInfo: mShopCart.sumInfo,
            })
            /**
             * 本地缓存购物车
             */

                //T T 购物车还原
            var mCart = ctx.data.takeOutShoppingCart || [];
            var categoryList = ctx.data.categoryList || [];
            var sGList;
            // var sGList = that.data.categoryList[catIndex].mallGoodsList || [];
            for (let gItem of mCart) {

                for (let i = 0; i < categoryList.length; i++) {
                    sGList = categoryList[i].mallGoodsList || [];
                    for (let j = 0; j < sGList.length; j++) {
                        if (gItem.id == sGList[j].id) {
                            ctx.setData({
                                ["categoryList[" + i + "].mallGoodsList[" + j + "]"]: gItem
                            });
                            break;
                        }
                    }
                }

            }
            if (0 === mCart.length) {//如果购物车为空 清除商品数据
                for (let mGoods of categoryList) {
                    if (mGoods.mallGoodsList) {
                        for (let m2Goods of mGoods.mallGoodsList) {
                            if (m2Goods.usenewspec) {
                                if (m2Goods.spec == '') {
                                    definedSpecArray.forEach(function (item) {
                                        if (m2Goods.id == item.goodsId) {
                                            m2Goods.specData = item.data;
                                            m2Goods.spec = JSON.stringify(item.data)
                                        }
                                    })
                                }
                                for (let k = 0; k < m2Goods.specData; k++) {
                                    m2Goods.specData[k].selectedNum = 0;
                                }
                            } else {
                                m2Goods.selectedNum = 0;
                            }
                        }
                    }
                }
                ctx.setData({
                    categoryList: categoryList
                });
            }
            //T T 购物车还原
        } else {
            ctx.setData({isFirstShowPage: false});
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        if (app.globalData.shopuid) {
            app.globalData.shopuid = null;
            app.globalData.fromuid = null;
        }
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 评论页面上拉触底事件的处理函数
     */
    handleJudgeScrollToBottom: function () {
        var that = this;
        if (that.data.panelTab.selectedId == 1) {
            if (that.data.judgeList.length < that.data.judgeTotal) {
                that.fetchJudgeData();
            }
        }
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
        let path = "/pages/takeout/index?fromIndex=true&type=" + this.data.toType + "&fromuid=" + app.globalData.fromuid + "&shopuid=" + app.globalData.shopuid + "&businessCheckFlag=" + this.data.businessCheck;
        let mallSite = wx.getStorageSync('mallSite');
        let title = headerData.share_title || mallSite.name;
        let headerData = wx.getStorageSync('headerData');
        let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
        let shareObj = {
            title: title,
            path: path,
            imageUrl: imageUrl,
            success: function (res) {
                // 成功
            },
            fail: function (res) {
                // 失败
            }
        };

        return shareObj;
    }
}));
