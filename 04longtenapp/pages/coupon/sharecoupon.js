var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, commHandle, Zan.Toast, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    verType: "coupon",//核销类型
    coupon: {
      title: "",
      money: 100,
      leastCost: 100,
      totalCount: "1",
      getLimitCount: "1",
      timeLimitType: 0,
      effectDay: 1,
      remind: false,
      description: "",
      effectStartTime: "",
      effectEndTime: "",
      discount: "",
      ext1: 1,
      type: 1,
      showQrTip:false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    var fromuid = options.fromUid || '';
    var shopuid = options.shopUid || '';
    if (fromuid) {
      app.globalData.fromuid = fromuid
    }
    if (shopuid) {
      app.globalData.shopuid = shopuid
    }
    that.setData({
      isMainShop: !app.globalData.shopuid//是否是主店
    });
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.setData({ id: options.id });
      if (options.recordId){
        that.setData({ recordId: options.recordId});
        that.fetchRecordData();
      }
      that.fetchCouponData();
      util.afterPageLoad(that);
    });
  },

  /* 立即领取操作 */
  handleGetBtnTap:function(){
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/coupon/givenCoupon',
      data: {
        cusmallToken: cusmallToken,
        recordId: that.data.recordId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          that.showZanToast('领取成功');
          that.fetchRecordData();
          that.fetchCouponData();
          // that.fetchCouponData();
        } else {
          that.showZanToast(res.data.msg);
          // that.fetchCouponData();
        }
      },
      complete() {
        wx.hideLoading();
      }
    });
  },

  /* 立即使用操作 */
  handleUseBtnTap:function(){
    let vm = this;
    if (vm.data.coupon.type != 5 && vm.data.coupon.type != 6 && vm.data.coupon.busiId !=""){//查询商品类型
      if (vm.data.coupon.useLimitType == 2){
        console.log(vm.data.coupon.busiId)
        wx.redirectTo({ url: '/pages/channel/channel?id=' + vm.data.coupon.busiId, });
      }else{
        new Promise(function (resolve, reject) {

          vm.getGoods(vm.data.coupon.busiId, resolve, reject)

        }).then((data) => {
          var goods = data.model.goods;//不同类型 不同的商品详情页面
          1 === goods.goodsType && wx.redirectTo({ url: '/pages/detail/detail?id=' + vm.data.coupon.busiId, })
          || 2 === goods.goodsType && goods.foodType < 4 && wx.redirectTo({ url: '/pages/takeout/indexDetail?id=' + vm.data.coupon.busiId + "&type=tostore", })
          || 2 === goods.goodsType && goods.foodType >= 4 && wx.redirectTo({ url: '/pages/takeout/indexDetail?id=' + vm.data.coupon.busiId + "&type=ta", })
          || 3 === goods.goodsType && wx.redirectTo({ url: '/pages/yuyue/yydetail?id=' + vm.data.coupon.busiId, });

        }).catch((e) => {
          wx.showToast({
            title: e.msg,
            icon: "none"
          })
        });
      }


    } else if (vm.data.coupon.type == 5){
      wx.showLoading({
        title: '加载中',
      });
      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/coupon/useDepositCoupon',
        data: {
          cusmallToken: cusmallToken,
          recordId: vm.data.record.id,
          mallSiteId: mallSiteId
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          if (res.data.ret == 0) {
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: '已成功存入您的储值余额！',
            })
            vm.fetchRecordData();
            wx.hideLoading();
          } else {
            wx.hideLoading();
            wx.showModal({
              title: '优惠券使用异常',
              showCancel: false,
              content: res.data.msg
            })
          }
        }
      });

    } else if (vm.data.coupon.type == 6) {
      if (vm.data.app.globalData.shopuid){
        if (!vm.data.appletScene) {
          vm.fetchVerifyQrcodeInfo();
        }else{
          vm.switchPasswordCheck();
        }
      }else{
        vm.toggleQrcodeModal();
      }
    }else {
      wx.redirectTo({
        url: '/pages/index/index',
      })
    }
  },

  /* 获取商品 */
  getGoods: function (id, resolve, reject) {
    let that = this;
    cusmallToken = wx.getStorageSync('cusmallToken');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
      data: {
        goodsId: id,
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {

          resolve(res.data)
        }else{
          reject(res.data)
        }
      }
    })
  },

  /* 获取优惠券信息 */
  fetchCouponData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/coupon/findCouponConfig',
      data: {
        cusmallToken: cusmallToken,
        couponId: that.data.id,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var coupon = res.data.model.config || '';
          if (coupon.effectStartTime){
            coupon.effectStartTime = util.formatTime(new Date(coupon.effectStartTime));
          }
          if (coupon.effectEndTime){
            coupon.effectEndTime = util.formatTime(new Date(coupon.effectEndTime));
          }
          that.setData({ coupon: coupon });
          that.setData({ obtainedNum: res.data.model.obtainedNum });
          that.setData({ isExpire: res.data.model.isExpire });
          wx.setNavigationBarTitle({
            title: coupon.title
          })
          wx.hideLoading();
        }
        else {
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

  /* 获取优惠券记录 */
  fetchRecordData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/coupon/getCouponRecord',
      data: {
        cusmallToken: cusmallToken,
        recordId: that.data.recordId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var record = res.data.model.record || '';
          if (record.getTime) {
            record.getTime = util.formatTime(new Date(record.getTime));
          }
          that.setData({ record: record });
          /*
          * 根据fromOpenid和ext4
          * */
          if(record.toOpenid && record.ext4){
            that.setData({
              CouponOver:true
            })
          }
          if(app.globalData.myOpenid==record.openid){
            that.setData({
              ownCoupon:true
            })
          }
          var nowTime = new Date();
          if (nowTime >= record.effectStartTime && nowTime <= record.effectEndTime){
            that.setData({ canUse: true });
          }
          wx.hideLoading();
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

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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

  // 获取核销qrcode信息
  fetchVerifyQrcodeInfo: function () {
    var that = this;
    let isSon = that.data.app.globalData.shopuid ? true : false;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/genCouponVerifiedQrCode',
      data: {
        isSon: isSon,
        cusmallToken: cusmallToken,
        page: "pages/verify/coupon_verify",
        mallSiteId: mallSiteId,
        recordId: that.data.recordId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {

          if (that.data.app.globalData.shopuid){//子店
            that.setData({
              sceneData: JSON.parse(res.data.model.scene)
            });
            that.switchPasswordCheck();
          }else{//主店
            if (res.data.model && res.data.model.appletScene){
              that.setData({
                appletScene: res.data.model.appletScene
              });

              that.setData({
                sceneData: JSON.parse(res.data.model.appletScene.entity || "{}")
              })
            }

          }

        } else {

          wx.showModal({
            title: '获取核销qrcode信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
        wx.hideLoading();
        // 定制
        if (mallSite.uid == 109734){
          setTimeout(function () {
            that.fetchVerifyQrcodeInfo();
          }, 30000)
        }


      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this;
    if (that.data.onHide){
      if (that.data.recordId) {
        that.fetchRecordData();
      }
      that.fetchCouponData();
    }

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.data.onHide = true;
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
}))
