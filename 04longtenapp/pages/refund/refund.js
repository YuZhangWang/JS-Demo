// refund.js
// order_pay.js
var Zan = require('../../youzan/dist/index');
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, Zan.Toast, {
  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    app:app,
    orderNum:"",
    needUserInfo: true,
    status:0,
    btnLoading: false,
    reasonText: "",
    setConfig:{},
    actualPrice:"",
    depositPrice:"",
    refundChannel: "",
    refundMoney:"",
    refundWithRatio:"",
    orderInfoUrl: "/pages/orderinfo/orderinfo",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = wx.getStorageSync('mallSiteId');
    wx.hideShareMenu();
    wx.setNavigationBarTitle({
      title: "申请退款"
    })
    this.setData({ id: options.id });
    this.setData({ status: options.status });
    this.setData({ orderNum: options.orderNum });
    util.afterPageLoad(this);
    this.fetchOrderData();
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/mallSite/findConfig',
      data: {
        cusmallToken: cusmallToken,
        mallSiteId: mallSiteId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data && res.data.ret == 0){
          that.setData({
            setConfig: res.data.model.config
          });
        }
      }
    })
  },
  // 从订单获取商品信息
  fetchOrderData: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getOrderDetail',
      data: {
        cusmallToken: cusmallToken,
        parId: that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var parOrder = res.data.model.parOrder;
          that.setData({
            orderType: parOrder.orderType,
        	actualPrice: parseFloat(parOrder.actualPrice / 100 ).toFixed(2),
        	depositPrice: parseFloat(parOrder.depositPrice / 100 ).toFixed(2),
            refundMoney: 5 == parOrder.orderType ? parOrder.actualPrice : parseFloat((parOrder.actualPrice + parOrder.depositPrice) / 100 ).toFixed(2),
            allRefundMoney: 5 == parOrder.orderType ? parOrder.actualPrice : parseFloat((parOrder.actualPrice + parOrder.depositPrice) / 100).toFixed(2)
          });

          if (3 == parOrder.orderType){
            that.setData({
              orderInfoUrl:"/pages/yuyue/yyorderinfo"
            });
          }
        } else {
          wx.showModal({
            title: '获取订单信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      },
      complete(){

      }
    })
  },
  refundChange(e) {
	this.data.refundMoney = e.detail.value;
	if (!/^[0-9]*\.?[0-9]*$/.test(this.data.refundMoney) || "" == this.data.refundMoney) {
		this.setData({
			refundWithRatio: "0.00"
		});
		return;
	}
	if (parseFloat(this.data.refundMoney) > parseFloat(this.data.allRefundMoney)) {
		this.setData({
			refundWithRatio: this.data.allRefundMoney
		});
		return;
	}
	var refundWithRatio;
	if (parseFloat(this.data.actualPrice) > parseFloat(this.data.refundMoney)) {
		refundWithRatio = parseFloat(1+this.data.setConfig.refundToDepositRatio/100)*this.data.refundMoney;
	} else {
		refundWithRatio = parseFloat(1+this.data.setConfig.refundToDepositRatio/100)*this.data.actualPrice+parseFloat(this.data.refundMoney-this.data.actualPrice);
	}
	refundWithRatio = refundWithRatio.toFixed(2);
	this.setData({
		refundWithRatio: refundWithRatio
	});
  },
  retAll(){
    var allRet = this.data.allRefundMoney;
	var refundWithRatio = refundWithRatio = parseFloat(1+this.data.setConfig.refundToDepositRatio/100)*this.data.actualPrice+parseFloat(this.data.depositPrice);
    this.setData({
      refundMoney: allRet,
      refundWithRatio: refundWithRatio.toFixed(2)
    })
  },
  refundChannelChange: function(e) {
	  this.setData({
		  refundChannel: e.detail.value 
	  });
  },
  bindFormSubmit: function (e) {
    var that = this;
    var reason = e.detail.value.reasonText; 
    var refundMoney = parseFloat(e.detail.value.refundMoney); // 自定义的退款金额（仅支持退实付金额和储值支付金额）
    var refundType = 1;  //退款类型（1全额退 2部分退）
    var refundChannel = that.data.refundChannel;
    if (0 > refundMoney || that.data.allRefundMoney < refundMoney){
      wx.showModal({
        showCancel: false,
        content: "退款金额不能超过实付金额"
      });
      return;
    }
    
    if (5 != that.data.orderType && "" == e.detail.value.refundChannel) {
      wx.showModal({
        showCancel: false,
        content: "请选择退款方式"
      });
      return;
    } else if (5 == that.data.orderType){ //退款方式 原路返回
      refundChannel = 1;
    }
    //不是积分商品订单 才能部分退款
    if (5 != that.data.orderType && refundMoney < that.data.allRefundMoney){
      refundType = 2;
    }
    
    refundMoney = parseInt(refundMoney * 100);
    if (reason == "") {
      wx.showModal({
        showCancel: false,
        content: "亲，您还没有填写退款原因"
      })
      return;
    }
    wx.showLoading({
      title: '处理中',
    });
    that.setData({ btnLoading: true });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/returnOrder',
      data: {
        cusmallToken: cusmallToken,
        id: that.data.id,
        refundMoney: refundMoney,
        refundChannel: refundChannel,
        refundType: refundType,
        reason: reason
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0){
          wx.hideLoading();
          that.showZanToast('亲，您的退款申请提交成功');
          setTimeout(function () {
            that.setData({ btnLoading: false });
            wx.redirectTo({
              url: that.data.orderInfoUrl + '?orderid=' + that.data.id
            })
          }, 2800);
        }else{
          wx.showModal({
            title: '申请退款失败',
            showCancel: false,
            content: res.data.msg
          })
        }
      },
      fail: function(res) {
    	  
      },
      complete: function(res) {
    	wx.hideLoading();
	    that.setData({ btnLoading: false });
      }
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
  
  }

}))