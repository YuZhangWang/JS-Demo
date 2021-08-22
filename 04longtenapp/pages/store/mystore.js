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
    recordList: [],
    app: app,
    needUserInfo: true,
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    nodata: false,
    nomore: false,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
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
      that.fetchRecordData();
      that.fetchAccountData();
      util.afterPageLoad(that);
    });
  },
  
  // 获取账户信息
  fetchAccountData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    let submitData = {
      cusmallToken: cusmallToken
    };
    if (app.globalData.shopuid) {
      submitData.shopUid = app.globalData.shopuid;
      submitData.fromUid = app.globalData.fromuid;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/getMemberInfo',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          that.setData({ memberInfo: res.data.model.member });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取会员信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },

  // 订阅余额提醒消息
  openNotice: function () {
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2006"
      }]),
      function (resp) {
        console.log(resp)

      });
  },

  // 获取收支记录
  fetchRecordData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    var submitData = {
      cusmallToken: cusmallToken,
      start: that.data.recordList.length,
      size: 10
    };
    if (app.globalData.shopuid){
      submitData.shopUid = app.globalData.shopuid;
    }
    wx.request({
      url: cf.config.pageDomain + '/mobile/deposit/queryDepositItemFlow',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var recordList = res.data.model.records;
          if (recordList == null){
            recordList = [];
          }
          for (var i = 0; i < recordList.length; i++) {
            var record = recordList[i];
            if (record.flowTime) {
              record.flowTime = util.formatTime(new Date(record.flowTime));
            }
          }
          that.setData({ recordList: that.data.recordList.concat(recordList) });
          that.setData({ total: res.data.model.total });
          if (res.data.model.total == 0) {
            that.setData({ "nomore": false });
            that.setData({ "nodata": true });
          } else {
            that.setData({ "nodata": false });
            if (that.data.recordList.length >= res.data.model.total && res.data.model.total>10) {
              that.setData({ "nomore": true });
            } else {
              that.setData({ "nomore": false });
            }
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取储值金信息异常',
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
    var that = this;
    if (that.data.recordList.length < that.data.total) {
      that.fetchRecordData();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
