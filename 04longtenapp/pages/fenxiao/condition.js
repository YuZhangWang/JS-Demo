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
          if ((data.model.conditionSwitch & (Math.pow(2, 0))) != 0) {
            that.setData({
              conditionComm: true
            })
          } else {
            that.setData({
              conditionComm: false
            })
          }
          if ((data.model.conditionSwitch & (Math.pow(2, 1))) != 0) {
            that.setData({
              conditionFans: true
            })
          } else {
            that.setData({
              conditionFans: false
            })
          }
          if ((data.model.conditionSwitch & (Math.pow(2, 2))) != 0) {
            that.setData({
              conditionGoods: true
            })
          } else {
            that.setData({
              conditionGoods: false
            })
          }
          if ((data.model.conditionSwitch & (Math.pow(2, 3))) != 0) {
            that.setData({
              conditionMonetary: true
            })
          } else {
            that.setData({
              conditionMonetary: false
            })
          }
          data.model.list.shift();
          that.setData({
            gradeList: data.model.list,
            conditionSwitch: data.model.conditionSwitch
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
