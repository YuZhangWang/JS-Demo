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
    mainBannerHeight: 500,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,

    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
     
      util.afterPageLoad(that);
    });
    wx.setNavigationBarTitle({
      title: app.globalData.copyrightFormConfig.content.title
    })
  },

  // 拨打电话
  call:function (e){
    var tel = e.currentTarget.dataset.tel || "";
    wx.makePhoneCall({
      phoneNumber: tel,
    })

  },

  // 输入框处理
  handleInput:function(e){
     let value = e.detail.value;
     let name = e.currentTarget.dataset.name;
     let ctx = this;
     ctx.setData({
       [`submitData.${name}`]:value
     })
  },

  //表单提交
  submitForm: function () {
    var that = this;
    wx.showLoading({
      title: '加载中...',
    })
    if(!util.phoneValidate(that.data.submitData.phone)){
       wx.showToast({
         title: '手机号码格式不正确',
        
       })
       return false;
    }
    mallSite = wx.getStorageSync('mallSite');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/copyrightform/addRecord',
      data: {
        cusmallToken: cusmallToken,
        name: that.data.submitData.name,
        phone: that.data.submitData.phone,
        business: that.data.submitData.business
      },
      method:"post",
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          wx.hideLoading();
          wx.showToast({
            title: '提交成功',
          })
         

        } else {
          wx.hideLoading();
          wx.showToast({
            title: '提交失败',
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
    let that = this;
    let shareObj = that.getShareConfig();
    return shareObj;
  }
}))
