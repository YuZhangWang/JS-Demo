// pages/fenxiao//grade.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    needUserInfo: true,
    userImagePath: cf.config.userImagePath,
    staticResPath: cf.config.staticResPath + "/image/mobile/fx/grade",
    headPic:"",//头像
    quiz: 'http://xcxtest.weijuju.com/res/yyxiaochengxu//image/admin/help.png',


    isReachMaxVipLevel: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideLoading();
    this.setData({
      userInfo: wx.getStorageSync('userInfo')
    });
    this.gradeInfo(options.id);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
  /* 个人等级信息 */
  gradeInfo(id) {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/levelConfig/findNodeLevelInfo",
      data: {
        cusmallToken: cusmallToken,
        treeId: id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data);
        if (data && 0 == data.ret) {
          if (data.model.nextLevel) {
            let gapCommission=data.model.nextLevel.commissionThreshold - data.model.totalCommission;
            if ((data.model.conditionSwitch & (Math.pow(2, 0))) != 0) {
              that.setData({
                conditionComm: true,
                gapCommission
              })
            } else {
              that.setData({
                conditionComm: false
              })
            }
            let gapFans = data.model.nextLevel.downNodeNumThreshold - data.model.totalNodeNum;
            if ((data.model.conditionSwitch & (Math.pow(2, 1))) != 0) {
              that.setData({
                conditionFans: true,
                gapFans
              })
            } else {
              that.setData({
                conditionFans: false
              })
            }
            if ((data.model.conditionSwitch & (Math.pow(2, 2))) != 0) {
              that.setData({
                conditionGoods: true,
                assignGoodsBuyed:data.model.assignGoodsBuyed
              })
            } else {
              that.setData({
                conditionGoods: false
              })
            }
            let gapMonetary = data.model.nextLevel.consumeMoneyThreshold - data.model.consumeMoney;
            if ((data.model.conditionSwitch & (Math.pow(2, 3))) != 0) {
              that.setData({
                conditionMonetary: true,
                gapMonetary
              });
            } else {
              that.setData({
                conditionMonetary: false
              });
            }
          }

          that.setData({
            nodeLevelInfo: data.model.nodeLevelInfo,
            currentLevel: data.model.currentLevel,
            nextLevel: data.model.nextLevel || {},
            isReachMaxVipLevel:data.model.isReachMaxVipLevel,
            // goodsRelatedIndustry: data.model.goodsRelatedIndustry,
            conditionSwitch: data.model.conditionSwitch,
            distributionLevel: data.model.nodeLevelInfo.distributionLevel,
          })
        }
      }
    });
  },

  toGoodDetail(e){
    var gType = this.data.nextLevel.goodsRelatedIndustry;
    var gId = this.data.nextLevel.assignedGoodsIdsThreshold;
    console.log(gType);
    var url = "";
    if (1 == gType){
      url = "/pages/detail/detail?id=" + gId;
    } else if (3 == gType){
      url = "/pages/takeout/indexDetail?fromIndex=true&id=" + gId + "&type=ta";
    } else if (4 == gType){
      url = "/pages/yuyue/yydetail?id=" + gId;
    } else if (5 == gType) {
      url = "/pages/detail/detail?id=" + gId;
    }
    wx.navigateTo({
      url: url,
    })
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
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
}));
