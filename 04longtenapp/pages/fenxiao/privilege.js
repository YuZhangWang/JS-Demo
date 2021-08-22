// pages/fenxiao//grade.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    needUserInfo: true,
    userImagePath: cf.config.userImagePath,
    staticResPath: cf.config.staticResPath + "/image/mobile/fx/grade",
    headPic:"",//头像
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideLoading();
    this.getPrivilege();
  },

  /* 获取特权列表 */
  getPrivilege() {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/levelConfig/findList",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          that.setData({
            gradeList: data.model.list
          })
        }
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
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
}));
