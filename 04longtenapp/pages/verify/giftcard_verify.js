// pages/verify//giftcard_verify.js
var Zan = require('../../youzan/dist/index');
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var app = getApp();
var baseHandle = require("../template/baseHandle.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    showLoading: true,
    showResult: false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    verificationMoney: 0
  },

  // 获取场景值信息
  fetchSceneInfo: function (scene) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/common/findSceneEntity',
      data: {
        scene: scene
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var sceneData = JSON.parse(res.data.model.appletScene.entity);
          that.setData({ sceneData: sceneData });
          that.fetchClerkInfo(sceneData);
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取场景信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },

  
  // 获取礼品卡记录
  getGiftCardData: function () {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/findGiftCardRecordById',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: that.data.sceneData.verifyId,
        isSelectFlow: '',
        isSelectOrder: '',
        isSelectVerifiedClerkInfo: ''
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let config = data.model.record || {};
          let goods = data.model.goods || {};
          if (config.effectEndTime) {
            config.effectEndTime = util.formatTime(new Date(config.effectEndTime))
          }
          if (config.effectStartTime) {
            config.effectStartTime = util.formatTime(new Date(config.effectStartTime))
          }
          that.setData({
            config: config,
            goods: goods
          })



        }

      },
      fail: function () {

      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },

  getMoney: function(e){
     this.setData({
       verificationMoney: e.detail.value
     })
  },

  // 获取核销员信息
  fetchClerkInfo: function (sceneData) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/findVerifiedClerk',
      data: {
        cusmallToken: cusmallToken,
        uid: sceneData.uid
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          console.log(res);
          if (res.data.model.verifiedClerk) {
            var verifiedClerk = res.data.model.verifiedClerk;
            that.setData({
              verifiedClerk: verifiedClerk
            });
            that.getGiftCardData();
          }
          that.setData({ showLoading: false });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取核销员信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },

  // 确定核销
  handleSubmit: function () {
    var that = this;
    wx.showLoading({
      title: '核销处理中...',
    })
    var submitData = {
      cusmallToken: cusmallToken,
      giftCardRecordId: that.data.sceneData.verifyId
    }
    if (that.data.verificationMoney > 0){
      submitData.verificationMoney = that.data.verificationMoney * 100;
    }
    that.setData({ btnLoading: true });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/verificationGiftCard',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          console.log(res);
          that.setData({ showResult: true });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '核销订单异常',
            showCancel: false,
            content: res.data.msg
          })
        }
        that.setData({ btnLoading: false });
      }
    })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    that.setData({ nowTime: util.formatTime(new Date()) });
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      var mallSite = wx.getStorageSync('mallSite');
      if (options.scene) {
        var scene = decodeURIComponent(options.scene);
        wx.showLoading({
          title: '加载中...',
        })
        that.fetchSceneInfo(scene);
      }
      if(options.id){
        that.setData({
          ['sceneData.verifyId']: options.id
        })
      }
      util.afterPageLoad(that);
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