// pages/offline/pay.js
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
    showLoading:true,
    showResult:false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath
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

  // 从订单获取商品信息
  fetchOrderData: function (cb) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getOrderDetail',
      data: {
        cusmallToken: cusmallToken,
        parId: that.data.sceneData.orderId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var parOrder = res.data.model.parOrder;
          util.processOrderData(parOrder);
          that.setData({ totalPrice: parOrder.totalPrice });
          that.setData({ goodsList: JSON.parse(parOrder.goodsList) });
          that.setData({ orderData: parOrder });
          that.setData({ goodsCount: parOrder.totalCount });
          that.setData({
            addressInfo: {
              "userName": parOrder.clientName,
              "tel": parOrder.tel,
              "areaName": "",
              "address": parOrder.address,
            }
          });
          that.setData({ orderStatus: util.getOrderStatus(parOrder) });
          that.setData({
            orderType: parOrder.orderType
          });
          that.setData({
            calcFinPrice: parOrder.actualPrice
          });
          if (parOrder.orderType == 2 && (parOrder.foodType == 1 || parOrder.foodType == 2)) {
            that.setData({ fromToStore: true });
          }
          // 外卖包装费
          if (parOrder.packingPrice && parOrder.packingPrice > 0) {
            that.setData({ "packingPrice": parOrder.packingPrice });
          }
          that.setData({ deliveryPrice: that.data.orderData.deliveryPrice });
          wx.hideLoading();
          cb && cb();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取订单信息异常',
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
            that.fetchOrderData();
          }
          that.setData({ showLoading:false});
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
    that.setData({ btnLoading: true });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/verifyOrder',
      data: {
        cusmallToken: cusmallToken,
        orderId: that.data.sceneData.orderId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          console.log(res);
          that.setData({ showResult:true});
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
    that.setData({ nowTime: util.formatTime(new Date())});
    app.getUserInfo(this,options,function (userInfo, res) {
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