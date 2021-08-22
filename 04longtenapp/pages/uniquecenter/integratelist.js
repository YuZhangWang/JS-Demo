// orderinfo.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, {
  /**
   * 页面的初始数据
   */
  data: {
    id:"",
    needUserInfo: true,
    app:app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    totalJifen:0,
    size:50,
    list:[],
    getDataFlag:false,
    hiddenmodalput:true,
    isOpen: false,//是否开启积分奖励（全局）
    deductionOne:'',
    deductionTwo:'',
    isSignOk:'',//签到
    isCommentOk:'',//评论
    isConsumeOk:'',//消费金额
    isRecommendOk:'',//推荐
    isTradeOk:'',//成交笔数,
    consumeGet:'',
    consumePreval:'',
    signGet:'',//签到送积分数
    recommendGet:'',
    recommendPreval:'',
    commentGet:'',
    commentPreval:'',
    integralKey:'',
    integralVal:'',
    invitationScene:"",

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var parse = JSON.parse;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      mallSite = wx.getStorageSync('mallSite');
      console.log(JSON.parse(mallSite.globalConfig));
      let globalConfig=JSON.parse(mallSite.globalConfig);
      if((globalConfig.switchEquity & (Math.pow(2, 0))) != 0) {
        that.setData({
          deductionOne:true
        })
      }
      if((parseInt(globalConfig.switchEquity) & Math.pow(2, 1)) != 0){
        that.setData({
          deductionTwo:true
        })
      }
      wx.hideShareMenu();
      //that.setData({ id: options.id });
      that.setData({id:19});//特殊定制，为了调试方便，不可提交
      that.fetchData(1);
      that.querySign();
      that.setData({
        integralKey:parse(mallSite.globalConfig).integralKey,
        integralVal:parse(mallSite.globalConfig).integralVal
      });
      that.toInvite();
      util.afterPageLoad(that);
    });
  },
  // 签到信息
  showDetailBox:function(){
    this.setData({
      hiddenmodalput : !this.data.hiddenmodalput
    })
  },
  confirm:function(){
    this.setData({
      hiddenmodalput : true
    })
  },
  toSign:function(){
    var that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2004"
      }]),
      function (resp) {
        console.log(resp)
        wx.navigateTo({
          url: 'sign',
        });

      });

  },
  toShopping:function(){
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2004"
      }]),
      function (resp) {
        console.log(resp)
        wx.navigateTo({
          url: '../index/index',
        });

      });

  },
  toJudge:function(){
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2004"
      }]),
      function (resp) {
        console.log(resp)
        wx.navigateTo({
          url: '../orderlist/orderlist',
        });

      });

  },
  toCall: function () {
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2004"
      }]),
      function (resp) {
        console.log(resp)

      });

  },
  toInvite: function () {
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2004"
      }]),
      function (resp) {
        console.log(resp)
        wx.request({
          url: cf.config.pageDomain + '/applet/mobile/member/getInvitationScene',
          data: {
            cusmallToken: cusmallToken
          },
          header: {
            "content": "application/json"
          },
          success: function (res) {
            let data = res.data;
            that.setData({
              invitationScene: data.model.scene
            });
          }
        })

      });

  },
  openNotice:function(){
    let that = this;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2004"
      }]),
      function (resp) {
        console.log(resp)

      });
  },
  querySign:function(){
    var that = this;
    var parse = JSON.parse;
    let fromuid = "";
    let shopuid = "";
    if (app.globalData.shopuid) {
      fromuid = app.globalData.fromuid;
      shopuid = app.globalData.shopuid
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/getIntegralSet',
      data:{
        cusmallToken: cusmallToken,
        fromUid: fromuid,
        shopUSid: shopuid
      },
      header:{
        "content":"application/json"
      },
      success:function(res){
        that.setData({
          isOpen: res.data.model.integralSet.isOpen,
          isConsumeOk:res.data.model.integralSet.isConsume,
          consumeGet: parse(res.data.model.integralSet.consumeSet).get,
          consumePreval: parse(res.data.model.integralSet.consumeSet).preval,
          isCommentOk: res.data.model.integralSet.isComment,
          commentGet: parse(res.data.model.integralSet.commentSet).get,
          commentPreval: parse(res.data.model.integralSet.commentSet).preval,
          isSignOk: res.data.model.integralSet.isSign,
          signGet: parse(res.data.model.integralSet.signSet).get,
          isRecommendOk: res.data.model.integralSet.isRecommend,
          recommendGet: parse(res.data.model.integralSet.recommendSet).get,
          recommendPreval: parse(res.data.model.integralSet.recommendSet).preval,
          isTradeOk: res.data.model.integralSet.isTrade
        });

        if (res.data.model.integralSet.isRecommend){
          wx.showShareMenu();
        }
      }
    })
  },
  fetchData: function (page) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    var submitData = {
      cusmallToken: cusmallToken,
      start: (page - 1) * that.data.size,
      limit: that.data.size
    };
    if (app.globalData.shopuid) {
      submitData.shopUid = app.globalData.shopuid;
      submitData.fromUid = app.globalData.fromuid;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/queryIntegralList',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          console.log(res.data);
          if(res.data && res.data.model.list && res.data.model.list.length>0){
            var list = res.data.model.list;
            if(list[0].member && list[0].member.integral){
              that.setData({totalJifen:list[0].member.integral});
            }
            var recordList = [];
            for(var i = 0;i< list.length;i++){
              list[i].record.createTime = that.formatTime(list[i].record.createTime);
              recordList.push(list[i].record);
            }
            that.setData({list:recordList,getDataFlag:true});
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取表单信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  addzero:function(m){
    return m<10?'0'+m:m
  },
  formatTime:function(time){
    //time是整数，否则要parseInt转换
    var time = new Date(time);
    var y = time.getFullYear();
    var m = time.getMonth()+1;
    var d = time.getDate();
    var h = time.getHours();
    var mm = time.getMinutes();
    var s = time.getSeconds();
    return y+'-'+this.addzero(m)+'-'+this.addzero(d)+' '+this.addzero(h)+':'+this.addzero(mm);
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
    let that = this;
    let shareObj = {
      title: "",
      path: "/pages/index/index?scene=" + that.data.invitationScene,
      // imageUrl:"http://res.xcx.weijuju.com/image/question.jpg",
      success: function (res) {
        // 成功
      },
      fail: function (res) {
        // 失败
      }
    };

    return shareObj;
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  }
}))
