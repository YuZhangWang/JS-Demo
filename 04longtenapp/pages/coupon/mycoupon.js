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
    recordList:[],
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    userImagePath: cf.config.userImagePath,
    nodata:false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    nomore:false,
    mainTab: {
      list: [{
        id: 'not_used',
        title: '未使用'
      }, {
        id: 'used',
        title: '已使用'
      }, {
        id: 'expire',
        title: '已过期'
      }],
      selectedId: 'not_used',
      scroll: false
    }
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

      that.fetchData();
      util.afterPageLoad(that);
    });
  },
  // 从订单获取商品信息
  fetchData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    var state = 1;
    if (that.data.mainTab.selectedId == "not_used"){
      state = 1;
    } else if (that.data.mainTab.selectedId == "used") {
      state = 2;
    } else if (that.data.mainTab.selectedId == "expire") {
      state = 4;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/coupon/getMyCoupons',
      data: {
        cusmallToken: cusmallToken,
        start: that.data.recordList.length,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        limit:10,
        state: state
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var recordList = res.data.model.records || [];
          if(recordList.length > 0){
            for (var i = 0; i < recordList.length; i++) {
              var record = recordList[i];
              if (record.effectStartTime) {
                record.effectStartTime = util.formatDate(new Date(record.effectStartTime));
              }
              if (record.effectEndTime) {
                record.effectEndTime = util.formatDate(new Date(record.effectEndTime));
              }
            }
          }
          
          that.setData({ recordList: that.data.recordList.concat(recordList) });
          that.setData({total:res.data.model.total});
          if(res.data.model.total == 0){
            that.setData({ "nomore": false });
            that.setData({"nodata":true});
          } else {
            that.setData({"nodata":false});
            if (that.data.recordList.length >= res.data.model.total){
              that.setData({"nomore":true});
            } else {
              that.setData({"nomore":false});
            }
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取优惠券信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  showDetail: function (e) {
    var index = e.currentTarget.dataset.index;
    if (undefined === index) {
      return;
    }
    var ctx = this;
    var flag = !ctx.data.recordList[index].showDes;
    ctx.setData({
      ['recordList[' + index + '].showDes']: flag
    });

  },
  goCouponDetail:function(e){
    var pageUre = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: pageUre,
    })
  },
  handleZanTabChange(e) {
    var componentId = e.componentId;
    var selectedId = e.selectedId;

    this.setData({
      [`${componentId}.selectedId`]: selectedId
    });
    this.data.recordList = [];
    this.fetchData();
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
    if (that.data.recordList.length < that.data.total){
      that.fetchData();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
