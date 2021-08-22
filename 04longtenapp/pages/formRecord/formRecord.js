// pages/formRecord/formRecord.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, commHandle, Zan.Toast, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    list:[]
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
      
      that.getformRecord(1)
      util.afterPageLoad(that);
    });
  },
  //表单记录
  getformRecord: function (page) {
    var that = this;
    mallSite = wx.getStorageSync('mallSite');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/form/queryOwnFormRecord',
      data: {
        cusmallToken: cusmallToken,
        uid: mallSite.uid,
        start: (page - 1) * 20,
        limit: 20
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          let list = res.data.model.list;
          that.setData({
            list: list
          })
          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取表单记录信息异常',
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
    return {
      title: this.data.coupon.title
    }
  }
}))
