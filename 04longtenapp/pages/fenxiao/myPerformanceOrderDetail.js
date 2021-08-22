// pages/fenxiao/myPerformance.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var baseHandle = require("../template/baseHandle.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app:app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    detail: {}
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    let id = options.detailId;
    that.queryCommissionDetailsById(id);  
  },

  queryCommissionDetailsById: function(id) {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/queryCommissionDetailsById',
      data: {
        cusmallToken: cusmallToken,
        id: id
      },
      header: {
        "content": "application/json"
      },
      success: function(res) {
        if (res.data && res.data.ret == 0) {
          let detail = res.data.model.result;
          detail.createTime = that.formatTime(new Date(detail.createTime));
          that.setData({
            detail: detail  
          });
        }
      }
    })
  },
  
  formatNumber: function (n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },
  formatTime: function (date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()
    return [year,month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute].map(this.formatNumber).join(':')
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  handleScrollToLower: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {

  }
}))