// pages/formRecord/formRecordDetail.js
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
      that.setData({
        recordId:options.id
      })
      that.getform();
      util.afterPageLoad(that);
    });
  },
  getform: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/form/findFormRecordById',
      data: {
        cusmallToken: cusmallToken,
        recordId: that.data.recordId,
        
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
           let form = res.data.model.result;
           wx.setNavigationBarTitle({
             title: form.formName?form.formName : "表单",
           })
          let collectInfo = JSON.parse(form.collectInfo);
          form.formDecoration = JSON.parse(form.formDecoration);
          for(var i = 0; i<collectInfo.length; i++){
            if(collectInfo[i].type=='image' && collectInfo[i].val){

               collectInfo[i].val = collectInfo[i].val.split(",");
            }
          }
          that.setData({
            collectInfo: collectInfo
          })
          util.processDecorationData(form.formDecoration, that);
          that.setData({ formData: form, items: form.formDecoration.items, submitItems: form.formDecoration.items });
        
          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取表单信息异常',
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
