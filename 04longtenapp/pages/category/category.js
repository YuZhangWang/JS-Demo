// my.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var searchHandle = require("../template/searchHandle.js");
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
var app = getApp();
Page(Object.assign({}, searchHandle, baseHandle, commHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    categoryList:[],
    // 是否跳过用户信息授权
    skipUserInfoOauth: true,
    goodsListData:[],
    shoppingCartCount: 0,
    authType:1, //拒绝授权 停留当前页
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    scrolltop: 0,
    app:app,
    style:2,
    start:0,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    isIntegralGoods: false,
    isBottom: false,
    isLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      mallSite = wx.getStorageSync('mallSite');
      wx.setNavigationBarTitle({
        title: mallSite.name
      })
      that.fetchCategoryData();
      util.getShoppingCartCount(function (count) {
        that.setData({ shoppingCartCount: count });
      },app);
      if (options.style){
        that.setData({
          style: options.style
        })
      }
      util.afterPageLoad(that);
    })
  },

  fetchCategoryData:function(){
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain+'/applet/mobile/siteBar/findSiteBar',
      data: {
        siteId: mallSiteId,
        start:0,
        limit:50,
        hasSubList:true,
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if(res.data.ret == 0){
          var categoryData =res.data.model ? res.data.model.result:[];
          that.setData({ categoryList: categoryData });
          that.setData({
            ["app.globalData.bottomMenus.isShow"]: true
          })
          wx.hideLoading();
          var start = that.data.start + categoryData.length;
          that.setData({ start: start});
          if (categoryData.length > 0){
            that.setData({
              selectedCat: categoryData[0],
              selectedSubCatId:categoryData[0].id
            });
            if ((that.data.selectedCat.subSiteBar && that.data.selectedCat.subSiteBar.length == 0) || that.data.style>3 ) {
              that.loadGoodsByCategory(that.data.selectedCat.id, true);
            }
          }
        }

      }
    })

  },

  scrollHandle: function (e) { //滚动事件
    this.setData({
      scrolltop: e.detail.scrollTop
    })
  },
  goToTop: function () { //回到顶部
    this.setData({
      scrolltop: 0
    })
  },
  scrollLoading: function () { //滚动加载
    this.fetchCategoryData();
  },

  handleCatTabTap: function (e) {
    let vm = this;
    let catId = e.currentTarget.dataset.id;
    let catIndex = vm.findCatIndexFromList(catId);
    let cat = vm.data.categoryList[catIndex];
    if (vm.data.selectedCat.id == catId){
      return false;
    }
    vm.setData({
      goodsListData: [],
      selectedSubCatId: catId, //二级分组默认是一级分组的id,以便展示一级分组的全部商品
      selectedCat: cat,
      isBottom: false,
      isLoading: false
    });

    if (cat.subSiteBar && cat.subSiteBar.length > 0){
      // 加载子分组默认商品列表
      if(vm.data.style > 3){
        vm.loadGoodsByCategory(catId, true);
      }

    } else {
      vm.loadGoodsByCategory(catId,true);
      /**
      wx.navigateTo({
        url: '/pages/channel/channel?id='+cat.id,
      })
      */
    }
  },
  // 子分组查询商品
  handleSubCatTabTap: function (e) {
    let vm = this;
    let subcatId = e.currentTarget.dataset.id;
    vm.setData({
      goodsListData: [],
      selectedSubCatId:subcatId,
      isBottom: false,
      isLoading: false
    });
    vm.loadGoodsByCategory(subcatId, true);
  },

  loadGoodsByCategory: function (categoryId,isReload) {
    var that = this;
    let catIndex = that.findCatIndexFromList(categoryId);
    let cat = that.data.categoryList[catIndex] || {};
    var mallSiteId = wx.getStorageSync('mallSiteId');
    var cusmallToken = wx.getStorageSync('cusmallToken');
    if (that.data.loading ||that.data.isBottom) {
      return false;
    }
    var submitData = {
      cusmallToken: cusmallToken,
      mallsiteId: mallSiteId,
      start: isReload ? 0 : that.data.goodsListData.length,
      limit: 10
    };
    if (categoryId) {
      submitData.siteBarId = categoryId;
    }
    that.setData({
      isBottom: true,
      isLoading: true
    });
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          // 页面展示不需要pics和decoration,置空，避免goodsListData加载过多数据时溢出(BUG#7314)
          var markList = [];
          for (var i = 0; i < res.data.model.result.length; i++) {
            if(res.data.model.result[i].cornerMarker && !res.data.model.result[i].cornerMarker.content){
              res.data.model.result[i].cornerMarker=JSON.parse(res.data.model.result[i].cornerMarker)//角标筛选
            }else if(!res.data.model.result[i].cornerMarker){
              res.data.model.result[i].cornerMarker = ""
            }

            res.data.model.result[i].pics = null;
            res.data.model.result[i].decoration = null;
          }
          if (isReload){
            that.data.goodsListData = res.data.model.result;
          } else {
            that.data.goodsListData = that.data.goodsListData.concat(res.data.model.result);
          }
          cat.total = res.data.model.total;
          that.data.selectedCat.total = res.data.model.total;
          that.setData({nomoreGoods:that.data.goodsListData.length >= cat.total});
          if(that.data.goodsListData.length == res.data.model.total){
            that.setData({
              isBottom: true
            })
          }else{
            that.setData({
              isBottom: false
            })
          }
          
          that.setData({
            goodsListData: that.data.goodsListData,
            goodsTotal:res.data.model.total
          });
          wx.hideLoading();
        }
      },
      complete:function(){
        that.setData({
          isLoading: false
        });
      }
    })
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
// 点击是否出现二级分组，若没有二级，则跳转
  handleCatNavTap:function(e){
    let vm = this;
    let catId = e.currentTarget.dataset.id;
    let catIndex = vm.findCatIndexFromList(catId);
    let cat = vm.data.categoryList[catIndex];
    if (cat.subSiteBar && cat.subSiteBar.length > 0) {
      if(cat.showSubList){
        cat.showSubList = false;
      } else {
        cat.showSubList = true;
      }
      vm.setData({
        ['categoryList['+catIndex+']']:cat
      })
    } else {
      wx.navigateTo({
        url: '/pages/channel/channel?id='+catId,
      })
    }
  },

  handleProductScrollToLower: function () {
    let that = this;
    let selectedCat = that.data.selectedCat;
    let selectedSubCatId = that.data.selectedSubCatId; // 二级分组id
    if (selectedCat.subSiteBar.length == 0 && that.data.goodsListData.length < selectedCat.total) {
      that.loadGoodsByCategory(selectedCat.id, false);
    } else if (that.data.style > 3 && that.data.goodsListData.length < that.data.goodsTotal){
      that.loadGoodsByCategory(selectedSubCatId, false);
    }
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
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  }
}))
