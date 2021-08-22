var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var commonAty = require("../../../utils/atycommon.js");
function showAward(e){

  if (!this.checkUserInfo()) {
    return false;
  }
  wx.showLoading({
    title: '加载中',
  });
  this.setData({
    showStatus: "1,0"
  });
  if (e && "hasCache" == e.currentTarget.dataset.mark && 0 != this.data.myAwards.length) {
    wx.hideLoading();
    return;
  } else if (e && "hasCache" == (e.detail.currentTarget && e.detail.currentTarget.dataset.mark) && 0 != this.data.myAwards.length) {
    wx.hideLoading();
    return;
  }
  this.queryAwardRecords();
}

/**
* 查询用户奖品
*/
function queryAwardRecords() {
  let that = this;
  //cusmallToken,activityid,callback
  cusmallToken = wx.getStorageSync('cusmallToken');
  commonAty.queryAwardRecords(cusmallToken, this.data.activity.id, function (res) {
    let data = res.data;
    if (data && 0 == data.ret) {
      that.setData({
        myAwards: data.model.awardRecords || []
      })
    }
    wx.hideLoading();
  });
}

/**
* 获取用户可抽奖次数
*/
function queryLotteryChance() {
  let that = this;
  cusmallToken = wx.getStorageSync('cusmallToken');
  commonAty.queryLotteryChance(cusmallToken, this.data.activity.id, that, function () {
    that.setData({
      hasInit: true
    });
    that.afterQueryLotteryChance && that.afterQueryLotteryChance();
    wx.hideLoading();
  });
}

function showRule() {
  this.setData({
    showStatus: "1,1",
    awardStatus:true
  });
}
function showRAA() {
  this.setData({
    showStatus: "1,1"
  });
}
function gotoMyPrize() {
  wx.navigateTo({
    url: '/pages/coupon/mycoupon',
  })
}
// 提示没有抽奖机会
function alertNoChange(){
  wx.showModal({
    title: '提示',
    showCancel: false,
    content: '没有抽奖机会',
  })
}
// 关闭所有弹出窗口
function hideMaskPage(){
  let that = this;
  that.setData({
    showFailMaskPage:false,
    showSuccessMaskPage:false,
    isShow:false
  })
}
/**
 * 助力接口
 */
function doHelp(activityId, fromOpenId){
  cusmallToken = wx.getStorageSync('cusmallToken');
  wx.request({
    url: cf.config.pageDomain + '/mobile/base/activity/doHelp',
    data: {
      cusmallToken: cusmallToken,
      activityid: activityId,
      fromOpenid: fromOpenId
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log("助力成功");
    }
  })
}
/**
 * 统计次数接口
 */
function statShareNum(activityId){
  cusmallToken = wx.getStorageSync('cusmallToken');
  wx.request({
    url: cf.config.pageDomain + '/mobile/base/activity/statShareNum',
    data: {
      cusmallToken: cusmallToken,
      activityid: activityId
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log("成功");
    }
  })
}
/**
 * 处理点击按钮
 */
function handleShareBtn(){
  let that = this;
  let activityId = that.data.activity.id;
  let activityType = that.data.activity.activityType;
  let page = "pages/interaction/heartbeatmatch/heartbeatmatch";
  cusmallToken = wx.getStorageSync('cusmallToken');
  if (that.data.qrcodeUrl){
    wx.previewImage({
      current: that.data.qrcodeUrl, // 当前显示图片的http链接
      urls: [that.data.qrcodeUrl] // 需要预览的图片http链接列表
    });
    return;
  }
  wx.showLoading({
    title: '加载中...',
  })
  wx.request({
    url: cf.config.pageDomain + '/mobile/base/activity/genActSharePoster',
    data: {
      cusmallToken: cusmallToken,
      activityid: activityId,
      isCover: false,
      page: page
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      console.log(res)
      let data = res.data;
      if(data.ret == 0){
        that.setData({
          qrcodeUrl: data.model.qrcodeUrl
        })
        wx.previewImage({
          current: data.model.qrcodeUrl, // 当前显示图片的http链接
          urls: [data.model.qrcodeUrl], // 需要预览的图片http链接列表
          success: function (res) {
            console.log("succeeded");
            console.log(res);
          },
          fail: function (res) {
            console.log("failed");
            console.log(res);
          },
        });
      } else{
        wx.showModal({
          showCancel: false,
          content: data.msg
        });
      }
      wx.hideLoading();
    }
  })
}
/**
  * 抽奖接口
  */
function doLottery() {
  let that = this;
  cusmallToken = wx.getStorageSync('cusmallToken');
  wx.showLoading({
    title: '抽奖中...',
  })
  wx.request({
    url: cf.config.pageDomain + '/mobile/base/activity/doLottery',
    data: {
      cusmallToken: cusmallToken,
      activityid: that.data.activity && that.data.activity.id
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      wx.hideLoading();
      that.hideMaskPage();
      let data = res.data;
      let awardList = that.data.orgAwardList;
      let prizeAward;
      if (data && 0 == data.ret) {

        let awardId = data.model.award.id;
        for (let i = 0; i < awardList.length; i++) {
          if (awardList[i].id == awardId) {
            prizeAward = awardList[i];
            break;
          }
        }
        that.setData({
          prizeAward: prizeAward,
          playMsg: prizeAward.trophyName,
          playDesc: prizeAward.awardName,
          haveGift: true,
          isShow: true,
          actuallyTime: that.data.actuallyTime - 1
        });
      } else if (data && -201 == data.ret) {
        that.setData({
          playMsg: "没中呢,再接再厉哦",
          playDesc: "换个姿势,快来啊",
          haveGift: false,
          isShow: true,
          actuallyTime: that.data.actuallyTime - 1
        });
      } else {
        wx.showModal({
          showCancel: false,
          content: data.msg
        });
      }
    },
    fail: function () {
      wx.showModal({
        showCancel: false,
        content: "服务器开小差，稍后再试哦~"
      });
    },
    complete: function () {
    }
  });
}
module.exports = {
  showAward: showAward,
  doLottery: doLottery,
  doHelp: doHelp,
  handleShareBtn: handleShareBtn,
  statShareNum: statShareNum,
  queryLotteryChance: queryLotteryChance,
  queryAwardRecords: queryAwardRecords,
  showRule: showRule,
  showRAA: showRAA,
  alertNoChange: alertNoChange,
  hideMaskPage: hideMaskPage,
  gotoMyPrize: gotoMyPrize
}
