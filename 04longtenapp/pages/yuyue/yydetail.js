// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var yyGoodsCategoryHandle = require("../template/yyGoodsCategory.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var commHandle = require("../template/commHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle, yyGoodsCategoryHandle,commHandle, goodsDetailHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    app:app,
    goodsData: {},
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    goodsCover:[],
    specList:[],
    decoration: {},
    vipCard:{},
    totalCount: 1,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    isCollected:false,
    bannerHeight: {},
    mainBannerHeight: 100,
    unitName:"",
    shoppingCartCount: 0,
    deliveryTxt:"-",
    id: "",
    price:0,
    originalPrice:0,
    contClass:"",
    fuzzyLayerStatu:"",
    infoDialogStatu:"",
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    judgeCount:"",
    directValue: 0,//直接奖励
    inderectValue: 0,//间接奖励
    isSalesmen: false,//判断是否是销售人员
    showFX: false,//判断是开启分销,
    playBgMusic: true,
    posterUrl: "",//海报url
    showTrack: false,//足迹
    currentIndex: 0,//当前索引
    step: 0,
    trackList: [],
    microBottomMenu:{},
    navTabPanelData: {},
    multInfo: {},
    multInfoArr: {},
    multInfoAddr: "",
    multClassArr: {},
    haveMutl: false,
    haveSearch: false,

    communityHandleData: {
      topicList: [],
      categoryList: []
    },
    showOverReduce: false,//满减配置
    overReduceType: 0,
    overReduceRule: {},
    showOverReduceDetail: false,//满减详情下拉
    showCardPrice: true, //会员价
    isDone:false, //数据是否加载完成
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var fromOpenId = options.fromOpenId;
    var shareType = options.shareType;
    that.setData({
      isMainShop: !app.globalData.shopuid//是否是主店
    });
    mallSite = wx.getStorageSync('mallSite');
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.getReviewConfig();
      that.setData({ id: options.id });
      //that.setData({ id: 44 });//开发时为方便特殊定制
      that.fetchData();
      that.fetchCount();
      that.findConfig();
      /* 积分设置 */
      that.getIntegrate();
      that.getTrackList();
      console.log(app.globalData.isDistributor);
      console.log(app.globalData.isOpenDistribution);
      console.log(app.globalData.myOpenid);
      // if ("FX" == shareType) {
      //   that.bindPromoter(fromOpenId);
      // }
      util.getShoppingCartCount(function (count) {
        that.setData({ shoppingCartCount: count });
      },app);
      that.setData({
        showFX: app.globalData.isOpenDistribution
      });
      that.setData({
        isSalesmen: app.globalData.isDistributor
      });
      if (that.data.showFX && that.data.isSalesmen) {
        that.getDistributorConfig();
        that.getPromoterAccount();
      }

      if (options.scene && !options.id) {//如果是qrcode进来则绑定
        console.log("qrcode进来---")
        that.bindPromoterByQR(options.scene)
      }
      that.findConfig();
      util.afterPageLoad(that);
    });
    //满减判断
    if (mallSite.overReduce) {
      let overReduce = JSON.parse(mallSite.overReduce);
      if (overReduce.ruleType && overReduce.ruleArray && (overReduce.ruleType == 1 || overReduce.ruleType == 2)) {
        let overReduceType = overReduce.ruleType;
        let overReduceRule = overReduce.ruleArray;
        if (overReduceRule.length > 0) {
          for (let i = 0; i < overReduceRule.length; i++) {
            overReduceRule[i].reduce = (overReduceRule[i].reduce / 100).toFixed(2);
            if (overReduceType == 2) {
              overReduceRule[i].over = (overReduceRule[i].over / 100).toFixed(2);
            }
          }
          that.setData({
            showOverReduce: true,
            overReduceType: overReduceType,
            overReduceRule: overReduceRule,
          });
        }
      }
    }
    // 首单立减
    if (mallSite.firstOrderDiscount) {
      let firstOrderDiscount = JSON.parse(mallSite.firstOrderDiscount);
      firstOrderDiscount.reduceMoney = (firstOrderDiscount.reduceMoney / 100).toFixed(2);
      that.setData({
        firstOrderDiscount: firstOrderDiscount
      })
    }
  },
  viewImg: function (e) { // 预览图片
    var ctx = this;
    var idx = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    var relaPathPic = [];
    if ("banner" == type) {
      relaPathPic = ctx.data.goodsCover;
    }
    var absoultPathPic = [];
    for (var i = 0; i < relaPathPic.length; i++) {
      let imgUrl = ""
      if (relaPathPic[i].indexOf("http") != 0) {
        imgUrl = ctx.data.userImagePath + relaPathPic[i]
      } else {
        imgUrl = relaPathPic[i]
      }
      absoultPathPic.push(imgUrl);
    }
    wx.previewImage({
      current: absoultPathPic[idx],
      urls: absoultPathPic
    })
  },
  // 收藏
  collectGoods:function (){
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    var reqUrl = "";
    that.setData({
      isCollected: !that.data.isCollected
    })
    if(that.data.isCollected){
      reqUrl = "/applet/mobile/goods_follow/collectGoods";
    }else {
      reqUrl = "/applet/mobile/goods_follow/cancelCollect";
    }

    wx.request({
      url: cf.config.pageDomain + reqUrl,
      data: {
        cusmallToken: cusmallToken,
        goodsId:that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data && res.data.ret == 0) {
          if (that.data.isCollected) {
            wx.showToast({
              title: '收藏成功！',
              image: "../../images/collectedB.png",
              duration: 3000
            })
          } else {
            wx.showToast({
              title: '取消收藏！',
              image: "../../images/cancelCollectB.png",
              duration: 3000
            })
          }

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: ''+res.data.msg
          })
        }
      }
    })


  },

  fetchData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain +'/applet/mobile/goods/selectGoods',
      data: {
        cusmallToken: cusmallToken,
        goodsId: that.data.id,
        addFootprint: true,
        showCardPrice:true

      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if(res.data.ret == 0){
          var goodsData = res.data.model.goods;
          var memberCardId = res.data.model.memberCardId || 0;
          var memberCardPrice = res.data.model.memberCardPrice || 0;
          if (goodsData.directValue) {
            that.setData({ directValue: goodsData.directValue });
          }
          if (goodsData.inderectValue) {
            that.setData({ inderectValue: goodsData.inderectValue });
          }

          that.setData({
            price: (goodsData.price/100).toFixed(2),
            memberCardId: memberCardId,
            memberCardPrice: (memberCardPrice / 100).toFixed(2),
            originalPrice: (goodsData.originalPrice / 100).toFixed(2),
            unitName: goodsData.unitName,
            BuyGoodsMoney: goodsData.giftIntegral
          });
          if (res.data.model.hasOwnProperty('isFollow')){
            that.setData({
              isCollected:res.data.model.isFollow
            })
          }
          if (goodsData.decoration == null){
            goodsData.decoration = {};
          }
          // if (goodsData.usenewspec){
          //   var specList = JSON.parse(goodsData.spec);
          //   that.setData({ "specList": specList});
          //   goodsData.selectedSku = specList[0];
          //   that.setData({ price: (goodsData.selectedSku.price / 100).toFixed(2) });
          // }
          if (goodsData.usenewspec) {
            var specData = JSON.parse(goodsData.spec);
            that.setData({ "specData": specData });
            if (res.data.model.spec.length > 1) {
              var ids = specData[0].ids.split(',')
              for (let i = 0; i < res.data.model.spec.length; i++) {
                res.data.model.spec[i].selectedId = ids[i];
              }
            } else {
              res.data.model.spec[0].selectedId = specData[0].ids;
            }
            that.setData({ "specList": res.data.model.spec });
            goodsData.selectedSku = specData[0];

            that.setData({ price: (goodsData.selectedSku.price / 100).toFixed(2) });
          }
          if ((goodsData.configSuperSwitch & (Math.pow(2, 0))) != 0 || !memberCardId) {
            that.setData({
              showCardPrice: false
            })

          }
          if (goodsData.pics != null){
            that.setData({ goodsCover: goodsData.pics.split(",")});
          }
          that.setData({ goodsData: goodsData });

          var decorationData = JSON.parse(goodsData.decoration);
          // 处理decorationData
          util.processDecorationData(decorationData, that);
          that.setData({
            decoration: decorationData,
            vipCard:decorationData.header_data
          });
          if (that.data.bgMusic) {
            that.audioCtx = wx.createAudioContext('bgMusic');
            that.audioCtx.play();
          }
          // 计算快递费用
          that.calDeliveryFee(goodsData);

          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品信息异常',
            showCancel:false,
            content: res.data.msg
          })
        }
      },
      complete:function(){
        wx.hideLoading();
        that.setData({
          isDone:true
        })
      }
    })

  },
  //商品视频
  toPlayVideo(e) {
    var ctx = this;
    wx.navigateTo({
      url: '/pages/single_video/video_play?id=' + ctx.data.goodsData.id,
    })
  },
  //获取足迹数据
  getTrackList: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/footprint/find',
      data: {
        cusmallToken: cusmallToken,
        shopUid: mallSite.uid || "",
        goodsType: 3,
        start: 0,
        limit: 10,
        goodsName: "",
        goodsIdNot: that.data.id || ""


      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data && res.data.ret == 0) {
          var list = res.data.model.list;

          that.setData({
            trackList: list
          })

          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品足迹异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },

  findSkuFromGoods(goods, skuId) {
    var specList = JSON.parse(goods.spec);
    for (var i = 0; i < specList.length; i++) {
      if (specList[i].ids == skuId) {
        return specList[i];
      }
    }
    return null;
  },
  goToOrderList:function(){
    wx.navigateTo({
      url: '/pages/orderlist/orderlist?status=&sitetype=yuyue'
    })
  },
  // 计算运费
  calDeliveryFee: function (goodsData){
    var that = this;
    if (goodsData.deliveryFeeType == 0) {
      that.setData({ deliveryTxt: "快递："+that.data.app.globalData.currencySymbol + (goodsData.deliveryPrice / 100).toFixed(2) });
    } else if (goodsData.deliveryFeeType == 1){
      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/yunfei/getTemplateById',
        data: {
          id: goodsData.deliveryTemplateId,
          cusmallToken: cusmallToken
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          var template = res.data.model.template;
          that.setData({ deliveryTxt: "快递：" + that.data.app.globalData.currencySymbol + (template.price / 100).toFixed(2) });
        }
      })
    } else{
      that.setData({ deliveryTxt: "快递包邮"});

    }
  },
  bindChange: function (event) {
    var that = this;
    var inputValue = Number(event.detail.value);
    if (inputValue > 0 && inputValue < that.data.goodsData.totalCount){
      that.setData({ totalCount: inputValue });
    }
  },
  addCount: function(){
    var that = this;
    if (that.data.totalCount < that.data.goodsData.totalCount){
      var totalCount = ++that.data.totalCount;
      that.setData({ totalCount: totalCount});
    }
  },
  minusCount: function () {
    var that = this;
    if (that.data.totalCount > 1){
      var totalCount = --that.data.totalCount;
      that.setData({ totalCount: totalCount });
    }
  },

  onBuyNow:function(){
    var that = this;
    that.setData({ contClass: "step2 onByNow" });
  },

  onAddCart:function(){
    var that = this;
    that.setData({ contClass: "step2 onAddCart" });
  },
  onBuyNowNext:function(){
    var that = this;
    var goodsData = that.data.goodsData;
    wx.navigateTo({
      url: '/pages/yuyue/yyorderinfo?id=' + that.data.id + "&goodsCount=" + that.data.totalCount + (goodsData.selectedSku ? ("&specId=" + goodsData.selectedSku.ids) : "") + "&specInventory=" + (goodsData.selectedSku ? goodsData.selectedSku.inventory : "")
    })
  },
  // 添加到购物车
  onAddCartNext:function(){
    var that = this;
    wx.showLoading({
      title: '处理中',
    });
    var submitData = {
      cusmallToken: cusmallToken,
      goodsId: that.data.id,
      category: that.data.goodsData.category,
      category2: that.data.goodsData.category2,
      goodsCount: that.data.totalCount
    };
    if (that.data.goodsData.selectedSku){
      submitData.spec = JSON.stringify(that.data.goodsData.selectedSku);
    }
    wx.request({
      url: cf.config.pageDomain +'/applet/mobile/shopping_cart/addShoppingCart',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          that.setData({ contClass: "" });
          that.setData({ fuzzyLayerStatu: "fuzzylayer-show" });
          that.setData({ infoDialogStatu: "dialog-show" });
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '添加失败',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  onCloseInfoDialog:function(){
    var that = this;
    that.setData({ fuzzyLayerStatu: "fuzzylayer-hide" });
    that.setData({ infoDialogStatu: "dialog-hide" });
  },
  onCloseBuy:function(){
    var that = this;
    that.setData({ contClass: "" });
  },
  //prevTrack
  prevTrack: function () {
    let that = this;
    that.setData({
      currentIndex: that.data.currentIndex - 1,
      step: -(that.data.currentIndex - 1) * 45
    })
  },
  //nextTrack
  nextTrack: function () {
    let that = this;
    that.setData({
      currentIndex: that.data.currentIndex + 1,
      step: -(that.data.currentIndex + 1) * 45
    })
  },

  // show modal

  showModel: function () {
    var that = this;
    that.setData({
      showTrack: false
    })
  },

  //点击满减箭头事件
  changeOverReduce: function () {
    var that = this;
    that.setData({
      ['showOverReduceDetail']: !that.data.showOverReduceDetail,
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
    that.getTrackList();
    that.setData({
      currentIndex: 0,//当前索引
      step: 0,
    })
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
    console.log("1")
    let ctx = this;
    if (ctx.data.trackList.length > 0) {
      ctx.setData({
        showTrack: true
      })
    }
    wx.stopPullDownRefresh();
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
    let shareObj = that.getShareConfig(that.data.goodsData.name);
    return shareObj;
  }
}))
