// orderinfo.js
/* 小程序应用配置 */
var cf = require("../../config.js");
/* 应用工具模块 */
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();

/* 获取本地存储信息 */
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSite = wx.getStorageSync("mallSite");

/* 应用功能公共模块 */
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");

/* 优惠券+会员卡+有赞开关 */
var CouponHandle = require("../template/couponhandle.js");
var cardHandle = require("../template/cardlist.js");
var Switch = require('../../youzan/dist/switch/index.js');

/* 时间格式化 */
const date = new Date();
const years = [];
const months = [];
const days = [];
const hours = [];
const minutes = [];
//获取年
for (let i = date.getFullYear(); i <= date.getFullYear() + 15; i++) {
    years.push("" + i);
}
//获取月份
for (let i = 1; i <= 12; i++) {
    if (i < 10) {
        i = "0" + i;
    }
    months.push("" + i);
}
//获取日期
for (let i = 1; i <= 31; i++) {
    if (i < 10) {
        i = "0" + i;
    }
    days.push("" + i);
}
//获取小时
for (let i = 0; i < 24; i++) {
    if (i < 10) {
        i = "0" + i;
    }
    hours.push("" + i);
}
//获取分钟
for (let i = 0; i < 60; i++) {
    if (i < 10) {
        i = "0" + i;
    }
    minutes.push("" + i);
}

