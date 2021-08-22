var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
// pages/fenxiao/myInfo.js
Page(Object.assign({},baseHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    fxStaticResPath: cf.config.staticResPath + "/image/mobile/fx/",
    headPic:"",//头像
    enableWithdrawMoney:0,//可提取
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    totalMoney: 0,
    nickName: "",//昵称,
    createTime:"",//加入时间
    categoryName:"",//所属分组
    freezeMoney:0,
    showPopup: false,
    freezePop:false,
    upNodeName:null,
    pageConfig:null,
    showRank:false
  },
  wdDatailPage: function () {
    if (!this.checkUserInfo()) {
      return false;
    }
    wx.navigateTo({
      url: "/pages/fenxiao/wdDetail"
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu();
    let that = this;
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      let mallSite = wx.getStorageSync('mallSite');
      let title = mallSite.name;
      wx.setNavigationBarTitle({
        title: title
      });
      if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
        that.setData({
          AuthUserInfo:true
        })
      } else {
        that.setData({
          AuthUserInfo:false
        })
      }
      that.getDistributorConfig();
      that.getPromoterAccount();
      util.afterPageLoad(that);
    });

  },
  loginUser:function(){
    if (!this.checkUserInfo()) {
      return false;
    }
  },
  freezeTips:function(){
    wx.showModal({
      title: "提示",
      content: "您的小伙伴订单未确认收到前，系统将冻结您从未完成的订单获得的奖励，期间产生退款则扣除冻结奖励，订单交易完成，则解冻奖励转入可提取金额。提示：单笔订单奖励最多冻结10天，10天内未产生退款自动解冻。",
      showCancel: false,
      success: function (res) {

      }
    });
  },
  getPromoterAccount: function () {
    let that = this;

    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/getPromoterAccount",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          if (data.model.distributorTreeNode){
            that.setData({
              upNodeName: data.model.distributorTreeNode.upNodeName,
              nextLevel: data.model.nextLevel || data.model.currLevel,
              categoryName: data.model.distributorTreeNode.categoryName,
              isReachMaxVipLevel: data.model.isReachMaxVipLevel,
              gradeId: data.model.distributorTreeNode.id,
              distributionLevel: data.model.distributorTreeNode.distributionLevel,
              distributionName: data.model.distributorTreeNode.distributionName
            });
          }
          if (data.model.promoterAccount) {
            let mpro = data.model.promoterAccount;
            that.setData({
              headPic: mpro.headPic
            });
            that.setData({
              enableWithdrawMoney: mpro.enableWithdrawMoney
            });
            that.setData({
              totalMoney: mpro.totalMoney
            });
            that.setData({
              nickName: mpro.nickName
            });
            that.setData({
              createTime: util.formatTime(new Date(mpro.createTime))
            });
            that.setData({
              freezeMoney: mpro.freezeMoney
            });


          }
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  togglePopup: function () {
    this.setData({
      showPopup: !this.data.showPopup
    });
    // wx.showModal({
    //   title: "提示",
    //   content: "",
    //   showCancel: false,
    //   success: function (res) {

    //   }
    // });
  },
  toggleFreezePop:function(){
    this.setData({
      freezePop: !this.data.freezePop
    });
  },
  showTips: function(){
    wx.showModal({
          title: "提示",
          content: "敬请期待",
          showCancel: false,
          success: function (res) {

          }
        });
  },
  openMsgNotice: function () {
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'fenxiao',
        msgcode: "4004"
      },
      {
        name: 'fenxiao',
        msgcode: "4005"
      },
      {
        name: 'fenxiao',
        msgcode: "4006"
      }]),
      function (resp) {
        console.log(resp)

      });
  },
  /* 获取分销配置 */
  getDistributorConfig: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/getDistributorConfig",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          if (data.model.distributorConfig && data.model.distributorConfig.pageConfig) {
            var pageConfig = JSON.parse(data.model.distributorConfig.pageConfig);
            pageConfig.fxHelp = pageConfig.fxHelp.replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>').replace(/\s/g, ' ');

            that.setData({
              pageConfig: pageConfig
            });

            // 后续新增功能，是否显示我的排名，兼容旧数据,默认显示
            if (pageConfig.showRank){
              that.setData({
                showRank: pageConfig.showRank & 1
              });
            }else{
              that.setData({
                showRank: true
              });
            }

          }
          if (data.model.distributorConfig && (data.model.distributorConfig.switchEquity & (Math.pow(2, 8))) != 0) {
            if (that.data.app.globalData.shopuid) {
              //子店铺不能使用分销
              that.setData({
                gradeFX: false
              });
            } else {
              that.setData({
                gradeFX: true
              });
              that.getPromoterAccount();
            }
          } else {
            that.setData({
              gradeFX: false
            });
          }

        } else {
          wx.showToast({
            title: data.msg,
            icon:"none"
          })
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
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
