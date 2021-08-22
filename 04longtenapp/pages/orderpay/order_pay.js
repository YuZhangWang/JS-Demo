// order_pay.js
var cf = require("../../config.js");
//获取应用实例
var app = getApp();
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    id: "",
    orderData: {},
    goodsList: [],
    deliveryTxt: "-",
    btnLoading: false,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    totalPrice: 0,
    allPrice: 0,
    siteType: "",
    showAddr: "",
    cardPrice: 0,
    depositPrice: 0,
    integralPrice: 0,
    useIntegral: 0,
    giftCardDiscountMoney: 0,
    showModal: false,
    selectedPay: -1,
    openWxpay: false,
    openDaofu: false,
    openDianfu: false,
    noDeliveryPrice: 0,
    promotionUrl: "",
    promotionImg: "",
    promotionName: "",
    selectedPayName: "支付订单",
    addrTitle: "",
    promotionSwitch: 0,
    isIntegralGoods: false,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = wx.getStorageSync('mallSiteId');
    wx.hideShareMenu();
    this.setData({
      app: getApp()
    })
    if (options.isVirtual == 'null') {
      this.setData({
        goodsVirtual: false
      });
    } else {
      this.setData({
        goodsVirtual: true
      });
    }
    wx.setNavigationBarTitle({
      title: "支付确认",
    });
    this.setData({
      id: options.id,
      siteType: options.sitetype,
      showAddr: options.showaddr,
      orderNo: options.orderNo
    });

    this.fetchData();

    this.fetchPromotionData();
  },

  fetchPromotionData: function() {
    var ctx = this;
    let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/paymentPromotion/queryPaymentPromotion',
      data: {
        cusmallToken: cusmallToken,
        uid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var promotion = res.data.model.result;
          ctx.setData({
            promotionUrl: promotion.skipLink,
            promotionName: promotion.skipLinkName,
            promotionImg: promotion.imgUrl,
            promotionSwitch: promotion.functionSwitch,
            promotionOrderPrice: promotion.orderPrice,
            promotionCondition: promotion.participateCondition
          })
          if ((promotion.participateCondition & (Math.pow(2, 0))) != 0) {
            ctx.setData({
              wxflag: 1
            })
          }
          if ((promotion.participateCondition & (Math.pow(2, 1))) != 0) {
            ctx.setData({
              huodaoflag: 1
            })
          }
          if ((promotion.participateCondition & (Math.pow(2, 2))) != 0) {
            ctx.setData({
              daodianflag: 1
            })
          }



        } else {

        }
      }
    })
  },

  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function() {},
  /**
   * 隐藏模态对话框
   */
  hideModal: function() {
    this.setData({
      showModal: false
    });
  },
  /**
   * 对话框取消按钮点击事件
   */
  onCancel: function() {
    this.hideModal();
    wx.redirectTo({
      url: '/pages/uniquecenter/uniquecenter',
    })
  },
  /**
   * 对话框确认按钮点击事件
   */
  onConfirm: function() {
    this.hideModal();
    wx.redirectTo({
      url: '/pages/orderlist/orderlist?status=',
    })
  },
  fetchData: function() {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    let submitData = {
      cusmallToken: cusmallToken,
    };
    if (that.data.orderNo) {
      submitData.orderNo = that.data.orderNo;
    }
    if (that.data.id) {
      submitData.parId = that.data.id
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getOrderDetail',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log(res.data);
        if (res.data.ret == 0) {
          var parOrder = res.data.model.parOrder;
          if (parOrder.extend) {
            parOrder.extend = JSON.parse(parOrder.extend);
          }
          that.getPayType();
          if ("yuyue" == that.data.siteType) {

            that.setData({
              addrTitle: "预约地址"
            });
          } else {
            if (3 == parOrder.wayType) {
              var lastindex = parOrder.address.lastIndexOf("\)");
              parOrder.address = parOrder.address.substring(0, lastindex + 1);
              that.setData({
                addrTitle: "自取地址"
              });

            } else {
              that.setData({
                addrTitle: "收货地址"
              });
            }
          }

          /* 支付方式过滤 */
          let toStorePay = true, //到店支付
              arrivalPay=true;  // 货到付款
          if (parOrder.orderType == 1 && parOrder.wayType==1) {  //商城--快递配送
            toStorePay = false;
          }
          if (parOrder.orderType == 1 && parOrder.wayType==3) {  //商城--到店自提
            arrivalPay = false;
          }
          if (parOrder.orderType == 2 && parOrder.foodType==3) {  //外卖--外卖配送
            toStorePay = false;
          }
          if (parOrder.orderType == 2 && (parOrder.foodType==1 || parOrder.foodType==2)) {  //外卖--到店堂食/到店自提
            arrivalPay = false;
          }
          if (parOrder.orderType==3) {
            arrivalPay = false;
          }

          that.setData({
            orderData: parOrder,
            arrivalPay,
            toStorePay,
            isIntegralGoods: 5 == parOrder.orderType ? true : false,
          });

          that.setData({
            totalPrice: parOrder.totalPrice
          });

          that.setData({
            goodsList: JSON.parse(parOrder.goodsList)
          });

          that.setData({
            cardPrice: parOrder.cardPrice
          });

          // 礼品卡
          if (parOrder.orderDiscount){
            that.setData({
              giftCardDiscountMoney: JSON.parse(parOrder.orderDiscount).giftCardDiscountMoney
            });
          }

          that.setData({
            integralPrice: parOrder.integralPrice
          });
          that.setData({
            useIntegral: parOrder.useIntegral
          });
          that.setData({

          })

          var allPrice = parOrder.totalPrice;
          if (parOrder.deliveryPrice == null || parOrder.deliveryPrice == 0) {
            that.setData({
              deliveryTxt: "商家承担运费"
            });
          } else {
            that.setData({
              deliveryTxt: that.data.app.globalData.currencySymbol + (parOrder.deliveryPrice / 100).toFixed(2)
            });
            allPrice = parOrder.totalPrice + parOrder.deliveryPrice;
          }
          if (parOrder.isDeliveryToStore && parOrder.orderType == 1) {
            that.setData({
              deliveryTxt: "运费到付"
            });
          }

          // 计算优惠金额
          if (parOrder.ticketId) {
            allPrice = allPrice - parOrder.ticketPrice;
          }
          if (allPrice < 0) {
            allPrice = 0;
          }
          // that.setData({ allPrice: allPrice});以前的接口
          that.setData({
            allPrice: parOrder.actualPrice
          }); //现在不用手动计算
          that.setData({
            noDeliveryPrice: parOrder.actualPrice - parOrder.deliveryPrice
          });

          if (parOrder.orderType == 2 && (parOrder.foodType == 1 || parOrder.foodType == 2)) {
            that.setData({
              fromToStore: true
            });
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取订单信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  getPayType: function() {
    let self = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getPayType',
      data: {
        cusmallToken: cusmallToken,
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let flag = -1;
          self.setData({
            openWxpay: data.model.openWxpay
          });
          self.setData({
            openDaofu: data.model.openDaofu
          });
          self.setData({
            openDianfu: data.model.openDianfu
          });
          if (data.model.openWxpay) {
            flag = 0;
            self.setData({
              selectedPay: 0
            });
          }
          if (data.model.openDaofu && -1 == flag) {
            flag = 1;
            self.setData({
              selectedPay: 1
            });
          }
          if (data.model.openDianfu && -1 == flag) {
            flag = 2;
            self.setData({
              selectedPay: 2
            });
          }

          if (self.data.isIntegralGoods) {
            self.setData({
              selectedPay: 3
            });
            flag = 3;
          }

          self.getSelectedPayName(flag);

        }
      }
    });
  },
  setPrepayId: function(orderId, prepayId) {
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/setPrepayId',
      data: {
        cusmallToken: cusmallToken,
        id: orderId,
        prepayId: prepayId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          console.info("设置订单模板ID成功");
        } else {
          console.error("设置订单模板ID失败");
        }
      }
    })
  },

  onPayOrder: function() {

    var that = this;
    // 订阅消息
    // mall
    let msgMall = [{
        name: 'order',
        msgcode: "1003"
      },
      {
        name: 'order',
        msgcode: "1004"
      }
    ];
    if (that.data.fromToStore) {
      msgMall.push({
        name: 'order',
        msgcode: "1010"
      })
    }
    // yuyue
    let msgYuyue = [{
      name: 'order',
      msgcode: "1003"
    }, {
      name: 'order',
      msgcode: "1006"
    }]

    if (that.data.selectedPay == 0 && that.data.wxflag == 1) {
      that.setData({
        showPromotion: true
      })
    } else if (that.data.selectedPay == 1 && that.data.huodaoflag == 1) {
      that.setData({
        showPromotion: true
      })
    } else if (that.data.selectedPay == 2 && that.data.daodianflag == 1) {
      that.setData({
        showPromotion: true
      })
    } else {
      that.setData({
        showPromotion: false
      })
    }
    // 扣除优惠金额后如果金额等于0则不发起微信支付
    if (that.data.allPrice <= 0 || 5 == that.data.orderData.orderType) {
      wx.hideLoading();
      that.requestSubMsg(
        that.getMsgConfig(that.data.siteType == 'yuyue' ? msgYuyue : msgMall),
        function(resp) {
          console.log(resp)
          that.setData({
            showModal: true
          })
        });
      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/order/sendPickThingMsg',
        data: {
          out_trade_no: that.data.orderData.orderNum,
          total_fee: that.data.allPrice
        }
      });
      return;
    }

    if (-1 == this.data.selectedPay) {
      wx.showModal({
        title: '温馨提示',
        showCancel: false,
        success: function(res) {

        },
        content: "请选择支付方式"
      });
      return;
    }
    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({
      btnLoading: true
    });
    let toUrl = "";
    if (3 == that.data.orderData.orderType) {
      toUrl = "/pages/yuyue/yyorderinfo?orderid=" + that.data.orderData.id
    } else {
      toUrl = "/pages/orderinfo/orderinfo?orderid=" + that.data.orderData.id + "&virtual=" + that.data.goodsVirtual
    }

    if (1 == that.data.selectedPay || 2 == that.data.selectedPay) {
      let payType = 1 == that.data.selectedPay ? 3 : 4;

      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/order/payToOrder',
        data: {
          cusmallToken: cusmallToken,
          orderId: that.data.orderData.id,
          payType: payType
        },
        header: {
          'content-type': 'application/json'
        },
        success: function(res) {
          wx.hideLoading();
          let data = res.data;
          if (data && 0 == data.ret) {

            that.setData({
              showModal: true
            })

          } else {

            wx.showModal({
              title: '温馨提示',
              confirmText: "关闭",
              cancelText: "取消",
              success: function(res) {
                if (res.confirm) {
                  wx.redirectTo({
                    url: toUrl
                  })
                } else {
                  wx.navigateBack({
                    delta: 1
                  })
                }
              },
              content: data.msg
            });
          }
        }
      });
      return;
    } else {
      that.requestSubMsg(
        that.getMsgConfig(that.data.siteType == 'yuyue' ? msgYuyue : msgMall),
        function(resp) {
          console.log(resp)
          wx.request({
            url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
            method: "POST",
            data: {
              cusmallToken: cusmallToken,
              goodDescribe: that.data.orderData.goodsNames,
              out_trade_no: that.data.orderData.orderNum,
              total_fee: that.data.allPrice
            },
            header: {
              'content-type': 'application/x-www-form-urlencoded'
            },
            success: function(res) {
              if (res.data.ret == 0) {
                var wxOrderData = res.data.model.wxOrderData;
                wx.hideLoading();

                // 设置订单模板ID
                that.setPrepayId(that.data.orderData.id, wxOrderData.package.split("=")[1]);

                wx.requestPayment({
                  'timeStamp': wxOrderData.timeStamp,
                  'nonceStr': wxOrderData.nonceStr,
                  'package': wxOrderData.package,
                  'signType': wxOrderData.signType,
                  'paySign': wxOrderData.paySign,
                  'success': function(res) {
                    that.setData({
                      showModal: true
                    })



                  },
                  'fail': function(res) {
                    that.setData({
                      btnLoading: false
                    });
                    wx.hideLoading();
                    wx.showModal({
                      title: '支付失败',
                      confirmText: "关闭",
                      cancelText: "取消",
                      content: "尚未完成支付",
                      complete: function(res) {
                        if (res.confirm) {
                          wx.redirectTo({
                            url: toUrl
                          })
                        } else {
                          wx.navigateBack({
                            delta: 1
                          })
                        }
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

        });
    }





  },
  selectPayType: function(e) {
    let type = e.currentTarget.dataset.type;
    console.log(type);
    this.setData({
      selectedPay: type
    })
    this.getSelectedPayName(type);
  },
  getSelectedPayName: function(type) {
    type = parseInt(type);
    switch (type) {
      case 0:
        this.setData({
          selectedPayName: "微信支付"
        });
        break;
      case 1:
        this.setData({
          selectedPayName: "货到付款"
        });
        break;
      case 2:
        this.setData({
          selectedPayName: "到店支付"
        });
        break;
      default:
        this.setData({
          selectedPayName: "支付订单"
        });

    }
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
    let pages = getCurrentPages();
    let currPage = null;
    if (pages.length) {
      // 获取当前页面的前以页面的对象
      currPage = pages[pages.length - 2];
    }
    // 获取当前页面的前一页面的路由
    let route = currPage.route;
    if (route==='pages/detail/detail') {
      currPage.fetchData();
    }

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

  }
}))
