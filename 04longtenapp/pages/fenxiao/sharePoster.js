var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
// pages/fenxiao/sharePoster.js
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    app,
    staticResPath: cf.config.staticResPath,
    authType:'back', //拒绝授权 返回前页
    userImagePath: cf.config.userImagePath,
    fxStaticResPath: cf.config.staticResPath + "/image/mobile/fx/",
    posterUrl:"",
    fxShareId:""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu();
    let self = this;

    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      wx.request({
        url: cf.config.pageDomain + "/applet/mobile/distributor/genSharePoster",
        data: {
          cusmallToken: cusmallToken,
          isCover: false,
          page: "pages/index/index"
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          let data = res.data;
          console.log(data)
          if(data && 0 == data.ret){
            self.setData({
              posterUrl: data.model.qrcodeUrl
            });
            wx.showLoading({
              title: '加载中',
            })
            self.setData({
              fxShareId: data.model.scene
            });
          }else{
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
      util.afterPageLoad(self);
    });

  },
  loadDone:function(){
    wx.hideLoading();
  },
  showImgPre:function(){
    let self = this;
    if (self.data.posterUrl){
      wx.previewImage({
        current: self.data.posterUrl, // 当前显示图片的http链接
        urls: [self.data.posterUrl] // 需要预览的图片http链接列表
      });
    }

  },
  saveImg:function(){
    let self = this;
    console.log(self.data.posterUrl)
    if (self.data.posterUrl) {
      wx.previewImage({
        current: self.data.posterUrl, // 当前显示图片的http链接
        urls: [self.data.posterUrl] // 需要预览的图片http链接列表
      });
    }
    // wx.downloadFile({
    //   url: self.data.posterUrl,
    //   success: function (res){
    //     if (res.statusCode === 200) {
    //       console.log(res.tempFilePath);
    //       wx.saveImageToPhotosAlbum({
    //         filePath: res.tempFilePath,
    //         success:function(res){
    //           console.log(res)
    //           wx.showModal({
    //             title: "提示",
    //             content: "保存成功",
    //             showCancel: false
    //           });
    //         },
    //         fail:function(res){
    //           console.log(res)
    //           wx.showModal({
    //             title: "提示",
    //             content: "保存失败：" + res.errMsg,
    //             showCancel: false
    //           });
    //         }
    //       })
    //     }
    //   },
    //   fail:function(){
    //     wx.showModal({
    //       title: "提示",
    //       content: "下载图片失败" + res.errMsg,
    //       showCancel: false
    //     });
    //   }
    // })

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
    let that = this;
    let shareObj = {
      title: "分销",
      path: "/pages/index/index?fxShareId="+that.data.fxShareId,
      success: function (res) {
        // 成功
      },
      fail: function (res) {
        // 失败
      }
    };

    return shareObj;
  }
}))
