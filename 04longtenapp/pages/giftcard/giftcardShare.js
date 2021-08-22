
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    imgurl: cf.config.pageDomain + '/applet/mobile/membercard/generateCode39Img.do?memberCardcode=',
    userInfo: {},
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    config: '',
    recordId: '',
    blessingWord: '',
    isShare: true,
    noteMaxLen: 200,  //字数限制
    currentNoteLen: 0, 

  },

  getTimeLimitTxt: function (giftCardConfig) {
    if (giftCardConfig.timeLimitType == 1) {
      return (giftCardConfig.effectEndTime ? giftCardConfig.effectEndTime + ' 后过期' : "20xx : 00 : 00");;
    } else if (giftCardConfig.timeLimitType == 2) {

      return "领到券当日开始" + giftCardConfig.effectDay + "天内有效";
    } else if (giftCardConfig.timeLimitType == 4) {
      return "无限制";
    }
  },
  getUseLimitTxt: function (giftCardConfig) {
    if (giftCardConfig.useLimitType == 1) {
      return "全店商品（除当面付）";
    } else if (giftCardConfig.useLimitType == 2 && giftCardConfig.type == 1) {
      return "仅购买" + giftCardConfig.bizName + "可使用";
    } else if (giftCardConfig.useLimitType == 2 && giftCardConfig.type == 2) {
      return "仅购买" + giftCardConfig.bizName + "商品分类下的商品可使用";
    } else if (giftCardConfig.useLimitType == 4) {
      return "仅当面付可用";
    } else if (giftCardConfig.useLimitType == 5) {
      return "仅多媒体支付可用";
    }
  },

  // 获取礼品卡记录
  getGiftCardData: function () {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/findGiftCardRecordById',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: that.data.recordId,
        isSelectFlow: '',
        isSelectOrder: '',
        isSelectVerifiedClerkInfo: ''
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let config = data.model.record || {};
          let goods = data.model.goods || {};
          let toGiftCardRecord = data.model.toGiftCardRecord || {};
          if (config.effectEndTime) {
            config.effectEndTime = util.formatTime(new Date(config.effectEndTime))
          }
          if (config.effectStartTime) {
            config.effectStartTime = util.formatTime(new Date(config.effectStartTime))
          }
          if (config.giftTime) {
            config.giftTime = util.formatTime(new Date(config.giftTime))
          }
          if (toGiftCardRecord.createTime) {
            toGiftCardRecord.createTime = util.formatTime(new Date(toGiftCardRecord.createTime))
          }
          config.getUseLimitTxt = that.getUseLimitTxt(config);
          config.getTimeLimitTxt = that.getTimeLimitTxt(config);
          that.setData({
            config: config,
            goods: goods,
            toGiftCardRecord: toGiftCardRecord
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

  // 取消
  cancel: function(){
    wx.navigateBack({
      delta:  1
    })
  },
  // 祝福语
  bindBlessing: function(e){
    this.setData({
      blessingWord: e.detail.value,
      currentNoteLen: parseInt(e.detail.value.length)
    })
     
  },

  // 赠送好友
  givenFriend: function(){
    let that = this;
    wx.showLoading({
      title: '赠送中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/givenGiftCard',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: that.data.recordId,
        giftExtend: that.data.blessingWord
        
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
           console.log(data);
          that.getGiftCardData();


        }

      },
      fail: function () {

      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },

  // cancelGiven
  cancelGiven: function(){
    let that = this;
    wx.showLoading({
      title: '撤销中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/revokeGiftCard',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: that.data.recordId,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          console.log(data);
          that.getGiftCardData();


        }

      },
      fail: function () {

      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
  receiveGiftcard: function(){
    let that = this;
    if (!that.checkUserInfo()) {
      return false;
    }
    wx.showLoading({
      title: '领取中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/receiveGivenGiftCard',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: that.data.recordId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        mallSiteId: wx.getStorageSync('mallSiteId')
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          console.log(data);
          wx.showToast({
            title: '领取成功',
          })
          wx.navigateTo({
            url: '/pages/giftcard/myGiftCard?mainTabType=2',
          })


        }else{
          wx.showModal({
            title: '温馨提示',
            content: data.msg,
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




  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    wx.hideShareMenu();

    that.data.options = options;
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.setData({
        recordId: options.id,
        isShare: options.source=='share' || false
      });

      that.getGiftCardData();
      util.afterPageLoad(that);

    });

    this.setData({
      userInfo: app.globalData.userInfo
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
    let shareObj = that.getShareConfig();
    that.givenFriend();
    shareObj.path += "&source=share";
    shareObj.title = '我有一张礼品卡想送给你~';
    return shareObj;
    
  }
}))