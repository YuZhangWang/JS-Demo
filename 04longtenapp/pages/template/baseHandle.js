// 针对所有页面的通用的handle
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var subMsg = require('./subMsg.js'); // 订阅消息配置数据
var cusmallToken = wx.getStorageSync('cusmallToken');

/*
* 打开地图位置
* */
function openloaction(e) {

    let latitude = parseFloat(e.currentTarget.dataset.latitude);
    let longitude = parseFloat(e.currentTarget.dataset.longitude);
    let address = e.currentTarget.dataset.address
    wx.openLocation({
        latitude,
        longitude,
        address,
        scale: 18
    })
}

/*
*
* */
function handleCommonFormSubmit(e) {
    var formId = e.detail.formId;
    cusmallToken = wx.getStorageSync('cusmallToken');
    wx.request({
        url: cf.config.pageDomain + '/applet/mobile/addFormId',
        data: {
            cusmallToken: cusmallToken,
            formId: formId
        },
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            console.log("addFormId success：", formId);
        }
    })
}

/*
*
* */
function onNavTab(e) {
    var that = this;
    return util.processNavClick(e, that);
}

/*
*  复制文本
* */
function longCopy(e) {
    let txt = e.currentTarget.dataset.txt;
    wx.setClipboardData({
        data: txt,
        success: function (res) {
            wx.showToast({
                title: "复制成功",
                icon: "none"
            });
        },
        fail(e) {

            wx.showToast({
                title: '复制失败' + e.toString()
            })
        }
    })

}

/*
*
* */
function getReviewConfig() {
    let cusmallToken = wx.getStorageSync('cusmallToken');
    let mallSiteId = wx.getStorageSync('mallSiteId');
    let ctx = this;
    return new Promise(function (resolve, reject) {

        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/review/getReviewConfig",
            data: {
                mallSiteId: mallSiteId,
                cusmallToken: cusmallToken,
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                console.log(data)
                if (data && 0 == data.ret) {
                    ctx.setData({
                        isOpenComment: data.model.reviewConfig.isOpen
                    })
                    resolve(data)
                } else {
                    reject(data);
                }
            },
            fail() {

            },
            complete() {

            }
        })

    });
}

/*
* 拨打电话
* */
function commMakeCall(e) {
    let phonecode = e.currentTarget.dataset.tel;
    wx.makePhoneCall({
        phoneNumber: phonecode //仅为示例，并非真实的电话号码
    })
}

/*
*  返回首页
* */
function backToHome() {
    let app = this.data.app;
    let shopuid = app.globalData.shopuid;
    let fromuid = app.globalData.fromuid;
    let url = "/pages/index/index";
    if (shopuid) {
        url = url + "?shopuid=" + shopuid;
        if (fromuid) {
            url = url + "&fromuid=" + fromuid;
        }
    }
    wx.redirectTo({
        url: url
    })

}

/* 获取商品积分 */
function getIntegrate() {
    var that = this;
    var parse = JSON.parse;
    let cusmallToken = wx.getStorageSync('cusmallToken');
    let fromuid = "";
    let shopuid = "";
    let app = getApp();
    if (app.globalData.shopuid) {
        fromuid = app.globalData.fromuid;
        shopuid = app.globalData.shopuid
    }
    wx.request({
        url: cf.config.pageDomain + '/applet/mobile/member/getIntegralSet',
        data: {
            cusmallToken: cusmallToken,
            fromUid: fromuid,
            shopUid: shopuid
        },
        header: {
            "content": "application/json"
        },
        success: function (res) {
            if (res.data.ret == 0) {
                that.setData({
                    isConsumeOk: res.data.model.integralSet.isOpen && res.data.model.integralSet.isConsume,
                    consumeMoney: parse(res.data.model.integralSet.consumeSet).preval,
                    consumeGet: parse(res.data.model.integralSet.consumeSet).get,
                    isBuyGoodsGift: res.data.model.integralSet.isBuyGoodsGift,
                    isOpen: res.data.model.integralSet.isOpen,
                });
            }
        }
    })
}

