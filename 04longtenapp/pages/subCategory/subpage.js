//index.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var searchHandle = require("../template/searchHandle.js");
var categoryTabHandle = require("../template/categoryTabWidget.js");
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
var address = require('../../utils/city2-min.js');
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, searchHandle, categoryTabHandle, commHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    decoration: {},
    shoppingCartCount: 0,
    app: app,
    id:"",
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    bannerHeight: {},
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    showZan: false,
    isThumbs:false,//是否点过赞
    // 是否跳过用户信息授权
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    playBgMusic: true,
    likeNum:0,
    mallSiteId:"",
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
    multInfo: {},
    multInfoArr: {},
    multInfoAddr: "",
    multClassArr: {},
    haveMutl: false,
    haveSearch:false,

    communityHandleData: {
      topicList: [],
      categoryList: []
    },
    topicArr: {},
    categoryArr: {},
    liveStatus: {
      "101": "直播中",
      "102": "未开始",
      "103": "已结束",
      "107": "已过期",
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    wx.showShareMenu({
      withShareTicket: false
    });
    //生命周期函数--监听页面加载
    var that = this;
    app.getUserInfo(this,options,function (userInfo, res) {

      var pageId = options.pageId;
      if (options.scene) {
        // 处理预览ID
        var scene = decodeURIComponent(options.scene);
        var params = scene.split("=");
        if (params[0] == "pageid") {
          pageId = params[1];
        }
      }
      that.setData({ id: pageId });
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.fetchData();
      util.getShoppingCartCount(function (count) {
        that.setData({ shoppingCartCount: count });
      },app);
      // 初始化动画变量 地址选择
      var animation = wx.createAnimation({
        duration: 500,
        transformOrigin: "50% 50%",
        timingFunction: 'ease',
      })
      that.animation = animation;
      // 默认联动显示北京
      var id = address.provinces[0].id;

      that.setData({
        provinces: address.provinces,
        citys: address.citys[id],
        areas: address.areas[address.citys[id][0].id],
      });
        //地址选择
      util.afterPageLoad(that);
    });
  },
  search: function (e) {
    wx.navigateTo({
      url: '/pages/search/search?keyword=' + e.detail.value,
    })
  },
  loadNavPanelPageContent:function(){
    // 微页面里面不能使用标签导航
  },
  fetchData: function (hideLoading) {
    var that = this;
    if (!hideLoading){
      wx.showLoading({
        title: '加载中',
      });
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/cusmall_page/findById',
      data: {
        cusmallToken: cusmallToken,
        pageId: that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        var decorationData = {};
        decorationData = JSON.parse(res.data.model.detail.decoration);
        console.log(decorationData);
        if (res.data.model.detail) {
          if ((res.data.model.detail.status & (Math.pow(2, 0))) != 0){
            that.setData({
              showZan:true
            });
          }
          that.setData({
            likeNum: res.data.model.detail.thumbsUpCount
          });
          that.setData({
            isThumbs: res.data.model.isThumbs
          });
          wx.setNavigationBarTitle({
            title: res.data.model.detail.name
          })
        }

        var headerData = decorationData.header_data;
        util.processDecorationData(decorationData, that);
        var countTotal=[];
        var isSeckill=false;
        for (var i in decorationData.items) {
          var item = decorationData.items[i];
          if (item.item_type === "seckillWidget" && item.data.content == 0 && item.data.list.length > 0) {
            console.log(item);
            isSeckill = true;
            var countDownList = [];

            var skillArray = [];
            var skillGoodsId = '';
            item.data.list.forEach(function (item2, index2) {
              console.log(index2 % 2 == 0);
              if (index2 % 2 !== 0) {
                skillGoodsId = skillGoodsId + item2.id;
                skillArray.push(skillGoodsId);
                skillGoodsId = '';
              } else {
                if (index2 == item.data.list.length - 1) {
                  skillGoodsId = item2.id + skillGoodsId;
                  skillArray.push(skillGoodsId);
                  skillGoodsId = '';
                } else {
                  skillGoodsId = item2.id + ',' + skillGoodsId;
                }
              }

              countDownList.push(item2.Countdown);
            });
            that.data.skillArray = skillArray;
            that.data.countDownList = countDownList;
            that.getSKListData(skillArray);
            countTotal.push(countDownList)
          }
          if (item.item_type === "seckillWidget" && item.data.content == 1) {
            that.getSKListData();
          }
          if (item.item_type == "bottomMenusWidget") {
            util.afterPageLoad(that, item.data);
            that.setData({
              microBottomMenu: util.afterPageLoad(that, item)
            })
          }
          if (item.item_type == "microBottomMenusWidget") {
            util.afterPageLoad(that, item.data);
            that.setData({
              microBottomMenu: util.afterPageLoad(that, item)
            })
          }
          if (item.item_type == "nav_tab_panel") {
            // 微页面里面不能使用标签导航
            item.item_type = "not_support";
          }
          let titleName = encodeURIComponent(headerData.title);
          if (item.item_type == "takeawayWidget") {
            if (app.globalData.fromuid) {
              if (app.globalData.singleShop) {//如果最顶层已经是子店，在退出子店页面的时候就不要清除fromuid shopuid
                wx.redirectTo({
                  url: '/pages/takeout/index?fromuid=' + app.globalData.fromuid + '&type=ta&shopuid=' + app.globalData.shopuid + "&titleName=" + titleName + (item.data.return_index == 1 ? "&returnIndex=1" : ""),
                })
              }else{
                wx.redirectTo({
                  url: '/pages/takeout/index?fromIndex=true&type=ta&fromuid=' + app.globalData.fromuid + '&shopuid=' + app.globalData.shopuid + "&titleName=" + titleName + (item.data.return_index == 1 ? "&returnIndex=1" : ""),
                })
              }

            } else {
              wx.redirectTo({
                url: '/pages/takeout/index?fromIndex=true&type=ta&titleName=' + titleName + (item.data.return_index == 1 ? "&returnIndex=1" : ""),
              })
            }

            return;
          }
          if (item.item_type == "toStoreWidget") {
            if (app.globalData.fromuid) {
              if (app.globalData.singleShop) {//如果最顶层已经是子店，在退出子店页面的时候就不要清除fromuid shopuid
                wx.redirectTo({
                  url: '/pages/takeout/index?type=tostore&fromuid=' + app.globalData.fromuid + '&shopuid=' + app.globalData.shopuid + "&titleName=" + titleName + (item.data.return_index == 1 ? "&returnIndex=1" : "")
                })
              }else{
                wx.redirectTo({
                  url: '/pages/takeout/index?type=tostore&fromIndex=true&fromuid=' + app.globalData.fromuid + '&shopuid=' + app.globalData.shopuid + "&titleName=" + titleName + (item.data.return_index == 1 ? "&returnIndex=1" : "")
                })
              }

            } else {
              wx.redirectTo({
                url: '/pages/takeout/index?type=tostore&fromIndex=true&titleName=' + titleName + (item.data.return_index == 1 ? "&returnIndex=1" : "")
              })
            }
            return;
          }
        }

        /* 指定秒杀商品代码 */
        if(isSeckill){
          var idx='';
          let secTimer;
          secTimer = setInterval(function () {
            decorationData.items.forEach(function (item,index) {
              if(item.item_type==="seckillWidget" && item.data.content==0) {
                idx = index;

                if (countTotal && 0 < countTotal.length) {
                  countTotal.forEach(function (Item) {
                    for (let i = 0; i < (Item && Item.length); i++) {
                      that.showCountDownList(Item[i].endTime, Item[i]);
                    }
                    var key = "countDefaultList[" + idx + "]";
                    that.setData({
                      [key]: Item,
                    });
                  });
                }
              }
            });
          }, 1000, true);
          that.setData({
            secTimer: secTimer
          });
        }

        that.setData({
          decoration: decorationData,
        });
        if (that.data.bgMusic) {
          that.audioCtx = wx.createAudioContext('bgMusic');
          that.audioCtx.play();
        }
        
        if (that.data.haveMutl || that.data.haveSearch) {//获取当前地址
          that.fetchLocationAddr();
          util.autoGeyAddr(function (data) {
            that.setData({
              multInfoAddr: data.model.address,
              locationInfo: data.model
            });
          }, cusmallToken);
        }
        wx.hideLoading();
      }
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
  navgateTap:function(){

  },
  getMultLocation: function () {
    var that = this;
    wx.chooseLocation({
      success: function (res) {
        that.fetchLocationAddr(res.latitude, res.longitude);
      }
    })
  },
  changeRoute: function (url) {
    wx.navigateTo({
      url: `../${url}/${url}`
    })
  },
  navTabFuc: function (e) {
    console.log(e);
    var url = e.currentTarget.dataset.url;
    if (!url) {
      return false;
    }
    if (url.indexOf("tel:") == 0) {
      wx.makePhoneCall({
        phoneNumber: url.split(":")[1]
      })
    }
  },
  zanTrigger:function(){

    let that = this;
    if (that.data.isThumbs){
      wx.showToast({
        title: "已经点过赞",
        icon: 'success',
        duration: 2000
      });
      return;
    }
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/cusmall_page/thumbsUp",
      data: {
        cusmallToken: cusmallToken,
        id: that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if(data && 0 == data.ret){
          wx.showToast({
            title: "点赞成功",
            icon: 'success',
            duration: 2000
          });
          that.setData({
            isThumbs: true
          });
          that.setData({
            likeNum: that.data.likeNum + 1
          });
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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    app.getUserInfo(this,{},function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.fetchData(true);
      util.getShoppingCartCount(function (count) {
        that.setData({ shoppingCartCount: count });
      }, app);
      util.afterPageLoad(that);
      wx.stopPullDownRefresh();
    });
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
    let shareObj = that.getShareConfig();
    return shareObj;
  }
}));
