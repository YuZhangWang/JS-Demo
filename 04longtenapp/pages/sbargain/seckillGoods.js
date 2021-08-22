// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var searchHandle = require("../template/searchHandle.js");
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
var atySecGoodsTimer;
Page(Object.assign({}, baseHandle, commHandle, goodsDetailHandle, searchHandle, {

  /**
   * 页面的初始数据
   */
  data: {
	curUser: {},
    goodsData: {},
    goodsCover: [],
    goodsType: "",
    specData: [],
    isDetailPage: true,
    isDone: false,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    decoration: {},
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    app: app,
    bannerHeight: {},
    mainBannerHeight: 100,
    id: "",
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    posterUrl: "",//海报url
    atyTimeShutDown: { timerDay1: "00", timerHour1: "00", timerMinute1: "00", timerSecond1: "00"},
    activityStatInfo:{},
    activity:{},
    secListStatus:0,
    inventory:"",
    awardVirtualNum:""
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var fromOpenId = options.fromOpenId;
    var parse = JSON.parse;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.setData({
    	  id: options.id,
    	  curUser: userInfo
      });
      if (options.id) {
        that.fetchData();
      }
      util.afterPageLoad(that);
    });
  },
  // 查询配置信息
  findConfig: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/mallSite/findConfig',
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        that.setData({
          openGoodsShare: res.data.model.config.openGoodsShare
        })
      }
    })
  },
  fetchData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/init',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          that.setData({
            activity: res.data.model.activity
          })
          that.setData({
            secListStatus: res.data.model.statu
          })
          atySecGoodsTimer = setInterval(function () {
            if (1 == res.data.model.statu){
              that.showCountDown(new Date(res.data.model.activity.endTime));
            } else if (0 == res.data.model.statu){
              that.showCountDown(new Date(res.data.model.activity.startTime));
            }
          }, 1000);

          var goodsData = res.data.model.awardList[0];
          if (!goodsData.description) {
            goodsData.description = "{}";
          }

          if (goodsData.awardPicList != null) {
            that.setData({ goodsCover: goodsData.awardPicList.split(",") });
          }
          goodsData.ecExtendObj = JSON.parse(goodsData.ecExtend || "{}");
          that.setData({ goodsData: goodsData });

          var decorationData = JSON.parse(goodsData.description);
          wx.setNavigationBarTitle({
            title: goodsData.awardName
          })
          // 处理decorationData
          util.processDecorationData(decorationData, that);
          that.setData({
            decoration: decorationData,
          });
          that.setData({
            activityStatInfo: res.data.model.activity.activityStatInfo
          });
          if (res.data.model.activity.activityStatInfo){
            that.setData({
              inventory: that.data.activityStatInfo.awardInitNum - that.data.activityStatInfo.awardSendNum
            })
          }else{
            that.setData({
              inventory: goodsData.sendNum
            })
          }
          that.setData({
            awardVirtualNum: goodsData.awardVirtualNum
          });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      },
      complete:function(){
        wx.hideLoading();
        that.setData({
          isDone:true
        })
      }
    })
  },

  goToPay:function(){

    if (!this.checkUserInfo()) {
      return false;
    }
    if (0 == this.data.secListStatus) {
      wx.showModal({
        title: '提示',
        showCancel: false,
        content:"活动未开始"
      });
      return;
    } else if (2 == this.data.secListStatus){
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: "活动已结束"
      });
      return;
    }

    wx.redirectTo({
      url: "/pages/sbargain/atyOrderPay?activityId=" + this.data.activity.id + "&goodsId=" + this.data.goodsData.id
    });

  },
  showCountDown: function (endDate) {
    var now = new Date();
    let atyTimeShutDown;
    // var endDate = new Date(year, month, day,hour,minute,second);
    var leftTime = endDate.getTime() - now.getTime();
    if (0 >= leftTime) {
      clearInterval(atySecGoodsTimer);

      atyTimeShutDown = { timerDay: "00", timerHour: "00", timerMinute: "00", timerSecond: "00" };
      if (0 == this.data.secListStatus){//未开始变开始
        this.setData({
          atyIsLive: true
        });
        this.setData({
          secListStatus: 1
        });
      } else if (1 == this.data.secListStatus) {//未开始变结束
        this.setData({
          secListStatus: 2
        });
        this.setData({
          atyIsLive: false
        });
      }

      return;
    }
    var dd = util.numAddPreZero(parseInt(leftTime / 1000 / 60 / 60 / 24, 10));//计算剩余的天数
    var hh = util.numAddPreZero(parseInt(leftTime / 1000 / 60 / 60 % 24, 10));//计算剩余的小时数
    var mm = util.numAddPreZero(parseInt(leftTime / 1000 / 60 % 60, 10));//计算剩余的分钟数
    var ss = util.numAddPreZero(parseInt(leftTime / 1000 % 60, 10));//计算剩余的秒数

    atyTimeShutDown = { timerDay1: dd, timerHour1: hh, timerMinute1: mm, timerSecond1: ss };

    this.setData({
      atyTimeShutDown: atyTimeShutDown
    });
    if (0 == this.data.secListStatus){
      this.setData({
        atyIsLive: false
      });
    } else if (1 == this.data.secListStatus){
      this.setData({
        atyIsLive: true
      });
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
    clearInterval(atySecGoodsTimer);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearInterval(atySecGoodsTimer);
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
    let path = "/pages/sbargain/seckillGoods?id=" + this.data.id;
    let buyerName = this.data.curUser.nickName;
    let goodsName = this.data.activity.activityName;
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
    let title = "";
    if (this.data.goodsData.ecExtendObj.wxShareTitle) {
    	title = this.data.goodsData.ecExtendObj.wxShareTitle.replace(/@BN@/g, buyerName).replace(/@GN@/g, goodsName);
    } else {
    	title = this.data.activity.activityName;
    }

    let shareObj = {
      title: title,
      path: path,
      success: function (res) { // 成功
      },
      fail: function (res) { // 失败
      }
    };
    if(imageUrl){
      shareObj.imageUrl = imageUrl;
    }
    return shareObj;
  }
}))
