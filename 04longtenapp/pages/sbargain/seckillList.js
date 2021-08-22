// pages/sbargain/seckillList.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var app = getApp();
var cusmallToken = wx.getStorageSync('cusmallToken');
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
var atySecTimer;
Page(Object.assign({}, baseHandle, commHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    secListStatus: 1,
    countDownList: [],
    page: 1,
    total: -1,
    pageList: [],
    isLoading: false,
    isBottom: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;

    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      let mallsite = wx.getStorageSync('mallSite');
      wx.setNavigationBarTitle({
        title: mallsite.name,
      })
      that.getSKData(false, 1);
      util.afterPageLoad(that);
    });

  },
  changeList: function(e){

    if (this.data.isLoading) {
      return;
    }
    this.setData({
      pageList: []
    });
    this.setData({
      countDownList:[]
    });
    this.setData({
      isBottom:false
    })
    let dataset = e.currentTarget.dataset;
    this.setData({
      secListStatus: dataset.list
    });
    this.data.page = 1;
    this.setData({
      total: -1
    });
    clearInterval(atySecTimer);
    this.getSKData(false, 1);

  },

  getSKData(more, page){
    let list = this.data.pageList;
    let countDownList = this.data.countDownList;
    let cxt = this;
    cxt.setData({
      isLoading: true
    });
    if (cxt.data.total == list.length) {
      cxt.setData({
        isBottom: true
      });
      cxt.setData({
        isLoading: false
      });
      return;
    }
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/busi/queryActivityList',
      data: {
        cusmallToken: cusmallToken,
        start: (page - 1) * 7,
        end:7,
        activityType:3,
        status: cxt.data.secListStatus
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(res);
        if (data && 0 == data.ret) {
          let rets = data.model.records || [];
          let mCountDownList = [];
          for (let i in rets) {
            // rets[i].createTime = util.formatTime(new Date(rets[i].createTime));
            let mDate = {
              endTime: rets[i].endTime,
              startTime: rets[i].startTime
            }
            mCountDownList.push(mDate);
            rets[i].eo = JSON.parse(rets[i].extendOperation);
          }
          cxt.setData({
            total: data.model.total
          });
          if (more) {
            cxt.setData({
              pageList: list.concat(rets)
            });
            cxt.setData({
              countDownList: countDownList.concat(mCountDownList)
            })
          } else {
            cxt.setData({
              pageList: rets
            });
            cxt.setData({
              countDownList: mCountDownList
            })
          }
          if (0 == rets.length) {
            cxt.setData({
              isBottom: true
            });
          }

          if (cxt.data.pageList.length > 0){
            atySecTimer = setInterval(function () {
              let countDownList = cxt.data.countDownList;
              for (let i = 0; i < countDownList.length; i++) {

                if (0 == cxt.data.secListStatus) {
                  cxt.showCountDownList(countDownList[i].startTime, countDownList[i]);
                } else if (1 == cxt.data.secListStatus) {
                  cxt.showCountDownList(countDownList[i].endTime, countDownList[i]);
                }
              }
              cxt.setData({
                countDownList: countDownList
              })
            }, 1000);
          }

        }
      },
      complete: function () {
        cxt.setData({
          isLoading: false
        });

        wx.hideLoading();
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
  // onLaunch: function () {
  //   this.setSecAtyTimer()
  // },
  onShow: function () {
    this.setSecAtyTimer()
  },
  setSecAtyTimer:function(){
    if (undefined == atySecTimer){
      return;
    }
    let cxt = this;
    atySecTimer = setInterval(function () {
      console.log(2)
      let countDownList = cxt.data.countDownList;
      for (let i = 0; i < countDownList.length; i++) {

        if (0 == cxt.data.secListStatus) {
          cxt.showCountDownList(countDownList[i].startTime, countDownList[i]);
        } else if (1 == cxt.data.secListStatus) {
          cxt.showCountDownList(countDownList[i].endTime, countDownList[i]);
        }
      }
      cxt.setData({
        countDownList: countDownList
      })
    }, 1000);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    clearInterval(atySecTimer);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    clearInterval(atySecTimer);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

    if (this.data.isLoading) {
      return;
    }
    this.data.page = 1;
    this.setData({
      total: -1
    });
    clearInterval(atySecTimer);
    this.getSKData(false, this.data.page);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.isLoading) {
      return;
    }
    this.data.page = ++this.data.page;
    this.getSKData(true, this.data.page);
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
    let that = this;
    let shareObj = that.getShareConfig();
    return shareObj;
  }
}))
