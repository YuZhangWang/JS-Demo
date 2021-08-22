// pages/judgeList/judgeList.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    status: "",
    app: app,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    goodsId:"",
    judgeList:[],
    start:0,
    total:0,
    limit:10,
    judgeScore:"",
    imgList:[],
    source:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.hideShareMenu();
    app.getUserInfo(this,options,function (userInfo, res) {
      cusmallToken = wx.getStorageSync('cusmallToken');
      mallSiteId = wx.getStorageSync('mallSiteId');
      that.setData({ goodsId: options.goodsId, source: options.source || 0 });
      that.fetchData();
      util.afterPageLoad(that);
    });
  },
  fetchData:function(){
    var vm = this;
    var start = vm.data.judgeList.length;
    wx.showLoading({
      title: "加载中",
    })
    let mallSiteId = wx.getStorageSync('mallSiteId');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/review/queryReviews',
      data:{
        mallSiteId: mallSiteId,
        cusmallToken: cusmallToken,
        goodsId:vm.data.goodsId,
        start: start,
        limit:vm.data.limit,
        source: vm.data.source
      },
      header:{
        "content":"application/json"
      },
      success:function(res){
        console.log(res.data);
        wx.hideLoading();
        if(res.data.ret == 0){
          var judgeList = res.data.model.reviews;
          for(var i=0;i<judgeList.length;i++){
            judgeList[i].reviewTime = util.formatDate(new Date(judgeList[i].reviewTime));
            vm.data.imgList.push(judgeList[i].pic.split(",").map(function(img){
              return vm.data.userImagePath + img;
            }));
          }
          vm.setData({"judgeList":vm.data.judgeList.concat(judgeList)});
          vm.setData({"total":res.data.model.total});
          if (vm.data.judgeList.length >= res.data.model.total) {
            vm.setData({ "nomore": true });
          } else {
            vm.setData({ "nomore": false });
          }
        }
      }
    })
  },
  handleImgTap: function (e) {
    let vm = this;
    let idx = e.target.dataset.index;
    let oidx = e.target.dataset.oidx;
    let imgList = vm.data.imgList[oidx];
    wx.previewImage({
      current: imgList[idx], // 当前显示图片的http链接
      urls: imgList // 需要预览的图片http链接列表
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
    var that = this;
    if (that.data.judgeList.length < that.data.total) {
      that.fetchData();
    }
  },

  /**
   * 用户点击右上角
   */
  onShareAppMessage: function () {
  
  }
}))