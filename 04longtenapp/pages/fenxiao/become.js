var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
// pages/fenxiao/become.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    fxStaticResPath: cf.config.staticResPath + "/image/mobile/fx/",
    applyStatus: [true, false, false, false],
    showPopup: false,
    showInput: false,
    hasOpenApproval: false,
    skipUserInfoOauth: true,
    authType: 1, //拒绝授权 停留当前页
    agreeCheck: 0,
    state: '',
    isDistributor: '',
    applyRemark: '',
    formlist: '',
    uploadImg: '',
    name:"",
    tel:'',
    pageConfig: null,
    applyAgreementTitle: "代言特别协议",
    applyAgreementContent: "申请成代言的小伙伴，请确认此申请行为是以个人名义申请成为代言人，并且是以个人名义从事此活动，与本人所供职的单位和从事的职业无任何利益关系；同时请确认，代言人与我方店铺之间仅为合作伙伴关系，并非劳动或劳务关系。"

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    that.data.options = options;
    app.getUserInfo(this, options, function (userInfo, res) {
      wx.hideLoading()
      cusmallToken = wx.getStorageSync('cusmallToken');
      that.getDistributorConfig()
      that.fetchUserIdentify();
      that.setData({
        state: app.globalData.State,
        isDistributor: app.globalData.isDistributor,
        applyRemark: app.globalData.applyRemark
      });
      util.afterPageLoad(that);

    });
  },
  //验证码倒计时
  _initVcodeTimer: function () {
    var that = this;
    var initTime = 60;
    that.setData({
      "has_get_vcode": true,
      "vcodeGetTime": initTime
    });
    var vcodeTimer = setInterval(function () {
      initTime--;
      that.setData({
        "vcodeGetTime": initTime
      });
      if (initTime <= 0) {
        clearInterval(vcodeTimer);
        that.setData({
          "has_get_vcode": false
        });
      }
    }, 1000);
  },
  /* 字符去空格 */
  trim: function (s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  //获取验证码点击事件
  tapGetVcode: function () {
    var that = this;
    var trimVal = that.trim(that.data.mobileNumber || '');
    var regIphone = (/^1([3-9][0-9]{9})$/.test(trimVal));
    if (!regIphone) {
      wx.showModal({
        title: '提示！',
        content: '手机号格式有误',
        showCancel: false
      });
      return false;
    }
    //vcode倒计时
    that._initVcodeTimer();
    //执行请求，获取vcode
    that.getVcode();
  },
  //获取验证码
  getVcode: function () {
    var that = this;
    console.log(that);
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/common/sendCode',
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        phoneNum: that.data.mobileNumber,
        sceneType: 'promoterapply_tel_code'
      },
      success: function (res) {
        console.log(res);
        if (res.data.ret == 0) {
          wx.showToast({
            title: "验证码已发送",
            icon: "success"
          });
        } else {
          that.setData({
            "has_get_vcode": false,
            vcodeGetTime: 0
          });
          wx.hideLoading();
          wx.showModal({
            title: '提示',
            showCancel: false,
            content: res.data.msg
          })
        }
      },
      error: function (error) {
        console.log(error);
      }
    })
  },
  /* 验证码输入 */
  bindCodeInput: function (e) {
    var that = this;
    var trimVal = that.trim(e.detail.value);
    that.setData({
      smsCode: trimVal,
    });
  },

  fetchUserIdentify: function () {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/distributor/queryUserIdentity',
      data: {
        cusmallToken: cusmallToken
      },
      header: {
        "content-type": "json"
      },
      success: function (res) {
        if (res.data && res.data.ret == 0) {
          that.setData({
            state: res.data.model.userIdentityVo.applyState,
            isDistributor: res.data.model.userIdentityVo.isDistributor,
            applyRemark: res.data.model.userIdentityVo.applyRemark
          });
        }
      }
    })
  },
  togglePopup: function () {
    this.setData({
      showPopup: !this.data.showPopup
    });
  },
  reApply: function () {
    var that = this;
    that.setData({
      state: null
    });
    console.log('dd', that.state);
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
  agreeChange(e) {
    let agree = e.currentTarget.dataset.sta;
    this.setData({
      agreeCheck: agree
    })
  },
  formSubmit: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    console.log(this.data.formlist);
    let that = this;
    let agree = 1 == this.data.agreeCheck;

    let applyAdditionalInfo = this.data.formlist;
    if (!that.data.name && that.data.showInput) {
      wx.showModal({
        title: "提示",
        content: "请填写姓名",
        showCancel: false
      });
      return;
    };
    if (!that.data.tel && that.data.showInput) {
      wx.showModal({
        title: "提示",
        content: "请填写手机号",
        showCancel: false
      });
      return;
    };
    
    if (applyAdditionalInfo) {
      for (var i = 2; i < applyAdditionalInfo.length; i++) {
        if (!applyAdditionalInfo[i].content) {
          wx.showModal({
            title: "提示",
            content: "请输入" + applyAdditionalInfo[i].title,
            showCancel: false
          });
          return;
        }
      }
    }
    
    if (!agree) {
      wx.showModal({
        title: "提示",
        content: "请阅读并同意【申请协议】",
        showCancel: false
      });
      return;
    };
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'fenxiao',
        msgcode: "4003"
      }]),
      function (resp) {
        console.log(resp)
        app.getUserInfo(this, {}, function (userInfo, res) {
          cusmallToken = wx.getStorageSync('cusmallToken');
          let submitData = {
            cusmallToken: cusmallToken,
            name: that.data.name,
            phone: that.data.tel,
            applyAdditionalInfo: applyAdditionalInfo
          };
          if (that.data.smsCode) {  //短信验证
            submitData.messCode = that.data.smsCode;
          }
          wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/becomePromoter",
            data: submitData,
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
              let data = res.data;
              if (data && 0 == data.ret) {
                app.globalData.isDistributor = true;
                app.globalData.isOpenDistribution = true;
                wx.showModal({
                  title: "提示",
                  content: "申请成功",
                  showCancel: false,
                  success: function (res) {
                    if (res.confirm) {
                      if (that.data.hasOpenApproval) {
                        wx.redirectTo({
                          url: "/pages/fenxiao/become"
                        })
                      } else {
                        console.log("jkl");
                        wx.redirectTo({
                          url: "/pages/fenxiao/myInfo"
                        })
                      }
                    }
                  }
                });
              } else {
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
        });
      });



  },
  bindTextInput: function (e) {
    var vm = this;
    console.log(e.currentTarget)
    if (e.currentTarget.id == 1) {  //联系电话标识
      vm.data.mobileNumber = e.detail.value;
    }
    if (vm.data.formlist[e.currentTarget.id].vcode) {
      let trimVal = this.trim(e.detail.value);
      this.setData({
        smsCode: trimVal,
      });
    }
    vm.data.formlist[e.currentTarget.id].content = e.detail.value;
    if (e.currentTarget.id == "0") {
      vm.setData({
        name: e.detail.value
      })
    }
    if (e.currentTarget.id == "1") {
      vm.setData({
        tel: e.detail.value
      })
    }

  },
  //上传图片
  handUploadImg: function (e) {
    let that = this;
    var currentIndex = e.currentTarget.dataset.index;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths, e);
      }
    })
  },

  upload: function (page, path, e) {
    let vm = this;
    console.log(e.currentTarget)

    wx.showToast({
      icon: "loading",
      title: "正在上传"
    }),
      wx.uploadFile({
        url: cf.config.pageDomain + '/mobile/common/imgupload?cusmallToken=' + cusmallToken,
        filePath: path[0],
        name: 'file',
        riskCheckType: 1,
        header: { "Content-Type": "multipart/form-data" },
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
          let uploadImg = data.fileName;
          vm.setData({
            ["formlist[" + e.currentTarget.dataset.index + "].content"]: uploadImg
          })
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
          wx.hideToast();  //隐藏Toast
        }
      })
  },

  handleDelImg: function (e) {
    let vm = this;
    console.log(e)
    vm.setData({
      uploadImg: ''
    })

  },
  getDistributorConfig: function () {
    let that = this;
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
          if (data.model.distributorConfig && data.model.distributorConfig.pageConfig) {
            var pageConfig = JSON.parse(data.model.distributorConfig.pageConfig);
            pageConfig.custBgDistri = 0 <= pageConfig.custBgDistri.indexOf("fx/banner") ? that.data.staticResPath + pageConfig.custBgDistri : that.data.userImagePath + pageConfig.custBgDistri;
            wx.setNavigationBarTitle({
              title: pageConfig.pageTitle ? pageConfig.pageTitle : that.data.pageTitle
            });
            that.setData({
              pageConfig: pageConfig
            });
          }
          that.setData({
            formlist: JSON.parse(data.model.distributorConfig.applyAdditionalInfo)
          });
          if (data.model.distributorConfig && (data.model.distributorConfig.switchEquity & (Math.pow(2, 1))) != 0) {
            that.setData({
              showInput: true
            });
          } else {
            that.setData({
              showInput: false
            });
          };
          if (data.model.distributorConfig && (data.model.distributorConfig.switchEquity & (Math.pow(2, 2))) != 0) {
            that.setData({
              hasOpenApproval: true
            });
          } else {
            that.setData({
              hasOpenApproval: false
            });
          }

          if (data.model.distributorConfig && 2 == data.model.distributorConfig.threshold) {
            that.setData({
              hasThreshold: true,
            });
            that.setData({
              thresholdMoney: data.model.distributorConfig.thresholdMoney || 0
            });

          }


          that.setData({
            threshol_req: data.model.threshol_req || false,
          });

        } else {

        }
      },
      fail: function () {
      },
      complete: function () {
      }
    });
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
