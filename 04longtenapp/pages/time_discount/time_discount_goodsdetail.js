// pages/time_discount/time_discount_goodsdetail.js

var commonAty = require("../../utils/atycommon.js");
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var Zan = require('../../youzan/dist/index');
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var commHandle = require("../template/commHandle.js");
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
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
      curUser: data.model.openUser,
      id: pageCnt.options.goodsid
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
      atyTimer = setInterval(function() {
        pageCnt.showCountDown(new Date(data.model.activity.startTime), new Date(data.model.activity.endTime), this);
      }, 1000);
    }

  }

  myProcess() {
    let pageCnt = this.thatContext;
    pageCnt.setData({
      fromShare: false
    });

    if (pageCnt.options.goodsid) {
      pageCnt.fetchCount();
      pageCnt.reqAtyingGoodsDetail(pageCnt.options.activityId, pageCnt.options.goodsid);
    }

  }

}
Page(Object.assign({}, baseHandle, commHandle, goodsDetailHandle, Zan.Toast, {

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
    mustKnowPage: true, //活动规则
    showSharePage: false, //分享
    isTxtShare: true,
    categoryContClass: "",
    atyStatusTxt: "距离结束还剩",
    atyTimeShutDown: {
      timerDay: util.numAddPreZero(0),
      timerHour: util.numAddPreZero(0),
      timerMinute: util.numAddPreZero(0),
      timerSecond: util.numAddPreZero(0)
    },
    showMyOrderPage: false,
    goodsList: [], //商品列表
    activity: {}, //活动信息
    curUser: {}, //当前进入页面的用户
    goodsDetailInfo: {},
    theRelationshipDefine: {}, //当前的关系定义
    fromShareInfo: {},
    showShareMask: true,
    fromShare: false,
    userInfo: {},
    winWidth: 0,
    winHeight: 0,
    imgUrls: [],
    shareQrCodeUrl: "",
    categoryContClass: "",
    isDetailPage: true,
    shareType: "",
    remaintime: 0,
    clock: util.formatDownTime(0),
    totalBuyCount: 1,
    isDone: false, //加载是否完成
    source: 2
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    let myProcess;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }

    });
    that.setData({
      userInfo: app.globalData.userInfo,
      activityId: options.activityId
    })
    app.getUserInfo(this, options, function(userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      myProcess = new commonAty.CommonProcess(new GroupBuy(that), options, cusmallToken);
      myProcess.init();
      util.afterPageLoad(that);
    });


  },
  // 购买数量
  bindCountInput: function(e) {
    this.setData({
      totalBuyCount: e.detail.value
    })
  },
  // 分享
  hideShareMasks: function() {
    let that = this;
    that.setData({
      showShareMask: true
    })
  },
  showShareMasks: function() {
    let that = this;
    that.setData({
      showShareMask: false
    })
  },
  /**
   * 计算商品详情页默认banner高度
   */
  onMainBannerImgLoad: function(e) {
    var that = this;
    var w = e.detail.width;
    var h = e.detail.height;
    var bannerHeight = (h / w) * 750;
    if (that.data.mainBannerHeight != bannerHeight) {
      that.data.mainBannerHeight = bannerHeight;
      that.setData({
        mainBannerHeight: that.data.mainBannerHeight
      });
    }
  },
  // 生成海报
  shareByQRCode: function() {
    wx.showLoading({
      title: '加载中',
    });
    //拿qrcode链接
    let that = this;
    let theReDe = that.data.openUser;
    let scene = {};
    let goodsDetailInfo = that.data.goodsDetailInfo;
    scene.goodsid = that.data.goodsDetailInfo.id
    let page = "pages/time_discount/time_discount_goodsdetail";
    let qrcodeUrl = cf.config.pageDomain + "/mobile/base/activity/getQrcode.do?page=" + page + "&activityid=" + that.data.activity.id + "&scene=" + JSON.stringify(scene)
    //拿qrcode链接
    let context = wx.createCanvasContext("canvasGB")
    let scrWidth, scrHeight;
    wx.getSystemInfo({
      success: function(res) {
        scrWidth = res.screenWidth;
        scrHeight = res.screenHeight;
      }
    });
    let drawWidth = scrWidth * 1.4;
    let drawHeight = drawWidth * 100 / 66;
    let unit = drawWidth / 20.5;
    if (goodsDetailInfo.timeDiscountGoodsAward.goods.name.length >= 17) {
      goodsDetailInfo.timeDiscountGoodsAward.goods.name = goodsDetailInfo.awardName.substring(0, 17) + "...";
    }
    let drawBackground
    console.log(goodsDetailInfo)
    if (that.data.Poster_bg) {
      drawBackground = that.data.swtichImg + that.data.userImagePath + that.data.Poster_bg
    } else {
      drawBackground = that.data.swtichImg + that.data.staticResPathTuan + "tuan-bg.png"
    }
    let drawEle = [{
        type: "img",
        url: drawBackground,
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight
      },

      {
        type: "img",
        url: that.data.swtichImg + that.data.staticResPathTuan + "tuan-bg2.png",
        x: unit,
        y: unit * 1.2,
        width: drawWidth * 0.90,
        height: drawHeight * 0.92
      },

      {
        type: "img",
        url: that.data.swtichImg + that.data.userImagePath + goodsDetailInfo.awardPic,
        x: unit * 1.8,
        y: unit * 2.0,
        width: drawWidth * 0.82,
        height: unit * 15
      },

      {
        type: "txt",
        color: "#2d2d2d",
        text: goodsDetailInfo.timeDiscountGoodsAward.goods.name,
        fontSize: unit * 1,
        x: unit * 1.8,
        y: unit * 19.05,
      },
      {
        type: "txt",
        color: "#ff2d2d",
        text: that.data.app.globalData.currencySymbol,
        fontSize: unit * 1,
        x: unit * 1.8,
        y: unit * 21.25,
      },
      {
        type: "txt",
        color: "#ff2d2d",
        text: ((goodsDetailInfo.timeDiscountGoodsAward.discountPrice) / 100).toFixed(2),
        fontSize: unit * 1.5,
        x: unit * 2.72,
        y: unit * 21.25,
      },
      {
        type: "img",
        url: that.data.swtichImg + that.data.staticResPathTuan + "price-bg.png",
        x: unit * 6.96,
        y: unit * 20.25,
        width: 92,
        height: 32
      },
      {
        type: "txt",
        color: "#ffffff",
        text: "限时价",
        fontSize: unit * 0.8,
        x: unit * 7.60,
        y: unit * 21.14,
      },
      {
        type: "txt",
        color: "#747474",
        text: that.data.app.globalData.currencySymbol + (goodsDetailInfo.timeDiscountGoodsAward.salePrice / 100).toFixed(2),
        fontSize: unit * 1,
        x: unit * 11.08,
        y: unit * 21.25,
      },
      {
        type: "deleteLine",
        color: "#747474",
        x: 11.2 * unit,
        y: 20.88 * unit,
        toX: unit * 14.00,
        toY: 20.88 * unit
      },

      {
        type: "imgCircle",
        url: util.tinyWxHeadImg(theReDe.headimgurl),
        x: unit * 1.8,
        y: unit * 23.7,
        width: unit * 1.5,
        height: unit * 1.5
      },
      {
        type: "txt",
        color: "#414141",
        text: theReDe.nickName,
        fontSize: unit * 0.8,
        x: unit * 3.7,
        y: unit * 24.76
      },
      {
        type: "img",
        url: that.data.swtichImg + that.data.staticResPathTuan + "pop-text.png",
        x: unit * 1.50,
        y: unit * 25.6,
        width: unit * 10.11,
        height: unit * 3.4
      },
      {
        type: "txt",
        color: "#414141",
        text: "活动时间有限，",
        fontSize: unit * 0.9,
        x: unit * 2.5,
        y: unit * 27.00
      },
      {
        type: "txt",
        color: "#414141",
        text: "立即扫码购买吧",
        fontSize: unit * 0.9,
        x: unit * 2.5,
        y: unit * 28.42
      },
      {
        type: "base64Img",
        url: qrcodeUrl,
        x: unit * 13.45,
        y: unit * 24.0,
        width: unit * 4.7,
        height: unit * 4.7
      }
    ]
    let callback = function() {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight,
        destWidth: drawWidth * 3,
        destHeight: drawHeight * 3,
        canvasId: "canvasGB",
        success: function(res) {
          that.setData({
            shareQrCodeUrl: res.tempFilePath
          });
          wx.previewImage({
            current: res.tempFilePath, // 当前显示图片的http链接
            urls: [res.tempFilePath] // 需要预览的图片http链接列表
          });
          wx.hideLoading();
        },
        fail: function(e) {
          wx.hideLoading();
          wx.showToast({
            title: e.errMsg,
            icon: 'fail',
            duration: 2000
          })
        }
      });
    }
    console.log(drawEle)
    util.drawPoster(context, drawEle, drawWidth, drawHeight, callback);
  },

  toJudgeListAty: function () {
    wx.navigateTo({
      url: '/pages/judge/judgeList?source=2&goodsId=' + this.data.id
    })
  },

  // 活动详情
  reqAtyingGoodsDetail: function(activityid, awardsTypeId, cb) {
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    let fromShare = that.data.fromShare;
    let atyIsLive = that.data.atyIsLive;
    wx.request({
      url: cf.config.pageDomain + '/mobile/activity/time_discount/selectGoodsAward',
      data: {
        cusmallToken: cusmallToken,
        activityId: activityid,
        awardId: awardsTypeId,

      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let goodsDetailInfo = data.model.award;
          let goodsSlider = goodsDetailInfo.timeDiscountGoodsAward.goods.pics.split(",");
          let ecExtendObj = JSON.parse(goodsDetailInfo.ecExtend);
          let currentTime = new Date().getTime();
          let members;
          let poster_bg = JSON.parse(data.model.activity.extendOperation);
          let posterBg = poster_bg.poster_type == 1 ? poster_bg.poster_bg : '';
          let goodsData = data.model.award.timeDiscountGoodsAward.goods;

          if (currentTime - goodsDetailInfo.validityStart < 0) {
            goodsDetailInfo.validityStatus = 1 //等待尾款支付
          } else if ((currentTime - goodsDetailInfo.validityStart) > 0 && goodsDetailInfo.validityStop - currentTime > 0) {
            goodsDetailInfo.validityStatus = 2 //支付尾款
          } else {
            goodsDetailInfo.validityStatus = 3 //
          }

          for (let key in ecExtendObj) {
            goodsDetailInfo[key] = ecExtendObj[key];
          }
          goodsDetailInfo.goodsSlider = goodsSlider;
          let decorationData = JSON.parse(goodsDetailInfo.timeDiscountGoodsAward.goods.decoration);
          util.processDecorationData(decorationData, that);
          if (goodsData.usenewspec) {
            var specData = JSON.parse(goodsData.spec);
            that.setData({
              "specData": specData
            });
            if (goodsData.specJsonArray.length > 1) {
              var ids = specData[0].ids.split(',');
              for (let i = 0; i < goodsData.specJsonArray.length; i++) {
                goodsData.specJsonArray[i].selectedId = ids[i];
              }
            } else {
              goodsData.specJsonArray[0].selectedId = goodsData.specJsonArray[0].ids;
            }

            that.setData({
              "specList": goodsData.specJsonArray
            });
            goodsData.selectedSku = specData[0];
          }

          that.setData({
            Poster_bg: posterBg,
            goodsDetailInfo: goodsDetailInfo,
            decoration: decorationData,
            goodsData: goodsData
          });
          cb && cb();
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg,
          })
        }

      },
      fail: function() {
        wx.hideLoading();
      },
      complete: function() {
        wx.hideLoading();
        that.setData({
          isDone: true
        })

      }
    });
  },
  // 添加数量
  addPreCount: function() {
    var that = this;
    var inventory = that.data.goodsDetailInfo.limitBuy;
    if (inventory < 0 ) {
      var totalBuyCount = ++that.data.totalBuyCount;
      that.setData({
        totalBuyCount: totalBuyCount
      });
    } else if (inventory > 0 && that.data.totalBuyCount < inventory) {
      var totalBuyCount = ++that.data.totalBuyCount;
      that.setData({
        totalBuyCount: totalBuyCount
      });
      
    } else {
      wx.showModal({
        content: '不能超过限购数量' + inventory,
        showCancel: false,
      })
    }
  },
  // 减少购买数量
  minusPreCount: function() {
    var that = this;
    if (that.data.totalBuyCount > 1) {
      var totalBuyCount = --that.data.totalBuyCount;
      that.setData({
        totalBuyCount: totalBuyCount
      });
    }
  },
  onBuyDiscount: function() {
    var that = this;
    if (!this.checkUserInfo()) {
      return false;
    }
    that.setData({
      categoryContClass: "step2 onByNow"
    });
  },
  onBuyNowDiscount: function() {
    var that = this;
    var specRelationId = that.data.goodsData.selectedSku ? that.data.goodsData.selectedSku.specRelationId : '';
    wx.redirectTo({
      url: "/pages/time_discount/time_discount_order?activityId=" + that.data.activity.id + "&goodsId=" + that.data.goodsDetailInfo.id + "&buyType=0&totalBuyCount=" + that.data.totalBuyCount + "&specRelationId=" + specRelationId
    });
  },





  hideShareActPage: function() {
    let that = this;
    that.setData({
      showSharePage: false
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

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

  },
  share1: function() {},
  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {
    let that = this;
    let shareObj = {};
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : ""
    let goodsName = '我发现了一件好货:' + that.data.goodsDetailInfo.awardName || that.data.goodsList[0].awardName;
    let title = "";
    shareObj = {
      title: goodsName,
      path: "/pages/time_discount/time_discount_goodsdetail?activityId=" + that.data.activityId + "&goodsid=" + that.data.goodsDetailInfo.id,
      success: function(res) { // 成功
      },
      fail: function(res) { // 失败
      }
    };
    if (imageUrl) {
      shareObj.imageUrl = imageUrl;
    }
    return shareObj;
  }
}))