var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var Switch = require('../../youzan/dist/switch/index.js');
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSite = wx.getStorageSync("mallSite");
// pages/orderinfo/orderinfosupple.js
Page(Object.assign({}, baseHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    pageTitle:'订单详情',
    orderInfo:[],
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    var parse = JSON.parse
    wx.hideShareMenu();
    wx.setNavigationBarTitle({
      title: that.data.pageTitle
    });
    that.setData({
      orderInfo:parse(options.orderInfo)
    });
    console.log(options);
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