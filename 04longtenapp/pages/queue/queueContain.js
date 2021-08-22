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
    recordList:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let ctx = this;
    
    this.setData({
      id: options.id || 22
    });
    // app.getUserInfo(this,options,function (userInfo, res) {
    // });
    ctx.getDetial();
  },
  getDetial(value){
    let ctx = this;
    let mallSiteId = wx.getStorageSync('mallSiteId');
    wx.showLoading({
      title: "加载中",
    });
    console.log(cf.config.pageDomain);
    console.log(mallSiteId);
    console.log(cusmallToken);
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/callnumber/getOneSelfFetchList",
      data: {
        start: 0,
        mallSiteId:mallSiteId,
        limit:1000,
        cusmallToken:cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data);
        if (data && 0 == data.ret) {
          console.log(data);
          var recordList=[];
          if(data.model.result && data.model.result.length>0){
            data.model.result.forEach(function (item,index) {
              var infoItem={
                waitCount: item.waitCount ? item.waitCount:'--',
                waitTime: item.needWaitTime ? ctx.formatWaitTime(item.needWaitTime):'--分钟',
                fetchTime: util.formatTime(new Date(item.record.fetchTime)),
                number: item.record.number,
                name: item.itemForRecord.name,
                id:item.record.id,
                state:ctx.formatState(item.record.state)
              };
              recordList.push(infoItem);
            });
            ctx.setData({
              recordList:recordList,
            });
          }
          else {
            ctx.setData({
              recordList:[],
            });
          }

        }else{
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: data.msg
          })
        }
      },
      fail(e) {
        wx.showModal({
          title: '数据调用失败',
          showCancel: false,
          content: data.msg
        });
        console.log(e)
      },
      complete() {
        if(value=="refresh"){
          wx.stopPullDownRefresh()
        }
        wx.hideLoading();
      }
    })
  },
  detail:function(e){
     console.log(e.currentTarget.dataset.id);
    wx.navigateTo({
      url: 'queueDetail?id='+e.currentTarget.dataset.id
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
  formatState(value) {
    if (0 == value){
      return "排队中";
    }else if (1 == value) {
      return "已处理";
    } else if (2 == value) {
      return "已到号";
    }

  },
  handleBack(e){
    this.handleCommonFormSubmit(e);
    wx.reLaunch({
      url: '/pages/index/index',
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
     console.log("您好")
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
    console.log("刷新");
    this.getDetial("refresh");
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