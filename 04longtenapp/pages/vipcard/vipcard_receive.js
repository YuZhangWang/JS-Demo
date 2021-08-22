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
    collectionInfo: []
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
        phoneNum: that.data.userPhone,
        sceneType: 'recmcard_tel_code'
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
  //客户定制，跳转到小程序
  linkToMin: function () {
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
  goToLink: function (e) {
    let type = e.currentTarget.dataset.type;
    let that = this;
    wx.navigateTo({
      url: that.data.linkType[type],
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
  tapKnow: function () {
    var that = this;

    that.setData({
      isShowKnow: !that.data.isShowKnow
    })
  },
  showQrcode: function () {
    var that = this;
    that.setData({
      showModel: !that.data.showModel
    })
  },
  tapShip: function () {
    this.setData({
      isShipShow: !this.data.isShipShow
    });
    console.log(this.data.isShipShow)
  },
  delVipCard: function () {
    wx.showModal({
      title: '提示',
      content: '是否删除会员卡',
      success: function (res) {
        if (res.confirm) {
          console.log('删除成功')
        } else if (res.cancel) {
          console.log('删除取消')
        }
      }
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
  radioChange:function(e){
    var idx = e.currentTarget.dataset.idx;
    var name = e.currentTarget.dataset.name;

    this.setData({
      ["collectionInfo[" + idx + "].name"]: name,
      ["collectionInfo[" + idx + "].value"]: e.detail.value,

    })
  },
  getVipCardInfo: function () {
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
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let config = data.model.config;
          let record = data.model.record;
          let mArr = []
          that.setData({
            shopName: config.shopName
          });
          if (data.model.record) {
            that.setData({
              statu: data.model.record.statu,
              recordId: record.id,
              uid: record.uid,
              payStatus: record.value4
            })
            
          }
          that.setData({
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
              inforobj.value = infor[n].type && infor[n].type == 2 ? infor[n].options[0].name : '';
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
            rightCntArr: mArr
          });
          that.setData({
            needKnowTxt: config.describeDetail
          });
          that.setData({
            phoneNum: config.phone
          });
          that.setData({
            curCardColor: cardColor[config.coverColor],
            nameColor : cardColor[config.nameColor]
          });
          if (data.model.isReceived) {
            that.setData({
              isReceived: data.model.isReceived
            });
            that.setData({
              mcNumber: data.model.record.mcNumber
            });
            that.setData({
              cardState: data.model.record.state
            });
            that.getPointsInfo();
          }
        }

      },
      fail: function () {

      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
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
 
  /* 字符去空格 */
  trim: function (s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  
  
  infoSubmit: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    let date = that.data.date.substring(5);
    let wxCardId = that.data.wxCardId;
    var activeType = e.currentTarget.dataset.activetype;
    that.setData({ activeType: activeType });
    if (!that.data.userName || !that.data.userPhone) {
      wx.showModal({
        title: '提示',
        content: '信息不能为空',
        showCancel: false,

      });
      return;
    }
    // 手机验证码如果存在则不允许为空
    let smsCode = this.data.collectionInfo.some(function (item) {
      return (item.name == '短信验证' && item.isChecked)
    });
    if (smsCode) {
      that.setData({
        smsCodeIs: true
      })
    }
    if (smsCode && (!that.data.smsCode || that.data.smsCode.length < 4)) {
      wx.showModal({
        title: '提示',
        content: '验证码无效',
        showCancel: false,

      });
      return;
    }
    if (that.data.collectionInfo.length > 0) {
      for (var i = 0; i < that.data.collectionInfo.length; i++) {
        if (that.data.collectionInfo[i].name == '短信验证') {
          continue
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
    if (that.data.isCollectDate) {
      if (!date) {
        wx.showModal({
          title: '提示',
          content: '信息不能为空',
          showCancel: false,

        });
        return;
      }
    }
    if (!util.phoneValidate(that.data.userPhone)) {
      wx.showModal({
        title: '提交信息异常',
        content: '联系电话填写有误',
      });
      return;
    }


    if (wxCardId) {
      if (1 == that.data.cardState) {
        wx.showModal({
          title: '提示',
          content: '会员卡未投放暂不能领取',
          showCancel: false,

        });
        return;
      }
      var mallSite = wx.getStorageSync('mallSite');
      var mUid = mallSite.uid;
      wx.request({
        url: cf.config.pageDomain + "/applet/mobile/membercard/getWxCardSignature",
        data: {
          wxCardId: wxCardId,
          uid: mUid
        },
        method: "GET",
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          let data = res.data;
          if (0 == data.ret) {
            let nonce_str = data.model.nonce_str;
            let timestamp = data.model.timestamp;
            let signature = data.model.signature;
            let cardExt = {
              nonce_str: nonce_str,
              timestamp: timestamp,
              signature: signature
            };
            cardExt = JSON.stringify(cardExt);
            console.log(cardExt)
            wx.addCard({
              cardList: [{
                cardId: wxCardId,
                cardExt: cardExt
              }],
              success: function (res) {
                console.log(res.cardList) // 卡券添加结果
                let wxCardId = res.cardList[0].cardId
                let wxCode = res.cardList[0].code
                that.receiveMemberCard(date, wxCardId, wxCode);
              },
              fail: function (err) {
                console.log(err);
                let msgErr = JSON.stringify(err);
                wx.showModal({
                  title: '提示',
                  content: msgErr,
                  showCancel: false,

                });
              },
              complete: function (e) {
                console.log(e)
              }
            })
          }
        },
        fail() {

        },
        complete() {

        }
      });
    } else {
      that.receiveMemberCard(date)
    }
  },
  receiveMemberCard: function (date, wxCardId, wxCode) {
    let that = this;
    wx.showLoading({
      title: '提交中',
    });
    let reqUrl = that.data.activeType ? '/applet/mobile/membercard/activateMemberCard' : '/applet/mobile/membercard/receiveMemberCard';
    let paramsData = {
      cusmallToken: cusmallToken,
      phone: that.data.userPhone,
      name: that.data.userName,
      birthday: date,
      wxCardId: wxCardId || "",
      wxCode: wxCode || "",
      extendInfo: JSON.stringify(that.data.collectionInfo || ''),
      fromUid: app.globalData.fromuid || "",
      shopUid: app.globalData.shopuid || ""
    };
    if (that.data.activeType) {
      paramsData.sendedId = that.data.recordId
    } else {
      paramsData.cardId = that.data.cardId
    }

    if (that.data.smsCodeIs) {
      paramsData.messCode = that.data.smsCode;
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
          let modalTxt = that.data.activeType ? '激活成功' : '领取成功';
          wx.showModal({
            title: '提示',
            content: modalTxt,
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                wx.redirectTo({
                  url: "/pages/mycards/cardlist"
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
  inputName: function (e) {
    this.setData({
      userName: e.detail.value
    })
  },
  inputPhone: function (e) {
    this.setData({
      userPhone: e.detail.value
    })
  },
  trimNum: function (num) {
    return num.replace(/^1[3|4|5|8][0-9]\d{4,8}$/g, "")
  },
  goToIndex: function () {
    let fromUid = app.globalData.fromuid || "";
    let shopUid = app.globalData.shopuid || "";
    wx.reLaunch({
      url: "/pages/index/index?fromuid=" + fromUid + "&shopuid=" + shopUid
    })
  },
  getPointsInfo: function () {
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
      success: function (res) {

        let data = res.data;
        if (data && 0 == data.ret) {

          that.setData({
            curPoint: data.model.member.integral
          });


        } else {
        }

      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  queryCoupon: function () { //查询优惠券
    wx.redirectTo({
      url: "/pages/coupon/mycoupon"
    });
  },
  toPointsList: function () { //去积分详情
    // wx.navigateTo({
    //   url: "/pages/uniquecenter/integratelist"
    // });
  },
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },
  //查询会员储值
  goToDeposit: function () {
    wx.navigateTo({
      url: "/pages/store/mystore",
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
