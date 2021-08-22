var commonAty = require("../../utils/atycommon.js");
// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var atyTimer;

class SBargain {
  /*传入上下文 */
  constructor(thatContext) {
    this.thatContext = thatContext;
  }
  initProcess(data) {

    let pageCnt = this.thatContext;
    let goodsList = data.model.awardList;
    for (let i = 0; i < goodsList.length; i++) {
      let ecExtendObj = JSON.parse(goodsList[i].ecExtend);
      for (let key in ecExtendObj) {
        goodsList[i][key] = ecExtendObj[key]
      }
    }
    wx.setNavigationBarTitle({
      title: data.model.activity.activityName,

    });

    let extOp = JSON.parse(data.model.activity.extendOperation);

    pageCnt.setData({
      userVisit: ((parseInt(data.model.activity.extraData) & (Math.pow(2, 0))) != 0) ? true : false
    });
    pageCnt.setData({
      shareType: data.model.activityRule.shareType,
      rules: data.model.activity.rule.split("<br/>")
    });

    pageCnt.setData({
      rankList: ((parseInt(data.model.activity.extraData) & (Math.pow(2, 1))) != 0) ? true : false
    });
    pageCnt.setData({
      goodsList: goodsList
    });
    pageCnt.setData({
      indexSlider: extOp.indexSlider.split(",")
    });
    pageCnt.setData({
      wxShareTitle: extOp.wxShareTitle
    });
    pageCnt.setData({
      activity: data.model.activity
    });
    pageCnt.setData({
      curUser: data.model.openUser
    });

    if (0 < data.model.activity.endTime - new Date().getTime()) {
      pageCnt.setData({
        atyIsLive: true
      });
    }
    if (2 == data.model.activity.status || 3 == data.model.activity.status || 4 == data.model.activity.status) {

      pageCnt.setData({
        atyIsLive: false
      });

      pageCnt.setData({
        indexHeaderSta: [true, false]
      });
    } else {
      atyTimer = setInterval(function () { pageCnt.showCountDown(new Date(data.model.activity.endTime), this); }, 1000);
      pageCnt.setData({
        indexHeaderSta: [false, true]
      });
    }
  }


  myProcess() {
    let pageCnt = this.thatContext;
    pageCnt.setData({
      fromShare: false
    });
    pageCnt.setData({
      topPageStatus: { indexPage: false, detailPage: true, personPage: true, rulePage:true}
    })
    console.log("my")

  }
  rule(){
    let pageCnt = this.thatContext;
    pageCnt.setData({
      topPageStatus: { indexPage: false, detailPage: true, personPage: true, rulePage: false }
    })
  }

  ohterPeopleProcess() {
    let pageCnt = this.thatContext;
    let fSInfo = pageCnt.data.fromShareInfo
    console.log("fenxiang")
    pageCnt.setData({
      btnOperateStatu: { myBargain: true, friendBargain: false }
    });
    pageCnt.setData({
      fromShare: true
    });
    pageCnt.reqAtyingGoodsDetail(fSInfo.activityId, "", 1, fSInfo.relationId)
  }
}

