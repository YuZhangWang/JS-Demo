// pages/sbargain/atyOrderPay.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var commonAty = require("../../utils/atycommon.js");
var address = require('../../utils/city2-min.js');
var baseHandle = require("../template/baseHandle.js");
var animation;
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var atyTimer;
var isLoading = false;
// pages/groupbuy/groupbuypay.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    staticResPathBargain: cf.config.staticResPath + "/youdian/image/mobile/s_bargain/",
    staticResPathTuan: cf.config.staticResPath + "/youdian/image/mobile/tuan/",
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
    theRelationshipDefine: {},
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
    tipMask: true,
    tipMaskTxt: "",
    getSelf: false,//是否开启到店
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
    isLoading = false;
    wx.hideShareMenu();
    if (options.buyType){
      that.setData({
        buyType: options.buyType
      });
    }

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
    if(mallSite.getSelf){
      that.setData({
        getSelf: mallSite.getSelf
      });
    }
    var getSelfAddr = {};
    if (mallSite.getSelfAddr) {
      getSelfAddr = JSON.parse(mallSite.getSelfAddr);
    }
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.reqAtyingGoodsDetail(options.activityId, options.goodsId);
      // that.reqAtyingGoodsDetail("4DFFE9D18F5E42EA9889A760CA3362DC", 16, "827099F80FDA42FFB9E9E4E68320A034");
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
      that.queryDeAddr();//获取默认地址
      util.afterPageLoad(that);
      // //到店自提时间回显
      // if (mallSite.getSelfTimestamp) {
      //   let getSelfTime = JSON.parse(mallSite.getSelfTimestamp);
      //   let startHour = getSelfTime.startHour;
      //   let startMin = getSelfTime.startMin;
      //   let endHour = getSelfTime.endHour;
      //   let endMin = getSelfTime.endMin;
      //   if (startHour && startMin && endHour && endMin) {
      //     that.setData({
      //       getSelfTime: getSelfTime,
      //       getSelfTimeTxt: startHour + ":" + startMin + " 至 " + endHour + ":" + endMin
      //     });
      //   }
      // }
      that.setData({
        userInfo: app.globalData.userInfo,
        getSelfAddr: getSelfAddr
      })
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
      isPay:false
    });

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
  reqAtyingGoodsDetail: function (activityId, awardsTypeId) {
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/queryAwardDetail',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityId,
        awardId: awardsTypeId
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
          let members;
          for (let key in ecExtendObj) {
            goodsDetailInfo[key] = ecExtendObj[key];
          }
          goodsDetailInfo.barCount = data.model.barCount;
          that.setData({
            activity: data.model.activity
          })
          that.setData({
            theRelationshipDefine: data.model.theRelationshipDefine
          });
          /* 配送方式判断  */
          if(goodsDetailInfo.isVirtual==1){
            that.setData({
              deliveryTab:false
            });
          }
          else if (goodsDetailInfo.wayType==="0") {
            that.setData({
              deliveryTab:true
            });
          }else if (goodsDetailInfo.wayType==="1" || goodsDetailInfo.wayType==="3") {
            that.setData({
              deliveryTab: false,
              ecWayType:goodsDetailInfo.wayType
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
            goodsDetailInfo: goodsDetailInfo
          });

          that.setData({
            orderInfo: {
              activityId: activityId,
              awardsTypeId: awardsTypeId
            }
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
    if (isLoading) {
      wx.showToast({
        title: '请不要重复点击',
        icon: 'fail',
        duration: 2000
      });
      return;
    }

    let that = this;
    if (3 != that.data.ecWayType){
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
    //到店自提时间校验
    // if (3 == that.data.ecWayType && that.data.getSelfTime) {
    //   let getSelfTime = that.data.getSelfTime;
    //   var now = new Date();
    //   custom.address = that.data.getSelfAddr.mapAddress;
    //   if (now.getHours() < parseInt(getSelfTime.startHour) || now.getHours() > parseInt(getSelfTime.endHour)) {
    //     wx.showModal({
    //       showCancel: false,
    //       content: "现在不是商家到店自提的时间段，无法提交订单哦！"
    //     });
    //     return;
    //   }
    //   if (now.getHours() == parseInt(getSelfTime.startHour) && now.getMinutes() < parseInt(getSelfTime.startMin)) {
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
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/confirmSeckillOrder',
      data: {
        cusmallToken: cusmallToken,
        activityid: orderInfo.activityId,
        awardId: orderInfo.awardsTypeId,
        type: 0,//秒杀购买
        custom: JSON.stringify(custom),
        wayType:wayType
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          let atyPayOrder = data.model.activityPayOrder;
          that.setData({
            payStatus: [true, false]
          });
          that.setData({
            orderRetData: {
              goodsName: atyPayOrder.goodsName,
              orderNo: atyPayOrder.orderNo,
              price: atyPayOrder.orderAmount
            }
          })

          let disTime = Math.ceil((data.model.activityPayOrder.effectTime - data.model.activityPayOrder.orderTime) / 1000 / 60);
          that.setData({
            tipMaskTxt: "已经为您保留库存，" + disTime + "分钟内未付款将释放库存。"
          });
          that.setData({
            tipMask: false
          });
          that.setData({
            isPay: true
          });
          isLoading = false;
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
  //选择自提点
  onSelfAddress: function () {
    var that = this;
    var addressUrl = '/pages/selfAddress/selfAddress';
    if (that.data.goodsDetailInfo != null) {
      addressUrl += "?goodsId=" + that.data.goodsDetailInfo.id + "&type=skill&activityId=" + that.data.orderInfo.activityId;
    }
    wx.redirectTo({
      url: addressUrl,
    })
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
      wx.request({
        url: cf.config.pageDomain + "/mobile/base/activity/busi/checkContinuePay",
        data: {
          cusmallToken: cusmallToken,
          orderNo: that.data.orderRetData.orderNo
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          let data = res.data;
          if (data && 0 == data.ret && data.model.flag) {
            that.wxPayOrder();
          } else {
            wx.showToast({
              title: '很遗憾，该订单已超时，请重新下单！',
              icon: "none",
              duration: 2000
            });
            isLoading = false;
          }
        },
        fail: function () {
        },
        complete: function () {

        }
      });
    } else {
      setTimeout(that.zeroOrder, 1000);

    }


  },

  wxPayOrder: function () {
    var that = this;
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
              wx.showModal({
                title: '提示',
                content: "支付成功",
                showCancel: false,
                success: function (res) {
                  if (res.confirm) {
                    wx.redirectTo({
                      url: "/pages/orderlist/orderlist?sitetype=activity"
                    });
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

        if (data.model.activityPayOrder.status == 1) {
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            content: "支付成功",
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                wx.redirectTo({
                  url: "/pages/orderlist/orderlist?sitetype=activity"
                });
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

  },
  maskHide: function () {
    this.setData({
      tipMask: true
    })
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
