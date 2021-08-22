// pages/offline/payresult.js
var Zan = require('../../youzan/dist/index');
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      var mallSite = wx.getStorageSync('mallSite');
      var payResult = "success";
      if (typeof (options.payResult) !== "undefined"){
        payResult = options.payResult;
      }
      that.setData({ "payResult": payResult });
      if (payResult == "success"){
        wx.setNavigationBarTitle({
          title: "付款成功"
        })
        that.setData({ "orderId":options.orderId});
        that.fetchOrderData(options.orderId);
      } else if (payResult == "overdue"){
        wx.setNavigationBarTitle({
          title: "收款码失效"
        })
      } else if (payResult == "disabled") {
        wx.setNavigationBarTitle({
          title: "暂不支持当面付"
        })
      }
      util.afterPageLoad(that);


    })
  },

  // 从订单获取商品信息
  fetchOrderData: function (orderId) {
    var that = this;
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
      success: function (res) {
        if (res.data.ret == 0) {
          var parOrder = res.data.model.order;
          util.processOrderData(parOrder);
          that.setData({ parOrder: parOrder });
          that.fetchData(parOrder.storeId)
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
  },
  fetchData: function (id) {
    var that = this;
    var mallSite = wx.getStorageSync('mallSite');
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/mobile/tostore/selectToStore',
      data: {
        id: id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log(res);
        if (res.data.ret == 0) {

          var payInfo = res.data.model.result;
          payInfo.spreadInfo = JSON.parse(payInfo.spreadInfo);
          if (payInfo) {

            that.setData({ "payInfo": payInfo });

          } else {
            wx.redirectTo({
              url: 'payresult?payResult=disabled',
            })
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取店铺信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
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