// pages/sbargain/sbargain.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    staticResPathBargain: cf.config.staticResPath + "/youdian/image/mobile/s_bargain/",
    staticResPathVirA: cf.config.staticResPath + "/youdian/image/mobile/tuan/vira/",
    swtichImg: cf.config.pageDomain + "/mobile/base/activity/pathToData.do?fileUrl=",
    indexSlider: [],
    wxShareTitle: "",
    skipUserInfoOauth: true,  //是否跳过授权弹出框
    authType:1, //拒绝授权 停留当前页
    userInfo: {},
    activity: {},
    tabArr: {
      curHdIndex: 0,
      curBdIndex: 0
    },
    //hidden
    hidden:false,
    winWidth: 0,
    winHeight: 0,
    // tab切换
    currentTab: 0,
    curUser: {},
    atyIsLive: true,
    indexHeaderSta: [true, true],
    topPageStatus: { indexPage: true, detailPage: true, personPage: true ,rulePage:true},
    sbBottomStatus: { canBargain: [true,true,true,true], normal: false },
    btnOperateStatu: { myBargain: true, friendBargain: true },
    maskStatu: [true, true, true, true],
    curPriceStatus: [true, true],
    atyTimeShutDown: { timerDay1: 0, timerDay2: 0, timerHour1: 0, timerHour2: 0, timerMinute1: 0, timerMinute2: 0, timerSecond1: 0, timerSecond2: 0 },
    goodsList: [],
    avatorList: [],
    goodsDetailInfo: {},
    theRelationshipDefine: {},
    bargainRet: {},//自己砍价第一刀的结果
    fromShare: false,
    showprogress:true,
    showFriendBargain: true,
    popBargainPriceRetSta: [true, true, true],
    helpBargainRet: 0,
    detailHeaderSta: [true, true, true],
    uReShip: {},
    rules:[],
    rankList: true,
    userVisit: true,
    showShareMask:true,
    myBargainList: [],
    shareQrCodeUrl:"",
    shareType:"",
    isProcessing:true,
    acRuler: false

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    let myProcess;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      let fromShare = that.data.fromShare;
      let atyIsLive = that.data.atyIsLive;
      myProcess = new commonAty.CommonProcess(new SBargain(that), options, cusmallToken);

      let promiseProcess = new Promise(function (resolve) {
        myProcess.init(resolve);
      });
      util.afterPageLoad(that);
      promiseProcess.then(function () {
        if (options.goodsid && options.bargaintype==0){
          wx.request({
            url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardDetail',
            data: {
              cusmallToken: cusmallToken,
              activityid: options.activityId,
              awardId: options.goodsid,
              type: options.bargaintype,
              relationId: ""
            },
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
              let data = res.data;
              let goodsDetailInfo = data.model.award;
              let goodsSlider = goodsDetailInfo.awardPicList.split(",");
              let ecExtendObj = JSON.parse(goodsDetailInfo.ecExtend);
              let poster_bg1 = JSON.parse(data.model.activity.extendOperation);
              if(poster_bg1.poster_type==1){
                that.setData({
                  Poster_bg:poster_bg1.poster_bg
                })
              }
              else {
                that.setData({
                  Poster_bg:''
                })
              }
              let members = data.model.members;
              for (let key in ecExtendObj) {
                goodsDetailInfo[key] = ecExtendObj[key];
              }
              goodsDetailInfo.bargainRanking = data.model.bargainRanking;
              goodsDetailInfo.goodsSlider = goodsSlider;
              goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);
              goodsDetailInfo.barCount = data.model.barCount;
              that.setData({
                theRelationshipDefine: data.model.theRelationshipDefine
              });
              if (data.model.theRelationshipDefine) {
                goodsDetailInfo.barPer = data.model.barCount / (goodsDetailInfo.originalPrice - goodsDetailInfo.activityPrice) * 100;
              }
              goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);
              that.setData({
                detailHeaderSta: [false, true, true]
              });
              that.setData({
                isProcessing: data.model.isProcessing
              });
              if (!fromShare) {
                if (data.model.isProcessing) {
                  that.setData({
                    btnOperateStatu: { myBargain: false, friendBargain: true }
                  });
                  that.setData({
                    sbBottomStatus: { canBargain: [true, false, true, true], normal: true }
                  });

                  if (goodsDetailInfo.originalPrice - goodsDetailInfo.barCount != goodsDetailInfo.activityPrice) {//价格还没到底价
                    that.setData({
                      curPriceStatus: [false, true]
                    });
                    that.setData({
                      sbBottomStatus: { canBargain: [true, false, true, true], normal: true }
                    });
                  } else {//已经到底价了
                    that.setData({
                      curPriceStatus: [true, false]
                    });
                    that.setData({
                      sbBottomStatus: { canBargain: [true, true, true, false], normal: true }
                    });
                  }

                } else {
                  that.setData({
                    btnOperateStatu: { myBargain: true, friendBargain: true }
                  });
                  that.setData({
                    sbBottomStatus: { canBargain: [false, true, true, true], normal: true }
                  });
                }
              } else {
                that.setData({
                  sbBottomStatus: { canBargain: [true, true, false, true], normal: true }
                });

              }

              if (0 == goodsDetailInfo.sendNum) {//如果没有库存了
                //砍价下面的菜单
                that.setData({
                  sbBottomStatus: { canBargain: [true, true, true, true], normal: false }
                });

                that.setData({
                  detailHeaderSta: [true, false, true]
                });
              }

              if (!atyIsLive) {//如果活动已经结束
                //砍价下面的菜单
                that.setData({
                  sbBottomStatus: { canBargain: [true, true, true, true], normal: false }
                });
                that.setData({
                  detailHeaderSta: [true, true, false]
                });
              }
              if (members) {
                goodsDetailInfo.members = members;
              } else {
                goodsDetailInfo.members = [];
              }

              that.setData({
                goodsDetailInfo: goodsDetailInfo
              });

            },
            fail: function () {
            },
            complete: function () {
              that.topPageSwtich({ currentTarget: { dataset: { page: "detailPage" } } });
            }
          });
        }
      });

    });
    that.setData({
      userInfo: app.globalData.userInfo
    })
  },

  /* 授权判断 */
  authUserInfo(){
    let that=this;
    if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
      that.setData({
        noAuthInfo:false
      })
    }else {
      that.setData({
        noAuthInfo:true
      })
    }
  },
  linkSbargain: function (){

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
  tabFun: function (e) {
    //获取触发事件组件的dataset属性
    var _datasetId = e.target.dataset.id;
    var _obj = {};
    _obj.curHdIndex = _datasetId;
    _obj.curBdIndex = _datasetId;
    this.setData({
      tabArr: _obj
    });
  },

// 底部页面切换
  topPageSwtich: function (e) {
    var flag = 1;
    let that = this;
    wx.showLoading({
      title: '加载中',
    });
    let curTarget = e.currentTarget;
    let topPageStatus = this.data.topPageStatus;
    let mKey = curTarget.dataset.page;
    console.log(mKey);
    console.log(curTarget)
    for (let key in topPageStatus) {
      if (key == mKey) {
        topPageStatus[key] = false;
      } else {
        topPageStatus[key] = true;
      }
    }
    that.setData({
      topPageStatus: topPageStatus
    });
    if("rulePage"== mKey){
      that.setData({
        sbBottomStatus: {
          canBargain: [true, true, true, true], normal: true
        }
      });
    }
    if ("indexPage" == mKey || "personPage" == mKey) {

      if ("indexPage" == mKey ){
        that.setData({
          hidden: false
        });
      }else{
        that.setData({
          hidden: true
        });
      }
       console.log(flag)
      that.setData({
        sbBottomStatus: {
          canBargain: [true, true, true, true], normal: false
        }
      });
      that.setData({
        fromShare: false
      });
    }
    wx.hideLoading();
  },

  //活动规则
  showRuler:function (){
    let that = this;
    that.setData({
      acRuler: true
    })
  },
  hideRuler:function (){
    let that = this;
    that.setData({
      acRuler: false
    })
  },
  hideShareMasks:function(){
     let that = this;
     that.setData({
       showShareMask:true
     })
  },
  showShareMasks: function () {
    let that = this;
    that.setData({
      showShareMask: false
    })
  },
  getUserAvator: function () {
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardRanking',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id,
        start: 0,
        size: 3
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        let avatorList = {};
        for (let key in data.model.records) {
          if (data.model.records[key]) {
            console.log(data.model.records[key][0])
            if (data.model.records[key][0]) {
              avatorList["a" + key + "0"] = data.model.records[key][0].headPic;
              console.log(data.model.records[key][0].headPic)
            } else {
              avatorList["a" + key + "0"] = ""
            }
            if (data.model.records[key][1]) {
              avatorList["a" + key + "1"] = data.model.records[key][1].headPic;
              console.log(data.model.records[key][1].headPic)
            } else {
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
  showCountDown: function (endDate, that) {
    var now = new Date();
    let atyTimeShutDown;
    // var endDate = new Date(year, month, day,hour,minute,second);
    var leftTime = endDate.getTime() - now.getTime();
    if (0 >= leftTime) {
      clearInterval(atyTimer);

      atyTimeShutDown = { timerDay: 0, timerHour: 0, timerMinute: 0, timerSecond: 0 };
      this.setData({
        atyIsLive: false
      });
      return;
    }
    var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10);//计算剩余的天数
    var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10);//计算剩余的小时数
    var mm = parseInt(leftTime / 1000 / 60 % 60, 10);//计算剩余的分钟数
    var ss = parseInt(leftTime / 1000 % 60, 10);//计算剩余的秒数

    atyTimeShutDown = { timerDay1: parseInt(dd / 10), timerDay2: dd % 10, timerHour1: parseInt(hh / 10), timerHour2: hh % 10, timerMinute1: parseInt(mm / 10), timerMinute2: mm % 10, timerSecond1: parseInt(ss / 10), timerSecond2: ss % 10 };

    this.setData({
      atyTimeShutDown: atyTimeShutDown
    });
    this.setData({
      atyIsLive: true
    });
  },
  //
  goodsDetailPage: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    let curTarget = e.currentTarget;
    let goodsid = curTarget.dataset.goodsid;
    let bargaintype = curTarget.dataset.bargaintype;
    let fromShare = that.data.fromShare;
    let atyIsLive = that.data.atyIsLive;
    console.log(fromShare)
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryAwardDetail',
      data: {
        cusmallToken: cusmallToken,
        activityid: that.data.activity.id,
        awardId: goodsid,
        type: bargaintype,
        relationId: ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        let goodsDetailInfo = data.model.award;
        let goodsSlider = goodsDetailInfo.awardPicList.split(",");
        let ecExtendObj = JSON.parse(goodsDetailInfo.ecExtend);
        let members = data.model.members;
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
        goodsDetailInfo.bargainRanking = data.model.bargainRanking;
        goodsDetailInfo.goodsSlider = goodsSlider;
        goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);
        goodsDetailInfo.barCount = data.model.barCount;
        that.setData({
          theRelationshipDefine: data.model.theRelationshipDefine
        });
        if (data.model.theRelationshipDefine) {
          goodsDetailInfo.barPer = data.model.barCount / (goodsDetailInfo.originalPrice - goodsDetailInfo.activityPrice) * 100;
        }
        goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);
        that.setData({
          detailHeaderSta: [false, true, true]
        });
        that.setData({
          isProcessing: data.model.isProcessing
        });
        if (!fromShare) {
          if (data.model.isProcessing) {
            that.setData({
              btnOperateStatu: { myBargain: false, friendBargain: true }
            });
            that.setData({
              sbBottomStatus: { canBargain: [true, false, true, true], normal: true }
            });

            if (goodsDetailInfo.originalPrice - goodsDetailInfo.barCount != goodsDetailInfo.activityPrice) {//价格还没到底价
              that.setData({
                curPriceStatus: [false, true]
              });
              that.setData({
                sbBottomStatus: { canBargain: [true, false, true, true], normal: true }
              });
            } else {//已经到底价了
              that.setData({
                curPriceStatus: [true, false]
              });
              that.setData({
                sbBottomStatus: { canBargain: [true, true, true, false], normal: true }
              });
            }

          } else {
            that.setData({
              btnOperateStatu: { myBargain: true, friendBargain: true }
            });
            that.setData({
              sbBottomStatus: { canBargain: [false, true, true, true], normal: true }
            });
          }
        } else {
          that.setData({
            sbBottomStatus: { canBargain: [true, true, false, true], normal: true }
          });

        }

        if (0 == goodsDetailInfo.sendNum) {//如果没有库存了
          //砍价下面的菜单
          that.setData({
            sbBottomStatus: { canBargain: [true, true, true, true], normal: false }
          });

          that.setData({
            detailHeaderSta: [true, false, true]
          });
        }

        if (!atyIsLive) {//如果活动已经结束
          //砍价下面的菜单
          that.setData({
            sbBottomStatus: { canBargain: [true, true, true, true], normal: false }
          });
          that.setData({
            detailHeaderSta: [true, true, false]
          });
        }
        if (members) {
          goodsDetailInfo.members = members;
        } else {
          goodsDetailInfo.members = [];
        }

        that.setData({
          goodsDetailInfo: goodsDetailInfo
        });

      },
      fail: function () {
      },
      complete: function () {
        that.topPageSwtich({ currentTarget: { dataset: { page: "detailPage" } } });
      }
    });

  },
  reqAtyingGoodsDetail: function (activityid, awardsTypeId, atyType, relationid) {
    wx.showLoading({
      title: '加载中',
    });
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
          let poster_bg3=JSON.parse(data.model.activity.extendOperation)
          if(poster_bg3.poster_type==1){
            that.setData({
              Poster_bg:poster_bg3.poster_bg
            })
          }
          else {
            that.setData({
              Poster_bg:''
            })
          }
          let members = data.model.members;
          for (let key in ecExtendObj) {
            goodsDetailInfo[key] = ecExtendObj[key];
          }
          goodsDetailInfo.bargainRanking = data.model.bargainRanking;
          goodsDetailInfo.goodsSlider = goodsSlider;
          goodsDetailInfo.description = util.formatImg(goodsDetailInfo.description);
          goodsDetailInfo.barCount = data.model.barCount;
          if (data.model.theRelationshipDefine) {
            goodsDetailInfo.barPer = data.model.barCount / (goodsDetailInfo.originalPrice - goodsDetailInfo.activityPrice) * 100;
          }
          that.setData({
            theRelationshipDefine: data.model.theRelationshipDefine
          });

          that.setData({
            detailHeaderSta: [false, true, true]
          });
          //tuanStatuHeader
          if (false == data.model.isProcessing) {
            that.setData({
              btnOperateStatu: { myBargain: true, friendBargain: true }
            });
            that.setData({
              sbBottomStatus: { canBargain: [true, true, false, true], normal: true }
            });
          } else {
            goodsDetailInfo.membersNum = members.length;
            if (!fromShare) {//非链接进来

              if(data.model.isPay){
                that.setData({
                  btnOperateStatu: { myBargain: true, friendBargain: true }
                });
              }else{
                that.setData({
                  btnOperateStatu: { myBargain: false, friendBargain: true }
                });
              }

              that.setData({
                sbBottomStatus: { canBargain: [true, false, true, true], normal: true },
                showprogress: false,
              });

              if (goodsDetailInfo.originalPrice - goodsDetailInfo.barCount != goodsDetailInfo.activityPrice) {//价格还没到底价
                that.setData({
                  curPriceStatus: [false, true]
                });
              } else {//已经到底价了
                that.setData({
                  curPriceStatus: [true, false],
                   sbBottomStatus: { canBargain: [true, true, true, false], normal: true }
                });
              }
            } else {//助力看到
              that.setData({
                btnOperateStatu: { myBargain: true, friendBargain: false }
              });
              console.log()
              that.setData({
                sbBottomStatus: { canBargain: [true, true, false, true], normal: true },
                showprogress: false,
              });
            }



          }

          if (0 == goodsDetailInfo.sendNum) {//如果没有库存了
            //砍价下面的菜单
            that.setData({
              sbBottomStatus: { canBargain: [true, true, true, true], normal: false }
            });

            that.setData({
              detailHeaderSta: [true, false, true]
            });
          }

          if (!atyIsLive) {//如果活动已经结束
            //砍价下面的菜单
            that.setData({
              sbBottomStatus: { canBargain: [true, true, true, true], normal: false }
            });
            that.setData({
              detailHeaderSta: [true, true, false]
            });
          }
          if (members) {
            goodsDetailInfo.members = members;
          } else {
            goodsDetailInfo.members = [];
          }

          that.setData({
            goodsDetailInfo: goodsDetailInfo
          });
        }

      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        that.topPageSwtich({ currentTarget: { dataset: { page: "detailPage" } } });
      }
    });
  },
  // 开始砍价
  startBargain: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;

    wx.showLoading({
      title: '加载中',
    });
    let curTarget = e.currentTarget;
    let goodsid = curTarget.dataset.goodsid;
    let formId = e.detail.formId;
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'yingxiao',
        msgcode: "3003"
      }]),
      function (resp) {
        console.log(resp)
        
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
            console.log(data)
            if (data && 0 == data.ret) {
              that.setData({
                maskStatu: [false, true, true, true],
                sbBottomStatus: { canBargain: [true, false, true, true], normal: true },
                tabArr: { curHdIndex: 1, curBdIndex: 1 },
                showprogress: false,
                theRelationshipDefine: {
                  relationId: data.model.userRelationship.relationId,
                  activityId: data.model.userRelationship.activityId
                }
              });

              let uReShip = data.model.userRelationship;
              uReShip.result = parseInt(uReShip.result);
              uReShip.barPer = uReShip.result / (that.data.goodsDetailInfo.originalPrice - that.data.goodsDetailInfo.activityPrice) * 100;

              that.setData({
                uReShip: uReShip
              });

              //(activityid, awardsTypeId, atyType, relationid)
              //
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

      });
    
  },

  helpBargain: function () {
    if (!this.checkUserInfo()) {
      return false;
    }
    let that = this;
    let fromShareInfo = this.data.fromShareInfo;
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
          let userRelationship = data.model.userRelationship;
          console.log(userRelationship)
          if (0 == userRelationship.result) {
            that.setData({
              maskStatu: [true, true, false, true],
              sbBottomStatus: { canBargain: [false, true, true, true], normal: true }
            });
            that.setData({
              popBargainPriceRetSta: [false, true, true]
            });

          } else {

            that.setData({
              showFriendBargain: false
            });
            that.setData({
              helpBargainRet: userRelationship.result
            });
            that.setData({
              maskStatu: [true, true, false, true],
            });
            that.setData({//砍过了
              popBargainPriceRetSta: [true, false, true]
            });
            setTimeout(function () {
              that.reqAtyingGoodsDetail(fromShareInfo.activityId, "", 1, fromShareInfo.relationId);
              that.setData({
                showFriendBargain: true
              });
            }, 2000)
          }


        } else if (data && -73 == data.ret) {
          wx.showModal({
            title: '提示',
            content: '您已经帮砍过了',
          })
          that.setData({//砍过了
            popBargainPriceRetSta: [true, false, true]
          });

        } else if (data && -76 == data.ret) {//到底价
          that.setData({
            maskStatu: [true, true, false, true]
          });
          that.setData({
            popBargainPriceRetSta: [true, true, false]
          });
        } else {
          wx.showModal({
            title: "提示",
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
  goToPayAtyBtn: function (e) {//砍价购买
    if (!this.checkUserInfo()) {
      return false;
    }
    let target = e.currentTarget;
    let atyId = target.dataset.atyid;
    let goodsId = target.dataset.goodsid;
    let reid = target.dataset.reid;
    console.log(reid + goodsId + atyId)
    wx.redirectTo({
      url: "/pages/sbargain/sbargainpay?activityId=" + atyId + "&goodsId=" + goodsId + "&relationId=" + reid + "&buyType=0"
    });
  },
  originPriceBuy: function () {//直接购买
    let that = this;
    console.log(that.data.goodsDetailInfo);
    let goodsInfo = that.data.goodsDetailInfo;
    wx.redirectTo({
      url: "/pages/sbargain/sbargainpay?activityId=" + goodsInfo.activityId + "&goodsId=" + goodsInfo.id + "&buyType=1"
    });
  },
  rightNowPay: function () {
    let that = this;
    that.setData({
      maskStatu: [true, false, true, true]
    });
  },
  myBargainList: function () {
    let that = this;
    that.authUserInfo();
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
        wx.hideLoading();
        let data = res.data;
        let records = data.model.records;
        if (data && 0 == data.ret) {
          if (records) {
            for (let idx0 in records){
              let extObj = JSON.parse(records[idx0].award.ecExtend)
              for (let idx1 in extObj){
                records[idx0].award[idx1] = extObj[idx1];
              }
            }
            that.setData({
              myBargainList: records
            })
          }else{
            myBargainList:[]
          }
          that.topPageSwtich({ currentTarget: { dataset: { page: "personPage" } } });
        }
      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {


      }
    });

  },
  beforeDetail :function(e){
    let that = this;
    let target = e.currentTarget;
    let goodsId = target.dataset.goodsid;
    let reid = target.dataset.reid;
    that.reqAtyingGoodsDetail(that.data.activity.id, goodsId, 1, reid);
  },
  maskHide: function (e) {
    let that = this;
    let flag = e.currentTarget.dataset.flag;
    let maskStatu = that.data.maskStatu;

    for (let idx in maskStatu) {
      maskStatu[idx] = true;
    }
    that.setData({
      maskStatu: maskStatu
    });
    if ("firstBargain" == flag) {
      let uReShip = that.data.uReShip;
      that.reqAtyingGoodsDetail(uReShip.activityId, uReShip.awardId, 1, uReShip.relationId);
    }
  },

  /**
 * 计算商品详情页默认banner高度
 */
  onMainBannerImgLoad: function (e) {
    var that = this;
    var w = e.detail.width;
    var h = e.detail.height;
    var bannerHeight = (h / w) * 750;
    if (that.data.mainBannerHeight != bannerHeight) {
      that.data.mainBannerHeight = bannerHeight;
      that.setData({ mainBannerHeight: that.data.mainBannerHeight });
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
  shareByQRCode: function(){
    wx.showLoading({
      title: '加载中',
    });
    //拿qrcode链接
    let that = this;
    let theReDe = that.data.theRelationshipDefine;
    let fromShareInfo = that.data.fromShareInfo;
    let scene = {};
    if (theReDe && theReDe.relationId) {
      scene.fromOpenId = theReDe.sponsorOpenid;
      scene.relationId = theReDe.relationId;
    } else if (fromShareInfo && fromShareInfo.relationId) {
      scene.fromOpenId = fromShareInfo.formOpenId;
      scene.relationId = fromShareInfo.relationId;
    }else{
      wx.showToast({
        title: "参数错误无法",
        icon: 'fail',
        duration: 2000
      });
      return;
    }
    let page = "pages/sbargain/sbargain";
    let qrcodeUrl = cf.config.pageDomain + "/mobile/base/activity/getQrcode.do?page=" + page+"&activityid=" + that.data.activity.id + "&scene=" + JSON.stringify(scene)
    console.log(qrcodeUrl)
    //拿qrcode链接
    let context = wx.createCanvasContext('firstCanvas')
    let scrWidth, scrHeight;
    wx.getSystemInfo({
      success: function (res) {
        scrWidth = res.screenWidth;
        scrHeight = res.screenHeight;
      }
    });
    let drawWidth = scrWidth * 1.4;
    let drawHeight = drawWidth * 1.7;
    let unit = drawWidth / 20.5;
    let goodsDetailInfo = that.data.goodsDetailInfo;
    if (goodsDetailInfo.awardName.length >= 12){
      goodsDetailInfo.awardName = goodsDetailInfo.awardName.substring(0, 12) + "...";
    }
    console.log(goodsDetailInfo)
    let drawBackground
    console.log(that.data.Poster_bg)
    if(that.data.Poster_bg){
      drawBackground=that.data.swtichImg +that.data.userImagePath + that.data.Poster_bg
    }
    else {
      drawBackground=that.data.swtichImg + that.data.staticResPathBargain + "bargain-bg.png"
    }
    let drawEle = [

      { type: "img", url: drawBackground, x: 0, y: 0, width: drawWidth, height: drawHeight },
      { type: "img", url: that.data.swtichImg + that.data.staticResPathBargain + "bargain-bg2.png", x: unit, y: unit*1.2, width: drawWidth*0.90, height: drawHeight*0.92 },

      { type: "imgCircle", url: util.tinyWxHeadImg(theReDe.headPic), x: unit * 8.82, y: unit * 1.34, width: unit * 2.90, height: unit * 2.90},
      { type: "txt", color: "#333333", text: theReDe.nickName, fontSize: unit * 0.8,align:'center',baseline:'middle',width: drawWidth,x: drawWidth * 0.5, y: 5.50 * unit },
      { type: "txt", color: "#2D2D2D", text: "我发现一件好货",bold:true, fontSize: unit * 1,baseline:'middle', x: unit * 6.62, y: unit * 7.78, },
      { type: "txt", color: "#2D2D2D", text: "最低能砍到", fontSize: unit * 1,bold:true,baseline:'middle', x: unit * 5.92, y: unit * 9.12, },
      { type: "txt", color: "#F63434", text: (goodsDetailInfo.activityPrice/100).toFixed(2)+"元", fontSize: unit * 1.15, x: unit * 11.00, y: unit * 9.60, },

      { type: "img", url: that.data.swtichImg + that.data.staticResPathBargain + "react.png", x: unit * 2, y: unit * 11.2, width: drawWidth*0.8, height: unit * 5.95 },

      { type: "arcImg", url: that.data.swtichImg + that.data.userImagePath + goodsDetailInfo.awardPic, x: unit * 2.8, y: unit * 11.8, width: unit * 5.5, height: unit * 4.2 },
      { type: "txt", color: "#6c6c6c", text: goodsDetailInfo.awardName, fontSize: unit * 0.8, x: unit * 8.6, y: unit * 12.81, },
      { type: "txt", color: "#6c6c6c", text: "原价：", fontSize: unit * 0.8, x: 8.6 * unit, y: 16.18 * unit },
      { type: "txt", color: "#6c6c6c", text: that.data.app.globalData.currencySymbol+ (goodsDetailInfo.originalPrice/100).toFixed(2), fontSize: unit * 0.8, x: 11.1 * unit, y: 16.25 * unit },
      { type: "deleteLine", color: "#6c6c6c", x: 11.1 * unit, y: 16.01 * unit, toX: unit * 13.80, toY: 16.01 * unit },
      // { type: "img", url: that.data.swtichImg + that.data.staticResPathBargain + "duihua.png", x: unit * 4.5, y: unit * 15.2, width: unit * 15.39, height: unit * 3.93 },

      // { type: "dashLine", color: "#7A97A1", x: 1 * unit, y: 22 * unit, toX: unit * 19.5, toY: 22 * unit },
      { type: "txt", color: "#333333", text: "长按识别",bold:true, fontSize: unit * 1.3, x: 4.4 * unit, y: 20.6 * unit },
      { type: "txt", color: "#F63434", text: "帮我砍价吧",bold:true, fontSize: unit * 1.3, x: 9.6 * unit, y: 20.6 * unit },
      // { type: "txt", color: "#333333", text: "进入砍价活动", fontSize: unit * 1, x: 11 * unit, y: 26.2 * unit },
      { type: "imgCircle", url: qrcodeUrl, x: unit * 6.2, y: unit * 22.98, width: unit * 8.0, height: unit * 8.0 },
    ]
    console.log(drawEle)
    let callback = function () {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: drawWidth,
        height: drawHeight,
        destWidth: drawWidth*3,
        destHeight: drawHeight*3,
        canvasId: "firstCanvas",
        success: function (res) {
          that.setData({
            shareQrCodeUrl:res.tempFilePath
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
    util.drawPoster(context, drawEle, drawWidth, drawHeight, callback);
  },
  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
    let that = this
    let theReDe = that.data.theRelationshipDefine;
    let shareObj = {};
    let headerData = wx.getStorageSync('headerData');
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
    let goodsDetailInfo = that.data.goodsDetailInfo;
    let fromShareInfo = that.data.fromShareInfo;
    let buyerName = that.data.curUser.nickName;
    let goodsName = goodsDetailInfo.awardName || that.data.goodsList[0].awardName;
    let title = "";
    if (that.data.wxShareTitle) {
    	title = that.data.wxShareTitle.replace(/@BN@/g, buyerName).replace(/@GN@/g, goodsName);
    }
    if (theReDe && theReDe.relationId) {
      shareObj = {
        title: title || ("快来砍" + (goodsDetailInfo.activityPrice / 100).toFixed(2)+"元"+that.data.activity.activityName),
        path: "/pages/sbargain/sbargain?activityId=" + theReDe.activityId + "&fromOpenId=" + theReDe.sponsorOpenid + "&relationId=" + theReDe.relationId,
        imageUrl: imageUrl,
        success: function (res) { // 成功
        },
        fail: function (res) { // 失败
        }
      };
    } else if (fromShareInfo && fromShareInfo.relationId) {
      shareObj = {
        title: title || ("快来砍" + (goodsDetailInfo.activityPrice / 100).toFixed(2) + "元" + that.data.activity.activityName),
        path: "/pages/sbargain/sbargain?activityId=" + fromShareInfo.activityId + "&fromOpenId=" + fromShareInfo.formOpenId + "&relationId=" + fromShareInfo.relationId,
        imageUrl: imageUrl,
        success: function (res) { // 成功
        },
        fail: function (res) { // 失败
        }
      };
    } else {
      shareObj = {
        title: title || that.data.activity.activityName,
        path: "/pages/sbargain/sbargain?activityId=" + that.data.activity.id,
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
