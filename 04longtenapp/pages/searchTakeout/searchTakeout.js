// search.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var address = require('../../utils/city2-min.js');
var baseHandle = require("../template/baseHandle.js");
let searchHandle = require("../template/searchHandle.js");
var mallSite = wx.getStorageSync('mallSite');
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var animation;
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, goodsDetailHandle,searchHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    keyword:"",
    app:app,
    foodType:'',
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    goodsList:[],
    value: [0, 0, 0],
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    widgetIndex:1,
    isLoading: false,
    isBottom: false,
    showAddress: false,
    page: 1,
    total: -1
  },
  handleSearchInput: function (e) {
    this.data.inputStr = e.detail.value;
    wx.hideLoading();
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
    that.data.options=options;
    wx.hideShareMenu();
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      console.log(mallSiteId);
      wx.setNavigationBarTitle({
        title: "商品搜索列表"
      });
      console.log(options.foodType);
      that.setData({
        foodType: options.foodType || "" ,
        toType:options.type
      });
      util.afterPageLoad(that);
      // that.fetchData(false,1)
    });
    if (options.shopuid) {
      app.globalData.shopuid = options.shopuid;
      app.globalData.fromuid = options.fromuid;
      that.data.app.globalData.shopuid = options.shopuid;
      that.data.app.globalData.fromuid = options.fromuid;
    } else if (!app.globalData.shopuid) {
      app.globalData.shopuid = "";
      app.globalData.fromuid = "";
      that.data.app.globalData.shopuid = "";
      that.data.app.globalData.fromuid = "";
    }
    /**
     * 本地缓存购物车
     */
    var mShopCart;
    if (app.globalData.shopuid && app.globalData.fromuid){//子店购物车
      mShopCart = wx.getStorageSync(options.type + "c" + app.globalData.shopuid + app.globalData.fromuid) || {};
      that.setData({
        cartKey: options.type + "c" + app.globalData.shopuid + app.globalData.fromuid
      });
    }else{
      mShopCart = wx.getStorageSync(options.type + "cMain") || {};
      that.setData({
        cartKey: options.type + "cMain"
      });
    }
    console.log(options.type);
    that.setData({
      takeOutShoppingCart: mShopCart.takeOutShoppingCart || [],
      sumInfo: mShopCart.sumInfo,
      toType:options.type
    })
    /**
     * 本地缓存购物车
     */

    wx.showShareMenu({
      withShareTicket: false
    });
    wx.removeStorageSync("toStoreTableInfo");
    if (options.type && options.type == "tostore"){
      that.setData({
        tostore : true
      })
      that.setData({
        foodType:3
      });
    }
    if (options.type && options.type == "ta") {
      that.setData({
        foodType: 4
      });
    }
    if (options.scene) {
      var scene = decodeURIComponent(options.scene);
      that.data.scene = scene.split("&");
      let tableId = that.data.scene[0].split("=")[1];
      let sceneType = that.data.scene[1].split("=")[1];
      if ("tostore" == sceneType){
        that.setData({
          tostore: true,
          toType: sceneType
        })
      }
      that.findTableInfo(tableId);
    }
    if (options.fromIndex){
      that.setData({
        fromIndex : true
      })

      that.setData({
        showOpeningModal: app.globalData.showOpeningModal
      })
    }
    if (that.data.tostore){
      let titleName = "商品列表";
      if (options.titleName){
        titleName = decodeURIComponent(decodeURIComponent(options.titleName));
      }
      wx.setNavigationBarTitle({
        title: titleName
      })
    }
    if (options.returnIndex){
      that.setData({
        returnIndex: options.returnIndex
      })
    }
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      //util.afterPageLoad(this);
      // 获取当前位置
      that.fetchDistance();
      that.findShoperInfo();
      that.findConfig();

      //开始处理分销
      that.setData({
        showFX: app.globalData.isOpenDistribution
      });
      that.setData({
        isSalesmen: app.globalData.isDistributor
      });
      if (that.data.showFX && that.data.isSalesmen) {
        that.getDistributorConfig();
      }
      util.afterPageLoad(that);
    });
    // app.getUserInfo(this,options,function (userInfo, res) {
    //   cusmallToken = wx.getStorageSync('cusmallToken');
    //   mallSiteId = wx.getStorageSync('mallSiteId');
    //   that.findCategory();
      that.findShoperInfo();
    //   //util.afterPageLoad(this);
    //   // 获取当前位置
    //   that.fetchDistance();
    //
    //   that.findConfig();
    //
    //   //开始处理分销
    //   that.setData({
    //     showFX: app.globalData.isOpenDistribution
    //   });
    //   that.setData({
    //     isSalesmen: app.globalData.isDistributor
    //   });
    //   if (that.data.showFX && that.data.isSalesmen) {
    //     that.getDistributorConfig();
    //   }
    //   util.afterPageLoad(that);
    // });

  },

  /* 获取商家信息 */
  findShoperInfo: function(){
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/takeAway/find',
      data: {
        siteId: mallSiteId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log(res);
        if (res.data.ret == 0) {
          var shoperInfo = res.data.model.takeAway;
          var businessCheck = res.data.model.takeAway.businessCheck;
          if (shoperInfo && shoperInfo.businessTime){
            shoperInfo.businessTime = JSON.parse(shoperInfo.businessTime);
          }
          that.setData({
            shoperInfo: shoperInfo || {},
            businessCheck: businessCheck
          });
          var information = (shoperInfo && shoperInfo.information) || 0;
          if ((information & (Math.pow(2, 2))) ==0){
            that.setData({
              eatTypeTipsShow:true
            })
          }
          //是分享进来的 判断是否营业
          if (that.data.businessCheckFlag && !that.data.businessCheckFlag) {
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: '很抱歉，商家尚未营业',
              success(res) {
                if (res.confirm) {
                  wx.navigateBack({
                    delta: -1
                  });
                }
                else {
                  wx.navigateBack({
                    delta: -1
                  });
                }
              }
            })
          }
          //正常情况下进来的 判断是否营业
          if (!businessCheck) {
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: '很抱歉，商家尚未营业',
              success(res) {
                if (res.confirm) {
                  wx.navigateBack()
                }
                else {
                  wx.navigateBack()
                }
              }
            })
          }
        }
      }
    })
  },

  /* 获取商品信息事件 */
  fetchData: function (more, page) {
    if(!this.data.keyword){
      wx.showToast({
        title: "请输入商品名称",
        icon: "none"
      });
      return false
    }
    var that = this;

    let list = this.data.goodsList;
    that.setData({isLoading: true});
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
    var foodType = this.data.foodType;
    var submitData = {
      mallsiteId: mallSiteId,
      cusmallToken: cusmallToken,
      goodsName: that.data.keyword,
      goodsType: 2,
      foodType:foodType,
      start: (page - 1) * 10,
      limit: 500
    }
    // var goodsOrder = that.data.goodsOrderObj["w_1"];
    // if (goodsOrder) {
    //   submitData.orderType = goodsOrder.orderType;
    //   submitData.isAsc = goodsOrder.isAsc;
    // }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log(res);
        var goodsList = res.data.model.result;
        that.setData({
          total: res.data.model.total,
          result:true
        });
        /* 角标筛选 */
        goodsList.forEach(function (itemGoods) {
          if(itemGoods.cornerMarker && !itemGoods.cornerMarker.content){
            itemGoods.cornerMarker=JSON.parse(itemGoods.cornerMarker)
          }else if(!itemGoods.cornerMarker){
            itemGoods.cornerMarker=""
          }
        })
        // that.setData({ goodsList: goodsList });
        if (more) {
          that.setData({ goodsList: list.concat(goodsList) });
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
          isLoading: false
        });
      }
    })

  },

  /* 进入商品详情事件 */
  handleGoodsItemTap:function(e){
    var that = this;
    var target = e.currentTarget;
    var goodsId = target.dataset.id;
    // var goodsPos = that.findGoodsPos(goodsId);
    // console.log(goodsPos==true);
    // var catIndex = goodsPos ? goodsPos[0] : null;
    // var goodsIndex = goodsPos ? goodsPos[1] : null;
    var goodsIndex=target.dataset.index;
    console.log(goodsIndex);
    var goods=that.data.goodsList[goodsIndex];
    console.log(goods);
    // var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
    // var target = e.target;
    if(goodsId){
      if(that.data.options.tableNo){
        wx.navigateTo({
          url: '/pages/multiRepast/indexDetail?fromIndex=true&goodsId=' + goodsId + '&type=' + that.data.toType + '&tableNo=' + that.data.options.tableNo,
        })
      }else {
        wx.navigateTo({
          url: '../takeout/indexDetail?fromIndex=true&goodsId=' + goodsId+'&type='+that.data.toType,
        })
      }

    }
    if (target) {
      var action = target.dataset.action;

      if(action){
        return;
      }
    }
    if (!goods.selectedSku) {
      goods.selectedSku = JSON.parse(goods.spec)[0];
    }
    // that.setData({ "showGoods": goods });

  },

  /*  商品相关操作  */
  handleTabItemTap : function(e){
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    var target = e.target;
    if(target){
      var action = target.dataset.action;
      console.log(action);
      /* 规格选择操作 */
      if ("selectSpec" == action){
        var goodsId = e.target.dataset.id;
        // var goodsPos = that.findGoodsPos(goodsId);
        // var catIndex = goodsPos ? goodsPos[0] : null;
        // var goodsIndex = goodsPos ? goodsPos[1] : null;
        var goodsIndex=target.dataset.index;
        console.log(goodsIndex);
        var goods=that.data.goodsList[goodsIndex];
        console.log(goods);
        if(!goods.selectedSku){
          goods.selectedSku = JSON.parse(goods.spec)[0];
        }
        that.setData({
          goodsIndex:goodsIndex,
          "selectedGoods": goods,
          usenewspecShow: true
        });

      }
      /* 商品添加操作 */
      else if("addFood" == action){
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.addFood(goodsId, specIds);
      }
      /* 商品删除操作 */
      else if ("delFood" == action){
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.delFood(goodsId, specIds);
      }
      /*展示购物车操作*/
      else if ("showShoppingCart" == action){
        if (that.data.sumInfo.totalMoney > 0) {
          that.setData({ "showShoppingCart": true });
        }
      }
      /* 去结算操作 */
      else if("submit" == action){
        // 判断是否在营业时间内
        let businessTime = that.data.shoperInfo.businessTime;
        if (businessTime && businessTime.length > 0) {//!that.data.tostore &&
          let nowTime = new Date();
          let isValidTime = false;
          for (let i = 0; i < businessTime.length;i++){
            let busTime = businessTime[i];
            let startTime = new Date();
            startTime.setHours(Number(busTime.startTime.split(":")[0]));
            startTime.setMinutes(Number(busTime.startTime.split(":")[1]));

            let endTime = new Date();
            endTime.setHours(Number(busTime.endTime.split(":")[0]));
            endTime.setMinutes(Number(busTime.endTime.split(":")[1]));

            if (nowTime.getTime() >= startTime.getTime() &&
                nowTime.getTime() <= endTime.getTime()){
              isValidTime = true;
              break;
            }
          }
          if (!isValidTime){
            let busTimeStr = "";
            for (let i = 0; i < businessTime.length;i++){
              busTimeStr += businessTime[i].startTime + "-" + businessTime[i].endTime;
              busTimeStr += "  ";
            }
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: "我的天，商家该时间不营业！\n商家营业时间：\n" + busTimeStr
            });
            return false;
          }
        }

        that.setData({ "isSubmitIng": true });

        if(that.data.tostore){
          wx.setStorageSync('toStoreShoppingCart', that.data.takeOutShoppingCart);
          wx.navigateTo({
            url: '/pages/orderinfo/orderinfo?fromToStore=true&ckey=' + that.data.cartKey
          })
        } else {
          wx.setStorageSync('takeOutShoppingCart', that.data.takeOutShoppingCart);
          wx.navigateTo({
            url: '/pages/orderinfo/orderinfo?fromTakeout=true&ckey=' + that.data.cartKey
          })
        }
      }
    }
  },

  /*  */
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

  // 添加商品事件
  addFood: function (goodsId, specIds){
    console.log(this.checkUserInfo());
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    if (that.data.distance){
      if (!that.data.tostore && that.data.distance > that.data.shoperInfo.distributionRange*1000){
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: "对不起，您当前位置不在配送范围内"
        })
        return false;
      }
    }
    console.log(that.data.takeOutShoppingCart)
    // var goodsPos = that.findGoodsPos(goodsId);
    // var catIndex = goodsPos?goodsPos[0]:null;
    // var goodsIndex = goodsPos?goodsPos[1]:null;
    // if (goodsIndex != null) {
      //T T 购物车还原
      var mCart = that.data.takeOutShoppingCart || [];

      var sGList = that.data.goodsList || [];
      console.log(sGList);
      console.log(that.data.takeOutShoppingCart);
      for (let gItem of mCart){
        console.log(gItem);
        for (let j = 0; j < sGList.length;j++){
          console.log(gItem.id)
          console.log(sGList[j].id)
          if (gItem.id == sGList[j].id) {
            that.setData({
              ["goodsList[" + j + "]"]: gItem
            });
            break;
          }
        }
      }
      //T T 购物车还原
      var goods = that.data.selectedGoods;
      if (typeof (goods.selectedNum) === "undefined") {
        goods.selectedNum = 1;
      } else {
        goods.selectedNum++;
      }
      if (goods.usenewspec){
        if (!specIds) {
          specIds = that.data.selectedGoods.selectedSku.ids;
        }
        goods.specData = JSON.parse(goods.spec);
        for(var j=0;j<goods.specData.length;j++){
          var spec = goods.specData[j];
          if (goods.specData[j].ids == specIds){
            if (typeof (goods.specData[j].selectedNum) === "undefined") {
              goods.specData[j].selectedNum = 1;
            } else {
              goods.specData[j].selectedNum++;
            }
          }
        }
      } else {

      }
      if (that.data.showGoods) {
        that.setData({
          "showGoods": goods,
        });
      }
      that.setData({
        "selectedGoods": goods,
        // ["GoodsList[" + goodsIndex + "]"]: goods
      });
      // 同步所有分类里面的商品信息
      var goodsCatIndex = that.findGoodsIndexFromList(0,goodsId);
      if (goodsCatIndex != null){
        // that.setData({ ["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods });
      }
      that.fillShoppingCart();
    // }
  },

  /* 删除商品事件 */
  delFood: function (goodsId, specIds){
    var that = this;
    var goodsPos = that.findGoodsPos(goodsId);
    var catIndex = goodsPos ? goodsPos[0] : null;
    var goodsIndex = goodsPos ? goodsPos[1] : null;
    if (goodsIndex != null) {
      var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
      if (typeof (goods.selectedNum) === "undefined") {
        goods.selectedNum = 0;
      } else if (goods.selectedNum > 0) {
        goods.selectedNum--;
      }
      if (goods.usenewspec) {
        if (!specIds) {
          specIds = that.data.selectedGoods.selectedSku.ids;
        }
        goods.specData = JSON.parse(goods.spec);
        for (var j = 0; j < goods.specData.length; j++) {
          var spec = goods.specData[j];
          if (spec.ids == specIds) {
            if (typeof (spec.selectedNum) === "undefined") {
              spec.selectedNum = 0;
            } else if (spec.selectedNum > 0) {
              spec.selectedNum--;
            }
          }
        }
      } else {

      }
      if(that.data.showGoods){
        that.setData({
          "showGoods": goods,
        });
      }
      that.setData({
        "selectedGoods": goods,
        ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
      });
      // 同步所有分类里面的商品信息
      var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
      if (goodsCatIndex != null) {
        that.setData({ ["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods });
      }
      that.fillShoppingCart();
      if (that.data.sumInfo.totalMoney <= 0){
        that.setData({
          "showShoppingCart": false,
          "selectedGoods": null
        });
      }
    }
  },
  // 把已选商品加入购物车，去重，计算总数和总金额
  fillShoppingCart: function () {
    var that = this;
    var takeOutShoppingCart = [];
    var totalMoney = 0;
    var totalCount = 0;
    var mallGoodsList = that.data.goodsList;
    for (var i = 0; i < mallGoodsList.length; i++) {
      var goods = mallGoodsList[i];
      if (goods.selectedNum > 0) {
        var isInCart = false;
        for (var k = 0; k < takeOutShoppingCart.length; k++) {
          if (takeOutShoppingCart[k].id == goods.id) {
            isInCart = true;
          }
        }
        if (!isInCart) {
          takeOutShoppingCart.push(goods);
          if (goods.usenewspec) {
            goods.specData = JSON.parse(goods.spec);
            for (var m = 0; m < goods.specData.length; m++) {
              var spec = goods.specData[m];
              if (spec.selectedNum > 0) {
                totalMoney += spec.price * spec.selectedNum;
              }
            }
          } else {
            totalMoney += goods.price * goods.selectedNum;
          }
          totalCount += goods.selectedNum;
        }
      }
    }
    that.setData({
      takeOutShoppingCart: takeOutShoppingCart,
      sumInfo: {
        "totalMoney": totalMoney,
        "totalCount": totalCount
      }
    })
    /**
     * 本地缓存购物车
     */
    var mShopCart = {
      takeOutShoppingCart: takeOutShoppingCart,
      sumInfo: {
        "totalMoney": totalMoney,
        "totalCount": totalCount
      }
    };
    if (app.globalData.shopuid && app.globalData.fromuid) {//子店购物车

      wx.setStorageSync(that.data.toType + "c" + app.globalData.shopuid + app.globalData.fromuid, mShopCart);
    } else {
      wx.setStorageSync(that.data.toType + "cMain", mShopCart);
    }
    /**
     * 本地缓存购物车
     */
    return that.data.sumInfo;
  },

  /* 基本上没什么用 */
  findGoodsPos(goodsId){
    var catList = this.data.categoryList;
    if (catList && catList.length>0){
      for (var j = catList.length-1;j>=0;j--){
        var goodsList = catList[j].mallGoodsList;
        if(goodsList && goodsList.length>0){
          for(var i=0;i<goodsList.length;i++){
            if(goodsId == goodsList[i].id){
              return [j,i];
            }
          }
        }
      }
    }
    return null;
  },

  /* 商品规格弹出框选择 */
  findSkuFromGoods(goods,skuId){
    var specList = JSON.parse(goods.spec);
    for(var i=0;i<specList.length;i++){
      if(specList[i].ids == skuId){
        return specList[i];
      }
    }
    return null;
  },

  /* 根据选中规格来获取信息事件 */
  findSelectedSpec: function (specId, groupId, goods) {
    var that = this;
    var selectedIdArray = [];
    console.log(goods.specJsonArray);
    for (var i = 0; i < goods.specJsonArray.length; i++) {
      var specGroup = goods.specJsonArray[i];
      if (specGroup.id == groupId) {
        specGroup.selectedId = specId;
      } else {
        if (specGroup.selectedId) {

        } else {
          specGroup.selectedId = specGroup.specValue[0].id;
        }
      }
      selectedIdArray.push(specGroup.selectedId);
    }
    var selectedIds = selectedIdArray.join(",");
    goods.specData = JSON.parse(goods.spec);
    for (var k = 0; k < goods.specData.length; k++) {
      if (goods.specData[k].ids == selectedIds) {
        return goods.specData[k];
      }
    }
    return null;
  },

  /* 商品规格相关事件 */
  handleSkuModalTap(e){
    console.log(e);
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    var target = e.target;
    var selectedGoods = that.data.selectedGoods;
    if(target){
      var action = target.dataset.action;
      console.log(action)
      /* 关闭模态框事件 */
      if ("closeModal" == action){
        that.setData({
          "selectedGoods": null,
          usenewspecShow: false
        });
      }
      /* 切换规格事件 */
      else if ("changeSku" == action){
        var specId = target.dataset.id;
        var groupId = target.dataset.groupid;
        console.log(specId)
        console.log(groupId)
        console.log(selectedGoods)
        var sku = that.findSelectedSpec(specId, groupId, selectedGoods);
        that.setData({ ["selectedGoods.selectedSku"]: sku });
        that.setData({ ["selectedGoods.specJsonArray"]: selectedGoods.specJsonArray });
        // var goodsPos = that.findGoodsPos(selectedGoods.id);
        // var catIndex = goodsPos ? goodsPos[0] : null;
        // var goodsIndex = goodsPos ? goodsPos[1] : null;
        /* 这一块需要重新规划 */
        that.setData({ ["goodsList[" + that.data.goodsIndex + "]"]: selectedGoods });
      }
      /* 添加购物车事件 */
      else if ("addToCart" == action){
        console.log(that.data.distance);
        if (that.data.distance) {
          if (!that.data.tostore && that.data.distance > that.data.shoperInfo.distributionRange*1000) {
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: "对不起，您当前位置不在配送范围内"
            })
            return false;
          }
        }
        //selectedGoods.selectedNum = 1;
        that.addFood(selectedGoods.id);
        //var goodsIndex = that.findGoodsPos(selectedGoods.id);
        //that.setData({ ["goodsList[" + goodsIndex + "]"]: selectedGoods });
        //that.setData({ "selectedGoods":selectedGoods});
      } else if ("removeFood" == action){
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.delFood(goodsId, specIds);
      } else if ("addFood" == action) {
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.addFood(goodsId, specIds);
      }
    }
  },
  fetchDistance:function(){
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function (res) {
        console.info("当前位置：",res);
        wx.request({
          url: cf.config.pageDomain + '/mobile/takeAway/getDistance',
          data: {
            siteId: mallSiteId,
            lat1: res.latitude,
            lng1: res.longitude
          },
          header: {
            'content-type': 'application/json'
          },
          success: function (res) {
            console.info("当前位置与商家地址距离",res);
            if (res.data.ret == 0) {
              that.setData({ distance: res.data.model.distance});
            }
          }
        })
      }
    })
  },
  // 同步所有分类里面的商品信息
  findGoodsIndexFromList(catIndex,goodsId){
    var that = this;
    var goodsList = that.data.goodsList;
    console.log(goodsList);
    if (goodsList && goodsList.length > 0) {
      for (var i = 0; i < goodsList.length; i++) {
        if (goodsId == goodsList[i].id) {
          return i;
        }
      }
    }
    return null
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
    this.result=false;
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
    console.log(this.data.isLoading);
    if (this.data.isLoading) {
      return;
    }
    this.data.page = ++this.data.page;
    this.fetchData(true, this.data.page);
  },

  /**
   * 用户点击右上角
   */
}))
