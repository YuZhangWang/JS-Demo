// pages/takeout/index.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var commHandle = require("../template/commHandle.js");
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, goodsDetailHandle, commHandle,{
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    logoImg: "http://p0.meituan.net/xianfu/83f5fa588ae12840f2d68e72d1cfc40b46851.jpg",
    panelTab: {
      "selectedId": "0",
      "list": [{
          "id": "0",
          "title": "商品"
        },
        {
          "id": "1",
          "title": "评价"
        },
        {
          "id": "2",
          "title": "商家"
        }
      ]
    },
    selectedCatIndex: 0,
    openGoodsShare: false,
    goodsList: [],
    judgeList: [],
    showGoods: '',
    foodType: "",
    isSalesmen: false, //判断是否是销售人员
    showFX: false, //判断是开启分销,
    bannerHeight: {},
    mainBannerHeight: 562,
    usenewspecShow: false, // 规格框的显示
    takeOutPosterUrl: "",
    showTrack: false, //足迹
    currentIndex: 0, //当前索引
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    step: 0,
    trackList: [],
    decoration: {},
    vipCard:{},
    playBgMusic: true,
    isFirstShowPage: true,
    showOverReduce: false, //满减配置
    overReduceType: 0,
    overReduceRule: {},
    showOverReduceDetail: false, //满减详情下拉
    businessCheck: true, //是否营业
    businessCheckFlag: true, //是否是分享进来页面
    showCardPrice:true
  },

  handlePanelTabChange(e) {
    var selectedId = e.target.dataset.id;
    this.setData({
      [`panelTab.selectedId`]: selectedId
    });
  },

  handlePanelContentChange(e) {
    var current = e.detail.current;
    this.setData({
      [`panelTab.selectedId`]: current
    });
    if (current == 1 && !this.data.hasLoadJudge) {
      this.fetchJudgeData();
      this.data.hasLoadJudge = true;
    }
  },
  //商品视频
  toPlayVideo(e) {
    var ctx = this;
    wx.navigateTo({
      url: '/pages/single_video/video_play?id=' + ctx.data.showGoods.id,
    })
  },
  viewImg: function (e) { // 预览图片
    var ctx = this;
    var idx = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    var relaPathPic = [];
    if ("banner" == type) {
      relaPathPic = ctx.data.gImgs;
    }
    var absoultPathPic = [];
    for (var i = 0; i < relaPathPic.length; i++) {
      let imgUrl = ""
      if(relaPathPic[i].indexOf("http") != 0){
        imgUrl = ctx.data.userImagePath + relaPathPic[i]
      }else{
        imgUrl = relaPathPic[i]
      }
      absoultPathPic.push(imgUrl);
    }
    wx.previewImage({
      current: absoultPathPic[idx],
      urls: absoultPathPic
    })
  },
  handleShoperLbs: function() {
    var shoperInfo = this.data.shoperInfo;
    wx.openLocation({
      latitude: Number(shoperInfo.latitude),
      longitude: Number(shoperInfo.longitude),
      scale: 28,
      name: shoperInfo.name,
      address: shoperInfo.localtion
    })
  },

  addFood: function(goodsId, specIds) {
    var that = this;
    if (that.data.distance) {
      if (!that.data.tostore && that.data.distance > that.data.shoperInfo.distributionRange * 1000) {
        wx.showModal({
          title: '提示',
          showCancel: false,
          content: "对不起，您当前位置不在配送范围内"
        })
        return false;
      }
    }
    var goods = that.data.showGoods;
    that.initLocalCart(that.data.options.type);
    var takeOutShoppingCart = that.data.takeOutShoppingCart || [];
    var isNotInCart = true;
    var addOtherGoods = false;
    if (goodsId == goods.id) {
      for (let item of takeOutShoppingCart) {
        if (goods.id == item.id) {
          isNotInCart = false;
          goods = item;
          break;
        }
      }

    } else {
      isNotInCart = false;
      addOtherGoods = true;
      for (let item of takeOutShoppingCart) {
        if (goodsId == item.id) {
          goods = item;
          break;
        }
      }
    }

    if (goods) {
      // 限购
      if (goods.enableLimitation == 1) {
        if ((goods.selectedNum || 0 + goods.historyCount || 0) >= goods.limitations) {
          wx.showModal({
            title: '',
            content: '该商品最多可购' + goods.limitations + '件',
          })
          return;
        }

      }
      if (goods.enableLimitation == 2) {
        if ((goods.selectedNum || 0 + goods.historyCount || 0) >= goods.limitations) {
          wx.showModal({
            title: '',
            content: '该商品每日最多可购' + goods.limitations + '件',
          })
          return;
        }

      }
      if (typeof(goods.selectedNum) === "undefined") {
        goods.selectedNum = 1;
      } else {
        goods.selectedNum++;
      }
      if (goods.usenewspec) {
        if (!specIds) {
          specIds = that.data.selectedGoods.selectedSku.ids;
        }
        if (that.data.selectedGoods) {
          goods.selectedSku = that.data.selectedGoods.selectedSku;
          goods.specJsonArray = that.data.selectedGoods.specJsonArray;
        }
        for (var j = 0; j < goods.specData.length; j++) {
          var spec = goods.specData[j];
          if (goods.specData[j].ids == specIds) {
            if (typeof (goods.specData[j].selectedNum) === "undefined") {
              goods.specData[j].selectedNum = 1;
            } else {
              goods.specData[j].selectedNum++;
            }
          }
        }
      } else {

      }

      if (!addOtherGoods) {
        that.setData({
          selectedGoods: goods,
          "showGoods": goods,
        });

        if (isNotInCart) {
          takeOutShoppingCart.push(goods);
          that.setData({
            takeOutShoppingCart: takeOutShoppingCart,
          });
        }
        that.fillShoppingCart();
      } else {
        that.setData({
          takeOutShoppingCart: takeOutShoppingCart,
        });
        that.fillShoppingCart();
      }
    }
  },
  delFood: function(goodsId, specIds) {
    var ctx = this;
    var goods = ctx.data.showGoods;
    var takeOutShoppingCart = ctx.data.takeOutShoppingCart;
    var delOtherGoods = goodsId == goods.id ? false : true;


    var newCart = [];
    for (let item of takeOutShoppingCart) {
      if (goodsId == item.id) {
        if (0 < item.selectedNum) {
          item.selectedNum -= 1;
          goods = item;
          if (goods.usenewspec) {
            if (!specIds) {
              specIds = ctx.data.selectedGoods.selectedSku.ids;
            }
            for (var j = 0; j < goods.specData.length; j++) {
              var spec = goods.specData[j];
              if (spec.ids == specIds) {
                if (typeof(spec.selectedNum) === "undefined") {
                  spec.selectedNum = 0;
                } else if (spec.selectedNum > 0) {
                  spec.selectedNum--;
                }
              }
            }
          }


        }

      }
      if (0 != item.selectedNum) {
        newCart.push(item);
      }
    }

    if (!delOtherGoods) {
      ctx.setData({
        showGoods: goods,
        selectedGoods: goods,
        takeOutShoppingCart: newCart,
      })
    } else {
      ctx.setData({
        takeOutShoppingCart: newCart,
      })
    }

    ctx.fillShoppingCart();
  },
  // 把已选商品加入购物车，去重，计算总数和总金额
  fillShoppingCart: function() {
    var that = this;
    var takeOutShoppingCart = that.data.takeOutShoppingCart;
    var goods = that.data.showGoods;
    var totalMoney = 0;
    var totalCount = 0;
    for (let i = 0; i < takeOutShoppingCart.length; i++) {
      if (takeOutShoppingCart[i].usenewspec) {
        for (var m = 0; m < takeOutShoppingCart[i].specData.length; m++) {
          var spec = takeOutShoppingCart[i].specData[m];
          if (spec.selectedNum > 0) {
            totalMoney += spec.price * spec.selectedNum;
          }
        }
      } else {
        totalMoney += takeOutShoppingCart[i].price * takeOutShoppingCart[i].selectedNum;

      }
      totalCount += takeOutShoppingCart[i].selectedNum;
    }
    console.log(takeOutShoppingCart);
    that.setData({
      takeOutShoppingCart: takeOutShoppingCart,
      sumInfo: {
        "totalMoney": totalMoney,
        "totalCount": totalCount
      }
    });
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
    if (app.globalData.shopuid && app.globalData.fromuid) { //子店购物车

      wx.setStorageSync(that.data.toType + "c" + app.globalData.shopuid + app.globalData.fromuid, mShopCart);
    } else {
      wx.setStorageSync(that.data.toType + "cMain", mShopCart);
    }
    /**
     * 本地缓存购物车
     */

    if (0 == totalCount) {
      that.setData({
        "showShoppingCart": false
      });
    }
    return that.data.sumInfo;
  },


  handleShoppingCartTap: function(e) {
    var that = this;
    var target = e.target;
    if (target) {
      var action = target.dataset.action;
      if ("showShoppingCart" == action) {
        if (that.data.sumInfo.totalMoney > 0) {
          that.setData({
            "showShoppingCart": true
          });
        }
      } else if ("hideShoppingCart" == action) {
        that.setData({
          "selectedGoods": null
        });
        that.setData({
          "showShoppingCart": false
        });
      } else if ("addFood" == action) {
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.addFood(goodsId, specIds);
      } else if ("delFood" == action) {
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.delFood(goodsId, specIds);
      } else if ("clearShoppingCart" == action) {
        var goods = that.data.showGoods;
        goods.selectedNum = 0;
        if (goods.usenewspec) {
          for (let item of goods.specData) {
            item.selectedNum = 0;
          }
        }
        that.setData({
          showGoods: goods,
          selectedGoods: null,
          "showShoppingCart": false,
          takeOutShoppingCart: [],
          sumInfo: {
            totalMoney: 0,
            totalCount: 0,
          }
        });
        wx.setStorageSync(that.data.cartKey, {
          takeOutShoppingCart: [],
          sumInfo: {
            "totalMoney": 0,
            "totalCount": 0
          }
        })
      }
    }
  },
  handleGoodsItemTap: function(e) {
    var that = this;
    var target = e.currentTarget;
    var goodsId = target.dataset.id;
    var goodsPos = that.findGoodsPos(goodsId);
    var catIndex = goodsPos ? goodsPos[0] : null;
    var goodsIndex = goodsPos ? goodsPos[1] : null;
    var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
    var target = e.target;
    if (target) {
      var action = target.dataset.action;
      if (action) {
        return;
      }
    }
    if (!goods.selectedSku) {
      goods.selectedSku = JSON.parse(goods.spec)[0];
    }

    that.setData({
      "showGoods": goods
    });

  },
  handleCloseGoodsDetail: function(e) {
    this.setData({
      "showGoods": null
    });
  },
  selectedSpec: function(e) {
    this.setData({
      "selectedGoods": this.data.showGoods
    });
  },
  handleTabItemTap: function(e) {
    var that = this;
    var target = e.target;
    if (target) {
      var action = target.dataset.action;
      console.log(action);
      if ("selectSpec" == action) {
        var goods = that.data.showGoods;
        if (!goods.selectedSku) {
          goods.selectedSku = JSON.parse(goods.spec)[0];
          var ids = goods.selectedSku.ids.split(',');
          console.log(ids)
          if (ids.length > 1) {
            for (var i = 0; i < goods.specJsonArray.length; i++) {
              goods.specJsonArray[i].selectedId = ids[i]
            }
          }
        }
        that.setData({
          "selectedGoods": goods,
          usenewspecShow: true,
          isSelectSpec: true
        });

      } else if ("addFood" == action) {
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.addFood(goodsId, specIds);
      } else if ("delFood" == action) {
        var goodsId = e.target.dataset.id;
        var specIds = e.target.dataset.specids;
        that.delFood(goodsId, specIds);
      } else if ("showShoppingCart" == action) {
        if (that.data.sumInfo.totalMoney > 0) {
          that.setData({
            "showShoppingCart": true
          });
        }
      } else if ("submit" == action) {
        if (!this.checkUserInfo()) {
          return false;
        }
        // 判断是否在营业时间内
        let businessTime = that.data.shoperInfo.businessTime;
        if (businessTime && businessTime.length > 0) { //!that.data.tostore &&
          let nowTime = new Date();
          let isValidTime = false;
          for (let i = 0; i < businessTime.length; i++) {
            let busTime = businessTime[i];
            let startTime = new Date();
            startTime.setHours(Number(busTime.startTime.split(":")[0]));
            startTime.setMinutes(Number(busTime.startTime.split(":")[1]));

            let endTime = new Date();
            endTime.setHours(Number(busTime.endTime.split(":")[0]));
            endTime.setMinutes(Number(busTime.endTime.split(":")[1]));

            if (nowTime.getTime() >= startTime.getTime() &&
              nowTime.getTime() <= endTime.getTime()) {
              isValidTime = true;
              break;
            }
          }
          if (!isValidTime) {
            let busTimeStr = "";
            for (let i = 0; i < businessTime.length; i++) {
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

        that.setData({
          "isSubmitIng": true
        });
        if (that.data.tostore) {
          wx.setStorageSync('toStoreShoppingCart', that.data.takeOutShoppingCart);
          wx.navigateTo({
            url: '/pages/orderinfo/orderinfo?fromToStore=true&ckey=' + that.data.cartKey + '&mallSiteId=' + mallSiteId + '&memberCardId=' + that.data.memberCardId + '&memberCardName=' + that.data.memberCardName
          })
        } else {
          wx.setStorageSync('takeOutShoppingCart', that.data.takeOutShoppingCart);
          wx.navigateTo({
            url: '/pages/orderinfo/orderinfo?fromTakeout=true&ckey=' + that.data.cartKey + '&mallSiteId=' + mallSiteId + '&memberCardId=' + that.data.memberCardId + '&memberCardName=' + that.data.memberCardName
          })
        }
      }
    }
  },

  handleCatTap: function(e) {
    var that = this;
    var catId = e.currentTarget.dataset.id;
    that.findGoods(catId, true);
    that.setData({
      selectedCategory: that.findCategoryFromList(catId),
      selectedCatIndex: that.findCatIndexFromList(catId)
    });
  },
  findGoodsIndexFromList(catIndex, goodsId) {
    var that = this;
    var goodsList = that.data.categoryList[catIndex].mallGoodsList;
    if (goodsList && goodsList.length > 0) {
      for (var i = 0; i < goodsList.length; i++) {
        if (goodsId == goodsList[i].id) {
          return i;
        }
      }
    }
    return null
  },

  findGoodsPos(goodsId) {
    var catList = this.data.categoryList;
    if (catList && catList.length > 0) {
      for (var j = catList.length - 1; j >= 0; j--) {
        var goodsList = catList[j].mallGoodsList;
        if (goodsList && goodsList.length > 0) {
          for (var i = 0; i < goodsList.length; i++) {
            if (goodsId == goodsList[i].id) {
              return [j, i];
            }
          }
        }
      }
    }
    return null;
  },

  findCategoryFromList(catId) {
    var categoryList = this.data.categoryList;
    if (categoryList && categoryList.length > 0) {
      for (var i = 0; i < categoryList.length; i++) {
        if (catId == categoryList[i].id) {
          return categoryList[i];
        }
      }
    }
    return null;
  },

  findCatIndexFromList(catId) {
    var categoryList = this.data.categoryList;
    if (categoryList && categoryList.length > 0) {
      for (var i = 0; i < categoryList.length; i++) {
        if (catId == categoryList[i].id) {
          return i
        }
      }
    }
    return 0;
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
  findSelectedSpec: function(specId, groupId, goods) {
    var that = this;
    console.log(goods)
    var selectedIdArray = [];
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
  handleSkuModalTap(e) {
    console.log(e);

    var that = this;
    var target = e.target;
    var selectedGoods = that.data.showGoods;
    if (target) {
      var action = target.dataset.action;
      if ("closeModal" == action) {
        that.setData({
          "selectedGoods": null,
          usenewspecShow: false
        });
      } else if ("changeSku" == action) {
        var specId = target.dataset.id;
        var groupId = target.dataset.groupid;
        var sku = that.findSelectedSpec(specId, groupId, selectedGoods);
        that.setData({
          "selectedGoods.selectedSku": sku
        });
        that.setData({
          "selectedGoods.specJsonArray": selectedGoods.specJsonArray
        });
        var goodsPos = that.findGoodsPos(selectedGoods.id);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        that.setData({
          ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: selectedGoods
        });
      } else if ("addToCart" == action) {
        if (that.data.distance) {
          if (!that.data.tostore && that.data.distance > that.data.shoperInfo.distributionRange * 1000) {
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
      } else if ("removeFood" == action) {
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

  fetchJudgeData: function() {
    var vm = this;
    var start = vm.data.judgeList.length;
    wx.showLoading({
      title: "加载中",
    })
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/review/queryReviews',
      data: {
        cusmallToken: cusmallToken,
        mallSiteId: mallSiteId,
        "type": 2,
        start: start,
        limit: 10
      },
      header: {
        "content": "application/json"
      },
      success: function(res) {
        console.log(res.data);
        wx.hideLoading();
        if (res.data.ret == 0) {
          var judgeList = res.data.model.reviews;
          for (var i = 0; i < judgeList.length; i++) {
            // judgeList[i].createTime = util.formatTime(new Date(judgeList[i].createTime));
            judgeList[i].reviewTime = util.formatDate(new Date(judgeList[i].reviewTime));
          }
          vm.setData({
            "judgeList": vm.data.judgeList.concat(judgeList)
          });
          vm.setData({
            "judgeTotal": res.data.model.total
          });
        }
      }
    })
  },

  handleProductScrollToLower: function() {
    let that = this;
    var cat = that.findCategoryFromList(that.data.selectedCategory.id);
    if (cat.mallGoodsList.length < cat.total) {
      that.findGoods(cat.id, false);
    }
  },

  findGoods: function(categoryId, isReload) {
    var that = this;
    var cat = that.findCategoryFromList(categoryId);
    var catIndex = that.findCatIndexFromList(categoryId);
    if (cat.loading) {
      return false;
    }
    if (cat && cat.hasLoaded && cat.nomoreGoods) {
      return false;
    }
    var submitData = {
      cusmallToken: cusmallToken,
      mallsiteId: mallSiteId,
      goodsType: 2,
      start: 0,
      limit: 10
    };
    if (categoryId) {
      submitData.siteBarId = categoryId;
    }
    if (that.data.foodType) {
      submitData.foodType = that.data.foodType;
    }

    if (cat.mallGoodsList && cat.mallGoodsList.length) {
      submitData.start = cat.mallGoodsList.length;
    }

    if (cat) {
      cat.hasLoaded = true;
    }
    wx.showLoading({
      title: "加载中",
    })
    cat.loading = true;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          if (!cat.mallGoodsList) {
            cat.mallGoodsList = [];
          }

          var mallGoodsList = cat.mallGoodsList.concat(res.data.model.result);

          cat.total = res.data.model.total;

          for (let i = 0; i < mallGoodsList.length; i++) {
            var goods = mallGoodsList[i];
            if ((goods.foodType & Math.pow(2, 0)) != 0) {
              goods.tc = 1;
            }
            if ((goods.foodType & Math.pow(2, 1)) != 0) {
              goods.zq = 1;
            }
            if ((goods.foodType & Math.pow(2, 2)) != 0) {
              goods.ta = 1;
            }
            if (goods.usenewspec) {
              goods.specData = JSON.parse(goods.spec);
            }
            // 如果在所有分类中已存在该商品，则把商品信息(已添加的数量等)复制过去
            let allCatGoods = that.data.categoryList[0].mallGoodsList;
            if (allCatGoods && allCatGoods.length > 0) {
              for (let j = 0; j < allCatGoods.length; j++) {
                if (goods.id == allCatGoods[j].id) {
                  mallGoodsList[i] = allCatGoods[j];
                }
              }
            }
          }
          cat.mallGoodsList = mallGoodsList;
          if (res.data.model.total == 0) {
            cat.nomoreGoods = false;
          } else {
            if (cat.mallGoodsList.length >= res.data.model.total) {
              cat.nomoreGoods = true;
            } else {
              cat.nomoreGoods = false;
            }
          }
          cat.loading = false;
          that.setData({
            ["categoryList[" + catIndex + "]"]: cat,
            selectedCategory: cat
          });
          wx.hideLoading();
        }
      }
    })
  },

  findCategory: function(categoryId) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/siteBar/findSiteBar',
      data: {
        siteId: mallSiteId,
        start: 0,
        limit: 50,
        type: 2,
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var categoryList = [];
          categoryList.push({
            "id": "",
            "name": "全部"
          });
          categoryList = categoryList.concat(res.data.model.result);
          that.setData({
            categoryList: categoryList
          });

          that.setData({
            selectedCategory: categoryList[0]
          });
          that.findGoods(categoryList[0].id, true);

        }
      }
    })
  },
  handleCallShoper: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.shoperInfo.tel
    })
  },
  findShoperInfo: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/takeAway/find',
      data: {
        siteId: mallSiteId,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log(res);
        if (res.data.ret == 0) {
          var shoperInfo = res.data.model.takeAway;
          var businessCheck = res.data.model.takeAway.businessCheck;
          if (shoperInfo && shoperInfo.businessTime) {
            shoperInfo.businessTime = JSON.parse(shoperInfo.businessTime);
          }

          that.setData({
            shoperInfo: shoperInfo,
            businessCheck: businessCheck
          });
          var information = shoperInfo.information;
          if ((information & (Math.pow(2, 2))) == 0) {
            that.setData({
              eatTypeTipsShow: true
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
                else{
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
                  wx.navigateBack({
                    delta: -1
                  });
                }
              }
            })
          }
        }
      }
    })
  },
  // 如果是到店商品，查找位置信息
  findTableInfo: function(id) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/takeAway/findTable',
      data: {
        id: id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log(res);
        if (res.data.ret == 0) {
          let tableInfo = res.data.model.table;
          wx.setStorageSync('toStoreTableInfo', tableInfo);
        }
      }
    })
  },
  getTakeOutGood: function(id, cb) {
    let that = this;
    cusmallToken = wx.getStorageSync('cusmallToken');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
      data: {
        goodsId: id,
        cusmallToken: cusmallToken,
        addFootprint: true,
        showCardPrice: true
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log(res);
        if (res.data.ret == 0) {
          let mCard = JSON.parse(JSON.stringify(that.data.takeOutShoppingCart));
          let goods = res.data.model.goods;
          let memberCardId = res.data.model.memberCardId || 0;
          let memberCardPrice = res.data.model.memberCardPrice || 0;
          let memberCardName = res.data.model.memberCardName || '';
          wx.setNavigationBarTitle({
            title: goods.name,
          })
          if ((goods.configSuperSwitch & (Math.pow(2, 0))) != 0 || !memberCardId) {
            that.setData({
              showCardPrice: false
            })

          }
          if (goods.usenewspec) {
            goods.specData = JSON.parse(goods.spec);
            // goods.spec = goods.spec;
            // goods.selectedSku = goods.spec[0];
          }
          if (goods.pics) {

            var gImgs = goods.pics.split(",");
          }
          that.setData({
            showGoods: goods,
            selectedGoods: goods,
            gImgs: gImgs,
            memberCardId: memberCardId,
            memberCardPrice: memberCardPrice,
            memberCardName: memberCardName,
            BuyGoodsMoney: goods.giftIntegral
          })
          for (let item of mCard) {
            if (item.id == res.data.model.goods.id) {
              that.setData({
                showGoods: item,
                selectedGoods: item,

              })
              break;
            }
          }

          var decorationData = JSON.parse(goods.decoration);
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

          cb && cb();
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
  fetchDistance: function() {
    var that = this;
    wx.getLocation({
      type: 'gcj02',
      success: function(res) {
        console.info("当前位置：", res);
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
          success: function(res) {
            console.info("当前位置与商家地址距离", res);
            if (res.data.ret == 0) {
              that.setData({
                distance: res.data.model.distance
              });
            }
          }
        })
      }
    })
  },
  getTakeOutPosterUrl: function() {
    let that = this;
    let cusmallToken = wx.getStorageSync('cusmallToken');
    if (that.data.takeOutPosterUrl) {
      wx.previewImage({
        current: that.data.takeOutPosterUrl, // 当前显示图片的http链接
        urls: [that.data.takeOutPosterUrl] // 需要预览的图片http链接列表
      });
      return;
    }
    wx.showLoading({
      title: '加载中',
    });
    var postData = {
      cusmallToken: cusmallToken,
      page: "pages/takeout/indexDetail",
      goodsId: that.data.showGoods.id,
      toType: that.data.toType,
      shopuid: app.globalData.shopuid,
      fromuid: app.globalData.fromuid
    };
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/genGoodsPoster',
      data: postData,
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        let data = res.data;
        wx.hideLoading();
        if (data && 0 == data.ret && data.model.qrcodeUrl) {
          that.setData({
            takeOutPosterUrl: data.model.qrcodeUrl
          });
          wx.previewImage({
            current: data.model.qrcodeUrl, // 当前显示图片的http链接
            urls: [data.model.qrcodeUrl] // 需要预览的图片http链接列表
          });
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var app = getApp();
    var that = this;
    var fromOpenId = options.fromOpenId;
    var shareType = options.shareType;
    var businessCheckFlag = options.businessCheck;



    that.setData({
      businessCheckFlag: businessCheckFlag
    })
    var mall
    var fromuid = options.fromuid;
    var shopuid = options.shopuid;
    var parse = JSON.parse;
    if (fromuid) {
      app.globalData.fromuid = fromuid
    }
    if (shopuid) {
      app.globalData.shopuid = shopuid
    }
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = options.mallSiteId || wx.getStorageSync('mallSiteId');
    mallSite = wx.getStorageSync('mallSite');
    wx.showShareMenu({
      withShareTicket: false
    });

    that.data.options=options;
    app.getUserInfo(this, options, function(userInfo, res) {
      that.findCategory();
      that.findShoperInfo();
      //util.afterPageLoad(this);
      // 获取当前位置
      that.fetchDistance();
      /* 积分设置 */
      that.getIntegrate();
      that.findConfig();
      // console.log(that.data.businessCheck)


      //开始处理分销
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
      if (options.type == "tostore") {
        that.setData({
          tostore: true
        })
      }


      if (options.scene) { //如果是qrcode进来则绑定
        that.bindPromoterByQR(options.scene)
      }


      if (options.scene) { //海报 -- 扫码进入
        that.sceneToJson(options.scene, function(data) {
          var sceneObj = data.model.scene;
          // if ("FX" == shareType) {
          //   that.bindPromoter(sceneObj.fromOpenId);
          // }
          if (sceneObj.fromuid != sceneObj.shopuid) {
            app.globalData.shopuid = sceneObj.shopuid;
            app.globalData.fromuid = sceneObj.fromuid;
            that.data.app.globalData.shopuid = sceneObj.shopuid;
            that.data.app.globalData.fromuid = sceneObj.fromuid;
            that.setData({
              isMainShop: false
            });
          } else {
            app.globalData.shopuid = "";
            app.globalData.fromuid = "";
            that.data.app.globalData.shopuid = "";
            that.data.app.globalData.fromuid = "";
            that.setData({
              isMainShop: true
            });
          }

          that.getTakeOutGood(sceneObj.goodsId);
          if (sceneObj.goodsId) {
            that.setData({
              goodsId: sceneObj.goodsId
            })
            that.getTrackList();
          }
          var toType = sceneObj.toType || "ta";
          //本地缓存购物车
          that.initLocalCart(toType);
          // 设置商品 类型 到店 or 外卖 商品
          that.setGoodsType(toType);

        });
      } else { //普通 点击进入
        // 处理多店铺分店UID
        that.setData({
          isMainShop: !app.globalData.shopuid //是否是主店
        });
        let goodsId = options.goodsId || options.id || "";

        that.setData({
          goodsId: goodsId
        })
        that.getTrackList();

        that.getTakeOutGood(goodsId);

        //初始化本地缓存购物车 tostore || ta
        that.initLocalCart(options.type);

        // 设置商品 类型 到店 or 外卖 商品
        that.setGoodsType(options.type)

      }

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
    if (mallSite.firstOrderDiscount){
      let firstOrderDiscount = JSON.parse(mallSite.firstOrderDiscount);
      firstOrderDiscount.reduceMoney = (firstOrderDiscount.reduceMoney / 100).toFixed(2);
      that.setData({
        firstOrderDiscount: firstOrderDiscount
      })
    }

  },
  initLocalCart(gType) {
    /**
     * 初始化本地缓存购物车
     */
    var mShopCart;
    var that = this;
    if (app.globalData.shopuid && app.globalData.fromuid && app.globalData.shopuid != app.globalData.fromuid) { //子店购物车
      mShopCart = wx.getStorageSync(gType + "c" + app.globalData.shopuid + app.globalData.fromuid) || {};
      that.setData({
        cartKey: gType + "c" + app.globalData.shopuid + app.globalData.fromuid
      });
    } else {
      mShopCart = wx.getStorageSync(gType + "cMain") || {};
      that.setData({
        cartKey: gType + "cMain"
      });
    }

    that.setData({
      takeOutShoppingCart: mShopCart.takeOutShoppingCart || [],
      sumInfo: mShopCart.sumInfo,
      toType: gType
    })
    /**
     * 初始化本地缓存购物车
     */
  },
  setGoodsType(gType) { // 设置商品 类型 到店 or 外卖 商品
    var that = this;
    if (gType && gType == "tostore") {
      that.setData({
        tostore: true
      })
      that.setData({
        foodType: 3
      });
    }
    if (gType && gType == "ta") {
      that.setData({
        foodType: 4
      });
    }
  },
  //获取足迹数据
  getTrackList: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/footprint/find',
      data: {
        cusmallToken: cusmallToken,
        shopUid: mallSite.uid || "",
        goodsType: 2,
        start: 0,
        limit: 10,
        goodsName: "",
        goodsIdNot: that.data.goodsId || ""


      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
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
  fetchData: function() {

  },
  fetchCount: function() {

  },
  closeOpeningModal: function() {
    this.setData({
      showOpeningModal: false
    })
  },
  toIdex() {
    var ctx = this;
    if (ctx.data.app.globalData.shopuid != ctx.data.app.globalData.fromuid) {

      wx.redirectTo({
        url: '/pages/index/index?shopuid=' + ctx.data.app.globalData.shopuid + "&=fromuid=" + ctx.data.app.globalData.fromuid,
      })
    } else {
      wx.redirectTo({
        url: '/pages/index/index',
      })
    }
  },
  //prevTrack
  prevTrack: function() {
    let that = this;
    that.setData({
      currentIndex: that.data.currentIndex - 1,
      step: -(that.data.currentIndex - 1) * 45
    })
  },
  //nextTrack
  nextTrack: function() {
    let that = this;
    that.setData({
      currentIndex: that.data.currentIndex + 1,
      step: -(that.data.currentIndex + 1) * 45
    })
  },

  // show modal

  showModel: function() {
    var that = this;
    that.setData({
      showTrack: false
    })
  },

  //点击满减箭头事件
  changeOverReduce: function() {
    var that = this;
    that.setData({
      ['showOverReduceDetail']: !that.data.showOverReduceDetail,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    var that = this

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    let that = this;
    that.setData({
      "isSubmitIng": false
    });
    if (that.data.bgMusic && that.data.playBgMusic) {
      that.audioCtx.play();
    }
    if (cusmallToken) {
      that.getTrackList();
    }
    that.setData({
      currentIndex: 0, //当前索引
      step: 0,
    })
    //当下单完毕的时候 返回页面 清空购物车数据
    if (!that.data.isFirstShowPage) {
      var mShopCart = wx.getStorageSync(that.data.cartKey);
      if (mShopCart.takeOutShoppingCart && 0 == mShopCart.takeOutShoppingCart.length) {
        var goods = that.data.showGoods;
        goods.selectedNum = 0;
        if (goods.usenewspec) {
          for (let item of goods.specData) {
            item.selectedNum = 0;
          }
        }
        that.setData({
          showGoods: goods,
          selectedGoods: null,
          "showShoppingCart": false,
          takeOutShoppingCart: [],
          sumInfo: {
            totalMoney: 0,
            totalCount: 0,
          }
        });
      }

    } else {
      that.setData({
        isFirstShowPage: false
      })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    if (this.audioCtx) {
      this.audioCtx.pause();
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    // if (app.globalData.shopuid) {
    //   app.globalData.shopuid = null;
    //   app.globalData.fromuid = null;
    //   // 从子店铺首页切换回主店铺首页时需要重新获取mallSite
    //   app.globalData.needReloadIndexPage = true;
    // }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
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
   * 评论页面上拉触底事件的处理函数
   */
  handleJudgeScrollToBottom: function() {
    var that = this;
    if (that.data.panelTab.selectedId == 1) {
      if (that.data.judgeList.length < that.data.judgeTotal) {
        that.fetchJudgeData();
      }
    }
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function() {
    let ctx = this;
    let path = '/pages/takeout/indexDetail?goodsId=' + ctx.data.goodsId + "&type=" + ctx.data.toType + "&businessCheckFlag=" + ctx.data.businessCheck;
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : ""
    if (app.globalData.shopuid && app.globalData.fromuid) {
      path += "&shopuid=" + app.globalData.shopuid + "&fromuid=" + app.globalData.fromuid;
    }
    if (mallSiteId){
      path += "&mallSiteId=" + mallSiteId;
    }
    if (app.globalData.isDistributor && app.globalData.isOpenDistribution) {
      path += "&fromOpenId=" + app.globalData.myOpenid + "&shareType=FX";
    }
    console.log(path)
    let shareObj = {
      title: ctx.data.showGoods.name,
      path: path,
      imageUrl: imageUrl,
      success: function(res) {
        // 成功
      },
      fail: function(res) {
        // 失败
      }
    };

    return shareObj;
  }
}));
