// pages/offline/pay.js
var Zan = require('../../../youzan/dist/index');
var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var app = getApp();
var baseHandle = require("../../template/baseHandle.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
let uid = cf.config.customPack ? cf.config.uid : extConfig.uid;
Page(Object.assign({}, Zan.Field, Zan.Toast, baseHandle, {
    data: {
      inputContent: {},
      app: app,
      uid: uid,
      randBtnText:"获取验证码",
      staticResPath: cf.config.staticResPath,
      userImagePath: cf.config.userImagePath,
    },

    startRandCountDown(){
      let that = this;
      if(that.data.randTimer){
        clearInterval(that.data.randTimer);
      }
      let count = 60;
      that.data.randTimer = setInterval(function(){
        if(count == 0){
          clearInterval(that.data.randTimer);
          that.setData({
            randBtnLoading: false
          })
          return;
        }
        let countText = --count + "s后重新获取";
        that.setData({
          randBtnText: countText
        })
      },1000);
    },

    handleZanFieldChange(e) {
      var that = this;
      const { componentId, detail } = e;
      that.setData({ ["inputContent." + componentId]: detail.value });
    },
   
    handleSubmit(e) {
      var that = this;
      var phone = that.data.inputContent.phone;
      var randCode = that.data.inputContent.randCode;
      if (!phone) {
        that.showZanToast('请输入手机号');
        return;
      }
      if (!randCode) {
        that.showZanToast('请输入验证码');
        return;
      }
      that.setData({ "btnLoading": true });
      that.submitApply();
    },
    getRandcode:function(){
      var that = this;
      var phone = that.data.inputContent.phone;
      if (!phone) {
        that.showZanToast('请输入手机号');
        return;
      }
      if (that.data.randBtnLoading){
        return false;
      }
      that.setData({ randBtnLoading: true });
      that.startRandCountDown();
      var submitData = {
        cusmallToken: cusmallToken,
        tel: that.data.inputContent.phone || ""
      }
      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/member/sendTelCode',
        method: "POST",
        data: submitData,
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (res) {
          if (res.data.ret == 0) {
            wx.hideLoading();
          } else {
            wx.hideLoading();
            wx.showModal({
              title: '提交异常',
              showCancel: false,
              content: res.data.msg || "服务器异常"
            });
            that.setData({ "randBtnLoading": false });
          }
        }
      })
    },

    submitApply: function () {
      var that = this;
      wx.showLoading({
        title: '提交中',
      });
      that.setData({ btnLoading: true });
      var submitData = {
        cusmallToken: cusmallToken,
        tel: that.data.inputContent.phone || "",
        code: that.data.inputContent.randCode || ""
      }
      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/member/submitApply',
        method: "POST",
        data: submitData,
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: function (res) {
          if (res.data.ret == 0) {
            wx.hideLoading();
            wx.redirectTo({
              url: 'applyResult?payResult=success',
            })
          } else {
            wx.hideLoading();
            wx.showModal({
              title: '提交异常',
              showCancel: false,
              content: res.data.msg || "服务器异常"
            });
            that.setData({ "btnLoading": false });
          }
        }
      })

    },

    judgeEnterApplet: function () {//是否能进入小程序
      let that = this;
      let app = getApp();
      wx.request({
        url: cf.config.pageDomain + "/applet/mobile/member/judgeEnterApplet",
        data: {
          cusmallToken: wx.getStorageSync('cusmallToken')
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          let data = res.data;
          if (data && 0 == data.ret) {
            if (data.model.isEnter) {
              wx.reLaunch({
                url: '/pages/index/index',
              })
            }
          }
        },
        fail: function () {
        },
        complete: function () {
        }
      });

    },
   
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      var that = this;
      wx.hideLoading();
      app.getUserInfo(this,options, function (userInfo, res) {
        cusmallToken = wx.getStorageSync('cusmallToken');
        mallSiteId = wx.getStorageSync('mallSiteId');
        var mallSite = wx.getStorageSync('mallSite');
        util.afterPageLoad(that);
        that.judgeEnterApplet();
      })
    },
    
  }));