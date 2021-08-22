var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var baseHandle = require("../../template/baseHandle.js");
var inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
var commonAty = require("../../../utils/atycommon.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
var app = getApp();
class NewShakeRedpack {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }

  initProcess(data) {
    let cxt = this.thatContext;
    cxt.queryLotteryChance();
  }


  myProcess() {


  }

  ohterPeopleProcess() {
  }
}
Page(Object.assign({}, baseHandle, inteBaseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    youyuResPath: cf.config.staticResPath + "image/mobile/aty/",
    activity: {},
    awardList: [],
    myAwards: [],
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    isShowROA: true,
    isShowRAA: false,
    //currentPage:"winDiv",
    templateName: "newshakeredpack"
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    var sysInfo = wx.getSystemInfoSync();
    var coinsWrapHeight = (sysInfo.windowHeight*0.4).toFixed(2);
    that.setData({
      sysInfo: sysInfo,
      coinsWrapHeight: coinsWrapHeight
    })
    that.deviceShakeHandle();
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      wx.showLoading({
        title: '加载中...',
      })
      myProcess = new commonAty.CommonProcess(new NewShakeRedpack(that), options, cusmallToken);
      myProcess.init();
    });

  },
  deviceShakeHandle:function(){
    var that = this;
    var shakeThreshold = 80
    var lastX = 0
    var lastY = 0
    var lastZ = 0
    var lastUpdate = 0
    wx.onAccelerometerChange(function (res) {
      let curTime = new Date().getTime()
      if ((curTime - lastUpdate) > 100) {
        let curX = res.x
        let curY = res.y
        let curZ = res.z
        let speed = Math.abs(curX + curY + curZ - lastX - lastY - lastZ) / (curTime - lastUpdate) * 10000
        if (speed > shakeThreshold && that.data.isShakeable) {
          that.handleShake()
        }
        lastUpdate = curTime
        lastX = curX
        lastY = curY
        lastZ = curZ
      }
    })


  },

  // 金币掉落
  dropCoins : function(){
    var that = this,
    cHeight = that.data.coinsWrapHeight,
    cWidth = that.data.sysInfo.windowWidth,
    ctx = wx.createCanvasContext("coins_canvas"),
    duration = 6200,	//
    genCoinDuration = 5200,	//
    g = 9.8 * 70;	// 重力
    // 基本配置
    var imgWidth = 35;
    var imgHeight = 49;
    // 显示金币区域
    that.setData({
      showDrapCoins:true
    })
    var coinsPos = [];
    var genCoinsInterval = setInterval(function () {
      var number = parseInt(Math.random() * 5);

      var startTime = new Date().getTime();

      for (var i = 0; i < number; i++) {
        coinsPos.push({
          x: Math.random() * (cWidth - imgWidth / 2),
          y: -imgHeight,
          width: imgWidth * 0.6,
          // path: cf.config.pageDomain +"/mobile/base/activity/pathToData.do?fileUrl=http%3A%2F%2Fres.xcx.weijuju.com%2Fimage%2Fmobile%2Faty%2Fgamepage%2Fnewshakeredpack%2Fmoney.png",
          path:"../../../images/money.png",
          height: imgHeight * 0.6,
          startTime: startTime
        });
      }
    }, 100);
    setTimeout(function () {
      clearInterval(genCoinsInterval);
    }, genCoinDuration);

    var render = function () {
      //var canvas = ctx.canvas;
      ctx.clearRect(0, 0, cWidth, cHeight);

      var now = new Date().getTime();
      var item;
      for (var i = 0; item = coinsPos[i]; i++) {
        if (item.y > cHeight + imgHeight) {
          //移除界面外元素
          coinsPos.splice(i, 1);
        } else {
          item.y = g * Math.pow((now - item.startTime) / 1000, 2) / 2 - imgHeight;
          ctx.drawImage(coinsPos[i].path, item.x, item.y, coinsPos[i].width, coinsPos[i].height);
        }
      }
      ctx.draw();
    };
    var interval = setInterval(render, 6000 / 60);
    // 动画结束
    setTimeout(function () {
      if (interval) {
        clearInterval(interval);
      }
      interval = null;
      that.setData({
        showDrapCoins: false
      })
      that.doLottery();
    }, duration);


  },
  afterQueryLotteryChance: function (e) {

    this.setData({
      isShakeable: true
    });
  },
  handleShake: function() {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    if (!that.data.isShakeable) {
      return false;
    }
    if (that.data.actuallyTime <= 0) {
      that.alertNoChange();
      return;
    }
    that.data.isShakeable = false;
    that.audioCtx = wx.createAudioContext('coinAudio');
    that.audioCtx.play();
    that.dropCoins();
  },

  playAgain: function () {
    let that = this;
    that.setData({
      isShow: false
    });
    if (that.data.haveGift) {
      that.showAward();
    }
    if (that.data.actuallyTime > 0) {
      that.setData({
        haveGift: false,
        isShow: false,
        isShakeable: true
      });
    } else {
      that.alertNoChange();
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
    let that = this;
    let userInfo = wx.getStorageSync('userInfo');
    let mallSite = wx.getStorageSync('mallSite');
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
    let title = "摇一摇，真的会掉钱哦～";
    let path = "/pages/interaction/shake_tree/shake_tree?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
    let shareObj = {
      title: title,
      path: path,
      imageUrl: imageUrl,
      success: function (res) {
        // 成功
        that.statShareNum(that.data.activity.id);
      },
      fail: function (res) {
        // 失败
      }
    };

    return shareObj;
  }
}))
