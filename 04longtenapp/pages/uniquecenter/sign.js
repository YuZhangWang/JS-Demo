// pages/sign/sign.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var Zan = require('../../youzan/dist/index');
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    hasSign: false,
    signList: [],
    hasSignItem: [],
    scoreRecords: "",
    totalJifen: 0,
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    authType:1, //拒绝授权 停留当前页
    custBgDistri: "",
    NoSignimg: "",
    Signimg: "",
    SignBackImg: "",
    loading: false,
    fetchLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this;
    wx.hideShareMenu();
    that.data.options=options;
    if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
      that.setData({
        noAuthInfo:false
      })
    }else {
      that.setData({
        noAuthInfo:true
      })
    }
    app.getUserInfo(this, options, function(userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.fetchData();
      that.queryIntegralList();
      util.afterPageLoad(that);
      that.getInitImg();
    });

  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },
  //获取页面自定义样式信息
  getInitImg: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/getIntegralSet',
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        if (0 == res.data.ret) {
          var data, custBgDistri, NoSignimg, Signimg, SignBackImg;
          if (!res.data.model.integralSet.customStyle) {
            custBgDistri = "";
            SignBackImg = "";
            NoSignimg="";
            Signimg="";
          } else {
            data = JSON.parse(res.data.model.integralSet.customStyle);
            custBgDistri = data.custBgDistri;
            NoSignimg = data.NoSignimg;
            Signimg = data.Signimg;
            SignBackImg = data.SignBackImg;
            if (custBgDistri.indexOf("sign/addsign") >= 0) {
              custBgDistri = ""
            }
            if (NoSignimg.indexOf("sign/beforesign") >= 0) {
              NoSignimg = that.data.staticResPath + "/" + NoSignimg;
            } else {
              NoSignimg = that.data.userImagePath + "/" + NoSignimg;
            }
            if (Signimg.indexOf("sign/alreadysign") >= 0) {
              Signimg = that.data.staticResPath + "/" + Signimg;
            } else {
              Signimg = that.data.userImagePath + "/" + Signimg;
            }
            if (SignBackImg.indexOf("sign/signblank") >= 0) {
              SignBackImg = ""
            }
          }

          that.setData({
            custBgDistri: custBgDistri,
            NoSignimg: NoSignimg,
            Signimg: Signimg,
            SignBackImg: SignBackImg,
            loading: true
          })
        } else {}

      }
    })
  },
  // 查询签到分页
  fetchData: function() {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/getSignOnList',
      data: {
        cusmallToken: cusmallToken,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        limit: 10,
        start: 0
      },
      header: {
        "content-type": "json"
      },
      success: function(res) {
        if (res.data.ret == 0) {
          console.log(res.data.model.integral);
          // 时间格式化 util.formatDate()
          for (var item in res.data.model.integralRecord) {
            res.data.model.integralRecord[item].createTime = util.formatDate(new Date(res.data.model.integralRecord[item].createTime));
          };
    
          that.setData({
            signList: res.data.model.signList,
            hasSign: res.data.model.isSign,
            hasSignItem: res.data.model.integralRecord,
            scoreRecords: res.data.model.integral || '',
            fetchLoading: true
          });

          // that.getInitImg();


        }
        wx.hideLoading();
      }

    })
  },
  // 签到
  addSign: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/signon',
      data: {
        cusmallToken: cusmallToken,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        "content-type": "json"
      },
      success: function(res) {
        that.fetchData();
        that.queryIntegralList();
      }
    })
  },
  // 查询总积分
  queryIntegralList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/member/queryIntegralList',
      data: {
        cusmallToken: cusmallToken,
        start: 0,
        limit: 1000
      },
      header: {
        'content-type': "application/json"
      },
      success: function(res) {
        if (res.data.ret == 0) {
          if (res.data && res.data.model.list && res.data.model.list.length > 0) {
            var list = res.data.model.list;
            if (list[0].member && list[0].member.integral) {
              that.setData({
                totalJifen: list[0].member.integral
              });
            }
          }
        }
      }
    })
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

  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {

  }
}))