/*
*
* */
function fnOpenLocation(e) {
    console.log(e)
    let lat = parseFloat(e.currentTarget.dataset.lat || 22.5236670209857);
    let lng = parseFloat(e.currentTarget.dataset.lng || 113.94078612327576);
    wx.openLocation({
        latitude: lat,
        longitude: lng,
        scale: 28
    })
}

/*
* 授权登录
* */
function userInfoHandler(result) {
    let that = this;
    let app = getApp();
    let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
    if (result.detail.encryptedData) {
        //调用登录接口
        wx.login({
            success: function (res) {
                let wxCode = res.code;
                // 调用后台接口获取cusmallToken
                let submitData = {
                    wxCode: wxCode,
                    uid: cf.config.customPack ? cf.config.uid : extConfig.uid
                }
                submitData.encryptedData = result.detail.encryptedData;
                submitData.iv = result.detail.iv;
                if (app.referrerInfo) {
                    submitData.extraData = app.referrerInfo
                }
                wx.request({
                    url: cf.config.pageDomain + '/applet/oauth/getCusmallToken',
                    data: submitData,
                    header: {
                        'content-type': 'application/json'
                    },
                    fail: function (data) {
                        console.error("后台接口获取cusmallToken失败", data);
                    },
                    success: function (res) {
                        console.log(res.data);
                        if (res.data.ret == 0 && res.data.model.isOuthBaseInfo) {
                            app.globalData.userInfo = result.detail.userInfo;
                            // 获取用户信息
                            wx.setStorageSync('userInfo',result.detail.userInfo);
                            app.globalData.userinfoDetailData = result.detail;
                            that.setData({
                                "showAuthBox": false,
                                userInfo: result.detail.userInfo,
                            });
                            wx.setStorageSync('cusmallToken', res.data.model.cusmallToken);
                            app.globalData.cusmallToken = res.data.model.cusmallToken;
                            wx.setStorageSync('lastTokenTime', new Date().getTime());
                            that.setData({
                                noAuthInfo: false
                            });
                            if (that.authCallback) {//授权后的回调
                                that.authCallback();
                            } else if (that.data.options) { // 重置
                                that.onLoad(that.data.options);
                            }
                            if (that.data.pageType == '换点') {  //换点定制
                                that.getMemberInfo()
                            }
                            that.userinfoFinishCb && that.userinfoFinishCb();
                        } else {
                            let errMsg = res.data.msg;

                            if (res.data.ret == -4000) {
                                errMsg = "请检查配置参数";
                            } else {
                                errMsg = "请重新登录";
                            }
                            wx.showModal({
                                title: '获取授权信息异常',
                                showCancel: false,
                                content: errMsg
                            });
                        }
                    }
                })

            },
        });
        // wx.navigateTo({
        //   url: app.globalData.userinfoBackPage
        // })
    } else {
        wx.showModal({
            title: '用户授权',
            content: "拒绝授权将无法体验完整功能，建议打开授权",
            showCancel: false,
            complete: function (res) {

            }
        })
    }
}

/*
*
* */
function notLogin() {
    if (this.data.authType == 1) {  //页面授权拒绝停留当前页面
        if (this.data.coverImg) {
            wx.redirectTo({
                url: '/pages/interaction/guaguaka/guaguaka?activityId=' + this.data.options.activityId
            })
        }
        this.setData({
            "showAuthBox": false
        })
    } else if (this.data.authType == 'back') {
        wx.navigateBack({
            delta: 1
        })
    } else {
        wx.reLaunch({
            url: '/pages/index/index'
        })
    }
}

/*
* 登录授权
* */
function checkUserInfo(cb) {
    let pageVm = this;
    let app = getApp();

    let scene = wx.getStorageSync('pageScene');
    let shareType = wx.getStorageSync('shareType');
    let fromOpenId = wx.getStorageSync('fromOpenId');

    let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
    let userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
        if (scene || (shareType && fromOpenId)) {
            app.bindHandle(); //分销+积分绑定
        }
        return true;
    } else {
        pageVm.userinfoFinishCb = function () {
            app.globalData.userInfo = wx.getStorageSync('userInfo');
            app.bindHandle();
        };
        wx.hideLoading();
        let appName = cf.config.customPack ? cf.config.name : extConfig.name;
        let appLogo = cf.config.customPack ? cf.config.logo : extConfig.logo;
        app.globalData.appName = appName;
        app.globalData.appLogo = appLogo;
        pageVm.setData({
            "showAuthBox": true,
            appName: appName,
            appLogo: appLogo
        })
        wx.login({
            success() {
                console.log("我是login")
            }
        });
    }
    return false;
}

