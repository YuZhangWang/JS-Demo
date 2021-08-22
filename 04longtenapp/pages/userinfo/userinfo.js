// pages/userinfo/userinfo.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu();
  },

  userInfoHandler:function(res){
    let app = getApp();
    if (res.detail.encryptedData){
      wx.setStorageSync('userInfo', res.detail.userInfo);
      app.globalData.userinfoDetailData = res.detail;
      wx.navigateTo({
        url: app.globalData.userinfoBackPage
      })
    } else {
      wx.showModal({
        title: '用户授权',
        content: "拒绝授权将无法体验完整功能，建议打开授权",
        showCancel: false,
        complete: function (res) {
       
        }
      })
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

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
  
  }
})