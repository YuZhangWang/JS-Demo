// pages/liveplayer/liveplayer.js
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
    list_style: 1,
    showend: 0,
    liveStatus: {
      "101": "直播中",
      "102": "未开始",
      "103": "已结束",
      "107": "已过期",
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    that.setData({
      list_style: options.style || 1,
      showend: options.showend || 0
    })
    cusmallToken = wx.getStorageSync('cusmallToken');
    that.fetchroomList();
    wx.hideLoading();
  },
  fetchroomList: function () {
    var that = this;
    if (that.data.isLoading || that.data.isBottom) {
      return;
    }
    that.setData({ isLoading: true });
    
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/liveroom/findList",
      data: {
        start: (that.data.curPage - 1) * that.data.pageSize,
        limit: that.data.pageSize,
        cusmallToken: cusmallToken,
        excludeFinished: parseInt(that.data.showend) == 1 ? false : true 
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if(data.ret == 0){
          let list = data.model.list;

          that.setData({

            list: that.data.list.concat(list),

          });
          if (data.model.total == that.data.list.length) {
            that.setData({
              isBottom: true
            });
          }
        }
        wx.hideLoading();
        
      },
      fail: function () {
      },
      complete: function () {
        that.setData({ isLoading: false });
        
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
    var ctx = this;
    ctx.setData({

      list: [],
      isLoading: false,
      curPage: 1,
      isBottom: false,
    });
    ctx.fetchroomList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var ctx = this;
    if (!ctx.data.isLoading) {
      ctx.setData({ curPage: ctx.data.curPage + 1 });
      ctx.fetchroomList();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
    
  }
}))