/*
*  随便逛逛
* */

function backHome() {
    let app = getApp();
    if (app.globalData.shopuid && app.globalData.fromuid) {
        wx.redirectTo({
            url: '/pages/index/index?shopui=' + app.globalData.shopuid + '&fromuid=' + app.globalData.fromuid,
        })
    } else {
        wx.reLaunch({
            url: '/pages/index/index',
        })
    }
}

/*
* 预览图片
* */
function previewImg(e) {
    console.log(e);
    let imgUrl = e.currentTarget.dataset.img;
    let imgArr = (e.currentTarget.dataset.arrimg).split(",");
    wx.previewImage({
        current: imgUrl, // 当前显示图片的http链接
        urls: imgArr.length > 0 ? imgArr : [imgUrl] // 需要预览的图片http链接列表
    });
}

/*
* 获取自定义分享配置
* */
function getShareConfig(name) {
    let that = this;
    let app = getApp();
    let userInfo = wx.getStorageSync('userInfo');
    let mallSite = wx.getStorageSync('mallSite');
    let headerData = wx.getStorageSync('headerData');
    let pages = getCurrentPages();
    let currentRouter = pages[pages.length - 1]; //当前的路由
    let currentOptions = currentRouter.options; // 当前的路由参数
    let currentOptionsArr = Object.keys(currentOptions);
    let params = '';
    if (currentOptionsArr.length > 0) {
        for (let i = 0; i < currentOptionsArr.length; i++) {
            params += `${currentOptionsArr[i]}=${currentOptions[currentOptionsArr[i]]}&`
        }
    }

    let path = currentRouter.route + '?' + params + "&fromUid=" + app.globalData.fromuid + "&shopUid=" + app.globalData.shopuid;
    let title = name || headerData.share_title || mallSite.name;
    let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";

    let shareObj = {
        title: title,
        path: path,
        success: function (res) {
            // 成功
        },
        fail: function (res) {
            // 失败
        }
    };
    if (imageUrl) {
        shareObj.imageUrl = imageUrl;
    }
    return shareObj

}

/*
* 推荐商品滚动加载更多
* */
function recommendGoodsScrollToLower() {
    let that = this;
    let pageNum = 1;
    if (that.data.recommendGoodsList.length < that.data.recommendGoodsTotal) {
        pageNum++;
        that.getRecommendGoods(pageNum)
    }
}

/*
* 获取推荐商品
* */
function getRecommendGoods(page) {
    wx.showLoading({
        title: '加载中',
    });
    let that = this;
    let mallSite = wx.getStorageSync('mallSite');
    let submitData = {
        uid: mallSite.uid,
        cusmallToken: cusmallToken,
        start: (page - 1) * 10,
        limit: 10
    }
    wx.request({
        url: cf.config.pageDomain + '/applet/mobile/goods/getGoodsRecommendList',
        data: submitData,
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            var recommendGoodsList = res.data.model.list || [];
            /* 角标筛选 */
            recommendGoodsList.forEach(function (itemGoods) {
                if (itemGoods.cornerMarker && !itemGoods.cornerMarker.content) {
                    itemGoods.cornerMarker = JSON.parse(itemGoods.cornerMarker)
                } else if (!itemGoods.cornerMarker) {
                    itemGoods.cornerMarker = ""
                }
            })
            recommendGoodsList = recommendGoodsList.concat(that.data.recommendGoodsList);
            that.setData({
                recommendGoodsTotal: res.data.model.total,
                recommendGoodsList: recommendGoodsList,
                isOpenGoodsRecommend: res.data.model.isOpenGoodsRecommend
            });

            wx.hideLoading();
        },
        complete: function () {
            that.setData({
                isLoading: false
            });
        }
    })

}

