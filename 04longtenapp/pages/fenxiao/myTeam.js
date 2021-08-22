// pages/fenxiao/myPerformance.js
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
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    authType:'back', //拒绝授权 返回前页
    detailList: [],
    limit: 10
  },
  /**
    * 生命周期函数--监听页面加载
    */
  onLoad: function (options) {
    let that = this;
    if (options.nodeId){
      that.setData({
        nodeId: options.nodeId
      })
    }
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.fetchData();
      //that.fetchListData();
      util.afterPageLoad(that);
    });
  },

  fetchData: function () {
    let vm = this;
    wx.showLoading({
      title: "加载中",
    })
    let submitData = {
      cusmallToken: cusmallToken
    };
    if(vm.data.nodeId){
      submitData.nodeId = vm.data.nodeId;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/getDistributroNodeById',
      data: submitData,
      header: {
        "content": "application/json"
      },
      success: function (res) {
        console.log(res.data);
        if(res.data.ret == 0){
          let distributorTreeNode = res.data.model.distributorTreeNode;
          if (distributorTreeNode){
            vm.setData({
              distributorTreeNode: distributorTreeNode
            })
            vm.setData({
              indirectDownNode: res.data.model.indirectDownNode
            })
            vm.fetchListData();
          } else {
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: "对不起，您当前不是代言人"
            })
          }
        } else {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: res.data.msg
          })
        }
        wx.hideLoading();
      }
    })
  },

  showTips:function(){
    wx.showModal({
      title: '提示',
      showCancel: false,
      content: "总粉丝数：总粉丝数=你的直接好友 + 你的间接好友；\n直接好友：通过你进入小程序的好友数量；\n间接好友：通过你的好友进入小程序数量；"
    })
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
      start: vm.data.detailList.length,
      limit: vm.data.limit
    };
    submitData.upNode = vm.data.distributorTreeNode.id;
    vm.data.loadingListData = true;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/queryDownTreeNode',
      data: submitData,
      header: {
        "content": "application/json"
      },
      success: function (res) {
        console.log(res.data);
        wx.hideLoading();
        vm.data.loadingListData = false;
        if (res.data.ret == 0) {
          let detailList = res.data.model.records;
          if (!detailList){
            detailList = [];
          }
          for (let i = 0; i < detailList.length; i++) {
            detailList[i].joinTime = util.formatTime(new Date(detailList[i].joinTime));
          }
          vm.setData({ "detailList": vm.data.detailList.concat(detailList) });
          vm.setData({ "total": res.data.model.total });
          if (res.data.model.total == 0) {
            vm.setData({ "nomore": false });
            vm.setData({ "nodata": true });
          } else {
            vm.setData({ "nodata": false });
            if (vm.data.detailList.length >= res.data.model.total) {
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
    let that = this;
    if (that.data.detailList.length < that.data.total) {
      that.fetchListData();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
