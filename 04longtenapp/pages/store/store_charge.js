// pages/store/mystore.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    itemList: [],
    itemTotal: 0,
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    that.data.options = options;
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.fetchItemData();
      util.afterPageLoad(that);
    });
  },

  fetchItemData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    var submitData = {
      cusmallToken: cusmallToken,
      start: 0,
      size: 10
    };
    if (app.globalData.shopuid) {
      submitData.shopUid = app.globalData.shopuid;
    }
    wx.request({
      url: cf.config.pageDomain + '/mobile/deposit/queryDepositItem',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var itemList = res.data.model.records;
          if (itemList == null) {
            itemList = [];
          }
          that.setData({ itemList: itemList });
          if (itemList.length > 0) {
            that.setData({ selectedItem: itemList[0] });
          }
          that.setData({ itemTotal: res.data.model.total });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取储值项目信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },

  findItemFromList(itemId) {
    var itemList = this.data.itemList;
    if (itemList && itemList.length > 0) {
      for (var i = 0; i < itemList.length; i++) {
        if (itemId == itemList[i].id) {
          return itemList[i];
        }
      }
    }
    return null;
  },

  handleItemTap: function (e) {
    var itemId = e.currentTarget.dataset.id;
    var item = this.findItemFromList(itemId);
    if (item) {
      this.setData({ selectedItem: item });
    }
  },

  handlePay: function () {
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({ btnLoading: true });
    var submitData = {
      cusmallToken: cusmallToken,
      depositItemId: that.data.selectedItem.id
    }
    if (app.globalData.shopuid) {
      submitData.shopUid = app.globalData.shopuid;
    }
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2002"
      },
      {
        name: 'user',
        msgcode: "2006"
      }]),
      function (resp) {
        console.log(resp)
        wx.request({
          url: cf.config.pageDomain + '/mobile/deposit/genDepositOrder',
          method: "POST",
          data: submitData,
          header: {
            'content-type': 'application/x-www-form-urlencoded'
          },
          success: function (res) {
            if (res.data.ret == 0) {
              var wxOrderData = res.data.model.order;
              wx.hideLoading();
              that.generateWxPayOrder(wxOrderData);
            } else {
              wx.hideLoading();
              wx.showModal({
                title: '支付订单异常',
                showCancel: false,
                content: res.data.msg || "服务器异常"
              });
              that.setData({ "btnLoading": false });
            }
          }
        })

      });


  },
  generateWxPayOrder: function (orderData) {
    var that = this;
    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({ btnLoading: true });

    var totalMoney = orderData.orderAmount;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: "会员储值支付",
        out_trade_no: orderData.orderNo,
        total_fee: totalMoney
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var wxOrderData = res.data.model.wxOrderData;
          wx.hideLoading();
          wx.requestPayment({
            'timeStamp': wxOrderData.timeStamp,
            'nonceStr': wxOrderData.nonceStr,
            'package': wxOrderData.package,
            'signType': wxOrderData.signType,
            'paySign': wxOrderData.paySign,
            'success': function (res) {
              wx.redirectTo({
                url: 'mystore'
              })
            },
            'fail': function (res) {
              console.log(res);
              that.setData({ btnLoading: false });
              wx.hideLoading();
              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付",
                complete: function (res) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              })

            }
          })
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '支付订单异常',
            showCancel: false,
            content: res.data.msg || "服务器异常",
            complete: function (res) {
              wx.navigateBack({
                delta: 1
              })
            }
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

  }
}))
