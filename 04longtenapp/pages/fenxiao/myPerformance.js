// pages/fenxiao/myPerformance.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var Zan = require('../../youzan/dist/index');
var baseHandle = require("../template/baseHandle.js");
// pages/fenxiao/myInfo.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    detailList:[],
    authType:'back', //拒绝授权 返回前页
    limit: 20,
    panelTab: {
      "selectedId": "0",
      "list": [
        { "id": "0", "title": "全部" },
        { "id": "1", "title": "已结算" },
        { "id": "2", "title": "冻结中" }
      ]
    },
    freezePop: false
  },

  handlePanelTabChange(e) {
    let vm = this;
    let selectedId = e.target.dataset.id;
    vm.setData({
      [`panelTab.selectedId`]: selectedId
    });
    vm.setData({
      detailList:[
      ],
      total:0
    })
    vm.fetchListData();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      //that.fetchData();
      that.getPromoterAccount();
      that.fetchListData();
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
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/community/findPost',
      data: submitData,
      header: {
        "content": "application/json"
      },
      success: function (res) {
        console.log(res.data);
        wx.hideLoading();
      }
    })
  },
  getPromoterAccount: function () {
    let that = this;

    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/getPromoterAccount",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          if (data.model.distributorTreeNode) {
            that.setData({
              upNodeName: data.model.distributorTreeNode.upNodeName,
              categoryName: data.model.distributorTreeNode.categoryName
            });
          }
          if (data.model.promoterAccount) {
            let mpro = data.model.promoterAccount;
            that.setData({
              headPic: mpro.headPic
            });
            that.setData({
              enableWithdrawMoney: mpro.enableWithdrawMoney
            });
            that.setData({
              totalMoney: mpro.totalMoney
            });
            that.setData({
              nickName: mpro.nickName
            });
            that.setData({
              createTime: util.formatTime(new Date(mpro.createTime))
            });
            that.setData({
              freezeMoney: mpro.freezeMoney
            });


          }
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  formatNumber : function(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },
  toggleFreezePop: function () {
    this.setData({
      freezePop: !this.data.freezePop
    });
  },
  formatTime : function(date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()
    return [month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute].map(this.formatNumber).join(':')
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
    if (vm.data.panelTab.selectedId == 1){
      submitData.state = 1;
    } else if (vm.data.panelTab.selectedId == 2){
      submitData.state = 0;
    }
    vm.data.loadingListData = true;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/queryCommissionDetails',
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
          for (let i = 0; i < detailList.length; i++) {
            detailList[i].createTime = vm.formatTime(new Date(detailList[i].createTime));
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

  showTips: function () {
    this.setData({
      freezePop: !this.data.freezePop
    });
  },

  handleScrollToLower: function () {
    let that = this;
    if (that.data.detailList.length < that.data.total) {
      that.fetchListData();
    }
  },

  orderDetailTap:function(e){
    let id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/fenxiao/myPerformanceOrderDetail?detailId=' + id
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
    // let that = this;
    // if (that.data.detailList.length < that.data.total) {
    //   that.fetchListData();
    // }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
