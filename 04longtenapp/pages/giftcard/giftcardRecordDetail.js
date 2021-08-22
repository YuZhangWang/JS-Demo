// pages/giftcard//giftcardRecordDetail.js
// pages/giftcard//giftcardDetail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
Page(Object.assign({}, commHandle, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    imgurl: cf.config.pageDomain + '/applet/mobile/membercard/generateCode39Img.do?memberCardcode=',
    userInfo: {},
    verType: "giftcard",
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    config: '',
    recordId: '',
    goodsUrl: {
      '1': '/pages/detail/detail',
      '2': '/pages/takeout/indexDetail',
      '3': '/pages/yuyue/yydetail',

    }
    
  },

  getTimeLimitTxt: function (giftCardConfig) {
    if (giftCardConfig.timeLimitType == 1) {
      return  (giftCardConfig.effectEndTime ? giftCardConfig.effectEndTime + ' 后过期' : "20xx : 00 : 00");
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
  toggleQrcodeModal: function () {
    var that = this;
    
    if (that.data.showQrcodePopup) {
      that.setData({
        showQrcodePopup: false
      })
    } else {
      that.setData({
        showQrcodePopup: true
      });
      if (!that.data.appletScene) {
        that.fetchVerifyQrcodeInfo();
      }
    }
  },
  showQrcode:function(){
    this.setData({
      showQrcodePopup: true
    });
  },
  fetchVerifyQrcodeInfo: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/genGiftCardQrCode',
      data: {
        cusmallToken: cusmallToken,
        page: "pages/verify/giftcard_verify",
        giftCardRecordId: that.data.recordId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {

          if (res.data.model && res.data.model.appletScene) {
            that.setData({
              appletScene: res.data.model.appletScene
            });
            
            that.setData({
              sceneData: JSON.parse(res.data.model.appletScene.entity || "{}")
            })
          }

        } else {

          wx.showModal({
            title: '获取核销qrcode信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
        wx.hideLoading();
        


      }
    })
  },
  // 立即使用
  useGiftCard: function (e) {
    let that = this;
    let type = e.currentTarget.dataset.type;
    let goodsType = parseInt(e.currentTarget.dataset.goodstype);
    let goodsId = e.currentTarget.dataset.goodsid;
    let recordObj = this.data.config;
    let extendInfo = recordObj.extend && JSON.parse(recordObj.extend);
    let url = that.data.goodsUrl[goodsType] + '?id=' + goodsId;
    if (parseInt(type) == 1) {
      wx.navigateTo({
        url: url,
      })
    } else if(extendInfo.linkUrl) {
      wx.navigateTo({
        url: extendInfo.linkUrl,
      })
    }else{
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }


  },

  // 自己使用
  selfUse: function (e) {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/receiveGiftCardUseSelf',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: that.data.recordId,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          wx.showToast({
            title: '使用成功',
          })
          wx.hideLoading();
          that.getGiftCardData();
          
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取礼品卡信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  // 赠送好友
  giveFriend: function (e) {
    
    wx.navigateTo({
      url: '/pages/giftcard/giftcardShare?id=' + that.data.recordId,
    })

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
          if (config.effectEndTime) {
            config.effectEndTime = util.formatTime(new Date(config.effectEndTime))
          }
          if (config.effectStartTime) {
            config.effectStartTime = util.formatTime(new Date(config.effectStartTime))
          }
          config.getUseLimitTxt = that.getUseLimitTxt(config);
          config.getTimeLimitTxt = that.getTimeLimitTxt(config);
          if(config.state == 2){
            that.fetchVerifyQrcodeInfo();
          }
          that.setData({
            config: config,
            goods: goods
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
        recordId: options.id
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
    return shareObj;
  }
}))