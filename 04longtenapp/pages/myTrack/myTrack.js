// pages/myTrack/myTrack.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, commHandle, Zan.Toast, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    list: [],
    skipUserInfoOauth: true, //是否跳过授权弹出框
    authType: 1, //拒绝停留当前页
    goodsName: "",
    isTrack: false,
    allSelected: false,
    goodsType: -1,
    trackText: "管理",
    selectedCount: 0,
    curPage: 1,
    isBottom: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    cusmallToken = wx.getStorageSync('cusmallToken');
    var that = this;
    wx.hideShareMenu();
    that.data.options = options;
    app.getUserInfo(this, options, function(userInfo, res) {
      if (app.globalData.userInfo) {
        that.setData({
          noAuthInfo: false
        })
      } else {
        that.setData({
          noAuthInfo: true
        })
      }
      if (options && options.goodsType) {
        that.setData({
          goodsType: options.goodsType
        })
      }
      that.getTrackList();
      util.afterPageLoad(that);
    });
  },
  getTrackList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/footprint/find',
      data: {
        cusmallToken: cusmallToken,
        shopUid: mallSite.uid || '',
        goodsType: that.data.goodsType,
        start: (that.data.curPage - 1) * 10,
        limit: 10,
        goodsName: that.data.goodsName,
        goodsIdNot: ""

      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data && res.data.ret == 0) {
          var resList = res.data.model.list;
          for (let i = 0; i < resList.length; i++) {
            resList[i].isSelected = false;
          }
          let list = that.data.list;
          for (let i = 0; i < resList.length; i++) {
            list.push(resList[i]);
          }
          that.setData({
            list: list,
            total: res.data.model.total
          })
          if (list.length == res.data.model.total) {
            that.setData({
              isBottom: true
            })
          }

          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品足迹异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  changeSelect: function(event) {
    var that = this;
    var trackId = event.currentTarget.dataset.itemid;
    var index = event.currentTarget.dataset.index;
    var list = "list[" + index + "].isSelected";
    that.setData({
      [list]: !that.data.list[index].isSelected
    });
    var count = 0;
    for (var n = 0; n < that.data.list.length; n++) {
      if (that.data.list[n].isSelected) {
        count++;
      }
    }
    if (count == that.data.list.length) {
      that.setData({
        allSelected: true
      })
    } else {
      that.setData({
        allSelected: false
      })
    }




  },

  onAllSelect: function() {
    var that = this;
    that.setData({
      allSelected: !that.data.allSelected
    })
    for (let i = 0; i < that.data.list.length; i++) {
      var list = "list[" + i + "].isSelected";
      that.setData({
        [list]: that.data.allSelected
      })


    }
  },

  delTrack: function() {
    var that = this;
    var text = "管理";
    if (!that.data.isTrack) {
      text = "完成"
    }
    that.setData({
      isTrack: !that.data.isTrack,
      trackText: text
    })
  },
  deleteTrack: function() {
    var that = this;
    var ids = [];
    for (var n = 0; n < that.data.list.length; n++) {
      if (that.data.list[n].isSelected) {
        ids.push(that.data.list[n].id);
      }
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/footprint/delete',
      data: {
        cusmallToken: cusmallToken,
        ids: ids.join(',')
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data && res.data.ret == 0) {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: "删除成功"
          })
          that.setData({
            isTrack: false,
            trackText: "管理",
            list: [],
            curPage: 1
          })
          that.onLoad();
          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  handleSearchInput: function(e) {
    var that = this;
    that.setData({
      goodsName: e.detail.value
    })
  },
  handleSearchIng: function() {
    var that = this;
    that.setData({
      list: [],
    })
    that.getTrackList();
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    let that = this;
    let isBottom = that.data.isBottom;
    if (!isBottom) {
      that.setData({
        curPage: that.data.curPage + 1
      });
      that.getTrackList();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {

  }
}))