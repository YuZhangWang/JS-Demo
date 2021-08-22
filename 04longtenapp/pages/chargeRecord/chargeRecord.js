// pages/chargeRecord/chargeRecord.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
var nowDate = util.formatDate(new Date());
var endDate = util.formatDate(new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000));
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
    date: nowDate,
    date1: endDate,
    htype: 1,
    userMsg: {},
    list: [],
    list1: [],
    list2: [],
    list3: [],
    isLoading: false,
    pageSize: 10,
    curPage: 1,
    isBottom: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    app.getUserInfo(this, options, function(userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.setData({
        id: options.id
      });
      
      that.getCouponList();
      that.getCardList();
      that.getGiftCardList();
      that.getOrderList();
      util.afterPageLoad(that);
    });
  },
  //优惠券
  getCouponList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/queryVerifyCouponList',
      data: {
        cusmallToken: cusmallToken,
        clerkId: that.data.id,
        timeStart: that.data.date,
        timeEnd: that.data.date1,
        start: (that.data.curPage - 1) * that.data.pageSize,
        limit: that.data.pageSize,

      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          let userMsg = res.data.model.verifiedClerk
          let list = res.data.model.list || [];
          that.setData({
            userMsg: userMsg,
            verifiedCouponCount: res.data.model.total,
            list: that.data.list.concat(list),
          })
          wx.hideLoading();

          if (res.data.model.total == that.data.list.length) {
            that.setData({
              isBottom: true
            });
          }

        } else {
          wx.showModal({
            title: '获取优惠券信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  //订单
  getOrderList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/queryVerifyOrderList',
      data: {
        cusmallToken: cusmallToken,
        clerkId: that.data.id,
        timeStart: that.data.date,
        timeEnd: that.data.date1,
        start: (that.data.curPage - 1) * that.data.pageSize,
        limit: that.data.pageSize,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          let userMsg = res.data.model.verifiedClerk
          let list = res.data.model.list || [];
          that.setData({
            userMsg: userMsg,
            verifiedOrderCount: res.data.model.total,
            list1: that.data.list1.concat(list),
          })
          wx.hideLoading();

          if (res.data.model.total == that.data.list1.length) {
            that.setData({
              isBottom: true
            });
          }
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
  //次卡
  getCardList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/storeCountCard/queryVerifyCardList',
      data: {
        cusmallToken: cusmallToken,
        clerkId: that.data.id,
        timeStart: that.data.date,
        timeEnd: that.data.date1,
        start: (that.data.curPage - 1) * that.data.pageSize,
        limit: that.data.pageSize,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          let userMsg = res.data.model.verifiedClerk
          let list = res.data.model.list || [];
          that.setData({
            userMsg: userMsg,
            verifiedCardCount: res.data.model.total,
            list2: that.data.list2.concat(list),
          })
          wx.hideLoading();

          if (res.data.model.total == that.data.list2.length) {
            that.setData({
              isBottom: true
            });
          }

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取次卡信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  //礼品卡
  getGiftCardList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/queryVerifyGiftCardList',
      data: {
        cusmallToken: cusmallToken,
        clerkId: that.data.id,
        timeStart: that.data.date,
        timeEnd: that.data.date1,
        start: (that.data.curPage - 1) * that.data.pageSize,
        limit: that.data.pageSize,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          let userMsg = res.data.model.verifiedClerk
          let list = res.data.model.list || [];
          that.setData({
            userMsg: userMsg,
            verifiedGiftCardCount: res.data.model.total,
            list3: that.data.list3.concat(list),
          })
          wx.hideLoading();

          if (res.data.model.total == that.data.list3.length) {
            that.setData({
              isBottom: true
            });
          }

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取次卡信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  bindDateChange(e) {
    let that = this;
    console.log(e.detail.value)
    that.setData({
      list: [],
      list1: [],
      list2: [],
      list3: [],
      curPage: 1,
      date: e.detail.value,
    })

    that.getOrderList();

    that.getCardList();

    that.getCouponList();
    that.getGiftCardList();

  },
  bindDateChange1(e) {
    let that = this;
    that.setData({
      list: [],
      list1: [],
      list2: [],
      list3: [],
      curPage: 1,
      date1: e.detail.value,
    })

    that.getOrderList()

    that.getCardList()

    that.getCouponList()
    that.getGiftCardList();

  },
  changeHxType(e) { //select send type 
    var hType = e.currentTarget.dataset.htype;
    var ctx = this;
    ctx.setData({
      htype: hType,
      curPage: 1,
      list: [],
      list1: [],
      list2: [],
      list3: [],
    });
    if (hType == 2) {
      ctx.getOrderList()
    } else if (hType == 3) {
      ctx.getCardList()
    } else if (hType == 1) {
      ctx.getCouponList()
    } else {
      ctx.getGiftCardList()
    }

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    var ctx = this;
    if (ctx.data.htype == 2) {
      if (ctx.data.list1.length < ctx.data.verifiedOrderCount) {
        let curPage = ++ctx.data.curPage;
        ctx.setData({
          curPage: curPage
        });
        ctx.getOrderList();
      }
    } else if (ctx.data.htype == 3) {
      if (ctx.data.list2.length < ctx.data.verifiedCardCount) {
        let curPage = ++ctx.data.curPage;
        ctx.setData({
          curPage: curPage
        });
        ctx.getCardList();
      }
    } else if (ctx.data.htype == 4) {
      if (ctx.data.list2.length < ctx.data.verifiedCardCount) {
        let curPage = ++ctx.data.curPage;
        ctx.setData({
          curPage: curPage
        });
        ctx.getCardList();
      }  
    } else {
      if (ctx.data.list.length < ctx.data.verifiedCouponCount) {
        let curPage = ++ctx.data.curPage;
        ctx.setData({
          curPage: curPage
        });
        ctx.getCouponList();
      }
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {
    let that = this;
    let shareObj = that.getShareConfig();
    return shareObj;
  }
}))