// 活动时间
function showCountDown(startDate, endDate, that) {
    var now = new Date();
    let atyTimeShutDown;
    var leftTime = 0;
    if (startDate.getTime() - now.getTime() > 0) {
        leftTime = startDate.getTime() - now.getTime();
        this.setData({
            atyStatusTxt: "距开始",
            atyIsLive: false
        });
    } else if ((startDate.getTime() - now.getTime() < 0) && (endDate.getTime() - now.getTime() > 0)) {
        leftTime = endDate.getTime() - now.getTime();
        this.setData({
            atyStatusTxt: "距结束",
            atyIsLive: true
        });

    }
    if (0 >= leftTime) {
        clearInterval(atyTimer);
        atyTimeShutDown = {
            timerDay: util.numAddPreZero(0),
            timerHour: util.numAddPreZero(0),
            timerMinute: util.numAddPreZero(0),
            timerSecond: util.numAddPreZero(0)
        };
        this.setData({
            atyStatusTxt: "活动结束"
        });
        this.setData({
            atyIsLive: false
        });
        return;
    }
    var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10); //计算剩余的天数
    var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10); //计算剩余的小时数
    var mm = parseInt(leftTime / 1000 / 60 % 60, 10); //计算剩余的分钟数
    var ss = parseInt(leftTime / 1000 % 60, 10); //计算剩余的秒数

    atyTimeShutDown = {
        timerDay: util.numAddPreZero(dd),
        timerHour: util.numAddPreZero(hh),
        timerMinute: util.numAddPreZero(mm),
        timerSecond: util.numAddPreZero(ss)
    };

    this.setData({
        atyTimeShutDown: atyTimeShutDown
    });

}

//活动时间
function showCountDownActy(startDate, endDate, atyTimer, activityId, that) {
    var now = new Date();
    let atyTimeShutDown;
    var leftTime = 0;
    if (startDate.getTime() - now.getTime() > 0) {
        leftTime = startDate.getTime() - now.getTime();
        this.setData({
            ['groupbuy.gb' + activityId + 'atyStatusTxt']: "距开始",
        });
    } else if ((startDate.getTime() - now.getTime() < 0) && (endDate.getTime() - now.getTime() > 0)) {
        leftTime = endDate.getTime() - now.getTime();
        this.setData({
            ['groupbuy.gb' + activityId + 'atyStatusTxt']: "距结束",
            ['groupbuy.gb' + activityId + 'aty.activityStatus']: 2,
            ['groupbuy.gb' + activityId + 'aty.activityStatusTxt']: '立即抢'
        });

    }
    if (0 >= leftTime) {
        clearInterval(atyTimer);
        atyTimeShutDown = {
            timerDay: util.numAddPreZero(0),
            timerHour: util.numAddPreZero(0),
            timerMinute: util.numAddPreZero(0),
            timerSecond: util.numAddPreZero(0)
        };
        this.setData({
            ['groupbuy.gb' + activityId + 'atyStatusTxt']: "活动结束",
            ['groupbuy.gb' + activityId + 'aty.activityStatus']: 3,
            ['groupbuy.gb' + activityId + 'aty.activityStatusTxt']: '已结束'
        });
        return;
    }
    var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10); //计算剩余的天数
    var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10); //计算剩余的小时数
    var mm = parseInt(leftTime / 1000 / 60 % 60, 10); //计算剩余的分钟数
    var ss = parseInt(leftTime / 1000 % 60, 10); //计算剩余的秒数

    atyTimeShutDown = {
        timerDay: util.numAddPreZero(dd),
        timerHour: util.numAddPreZero(hh),
        timerMinute: util.numAddPreZero(mm),
        timerSecond: util.numAddPreZero(ss)
    };

    this.setData({
        ['groupbuy.gb' + activityId + 'time']: atyTimeShutDown
    });

}

