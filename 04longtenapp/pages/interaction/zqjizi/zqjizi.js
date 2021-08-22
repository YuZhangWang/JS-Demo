let cf = require("../../../config.js");
let util = require("../../../utils/util.js");
let baseHandle = require("../../template/baseHandle.js");
let inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
let commonAty = require("../../../utils/atycommon.js");
let cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
let app = getApp();
class CollectWord {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }

  initProcess(data) {
    let cxt = this.thatContext;
    cxt.queryLotteryChance();
    let extendJson = {};
    let extendOperation = cxt.data.activity.extendOperation;
    if (extendOperation){
      extendJson = JSON.parse(extendOperation);
    }
    let collectWordStrArray = extendJson.collect.split("");
    let collectWord = [];
    for (let i = 0; i < collectWordStrArray.length;i++){
      collectWord.push({
        "txt": collectWordStrArray[i],
        "isCollect":false
      });
    }
    cxt.setData({
      collectWord: collectWord
    })
  }


  myProcess() {


  }

  ohterPeopleProcess(activityId, fromOpenId) {
    let cxt = this.thatContext;
    cxt.setData({
      currentPage:"startGame",
      isHelpPage:true
    })
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + '/mobile/game/collect_word/collectWord',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityId,
        fromOpenid: fromOpenId,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          cxt.setData({
            collectWordHelpData:data.model
          })
          wx.hideLoading();

        } else {
          console.log(data.msg)
          wx.hideLoading();
        }
        wx.hideLoading();
      }
    })
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
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    awardList: [],
    myAwards: [],
    isShowROA: true,
    isShowRAA: false,
    //currentPage: "startGame",
    templateName: "zqjizi"
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
      myProcess = new commonAty.CommonProcess(new CollectWord(that), options, cusmallToken);
      myProcess.init();

    });

  },

  handleStartTab: function (e) {

    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    if (!that.data.hasInit) {
      return false;
    }
    if (that.data.actuallyTime <= 0) {
      that.alertNoChange();
      return;
    }
    that.setData({
      currentPage: "startGame"
    });
    that.initCollectWord(that.data.activity.id);
  },


  initCollectWord: function (activityId){
    let that = this;
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + '/mobile/game/collect_word/initCollectWord',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let initWord = data.model.initWord;
          for (let i = 0; i < that.data.collectWord.length;i++){
            let word = that.data.collectWord[i];
            if(!word.isCollect && word.txt == initWord){
              word.isCollect = true;
              break;
            }
          }
          if (data.model.helpList && data.model.helpList.length > 0){
            for (let j = 0; j < data.model.helpList.length; j++) {
              let helpWord = data.model.helpList[j].helpResult;
              for (let i = 0; i < that.data.collectWord.length;i++){
                let word = that.data.collectWord[i];
                if (!word.isCollect && word.txt == helpWord){
                  word.isCollect = true;
                  break;
                }
              }
            }
          }
          that.setData({
            collectWordInitData:data.model,
            collectWord: that.data.collectWord
          })
          wx.hideLoading();
        } else {
          console.log(data.msg)
          wx.hideLoading();
        }
        wx.hideLoading();
      }
    })
  },

  iWantPlay: function(){
    let that = this;
    that.setData({
      currentPage: "initGame",
      isHelpPage:false
    })
  },
  playAgain: function () {
    let that = this;
    if (that.data.actuallyTime > 0) {
      that.hideMaskPage();
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
    let title = userInfo.nickName + "要中奖了，你还在等什么？";
    let path = "/pages/interaction/zqjizi/zqjizi?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
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
    console.log(path);

    return shareObj;
  }
}))
