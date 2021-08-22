var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var baseHandle = require("../../template/baseHandle.js");
var inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
var commonAty = require("../../../utils/atycommon.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
var app = getApp();
class XiuyixiuRedpack {
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
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    activity: {},
    awardList: [],
    myAwards: [],
    isShowROA: true,
    isShowRAA: false,
    //currentPage:"winDiv",
    templateName: "xiuyixiu"
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      wx.showLoading({
        title: '加载中...',
      })
      myProcess = new commonAty.CommonProcess(new XiuyixiuRedpack(that), options, cusmallToken);
      myProcess.init();
    });

  },


  /**
   * 抽奖接口
   */
  doLottery() {
    let that = this;
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/doLottery',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity && that.data.activity.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        let awardList = that.data.orgAwardList;
        let prizeAward;
        if (data && 0 == data.ret) {

          let awardId = data.model.award.id;
          for (let i = 0; i < awardList.length; i++) {
            if (awardList[i].id == awardId) {
              prizeAward = awardList[i];
              break;
            }
          }
          that.setData({
            prizeAward: prizeAward,
            playMsg: prizeAward.trophyName,
            playDesc: prizeAward.awardName,
            haveGift: true,
            isShow: true,
            actuallyTime: that.data.actuallyTime - 1
          });
        } else if (data && -201 == data.ret) {
          that.setData({
            playMsg: "没中呢,再接再厉哦",
            playDesc: "换个姿势,快来啊",
            haveGift: false,
            isShow: true,
            actuallyTime: that.data.actuallyTime - 1
          });
        } else {
          wx.showModal({
            showCancel: false,
            content: data.msg
          });
        }
      },
      fail: function () {
        wx.showModal({
          showCancel: false,
          content: "服务器开小差，稍后再试哦~"
        });
      },
      complete: function () {
      }
    });
  },

  afterQueryLotteryChance: function (e) {
    this.setData({
      isShakeable: true
    });
  },
  handleXiuyixiu: function () {

    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    that.audioCtx = wx.createAudioContext('xiuyixiuAudio');
    that.audioCtx.play();
    that.setData({
      startXiuyixiu:true
    })
    if (that.data.actuallyTime <= 0) {
      that.alertNoChange();
      return;
    }
    if (!that.data.isShakeable) {
      return false;
    }
    that.data.isShakeable = false;
    setTimeout(function(){
      that.doLottery();
    },5000);
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
        isShow: false,
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
    let title = "咻一咻，请惊喜，礼包等着你";
    let path = "/pages/interaction/xiuyixiu/xiuyixiu?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
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
