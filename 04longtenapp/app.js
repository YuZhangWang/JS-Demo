//app.js
let cf = require("/config.js");
let util = require("/utils/util.js");
let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
if (extConfig.ald_enable && extConfig.dev) {
    let san = require("/san.js");
}
App({
    onLaunch: function (options) {
        //调用API从本地缓存中获取数据
        //let logs = wx.getStorageSync('logs') || []
        //logs.unshift(Date.now())
        //wx.setStorageSync('logs', logs)
        let that = this;
        wx.hideLoading();
        if (options.referrerInfo) {
            that.referrerInfo = JSON.stringify(options);
        }
        wx.setStorageSync("showGuide", true)
        // 打开调试
        // wx.setEnableDebug({
        //   enableDebug: true
        // });

        wx.getSystemInfo({
            success: function (res) {
                console.log(res);
                if (0 <= res.model.indexOf("iPhone X")) {
                    that.globalData.isIPhoneX = true;
                }
                if (0 <= res.model.indexOf("iPhone 11")) {
                    that.globalData.isIPhone11 = true;
                }
            }
        })
    },
    getUserInfo: function (pageVm, options, cb) {
        wx.hideLoading();
        let that = this;
        let app = getApp();
        let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}; //获取第三方配置文件ext.json
        let uid = cf.config.customPack ? cf.config.uid : extConfig.uid;  //获取config.js文件的相关配置

        /* 小程序主题色设置 */
        let headerData = wx.getStorageSync('headerData');
        if (headerData) {
            wx.setNavigationBarColor({
                frontColor: headerData.tabTxtColor == '0' ? "#000000" : "#ffffff",
                backgroundColor: headerData.tabColor
            })
        }
        if (!wx.getStorageSync('lastTokenTime')) {  //最后一次获取cusmallToken的时间 --->场景：
            wx.removeStorageSync("cusmallToken");
        } else if (options && options.secret && options.point_code && options.business_type && options.business_type == 'change_point') { //场景：
            // 定制需要强制调用获取token接口
            wx.removeStorageSync("cusmallToken");
        } else { //场景：
            let lastTokenTime = wx.getStorageSync('lastTokenTime');
            // token 默认两天后失效
            if (new Date().getTime() - lastTokenTime > 2 * 24 * 60 * 60 * 1000) {  //移除cusmallToken
                wx.removeStorageSync("cusmallToken");
            }
        }
        console.log("生产环境域名(cf.config.pageDomain)", cf.config.pageDomain);
        that.getCusmallToken(pageVm, options).then(function () {

            // 定制处理 小程序注册,审核通过才能进入访问小程序
            if (cf.config.pageDomain.indexOf("weijuju.com") != -1 && (uid == 13693 || uid == 37774 || uid == 118578)) {
                that.judgeEnterApplet();
            }
            app.globalData.userInfo = wx.getStorageSync('userInfo');
            app.globalData.cusmallToken = wx.getStorageSync('cusmallToken');

            let promises = [];
            promises.push(that.queryUserIdentity());
            if (!wx.getStorageSync('mallSiteId') && !pageVm.data.isIndexPage) {
                promises.push(that.fetchMallSite());
            }
            Promise.all(promises).then(function (cbParams) {
                cb(app.globalData.userInfo, cbParams);
            });

        });
    },
    bindHandle: function () {
        let app = getApp();
        let scene = wx.getStorageSync('pageScene');
        let shareType = wx.getStorageSync('shareType');
        let fromOpenId = wx.getStorageSync('fromOpenId');

        /* 分销、邀请送积分 调用相关接口 */
        if (scene) {//|| options.fxShareId
            wx.request({
                url: cf.config.pageDomain + "/applet/mobile/distributor/sceneToJson",
                data: {
                    cusmallToken: app.globalData.cusmallToken,
                    scene: scene //|| options.fxShareId
                },
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    let data = res.data;
                    if (data && 0 == data.ret) {
                        wx.removeStorageSync("pageScene");
                        wx.removeStorageSync("shareType");
                        wx.removeStorageSync("fromOpenId");
                        let promoterOpenid = data.model.scene && data.model.scene.fromOpenId;
                        let qrcodeType = data.model.scene && data.model.scene.qrcodeType;
                        let typeUrl, typeParams = {
                            cusmallToken: app.globalData.cusmallToken,
                        };
                        if ("FX" == qrcodeType) {
                            typeUrl = "/applet/mobile/distributor/bindPromoter";
                            typeParams.promoterOpenid = promoterOpenid;
                            wx.request({
                                url: cf.config.pageDomain + typeUrl,
                                data: typeParams,
                                header: {'content-type': 'application/json'},
                                success: function (res) {
                                    let data = res.data;
                                    console.log(data);
                                }
                            });
                            // pageThat.commBindPromoter(promoterOpenid);
                        } else if ("invitation" == qrcodeType) {
                            typeUrl = "/applet/mobile/member/invitattionMember";
                            typeParams.scene = scene;
                            wx.request({
                                url: cf.config.pageDomain + typeUrl,
                                data: typeParams,
                                header: {'content-type': 'application/json'},
                                success: function (res) {
                                    let data = res.data;
                                    console.log(data);
                                }
                            });
                            // pageThat.commInvitation(scene);
                        }

                    }
                },
            });
        }
        if ("FX" == shareType) {
            wx.request({
                url: cf.config.pageDomain + "/applet/mobile/distributor/bindPromoter",
                data: {
                    cusmallToken: app.globalData.cusmallToken,
                    promoterOpenid: fromOpenId
                },
                header: {'content-type': 'application/json'},
                success: function (res) {
                    let data = res.data;
                    console.log(data);
                }
            });
            // pageThat.commBindPromoter(fromOpenId);
            wx.removeStorageSync("pageScene");
            wx.removeStorageSync("shareType");
            wx.removeStorageSync("fromOpenId");
            // wx.removeStorageSync("pageThat");
        }
    },
    getCusmallToken: function (pageVm, options) {
        let that = this;
        let app = getApp();
        if (options && options.scene) {
            wx.setStorageSync('pageScene', options.scene)
        }
        if (options && options.shareType && options.shareType == "FX") {
            wx.setStorageSync('shareType', options.shareType);
            wx.setStorageSync('fromOpenId', options.fromOpenId);
        }
      let refresh = false;
      if (wx.getStorageSync('cusmallToken') && (!refresh || wx.getStorageSync('userInfo'))) {
          if (wx.getStorageSync('userInfo')) {
            if ((options && options.scene) || (options && options.shareType && options.shareType == "FX")){
              that.bindHandle();
            }
          }
          // 检测token已存在 并且已授权基本用户信息 则直接返回
          return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
            //调用登录接口
            wx.login({
                success: function (res) {
                    let wxCode = res.code;
                    // 获取用户信息
                    let userInfo = wx.getStorageSync('userInfo');
                    // 调用后台接口获取cusmallToken
                    let submitData = {
                        wxCode: wxCode,
                        uid: cf.config.customPack ? cf.config.uid : extConfig.uid
                    }
                    if (app.globalData.userinfoDetailData) {
                        submitData.encryptedData = app.globalData.userinfoDetailData.encryptedData;
                        submitData.iv = app.globalData.userinfoDetailData.iv;
                    }
                    if (options && options.secret && options.point_code && options.business_type && options.business_type == 'change_point') {
                        //客户定制处理，文案特殊展示
                        util.handleOptions(options);
                    }
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
                            if (res.data.ret == 0) {
                                wx.setStorageSync('cusmallToken', res.data.model.cusmallToken);
                                wx.setStorageSync('lastTokenTime', new Date().getTime());
                                app.globalData.userInfo = wx.getStorageSync('userInfo');
                                app.globalData.cusmallToken = wx.getStorageSync('cusmallToken');
                                let mallSiteId = wx.getStorageSync('mallSiteId');
                                /**
                                 if (!mallSiteId) {
                                  that.queryUserIdentity().then(function () {
                                    that.fetchMallSite().then(cb);
                                  });
                                } else {
                                  that.queryUserIdentity().then(function () {
                                    typeof cb == "function" && cb(app.globalData.userInfo);
                                  });
                                }
                                **/
                                if (!res.data.model.isOuthBaseInfo) {
                                    wx.removeStorageSync("userInfo");
                                }
                                if (userInfo) {
                                    app.globalData.userInfo = userInfo;
                                    resolve();
                                } else if (!pageVm.data.skipUserInfoOauth) { //弹出授权窗口的判断
                                    // 判断进入页面是否需要弹出授权框
                                    pageVm.userinfoFinishCb = function () {
                                        app.globalData.userInfo = wx.getStorageSync('userInfo');
                                        that.bindHandle();//分销+积分绑定
                                        resolve();
                                    }
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
                                } else {
                                    resolve();
                                }
                            } else {
                                let errMsg = res.data.msg;

                                if (res.data.ret == -4000) {
                                    errMsg = "请检查配置参数";
                                }
                                wx.showModal({
                                    title: '获取授权信息异常',
                                    showCancel: false,
                                    content: errMsg
                                })
                            }
                        }
                    })

                },
                fail: function (res) {
                    console.error("wxlogin fail:" + res);
                    /**
                     wx.getSetting({
                      success: function (res) {
                        if (!res.authSetting["scope.userInfo"]) {
                          //重新弹出授权
                          wx.openSetting({
                            success: function (res) {
                              wx.reLaunch({
                                url: 'pages/index/index',
                              })
                            }
                          })
                        }
                      }
                    })
                    **/
                }
            })
        });
    },
    // 无论从哪个子页面进入应用，启动时默认要获取站点首页数据
    fetchMallSite: function (hideLoading) {
        // if (wx.getStorageSync('mallSiteId')) {
        //   return Promise.resolve();
        // }
        wx.hideLoading()
        return new Promise(function (resolve, reject) {
            console.log("Start fetchMallSite...");
            console.log("cf.config.pageDomain", cf.config.pageDomain);
            console.log("cusmallToken", wx.getStorageSync('cusmallToken'));
            let extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {};
            let that = this;
            let app = getApp();
            let submitData = {
                cusmallToken: wx.getStorageSync('cusmallToken'),
                uid: cf.config.customPack ? cf.config.uid : extConfig.uid
            }
            if (app.globalData.previewuid) {
                submitData.uid = app.globalData.previewuid;
                console.info("加载预览店铺UID", submitData.uid);
            }
            if (app.globalData.shopuid) {
                submitData.uid = app.globalData.shopuid;
                console.info("加载多店铺UID", submitData.uid);
            }
            wx.request({
                url: cf.config.pageDomain + '/applet/mobile/mallSite/getMallSite',
                data: submitData,
                header: {
                    'content-type': 'application/json'
                },
                fail: function (data) {
                    console.error("后台接口getMallSite失败", data);
                },
                success: function (res) {
                    console.log("Finish fetchMallSite...RES DATA", res);
                    let mallSite = res.data.model.mallSite;
                    app.globalData.currencySymbol = mallSite.currencySymbol || "￥";
                    // 处理账户到期
                    if (res.data.model.expire) {
                        wx.showModal({
                            title: '套餐过期',
                            showCancel: false,
                            content: "使用期已结束，请升级套餐！"
                        })
                        wx.hideLoading();
                        return;
                    }
                    // 判断是否免费用户
                    if (res.data.model.isFree && !res.data.model.isoem && app.globalData.previewuid) {
                        app.globalData.showHKTChatTips = true;
                    }
                    // 缓存OEM数据
                    //res.data.model.isoem = true;
                    //mallSite.copyright = "LCP Test";
                    //res.data.model.oemconfig = { extend:"{\"mobileCopyright\":\"LCP TEST\"}"};
                    //

                    if (res.data.model.isoem && mallSite.copyright) {
                        app.globalData.isoem = true;
                        app.globalData.oemconfig = res.data.model.oemconfig;
                        app.globalData.copyrightFormConfig = res.data.model.copyrightFormConfig;

                        if (app.globalData.oemconfig && app.globalData.oemconfig.extend) {
                            app.globalData.oemconfig.extend = JSON.parse(app.globalData.oemconfig.extend);
                            let reg = new RegExp("\\n", "g");
                            let mobileCopyright = app.globalData.oemconfig.extend.mobileCopyright;
                            if (mobileCopyright) {
                                app.globalData.oemconfig.extend.mobileCopyright = mobileCopyright.replace(reg, "<br />")
                            }
                        }
                        if (app.globalData.oemconfig && app.globalData.oemconfig.extend1) {
                            app.globalData.oemconfig.extend1 = JSON.parse(app.globalData.oemconfig.extend1);
                            let reg = new RegExp("\\n", "g");
                            let mobileCopyright = app.globalData.oemconfig.extend1.mobileCopyright;
                            if (null == app.globalData.oemconfig.extend) {
                                app.globalData.oemconfig.extend = {};//#1 以防 配了手机底部版权 却没配官网oem
                            }
                            if (mobileCopyright) {
                                app.globalData.oemconfig.extend.mobileCopyright = mobileCopyright.replace(reg, "<br />");//#1
                            }
                        }
                        if (app.globalData.copyrightFormConfig && app.globalData.copyrightFormConfig.isOn) {
                            if (app.globalData.copyrightFormConfig.content) {
                                app.globalData.copyrightFormConfig.content = JSON.parse(app.globalData.copyrightFormConfig.content);
                            }
                        }

                    } else {
                        app.globalData.isoem = false;
                    }

                    // 是否打开调试
                    if (extConfig.dev) {

                    } else {
                        if (mallSite.isDebug) {
                            wx.setEnableDebug({
                                enableDebug: true
                            });
                        }
                    }
                  
                    app.globalData.mallSite = mallSite;
                    wx.setStorageSync('mallSiteId', mallSite.id);
                    // 不必要缓存mallSite的decoration，提升性能
                    let mallSiteCache = Object.assign({}, mallSite);
                    mallSiteCache.decoration = {};
                    wx.setStorageSync('mallSite', mallSiteCache);
                    let decorationData = {};
                    if (res.data.model.decoration) {
                        decorationData = JSON.parse(res.data.model.decoration);
                    } else if (mallSite.decoration) {
                        decorationData = JSON.parse(mallSite.decoration);
                    }
                    app.globalData.bottomMenus = null;
                    app.globalData.haveShopcart = false;
                    app.globalData.haveContact = false;
                    app.globalData.haveBgMusic = false;

                    // 开始处理首页弹出蒙版
                    let showOpeningModal = false;
                    let headerData = decorationData.header_data;
                    wx.setStorageSync('headerData', headerData);
                    let modalData = decorationData.header_data.data;
                    let lastShowTime = wx.getStorageSync('openingModalLastShowTime');
                    let needShowModal = !lastShowTime && modalData;
                    if (lastShowTime && modalData && modalData.ts && lastShowTime != modalData.ts) {
                        needShowModal = true;
                    }

                    if (headerData.guide == "1" || !wx.getStorageSync("showGuide")) {
                        app.globalData.showGuide = false
                    } else {
                        app.globalData.showGuide = true
                    }

                    if (needShowModal) {
                        if (modalData.isShowMask && modalData.img) {
                            showOpeningModal = true;
                            decorationData.header_data.data = util.convertItemLink(decorationData.header_data.data, {data: {app: app}});
                            wx.setStorageSync('openingModalLastShowTime', modalData.ts || new Date().getTime());
                        } else {
                            showOpeningModal = false;
                        }
                    }
                    if (showOpeningModal) {
                        app.globalData.headerData = decorationData.header_data;
                    }
                    app.globalData.showOpeningModal = showOpeningModal;
                    let titleName = encodeURIComponent(headerData.title);
                    // 缓存底部菜单数据
                    if (decorationData != null && decorationData.items != null) {
                        for (let i = 0; i < decorationData.items.length; i++) {
                            let item = decorationData.items[i];
                            if (item.item_type == "takeawayWidget") {
                                if (app.globalData.fromuid) {
                                    wx.redirectTo({
                                        url: '/pages/takeout/index?fromIndex=true&fromuid=' + app.globalData.fromuid + '&type=ta&shopuid=' + app.globalData.shopuid + (item.data.return_index == 1 ? "&returnIndex=1" : "") + "&titleName=" + titleName,
                                    })
                                } else {
                                    wx.redirectTo({
                                        url: '/pages/takeout/index?fromIndex=true' + (item.data.return_index == 1 ? "&type=ta&returnIndex=1" : "") + "&titleName=" + titleName,
                                    })
                                }
                                return;
                            } else if (item.item_type == "toStoreWidget") {
                                if (app.globalData.fromuid) {
                                    wx.navigateTo({
                                        url: '/pages/takeout/index?type=tostore&fromIndex=true&fromuid=' + app.globalData.fromuid + '&shopuid=' + app.globalData.shopuid + (item.data.return_index == 1 ? "&returnIndex=1" : "") + "&titleName=" + titleName,
                                    })
                                } else {
                                    wx.redirectTo({
                                        url: '/pages/takeout/index?type=tostore&fromIndex=true' + (item.data.return_index == 1 ? "&returnIndex=1" : "") + "&titleName=" + titleName,
                                    })
                                }
                                return;
                            } else if (item.item_type == "bottomMenusWidget") {
                              var itemList = item.data.list;
                              for (var j = 0; j < itemList.length; j++) {
                                util.convertItemLink(itemList[j], { data: { app: app }});
                              }
                              app.globalData.bottomMenus = item.data;
                            }
                        }
                    }
                    resolve(res);
                    //typeof cb == "function" && cb(app.globalData.userInfo, res);
                    wx.hideLoading();
                }
            })
        });

    },
    queryUserIdentity: function (reload) {//获取当前用户信息
        let that = this;
        wx.hideLoading()
        let app = getApp();
        if (!reload && app.globalData.myOpenid) {
            return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
            wx.request({
                url: cf.config.pageDomain + "/applet/mobile/distributor/queryUserIdentity",
                data: {
                    cusmallToken: wx.getStorageSync('cusmallToken')
                },
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    let data = res.data;
                    if (data && 0 == data.ret) {
                        app.globalData.isDistributor = data.model.userIdentityVo.isDistributor;
                        app.globalData.isOpenDistribution = data.model.userIdentityVo.isOpenDistribution;
                        app.globalData.myOpenid = data.model.userIdentityVo.openid;
                        app.globalData.State = data.model.userIdentityVo.applyState;
                        app.globalData.applyRemark = data.model.userIdentityVo.applyRemark;

                        // 缓存颜色主题ID
                        app.globalData.themeId = data.model.themeId || 1;
                        /* 自定义主题 */
                        app.globalData.customTheme = data.model.customTheme ? JSON.parse(data.model.customTheme):'';
                        app.globalData.customStyleBg =  data.model.customTheme ? `background-color:${app.globalData.customTheme.themeMain} !important;`:'';
                        app.globalData.customStyleColor = data.model.customTheme ? `border-color:${app.globalData.customTheme.themeMain} !important;color:${app.globalData.customTheme.themeMain} !important;` : "";
                        if (app.globalData.customTheme.themeAssit == '#ffffff') {
                            app.globalData.customSubBg =  data.model.customTheme ? `color:${app.globalData.customTheme.themeMain} !important;background-color:${app.globalData.customTheme.themeAssit} !important;`:'';
                        }else {
                            app.globalData.customSubBg =  data.model.customTheme ? `background-color:${app.globalData.customTheme.themeAssit} !important;`:'';
                        }
                        app.globalData.customSubColor = data.model.customTheme ? `border-color:${app.globalData.customTheme.themeAssit} !important;color:${app.globalData.customTheme.themeAssit} !important;` : "";
                       /* 兼容销量、价格等三角形箭头 */
                        app.globalData.triBorderColor = `border-left-color:${app.globalData.customTheme.themeMain} !important;color:${app.globalData.customTheme.themeMain} !important;`;
                    }
                },
                fail: function () {
                },
                complete: function () {
                    resolve();
                }
            });
        });

    },

    judgeEnterApplet: function () {//是否能进入小程序
        let that = this;
        let app = getApp();
        var pageVm = "";
        if (getCurrentPages().length > 0) {
            pageVm = getCurrentPages()[getCurrentPages().length - 1];
        }
        if (pageVm.route.indexOf("customization/apply") != -1) {
            return;
        }
        wx.request({
            url: cf.config.pageDomain + "/applet/mobile/member/judgeEnterApplet",
            data: {
                cusmallToken: wx.getStorageSync('cusmallToken')
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                let data = res.data;
                if (data && 0 == data.ret) {
                    if (!data.model.isEnter) {
                        let state = data.model.state;
                        // if (!app.globalData.userInfo){
                        //   app.globalData.userInfo = {};
                        // }
                        // app.globalData.userInfo.nickName = data.model.nickName;
                        // app.globalData.userInfo.avatarUrl = data.model.headPic;
                        if (state == 10) {
                            wx.reLaunch({
                                url: '/pages/customization/apply/apply',
                            })
                        } else if (state == 0) {
                            wx.reLaunch({
                                url: '/pages/customization/apply/applyResult?applyResult=success',
                            })
                        } else if (state == -1) {
                            wx.reLaunch({
                                url: '/pages/customization/apply/applyResult?applyResult=fail',
                            })
                        }
                        app.globalData.hasRedirectApply = true;
                    }
                }
            },
            fail: function () {
            },
            complete: function () {

            }
        });
    },
    globalData: {
        userInfo: null,
        cusmallToken: null
    },
    onHide: function () {
        wx.getBackgroundAudioManager().pause();
    }

})
