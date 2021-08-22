// pages/multiRepast/index.js
/* 小程序应用配置 多环境地址 */
var cf = require("../../config.js");
/* 小程序工具块 */
var util = require("../../utils/util.js");

/* 小程序本地存储数据 */
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');

/* 小程序公共函数方法块 */
var goodsDetailHandle = require("../template/goodsDetailHandle.js");
var baseHandle = require("../template/baseHandle.js");
let definedSpecArray = [];
//获取应用实例
var app = getApp();
Page(Object.assign({}, baseHandle, goodsDetailHandle, {

    data: {
        app: app,
        // 是否跳过用户信息授权
        skipUserInfoOauth: true,  //是否跳过授权弹出框
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        authType: 1,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        logoImg: "http://p0.meituan.net/xianfu/83f5fa588ae12840f2d68e72d1cfc40b46851.jpg",
        panelTab: {
            "selectedId": "0",
            "list": [
                {"id": "0", "title": "商品"},
                {"id": "1", "title": "商家"},
                {"id": "2", "title": "搜索"}
            ]
        },
        selectedCatIndex: 0,
        openGoodsShare: false,
        goodsList: [],
        focusOfficial: false,
        foodType: 3,
        mainBannerHeight: 562,
        isFirstShowPage: true,
        usenewspecShow: false,// 规格框的显示,
        scrollTop: 0,
        indicatorDots: false,
        autoplay: false,
        duration: 0, //可以控制动画
        indexSize: 0,
        showOverReduce: false,//满减配置
        overReduceType: 0,
        overReduceRule: {},
        showOverReduceDetail: false,//满减详情下拉
        othersAdd: [], //其他人添加数据
        mySelfAdd: [],
        connectSocket: '',

        leaveStatus: false,
        hasCalculate: false,

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        that.data.options = options;
        wx.removeStorageSync("toStoreTableInfo");
        /*
        * 店铺类型判断
        * */
        if(options.tableNo){
            that.setData({
                tableNo: options.tableNo,
            })
        }
        that.setData({
            tostore: true,
            foodType: 3
        })
        if (options.scene) {             //
            var scene = decodeURIComponent(options.scene);
            that.data.scene = scene.split("=");
            let tableNo = that.data.scene[1];
            that.setData({
                tableNo: tableNo,
            })
            // that.findTableInfo(tableId);  //店铺信息 （桌号）
        }
        that.getTableInfo(that.data.tableNo);

        /*
        * 判断用户是否授权 （skipUserInfoOauth+options.scene+options.shareType && options.shareType == "FX"）
        * */
        that.data.mySelfAdd=[];
        that.data.othersAdd=[];
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');  //
            mallSiteId = wx.getStorageSync('mallSiteId'); //
            that.findCategory();   //商品列表左侧分类
            that.findShoperInfo(); // 商家信息
            if (app.globalData.userInfo || wx.getStorageSync('userInfo')) {
                /* 与后台发起通讯连接 保持不间断 */
                that.data.connectSocket = wx.connectSocket({
                    url: cf.config.socketDomain + 'ws_connection/multi_per_order/' + that.data.tableNo + '/' + cusmallToken,
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function (res) {
                        console.log("连接成功")
                    }
                });
                wx.onSocketClose(function () {
                    console.log("连接已断开")
                    if (!that.data.leaveStatus) {
                        wx.showToast({
                            title: "网络开小差，请下拉刷新",
                            icon: 'none',
                            duration: 2000
                        });
                    }

                })
                /* 监控websocket打开事件 */
                wx.onSocketOpen(function () {
                    console.log("打开");
                })
                wx.onSocketMessage(function (res) {
                    console.log("消息推送");
                    let data = JSON.parse(res.data);
                    if (data.ret == 0) {
                        /* 推送购物车信息 */
                        if (data.model && data.model.result.length >= 0) {
                            that.setData({
                                allMultiData: data.model.result //
                            });
                            /* 将购物车数据进行筛选 */
                            that.allDataList();
                        }
                        if (that.data.cartType == 1) {  //自己增加goodsInfo
                            that.addSocket(that.data.goodsId, that.data.specIds);  //回显添加的商品信息
                            that.setData({  //设置动画信息
                                addInfo: that.data.goodsInfo
                            })
                        } else if (that.data.cartType === 0) { //自己减少
                            that.delSocket(that.data.goodsId, that.data.specIds)  //回显减少的信息
                        } else if (that.data.cartType === -1) {  //清空购物车
                            /* 清空购物车 */
                            that.clearCartGoods();
                        }
                    } else if (data.operateType == 1) {           //别人增加
                        that.othersSocket(data.goodsId, data);
                        that.setData({
                            addInfo: data,  //新增气泡
                        })
                    } else if (data.operateType === 0) {            //别人减少
                        that.othersDel(data.goodsId, data)
                    } else if (data.operateType == -1) {           //别人清空购物车
                        /* 清空购物车 */
                        that.clearCartGoods();
                    } else if (data.operateType == 2) {  //选好了
                        that.data.leaveStatus = true;
                        wx.closeSocket({})
                        wx.navigateTo({
                            url: './orderList?tableNo=' + that.data.tableNo
                        })
                    } else if (data.operateType == 4) { //下单
                        that.data.leaveStatus = true;
                        wx.closeSocket({})
                        wx.navigateTo({
                            url: './orderReceive?tableNo=' + that.data.tableNo
                        })
                    } else if (data.ret == -1) {
                        wx.showToast({
                            title: data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    } else if (data.ret == -3001) {
                        wx.showToast({
                            title: data.msg,
                            icon: 'none',
                            duration: 2000
                        });
                    }
                })


                /* 监听websocket错误事件 */
                wx.onSocketError(function (error) {
                    console.log("连接错误")
                })
            }
            util.afterPageLoad(that);  //底部菜单处理
        });

    },
    /* 获取桌号信息 */
    getTableInfo(tableNo){
        let that=this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/table_num/findById',
            data: {
                tableId: tableNo,
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    that.setData({
                        tableName:res.data.model.tableNum.name
                    })
                }else {
                    that.setData({
                        tableName:""
                    })
                }
            }
        })
    },
    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        this.data.leaveStatus = true;
        wx.closeSocket({});
        // wx.closeSocket({})
        // this.data.connectSocket.close({});
        this.data.leaveStatus = true
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var ctx = this;
        let options = ctx.data.options;
        ctx.setData({"isSubmitIng": false});
        if (this.data.leaveStatus) {
            this.data.leaveStatus = false;
            ctx.data.mySelfAdd=[];
            ctx.data.othersAdd=[];
            this.data.hasCalculate = false;
            this.onLoad(options)

        }
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        this.data.leaveStatus = true;
        wx.closeSocket({})
    },


    /* tab切换头 如商品-->商家 */
    handlePanelTabChange(e) {
        var selectedId = e.target.dataset.id;
        this.setData({
            [`panelTab.selectedId`]: selectedId
        });
    },
    /* 搜索按钮点击 */
    handleSearch() {
        let that=this;
        let foodType = this.data.foodType || '';
        wx.navigateTo({
            url: '../searchTakeout/searchTakeout?foodType=' + foodType + '&type=' + this.data.toType+ '&tableNo=' + that.data.tableNo
        })
    },
    /* 左右滑动切换 */
    handlePanelContentChange(e) {
        var current = e.detail.current;
        this.setData({
            [`panelTab.selectedId`]: current
        });
    },
    /* 商家地址跳转 */
    handleShoperLbs: function () {
        var shoperInfo = this.data.shoperInfo;
        wx.openLocation({
            latitude: Number(shoperInfo.latitude),
            longitude: Number(shoperInfo.longitude),
            scale: 28,
            name: shoperInfo.name,
            address: shoperInfo.localtion
        })
    },


    /* 其他人数据添加的位置 */
    othersPosition: function (goodsId, goodsOpenId) {
        let otherGoodsList = this.data.othersAdd;
        let otherIndex = null;
        otherGoodsList.forEach(function (item, index) {
            if (item.id === goodsId && item.openid == goodsOpenId) {
                otherIndex = index
            }
        })
        return otherIndex
    },
    /* 自己数据添加商品的位置 */
    selfPosition: function (goodsId) {
        let selfGoodsList = this.data.mySelfAdd;
        let selfIndex = null;
        selfGoodsList.forEach(function (item, index) {
            if (item.id === goodsId) {
                selfIndex = index
            }
        })
        return selfIndex
    },
    /* 总商品位置 */
    allPosition: function (goodsId) {
        let allGoodsList = this.data.allCategoryList[0].mallGoodsList;
        let posIndex = null;
        allGoodsList.forEach(function (item, index) {
            if (item.id === goodsId) {
                posIndex = index
            }
        })
        return posIndex
    },

    /* 商品增加事件 */
    addFood: function (goodsId, specIds) {
        let that = this;
        if (!this.checkUserInfo()) {
            return false;
        }
        that.setData({
            goodsId: '', specIds: '', cartType: 1 //自己添加标志
        });
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null; //分类位置
        var goodsIndex = goodsPos ? goodsPos[1] : null; //商品位置
        let goods;
        if (goodsIndex != null) {
            goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];  //当前操作商品

        } else {
            var allIndex = that.allPosition(goodsId); //在所有商品位置
            if (allIndex != null) {
                goods = that.data.allCategoryList[0].mallGoodsList[allIndex]
            }
        }
        if (goods) {
            let paramsData = {
                goodsId: goods.id,
                "sku": goods.selectedSku ? goods.selectedSku.sku : '',
                "specName": goods.selectedSku ? goods.selectedSku.names : '',
                "operateType": 1
            }
            /* websocket 发送数据给后台*/
            wx.sendSocketMessage({
                data: JSON.stringify(paramsData),
                success(res) {
                    that.setData({
                        goodsId: goodsId, specIds: specIds ? specIds : '',
                        goodsInfo: {
                            goodsName: goods.name,
                            headPic: app.globalData.userInfo.avatarUrl,
                            nickName: app.globalData.userInfo.nickName,
                        }
                    })
                }
            })
        }

    },
    /* 商品增加事件 */
    addSocket: function (goodsId, specIds) {
        let that = this;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null; //分类位置
        var goodsIndex = goodsPos ? goodsPos[1] : null; //商品位置
        if (goodsIndex != null) {
            // 购物车回显视图
            var mCart = that.data.mySelfAdd || [];
            var sGList = that.data.categoryList[catIndex].mallGoodsList || []; //商品列表
            for (let gItem of mCart) {//把购物车中商品的信息同步到当前商品展示列表中
                for (let j = 0; j < sGList.length; j++) {
                    if (gItem.id == sGList[j].id && gItem.openid == app.globalData.myOpenid) {
                        that.setData({
                            ["categoryList[" + catIndex + "].mallGoodsList[" + j + "]"]: gItem
                        });
                        break;
                    }
                }
            }

            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];  //当前操作商品
            goods.headPic = app.globalData.userInfo.avatarUrl;
            goods.openid = app.globalData.myOpenid;
            if (typeof (goods.selectedNum) === "undefined") {
                goods.selectedNum = 1;
            } else {
                goods.selectedNum++;
            }
            if (goods.usenewspec) {
                if (!specIds) {
                    specIds = that.data.selectedGoods.selectedSku.ids;
                }
                /* 规格数据重绘 */
                if (goods.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goods.id == item.goodsId) {
                            goods.specData = item.data;
                            goods.spec = JSON.stringify(item.data)
                        }
                    })
                }
                for (var j = 0; j < goods.specData.length; j++) {
                    if (goods.specData[j].ids == specIds) {
                        if (typeof (goods.specData[j].selectedNum) === "undefined") {
                            goods.specData[j].selectedNum = 1;
                        } else {
                            goods.specData[j].selectedNum++;
                        }
                    }
                }
            }
            // if (that.data.showGoods) {
            //     that.setData({
            //         "showGoods": goods,
            //     });
            // }
            that.setData({
                "selectedGoods": goods,
                ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
            });
            // 同步所有分类里面的商品信息
            var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
            if (goodsCatIndex != null) {
                that.setData({
                    ["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods,
                });
            }

            // var allIndex = that.allPosition(goodsId); //在所有商品位置
            // if (allIndex != null) {
            //     that.setData({
            //         ["allCategoryList[0].mallGoodsList[" + allIndex + "]"]: goods
            //     });
            // }

            /* 同步到myselfAdd数据 */
            let selfPos = that.selfPosition(goodsId);
            if (selfPos !== null) {
                that.data.mySelfAdd[selfPos] = goods
            } else {
                that.data.mySelfAdd.push(goods)
            }
            that.fillShoppingCart();
        }
    },
    /* 其他人添加购物车回显 */
    othersSocket: function (goodsId, addData) {
        let that = this;
        var allIndex = that.allPosition(goodsId); //在所有商品位置
        var goodsData = this.data.allCategoryList[0].mallGoodsList[allIndex];
        var mCart = that.data.othersAdd || [];
        mCart.forEach(function (item) {
            if (item.id == goodsData.id && item.openid == addData.openid) {
                goodsData = item;
            }
        })
        goodsData.headPic = addData.headPic;
        goodsData.openid = addData.openid;
        if (typeof (goodsData.selectedCount) === "undefined") {
            goodsData.selectedCount = 1;
        } else {
            goodsData.selectedCount++;
        }
        if (addData.sku) {
            /* 规格数据重绘 */
            if (goodsData.spec == '') {
                definedSpecArray.forEach(function (item) {
                    if (goodsData.id == item.goodsId) {
                        goodsData.specData = item.data;
                        goodsData.spec = JSON.stringify(item.data)
                    }
                })
            }
            for (var j = 0; j < goodsData.specData.length; j++) {
                if (goodsData.specData[j].sku == addData.sku) {
                    if (typeof (goodsData.specData[j].selectedCount) === "undefined") {
                        goodsData.specData[j].selectedCount = 1;
                    } else {
                        goodsData.specData[j].selectedCount++;
                    }
                }
            }
        } else if (goodsData.usenewspec) {

        }
        let otherPos = that.othersPosition(goodsData.id, addData.openid);
        if (otherPos !== null) {
            that.data.othersAdd[otherPos] = goodsData
        } else {
            that.data.othersAdd.push(goodsData)
        }
        that.fillShoppingCart();
    },


    /* 同步回显视图选中数目 */
    echoViewGoods: function () {

    },
    /* 商品删除事件 */
    delFood: function (goodsId, specIds) {
        var that = this;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        that.setData({
            goodsId: '', specIds: '', cartType: 0
        })
        if (goodsIndex != null) {
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
            console.log(specIds)
            let selectedSku = null;
            if (specIds && goods.usenewspec) {
                selectedSku = goods.specData.filter(function (item) {
                    return item.ids == specIds
                })
            } else {
                selectedSku = goods.selectedSku ? [] : '';
                if (selectedSku) {
                    selectedSku[0] = goods.selectedSku
                }
            }
            let paramsData = {
                goodsId: goods.id,
                "sku": selectedSku ? selectedSku[0].sku : '',
                "specName": selectedSku ? selectedSku[0].names : '',
                "operateType": 0
            }
            console.log(paramsData)
            /* websocket 发送数据给后台*/
            wx.sendSocketMessage({
                data: JSON.stringify(paramsData),
                success(res) {
                    console.log(res)
                    that.setData({
                        goodsId: goodsId, specIds: specIds ? specIds : ''
                    })
                }
            })

        }
    },
    delSocket: function (goodsId, specIds) {
        var that = this;
        /* 视图端数据处理 */
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        if (goodsIndex != null) {
            //T T 购物车还原
            var mCart = that.data.mySelfAdd || [];
            // var sGList = that.data.categoryList[catIndex].mallGoodsList || []; //商品列表
            var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
            for (let gItem of mCart) {//把购物车中商品的信息同步到当前商品展示列表中
                if (gItem.id == goods.id && gItem.openid == app.globalData.myOpenid) {
                    goods = gItem;
                    that.setData({
                        ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: gItem
                    });
                    break;
                }
            }
            if (typeof (goods.selectedNum) === "undefined") {
                goods.selectedNum = 0;
            } else if (goods.selectedNum > 0) {
                goods.selectedNum--;
            }
            if (goods.usenewspec) {
                if (!specIds) {
                    specIds = that.data.selectedGoods.selectedSku.ids;
                }
                /* 规格数据重绘 */
                if (goods.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goods.id == item.goodsId) {
                            goods.specData = item.data;
                            goods.spec = JSON.stringify(item.data)
                        }
                    })
                }
                for (var j = 0; j < goods.specData.length; j++) {
                    var spec = goods.specData[j];
                    if (spec.ids == specIds) {
                        if (typeof (spec.selectedNum) === "undefined") {
                            spec.selectedNum = 0;
                        } else if (spec.selectedNum > 0) {
                            spec.selectedNum--;
                        }
                    }
                }
            }
            // if (that.data.showGoods) {
            //     that.setData({
            //         "showGoods": goods,
            //     });
            // }
            that.setData({
                "selectedGoods": goods,
                ["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: goods
            });
            // 同步所有分类里面的商品信息
            var goodsCatIndex = that.findGoodsIndexFromList(0, goodsId);
            if (goodsCatIndex != null) {
                that.setData({
                    ["categoryList[0].mallGoodsList[" + goodsCatIndex + "]"]: goods,
                });
            }

            if (that.data.sumInfo.totalMoney <= 0) {
                that.setData({
                    "showShoppingCart": false,
                    "selectedGoods": null
                });
            }
            /* 同步到myselfAdd数据 */
            let selfPos = that.selfPosition(goodsId);
            if (selfPos !== null) {
                that.data.mySelfAdd[selfPos] = goods
            } else {
                that.data.mySelfAdd.push(goods)
            }

        }

        /* 自己数据添加调整 */
        // var mCart = that.data.mySelfAdd || [];
        // mCart.forEach(function (item) {
        //     if (item.id==goodsId){
        //         let goodsData=item;
        //         if (goodsData.usenewspec) {
        //             /* 规格数据重绘 */
        //             if (goodsData.spec == '') {
        //                 definedSpecArray.forEach(function (item) {
        //                     if (goodsData.id == item.goodsId) {
        //                         goodsData.specData = item.data;
        //                         goodsData.spec = JSON.stringify(item.data)
        //                     }
        //                 })
        //             }
        //             for (let y = 0; y < goodsData.specData.length; y++) {
        //                 if (goodsData.specData[y].ids == specIds) {
        //                     if (typeof (goodsData.specData[y].selectedNum) === "undefined") {
        //                         goodsData.specData[y].selectedNum = 0;
        //                     } else {
        //                         goodsData.specData[y].selectedNum--;
        //                     }
        //                 }
        //             }
        //         }else {
        //             if (typeof (goodsData.selectedNum) === "undefined") {
        //                 goodsData.selectedNum = 0;
        //             } else {
        //                 goodsData.selectedNum--;
        //             }
        //         }
        //     }
        // })
        that.fillShoppingCart();
    },
    /* 商品删除事件 */
    othersDel: function (goodsId, Data) {
        let that = this;
        // var mCart = that.data.takeOutShoppingCart || [];
        // let otherPos=that.othersPosition(goodsId);
        // var goodsData=that.data.othersAdd[otherPos];
        //
        // if(otherPos!==null) {
        //     if (typeof (goodsData.selectedCount) === "undefined") {
        //         goodsData.selectedCount = 0;
        //     } else if (goodsData.selectedCount > 0) {
        //         goodsData.selectedNum--;
        //     }
        //     if (goodsData.usenewspec) {
        //         /* 规格数据重绘 */
        //         if (goodsData.spec == '') {
        //             definedSpecArray.forEach(function (item) {
        //                 if (goodsData.id == item.goodsId) {
        //                     goodsData.specData = item.data;
        //                     goodsData.spec = JSON.stringify(item.data)
        //                 }
        //             })
        //         }
        //         for (var j = 0; j < goodsData.specData.length; j++) {
        //             var spec = goodsData.specData[j];
        //             if (spec.sku == Data.sku) {
        //                 if (typeof (spec.selectedCount) === "undefined") {
        //                     spec.selectedCount = 0;
        //                 } else if (spec.selectedCount > 0) {
        //                     spec.selectedCount--;
        //                 }
        //             }
        //         }
        //         that.fillShoppingCart();
        //     }
        // }

        /* 别人数据添加调整 */
        var mCart = that.data.othersAdd || [];
        mCart.forEach(function (item) {
            if (item.id == goodsId && item.openid==Data.openid) {
                let goodsData = item;
                if (typeof (goodsData.selectedCount) === "undefined") {
                    goodsData.selectedCount = 0;
                } else {
                    goodsData.selectedCount--;
                }
                if (goodsData.usenewspec) {
                    /* 规格数据重绘 */
                    if (goodsData.spec == '') {
                        definedSpecArray.forEach(function (item) {
                            if (goodsData.id == item.goodsId) {
                                goodsData.specData = item.data;
                                goodsData.spec = JSON.stringify(item.data)
                            }
                        })
                    }
                    for (var j = 0; j < goodsData.specData.length; j++) {
                        var spec = goodsData.specData[j];
                        if (spec.sku == Data.sku) {
                            if (typeof (goodsData.specData[j].selectedCount) === "undefined") {
                                goodsData.specData[j].selectedCount = 0;
                            } else {
                                goodsData.specData[j].selectedCount--;
                            }
                        }
                    }
                }
            }
        })
        that.fillShoppingCart();
    },

    /* 清空购物车 */
    clearCartGoods: function () {
        let that = this;
        let categoryList = that.data.categoryList;
        for (let j = 0; j < categoryList.length; j++) {
            let cat = categoryList[j];
            let goodsList = cat.mallGoodsList;
            if (goodsList) {
                for (let i = 0; i < goodsList.length; i++) {
                    let goods = goodsList[i];
                    goods.selectedNum = 0;
                }
            }
        }
        that.setData({
            "categoryList": categoryList,
            "selectedGoods": null,
            "showShoppingCart": false,
            "othersAdd": [],
            "mySelfAdd": [],
            sumInfo: {
                "totalMoney": 0,
                "totalCount": 0
            },
            takeOutShoppingCart: [],
        });
    },

    // 把已选商品加入购物车后进行去重，计算总数和总金额
    fillShoppingCart: function () {
        var that = this, takeOutShoppingCart = [], totalMoney = 0, totalCount = 0;
        let selfGoods = [], othersGoods = [];
        // var mallGoodsList = cat.mallGoodsList;
        var mallGoodsList = that.data.mySelfAdd;
        console.log(mallGoodsList)
        /* 当前本人用户选中的商品的重整 */
        if (mallGoodsList.length > 0) {
            for (var i = 0; i < mallGoodsList.length; i++) {
                var goods = mallGoodsList[i];
                if (goods.selectedNum > 0 && goods.openid == app.globalData.myOpenid) {
                    if (goods.usenewspec) {
                        /* 规格数据重绘 */
                        if (goods.spec == '') {
                            definedSpecArray.forEach(function (item) {
                                if (goods.id == item.goodsId) {
                                    goods.specData = item.data;
                                    goods.spec = JSON.stringify(item.data)
                                }
                            })
                        }
                        /*console.log(definedSpecArray)*/
                        for (var m = 0; m < goods.specData.length; m++) {
                            var spec = goods.specData[m];
                            if (spec.selectedNum > 0) {
                                totalMoney += spec.price * spec.selectedNum;
                                totalCount += spec.selectedNum;
                            }
                        }
                    } else {
                        totalMoney += goods.price * goods.selectedNum;
                        totalCount += goods.selectedNum;
                    }
                    // takeOutShoppingCart.push(goods);
                    selfGoods.push(goods);
                }
            }
        }

        /* 其他人选中的商品的重整 */
        if (that.data.othersAdd.length > 0) {
            that.data.othersAdd.forEach(function (item, index) {
                console.log(item)
                if (item.selectedCount > 0) {
                    if (item.usenewspec) {
                        /* 规格数据重绘 */
                        if (item.spec == '') {
                            definedSpecArray.forEach(function (item2) {
                                if (item.id == item2.goodsId) {
                                    item.specData = item2.data;
                                    item.spec = JSON.stringify(item2.data)
                                }
                            })
                        }
                        /*console.log(definedSpecArray)*/
                        for (var z = 0; z < item.specData.length; z++) {
                            var spec = item.specData[z];
                            if (spec.selectedCount > 0) {
                                totalMoney += spec.price * spec.selectedCount;
                                totalCount += spec.selectedCount;
                            }
                        }
                    } else {
                        totalMoney += item.price * item.selectedCount;
                        totalCount += item.selectedCount;
                    }
                    othersGoods.push(item);
                }
            })
        }
        // console.log(takeOutShoppingCart)
        let allShoppingCart = othersGoods.concat(selfGoods);
        if (allShoppingCart.length == 0) {
            that.setData({
                "selectedGoods": null,
                "showShoppingCart": false,
                "othersAdd": [],
                "mySelfAdd": [],
                sumInfo: {
                    "totalMoney": 0,
                    "totalCount": 0
                },
                takeOutShoppingCart: [],
            });
        }
        that.setData({
            addInfo: null,
            takeOutShoppingCart: allShoppingCart,
            sumInfo: {
                "totalMoney": totalMoney,
                "totalCount": totalCount
            }
        })
    },
    /* 计算购物车总额 */
    calculateCart: function (array) {
        let totalMoney = 0, totalCount = 0, that = this;
        let selfGoods = [], othersGoods = [];
        var categoryList = that.data.allCategoryList;
        if (array.length == 0) {
            that.data.mySelfAdd = [];
            that.data.othersAdd = [];
        }
        for (let w = 0; w < array.length; w++) {
            let goodsId = array[w].goodsId;

            var cat = categoryList[0];
            var mallGoodsList = cat.mallGoodsList;
            if (mallGoodsList) {
                for (var z = 0; z < mallGoodsList.length; z++) {
                    // var goodsCart = mallGoodsList[z];
                    if (mallGoodsList[z].id == goodsId) {
                        // delete mallGoodsList[z].headPic;
                        if (array[w].openid == app.globalData.myOpenid) {
                            let goodsCart = mallGoodsList[z];
                            goodsCart.headPic = array[w].headPic;
                            goodsCart.openid = array[w].openid;
                            if (goodsCart.selectedNum) {
                                goodsCart.selectedNum = goodsCart.selectedNum + array[w].count;
                            } else {
                                goodsCart.selectedNum = array[w].count;
                            }
                            if (array[w].sku) {
                                for (var x = 0; x < goodsCart.specData.length; x++) {
                                    let spec = goodsCart.specData[x];
                                    if (spec.sku === array[w].sku) {
                                        spec.selectedNum = array[w].count;
                                        // localGoods.specData[x].selectedNum = array[w].count;
                                        totalMoney += spec.price * spec.selectedNum;
                                        totalCount += spec.selectedNum;
                                    }
                                }
                            } else {
                                totalCount += goodsCart.selectedNum;
                                totalMoney += goodsCart.price * goodsCart.selectedNum;
                            }
                            that.setData({
                                ["allCategoryList[0].mallGoodsList[" + z + "]"]: goodsCart
                            })
                            let selfPos = that.selfPosition(goodsCart.id);
                            if (selfPos !== null) {
                                that.data.mySelfAdd[selfPos] = goodsCart
                            } else {
                                that.data.mySelfAdd.push(goodsCart)
                            }
                            // that.data.mySelfAdd.push(Object.assign({},array[w],localGoods));

                        } else {
                            // let othersCart=Object.assign({},mallGoodsList[z]);
                            let othersCart = JSON.parse(JSON.stringify(mallGoodsList[z]));
                            delete othersCart.selectedNum;
                            othersCart.headPic = array[w].headPic;
                            othersCart.openid = array[w].openid;
                            if (array[w].sku) {
                                for (var x = 0; x < othersCart.specData.length; x++) {
                                    let spec = othersCart.specData[x];
                                    delete spec.selectedNum;
                                    if (spec.sku == array[w].sku) {
                                        spec.selectedCount = array[w].count;
                                        othersCart.selectedCount = array[w].count;
                                        totalMoney += spec.price * spec.selectedCount;
                                        totalCount += spec.selectedCount;

                                        /* 同步othersAdd数据 */
                                        let otherPos = that.othersPosition(othersCart.id, othersCart.openid);
                                        if (otherPos !== null) {
                                            // that.data.othersAdd[otherPos]=othersCart
                                            if (that.data.othersAdd[otherPos].usenewspec) {
                                                that.data.othersAdd[otherPos].specData.forEach(function (item, specIndex) {
                                                    if (item.sku == spec.sku) {

                                                        item.selectedCount = spec.selectedCount;
                                                        if (that.data.othersAdd[otherPos].selectedCount) {
                                                            that.data.othersAdd[otherPos].selectedCount = that.data.othersAdd[otherPos].selectedCount + spec.selectedCount
                                                        } else {
                                                            that.data.othersAdd[otherPos].selectedCount = spec.selectedCount
                                                        }

                                                    }
                                                })
                                            }

                                        } else {
                                            that.data.othersAdd.push(othersCart)
                                        }

                                    }
                                }
                            } else {
                                othersCart.selectedCount = array[w].count;
                                totalMoney += othersCart.price * othersCart.selectedCount;
                                totalCount += othersCart.selectedCount;
                                othersCart.selectedCount = array[w].count;
                                /* 同步othersAdd数据 */
                                let otherPos = that.othersPosition(othersCart.id, othersCart.openid);
                                if (otherPos !== null) {
                                    that.data.othersAdd[otherPos] = othersCart

                                } else {
                                    that.data.othersAdd.push(othersCart)
                                }
                            }
                            othersGoods.push(othersCart);


                            // that.data.othersAdd.push(Object.assign({},array[w],othersCart))

                        }
                        break;
                    }
                }
            }
            if (w == array.length) { //重置商品所有数据
                that.data.hasCalculate = true;
                that.allDataList();
            }
        }
        console.log(that.data.othersAdd)
        let allGoodsCart = that.data.othersAdd.concat(that.data.mySelfAdd);

        that.setData({    //
            takeOutShoppingCart: allGoodsCart,  //购物车数据
            sumInfo: {
                totalMoney, totalCount
            }, //
            toType: ''  //
        });
    },


    /* 判断点击弹出框外的关闭弹出框 */
    handleShoppingCartTap: function (e) {
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            if ("showShoppingCart" == action) {
                if (that.data.sumInfo.totalMoney > 0) {
                    that.setData({"showShoppingCart": true});
                }
            } else if ("hideShoppingCart" == action) {
                that.setData({"selectedGoods": null});
                that.setData({"showShoppingCart": false});
            } else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            } else if ("delFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            } else if ("clearShoppingCart" == action) {
                let paramsData = {
                    operateType: -1
                };
                wx.sendSocketMessage({
                    data: JSON.stringify(paramsData),
                    success(res) {
                        console.log(res)
                        that.setData({
                            cartType: -1
                        })
                    }
                })
            }
        }
    },
    /* 商品进入详情点击 */
    handleGoodsItemTap: function (e) {
        var that = this;
        var target = e.currentTarget;
        var goodsId = target.dataset.id;
        var goodsPos = that.findGoodsPos(goodsId);
        var catIndex = goodsPos ? goodsPos[0] : null;
        var goodsIndex = goodsPos ? goodsPos[1] : null;
        var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
        target = e.target;
        if (goodsId) {
            that.data.leaveStatus = true;
            wx.closeSocket({});
            wx.navigateTo({
                url: './indexDetail?fromIndex=true&goodsId=' + goodsId + '&type=' + that.data.toType + '&tableNo=' + that.data.tableNo,
            })
        }
        if (target) {
            var action = target.dataset.action;

            if (action) {
                return;
            }
        }
        if (!goods.selectedSku) {
            /* 规格数据重绘 */
            if (goods.usenewspec && goods.spec == '') {
                definedSpecArray.forEach(function (item) {
                    if (goods.id == item.goodsId) {
                        goods.specData = item.data;
                        goods.spec = JSON.stringify(item.data)
                    }
                })
            }
            goods.selectedSku = goods.spec ? JSON.parse(goods.spec)[0] : {};
        }
        // that.setData({ "showGoods": goods });

    },

    /* 关闭商品详情 */
    handleCloseGoodsDetail: function (e) {
        this.setData({"showGoods": null});
    },

    /* 规格选择事件 */
    selectedSpec: function (e) {
        this.setData({"selectedGoods": this.data.showGoods});
    },

    /* 商品的各个操作 */
    handleTabItemTap: function (e) {
        /* 用户授权验证 */
        if (!this.checkUserInfo()) {
            return false;
        }
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            /* 规格选择操作 */
            if ("selectSpec" == action) {
                var goodsId = e.target.dataset.id;
                var goodsPos = that.findGoodsPos(goodsId);
                var catIndex = goodsPos ? goodsPos[0] : null;
                var goodsIndex = goodsPos ? goodsPos[1] : null;
                var goods = that.data.categoryList[catIndex].mallGoodsList[goodsIndex];
                if (goods.usenewspec && goods.spec == '') {
                    definedSpecArray.forEach(function (item) {
                        if (goods.id == item.goodsId) {
                            goods.specData = item.data;
                            goods.spec = JSON.stringify(item.data)
                        }
                    })
                }
                if (!goods.selectedSku) {
                    goods.selectedSku = goods.spec ? JSON.parse(goods.spec)[0] : '';
                }
                that.setData({
                    "selectedGoods": goods,
                    usenewspecShow: true
                });

            }
            /* 商品添加操作 */
            else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            }
            /* 商品删除操作 */
            else if ("delFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            }
            /* 展示购物车操作 */
            else if ("showShoppingCart" == action) {
                if (that.data.sumInfo.totalMoney > 0) {
                    that.setData({"showShoppingCart": true});
                }
            }
            /* 选好了操作 */
            else if ("submit" == action) {
                that.setData({"isSubmitIng": true});
                let paramsData = {
                    operateType: 2
                };
                wx.sendSocketMessage({
                    data: JSON.stringify(paramsData),
                    success(res) {
                        console.log(res)
                        that.setData({
                            cartType: 2
                        })
                    }
                })
                that.data.leaveStatus = true;
                wx.closeSocket({})
                wx.navigateTo({
                    url: './orderList?tableNo=' + that.data.tableNo
                })
            }
        }
    },

    /* 类型选择 */
    handleCatTap: function (e) {
        var that = this;
        var catId = e.currentTarget.dataset.id;

        that.findGoods(catId, true);
        that.setData({
            catId: catId,
            selectedCategory: that.findCategoryFromList(catId),
            selectedCatIndex: that.findCatIndexFromList(catId),
            indexSize: that.findCatIndexFromList(catId),
        });

    },


    /* 滚动到底部 */
    scorllBottom: function (e) {
        var that = this;
        var catId = e.currentTarget.dataset.id;
        var toBottom = e.currentTarget.dataset.more;
        if (!toBottom && that.data.categoryList[that.data.selectedCatIndex].mallGoodsList.length != 0) {
            that.findGoods(catId, true);
            that.setData({
                catId: catId,
                selectedCategory: that.findCategoryFromList(catId),
                selectedCatIndex: that.findCatIndexFromList(catId),
                indexSize: that.findCatIndexFromList(catId),
            });

        }
    },
    change(e) {
        var that = this;
        var catId = "";
        for (var i = 0; i < that.data.categoryList.length; i++) {
            if (e.detail.current == i) {
                catId = that.data.categoryList[i].id;
            }
        }
        that.findGoods(catId, true);
        that.setData({
            catId: catId,
            selectedCategory: that.findCategoryFromList(catId),
            indexSize: e.detail.current,
            selectedCatIndex: that.findCatIndexFromList(catId)
        });
    },
    back: function (e) {
        this.setData({"showGoods": null});
    },


