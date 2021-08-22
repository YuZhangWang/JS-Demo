// pages/queue/queueList.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    selected: "",
    qTypeList:[],
    isFetch: -1,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // wx.hideLoading();
    this.setData({
      app: getApp(),
    })
    let ctx = this;
    ctx.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      ctx.getQueueTypeList();
    });

  },
  getQueueTypeList(){
    let mallSiteId = wx.getStorageSync('mallSiteId');
    let ctx = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/callnumber/getCallNumberItems",
      data: {
        mallSiteId: mallSiteId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if(data && 0 == data.ret){
          let qTypeList = data.model.items;
          for (let qI of qTypeList){
            qI.fwaitTime = ctx.formatWaitTime(qI.waitTime);
          }
          ctx.setData({
            qTypeList: qTypeList
          })
          ctx.setData({
            isFetch: data.model.isFetch
          })
        }
      },
      fail() {

      },
      complete() {

      }
    })
  },
  selectQueue(e){
    let selected = e.currentTarget.dataset.id;
    this.setData({
      selected: selected
    })
  },
  handleQueue(e){
    //
    if (!this.checkUserInfo()) {
      return false;
    }
    this.handleCommonFormSubmit(e);
    let formId = e.detail.formId;
    let mallSiteId = wx.getStorageSync('mallSiteId');
    let ctx = this;
    let id = ctx.data.selected;
    if(!id){
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: "请选择排号类型"
      })
      return;
    }
    let cusmallToken = wx.getStorageSync('cusmallToken');
    // 订阅消息
    ctx.requestSubMsg(
      ctx.getMsgConfig([{
        name: 'order',
        msgcode: "1007"
      }, {
          name: 'order',
          msgcode: "1008"
        }, {
          name: 'order',
          msgcode: "1009"
        }]),
      function (resp) {
        console.log(resp)
        wx.request({
          url: cf.config.pageDomain + "/applet/mobile/callnumber/fetchOnline",
          data: {
            cusmallToken: cusmallToken,
            mallSiteId: mallSiteId,
            itemId: id
          },
          header: {
            'content-type': 'application/json'
          },
          success: function (res) {
            let data = res.data;
            if (data && 0 == data.ret) {
              let rId = data.model.record.id
              wx.showModal({
                title: '提示',
                showCancel: false,
                content: "取号成功",
                success: function (res) {
                  if (res.confirm) {
                    wx.navigateTo({
                      url: '/pages/queue/queueDetail?id=' + rId,
                    })
                  }
                }
              })
            } else {
              wx.showModal({
                title: '提示',
                showCancel: false,
                content: data.msg
              })
            }
          },
          fail() {

          },
          complete() {

          }
        })


      });

   
  },
  formatWaitTime(min) {
    var h = parseInt(min / 60);
    var m = min % 60;
    if (0 == min) {
      return "-";
    } else if (0 == m && 0 < h) {
      return h + "小时";
    } else if (0 == h && 0 < m) {
      return m + "分钟";
    } else {
      return h + "小时" + m + "分钟";
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

  }
}));
