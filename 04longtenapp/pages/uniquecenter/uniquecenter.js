// my.js
//获取应用实例
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var baseHandle = require("../template/baseHandle.js");
var app = getApp();
Page(Object.assign({}, baseHandle, {

    /**
     * 页面的初始数据
     */
    data: {
        app: app,
        userInfo: {},
        needUserInfo: true,
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        fxStaticResPath: cf.config.staticResPath + "/image/mobile/fx/",
        tplType: -1,//暂时预约店铺许使用，故设置默认值-1，预约店铺为4
        urlData: "",
        authType: 1,//页面授权拒绝停留当前页面
        siteName: "",//店铺名称
        curPoint: 0,
        isSalesmen: "",
        totalMoney: 0,
        showFX: false,
        listliShow: [true, true, true, true, true, true, true],
        menusLoading: true,
        userCentre: {
            dingdan: true, //订单配置
            vipCard: true, //会员卡
            coupon: true, //优惠券
            chuzhi: true, //储值金
            score: true, //积分
            address: true, //地址管理
            shopCar: true, //购物车
            indexPage: true, //首页
            media: true,
            form: true,
            secondCard: true,//会员次卡
            giftCard: true, // 礼品卡
            queue: true,//排队
            menusList: {},
            bgSet: {},
            couponCount: 0

        },
        needLoad: true,
        accountPackagePrivilege: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        cusmallToken = wx.getStorageSync('cusmallToken');
        mallSiteId = wx.getStorageSync('mallSiteId');
        mallSite = wx.getStorageSync('mallSite');

        this.setData({
            options: options
        })
        if (app.globalData.fromuid) {
            this.setData({
                isSubShop: true
            });
        }
        //当选择官网的时候 仅显示 地址、我的店铺菜单
        let mIndustry = mallSite.industry;
        if (1 == mIndustry) {
            this.setData({
                listliShow: [false, false, false, false, true, false, true]
            })
        }
        //mallSite.tplType =4;//测试时使用。勿提交
        if (mallSite.tplType == 1) {//预约订单
            this.setData({urlData: "&sitetype=dianshang"});
        } else if (mallSite.tplType == 2) {//预约订单
            this.setData({urlData: "&sitetype=dianshang"});
        } else if (mallSite.tplType == 3) {//预约订单
            this.setData({urlData: "&sitetype=waimai"});
        } else if (mallSite.tplType == 4) {//预约订单
            this.setData({urlData: "&sitetype=yuyue"});
        }
        wx.hideShareMenu();
        this.setData({
            userInfo: app.globalData.userInfo,
            tplType: mallSite.tplType,
            siteName: mallSite.name
        })
        let that = this;
        util.afterPageLoad(that);
        if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
            that.getUserInfo(options)
        } else {
            this.getUserCentreCus();
        }


    },
    // 获取可用优惠券
    fetchCountMyCoupons: function () {
        var that = this;
        wx.showLoading({
            title: '加载中',
        });

        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/coupon/countMyCoupons',
            data: {
                cusmallToken: cusmallToken,
                fromUid: app.globalData.fromuid || "",
                shopUid: app.globalData.shopuid || "",
                state: 1
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var couponCount = res.data.model.total;
                    that.setData({
                        couponCount: couponCount
                    })
                    wx.hideLoading();
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取优惠券信息异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })

    },
    getUserCentreCus: function () {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/mallSite/getCusmallUserCenterCustom',
            data: {
                mallSiteId: mallSiteId,
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                console.log(res);
                if (res.data && res.data.ret == 0) {
                    let UserCenterCustom = res.data.model.cusmallUserCenterCustom.componentSwitch;
                    let componentSetting = JSON.parse(res.data.model.cusmallUserCenterCustom.componentSetting || '{"menusList":{},"bgSet":{}}');
                    let accountPackagePrivilege = res.data.model.accountPackagePrivilege;
                    that.setData({
                        menusList: componentSetting.menusList,
                        bgSet: componentSetting.bgSet
                    })
                    if ((UserCenterCustom & (Math.pow(2, 0))) != 0) {
                        that.setData({
                            ["userCentre.dingdan"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.dingdan"]: false
                        })
                    }
                    if (((UserCenterCustom & (Math.pow(2, 1))) != 0) && accountPackagePrivilege.membercard) {
                        that.setData({
                            ["userCentre.vipCard"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.vipCard"]: false
                        })
                    }
                  if (((UserCenterCustom & (Math.pow(2, 16))) != 0)) {
                      that.setData({
                        ["userCentre.giftCard"]: true
                      })
                    } else {
                      that.setData({
                        ["userCentre.giftCard"]: false
                      })
                    }
                    if (((UserCenterCustom & (Math.pow(2, 2))) != 0) && accountPackagePrivilege.coupon) {
                        that.setData({
                            ["userCentre.coupon"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.coupon"]: false
                        })
                    }
                    if (((UserCenterCustom & (Math.pow(2, 3))) != 0) && accountPackagePrivilege.deposit) {
                        that.setData({
                            ["userCentre.chuzhi"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.chuzhi"]: false
                        })
                    }
                    if (((UserCenterCustom & (Math.pow(2, 4))) != 0) && accountPackagePrivilege.integral) {
                        that.setData({
                            ["userCentre.score"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.score"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 5))) != 0) {
                        that.setData({
                            ["userCentre.address"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.address"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 6))) != 0) {
                        that.setData({
                            ["userCentre.shopCar"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.shopCar"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 7))) != 0) {
                        that.setData({
                            ["userCentre.indexPage"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.indexPage"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 8))) != 0) {
                        that.setData({
                            ["userCentre.media"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.media"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 9))) != 0) {
                        that.setData({
                            ["userCentre.secondCard"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.secondCard"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 10))) != 0) {
                        that.setData({
                            ["userCentre.form"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.form"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 11))) != 0) {
                        that.setData({
                            ["userCentre.track"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.track"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 12))) != 0) {
                        that.setData({
                            ["userCentre.myCollection"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.myCollection"]: false
                        })
                    }
                    if ((UserCenterCustom & (Math.pow(2, 13))) != 0) {
                        that.setData({
                            ["userCentre.queue"]: true
                        })
                    } else {
                        that.setData({
                            ["userCentre.queue"]: false
                        })
                    }
                } else {
                    wx.showToast({
                        title: res.data.msg,
                        icon: "none"
                    });
                }


            },
            complete() {
                that.setData({
                    menusLoading: false
                });
            }
        })
    },
    toMyInfo() {
        if (this.data.distributorTreeNode && 0 === this.data.distributorTreeNode.nodeStatus) {
            wx.navigateTo({
                url: '/pages/fenxiao/myInfo',
            })
        } else {
            wx.showModal({
                title: '提示',
                showCancel: false,
                content: "账号冻结中"
            })
        }

    },
    getMemberInfo: function () {
        let that = this;
        let submitData = {
            cusmallToken: cusmallToken
        };
        if (app.globalData.shopuid) {
            submitData.shopUid = app.globalData.shopuid;
            submitData.fromUid = app.globalData.fromuid;
        }
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/member/getMemberInfo',
            data: submitData,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {

                let data = res.data;
                if (data && 0 == data.ret) {
                    that.setData({memberInfo: data.model.member});
                } else {
                    wx.showToast({
                        title: data.msg,
                        icon: "none"
                    });
                }

            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },
    getCountOrder: function () {
        let that = this;
        let submitData = {
            cusmallToken: cusmallToken
        };
        if (app.globalData.shopuid) {
            submitData.shopUid = app.globalData.shopuid;
            submitData.fromUid = app.globalData.fromuid;
        }
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/countOrder',
            data: submitData,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                wx.hideLoading();
                let data = res.data;
                if (data && 0 == data.ret) {
                    that.setData({orderCount: data.model});
                } else {
                    wx.showToast({
                        title: data.msg,
                        icon: "none"
                    });
                }

            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },
    toPointsList: function () {
        wx.navigateTo({
            url: "/pages/uniquecenter/integratelist"
        });
    },
    getPromoterAccount: function () {
        let that = this;

        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/getPromoterAccount",
            data: {
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                console.log(data)
                if (data && 0 == data.ret) {
                    if (data.model.distributorTreeNode && data.model.distributorTreeNode.identity == 1) {
                        that.setData({
                            isSalesmen: true
                        });
                    } else {
                        that.setData({
                            isSalesmen: false
                        });
                    }
                    that.setData({
                        distributorTreeNode: data.model.distributorTreeNode
                    })
                    if (data.model.promoterAccount && 0 < data.model.promoterAccount.enableWithdrawMoney) {
                        that.setData({
                            totalMoney: data.model.promoterAccount.enableWithdrawMoney
                        });
                    }
                }
            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },
    /*点击登录授权*/
    tinyWxHeadImg() {
        if (!this.checkUserInfo()) {
            return false;
        }
        // this.getUserInfo(this.data.options)
    },
    updateUserInfo() {
        // 必须是在用户已经授权的情况下调用
        let that = this;
        wx.getUserInfo({
            success: function (res) {
                wx.showToast({
                    title: "更新成功",
                    icon: "none"
                });
                that.setData({
                    userInfo: res.userInfo
                })
            }
        })
    },
    /* 获取授权信息 */
    getUserInfo(options) {
        var that = this;
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');
            that.getDistributorConfig();
            console.log("onShow");
            if (that.data.needLoad) {//为了配合 onload
                that.getUserCentreCus();
                that.getMemberInfo();
                that.fetchCountMyCoupons();
                that.getUserCentreCus();
                that.getCountOrder();
                that.setData({
                    needLoad: false
                });
            }
        });
    },
    getDistributorConfig: function () {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/getDistributorConfig",
            data: {
                cusmallToken: cusmallToken,
                mallSiteId: mallSiteId
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                if (data && 0 == data.ret) {
                    if (data.model.distributorConfig && (data.model.distributorConfig.switchEquity & (Math.pow(2, 0))) != 0) {
                        if (that.data.app.globalData.shopuid) {
                            //子店铺不能使用分销
                            that.setData({
                                showFX: false
                            });
                        } else {
                            that.setData({
                                showFX: true
                            });
                            that.getPromoterAccount();
                        }
                    } else {
                        that.setData({
                            showFX: false
                        });
                    }
                } else {

                }
            },
            fail: function () {
            },
            complete: function () {
            }
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
    onShow: function (options) {
        let that = this;
        if (app.globalData.userInfo) {
            this.setData({
                userInfo: app.globalData.userInfo,
            })
            that.getUserInfo(options)
        } else {
            that.getUserCentreCus();
        }
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
