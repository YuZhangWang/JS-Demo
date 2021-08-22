let cf = require("../../config.js");
let util = require("../../utils/util.js");
let categoryTabHandle = require("../template/categoryTabWidget.js");
let navTabPanelHandle = require("../template/navTabPanel.js");
let searchHandle = require("../template/searchHandle.js");
let commHandle = require("../template/commHandle.js");
let baseHandle = require("../template/baseHandle.js");
let cusmallToken = wx.getStorageSync('cusmallToken');
var address = require('../../utils/city2-min.js');
//获取应用实例
let app = getApp();
Page(Object.assign({}, categoryTabHandle, navTabPanelHandle, searchHandle, baseHandle, commHandle, {
    data: {
        decoration: {},
        shoppingCartCount: 0,
        app: app,
        // 是否跳过用户信息授权
        skipUserInfoOauth: true,
        authType: 1,//页面授权拒绝停留当前页面
        //选择地址
        animationAddressMenu: {},
        addressMenuIsShow: false,
        addressNew: address,
        value: [0, 0, 0],
        provinces: [],
        citys: [],
        areas: [],
        areaInfo: "",
        isShowMask: true,
        mAreaId: "",
        isloading: true,
        //
        bannerHeight: {},
        isIndexPage: true,
        navTabPanelData: {},
        loadingPercent: 20,
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        staticResPathBargain: cf.config.staticResPath + "/youdian/image/mobile/s_bargain/",
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        /* 新人有礼*/
        newUserBg1: cf.config.staticResPath + "/image/mobile/newUser/bg-small.png",
        newUserBg2: cf.config.staticResPath + "/image/mobile/newUser/bg-middle.png",
        newUserBg3: cf.config.staticResPath + "/image/mobile/newUser/bg-large.png",
        hasGived: false,
        indexGive: "",

        multInfo: {},
        multInfoArr: {},
        multInfoAddr: "",
        playBgMusic: true,
        multClassArr: {},
        haveMutl: false,
        haveSearch: false,
        communityHandleData: {
            topicList: [],
            categoryList: []
        },
        topicArr: {},
        categoryArr: {},
        mallSiteId: "",
        indexSize: 0,
        showCardPrice:true ,//会员价
        liveStatus: {
        "101": "直播中",
        "102": "未开始",
        "103": "已结束",
        "107": "已过期",
      }
    },
    onLoad: function (options) {
        wx.showShareMenu({
            withShareTicket: false
        });
        this.setData({
            options,
            userInfo: wx.getStorageSync('userInfo')
        });
        //生命周期函数--监听页面加载
        let that = this;
        // 处理多店铺分店UID
        if ("y" == options.singleShop) app.globalData.singleShop = true;//有些子店是不通过总店进来的 而是直接扫码进来 要对这种情况做处理

        if (options.totalshop == 'true') {
            options.shopuid = false;
            app.globalData.shopuid = "";
            app.globalData.fromuid = "";
            that.data.app.globalData.shopuid = "";
            that.data.app.globalData.fromuid = "";
        }
        if (options.shopuid) {
            app.globalData.shopuid = options.shopuid;
            app.globalData.fromuid = options.fromuid;
            that.setData({
                fromIndex: true
            })
            that.data.app.globalData.shopuid = options.shopuid;
            that.data.app.globalData.fromuid = options.fromuid;
        } else if (!app.globalData.shopuid) {
            app.globalData.shopuid = "";
            app.globalData.fromuid = "";
            that.data.app.globalData.shopuid = "";
            that.data.app.globalData.fromuid = "";
        }

        // 是否打开调试
        if (options.isDebug) {
            wx.setEnableDebug({
                enableDebug: true
            });
        }

        if (options.scene) {
            //options.scene = "previewuid=312";
            // 处理预览UID
            let scene = decodeURIComponent(options.scene);
            let params = scene.split("=");
            if (params[0] == "previewuid") {
                app.globalData.previewuid = params[1];
                that.data.app.globalData.previewuid = params[1];
            } else if (params[0] == "tplid") {
                app.globalData.tplid = params[1];
                that.data.app.globalData.tplid = params[1];
                wx.reLaunch({
                    url: 'tpl_index?tplid=' + params[1]
                });
                return;
            }
        }
        console.log("mark time 0-------------> " + new Date().getTime())
        that.setData({
            loadingPercent: 50
        })

        // 防止出现ajax问题一直出现加载页面
        setTimeout(function () {
            that.setData({
                hideLaunchPage: true
            })
        }, 8000);

        app.getUserInfo(this, options, function (userInfo, res) {
            // 首先加载商城首页装饰数据
            wx.hideLoading();
            app.fetchMallSite(true).then(function (res) {
                cusmallToken = wx.getStorageSync('cusmallToken');
                that.setData({
                    loadingPercent: 80
                });
                /* 新人有礼 */
                that.handleGift().then(function () {
                    that.fetchData(res);
                    that.setData({
                        loadingPercent: 99
                    })
                    util.afterPageLoad(that);

                    if (that.data.bgMusic) {
                        that.audioCtx = wx.createAudioContext('bgMusic');
                        that.audioCtx.play();
                    }
                    if (that.data.app.globalData.bottomMenus && that.data.app.globalData.bottomMenus.list.length) {
                        that.setData({
                            "app.globalData.bottomMenus.list[0].selected": true
                        })
                    }
                });//领取权限检查
            });
            util.getShoppingCartCount(function (count) {
                that.setData({shoppingCartCount: count});
            }, app);
            //util.afterPageLoad(that);
            util.afterPageLoad(that);
            that.setData({
                isloading: false
            })
        });

        //util.addPVStat();

        // 初始化动画变量 地址选择
        var animation = wx.createAnimation({
            duration: 500,
            transformOrigin: "50% 50%",
            timingFunction: 'ease',
        })
        this.animation = animation;
        // 默认联动显示北京
        var id = address.provinces[0].id;

        this.setData({
            provinces: address.provinces,
            citys: address.citys[id],
            areas: address.areas[address.citys[id][0].id],
        });
        //地址选择
    },

    authCallback() {
        this.setData({
            userInfo: wx.getStorageSync('userInfo')
        });
        this.getReward(this.data.getSelectId);
    },
    /* 弹出框 */
    hideMask: function () {
        this.setData({
            isShowMask: true
        });
    },
    // 成为会员
    memberIn() {
        wx.navigateTo({
            url: "/pages/vipcard/vipcard?id=" + this.data.memberLimitCard
        });
        this.setData({
            isShowMask: true
        })
    },
    search: function (e) {
        wx.navigateTo({
            url: '/pages/search/search?keyword=' + e.detail.value,
        })
    },
    // 关闭快速引导
    closeGuide: function () {
        let app = getApp();
        app.globalData.showGuide = false;
        if (app.globalData.bottomMenus) {
            app.globalData.bottomMenus.isShow = true
        }

        console.log(app)
        this.setData({
            app: app
        })
        wx.removeStorageSync("showGuide");


    },
    fetchData: function (res) {
        wx.hideLoading()
        let that = this;
        let decorationData = {};
        let mallSite = res.data.model.mallSite;
        if (res.data.model.decoration) {
            decorationData = JSON.parse(res.data.model.decoration);
        } else {
            decorationData = JSON.parse(mallSite.decoration);
        }
        wx.setNavigationBarTitle({
            title: decorationData.header_data.title
        });
        wx.setNavigationBarColor({
          frontColor: decorationData.header_data.tabTxtColor == '0' ? "#000000":"#ffffff",
          backgroundColor: decorationData.header_data.tabColor
        })
        // 处理decorationData
        util.processDecorationData(decorationData, that);

        that.setData({
            showOpeningModal: app.globalData.showOpeningModal && !that.data.isNewUser,
            decoration: decorationData,
        })

        setTimeout(function () {
            that.setData({
                hideLaunchPage: true
            })
        }, 10);
        if (that.data.haveMutl || that.data.haveSearch) {//获取当前地址
            that.fetchLocationAddr();

            util.autoGeyAddr(function (data) {
              that.setData({
                multInfoAddr: data.model.address,
                locationInfo: data.model
              });
            }, cusmallToken);
        }


    },
    changeRoute: function (url) {
        wx.navigateTo({
            url: `../${url}/${url}`
        })
    },
    fetchLocationAddr: function (latitude, longitude) {
        let mallSiteId = wx.getStorageSync('mallSiteId');
        let that = this;
        let multClassArr = that.data.multClassArr;
        let multInfoArr = {};
        wx.getLocation({
            type: 'gcj02',
            success: function (res) {
                let submitData = {
                    start: 0,
                    limit: 10,
                    cusmallToken: cusmallToken,
                    longitude: longitude || res.longitude,
                    latitude: latitude || res.latitude,
                    mallSiteId: mallSiteId
                };
                // 加载预览的店铺的多店铺信息
                if (app.globalData.previewuid) {
                    submitData.uid = app.globalData.previewuid;
                }
                wx.request({
                    url: cf.config.pageDomain + "/applet/mobile/map_api/locationToDesc",
                    data: {
                        cusmallToken: cusmallToken,
                        location: latitude + "," + longitude
                    },
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function (res) {
                        let data = res.data;
                        that.setData({
                            multInfoAddr: data.model.address
                        });

                    },
                    fail: function () {
                    },
                    complete: function () {
                    }
                });
                for (let key in multClassArr) {

                    submitData.multClass = multClassArr[key];
                    wx.request({
                        url: cf.config.pageDomain + "/applet/mobile/multstore/getMultStorePage",
                        data: submitData,
                        header: {
                            'content-type': 'application/json'
                        },
                        success: function (res) {
                            let data = res.data;
                            // that.setData({
                            //   multInfoAddr: data.model.address
                            // });

                            if (data.ret == 0 && data.model && data.model.list) {
                                that.setData({
                                    ['multInfoArr.' + key + '']: data.model.list.slice(0, 5)
                                });

                            } else {
                                that.setData({
                                    ['multInfoArr.' + key + '']: []
                                });
                            }


                        },
                        fail: function () {
                        },
                        complete: function () {
                        }
                    });
                }
            },
            fail: function (e) {
                let msg = JSON.stringify(e);
                wx.showModal({
                    title: "提示",
                    content: "无法获取定位地址请在“关于——设置”中允许小程序使用地理位置",
                    showCancel: false
                });
                console.log(e);
            }
        })
    },
    getMultLocation: function () {
        let that = this;
        wx.chooseLocation({
            success: function (res) {
                that.fetchLocationAddr(res.latitude, res.longitude);
            }
        })
    },
    closeOpeningModal: function () {
        this.setData({
            showOpeningModal: false
        })
    },

    /* 新人有礼*/
    handleGift() {  //新用户判断
        let that = this;
        return new Promise(function (resolve) {
            wx.request({
                url: cf.config.pageDomain + "/mobile/activity/newcomerGift/showNewcomerGiftActivity",
                data: {
                    cusmallToken: cusmallToken
                },
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    let data = res.data;
                    resolve();
                    if (data.ret == 0) {
                        let result = data.model;
                        let newcomerGiftRule = result.newcomerGiftRule;
                        let rewardList = [];
                        for (let obj in result) {
                            if (result[obj]===true && obj!=='isShowNewcomerGift') {
                                for (let item in newcomerGiftRule) {
                                    if (obj.indexOf(item) !== -1) {
                                        if (item=='coupon' || item=='goldeggs') {
                                            newcomerGiftRule[item].bgImg= 1;
                                        }else if (item == 'savings' || item == 'integral') {
                                            newcomerGiftRule[item].bgImg = 2;
                                        }else if (item == 'card' || item == 'bigwheel') {
                                            newcomerGiftRule[item].bgImg = 3;
                                        }
                                        newcomerGiftRule[item].type = item;
                                        newcomerGiftRule[item].show = true;
                                        rewardList.push(newcomerGiftRule[item]);
                                    }
                                }
                            }
                        }
                        that.setData({
                            isNewUser: result.isShowNewcomerGift,
                            activityId: result.activityId,
                            rewardList,
                            newUserBg: that.data['newUserBg'+rewardList.length],
                            getRestriction: result.getRestriction,
                        });
                    }
                }
            });
        });

    },
    filterType(type,urlId) {
        let giftType,pathUrl;
        switch (type) {
            case 'all':
                giftType = 0;
                break;
            case 'coupon':
                giftType = 1;
                pathUrl = '/pages/coupon/mycoupon';
                break;
            case 'card':
                giftType = 2;
                pathUrl = '/pages/mycards/cardlist';
                break;
            case 'savings':
                giftType = 3;
                pathUrl = '/pages/store/mystore';
                break;
            case 'integral':
                giftType = 4;
                pathUrl = '/pages/uniquecenter/integratelist';
                break;
            case 'bigwheel':
                giftType = 5;
                pathUrl = '/pages/interaction/wheel/wheel?activityId='+urlId;
                break;
            case 'goldeggs':
                giftType = 6;
                pathUrl = '/pages/interaction/golden_egg/golden_egg?activityId='+urlId;
                break;
        }
        if (urlId) {
            return pathUrl;
        } else {
            return giftType;
        }
    },
    getReward(e) { // 领取奖励
        this.data.getSelectId = e;
        if (!this.checkUserInfo()) {
            return false;
        }
        wx.showLoading({
            title: "领取中...",
        });
        if (this.data.indexGive !== '') {
            wx.showToast({
                title: "只能领取一种",
                icon: 'none',
                duration: 2000
            });
        }
        let that = this;
        let type = e.currentTarget.dataset.type;
        let idx = e.currentTarget.dataset.idx;
        if (that.data.receiving) {
            return;
        }
        that.data.receiving = true;
        wx.request({
            url: cf.config.pageDomain + "/mobile/activity/newcomerGift/receiveNewcomerGift",
            data: {
                cusmallToken: cusmallToken,
                activityId: that.data.activityId,
                giftType: that.filterType(type)
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                console.log(res);
                that.data.receiving = false;
                wx.hideLoading();
                if (data.ret == 0) {
                    wx.showToast({
                        title: "领取成功",
                        icon: 'success',
                        duration: 2000
                    });
                    if (type === 'all') {
                        that.setData({
                            hasGived: true
                        });
                    } else {
                        that.data.rewardList.forEach(function (item, index) {
                            if (index !== idx) {
                                item.show = false;
                            }
                        });
                        that.setData({
                            indexGive: idx,
                            rewardList: that.data.rewardList
                        })
                    }
                } else {
                    wx.showToast({
                        title: "领取失败，请稍后重试",
                        icon: "none"
                    });
                }
            },
            fail() {
                wx.hideLoading();
                wx.showToast({
                    title: "领取失败",
                    icon: "none"
                });
                that.data.receiving = false;
            }
        });
    },
    checkReward(e) {
        let that = this;
        let type = e.currentTarget.dataset.type;
        let id = e.currentTarget.dataset.id || 1;

        let urlPath = '';
        wx.navigateTo({
            url: that.filterType(type,id)
        })
    },
    handleClose() {
        wx.hideLoading();
        this.setData({
            isNewUser: false
        })
    },

    onReady: function () {
        //生命周期函数--监听页面初次渲染完成
        // console.log('onReady');
    },
    onShow: function () {
        console.log("mark time onshow-------------> " + new Date().getTime())
        //生命周期函数--监听页面显示
        // console.log('onShow');
        // 从子店铺首页切换回主店铺首页时需要重新获取mallSite
        let that = this;
        wx.hideLoading()
        if (app.globalData.needReloadIndexPage) {
            //this.onLoad({});
            app.fetchMallSite(true).then(function (res) {
                that.fetchData(res);
                util.getShoppingCartCount(function (count) {
                    that.setData({shoppingCartCount: count});
                }, app);
                util.afterPageLoad(that);
            });
            app.globalData.needReloadIndexPage = false;
        }
        if (that.data.bgMusic && that.data.playBgMusic) {
            setTimeout(function () {
                that.audioCtx.play();
            }, 100);
        }
        if (that.data.skillArray) {
            that.getSKListData(that.data.skillArray);
        }

        // this.setSecAtyTimer();
    },
    onHide: function () {
        //生命周期函数--监听页面隐藏
        // console.log('onHide');
        if (this.audioCtx) {
            this.audioCtx.pause();
        }
        this.clearSecAtyTimer();
    },
    onUnload: function () {
        //生命周期函数--监听页面卸载
        // console.log('onUnload');
        // 清除多店铺UID
        if (app.globalData.shopuid) {
            app.globalData.shopuid = null;
            app.globalData.fromuid = null;
            // 从子店铺首页切换回主店铺首页时需要重新获取mallSite
            app.globalData.needReloadIndexPage = true;
        }
        this.clearSecAtyTimer();
    },
    onPullDownRefresh: function () {
        //页面相关事件处理函数--监听用户下拉动作
        // console.log('onPullDownRefresh');
        // //调用应用实例的方法获取全局数据
        let that = this;
        // 更新皮肤
        app.queryUserIdentity(true).then(function () {
            that.setData({app: getApp()});
        });
        app.fetchMallSite(true).then(function (res) {
            that.fetchData(res);
            util.getShoppingCartCount(function (count) {
                that.setData({shoppingCartCount: count});
            }, app);
            util.afterPageLoad(that);
            wx.stopPullDownRefresh();
        });

    },
    gotoHktChat: function () {
        app.globalData.showHKTChatTips = false;
        this.setData({
            app: app
        })
    },
    onReachBottom: function () {
        //页面上拉触底事件的处理函数
        // console.log('onReachBottom');
    },
    /**
     * 用户点击右上角
     */
    onShareAppMessage: function () {
        let that = this;
        let userInfo = wx.getStorageSync('userInfo');
        let mallSite = wx.getStorageSync('mallSite');
        let headerData = wx.getStorageSync('headerData');
        let title = headerData.share_title ? headerData.share_title : mallSite.name;
        let imageUrl = headerData.share_img || ""
        let path = "/pages/index/index?";
        if (app.globalData.shopuid) {
            path += "shopuid=" + app.globalData.shopuid;
            if (app.globalData.fromuid) {
                path += "&fromuid=" + app.globalData.fromuid;
            }
        } else if (app.globalData.isDistributor && app.globalData.isOpenDistribution) {
            path += "fromOpenId=" + app.globalData.myOpenid + "&shareType=FX";
            title = userInfo.nickName + "@你来看" + mallSite.name;
        }
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
        if(imageUrl){
          shareObj.imageUrl = that.data.userImagePath + imageUrl
        }
        console.log(shareObj)

        return shareObj;
    }
}))
