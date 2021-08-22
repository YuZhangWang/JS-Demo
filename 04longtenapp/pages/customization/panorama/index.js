var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    playMusic:true,
    animationData: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideLoading();
  },

  showMain:function(){
    let vm = this;
    vm.setData({
      "doorOpened":true
    });
    /**
    var animation = wx.createAnimation({
      transformOrigin: "0% 40%",
      duration: 2000,
      timingFunction: 'ease',
    })

    animation.rotateY(70).step();
    this.setData({
      animationData: animation.export()
    })
    */
    setTimeout(function(){
      vm.setData({
        "showMain": true
      });
    },2050);
  },
  showItem:function(e){
    let vm = this;
    let itemId = e.target.dataset.index;
    if(itemId == 11){
      wx.navigateTo({
        url: '/pages/subCategory/subpage?pageId=7756',
      })
    } else if (itemId == 12){
      wx.navigateTo({
        url: '/pages/form/form?id=731',
      })
    }else {
      vm.setData({
        showDialog:true,
        dialogIndex:itemId
      });
    }
    
  },
  handleCloseDialog:function(e){
    let vm = this;
    vm.setData({
      showDialog:false
    })
  },
  handleDialogBtn:function(e){
    let vm = this;
    let itemId = vm.data.dialogIndex;
    if(itemId == 1){
      wx.navigateTo({
        url: '/pages/detail/detail?id=18631',
      })
    } else if(itemId ==2){
      wx.navigateTo({
        url: '/pages/detail/detail?id=18602',
      })
    } else if (itemId == 3) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18629',
      })
    } else if (itemId == 4) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18618',
      })
    } else if (itemId == 5) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18619',
      })
    } else if (itemId == 6) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18622',
      })
    } else if (itemId == 7) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18612',
      })
    } else if (itemId == 8) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18615',
      })
    } else if (itemId == 9) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18600',
      })
    } else if (itemId == 10) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18610',
      })
    } else if (itemId == 11) {
      wx.navigateTo({
        url: '/pages/subCategory/subpage?id=7756',
      })
    } else if (itemId == 12) {
      wx.navigateTo({
        url: '/pages/form/form?id=736',
      })
    } else if(itemId == 13){
      vm.setData({
        showDialog: false
      })
    } else if (itemId == 14) {
      wx.navigateTo({
        url: '/pages/detail/detail?id=18633',
      })
    } 
  },
  handlePlayMusic:function(){
    let vm = this;
    vm.setData({
      playMusic: !vm.data.playMusic
    })
    if(vm.data.playMusic){
      vm.audioCtx.play();
    } else {
      vm.audioCtx.pause();
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.audioCtx = wx.createAudioContext('bgMusic');
    this.audioCtx.play();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if (this.data.playMusic && this.audioCtx) {
      this.audioCtx.play();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.audioCtx.pause();
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