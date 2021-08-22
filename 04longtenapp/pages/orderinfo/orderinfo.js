// orderinfo.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var CouponHandle = require("../template/couponhandle.js");
var DineWayHandle = require("../template/dineWayHandle.js");
var cardHandle = require("../template/cardlist.js");
var giftcardHandle = require("../template/giftcardlist.js");
var expTimeHandle = require("../template/expectTime.js");
var baseHandle = require("../template/baseHandle.js");
var commHandle = require("../template/commHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSite = wx.getStorageSync("mallSite");
var areaId = wx.getStorageSync("areaId");
var Switch = require('../../youzan/dist/switch/index.js');

const date = new Date();
const years = [];
const months = [];
const days = [];
const hours = [];
const minutes = [];
//获取年
for (let i = date.getFullYear(); i <= date.getFullYear() + 15; i++) {
  years.push("" + i);
}
//获取月份
for (let i = 1; i <= 12; i++) {
  if (i < 10) {
    i = "0" + i;
  }
  months.push("" + i);
}
//获取日期
for (let i = 1; i <= 31; i++) {
  if (i < 10) {
    i = "0" + i;
  }
  days.push("" + i);
}
//获取小时
for (let i = 0; i < 24; i++) {
  if (i < 10) {
    i = "0" + i;
  }
  hours.push("" + i);
}
//获取分钟
for (let i = 0; i < 60; i++) {
  if (i < 10) {
    i = "0" + i;
  }
  minutes.push("" + i);
}
Page(Object.assign({}, commHandle, baseHandle, expTimeHandle, giftcardHandle, CouponHandle, cardHandle, DineWayHandle, Switch, {
  handleZanSwitchChange({
    componentId,
    checked
  }) {
    let that = this;
    // componentId 即为在模板中传入的 componentId
    // 用于在一个页面上使用多个 switch 时，进行区分
    // checked 表示 switch 的选中状态

    if ("switch1" == componentId) {

      if (checked) {
        this.setData({
          enableDepositSW: true
        });
        this.setData({
          enableDepositChe: true
        });
        this.multInit()
      } else {
        this.setData({
          enableDepositSW: false
        });
        this.setData({
          enableDepositChe: false
        });
        this.multInit();
      }
    } else if ("switch2" == componentId) {
      if (checked) {
        this.setData({
          enablePointsSW: true
        });
        this.setData({
          enablePointsChe: true
        });
        this.multInit()
      } else {
        this.setData({
          enablePointsSW: false
        });
        this.setData({
          enablePointsChe: false
        });
        this.multInit();
      }
    }
  }
}, {

  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    app: app,
    time: '请选择自取时间',
    multiArray: [years, months, days, hours, minutes],
    multiIndex: [0, date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes() + 30],
    choose_year: '',
    mallSiteTpl: "",
    openToShop: false,
    ecWayType: 1,
    toShopName: "",
    toShopTel: "",
    addressTitle: "收货地址：",
    orderId: null,
    specId: "",
    orderData: null,
    btnLoading: true,
    fromShopingCart: false,
    fromToStore: false,
    distributionRangeChecked: true,
    cartIds: "",
    goodsList: [],
    addressInfo: null,
    orderStatus: "",
    tel: "",
    areaId: "",
    inputContent: {
      remark: ""
    },
    totalPrice: 0,
    allPrice: 0,
    deliveryPrice: 0,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    goodsCount: 0,
    cardList: [],
    giftcardList: [],
    couponList: [],
    preferenceCodeList: [],
    showCouponList: false,
    showCardList: false,
    showGiftCardList: false,
    showExpTime: false,
    selectedExpTime: 0,
    todayWeek: "",
    orderType: "",
    prepareOrderVo: {},
    enableDepositItemValue: true,
    enableDepositSW: false,
    enableDeposit: 0,
    enableDepositChe: false,
    enablePointsItemValue: true,
    enablePointsSW: false,
    enablePoints: 0,
    pointsToMoney: 0,
    selectedDineWay: 0,
    showDineWayList: false,
    enablePointsChe: false,
    discountCount: 0,
    calcFinPrice: 0,
    selDiscount: 0,
    switchEquity: '', //满包邮开关
    goodsCounts: '', //满x件包邮
    goodsPrices: '', //满x元包邮
    showGoodsCount: false,
    showGoodsPrice: false,
    takeAway: null,
    goodsType: '',
    isIntegralGoods: false,
    verType: "order",
    uploadImgList: [], //补充信息图片
    isExtra: false,
    isCollect: false,
    extraItem: [],
    suppleInfo: [], //新数据集
    imgObj: {},
    orderDeInf: [],
    radioIdx: [],
    selectIdx: [],
    /*inputText:[],*/
    refundMoney: "",
    refundType: "",
    accountPackagePrivilege: {},
    getSelfTime: null, //到店自提时间
    getSelfTimeTxt: "",
    showOverReduce: false, //满减配置
    overReduceType: 0,
    overReduceRule: {},
    showOverReduceDetail: false,
    preShowOverReduce: false, //预下单返回满减
    preOverReduceMoney: "",
    address: "请选择自提点",
    selfAddressName: "",
    selfAddress: "",
    selfId: "",
    showInput: false,
    showApplyRefund: false,
    preferenceCode: "", //优惠码,
    preferenceCodeId: "",
    firstFlag: true,
    couponFlag: false,
    limit: 10,
    total: 0,
    scrollTop: 0,
    showRemarkInput:true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (options.virtual == "true") {
      this.setData({
        VirtualPage: true
      })
    }
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = options.mallSiteId || wx.getStorageSync('mallSiteId');
    mallSite = wx.getStorageSync("mallSite");
    //console.log(this.data.ddtsTel+"!!!!!!!!!!!!")

    //顶部Tab项显示
    if (mallSite.enableExpressDistribution && mallSite.getSelf) {
      this.setData({
        openToShop: true
      })
    }
    var parse = JSON.parse;
    wx.hideShareMenu();
    var pageTitle = "订单详情";

    this.setData({
      id: options.id,
      takeoutCartKey: options.ckey || "",
      choose_year: this.data.multiArray[0][0],
      specId: options.specId,
      goodsCount: options.goodsCount,
      orderId: options.orderid,
      selfId: options.addressId
    })

    this.setData({
      switchEquity: parse(mallSite.globalConfig).switchEquity,
      goodsCounts: parse(mallSite.globalConfig).goodsCount,
      goodsPrices: parse(mallSite.globalConfig).goodsPrice,
      mallSiteTpl: mallSite.tplType,
    });

    // 开关判断
    var switchA = parse(mallSite.globalConfig).switchEquity;
    if (((switchA & Math.pow(2, 2)) != 0) && parse(mallSite.globalConfig).goodsCount > 0) {
      this.setData({
        showGoodsCount: true
      });
    } else {
      this.setData({
        showGoodsCount: false
      });
    }
    if (((switchA & Math.pow(2, 3)) != 0) && parse(mallSite.globalConfig).goodsPrice > 0) {
      this.setData({
        showGoodsPrice: true
      });
    } else {
      this.setData({
        showGoodsPrice: false
      });
    };
    if (options.ecWayType == "3") {
      this.setData({
        ecWayType: 3
      })
    }
    if (options.fromShopingCart) {
      this.setData({
        fromShopingCart: true
      });
      this.setData({
        cartIds: options.cartIds
      });
      pageTitle = "提交订单";
    }
    if (options.memberCardId && options.memberCardId != '0') {
      this.setData({

        ['selectedCard.id']: options.memberCardId,
        ['selectedCard.cname']: options.memberCardName,

      })
    }
    if (options.orderid) {
      this.setData({
        orderid: options.orderid
      })
      this.fetchOrderData(this.afterGoodsLoaded);
    } else if (options.fromShopingCart) {
      this.fetchShoppingCartData(this.afterGoodsLoaded);
      // this.fetchAddressData();
    } else if (options.fromTakeout) {
      this.setData({
        fromTakeout: true,
        selectedDineWay: 3
      }, );
      this.fetchTakeOutShoppingCartData(this.afterGoodsLoaded);
      this.findShoperInfo();
      // this.fetchAddressData();
    } else if (options.fromToStore) {
      this.setData({
        fromToStore: true,
        selectedDineWay: 1
      });
      this.fetchTakeOutShoppingCartData(this.afterGoodsLoaded);
      this.findShoperInfo();
      let tableInfo = wx.getStorageSync('toStoreTableInfo');
      if (tableInfo) {
        this.setData({
          tableInfo: tableInfo,
          'inputContent.foodSiteName': tableInfo.name
        })
      }
      // this.fetchAddressData();
    } else {
      pageTitle = "提交订单";
      this.fetchData(this.afterGoodsLoaded);
      // this.fetchAddressData();
    }
    wx.setNavigationBarTitle({
      title: pageTitle
    })
    util.afterPageLoad(this);

    this.getWeek();
    // this.multInit();

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
          this.setData({
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
      this.setData({
        firstOrderDiscount: firstOrderDiscount
      })
    }

  },
  bindDateChange(e) {
    this.setData({
      date: e.detail.value
    })
  },

  bindTimeChange(e) {
    this.setData({
      time: e.detail.value
    })
  },
  //优惠码
  changeToCode: function(e) {
    let code = e.detail.value;
    console.log(code)
    this.setData({
      preferenceCode: code
    })

  },
  //优惠码兑换
  convert: function() {
    this.setData({
      couponFlag: true,
      limit: 10,
      scrollTop: 0,
      total: 0
    })

    //console.log('1')
    var that = this;
    //console.log(that.data.preferenceCode)
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/useDiscountCode',
      data: {
        cusmallToken: cusmallToken,
        discountCode: that.data.preferenceCode || "",
        shopUid: mallSite.uid || "",
        start: 0,
        limit: that.data.limit || 10
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var data = res.data;
          that.setData({
            preferenceCodeList: data.model.result,
            total: data.model.total
          })
          wx.hideLoading();

        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取优惠码异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  handAddImageMore: function(e) {
    let that = this;
    let idx = e.currentTarget.dataset.id;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function(res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths, idx);
      }
    })
  },
  handleAddImage: function(e) {
    let that = this;
    let idx = e.currentTarget.dataset.id;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function(res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths, idx);
      }
    })
  },

  chooseLocation: function(e) {
    var that = this;
    wx.chooseLocation({
      success: function(res) {
        that.setData({
          "chooseLocation": res
        })
        that.fetchDistance();
      }
    })
  },
  //获取时间日期
  bindMultiPickerChange: function(e) {
    // console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      multiIndex: e.detail.value
    })
    const index = this.data.multiIndex;
    const year = this.data.multiArray[0][index[0]];
    const month = this.data.multiArray[1][index[1]];
    const day = this.data.multiArray[2][index[2]];
    const hour = this.data.multiArray[3][index[3]];
    const minute = this.data.multiArray[4][index[4]];
    // console.log(`${year}-${month}-${day}-${hour}-${minute}`);
    this.setData({
      time: year + '-' + month + '-' + day + ' ' + hour + ':' + minute
    })
    // console.log(this.data.time);
  },
  //监听picker的滚动事件
  bindMultiPickerColumnChange: function(e) {
    //获取年份
    if (e.detail.column == 0) {
      let choose_year = this.data.multiArray[e.detail.column][e.detail.value];
      console.log(choose_year);
      this.setData({
        choose_year
      })
    }
    //console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    if (e.detail.column == 1) {
      let num = parseInt(this.data.multiArray[e.detail.column][e.detail.value]);
      let temp = [];
      if (num == 1 || num == 3 || num == 5 || num == 7 || num == 8 || num == 10 || num == 12) { //判断31天的月份
        for (let i = 1; i <= 31; i++) {
          if (i < 10) {
            i = "0" + i;
          }
          temp.push("" + i);
        }
        this.setData({
          ['multiArray[2]']: temp
        });
      } else if (num == 4 || num == 6 || num == 9 || num == 11) { //判断30天的月份
        for (let i = 1; i <= 30; i++) {
          if (i < 10) {
            i = "0" + i;
          }
          temp.push("" + i);
        }
        this.setData({
          ['multiArray[2]']: temp
        });
      } else if (num == 2) { //判断2月份天数
        let year = parseInt(this.data.choose_year);
        console.log(year);
        if (((year % 400 == 0) || (year % 100 != 0)) && (year % 4 == 0)) {
          for (let i = 1; i <= 29; i++) {
            if (i < 10) {
              i = "0" + i;
            }
            temp.push("" + i);
          }
          this.setData({
            ['multiArray[2]']: temp
          });
        } else {
          for (let i = 1; i <= 28; i++) {
            if (i < 10) {
              i = "0" + i;
            }
            temp.push("" + i);
          }
          this.setData({
            ['multiArray[2]']: temp
          });
        }
      }
      console.log(this.data.multiArray[2]);
    }
    var data = {
      multiArray: this.data.multiArray,
      multiIndex: this.data.multiIndex
    };
    data.multiIndex[e.detail.column] = e.detail.value;
    this.setData(data);
  },
  fetchDistance: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/takeAway/getDistance',
      data: {
        siteId: mallSiteId,
        lat1: that.data.chooseLocation.latitude,
        lng1: that.data.chooseLocation.longitude
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.info("当前位置与商家地址距离", res);
        if (!that.data.shoperInfo) {
          wx.showModal({
            title: '提示',
            content: '未获取商家地址，无法计算配送距离',
            showCancel: false
          })
          return;
        }
        if (res.data.ret == 0) {
          that.setData({
            distance: res.data.model.distance
          });
          if (that.data.distance > that.data.shoperInfo.distributionRange * 1000) {
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: "对不起，您当前位置不在配送范围内"
            })
            that.setData({
              distributionRangeCheck: false
            })
            return false;
          } else {
            that.setData({
              distributionRangeCheck: true
            })
          }
        }
      }
    })
  },
  upload: function(page, path, idx) {
    let vm = this;
    var imgObj = {};
    wx.showToast({
        icon: "loading",
        title: "正在上传"
      }),
      wx.uploadFile({
        url: cf.config.pageDomain + '/mobile/common/imgupload?cusmallToken=' + cusmallToken,
        filePath: path[0],
        name: 'file',
        riskCheckType: 1,
        header: {
          "Content-Type": "multipart/form-data"
        },
        formData: {
          //和服务器约定的token, 一般也可以放在header中
          cusmallToken: cusmallToken,
        },
        success: function(res) {
          console.log(res);
          if (res.statusCode != 200) {
            wx.showModal({
              title: '提示',
              content: '上传失败',
              showCancel: false
            })
            return;
          }
          let data = JSON.parse(res.data);
          let uploadImgList = vm.data.uploadImgList;
          uploadImgList[idx] = "";
          uploadImgList[idx] = data.fileName;
          imgObj["image"] = uploadImgList[idx];
          imgObj["name"] = vm.data.extraItem[idx].value;
          imgObj["value"] = "";
          imgObj["type"] = vm.data.extraItem[idx].type;
          if (typeof vm.data.extraItem[idx].sels == "undefined") {
            vm.data.extraItem[idx].sels == []
          } else {
            imgObj["sels"] = vm.data.extraItem[idx].sels;
          }
          vm.data.suppleInfo[idx] = imgObj;
          vm.setData({
            uploadImgList: uploadImgList
          });
        },
        fail: function(e) {
          console.log(e);
          wx.showModal({
            title: '提示',
            content: '上传失败',
            showCancel: false
          })
        },
        complete: function() {
          wx.hideToast(); //隐藏Toast
        }
      })
  },
  // 更新数据集
  bindInputOrder: function(e) {
    var vm = this;
    var orderObj = {
      name: '',
      image: '',
      type: '',
      sels: []
    };
    let id = e.currentTarget.dataset.id;
    let selIdx = [];

    orderObj["value"] = e.detail.value;
    if ("radio" == vm.data.extraItem[id].type) {
      selIdx = vm.data.radioIdx;
      selIdx[id] = e.detail.value;
      vm.setData({
        radioIdx: selIdx
      });
    } else if ("select" == vm.data.extraItem[id].type) {
      selIdx[id] = vm.data.selectIdx[id] == undefined ? [] : vm.data.selectIdx[id];
      selIdx[id].push(e.detail.value);
      vm.setData({
        selectIdx: selIdx
      });
      orderObj["value"] = selIdx[id].toString();
    }
    orderObj["name"] = vm.data.extraItem[id].value;
    orderObj["type"] = vm.data.extraItem[id].type;
    orderObj['sels'] = vm.data.extraItem[id].sels;
    vm.data.suppleInfo[id] = orderObj;
  },
  toOrderInfo: function() {
    var vm = this;
    wx.navigateTo({
      url: './orderinfosupple?orderInfo=' + JSON.stringify(vm.data.orderDeInf),
    })
  },
  bindChange: function(e) {
    this.data.inputContent[e.currentTarget.id] = e.detail.value
  },
  afterGoodsLoaded: function() {
    var that = this;
    if (!that.data.orderData) {
      that.multInit();
    }
  },
  multInit: function() {
    let that = this;
    let areaId = wx.getStorageSync('addrId') || '';
    var submitData = {
      cusmallToken: cusmallToken,
      cartIds: that.data.cartIds,
      siteId: mallSiteId,
      discountId: that.data.preferenceCodeId || "",
      goodsList: JSON.stringify(that.data.goodsList),
      fromUid: app.globalData.fromuid || "",
      shopUid: app.globalData.shopuid || "",
      areaId: areaId,
      userGiftCard: that.data.selectedGiftCard ? true : false,
      giftCardRecordId: that.data.selectedGiftCard ? that.data.selectedGiftCard.id : "",
      mcId: that.data.selectedCard ? that.data.selectedCard.id : "",
      couponRecordId: that.data.selectedCoupon && that.data.selectedCoupon.id ? that.data.selectedCoupon.id : "",
      userIntegral: that.data.enablePointsSW,
      userDepositItemValue: that.data.enableDepositSW,
      foodType: that.data.selectedDineWay
    };
    if (3 == that.data.ecWayType) {
      submitData.wayType = 3;
    }
    if (!that.data.fromToStore) {

      submitData.foodType = 3;
    }
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/order/prepareOrder",
      method: "POST",
      data: submitData,
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function(res) {
        let data = res.data;
        console.log('预下单');
        console.log(data);
        if (data && 0 == data.ret) {
          if (data.model.takeAway) { //外卖选择时间
            that.calcTime(data)
          }
          that.setData({
            consumeGiftIntegral: data.model.prepareOrderVo.orderSign.consumeGiftIntegral,
            goodsGiftIntegral: data.model.prepareOrderVo.orderSign.goodsGiftIntegral,
            isExtra: data.model.prepareOrderVo.orderSign.isExtra,
            extraItem: JSON.parse(data.model.prepareOrderVo.orderSign.extraItem)
          });
          let prepareOrderVo = data.model.prepareOrderVo;
          that.setData({
            goodsType: prepareOrderVo.goodsList[0].goodsType,
            prepareOrderVo: prepareOrderVo,
            showRemarkInput: data.model.showRemarkInput || data.model.showRemarkInput == null ? true : false
          })
          //判断显示快递配送还是到店自提,ecWayType默认为快递配送1
          if (!mallSite.enableExpressDistribution && mallSite.getSelf && that.data.goodsType == 1) {
            that.setData({
              ecWayType: 3
            });
          }
          if (prepareOrderVo.orderSign.orderType == 1) {
            that.setData({
              isCollect: mallSite.isDeliveryToStore
            });
          }
          let isVirtual = prepareOrderVo.goodsList.some(function(item) {
            return (item.configSuperSwitch & Math.pow(2, 1)) != 0
          });

          /* 全部为虚拟商品 */
          let isVirtualGoods=prepareOrderVo.goodsList.every(function(item) {
            return (item.configSuperSwitch & Math.pow(2, 1)) != 0;
          });
          if (isVirtualGoods) {
            that.setData({
              isVirtualGoods: true
            });
          }
          /* 补充信息显隐 */
          let enableExtraInfo = prepareOrderVo.goodsList.some(function(item) {
            return (item.configSuperSwitch & Math.pow(2, 6)) != 0
          });
          if (!enableExtraInfo) {
            that.setData({
              enableExtraInfo: true
            });
          }
          if (!isVirtual) {
            that.fetchAddressData(prepareOrderVo.userAddress);
          } else {
            that.fetchAddressData(null);
            let isVirtualTel = prepareOrderVo.goodsList.some(function(item) {
              return (item.configSuperSwitch & Math.pow(2, 2)) != 0
            });
            let isVirtualName = prepareOrderVo.goodsList.some(function(item) {
              return (item.configSuperSwitch & Math.pow(2, 3)) != 0
            });
            var VirtualInfo = {
              tel: false,
              name: false
            };
            if (isVirtualTel) {
              VirtualInfo.tel = true;
            }
            /*虚拟补充姓名字段*/
            if (isVirtualName) {
              VirtualInfo.name = true;
            }
            that.setData({
              goodsVirtual: VirtualInfo
            });
          }

          if (that.data.addressInfo != null) {
            that.calDeliveryFee(prepareOrderVo.orderSign, prepareOrderVo.canUseRecords);
          } else if (that.data.addressInfo != null && !that.data.orderId && that.data.goodsList.length > 0) {
            that.calDeliveryFee(prepareOrderVo.orderSign, prepareOrderVo.canUseRecords);
          } else {
            that.fetchCouponList(prepareOrderVo.canUseRecords);
            that.setData({
              btnLoading: false
            });
          }
          // 外卖包装费
          if (prepareOrderVo.orderSign.packingPrice && prepareOrderVo.orderSign.packingPrice > 0) {
            that.setData({
              "packingPrice": prepareOrderVo.orderSign.packingPrice
            });
          } else {
            that.setData({
              "packingPrice": false
            });
          }
          //预下单满减返回
          if (prepareOrderVo.orderSign.overReduceMoney) {
            that.setData({
              preShowOverReduce: true,
              preOverReduceMoney: (prepareOrderVo.orderSign.overReduceMoney / 100).toFixed(2)
            });
          }
          //预下单首单立减
          if (prepareOrderVo.orderSign.firstOrderDiscount) {
            that.setData({
              preFirstOrderDiscount: true,
              preFirstOrderMoney: (prepareOrderVo.orderSign.firstOrderDiscount / 100).toFixed(2)
            });
          }
          if (prepareOrderVo.memberCardList) {
            that.setData({
              cardList: prepareOrderVo.memberCardList || []
            });
          }
          if (prepareOrderVo.giftCardRecordList) {
            that.setData({
              giftcardList: prepareOrderVo.giftCardRecordList || []
            });
          }
          if (that.data.selectedMemberCard) {
            prepareOrderVo.memberCardList.forEach(function(item) {
              if (item.id == that.data.selectedMemberCard) {
                that.setData({
                  "selDiscount": JSON.parse(item.rights).discount || 0
                });
              }
            })
          }
          if (prepareOrderVo.orderSign.enableDepositItemValue > 0) { // 总的储值金prepareOrderVo.orderSign.enableDepositItemValu
            that.setData({
              enableDepositItemValue: false
            });
          }
          if (prepareOrderVo.orderSign.enableIntegral > 0) { // 总的积分
            that.setData({
              enablePointsItemValue: false
            });
          }

          that.setData({
            enableDeposit: prepareOrderVo.orderSign.userDeposit
          }); //实际用的储值金
          that.setData({
            enablePoints: prepareOrderVo.orderSign.userIntegral || 0
          }); //实际用的积分抵扣
          that.setData({
            pointsToMoney: prepareOrderVo.orderSign.integralToMoney || 0
          }); //实际用的积分抵扣

          that.setData({
            discountCount: prepareOrderVo.orderSign.discountCount
          });
          // let orderSign = prepareOrderVo.orderSign
          // that.calcFinPrice(orderSign.totalPrice, that.data.orderData, that.data.selectedCoupon, that.data.goodsList, that.data.enableDeposit, that.data.discountCount);
          that.setData({
            calcFinPrice: prepareOrderVo.orderSign.realPay
          });
          that.setData({
            accountPackagePrivilege: data.model.accountPackagePrivilege
          });
          if (that.data.selfId) {
            that.getSelfAddress(that.data.selfId);
          }
          //页面一进去时候获取手机号--暂时解决手机号回显问题

          if (that.data.firstFlag) {
            that.getPreviousOrder();
            that.setData({
              firstFlag: false
            })
          }
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg,
            showCancel: false,
            success(res) {
              if (res.confirm) {
                wx.navigateBack({
                  delta: 1
                });
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
            
          });
          that.setData({
            btnLoading: true
          });
        }
      },
      fail: function() {},
      complete: function() {
        wx.hideLoading();
      }
    });
  },
  fetchAddressData: function(addressInfo) {
    var that = this;
    that.setData({
      addressInfo: addressInfo
    });

    // var addressData = {};
    // addressData.clientName = "李聪平";
    // addressData.address = "深圳市南山区迈科龙大厦";
    // addressData.areaId = "100888";
    // addressData.tel = "15099912519";
    // that.setData({ addressInfo: addressData });
  },
  // 根据商品ID获取信息
  fetchData: function(cb) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
      data: {
        cusmallToken: cusmallToken,
        goodsId: that.data.id,
        showCardPrice: true,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          console.log(res.data);
          var goodsVirtual = null;
          var memberCardId = res.data.model.memberCardId;
          var memberCardName = res.data.model.memberCardName;
          if ((res.data.model.goods.configSuperSwitch & Math.pow(2, 1)) != 0) {
            goodsVirtual = {
              tel: false,
              name: false
            };
            if ((res.data.model.goods.configSuperSwitch & (Math.pow(2, 2))) != 0) {
              goodsVirtual.tel = true;
            }
            /*虚拟补充姓名字段*/
            if ((res.data.model.goods.configSuperSwitch & (Math.pow(2, 3))) != 0) {
              goodsVirtual.name = true;
            }
          }
          if (memberCardId) {
            that.setData({
              "selectedMemberCard": memberCardId,
              ['selectedCard.id']: memberCardId,
              ['selectedCard.cname']: memberCardName,

            })
          }
          that.setData({
            goodsType: res.data.model.goods.goodsType,
            isIntegralGoods: 5 == res.data.model.goods.goodsType ? true : false,
            goodsVirtual: goodsVirtual
          });
          var goodsData = res.data.model.goods;
          var goodsPrice = goodsData.price;
          var goodsItem = {
            "id": goodsData.id,
            "name": goodsData.name,
            "unit_name": goodsData.unitName,
            "cover": goodsData.goodsCover,
            "category": goodsData.category,
            "category2": goodsData.category2,
            "displaySpecOrCategory": goodsData.displaySpecOrCategory,
            "price": goodsPrice,
            "count": that.data.goodsCount,
            "total_price": that.data.goodsCount * goodsPrice,
            "code": goodsData.code
          }
          if (goodsData.usenewspec && that.data.specId) {
            var specList = JSON.parse(goodsData.spec);
            var spec = null;
            for (var i = 0; i < specList.length; i++) {
              if (specList[i].ids == that.data.specId) {
                spec = specList[i];
                break;
              }
            }
            goodsItem.price = spec.price;
            goodsPrice = spec.price;
            goodsItem.selectedSku = spec;
            goodsItem.spec = spec;
            goodsItem.total_price = goodsPrice * that.data.goodsCount;
          }
          that.data.goodsList.push(goodsItem);
          that.setData({
            totalPrice: goodsPrice * that.data.goodsCount
          });

          that.setData({
            goodsList: that.data.goodsList
          });
          wx.hideLoading();
          that.setData({
            btnLoading: false
          });
          cb && cb();
          that.getPreviousOrder();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品信息异常',
            showCancel: false,
            content: res.data.msg || "参数错误"
          })
        }
      },
      complete: function() {

      }
    })

  },
  // 从订单获取商品信息
  fetchOrderData: function(cb) {
    this.mallSiteFindConfig(mallSiteId); //查询物流配置
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getOrderDetail',
      data: {
        cusmallToken: cusmallToken,
        parId: that.data.orderId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var parOrder = res.data.model.parOrder;
          parOrder.extend = JSON.parse(parOrder.extend);
          if (parOrder.extend && parOrder.extend.validityStart) {
            let validityStart = new Date(parOrder.extend.validityStart).getTime();
            let nowTime = new Date().getTime();
            if (nowTime < validityStart) {
              parOrder.extend.payStatus = 1 //尾款待支付
            } else {
              parOrder.extend.payStatus = 2 //支付尾款
            }
            parOrder.extend.validityStart = util.formatTimeM(new Date(parOrder.extend.validityStart));
          }
          if(parOrder.orderDiscount){
            parOrder.giftCardDiscountMoney = JSON.parse(parOrder.orderDiscount).giftCardDiscountMoney;
          }
          util.processOrderData(parOrder);
          if (parOrder.foodType === 1 || parOrder.foodType === 2) {
            that.findShoperInfo();
          }
          that.setData({
            totalPrice: parOrder.totalPrice,
            goodsList: JSON.parse(parOrder.goodsList),
            orderData: parOrder,
            isIntegralGoods: 5 == parOrder.orderType ? true : false,
            goodsCount: parOrder.totalCount,
            addressInfo: {
              "userName": parOrder.clientName,
              "tel": parOrder.tel,
              "areaName": "",
              "address": parOrder.address,
            },
            toShopName: parOrder.clientName,
            toShopTel: parOrder.tel
          });
          var lastindex = parOrder.address.lastIndexOf("\)");
          parOrder.address = parOrder.address.substring(0, lastindex + 1);
          that.setData({
            address: parOrder.address
          })
          that.setData({
            orderStatus: util.getOrderStatus(parOrder)
          });
          if (parOrder.status == 1 || parOrder.status == 2 || parOrder.status == 3 || parOrder.status == 7 || parOrder.status == 8 || parOrder.status == 9 || parOrder.status == 10) {
            that.setData({
              statusIcon: 'wait-icon'
            });
          } else {
            that.setData({
              statusIcon: "ok-icon"
            });
          }
          that.setData({
            orderType: parOrder.orderType
          });
          that.setData({
            calcFinPrice: parOrder.actualPrice,
            orderDeInf: JSON.parse(parOrder.extraInfo)
          });
          if (3 == parOrder.wayType) {
            var lastindex = parOrder.address.lastIndexOf("\)");
            parOrder.address = parOrder.address.substring(0, lastindex + 1);
            that.setData({
              addressTitle: "自取地址："
            })
            that.setData({
              addressInfo: {
                "userName": parOrder.clientName,
                "tel": parOrder.tel,
                "areaName": "",
                "address": parOrder.address,
              }
            });
            that.setData({
              toShopName: parOrder.clientName,
              toShopTel: parOrder.tel
            })
          }
          console.log('orderDeInf', JSON.parse(parOrder.extraInfo));
          if (parOrder.orderType == 2 && (parOrder.foodType == 1 || parOrder.foodType == 2)) {
            that.setData({
              fromToStore: true
            });
          }
          // 外卖包装费
          if (parOrder.packingPrice && parOrder.packingPrice > 0) {
            that.setData({
              "packingPrice": parOrder.packingPrice
            });
          }
          that.setData({
            deliveryPrice: that.data.orderData.deliveryPrice
          });

          //退款金额
          if (2 == parOrder.refundType) {
            var refundDetail = JSON.parse(parOrder.refundDetail || "{}");
            that.setData({
              refundMoney: refundDetail.refund_actual + refundDetail.refund_deposit,
              refundType: "部分"
            });
          } else {
            that.setData({
              refundMoney: parOrder.actualPrice + parOrder.depositPrice,
              refundType: "全部"
            });
          }
          that.getApplyRefund(parOrder);
          wx.hideLoading();
          cb && cb();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取订单信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  // 获取优惠券信息
  fetchCouponList: function(canUseRecords) {
    var that = this;

    if (canUseRecords) {
      that.setData({
        couponList: canUseRecords
      });
      if (canUseRecords.length > 0) {
        // that.setData({ "selectedCoupon": canUseRecords[0] });
      }
    } else {
      wx.hideLoading();
      wx.showModal({
        title: '获取优惠券信息异常',
        showCancel: false,
        content: res.data.msg
      })
    }

  },
  // 从购物车获取商品信息
  fetchShoppingCartData: function(cb) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/shopping_cart/getByIds',
      data: {
        cusmallToken: cusmallToken,
        ids: that.data.cartIds
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          var cartList = res.data.model.list;
          that.data.goodsCount = 0;
          that.setData({
            goodsType: cartList[0].type
          })
          for (var i = 0; i < cartList.length; i++) {
            var cart = cartList[i];
            var goodsItem = {
              "id": cart.goodsId,
              "name": cart.name,
              "unit_name": cart.unitName,
              "cover": cart.cover,
              "category": cart.category,
              "category2": cart.category2,
              "displaySpecOrCategory": cart.displaySpecOrCategory,
              "price": cart.price,
              "count": cart.goodsCount,
              "total_price": cart.totalPrice,
              "code": cart.goodsCode
            };

            if (cart.spec) {
              goodsItem.selectedSku = JSON.parse(cart.spec);
              goodsItem.spec = JSON.parse(cart.spec);
              goodsItem.price = goodsItem.selectedSku.price;
            }
            that.data.goodsList.push(goodsItem);
            that.data.totalPrice += cart.totalPrice;
            that.data.goodsCount += cart.goodsCount;
          }
          that.setData({
            goodsCount: that.data.goodsCount
          });
          that.setData({
            totalPrice: that.data.totalPrice
          });
          that.setData({
            goodsList: that.data.goodsList
          });
          cb && cb();
          wx.hideLoading();
          that.getPreviousOrder();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取订单信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },

  findShoperInfo: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/takeAway/find',
      data: {
        siteId: mallSiteId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        console.log(res);
        if (res.data.ret == 0) {
          var shoperInfo = res.data.model.takeAway;
          var ddtsTel = res.data.model.takeAway.ddtsTel;
          if (shoperInfo && shoperInfo.businessTime) {
            shoperInfo.businessTime = JSON.parse(shoperInfo.businessTime);
          }
          that.setData({
            shoperInfo: shoperInfo,
            ddtsTel: ddtsTel,
          });
          that.setData({
            tableNumEnable: shoperInfo.tableNumEnable,
            distributionRangeChecked: shoperInfo.distributionRangeCheck
          })
          if ((parseInt(shoperInfo.information) & (Math.pow(2, 3))) != 0) {
            that.setData({
              waySelect: shoperInfo.customSignText
            });
          } else {
            that.setData({
              waySelect: '就餐方式'
            });
          }
          if ((parseInt(shoperInfo.information) & (Math.pow(2, 1))) != 0 && (that.data.selectedDineWay == 2)) {

            that.setData({
              switchTel: true
            });
          } else if (that.data.selectedDineWay == 1 && ddtsTel) {
            that.setData({
              switchTel: true
            });
          }
          if (shoperInfo.foodType & Math.pow(2, 0) != 0) {
            that.setData({
              "selectedDineWay": 1
            });
          } else if (shoperInfo.foodType & Math.pow(2, 1) != 0) {
            that.setData({
              "selectedDineWay": 2
            });
          } else {
            that.setData({
              "selectedDineWay": 0
            });
          }

        }
      }
    })
  },

  fetchTakeOutShoppingCartData: function(cb) {
    var that = this;
    var goodsList = wx.getStorageSync('takeOutShoppingCart');
    if (that.data.fromToStore) {
      goodsList = wx.getStorageSync('toStoreShoppingCart');
    }
    that.data.goodsCount = 0;
    for (var i = 0; i < goodsList.length; i++) {
      var goods = goodsList[i];
      var item = {
        "id": goods.id,
        "name": goods.name,
        "unit_name": goods.unitName,
        "cover": goods.goodsCover,
        "category": goods.category,
        "category2": goods.category2,
        "displaySpecOrCategory": goods.displaySpecOrCategory,
        "price": goods.price,
        "count": goods.selectedNum,
        "total_price": goods.price * goods.selectedNum,
        "code": goods.code
      };
      if (goods.usenewspec) {
        for (var j = 0; j < goods.specData.length; j++) {
          var spec = goods.specData[j];
          if (spec.selectedNum > 0) {
            item = {
              "id": goods.id,
              "name": goods.name,
              "unit_name": goods.unitName,
              "cover": goods.goodsCover,
              "category": goods.category,
              "category2": goods.category2,
              "displaySpecOrCategory": goods.displaySpecOrCategory,
              "code": goods.code
            };
            item.selectedSku = spec;
            item.spec = spec;
            item.price = spec.price;
            item.count = spec.selectedNum;
            item.total_price = spec.price * spec.selectedNum;
            that.data.goodsList.push(item);
            that.data.totalPrice += item.total_price;
            that.data.goodsCount += item.count;
          }
        }
      } else {
        that.data.goodsList.push(item);
        that.data.totalPrice += item.total_price;
        that.data.goodsCount += item.count;
      }
      console.log(that.data.goodsCount);
    }
    that.setData({
      goodsCount: that.data.goodsCount
    });
    that.setData({
      totalPrice: that.data.totalPrice
    });
    that.setData({
      goodsList: that.data.goodsList
    });
    cb && cb();
  },

  getVirtualInfo: function(e) {
    if (e.currentTarget.id === "virtualTel") {
      this.data.virtualTel = e.detail.value
    } else if (e.currentTarget.id === "virtualName") {
      this.data.virtualName = e.detail.value
    }
  },
  onConfirmOrder: function(e) {
    var that = this;
    console.info("确认订单表单详情", e);
    console.log(this.data.goodsVirtual);
    var formId = e.detail.formId;
    var clientTel, clientName, clientAddress;
    let prepareOrderVo = that.data.prepareOrderVo;

    if (that.data.goodsVirtual) {
      if (that.data.goodsVirtual.tel && !this.data.virtualTel) {
        wx.showModal({
          showCancel: false,
          content: "请填写联系电话"
        });
        return false;
      } else if (that.data.goodsVirtual.tel && !util.phoneValidate(this.data.virtualTel)) {
        wx.showToast({
          title: '手机号不合法！',
          icon: 'none',
          duration: 1500
        })
        return false;
      } else if (that.data.goodsVirtual.name && !this.data.virtualName) {
        wx.showModal({
          showCancel: false,
          content: "请填写姓名"
        });
        return false;
      } else {
        clientAddress = '-';
        clientName = this.data.virtualName;
        clientTel = this.data.virtualTel;
      }
    } else {
      if (that.data.addressInfo == null && !that.data.fromToStore && that.data.ecWayType != 3) {
        wx.showModal({
          showCancel: false,
          content: "请填写收货地址"
        });
        return false;
      } else {
        clientAddress = prepareOrderVo.userAddress ? prepareOrderVo.userAddress.areaName + prepareOrderVo.userAddress.address : "";
        clientName = prepareOrderVo.userAddress ? prepareOrderVo.userAddress.userName : "";
        clientTel = prepareOrderVo.userAddress ? prepareOrderVo.userAddress.tel : "";
      }
    }

    if (that.data.fromTakeout && !that.data.fromToStore && that.data.distributionRangeChecked) {
      if (that.data.chooseLocation) {
        if (!that.data.distributionRangeCheck) {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: "对不起，您当前位置不在配送范围内"
          })
          return false;
        }
      } else {
        wx.showModal({
          showCancel: false,
          content: "请检测收货地址是否在配送范围"
        })
        return false;
      }
    }
    if (that.data.enableExtraInfo) {
      for (var i in that.data.extraItem) {
        if (that.data.extraItem[i].isRequire && that.data.suppleInfo.length == 0) {
          wx.showToast({
            title: '请填写完整信息'
          });
          return false;
        } else if (that.data.extraItem[i].isRequire && !that.data.suppleInfo[i]) {
          wx.showToast({
            title: '请填写完整信息'
          });
          return false;
        } else if (that.data.extraItem[i].isRequire && that.data.suppleInfo[i] && that.data.suppleInfo[i].type == "img") {
          if (!that.data.suppleInfo[i].image) {
            wx.showToast({
              title: '请填写完整信息'
            });
            return false;
          }
        }
      }
    }

    var submitData = {
      discountId: that.data.preferenceCodeId || "",
      cusmallToken: cusmallToken,
      orderSign: JSON.stringify(prepareOrderVo.orderSign),
      addOrderSign: prepareOrderVo.sign,
      address: clientAddress || '-',
      tel: clientTel || '',
      clientName: clientName || '',
      formId: formId,
      extraInfo: JSON.stringify(that.data.suppleInfo)
    };
    if (3 == that.data.ecWayType && !that.data.goodsVirtual) { //电商 到店自取 信息
      if ("请选择自提点" == that.data.address) {
        wx.showToast({
          icon: 'none',
          title: '请选择自提点'
        });
        return;
      }
      if ("" == that.data.toShopName) {
        wx.showToast({
          icon: 'none',
          title: '请填写取货人姓名'
        });
        return;
      }

      if ("" == that.data.toShopTel) {
        wx.showToast({
          icon: 'none',
          title: '请填写取货人手机'
        });
        return;
      }
      submitData.wayType = 3;
      submitData.clientName = that.data.toShopName;
      submitData.tel = that.data.toShopTel;
      submitData.address = that.data.selfAddress;
    }
    console.info("开始下单....");
    console.info("submitData: ");
    console.info(submitData);
    if (that.data.switchTel) {
      if (!that.data.inputContent.sntel) {
        wx.showModal({
          showCancel: false,
          content: "请填写手机号码"
        });
        return false;
      }
      if (!util.phoneValidate(that.data.inputContent.sntel)) {
        wx.showToast({
          title: '手机号不合法！',
          icon: 'none',
          duration: 1500
        })
        return false;
      }
      submitData.tel = that.data.inputContent.sntel;
    }
    if (that.data.inputContent.remark) {
      submitData.remark = that.data.inputContent.remark
    }
    if (that.data.fromToStore) {
      if (that.data.selectedDineWay == 0) {
        wx.showModal({
          showCancel: false,
          content: "请选择" + waySelect
        })
        return false;
      }
      submitData.foodType = that.data.selectedDineWay;
      if (that.data.tableInfo) {
        submitData.foodSiteName = that.data.tableInfo.name;
      }
      if (that.data.selectedDineWay == 1 && that.data.goodsType != 1 && that.data.shoperInfo.tableNumEnable) {
        if (!that.data.inputContent.foodSiteName && !that.data.tableInfo) {
          wx.showModal({
            showCancel: false,
            content: "请输入桌号"
          })
          return false;
        } else {
          submitData.foodSiteName = that.data.inputContent.foodSiteName;
        }
      }

    }
    if (that.data.fromTakeout) {
      submitData.bespeakTime = that.data.canSelectTimeTA && that.data.canSelectTimeTA[that.data.selectedExpTime].showTime; //送达时间
    }
    if (2 == that.data.selectedDineWay) {
      let nowtime = new Date().getTime();
      let qctime = new Date(that.data.time.replace(/-/g, '/')).getTime();
      if (qctime) {
        //取餐时间
        submitData.bespeakTime = that.data.time;
      }
      if (qctime < nowtime) {
        wx.showModal({
          title: '提示',
          content: '取餐时间不能早于当前时间',
        })
        return false;
      }
    }
    //到店自提时间校验
    // if (3 == that.data.ecWayType && that.data.getSelfTime){
    //   let getSelfTime = that.data.getSelfTime;
    //   var now=new Date();
    //   if (now.getHours() < parseInt(getSelfTime.startHour) || now.getHours() > parseInt(getSelfTime.endHour)){
    //     wx.showModal({
    //       showCancel: false,
    //       content: "现在不是商家到店自提的时间段，无法提交订单哦！"
    //     });
    //     return;
    //   }
    //   if (now.getHours() == parseInt(getSelfTime.startHour) && now.getMinutes() < parseInt(getSelfTime.startMin)){
    //     wx.showModal({
    //       showCancel: false,
    //       content: "现在不是商家到店自提的时间段，无法提交订单哦！"
    //     });
    //     return;
    //   }
    //   if (now.getHours() == parseInt(getSelfTime.endHour) && now.getMinutes() > parseInt(getSelfTime.endMin)) {
    //     wx.showModal({
    //       showCancel: false,
    //       content: "现在不是商家到店自提的时间段，无法提交订单哦！"
    //     });
    //     return;
    //   }
    // }

    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({
      btnLoading: true
    });
    //如果外卖店铺配置关闭了 手机号功能
    // if (!that.data.switchTel && 2 == that.data.prepareOrderVo.orderSign.orderType && !that.data.fromTakeout){
    //   submitData.tel=""
    // }
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
          name: 'order',
          msgcode: "1001"
        },
        {
          name: 'order',
          msgcode: "1002"
        },
        {
          name: 'order',
          msgcode: "1005"
        }
      ]),
      function(resp) {
        console.log(resp)
        wx.request({
          url: cf.config.pageDomain + '/applet/mobile/order/addNewOrder',
          data: submitData,
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          success: function(res) {
            console.info(res);
            that.setData({
              btnLoading: false
            });
            if (res.data.ret == 0) {
              wx.hideLoading();
              if (that.data.takeoutCartKey) {
                wx.setStorageSync(that.data.takeoutCartKey, { //下订单成功 清空外卖到店离线购物车
                  takeOutShoppingCart: [],
                  sumInfo: {
                    "totalMoney": 0,
                    "totalCount": 0
                  }
                })
              }
              wx.redirectTo({
                url: '/pages/orderpay/order_pay?id=' + res.data.model.parId + '&isVirtual=' + that.data.goodsVirtual
              })
            } else {
              wx.hideLoading();
              wx.showModal({
                title: '提交订单信息异常',
                showCancel: false,
                content: res.data.msg
              })
            }
          }
        })


      });


  },

  onBtnPay: function(e) {
    var that = this;
    wx.navigateTo({
      url: '/pages/orderpay/order_pay?id=' + that.data.orderId,
    })
  },

  onBtnCancel: function(e) {
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "您确定取消订单么？",
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中',
          });
          wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/cancelOrder',
            data: {
              cusmallToken: cusmallToken,
              parId: that.data.orderId,
              fromUid: app.globalData.fromuid || "",
              shopUid: app.globalData.shopuid || ""
            },
            header: {
              'content-type': 'application/json'
            },
            success: function(res) {
              wx.showToast({
                title: '成功取消订单',
                duration: 2500,
                complete: function() {

                }
              });
              setTimeout(function() {
                that.fetchOrderData();
              }, 2800);
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  onReturnOrder: function(e) {
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "您确定申请退款么？",
      success: function(res) {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/refund/refund?id=' + that.data.orderId + "&orderNum=" + that.data.orderData.orderNum + "&status=" + that.data.orderData.status,
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  onFinishOrder: function(e) {
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "确认收货后无法申请退款，确定要收货么？",
      success: function(res) {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中',
          });
          wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/confirm',
            data: {
              cusmallToken: cusmallToken,
              id: that.data.orderId
            },
            header: {
              'content-type': 'application/json'
            },
            success: function(res) {
              wx.showToast({
                title: '确认成功',
                duration: 2500,
                complete: function() {

                }
              });
              setTimeout(function() {
                that.fetchOrderData();
              }, 2800);
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  genGoodsListString: function() {
    var that = this;
    var goodsList = [];
    for (var i = 0; i < that.data.goodsList.length; i++) {
      var goodsInfo = that.data.goodsList[i];
      var item = {
        "id": goodsInfo.id,
        "name": goodsInfo.name,
        "unit_name": goodsInfo.unit_name,
        "cover": goodsInfo.cover,
        "category": goodsInfo.category,
        "category2": goodsInfo.category2,
        "displaySpecOrCategory": "",
        "price": goodsInfo.price,
        "count": goodsInfo.count,
        "total_price": goodsInfo.total_price
      };
      if (goodsInfo.selectedSku) {
        item.spec = goodsInfo.selectedSku;
        item.price = item.spec.price;
        item.total_price = item.count * item.spec.price;
      }
      goodsList.push(item);
    }
    return JSON.stringify(goodsList);
  },

  // 计算运费
  calDeliveryFee: function(orderSign, canUseRecords) {
    var that = this;
    if (that.data.orderData != null) {
      that.setData({
        deliveryPrice: that.data.orderData.deliveryPrice
      });
      that.setData({
        allPrice: Number(that.data.totalPrice) + Number(that.data.orderData.deliveryPrice)
      });
      that.setData({
        btnLoading: false
      });
      if (!that.data.orderData) {
        that.fetchCouponList(canUseRecords);
      }
    } else {

      var deliveryPrice = orderSign.deliveryPrice;
      that.setData({
        deliveryPrice: deliveryPrice
      });
      that.setData({
        allPrice: Number(orderSign.totalPrice) + Number(that.data.deliveryPrice)
      });
      that.setData({
        btnLoading: false
      });
      if (!that.data.orderData) {
        that.fetchCouponList(canUseRecords);
      }
    }

  },
  onSelfAddress: function() {
    var that = this;
    if (that.data.orderData == null) {
      var addressUrl = '/pages/selfAddress/selfAddress';
      if (that.data.orderData != null) {
        addressUrl += "?orderid=" + that.data.orderId;
      } else if (that.data.fromShopingCart) {
        addressUrl += "?fromShopingCart=true&cartIds=" + that.data.cartIds;
      } else if (that.data.fromTakeout) {
        addressUrl += "?fromTakeout=true";
      } else {
        addressUrl += "?id=" + that.data.id + "&goodsCount=" + that.data.goodsCount + (that.data.specId ? "&specId=" + that.data.specId : "");
      }
      wx.redirectTo({
        url: addressUrl,
      })
    }
  },
  onTapAddress: function() {
    var that = this;
    if (that.data.orderData == null) {
      var addressUrl = '/pages/uniquecenter/addresslist';
      if (that.data.orderData != null) {
        addressUrl += "?orderid=" + that.data.orderId;
      } else if (that.data.fromShopingCart) {
        addressUrl += "?fromShopingCart=true&cartIds=" + that.data.cartIds;
      } else if (that.data.fromTakeout) {
        addressUrl += "?fromTakeout=true";
      } else {
        addressUrl += "?id=" + that.data.id + "&goodsCount=" + that.data.goodsCount + (that.data.specId ? "&specId=" + that.data.specId : "");
      }
      wx.redirectTo({
        url: addressUrl,
      })
    }
  },
  getWeek: function() {
    let mDate = new Date();
    let mWeek = mDate.getDay();
    let mWeekTxt;
    switch (mWeek) {
      case 0:
        mWeekTxt = "周日";
        break;
      case 1:
        mWeekTxt = "周一";
        break;
      case 2:
        mWeekTxt = "周二";
        break;
      case 3:
        mWeekTxt = "周三";
        break;
      case 4:
        mWeekTxt = "周四";
        break;
      case 5:
        mWeekTxt = "周五";
        break;
      case 6:
        mWeekTxt = "周六";
        break;
    }

    this.setData({
      todayWeek: mWeekTxt
    })
  },
  toggleQrcodeModal: function() {
    var that = this;

    if (that.data.app.globalData.shopuid) {
      if (!that.data.appletScene) {
        that.fetchVerifyQrcodeInfo();
      } else {
        that.switchPasswordCheck();
      }
      return;
    }

    if (that.data.showQrcodePopup) {
      that.setData({
        showQrcodePopup: false
      })
    } else {
      that.setData({
        showQrcodePopup: true
      });
      if (!that.data.appletScene) {
        that.fetchVerifyQrcodeInfo();
      }
    }
  },
  // 获取核销qrcode信息
  fetchVerifyQrcodeInfo: function() {
    var that = this;
    wx.showLoading({
      title: '加载中...',
    })
    cusmallToken = wx.getStorageSync('cusmallToken');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/verifiedclerk/genOrderVerifiedQrCode',
      data: {
        cusmallToken: cusmallToken,
        page: "pages/verify/order_verify",
        orderId: that.data.orderData.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data.ret == 0) {
          if (that.data.app.globalData.shopuid) { //子店
            that.setData({
              sceneData: JSON.parse(res.data.model.scene)
            });
            that.switchPasswordCheck();
          } else { //主店
            that.setData({
              appletScene: res.data.model.appletScene
            });
            that.setData({
              sceneData: JSON.parse(res.data.model.appletScene.entity || "{}")
            })
          }
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取核销qrcode信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
        wx.hideLoading();
      }
    })
  },

  changeEcWayType(e) { //select send type
    var wType = e.currentTarget.dataset.wtype;
    var ctx = this;
    if (wType == 3) {
      ctx.setData({
        fromToStore: true,
        selectedDineWay: 1
      });
    } else {
      ctx.setData({
        fromToStore: false,
        selectedDineWay: 3
      });
    }
    ctx.setData({
      ecWayType: wType,

    });

    this.multInit();
  },

  changeToShopName(e) {
    this.setData({
      toShopName: e.detail.value
    })
  },
  changeToShopTel(e) {
    this.setData({
      toShopTel: e.detail.value
    })
  },
  // showToShopAddr(){
  //   if (this.data.orderData && 3 == this.data.orderData.wayType){
  //     this.openShopMap();
  //   }
  // },
  toGoodsDetail(e) {
    var ctx = this;
    var gId = e.currentTarget.dataset.gid;
    var orderData = ctx.data.orderData;
    if (1 == orderData.orderType) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=' + gId,
      });
    } else if (2 == orderData.orderType) {
      if (3 == orderData.foodType) {
        wx.navigateTo({
          url: '/pages/takeout/indexDetail?fromIndex=true&id=' + gId + "&type=ta",
        })
      } else {
        wx.navigateTo({
          url: '/pages/takeout/indexDetail?fromIndex=true&id=' + gId + "&type=tostore",
        })
      }
    } else if (3 == orderData.orderType) {
      wx.navigateTo({
        url: '/pages/yuyue/yydetail?id=' + gId,
      })
    } else if (5 == orderData.orderType) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=' + gId,
      })
    }
  },

  //满减箭头点击事件
  changeOverReduce: function() {
    var that = this;
    that.setData({
      ['showOverReduceDetail']: !that.data.showOverReduceDetail,
    });
  },
  //回显上个订单自提地址
  getSelfAddress: function(id) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/shopGetSelf/findById',
      data: {
        cusmallToken: cusmallToken,
        id: id

      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data && res.data.ret == 0) {
          var addr = res.data.model.result;
          that.setData({
            selfAddressName: addr.detailAddress,
            address: addr.mapAddress,
          })
          if (that.data.selfId) {
            //到店自提时间回显
            if (addr && addr.time) {
              let getSelfTime = JSON.parse(addr.time);
              let startHour = getSelfTime.startHour;
              let startMin = getSelfTime.startMin;
              let endHour = getSelfTime.endHour;
              let endMin = getSelfTime.endMin;
              if (startHour && startMin && endHour && endMin) {
                that.setData({
                  getSelfTime: getSelfTime,
                  getSelfTimeTxt: startHour + ":" + startMin + " 至 " + endHour + ":" + endMin
                });
              }
            }
          }
        } else {

        }
      }
    })
  },
  //获取上一条订单，如果是到店堂吃或者到店自取，回显手机号
  getPreviousOrder: function() {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getPreviousOrder',
      data: {
        cusmallToken: cusmallToken,
        shopUid: mallSite.uid,
        goodsType: that.data.goodsType,
        foodType: that.data.selectedDineWay,
        wayType: 3
      },
      header: {
        'content-type': 'application/json'
      },
      success: function(res) {
        if (res.data && res.data.ret == 0) {
          let parOrder = res.data.model.result;
          var selfAddress = wx.getStorageSync("address");
          console.log(selfAddress);
          var lastindex = 0;
          var selfId = "";
          if (parOrder && parOrder.clientName) {
            that.setData({
              toShopName: parOrder.clientName,
            })
          }
          if (parOrder && parOrder.tel) {
            that.setData({

              toShopTel: parOrder.tel
            })
          }
          if (that.data.selfId) {
            lastindex = that.data.selfId.lastIndexOf("\)");
            selfId = that.data.selfId.substring(lastindex + 1, that.data.selfId.length);
            that.setData({
              selfAddress: selfAddress
            });
          } else {
            if (parOrder && parOrder != null) {
              lastindex = parOrder.address.lastIndexOf("\)");
              selfId = parOrder.address.substring(lastindex + 1, parOrder.address.length);
              that.setData({
                selfAddress: parOrder.address
              });
            }
          }
          if (parOrder && parOrder.wayType == 3) {
            that.getSelfAddress(selfId);
          }
          if (parOrder) {
            let inputContent = that.data.inputContent;
            inputContent.sntel = parOrder.tel
            that.setData({
              sntel: parOrder.tel,
              inputContent: inputContent
            })
          }
        } else {

        }
      }
    })
  },
  getApplyRefund: function(parOrder) {
    let status = parOrder.status;
    let payType = parOrder.payType;
    let orderType = parOrder.orderType;
    var that = this;

    if (orderType == 2) {
      //待发货、待收货
      if (status == 2 || status == 3) {
        that.setData({
          showApplyRefund: true
        })
      }
      //外卖行业，未接单且非货到付款、到店支付可以申请退款
      if (status == 10 && payType != 3 && payType != 4) {
        that.setData({
          showApplyRefund: true
        })
      }

    } else {
      //其他行业，待发货非货到付款、到店支付可以申请退款
      if (status == 2 && payType != 3 && payType != 4) {
        that.setData({
          showApplyRefund: true
        })
      }
      //待收货
      if (status == 3) {
        that.setData({
          showApplyRefund: true
        })
      }
    }

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

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