/* 活动时间改版 */
function newCountDownActy(arrObj) {
    let totalGroup = {};
    for (let value of arrObj) {
        let groupObj = {};
        let {startDate, endDate, activityId, that} = value;
        var now = new Date();
        let atyTimeShutDown;
        var leftTime = 0;
        if (startDate.getTime() - now.getTime() > 0) {
            leftTime = startDate.getTime() - now.getTime();
            groupObj['groupbuy' + activityId + 'atyStatusTxt'] = "距开始";
        } else if ((startDate.getTime() - now.getTime() < 0) && (endDate.getTime() - now.getTime() > 0)) {
            leftTime = endDate.getTime() - now.getTime();
            groupObj['groupbuy' + activityId + 'atyStatusTxt'] = "距结束";
            groupObj['groupbuy' + activityId + 'aty.activityStatus'] = 2;
            groupObj['groupbuy' + activityId + 'aty.activityStatusTxt'] = '立即抢';

        }
        if (0 >= leftTime) {
            // clearInterval(atyTimer);
            atyTimeShutDown = {
                timerDay: util.numAddPreZero(0),
                timerHour: util.numAddPreZero(0),
                timerMinute: util.numAddPreZero(0),
                timerSecond: util.numAddPreZero(0)
            };
            groupObj['groupbuy' + activityId + 'atyStatusTxt'] = "活动结束";
            groupObj['groupbuy' + activityId + 'aty.activityStatus'] = 3;
            groupObj['groupbuy' + activityId + 'aty.activityStatusTxt'] = '已结束';
            continue;
        }
        var dd = parseInt(leftTime / 1000 / 60 / 60 / 24, 10); //计算剩余的天数
        var hh = parseInt(leftTime / 1000 / 60 / 60 % 24, 10); //计算剩余的小时数
        var mm = parseInt(leftTime / 1000 / 60 % 60, 10); //计算剩余的分钟数
        var ss = parseInt(leftTime / 1000 % 60, 10); //计算剩余的秒数

        atyTimeShutDown = {
            timerDay: util.numAddPreZero(dd),
            timerHour: util.numAddPreZero(hh),
            timerMinute: util.numAddPreZero(mm),
            timerSecond: util.numAddPreZero(ss)
        };
        groupObj['groupbuy' + activityId + 'time'] = atyTimeShutDown;
        totalGroup[activityId] = groupObj;
    }
    this.setData({
        totalGroup
    });
}

// 订阅消息
function requestSubMsg(pTplNums, callback) {
    var ctx = this;
    var cusmallToken = wx.getStorageSync('cusmallToken');
    wx.request({
        url: cf.config.pageDomain + "/applet/mobile/subMsgTpl/findTplIdByNum",
        data: {
            cusmallToken: cusmallToken,
            pTplNums: pTplNums
        },
        header: {
            'content-type': 'application/json'
        },
        success: function (res) {
            var data = res.data;
            if (data && data.ret == 0) {
                var list = data.model.list || [];
                console.log(list)
                if (list.length > 0) {
                    wx.requestSubscribeMessage({
                        tmplIds: list,
                        success(resp) {
                            console.log("success---")
                        },
                        fail(resp) {
                            console.log('fail----')
                        },
                        complete(resp) {
                            console.log('complete')
                            callback && callback(resp)
                        }
                    })
                } else {
                    callback && callback(res)
                }


            }
        },
        fail() {

        },
        complete() {

        }
    });
}

/**
 * 获取订阅消息配置
 * parmas msgType
 */
function getMsgConfig(msgType) {
    let tplNum = [];
    for (var i = 0; i < msgType.length; i++) {
        tplNum.push(subMsg[msgType[i].name][msgType[i].msgcode].msgcode);
    }
    console.log(tplNum);
    return tplNum.join(',');
}

/*
* 模块导出
* */
module.exports = {
    handleCommonFormSubmit: handleCommonFormSubmit,
    onNavTab: onNavTab,
    getReviewConfig,
    getShareConfig,
    backToHome,
    userInfoHandler,
    notLogin,
    commMakeCall,
    getIntegrate,
    checkUserInfo,
    backHome,
    fnOpenLocation,
    longCopy,
    previewImg,
    openloaction,
    getRecommendGoods,
    recommendGoodsScrollToLower,
    showCountDown,
    showCountDownActy,
    newCountDownActy,
    getMsgConfig,
    requestSubMsg
}
