// orderlist.js
var cf = require("../../config.js");
//获取应用实例
var app = getApp();
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

    /**
     * 页面的初始数据
     */
    data: {
        status: "",
        app: app,
        size: 20,
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        orderList: {},
        needUserInfo: true,
        orderListTotal: 0,
        goodsList: [],
        cancleOrderId: 0,
        siteType: "dianshang",//店铺类型：如预约为yuyue
        orderInfoUrl: "/pages/orderinfo/orderinfo",
        menusSta: [true, true, true],
        showPopup: false,
        pageNum: 1,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        cusmallToken = wx.getStorageSync('cusmallToken');
        mallSiteId = wx.getStorageSync('mallSiteId');
        var mallSite = wx.getStorageSync('mallSite');
        wx.hideShareMenu();
        let mIndustry = mallSite.industry;
        let ctx = this;
        console.log(mIndustry);
        if (-1 == mIndustry) {
            this.setData({
                menusSta: [false, false, false]
            });
        } else {
            if ((mIndustry & (Math.pow(2, 1))) != 0) {//电商
                this.setData({
                    ["menusSta[0]"]: false
                })
            }
            if ((mIndustry & (Math.pow(2, 2))) != 0) {//外卖
                this.setData({
                    ["menusSta[1]"]: false
                })
            }
            if ((mIndustry & (Math.pow(2, 3))) != 0) {//预约
                this.setData({
                    ["menusSta[2]"]: false
                })
            }
        }
        var pageTitle = "我的订单";
        wx.setNavigationBarTitle({
            title: pageTitle
        })
        //console.log(options.status)
        wx.hideShareMenu();
        this.setData({
            status: options.status || "",
        });
        /* 我的订单列表 */
        this.tabNavList(options,mallSite).then(function () {
            ctx.getReviewConfig().then(function (data) {
                ctx.fetchData(1);
            })
        });
        util.afterPageLoad(this);
        this.setData({"pagesLen": getCurrentPages().length});
    },
    fetchData: function (page, size) {
        if (!size) {
            this.setData({size: 20});
        }
        if (this.data.siteType == "offline") {
            this.fetchOfflineData(page);
            return;
        } else if (this.data.siteType == "multiplayer") {
            this.fetchMultiPlayerData(page);
            return;
        }
        var that = this;
        var orderType = "1";
        if (this.data.siteType == "dianshang") {
            orderType = 1;
        } else if (this.data.siteType == "waimai") {
            orderType = 2;
        } else if (this.data.siteType == "yuyue") {
            orderType = 3;
        } else if (this.data.siteType == "activity") {
            orderType = 4;
        } else if (this.data.siteType == "integral") {
            orderType = 5;
        } else if (this.data.siteType == "multiplayer") {
            orderType = 6;
        }
        wx.showLoading({
            title: '加载中',
        });
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/getOrderList',
            data: {
                cusmallToken: cusmallToken,
                status: that.data.status,
                start: (page - 1) * that.data.size,
                type: orderType,
                limit: size ? size : that.data.size,
                fromUid: app.globalData.fromuid || "",
                shopUid: app.globalData.shopuid || "",
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                var goodsList = [];
                if (res.data.ret == 0) {
                    var list = res.data.model.list;
                    for (var i = 0; i < res.data.model.list.length; i++) {
                        var goods = JSON.parse(list[i].goodsList);
                        if (5 != orderType) {//如果不是积分商品
                            for (var j = 0; j < goods.length; j++) {
                                goods[j].price = (goods[j].price / 100).toFixed(2);
                            }
                        }

                        goodsList.push(goods);
                    }
                    for (var k = 0; k < list.length; k++) {
                        list[k].allPrice = ((list[k].totalPrice + list[k].deliveryPrice - list[k].ticketPrice) / 100).toFixed(2);
                        list[k].totalPrice = (list[k].totalPrice / 100).toFixed(2);
                        list[k].deliveryPrice = (list[k].deliveryPrice / 100).toFixed(2);
                        //list[k].allPrice = (list[k].deliveryPrice/100).toFixed(2);
                    }
                    that.setData({
                        orderList: list,
                        orderListTotal: res.data.model.total,
                        goodsList: goodsList
                    });
                    //console.log(goodsList);
                    wx.hideLoading();
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取商品信息异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },
    /* 订单navigation显示 */
    tabNavList(options,mallSite) {
        let mUid = mallSite.uid;
        let that = this;
        let navPro=new Promise(function (resolve, reject) {
            wx.request({
                url: cf.config.pageDomain + '/applet/mobile/order/getShowOrderType',
                data: {
                    cusmallToken: cusmallToken,
                    uid: mUid,
                },
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    if (res.data.ret == 0) {
                        let modelData = res.data.model;
                        console.log(modelData);
                        that.setData({
                            navDisplay: res.data.model
                        });
                        // 显示判断
                        if (options && options.sitetype) {
                            if (options.sitetype == 'dianshang' && modelData.showCommon) {
                                that.setData({"siteType": options.sitetype});
                            } else if (options.sitetype == 'waimai' && modelData.showFood) {
                                that.setData({"siteType": options.sitetype});
                            } else if (options.sitetype == 'yuyue' && modelData.showReserve) {
                                that.setData({"siteType": options.sitetype});
                            } else if (options.sitetype == 'offline' && modelData.showToStore) {
                                that.setData({"siteType": options.sitetype});
                            } else if (options.sitetype == 'activity' && modelData.showActivity) {
                                that.setData({"siteType": options.sitetype});
                            } else if (options.sitetype == 'integral' && modelData.showIntegral) {
                                that.setData({"siteType": options.sitetype});
                            } else if (options.sitetype == 'multiplayer' && modelData.showMultiPer) {
                                that.setData({"siteType": options.sitetype});
                            } else {
                                if (modelData['showCommon']) {
                                    that.setData({"siteType": "dianshang"});
                                } else if (modelData['showFood']) {
                                    that.setData({"siteType": "waimai"});
                                } else if (modelData['showReserve']) {
                                    that.setData({"siteType": "yuyue"});
                                } else if (modelData['showToStore']) {
                                    that.setData({"siteType": "offline"});
                                } else if (modelData['showActivity']) {
                                    that.setData({"siteType": "activity"});
                                } else if (modelData['showIntegral']) {
                                    that.setData({"siteType": "integral"});
                                } else if (modelData['showMultiPer']) {
                                    that.setData({"siteType": "multiplayer"});
                                } else {
                                    that.setData({"siteType": ""});
                                }
                            }

                        } else {
                            if (mallSite.tplType == 1 && modelData.showCommon) {
                                that.setData({"siteType": "dianshang"});
                            } else if (mallSite.tplType == 2 && modelData.showToStore) {
                                that.setData({"siteType": "offline"});
                            } else if (mallSite.tplType == 3 && modelData.showFood) {
                                that.setData({"siteType": "waimai"});
                            } else if (mallSite.tplType == 4 && modelData.showReserve) {
                                that.setData({"siteType": "yuyue"});
                            } else {
                                if (modelData['showCommon']) {
                                    that.setData({"siteType": "dianshang"});
                                } else if (modelData['showFood']) {
                                    that.setData({"siteType": "waimai"});
                                } else if (modelData['showReserve']) {
                                    that.setData({"siteType": "yuyue"});
                                } else if (modelData['showToStore']) {
                                    that.setData({"siteType": "offline"});
                                } else if (modelData['showActivity']) {
                                    that.setData({"siteType": "activity"});
                                } else if (modelData['showIntegral']) {
                                    that.setData({"siteType": "integral"});
                                } else if (modelData['showMultiPer']) {
                                    that.setData({"siteType": "multiplayer"});
                                } else {
                                    that.setData({"siteType": ""});
                                }
                            }
                        }
                        if (that.data.siteType == "yuyue" && modelData.showReserve) {
                            wx.setNavigationBarTitle({
                                title: "预约订单"
                            })
                            that.setData({orderInfoUrl: "/pages/yuyue/yyorderinfo"});
                        }
                    }
                    resolve();
                }
            });

        });
        return navPro;
    },
    /* 当面付数据调用 */
    fetchOfflineData: function (page) {
        var that = this;
        wx.showLoading({
            title: '加载中',
        });
        wx.request({
            url: cf.config.pageDomain + '/mobile/tostore/findMyOrder',
            data: {
                cusmallToken: cusmallToken,
                payStatus: that.data.status,
                start: (page - 1) * that.data.size,
                limit: that.data.size
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                var goodsList = [];
                if (res.data.ret == 0) {
                    var list = res.data.model.result;
                    for (var i = 0; i < list.length; i++) {
                        util.processOrderData(list[i]);
                    }
                    that.setData({
                        orderList: list,
                        orderListTotal: res.data.model.total
                    });
                    //console.log(goodsList);
                    wx.hideLoading();
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取商品信息异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },
    /* 数据调用 */
    fetchMultiPlayerData: function (page) {
        var that = this;
        wx.showLoading({
            title: '加载中',
        });
        let params = {
            cusmallToken: cusmallToken,
            start: (page - 1) * that.data.size,
            limit: that.data.size
        }
        if (that.data.status) {
            params.status = that.data.status
        } else {
            delete params.status
        }
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/multi_person_order/findPage',
            data: params,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                var goodsList = [];
                if (res.data.ret == 0) {
                    var list = res.data.model.result;
                    for (var i = 0; i < list.length; i++) {
                        util.processOrderData(list[i]);
                    }
                    that.setData({
                        orderList: list,
                        orderListTotal: res.data.model.total
                    });
                    //console.log(goodsList);
                    wx.hideLoading();
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取商品信息异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },
    getOrderList: function (event) {
        var that = this;
        this.setData({status: event.target.dataset.status});
        that.fetchData(1);
    },
    handleMainNav: function (e) {
        var that = this;
        var siteType = e.target.dataset.type;
        console.log(siteType);
        wx.redirectTo({
            url: 'orderlist?sitetype=' + siteType,
        })
    },
    goToPay: function (e) {
        let that = this;
        var orderid = e.target.dataset.orderid;
        let siteType = e.target.dataset.sitetype;
        let status = e.target.dataset.status;
        if (siteType) {
            if (status != 4) {
                wx.navigateTo({  //详情
                    url: "/pages/multiRepast/orderinfo" + '?orderNo=' + orderid + '&fromType=1'
                })
            } else {
                wx.navigateTo({  //未支付
                    url: "/pages/multiRepast/orderinfo" + '?orderNo=' + orderid + '&fromType=2'
                })
            }
        } else {
            wx.navigateTo({
                url: that.data.orderInfoUrl + '?orderid=' + orderid + ''
            })
        }

    },
    modalTap: function (e) {
        var that = this;
        this.setData({cancleOrderId: e.target.dataset.cancleid});
        let siteType = e.currentTarget.dataset.sitetype;
        //console.log(e.target);
        wx.showModal({
            title: "温馨提示",
            content: "您确认取消此商品订单么？",
            confirmText: "确定",
            cancelText: "取消",
            success: function (res) {
                if (res.confirm) {
                    if (siteType) {
                        that.multiOrder();
                    } else {
                        that.cancelOrder();
                    }

                }
            }
        })
    },
    cancelOrder: function () {
        var that = this;
        wx.showLoading({
            title: '处理中',
        });
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/cancelOrder',
            data: {
                cusmallToken: cusmallToken,
                parId: that.data.cancleOrderId,
                fromUid: app.globalData.fromuid || "",
                shopUid: app.globalData.shopuid || ""
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    wx.hideLoading();
                    wx.showModal({
                        showCancel: false,
                        content: "订单取消成功",
                        success: function (ress) {
                            if (ress.confirm) {
                                that.fetchData(1);
                            }
                        }
                    })
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '订单取消失败',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },
    /* 多订单取消 */
    multiOrder: function () {
        var that = this;
        wx.showLoading({
            title: '处理中',
        });
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/multi_person_order/cancelOrder',
            data: {
                cusmallToken: cusmallToken,
                parentOrderNo: that.data.cancleOrderId,
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    wx.hideLoading();
                    wx.showModal({
                        showCancel: false,
                        content: "订单取消成功",
                        success: function (ress) {
                            if (ress.confirm) {
                                that.fetchData(1);
                            }
                        }
                    })
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '订单取消失败',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            },
            fail: function () {
                wx.showModal({
                    title: '订单取消失败',
                    showCancel: false,
                    content: res.data.msg
                })
            }
        })
    },
    togglePopup: function () {
        this.setData({
            showPopup: !this.data.showPopup
        });
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
    scrolltolower: function () {
        this.data.size += 20;
        this.fetchData(1, this.data.size)
    },

    /**
     * 用户点击右上角
     */
    onShareAppMessage: function () {

    },
}))
