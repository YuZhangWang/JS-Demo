// pages/multiRepast//orderReceive.js
/* 小程序应用配置 多环境地址 */
var cf = require("../../config.js");
/* 小程序工具块 */
var util = require("../../utils/util.js");

/* 小程序本地存储数据 */
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        app: app,
        receiveData: [],
        userImagePath: cf.config.userImagePath,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        staticResPath: cf.config.staticResPath,
        currentList:'',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this;
        wx.hideShareMenu();
        wx.hideLoading();
        that.setData({
            tableNo: options.tableNo
        })
        /*
            * 判断用户是否授权
            * */
        that.data.options=options;
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');  //
            mallSiteId = wx.getStorageSync('mallSiteId'); //
            that.goodsDetail();
            wx.connectSocket({
                url: cf.config.socketDomain + 'ws_connection/multi_per_order/'+ options.tableNo + '/' + cusmallToken,
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    console.log("成功")
                    console.log(res)
                }
            });
            /* 监听会话关闭事件 */
            wx.onSocketClose(function () {
                console.log("连接已断开");
                if (!that.data.leaveStatus) {
                    wx.showToast({
                        title: "网络开小差，请下拉刷新",
                        icon: 'none',
                        duration: 2000
                    });
                }

            })
            /* 监控websocket打开事件 */
            wx.onSocketOpen(function () {
                console.log("打开");
                wx.onSocketMessage(function (res) {
                    console.log("消息推送")
                    let data = JSON.parse(res.data);
                    if (data.operateType == 3) {
                        that.goodsDetail();
                        wx.showToast({
                            title: "商家已接单",
                            icon: 'success',
                            duration: 2000
                        });

                    }else if (data.operateType == 5) {
                        that.goodsDetail();
                        wx.showToast({
                            title: "商家取消接单",
                            icon: 'success',
                            duration: 2000
                        });

                    }
                })
            })
            /* 监听websocket错误事件 */
            wx.onSocketError(function (error) {
                console.log("错误信息")
                console.log(error)
            })
            util.afterPageLoad(that);  //底部菜单处理
        });
        wx.hideLoading();

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },
    payBill: function () {
        let that = this;
        that.data.leaveStatus=true;
        wx.closeSocket({});
        wx.navigateTo({
            url: './orderinfo?orderNo=' + that.data.receiveData.orderNo
        })
    },
    /* 暂不可操作 */
    handleDisabled:function(){
        wx.showToast({
            title: '请稍后，还有未接单的订单',
            icon: 'none',
            duration: 2000
        });
    },

    /* 我要加菜 */
    addCartData:function(){
        let that=this;
        that.data.leaveStatus=true;
        wx.closeSocket({});
        wx.navigateTo({
            url: './goodsList?tableNo=' + that.data.tableNo
        })
    },
    /* 商品详情 */
    goodsDetail: function () {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/multi_person_order/findParOrderDetail',
            data: {
                cusmallToken: cusmallToken,
                tableNo: that.data.tableNo,
            },
            header: {
                "content": "application/json"
            },
            success: function (res) {
                console.log(res.data);
                wx.hideLoading();
                if (res.data.ret == 0) {
                    console.log(res.data.model.parOrder);
                    let extraFee='';
                    if(res.data.model.extraFeeRules){
                        wx.setStorageSync('mallExtraFee',res.data.model.extraFeeRules);
                    }else {
                        extraFee=wx.getStorageSync('mallExtraFee')
                    }
                    that.setData({
                        hasWaitOrder:false,
                        hasOrderPay:false
                    })
                    that.setData({
                        additionInfo: res.data.model.extraFeeRules ? JSON.parse(res.data.model.extraFeeRules):extraFee,
                        receiveData: res.data.model.parOrder,
                        currentList:res.data.model.parOrder.subOrderList[0].id,
                        hasWaitOrder:res.data.model.parOrder.subOrderList[0].orderStatus===1 ? true:false
                    })
                }
            },
            error: function () {

            },
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
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.data.leaveStatus=false
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        this.data.leaveStatus=true;
        wx.closeSocket({})
        // wx.closeSocket({})
        // this.data.connectSocket.close({});
        // this.data.leaveStatus = true
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        this.data.leaveStatus=true;
        wx.closeSocket({})
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.onLoad(this.data.options);
        wx.stopPullDownRefresh();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})
