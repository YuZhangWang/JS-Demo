var commonAty = require("../../utils/atycommon.js");
// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var Zan = require('../../youzan/dist/index');
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var atyTimer;


class GroupBuy {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }

  initProcess(data) {
    let pageCnt = this.thatContext;
    // 判断是否新版团购
    if (data.model.activity.activityType == 11){
      pageCnt.setData({
        isNewGb:true
      })
    }
    let goodsList = data.model.awardList;
    for (let i = 0; i < goodsList.length; i++) {
      let ecExtendObj = JSON.parse(goodsList[i].ecExtend);
      for (let key in ecExtendObj) {
        goodsList[i][key] = ecExtendObj[key]
      }
    }
    wx.setNavigationBarTitle({
      title: data.model.activity.activityName
    });
    let extOp = JSON.parse(data.model.activity.extendOperation);
    pageCnt.setData({
      goodsList: goodsList
    });
    pageCnt.setData({
      shareType: data.model.activityRule.shareType
    });
    pageCnt.setData({
      isShowJoin: (data.model.activity.extraData & (Math.pow(2, 0))) != 0 ? true :false
    });
    pageCnt.setData({
      isVirtualGroup : (data.model.activity.extraData & (Math.pow(2, 3))) != 0 ? true :false
    });
    pageCnt.setData({
      activity: data.model.activity
    });
    pageCnt.setData({
      imgUrls: extOp.indexSlider.split(",")
    });
    pageCnt.setData({
      wxShareTitle: extOp.wxShareTitle
    });

    pageCnt.setData({
      curUser: data.model.openUser
    });
    if (0 < data.model.activity.endTime - new Date().getTime()) {
      pageCnt.setData({
        atyIsLive: true
      });
    }
    if (2 == data.model.activity.status || 3 == data.model.activity.status || 4 == data.model.activity.status){
      pageCnt.setData({
        atyStatusTxt: "活动结束"
      });
      pageCnt.setData({
        atyIsLive: false
      });
    }else{
      atyTimer = setInterval(function () { pageCnt.showCountDown(new Date(data.model.activity.endTime), this); }, 1000);
    }
    pageCnt.getUserAvator();
  }

  myProcess() {
    let pageCnt = this.thatContext;
    pageCnt.setData({
      fromShare: false
    });
    if (pageCnt.options.orderNo) {//如果是从支付页面跳回来的 可以直接进入订单详情页面
      pageCnt.queryPayOrder(pageCnt.options.activityId, pageCnt.options.orderNo)

    } else {
      pageCnt.setData({
        showPageArr: [false, true, true, true, true, true]
      });
    }
    if (pageCnt.options.goodsid){
      pageCnt.reqAtyingGoodsDetail(pageCnt.options.activityId, pageCnt.options.goodsid, (pageCnt.options.relationId?1:0), pageCnt.options.relationId)
    }

  }

  ohterPeopleProcess() {
    let pageCnt = this.thatContext;
    let fSInfo = pageCnt.data.fromShareInfo
    pageCnt.setData({
      fromShare: true
    });
    pageCnt.reqAtyingGoodsDetail(fSInfo.activityId, "", 1, fSInfo.relationId)
  }
}
// pages/groupbuy/groupbuy.js
Page(Object.assign({}, baseHandle, Zan.Toast, {

  /**
   * 页面的初始数据
   */
  data: {
    app:app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    staticResPathTuan: cf.config.staticResPath + "/youdian/image/mobile/tuan/",
    staticResPathBargain: cf.config.staticResPath + "/youdian/image/mobile/s_bargain/",
    swtichImg: cf.config.pageDomain + "/mobile/base/activity/pathToData.do?fileUrl=",
    showPageArr: [true, true, true, true, true, true],//顶部页面显示的状态
    tuanStatuHeader: [true, true, true, true, false],//商品详情显示的状态
    tuanStatuBtn: [false, true, true, true, true, true, true, true],//商品详情底部按钮显示的状态
    mustKnowPage: true,
    showSharePage: false,
    isTxtShare: true,
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    authType:1, //拒绝授权 停留当前页
    atyStatusTxt: "距离拼团结束",
    atyTimeShutDown: { timerDay: util.numAddPreZero(0), timerHour: util.numAddPreZero(0), timerMinute: util.numAddPreZero(0), timerSecond: util.numAddPreZero(0) },
    showMyOrderPage: false,
    goodsList: [],//商品列表
    activity: {},//拼团信息
    curUser: {},//当前进入页面的用户
    goodsDetailInfo: {},
    theRelationshipDefine: {},//当前的关系定义
    fromShareInfo: {},
    showShareMask: true,
    fromShare: false,
    userInfo: {},
    winWidth: 0,
    winHeight: 0,
    // tab切换
    currentTab: 0,
    atyIsLive: true,
    myOrderListPayed: [],
    OdDetailPage: {},
    myTuanList: [],
    imgUrls: [],
    wxShareTitle: "",
    isShowJoin: false,
    avatorList:{},
    shareQrCodeUrl:"",
    shareType: "",
    cusTxt:{},
    remaintime:0,
    clock: util.formatDownTime(0)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    let cusTxt = {
      bgUrl:"bg.jpg",
      indexBuyBtnUrl: "btn_tuan.png",
      bottomLTxt:"所有宝贝",
      bottomRTxt: "我的拼团",
      detailBottomRTxt: "我要开团",
      isCust:false
    }
    if (2152 == mallSite.uid){
      cusTxt.bgUrl = "cus2152/bg2152.png";
      cusTxt.indexBuyBtnUrl = "cus2152/btn2152.png";
      cusTxt.bottomLTxt = "所有席位";
      cusTxt.bottomRTxt = "我的预约";
      cusTxt.detailBottomRTxt = "一起预约";
      cusTxt.isCust = true;
    }
    that.setData({
      cusTxt: cusTxt
    });
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }

    });
    that.data.options=options;
    if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
      that.setData({
        noAuthInfo:false
      })
    }else {
      that.setData({
        noAuthInfo:true
      })
    }
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      myProcess = new commonAty.CommonProcess(new GroupBuy(that), options, cusmallToken);
      myProcess.init();
      util.afterPageLoad(that);
    });

    that.setData({
      userInfo: app.globalData.userInfo,
      activityId:options.activityId
    })
  },
  /**
   * 滑动切换tab
   */
  bindChange: function (e) {
    var that = this;
    that.setData({ currentTab: e.detail.current });
  },
  /**
   * 点击tab切换
   */
  swichNav: function (e) {
    var that = this;
    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab: e.target.dataset.current
      })
    }
  },
  hideShareMasks: function () {
    let that = this;
    that.setData({
      showShareMask: true
    })
  },
  showShareMasks: function () {
    let that = this;
    that.setData({
      showShareMask: false
    })
  },
  topPageSwitch: function (e) {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    let curTarget = e.currentTarget;
    let showPageArr = this.data.showPageArr;

    if (1 == curTarget.dataset.showindex) {//如果进入的是我的拼团
      that.myTuanList();
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 100
      })
    }

    if (0 == curTarget.dataset.showindex) {//如果用点击主页按钮就重置标记
      that.setData({
        fromShare: false
      })
    }

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
    wx.hideLoading();
  },
  showMustKnowPage: function () {
    this.setData({ mustKnowPage: false });
  },
  hideMustKnowPage: function () {
    this.setData({ mustKnowPage: true });
  },
  showCountDown: function (endDate, that) {
    var now = new Date();
    let atyTimeShutDown;
    var leftTime = endDate.getTime() - now.getTime();
    if (0 >= leftTime) {
      clearInterval(atyTimer);
      atyTimeShutDown = { timerDay: util.numAddPreZero(0), timerHour: util.numAddPreZero(0), timerMinute: util.numAddPreZero(0), timerSecond: util.numAddPreZero(0) };
      this.setData({
        atyStatusTxt: "活动结束"
      });
      this.setData({
        atyIsLive: false
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
    this.setData({
      atyIsLive: true
    });
  },
  getUserAvator:function(){
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardRanking',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id,
        start:0,
        size:3
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        let avatorList = {};
        for(let key in data.model.records){
          if (data.model.records[key]){
            if (data.model.records[key][0]){
              avatorList["a" + key+"0"] = data.model.records[key][0].headPic;
            }else{
              avatorList["a" + key+"0"] = ""
            }
            if (data.model.records[key][1]){
              avatorList["a" + key + "1"] = data.model.records[key][1].headPic;
            }else{
              avatorList["a" + key + "1"] = "";
            }

          }

        }
        that.setData({
          avatorList: avatorList
        })
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  queryOdDetail: function (e) {
    let that = this;
    let curTarget = e.currentTarget;
    let orderNo = curTarget.dataset.orderno;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryPayOrder',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id,
        orderNo: orderNo
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        data.model.activityPayOrder.extend = JSON.parse(data.model.activityPayOrder.extend);
        data.model.activityPayOrder.orderTime = util.formatTime(new Date(data.model.activityPayOrder.orderTime));
        let OdDetailPage = {
          activity: data.model.activity,
          activityPayOrder: data.model.activityPayOrder,
          award: data.model.award
        };
        that.setData({
          OdDetailPage: OdDetailPage
        });
        that.setData({
          showMyOrderPage: false
        });
        that.setData({
          showPageArr: [true, true, true, false, true, true]
        });
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  showMyOrderPage: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryOrderList',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id,
        statu: 1
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        let list = data.model.records;
        if (!list) {
          list = [];
        }
        for (let i = 0; i < list.length; i++) {
          list[i].extend = JSON.parse(list[i].extend);
          list[i].orderTime = util.formatTime(new Date(list[i].orderTime))
        }
        that.setData({
          myOrderListPayed: list
        });
      },
      fail: function () {
      },
      complete: function () {
      }
    });

    this.setData({
      showMyOrderPage: true
    });
  },
  hideMyOrderPage: function () {
    this.setData({
      showMyOrderPage: false
    });
  },

  goodsDetailPage: function (e) {

    if (!this.checkUserInfo()) {
      return false;
    }
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    let curTarget = e.currentTarget;
    let showPageArr = this.data.showPageArr;
    let goodsid = curTarget.dataset.goodsid;
    let tuantype = curTarget.dataset.tuantype;
    let relationId = curTarget.dataset.relationid;//这个id仅用于自己查看自己的拼团信息
    let fromShare = that.data.fromShare;
    let atyIsLive = that.data.atyIsLive;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardDetail',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id,
        awardId: goodsid,
        type: tuantype,
        relationId: relationId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        let goodsDetailInfo = data.model.award;
        let goodsSlider = goodsDetailInfo.awardPicList.split(",");
        let ecExtendObj = JSON.parse(goodsDetailInfo.ecExtend);
        let poster_bg=JSON.parse(data.model.activity.extendOperation)
        if(poster_bg.poster_type==1){
          that.setData({
            Poster_bg:poster_bg.poster_bg
          })
        }
        else {
          that.setData({
            Poster_bg:''
          })
        }
        let members;
        for (let key in ecExtendObj) {
          goodsDetailInfo[key] = ecExtendObj[key];
        }
        goodsDetailInfo.goodsSlider = goodsSlider;
        goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);

        that.setData({
          theRelationshipDefine: data.model.theRelationshipDefine
        });
        //发起拼团过期时间
        if (data.model.theRelationshipDefine && data.model.theRelationshipDefine.effectTime ){
          let now = new Date();
          let theRelationshipDefine = data.model.theRelationshipDefine;

          let remaintime = (theRelationshipDefine.effectTime - now.getTime()) / 1000;
          if(remaintime > 0){
            that.setData({
              remaintime: remaintime,
              clock: util.formatDownTime(remaintime)
            })
            util.clearTimeOut();
            if (that.data.remaintime) {
              util.countDown(that);
            }
          }else{
            that.setData({
              remaintime: 0,
              clock: util.formatDownTime(0)
            })
          }


        }



        //tuanStatuHeader
        if (false == data.model.isProcessing) {
          that.setData({
            tuanStatuHeader: [false, true, true, true, true]
          });
          //tuanStatuBtn 拼团下面的菜单
          that.setData({
            tuanStatuBtn: [false, true, true, true, true, true, true, true]
          });
          goodsDetailInfo.membersNum = 0;
        } else {
          members = data.model.members;
          goodsDetailInfo.membersNum = members.length;

          if (!fromShare) {//非链接进来
            if (members.length == goodsDetailInfo.offeredLimitNum) {//团员已满  自己拼团成功
              that.setData({//tuanStatuHeader 拼团上面的文字
                tuanStatuHeader: [true, true, true, true, false]
              });
              //tuanStatuBtn 拼团下面的菜单
              if (data.model.isPay) {
                that.setData({
                  tuanStatuBtn: [true, true, true, true, true, true, true, true]
                });
              } else {
                that.setData({
                  tuanStatuBtn: [true, true, true, true, true, false, true, true]
                });
              }

            } else {//团员未满
              for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
                members.push({});
              }
              that.setData({//tuanStatuHeader 拼团上面的文字
                tuanStatuHeader: [true, true, true, false, true]
              });
              //tuanStatuBtn 拼团下面的菜单
              that.setData({
                tuanStatuBtn: [true, false, true, true, true, true, true, true]
              });
            }
          }

        }

        if (0 == goodsDetailInfo.sendNum) {//如果没有库存了
          //tuanStatuBtn 拼团下面的菜单
          that.setData({
            tuanStatuBtn: [true, true, true, true, true, true, false, true]
          });
        }

        if (!atyIsLive) {//如果活动已经结束
          //tuanStatuBtn 拼团下面的菜单
          that.setData({
            tuanStatuBtn: [true, true, true, true, true, true, true, false]
          });
        }

        goodsDetailInfo.members = members;
        that.setData({
          goodsDetailInfo: goodsDetailInfo
        });
      },
      fail: function () {
      },
      complete: function () {
        for (let idx in showPageArr) {
          if (idx == curTarget.dataset.showindex) {
            showPageArr[idx] = false;
          } else {
            showPageArr[idx] = true;
          }
        }
        that.setData({
          showPageArr: showPageArr
        });
        wx.hideLoading();
      }
    });
  },
  reqAtyingGoodsDetail: function (activityid, awardsTypeId, atyType, relationid,statu,cb) {
    wx.showLoading({
      title: '加载中',
    });
    // 拼团过期 statu = 3
    if(statu == 3){
      atyType = 0;
      relationid = "";
    }
    let that = this;
    let fromShare = that.data.fromShare;
    let atyIsLive = that.data.atyIsLive;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardDetail',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityid,
        awardId: awardsTypeId,
        type: atyType,
        relationId: relationid
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          let goodsDetailInfo = data.model.award;
          let goodsSlider = goodsDetailInfo.awardPicList.split(",");
          let ecExtendObj = JSON.parse(goodsDetailInfo.ecExtend);
          let members;
          let poster_bg2=JSON.parse(data.model.activity.extendOperation)
          if(poster_bg2.poster_type==1){
            that.setData({
                Poster_bg:poster_bg2.poster_bg
            })
          }
          else {
            that.setData({
                Poster_bg:''
            })
          }
          for (let key in ecExtendObj) {
            goodsDetailInfo[key] = ecExtendObj[key];
          }
          goodsDetailInfo.goodsSlider = goodsSlider;
          goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);

          that.setData({
            theRelationshipDefine: data.model.theRelationshipDefine
          });
          //发起拼团过期时间
          if (data.model.theRelationshipDefine && data.model.theRelationshipDefine.effectTime ) {
            let now = new Date();
            let theRelationshipDefine = data.model.theRelationshipDefine;
            let remaintime = (theRelationshipDefine.effectTime - now.getTime()) / 1000;
            if(remaintime > 0){
              that.setData({
                remaintime: remaintime,
                clock: util.formatDownTime(remaintime)
              })
            }else {
              that.data.activeDated = true;
            }
            util.clearTimeOut();
            if (that.data.remaintime > 0) {
              util.countDown(that);
            } else {

            }

          }
          //tuanStatuHeader
          if (false == data.model.isProcessing) {
            that.setData({
              tuanStatuHeader: [false, true, true, true, true]
            });
            //tuanStatuBtn 拼团下面的菜单
            that.setData({
              tuanStatuBtn: [false, true, true, true, true, true, true, true]
            });
            goodsDetailInfo.membersNum = 0;
            members = data.model.members;
            // that.setData({//tuanStatuHeader 拼团上面的文字
            //   tuanStatuHeader: [true, true, true, true, false]
            // });
            // //tuanStatuBtn 拼团下面的菜单
            // if (that.data.isNewGb) {
            //   that.setData({
            //     tuanStatuBtn: [true, true, true, true, true, true, false, true]
            //   });
            // } else {
            //   that.setData({
            //     tuanStatuBtn: [true, true, true, true, true, false, true, true]
            //   });
            // }
            if (that.data.activeDated && that.data.isVirtualGroup) {  // 拼团时间已过且开启了虚拟拼团
              for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
                members.push({headPic: that.data.staticResPathTuan + 'virtual/' + (Math.random() * 20).toFixed(0) + '.png'});
              }
            }
            // if (members.length == goodsDetailInfo.offeredLimitNum) {//团员已满  自己拼团成功 团长看到的
            //
            // }else {//团员未满
            //   /* 分为：是否开启虚拟拼团 */
            //   if (that.data.activeDated && that.data.isVirtualGroup) {  // 拼团时间已过且开启了虚拟拼团
            //     for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
            //       members.push({headPic:that.data.staticResPathTuan+'virtual/'+(Math.random()*20).toFixed(0)+'.png'});
            //     }
            //     that.setData({//tuanStatuHeader 拼团上面的文字
            //       tuanStatuHeader: [true, true, true, true, false]
            //     });
            //     //tuanStatuBtn 拼团下面的菜单
            //     if (that.data.isNewGb) {
            //       that.setData({
            //         tuanStatuBtn: [true, true, true, true, true, true, false, true]
            //       });
            //     } else {
            //       that.setData({
            //         tuanStatuBtn: [true, true, true, true, true, false, true, true]
            //       });
            //     }
            //   }
            //
            // }
          } else {
            members = data.model.members;
            goodsDetailInfo.membersNum = members.length;
            if (!fromShare) {//非链接进来
              if (members.length == goodsDetailInfo.offeredLimitNum) {//团员已满  自己拼团成功 团长看到的
                that.setData({//tuanStatuHeader 拼团上面的文字
                  tuanStatuHeader: [true, true, true, true, false]
                });
                //tuanStatuBtn 拼团下面的菜单
                if (data.model.isPay) {
                  that.setData({
                    tuanStatuBtn: [true, true, true, true, true, true, true, true]
                  });
                } else {
                  that.setData({
                    tuanStatuBtn: [true, true, true, true, true, false, true, true]
                  });
                }
              } else {//团员未满
                /* 分为：是否开启虚拟拼团 */
                if (that.data.activeDated && that.data.isVirtualGroup) {  // 拼团时间已过且开启了虚拟拼团
                  for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
                    members.push({headPic:that.data.staticResPathTuan+'virtual/'+(Math.random()*20).toFixed(0)+'.png'});
                  }
                  that.setData({//tuanStatuHeader 拼团上面的文字
                    tuanStatuHeader: [true, true, true, true, false]
                  });
                  //tuanStatuBtn 拼团下面的菜单
                  that.setData({
                    tuanStatuBtn: [false, true, true, true, true, true, true, true]
                  });
                }else {
                  for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
                    members.push({});
                  }
                  that.setData({//tuanStatuHeader 拼团上面的文字
                    tuanStatuHeader: [true, true, true, false, true]
                  });
                  //tuanStatuBtn 拼团下面的菜单
                  that.setData({
                    tuanStatuBtn: [true, false, true, true, true, true, true, true]
                  });
                }

              }
            } else {//非团长看到
              if (members.length == goodsDetailInfo.offeredLimitNum) {//团员已满  自己拼团成功 团长看到的
                if (data.model.isIn) {//团员有关系进入且满员
                  that.setData({//tuanStatuHeader 拼团上面的文字
                    tuanStatuHeader: [true, true, true, true, false]
                  });

                  //tuanStatuBtn 拼团下面的菜单
                  that.setData({
                    tuanStatuBtn: [true, true, true, true, true, false, true, true]
                  });

                } else {//团员没关系进入且满员
                  that.setData({//tuanStatuHeader 拼团上面的文字
                    tuanStatuHeader: [true, true, false, true, true]
                  });
                  //tuanStatuBtn 拼团下面的菜单
                  that.setData({
                    tuanStatuBtn: [true, true, true, true, false, true, true, true]
                  });
                }
              } else {//团员未满
                /* 分为：是否开启虚拟拼团 */
                if (that.data.activeDated && that.data.isVirtualGroup) {  // 拼团时间已过且开启了虚拟拼团
                  for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
                    members.push({headPic:that.data.staticResPathTuan+'virtual/'+(Math.random()*20).toFixed(0)+'.png'});
                  }
                  that.setData({//tuanStatuHeader 拼团上面的文字
                    tuanStatuHeader: [true, true, true, true, false]
                  });
                  //tuanStatuBtn 拼团下面的菜单
                  that.setData({
                    tuanStatuBtn: [false, true, true, true, true, true, true, true]
                  });
                } else {
                  for (let i = members.length; i < goodsDetailInfo.offeredLimitNum; i++) {
                    members.push({});
                  }
                  if (data.model.isIn) {//有关系团员
                    that.setData({//tuanStatuHeader 拼团上面的文字
                      tuanStatuHeader: [true, true, true, false, true]
                    });
                    //tuanStatuBtn 拼团下面的菜单
                    that.setData({
                      tuanStatuBtn: [true, true, false, true, true, true, true, true]
                    });
                  } else {//无关系
                    that.setData({//tuanStatuHeader 拼团上面的文字
                      tuanStatuHeader: [true, true, true, false, true]
                    });
                    //tuanStatuBtn 拼团下面的菜单
                    that.setData({
                      tuanStatuBtn: [true, true, true, false, true, true, true, true]
                    });
                  }
                }
              }
            }

            if (0 == goodsDetailInfo.sendNum) {//如果没有库存了
              //tuanStatuBtn 拼团下面的菜单
              that.setData({
                tuanStatuBtn: [true, true, true, true, true, true, false, true]
              });
            }

            if (!atyIsLive) {//如果活动已经结束
              //tuanStatuBtn 拼团下面的菜单
              that.setData({
                tuanStatuBtn: [true, true, true, true, true, true, true, false]
              });
            }
          }
          goodsDetailInfo.members = members;
          that.setData({
            goodsDetailInfo: goodsDetailInfo
          });
          cb && cb();
        }

      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        that.setData({
          showPageArr: [true, true, false, true, true, true]
        });

      }
    });
  },

  startTuan: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    let curTarget = e.currentTarget;
    let goodsid = curTarget.dataset.goodsid;
    let formId = e.detail.formId;
    let theReDe = that.data.theRelationshipDefine;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'yingxiao',
        msgcode: "3001"
      },
      {
        name: 'yingxiao',
        msgcode: "3002"
      }]),
      function (resp) {
        console.log(resp)
        if (that.data.isNewGb) {
          // 新版团购
          wx.request({
            url: cf.config.pageDomain + '/mobile/base/activity/busi/startNewGroupon',
            data: {
              cusmallToken: cusmallToken,
              activityid: that.data.activity.id,
              awardId: goodsid,
              formId: formId
            },
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
              wx.hideLoading();
              let data = res.data;
              if (data && 0 == data.ret) {
                wx.redirectTo({
                  url: "/pages/groupbuy/groupbuypay?activityId=" + that.data.activity.id + "&goodsId=" + goodsid + "&relationId=" + (theReDe && theReDe.statu != 2 ? theReDe.relationId : "") + "&buyType=0&Leader=true"
                });
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
            fail: function (e) {
              wx.hideLoading();

            },
            complete: function () {
            }
          });
        } else {
          wx.request({
            url: cf.config.pageDomain + '/mobile/base/activity/busi/start',
            data: {
              cusmallToken: cusmallToken,
              activityid: that.data.activity.id,
              awardId: goodsid,
              formId: formId
            },
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
              wx.hideLoading();

              let data = res.data;
              if (data && 0 == data.ret) {
                that.showZanToast('开团成功，快叫小伙伴参团吧~', 1000);
                setTimeout(function () {
                  let uReShip = data.model.userRelationship;
                  that.reqAtyingGoodsDetail(uReShip.activityId, uReShip.awardId, 1, uReShip.relationId, function () {
                    that.setData({
                      "scrollToView": "tuan_statu_box"
                    })
                    wx.pageScrollTo({
                      scrollTop: 460,
                      duration: 100
                    })
                  });
                }, 1200);
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
            fail: function (e) {
              wx.hideLoading();

            },
            complete: function () {

            }
          });
        }


      });

  },
  helpTuan: function () {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    let fromShareInfo = this.data.fromShareInfo;
    let goodsid = that.data.goodsDetailInfo.id;
    if (!fromShareInfo.relationId || !fromShareInfo.activityId) {
      wx.showToast({
        title: "参数错误参团失败",
        icon: 'success',
        duration: 3000
      });
      return;
    }
    wx.showLoading({
      title: '加载中',
    });

    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/help',
      data: {
        cusmallToken: cusmallToken,
        activityid: fromShareInfo.activityId,
        relationId: fromShareInfo.relationId
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        let data = res.data;
        if (data && 0 == data.ret) {
          if(that.data.isNewGb){
            wx.redirectTo({
              url: "/pages/groupbuy/groupbuypay?activityId=" + that.data.activity.id + "&goodsId=" + goodsid + "&relationId=" + fromShareInfo.relationId+"&buyType=0"
            });
          } else {
            wx.showToast({
              title: "参团成功",
              icon: 'success',
              duration: 3000
            });
            that.reqAtyingGoodsDetail(fromShareInfo.activityId, "", 1, fromShareInfo.relationId);
          }
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

      }
    });
  },
  goToPay: function () {//拼团购买
    if (!this.checkUserInfo()) {
      return false;
    }
    let tRD = this.data.theRelationshipDefine;
    if (!tRD.relationId) {
      wx.showModal({
        title: '提示',
        content: "支付参数错误",
        success: function (res) {
          if (res.confirm) {
          } else if (res.cancel) {
          }
        }
      });
      return;
    }
    wx.redirectTo({
      url: "/pages/groupbuy/groupbuypay?activityId=" + tRD.activityId + "&goodsId=" + tRD.awardId + "&relationId=" + tRD.relationId + "&buyType=0"
    });
  },
  goToDetail() {
    let orderid = e.target.dataset.orderid;
    wx.navigateTo({
      url: that.data.orderInfoUrl + '?orderid=' + orderid + ''
    })
  },
  goToPayOhterBtn: function (e) {//拼团购买
    console.log(e);
    if (!this.checkUserInfo()) {
      return false;
    }
    let target = e.currentTarget;
    let atyId = target.dataset.atyid;
    let orderno = target.dataset.orderno;
    let goodsId = target.dataset.goodsid;
    let reid = target.dataset.reid;
    // wx.redirectTo({
    //   url: "/pages/groupbuy/groupbuypay?activityId=" + atyId + "&goodsId=" + goodsId  + "&buyType=1&relationId="+reid
    // });
    if(target.dataset.type=='detail'){
      wx.navigateTo({
        url: '/pages/orderinfo/orderinfo?orderid='+orderno+''
      })
    }
    else {
      wx.redirectTo({
        // url: "/pages/groupbuy/groupbuypay?activityId=" + atyId + "&goodsId=" + goodsId  + "&buyType=0"
        url: "/pages/groupbuy/groupbuypay?activityId=" + atyId + "&goodsId=" + goodsId  + "&buyType=1&relationId="+reid
      });
    }

  },
  originPriceBuy: function () {//直接购买

    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    let goodsInfo = that.data.goodsDetailInfo;

    wx.redirectTo({
      url: "/pages/groupbuy/groupbuypay?activityId=" + goodsInfo.activityId + "&goodsId=" + goodsInfo.id + "&buyType=1"
    });
  },
  queryPayOrder: function (activityId, orderNo) {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryPayOrder',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityId,
        orderNo: orderNo
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        data.model.activityPayOrder.extend = JSON.parse(data.model.activityPayOrder.extend);
        data.model.activityPayOrder.orderTime = util.formatTime(new Date(data.model.activityPayOrder.orderTime));
        let OdDetailPage = {
          activity: data.model.activity,
          activityPayOrder: data.model.activityPayOrder,
          award: data.model.award
        };
        that.setData({
          OdDetailPage: OdDetailPage
        });
        that.setData({
          showMyOrderPage: false
        });
        that.setData({
          showPageArr: [true, true, true, false, true, true]
        });

      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  // shareTuan: function(){
  //   let that = this;
  //   // that.setData({
  //   //   showSharePage:true
  //   // });
  // },
  hideShareActPage: function () {
    let that = this;
    that.setData({
      showSharePage: false
    });
  },
  myTuanList: function () {
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAllJoin',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let myTuanList = data.model.records;
          if (!myTuanList) {
            myTuanList = [];
          }
          for (let i = 0; i < myTuanList.length; i++) {
            myTuanList[i].award.ecExtend = JSON.parse(myTuanList[i].award.ecExtend);
            myTuanList[i].relationshipDefine.createTime = util.formatTime(new Date(myTuanList[i].relationshipDefine.createTime));
          }
          that.setData({
            myTuanList: myTuanList
          })
        }
      },
      fail: function () {
      },
      complete: function () {
        wx.hideLoading();
      }
    });

  },
  queryTuanDetail: function (e) {
    let that = this;
    let curTarget = e.currentTarget;
    let reid = curTarget.dataset.reid;
    let statu = curTarget.dataset.statu;
    let awardId = curTarget.dataset.awardid;
    if(that.data.isNewGb && statu == 3 ){
      that.reqAtyingGoodsDetail(that.data.activity.id, awardId, 1, reid, 3)

    }else{
      that.reqAtyingGoodsDetail(that.data.activity.id, "", 1, reid)
    }

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
  shareByQRCode: function () {
    wx.showLoading({
      title: '加载中',
    });
    //拿qrcode链接
    let that = this;
    let theReDe = that.data.theRelationshipDefine;
    let fromShareInfo = that.data.fromShareInfo;
    let scene = {};
    let goodsDetailInfo = that.data.goodsDetailInfo;
    if (theReDe && theReDe.relationId) {
      scene.fromOpenId = theReDe.sponsorOpenid;
      scene.relationId = theReDe.relationId;
    } else if (fromShareInfo && fromShareInfo.relationId) {
      scene.fromOpenId = fromShareInfo.formOpenId;
      scene.relationId = fromShareInfo.relationId;
    }else {
      wx.hideLoading();
      wx.showModal({
        title: '提示',
        content: "参数错误",
        showCancel: false,
        success: function (res) {
          if (res.confirm) {
          } else if (res.cancel) {
          }
        }
      });
      return ;
    }
    let page = "pages/groupbuy/groupbuy";
    let qrcodeUrl = cf.config.pageDomain + "/mobile/base/activity/getQrcode.do?page=" + page +"&activityid=" + that.data.activity.id + "&scene=" + JSON.stringify(scene)
    //拿qrcode链接
    let context = wx.createCanvasContext("canvasGB")
    let scrWidth, scrHeight;
    wx.getSystemInfo({
      success: function (res) {
        scrWidth = res.screenWidth;
        scrHeight = res.screenHeight;
      }
    });
    let drawWidth = scrWidth * 1.4;
    let drawHeight = drawWidth * 100 / 66;
    let unit = drawWidth / 20.5;
    if (goodsDetailInfo.awardName.length >= 17) {
      goodsDetailInfo.awardName = goodsDetailInfo.awardName.substring(0, 17) + "...";
    }
    let drawBackground
    console.log(goodsDetailInfo)
    if(that.data.Poster_bg){
      drawBackground=that.data.swtichImg +that.data.userImagePath + that.data.Poster_bg
    }
    else {
      drawBackground=that.data.swtichImg +that.data.staticResPathTuan + "tuan-bg.png"
    }
    let drawEle = [
      { type: "img", url: drawBackground, x: 0, y: 0, width: drawWidth, height: drawHeight },

      { type: "img", url: that.data.swtichImg +that.data.staticResPathTuan + "tuan-bg2.png", x: unit, y: unit*1.2, width: drawWidth*0.90, height: drawHeight*0.92 },

      { type: "img", url: that.data.swtichImg+that.data.userImagePath + goodsDetailInfo.awardPic, x: unit*1.8, y: unit*2.0, width: drawWidth*0.82, height: unit * 15 },
      { type: "img", url: that.data.swtichImg +that.data.staticResPathTuan + "people.png", x: unit*1.4, y: unit*2.4, width: 122, height: 53 },
      { type: "txt", color: "#ffffff", text: goodsDetailInfo.offeredLimitNum + "人团", fontSize:unit*1, x: unit*2.2, y: unit*3.6, },

      // { type: "img", url: that.data.swtichImg+that.data.userImagePath + goodsDetailInfo.awardPic, x: (drawWidth/2 - unit*6), y: unit * 0.5, width: unit * 12, height: unit * 12 },
      // { type: "rect", color: "rgba(0,0,0,0.8)", x: 0, y: unit * 13, width: drawWidth, height: unit*1.4 },
      { type: "txt", color: "#2d2d2d", text: goodsDetailInfo.awardName, fontSize: unit * 1, x: unit * 1.8, y: unit * 19.05, },
      { type: "txt", color: "#ff2d2d", text: that.data.app.globalData.currencySymbol, fontSize: unit * 1, x: unit * 1.8, y: unit * 21.25, },
      { type: "txt", color: "#ff2d2d", text:(goodsDetailInfo.activityPrice / 100).toFixed(2), fontSize: unit * 1.5, x: unit * 2.72, y: unit * 21.25, },
      { type: "img", url: that.data.swtichImg +that.data.staticResPathTuan + "price-bg.png", x: unit * 6.96 , y: unit * 20.25, width: 92, height: 32 },
      { type: "txt", color: "#ffffff", text:"团购价", fontSize: unit * 0.8, x: unit * 7.60, y: unit * 21.14, },
      { type: "txt", color: "#747474", text: that.data.app.globalData.currencySymbol+(goodsDetailInfo.originalPrice / 100).toFixed(2), fontSize: unit * 1, x: unit * 11.08, y: unit * 21.25, },
      { type: "deleteLine", color: "#747474", x: 11.2 * unit, y: 20.88 * unit, toX: unit * 14.00, toY: 20.88 * unit },

      { type: "imgCircle", url: util.tinyWxHeadImg(theReDe.headPic), x: unit * 1.8, y: unit * 23.7, width: unit * 1.5, height: unit * 1.5 },
      { type: "txt", color: "#414141", text: theReDe.nickName, fontSize: unit * 0.8, x: unit * 3.7, y: unit * 24.76 },
      { type: "img", url: that.data.swtichImg +that.data.staticResPathTuan + "pop-text.png", x: unit * 1.50, y: unit * 25.6, width: unit * 10.11, height: unit*3.4 },
      { type: "txt", color: "#414141", text: "数量有限，立即扫码", fontSize: unit * 0.9, x: unit * 2.5, y: unit * 27.00 },
      { type: "txt", color: "#414141", text: "跟我们一起拼团吧！", fontSize: unit * 0.9, x: unit * 2.5, y: unit * 28.42 },
      { type: "base64Img", url: qrcodeUrl, x: unit * 13.45, y: unit *24.0, width: unit * 4.7, height: unit * 4.7 }
    ]
    let callback = function () {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight,
        destWidth: drawWidth*3,
        destHeight: drawHeight*3,
        canvasId: "canvasGB",
        success: function (res) {
          that.setData({
            shareQrCodeUrl: res.tempFilePath
          });
          wx.previewImage({
            current: res.tempFilePath, // 当前显示图片的http链接
            urls: [res.tempFilePath] // 需要预览的图片http链接列表
          });
          wx.hideLoading();
        },
        fail: function (e) {
          wx.hideLoading();
          wx.showToast({
            title: e.errMsg,
            icon: 'fail',
            duration: 2000
          })
        }
      });
    }
    console.log(drawEle)
    util.drawPoster(context, drawEle, drawWidth, drawHeight, callback);
  },
  share1: function(){
  },
  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
    let that = this;
    let theReDe = that.data.theRelationshipDefine;
    let shareObj = {};
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
    let fromShareInfo = that.data.fromShareInfo;
    let actPrice = parseFloat(parseFloat(that.data.goodsDetailInfo.activityPrice) / 100).toFixed(2);
    let buyerName = that.data.curUser.nickName;
    let goodsName = that.data.goodsDetailInfo.awardName || that.data.goodsList[0].awardName;
    let title = "";
    if (that.data.wxShareTitle) {
    	title = that.data.wxShareTitle.replace(/@BN@/g, buyerName).replace(/@GN@/g, goodsName);
    }
    if (theReDe && theReDe.relationId) {
      shareObj = {
        title: title || ("快来" + actPrice + "元拼" + goodsName),
        path: "/pages/groupbuy/groupbuy?activityId=" + theReDe.activityId + "&fromOpenId=" + theReDe.sponsorOpenid + "&relationId=" + theReDe.relationId,
        imageUrl: imageUrl,
        success: function (res) { // 成功
        },
        fail: function (res) { // 失败
        }
      };
    } else if (fromShareInfo && fromShareInfo.relationId) {
      shareObj = {
        title: title || ("快来" + actPrice + "元拼" + goodsName),
        path: "/pages/groupbuy/groupbuy?activityId=" + fromShareInfo.activityId + "&fromOpenId=" + fromShareInfo.formOpenId + "&relationId=" + fromShareInfo.relationId,
        imageUrl: imageUrl,
        success: function (res) { // 成功
        },
        fail: function (res) { // 失败
        }
      };
    } else if (false == that.data.showPageArr[2]) {//仅仅是把拼团商品 活动分享出去 并没开团
      shareObj = {
        title: title || ("快来" + actPrice + "元拼" + goodsName),
        path: "/pages/groupbuy/groupbuy?activityId=" + that.data.activityId + "&showpage=goodsdetail&goodsid=" + that.data.goodsDetailInfo.id,
        imageUrl: imageUrl,
        success: function (res) { // 成功
        },
        fail: function (res) { // 失败
        }
      };
    } else {
      shareObj = {
        title: title || that.data.activity.activityName,
        path: "/pages/groupbuy/groupbuy?activityId=" + that.data.activityId,
        imageUrl: imageUrl,
        success: function (res) {
        },
        fail: function (res) { // 失败
        }
      };
    }
    return shareObj;
  }
}))
