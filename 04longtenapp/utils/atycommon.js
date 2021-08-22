var cf = require("../config.js");
var util = require("../utils/util.js");
class CommonProcess {
  constructor(obj, options, cusmallToken) {
    this.curObj = obj;
    this.cusmallToken = cusmallToken;
    this.options = options;

  }

  init() {
    wx.showLoading({
      title: '加载中...',
    })
    let that = this;
    let cusmallToken = that.cusmallToken;
    let reqData = {};
    reqData.cusmallToken = cusmallToken;
    if (that.options.scene) {
      reqData.scene = decodeURIComponent(that.options.scene);
    } else {
      reqData.activityid = that.curObj.thatContext.options.activityId;
    }
    wx.request({
      url: cf.config.pageDomain + '/mobile/base/activity/init',
      data: reqData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        let data = res.data;
        console.log(data)
        if( data && data.ret == 0){
          let thatCnt = that.curObj.thatContext;
          let options = thatCnt.options;
          // 判断活动时间是否在进行中
          let currentTime = new Date().getTime();
          if (currentTime < data.model.activity.startTime) {
            thatCnt.setData({
              isGameUnstart: true,
              gameStartTime: util.formatTime(new Date(data.model.activity.startTime))
            })
          }
          if (currentTime > data.model.activity.endTime) {
            thatCnt.setData({
              isGameTimeEnd: true
            })
          }

          // 缓存openUser信息
          thatCnt.setData({
            openUser: data.model.openUser
          })

          // 缓存活动基本数据
          let awardList = data.model.awardList;
          let extraData = data.model.activity.extraData;
          let activityType = data.model.activity.activityType;
          let nowTime = new Date().getTime();
          let startTime = data.model.activity.startTime;
          let endTime = data.model.activity.endTime;
          //预售活动 13 限时折扣 14
          if (startTime - nowTime > 0 && data.model.activity.status == 0 ) {
            data.model.activity.activityStatus = 1; //未开始
            data.model.activity.activityStatusTxt = '即将开始'
          } else if ((startTime - nowTime) < 0 && (endTime - nowTime) > 0 && data.model.activity.status == 1) {
            data.model.activity.activityStatus = 2 //进行中
            data.model.activity.activityStatusTxt = data.model.activity.activityType == 13 ? '付定金' : '立即抢';
          } else {
            data.model.activity.activityStatus = 3 //已结束
            data.model.activity.activityStatusTxt = '已结束'
          }
          data.model.activity.atyStartTime = util.formatDateC(new Date(data.model.activity.startTime));
          data.model.activity.atyEndTime = util.formatDateC(new Date(data.model.activity.endTime));
          data.model.activity.atyStartTimeM = util.formatTimeM(new Date(data.model.activity.startTime));
          data.model.activity.atyEndTimeM = util.formatTimeM(new Date(data.model.activity.endTime));
          thatCnt.setData({
            activity: data.model.activity,
            orgAwardList: awardList,
            activityRule: data.model.activityRule
          });
          let extendOperation = data.model.activity.extendOperation;
          if (extendOperation) {
            extendOperation = JSON.parse(extendOperation);
            if (extendOperation.returnIndex == "1") {
              thatCnt.setData({
                returnIndex: true
              });
            }
          }
          // 开始处理每个活动的初始化逻辑
          that.curObj.initProcess(data);//(config, thatContext)
          // 扫码进入
          if (that.options.scene && data.model.scene) {
            let scene = data.model.scene;
            thatCnt.options = scene;
            thatCnt.options.activityId = scene.activityid;
            if (scene.relationId) {
              thatCnt.setData({
                fromShareInfo: {
                  activityId: scene.activityid,
                  fromOpenId: scene.fromOpenId,
                  relationId: scene.relationId,
                }
              });
            }
            if (!scene.fromOpenId || data.model.openUser.openId == scene.fromOpenId) {//和进入的是同一个人
              that.curObj.myProcess();
              // that.curObj.ohterPeopleProcess();
            } else {//和进入的不是同一个人
              that.curObj.ohterPeopleProcess(scene.activityid, scene.fromOpenId);
              // 助力接口
              // 特殊活动的助力单独执行
              if (activityType != 9) {
                if ((extraData & (Math.pow(2, 2))) != 0) {
                  thatCnt.doHelp(scene.activityid, scene.fromOpenId);
                }
              }
            }
          } else {
            if (options.relationId) {
              thatCnt.setData({
                fromShareInfo: {
                  activityId: options.activityId,
                  fromOpenId: options.fromOpenId,
                  relationId: options.relationId,
                }
              });
            }

            if (!options.fromOpenId || data.model.openUser.openId == options.fromOpenId) {//和进入的是同一个人
              that.curObj.myProcess();
              // that.curObj.ohterPeopleProcess();
            } else {//和进入的不是同一个人
              that.curObj.ohterPeopleProcess(options.activityId, options.fromOpenId);
              // 助力接口
              // 特殊活动的助力单独执行
              if (activityType != 9) {
                if ((extraData & (Math.pow(2, 2))) != 0) {
                  thatCnt.doHelp(options.activityId, options.fromOpenId);
                }
              }
            }
          }

        }


      },
      fail: function () {
      },
      complete: function () {
        wx.hideLoading();

      }
    });
  }
}
/**
 * 查询用户奖品
 */
function queryAwardRecords(cusmallToken, activityid, callback) {
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

/**
 * 抽奖次数
 */
function queryLotteryChance(cusmallToken, activityid, cxt, callback) {
  let that = cxt;
  wx.request({
    url: cf.config.pageDomain + '/mobile/base/activity/queryLotteryChance',
    data: {
      cusmallToken: cusmallToken,
      activityid: that.data.activity && that.data.activity.id
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      let data = res.data;
      let actually = 0; // 当天剩余抽奖次数
      let allLimit = 0; //总剩余抽奖次数
      if (data && 0 == data.ret) {
        let actlimit = data.model.actlimit;//总抽奖次数限制
        let used = data.model.used;//已使用抽奖次数
        let allow = data.model.allow;//额外可抽奖次数
        let curday = data.model.curday;//当天已使用抽奖次数
        let daylimit = data.model.daylimit;//每天可用抽奖次数

        if (-1 != actlimit) {
          if (allow > 0) {
            actually = (daylimit - curday + allow) > actlimit ? actlimit : daylimit - curday+ allow;
            allLimit = actlimit - used + allow;
          } else if (actlimit > used) {
            if (daylimit != curday) {
              if (daylimit - curday + allow >= actlimit - used) {
                actually = actlimit - used;
              } else if (daylimit - curday + allow <= actlimit - used) {
                actually = daylimit - curday + allow;
              }
            }
            allLimit = actlimit - used;
          }
        } else {
          actually = daylimit - curday + allow;
          allLimit = '无限制';
        }

      }

      if (0 > actually) {
        actually = 0;
      }
      if (0 > allLimit) {
        allLimit = 0;
      }
      that.setData({
        actuallyTime: actually,
        allLimitTime: allLimit
      });
      callback && callback(res);
    },
    fail: function (err) {
      callback && callback(err);
    },
    complete: function () {
    }
  });
}
module.exports = {
  CommonProcess,
  queryAwardRecords,
  queryLotteryChance
}
