// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
// pages/mycards/cardlist.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    cardList: [],
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    isLoading: false,
    default_bg: "/youdian/image/admin/xiaochengxu/vip/vipcard_bg.png",
    cardColor: {
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
    },
    curPage: 1,
    pageSize: 6,
    isBottom: false,
    userName: "",
    userPhone: "",
    sendedId: "",
    isShowMask: false,
    date: "",
    smsCode: '',
    extendInfo: "",
    isCollectDate: false,
    collectionInfo: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    wx.hideShareMenu();
    console.log(options);
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.getCardList(true);
      util.afterPageLoad(that);
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
    console.log(that);
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/common/sendCode',
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        phoneNum: that.data.userPhone,
        sceneType: 'recmcard_tel_code'
      },
      success: function (res) {
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

  getCardList: function (isPull) {
    let that = this;
    wx.showLoading({
      title: '加载中'
    });
    that.setData({ isLoading: true });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/membercard/queryMemberSendeds',
      data: {
        cusmallToken: cusmallToken,
        start: (that.data.curPage - 1) * that.data.pageSize,
        size: that.data.pageSize,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (isPull) {
          that.setData({ cardList: [] });
          if (0 == data.model.list.length) {
            that.setData({
              isBottom: true
            })

          }
        }

        let list = that.data.cardList;
        if (data && 0 == data.ret) {

          for (let i = 0; i < data.model.list.length; i++) {

            list.push(data.model.list[i]);
          }
          that.setData({
            cardList: list
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
        wx.stopPullDownRefresh();
        wx.hideLoading();
        that.setData({ isLoading: false });
      }
    });
  },
  inputName: function (e) {
    this.setData({ userName: e.detail.value })
  },
  inputPhone: function (e) {
    this.setData({ userPhone: e.detail.value })
  },
  inputs: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var name = e.currentTarget.dataset.name;

    this.setData({
      ["collectionInfo[" + idx + "].name"]: name,
      ["collectionInfo[" + idx + "].value"]: e.detail.value,

    })
  },
  /* 字符去空格 */
  trim: function (s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  hideMask: function () {
    this.setData({
      isShowMask: false
    });
  },
  toVipDetail: function (e) {
    let that = this;
    let target = e.currentTarget;
    let sta = target.dataset.sta;
    let sendid = target.dataset.sendid;
    let idx = target.dataset.idx;
    let pay = target.dataset.pay;
    let money = target.dataset.money;
    let activeSet = target.dataset.activeset;
    let termSet = target.dataset.termset;
    let infor;
    //activeSet不为可续费
    if (sta == 2 && activeSet != 2) {
      return;
    }
    //activeSet为可续费但不是固定时长会员卡
    if (sta == 2 && activeSet == 2 && termSet != 1) {
      return;
    }

    wx.getStorageSync("key", null)
    if (target.dataset.extendinfo != null) {
      infor = JSON.parse(target.dataset.extendinfo);
    } else {
      infor = [];
    }
    var inforarr = []
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
    } else {
      that.setData({
        collectionInfo: []
      })
    }

    that.setData({
      // 用户当前选择的会员卡和派发记录
      selCard: that.data.cardList[idx].cardConfig,
      selectRecord: that.data.cardList[idx].cardSended

    })
    if (-1 == sta || that.data.nonactivated) {
      if (pay == '1' || money <= 0 || that.data.nonactivated) {
        that.setData({
          // isShowMask: true,
          extendInfo: infor,
          sendedId: sendid
        });

        let rights = JSON.parse(target.dataset.rights || "{}")
        if ((rights.switchEquity & Math.pow(2, 4)) != 0) {
          that.setData({
            isCollectDate: true
          });
        } else {
          that.setData({
            isCollectDate: false
          });
        }
        wx.navigateTo({
          url: "/pages/vipcard/vipcard_receive?id=" + e.currentTarget.dataset.id
        });
        return;

      } else {
        wx.navigateTo({
          url: "/pages/vipcard/vipcard?id=" + e.currentTarget.dataset.id
        }); 
        return;

      }

    }

    wx.navigateTo({
      url: "/pages/vipcard/vipcard?id=" + e.currentTarget.dataset.id
    });
  },

  infoSubmit: function () {
    let that = this;
    let date = that.data.date.substring(5);
    if (!that.data.userName || !that.data.userPhone) {
      wx.showModal({
        title: '提示',
        content: '信息不能为空',
        showCancel: false,

      });
      return;
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
    // 手机验证码如果存在则不允许为空
    let smsCode = this.data.collectionInfo.some(function (item) {
      return (item.name == '短信验证' && item.isChecked)
    })
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
    if (that.data.collectionInfo && that.data.collectionInfo.length > 0) {
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

    let selCard = that.data.selCard;
    let selectRecord = that.data.selectRecord;
    // 当同步卡包id不为空，且用户未同步过微信卡包，没有线下码时才调用wx.addCard
    if (selCard.wxCardId && !selectRecord.mcOfflineNumber) {
      if (1 == selCard.state) {
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
          wxCardId: selCard.wxCardId,
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
              cardList: [
                {
                  cardId: selCard.wxCardId,
                  cardExt: cardExt
                }
              ],
              success: function (res) {
                console.log(res.cardList) // 卡券添加结果
                let wxCardId = res.cardList[0].cardId
                let wxCode = res.cardList[0].code
                that.activateMemberCard(date, wxCardId, wxCode);
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
          } else {
            wx.showModal({
              title: '提示',
              content: data.msg,
              showCancel: false,

            });
          }
        },
        fail() {

        },
        complete() {

        }
      });
    } else {
      that.activateMemberCard(date)

    }

  },
  activateMemberCard: function (date, wxCardId, wxCode) {
    let that = this;
    wx.showLoading({
      title: '提交中',
    });
    let paramsData = {
      cusmallToken: cusmallToken,
      sendedId: that.data.sendedId,
      phone: that.data.userPhone,
      name: that.data.userName,
      birthday: date,
      wxCardId: wxCardId || "",
      wxCode: wxCode || "",
      extendInfo: JSON.stringify(that.data.collectionInfo || ''),
      fromUid: app.globalData.fromuid || "",
      shopUid: app.globalData.shopuid || ""
    };
    if (that.data.smsCodeIs) {
      paramsData.messCode = that.data.smsCode
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/membercard/activateMemberCard',
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
            content: '领取成功',
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
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
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
  onShow: function (value) {
    if (this.data.nonactivated) {
      this.setData({
        isShowMask: true
      })
    }
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
    let that = this;
    this.setData({
      cardList: []
    });
    if (this.data.isLoading) {
      return;
    }
    that.setData({ curPage: 1 });
    this.getCardList(true);

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    let that = this;
    if (this.data.isLoading) {
      return;
    }
    that.setData({ curPage: that.data.curPage + 1 });
    this.getCardList(false);
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