// 同步所有分类里面的商品信息
    findGoodsIndexFromList(catIndex, goodsId) {
        var that = this;
        var goodsList = that.data.categoryList[catIndex].mallGoodsList;
        if (goodsList && goodsList.length > 0) {
            for (var i = 0; i < goodsList.length; i++) {
                if (goodsId == goodsList[i].id) {
                    return i;
                }
            }
        }
        return null
    },
    //获取指定类型Id的对应数据
    findCategoryFromList(catId) {
        var categoryList = this.data.categoryList;
        if (categoryList && categoryList.length > 0) {
            for (var i = 0; i < categoryList.length; i++) {
                if (catId == categoryList[i].id) {
                    return categoryList[i];
                }
            }
        }
        return null;
    },
    /* 找出类的位置和商品的位置 */
    findGoodsPos(goodsId) {
        var catList = this.data.categoryList;
        if (catList && catList.length > 0) {
            for (var j = catList.length - 1; j >= 0; j--) { //分类位置
                var goodsList = catList[j].mallGoodsList;
                if (goodsList && goodsList.length > 0) {
                    for (var i = 0; i < goodsList.length; i++) { //商品位置
                        if (goodsId == goodsList[i].id) {
                            return [j, i];
                        }
                    }
                }
            }
        }
        return null;
    },
    /* 获取当前选中的类index 下标识*/
    findCatIndexFromList(catId) {
        var categoryList = this.data.categoryList;
        if (categoryList && categoryList.length > 0) {
            for (var i = 0; i < categoryList.length; i++) {
                if (catId == categoryList[i].id) {
                    return i
                }
            }
        }
        return 0;
    },


    findSkuFromGoods(goods, skuId) {
        if (goods.usenewspec && goods.spec == '') {
            definedSpecArray.forEach(function (item) {
                if (goods.id == item.goodsId) {
                    goods.specData = item.data;
                    goods.spec = JSON.stringify(item.data)
                }
            })
        }
        var specList = goods.spec ? JSON.parse(goods.spec) : {};
        for (var i = 0; i < specList.length; i++) {
            if (specList[i].ids == skuId) {
                return specList[i];
            }
        }
        return null;
    },
    findSelectedSpec: function (specId, groupId, goods) {
        var that = this;
        var selectedIdArray = [];
        for (var i = 0; i < goods.specJsonArray.length; i++) {
            var specGroup = goods.specJsonArray[i];
            if (specGroup.id == groupId) {
                specGroup.selectedId = specId;
            } else {
                if (specGroup.selectedId) {

                } else {
                    specGroup.selectedId = specGroup.specValue[0].id;
                }
            }
            selectedIdArray.push(specGroup.selectedId);
        }
        var selectedIds = selectedIdArray.join(",");
        //goods.specData = JSON.parse(goods.spec);
        if (goods.usenewspec && goods.spec == '') {
            definedSpecArray.forEach(function (item) {
                if (goods.id == item.goodsId) {
                    goods.specData = item.data;
                    goods.spec = JSON.stringify(item.data)
                }
            })
        }
        for (var k = 0; k < goods.specData.length; k++) {
            if (goods.specData[k].ids == selectedIds) {
                return goods.specData[k];
            }
        }
        return null;
    },
    /* 规格模态框里面操作 */
    handleSkuModalTap(e) {
        if (!this.checkUserInfo()) {
            return false;
        }
        var that = this;
        var target = e.target;
        var selectedGoods = that.data.selectedGoods;
        if (target) {
            var action = target.dataset.action;
            if ("closeModal" == action) {
                that.setData({
                    "selectedGoods": null,
                    usenewspecShow: false
                });
            } else if ("changeSku" == action) {
                var specId = target.dataset.id;
                var groupId = target.dataset.groupid;
                var sku = that.findSelectedSpec(specId, groupId, selectedGoods);
                that.setData({["selectedGoods.selectedSku"]: sku});
                that.setData({["selectedGoods.specJsonArray"]: selectedGoods.specJsonArray});
                var goodsPos = that.findGoodsPos(selectedGoods.id);
                var catIndex = goodsPos ? goodsPos[0] : null;
                var goodsIndex = goodsPos ? goodsPos[1] : null;
                that.setData({["categoryList[" + catIndex + "].mallGoodsList[" + goodsIndex + "]"]: selectedGoods});
            } else if ("addToCart" == action) {
                //selectedGoods.selectedNum = 1;
                that.addFood(selectedGoods.id);
                //var goodsIndex = that.findGoodsPos(selectedGoods.id);
                //that.setData({ ["goodsList[" + goodsIndex + "]"]: selectedGoods });
                //that.setData({ "selectedGoods":selectedGoods});
            } else if ("removeFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.delFood(goodsId, specIds);
            } else if ("addFood" == action) {
                var goodsId = e.target.dataset.id;
                var specIds = e.target.dataset.specids;
                that.addFood(goodsId, specIds);
            }
        }
    },


    /* 获取商品分类 ---用于视图显示*/
    findCategory: function (categoryId) {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/siteBar/findSiteBar',
            data: {
                siteId: mallSiteId,
                start: 0,
                limit: 50,
                type: 2,
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var categoryList = [];
                    categoryList.push({"id": "", "name": "全部"});
                    categoryList = categoryList.concat(res.data.model.result);
                    that.setData({
                        categoryList: categoryList
                    });
                    that.setData({
                        selectedCategory: categoryList[0]
                    });
                    that.findGoods(categoryList[0].id, true);//默认显示全部分类

                }
            }
        })
    },
    /* 根据类型获取商品列表 */
    findGoods: function (categoryId, isReload) {
        var that = this;
        var cat = that.findCategoryFromList(categoryId);   //获取指定类数据
        var catIndex = that.findCatIndexFromList(categoryId); // //获取类的index

        let myAddCart = JSON.parse(JSON.stringify(that.data.mySelfAdd));
        if (cat.loading) {
            return false;
        }
        if (cat && cat.hasLoaded && cat.nomoreGoods) {  //根据类数据判断
            return false;
        }
        var submitData = {
            cusmallToken: cusmallToken,
            mallsiteId: mallSiteId,
            goodsType: 2,
            foodType: 3,
            start: 0,
            limit: 10
        };
        if (categoryId) {
            submitData.siteBarId = categoryId;
        }

        if (cat.mallGoodsList && cat.mallGoodsList.length) { //场景底部加载更多 规定起始值
            submitData.start = cat.mallGoodsList.length;
        }

        if (cat) {
            cat.hasLoaded = true;
        }
        wx.showLoading({
            title: "加载中",
        })
        cat.loading = true;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
            data: submitData,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    if (!cat.mallGoodsList) {
                        cat.mallGoodsList = [];
                    }

                    var mallGoodsList = cat.mallGoodsList.concat(res.data.model.result);

                    cat.total = res.data.model.total;

                    for (let i = 0; i < mallGoodsList.length; i++) {
                        var goods = mallGoodsList[i];
                        /* 角标筛选 */
                        if (goods.cornerMarker && !goods.cornerMarker.content) {
                            goods.cornerMarker=JSON.parse(goods.cornerMarker);
                        }else if(!goods.cornerMarker){
                            goods.cornerMarker=""
                        }
                        /* 如果商品还存在库存 */
                        if (goods.usenewspec) {
                            var specArray = goods.spec ? JSON.parse(goods.spec) : [];
                            // goods.specData = specArray
                            /* 数据过长的化 微信解析器会报错 */
                            if (specArray.length > 360) {
                                goods.spec = '';
                                goods.specData = [];
                                /*  规格数据格式化 */
                                var specObject = {};
                                specObject.goodsId = goods.id;
                                specObject.data = specArray;
                                definedSpecArray.push(specObject);
                            } else {
                                goods.specData = specArray
                            }
                        }
                        // 如果在所有分类中已存在该商品，则把商品信息(已添加的数量等)复制过去
                        let allCatGoods = that.data.categoryList[0].mallGoodsList;
                        if (allCatGoods && allCatGoods.length > 0) {
                            for (let j = 0; j < allCatGoods.length; j++) {
                                if (goods.id == allCatGoods[j].id) {
                                    mallGoodsList[i] = allCatGoods[j];
                                    if (allCatGoods[j].usenewspec) {
                                        var specArray2 = allCatGoods[j].spec ? JSON.parse(allCatGoods[j].spec) : [];
                                        // goods.specData = specArray
                                        if (specArray2.length > 260) {
                                            allCatGoods[j].spec = '';
                                            allCatGoods[j].specData = [];
                                        } else {
                                            allCatGoods[j].specData = specArray2
                                        }
                                    }
                                    /*  规格数据格式化 */
                                    definedSpecArray.forEach(function (item) {
                                        if (item.goodsId == allCatGoods[j].id) {
                                            item.data = allCatGoods[j].spec ? JSON.parse(allCatGoods[j].spec) : []
                                        }
                                    })
                                }
                            }
                        }
                        let mCart = that.data.mySelfAdd || [];
                        mCart.forEach(function (mCartItem) {
                            if (mCartItem.id = goods.id && mCartItem.openid == app.globalData.myOpenid) {
                                goods = mCartItem
                            }
                        })
                    }
                    cat.mallGoodsList = mallGoodsList;
                    if (res.data.model.total == 0) {
                        cat.nomoreGoods = false;
                    } else {
                        if (cat.mallGoodsList.length >= res.data.model.total) {
                            cat.nomoreGoods = true;
                        } else {
                            cat.nomoreGoods = false;
                        }
                    }
                    cat.loading = false;
                    that.setData({
                        ["categoryList[" + catIndex + "]"]: cat,
                        selectedCategory: cat
                    });

                    that.data.mySelfAdd = myAddCart //莫名奇妙的bug
                    wx.hideLoading();
                }
            }
        })
    },
    /* 商品滚动到最低部 */
    handleProductScrollToLower: function () {
        let that = this;
        var cat = that.findCategoryFromList(that.data.selectedCategory.id);
        if (cat.mallGoodsList.length < cat.total) {
            that.findGoods(cat.id, false);
        }
    },

    /* 获取所有商品类型信息 */
    allDataList: function () {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/siteBar/findSiteBar',
            data: {
                siteId: mallSiteId,
                start: 0,
                limit: 1000,
                type: 2,
                cusmallToken: cusmallToken
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var categoryList = [];
                    categoryList.push({"id": "", "name": "全部"});
                    categoryList = categoryList.concat(res.data.model.result);
                    that.data.allCategoryList = categoryList;
                    let cat = categoryList[0];
                    that.allGoodsInfo(cat)
                } else {
                    that.setData({
                        allCategoryList: [],
                    });
                }
            }
        })
    },
    /* 获取所有商品信息 供后续购物车中商品查找*/
    allGoodsInfo: function (cat) {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
            data: {
                cusmallToken: cusmallToken,
                mallsiteId: mallSiteId,
                goodsType: 2,
                foodType: 3,
                start: 0,
                limit: 1000
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    if (!cat.mallGoodsList) {
                        cat.mallGoodsList = [];
                    }
                    var mallGoodsList = cat.mallGoodsList.concat(res.data.model.result);
                    cat.mallGoodsList = mallGoodsList;
                    for (let i = 0; i < mallGoodsList.length; i++) {
                        var goods = mallGoodsList[i];
                        /* 如果商品还存在库存 */
                        if (goods.usenewspec) {
                            var specArray = goods.spec ? JSON.parse(goods.spec) : [];
                            goods.specData = specArray
                        }
                    }
                    that.data.allCategoryList[0] = cat;
                    if (!that.data.hasCalculate) {  //是否已经计算过 如果没有再重置数据
                        that.calculateCart(that.data.allMultiData)
                    }
                    wx.hideLoading()
                } else {
                    that.setData({
                        allCategoryList: [],
                    });
                }
            }
        })
    },

    /*商家电话*/
    handleCallShoper: function () {
        wx.makePhoneCall({
            phoneNumber: this.data.shoperInfo.tel
        })
    },
    /* 商店信息 */
    findShoperInfo: function () {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/mobile/takeAway/find',
            data: {
                siteId: mallSiteId
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var shoperInfo = res.data.model.takeAway;
                    // var businessCheck = res.data.model.takeAway.businessCheck;
                    if (shoperInfo && shoperInfo.businessTime) {
                        shoperInfo.businessTime = shoperInfo.businessTime ? JSON.parse(shoperInfo.businessTime) : {};
                    }
                    that.setData({
                        shoperInfo: shoperInfo || {},
                    });
                }
            }
        })
    },
// 如果是到店商品，查找位置信息
    findTableInfo: function (id) {
        var that = this;
        wx.request({
            url: cf.config.pageDomain + '/mobile/takeAway/findTable',
            data: {
                id: id
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    let tableInfo = res.data.model.table;
                    wx.setStorageSync('toStoreTableInfo', tableInfo);
                    that.setData({
                        focusOfficial: tableInfo.focusOfficial
                    })
                }
            }
        })
    },

    /* 关闭模态框 */
    closeOpeningModal: function () {
        this.setData({
            showOpeningModal: false
        })
    },


    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        // this.allDataList();wx.closeSocket({})
        this.data.leaveStatus = true;
        wx.closeSocket({});
        this.onLoad(this.data.options);
        wx.stopPullDownRefresh();
    },

    /**
   * 用户点击右上角
   */
    onShareAppMessage: function () {
      let that = this;
      let shareObj = that.getShareConfig();
      return shareObj;

    },
}));
