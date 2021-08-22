// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var categoryTabHandle = require("../template/categoryTabWidget.js");
var searchHandle = require("../template/searchHandle.js");
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, categoryTabHandle, commHandle, goodsDetailHandle, searchHandle, {

  /**
   * 页面的初始数据
   */
  data: {

    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    articleUrl:"",

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var fromOpenId = options.fromOpenId;
    var shareType = options.shareType;
    var url = options.articleUrl ||'https://mp.weixin.qq.com/s/z5fe8h2yn3Mj1JHJjMMimw';
    var parse = JSON.parse;
    that.setData({
      articleUrl: url
    });
    wx.hideShareMenu();
   
      
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
    let that = this;
    if (that.data.bgMusic && that.data.playBgMusic) {
      that.audioCtx.play();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.audioCtx) {
      this.audioCtx.pause();
    }
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

    
}))