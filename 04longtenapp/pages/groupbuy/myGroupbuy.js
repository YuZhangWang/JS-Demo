var commonAty = require("../../utils/atycommon.js");
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
    // 判断是否新版团购
    if (data.model.activity.activityType == 11) {
      pageCnt.setData({
        isNewGb: true
      })
    }
    // 判断是否阶梯拼团
    if (data.model.activity.activityType == 12) {
      pageCnt.setData({
        isStepGb: true
      })
    }
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
      imgUrls: extOp.indexSlider.split(","),
      activity: data.model.activity,
      wxShareTitle: extOp.wxShareTitle,
      curUser: data.model.openUser
    });



  }

  myProcess() {
    let pageCnt = this.thatContext;
    pageCnt.setData({
      fromShare: false
    });

    if (pageCnt.options.goodsid) {
      pageCnt.reqAtyingGoodsDetail(pageCnt.options.activityId, pageCnt.options.goodsid, (pageCnt.options.relationId ? 1 : 0), pageCnt.options.relationId)
    }

  }
//
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
    atyStatusTxt: "距离拼团结束",
    atyTimeShutDown: { timerDay: util.numAddPreZero(0), timerHour: util.numAddPreZero(0), timerMinute: util.numAddPreZero(0), timerSecond: util.numAddPreZero(0) },
    showMyOrderPage: false,
    goodsList: [],//商品列表
    activity: {},//拼团信息
    curUser: {},//当前进入页面的用户
    goodsDetailInfo: {},
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    authType:1, //拒绝授权 停留当前页
    theRelationshipDefine: {},//当前的关系定义
    fromShareInfo: {},
    showShareMask: true,
    fromShare: false,
    userInfo: {},
    winWidth: 0,
    winHeight: 0,
    // tab切换
    currentTab: 1,
    atyIsLive: true,
    myOrderListPayed: [],
    OdDetailPage: {},
    myTuanList: [],
    imgUrls: [],
    wxShareTitle: "",
    isShowJoin: false,
    avatorList: {},
    shareQrCodeUrl: "",
    shareType: "",
    cusTxt: {},
    remaintime: 0,
    clock: util.formatDownTime(0),
    status:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu();
    let that = this;
    let myProcess;
    let cusTxt = {
      bgUrl: "bg.jpg",
      indexBuyBtnUrl: "btn_tuan.png",
      bottomLTxt: "所有宝贝",
      bottomRTxt: "我的拼团",
      detailBottomRTxt: "我要开团",
      isCust: false
    }
    if (2152 == mallSite.uid) {
      cusTxt.bgUrl = "cus2152/bg2152.png";
      cusTxt.indexBuyBtnUrl = "cus2152/btn2152.png";
      cusTxt.bottomLTxt = "所有席位";
      cusTxt.bottomRTxt = "我的预约";
      cusTxt.detailBottomRTxt = "一起预约";
      cusTxt.isCust = true;
    }
    that.setData({
      cusTxt: cusTxt
    });
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }

    });
    that.data.options=options;
    if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
      that.setData({
        noAuthInfo:false
      })
    }else {
      that.setData({
        noAuthInfo:true
      })
    }
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      myProcess = new commonAty.CommonProcess(new GroupBuy(that), options, cusmallToken);
      myProcess.init();
      that.myTuanList(options.activityId);
      util.afterPageLoad(that);
    });

    that.setData({
      userInfo: app.globalData.userInfo,
      activityId: options.activityId
    })
  },
  /**
   * 点击tab切换
   */
  swichNav: function (e) {
    var that = this;
    that.setData({
     currentTab: parseInt(e.target.dataset.current)
    })
    that.myTuanList(that.data.activity.id);
  },

  topPageSwitch: function (e) {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    let curTarget = e.currentTarget;
    if (1 == curTarget.dataset.showindex) {//如果进入的是我的拼团
      wx.navigateTo({
        url: `/pages/groupbuy/myGroupbuy?activityId=${that.data.activity.id}`,
      })
    }
    if (0 == curTarget.dataset.showindex) {//如果用点击主页按钮就重置标记
      wx.navigateTo({
        url: `/pages/groupbuy/groupbuyList?activityId=${that.data.activity.id}`,
      })
    }
    wx.hideLoading();
  },

  goToPayOhterBtn: function (e) {//拼团购买
    console.log(e);
    let target = e.currentTarget;
    let atyId = target.dataset.atyid;
    let goodsId = target.dataset.goodsid;
    let reid = target.dataset.reid;
    let type = target.dataset.type;
    wx.redirectTo({
      url: "/pages/groupbuy/groupbuypay?activityId=" + atyId + "&goodsId=" + goodsId + "&buyType=0"
    });


  },
  // 参团列表
  myTuanList: function (id) {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAllJoin',
      data: {
        cusmallToken: cusmallToken,
        activityid: id,
        status: that.data.currentTab==1 ? "" : that.data.currentTab
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let myTuanList = data.model.records;
          if (!myTuanList) {
            myTuanList = [];
          }
          for (let i = 0; i < myTuanList.length; i++) {
            myTuanList[i].award.ecExtend = JSON.parse(myTuanList[i].award.ecExtend);
            myTuanList[i].relationshipDefine.createTime = util.formatTime(new Date(myTuanList[i].relationshipDefine.createTime));
          }
          that.setData({
            myTuanList: myTuanList
          })
        }
      },
      fail: function () {
      },
      complete: function () {
        wx.hideLoading();
      }
    });

  },
  queryTuanDetail: function (e) {
    let that = this;
    let curTarget = e.currentTarget;
    let reid = curTarget.dataset.reid;
    let statu = curTarget.dataset.statu;
    let awardId = curTarget.dataset.awardid;
    wx.navigateTo({
      url: `/pages/groupbuy/groupbuyDetail?activityId=${that.data.activity.id}&goodsid=${awardId}&relationId=${reid}`,
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
