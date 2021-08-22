
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
// pages/backuppage/backup1.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let  that = this;
    wx.showLoading({
      title: '加载中',
    });
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.getDistributorConfig();
    });
  },
  getPromoterAccount: function () {
    let that = this;

    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/getPromoterAccount",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          if (data.model.distributorTreeNode && data.model.distributorTreeNode.identity == 1) {
            wx.redirectTo({
              url: "/pages/fenxiao/myInfo"
            })
          }else{
            wx.redirectTo({
              url: "/pages/fenxiao/become"
            });
          }

        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  getDistributorConfig: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/getDistributorConfig",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          if (data.model.distributorConfig && (data.model.distributorConfig.switchEquity & (Math.pow(2, 0))) != 0) {
            that.getPromoterAccount();
          }else{
            wx.hideToast();
            wx.showModal({
              title: '提示',
              content: '未开启活动',
              showCancel: false,
              success: function (res) {
                if (res.confirm) {
                  wx.navigateBack({
                    delta: 1
                  })
                } else if (res.cancel) {
                }
              }
            })
          }
        } else {

          wx.showModal({
            title: '提示',
            content: data.msg,
            showCancel:false,
            success: function (res) {
              if (res.confirm) {
                wx.navigateBack({
                  delta: 1
                })
              } else if (res.cancel) {
              }
            }
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
