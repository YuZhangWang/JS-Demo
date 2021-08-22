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
    id: "",
    orderData: {},
    app: app,
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
    addrTitle: "收货地址",
    promotionSwitch: 0,
    isIntegralGoods: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = wx.getStorageSync('mallSiteId');
    wx.hideShareMenu();
   
    wx.setNavigationBarTitle({
      title: "支付确认",
    });
    this.setData({ id: options.id });
    this.reqAtyingGoodsOrder(options.activityId,options.goodsId)
    

  },
  
  reqAtyingGoodsOrder: function (activityid, awardsTypeId, cb) {
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardOrder',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityid,
        awardId: awardsTypeId,

      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          let preOrder = data.model.preOrder;
          let ecExtendObj = JSON.parse(preOrder.extend ? preOrder.extend : "{}");
          let members;
          for (let key in ecExtendObj) {
            preOrder[key] = ecExtendObj[key];
          }
          that.getPayType();
          that.setData({
            preOrder: preOrder
          });
          cb && cb();
        }

      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {


      }
    });
  },

  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: function () {
  },
  /**
   * 隐藏模态对话框
   */
  hideModal: function () {
    this.setData({
      showModal: false
    });
  },
  /**
   * 对话框取消按钮点击事件
   */
  onCancel: function () {
    this.hideModal();
    wx.redirectTo({
      url: '/pages/uniquecenter/uniquecenter',
    })
  },
  /**
   * 对话框确认按钮点击事件
   */
  onConfirm: function () {
    this.hideModal();
    wx.redirectTo({
      url: '/pages/orderlist/orderlist?status=',
    })
  },
 
  getPayType: function () {
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
      success: function (res) {
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
  setPrepayId: function (orderId, prepayId) {
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
      success: function (res) {
        if (res.data.ret == 0) {
          console.info("设置订单模板ID成功");
        } else {
          console.error("设置订单模板ID失败");
        }
      }
    })
  },

  onPayOrder: function () {

    var that = this;

    if (-1 == this.data.selectedPay) {
      wx.showModal({
        title: '温馨提示',
        showCancel: false,
        success: function (res) {

        },
        content: "请选择支付方式"
      });
      return;
    }
    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({ btnLoading: true });
    let toUrl = "";
    console.log(that.data.orderData.orderType);
    if (3 == that.data.orderData.orderType) {
      toUrl = "/pages/yuyue/yyorderinfo?orderid=" + that.data.orderData.id
    } else {
      toUrl = "/pages/orderinfo/orderinfo?orderid=" + that.data.orderData.id + "&virtual=" + that.data.goodsVirtual
    }
   
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: that.data.preOrder.goodsNames,
        out_trade_no: that.data.preOrder.orderNo,
        total_fee: that.data.preOrder.orderAmount
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
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
            'success': function (res) {
              that.setData({
                showModal: true
              })
              // wx.showModal({
              //   title: '温馨提示',
              //   cancelText:"我的订单",
              //   confirmText:"确定",
              //   cancelColor:"#353535",
              //   confirmColor:"#ED5030",
              //   success: function (res) {
              //     that.setData({ btnLoading: false });
              //     wx.hideLoading();
              //     if (res.confirm) {
              //       wx.redirectTo({
              //         url: '/pages/orderlist/orderlist?status=',
              //       })
              //     } else if (res.cancel) {
              //       wx.redirectTo({
              //         url: '/pages/uniquecenter/uniquecenter',
              //       })
              //     }
              //   },
              //   content: "支付成功"
              // })
            },
            'fail': function (res) {
              console.log(res);
              that.setData({ btnLoading: false });
              wx.hideLoading();
              wx.showModal({
                title: '支付失败',
                confirmText: "关闭",
                cancelText: "取消",
                content: "尚未完成支付",
                complete: function (res) {
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
            complete: function (res) {
              wx.navigateBack({
                delta: 1
              })
            }
          })
        }
      }
    })

  },
  selectPayType: function (e) {
    let type = e.currentTarget.dataset.type;
    console.log(type);
    this.setData({
      selectedPay: type
    })
    this.getSelectedPayName(type);
  },
  getSelectedPayName: function (type) {
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

  }
}))