// pages/offline/orderdetail.js
// pages/offline/pay.js
var Zan = require('../../youzan/dist/index');
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, Zan.Field, Zan.Toast, baseHandle, {
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath
  },
  handlePay:function(e){
    var that = this;
    that.generateWxPayOrder(that.data.order);
  },
  generateWxPayOrder: function (orderData) {
    var that = this;
    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({ btnLoading: true });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: "当面付",
        out_trade_no: orderData.orderNum,
        total_fee: orderData.amount
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var wxOrderData = res.data.model.wxOrderData;
          wx.hideLoading();
          wx.requestPayment({
            'timeStamp': wxOrderData.timeStamp,
            'nonceStr': wxOrderData.nonceStr,
            'package': wxOrderData.package,
            'signType': wxOrderData.signType,
            'paySign': wxOrderData.paySign,
            'success': function (res) {
              wx.redirectTo({
                url: 'payresult?payResult=success&orderId=' + orderData.id,
              })
            },
            'fail': function (res) {
              console.log(res);
              that.setData({ btnLoading: false });
              wx.hideLoading();
              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付"
              })

            }
          })
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '支付订单异常',
            showCancel: false,
            content: res.data.msg || "服务器异常"
          })
        }
      }
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    this.setData({ id: options.id });
    //options.scene = "id=1&version=1";
    wx.hideShareMenu();
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      var mallSite = wx.getStorageSync('mallSite');
      that.fetchData();
      util.afterPageLoad(that);
    })
  },
  fetchData: function () {
    var that = this;
    var mallSite = wx.getStorageSync('mallSite');
    var orderId = that.data.id;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/mobile/tostore/select',
      data: {
        cusmallToken: cusmallToken,
        id: orderId
      },
      header: {
        'content-type': 'application/json'
      },
      fail:function(res){
        wx.showModal({
          title: '参数异常',
          showCancel: false,
          content: res
        })
      },
      success: function (res) {
        console.log(res);
        if (res.data.ret == 0) {
          var orderData = res.data.model.order;
          util.processOrderData(orderData);
          that.setData({"order":orderData});
          wx.hideLoading();
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
  }
}));