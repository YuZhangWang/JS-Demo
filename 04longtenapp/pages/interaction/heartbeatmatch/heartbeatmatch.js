let cf = require("../../../config.js");
let util = require("../../../utils/util.js");
let baseHandle = require("../../template/baseHandle.js");
let inteBaseHandle = require("../inteCommon/inteBaseHandle.js");
let commonAty = require("../../../utils/atycommon.js");
let cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
let app = getApp();
let hbmObj = null;
class HeartBeatMatch {
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

// 翻牌
class turn_card {
  constructor(_obj,pageVm){
    // 配置信息对象
    let obj = _obj ? _obj : {};
    this.self = this;
    this.pageVm = pageVm;
    this.row_num = obj.row_num ? obj.row_num : 3; // 一行多少个卡片

    this.card_arr = obj.card_arr ? obj.card_arr : [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]; // 所有卡片数组
    this.card_length = this.card_arr.length; // 卡片的数量

    this.engable = true; // 是否可以点击

    // 初始化
    this.initGame();
    // 生成卡片
    this.generateCard();
  }
  // 初始化游戏配置
  initGame() {
    // 当前对象
    let self = this;

  }

  // 生成卡片
  generateCard () {
    let self = this;
    let str = "";
    let num = 0;
    let that = self.pageVm;
    that.heartImgUrl();
    let realImgArr = self.pageVm.data.realImgArr;
    let imgAttrRandom = [];

    for (var i = 0; i < this.card_length; i++) {
      num = Math.floor(Math.random() * realImgArr.length);
      imgAttrRandom.push(realImgArr[num]);
      realImgArr.splice(num, 1);
    }
    that.setData({
      realImgArr: imgAttrRandom
    })
  }

  // 判断选择的2张卡片是否相同
  isSame() {
    let self = this;
    let that = self.pageVm;
    let realImgArr = self.pageVm.data.realImgArr;
    let selectedCount = 0;
    let isSame = false;
    let firstSelectedImgIndex = 0;
    let secondSelectedImgIndex = 0;
    for(let i=0;i<realImgArr.length;i++){
      let imgObj = realImgArr[i];
      if(imgObj.hasMatch) {
        continue;
      }
      if (imgObj.hasSelected){
        if (selectedCount == 1){
          isSame = realImgArr[firstSelectedImgIndex].type == imgObj.type;
          secondSelectedImgIndex = i;
        } else {
          firstSelectedImgIndex = i;
        }
        selectedCount+=1;
      }
    }

    if (selectedCount > 1) { // 选了两个卡片
      let firstImgObj = realImgArr[firstSelectedImgIndex];
      let secondImgObj = realImgArr[secondSelectedImgIndex];
      setTimeout(function () {
        if (!isSame) { // 不同
          firstImgObj.hasSelected = false;
          secondImgObj.hasSelected = false;
          firstImgObj.animClass = "flip2";
          secondImgObj.animClass = "flip2";

          // 减分效果
          if (that.data.heartData.score >= 3) {
            that.data.heartData.score -= 3;
          } else {
            that.data.heartData.score = 0;
          }
          that.minusAudioCtx.play();
          that.setData({
            showMinusScore:true,
            ["heartData.score"]: that.data.heartData.score,
            ["realImgArr[" + firstSelectedImgIndex + "]"]: firstImgObj,
            ["realImgArr[" + secondSelectedImgIndex + "]"]: secondImgObj
          })
          //music_fp.pause();
          //music_minus.play();


          setTimeout(function () {
            that.setData({
              showMinusScore: false
            })
          }, 500);
        } else { // 相同
          firstImgObj.animClass = "fadeOut";
          secondImgObj.animClass = "fadeOut";
          firstImgObj.hasMatch = true;
          secondImgObj.hasMatch = true;

          that.data.heartData.score += 5 * 2;
          that.addAudioCtx.play();
          that.setData({
            showAddScore: true,
            ["heartData.score"]: that.data.heartData.score,
            ["realImgArr[" + firstSelectedImgIndex + "]"]: firstImgObj,
            ["realImgArr[" + secondSelectedImgIndex + "]"]: secondImgObj
          })

          //music_fp.pause();
          //music_add.play();

          setTimeout(function () {
            that.setData({
              showAddScore: false
            })

          }, 500);
          // 判断是否单页猜完
          self.isAllRight();
        }
        setTimeout(function(){
          that.data.animating = !that.data.animating;
        },100);
      }, 350);
    } else { // 选了一个卡片
      that.data.animating = !that.data.animating;
    }
  }
  // 判断是否单页全部猜完
  isAllRight() {
    let self = this;
    let that = self.pageVm;
    let heartData = that.data.heartData;
    let realImgArr = that.data.realImgArr;
    let matchCount = 0;
    for (let i = 0; i < realImgArr.length; i++) {
      if (realImgArr[i].hasMatch){
        matchCount++;
      }
    }
    if (matchCount == realImgArr.length){
      clearInterval(heartData.timer);
      that.commitScore(that.data.heartData.score);
    }
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
    isShowROA: true,
    isShowRAA: false,
    //currentPage: "startGame",
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    heartData: {
      leftTime: 30,
      timer: null,
      score: 0,
      readyCountdown:5,
      heartImgArr: []
    },
    templateName: "heartbeatmatch"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    that.bgAudioCtx = wx.createAudioContext('bgAudio');
    that.fpAudioCtx = wx.createAudioContext('fpAudio');
    that.addAudioCtx = wx.createAudioContext('addAudio');
    that.minusAudioCtx = wx.createAudioContext('minusAudio');
    that.bgAudioCtx.play();
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      wx.showLoading({
        title: '加载中...',
      })
      myProcess = new commonAty.CommonProcess(new HeartBeatMatch(that), options, cusmallToken);
      myProcess.init();

      hbmObj = new turn_card({
        card_arr: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
        row_num: 3
      }, that);

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
    that.readyCountDown(function(){
      that.turnAllBack();
      that.gameCountDown();
    });
    that.turnAll();

  },

