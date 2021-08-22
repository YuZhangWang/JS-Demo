// pages/express/express.js

var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");

Page(Object.assign({}, baseHandle, {

    /**
     * 页面的初始数据
     */
    data: {
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        records: [],
        pathArray:[]
        // recordsArray:[{
        //     date:'2019-03-12',
        //     time:'02:00:00',
        //     desc:'东西向南',
        //     detail:'正在派送'
        // },{
        //     date:'2019-03-12',
        //     time:'02:00:00',
        //     desc:'东西向南',
        //     detail:'正在派送'
        // },{
        //     date:'2019-03-12',
        //     time:'02:00:00',
        //     desc:'东西向南',
        //     detail:'正在派送'
        // },{
        //     date:'2019-03-12',
        //     time:'02:00:00',
        //     desc:'东西向南',
        //     detail:'正在派送'
        // }]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let that = this;
        let expressNum = options.expressNum;
        let orderId = options.oid;
        that.setData({
            wayType:options.wayType
        })
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');
            that.queryDetail(orderId);

            util.afterPageLoad(that);
        });
    },
    queryDetail(orderId) {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/getOrderDetail',
            data: {
                cusmallToken: cusmallToken,
                parId: orderId
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var parOrder = res.data.model.parOrder;
                    let goodsList = JSON.parse(parOrder.goodsList);
                    let cover = goodsList[0].cover;
                    that.setData({
                        cover: cover
                    });
                    that.setData({
                        deliveryCom: parOrder.deliveryCom
                    });
                    that.setData({
                        expressNum: parOrder.expressNum
                    });
                    that.setData({
                        address: parOrder.address
                    });
                    that.setData({
                        status: parOrder.status
                    });
                    if(that.data.wayType==3){
                        that.queryExpressPath()
                    }else {
                        that.queryExpressMsg(parOrder.expressNum);
                    }
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取订单信息异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },
    /* 查询普通物流信息 */
    queryExpressMsg(expressNum) {
        wx.showLoading({
            title: "加载中...",
        });
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/queryExpressMsg',
            data: {
                cusmallToken: cusmallToken,
                expressNum: expressNum,
                comName: that.data.deliveryCom
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                let content;
                let records = [];
                if (data && "抱歉暂无查询记录" != data.model.content && null != data.model.content) {
                    content = data.model.content.split("<br/>");
                    for (let i = 1; i < content.length; i += 2) {
                        let dateArr = content[i - 1].split(" ")[0].split("-");
                        let date = dateArr[1] + "-" + dateArr[2];
                        let timeArr = content[i - 1].split(" ")[1].split(":");
                        let time = timeArr[0] + ":" + timeArr[1];
                        records.push({
                            date: date,
                            time: time,
                            desc: "",
                            detail: content[i]
                        });
                    }

                    that.setData({
                        records: records
                    });
                    that.setData({
                        noEmptyExpress: true
                    });
                } else {
                    that.setData({
                        emptyExpress: true
                    });
                }

            },
            fail: function () {
            },
            complete: function () {
                wx.hideLoading();
            }
        });
    },
    /* 查询普通物流信息 */
    queryExpressPath() {
        wx.showLoading({
            title: "加载中...",
        });
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/getExpressPath',
            data: {
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                if (data && 0 == data.ret) {
                    var list = JSON.parse(data.model.result);
                    that.setData({
                        pathArray: list.path_item_list
                    });
                    that.setData({
                        noEmptyExpress: true
                    });
                } else {
                    that.setData({
                        emptyExpress: true
                    });
                }
            },
            fail: function () {

            },
            complete: function () {
                wx.hideLoading();
            }
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
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角
     */
    onShareAppMessage: function () {

    }
}))
