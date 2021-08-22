// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
// pages/wxpay/wxpaytoken.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    withdrawuid:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    wx.hideShareMenu();
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      if (that.options.scene) {
        let scene = decodeURIComponent(that.options.scene);
        that.setData({
          withdrawuid: scene.split("=")[1]
        })
      }else{
        
      }
      wx.hideLoading();
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },
  handleToken: function(){
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/withdraw_bind/bind",
      data: {
        cusmallToken: cusmallToken,
        withdrawuid: that.data.withdrawuid
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if(data && 0 == data.ret){
          wx.showToast({
            title: "授权成功",
            icon: 'success',
            duration: 2000
          })
        }else{
          wx.showToast({
            title: data.msg,
            icon: 'fail',
            duration: 2000
          })
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
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