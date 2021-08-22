// pages/offline/pay.js
var Zan = require('../../youzan/dist/index');
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var app = getApp();
var baseHandle = require("../template/baseHandle.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, Zan.Field, baseHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    inputContent: {},
    app: app,
    showResult:false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath
  },

  handleZanFieldChange(e) {
    var that = this;
    const { componentId, detail } = e;
    that.setData({ ["inputContent." + componentId]: detail.value });
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
          that.setData({ sceneData: sceneData});
          if (sceneData.clerkId){
            wx.showLoading({
              title: '加载中...',
            })
            that.fetchClerkInfo(sceneData);
          } else {
            wx.hideLoading();
          }
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

  // 获取核销员信息
  fetchClerkInfo: function (sceneData) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/findVerifiedClerk',
      data: {
        cusmallToken: cusmallToken,
        uid: sceneData.uid,
        id: sceneData.clerkId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          console.log(res);
          if (res.data.model.verifiedClerk){
            var verifiedClerk = res.data.model.verifiedClerk;
            that.setData({ verifiedClerk: verifiedClerk});
            that.setData({ ["inputContent.username"]: verifiedClerk.name });
            that.setData({ ["inputContent.phone"]: verifiedClerk.phone });
          }
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取核销员信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
        wx.hideLoading();
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      var mallSite = wx.getStorageSync('mallSite');
      if (options.scene) {
        var scene = decodeURIComponent(options.scene);
        that.fetchSceneInfo(scene);
      }
      util.afterPageLoad(that);
    })
  },

  handleSubmit(e) {
    var that = this;
    var username = that.data.inputContent.username;
    var phone = that.data.inputContent.phone;
    if (!username){
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: '请输入姓名',
      })
      return false;
    }
    if (!phone){
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: '请输入电话号码',
      })
      return false;
    }
    wx.showLoading({
      title: '提交中',
    });
    that.setData({ btnLoading: true });
    var submitData = {
      cusmallToken: cusmallToken,
      name: username,
      phone: phone,
      uid: that.data.sceneData.uid
    };
    if (that.data.sceneData.clerkId){
      submitData.id = that.data.sceneData.clerkId;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/bindVerifiedClerk',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          that.setData({ showResult:true});
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '绑定核销员异常',
            showCancel: false,
            content: res.data.msg
          })
        }
        that.setData({ "btnLoading": false });
        wx.hideLoading();
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
  
  }
}))