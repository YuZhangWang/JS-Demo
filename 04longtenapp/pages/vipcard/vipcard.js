var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var customUid = [109761, 155416, 153509]; //客户定制
var isCustom = customUid.includes(parseInt(cf.config.uid));
var cardColor = {
  Color010: "#63b359",
  Color020: "#2c9f67",
  Color030: "#509fc9",
  Color040: "#5885cf",
  Color050: "#9062c0",
  Color060: "#d09a45",
  Color070: "#e4b138",
  Color080: "#ee903c",
  Color081: "#f08500",
  Color082: "#a9d92d",
  Color090: "#dd6549",
  Color100: "#cc463d",
  Color101: "#cf3e36",
  Color102: "#5E6671",
  Color103: "#313238",
  Color104: "#ffffff",
  Color105: "#debb85"
};
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
    linkType: {
      'cardDetail': '/pages/subCategory/subpage?pageId=177774',
      'brandInfo': '/pages/subCategory/subpage?pageId=177850',
      'stopFee': '/pages/subCategory/subpage?pageId=177849'
    },
    default_bg: "/youdian/image/admin/xiaochengxu/vip/vipcard_bg.png",
    isCustom: isCustom,
    isShowKnow: true,
    isShipShow: true,
    isShowMask: true,
    isShowFree: false,
    nonactivated: false, //未激活
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    isShowDiscount: false,
    isShowCoupon: false,
    isShowPoints: false,
    isReceived: false,
    activeMoney: 0,
    payStatus: '',
    shopName: "",
    cardName: "",
    coverSet: 1,
    prefixImg: "",
    curCardColor: "",
    levelName: '',
    logo: "",
    cardId: "",
    discountTxt: "",
    rightCntArr: [],
    needKnowTxt: "",
    phoneNum: "", //客服电话
    mcNumber: "",
    userName: "",
    userPhone: "",
    curPoint: "",
    recordId: '',
    configId: '',
    uid: '',
    date: "",
    expireTime: '',
    isCollectDate: false,
    showModel: false,
    statu: -1,
    extendInfo: "",
    collectionInfo: [],
    isComplete: false
  },
  //验证码倒计时
  _initVcodeTimer: function() {
    var that = this;
    var initTime = 60;
    that.setData({
      "has_get_vcode": true,
      "vcodeGetTime": initTime
    });
    var vcodeTimer = setInterval(function() {
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
  tapGetVcode: function() {
    var that = this;
    var trimVal = that.trim(that.data.userPhone);
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
  //获取验证码
  getVcode: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/common/sendCode',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        phoneNum: that.data.userPhone,
        sceneType: 'recmcard_tel_code'
      },
      success: function(res) {
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
      error: function(error) {
        console.log(error);
      }
    })
  },
  //客户定制，跳转到小程序
  linkToMin: function() {
    let appId = "wx71a5270051f823bb";
    wx.navigateToMiniProgram({
      appId: appId,
      success(res) {
        // 打开成功
      },
      fail(res) {
        wx.showModal({
          title: "提示",
          content: "没有该小程序",
          showCancel: false
        });
      }
    })
  },
  //
  goToLink: function(e) {
    let type = e.currentTarget.dataset.type;
    let that = this;
    wx.navigateTo({
      url: that.data.linkType[type],
    })

  },
  /* 验证码输入 */
  bindCodeInput: function(e) {
    var that = this;
    var trimVal = that.trim(e.detail.value);
    that.setData({
      smsCode: trimVal,
    });
  },
  tapKnow: function() {
    var that = this;

    that.setData({
      isShowKnow: !that.data.isShowKnow
    })
  },
  showQrcode: function() {
    var that = this;
    that.setData({
      showModel: !that.data.showModel
    })
  },
  tapShip: function() {
    this.setData({
      isShipShow: !this.data.isShipShow
    });
    console.log(this.data.isShipShow)
  },
  delVipCard: function() {
    wx.showModal({
      title: '提示',
      content: '是否删除会员卡',
      success: function(res) {
        if (res.confirm) {
          console.log('删除成功')
        } else if (res.cancel) {
          console.log('删除取消')
        }
      }
    });
  },
  inputs: function(e) {
    var idx = e.currentTarget.dataset.idx;
    var name = e.currentTarget.dataset.name;

    this.setData({
      ["collectionInfo[" + idx + "].name"]: name,
      ["collectionInfo[" + idx + "].value"]: e.detail.value,

    })
  },
  getVipCardInfo: function() {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/membercard/getReceiveInfoByCardId',
      data: {
        cusmallToken: cusmallToken,
        cardId: that.data.cardId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let config = data.model.config;
          let record = data.model.record;
          let mArr = []

          if (data.model.record) {
            that.setData({
              statu: data.model.record.statu,
              recordId: record.id,
              uid: record.uid,
              payStatus: record.value4
            })
            

          }
          that.setData({
            shopName: config.shopName,
            cardName: config.cname,
            coverSet: config.coverSet,
            prefixImg: config.prefixImg,
            logo: config.logo,
            wxCardId: config.wxCardId,
            cardState: config.state,
            levelName: config.levelName,
            activeMoney: config.activeMoney,
            configId: config.id
          });

          //会员卡有效期回显
          if (config.validTimeEnd) {
            that.setData({
              expireTime: util.formatTime(new Date(config.validTimeEnd))
            });
          }
          if (config.termSet == 1) {
            var expireTimeStr = "激活后" + config.validDay + "天有效";
            that.setData({
              expireTime: expireTimeStr
            });
          }
          if (data.model.record && record.expireTime) {
            that.setData({
              expireTime: util.formatTime(new Date(record.expireTime))
            });
          }

          let infor;
          if (config.extendInfo != null) {
            infor = JSON.parse(config.extendInfo);
          } else {
            infor = [];
          }
          var inforarr = [];
          if (infor.length > 0) {
            for (var n = 0; n < infor.length; n++) {
              var inforobj = {};
              inforobj.name = infor[n].name;
              inforobj.value = '';
              inforobj.isChecked = infor[n].isChecked;
              inforobj.tips = infor[n].tips;
              inforarr.push(inforobj)
            }
            that.setData({
              collectionInfo: inforarr
            })
          }
          that.setData({
            extendInfo: infor
          })
          let rightsObj = JSON.parse(config.rights);
          if ((rightsObj.switchEquity & Math.pow(2, 0)) != 0) { //isShowDiscount

            mArr.push("享受会员包邮");
            that.setData({
              isShowFree: true
            });

          }
          if ((rightsObj.switchEquity & Math.pow(2, 1)) != 0) {
            that.setData({
              discountTxt: parseFloat(rightsObj.discount / 10)
            });
            that.setData({
              isShowDiscount: true
            });
            mArr.push("会员折扣" + parseFloat(rightsObj.discount / 10) + "折");
          }
          if ((rightsObj.switchEquity & Math.pow(2, 2)) != 0) {
            that.setData({
              isShowCoupon: true
            });
            mArr.push("随卡获赠优惠券：" + rightsObj.nameList);
          }
          if ((rightsObj.switchEquity & Math.pow(2, 3)) != 0) {
            that.setData({
              isShowPoints: true
            });
            mArr.push("随卡获赠积分：" + rightsObj.onIntegral);
          }
          if ((rightsObj.switchEquity & Math.pow(2, 4)) != 0) {
            that.setData({
              isCollectDate: true
            });
          } else {
            that.setData({
              isCollectDate: false
            });
          }


          that.setData({
            rightCntArr: mArr,
            needKnowTxt: config.describeDetail,
            phoneNum: config.phone,
            curCardColor: cardColor[config.coverColor],
            nameColor: cardColor[config.nameColor]
          });

          if (data.model.isReceived) {

            that.setData({
              isReceived: data.model.isReceived,
              mcNumber: data.model.record.mcNumber,
              cardState: data.model.record.state
            });

            that.getPointsInfo();
          }
        }

      },
      fail: function() {

      },
      complete: function() {
        that.setData({
          isComplete: true
        })
        wx.hideLoading();
      }
    });
  },
  callService: function() {
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
  getCard: function(e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    var actmoney = e.currentTarget.dataset.activemoney;
    var activeType = e.currentTarget.dataset.activetype;
    that.setData({
      activeType: activeType
    });

    wx.redirectTo({
      url: "/pages/vipcard/vipcard_receive?id=" + that.data.configId
    });

  },
  // 领取会员卡
  getCard1: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    wx.showLoading({
      title: '领取中',
    });
    let reqUrl = '/applet/mobile/membercard/receiveMemberCard';
    let paramsData = {
      cusmallToken: cusmallToken,
      // phone: that.data.userPhone,
      // name: that.data.userName,
      // birthday: "",
      // wxCardId: that.data.wxCardId || "",
      cardId: that.data.cardId,
      // wxCode: "",
      // extendInfo: JSON.stringify(that.data.collectionInfo || ''),
      fromUid: app.globalData.fromuid || "",
      shopUid: app.globalData.shopuid || ""
    };
    
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
          let modalTxt = '领取成功';
          wx.showModal({
            title: '提示',
            content: modalTxt,
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                that.getVipCardInfo();
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
      success: function(res) {
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
            'success': function(res) {
              wx.showModal({
                title: '提示',
                content: "支付成功",
                showCancel: false,
                success: function(res) {
                  let pages = getCurrentPages(); //当前页面
                  let prevPage = pages[pages.length - 2]; //上一页面
                  wx.navigateTo({
                    url: "/pages/vipcard/vipcard_receive?id=" + ctx.data.configId
                  })
                }
              });
            },
            'fail': function(res) {

              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付",
                success: function(res) {
                  wx.showModal({
                    title: '提示',
                    showCancel: false,
                    content: '购买失败：' + res.data.msg,
                    success: function(res) {
                      wx.navigateBack({
                        delta: 1
                      })
                    }
                  })
                }
              })
            },
            complete: function() {
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
            success: function(res) {

            }
          });
          ctx.setData({
            isPaying: false
          });
        }


      },
      fail: function() {},
      complete: function() {}
    });
  },
  /* 字符去空格 */
  trim: function(s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  payCard: function() {
    if (!this.checkUserInfo()) {
      return false;
    }
    var ctx = this;
    var cardNumOrder = 'MCP' + '_' + ctx.data.recordId + '_' + ctx.data.uid + '_' + util.formatDate(new Date()).replace(/-/g, '');
    if (this.data.payStatus == 1) {
      cardNumOrder = 'MCPR' + '_' + ctx.data.recordId + '_' + ctx.data.uid + '_' + util.formatDate(new Date()).replace(/-/g, '');
    }
    ctx.getPayParams(ctx.data.cardName, cardNumOrder, ctx.data.activeMoney)
  },
  hideMask: function() {
    this.setData({
      isShowMask: true
    });
  },
  
  inputName: function(e) {
    this.setData({
      userName: e.detail.value
    })
  },
  inputPhone: function(e) {
    this.setData({
      userPhone: e.detail.value
    })
  },
  trimNum: function(num) {
    return num.replace(/^1[3|4|5|8][0-9]\d{4,8}$/g, "")
  },
  goToIndex: function() {
    let fromUid = app.globalData.fromuid || "";
    let shopUid = app.globalData.shopuid || "";
    wx.reLaunch({
      url: "/pages/index/index?fromuid=" + fromUid + "&shopuid=" + shopUid
    })
  },
  getPointsInfo: function() {
    let that = this;
    let fromuid = "";
    let shopuid = "";
    if (app.globalData.shopuid) {
      fromuid = app.globalData.fromuid;
      shopuid = app.globalData.shopuid
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/getMemberInfo',
      data: {
        cusmallToken: cusmallToken,
        fromUid: fromuid,
        shopUid: shopuid
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {

        let data = res.data;
        if (data && 0 == data.ret) {

          that.setData({
            curPoint: data.model.member.integral
          });


        } else {}

      },
      fail: function() {},
      complete: function() {}
    });
  },
  queryCoupon: function() { //查询优惠券
    wx.redirectTo({
      url: "/pages/coupon/mycoupon"
    });
  },
  toPointsList: function() { //去积分详情
    // wx.navigateTo({
    //   url: "/pages/uniquecenter/integratelist"
    // });
  },
  bindDateChange: function(e) {
    this.setData({
      date: e.detail.value
    })
  },
  //查询会员储值
  goToDeposit: function() {
    wx.navigateTo({
      url: "/pages/store/mystore",
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    let that = this;
    wx.hideShareMenu();

    that.data.options = options;
    app.getUserInfo(this, options, function(userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.setData({
        cardId: options.id
      });
      // that.setData({ cardId: 1 });//特殊定制，为了调试方便，不可提交
      that.getVipCardInfo();
      util.afterPageLoad(that);

    });

    this.setData({
      userInfo: app.globalData.userInfo
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {
    let that = this;
    let shareObj = that.getShareConfig();
    return shareObj;
  }
}))