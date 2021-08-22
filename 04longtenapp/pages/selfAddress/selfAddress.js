// pages/selfAddress/selfAddress.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = {};
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
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
    list: [],
    goodsName: "",
    isTrack: false,
    allSelected: false,
    goodsType: 1,
    trackText: "管理",
    selectedCount: 0,
    currPage: 1,
    isBottom: false,
    paramJson: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    wx.hideShareMenu();
    mallSite = wx.getStorageSync('mallSite')
    app.getUserInfo(this, options, function(userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      if (options) {
        that.setData({
          goodsType: options.goodsType || '',
          "paramJson.orderid": options.orderid || '',
          "paramJson.fromShopingCart": options.fromShopingCart || '',
          "paramJson.fromTakeout": options.fromTakeout || '',
          "paramJson.cartIds": options.cartIds || '',
          "paramJson.id": options.id || '',
          "paramJson.goodsCount": options.goodsCount || '',
          "paramJson.specId": options.specId || '',
          "paramJson.orderChecked": options.orderChecked || '',
          "paramJson.goodsId": options.goodsId || '',
          "paramJson.buyType": options.buyType || '',
          "paramJson.relationId": options.relationId || '',
          "paramJson.activityId": options.activityId || '',
          "paramJson.activityId": options.activityId || '',
          "paramJson.type": options.type || '',
          "paramJson.specRelationId": options.specRelationId || '',
          "paramJson.totalBuyCount": options.totalBuyCount || '',
          "paramJson.tuanLeader": options.tuanLeader || '',
        });


      }

      wx.getLocation({
        type: 'gcj02',
        success: function(res) {
          console.log(res);
          that.setData({
            longitude: res.longitude,
            latitude: res.latitude
          })
          that.getSelfAddressList();
        },
        fail: function() {
          that.getSelfAddressList();
        }
      })

      util.afterPageLoad(that);
    });
  },
  getSelfAddressList: function() {
    var that = this;
    var submitData = {
      cusmallToken: cusmallToken,
      shopUid: mallSite.uid || "",
      start: (that.data.currPage - 1) * 10,
      limit: 10,
      address: ""
    }
    if (that.data.longitude && that.data.latitude) {
      submitData.longitude = that.data.longitude;
      submitData.latitude = that.data.latitude;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/shopGetSelf/find',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data && res.data.ret == 0) {
          var dataList = that.data.list;
          var list = res.data.model.list;
          for (var i = 0; i < list.length; i++) {
            list[i].time = JSON.parse(list[i].time);
            dataList.push(list[i]);
          }
          that.setData({
            list: dataList
          })
          if (dataList.length >= res.data.model.total) {
            that.setData({
              isBottom: true
            })
          }
          wx.hideLoading();

        } else {
          wx.hideLoading();
          console.log(res.data.Msg)
        }
      }
    })

  },
  toMap: function(e) {
    var latitude = parseFloat(e.currentTarget.dataset.la);
    var longitude = parseFloat(e.currentTarget.dataset.lo);
    wx.openLocation({
      latitude,
      longitude,
      scale: 18
    })
  },
  selectAdd: function(e) {

    var that = this;
    var addressId = e.currentTarget.dataset.id;
    var address = e.currentTarget.dataset.address;
    wx.setStorageSync('address', address);
    that.goBackPage(addressId);
  },
  goBackPage: function(addressId) {
    var that = this;
    var paramJson = that.data.paramJson;
    var param = '';
    if (paramJson.type && paramJson.type == "act") {

      param += '?ecWayType=3&goodsId=' + paramJson.goodsId + '&buyType=' + paramJson.buyType + '&relationId=' + paramJson.relationId + '&activityId=' + paramJson.activityId + '&addressId=' + addressId;

      wx.redirectTo({
        // 由订单购买页面进入时携带参数的跳转路径
        url: '/pages/sbargain/sbargainpay' + param
      });
    } else if (paramJson.type && paramJson.type == "skill") {
      param += '?ecWayType=3&goodsId=' + paramJson.goodsId + '&activityId=' + paramJson.activityId + '&addressId=' + addressId;

      wx.redirectTo({
        // 由订单购买页面进入时携带参数的跳转路径
        url: '/pages/sbargain/atyOrderPay' + param
      });
    } else if (paramJson.type && paramJson.type == "groupbuy") {
      param += '?ecWayType=3&goodsId=' + paramJson.goodsId + '&buyType=' + paramJson.buyType + '&relationId=' + paramJson.relationId + '&activityId=' + paramJson.activityId + '&addressId=' + addressId + "&totalBuyCount=" + paramJson.totalBuyCount + "&Leader=" + paramJson.tuanLeader;

      wx.redirectTo({
        // 由订单购买页面进入时携带参数的跳转路径
        url: '/pages/groupbuy/groupbuypay' + param
      });
    } else if (paramJson.type && paramJson.type == "presale") {
      param += '?ecWayType=3&goodsId=' + paramJson.goodsId + '&activityId=' + paramJson.activityId + '&addressId=' + addressId + "&totalBuyCount=" + paramJson.totalBuyCount;

      wx.redirectTo({
        // 由订单购买页面进入时携带参数的跳转路径
        url: '/pages/presales/presalesOrder' + param
      });
    } else if (paramJson.type && paramJson.type == "timeDiscount") {
      param += '?ecWayType=3&goodsId=' + paramJson.goodsId + '&activityId=' + paramJson.activityId + '&addressId=' + addressId + "&totalBuyCount=" + paramJson.totalBuyCount + "&specRelationId=" + paramJson.specRelationId;
      wx.redirectTo({
        // 由订单购买页面进入时携带参数的跳转路径
        url: '/pages/time_discount/time_discount_order' + param
      });
    } else {
      if (paramJson.orderid) {
        param += '?orderid=' + paramJson.orderid;
      } else if (paramJson.fromShopingCart) {
        param += '?fromShopingCart=' + paramJson.fromShopingCart + '&cartIds=' + paramJson.cartIds + '&ecWayType=3&addressId=' + addressId;
      } else if (paramJson.fromTakeout) {
        param += '?fromTakeout=' + paramJson.fromTakeout;
      } else if (paramJson.id) {
        param += '?id=' + paramJson.id + '&ecWayType=3&addressId=' + addressId + '&goodsCount=' + paramJson.goodsCount + (paramJson.specId ? '&specId=' + paramJson.specId : '');
      } else {
        wx.redirectTo({
          // url:"/pages/uniquecenter/uniquecenter"
          // 跳转到地址列表页面，仅从地址列表进行修改，不携带外部参数的跳转.
          url: "/pages/uniquecenter/addresslist"
        })
        return;
      }
      wx.redirectTo({
        // 由订单购买页面进入时携带参数的跳转路径
        url: '/pages/orderinfo/orderinfo' + param
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
    var that = this;
    var isBottom = that.data.isBottom;
    var currPage = that.data.currPage;
    if (!isBottom) {
      currPage++;
      that.setData({
        currPage: currPage
      })
      that.getSelfAddressList();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {

  }
}))
