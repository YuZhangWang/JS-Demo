// pages/offline/pay.js
var Zan = require('../../youzan/dist/index');
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var CouponHandle = require("../template/couponhandle.js");
var app = getApp();
var baseHandle = require("../template/baseHandle.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var Switch = require('../../youzan/dist/switch/index.js');
var cardHandle = require("../template/cardlist.js");
var giftcardHandle = require("../template/giftcardlist.js");
var mallSite = wx.getStorageSync("mallSite");

Page(Object.assign({}, Zan.Field, Zan.Toast, baseHandle, giftcardHandle, CouponHandle, cardHandle, Switch, {
  handleZanSwitchChange({
    componentId,
    checked
  }) {
    let that = this;
    // componentId 即为在模板中传入的 componentId
    // 用于在一个页面上使用多个 switch 时，进行区分
    // checked 表示 switch 的选中状态

    if ("switch1" == componentId) {

      if (checked) {
        this.setData({
          enableDepositSW: true
        });
        this.setData({
          enableDepositChe: true
        });
      } else {
        this.setData({
          enableDepositSW: false
        });
        this.setData({
          enableDepositChe: false
        });
      }
    } else if ("switch2" == componentId) {

      if (checked) {
        this.setData({
          enablePointsSW: true
        });
        this.setData({
          enablePointsChe: true
        });
      } else {
        this.setData({
          enablePointsSW: false
        });
        this.setData({
          enablePointsChe: false
        });
        this.setData({
          showPoints: 0
        });
        this.setData({
          showPointsPrice: 0
        });
      }
    }

    that.refreshPrice();

  }
}, {
  data: {
    inputContent: {},
    app: app,
    needUserInfo: true,
    showCouponList: false,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    enableDepositItemValue: true,
    enableDepositSW: false,
    enableDeposit: 0,
    enableDepositChe: false,
    skipUserInfoOauth: true, //是否跳过授权弹出框
    authType: 1, //拒绝授权 停留当前页

    enablePointsItemValue: true,
    enablePointsSW: false,
    enablePoints: 0,
    // pointsToMoney: 0,
    enablePointsChe: false,
    isIntegralDeduct: false,
    isOpenDeposit: false,
    isMaxIntegral: false,

    integralKey: 0, //每xx积分
    integralVal: 0, //减xx分(单位为分)
    showPoints: 0,
    showPointsPrice: 0,
    maxDeductible: 0,

    selDiscount: 0,
    selectedCard: null,
    cardList: [],
    limittype: "",
    preferenceCodeList: [] //优惠码
      ,
    preference: 0,
    couponFlag: false,
    limit: 10,
    total: 0,
    scrollTop: 0
  },

  handleZanFieldChange(e) {
    var that = this;
    const {
      componentId,
      detail
    } = e;
    that.setData({
      ["inputContent." + componentId]: detail.value
    });
    this.refreshPrice(); //输入框变化时刷新价格
  },
  // 获取优惠券信息
  fetchCouponList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/coupon/getToStoreCoupon',
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          that.setData({
            couponList: res.data.model.records
          });
          if (res.data.model.records.length > 0) {
            //that.setData({ "selectedCoupon": res.data.model.records[0] });
          }
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取优惠券信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },

  //获取会员卡信息
  fetchCardList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/membercard/getToStoreCard',
      data: {
        cusmallToken: cusmallToken,
        toStoreId: that.data.id,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          that.setData({
            cardList: res.data.model.list
          });
          if (res.data.model.list.length > 0) {
            //that.setData({ "selectedCoupon": res.data.model.records[0] });

          }
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取会员卡信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  //获取礼品卡信息
  fetchGiftCardList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/getToStoreGiftCard',
      data: {
        cusmallToken: cusmallToken,
        toStoreId: that.data.id,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        mallSiteId: wx.getStorageSync('mallSiteId')

      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          let list = res.data.model.records || []
          that.setData({
            giftcardList: list
          });
          
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
  refreshPrice: function() {
    let that = this;
    let total = Math.floor(that.data.inputContent.payMoney * 100);
    if (total > 0) {
      if (this.data.selectedCoupon) {
        if (2 == this.data.selectedCoupon.type) {
          total -= (total - this.data.selectedCoupon.discount / 100 * total);
        } else {

          total -= this.data.selectedCoupon.money;
        }
      }
      if (this.data.selectedGiftCard) {
        total -= this.data.selectedGiftCard.money;
      }
      if (this.data.selectedCard) {
        if (2 == this.data.selectedCard.state && this.data.selDiscount) {
          total = total * (this.data.selDiscount / 100);
          that.setData({
            selDiscount: this.data.selDiscount
          })
        }
      }
      if (0 < total && that.data.enableDepositSW) {
        total -= that.data.enableDeposit;
      }
      if (0 < total && that.data.enablePointsSW) {
        let showPoints = parseInt(that.data.enablePoints / that.data.integralKey) * that.data.integralKey;
        let showPointsPrice = parseInt(that.data.enablePoints / that.data.integralKey) * that.data.integralVal;
        if (total < showPointsPrice) {
          showPoints = Math.ceil(total / that.data.integralVal) * that.data.integralKey;
          showPointsPrice = total;
        }
        //启用最大折扣 & 抵扣金额超过最大抵扣金额限制，则抵扣金额为最大抵扣金额
        if (that.data.isMaxIntegral && showPointsPrice > that.data.maxDeductible) {
          showPoints = parseInt(that.data.maxDeductible / that.data.integralVal) * that.data.integralKey;
          showPointsPrice = that.data.maxDeductible;
        }
        this.setData({
          showPoints: showPoints
        });
        this.setData({
          showPointsPrice: showPointsPrice
        });
        total -= parseInt(that.data.enablePoints / that.data.integralKey) * that.data.integralVal; //可以减多 分

      }

    } else {
      this.setData({
        showPoints: 0
      });
      this.setData({
        showPointsPrice: 0
      });
    }
  },
  //获取储蓄金金额和积分
  getDeposit: function() {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/getMemberInfo',
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {

        let data = res.data;
        if (data && 0 == data.ret) {
          that.setData({
            enableDeposit: data.model.member.totalDepositBalance
          }); //可用储值金
          that.setData({
            enablePoints: data.model.member.integral
          }); //可用积分

          if (0 <= that.data.enableDeposit) {
            that.setData({
              enableDepositItemValue: false
            });
          }
          if (0 <= that.data.enablePoints) {
            that.setData({
              enablePointsItemValue: false
            });
          }
        } else {}

      },
      fail: function() {},
      complete: function() {}
    });
  },
  handlePay(e) {
    var that = this;
    var payMoney = that.data.inputContent.payMoney;
    if (payMoney) {
      if (isNaN(payMoney)) {
        that.showZanToast('金额必须是数字');
        return false;
      }
      that.setData({
        "btnLoading": true
      });
      that.payOrder();
    } else {
      that.showZanToast('请输入金额');
    }
  },
  payOrder: function() {
    var discountId = this.data.discountId
    var that = this;
    wx.showLoading({
      title: '订单提交中',
    });


    var payMoney = Math.round(that.data.inputContent.payMoney * 10000) / 100;
    that.setData({
      btnLoading: true
    });
    var mcid = "";
    if (that.data.selectedCard) {
      var mcid = that.data.selectedCard.id;
    }
    var submitData = {
      uid: cf.config.uid,
      cusmallToken: cusmallToken,
      storeId: that.data.payInfo.id,
      remark: that.data.inputContent.remark || "",
      amount: payMoney,
      mcId: mcid,
      isUseDeposit: that.data.enableDepositSW,
      isUseIntegral: that.data.enablePointsSW,
      dicountcodeId: discountId || ""
    }
    if (that.data.selectedCoupon) {
      submitData.ticketId = that.data.selectedCoupon.id || "";
    }
    if (that.data.selectedGiftCard) {
      submitData.giftCardRecordId = that.data.selectedGiftCard.id || "";
    }
    wx.request({
      url: cf.config.pageDomain + '/mobile/tostore/saveOrder',
      method: "POST",
      data: submitData,
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var wxOrderData = res.data.model.order;
          wx.hideLoading();
          that.generateWxPayOrder(wxOrderData);
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '支付订单异常',
            showCancel: false,
            content: res.data.msg || "服务器异常"
          });
          that.setData({
            "btnLoading": false
          });
        }
      }
    })

  },
  generateWxPayOrder: function(orderData) {
    var that = this;
    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({
      btnLoading: true
    });

    var totalMoney = orderData.amount;
    /**
    if (orderData.ticketId) {
      totalMoney = totalMoney - orderData.ticketPrice;
      if (totalMoney < 0) {
        totalMoney = 0;
      }
    }
    */
    // 扣除优惠金额后如果金额等于0则不发起微信支付
    if (totalMoney == 0) {
      wx.hideLoading();
      wx.redirectTo({
        url: 'payresult?payResult=success&orderId=' + orderData.id
      })
      return;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: "当面付",
        out_trade_no: orderData.orderNum,
        total_fee: totalMoney
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var wxOrderData = res.data.model.wxOrderData;
          wx.hideLoading();
          wx.requestPayment({
            'timeStamp': wxOrderData.timeStamp,
            'nonceStr': wxOrderData.nonceStr,
            'package': wxOrderData.package,
            'signType': wxOrderData.signType,
            'paySign': wxOrderData.paySign,
            'success': function(res) {
              wx.redirectTo({
                url: 'payresult?payResult=success&orderId=' + orderData.id,
              })
            },
            'fail': function(res) {
              console.log(res);
              that.setData({
                btnLoading: false
              });
              wx.hideLoading();
              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付",
                complete: function(res) {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              })

            }
          })
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '支付订单异常',
            showCancel: false,
            content: res.data.msg || "服务器异常",
            complete: function(res) {
              wx.navigateBack({
                delta: 1
              })
            }
          })
        }
      }
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    //options.scene = "id=19&version=1";
    wx.hideShareMenu();
    that.data.options = options;
    if (options.scene) {
      var scene = decodeURIComponent(options.scene);
      that.data.scene = scene.split("&");
      that.data.id = that.data.scene[0].split("=")[1];
    } else if (options.id) {
      that.data.id = options.id;
    }
    that.data.options = options;
    if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
      that.setData({
        noAuthInfo: false
      })
    } else {
      that.setData({
        noAuthInfo: true
      })
    }
    app.getUserInfo(this, options, function(userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      var mallSite = wx.getStorageSync('mallSite');
      that.fetchData();
      util.afterPageLoad(that);
    })
  },
  findCouponFormList: function(couponId) {
    for (var i = 0; i < this.data.couponList.length; i++) {
      if (couponId == this.data.couponList[i].id) {
        return this.data.couponList[i];
      }
    }
  },
  multInit() {
    var discountId = this.data.preferenceCodeId;
    this.setData({
      discountId: discountId
    })
    if (discountId && discountId != "" && this.data.limittype !== "3") {
      this.setData({
        selectedPreference: ""
      })
      wx.showToast({
        title: '该优惠码类型不适用于此商品',
        icon: "none",
        duration: 2000
      })
      return
    }
  },

  handleCouponModalTap: function(e) {
    var that = this;
    var target = e.target;
    if (target) {
      var action = target.dataset.action;
      if ("selectCoupon" == action) {
        var couponId = e.target.dataset.id;
        if (couponId == -1) {
          that.setData({
            "selectedCoupon": null
          });
          return;
        }
        var selectedCoupon = that.findCouponFormList(couponId);
        that.setData({
          "selectedCoupon": selectedCoupon
        });
      } else if ("closeModal" == action) {
        that.setData({
          "showCouponList": false
        });
      }
    }
  },

  handleCouponModalOpen: function(e) {
    this.setData({
      "showCouponList": true
    });
  },

  handleCouponModalClose: function(e) {
    this.setData({
      "showCouponList": false
    });
  },
  //优惠码
  changeToCode: function(e) {
    let code = e.detail.value;
    this.setData({
      preferenceCode: code
    })

  },
  //优惠码兑换
  convert: function() {
    this.setData({
      couponFlag: true,
      limit: 10,
      scrollTop: 0,
      total: 0
    })
    var that = this;
    console.log(that.data.preferenceCode)
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/useDiscountCode',
      data: {
        cusmallToken: cusmallToken,
        discountCode: that.data.preferenceCode || "",
        shopUid: mallSite.uid || "",
        start: 0,
        limit: that.data.limit || 10
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var data = res.data;
          that.setData({
            preferenceCodeList: data.model.result,
            total: data.model.total
            // discountId:preferenceCodeList.
          })
          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取优惠码异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  fetchData: function() {
    var that = this;
    var mallSite = wx.getStorageSync('mallSite');
    wx.showLoading({
      title: '加载中',
    });
    var id = that.data.id;
    wx.request({
      url: cf.config.pageDomain + '/mobile/tostore/selectToStore',
      data: {
        id: id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log(res);
        if (res.data.ret == 0) {
          var payInfo = res.data.model.result;
          if (payInfo) {
            that.setData({
              isIntegralDeduct: res.data.model.result.integral,
            });
            that.setData({
              isMaxIntegral: res.data.model.result.isMaxIntegral,
            });
            that.setData({
              isOpenDeposit: res.data.model.result.deposit
            });
            that.setData({
              integralKey: res.data.model.globalConfig.integralKey || 0
            });
            that.setData({
              integralVal: res.data.model.globalConfig.integralVal || 0
            });
            that.setData({
              maxDeductible: res.data.model.globalConfig.maxDeductible || 0
            });
            that.setData({
              focusOfficial: res.data.model.result.focusOfficial
            })
            if (that.data.scene && that.data.scene[1].split("=")[1] != payInfo.version) {
              wx.redirectTo({
                url: 'payresult?payResult=overdue',
              });
              return;
            }

            wx.setNavigationBarTitle({
              title: payInfo.name + "正向您收款"
            })
            that.setData({
              "payInfo": payInfo
            });
            if (payInfo.coupon) {
              that.fetchCouponList();
            }
            if (payInfo.memberCard) {
              that.fetchCardList();
            }
            if (payInfo.giftCard) {
              that.fetchGiftCardList();
            }

            //储蓄金
            that.getDeposit();
          } else {
            wx.redirectTo({
              url: 'payresult?payResult=disabled',
            })
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取店铺信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  }
}));