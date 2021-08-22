// pages/time_discount/time_discount_goodslist.js
// pages/presales/presales.js
var commonAty = require("../../utils/atycommon.js");
// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var Zan = require('../../youzan/dist/index');
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var atyTimer;


class GroupBuy {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }

  initProcess(data) {
    let pageCnt = this.thatContext;
    let goodsList = data.model.awardList;
    for (let i = 0; i < goodsList.length; i++) {
      let ecExtendObj = JSON.parse(goodsList[i].ecExtend);
      for (let key in ecExtendObj) {
        goodsList[i][key] = ecExtendObj[key]
      }
    }
    wx.setNavigationBarTitle({
      title: data.model.activity.activityName
    });
    let extOp = JSON.parse(data.model.activity.extendOperation);
    pageCnt.setData({
      goodsList: goodsList,
      shareType: data.model.activityRule.shareType,
      isShowJoin: (data.model.activity.extraData & (Math.pow(2, 0))) != 0 ? true : false,
      activity: data.model.activity,
      imgUrls: extOp.indexSlider.split(","),
      wxShareTitle: extOp.wxShareTitle,
      curUser: data.model.openUser
    });
    let nowTime = new Date().getTime();
    let startTime = data.model.activity.endTime;
    let endTime = data.model.activity.startTime;
    if ((0 < endTime - nowTime) && (0 > startTime - nowTime)) {
      pageCnt.setData({
        atyIsLive: true
      });
    }
    if (2 == data.model.activity.status || 3 == data.model.activity.status || 4 == data.model.activity.status) {
      pageCnt.setData({
        atyStatusTxt: "活动结束"
      });
      pageCnt.setData({
        atyIsLive: false
      });
    } else {
      atyTimer = setInterval(function () { pageCnt.showCountDown(new Date(data.model.activity.startTime), new Date(data.model.activity.endTime), this); }, 1000);
    }

  }

  myProcess() {
    let pageCnt = this.thatContext;
    pageCnt.setData({
      fromShare: false
    });
    if (pageCnt.options.orderNo) {//如果是从支付页面跳回来的 可以直接进入订单详情页面
      pageCnt.queryPayOrder(pageCnt.options.activityId, pageCnt.options.orderNo)

    } else {
      pageCnt.setData({
        showPageArr: [false, true, true, true, true, true]
      });
    }
    if (pageCnt.options.goodsid) {
      pageCnt.reqAtyingGoodsDetail(pageCnt.options.activityId, pageCnt.options.goodsid, (pageCnt.options.relationId ? 1 : 0), pageCnt.options.relationId)
    }

  }

  ohterPeopleProcess() {
    let pageCnt = this.thatContext;
    let fSInfo = pageCnt.data.fromShareInfo
    pageCnt.setData({
      fromShare: true
    });
    pageCnt.reqAtyingGoodsDetail(fSInfo.activityId, "", 1, fSInfo.relationId)
  }
}

Page(Object.assign({}, baseHandle, Zan.Toast, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    staticResPathTuan: cf.config.staticResPath + "/youdian/image/mobile/tuan/",
    staticResPathBargain: cf.config.staticResPath + "/youdian/image/mobile/s_bargain/",
    swtichImg: cf.config.pageDomain + "/mobile/base/activity/pathToData.do?fileUrl=",
    goodsList: [],//商品列表
    activity: {},//活动信息
    curUser: {},//当前进入页面的用户
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    authType: 1, //拒绝授权 停留当前页
    userInfo: {},
    winWidth: 0,
    winHeight: 0,
    isDone:false,
    // tab切换
    currentTab: 0,
    atyIsLive: true,
    imgUrls: [],
    isShowJoin: false,
    shareType: "",

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    wx.showLoading({
      title: '加载中...',
    })
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }

    });
    that.data.options = options;
    if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
      that.setData({
        noAuthInfo: false
      })
    } else {
      that.setData({
        noAuthInfo: true
      })
    }
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      myProcess = new commonAty.CommonProcess(new GroupBuy(that), options, cusmallToken);
      myProcess.init();
      util.afterPageLoad(that);
      
    });

    that.setData({
      userInfo: app.globalData.userInfo,
      activityId: options.activityId
    })
  },
  /**
* 计算商品详情页默认banner高度
*/
  onMainBannerImgLoad: function (e) {
    var that = this;
    var w = e.detail.width;
    var h = e.detail.height;
    var bannerHeight = (h / w) * 750;
    if (that.data.mainBannerHeight != bannerHeight) {
      that.data.mainBannerHeight = bannerHeight;
      that.setData({ mainBannerHeight: that.data.mainBannerHeight });
    }
  },
  // 活动结束时间
  showCountDown: function (startDate, endDate, that) {
    var now = new Date();
    let atyTimeShutDown;
    var leftTime = 0;
    if (startDate.getTime() - now.getTime() > 0) {
      leftTime = startDate.getTime() - now.getTime();
      this.setData({
        atyStatusTxt: "距开始",
        atyIsLive: false
      });
    } else if ((startDate.getTime() - now.getTime() < 0) && (endDate.getTime() - now.getTime() > 0)) {
      leftTime = endDate.getTime() - now.getTime();
      this.setData({
        atyStatusTxt: "距结束",
        atyIsLive: true
      });

    }
    if (0 >= leftTime) {
      clearInterval(atyTimer);
      atyTimeShutDown = { timerDay: util.numAddPreZero(0), timerHour: util.numAddPreZero(0), timerMinute: util.numAddPreZero(0), timerSecond: util.numAddPreZero(0) };
      this.setData({
        atyStatusTxt: "活动结束"
      });
      this.setData({
        atyIsLive: false
      });
      return;
    }
    var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10);//计算剩余的天数
    var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10);//计算剩余的小时数
    var mm = parseInt(leftTime / 1000 / 60 % 60, 10);//计算剩余的分钟数
    var ss = parseInt(leftTime / 1000 % 60, 10);//计算剩余的秒数

    atyTimeShutDown = { timerDay: util.numAddPreZero(dd), timerHour: util.numAddPreZero(hh), timerMinute: util.numAddPreZero(mm), timerSecond: util.numAddPreZero(ss) };

    this.setData({
      atyTimeShutDown: atyTimeShutDown
    });

  },
  
  // 活动详情
  goodsDetailPage: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    let curTarget = e.currentTarget;
    let goodsid = curTarget.dataset.goodsid;
    wx.navigateTo({
      url: `/pages/time_discount/time_discount_goodsdetail?activityId=${that.data.activity.id}&goodsid=${goodsid}`
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
    let that = this;
    let theReDe = that.data.theRelationshipDefine;
    let shareObj = {};
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
    let fromShareInfo = that.data.fromShareInfo;
    let buyerName = that.data.curUser.nickName;
    let goodsName = that.data.goodsList[0].awardName;
    let title = "";
    if (that.data.wxShareTitle) {
      title = that.data.wxShareTitle.replace(/@BN@/g, buyerName).replace(/@GN@/g, goodsName);
    }
    
      shareObj = {
        title: title || that.data.activity.activityName,
        path: "/pages/time_discount/time_discount_goodslist?activityId=" + that.data.activityId,
        imageUrl: imageUrl,
        success: function (res) {
        },
        fail: function (res) { // 失败
        }
      };
   
    return shareObj;
  
  }
}))
