// pages/secondCard/cardList.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var app = getApp();
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    nkName:"",
    avatarUrl:"",
    listType:"l1",
    curPage: 1,
    isLoading: false,
    pageSize: 6,
    skipUserInfoOauth: true,
    authType:1, //拒绝授权 停留当前页
    isBottom: false,
    list:[],
    curCard:{},
    buyModal: false,
    url:"/applet/mobile/storeCountCard/queryCountCards",
    isPaying:false,
    cardModal:false,
    qrCodeUrl:"",
    listTips:"",

  //   extra信息输入
    extraName:'',
    extraTel:'',
    extraAddress:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let ctx = this;
    wx.hideShareMenu();
    ctx.data.options=options;
    app.getUserInfo(this,{}, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      let nkName = wx.getStorageSync('userInfo').nickName;
      let avatarUrl = wx.getStorageSync('userInfo').avatarUrl;
      if (app.globalData.userInfo) {
        ctx.setData({
          noAuthInfo:false
        })
      }else {
        ctx.setData({
          noAuthInfo:true
        })
      }
      ctx.setData({
        nkName: nkName,
        avatarUrl: avatarUrl
      })
      ctx.getBuyList();
    });
  },
  changeList(e){
    var lType = e.currentTarget.dataset.type;
    this.setData({
      listType :lType
    });
    if("l1" == lType){
      this.setData({
        url: "/applet/mobile/storeCountCard/queryCountCards",
      })
    } else if ("l2" == lType){
      this.setData({
        url: "/applet/mobile/storeCountCard/queryMyCountCards"
      })
    }
    this.setData({
      curPage:1,
      list:[],
      isBottom: false,
    });
    this.getBuyList();
  },

  getBuyList(){
    var ctx = this;
    if (ctx.data.isLoading || ctx.data.isBottom) {
      return;
    }
    wx.showLoading({
      title: '加载中'
    });
    ctx.setData({ isLoading: true });
    wx.request({
      url: cf.config.pageDomain + ctx.data.url,
      data: {
        cusmallToken: cusmallToken,
        start: (ctx.data.curPage - 1) * ctx.data.pageSize,
        limit: ctx.data.pageSize
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let list = data.model.list;
          let nowList = ctx.data.list;
          ctx.setData({
            list: nowList.concat(list)
          });

          if (data.model.total == ctx.data.list.length){
            ctx.setData({
              isBottom: true
            })
          }
        } else {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: data.msg
          })
        }
        if ("l1" == ctx.data.listType){
          ctx.setData({
            listTips: data.model.total
          })
        } else if ("l2" == ctx.data.listType){
          ctx.setData({
            listTips: data.model.total
          })
        }
      },
      fail() {

      },
      complete() {
        wx.hideLoading();
        ctx.setData({ isLoading: false });
      }
    });
  },
  // 次卡删除
  deleteTCard(e){
    var ctx = this;
    let recordId = e.currentTarget.dataset.recordid;
    wx.showModal({
      title: '提示',
      content: '确定要删除该次卡吗？删除后不可恢复',
      confirmText:'删除',
      success(res) {
        if (res.confirm) {
          ctx.handleDe(recordId)
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })

  },
  handleDe(recordId){
    let ctx = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/storeCountCard/userDeleteSendRecord",
      data: {
        recordId: recordId,
        cusmallToken: cusmallToken,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          wx.showToast({
            title: '删除成功',
            success:function(){
              ctx.getBuyList()
            }
          })

        } else {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: data.msg
          })
        }
      },
      fail() {

      },
      complete() {
        wx.hideLoading();
        ctx.setData({ isLoading: false });
      }
    });
  },

  buyOrValidCard(e){
    var ctx = this;
    var card = ctx.data.list[e.currentTarget.dataset.idx];
    if ("l1"== ctx.data.listType){
      ctx.setData({
        curCard: card,
        extendInfo:JSON.parse(card.extendInfo),
        buyModal: true
      })

    } else if ("l2" == ctx.data.listType){
      ctx.setData({
        curCard: card,
      })
      ctx.genCountCardQrCode();
    }
  },
  hideLabelModal(){
    this.setData({
      buyModal: false,
      cardModal:false
    })
  },
  /* 信息输入 */
  changeExtend(e){
    let extendType=e.currentTarget.dataset.type;
    console.log(e)
    if(extendType=="cname"){
      this.data.extraName=e.detail.value;
    }else if(extendType=="phone"){
      this.data.extraTel=e.detail.value
    }else if(extendType=="address"){
      this.data.extraAddress=e.detail.value
    }
  },
  purchaseCard(){
    var ctx = this;
    if (!this.checkUserInfo()) {
      return false;
    }
    if (ctx.data.isPaying){
      return;
    }
    /* 检查额外信息的合法 */
    if(ctx.data.extendInfo){
      let extendInfo=ctx.data.extendInfo;
      for (let i=0;i<extendInfo.length;i++){
        if(extendInfo[i].isChecked){
           if(extendInfo[i].field=='cname' && !ctx.data.extraName){
             wx.showToast({
               title: '请输入姓名！',
               icon: 'none',
               duration: 1500
             });
             return
           }else if(extendInfo[i].field=='phone' && !ctx.data.extraTel){
             wx.showToast({
               title: '请输入手机号！',
               icon: 'none',
               duration: 1500
             });
             return
           }else if(extendInfo[i].field=='phone' && !util.phoneValidate(this.data.extraTel)){
             wx.showToast({
               title: '手机号不合法！',
               icon: 'none',
               duration: 1500
             });
             return
           }else if(extendInfo[i].field=='address' && !ctx.data.extraAddress){
             wx.showToast({
               title: '请输入地址！',
               icon: 'none',
               duration: 1500
             })
             return
           }
        }
      }
    }
    let extendInfoVal=[{
        "name":"姓名",
        "field":"cname",
        "type":"txt",
        "value":ctx.data.extraName
      }, {
        "name":"手机",
        "field":"phone",
        "type":"txt",
        "value":ctx.data.extraTel
      }, {
        "name":"地址",
        "field":"address",
        "type":"txt",
        "value":ctx.data.extraAddress
      }];

    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/storeCountCard/purchaseCard",
      data: {
        cusmallToken: cusmallToken,
        cid: ctx.data.curCard.id,
        extendInfoVal:JSON.stringify(extendInfoVal)
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let sended = data.model.sended;
          if (0 != sended.cprice){

            ctx.getPayParams(ctx.data.curCard.name, sended.tradeNo, sended.cprice);
          } else if (0 == sended.cprice){
            wx.showModal({
              title: '提示',
              content: "支付成功",
              showCancel: false,
              success: function (res) {
                ctx.hideLabelModal();
              }
            });
            ctx.setData({
              isPaying: false
            })
          }
        } else {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: data.msg
          })
        }
      },
      fail() {
        ctx.setData({
          isPaying: false
        })
      },
      complete() {
        wx.hideLoading();
      }
    });
  },
  getPayParams(goodDescribe, orderNo, price) {
    let ctx = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: goodDescribe,
        out_trade_no: orderNo,
        total_fee: price
      },
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if (data && 0 == data.ret) {
          let wxOrderData = data.model.wxOrderData;
          wx.requestPayment({
            'timeStamp': wxOrderData.timeStamp,
            'nonceStr': wxOrderData.nonceStr,
            'package': wxOrderData.package,
            'signType': wxOrderData.signType,
            'paySign': wxOrderData.paySign,
            'success': function (res) {
              wx.showModal({
                title: '提示',
                content: "支付成功",
                showCancel: false,
                success: function (res) {
                  ctx.hideLabelModal();
                }
              });
            },
            'fail': function (res) {

              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付"
              })
            },
            complete: function () {
              ctx.setData({
                isPaying: false
              });
              wx.hideLoading();
            }
          });
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg + ", 或没有配置微信支付参数，无法进行支付",
            showCancel: false,
            success: function (res) {

            }
          });
          ctx.setData({
            isPaying: false
          });
        }


      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  genCountCardQrCode(){
    var ctx = this;
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/storeCountCard/genCountCardQrCode",
      data: {
        sendedId: ctx.data.curCard.id,
        page:"pages/verify/commVer",
        cusmallToken: cusmallToken,
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          let intro = data.model.card.intro.split(/[\n,]/g);
          ctx.setData({
            cardModal: true,
            qrCodeUrl: data.model.appletScene.qrcodeUrl,
            intro: intro,

          })

        } else {
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: data.msg
          })
        }
      },
      fail() {

      },
      complete() {
        wx.hideLoading();
        ctx.setData({ isLoading: false });
      }
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
    let that = this;
    if (this.data.isLoading) {
      return;
    }
    that.setData({ curPage: that.data.curPage + 1 });
    this.getBuyList();
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))
