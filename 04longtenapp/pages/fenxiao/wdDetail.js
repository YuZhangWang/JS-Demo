// pages/fenxiao/wdDetail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
var withdrawAccList = []
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    fxStaticResPath: cf.config.staticResPath + "/image/mobile/fx/",
    wdRecord:[],
    isLoading:false,
    authType:'back', //拒绝授权 返回前页
    isBottom:false,
    modalSta: [true, true],
    headPic: "",//头像
    enableWithdrawMoney: 0,//可提取
    nickName: "",//昵称
    alipayAccount:"",
    bankAccount:"",
    bankName:"",
    isBind:false,
    page:1,
    total:-1,
    pageConfig:"",
    withdrawAccReqRule: -1,
    withdrawAccList: [],
    withdrawAccIndex: -1,
    showZfb:false,
    showBank:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu();
    let that = this;
    that.data.options=options;
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.getDistributorConfig();
      that.getPromoterAccount();
      that.loadData(false, that.data.page);
      util.afterPageLoad(that);
    });
  },
  loadData: function(more,page){
    wx.showLoading({
      title: "加载中",
    });
    let list = this.data.wdRecord;
    let cxt = this;
    cxt.setData({
      isLoading: true
    });
    if (cxt.data.total == list.length) {
      cxt.setData({
        isBottom: true,
        isLoading: false
      });
      wx.hideLoading();
      return;
    }

    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/queryWithdrawRecords",
      data: {
        cusmallToken: cusmallToken,
        start: (page - 1) * 10,
        limit: 10
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          if (more) {
            let records = data.model.records;
            for (let i = 0; i < records.length; i++){
              records[i].applyTime = util.formatTime(new Date(records[i].applyTime));
              if (-1 == records[i].state) {
                records[i].stateTxt = "打款失败";
                records[i].staDesc = "请您绑定微信实名认证";
              } else if (0 == records[i].state) {
                records[i].stateTxt = "待商家审批";
                records[i].staDesc = "我们会尽快处理哟";
              } else if (1 == records[i].state) {
                records[i].stateTxt = "打款中";
                records[i].staDesc = "-";
              } else if (2 == records[i].state) {
                if (1 == records[i].operateType) {
                  records[i].stateTxt = "微信打款";
                } else if (2 == records[i].operateType) {
                  records[i].stateTxt = "支付宝打款";
                } else if (3 == records[i].operateType) {
                  records[i].stateTxt = "银行卡打款";
                } else if (4 == records[i].operateType){
                  records[i].stateTxt = "储值金打款";
                }
                if (records[i].transactionId) {
                  records[i].staDesc = records[i].transactionId;
                }
              } else if (3 == records[i].state) {
                records[i].stateTxt = "申请被驳回";
                records[i].staDesc = records[i].remark;
              }
            }
            list = list.concat(records);
            cxt.setData({
              wdRecord: list
            });
          } else {
            cxt.setData({
              isBottom: false
            });
            let records = data.model.records;
            for (let i = 0; i < records.length; i++) {
              records[i].applyTime = util.formatTime(new Date(records[i].applyTime));

              if (-1 == records[i].state){
                records[i].stateTxt = "打款失败";
                records[i].staDesc = "请您绑定微信实名认证";
              } else if (0 == records[i].state){
                records[i].stateTxt = "待商家审批";
                records[i].staDesc = "我们会尽快处理哟";
              } else if (1 == records[i].state) {
                records[i].stateTxt = "打款中";
                records[i].staDesc = "-";
              } else if (2 == records[i].state) {
                if (1 == records[i].operateType){
                  records[i].stateTxt = "微信打款";
                } else if (2 == records[i].operateType){
                  records[i].stateTxt = "支付宝打款";
                } else if (3 == records[i].operateType) {
                  records[i].stateTxt = "银行卡打款";
                } else if (4 == records[i].operateType) {
                  records[i].stateTxt = "储值金打款";
                }
                if (records[i].transactionId){
                  records[i].staDesc = records[i].transactionId;
                }
              } else if (3 == records[i].state) {
                records[i].stateTxt = "申请被驳回";
                records[i].staDesc = records[i].remark;
              }
            }
            cxt.setData({
              wdRecord: records,
              total: data.model.total
            });
            if (data.model.total == records.length) {
              cxt.setData({
                isBottom: true
              });
              return;
            }
          }
        }
      },
      fail: function () {
      },
      complete: function () {
        cxt.setData({
          isLoading: false
        });
        wx.hideLoading();
      }
    });
  },
  handleMClose:function(){
    let modalSta = this.data.modalSta;
    for (let i in modalSta) {
      modalSta[i] = true;
    }
    this.setData({
      modalSta: modalSta
    });
  },
  handleMShow: function (e){
    let that = this;
    let idx = e.currentTarget.dataset.modal;
    if (1 == idx && !this.data.isBind){
      idx = 0;
    }
    let modalSta = this.data.modalSta;
    for (let i in modalSta) {
      if (i == idx) {
        modalSta[i] = false;
      } else {
        modalSta[i] = true;
      }
    }
    if(idx == 1){
      // 订阅消息
      that.requestSubMsg(
        that.getMsgConfig([{
          name: 'fenxiao',
          msgcode: "4001"
        },
        {
          name: 'fenxiao',
          msgcode: "4002"
        }]),
        function (resp) {
          console.log(resp)
          that.setData({
            modalSta: modalSta
          });
        });
    }else{
      that.setData({
        modalSta: modalSta
      });
    }
    
  },
  bindPay: function(e){
    let that = this;
    let name = e.detail.value.name;
    let phone = e.detail.value.phone;
    let zhifubao = e.detail.value.zhifubao || "";
    let bank = e.detail.value.bank || "";
    let bankCard = e.detail.value.bankCard || "";
    let withdrawAccTypeObj = this.data.withdrawAccList[this.data.withdrawAccIndex];
    let withdrawAccType = withdrawAccTypeObj ? withdrawAccTypeObj.type : "";
    if (!name) {
      wx.showModal({
        title: "提示",
        content: "请填写名字",
        showCancel: false
      });
      return;
    }
    if (!phone) {
      wx.showModal({
        title: "提示",
        content: "请填联系电话",
        showCancel: false
      });
      return;
    }
    if (2 == that.data.withdrawAccReqRule && withdrawAccList.length > 0 && "" == withdrawAccType) {
      wx.showModal({
        title: '提示',
        content: '请选择提现账户类型',
        showCancel: false
      })
      return;
    }
    if (!zhifubao && that.data.showZfb){
      wx.showModal({
        title: "提示",
        content: "请填写支付宝帐号",
        showCancel: false
      });
      return;
    }
    if (!bank && that.data.showBank) {
      wx.showModal({
        title: "提示",
        content: "请填写银行名称",
        showCancel: false
      });
      return;
    }
    if (!bankCard && that.data.showBank) {
      wx.showModal({
        title: "提示",
        content: "请填写银行卡号",
        showCancel: false
      });
      return;
    }
    let submitData = {
      cusmallToken: cusmallToken,
      name: name,
      phone: phone
    };
    if (that.data.showZfb) {
      submitData.alipayAccount = zhifubao;
    }
    if (that.data.showBank) {
      submitData.bank = bank;
      submitData.bankAccount = bankCard;
    }
    if (2 == that.data.withdrawAccReqRule) {
      submitData.withdrawAccType = withdrawAccType;
    }
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/modifyPromoterAccount",
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          wx.showModal({
            title: "提示",
            content: "保存成功",
            showCancel: false,
            success: function (res) {
              that.setData({
                modalSta: [true, true]
              });
              that.getPromoterAccount();
            }
          });
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  getDistributorConfig: function () {
    let that = this;
    new Promise((reslove, reject) => {
      wx.request({
        url: cf.config.pageDomain + "/applet/mobile/distributor/getDistributorConfig",
        data: {
          cusmallToken: cusmallToken
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          let data = res.data;
          if (data && 0 == data.ret) {
            if (data.model.distributorConfig) {
              var pageConfig = data.model.distributorConfig || {};
              if(pageConfig.pageConfig){
                pageConfig.pageConfig = JSON.parse(pageConfig.pageConfig);
              }
              that.setData({
                pageConfig: pageConfig
              });
              if ((pageConfig.switchEquity & (Math.pow(2, 4))) != 0) {
                if (pageConfig.withdrawAccReqRule == 1) {
                  that.setData({
                    showZfb: true
                  })
                } 
                withdrawAccList = [];
                if (pageConfig.withdrawAccReqRule == 2) {
                  withdrawAccList.push({
                    type: 'zfb',
                    lab: '支付宝'
                  });
                }
              }
              if ((pageConfig.switchEquity & (Math.pow(2, 5))) != 0) {
                if (pageConfig.withdrawAccReqRule == 1) {
                  that.setData({
                    showBank: true
                  })
                }
                if (pageConfig.withdrawAccReqRule == 2) {
                  withdrawAccList.push({
                    type: 'bank',
                    lab: '银联'
                  });
                }
              }
              that.setData({
                withdrawAccReqRule: pageConfig.withdrawAccReqRule || 1,
                withdrawAccList: withdrawAccList
              })
            }
          } else {
            wx.showToast({
              title: data.msg,
              icon: "none"
            })
          }
        },
        fail: function () {
          reject();
        },
        complete: function () {
          reslove();
        }
      });
    });
  },
  wdMoney:function(e){
    let that = this;
    let inputMoney = e.detail.value.inputMoney;
    if (!inputMoney) {
      wx.showModal({
        title: "提示",
        content: "请输入提取金额",
        showCancel: false
      });
      return;
    }
    inputMoney = parseFloat(inputMoney).toFixed(2);
    inputMoney = parseInt(inputMoney*100);
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/applyWithdraw",
      data: {
        cusmallToken: cusmallToken,
        amount: inputMoney
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          that.setData({
            page: 1,
            total: -1
          });
          that.loadData(false, that.data.page);
          wx.showModal({
            title: "提示",
            content: "提取成功",
            showCancel: false,
            success: function (res) {
              that.setData({
                modalSta: [true, true]
              });
              that.getPromoterAccount();
            }
          });
        }else {
          wx.showModal({
            title: "提示",
            content: data.msg,
            showCancel: false
          });
        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
  },
  getPromoterAccount: function () {
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/distributor/getPromoterAccount",
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        let data = res.data;
        if (data && 0 == data.ret) {
          if (data.model.promoterAccount) {
            let mpro = data.model.promoterAccount;
            
            this.setData({
              isBind: true,
              headPic: mpro.headPic,
              enableWithdrawMoney: mpro.enableWithdrawMoney,
              nickName: mpro.nickName,
              name: mpro.name,
              tel: mpro.phone,
              alipayAccount: mpro.alipayAccount || '',
              bankAccount: mpro.bankAccount || '',
              bankName: mpro.bankName || '',
              withdrawAccIndex: -1
            }, () => {
              this.data.withdrawAccList.forEach((item, idx) => {
                if (item.type == mpro.withdrawAccType) {
                  this.setData({
                    withdrawAccIndex: idx
                  })
                  if (2 == this.data.withdrawAccReqRule) {
                    if (item.type == 'zfb') {
                      this.setData({
                        showZfb: true
                      })
                    }
                    if (item.type == 'bank') {
                      this.setData({
                        showBank: true
                      })
                    }
                  }
                }
              })
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
  onPickChange: function(event){
    console.log(event);
    this.setData({
      withdrawAccIndex: event.detail.value
    }, () => {
      if ('zfb' == this.data.withdrawAccList[this.data.withdrawAccIndex].type) {
        this.setData({
          showZfb: true,
          showBank: false
        })
      } 
      if ('bank' == this.data.withdrawAccList[this.data.withdrawAccIndex].type) {
        this.setData({
          showZfb: false,
          showBank: true
        })
      }
    })
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
    if(this.data.isLoading){
      return;
    }
    this.data.page = 1;
    this.setData({
      total: -1
    });
    this.loadData(false, this.data.page);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.isLoading) {
      return;
    }
    this.data.page = ++this.data.page;
    this.loadData(true, this.data.page);
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {

  }
}))