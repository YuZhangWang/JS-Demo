// pages/giftcard//giftcardList.js
// channel.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, Zan.Toast, Zan.Tab, {

  /**
   * 页面的初始数据
   */
  data: {
    configList: [],
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    userImagePath: cf.config.userImagePath,
    nodata: false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    nomore: false,
   
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');

      that.fetchData();
      util.afterPageLoad(that);
    });
  },
  // 获取礼品卡信息
  fetchData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/findGiftCardConfigListById',
      data: {
        cusmallToken: cusmallToken,
        start: that.data.configList.length,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        limit: 10,
        mallSiteId: wx.getStorageSync('mallSiteId')
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var configList = res.data.model.configList || [];
          if (configList.length > 0) {
            for (var i = 0; i < configList.length; i++) {
              var giftcard = configList[i];
              if (giftcard.effectStartTime) {
                giftcard.effectStartTime = util.formatDate(new Date(giftcard.effectStartTime));
              }
              if (giftcard.effectEndTime) {
                giftcard.effectEndTime = util.formatDate(new Date(giftcard.effectEndTime));
              }
            }
          }

          that.setData({ configList: that.data.configList.concat(configList) });
          that.setData({ total: res.data.model.count });
          if (res.data.model.count == 0) {
            that.setData({ "nomore": false });
            that.setData({ "nodata": true });
          } else {
            that.setData({ "nodata": false });
            if (that.data.configList.length >= res.data.model.count) {
              that.setData({ "nomore": true });
            } else {
              that.setData({ "nomore": false });
            }
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取礼品卡信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  
  goCouponDetail: function (e) {
    var pageUre = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: pageUre,
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
    var that = this;
    if (that.data.configList.length < that.data.total) {
      that.fetchData();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
