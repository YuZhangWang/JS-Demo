var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var baseHandle = require("../../template/baseHandle.js");
var inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
var commonAty = require("../../../utils/atycommon.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
import Scratch from "scratch.js"
//获取应用实例
var app = getApp();
class Guaguaka {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }

  initProcess(data) {
    let cxt = this.thatContext;
    wx.showLoading({
      title: '加载中...',
    })
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
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    youyuResPath: cf.config.staticResPath + "image/mobile/aty/",
    activity: {},
    needUserInfo: true,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    coverImg:true,
    awardList: [],
    myAwards: [],
    activityAwardRecords:[],
    isShowROA: true,
    isShowRAA: false,
    isStart: true,
    txt: "开始刮奖",
    myPrizeTxt:">>我的奖品<<",
    //currentPage:"winDiv",
    templateName: "guaguaka",
    awardStatus:false  //奖品弹出框状态
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    console.log(options)
    let sysInfo = wx.getSystemInfoSync();
    let ratio = sysInfo.windowWidth/375;
    that.setData({
      activityId: options.activityId
    });
    that.scratch = new Scratch(that, {
      canvasWidth: 302*ratio,
      canvasHeight: 156*ratio,
      imageResource: './images/gua.jpg',
      maskColor: "red",
      r: 6,
      callback: () => {
        // wx.showModal({
        //   title: '提示',
        //   content: `您中奖了`,
        //   showCancel: false,
        //   success: (res) => {
        //     this.scratch.reset()
        //     if (res.confirm) {
        //       console.log('用户点击确定')
        //     } else if (res.cancel) {
        //       console.log('用户点击取消')
        //     }
        //   }
        // })

        that.setData({
          hideScratch:true
        })
      }
    })

    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      if (app.globalData.userInfo) {
        that.setData({
          noAuthInfo:false
        })
      }else {
        that.setData({
          noAuthInfo:true
        })
      }
      wx.showLoading({
        title: '加载中...',
      })
      myProcess = new commonAty.CommonProcess(new Guaguaka(that), options, cusmallToken);
      myProcess.init();
      that.queryActivityAwardRecords(options.activityId);
    });

  },

  onCloseraa(e){
    this.setData({
      awardStatus:false
    })
  },
  /**
   * 抽奖接口
   */
  doLottery() {
    let that = this;
    // wx.showLoading({
    //   title: '加载中...',
    // })
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
            showPrizeResult: true,
            actuallyTime: that.data.actuallyTime - 1
          });
        } else if (data && -201 == data.ret) {
          that.setData({
            playMsg: "没中呢,再接再厉哦",
            playDesc: "换个姿势,快来啊",
            haveGift: false,
            showPrizeResult: true,
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


  /**
   * 查询中奖列表
   */
  queryActivityAwardRecords() {
    let that = this;
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/queryAwardRecordsByAid',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activityId,
        start: that.data.activityAwardRecords.length,
        limit:10
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          if (data.model.awardRecords.results != null){
            that.data.activityAwardRecords = that.data.activityAwardRecords.concat(data.model.awardRecords.results);
            that.setData({
              activityAwardRecords: that.data.activityAwardRecords
            })
            if (data.model.awardRecords.results.length > 0 && that.data.activityAwardRecords.length < data.model.total){
              that.setData({
                showMoreAwardRecord:true
              })
            } else {
              that.setData({
                showMoreAwardRecord:false
              })
            }
          }
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
    this.scratch.start();
    wx.hideLoading();
  },

  playAgain: function () {
    let that = this;
    that.setData({
      isShow: false
    });
    if (that.data.actuallyTime > 0) {
      that.setData({
        isShow: false,
        haveGift: false,
        showPrizeResult:false,
        hasDoLottery:false,
        hideScratch:false
      });
      that.scratch.reset();
      that.scratch.restart();
    } else {
      that.alertNoChange();
    }

  },

  touchStart(e) {

  },

  touchMove (e) {

  },

  touchEnd (e) {

  },

  reset () {
    this.scratch.init()
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
    let title = userInfo.nickName + "在活动中即将问鼎大奖，你敢挑战Ta吗？丰厚奖品等着你哦！";
    let path = "/pages/interaction/guaguaka/guaguaka?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
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
