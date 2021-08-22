// pages/backuppage/backup2.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isCheck:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideLoading()
  },
  toggleCheckbox(){
    console.log(1);
    let f = this.data.isCheck
    this.setData({
      isCheck: !f
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
    wx.request({
      url: "",
      data: {
      },
      // method: "POST",
      // header: { "Content-Type": "application/x-www-form-urlencoded" },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
      },
      fail() {

      },
      complete() {

      }
    })
  }
})