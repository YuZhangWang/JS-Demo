//index.js
wx.showLoading({
  title: '加载中...',
});
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var categoryTabHandle = require("../template/categoryTabWidget.js");
var navTabPanelHandle = require("../template/navTabPanel.js");
var searchHandle = require("../template/searchHandle.js");
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
var address = require('../../utils/city2-min.js');
//获取应用实例
var app = getApp();
Page(Object.assign({}, categoryTabHandle, navTabPanelHandle, searchHandle, baseHandle, commHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    decoration: {},
    // 是否跳过用户信息授权
    skipUserInfoOauth: true,
    decoration: {},
    shoppingCartCount: 0,
    app: app,
    //选择地址
    animationAddressMenu: {},
    addressMenuIsShow: false,
    addressNew: address,
    value: [0, 0, 0],
    provinces: [],
    citys: [],
    areas: [],
    areaInfo: "",
    mAreaId: "",
    //
    bannerHeight: {},
    isIndexPage: true,
    navTabPanelData: {},
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    playBgMusic: true,
    multInfo: {},
    multInfoArr: {},
    multInfoAddr: "",
    multClassArr: {},
    categoryArr:{},
    mallSiteId: "",
    communityHandleData: {
      topicList: [],
      categoryList: []
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var tplId = options.tplid;
    wx.showShareMenu({
      withShareTicket: false
    });
    // 模板页面里面的数据使用eley这个账号的
    wx.setStorageSync('mallSiteId', "2774");
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      if (options.scene) {
        var scene = decodeURIComponent(options.scene);
        var params = scene.split("=");
        if (params[0] == "tplid") {
          app.globalData.tplid = params[1];
          tplId = params[1];
        }
      }
      that.setData({
        tplid: tplId
      });

      // OEM独立部署客户的模板预览域名特殊处理
      if (Number(tplId) <= 100 && (cf.config.pageDomain.indexOf("app.ctcloud.net.cn") >= 0 || cf.config.pageDomain.indexOf("app.ilineke.com") >= 0)) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({
          userImagePath: "http://cdn.xcx.weijuju.com/",
          pageDomain: "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 207 && cf.config.pageDomain.indexOf("xyz888.org") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({  
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 207 && cf.config.pageDomain.indexOf("truesion.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({  
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 207 && cf.config.pageDomain.indexOf("dmlapp.cn") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({  
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 207 && cf.config.pageDomain.indexOf("huokexia.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({  
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 207 && cf.config.pageDomain.indexOf("fomose.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({  
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 243 && cf.config.pageDomain.indexOf("hxtgz.com") >= 0) {
          cf.config.pageDomain = "https://youyu.weijuju.com";
          cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
          that.setData({  
            userImagePath : "http://cdn.xcx.weijuju.com/",
            pageDomain : "https://youyu.weijuju.com"
          });
          wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
        }
      if (Number(tplId) <= 244 && cf.config.pageDomain.indexOf("wocloud.com.cn") >= 0) {
          cf.config.pageDomain = "https://youyu.weijuju.com";
          cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
          that.setData({  
            userImagePath : "http://cdn.xcx.weijuju.com/",
            pageDomain : "https://youyu.weijuju.com"
          });
          wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
        }
      if (Number(tplId) <= 256 && cf.config.pageDomain.indexOf("hui7.cn") >= 0) {
          cf.config.pageDomain = "https://youyu.weijuju.com";
          cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
          that.setData({  
            userImagePath : "http://cdn.xcx.weijuju.com/",
            pageDomain : "https://youyu.weijuju.com"
          });
          wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 266 && cf.config.pageDomain.indexOf("newsuncs.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({
          userImagePath: "http://cdn.xcx.weijuju.com/",
          pageDomain: "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 232 && cf.config.pageDomain.indexOf("app307.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({  
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 232 && cf.config.pageDomain.indexOf("adyun.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({
          userImagePath: "http://cdn.xcx.weijuju.com/",
          pageDomain: "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 260 && cf.config.pageDomain.indexOf("maiduocbd.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      if (Number(tplId) <= 260 && cf.config.pageDomain.indexOf("gzscit.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        });
        wx.setStorageSync("oem_index_page", "/pages/index/tpl_index?scene=" + options.scene);
      }
      
      if (cf.config.pageDomain.indexOf("weijuju.com") >= 0) {
        cf.config.pageDomain = "https://youyu.weijuju.com";
        cf.config.userImagePath = "http://cdn.xcx.weijuju.com/";
        that.setData({
          userImagePath : "http://cdn.xcx.weijuju.com/",
          pageDomain : "https://youyu.weijuju.com"
        })
      }
      
      that.fetchData(function(){
        util.afterPageLoad(that);
        that.fetchLocationAddr();
        let callback = function (data) {
          that.setData({
            multInfoAddr: data.model.address
          });
        };
        util.autoGeyAddr(callback, cusmallToken);
        if (that.data.bgMusic) {
          that.audioCtx = wx.createAudioContext('bgMusic');
          that.audioCtx.play();
        }
      });
    });
  },

  fetchData:function(cb){
    var that = this;
    var app = getApp();
    wx.showLoading({
      title: '加载中',
    });
    var submitData = {
      cusmallToken: wx.getStorageSync('cusmallToken'),
      templateId: that.data.tplid
    };

    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/template/getTemplateById',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      fail: function (data) {
        console.error("后台接口getMallSite失败", data);
      },
      success: function (res) {
        console.log("Finish fetchMallSite...RES DATA", res);
        var mallSite = res.data.model.mallSite;
        var decorationData = {};
        if (res.data.model.template) {
          decorationData = JSON.parse(res.data.model.template.tplContent);
        }
        wx.setNavigationBarTitle({
          title: res.data.model.template.title
        });
        // 缓存底部菜单数据
        if (decorationData != null && decorationData.items != null) {
          for (var i = 0; i < decorationData.items.length; i++) {
            var item = decorationData.items[i];
            if (item.item_type == "bottomMenusWidget") {
              app.globalData.bottomMenus = item.data;
            } else if (item.item_type == "shopCartWidget") {
              app.globalData.haveShopcart = true;
              app.globalData.shopCart = item.data;
            } else if (item.item_type == "kefutWidget") {
              app.globalData.haveContact = true;
              app.globalData.contact = item.data;
            }
          }
        }
        // 处理decorationData
        util.processDecorationData(decorationData, that);
        that.setData({
          decoration: decorationData,
        });
        typeof cb == "function" && cb();
        
        wx.hideLoading();
      }
    })
  },

  changeRoute: function (url) {
    wx.navigateTo({
      url: `../${url}/${url}`
    })
  },

  fetchLocationAddr: function (latitude, longitude) {
    var that = this;
    let multClassArr = that.data.multClassArr;
    let multInfoArr = {};
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        let submitData = {
          cusmallToken: cusmallToken,
          longitude: latitude || res.longitude,
          latitude: longitude || res.latitude
        };
        // 加载预览的店铺的多店铺信息
        if (app.globalData.previewuid) {
          submitData.uid = app.globalData.previewuid;
        }
        for (let key in multClassArr) {

          submitData.multClass = multClassArr[key];
          wx.request({
            url: cf.config.pageDomain + "/applet/mobile/multstore/getMultStoreList",
            data: submitData,
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
              let data = res.data;
              if (data && data.model.result) {
                that.setData({
                  ['multInfoArr.' + key + '']: data.model.result.slice(0, 5)
                });

              } else {
                that.setData({
                  ['multInfoArr.' + key + '']: []
                });
              }


            },
            fail: function () {
            },
            complete: function () {
            }
          });
        }


      }
    })
  },
  getMultLocation: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        that.fetchLocationAddr(res.latitude, res.longitude);
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
    let that = this;
    if (that.data.bgMusic && that.data.playBgMusic) {
      that.audioCtx.play();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.audioCtx) {
      this.audioCtx.pause();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  onPullDownRefresh: function () {
    //页面相关事件处理函数--监听用户下拉动作
    // console.log('onPullDownRefresh');
    // //调用应用实例的方法获取全局数据
    var that = this;
    app.getUserInfo(this,{},function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.fetchData(function () {
        util.afterPageLoad(that);
        that.fetchLocationAddr();
        let callback = function (data) {
          that.setData({
            multInfoAddr: data.model.address
          });
        };
        util.autoGeyAddr(callback, cusmallToken);
      });
    },true);

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
}));