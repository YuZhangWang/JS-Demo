// pages/giftcard//giftcardActivate.js
// pages/giftcard//giftcardDetail.js
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
    categoryContClass: "",
    count: 1,
    collectInfo:[],
    collectionInfo: [],
    smsCode: ''
  },

  getTimeLimitTxt: function (giftCardConfig) {
    if (giftCardConfig.timeLimitType == 1) {
      return (giftCardConfig.effectEndTime ? giftCardConfig.effectEndTime + ' 后过期' : "20xx : 00 : 00");
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
 
  // 获取礼品卡数据
  getGiftCardData: function () {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/findGiftCardConfigById',
      data: {
        cusmallToken: cusmallToken,
        giftCardConfigId: that.data.giftcardId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        mallSiteId: mallSiteId


      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let config = data.model.config || {};
          let goods = data.model.goods || {};
          if (config.effectEndTime) {
            config.effectEndTime = util.formatTime(new Date(config.effectEndTime))
          }
          if (config.effectStartTime) {
            config.effectStartTime = util.formatTime(new Date(config.effectStartTime))
          }
          if(config.extend){
             let extendInfo = JSON.parse(config.extend);
             let collectInfo = extendInfo.collectInfo;
             let collectionInfo = [];
             for(var i = 0; i< collectInfo.length; i++){
               let collectionObj = {};
               collectionObj.name = collectInfo[i].name;
               collectionObj.isChecked = collectInfo[i].isChecked
               if (collectInfo[i].type == 2) {
                 collectionObj.value = collectInfo[i].options[0].name
               } else {
                 collectionObj.value = "";
               }

               collectionInfo.push(collectionObj);
                
             }
             that.setData({
               collectInfo: collectInfo,
               collectionInfo: collectionInfo
             })

          }
          config.getUseLimitTxt = that.getUseLimitTxt(config);
          config.getTimeLimitTxt = that.getTimeLimitTxt(config);
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
  //验证码倒计时
  _initVcodeTimer: function () {
    var that = this;
    var initTime = 60;
    that.setData({
      "has_get_vcode": true,
      "vcodeGetTime": initTime
    });
    var vcodeTimer = setInterval(function () {
      initTime--;
      that.setData({
        "vcodeGetTime": initTime
      });
      if (initTime <= 0) {
        clearInterval(vcodeTimer);
        that.setData({
          "has_get_vcode": false
        });
      }
    }, 1000);
  },
  //获取验证码点击事件
  tapGetVcode: function () {
    var that = this;
    var trimVal = that.trim(that.data.collectionInfo[1].value);
    var regIphone = (/^1([3-9][0-9]{9})$/.test(trimVal));
    console.log(regIphone);
    if (!regIphone) {
      wx.showModal({
        title: '提示！',
        content: '手机号格式有误',
        showCancel: false
      });
      return false;
    }
    //vcode倒计时
    that._initVcodeTimer();
    //执行请求，获取vcode
    that.getVcode();
  },
  /* 字符去空格 */
  trim: function (s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  //获取验证码
  getVcode: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/common/sendCode',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        phoneNum: that.data.collectionInfo[1].value,
        sceneType: 'giftcard_tel_code'
      },
      success: function (res) {
        console.log(res);
        if (res.data.ret == 0) {
          wx.showToast({
            title: "验证码已发送",
            icon: "success"
          });
        } else {
          that.setData({
            "has_get_vcode": false,
            vcodeGetTime: 0
          });
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: res.data.msg
          })
        }
      },
      error: function (error) {
        console.log(error);
      }
    })
  },
  /* 验证码输入 */
  bindCodeInput: function (e) {
    var that = this;
    var trimVal = that.trim(e.detail.value);
    that.setData({
      smsCode: trimVal,
    });
  },
  inputs: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var name = e.currentTarget.dataset.name;

    this.setData({
      ["collectionInfo[" + idx + "].name"]: name,
      ["collectionInfo[" + idx + "].value"]: e.detail.value,

    })
  },
  radioChange: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var name = e.currentTarget.dataset.name;

    this.setData({
      ["collectionInfo[" + idx + "].name"]: name,
      ["collectionInfo[" + idx + "].value"]: e.detail.value,

    })
  },
  // 客服电话
  callService: function () {
    let that = this;
    if (that.data.phoneNum) {
      wx.makePhoneCall({
        phoneNumber: that.data.phoneNum
      });
    } else {
      wx.showModal({
        title: '提示',
        content: '商家未填写电话',
        showCancel: false
      });
    }
  },
  //确认激活
  infoSubmit: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
   
    if (that.data.collectionInfo.length > 0) {
      for (var i = 0; i < that.data.collectionInfo.length; i++) {
        if(that.data.collectInfo[i].isChecked){
          if (that.data.collectionInfo[i].name == '短信验证') {
            continue;
          }
          if (that.data.collectionInfo[i].name == '激活码' && !that.data.collectionInfo[i].value) {
            wx.showModal({
              title: '提示',
              content: '请输入激活码',
              showCancel: false,

            });
            return;
          }
          if (that.data.collectionInfo[i].name == '手机号' && !that.data.collectionInfo[i].value) {
            wx.showModal({
              title: '提示',
              content: '请输入手机号',
              showCancel: false,

            });
            return;
          }
          if (!that.data.collectionInfo[i].value) {
            wx.showModal({
              title: '提示',
              content: '信息不能为空',
              showCancel: false,

            });
            return;
          }
        }
        
      }

    }
    that.activateGiftCard();
    
  },

  // 激活礼品卡
  activateGiftCard: function () {
    let that = this;
    wx.showLoading({
      title: '激活中',
    });
    let activation = [];
    for(var i = 0; i< that.data.collectionInfo.length; i++){
      let infoName = that.data.collectionInfo[i].name
      if (infoName != '激活码' && infoName != '手机号' && infoName != '短信验证' ){
         activation.push(that.data.collectionInfo[i]);
      }

    }
    let reqUrl = '/applet/mobile/giftCard/activationGiftCardUseSelf';
    let paramsData = {
      cusmallToken: cusmallToken,
      configId: that.data.giftcardId,
      phone: that.data.collectionInfo[1].value,
      code: that.data.collectionInfo[0].value,
      activationInfo: JSON.stringify(activation),
      
    };
    if(that.data.smsCode){
      paramsData.messCode = that.data.smsCode
    }
   
    wx.request({
      url: cf.config.pageDomain + reqUrl,
      method: "GET",
      data: paramsData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          wx.showModal({
            title: '提示',
            content: '激活成功',
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                wx.redirectTo({
                  url: "/pages/giftcard/myGiftCard?mainTabType=2"
                });
              }
            }
          });
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg,
            showCancel: false,
          });
        }


      },
      fail: function () {

      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },

  // 店铺首页
  goToIndex: function () {
    let fromUid = app.globalData.fromuid || "";
    let shopUid = app.globalData.shopuid || "";
    wx.reLaunch({
      url: "/pages/index/index?fromuid=" + fromUid + "&shopuid=" + shopUid
    })
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
        giftcardId: options.id
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