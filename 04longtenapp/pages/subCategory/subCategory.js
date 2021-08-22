// pages/subCategory/subCategory.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({},baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    style: 2,
    start: 0,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    categoryList:[],
    name:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      let mallSite = wx.getStorageSync('mallSite');
      wx.setNavigationBarTitle({
        title: mallSite.name || "微页面总分组"
      })
      that.fetchCategoryData();
      util.afterPageLoad(that);
    })
  },
  fetchCategoryData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/cusmall_page/queryPageClassify',
      data: {
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        name: that.data.name,
        start: 0,
        limit: 20,
        hasSub: true,
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        var categoryData = res.data.model.records;
        that.setData({ categoryList: categoryData });
        wx.hideLoading();
        var start = that.data.start + categoryData.length;
        that.setData({ start: start });
        that.setData({
          selectedCatId: categoryData[0].id
        });
      }
    })

  },
  handleCatTabTap: function (e) {
    let vm = this;
    let catId = e.currentTarget.dataset.id;
    let catIndex = vm.findCatIndexFromList(catId);
    let cat = vm.data.categoryList[catIndex];
    if (cat.subList && cat.subList.length > 0) {
      vm.setData({
        selectedCatId: catId
      });
    } else {
      wx.navigateTo({
        url: '/pages/subCategory/sCategoryList?clsid=' + cat.id,
      });
    }
  },
  findCatIndexFromList(catId) {
    var categoryList = this.data.categoryList;
    if (categoryList && categoryList.length > 0) {
      for (var i = 0; i < categoryList.length; i++) {
        if (catId == categoryList[i].id) {
          return i;
        }
      }
    }
    return null;
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
    let that = this;
    let shareObj = that.getShareConfig();
    return shareObj;
  }
}))