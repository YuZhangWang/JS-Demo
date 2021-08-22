// pages/giftcard//myGiftCard.js
// pages/giftcard//giftcardList.js
// channel.js
var cf = require("../../config.js");
var Zan = require('../../youzan/dist/index');
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, Zan.Toast, Zan.Tab, {

  /**
   * 页面的初始数据
   */
  data: {
    recordList: [],
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    userImagePath: cf.config.userImagePath,
    nodata: false,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    nomore: false,
    mainTab: {
      list: [{
        id: '1',
        title: '待领用',
      }, {
        id: '2',
        title: '使用中'
      }, {
        id: '3',
        title: '已赠送'
      }, {
        id: '4',
        title: "不可用"
      }],
      selectedId: '1',
      scroll: false
    },
    stateObj:{
      '1': '1',  // 待领用
      '2': '2',  // 使用中
      '3': '3,4',  // 已赠送
      '4': '5,6,7' //不可用
    },
    imgObj: {
      '3': '1',  // 待领用
      '4': '4',  // 使用中
      '5': '3',  // 已赠送
      '6': '2', //不可用
      '7': '5' // 已用完
    },
    goodsUrl:{
      '1': '/pages/detail/detail',
      '2': '/pages/takeout/indexDetail',
      '3': '/pages/yuyue/yydetail',

    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      if(options.mainTabType){
        that.setData({
          ['mainTab.selectedId']: options.mainTabType
        })
      }
      that.fetchData();
      util.afterPageLoad(that);
    });
  },
  // 获取礼品卡信息
  fetchData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/findGiftCardRecordListByOpenId',
      data: {
        cusmallToken: cusmallToken,
        start: that.data.recordList.length,
        limit: 10,
        configId:'',
        type:'',
        stateListStr:that.data.stateObj[that.data.mainTab.selectedId],
        source:''

      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var recordList = res.data.model.recordList || [];
          if (recordList.length > 0) {
            for (var i = 0; i < recordList.length; i++) {
              var record = recordList[i];
              if (record.effectStartTime) {
                record.effectStartTime = util.formatDate(new Date(record.effectStartTime));
              }
              
              if (record.effectEndTime) {
                record.effectEndTime = util.formatDate(new Date(record.effectEndTime));
              }
              record.getUseLimitTxt = that.getUseLimitTxt(record);
            }
          }

          that.setData({ recordList: that.data.recordList.concat(recordList) });
          that.setData({ total: res.data.model.count });
          if (res.data.model.count == 0) {
            that.setData({ "nomore": false });
            that.setData({ "nodata": true });
          } else {
            that.setData({ "nodata": false });
            if (that.data.recordList.length >= res.data.model.count) {
              that.setData({ "nomore": true });
            } else {
              that.setData({ "nomore": false });
            }
          }
          wx.hideLoading();
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
  // goGiftCardDetail
  goGiftCardDetail:function(e){
    let url = e.currentTarget.dataset.url;
    let state = e.currentTarget.dataset.state;
    let recordId = e.currentTarget.dataset.recordid;
    if (parseInt(this.data.mainTab.selectedId) == 3){
      wx.navigateTo({
        url: '/pages/giftcard/giftcardShare?id=' + recordId,
      })
    }else{
      wx.navigateTo({
        url: url,
      })
    }
    
  },
  // 立即使用
  useGiftCard: function (e) {
    let that = this;
    let type = e.currentTarget.dataset.type;
    let goodsType = parseInt(e.currentTarget.dataset.goodstype);
    let goodsId = e.currentTarget.dataset.goodsid;
    let currentIndex = parseInt(e.currentTarget.dataset.index);
    let recordObj = this.data.recordList[currentIndex];
    let extendInfo = recordObj.extend && JSON.parse(recordObj.extend);
    let url = that.data.goodsUrl[goodsType] + '?id=' + goodsId;
    if(parseInt(type) == 1){
       wx.navigateTo({
         url: url
       })
    } else if (extendInfo.linkUrl) {
      wx.navigateTo({
        url: extendInfo.linkUrl,
      })
    } else {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    }


  },
  // 自己使用
  selfUse: function(e){
    let that = this;
    let recordId = e.currentTarget.dataset.recordid;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/giftCard/receiveGiftCardUseSelf',
      data: {
        cusmallToken: cusmallToken,
        giftCardRecordId: recordId,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          wx.showToast({
            title: '使用成功',
          })
          wx.hideLoading();
          wx.navigateTo({
            url: '/pages/giftcard/giftcardRecordDetail?id=' + recordId,
          })
          
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
  // 赠送好友
  giveFriend: function(e){
    let recordId = e.currentTarget.dataset.recordid;
    wx.navigateTo({
      url: '/pages/giftcard/giftcardShare?id='+recordId,
    })

  },

  handleZanTabChange(e) {
    var componentId = e.componentId;
    var selectedId = e.selectedId;

    this.setData({
      [`${componentId}.selectedId`]: selectedId
    });
    this.data.recordList = [];
    this.fetchData();
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
    var that = this;
    if (that.data.recordList.length < that.data.total) {
      that.fetchData();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
     
  }
}))
