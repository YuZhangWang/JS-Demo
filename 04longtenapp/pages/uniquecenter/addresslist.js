// detail.js
var cf = require("../../config.js");
var getAddr = require('../../utils/address.js');
var util = require("../../utils/util.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../template/baseHandle.js");
Page(Object.assign({}, baseHandle,{

  /**
   * 页面的初始数据
   */
  data: {
    proData:getAddr.getproData,
    cityData:getAddr.getcityData,
    urbanData:getAddr.geturbanData,
    needUserInfo: true,
    curCityData:[],
    app: app,
    curUrbanData:[],
    extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
    pro_idx:0,
    city_idx:0,
    urban_idx:0,
    areaCode:{urbanCode:0},
    isEdit:false,
    isAddrEditShow:false,
    editAddrId:0,
    inputInfo:{
      name:"",
      tel:"",
      area:""
    },
    id: null,    
    listModule:{
      addrList:{},
      curAddrId:0,
    },
    paramJson:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    cusmallToken = wx.getStorageSync('cusmallToken');
    mallSiteId = wx.getStorageSync('mallSiteId');
    //var that = this;
    wx.hideShareMenu();
    wx.setNavigationBarTitle({
      title: "地址管理"
    })
    this.fetchData();
    var title = {"id":"0","name":"-- 请选择 --"};
    this.data.proData.unshift(title);
    this.setData({
      proData: this.data.proData
    })
    if(options){
      this.setData({ "paramJson.orderid": options.orderid });
      this.setData({ "paramJson.fromShopingCart": options.fromShopingCart });
      this.setData({ "paramJson.fromTakeout": options.fromTakeout });
      this.setData({ "paramJson.cartIds": options.cartIds });
      this.setData({ "paramJson.id": options.id });
      this.setData({ "paramJson.goodsCount": options.goodsCount });
      this.setData({ "paramJson.specId": options.specId });
      this.setData({ "paramJson.orderChecked": options.orderChecked });
    }
    
    util.afterPageLoad(this);
  },
  fetchData:function(){
    var that = this;
    var id = 0;
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
        url: cf.config.pageDomain +'/applet/mobile/address/getAddress',
        data:{
            cusmallToken: cusmallToken
            // siteId: mallSiteId
        },
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            if (res.data.ret == 0) {
              var list = res.data.model.list;
              try {
                var value = wx.getStorageSync('addrId')
                if (value) {
                  id = value;
                  for(var i = 0;i < list.length;i++){
                    if(list[i].id == id){
                      list[i].orderChecked = true;
                    }
                  }
                }else{
                  if(list.length>0){
                    list[0].orderChecked = true;
                    id = list[0].id;
                  }
                }
              } catch (e) {
                if(list.length>0){
                  list[0].orderChecked = true;
                  id = list[0].id;
                }
              }
              for(var i = 0;i<list.length;i++){
                if (list[i].remark){
                  list[i].remark = list[i].remark.split(",");
                }
              }
              that.setData({
                'listModule.addrList':list,
                "listModule.curAddrId":id,
              });
              console.log(list);
              wx.hideLoading();
            } else {
                wx.hideLoading();
                wx.showModal({
                    title: '获取地址信息异常',
                    showCancel: false,
                    content: res.data.msg
                })
            }
        }
    })
  },
  editAddrBtn:function(e){
    var id = e.currentTarget.dataset.id;
    var that = this;
    var addrList = that.data.listModule.addrList;
    var curAddr = {};
    for(var i = 0;i<addrList.length;i++){
      if(addrList[i].id == id){
        curAddr = addrList[i];
      }
    }
    that.initAddress(curAddr.remark);
    that.setData({
      editAddrId:id,
      isAddrEditShow:true,
      'inputInfo.name':curAddr.userName,
      'inputInfo.tel':curAddr.tel,
      'inputInfo.area':curAddr.address,
      'areaCode.proCode':curAddr.remark[0],
      'areaCode.cityCode':curAddr.remark[1],
      'areaCode.urbanCode':curAddr.remark[2],
      isEdit:true
    })
  },
  initAddress:function(remark){
    var that = this;
    var j = 0,k = 0;
    var curCityData,curUrbanData,pro_idx,city_idx,urban_idx;
    for(var i = 0;i<that.data.proData.length;i++){
      if(that.data.proData[i].id == remark[0]){
        pro_idx = i;
      }
    }
    for(var key in that.data.cityData[0]){
      if(key == remark[0]){
        curCityData = that.data.cityData[0][key];
        for(var i=0;i<curCityData.length;i++){
          if(curCityData[i].id == remark[1]){
            city_idx = i;
          }
        }
      }
      j++;
    }
    for(var key in that.data.urbanData[0]){
      if(key == remark[1]){
        curUrbanData = that.data.urbanData[0][key];
        for(var i=0;i<curUrbanData.length;i++){
          if(curUrbanData[i].id == remark[2]){
            urban_idx = i;
          }
        }
      }
      k++;
    }
    that.setData({
      curCityData:curCityData,
      curUrbanData:curUrbanData,
      pro_idx:pro_idx,
      city_idx:city_idx,
      urban_idx:urban_idx
    });
  },
  radioChange:function(e){
    var that = this;
    var id = e.currentTarget.dataset.value;
    var addrList = that.data.listModule.addrList;
    for(var i = 0;i<addrList.length;i++){
      addrList[i].orderChecked = id == addrList[i].id;
    }
    that.setData({
      "listModule.addrList":addrList,
      "listModule.curAddrId":id
    })
    that.setStorage();
    that.goBackPage();
  },
  // checked 触摸
  orderChecked:function(e){
    var vm = this;
    
  },
  bindProChange: function(e) {
    var that = this;
    var curCityData=[];
    var title = {"id":"0","name":"-- 请选择 --"};
    var id = that.data.proData[e.detail.value].id;
    if(id != 0){
      for(var key in that.data.cityData[0]){
        if(key == id){
          curCityData = that.data.cityData[0][key];
        }
      }
      if(curCityData[0].id != 0){
        curCityData.unshift(title);
      }
      that.setData({
        curCityData:curCityData
      })
    }else{
      that.setData({
        curCityData:[]
      })
    }
    that.setData({
      pro_idx: e.detail.value,
      "areaCode.proCode":id,
      "areaCode.cityCode":0,
      "areaCode.urbanCode":0,
      city_idx:0,
      urban_idx:0,
      curUrbanData:[]
    })
  },
  bindCityChange: function(e) {
    var that = this;
    var curUrbanData=[];
    var title = {"id":"0","name":"-- 请选择 --"};
    var id = that.data.curCityData[e.detail.value].id;
    if(id != 0){
      for(var key in that.data.urbanData[0]){
        if(key == id){
          curUrbanData = that.data.urbanData[0][key];
        }
      }
      if(curUrbanData[0].id != 0){
        curUrbanData.unshift(title);
      }
      that.setData({
        curUrbanData:curUrbanData
      })
    }else{
      that.setData({
        curUrbanData:[]
      })
    }
    that.setData({
      city_idx: e.detail.value,
      curUrbanData:curUrbanData,
      "areaCode.cityCode":id,
      "areaCode.urbanCode":0,
      urban_idx:0
    })
  },
  bindUrbanChange: function(e) {
    var that = this;
    var id = that.data.curUrbanData[e.detail.value].id;
    this.setData({
      urban_idx: e.detail.value,
      "areaCode.urbanCode":id
    })
  },
  cancleSaveAddress:function(){
    this.setData({
      isAddrEditShow:false,
      editAddrId:0,
    })
  },
  saveAddress:function(e){
    var that = this;
    var inputInfo = that.data.inputInfo;
    if(!inputInfo.name){
      that.toastTips("请填写收货人姓名");
    }else if (!inputInfo.tel) {
      that.toastTips("请填写手机号码");
    }else if (11 != inputInfo.tel.length) {
      that.toastTips("手机号码格式不正确");
    }else if ((!that.data.areaCode.urbanCode)||(that.data.areaCode.urbanCode == 0)) {
      that.toastTips("需要选择一个地址");
    }else if (!inputInfo.area) {
      that.toastTips("请填写详细地址");
    }else{
      that.saveAddrAjax();
    }
  },
  saveAddrAjax:function(){
    var that = this;
    var areaCode = that.data.areaCode;
    var remark = areaCode.proCode+","+areaCode.cityCode+","+areaCode.urbanCode;
    wx.showLoading({
      title: '保存中',
    });
    wx.request({
        url: cf.config.pageDomain +'/applet/mobile/address/addOrUpdate',
        data:{
            cusmallToken: cusmallToken,
            id:that.data.editAddrId,
            userName:that.data.inputInfo.name,
            tel:that.data.inputInfo.tel,
            areaId:that.data.areaCode.urbanCode,
            address:that.data.inputInfo.area,
            siteId: mallSiteId,
            isEdit:that.data.isEdit,
            remark:remark
        },
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            if (res.data.ret == 0) {
                wx.hideLoading();
                if(!that.data.isEdit){
                  that.clearStorage();
                }
                wx.showModal({
                    showCancel: false,
                    content: "保存成功",
                    success:function(){
                      that.goBackPage();
                    }
                })
            } else {
                wx.hideLoading();
                wx.showModal({
                    title: '保存地址异常',
                    showCancel: false,
                    content: res.data.msg
                })
            }
        }
    })
  },
  deleteAddress:function(){
    var that = this;
    wx.showModal({
      title: "温馨提示",
      content: "确认删除该地址吗？",
      confirmText: "确定",
      cancelText: "取消",
      success:function(res){
        if(res.confirm){
          that.deleteAddressAjax();
        }
      }
    })
  },
  deleteAddressAjax:function(){
    var that = this;
    wx.showLoading({
      title: '处理中，请稍后',
    });
    wx.request({
        url: cf.config.pageDomain +'/applet/mobile/address/del',
        data:{
            cusmallToken: cusmallToken,
            id:that.data.editAddrId || that.data.listModule.curAddrId,
        },
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
          console.log(res);
            if (res.data.ret == 0) {
                wx.hideLoading();
                wx.showModal({
                    showCancel: false,
                    content: "删除成功",
                    success:function(){
                      that.fetchData();
                      that.setData({
                        isAddrEditShow:false,
                      })
                    }
                })
            } else {
                wx.hideLoading();
                wx.showModal({
                    title: '地址删除异常',
                    showCancel: false,
                    content: res.data.msg
                })
            }
        }
    })
  },
  setStorage:function(){
    var key = "addrId";
    var data = this.data.listModule.curAddrId;
    wx.setStorageSync(key, data);
  },
  clearStorage:function(){
    try {
      wx.removeStorageSync('addrId');
    } catch (e) {
      console.log('addrId为空');
    }
  },
  toastTips:function(title){
    wx.showModal({
      title: '提示',
      showCancel:false,
      content: title,
    })
  },
  newAddAddress:function(){
    let that = this;
    wx.showModal({
      title: '提示',
      content: '是否从微信添加地址',
      success:function(res){
        if(res.confirm){
          wx.chooseAddress({
            success: function (res) {
              console.log(res);
              // that.setData({
              //   wxProvince: res.provinceName
              // });
              // that.setData({
              //   wxCity: res.cityName
              // });
              // that.setData({
              //   wxUrban: res.countyName
              // });
              // that.setData({
              //   wxDetailInfo: res.detailInfo
              // });
              var username = res.userName ? res.userName : '';
              var telnumber = res.telNumber ? res.telNumber : '';

              wx.request({
                url: cf.config.pageDomain + '/applet/mobile/address/addOrUpdate',
                data: {
                  cusmallToken: cusmallToken,
                  id: "",
                  userName: res.userName,
                  tel: res.telNumber,
                  areaId: "",
                  address: res.detailInfo,
                  wxProvince: res.provinceName,
                  wxCity: res.cityName,
                  wxUrban: res.countyName,
                  siteId: mallSiteId,
                  isEdit: false,
                  isWxAddress : true
                },
                header: {
                  'content-type': 'application/json'
                },
                success: function (res) {
                  if (res.data.ret == 0) {
                    wx.hideLoading();
                    wx.showModal({
                      showCancel: false,
                      content: "保存成功",
                      success: function () {
                        that.goBackPage();
                      }
                    })
                  } else {
                    wx.hideLoading();
                    console.log(res)
                    that.setData({
                      isEdit: false,
                      isAddrEditShow: true,
                    })
                    wx.showModal({
                      title: '请输入详细地址',
                      showCancel: false,
                      content: '请手动选择地区并输入详细地址',
                      success:function(res){
                        if(res.confirm){
                          that.setData({
                            curCityData: [],
                            curUrbanData: [],
                            pro_idx: 0,
                            city_idx: 0,
                            urban_idx: 0,
                            'areaCode.proCode': 0,
                            'areaCode.cityCode': 0,
                            'areaCode.urbanCode': 0,
                            isEdit: false,
                            isAddrEditShow: true,
                            editAddrId: 0,
                            'inputInfo.name': username,
                            'inputInfo.tel': telnumber,
                            'inputInfo.area': "",
                          })
                        }
                      }
                    })
                  }
                }
              })

            }
            
          })
        }else{
          that.setData({
            curCityData: [],
            curUrbanData: [],
            pro_idx: 0,
            city_idx: 0,
            urban_idx: 0,
            'areaCode.proCode': 0,
            'areaCode.cityCode': 0,
            'areaCode.urbanCode': 0,
            isEdit: false,
            isAddrEditShow: true,
            editAddrId: 0,
            'inputInfo.name': "",
            'inputInfo.tel': "",
            'inputInfo.area': "",
          })
        }
      }
    })

  },
  bindKeyInput:function(e){
    var that = this;
    var trimVal = that.trim(e.detail.value);
    that.data.inputInfo[e.target.dataset.type]=trimVal;
    this.setData({
      inputInfo:that.data.inputInfo
    })
  },
  trim:function(s){
    return s.replace(/(^\s*)|(\s*$)/g, "");
  },
  validateTel:function(tel){
    var reg = /^1[3|4|5|7|8][0-9]{9}$/;
    var flag = reg.test(tel);
    return flag;
  },
  goBackPage:function(){
    var that = this;
    var paramJson = that.data.paramJson;
    var param = '';
    if(paramJson.orderid){
      param += '?orderid='+ paramJson.orderid;
    }else if(paramJson.fromShopingCart){
      param += '?fromShopingCart='+paramJson.fromShopingCart+'&cartIds='+paramJson.cartIds;
    } else if (paramJson.fromTakeout){
      param += '?fromTakeout=' + paramJson.fromTakeout;
    } else if (paramJson.id){
      param += '?id=' + paramJson.id + '&goodsCount=' + paramJson.goodsCount + (paramJson.specId ? '&specId=' + paramJson.specId:'');
    } else {
      wx.redirectTo({
        // url:"/pages/uniquecenter/uniquecenter"
        // 跳转到地址列表页面，仅从地址列表进行修改，不携带外部参数的跳转.
        url:"/pages/uniquecenter/addresslist"
      })
      return;
    }
    wx.redirectTo({
      // 由订单购买页面进入时携带参数的跳转路径
      url: '/pages/orderinfo/orderinfo' + param
    });
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
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  }
}))