// pages/judge/judge.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var Zan = require('../../youzan/dist/index');
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var baseHandle = require("../template/baseHandle.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var inputContent = {};
Page(Object.assign({}, Zan.Toast, baseHandle, {

  /**
   * 页面的初始数据
   */
  data: {
    status:"",
    app: app,
    needUserInfo: true,
    staticResPath: cf.config.staticResPath,
    userImagePath: cf.config.userImagePath,
    goodsCover:null,
    inputContent:{},
    goodsId:null,
    orderId:null,
    score:5,
    content:"",
    goodsName:"",
    pic:"this is pic",
    isIntegralGift:"",
    integral:null,
    needCheck:null,
    uploadImgList: [],
    isTimeDiscountOrder:false
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
        that.setData({ id: options.goodsid });
        that.setData({ orderId: options.orderid });
        // 限时折扣订单评价
        if (options.isTimeDiscountOrder == 'true'){
          that.reqAtyingGoodsDetail(options.activityId, options.goodsid);
          that.setData({
            isTimeDiscountOrder: options.isTimeDiscountOrder
          })
        }else{
          that.fetchData();
        }

        that.isInteGralGift();
        that.getReviewConfig();
        
        /**
        util.getShoppingCartCount(function (count) {
          that.setData({ shoppingCartCount: count });
        });
        **/
        util.afterPageLoad(that);
      });
    },
    // 获取评论输入的内容
  input:function(e){
    console.log(e);
    var vm = this;
    vm.data.inputContent[e.currentTarget.id] = e.detail.value;
    console.log(vm.data.inputContent.judge);
  },
  handleScoreTap:function(e){
    var score = e.target.dataset.score;
    this.setData({"score":score});
  },
  // 活动详情
  reqAtyingGoodsDetail: function (activityid, awardsTypeId, cb) {
    wx.showLoading({
      title: '加载中',
    });
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/activity/time_discount/selectGoodsAward',
      data: {
        cusmallToken: cusmallToken,
        activityId: activityid,
        awardId: awardsTypeId,

      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
        
          let goodsData = data.model.award.timeDiscountGoodsAward.goods;
          that.setData({
            goodsCover: goodsData.goodsCover,
            goodsName: goodsData.name,
            price: goodsData.price
          });
          cb && cb();
        } else {
          wx.showModal({
            title: '提示',
            content: data.msg,
          })
        }

      },
      fail: function () {
        wx.hideLoading();
      },
      complete: function () {
        wx.hideLoading();
        that.setData({
          isDone: true
        })

      }
    });
  },
  // 评价积分管理
  isInteGralGift:function(){
    var vm = this;
    let mallSiteId = wx.getStorageSync('mallSiteId');
    wx.request({
      url:cf.config.pageDomain + "/applet/mobile/review/reviewGiftOfIntegral",
      type:"GET",
      header:{
        "content":"application/json"
      },
      data:{
        mallSiteId: mallSiteId,
        cusmallToken: cusmallToken
      },
      success:function(res){
        vm.setData({
          isIntegralGift : res.data.model.isIntegralGift
        });
        if (res.data.model.isIntegralGift == true) {
          vm.setData({
            integral: res.data.model.integral
          });
        }else{
          vm.setData({
            integral:0
          });
        }
      }
    })
  },
  // 评论是否通过审核
  getReviewConfig:function(){
    var vm = this;
    let mallSiteId = wx.getStorageSync('mallSiteId');
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/review/getReviewConfig",
      data:{
        mallSiteId:mallSiteId,
        cusmallToken: cusmallToken
      },
      type: "GET",
      header: {
        "content": "application/json"
      },
      success:function(res){
        vm.setData({
           needCheck: res.data.model.reviewConfig.needCheck
        })
      }
    })
  },

    // 点击提交事件
  submit:function(e){
    var vm = this;
    if(!vm.data.inputContent.judge){
      vm.showZanToast('请输入您的评价内容！');
      return false;
    }
    if(vm.data.inputContent.judge.length > 100){
      vm.showZanToast('最多允许输入100个汉字');
      return false;
    }
    wx.showLoading({
      title: '加载中',
    });
    let imgList = "";
    if (vm.data.uploadImgList.length) {
      imgList = vm.data.uploadImgList.join(",")
    }
    let mallSiteId = wx.getStorageSync('mallSiteId');
    wx.request({
      url: cf.config.pageDomain + "/applet/mobile/review/addReview",
      type:"POST",
      data:{
        mallSiteId: mallSiteId,
        content: vm.data.inputContent.judge,
        goodsId: vm.data.id,
        cusmallToken: cusmallToken,
        orderId: vm.data.orderId,
        score: vm.data.score,
        source: vm.data.isTimeDiscountOrder ? 2 : 0,
        pic: imgList
      },
      header:{
        "content":"application/json"
        },
      success:function(res){
        console.log(res);
        if (res.data.ret == 0) {
          wx.hideLoading();
          if (res.data.model && res.data.model.reviewConfig && res.data.model.reviewConfig.needCheck ){
            // vm.showZanToast('你的评论已提交成功！待商家审核');
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: "你的评论已提交成功！待商家审核"
            });
          }else{
            wx.showModal({
              title: '提示',
              showCancel: false,
              content: "你的评论已提交成功!",
              success: function (res) {
                if (res.confirm) {
                  console.log(1)
                  wx.redirectTo({
                    url: "/pages/orderlist/orderlist"
                  })
                } else if (res.cancel) {
                }
              }
            });
          }

          // if (vm.data.isIntegralGift){
          //   vm.showZanToast("赠送的积分数量" + integral + "已到账，请查收~");
          // }else{

          // }

          // setTimeout(function(){
          //   // wx.navigateBack({
          //   //   delta:1
          //   // });
          //   wx.redirectTo({
          //     url: "/pages/orderlist/orderlist"
          //   })
          // },1000);

        } else{
          wx.hideLoading();
          wx.showModal({
            title: '评论已提交失败',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  // 获取所有商品的信息
  fetchData:function(){
    var vm = this;
    wx.showLoading({
      title:"加载中",
    })
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
      data:{
        cusmallToken: cusmallToken,
        goodsId:vm.data.id
      },
      header:{
        "contentType":"application/json"
      },
      success:function(res){
        if (res.data.ret == 0) {
          console.log(res.data);
          wx.hideLoading();
          vm.setData({
            goodsCover:res.data.model.goods.goodsCover,
            goodsName:res.data.model.goods.name,
            price:res.data.model.goods.price
          });
        } else {
          wx.hideLoading();
          wx.showModal({
            title: '获取商品信息异常',
            showCancel: false,
            content: res.data.msg
          })
        }
      }
    })
  },
  handleAddImage: function () {
    let that = this;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var tempFilePaths = res.tempFilePaths;
        console.log(res);
        that.upload(that, tempFilePaths);
      }
    })
  },

  upload: function (page, path) {
    let vm = this;
    wx.showToast({
      icon: "loading",
      title: "正在上传"
    }),
      wx.uploadFile({
        url: cf.config.pageDomain + '/mobile/common/imgupload?cusmallToken=' + cusmallToken,
        filePath: path[0],
        name: 'file',
        riskCheckType:1,
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
          let uploadImgList = vm.data.uploadImgList;
          uploadImgList.push(data.fileName);
          vm.setData({
            uploadImgList: uploadImgList
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
          wx.hideToast();  //隐藏Toast
        }
      })
  },

  handleDelImg: function (e) {
    let vm = this;
    let idx = e.target.dataset.index;
    let imgList = vm.data.uploadImgList;
    imgList.splice(idx, 1);
    vm.setData({
      uploadImgList: imgList
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

  }
}))
