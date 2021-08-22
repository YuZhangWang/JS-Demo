var commonAty = require("../../../utils/atycommon.js");
// detail.js
var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../../template/baseHandle.js");
var inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
import Wheel from "./wheelTpl.js"
class SBargain {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }

  initProcess(data) {
    let cxt = this.thatContext;
    let awardList = data.model.awardList;
    let needLen = cxt.fixImageSuffix(awardList.length);
    let missLen = needLen - awardList.length;//需要的谢谢参与次数
    let aMissLen = 0;//计数器
    let mAwardList = new Array();
    let j = 0;
    for(let i = 0; i < needLen; i++){
      if (0 == i % 2 && j < awardList.length){
        mAwardList.push(awardList[j++]);
      }else{
        if (aMissLen < missLen){
          mAwardList.push({
            awardName: "谢谢参与",
            isEmpty: true,
            id: -1
          });
          aMissLen++;
        }else{
          mAwardList.push(awardList[j++]);
        }

      }
    }
    cxt.wheel = new Wheel(cxt, {
      areaNumber: needLen,
      speed: 16,
      awardNumer: 2,
      mode: 2,
      callback: () => {
        cxt.setData({
          isShow: true
        });

        cxt.wheelAudioPause();
      }
    });
    cxt.setData({
      awardList: mAwardList
    });
    cxt.queryLotteryChance();
  }


  myProcess() {


  }

  ohterPeopleProcess() {
  }
}

// pages/sbargain/sbargain.js
Page(Object.assign({}, baseHandle, inteBaseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    wheelStaticRes: cf.config.staticResPath +"image/mobile/aty/wheel/",
    activity:{},
    awardList:[],
    myAwards:[],
    wheelBGsuffix:"",
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    lotteryMsg:"",
    isShow:false,
    isShowROA:true,
    haveGift: false,
    isShowRAA:false,
    flashDotHid:[false, true, true],
    showStatus:"0,0"

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
      mallSiteId = wx.getStorageSync('mallSiteId');
      myProcess = new commonAty.CommonProcess(new SBargain(that), options, cusmallToken);
      myProcess.init();

      that.setData({
        userInfo: app.globalData.userInfo
      });
    });

    this.fixImageSuffix(this.data.awardList.length);

    let mTimer = setInterval(function(){
      let mark = 0;
      let flashDotHid = that.data.flashDotHid;
      for(let i = 0; i < 3; i++){
        flashDotHid[i] == false ? mark = (i + 1)%3: "";
        flashDotHid[i] = true;
      }
      flashDotHid[mark] =  false;
      that.setData({
        flashDotHid: flashDotHid
      })
    },200);
    this.setData({
      loopLight: mTimer
    })
    this.btnAudio = wx.createAudioContext('btnAudio');
    this.wheelAudio = wx.createAudioContext('wheelAudio');
  },

  /**
   * 抽奖接口
   */
  doLottery(){
    let that = this;
    that.btnAudioPlay();
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
        let data = res.data;
        let awardList = that.data.awardList;
        let awardNum;
        if (data && 0 == data.ret) {
          let awardId = data.model.award.id;
          for (let i = 0; i < awardList.length; i++){
            if (awardList[i].id == awardId){
              awardNum = i + 1;
              break;
            }
          }
          that.setData({
            playMsg: awardList[awardNum - 1].trophyName
          });
          that.setData({
            playDesc: awardList[awardNum - 1].awardName
          });
          that.setData({
            haveGift: true
          });
          that.setData({
            actuallyTime: that.data.actuallyTime - 1,
            allLimitTime: that.data.allLimitTime - 1
          });
        }else if(data && -201 == data.ret){
          awardNum = 2;
          that.setData({
            playMsg:"没中呢,再接再厉哦"
          });
          that.setData({
            playDesc: "换个姿势,快来啊"
          });
          that.setData({
            haveGift: false
          });
          that.setData({
            actuallyTime: that.data.actuallyTime - 1,
            allLimitTime: that.data.allLimitTime - 1
          });
        }else{
          wx.showModal({
            showCancel: false,
            content: data.msg
          });
        }

        that.setData({
          awardNum: awardNum || 2
        });

        setTimeout(function(){
          that.stop(awardNum);
        },2000)

      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },

  playAgain(){
    let that = this;
    if (!that.data.haveGift){

    }else{
      that.showAward();
    }

    that.setData({
      isShow: false
    });
  },

  btnAudioPlay: function () {
    this.btnAudio.play();
  },
  wheelAudioPlay:function(){
    this.wheelAudio.play();
    this.wheelAudio.seek(0);
  },
  wheelAudioPause: function () {
    this.wheelAudio.pause();
  },
  showAwardItem:function(){

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
    clearInterval(this.data.loopLight)
  },
  fixImageSuffix:function(exp){
    switch(exp){
      case 1:
      case 2:
      this.setData({
        wheelBGsuffix:"4_03.png"
      });
      return 4;
      break;
      case 3:
        this.setData({
          wheelBGsuffix: "6_03.png"
        });
        return 6;
        break;
      case 4:
        this.setData({
          wheelBGsuffix: "8_03.png"
        });
        return 8;
        break;
      case 5:
      case 6:
      case 7:
      case 8:
        this.setData({
          wheelBGsuffix: "10_03.png"
        });
        return 10;
        break;
    }
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
    let title = "转一转，有惊喜，礼包等着你";
    let path = "/pages/interaction/wheel/wheel?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
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
