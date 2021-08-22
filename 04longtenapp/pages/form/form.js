// orderinfo.js
const date = new Date()
const months = []
const days = []
const hours = []
const minutes = []


for (let i = 1; i <= 12; i++) {
  let name = "" + i;
  months.push({
    "key": i,
    "name": name + "月"
  })
}

for (let i = 1; i <= 31; i++) {
  let name = "" + i;
  days.push({
    "key": i,
    "name": name + "日"
  })
}
for (let i = 0; i <= 23; i++) {
  let name = "" + i;
  if (name.length == 1) {
    name = "0" + name;
  }
  hours.push({
    "key": i,
    "name": name + "时"
  })
}
for (let i = 0; i <= 59; i++) {
  let name = "" + i;
  if (name.length == 1) {
    name = "0" + name;
  }
  minutes.push({
    "key": i,
    "name": name + "分"
  })
}
const dateTime = [months, days, hours, minutes]
const dateValue = [date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes()]
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
Page(Object.assign({}, commHandle, baseHandle, {
  /**
   * 页面的初始数据
   */
  data: {
    id: "",
    dateTime: dateTime,
    dateValue: dateValue,
    app: app,
    formData: {},
    selectData: [],
    needUserInfo: true,
    bannerHeight: {},
    has_get_vcode: false,
    skipUserInfoOauth: true,
    authType: 1, //页面授权拒绝停留当前页面
    vcodeGetTime: 0,
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    items: {},
    submitItems: [],
    btnBgColor: "#f93710",
    btnColor: "#fff",
    btnTitle: "提交信息",
    btnLoading: false,
    btnShow: false,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    emptyForm: false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    // cusmallToken = wx.getStorageSync('cusmallToken');
    // mallSiteId = wx.getStorageSync('mallSiteId');
    // wx.hideShareMenu();//隐藏
    var pageId = options.id;
    // that.setData({
    //   options:options
    // })
    if (options.scene) {
      // 处理预览ID
      var scene = decodeURIComponent(options.scene);
      var params = scene.split("=");
      if (params[0] == "pageid") {
        pageId = params[1];
      }
    }
    that.setData({
      id: pageId
    });
    app.getUserInfo(this, options, function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      // mallSite = wx.getStorageSync('mallSite');
      that.fetchData();
      util.afterPageLoad(that);
    })

    //that.setData({id:19});//特殊定制，为了调试方便，不可提交

    // if ("FX" == options.shareType) {
    //   that.bindPromoter(options.fromOpenId);
    // }
    // util.afterPageLoad(that);
  },

  /* 页面授权信息 */
  AuthPage: function () {
    let options = this.data.options;
    app.getUserInfo(this, options, function (userInfo, res) { });
  },
  fetchData: function () {
    var that = this;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/form/findByFormId',
      data: {
        cusmallToken: cusmallToken,
        formId: that.data.id
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          console.log(res.data);
          if (res.data && res.data.model.form) {
            var form = res.data.model.form;
            form.decoration = JSON.parse(form.decoration);
            if (form.decoration.header_data.title) {
              wx.setNavigationBarTitle({ //重置表单名称
                title: form.decoration.header_data.title
              })
            }
            if (form.decoration.header_data.return_index == "1") {
              that.setData({
                returnIndex: true
              })
            }
            if (0 == form.decoration.items.length) {
              that.setData({
                emptyForm: true
              });
            }
            for (var i = 0; i < form.decoration.items.length; i++) {
              form.decoration.items[i].key = i;
            }
            for (var i = 0; i < form.decoration.items.length; i++) {
              var item = form.decoration.items[i];
              if (item.item_type == 'formBtnWidget') {
                var btnData = item.data;
                if (btnData.bgColor) {
                  that.setData({
                    btnBgColor: btnData.bgColor
                  });
                }
                if (btnData.fontColor) {
                  that.setData({
                    btnColor: btnData.fontColor
                  });
                }
                if (btnData.btnTxt) {
                  that.setData({
                    btnTitle: btnData.btnTxt
                  });
                }
                if (btnData.isPay) {
                  that.setData({
                    isPay: btnData.isPay
                  })
                }
                if (btnData.paymoney) (that.setData({
                  paymoney: btnData.paymoney
                }))
              }
              that.setData({
                btnShow: true
              });
            };
            util.processDecorationData(form.decoration, that);
            that.setData({
              formData: form,
              items: form.decoration.items,
              submitItems: form.decoration.items
            });
          }
          wx.hideLoading();
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取表单信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  // 微信支付
  getPayParams(goodDescribe, orderNo, price, callback) {
    let ctx = this;
    console.log(price)
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/wxpay/generateWxPayOrder',
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        goodDescribe: goodDescribe,
        out_trade_no: orderNo,
        total_fee: price
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
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
            'success': callback,
            'fail': function (res) {
              wx.showModal({
                title: '支付失败',
                showCancel: false,
                content: "尚未完成支付",
                success: function (res) {
                  wx.showModal({
                    title: '提示',
                    showCancel: false,
                    content: '购买失败：' + res.data.msg,
                    success: function (res) {
                      wx.hideLoading();
                      ctx.toastTips("提交失败");
                    }
                  })
                }
              })
            },
            complete: function () {
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
          return false;

        }


      },
      fail: function () { },
      complete: function () { }
    });
  },
  addFormOrder(formid, callback) {
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/form/addFormOrder',
      data: {
        cusmallToken: cusmallToken,
        formId: formid,
      },
      header: {
        'content-type': 'application/json'
      },
      success: callback
    })
  },
  submitFrom: function (e) {
    if (!this.checkUserInfo()) {
      return false;
    }
    var that = this;
    console.log(e);
    let wxFormId = e.detail.formId;
    console.log(wxFormId);
    if (that.data.btnLoading) {
      return false
    }
    var submitItems = that.data.submitItems;
    var submitData = [];
    var paydes = '';
    if (that.data.formData.name) {
      paydes = that.data.formData.name
    }
    console.log(submitItems);
    for (var i = 0; i < submitItems.length; i++) {
      var submitItem = submitItems[i];
      console.log(submitItem);
      if (submitItem.item_type == "singleInputWidget" ||
        submitItem.item_type == "multilineInputWidget" ||
        submitItem.item_type == "imageUpload" ||
        submitItem.item_type == "dateWidget" ||
        submitItem.item_type == "selectWidget" ||
        submitItem.item_type == "radioWidget" ||
        submitItem.item_type == "addressWidget" ||
        submitItem.item_type == "telInputWidget") {
        var isReq = submitItem.data.isReq;
        if (isReq == 1 && (!submitItem.submitVal)) {
          var reqText = "请输入" + submitItem.data.labelTxt;
          if (submitItem.item_type == "imageUpload") {
            reqText = "请上传" + submitItem.data.labelTxt;
          }
          if (submitItem.item_type == "dateWidget") {
            reqText = "请选择" + submitItem.data.labelTxt;
          }
          if (submitItem.item_type == "selectWidget") {
            reqText = "请选择" + submitItem.data.labelTxt;
          }
          if (submitItem.item_type == "radioWidget") {
            reqText = "请选择" + submitItem.data.labelTxt;
          }
          if (submitItem.item_type == "addressWidget") {
            reqText = "请选择" + submitItem.data.labelTxt1;
          }
          if (submitItem.item_type == "telInputWidget") {
            if (!that.data.phoneNumber) {
              reqText = "请输入" + submitItem.data.labelTxt;
            } else if (!that.data.smsCode) {
              reqText = "请输入验证码";
            }

          }
          that.showAlertModal(reqText);
          return false;
        } else {
          if (submitItem.item_type == "singleInputWidget" || submitItem.item_type == "multilineInputWidget") {
            if (submitItem.submitVal && submitItem.minlimitnum && submitItem.minlimitnum != -1) {
              if (submitItem.submitVal.length < submitItem.minlimitnum) {
                wx.showModal({
                  title: '提示',
                  showCancel: false,
                  content: submitItem.data.labelTxt + "最少输入" + submitItem.minlimitnum + "位"
                })
                return false;
              }

            }
            if (submitItem.submitVal && submitItem.maxlimitnum && submitItem.maxlimitnum != -1) {
              if (submitItem.submitVal.length > submitItem.maxlimitnum) {
                wx.showModal({
                  title: '提示',
                  showCancel: false,
                  content: submitItem.data.labelTxt + "最多输入" + submitItem.maxlimitnum + "位"
                })
                return false;
              }

            }
          }
          if (submitItem.item_type == "telInputWidget" && that.data.phoneNumber) {
            if (!that.data.authTell) {
              wx.showModal({
                title: '提示！',
                content: '手机号格式有误',
                showCancel: false
              });
              return false
            } else if (submitItem.data.authCode == 1 && !that.data.smsCode) {
              wx.showModal({
                title: '提示！',
                content: '请输入验证码',
                showCancel: false
              });
              return false
            }
          }
          if (submitItem.item_type == "radioWidget") {
            if (submitItem.data.selectType == 0) {

              if (isReq == 1 && !submitItem.submitVal) {
                wx.showModal({
                  title: '提示',
                  showCancel: false,
                  content: "请选择" + submitItem.data.labelTxt
                })
                return false;
              }
              var selectData = submitItem.submitVal ? submitItem.submitVal.split(',') : [];
              var selectlength = selectData.length;
              if ((selectlength > 0) && (selectlength > parseInt(submitItem.data.mostSelected) || selectlength < parseInt(submitItem.data.leastSelected))) {
                reqText = '至少选择' + parseInt(submitItem.data.leastSelected) + '项，最多' + parseInt(submitItem.data.mostSelected) + '项';
                that.showAlertModal(reqText);
                return false;
              }
            }

          }

          var submitVal = submitItem.submitVal || "";
          var submitInfo = {
            title: submitItem.data.labelTxt,
            val: submitVal,
            "type": "text"
          };
          if (submitItem.item_type == "imageUpload") {
            submitInfo.type = "image";
          }
          if (submitItem.item_type == "dateWidget") {
            submitInfo.type = "date";
          }
          if (submitItem.item_type == "addressWidget") {
            submitInfo.title = submitItem.data.labelTxt1;
          }
          submitData.push(submitInfo);
        }
      }
    }
    if (submitData.length == 0) {
      wx.showModal({
        title: '提交信息异常',
        showCancel: false,
        content: "没有可提交的信息"
      })
      return false;
    }
    // 订阅消息
    that.requestSubMsg(
      that.getMsgConfig([{
        name: 'user',
        msgcode: "2001"
      }]),
      function (resp) {
        console.log(resp)
        // that.addFormOrder(that.data.formData.id, function (res) {

        // })
        wx.request({
          url: cf.config.pageDomain + '/applet/mobile/form/collectInfo',
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          method: "POST",
          data: {
            cusmallToken: cusmallToken,
            formId: that.data.id,
            phoneNum: (that.data.smsCode && that.data.phoneNumber) ? that.data.phoneNumber : '',
            code: (that.data.smsCode && that.data.phoneNumber) ? that.data.smsCode : '',
            wxFormId: wxFormId,
            collectInfo: JSON.stringify(submitData)
          },
          success: function (res) {
            that.setData({
              btnLoading: false
            });
            if (res.data.ret == 0) {

              var orderdata = res.data.model.order;
              if (orderdata && parseFloat(that.data.paymoney) > 0 && that.data.isPay == '1') {
                that.getPayParams(paydes, orderdata.tradeNo, orderdata.price, function () {
                  wx.showLoading({
                    title: '信息提交中'
                  });
                  that.setData({
                    btnLoading: true
                  });
                  wx.showModal({
                    title: '提示',
                    showCancel: false,
                    content: "支付成功",
                    success: function (res) {
                      // 订阅消息
                      that.requestSubMsg(
                        that.getMsgConfig([{
                          name: 'order',
                          msgcode: "1002"
                        }]),
                        function (resp) {
                          console.log(resp)
                          that.toastTips("提交成功");

                        });

                    }
                  })
                });
              } else {
                that.toastTips("提交成功");
              }

            } else {
              wx.hideLoading();
              wx.showModal({
                title: '提示',
                showCancel: false,
                content: res.data.msg
              })
            }
          }
        })



      });





  },
  bindRegionChange(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value);
    var that = this;
    var index = e.currentTarget.dataset.idx;
    var addressVal = that.data.submitItems[index].addressVal || "";
    that.setData({
      ["submitItems[" + index + "].areaVal"]: e.detail.value,
      ["submitItems[" + index + "].submitVal"]: e.detail.value.join(",") + addressVal
    });
  },
  bindRegionInput(e) {
    var that = this;
    var index = e.currentTarget.dataset.idx;
    var areaVal = that.data.submitItems[index].areaVal || [];
    that.setData({
      ["submitItems[" + index + "].addressVal"]: e.detail.value,
      ["submitItems[" + index + "].submitVal"]: areaVal.join(",") + e.detail.value
    });
  },
  showAlertModal(text) {
    wx.showModal({
      title: '信息必填项为空',
      showCancel: false,
      content: text
    })
  },
  toastTips: function (title) {
    wx.showToast({
      title: title,
      icon: "success",
      /*image:"/image/wechat.png",*/
      duration: 1500,
      success: function () {
        setTimeout(function () {
          wx.navigateBack({
            delta: 1
          });
        }, 1000);

      },
      mask: true
    })
  },
  radioChange: function (e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    var that = this;
    var index = e.currentTarget.dataset.idx;
    that.setData({
      ["submitItems[" + index + "].submitVal"]: e.detail.value
    });

  },
  checkboxChange: function (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value)
    var that = this;
    var index = e.currentTarget.dataset.idx;
    that.setData({
      ["submitItems[" + index + "].submitVal"]: e.detail.value.join(",")
    });

  },
  bindKeyInput: function (e) {
    console.log("tips", e.currentTarget.dataset.place);
    var maxlimitnum = parseInt(e.currentTarget.dataset.maxlimitnum);
    var minlimitnum = parseInt(e.currentTarget.dataset.minlimitnum);

    var numPlace = e.currentTarget.dataset.place;
    var that = this;
    var trimVal = that.trim(e.detail.value);
    console.log()
    var index = e.currentTarget.dataset.index;
    that.data.submitItems[index].submitVal = trimVal;
    that.data.submitItems[index].minlimitnum = minlimitnum;
    that.data.submitItems[index].maxlimitnum = maxlimitnum;

    that.setData({
      ["submitItems[" + index + "].submitVal"]: trimVal,
      ["items[" + index + "].num"]: parseInt(trimVal.length),
      ["submitItems[" + index + "].minlimitnum"]: minlimitnum,
      ["submitItems[" + index + "].maxlimitnum"]: maxlimitnum,

    })

  },
  //验证码倒计时
  _initVcodeTimer: function (index) {
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
  //获取验证码点击事件
  tapGetVcode: function (e) {
    if (!this.data.authTell) {
      wx.showModal({
        title: '提示！',
        content: '手机号格式有误',
        showCancel: false
      });
      return false;
    }
    //获取vcode
    console.log(e);
    var that = this;
    var index = e.currentTarget.dataset.index;
    that._initVcodeTimer(index);
    //执行请求，获取vcode
    that.getVcode(index);
  },
  //获取验证码
  getVcode: function (index) {
    var that = this;
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/common/sendCode',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST",
      data: {
        cusmallToken: cusmallToken,
        phoneNum: that.data.phoneNumber,
        sceneType: 'formsubmit_tel_code'
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
  bindPhoneInput: function (e) {
    var that = this;
    var trimVal = that.trim(e.detail.value);
    var index = e.currentTarget.dataset.index;
    console.log(index);
    that.data.submitItems[index].submitVal = trimVal;
    that.setData({
      ["submitItems[" + index + "].submitVal"]: trimVal,
      phoneNumber: trimVal,
    });
  },
  bindTellInput: function (e) {
    var that = this;
    var trimVal = that.trim(e.detail.value);
    var index = e.currentTarget.dataset.index;
    that.data.submitItems[index].submitVal = trimVal;
    var regIphone = (/^1([3-9][0-9]{9})$/.test(trimVal));
    console.log(regIphone);
    that.setData({
      ["submitItems[" + index + "].submitVal"]: trimVal,
      phoneNumber: e.detail.value,
    });
    if (regIphone) {
      that.setData({
        authTell: true,
      });
    } else {
      that.setData({
        authTell: false,
      });
    }
  },
  bindCodelInput: function (e) {
    var that = this;
    var trimVal = that.trim(e.detail.value);
    var index = e.currentTarget.dataset.index;
    that.setData({
      smsCode: trimVal,
    });
  },
  trim: function (s) {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  trimNum: function (num) {
    return num.replace(/(^1+\d{10}|(\d*$))/g, "");
  },
  formTitleTap: function (e) {
    var that = this;
    var item = e.currentTarget.dataset.item;
    if ((!item.url) && (!item.link_type)) {
      return false;
    }
    if (item.link_type == 18) {
      wx.makePhoneCall({
        phoneNumber: item.link_telnum
      })
    } else {
      var curUrl = that.titleLink(item);
      wx.navigateTo({
        url: curUrl
      })
    }
  },
  titleLink: function (item) {
    if (item && item.link_type) {
      if (item.link_type == 1) {
        item.url = "test";
      } else if (item.link_type == 8) {
        item.url = "/pages/index/index";
      } else if (item.link_type == 9) {
        item.url = item.url;
      } else if (item.link_type == 13) {
        item.url = "/pages/subCategory/subpage?pageId=" + item.pageid;
      } else if (item.link_type == 15) {
        item.url = "/pages/category/category";
      } else if (item.link_type == 16) {
        item.url = "/pages/shoppingcar/shoppingcar";
      } else if (item.link_type == 17) {
        item.url = "/pages/uniquecenter/uniquecenter";
      } else if (item.link_type == 18) {
        item.url = item.link_telnum;
      } else if (item.link_type == 19) {
        item.url = "lbs:" + item.pageid + ":" + item.style + ":" + item.link_name;
      } else if (item.link_type == 21) {
        item.url = "/pages/takeout/index";
      } else {
        item.url = item.url;
      }
    } else {
      item.url = "blank";
    }
    return item.url;
  },

  handleAddImage: function (e) {
    // if (!this.checkUserInfo()) {
    //   return false;
    // }
    let that = this;
    let index = e.currentTarget.dataset.index;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths, index);
      }
    })
  },

  bindTimeChange: function (e) {
    let vm = this;
    console.log(e);
    let fieldIndex = e.target.dataset.fieldindex;
    let pickValue = e.detail.value;
    let submitValue = dateTime[0][pickValue[0]].name + dateTime[1][pickValue[1]].name +
      dateTime[2][pickValue[2]].name + dateTime[3][pickValue[3]].name;
    vm.setData({
      ["submitItems[" + fieldIndex + "].submitVal"]: submitValue
    });
  },
  bindSelectChange(e) {
    console.log(e)
    let that = this;
    let idxItem = e.target.dataset.idx;
    let idxSel = e.detail.value;
    let txt = that.data.submitItems[idxItem].data.list[idxSel].itemTxt;
    that.setData({
      ["submitItems[" + idxItem + "].submitVal"]: txt
    });
  },
  upload: function (page, path, index) {
    let vm = this;
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
          let uploadImgList = [];
          if (vm.data.submitItems[index].submitVal) {
            uploadImgList = vm.data.submitItems[index].submitVal.split(",");
          }
          uploadImgList.push(data.fileName);
          vm.setData({
            ["submitItems[" + index + "].submitVal"]: uploadImgList.join(",")
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

  handleDelImg: function (e) {
    let vm = this;
    let fieldIndex = e.target.dataset.fieldindex;
    let idx = e.target.dataset.index;
    let imgList = [];
    if (vm.data.submitItems[fieldIndex].submitVal) {
      imgList = vm.data.submitItems[fieldIndex].submitVal.split(",");
    }
    imgList.splice(idx, 1);
    vm.setData({
      ["submitItems[" + fieldIndex + "].submitVal"]: imgList.join(",")
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () { },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () { },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () { },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () { },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () { },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () { },
  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
    let path = "/pages/form/form?id=" + this.data.id;
    let userInfo = wx.getStorageSync('userInfo');
    let mallSite = wx.getStorageSync('mallSite');
    let headerData = wx.getStorageSync('headerData');
    let title = mallSite.name;
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : ""
    if (app.globalData.isDistributor && app.globalData.isOpenDistribution) {
      path += "&fromOpenId=" + app.globalData.myOpenid + "&shareType=FX";
      title = userInfo.nickName + "@你来看" + mallSite.name;
    }
    let shareObj = {
      title: title,
      path: path,
      imageUrl: imageUrl,
      success: function (res) {
        // 成功
      },
      fail: function (res) {
        // 失败
      }
    };

    return shareObj;
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () { },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () { }
}))