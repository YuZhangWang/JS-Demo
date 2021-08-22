// pages/mult/multlist.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var app = getApp();
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    pageSize: 10,
    isLoading: false,
    curPage: 1,
    isBottom: false,
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    list:[],
    multInfoAddr:"无数据",
    multClass:"",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let callback = function (data) {
      that.setData({
        multInfoAddr: data.model.address
      });
    }
    wx.setNavigationBarTitle({
      title: options.title
    });
    that.setData({
      multClass: options.id
    })
    if(options.keyword){
      that.setData({
        keyword:options.keyword
      })
    }
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.fetchLocationAddr();
      util.autoGeyAddr(callback, cusmallToken);
      util.afterPageLoad(that);
    });


  },
  fetchLocationAddr: function (latitude, longitude) {
    var that = this;
    if (that.data.isLoading || that.data.isBottom) {
      return;
    }
    that.setData({ isLoading: true });
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        wx.request({
          url: cf.config.pageDomain + "/applet/mobile/multstore/getMultStorePage",
          data: {
            start: (that.data.curPage - 1) * that.data.pageSize,
            limit: that.data.pageSize,
            cusmallToken: cusmallToken,
            multClass: that.data.multClass||"",
            name:that.data.keyword||"",
            longitude: longitude || res.longitude,
            latitude: latitude || res.latitude
          },
          header: {
            'content-type': 'application/json'
          },
          success: function (res) {
            let data = res.data;
            let list = data.model.list;
            that.setData({

                list: that.data.list.concat(list),

            });
            if (data.model.total == that.data.list.length) {
              that.setData({
                isBottom: true
              });
            }
          },
          fail: function () {
          },
          complete: function () {
            that.setData({ isLoading: false });
          }
        });


      }
    });
  },
  getMultLocation: function(){
    let that = this;
    wx.chooseLocation({
      success: function (res) {
        that.fetchLocationAddr(res.latitude, res.longitude);
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
    var ctx = this;
    ctx.setData({

      list:[],
      isLoading: false,
      curPage: 1,
      isBottom: false,
    });
    ctx.fetchLocationAddr();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var ctx = this;
    if (!ctx.data.isLoading) {
      ctx.setData({ curPage: ctx.data.curPage + 1 });
      ctx.fetchLocationAddr();
    }
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
