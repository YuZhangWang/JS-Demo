// pages/takeout//qualificationFiles.js
// pages/giftcard//giftcardList.js
// channel.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, Zan.Toast, Zan.Tab, {

  /**
   * 页面的初始数据
   */
  data: {
  
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    userImagePath: cf.config.userImagePath,
    nodata: false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    nomore: false,

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

      that.findShoperInfo();
      util.afterPageLoad(that);
    });
  },

  findShoperInfo: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/takeAway/find',
      data: {
        siteId: mallSiteId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var shoperInfo = res.data.model.takeAway;
          if(shoperInfo.certificateUrl){
            shoperInfo.certificateUrl = shoperInfo.certificateUrl.split(',');
          }
          
          that.setData({
            shoperInfo: shoperInfo || {},
          });
          
          
         
        }else{
          wx.showModal({
            title: '温馨提示',
            content: res.msg,
          })
        }
      }
    })
  },
  viewImg: function (e) { // 预览图片
    var ctx = this;
    var idx = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    var relaPathPic = ctx.data.shoperInfo.certificateUrl;
    
    var absoultPathPic = [];
    for (var i = 0; i < relaPathPic.length; i++) {
      let imgUrl = ""
      if (relaPathPic[i].indexOf("http") != 0) {
        imgUrl = ctx.data.userImagePath + relaPathPic[i]
      } else {
        imgUrl = relaPathPic[i]
      }
      absoultPathPic.push(imgUrl);
    }
    wx.previewImage({
      current: absoultPathPic[idx],
      urls: absoultPathPic
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

  }
}))
