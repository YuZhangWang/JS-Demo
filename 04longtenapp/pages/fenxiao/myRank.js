// pages/fenxiao/myRank.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var baseHandle = require("../template/baseHandle.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app,
    authType:'back', //拒绝授权 返回前页
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    rankList: [],
    selfRank: {},
    limit: 50
  },
  /**
    * 生命周期函数--监听页面加载
    */
  onLoad: function (options) {
    let that = this;

    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.fetchListData();
      util.afterPageLoad(that);
    });
  },



  fetchListData: function () {
    let vm = this;
    if (vm.data.loadingListData) {
      return;
    }
    wx.showLoading({
      title: "加载中",
    })
    let submitData = {
      cusmallToken: cusmallToken,
      start: vm.data.rankList.length,
      limit: vm.data.limit
    };
    vm.data.loadingListData = true;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/queryRank',
      data: submitData,
      header: {
        "content": "application/json"
      },
      success: function (res) {
        console.log(res.data);
        wx.hideLoading();
        vm.data.loadingListData = false;
        if (res.data.ret == 0) {
          let rankList = res.data.model.rankList;
          let selfRank = res.data.model.oneselfRank;

          for (let item of rankList){
            item.phone = item.phone.slice(0, 3) + "****" + item.phone.slice(7);
          }
          vm.setData({
            selfRank:selfRank
          })
          if (!rankList) {
            rankList = [];
          }

          vm.setData({ "rankList": vm.data.rankList.concat(rankList) });
          vm.setData({ "total": res.data.model.rankListTotal });
          if (res.data.model.total == 0) {
            vm.setData({ "nomore": false });
            vm.setData({ "nodata": true });
          } else {
            vm.setData({ "nodata": false });
            if (vm.data.rankList.length >= res.data.model.rankListTotal) {
              vm.setData({ "nomore": true });
            } else {
              vm.setData({ "nomore": false });
            }
          }
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  handleScrollToLower: function () {

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
    // let that = this;
    // if (that.data.rankList.length < that.data.total) {
    //   that.fetchListData();
    // }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
