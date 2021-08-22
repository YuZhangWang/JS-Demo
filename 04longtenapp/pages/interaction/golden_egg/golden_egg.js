var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var baseHandle = require("../../template/baseHandle.js");
var inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
var commonAty = require("../../../utils/atycommon.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
var app = getApp();
class GoldenEgg {
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
    hammerAnimationData: {},
    activity: {},
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    awardList: [],
    myAwards: [],
    isShowROA: true,
    isShowRAA: false,
    //currentPage:"winDiv",
    templateName: "golden_eggs"
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
      // 随机笑脸的蛋
      var randomFace = Math.floor(Math.random() * 5);
      wx.showLoading({
        title: '加载中...',
      })
      that.setData({
        randomFace: randomFace
      });
      myProcess = new commonAty.CommonProcess(new GoldenEgg(that), options, cusmallToken);
      myProcess.init();
    });

  },

  handleStartTab: function(e) {

    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    if (!that.data.hasInit){
      return false;
    }
    if (that.data.actuallyTime <= 0) {
      that.alertNoChange();
      return;
    }
    that.setData({
      currentPage: "startGame"
    });
    setTimeout(function () {
      that.setData({
        hideFace: true
      });
      setTimeout(function () {
        // 开始动画
        that.audioCtx = wx.createAudioContext('rotateAudio');
        that.audioCtx.play();
        that.setData({
          liRun: true
        });
        setTimeout(function () {
          // 动画结束
          that.audioCtx.pause();
          that.setData({
            liRun:false,
            hammerClick:true,
            animationEnded: true
          });
        }, 5000);
      }, 300);
    },2000);
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
            prizeAward: prizeAward
          });
          that.audioCtx = wx.createAudioContext('winAudio');
          that.audioCtx.play();
          that.setData({
            currentPage: "winDiv"
          });
          that.setData({
            actuallyTime: that.data.actuallyTime - 1,
            allLimitTime: that.data.allLimitTime - 1
          });
        } else if (data && -201 == data.ret) {
          that.audioCtx = wx.createAudioContext('failAudio');
          that.audioCtx.play();
          that.setData({
            currentPage: "failDiv"
          });
          that.setData({
            actuallyTime: that.data.actuallyTime - 1,
            allLimitTime: that.data.allLimitTime - 1
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


  handleEggTab:function(e){
    var that = this;
    var selectedEggIndex = e.target.dataset.id;
    var pX = 0, pY = 0;
    // 获取点击位置
    if (e.touches) {
      pX = e.touches[0].pageX;
      pY = e.touches[0].pageY;
    }
    console.log(e);
    if (that.data.hammerClick){
      that.setData({
        hammerClick: false,
        selectedEggIndex: selectedEggIndex
      });
      var animation = wx.createAnimation({
        duration: 300,
        timingFunction: 'ease',
      })

      that.animation = animation

      animation.left(pX-35).top(pY-40).step();

      that.setData({
        eggClick:true,
        hammerAnimationData: animation.export()
      })
      setTimeout(function(){
        that.audioCtx = wx.createAudioContext('zaAudio');
        that.audioCtx.play();
        that.setData({
          showEggResult: true
        })
        setTimeout(function(){
          that.doLottery();
        },1200)
      },1000)

    }
  },

  playMusic: function(t){

  },

  playAgain: function() {
    let that = this;
    if (that.data.actuallyTime > 0) {
      that.setData({
        currentPage: "startGame",
        hammerClick:true,
        eggClick:false,
        showEggResult:false
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
    let title = "金蛋中飙出来了1个...你要不要看一下";
    let path = "/pages/interaction/golden_egg/golden_egg?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
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
