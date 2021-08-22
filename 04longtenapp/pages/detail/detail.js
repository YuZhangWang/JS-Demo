// detail.js
var cf = require("../../config.js");
var util = require("../../utils/util.js");
var categoryTabHandle = require("../template/categoryTabWidget.js");
var searchHandle = require("../template/searchHandle.js");
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var commHandle = require("../template/commHandle.js");
var baseHandle = require("../template/baseHandle.js");
//获取应用实例
var app = getApp();
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = {};
var cusmallToken = wx.getStorageSync('cusmallToken');
Page(Object.assign({}, baseHandle, categoryTabHandle, commHandle, goodsDetailHandle, searchHandle, {

    /**
     * 页面的初始数据
     */
    data: {
        goodsData: {},
        isIntegralGoods: false,//是否积分商品
        goodsCover: [],
        goodsType: "",
        authType: 1,//页面授权拒绝停留当前页面
        // 是否跳过用户信息授权
        skipUserInfoOauth: true,
        specData: [],
        isDetailPage: true,
        decoration: {},
        vipCard: {},
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        totalBuyCount: 1,
        app: app,
        bannerHeight: {},
        mainBannerHeight: 562,
        shoppingCartCount: 0,
        deliveryTxt: "-",
        id: "",
        categoryContClass: "",
        fuzzyLayerStatu: "",
        infoDialogStatu: "",
        isCollect: false,
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        judgeCount: "",
        isDone: false,
        directValue: 0,//直接奖励
        inderectValue: 0,//间接奖励
        isSalesmen: false,//判断是否是销售人员
        showFX: false,//判断是开启分销,
        posterUrl: "",//海报url
        switchEquity: '', //满包邮开关
        goodsCount: '',//满x件包邮
        goodsPrice: '',//满x元包邮
        playBgMusic: true,
        showGoodsCount: false,
        showGoodsPrice: false,
        openGoodsShare: false,
        showOverReduce: false,//满减配置
        overReduceType: 0,
        overReduceRule: {},
        showOverReduceDetail: false,
        isCollected: false,//收藏
        showTrack: false,//足迹
        currentIndex: 0,//当前索引
        isBook: false,//定制
        step: 0,
        trackList: [],
        microBottomMenu: {},
        navTabPanelData: {},
        multInfo: {},
        multInfoArr: {},
        multInfoAddr: "",
        multClassArr: {},
        haveMutl: false,
        haveSearch: false,
        firstEnter: false,
        product: {},
        communityHandleData: {
            topicList: [],
            categoryList: []
        },
        totalCount: "",
        isShowMask: true, //弹出框
        showCardPrice: true, //会员价
        source: 0

    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        mallSite = wx.getStorageSync('mallSite');
        var that = this;
        var fromOpenId = options.fromOpenId;
        var shareType = options.shareType;
        var fromuid = options.fromUid;
        var shopuid = options.shopUid;
        var parse = JSON.parse;
        if (fromuid) {
            app.globalData.fromuid = fromuid
        }
        if (shopuid) {
            app.globalData.shopuid = shopuid
        }
        that.setData({
            isMainShop: !app.globalData.shopuid//是否是主店
        });
        //定制
        if (mallSite.uid) {
            var uids = [94107, 94109, 94113, 94115, 94117, 94119, 94121, 94123, 94125, 94127, 94129, 94131, 94133, 94135, 94137, 80965, 91699];
            for (var i = 0; i < uids.length; i++) {
                if (mallSite.uid == uids[i]) {
                    that.setData({
                        isBook: true
                    })
                }
            }
        }
        //为了强制去查 推广员的实时信息
        app.globalData.myOpenid = null;
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');
            mallSiteId = wx.getStorageSync('mallSiteId');


            that.getReviewConfig();

            that.getIntegrate();

            that.setData({id: options.id});

            that.setData({isCollect: mallSite.isDeliveryToStore});
            if (options.id) {
                that.fetchData();
                that.getRecommondGoodsInfo(options.id)
                that.fetchCount();
            }
            that.findConfig();
            if (mallSite) {
                that.setData({
                    switchEquity: parse(mallSite.globalConfig).switchEquity,
                    goodsCount: parse(mallSite.globalConfig).goodsCount,
                    goodsPrice: parse(mallSite.globalConfig).goodsPrice
                });
                // 开关判断
                var switchA = parse(mallSite.globalConfig).switchEquity;
                if (((switchA & Math.pow(2, 2)) != 0) && parse(mallSite.globalConfig).goodsCount > 0) {
                    that.setData({
                        showGoodsCount: true
                    });
                } else {
                    that.setData({
                        showGoodsCount: false
                    });
                }

                if (((switchA & Math.pow(2, 3)) != 0) && parse(mallSite.globalConfig).goodsPrice > 0) {
                    that.setData({
                        showGoodsPrice: true
                    });
                } else {
                    that.setData({
                        showGoodsPrice: false
                    });
                }
            }
            //满减判断
            if (mallSite.overReduce) {
                let overReduce = JSON.parse(mallSite.overReduce);
                if (overReduce.ruleType && overReduce.ruleArray && (overReduce.ruleType == 1 || overReduce.ruleType == 2)) {
                    let overReduceType = overReduce.ruleType;
                    let overReduceRule = overReduce.ruleArray;
                    if (overReduceRule.length > 0) {
                        for (let i = 0; i < overReduceRule.length; i++) {
                            overReduceRule[i].reduce = (overReduceRule[i].reduce / 100).toFixed(2);
                            if (overReduceType == 2) {
                                overReduceRule[i].over = (overReduceRule[i].over / 100).toFixed(2);
                            }
                        }
                        that.setData({
                            showOverReduce: true,
                            overReduceType: overReduceType,
                            overReduceRule: overReduceRule,
                        });
                    }
                }
            }
            // 首单立减
            if (mallSite.firstOrderDiscount) {
                let firstOrderDiscount = JSON.parse(mallSite.firstOrderDiscount);
                firstOrderDiscount.reduceMoney = (firstOrderDiscount.reduceMoney / 100).toFixed(2);
                that.setData({
                    firstOrderDiscount: firstOrderDiscount
                })
            }
            // if ("FX" == shareType){
            //   that.bindPromoter(fromOpenId);
            // }

            util.getShoppingCartCount(function (count) {
                that.setData({shoppingCartCount: count});
            }, app);
            that.setData({
                showFX: app.globalData.isOpenDistribution
            });
            that.setData({
                isSalesmen: app.globalData.isDistributor
            });
            if (that.data.showFX && that.data.isSalesmen) {
                that.getDistributorConfig();
                that.getPromoterAccount();
            }

            if (options.scene && !options.id) {//如果是qrcode进来则绑定
                console.log("qrcode进来---")
                that.bindPromoterByQR(options.scene)
            }
            that.getTrackList();
            util.afterPageLoad(that);
        });
    },
    //商品视频
    toPlayVideo(e) {
        var ctx = this;
        wx.navigateTo({
            url: '/pages/single_video/video_play?id=' + ctx.data.goodsData.id,
        })
    },
    viewImg: function (e) { // 预览图片
        var ctx = this;
        var idx = e.currentTarget.dataset.id;
        var type = e.currentTarget.dataset.type;
        var relaPathPic = [];
        if ("banner" == type) {
            relaPathPic = ctx.data.goodsCover;
        }
        var absoultPathPic = [];
        for (var i = 0; i < relaPathPic.length; i++) {
            let imgUrl = ""
            if (relaPathPic[i].indexOf("http") != 0) {
                imgUrl = ctx.data.userImagePath + relaPathPic[i]
            } else {
                imgUrl = relaPathPic[i]
            }
            absoultPathPic.push(imgUrl);
        }
        wx.previewImage({
            current: absoultPathPic[idx],
            urls: absoultPathPic
        })
    },
    // 收藏
    collectGoods: function () {

        if (!this.checkUserInfo()) {
            return false;
        }
        var that = this;
        var reqUrl = "";
        that.setData({
            isCollected: !that.data.isCollected
        })
        if (that.data.isCollected) {
            reqUrl = "/applet/mobile/goods_follow/collectGoods";
        } else {
            reqUrl = "/applet/mobile/goods_follow/cancelCollect";
        }

        wx.request({
            url: cf.config.pageDomain + reqUrl,
            data: {
                cusmallToken: cusmallToken,
                goodsId: that.data.id
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data && res.data.ret == 0) {
                    if (that.data.isCollected) {
                        wx.showToast({
                            title: '收藏成功！',
                            image: "../../images/collectedB.png",
                            duration: 3000
                        })
                    } else {
                        wx.showToast({
                            title: '取消收藏！',
                            image: "../../images/cancelCollectB.png",
                            duration: 3000
                        })
                    }

                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '提示',
                        showCancel: false,
                        content: '' + res.data.msg
                    })
                }
            }
        })


    },

    fetchData: function () {
        var that = this;
        wx.showLoading({
            title: '加载中',
        });
        // 缓存goodsId
        wx.setStorageSync('defaultGoodsId', that.data.id);
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/selectGoods',
            data: {
                cusmallToken: cusmallToken,
                goodsId: that.data.id,
                addFootprint: true,
                showCardPrice: true
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var goodsData = res.data.model.goods;
                    var memberCardId = res.data.model.memberCardId || 0;
                    var memberCardPrice = res.data.model.memberCardPrice || 0;
                    let memberLimitCard = res.data.model.limitMemberCard || "";
                    that.setData({
                        isLimitMemberCardJump:res.data.model.isLimitMemberCardJump,
                        goodsType: goodsData.goodsType,
                        isIntegralGoods: 5 == goodsData.goodsType ? true : false,
                        totalCount: goodsData.totalCount,
                        memberCardPrice: memberCardPrice,
                        memberLimitCard: Number(memberLimitCard),
                        memberCardId: memberCardId,
                        BuyGoodsMoney: goodsData.giftIntegral
                    });
                    if (res.data.model.hasOwnProperty('isFollow')) {
                        that.setData({
                            isCollected: res.data.model.isFollow
                        })
                    }

                    if (goodsData.directValue) {
                        that.setData({directValue: goodsData.directValue});
                    }
                    if (goodsData.inderectValue) {
                        that.setData({inderectValue: goodsData.inderectValue});
                    }
                    if (goodsData.decoration == null) {
                        goodsData.decoration = {};
                    }
                    if (goodsData.usenewspec) {
                        var specData = JSON.parse(goodsData.spec);
                        that.setData({"specData": specData});
                        if (res.data.model.spec.length > 1) {
                            var ids = specData[0].ids.split(',');
                            for (let i = 0; i < res.data.model.spec.length; i++) {
                                res.data.model.spec[i].selectedId = ids[i];
                            }
                        } else {
                            res.data.model.spec[0].selectedId = specData[0].ids;
                        }

                        that.setData({"specList": res.data.model.spec});
                        goodsData.selectedSku = specData[0];
                    }
                    if ((goodsData.configSuperSwitch & (Math.pow(2, 0))) != 0 || !memberCardId) {
                        that.setData({
                            showCardPrice: false
                        })
                    }
                    /* 虚拟商品 */
                    if ((goodsData.configSuperSwitch & (Math.pow(2, 1))) != 0) {
                        that.setData({
                            isVirtualGoods: true
                        });
                    }else {
                        that.setData({
                            isVirtualGoods: false
                        });
                    }
                    /* 起购数量开关 */
                    if ((goodsData.configSuperSwitch & (Math.pow(2, 4))) != 0) {
                        that.setData({
                            purchaseCon: true,
                            totalBuyCount: goodsData.startCount,
                            startCount: goodsData.startCount
                        });
                    } else {
                        that.setData({
                            purchaseCon: false,
                            totalBuyCount: 1,
                            startCount: goodsData.startCount
                        });
                    }

                    /* 商品限购开关 */
                    if (goodsData.enableLimitation == 1) {
                        let enableCount = goodsData.limitations - goodsData.historyCount;
                        that.setData({
                            limitEnable: true,
                            limitCount: enableCount > 0 ? enableCount : 0,
                            historyCount: goodsData.historyCount
                        });
                    } else {
                        that.setData({
                            limitEnable: false,
                            limitCount: 10000
                        });
                    }


                    if (goodsData.pics != null) {
                        that.setData({
                            goodsCover: goodsData.pics.split(","),
                            videoUrl: goodsData.videoUrl
                        });
                    }
                    that.setData({goodsData: goodsData});

                    var decorationData = JSON.parse(goodsData.decoration);
                    // 处理decorationData
                    util.processDecorationData(decorationData, that);
                    that.setData({
                        decoration: decorationData,
                        vipCard: decorationData.header_data
                    });
                    if (that.data.bgMusic) {
                        that.audioCtx = wx.createAudioContext('bgMusic');
                        that.audioCtx.play();
                    }
                    // 计算快递费用
                    that.calDeliveryFee(goodsData);
                } else {
                    wx.showModal({
                        title: '获取商品信息异常',
                        showCancel: false,
                        content: '' + res.data.msg
                    })
                }
            },
            complete: function () {
                wx.hideLoading();
                that.setData({
                    isDone: true
                })
            }
        })

    },
    //好物圈
    getRecommondGoodsInfo: function (id) {
        var that = this
        var reqUrl = "/applet/mobile/goods/getRecommondGoodsInfo"
        wx.request({
            url: cf.config.pageDomain + reqUrl,
            data: {
                cusmallToken: cusmallToken,
                goodsId: id
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                console.log(res)
                if (res.data && res.data.ret == 0) {
                    console.log(res)
                    that.setData({
                        product: res.data.model.product
                    })
                } else {
                }
            }
        })
    },

    findSkuFromGoods(goods, skuId) {
        var specData = JSON.parse(goods.spec);
        for (var i = 0; i < specData.length; i++) {
            if (specData[i].ids == skuId) {
                return specData[i];
            }
        }
        return null;
    },
    //获取足迹数据
    getTrackList: function () {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/footprint/find',
            data: {
                cusmallToken: cusmallToken,
                shopUid: mallSite.uid || "",
                goodsType: 1,
                start: 0,
                limit: 10,
                goodsName: "",
                goodsIdNot: that.data.id || ""


            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data && res.data.ret == 0) {
                    var list = res.data.model.list;

                    that.setData({
                        trackList: list
                    })
                    wx.hideLoading();
                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取商品足迹异常',
                        showCancel: false,
                        content: '' + res.data.msg
                    });
                }
            }
        })

    },

    // 计算运费
    calDeliveryFee: function (goodsData) {
        var that = this;
        if (goodsData.deliveryFeeType == 0) {
            that.setData({deliveryTxt: "快递：" + app.globalData.currencySymbol + (goodsData.deliveryPrice / 100).toFixed(2)});
        } else if (goodsData.deliveryFeeType == 1) {
            wx.request({
                url: cf.config.pageDomain + '/applet/mobile/yunfei/getTemplateById',
                data: {
                    id: goodsData.deliveryTemplateId,
                    cusmallToken: cusmallToken
                },
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    var template = res.data.model.template;
                    that.setData({deliveryTxt: "快递：" + app.globalData.currencySymbol + (template.price / 100).toFixed(2)});
                }
            })
        } else {
            that.setData({deliveryTxt: "快递包邮"});
        }
        if (that.data.isCollect) {
            that.setData({deliveryTxt: "运费到付"});
        }
        let mallSite = wx.getStorageSync('mallSite');
        if (!mallSite.enableExpressDistribution) {
            that.setData({deliveryTxt: ""});
        }
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
    onCloseInfoDialog: function () {
        var that = this;
        that.setData({fuzzyLayerStatu: "fuzzylayer-hide"});
        that.setData({infoDialogStatu: "dialog-hide"});
    },

    //点击满减箭头事件
    changeOverReduce: function () {
        var that = this;
        that.setData({
            ['showOverReduceDetail']: !that.data.showOverReduceDetail,
        });
    },
    //prevTrack
    prevTrack: function () {
        let that = this;
        that.setData({
            currentIndex: that.data.currentIndex - 1,
            step: -(that.data.currentIndex - 1) * 45
        })
    },
    //nextTrack
    nextTrack: function () {
        let that = this;
        that.setData({
            currentIndex: that.data.currentIndex + 1,
            step: -(that.data.currentIndex + 1) * 45
        })
    },

    // show modal

    showModel: function () {
        var that = this;
        that.setData({
            showTrack: false
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
        let that = this;
        if (that.data.firstEnter) {
            that.getTrackList();
            that.setData({
                currentIndex: 0,//当前索引
                step: 0,
            })
        } else {
            that.setData({
                firstEnter: true
            })
        }

        if (that.data.bgMusic && that.data.playBgMusic) {
            that.audioCtx.play();
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        if (this.audioCtx) {
            this.audioCtx.pause();
        }
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
        let ctx = this;
        if (ctx.data.trackList.length > 0) {
            ctx.setData({
                showTrack: true
            })
        }
        wx.stopPullDownRefresh();
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
        let path = "/pages/detail/detail?id=" + this.data.id + "&fromUid=" + (app.globalData.fromuid || '') + "&shopUid=" + (app.globalData.shopuid || '');
        let userInfo = wx.getStorageSync('userInfo');
        let mallSite = wx.getStorageSync('mallSite');
        let headerData = wx.getStorageSync('headerData');
        let title = this.data.goodsData.name;
        let imageUrl = headerData.share_img ? cf.config.userImagePath + headerData.share_img : "";
        if (app.globalData.isDistributor && app.globalData.isOpenDistribution) {
            path += "&fromOpenId=" + app.globalData.myOpenid + "&shareType=FX";
            title = userInfo.nickName + "@你来看" + this.data.goodsData.name;
        }
        let shareObj = {
            title: title,
            path: path,
            imageUrl: imageUrl,
            success: function (res) {
                // 成功
            },
            fail: function (res) {
                // 失败
            }
        };

        return shareObj;
    }
}));
