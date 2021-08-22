// pages/interaction/inteCommon/ruleAndAward.js
var cf = require("../../../config.js");
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showStatus:{
      type: String,
      value: "0,0"//0,0关闭蒙版 1,0显示我的奖品 1,1显示规则
    },
    isShow: {
      type: Boolean,
      value: false
    },
    staticResPath: {
      type: String,
      value: ""
    },
    isshowroa: {
      type: Boolean,
      value: true
    },
    activity: {
      type: Object,
      value: {}
    },
    awardlist: {
      type: Array,
      value: []
    },
    myawards:{
      type: Array,
      value: []
    }

  },

  /**
   * 组件的初始数据
   */
  data: {
    commonImgUrl: "image/mobile/aty/common/",
    isShow:true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTapShow:function(){
      this.setData({
        showStatus: "1,1"
      });
    },
    onTapShowRule:function(){
      // let myEventDetail = {} // detail对象，提供给事件监听函数
      // let myEventOption = {} // 触发事件的选项
      // this.triggerEvent('showrule', myEventDetail, myEventOption);
      // console.log()
      this.setData({
        showStatus: "1,1"
      });
    },
    onTapShowAward: function (e) {
      let that = this;
      this.setData({
        showStatus: "1,0"
      });
      // this.triggerEvent('showaward', e, {});
      wx.showLoading({
        title: '加载中',
      });
      this.setData({
        showStatus: "1,0"
      });
      if (e && "hasCache" == e.currentTarget.dataset.mark && 0 != this.data.myawards.length) {
        wx.hideLoading();
        return;
      } else if (e && "hasCache" == (e.detail.currentTarget && e.detail.currentTarget.dataset.mark) && 0 != this.data.myawards.length) {
        wx.hideLoading();
        return;
      }
      let cusmallToken = wx.getStorageSync('cusmallToken');
      this.qAwardRecords(cusmallToken, this.data.activity.id, function (res) {
        let data = res.data;
        if (data && 0 == data.ret) {
          that.setData({
            myawards: data.model.awardRecords || []
          })
        }
        wx.hideLoading();
      });
    },
    onTapClose: function () {
      this.setData({
        showStatus:"0,0"
      });
      this.triggerEvent('closeraa', false); // 触发组件上的“closeraa”事件
    },
    showAwardItem:function(e){
      if (1 == e.currentTarget.dataset.awardtype){
        wx.navigateTo({
          url: '/pages/coupon/mycoupon'
        })
      }
      // this.triggerEvent('showawarditem', {}, {});
    },
    /**
 * 查询用户奖品
 */
    qAwardRecords:function (cusmallToken, activityid, callback){
    let that = this;
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/queryAwardRecords',
      data: {
        cusmallToken: cusmallToken,
        activityid: activityid
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        callback && callback(res);
      },
      fail: function (err) {
        callback && callback(err);
      },
      complete: function () {
      }
    });
  }

  }
})
