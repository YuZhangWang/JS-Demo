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
    config:'',
    categoryContClass: "",
    count:1,
    showUseTips:false
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
  handleUseModalClose:function(){
     this.setData({
       showUseTips: false
     })
  },
  handleUseModalShow: function(){
    this.setData({
      showUseTips: true
    })
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
  giftcardBuy:function(){
    if (!this.checkUserInfo()) {
      return false;
    }
    this.setData({
      categoryContClass: 'step2 onAddCart'
    })
  },
  onCloseBuy:function(){
    this.setData({
      categoryContClass: ''
    })
  },

  // 去激活
  giftcardActivate: function(){
    if (!this.checkUserInfo()) {
      return false;
    }
    wx.navigateTo({
      url: '/pages/giftcard/giftcardActivate?id=' + this.data.giftcardId,
    })
  },
  
  // 提交订单
  confirmBuy:function(){
    let that = this;
    wx.showLoading({
      title: '提交中...',
    })
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/generateGiftCardOrder',
      data: {
        cusmallToken: cusmallToken,
        giftCardConfigId: that.data.giftcardId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        mallSiteId: wx.getStorageSync('mallSiteId'),
        num: that.data.count
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res){
          if(res.data.ret == 0){
            let orderdata = res.data.model.order;
            if (orderdata) {
              that.getPayParams(that.data.config.title, orderdata.tradeNo, orderdata.price);
            }
          }else{
            wx.showModal({
              title: '温馨提示',
              content: res.data.msg,
            })
            wx.hideLoading()
          }

      }
    })
  },
  bindChange: function (event) {
    console.log(event)
    var that = this;
    let valueNum = Math.abs(event.detail.value);
    if (totalCount > that.data.config.limitCount) {
      wx.showModal({
        showCancel: false,
        content: "每人限购" + that.data.config.limitCount
      })
      return false;
    }
    that.setData({
      count: valueNum
    })
  },
  addCount: function (event) {
    var that = this;
    let totalCount = that.data.count;

    totalCount++;
    if(totalCount> that.data.config.totalCount){
      wx.showModal({
        showCancel: false,
        content: "库存不足"
      })
      return false;
    }
    if (parseInt(that.data.config.getLimitCount) != -1 && totalCount > that.data.config.getLimitCount){
      wx.showModal({
        showCancel: false,
        content: "每人限购" + that.data.config.getLimitCount+"张"
      })
      return false;
    }
    
    that.setData({
      count: totalCount
    })
  },
  minusCount: function (event) {
    var that = this;
    if(!that.data.count){
      return false;
    }
    that.data.count--;
    that.setData({
      count: that.data.count--
    })
    
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
          if (config.effectEndTime){
            config.effectEndTime = util.formatTime(new Date(config.effectEndTime))
          }
          if (config.effectStartTime) {
            config.effectStartTime = util.formatTime(new Date(config.effectStartTime))
          }
          config.getUseLimitTxt = that.getUseLimitTxt(config);
          config.getTimeLimitTxt = that.getTimeLimitTxt(config);
          that.setData({
            config: config,
            goods: goods
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
  // 客服电话
  callService: function () {
    let that = this;
    if (that.data.config.merchantPhone) {
      wx.makePhoneCall({
        phoneNumber: that.data.config.merchantPhone
      });
    } else {
      wx.showModal({
        title: '提示',
        content: '商家未填写电话',
        showCancel: false
      });
    }
  },
  // 微信支付
  getPayParams(goodDescribe, orderNo, price) {
    let ctx = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: goodDescribe,
        out_trade_no: orderNo,
        total_fee: price
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          let wxOrderData = data.model.wxOrderData;
          wx.requestPayment({
            'timeStamp': wxOrderData.timeStamp,
            'nonceStr': wxOrderData.nonceStr,
            'package': wxOrderData.package,
            'signType': wxOrderData.signType,
            'paySign': wxOrderData.paySign,
            'success': function (res) {
              console.log(res.data)
              wx.showModal({
                title: '提示',
                content: "支付成功",
                showCancel: false,
                success: function (res) {
                  let pages = getCurrentPages(); //当前页面
                  let prevPage = pages[pages.length - 2]; //上一页面
                  wx.navigateTo({
                    url: '/pages/giftcard/myGiftCard',
                  })
                }
              });
            },
            'fail': function (res) {
              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付",
                success: function (res) {
                  wx.showModal({
                    title: '提示',
                    showCancel: false,
                    content: '购买失败：' + res.data.msg,
                    success: function (res) {
                      wx.navigateBack({
                        delta: 1
                      })
                    }
                  })
                }
              })
            },
            complete: function () {
              ctx.setData({
                isPaying: false
              });
              wx.hideLoading();
            }
          });
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg + ", 或没有配置微信支付参数，无法进行支付",
            showCancel: false,
            success: function (res) {

            }
          });
          ctx.setData({
            isPaying: false
          });
        }


      },
      fail: function () { },
      complete: function () { }
    });
  },
 

  hideMask: function () {
    this.setData({
      isShowMask: true
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