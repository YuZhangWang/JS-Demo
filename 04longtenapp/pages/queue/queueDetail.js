// pages/queue/queueDetail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    waitCount:"",
    waitTime:"",
    fetchTime:"",
    "number":"",
    name:"",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let ctx = this;
    wx.hideLoading()
    this.setData({
      id: options.id || 22
    });
    // app.getUserInfo(this,options,function (userInfo, res) {
    // });
    ctx.getDetial();
  },
  getDetial(){
    let ctx = this;
    let cusmallToken = wx.getStorageSync('cusmallToken');
    wx.showLoading({
      title: "加载中",
    });
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/callnumber/getFetchDetail",
      data: {
        recordId: ctx.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          console.log(data)
          ctx.setData({
            waitCount: data.model.waitCount
          });
          ctx.setData({
            waitTime: ctx.formatWaitTime(data.model.waitTime)
          });
          ctx.setData({
            fetchTime: util.formatTime(new Date(data.model.record.fetchTime))
          });
          ctx.setData({
            "number": data.model.record.number
          });
          ctx.setData({
            "name": data.model.item && data.model.item.name
          });
        }else{
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: data.msg
          })
        }
      },
      fail(e) {
        console.log(e)
      },
      complete() {
        wx.hideLoading();
      }
    })
  },
  formatWaitTime(min) {
    var h = parseInt(min / 60);
    var m = min % 60;
    if (0 == min){
      return "0分钟";
    }else if (0 == m && 0 < h) {
      return h + "小时";
    } else if (0 == h && 0 < m) {
      return m + "分钟";
    } else {
      return h + "小时" + m + "分钟";
    }

  },
  handleBack(e){
    this.handleCommonFormSubmit(e);
    let path = "/pages/index/index?";
    if (app.globalData.shopuid) {
      path += "shopuid=" + app.globalData.shopuid;
      if (app.globalData.fromuid) {
        path += "&fromuid=" + app.globalData.fromuid;
      }
    }
    wx.reLaunch({
      url: path,
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
  
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
  
  }
}))