// pages/time_discount//time_discount_order.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var commonAty = require("../../utils/atycommon.js");
var address = require('../../utils/city2-min.js');
var animation;
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var atyTimer;
var isLoading = false;
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    staticResPathTuan: cf.config.staticResPath + "/youdian/image/mobile/tuan/",
    atyTimeShutDown: { timerDay: util.numAddPreZero(0), timerHour: util.numAddPreZero(0), timerMinute: util.numAddPreZero(0), timerSecond: util.numAddPreZero(0) },
    isPay: false,
    showPageArr: [true, true],
    animationAddressMenu: {},
    addressMenuIsShow: false,
    payStatus: [false, true],
    value: [0, 0, 0],
    provinces: [],
    citys: [],
    areas: [],
    areaInfo: '',
    userName: "",
    userPhone: "",
    detailAddr: "",
    remark: "",
    goodsDetailInfo: {},
    userInfo: {},
    orderInfo: {},
    orderRetData: {},
    haveAddr: false,
    mAreaId: "",
    proId: "",
    cityId: "",
    mAddressId: "",//地址id 更新使用
    firstEdit: false,
    buyType: 1, //购买类型0拼团购买 1直接购买
    activity: {},
    getSelf: false,
    ecWayType: 1,
    getSelfTimeTxt: '',
    selfId: "",
    address: "请选择自提点"
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    console.log(typeof options.Leader);
    wx.hideShareMenu();
    that.setData({
      buyType: options.buyType,
      relationId: options.relationId || "",
      activityId: options.activityId,
      goodsId: options.goodsId,
      totalBuyCount: options.totalBuyCount
    });

    // 初始化动画变量
    var animation = wx.createAnimation({
      duration: 500,
      transformOrigin: "50% 50%",
      timingFunction: 'ease',
    })
    this.animation = animation;
    // 默认联动显示北京
    var id = address.provinces[0].id
    this.setData({
      provinces: address.provinces,
      citys: address.citys[id],
      areas: address.areas[address.citys[id][0].id],
    });
    var mallSite = wx.getStorageSync("mallSite");
    if (mallSite.getSelf) {
      that.setData({
        getSelf: mallSite.getSelf
      });
    }
    var getSelfAddr = {};
    if (mallSite.getSelfAddr) {
      getSelfAddr = JSON.parse(mallSite.getSelfAddr);
    }
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.prepareAwardOrder(options.activityId, options.goodsId, options.specRelationId, options.totalBuyCount)
      that.queryDeAddr();//获取默认地址
      util.afterPageLoad(that);

      //到店自提时间回显
      if (mallSite.getSelfTimestamp) {
        let getSelfTime = JSON.parse(mallSite.getSelfTimestamp);
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
      if (options.ecWayType) {
        that.setData({
          ecWayType: 3
        })
      }
      if (options.addressId) {
        that.setData({
          selfId: options.addressId
        })
        var lastindex = options.addressId.lastIndexOf("\)");
        var addressName = options.addressId.substring(0, lastindex + 1);
        var selfAddressId = options.addressId.substring(lastindex + 1, options.addressId.length)
        that.setData({
          address: addressName
        })
        that.getSelfAddress(selfAddressId)
      }
      that.setData({
        userInfo: app.globalData.userInfo,
        getSelfAddr: getSelfAddr
      })
    });
  },
  openShopMap() {
    var ctx = this;
    wx.openLocation({
      latitude: ctx.data.getSelfAddr.lat,
      longitude: ctx.data.getSelfAddr.lng,
    })
  },
  changeEcWayType(e) {//select send type
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
      isPay: false

    });
  },
  topPageSwitch: function (e) {
    let curTarget = e.currentTarget;
    let showPageArr = this.data.showPageArr;

    for (let idx in showPageArr) {
      if (idx == curTarget.dataset.showindex) {
        showPageArr[idx] = false;
      } else {
        showPageArr[idx] = true;
      }
    }

    this.setData({
      showPageArr: showPageArr
    });
  },
  inputName: function (e) {
    this.setData({ userName: e.detail.value });
  },
  inputPhone: function (e) {
    this.setData({ userPhone: e.detail.value });
  },
  inputDetailAddr: function (e) {
    this.setData({ detailAddr: e.detail.value });
  },
  inputRemark: function (e) {
    this.setData({ remark: e.detail.value });
  },
  saveAddr: function () {
    if (!this.data.userName || !this.data.userPhone || !this.data.detailAddr || !this.data.areaInfo) {
      wx.showModal({
        title: '提示',
        content: '信息不能为空',
        showCancel: false,

      });
      return;
    }
    this.addOrUpdate();
  },
  //选择自提点 
  onSelfAddress: function () {
    var that = this;
    var addressUrl = '/pages/selfAddress/selfAddress';
    if (that.data.goodsDetailInfo != null) {
      addressUrl += "?goodsId=" + that.data.goodsDetailInfo.id + "&specRelationId=" + that.data.specRelationId + "&buyType=" + that.data.buyType + "&type=timeDiscount&activityId=" + that.data.activityId + "&totalBuyCount=" + that.data.totalBuyCount;
    }
    wx.redirectTo({
      url: addressUrl,
    })
  },
  //回显上个订单自提地址
  getSelfAddress: function (id) {
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
      success: function (res) {
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

  // 预下单
  prepareAwardOrder: function(activityId, awardId, specRelationId, count){
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/activity/time_discount/prepareGoodsAwardOrder',
      data: {
        cusmallToken: cusmallToken,
        activityId: activityId,
        awardId: awardId,
        specRelationId: specRelationId || '',
        type: 0,
        wayType: that.data.ecWayType,
        count: count
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          let goodsDetailInfo = data.model.award;
          let ecExtendObj = JSON.parse(goodsDetailInfo.ecExtend);
          let specData = JSON.parse(goodsDetailInfo.timeDiscountGoodsAward.goods.spec);
          let specMap = {};
          let members;
          for (let key in ecExtendObj) {
            goodsDetailInfo[key] = ecExtendObj[key];
          }
          for(let n in specData){
            specMap[specData[n].specRelationId] = specData[n]
          }

          /* 配送方式判断  */
          if (goodsDetailInfo.isVirtual == 1) {
            that.setData({
              deliveryTab: false
            });
          } else if (goodsDetailInfo.wayType === "0") {
            that.setData({
              deliveryTab: true
            });
          } else if (goodsDetailInfo.wayType === "1" || goodsDetailInfo.wayType === "3") {
            that.setData({
              deliveryTab: false,
              ecWayType: goodsDetailInfo.wayType
            })
          } else if (!goodsDetailInfo.wayType && that.data.getSelf) {
            that.setData({
              deliveryTab: true
            });
          } else if (!that.data.getSelf) {
            that.setData({
              deliveryTab: false
            });
          }
          that.setData({
            goodsDetailInfo: goodsDetailInfo,
            activity: data.model.activity,
            count: data.model.count, // 购买数量
            deliveryPrice: data.model.deliveryPrice, // 运费
            discountPrice: data.model.discountPrice, // 限时折扣价
            orderPrice: data.model.orderPrice, // 单卖价
            originalPrice: data.model.originalPrice, // 原价
            specRelationId: data.model.specRelationId,
            specMap: specMap
                        
          })
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg,
            success: function (res) {
              if (res.confirm) {
              } else if (res.cancel) {
              }
            }
          });
        }

      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        that.setData({
          showPageArr: [false, true]
        });
      }
    });
  },
  changeToShopName(e) {
    this.setData({
      userName: e.detail.value
    })
  },
  changeToShopTel(e) {
    this.setData({
      userPhone: e.detail.value
    })
  },
  commitOrder: function (e) {
    var formId = e.detail.formId;
    if (isLoading) {
      wx.showToast({
        title: '请不要重复点击',
        icon: 'fail',
        duration: 2000
      });
      return;
    }

    let that = this;

    if (3 != that.data.ecWayType) {
      if (!that.data.areaInfo) {
        wx.showToast({
          title: "请添加收货信息",
          icon: "fail",
          duration: 2000
        });
        return;
      }
    }
    wx.showLoading({
      title: '加载中',
    });
    let buyType = that.data.buyType;
    let orderInfo = that.data.orderInfo;
    let custom = {
      name: that.data.userName,
      address: that.data.areaInfo + that.data.detailAddr,
      tel: that.data.userPhone,
      msg: that.data.remark
    }

    var wayType = 1;
    if (3 == that.data.ecWayType) {//电商 到店自取 信息
      if ("请选择自提点" == that.data.address) {
        wx.showToast({
          icon: 'none',
          title: '请选择自提点'
        });
        return;
      }

      if ("" == that.data.userName) {
        wx.showToast({
          icon: 'none',
          title: '请填写取货人姓名'
        });
        return;
      }
      if ("" == that.data.userPhone) {
        wx.showToast({
          icon: 'none',
          title: '请填写取货人手机'
        });
        return;
      }

      if (!util.phoneValidate(that.data.userPhone)) {
        wx.showToast({
          title: '手机号不合法！',
          icon: 'none',
          duration: 1500
        })
        return false;
      }
      wayType = 3;
      custom.address = that.data.address;
    }
    isLoading = true;
    let submitUrl = cf.config.pageDomain + '/mobile/activity/time_discount/confirmTimeDiscount'
    wx.request({
      url: submitUrl,
      data: {
        cusmallToken: cusmallToken,
        activityId: that.data.activityId,
        formId: formId,
        awardId: that.data.goodsId,
        specRelationId: that.data.specRelationId || "",
        custom: JSON.stringify(custom),
        wayType: wayType,
        count: that.data.totalBuyCount
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          let atyPayOrder = data.model.activityPayOrder;
          wx.showModal({
            title: '提示',
            content: "提交订单成功",
            showCancel: false,
            success: function (res) {
              wx.redirectTo({
                url: '/pages/time_discount/time_discount_orderpay?activityId=' + that.data.activityId + "&goodsId=" + that.data.goodsId
              })
            }
          });

        } else {
          wx.showModal({
            title: '提示',
            content: "订单提交失败:" + data.msg,
            success: function (res) {
              if (res.confirm) {
              } else if (res.cancel) {
              }
            }
          });
        }

      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        isLoading = false;
        that.setData({
          showPageArr: [false, true]
        });
      }
    });
  },
  payForOrder: function () {
    let that = this;
    if (isLoading) {
      wx.showToast({
        title: '请不要重复点击',
        icon: 'fail',
        duration: 2000
      });
      return;
    }
    isLoading = true;
    wx.showLoading({
      title: '加载中',
    });
    if (0 != that.data.orderRetData.price) {
      let orderInfo = that.data.orderInfo;
      // 新版团购支付前先校验
      that.wxPayOrder();

    } else {
      setTimeout(that.zeroOrder, 1000);

    }


  },
  wxPayOrder: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: that.data.orderRetData.goodsName,
        out_trade_no: that.data.orderRetData.orderNo,
        total_fee: that.data.orderRetData.price
      },
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let wxOrderData = data.model.wxOrderData;
          wx.requestPayment({
            'timeStamp': wxOrderData.timeStamp,
            'nonceStr': wxOrderData.nonceStr,
            'package': wxOrderData.package,
            'signType': wxOrderData.signType,
            'paySign': wxOrderData.paySign,
            'success': function (res) {
              isLoading = false;
              wx.hideLoading();
              wx.showModal({
                title: '提示',
                content: "支付成功",
                showCancel: false,
                success: function (res) {
                  if (res.confirm) {
                    if (that.data.isNewGb) {
                      wx.redirectTo({
                        url: "/pages/groupbuy/groupbuy?activityId=" + that.data.orderInfo.activityId + "&goodsid=" + that.data.goodsDetailInfo.id + (that.data.relationId ? ("&relationId=" + that.data.relationId) : "")
                      })

                    } else if (that.data.isStepGb) {
                      wx.redirectTo({
                        url: "/pages/groupbuy/groupbuyDetail?activityId=" + that.data.orderInfo.activityId + "&goodsid=" + that.data.goodsDetailInfo.id + (that.data.relationId ? ("&relationId=" + that.data.relationId) : "")
                      })

                    } else {
                      wx.redirectTo({
                        url: "/pages/orderlist/orderlist?sitetype=activity"
                      });
                    }
                  }
                }
              });
            },
            'fail': function (res) {
              isLoading = false;

              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付"
              })
            }
          });
        } else {
          isLoading = false;
          wx.showModal({
            title: '提示',
            content: data.msg + ", 或没有配置微信支付参数，无法进行支付",
            showCancel: false,
            success: function (res) {
            }
          });
        }
      },
      fail: function () {
      },
      complete: function () {
        wx.hideLoading();
      }
    });
  },
  zeroOrder: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryPayOrder',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.orderInfo.activityId,
        orderNo: that.data.orderRetData.orderNo
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;

        if (data.model.activityPayOrder.status == 1 || data.model.activityPayOrder.status == 5) {
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            content: "支付成功",
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                if (that.data.isNewGb) {
                  wx.redirectTo({
                    url: "/pages/groupbuy/groupbuy?activityId=" + that.data.orderInfo.activityId + "&goodsid=" + that.data.goodsDetailInfo.id + (that.data.relationId ? ("&relationId=" + that.data.relationId) : "")
                  })

                } else if (that.data.isStepGb) {
                  wx.redirectTo({
                    url: "/pages/groupbuy/groupbuyDetail?activityId=" + that.data.orderInfo.activityId + "&goodsid=" + that.data.goodsDetailInfo.id + (that.data.relationId ? ("&relationId=" + that.data.relationId) : "")
                  })

                } else {
                  wx.redirectTo({
                    url: "/pages/orderlist/orderlist?sitetype=activity"
                  });
                }
              }
            }
          });
        } else {
          setTimeout(that.zeroOrder, 1000);
        }

      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  // 获取默认地址
  queryDeAddr: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/address/getDefaultAddress",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          if (data.model.address) {

            let mAddr = data.model.address;
            that.setData({
              userName: mAddr.userName
            });
            that.setData({
              userPhone: mAddr.tel
            });

            that.setData({
              areaInfo: mAddr.areaName
            });
            that.setData({
              detailAddr: mAddr.address
            });

            that.setData({
              haveAddr: true
            });

          } else {
            that.setData({
              haveAddr: false
            });
            that.setData({
              firstEdit: true
            });
          }
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  addOrUpdate: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/address/addOrUpdate",
      data: {
        cusmallToken: cusmallToken,
        id: that.data.mAddressId,
        areaId: that.data.mAreaId,
        isEdit: !that.data.firstEdit,
        userName: that.data.userName,
        tel: that.data.userPhone,
        address: that.data.detailAddr,
        remark: that.data.proId + "," + that.data.cityId + "," + that.data.mAreaId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          wx.showToast({
            title: '添加地址成功',
            icon: 'success',
            duration: 2000
          });
          that.setData({
            haveAddr: true
          });
          that.setData({
            showPageArr: [false, true]
          });
        } else {
          wx.showToast({
            title: '添加地址失败',
            icon: 'fail',
            duration: 2000
          });
        }
      },
      fail: function () {
      },
      complete: function () {

      }
    });
  },
  showCountDown: function (endDate, that) {
    var now = new Date();
    let atyTimeShutDown;
    var leftTime = endDate.getTime() - now.getTime();
    if (0 >= leftTime) {
      clearInterval(atyTimer);

      atyTimeShutDown = { timerDay: util.numAddPreZero(0), timerHour: util.numAddPreZero(0), timerMinute: util.numAddPreZero(0), timerSecond: util.numAddPreZero(0) };

      that.setData({
        isPay: false
      });
      return;
    }
    var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10);//计算剩余的天数
    var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10);//计算剩余的小时数
    var mm = parseInt(leftTime / 1000 / 60 % 60, 10);//计算剩余的分钟数
    var ss = parseInt(leftTime / 1000 % 60, 10);//计算剩余的秒数

    atyTimeShutDown = { timerDay: util.numAddPreZero(dd), timerHour: util.numAddPreZero(hh), timerMinute: util.numAddPreZero(mm), timerSecond: util.numAddPreZero(ss) };

    this.setData({
      atyTimeShutDown: atyTimeShutDown
    });
  },
  // 点击所在地区弹出选择框
  selectDistrict: function (e) {
    var that = this
    // 如果已经显示，不在执行显示动画
    if (that.data.addressMenuIsShow) {
      return;
    }
    // 执行显示动画
    that.startAddressAnimation(true)
  },
  // 执行动画
  startAddressAnimation: function (isShow) {
    console.log(isShow)
    var that = this
    if (isShow) {
      // vh是用来表示尺寸的单位，高度全屏是100vh
      that.animation.translateY(0 + 'vh').step()
    } else {
      that.animation.translateY(40 + 'vh').step()
    }
    that.setData({
      animationAddressMenu: that.animation.export(),
      addressMenuIsShow: isShow,
    })
  },
  // 点击地区选择取消按钮
  cityCancel: function (e) {
    this.startAddressAnimation(false)
  },
  // 点击地区选择确定按钮
  citySure: function (e) {
    var that = this
    var city = that.data.city
    var value = that.data.value
    that.startAddressAnimation(false)
    // 将选择的城市信息显示到输入框
    console.log(value)
    var areaInfo = that.data.provinces[value[0]].name + ',' + that.data.citys[value[1]].name + ',' + that.data.areas[value[2]].name
    that.setData({
      areaInfo: areaInfo,
    });
    that.setData({
      proId: that.data.provinces[value[0]].id
    });
    that.setData({
      cityId: that.data.citys[value[1]].id
    });
    that.setData({
      mAreaId: that.data.areas[value[2]].id
    });
  },
  // 点击蒙版时取消组件的显示
  hideCitySelected: function (e) {
    console.log(e)
    this.startAddressAnimation(false)
  },
  // 处理省市县联动逻辑
  cityChange: function (e) {
    var that = this;
    var value = e.detail.value
    var provinces = this.data.provinces
    var citys = this.data.citys
    var areas = this.data.areas
    var provinceNum = value[0]
    var cityNum = value[1]
    var countyNum = value[2]
    // 如果省份选择项和之前不一样，表示滑动了省份，此时市默认是省的第一组数据，
    if (this.data.value[0] != provinceNum) {
      var id = provinces[provinceNum].id
      this.setData({
        value: [provinceNum, 0, 0],
        citys: address.citys[id],
        areas: address.areas[address.citys[id][0].id],
      })
    } else if (this.data.value[1] != cityNum) {
      // 滑动选择了第二项数据，即市，此时区显示省市对应的第一组数据
      var id = citys[cityNum].id
      this.setData({
        value: [provinceNum, cityNum, 0],
        areas: address.areas[citys[cityNum].id],
      })
    } else {
      // 滑动选择了区
      this.setData({
        value: [provinceNum, cityNum, countyNum]
      })
    }
    console.log(this.data)
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
    isLoading = false;
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
