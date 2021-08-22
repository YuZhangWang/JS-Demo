// channel.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var categoryTabHandle = require("../template/categoryTabWidget.js");
var searchHandle = require("../template/searchHandle.js");
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
var sortLine = require("../template/sortLine.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, categoryTabHandle, baseHandle, commHandle, searchHandle,sortLine,{

  /**
   * 页面的初始数据
   */
  data: {
    decoration: {},
    imgUrls: [],
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    id:"",
    app:app,
    // 是否跳过用户信息授权
    skipUserInfoOauth: true,
    bannerHeight: {},
    shoppingCartCount: 0,
    playBgMusic: true,
    goodsOrderObj:{},
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    hasLoad:"",
    navTabPanelData: {},
    multInfo: {},
    multInfoArr: {},
    multInfoAddr: "",
    multClassArr: {},
    haveMutl: false,
    haveSearch: false,

    communityHandleData: {
      topicList: [],
      categoryList: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.setData({id:options.id});
      that.fetchData();
      util.getShoppingCartCount(function (count) {
        that.setData({ shoppingCartCount: count });
      },app);
      util.afterPageLoad(that);
    });
  },
  fetchData: function () {
    var that = this;
    var decorationData = {};
    var cusmallToken = wx.getStorageSync('cusmallToken');
    var mallSiteId = wx.getStorageSync('mallSiteId');
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain +'/applet/mobile/siteBar/selectSiteBar',
      data: {
        cusmallToken: cusmallToken,
        siteBarId: that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if(res.data.ret != 0){
          wx.showModal({
            title: '提示',
            content: res.data.msg,
          });
          wx.hideLoading();
          return false;
        }
        if (!res.data.model.siteBar.decoration){
          wx.setNavigationBarTitle({
            title: res.data.model.siteBar.name
          });
          wx.hideLoading();
          return;
        }
        var decorationData = JSON.parse(res.data.model.siteBar.decoration);
        wx.setNavigationBarTitle({
          title: decorationData.header_data.title
        })
        // 处理decorationData
        util.processDecorationData(decorationData, that);
        that.setData({
          decoration: decorationData
        });
        if (that.data.bgMusic) {
          that.audioCtx = wx.createAudioContext('bgMusic');
          that.audioCtx.play();
        }
        if (decorationData != null && decorationData.items != null){
          for (var i = 0; i < decorationData.items.length; i++) {
            var item = decorationData.items[i];
            if(item.item_type == "goodslist"){
              (function(item,i){
                // 加载商品分组数据
                that.setData({
                  ["goodsOrderObj.w_" + i]: {orderType: 1,isAsc: false}
                });
                that.loadGoodsListData(item,i);
              })(item,i)
            }
          }
        }
        wx.hideLoading();
      }
    })
  },
  // 商品分组显示页面数据
  loadGoodsListData:function(item,i){
    let that = this;
    if(item.loading){
      return false;
    }
    //console.log(item.loading);
    if (item.hasLoaded && item.data.list.length >= item.data.total){
      return false;
    }
    item.loading = true;
    item.hasLoaded =true;
    var submitData = {
      cusmallToken: cusmallToken,
      mallsiteId: mallSiteId,
      siteBarId: item.data.sitebar_id,
      start: item.data.list ? item.data.list.length : 0,
      limit: 10
    };
    var goodsOrder = that.data.goodsOrderObj["w_"+i];
    if (goodsOrder){
      submitData.orderType = goodsOrder.orderType;
      submitData.isAsc = goodsOrder.isAsc;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          if (typeof (item.data.list) == "undefined"){
            item.data.list = [];
          }
          var goodslist = res.data.model.result || [];
          /* 角标筛选 */
          goodslist.forEach(function (itemGoods) {
            if (itemGoods.cornerMarker && !itemGoods.cornerMarker.content) {
              itemGoods.cornerMarker = JSON.parse(itemGoods.cornerMarker)
            } else if (!itemGoods.cornerMarker) {
              itemGoods.cornerMarker = ""
            }
            itemGoods.goods_type = itemGoods.goodsType;
            itemGoods.formidenable = itemGoods.formIdEnable;
          })
          item.data.list = item.data.list.concat(goodslist);
          item.data.list.forEach(function (item1) {
            var dec=JSON.parse(item1.decoration);
            if(dec.items.length>3){
              dec.items=dec.items.splice(1,dec.items.length-2)
            }
            item1.decoration=JSON.stringify(dec);
          })
          item.data.total = res.data.model.total;
          item.loading = false;
          that.setData({
            ["decoration.items[" + i + "]"]: item
          });
        }
      }
    })
  },
  handleLoadGoodsByOrder: function (widgetIndex){
    let that = this;
    that.data.decoration.items[widgetIndex].data.list = [];
    that.data.decoration.items[widgetIndex].data.total = 0;
    that.data.decoration.items[widgetIndex].hasLoaded = false;
    that.loadGoodsListData(that.data.decoration.items[widgetIndex], widgetIndex);
  },
  handleGoodListLoadMore:function(e){
    let that = this;
    let idx = e.currentTarget.dataset.index;
    that.loadGoodsListData(that.data.decoration.items[idx],idx);
  },
  search: function (e) {
    wx.navigateTo({
      url: '/pages/search/search?keyword=' + e.detail.value,
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
    let that = this;
    if (that.data.bgMusic && that.data.playBgMusic) {
      that.audioCtx.play();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.audioCtx) {
      this.audioCtx.pause();
    }
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
    let that = this;
    let shareObj = that.getShareConfig();
    return shareObj;

  }
}))