/* 页面实例化 */
Page(Object.assign({}, commHandle, baseHandle, CouponHandle, cardHandle, Switch, {
    handleZanSwitchChange({componentId, checked}) {
        let that = this;
        // componentId 即为在模板中传入的 componentId
        // 用于在一个页面上使用多个 switch 时，进行区分
        // checked 表示 switch 的选中状态

        if ("switch1" == componentId) {
            if (checked) {
                this.setData({enableDepositChe: true});
                this.multInit()
            } else {
                this.setData({enableDepositChe: false});
            }
        }
    }
}, {
    /**
     * 页面的初始数据
     */
    data: {
        app:app,
        prepareOrderVo:{},
        userImagePath: cf.config.userImagePath,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        staticResPath: cf.config.staticResPath,
        currentList:"",
        enableDepositChe:false,
        receiveData:[]
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that=this;
        wx.hideShareMenu();
        wx.hideLoading();
        that.setData({
            orderNo:options.orderNo,
            fromType:options.fromType||''
        })
        that.data.options=options;
        /*
        * 判断用户是否授权
        * */
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');  //
            mallSiteId = wx.getStorageSync('mallSiteId'); //
            that.goodsDetail();
            util.afterPageLoad(that);  //底部菜单处理
        });
        wx.hideLoading();
    },
    /* 储值金  */
    multInit:function(){
        let that=this;
        if(that.data.depositPrice > that.data.receiveData.orderAmountTotal){
            that.setData({
                discountTotal:0,
                discountMoney:that.data.receiveData.orderAmountTotal
            })
        }else {
            let total=that.data.receiveData.orderAmountTotal-that.data.depositPrice;
            that.setData({
                discountTotal:total,
                discountMoney:that.data.depositPrice
            })
        }
    },
    /* 商品详情 */
    goodsDetail:function(){
        let that=this;
        let params={
            cusmallToken: cusmallToken,
            parentOrderNo:that.data.orderNo || '',
        }
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/multi_person_order/findParOrderDetail',
            data: params,
            header: {
                "content": "application/json"
            },
            success: function(res) {
                wx.hideLoading();
                that.setData({
                    wechatPay:false,
                    offlinePay:false
                })
                if (res.data.ret == 0) {
                    let extraFee='';
                    if(res.data.model.extraFeeRules){
                        wx.setStorageSync('mallExtraFee',res.data.model.extraFeeRules);
                    }else {
                        extraFee=wx.getStorageSync('mallExtraFee')
                    }
                    that.setData({
                        additionInfo:res.data.model.extraFeeRules ? JSON.parse(res.data.model.extraFeeRules):extraFee,
                        receiveData:res.data.model.parOrder,
                        depositPrice:res.data.model.depositPrice,
                        currentList:res.data.model.parOrder.subOrderList[0].id
                    })
                    /* 如果订单状态属于已完成、支付状态属于待确认、待继续支付时候回显储值金 */
                    if (that.data.receiveData.payStatus==5 && that.data.receiveData.payType==1) {
                        let total=that.data.receiveData.depositPrice>0 ? that.data.receiveData.orderAmountTotal-that.data.depositPrice:that.data.receiveData.orderAmountTotal;//微信支付待继续支付
                        that.setData({
                            wechatPay:'继续支付',
                            enableDepositChe:true,
                            discountTotal:total,
                            discountMoney:that.data.receiveData.depositPrice
                        })
                    }else if(that.data.receiveData.payStatus==5 && that.data.receiveData.payType==4){
                        let total=that.data.receiveData.depositPrice>0 ? that.data.receiveData.orderAmountTotal-that.data.depositPrice:that.data.receiveData.orderAmountTotal;
                        that.setData({
                            offlinePay:'支付待确认',
                            enableDepositChe:true,
                            discountTotal:total,
                            discountMoney:that.data.receiveData.depositPrice
                        })
                    }
                    if(that.data.receiveData.orderStatus==6 && that.data.receiveData.depositPrice > 0){  //订单已完成
                        let total=that.data.receiveData.orderAmountTotal-that.data.depositPrice;
                        that.setData({
                            enableDepositChe:true,
                            discountTotal:total,
                            discountMoney:that.data.receiveData.depositPrice
                        })
                    }
                }else {
                    wx.redirectTo({
                        url: "/pages/orderlist/orderlist?sitetype=multiplayer"
                    });
                }
            },
            error:function () {

            },
        })
    },
    /*
    * /applet/mobile/multi_person_order/payToOrder 支付订单
    * parentOrderNo 父订单号
    * payType 付款类型 （1、微信支付  4、线下支付）
    * */
    /* 付款 */
    handleCashier:function(e){
        if(this.data.receiveData.subOrderList[0].orderStatus===1){
            wx.showToast({
                title: '请稍后，还有未接单的订单',
                icon: 'none',
                duration: 2000
            });
            return
        }
        let type=e.currentTarget.dataset.type;
        let orderNo=e.currentTarget.dataset.orderno;
        let totalFee=e.currentTarget.dataset.total;
        let typeName=e.currentTarget.dataset.typename;
        let that=this;
        if(type==5){
            if(typeName){
                that.setData({btnLoading: true});
                that.doWxPay(orderNo, totalFee);
            }else {
                wx.showToast({
                    title: "支付确认中",
                    icon: 'none',
                    duration: 2000,
                });
                return
            }

        }else {
            that.setData({btnLoading: true});
            wx.request({
                url: cf.config.pageDomain + '/applet/mobile/multi_person_order/payToOrder',
                data: {
                    cusmallToken: cusmallToken,
                    parentOrderNo: orderNo,
                    useDeposit:that.data.enableDepositChe || false,
                    payType:type,
                },
                header: {
                    "content": "application/json"
                },
                success: function(res) {
                    wx.hideLoading();
                    if (res.data.ret == 0) {
                        that.data.leaveStatus=true;
                        if (1 == type) {
                            // TODO
                            if(res.data.model.finalAmountTotal===0){
                                that.setData({btnLoading: false});
                                wx.hideLoading();
                                wx.showToast({
                                    title: "支付成功",
                                    icon: 'success',
                                    duration: 2000,
                                    success: function() {
                                        wx.redirectTo({
                                            url: "/pages/orderlist/orderlist?sitetype=multiplayer"
                                        });
                                    }
                                });
                            }else {
                                that.doWxPay(orderNo, res.data.model.finalAmountTotal);
                            }

                        } else if (4 == type) {
                            that.setData({btnLoading: false});
                            that.goodsDetail();
                            wx.showToast({
                                title: "支付确认中",
                                icon: 'success',
                                duration: 2000,
                            });
                        }
                    } else {
                        that.setData({btnLoading: false});
                        wx.showToast({
                            title: res.data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    }
                },
                error:function (res) {
                    that.setData({btnLoading: false});
                    wx.showToast({
                        title: res.data.msg,
                        icon: 'none',
                        duration: 2000
                    });
                },
            });
        }

    },
    doWxPay: function (orderNo, totalFee) {
        let that=this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
            method: "POST",
            data: {
                cusmallToken: cusmallToken,
                goodDescribe: "多人点餐菜品",
                out_trade_no: orderNo,
                total_fee: totalFee
            },
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    that.setData({btnLoading: false});
                    var wxOrderData = res.data.model.wxOrderData;
                    wx.hideLoading();
                    wx.requestPayment({
                        'timeStamp': wxOrderData.timeStamp,
                        'nonceStr': wxOrderData.nonceStr,
                        'package': wxOrderData.package,
                        'signType': wxOrderData.signType,
                        'paySign': wxOrderData.paySign,
                        'success': function (res) {
                            wx.showToast({
                                title: "支付成功",
                                icon: 'success',
                                duration: 2000,
                                success: function() {
                                    wx.redirectTo({
                                        url: "/pages/orderlist/orderlist?sitetype=multiplayer"
                                    });
                                }
                            });
                        },
                        'fail': function (res) {
                            that.setData({ btnLoading: false });
                            wx.hideLoading();
                            wx.showModal({
                                title: '支付失败',
                                confirmText: "关闭",
                                cancelText: "取消",
                                content: "尚未完成支付",
                                complete: function (res) {
                                    if (res.confirm) {
                                        wx.redirectTo({
                                            url: "/pages/orderlist/orderlist?sitetype=multiplayer"
                                        })
                                    } else {
                                        wx.navigateBack({
                                            delta: 1
                                        })
                                    }
                                }
                            })
                        }
                    })
                } else {
                    that.setData({btnLoading: false});
                    wx.hideLoading();
                    wx.showModal({
                        title: '支付订单异常',
                        showCancel: false,
                        content: res.data.msg || "服务器异常",
                        complete: function (res) {
                            wx.navigateBack({
                                delta: 1
                            })
                        }
                    })
                }
            }
        })
    },

    /* 商品展开 */
    handleUpfold:function(e){
        var currentId=e.currentTarget.dataset.id;
        if(currentId==this.data.currentList){
            this.setData({
                currentList:""
            })
        }else {
            this.setData({
                currentList:currentId
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
        this.goodsDetail();
        wx.stopPullDownRefresh();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },
}))
