// search.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var address = require('../../utils/city2-min.js');
var sortLine = require("../template/sortLine.js");
var baseHandle = require("../template/baseHandle.js");
let searchHandle = require("../template/searchHandle.js");
var animation;
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, sortLine, searchHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    keyword:"",
    app:app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    isGoodsInteral:false,
    goodsList:[],
    addressNew: address,
    animationAddressMenu: {},
    addressMenuIsShow: false,
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    value: [0, 0, 0],
    provinces: [],
    citys: [],
    areas: [],
    areaInfo:"",
    mAreaId:"",
    widgetIndex:1,
    goodsOrderObj:{
      'w_1':{
        orderType: "1",
        isAsc: false
      }
    },
    isLoading: false,
    isBottom: false,
    showAddress: false,
    page: 1,
    total: -1,
    recommendGoodsList:[]
  },
  handleSearchInput: function (e) {
    this.data.inputStr = e.detail.value;
    this.setData({ keyword: this.data.inputStr });
  },
  search: function (e) {
    if (this.data.isLoading) {
      return;
    }
    this.data.page = 1;
    this.setData({
      total: -1
    });

    this.fetchData(false, 1);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      if ("true" == options.isGoodsInteral){
        that.setData({
          isGoodsInteral: true
        });
      }
      if (options.isReq && "true" == options.isReq){
        that.setData({
          showAddress: options.isReq
        });
      }
      wx.setNavigationBarTitle({
        title: "商品搜索列表"
      })
      that.setData({ keyword: options.keyword });
      that.setData({ mAreaId: options.aId || "" });
      that.setData({ areaInfo: options.aInfo || "" });
      that.fetchData(false,1);
      that.getRecommendGoods(1);
      util.afterPageLoad(that);
    });

    // 初始化动画变量 地址选择
    var animation = wx.createAnimation({
      duration: 500,
      transformOrigin: "50% 50%",
      timingFunction: 'ease',
    })
    this.animation = animation;
    // 默认联动显示北京
    var id = address.provinces[0].id;

    this.setData({
      provinces: address.provinces,
      citys: address.citys[id],
      areas: address.areas[address.citys[id][0].id],
    });
    //地址选择
  },

  fetchData: function (more, page) {
    var that = this;

    let list = this.data.goodsList;
    that.setData({
      isComplete: false,
      isLoading: true
    });
    if (that.data.total == list.length) {
      that.setData({
        isBottom: true
      });
      that.setData({
        isLoading: false
      });
      return;
    }

    wx.showLoading({
      title: '加载中',
    });
    var mallSite = wx.getStorageSync('mallSite');
    var goodType = 1;
    if (mallSite && mallSite.tplType){
      if (3 == mallSite.tplType){
        goodType = 2;
      } else if (4 == mallSite.tplType){
        goodType = 3;
      }
    }

    if (that.data.isGoodsInteral){
      goodType = 5;
    }
    var submitData = {
      mallsiteId: mallSiteId,
      cusmallToken: cusmallToken,
      goodsName: that.data.keyword,
      goodsType: goodType,
      area: that.data.mAreaId,
      start: (page - 1) * 10,
      limit: 10
    }
    var goodsOrder = that.data.goodsOrderObj["w_1"];
    if (goodsOrder) {
      submitData.orderType = goodsOrder.orderType;
      submitData.isAsc = goodsOrder.isAsc;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        var goodsList = res.data.model.result;
        /* 角标筛选 */
        goodsList.forEach(function (itemGoods) {
            if(itemGoods.cornerMarker && !itemGoods.cornerMarker.content){
                itemGoods.cornerMarker=JSON.parse(itemGoods.cornerMarker)
            }else if(!itemGoods.cornerMarker) {
                itemGoods.cornerMarker=""
            }
        })
        that.setData({
          total: res.data.model.total
        });
        // that.setData({ goodsList: goodsList });
        if (more) {
          that.setData({
              goodsList: list.concat(goodsList)
          });
        } else {
          that.setData({
            goodsList: goodsList
          });
        }
        if (0 == goodsList.length) {
          that.setData({
            isBottom: true
          });
        }
        wx.hideLoading();
      },
      complete:function(){
        that.setData({
          isComplete: true,
          isLoading: false
        });
      }
    })

  },

  handleLoadGoodsByOrder: function (widgetIndex) {
    let that = this;
    if (this.data.isLoading) {
      return;
    }
    this.data.page = 1;
    this.setData({
      total: -1
    });
    that.fetchData(false, 1);
  },
  clearAddr:function(){
    this.setData({
      areaInfo: "",
    });
    this.setData({
      mAreaId: ""
    });
    this.fetchData(false, 1);
  },
  // 点击所在地区弹出选择框
  // selectDistrict: function (e) {
  //   var that = this
  //   // 如果已经显示，不在执行显示动画
  //   if (that.data.addressMenuIsShow) {
  //     return;
  //   }
  //   // 执行显示动画
  //   that.startAddressAnimation(true)
  // },
  // 执行动画
  // startAddressAnimation: function (isShow) {
  //   console.log(isShow)
  //   var that = this
  //   if (isShow) {
  //     // vh是用来表示尺寸的单位，高度全屏是100vh
  //     that.animation.translateY(0 + 'vh').step()
  //   } else {
  //     that.animation.translateY(40 + 'vh').step()
  //   }
  //   that.setData({
  //     animationAddressMenu: that.animation.export(),
  //     addressMenuIsShow: isShow,
  //   })
  // },
  // // 点击地区选择取消按钮
  // cityCancel: function (e) {
  //   this.startAddressAnimation(false)
  // },
  // 点击地区选择确定按钮
  citySure: function (e) {
    var that = this
    this.citySureNew(e);
    if (this.data.isLoading) {
      return;
    }
    this.data.page = 1;
    this.setData({
      total: -1
    });
    that.fetchData(false, 1);
  },
  toGoodDetail(e){
    var gType = e.currentTarget.dataset.gtype;
    var gId = e.currentTarget.dataset.gid;
    console.log(gType);
    var url = "";
    if (1 == gType){
      url = "/pages/detail/detail?id=" + gId;
    } else if (2 == gType){
      url = "/pages/takeout/indexDetail?fromIndex=true&id=" + gId + "&type=ta";
    } else if (3 == gType){
      url = "/pages/yuyue/yydetail?id=" + gId;
    } else if (5 == gType) {
      url = "/pages/detail/detail?id=" + gId;
    }
    wx.navigateTo({
      url: url,
    })
  },
  // 点击蒙版时取消组件的显示
  // hideCitySelected: function (e) {
  //   console.log(e)
  //   this.startAddressAnimation(false)
  // },
  // 处理省市县联动逻辑
  // cityChange: function (e) {
  //   var that = this;
  //   var value = e.detail.value
  //   var provinces = this.data.provinces
  //   var citys = this.data.citys
  //   var areas = this.data.areas
  //   var provinceNum = value[0]
  //   var cityNum = value[1]
  //   var countyNum = value[2]
  //   // 如果省份选择项和之前不一样，表示滑动了省份，此时市默认是省的第一组数据，
  //   if (this.data.value[0] != provinceNum) {
  //     var id = provinces[provinceNum].id
  //     this.setData({
  //       value: [provinceNum, 0, 0],
  //       citys: address.citys[id],
  //       areas: address.areas[address.citys[id][0].id],
  //     })
  //   } else if (this.data.value[1] != cityNum) {
  //     // 滑动选择了第二项数据，即市，此时区显示省市对应的第一组数据
  //     var id = citys[cityNum].id
  //     this.setData({
  //       value: [provinceNum, cityNum, 0],
  //       areas: address.areas[citys[cityNum].id],
  //     })
  //   } else {
  //     // 滑动选择了区
  //     this.setData({
  //       value: [provinceNum, cityNum, countyNum]
  //     })
  //   }
  //   console.log(this.data)
  // },
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
    // 分页
    if (this.data.isLoading) {
      return;
    }
    this.data.page = ++this.data.page;
    this.fetchData(true, this.data.page);
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
    let that = this;
    let path = '/pages/search/search';
    let shareObj = that.getShareConfig(path);
    return shareObj;

  }
}))
