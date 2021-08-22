// shoppingcar.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var app = getApp();
var cusmallToken = wx.getStorageSync('cusmallToken') ||  app.globalData.cusmallToken;
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
Page(Object.assign({}, baseHandle, {

    /**
     * 页面的初始数据
     */
    data: {
        app: app,
        needUserInfo: true,
        shoppingCarList: [],
        goodsCountContent: {},
        cartSelectStatu: {},
        allSelected: true,
        totalPrice: 0,
        scrolltop: 0,
        btnClass: "",
        cartSelectedCount: 0,
        skipUserInfoOauth: true,  //是否跳过授权弹出框
        authType:1, //拒绝停留当前页
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        switchEquity: '', //满包邮开关
        goodsCount: '',//满x件包邮
        goodsPrices: '',//满x元包邮
        showGoodsCount: false,
        showGoodsPrice: false,
        showOverReduce: false,//满减配置
        overReduceType: 0,
        overReduceRule: {},
        showOverReduceDetail: false,
        sancodeShow: false,
        recommendGoodsList:[]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
         wx.hideShareMenu();
        wx.setNavigationBarTitle({
            title: "购物车"
        });
        that.setData({
            options:options
        })
        if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
            that.setData({
                noAuthInfo:false
            })
        }else {
            that.setData({
                noAuthInfo:true
            })
        }
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');
            mallSiteId = wx.getStorageSync('mallSiteId');
            mallSite = wx.getStorageSync('mallSite');
            var parse = JSON.parse;
            that.setData({
                switchEquity: parse(mallSite.globalConfig).switchEquity,
                goodsCount: parse(mallSite.globalConfig).goodsCount,
                goodsPrices: parse(mallSite.globalConfig).goodsPrice,
                sancodeShow: mallSite.scanCode,
            });
            console.log("goodsPrice", parse(mallSite.globalConfig).goodsPrice);
            // 开关判断
            var switchA = parse(mallSite.globalConfig).switchEquity;
            if (((switchA & Math.pow(2, 2)) != 0) && parse(mallSite.globalConfig).goodsCount > 0) {
                that.setData({
                    showGoodsCount: true
                });
            } else {
                that.setData({
                    showGoodsCount: false
                });
            };
            if (((switchA & Math.pow(2, 3)) != 0) && parse(mallSite.globalConfig).goodsPrice > 0) {
                that.setData({
                    showGoodsPrice: true
                });
            } else {
                that.setData({
                    showGoodsPrice: false
                });
            }
            //满减判断
            if (mallSite.overReduce) {
                let overReduce = JSON.parse(mallSite.overReduce);
                if (overReduce.ruleType && overReduce.ruleArray && (overReduce.ruleType == 1 || overReduce.ruleType == 2)) {
                    let overReduceType = overReduce.ruleType;
                    let overReduceRule = overReduce.ruleArray;
                    if (overReduceRule.length > 0 && mallSite.tplType == 1) {
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
            that.fetchData();
            that.getRecommendGoods(1);
            util.afterPageLoad(that);
        })

    },
    //扫码
    scanTarCode: function () {
        wx.scanCode({
            onlyFromCamera: true,
            success: (res) => {
                console.log(res.result)
                console.log("扫码成功")
                if (res.result) {
                    wx.request({
                        url: cf.config.pageDomain + '/applet/mobile/goods/findGoodsByScan',
                        data: {
                            uid: mallSite.uid,
                            scanCode: res.result
                        },
                        header: {
                            'content-type': 'application/json'
                        },
                        success: function (res) {
                            console.log(res)
                            if (res && res.data.ret == 0) {
                                let goods = res.data.model.goods;
                                wx.navigateTo({
                                    url: "/pages/detail/detail?id=" + goods.id
                                })
                            } else {
                                wx.showModal({
                                    title: "提示",
                                    content: res.data.msg,
                                    showCancel: false
                                });
                            }


                        }
                    })
                }

            }
        })
    },
    changeSelect: function (event) {
        var that = this;
        var cartId = event.currentTarget.dataset.itemid;
        var goodsId = that.findGoodsId(cartId);
        that.data.cartSelectStatu[cartId] = !that.data.cartSelectStatu[cartId];
        that.setData({cartSelectStatu: that.data.cartSelectStatu});
        that.reRenderCount();
        that.data.allSelected = that.data.cartSelectedCount == that.data.shoppingCarList.length;
        that.setData({allSelected: that.data.allSelected});
    },
    onAllSelect: function (event) {
        var that = this;
        if (that.data.allSelected) {
            that.data.allSelected = false;
            for (var i = 0; i < that.data.shoppingCarList.length; i++) {
                var cart = that.data.shoppingCarList[i];
                that.data.cartSelectStatu[cart.id] = false;
            }
            that.setData({allSelected: that.data.allSelected});
            that.setData({cartSelectStatu: that.data.cartSelectStatu});
        } else {
            that.data.allSelected = true;
            for (var i = 0; i < that.data.shoppingCarList.length; i++) {
                var cart = that.data.shoppingCarList[i];
                that.data.cartSelectStatu[cart.id] = true;
            }
            that.setData({allSelected: that.data.allSelected});
            that.setData({cartSelectStatu: that.data.cartSelectStatu});
        }
        that.reRenderCount();
    },
    // 计算已选择商品数和总金额
    reRenderCount: function () {
        var that = this;
        var count = 0;
        for (var i = 0; i < that.data.shoppingCarList.length; i++) {
            var cart = that.data.shoppingCarList[i];
            if (that.data.cartSelectStatu[cart.id] && cart.status != 0) {
                var goodsPrice = cart.price;
                if (cart.spec) {
                    goodsPrice = cart.spec.price;
                }
                count += (goodsPrice * that.data.goodsCountContent[cart.id]);
            }
        }
        that.data.totalPrice = count;
        that.setData({totalPrice: that.data.totalPrice});
        that.data.cartSelectedCount = that.getSelectedCount();
        that.setData({cartSelectedCount: that.data.cartSelectedCount});
        that.setData({btnClass: count == 0 ? "disabled" : ""});
    },
    // 获取已选择的购物车数量
    getSelectedCount: function () {
        var count = 0;
        var that = this;
        for (var i = 0; i < that.data.shoppingCarList.length; i++) {
            var cart = that.data.shoppingCarList[i];
            if (that.data.cartSelectStatu[cart.id]) {
                count++;
            }
        }
        return count;
    },
    bindChange: function (event) {
        console.log(event)
        var that = this;
        var cartId = event.currentTarget.dataset.itemid;
        var unit = event.currentTarget.dataset.unit || '件';
        var totalCount = event.currentTarget.dataset.totalcount;
        if (that.findGoodsStatus(cartId) == 0) {
            return false;
        }
        var goodsId = that.findGoodsId(cartId);
        let valueNum=Math.abs(event.detail.value);
        let startCount=event.currentTarget.dataset.purchase;
        let limitations=event.currentTarget.dataset.limitations;
        if(startCount > 0 && valueNum < startCount){
            wx.showModal({
                showCancel: false,
                content: startCount+unit+"起购"
            });
            that.setData({
                ["goodsCountContent["+cartId+"]"]:Math.abs(startCount)
            })
            return false;
        }
        if(limitations > 0 && valueNum > limitations){
            wx.showModal({
                showCancel: false,
                content: "此商品限购"+limitations+"件"
            });
            that.setData({
                ["goodsCountContent["+cartId+"]"]:Math.abs(limitations)
            })
            return false;
        }
        if (totalCount <= that.data.goodsCountContent[cartId]) {
          wx.showModal({
            showCancel: false,
            content: "此商品库存不足"
          });
          return false;
        }
        that.data.goodsCountContent[cartId] = Math.abs(event.detail.value);
        that.updateGoodsCount(cartId, goodsId, that.data.goodsCountContent[cartId]);
        that.reRenderCount();
    },
    addCount: function (event) {
        var that = this;
        var cartId = event.currentTarget.dataset.itemid;
        var unit = event.currentTarget.dataset.unit || '件';
        var limitations=event.currentTarget.dataset.limitations;
        var totalCount = event.currentTarget.dataset.totalcount;
        if (that.findGoodsStatus(cartId) == 0) {
            return false;
        }
        var goodsId = that.findGoodsId(cartId);
        if(limitations > 0 && that.data.goodsCountContent[cartId] >= limitations){
            wx.showModal({
                showCancel: false,
                content: "此商品限购"+limitations+unit
            });
            return false;
        }
        if (totalCount <= that.data.goodsCountContent[cartId]){
          wx.showModal({
            showCancel: false,
            content: "此商品库存不足"
          });
          return false;
        }
        that.data.goodsCountContent[cartId] += 1;
        that.setData({goodsCountContent: that.data.goodsCountContent});
        that.updateGoodsCount(cartId, goodsId, that.data.goodsCountContent[cartId]);
        that.reRenderCount();
    },
    minusCount: function (event) {
        var that = this;
        var cartId = event.currentTarget.dataset.itemid;
        var unit = event.currentTarget.dataset.unit || '件';
        var startCount=event.currentTarget.dataset.purchase;
        if (that.findGoodsStatus(cartId) == 0) {
            return false;
        }
        var goodsId = that.findGoodsId(cartId);
        if(startCount > 0 && that.data.goodsCountContent[cartId]<=startCount){
            wx.showModal({
                showCancel: false,
                content: startCount+unit+"起购"
            });
            return false;
        }
        if (that.data.goodsCountContent[cartId] > 1) {
            that.data.goodsCountContent[cartId] -= 1;
            that.setData({goodsCountContent: that.data.goodsCountContent});
            that.updateGoodsCount(cartId, goodsId, that.data.goodsCountContent[cartId]);
            that.reRenderCount();
        }
    },
    findGoodsId: function (cartId) {
        var that = this;
        for (var i = 0; i < that.data.shoppingCarList.length; i++) {
            var cart = that.data.shoppingCarList[i];
            if (cart.id == cartId) {
                return cart.goodsId;
            }
        }
    },
    findGoodsStatus: function (cartId) {
        var that = this;
        for (var i = 0; i < that.data.shoppingCarList.length; i++) {
            var cart = that.data.shoppingCarList[i];
            if (cart.id == cartId) {
                return cart.status;
            }
        }
    },
    onDelCart: function () {
        var that = this;
        var selectCount = that.getSelectedCount();
        if (selectCount == 0) {
            wx.showModal({
                showCancel: false,
                content: "您还没有选择任何商品"
            })
        } else {
            wx.showModal({
                title: "温馨提示",
                content: "您确定删除么？",
                success: function (res) {
                    if (res.confirm) {
                        wx.showLoading({
                            title: '处理中',
                        });
                        wx.request({
                            url: cf.config.pageDomain + '/applet/mobile/shopping_cart/del',
                            data: {
                                cusmallToken: cusmallToken,
                                cartIds: that.getSelectedCartIds()
                            },
                            header: {
                                'content-type': 'application/json'
                            },
                            success: function (res) {
                                that.fetchData();
                            }
                        })
                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            })
        }
    },
    updateGoodsCount: function (cartId, goodsId, count) {
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/shopping_cart/changeCount',
            data: {
                cusmallToken: cusmallToken,
                cartId: cartId,
                goodsId: goodsId,
                count: count
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                  
                } else {
                    wx.showModal({
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },

    fetchData: function () {
        var that = this;
        wx.showLoading({
            title: '加载中',
        });
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/shopping_cart/getShoppingCartList',
            data: {
                cusmallToken: cusmallToken,
                fromUid: app.globalData.fromuid || "",
                shopUid: app.globalData.shopuid || "",
                start: 0,
                limit: 50
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var shoppingCarList = res.data.model.list;
                    for (var i = 0; i < shoppingCarList.length; i++) {
                        var cartItem = shoppingCarList[i];
                        if (cartItem.spec) {
                            cartItem.spec = JSON.parse(cartItem.spec);
                        }
                    }

                    that.setData({shoppingCarList: shoppingCarList});
                    var goodsCountContent = {};
                    var cartSelectStatu = {};
                    for (var i = 0; i < shoppingCarList.length; i++) {
                        var cart = shoppingCarList[i];
                        goodsCountContent[cart.id] = cart.goodsCount;
                        cartSelectStatu[cart.id] = true;
                    }
                    that.setData({goodsCountContent: goodsCountContent});
                    that.setData({cartSelectStatu: cartSelectStatu});
                    that.reRenderCount();
                    wx.hideLoading();
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取购物车信息异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })

    },
    getSelectedCartIds: function (filterDeleted) {
        var that = this;
        var selectedIds = [];
        for (var i = 0; i < that.data.shoppingCarList.length; i++) {
            var cart = that.data.shoppingCarList[i];
            if (filterDeleted && cart.status == 0) {
                continue;
            }
            if (that.data.cartSelectStatu[cart.id]) {
                selectedIds.push(cart.id);
            }
        }
        return selectedIds.join(",");
    },

    /* 购物车有规格商品去重 */
    goodsFiltra() {
        let that=this;
        let result = [];
        let obj = {};
        let hasQuota = false,quotaName='';
        for (let j = 0; j < that.data.shoppingCarList.length; j++) {
            let item = that.data.shoppingCarList[j];
            if(!that.data.cartSelectStatu[item.id] || !(item.limitations>0)){
                break;
            }
            if (!obj[item.goodsId]) {
                obj[item.goodsId] = 1;
                let resObj = {
                    goodsId: item.goodsId,
                    historyCount: item.historyCount || 0,
                    purchases: that.data.goodsCountContent[item.id],
                };
                result.push(resObj)
            } else {
                let hasSame = false;
                for (let i = 0; i < result.length; i++) {
                    let res = result[i];
                    if (res.goodsId == item.goodsId) {
                        hasSame = true;
                        res.historyCount =res.historyCount+item.historyCount;
                        res.purchases =res.purchases +that.data.goodsCountContent[item.id];
                        let enableNum = res.historyCount + res.purchases;
                        if (that.data.cartSelectStatu[item.id] && enableNum > item.limitations) {
                            hasQuota = true;
                            quotaName = item.name;
                            break;
                        }
                    }
                }
                if(hasQuota){
                    break;
                }
            }
        }
        if(hasQuota){
            wx.showModal({
                showCancel: false,
                title: "提示",
                content: quotaName + "商品已超限购"
            });
            return hasQuota
        }

    },

    onBtnPay: function () {
        var that = this;
        /* 判断限购  + 同一商品去重*/
        if(that.goodsFiltra()){
            return false
        }
        let enableLimit;
        for (let i = 0; i < that.data.shoppingCarList.length; i++) {
            enableLimit = false;
            let itemGoods = that.data.shoppingCarList[i];
            if(!that.data.cartSelectStatu[itemGoods.id] || !(itemGoods.limitations>0)){  //兼容老数据
                break;
            }
            let enableNum = itemGoods.historyCount + that.data.goodsCountContent[itemGoods.id];
            if (that.data.cartSelectStatu[itemGoods.id] && enableNum > itemGoods.limitations) {
                enableLimit = true;
                wx.showModal({
                    showCancel: false,
                    title: "提示",
                    content:"“"+ itemGoods.name + "”商品，您已超限购数量"
                });
                break;
            }
        }
        if (enableLimit) {
            return false
        }
        wx.navigateTo({
            url: '/pages/orderinfo/orderinfo?fromShopingCart=true&cartIds=' + that.getSelectedCartIds(true),
        })
    },

    //满减箭头点击事件
    changeOverReduce: function () {
        var that = this;
        that.setData({
            ['showOverReduceDetail']: !that.data.showOverReduceDetail,
        });
    },

    scrollHandle: function (e) { //滚动事件
        console.log("ff");
        this.setData({
            scrolltop: e.detail.scrollTop
        })
    },
    goToTop: function () { //回到顶部
        this.setData({
            scrolltop: 0
        })
    },
    scrollLoading: function () { //滚动加载
        this.fetchData();
    },
    toIndex() {
        if (app.globalData.shopuid && app.globalData.fromuid) {
            wx.redirectTo({
                url: '/pages/index/index?shopui=' + app.globalData.shopuid + '&fromuid=' + app.globalData.fromuid,
            })
        } else {
            wx.reLaunch({
                url: '/pages/index/index',
            })
        }
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

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

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

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

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    }
}))
