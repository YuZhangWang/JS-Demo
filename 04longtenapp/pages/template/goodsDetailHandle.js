var cf = require("../../config.js");
var util = require("../../utils/util.js");
module.exports = {
    /*
    *
    * */
    bindPromoter: function (promoterOpenid) {
        let cusmallToken = wx.getStorageSync('cusmallToken');
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/bindPromoter",
            data: {
                cusmallToken: cusmallToken,
                promoterOpenid: promoterOpenid,
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                console.log(data);
            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },

    /*
    *
    * */
    bindPromoterByQR: function (scene) {
        let cusmallToken = wx.getStorageSync('cusmallToken');
        let that = this;
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/sceneToJson",
            data: {
                cusmallToken: cusmallToken,
                scene: scene
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                if (data && 0 == data.ret) {
                    let promoterOpenid = data.model.scene && data.model.scene.fromOpenId;
                    let qrcodeType = data.model.scene && data.model.scene.qrcodeType;
                    that.setData({id: data.model.scene && data.model.scene.goodsId});
                    that.fetchData();
                    that.fetchCount();
                    // if ("FX" == qrcodeType) {
                    //     wx.request({
                    //         url: cf.config.pageDomain + "/applet/mobile/distributor/bindPromoter",
                    //         data: {
                    //             cusmallToken: cusmallToken,
                    //             promoterOpenid: promoterOpenid,
                    //         },
                    //         header: {
                    //             'content-type': 'application/json'
                    //         },
                    //         success: function (res) {
                    //             let data = res.data;
                    //         },
                    //         fail: function () {
                    //         },
                    //         complete: function () {
                    //         }
                    //     });
                    // }
                }


            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },

    /*
    *
    * */
    sceneToJson(scene, cb) {
        let cusmallToken = wx.getStorageSync('cusmallToken');
        let that = this;
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/sceneToJson",
            data: {
                cusmallToken: cusmallToken,
                scene: scene
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                console.log(data)
                if (data && 0 == data.ret) {
                    cb && cb(data);
                }


            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },

    /*
    *
    * */
    getDistributorConfig: function () {
        let cusmallToken = wx.getStorageSync('cusmallToken');
        let that = this;
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/distributor/getDistributorConfig",
            data: {
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                if (data && 0 == data.ret) {
                    that.setData({
                        distributorConfig: data.model.distributorConfig
                    })

                } else {

                }
            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },

    /*
    *
    * */
    getPromoterAccount: function () {//???????????????????????????
        let that = this;
        let cusmallToken = wx.getStorageSync('cusmallToken');
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

                    if (data.model.distributorTreeNode) {
                        that.setData({
                            promoterAccount: data.model.distributorTreeNode
                        })
                    }
                }
            },
            fail: function () {
            },
            complete: function () {
            }
        });
    },

    /*
    *
    * */
    search: function (e) {
        wx.navigateTo({
            url: '/pages/search/search?keyword=' + e.detail.value,
        })
    },

    /*
    *
    * */
    onBannerImgLoad: function (e) {
        var that = this;
        util.processBannerImgLoad(e, that);
    },

    /*
    *
    * */
    onNavTab: function (e) {
        var that = this;
        return util.processNavClick(e, that);
    },

    /**
     * ???????????????????????????banner??????
     */
    onMainBannerImgLoad: function (e) {
        var that = this;
        var w = e.detail.width;
        var h = e.detail.height;
        var bannerHeight = (h / w) * 750;
        if (that.data.mainBannerHeight != bannerHeight) {
            that.data.mainBannerHeight = bannerHeight;
            that.setData({mainBannerHeight: that.data.mainBannerHeight});
        }
    },

    /*
    *
    * */
    getPosterUrl: function (goodsId, gtype) {
        let that = this;
        let cusmallToken = wx.getStorageSync('cusmallToken');
        if (that.data.posterUrl) {
            wx.previewImage({
                current: that.data.posterUrl, // ?????????????????????http??????
                urls: [that.data.posterUrl] // ?????????????????????http????????????
            });
            return;
        }
        let goodsPage = "pages/detail/detail";
        if ("yy" == gtype) {
            goodsPage = "pages/yuyue/yydetail";
        }else if ('wm' == gtype) {
            goodsPage = "pages/takeout/indexDetail";
        }
        wx.showLoading({
            title: '?????????',
        });
        var postData = {
            cusmallToken: cusmallToken,
            page: goodsPage,
            goodsId: goodsId || that.data.id
        };
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/distributor/genGoodsPoster',
            data: postData,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                console.log("data:", data);
                wx.hideLoading();
                console.log(data);
                if (data && 0 == data.ret && data.model.qrcodeUrl) {
                    that.setData({
                        posterUrl: data.model.qrcodeUrl
                    });
                    wx.previewImage({
                        current: data.model.qrcodeUrl, // ?????????????????????http??????
                        urls: [data.model.qrcodeUrl] // ?????????????????????http????????????
                    });
                }
            }
        })
    },

    /*
    *
    * */
    showImgPre: function (e) {
        if (!this.checkUserInfo()) {
            return false;
        }
        let self = this;
        var goodsId = e.currentTarget.dataset.id;
        var gtype = e.currentTarget.dataset.gtype || "";
        if (e.currentTarget.dataset.needreload) {
            self.data.posterUrl = null;
        }
        self.getPosterUrl(goodsId, gtype);
    },

    /*
    *
    * */
    showCommonPoster: function (e) {
        if (!this.checkUserInfo()) {
            return false;
        }
        let _self = this;
        var goodsId = e.currentTarget.dataset.id;
        var gtype = e.currentTarget.dataset.gtype || "";
        if (e.currentTarget.dataset.needreload) {
            self.data.posterUrl = null;
        }
        _self.getPosterUrl(goodsId,gtype);
    },

    /*
    *
    * */
    backToHome: function () {
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
    },

    //??????????????????
    toJudgeList: function () {
        wx.navigateTo({
            url: '/pages/judge/judgeList?goodsId=' + this.data.goodsData.id
        })
    },

    // ??????????????????
    fetchCount: function () {
        var vm = this;
        let cusmallToken = wx.getStorageSync('cusmallToken');
        let mallSiteId = wx.getStorageSync('mallSiteId');
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/review/countReview",
            data: {
                mallSiteId: mallSiteId,
                cusmallToken: cusmallToken,
                goodsId: vm.data.id,
                source: vm.data.source || ""
            },
            header: {
                "content": "application/json"
            },
            success: function (res) {
                console.log(res.data);
                if (res.data.ret == 0) {
                    vm.setData({
                        judgeCount: res.data.model.count
                    })
                }
            }
        })
    },

    // ??????????????????
    findConfig: function () {
        var that = this;
        let cusmallToken = wx.getStorageSync('cusmallToken');
        let mallSiteId = wx.getStorageSync('mallSiteId');
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/mallSite/findConfig',
            data: {
                cusmallToken: cusmallToken,
                mallSiteId: mallSiteId
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                that.setData({
                    openGoodsShare: res.data.model.config && res.data.model.config.openGoodsShare
                })
            }
        })
    }
}
