// pages/offline/applyResult.js
var Zan = require('../../../youzan/dist/index');
var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var app = getApp();
var baseHandle = require("../../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
let uid = cf.config.customPack ? cf.config.uid : extConfig.uid;
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    uid: uid
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    wx.hideLoading();
    app.getUserInfo(this,options, function (userInfo, res) {
      var applyResult = "success";
      if (typeof (options.applyResult) !== "undefined") {
        applyResult = options.applyResult;
      }
      that.setData({ "applyResult": applyResult });
      util.afterPageLoad(that);
    })
  },

  judgeEnterApplet: function () {//是否能进入小程序
    let that = this;
    let app = getApp();
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/member/judgeEnterApplet",
      data: {
        cusmallToken: wx.getStorageSync('cusmallToken')
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          if (data.model.isEnter) {
            wx.reLaunch({
              url: '/pages/index/index',
            })
          }
        }
      },
      fail: function () {
      },
      complete: function () {
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
    this.judgeEnterApplet();
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
    this.judgeEnterApplet();
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