// pages/subCategory/sCategoryList.js
//获取应用实例
var app = getApp();
console.log(app)
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    page: 1,
    total: -1,
    pageList:[],
    isLoading: false,
    isBottom:false,
    classifyId:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    wx.hideShareMenu();
    cusmallToken = wx.getStorageSync('cusmallToken');
    this.setData({
      classifyId: options.clsid || ""
    });

    cusmallToken = wx.getStorageSync('cusmallToken');
    that.fetchData(false, 1);
    util.afterPageLoad(that);

  },
  fetchData: function (more, page) {
    let list = this.data.pageList;
    let cxt = this;
    cxt.setData({
      isLoading: true
    });
    if (cxt.data.total == list.length) {
      cxt.setData({
        isBottom: true
      });
      cxt.setData({
        isLoading: false
      });
      return;
    }
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/cusmall_page/queryPageByClassify',
      data: {
        classifyId: cxt.data.classifyId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        start: (page - 1) * 10,
        limit: 10,
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;

        if(data && 0 == data.ret){
          let rets = data.model.records;
          wx.setNavigationBarTitle({
            title: data.model.classify.name || "微页面列表"
          })
          for (let i in rets) {
            rets[i].createTime = util.formatTime(new Date(rets[i].createTime));
          }
          cxt.setData({
            total: data.model.total
          });
          if(more){
            cxt.setData({
              pageList: list.concat(rets)
            });
          }else{
            cxt.setData({
              pageList: rets
            });
          }
          if(0 == rets.length){
            cxt.setData({
              isBottom: true
            });
          }
        }
      },
      complete:function(){
        cxt.setData({
          isLoading: false
        });
        wx.hideLoading();
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
    if (this.data.isLoading) {
      return;
    }
    this.data.page = 1;
    this.setData({
      total: -1
    });
    this.fetchData(false, this.data.page);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.isLoading) {
      return;
    }
    this.data.page = ++this.data.page;
    this.fetchData(true, this.data.page);
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
