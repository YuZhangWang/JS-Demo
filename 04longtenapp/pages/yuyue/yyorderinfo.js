// orderinfo.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync("mallSite");
var cusmallToken = wx.getStorageSync('cusmallToken');
var CouponHandle = require("../template/couponhandle.js");
var giftcardHandle = require("../template/giftcardlist.js");
var baseHandle = require("../template/baseHandle.js");
var cardHandle = require("../template/cardlist.js");
var commHandle = require("../template/commHandle.js");
var Switch = require('../../youzan/dist/switch/index.js');
Page(Object.assign({}, commHandle, baseHandle, CouponHandle, giftcardHandle, cardHandle, Switch, {
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
    orderId: "",
    specId: "",
    orderData: null,
    btnLoading: true,
    fromShopingCart: false,
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
    className: {
      popUpStatu: ""
    },
    inputInfo: {
      name: "",
      tel: "",
      address: ""
    },
    pageTitle: "订单详情",
    yuyueData: {
      dayArr: {},
      hourArr: {},
      curDay: "",
      selectedDay: "",
      selectedHour: "",
      selectedWeek: "",
      selectedPrice: -1
    },
    yuyueTime: "",
    yuyuePrice: -1,
    showAddr: false,
    showCouponList: false,

    showCardList: false,
    cardList: [],
    couponList: [],
    preferenceCodeList: [],
    prepareOrderVo: {},
    enableDepositItemValue: true,
    enableDepositSW: false,
    enableDeposit: 0,
    enableDepositChe: false,
    enablePointsItemValue: true,
    enablePointsSW: false,
    enablePoints: 0,
    pointsToMoney: 0,
    enablePointsChe: false,
    discountCount: 0,
    calcFinPrice: 0,
    usenewspec: false, //规格开关
    verType: "order", //核销类型
    uploadImgList: [], //补充信息图片
    isExtra: false,
    extraItem: [],
    suppleInfo: [], //新数据集
    imgObj: {},
    orderDeInf: [],
    radioIdx: [],
    selectIdx: [],
    refundMoney: "",
    refundType: "",
    accountPackagePrivilege: {},
    previousName: "",
    previousTel: "",
    yuyueEndTime: "",
    nowDate3: "",
    nowDate: "",
    startDate: '请选择日期',
    endDate: "请选择日期",
    preferenceCode: "", //优惠码,
    preferenceCodeId: "",
    showOverReduce: false, //满减配置
    overReduceType: 0,
    overReduceRule: {},
    showOverReduceDetail: false, //满减详情下拉
    preShowOverReduce: false, //预下单返回满减
    preOverReduceMoney: "",
    couponFlag: false,
    limit: 10,
    total: 0,
    scrollTop:0,
    canyuyue:true,
    showRemarkInput:true

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.setData({
    //   mainTheme:`background-image: linear-gradient(to left top, ${app.globalData.customTheme.themeMain}, ${app.globalData.customTheme.themeMain} 50%, transparent 50%);`
    // })
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = wx.getStorageSync('mallSiteId');
    mallSite = wx.getStorageSync("mallSite");
    wx.hideShareMenu();
    var date = new Date();
    var startDate = date.getFullYear() + "-" + (date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());

    var pageTitle = "订单详情";
    this.setData({
      id: options.id,
      nowDate: startDate
    });
    //this.setData({ id: 44 });//开发时为方便特殊定制
    this.setData({
      specId: options.specId
    });
    this.setData({
      orderId: options.orderid
    });
    this.setData({
      goodsCount: options.goodsCount
    });
    this.setData({
      specInventory: options.specInventory
    });
    //this.setData({ goodsCount: 1 });//开发时为方便特殊定制
    if (options.fromShopingCart) {
      this.setData({
        fromShopingCart: true
      });
      this.setData({
        cartIds: options.cartIds
      });
      pageTitle = "提交订单";
    }
    if (options.orderid) {
      this.fetchOrderData(this.afterGoodsLoaded);
    } else if (options.fromShopingCart) {
      this.fetchShoppingCartData(this.afterGoodsLoaded);
      //this.fetchAddressData();
    } else if (options.fromTakeout) {
      this.fetchTakeOutShoppingCartData(this.afterGoodsLoaded);
      //this.fetchAddressData();
    } else {
      pageTitle = "提交订单";
      this.fetchData(this.afterGoodsLoaded);
      //this.calDeliveryFee();
      //this.fetchAddressData();
    }
    this.setData({
      pageTitle: pageTitle
    });
    wx.setNavigationBarTitle({
      title: pageTitle
    })
    util.afterPageLoad(this);
    this.setDayTime(); //初始化时间选择器
    this.setHourTime(); //初始化时间选择器
    this.getPreviousOrder();
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
  //优惠码
  changeToCode: function (e) {
    let code = e.detail.value;
    this.setData({
      preferenceCode: code
    })
  },
  //优惠码兑换
  convert: function () {

    this.setData({
      couponFlag: true,
      limit:10,
      scrollTop:0,
      total: 0
    })

    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/useDiscountCode',
      data: {
        cusmallToken: cusmallToken,
        discountCode: that.data.preferenceCode,
        shopUid: app.globalData.shopuid || "",
        start: 0,
        limit: that.data.limit || 10
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var data = res.data;
          that.setData({
            preferenceCodeList: data.model.result,
            total:data.model.total
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
  bindChange: function (e) {
    this.data.inputContent[e.currentTarget.id] = e.detail.value
  },

  handAddImageMore: function (e) {
    var that = this;
    let idx = e.currentTarget.dataset.id;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths, idx);
      }
    })
  },
  handleAddImage: function (e) {
    let that = this;
    let idx = e.currentTarget.dataset.id
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths, idx);
      }
    })
  },
  // startDate endDate
  bindDateChange1(e) {
    var that = this;
    that.setData({
      startDate: e.detail.value,
      yuyueTime: e.detail.value
    })
    if (that.data.prepareOrderVo.goodsList['0'].serviceType == 2 || that.data.prepareOrderVo.goodsList['0'].serviceType == 3) {
      if (that.data.startDate == that.data.endDate) {
        that.showAlertModal("开始日期要早于结束日期");
        that.setData({
          startDate: "请选择日期",
        })
        return false;
      }

    }
    that.multInit();
  },
  bindDateChange2(e) {
    var that = this;
    that.setData({
      endDate: e.detail.value,
      yuyueEndTime: e.detail.value
    })
    // if (that.data.prepareOrderVo.goodsList['0'].serviceType == 2 || that.data.prepareOrderVo.goodsList['0'].serviceType == 3 ) {
    //   if (that.data.startDate == that.data.endDate) {
    //     that.showAlertModal("结束日期要晚于开始日期");
    //     that.setData({
    //       endDate: "请选择日期",
    //     })
    //     return false;
    //   }

    // }
    that.multInit();


  },
  upload: function (page, path, idx) {
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
        riskCheckType:1,
        header: {
          "Content-Type": "multipart/form-data"
        },
        formData: {
          //和服务器约定的token, 一般也可以放在header中
          cusmallToken: cusmallToken,
        },
        success: function (res) {
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
          imgObj["sels"] = vm.data.extraItem[idx].sels == undefined ? [] : vm.data.extraItem[idx].sels;
          vm.data.suppleInfo[idx] = imgObj
          vm.setData({
            uploadImgList: uploadImgList,

          });
        },
        fail: function (e) {
          console.log(e);
          wx.showModal({
            title: '提示',
            content: '上传失败',
            showCancel: false
          })
        },
        complete: function () {
          wx.hideToast(); //隐藏Toast
        }
      })
  },
  // 更新数据集
  bindInputOrder: function (e) {
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
  afterGoodsLoaded: function () {
    var that = this;
    // that.calDeliveryFee();
    if (!that.data.orderData) {
      that.multInit();
    }
  },
  multInit: function (num) {
    let that = this;
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/order/prepareOrder",
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        cartIds: that.data.cartIds,
        siteId: mallSiteId,
        discountId: that.data.preferenceCodeId || "",
        goodsList: JSON.stringify(that.data.goodsList),
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || "",
        areaId: wx.getStorageSync('addrId'),
        userGiftCard: that.data.selectedGiftCard ? true : false,
        giftCardRecordId: that.data.selectedGiftCard ? that.data.selectedGiftCard.id : "",
        mcId: that.data.selectedCard ? that.data.selectedCard.id : "",
        couponRecordId: that.data.selectedCoupon && that.data.selectedCoupon.id ? that.data.selectedCoupon.id : "",
        userIntegral: that.data.enablePointsSW,
        userDepositItemValue: that.data.enableDepositSW,
        bespeakTime: that.data.yuyueTime, //预约参数
        bespeakEndTime: that.data.yuyueEndTime
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let prepareOrderVo = data.model.prepareOrderVo;
          let goodslist = that.data.goodsList;
          goodslist = JSON.parse(prepareOrderVo.orderSign.goodsListStr);
          that.setData({
            consumeGiftIntegral:data.model.prepareOrderVo.orderSign.consumeGiftIntegral,
            goodsGiftIntegral:data.model.prepareOrderVo.orderSign.goodsGiftIntegral,
            goodsList: goodslist,
            showRemarkInput: data.model.showRemarkInput || data.model.showRemarkInput == null ? true : false
          });


          that.setData({
            prepareOrderVo: prepareOrderVo
          })
          // that.fetchAddressData(prepareOrderVo.userAddress);
          if (that.data.addressInfo != null) {
            that.calDeliveryFee(prepareOrderVo.orderSign, prepareOrderVo.canUseRecords);
          } else if (that.data.addressInfo != null && !that.data.orderId && that.data.goodsList.length > 0) {
            that.calDeliveryFee(prepareOrderVo.orderSign, prepareOrderVo.canUseRecords);
          } else {
            that.fetchCouponList(prepareOrderVo.canUseRecords);
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
          /* 补充信息显隐 */
          let enableExtraInfo = prepareOrderVo.goodsList.some(function (item) {
            return (item.configSuperSwitch & Math.pow(2, 6)) != 0
          });
          if (!enableExtraInfo) {
            that.setData({
              enableExtraInfo: true
            });
          }
          that.setData({
            isExtra: data.model.prepareOrderVo.orderSign.isExtra,
            extraItem: JSON.parse(data.model.prepareOrderVo.orderSign.extraItem)
          });
          that.setData({
            enableDeposit: prepareOrderVo.orderSign.userDeposit
          }); //实际用的储值金
          that.setData({
            enablePoints: prepareOrderVo.orderSign.userIntegral
          }); //实际用的积分抵扣
          that.setData({
            pointsToMoney: prepareOrderVo.orderSign.integralToMoney
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
            totalPrice: prepareOrderVo.orderSign.totalPrice
          });
          that.setData({
            accountPackagePrivilege: data.model.accountPackagePrivilege
          });
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
          that.setData({
            btnLoading:false
          })

        } else {
          that.setData({
            btnLoading: true,
          })
          wx.showModal({
            title: '提示',
            content: data.msg,
            showCancel: false
          })
        }

      },
      fail: function () {},
      complete: function () {
        wx.hideLoading();
      }
    });
  },

  // 获取优惠券信息
  fetchCouponList: function (canUseRecords) {
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

  fetchAddressData: function (addressInfo) {
    var that = this;
    that.setData({
      addressInfo: addressInfo
    });
  },
  // 根据商品ID获取信息
  fetchData: function (cb) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
      data: {
        cusmallToken: cusmallToken,
        goodsId: that.data.id,
        showCardPrice:true

      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var goodsData = res.data.model.goods;
          var goodsPrice = goodsData.price;
          var bespeakRest = goodsData.bespeakRest;
          var memberCardId = res.data.model.memberCardId;
          var memberCardName = res.data.model.memberCardName;
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
            goodsItem.total_price = that.data.goodsCount * goodsPrice;
          }
          that.data.goodsList.push(goodsItem);
          that.setData({
            totalPrice: goodsPrice * that.data.goodsCount
          });
          that.setData({
            goodsList: that.data.goodsList,
            bespeakRest: bespeakRest
          });
          that.setData({
            usenewspec: goodsData.usenewspec


          })
          if(memberCardId){
            that.setData({

              ['selectedCard.id']: memberCardId,
              ['selectedCard.cname']: memberCardName,

            })
          }
          //是否需要填写地址
          that.setData({
            showAddr: goodsData.openBespeakAddress
          });
          that.setData({
            bespeakEndTime: goodsData.bespeakEndTime,
            bespeakLimit: goodsData.bespeakLimit,
            bespeakLimitTime: goodsData.bespeakLimitTime
          })
          cb && cb();
          wx.hideLoading();
          that.setData({
            btnLoading: false
          });
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })

  },
  toOrderInfo: function () {
    var vm = this;
    wx.navigateTo({
      url: '../orderinfo/orderinfosupple?orderInfo=' + JSON.stringify(vm.data.orderDeInf),
    })
  },
  // 从订单获取商品信息
  fetchOrderData: function (cb) {
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
      success: function (res) {
        if (res.data.ret == 0) {
          var parOrder = res.data.model.parOrder;
          util.processOrderData(parOrder);
          that.setData({
            totalPrice: parOrder.totalPrice
          });
          that.setData({
            goodsList: JSON.parse(parOrder.goodsList)
          });
          if (parOrder.orderDiscount) {
            parOrder.giftCardDiscountMoney = JSON.parse(parOrder.orderDiscount).giftCardDiscountMoney;
          }
          that.setData({
            orderData: parOrder
          });
          that.setData({
            goodsCount: parOrder.totalCount
          });
          that.setData({
            addressInfo: {
              "userName": parOrder.clientName,
              "tel": parOrder.tel,
              "areaName": "",
              "address": parOrder.address,
            }
          });
          that.setData({
            orderStatus: util.getOrderStatus(parOrder, "yuyue")
          });
          if (parOrder.status == 1 || parOrder.status ==2 || parOrder.status ==3 || parOrder.status ==7 || parOrder.status ==8 || parOrder.status ==9|| parOrder.status ==10) {
            that.setData({
              statusIcon: 'wait-icon'
            });
          }else {
            that.setData({
              statusIcon: "ok-icon"
            });
          }
          that.setData({
            calcFinPrice: parOrder.actualPrice,
            orderDeInf: JSON.parse(parOrder.extraInfo)
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
  // 从购物车获取商品信息
  fetchShoppingCartData: function (cb) {
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
      success: function (res) {
        if (res.data.ret == 0) {
          var cartList = res.data.model.list;
          that.data.goodsCount = 0;
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
              "code": cart.code
            };
            if (cart.spec) {
              goodsItem.selectedSku = JSON.parse(cart.spec);
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
            totalPrice: that.data.totalPrice / 100
          });
          that.setData({
            goodsList: that.data.goodsList
          });
          cb && cb();
          /*if (that.data.addressInfo != null) {
            that.calDeliveryFee();
          }*/
          wx.hideLoading();
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

  fetchTakeOutShoppingCartData: function (cb) {
    var that = this;
    var goodsList = wx.getStorageSync('takeOutShoppingCart');
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
        "price": goods.selectedSku ? goods.selectedSku.price : goods.price,
        "count": goods.selectedNum,
        "total_price": goods.selectedSku ? goods.selectedSku.price * goods.selectedNum : goods.price * goods.selectedNum,
        "code": goods.code
      };
      if (goods.usenewspec) {
        item.selectedSku = goods.selectedSku;
      }
      that.data.goodsList.push(item);
      that.data.totalPrice += item.total_price;
      that.data.goodsCount += item.count;
      //console.log(that.data.goodsCount);
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
    /*if (that.data.addressInfo != null) {
      that.calDeliveryFee();
    }*/
  },

  onConfirmOrder: function () {
    var that = this;
    var inputInfo = that.data.inputInfo;

    if (that.data.bespeakEndTime) {
      if (!that.data.yuyueEndTime) {
        that.showAlertModal("请选择结束时间");
        return false;
      }
      var startDateTime = new Date(that.data.yuyueTime.replace(/-/g, "/")).getTime();
      var endDateTime = new Date(that.data.yuyueEndTime.replace(/-/g, "/")).getTime();
      if (startDateTime > endDateTime) {
        that.showAlertModal("结束时间不得早于开始时间");
        return false;
      }
    }

    if (!that.data.yuyueTime) {
      that.showAlertModal("请选择预约时间");
      return false;
    } else if (!inputInfo.name) {
      that.showAlertModal("请填写联系人姓名");
      return false;
    } else if (!inputInfo.tel) {
      that.showAlertModal("请填写手机号码");
      return false;
    } else if (!util.phoneValidate(that.data.inputInfo.tel)) {
      that.showAlertModal("手机号码格式不正确");
      return false;
    } else if (that.data.showAddr && (!inputInfo.address)) {
      that.showAlertModal("请填写详细地址");
      return false;
    }
    if (that.data.prepareOrderVo.goodsList['0'].serviceType != 1) {
      if (that.data.startDate == "请选择日期") {
        that.showAlertModal("请选择日期");
        return false;
      }
      if (that.data.endDate == "请选择日期") {
        that.showAlertModal("请选择日期");
        return false;
      }
    }
    if (that.data.prepareOrderVo.goodsList['0'].serviceType == 3) {
      if (that.data.startDate == that.data.endDate) {
        that.showAlertModal("结束日期要晚于开始日期");
        return false;
      }

    }
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
      }
    }

    wx.showLoading({
      title: '订单提交中',
    });
    that.setData({
      btnLoading: true
    });



    /**
    var submitData = {
      cusmallToken: cusmallToken,
      goodsList: that.genGoodsListString(),
      clientName: that.data.inputInfo.name,
      tel: that.data.inputInfo.tel,
      address: that.data.inputInfo.address,
      deliveryPrice: that.data.deliveryPrice,
      remark: that.data.inputContent.remark,
      bespeakTime:that.data.yuyueTime,
      siteId: mallSiteId
    };
    if (that.data.fromShopingCart){
      submitData.cartIds = that.data.cartIds;
    }
    if (that.data.selectedCoupon) {
      submitData.couponRecordId = that.data.selectedCoupon.id;
    }
    if (that.data.bespeakEndTime){
      submitData.bespeakEndTime = that.data.yuyueEndTime;
    }
     */

    // wx.request({
    //   url: cf.config.pageDomain + '/applet/mobile/order/addOrder',
    //   data: submitData,
    //   header: {
    //     'content-type': 'application/json'
    //   },
    //   success: function (res) {
    //     //console.info(res);
    //     that.setData({ btnLoading: false });
    //     if (res.data.ret == 0) {
    //       wx.hideLoading();
    //       var showaddrText = "hide";
    //       if(that.data.showAddr){
    //         showaddrText = "show";
    //       }
    //       wx.redirectTo({
    //         url: '/pages/orderpay/order_pay?id=' + res.data.model.parId + '&sitetype=yuyue&showaddr='+showaddrText,
    //       })
    //     } else {
    //       wx.hideLoading();
    //       wx.showModal({
    //         title: '提交订单信息异常',
    //         showCancel: false,
    //         content: res.data.msg
    //       })
    //     }
    //   }
    // })
    let prepareOrderVo = that.data.prepareOrderVo;
    let submitData = {
      discountId: that.data.preferenceCodeId || "",
      cusmallToken: cusmallToken,
      orderSign: JSON.stringify(prepareOrderVo.orderSign),
      addOrderSign: prepareOrderVo.sign,
      address: that.data.inputInfo.address,
      tel: that.data.inputInfo.tel,
      clientName: that.data.inputInfo.name,
      remark: that.data.inputContent.remark,
      bespeakTime: that.data.yuyueTime,
      extraInfo: JSON.stringify(that.data.suppleInfo)
      // formId: formId
    }
    if (that.data.bespeakEndTime) {
      submitData.bespeakEndTime = that.data.yuyueEndTime;
    }
    if (that.data.prepareOrderVo.goodsList['0'].serviceType != 1) {
      submitData.bespeakTime = that.data.startDate;
      submitData.bespeakEndTime = that.data.endDate;
    }
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
      }]),
      function (resp) {
        console.log(resp)
        wx.request({
          url: cf.config.pageDomain + '/applet/mobile/order/addNewOrder',
          data: submitData,
          method: "POST",
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          success: function (res) {
            console.info(res);
            that.setData({
              btnLoading: false
            });
            if (res.data.ret == 0) {
              wx.hideLoading();
              wx.hideLoading();
              var showaddrText = "hide";
              if (that.data.showAddr) {
                showaddrText = "show";
              }
              wx.redirectTo({
                url: '/pages/orderpay/order_pay?id=' + res.data.model.parId + '&sitetype=yuyue&showaddr=' + showaddrText,
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
  backToDetail: function (e) {
    var that = this;
    wx.reLaunch({
      url: '/pages/yuyue/yydetail?id=' + e.currentTarget.dataset.id,
    })
  },
  onBtnPay: function (e) {
    var that = this;
    wx.navigateTo({
      url: '/pages/orderpay/order_pay?id=' + that.data.orderId,
    })
  },

  onBtnCancel: function (e) {
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "您确定取消订单么？",
      success: function (res) {
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
            success: function (res) {
              wx.showToast({
                title: '您已成功取消了订单',
                duration: 2500,
                complete: function () {

                }
              });
              setTimeout(function () {
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

  onReturnOrder: function (e) {
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "您确定申请退款么？",
      success: function (res) {
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

  onFinishOrder: function (e) {
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "确认收货后无法申请退款，确定要收货么？",
      success: function (res) {
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
            success: function (res) {
              wx.showToast({
                title: '确认成功',
                duration: 2500,
                complete: function () {

                }
              });
              setTimeout(function () {
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

  genGoodsListString: function () {
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
  calDeliveryFee: function (orderSign, canUseRecords) {
    var that = this;
    // that.setData({ deliveryPrice: 0 });
    // that.setData({ allPrice: Number(that.data.totalPrice) + Number(that.data.deliveryPrice)});
    // that.setData({ btnLoading: false });
    // if (!that.data.orderData) {
    //   that.fetchCouponList();
    // }

    that.setData({
      deliveryPrice: 0
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

    /*if (that.data.orderData != null){
      that.setData({ deliveryPrice: (that.data.orderData.deliveryPrice / 100).toFixed(2) });
      that.setData({ allPrice: ((Number(that.data.totalPrice)*100 + Number(that.data.orderData.deliveryPrice))/100).toFixed(2)});
      that.setData({ btnLoading: false });
    } else {
      wx.request({
        url: cf.config.pageDomain + '/applet/mobile/yunfei/getDeliveryFee',
        data: {
          goodsList: that.genGoodsListString(),
          areaId: that.data.addressInfo.areaId,
          cusmallToken: cusmallToken
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          var deliveryPrice = res.data.model.deliveryPrice;
          that.setData({ deliveryPrice: (deliveryPrice / 100).toFixed(2) });
          that.setData({ allPrice: (Number(that.data.totalPrice) + Number(that.data.deliveryPrice)).toFixed(2)});
          that.setData({ btnLoading: false });
        }
      })
    }*/

  },

  onTapAddress: function () {
    var that = this;
    if (that.data.orderData == null) {
      var addressUrl = '/pages/uniquecenter/addresslist';
      if (that.data.orderData != null) {
        addressUrl += "?orderid=" + that.data.orderId;
      } else if (that.data.fromShopingCart) {
        addressUrl += "?fromShopingCart=true&cartIds=" + that.data.cartIds;
      } else {
        addressUrl += "?id=" + that.data.id + "&goodsCount=" + that.data.goodsCount + (that.data.specId ? "&specId=" + that.data.specId : "") + '&type=yy';
      }
      wx.navigateTo({
        url: addressUrl,
      })
    }
  },
  onShowTimeSelect: function (e) {
    var that = this;
    var isShowEndTime = e.currentTarget.dataset.isshowendtime;
    var selectedDay = that.data.yuyueData.selectedDay;
    if (isShowEndTime) {
      selectedDay = that.data.yuyueData.selectedEndDay;
    }
    that.setData({
      isShowEndTime: isShowEndTime ? true : false
    })
    that.getYuyueTime(selectedDay);
    if (selectedDay) {
      var dayArr = that.data.yuyueData.dayArr;
      for (var i = 0; i < dayArr.length; i++) {
        var day = [dayArr[i].year, that.add0(dayArr[i].month), that.add0(dayArr[i].day)].join("-");
        if (day == selectedDay) {
          dayArr[i].active = "active";
          var curDay = day;
        } else {
          dayArr[i].active = "";
        }
      }
      that.setData({
        "yuyueData.dayArr": dayArr,
        "yuyueData.curDay": curDay
      });
    }
    that.timeSelectStyle("show");

  },
  onHindTimeSelect: function () {
    var that = this;
    //修改价格参数
    var goodsList = that.data.goodsList;
    var yuyueData = that.data.yuyueData;
    var yuyuePrice = Number(yuyueData.selectedPrice);
    var totalPrice, allPrice, goodsPrice = 0;

    if (!that.data.usenewspec) {
      for (var i = 0; i < goodsList.length; i++) {
        if (that.data.id == goodsList[i].id) {
          if (yuyueData.selectedHour && yuyuePrice >= 0) {
            goodsList[i].price = yuyuePrice;
            goodsList[i].total_price = yuyuePrice * goodsList[i].count;
            goodsPrice += Number(goodsList[i].total_price);
          }
        }
      }
      totalPrice = goodsPrice;
      allPrice = goodsPrice + Number(that.data.deliveryPrice);

      that.setData({
        totalPrice: totalPrice,
        allPrice: allPrice,
        goodsList: goodsList
      });
    } else {

    }

    if (that.data.isShowEndTime) {
      if (that.data.yuyueData.selectedEndDay && that.data.yuyueData.selectedEndHour) {
        that.setData({
          yuyueEndTime: that.data.yuyueData.selectedEndDay + " " + that.data.yuyueData.selectedEndHour
        })
      }
    } else {
      if (that.data.yuyueData.selectedDay && that.data.yuyueData.selectedHour) {
        that.setData({
          yuyueTime: that.data.yuyueData.selectedDay + " " + that.data.yuyueData.selectedHour
        })
      }
      that.multInit();
    }
    that.timeSelectStyle("hide");
  },
  timeSelectStyle: function (type) {
    var that = this;
    if (type == "show") {
      wx.setNavigationBarTitle({
        title: "选择时间"
      })
      that.setData({
        "className.popUpStatu": "popup_show"
      });
    } else {
      wx.setNavigationBarTitle({
        title: that.data.pageTitle
      })
      that.setData({
        "className.popUpStatu": ""
      });
    }
  },
  setHourTime: function () {
    var that = this;
    var hourArr = [];
    for (var i = 0; i < 48; i++) {
      hourArr[i] = {};
      hourArr[i].id = i;
      hourArr[i].repertory = 0; //该时间段库存
      hourArr[i].price = -1; //该时间段价格
      hourArr[i].statuStyle = "close"; //有close,available,selected三种状态
      var hour = that.add0(Math.floor(i / 2));
      if (i % 2 == 0) {
        hourArr[i].text = hour + ":00";
      } else {
        hourArr[i].text = hour + ":30";
      }
    }
    that.setData({
      "yuyueData.hourArr": hourArr
    });
  },
  setDayTime: function () {
    var that = this;
    var curDayStr = that.transDate();
    var curDay = new Date(curDayStr.replace(/-/g, "/")).getTime();
    var oneDay = 24 * 60 * 60 * 1000;
    var dayArr = [];
    for (var i = 0; i < 180; i++) {
      dayArr[i] = {};
      dayArr[i].id = i;
      dayArr[i].active = "";
      dayArr[i].time = curDay + i * oneDay; //时间戳
      dayArr[i].date = new Date(dayArr[i].time); //时间
      dayArr[i].year = dayArr[i].date.getFullYear(); //年
      dayArr[i].month = dayArr[i].date.getMonth() + 1; //月
      dayArr[i].day = dayArr[i].date.getDate(); //天
      dayArr[i].week = dayArr[i].date.getDay(); //星期
      dayArr[i].canyuyue = "可预约"; //星期
      if (i > 2) {
        dayArr[i].text = that.transWeek(dayArr[i].week) + " " + [that.add0(dayArr[i].month), that.add0(dayArr[i].day)].join('/')
      } else {
        if (i == 0) {
          dayArr[i].active = "active";
          dayArr[i].text = "今天 " + [that.add0(dayArr[i].month), that.add0(dayArr[i].day)].join('/');
        } else if (i == 1) {
          dayArr[i].text = "明天 " + [that.add0(dayArr[i].month), that.add0(dayArr[i].day)].join('/');
        } else {
          dayArr[i].text = "后天 " + [that.add0(dayArr[i].month), that.add0(dayArr[i].day)].join('/');
        }
      }
    }
    that.setData({
      "yuyueData.dayArr": dayArr,
      "yuyueData.curDay": curDayStr,
      "yuyueData.canyuyue": dayArr[0].canyuyue,
      "yuyueData.selectedWeek": dayArr[0].week,

    });
  },
  selectedHourTime: function (e) {
    var that = this;
    //console.log(e);
    var id = e.currentTarget.id;
    if (e.currentTarget.dataset.statu == "available") {
      var selectedHour = "",
        selectedDay = that.data.yuyueData.curDay;
      var selectedPrice = -1;
      var hourArr = that.data.yuyueData.hourArr;
      for (var i = 0; i < hourArr.length; i++) {
        if (id == hourArr[i].id) {
          hourArr[i].statuStyle = "selected";
          selectedHour = hourArr[i].text;
          selectedPrice = hourArr[i].price;
        } else {
          if (hourArr[i].repertory <= 0) {
            hourArr[i].statuStyle = "close";
          } else {
            hourArr[i].statuStyle = "available";
          }
        }
      }
      if (that.data.isShowEndTime) {
        that.setData({
          "yuyueData.hourArr": hourArr,
          "yuyueData.selectedEndHour": selectedHour,
          "yuyueData.selectedEndHourId": id,
          "yuyueData.selectedEndDay": selectedDay
        });
      } else {
        that.setData({
          "yuyueData.hourArr": hourArr,
          "yuyueData.selectedHour": selectedHour,
          "yuyueData.selectedHourId": id,
          "yuyueData.selectedPrice": selectedPrice,
          "yuyueData.selectedDay": selectedDay
        });
      }
    } else {
      return false;
    }
  },
  selectedDate: function (e) {
    var that = this;
    //console.log(e);
    var id = e.currentTarget.id;
    var dayArr = that.data.yuyueData.dayArr;
    var curDay = "";
    var canyuyue = '',
      selectedWeek = null;
    for (var i = 0; i < dayArr.length; i++) {
      if (id == dayArr[i].id) {
        dayArr[i].active = "active";
        curDay = [dayArr[i].year, that.add0(dayArr[i].month), that.add0(dayArr[i].day)].join('-');
        selectedWeek = dayArr[i].week;
        canyuyue = dayArr[i].canyuyue;
      } else {
        dayArr[i].active = "";
      }
    }
    that.setData({
      "yuyueData.dayArr": dayArr,
      "yuyueData.curDay": curDay,
      "yuyueData.canyuyue": canyuyue,
      "yuyueData.selectedWeek": selectedWeek
    });
    that.getYuyueTime(curDay);
  },
  getYuyueTime: function (time) {
    var that = this;
    wx.showLoading({
      title: '加载中',
    })
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/getBespeakGoodsInventory',
      data: {
        goodsId: that.data.id,
        date: that.transDate(time),
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        var model = res.data.model;
        var canWeek = "";
        var bespeakDetail = "";
        var bespeakRest = that.data.bespeakRest;
        //console.log(model);
        if (model.bespeakDay) {
          canWeek = model.bespeakDay.split(",");
        }
        if (bespeakRest) {
          bespeakRest = JSON.parse(bespeakRest)
        }
        if (model.bespeakDetail) {
          bespeakDetail = JSON.parse(model.bespeakDetail)
        }

        var yuyueData = that.data.yuyueData;
        var dayArr = yuyueData.dayArr;
        var curWeek = yuyueData.selectedWeek;
        var weekFlag = false; //是否该星期可预约
        if (curWeek == 0) {
          curWeek = 7;
        }
        for (var i = 0; i < dayArr.length; i++) {
          var dayWeek = dayArr[i].week;
          var date = util.formatDate(dayArr[i].date);
          var currentDate = new Date(date.replace(/-/g, "\/"));
          if (dayWeek == 0){
            dayWeek = 7;
          }
          if (model.bespeakDay.indexOf(dayWeek) == -1) {
            dayArr[i].canyuyue = "不可预约";
          }
          if (bespeakRest){
            for (var n = 0; n < bespeakRest.length; n++) {
              if (new Date(bespeakRest[n].startDate.replace(/-/g, "\/")) <= currentDate && new Date(bespeakRest[n].endDate.replace(/-/g, "\/")) >= currentDate) {
                dayArr[i].canyuyue = "不可预约";
              }else{

              }

            }
          }

        }
        that.setData({
          "yuyueData.dayArr": dayArr
        });
        for (var i = 0; i < canWeek.length; i++) {
          if (curWeek == canWeek[i]) {
            weekFlag = true;
            break;
          }
        }
        if (weekFlag) { //已设置该星期可预约
          for (var j = 0; j < bespeakDetail.length; j++) {
            bespeakDetail[j].startTime = new Date(yuyueData.curDay.replace(/-/g, "/") + " " + bespeakDetail[j].startTime).getTime();
            bespeakDetail[j].endTime = new Date(yuyueData.curDay.replace(/-/g, "/") + " " + bespeakDetail[j].endTime).getTime();
          }
          var hourArr = yuyueData.hourArr;
          var currentTime = new Date().getTime();
          if (that.data.bespeakLimit && that.data.bespeakLimitTime) {
            currentTime += that.data.bespeakLimitTime * 60 * 1000;
          }
          for (var i = 0; i < hourArr.length; i++) {
            var curTime = new Date(yuyueData.curDay.replace(/-/g, "/") + " " + hourArr[i].text).getTime();
            for (var j = 0; j < bespeakDetail.length; j++) {
              if (curTime > currentTime && curTime >= bespeakDetail[j].startTime && curTime <= bespeakDetail[j].endTime) {
                if (that.data.usenewspec ? that.data.specInventory > 0 : bespeakDetail[j].inventory > 0) {
                  hourArr[i].repertory = that.data.usenewspec ? that.data.specInventory : bespeakDetail[j].inventory;
                  if (yuyueData.selectedDay && (yuyueData.curDay == yuyueData.selectedDay) && (hourArr[i].text == yuyueData.selectedHour)) {
                    hourArr[i].statuStyle = "selected"; //有close,available,selected三种状态
                  } else {
                    hourArr[i].statuStyle = "available"; //有close,available,selected三种状态
                  }
                  hourArr[i].price = bespeakDetail[j].price;
                } else {
                  hourArr[i].statuStyle = "close";
                  hourArr[i].repertory = -1;
                }
                break;
              } else {
                hourArr[i].statuStyle = "close";
                hourArr[i].repertory = -1;
              }
            }
          }
          that.setData({
            "yuyueData.hourArr": hourArr
          });
        } else {
          that.setHourTime();
        }
      }
    })
  },
  bindKeyInput: function (e) {
    //console.log(e);
    //console.log(this.data.inputInfo[e.target.dataset.type]);
    var that = this;
    var trimVal = that.trim(e.detail.value);
    that.data.inputInfo[e.currentTarget.dataset.type] = trimVal;
    this.setData({
      inputInfo: that.data.inputInfo
    })
  },
  trim: function (s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  validateTel: function (tel) {
    var reg = /^1[3|4|5|7|8][0-9]{9}$/;
    var flag = reg.test(tel);
    return flag;
  },
  showAlertModal(text) {
    wx.showModal({
      showCancel: false,
      content: text
    })
  },
  add0: function (time) {
    return time < 10 ? '0' + time : time;
  },
  transDate: function (time) {
    var that = this;
    var systemDate = null;
    if (time) {
      systemDate = new Date(time);
    } else {
      systemDate = new Date();
    }
    var year = systemDate.getFullYear();
    var month = systemDate.getMonth() + 1;
    var day = systemDate.getDate();
    return [year, that.add0(month), that.add0(day)].join('-');
  },
  transWeek: function (week) {
    switch (week) {
      case 0:
        return "周日";
        break;
      case 1:
        return "周一";
        break;
      case 2:
        return "周二";
        break;
      case 3:
        return "周三";
        break;
      case 4:
        return "周四";
        break;
      case 5:
        return "周五";
        break;
      case 6:
        return "周六";
        break;
      default:
        return "";
        break;
    }
  },
  toggleQrcodeModal: function () {
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
  fetchVerifyQrcodeInfo: function () {
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
      success: function (res) {
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
  //获取上一条订单，用于回显联系人和电话
  getPreviousOrder: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/order/getPreviousOrder',
      data: {
        cusmallToken: cusmallToken,
        shopUid: that.data.app.globalData.shopuid || "",
        goodsType: 3
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data && res.data.ret == 0) {
          let parOrder = res.data.model.result;
          if (parOrder) {
            let inputInfo = that.data.inputInfo;
            inputInfo.name = parOrder.clientName;
            inputInfo.tel = parOrder.tel
            that.setData({
              previousName: parOrder.clientName,
              previousTel: parOrder.tel,
              inputInfo: inputInfo
            })
          }
        } else {

        }
      }
    })
  },
  //满减箭头点击事件
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

  }
}))