  // 游戏准备开始倒计时
  readyCountDown(callback){
    let that = this;
    let heartData = that.data.heartData;
    heartData.readyTimer = setInterval(function () {
      heartData.readyCountdown--;
      that.setData({
        ["heartData.readyCountdown"]: heartData.readyCountdown
      })
      if (heartData.readyCountdown == 0) {
        clearInterval(heartData.readyTimer);
        callback && callback();
      }
    }, 1000);
  },
  // 游戏进行中倒计时
  gameCountDown(callback){
    let that = this;
    let heartData = that.data.heartData;
    heartData.timer = setInterval(function () {
      if (heartData.leftTime <= 0) {
        clearInterval(heartData.timer);
        that.commitScore(that.data.heartData.score);
        if (callback && typeof callback == "function") {
          callback();
        }
      } else {
        heartData.leftTime--;
        that.setData({
          ["heartData.leftTime"]: heartData.leftTime
        })
      }
    }, 1000);
  },
  handleCardTap:function(e){
    let that = this;
    let idx = e.currentTarget.dataset.idx;
    let card = that.data.realImgArr[idx];
    // 时间到，游戏结束
    if (that.data.heartData.leftTime<=0){
      return;
    }
    // 防止重复点击
    if(that.data.animating){
      return false;
    }
    // 已经是选中状态
    if (card.hasSelected){
      return false;
    }
    that.fpAudioCtx.play();
    card.animClass = "flip";
    card.hasSelected = true;
    that.data.animating = true;
    that.setData({
      ["realImgArr["+idx+"]"]:card
    })
    hbmObj.isSame();

  },
  // 默认图片路径
  heartImgUrl(){
    let that = this;
    let imgPath = that.data.youyuResPath + '/heartbeatmatch/game/';
    let imgArr= [{ "url": "dx.png", "type": 0 }, { "url": "jx.png", "type": 0 }, { "url": "lc.png", "type": 1 }, { "url": "fbb.png", "type": 1 }, { "url": "hxm.png", "type": 2 }, { "url": "yy.png", "type": 2 }, { "url": "jack.png", "type": 3 }, { "url": "rose.png", "type": 3 }, { "url": "jerry.png", "type": 4 }, { "url": "tom.png", "type": 4 }, { "url": "kn.png", "type": 5 }, { "url": "xn.png", "type": 5 }];
    for(let i = 0; i<imgArr.length; i++){
      imgArr[i].url = imgPath + imgArr[i].url;
      imgArr[i].id = i;
      imgArr[i].animClass = "flip2";
    }
    that.data.realImgArr = imgArr;
		return imgArr;
	},
  turnAll(callback) {
    let that = this;
    let realImgArr = that.data.realImgArr;
    let delay = [800, 1000, 1200, 1000, 1200, 1400, 1200, 1400, 1600, 1400, 1600, 1800];
    for (let i = 0; i < realImgArr.length; i++) {
      (function (i) {
        setTimeout(function () {
          let imgObj = realImgArr[i];
          imgObj.animClass = "flip";
          that.setData({
            ["realImgArr[" + i + "]"]: imgObj
          });
        }, delay[i]);
      })(i);
    }
    if (callback && typeof callback == "funciton") {
      callback();
    }
  },
  turnAllBack (callback) {
    let that = this;
    let realImgArr = that.data.realImgArr;
    for (let i = 0; i < realImgArr.length; i++) {
      let imgObj = realImgArr[i];
      imgObj.animClass = "flip2";
    }
    that.setData({
      "realImgArr": realImgArr
    });
    if (callback && typeof callback == "funciton") {
      callback();
    }
  },
  commitScore(score){
    let that = this;
    that.setData({
      gameScore:score
    })
    if (score > that.data.activityRule.scoreLimit){
      that.setData({
        showSuccessMaskPage: true
      })
    } else {
      that.setData({
        showFailMaskPage: true
      })
    }
  },


  playAgain: function () {
    let that = this;
    if (that.data.actuallyTime > 0) {
      that.hideMaskPage();
      that.setData({
        heartData: {
          leftTime: 30,
          timer: null,
          score: 0,
          readyCountdown: 5,
          heartImgArr: []
        }
      });
      hbmObj.generateCard();
      that.readyCountDown(function () {
        that.turnAllBack();
        that.gameCountDown();
      });
      that.turnAll();
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
    let title = userInfo.nickName + "邀请你接受挑战！";
    let path = "/pages/interaction/heartbeatmatch/heartbeatmatch?activityId=" + that.data.activity.id + "&fromOpenId=" + that.data.openUser.openId;
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
