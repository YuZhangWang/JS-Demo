// pages/multiRepast//orderList.js

/* 小程序应用配置 多环境地址 */
var cf = require("../../config.js");
/* 小程序工具块 */
var util = require("../../utils/util.js");

/* 小程序本地存储数据 */
var mallSiteId = wx.getStorageSync('mallSiteId');
var mallSite = wx.getStorageSync('mallSite');
var cusmallToken = wx.getStorageSync('cusmallToken');
//获取应用实例
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        app: app,
        userImagePath: cf.config.userImagePath,
        extConfig: wx.getExtConfigSync ? wx.getExtConfigSync() : {},
        staticResPath: cf.config.staticResPath,
        cartData: [],
        totalCount: '',
        dinerNum: 1,
        totalMoney: 0,
        remark:'',

        allMultiData: '',//一开始所有数据
        initObj: {
            count: 0,
            goodsId: '',
            goodsName: "",
            headPic: "",
            nickName: "",
            openid: "",
            operateType: 1,
            picture: "",
            price: 0,
            sku: "",
            specName: "",
            totalPrice: 0,
            leaveStatus: false,
            remark: ''
        }

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log(options)
        wx.hideShareMenu();
        let that = this;
        that.setData({
            tableNo: options.tableNo
        })
        that.data.options = options;
        app.getUserInfo(this, options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');  //
            mallSiteId = wx.getStorageSync('mallSiteId'); //
            util.afterPageLoad(that);  //底部菜单处理
            that.getCartData();
            wx.connectSocket({
                url: cf.config.socketDomain + 'ws_connection/multi_per_order/' + options.tableNo + '/' + cusmallToken,
                header: {
                    'content-type': 'application/json'
                },
                success: function (res) {
                    console.log("成功")
                    console.log(res)
                }
            });
            /* 监听会话关闭事件 */
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
                console.log(res)
                console.log("消息推送")
                if (res) {
                    let data = JSON.parse(res.data);
                    if (data.ret == 0) {
                        if (data.model && data.model.result.length >= 0) {
                            that.setData({
                                allMultiData: data.model.result //
                            })
                            that.classifyData(data.model.result)
                        }
                        if (that.data.cartType == 1) {  //自己增加goodsInfo
                            that.selfSocket(that.data.goodsId, that.data.goodsSku, 'add');
                            that.setData({
                                addInfo: that.data.goodsInfo
                            })

                        } else if (that.data.cartType === 0) { //自己减少
                            // that.setData({
                            //   addInfo: that.data.goodsInfo
                            // })
                            that.selfSocket(that.data.goodsId, that.data.goodsSku, '');
                        }
                    } else if (data.operateType == 1) {           //别人增加
                        that.friendSocket(data.goodsId, data);
                        that.setData({
                            addInfo: data,  //新增气泡
                        })
                    } else if (data.operateType === 0) {            //别人减少
                        that.friendSocket(data.goodsId, data)
                    } else if (data.operateType == -1) {           //别人清空购物车
                        /* 清空购物车 */
                        that.setData({
                            cartData: [],
                            totalMoney: 0
                        })
                    } else if (data.operateType == 4) {
                        wx.redirectTo({
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
                }
            })

            /* 监听websocket错误事件 */
            wx.onSocketError(function (error) {
                console.log("错误信息")
                console.log(error)
            })
        })
        wx.hideLoading();
    },
    /* 本人数据操作 增加/减少 */
    selfAddGoods: function (e) {
        let that = this;
        var Type = e.target.dataset.type;
        var editData = e.target.dataset.editdata;
        that.setData({
            goodsId: '', goodsSku: '', cartType: Type == 'add' ? 1 : 0
        });
        let paramsData = {
            goodsId: editData.goodsId,
            "sku": editData.sku ? editData.sku : '',
            "specName": editData.specName ? editData.specName : '',
            "operateType": Type == 'add' ? 1 : 0
        }
        /* websocket 发送数据给后台*/
        wx.sendSocketMessage({
            data: JSON.stringify(paramsData),
            success(res) {
                that.setData({
                    goodsId: editData.goodsId,
                    goodsSku: editData.sku,
                    goodsInfo: {
                        goodsName: editData.goodsName,
                        headPic: app.globalData.userInfo.avatarUrl,
                        nickName: app.globalData.userInfo.nickName,
                    },
                    cartType: Type == 'add' ? 1 : 0
                })
            }
        })
    },
    selfSocket: function (goodsId, goodsSku, type) {
        let that = this;
        that.data.cartData.forEach(function (item, index) {
            if (item.openid == app.globalData.myOpenid) {
                for (let j = 0; j < item.goodsObj.length; j++) {
                    if (goodsSku == item.goodsObj[j].sku && item.goodsObj[j].goodsId == goodsId) {
                        if (type == 'add') {
                            item.goodsObj[j].count++;
                            item.totalCount++;
                        } else {
                            item.goodsObj[j].count--;
                            item.totalCount--;
                        }
                        if (item.goodsObj[j].count > 0) {
                            that.data.cartData[index] = item;
                            that.setData({
                                addInfo: null,
                                cartData: that.data.cartData
                            });
                            that.allMoney(that.data.cartData)
                        } else {
                            that.data.cartData[index].goodsObj.splice(j, 1);
                            if (that.data.cartData[index].totalCount == 0) {
                                that.data.cartData.splice(index, 1)
                            }
                            that.setData({
                                addInfo: null,
                                cartData: that.data.cartData
                            });
                            that.allMoney(that.data.cartData)
                        }

                    }
                }
            }
        })
        // that.setData({
        //   addInfo: null
        // })
    },
    /* 好友数据操作 增加/减少 */
    friendSocket: function (goodsId, data) {
        let that = this;
        let type = data.operateType;
        that.data.cartData.forEach(function (item, index) {
            if (item.openid == data.openid) {
                for (let j = 0; j < item.goodsObj.length; j++) {
                    if (data.sku === item.goodsObj[j].sku && item.goodsObj[j].goodsId == goodsId) {
                        if (type == 1) {
                            item.goodsObj[j].count++;
                            item.totalCount++;
                        } else {
                            item.goodsObj[j].count--;
                            item.totalCount--;
                        }
                        if (item.goodsObj[j].count > 0) {
                            that.data.cartData[index] = item;
                            that.setData({
                                addInfo: null,
                                cartData: that.data.cartData
                            });
                            that.allMoney(that.data.cartData)
                        } else {
                            that.data.cartData[index].goodsObj.splice(j, 1);
                            if (that.data.cartData[index].totalCount == 0) {
                                that.data.cartData.splice(index, 1)
                            }
                            that.setData({
                                addInfo: null,
                                cartData: that.data.cartData
                            });
                            that.allMoney(that.data.cartData)
                        }
                    }
                }
                if (type == 1) {
                    let newGoods = item.goodsObj.every(function (item2) { // 新商品增加
                        return (data.sku != item2.sku && item2.goodsId != goodsId) || (item2.goodsId == goodsId && data.sku != item2.sku)
                    });
                    if (newGoods) {
                        item.goodsObj.push(data);
                        item.totalCount+=data.count;
                        that.data.cartData[index] = item;
                        that.setData({
                            addInfo: null,
                            cartData: that.data.cartData
                        });
                        that.allMoney(that.data.cartData)
                    }
                }

            }
        });
        if (type == 1) {
            let newPeople = that.data.cartData.every(function (item2) {
                return item2.openid != data.openid
            });
            if (newPeople) { // 新人增加
                let goodsInfo = {
                    count: data.count,
                    goodsId: data.goodsId,
                    goodsName: data.goodsName,
                    picture: data.picture,
                    price: data.price,
                    sku: data.sku,
                    specName: data.specName,
                    tableNo: data.tableNo,
                    totalPrice: data.totalPrice,
                }
                data.goodsObj = [];
                data.totalCount = data.count;
                data.goodsObj.push(goodsInfo);
                // item.goodsObj.push(item)
                that.data.cartData.push(data);

                that.setData({
                    addInfo: null,
                    cartData: that.data.cartData
                });
                that.allMoney(that.data.cartData)
            }
        }

    },
    /* 数据分类函数 */
    classifyData: function (allData) {
        let classifyArray = [];
        allData.forEach(function (item) {
            let hasUser = false;
            if (classifyArray.length > 0) {
                for (var i = 0; i < classifyArray.length; i++) {
                    var cla = classifyArray[i];
                    if (item.openid == cla.openid) {
                        cla.totalCount += item.count;
                        hasUser = true;
                        cla.goodsObj.push(item);
                        break;
                    }
                }
                if (!hasUser) {
                    let goodsInfo = {
                        count: item.count,
                        goodsId: item.goodsId,
                        goodsName: item.goodsName,
                        picture: item.picture,
                        price: item.price,
                        sku: item.sku,
                        specName: item.specName,
                        tableNo: item.tableNo,
                        totalPrice: item.totalPrice,
                    }
                    item.goodsObj = [];
                    item.totalCount = item.count;
                    item.goodsObj.push(goodsInfo);
                    // item.goodsObj.push(item)
                    classifyArray.push(item)
                }
            } else {
                let goodsInfo = {
                    count: item.count,
                    goodsId: item.goodsId,
                    goodsName: item.goodsName,
                    picture: item.picture,
                    price: item.price,
                    sku: item.sku,
                    specName: item.specName,
                    tableNo: item.tableNo,
                    totalPrice: item.totalPrice,
                }
                item.goodsObj = [];
                item.totalCount = item.count;
                item.goodsObj.push(goodsInfo)
                classifyArray.push(item)
            }

        });
        console.log(classifyArray)
        this.setData({
            cartData: classifyArray
        })
        this.allMoney(classifyArray)
    },
    /* 获取购物车信息*/
    getCartData: function () {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/multi_person_order/findShopCartList',
            data: {
                cusmallToken: cusmallToken,
                tableNo: that.data.tableNo,
            },
            header: {
                "content": "application/json"
            },
            success: function (res) {
                wx.hideLoading();
                if (res.data.ret == 0) {
                    let extraFee = '';
                    if (res.data.model.extraFeeRules) {
                        wx.setStorageSync('mallExtraFee', res.data.model.extraFeeRules);
                    } else {
                        extraFee = wx.getStorageSync('mallExtraFee')
                    }
                    that.setData({
                        additionInfo: res.data.model.extraFeeRules ? JSON.parse(res.data.model.extraFeeRules) : extraFee,
                        dinerNum:res.data.model.personCount || 1,
                    })
                    // that.setData({
                    //   cartData:res.data.model.shopCarts
                    // });
                }
            },
            error: function () {

            },
        })
    },

    /* 我要加菜 */
    addCartData: function () {
        this.data.leaveStatus=true;
        wx.closeSocket({});
        wx.navigateBack({
            delta: -1
        });
    },
    /* 备注 */
    handleRemark: function (e) {
        let remark = e.detail.value;
        this.setData({
            remark: remark || ""
        })
    },
    /* 我要下单 */
    payCartData: function () {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/multi_person_order/addOrder',
            data: {
                cusmallToken: cusmallToken,
                tableNo: that.data.tableNo,
                remark: that.data.remark || '',
                personCnt: that.data.dinerNum
            },
            header: {
                "content": "application/json"
            },
            success: function (res) {
                console.log(res.data);
                wx.hideLoading();
                if (res.data.ret == 0) {
                    that.data.leaveStatus = true;
                    let paramsData = {
                        operateType: 4
                    };
                    wx.sendSocketMessage({
                        data: JSON.stringify(paramsData),
                        success(res) {}
                    });
                    that.data.leaveStatus=true;
                    wx.closeSocket({});

                    wx.redirectTo({
                        url: './orderReceive?tableNo=' + that.data.tableNo
                    })
                } else {
                    wx.showToast({
                        title: res.data.msg,
                        icon: 'none',
                        duration: 2000
                    });
                }
            },
            error: function (res) {
                wx.showToast({
                    title: res.data.msg,
                    icon: 'none',
                    duration: 2000
                });
            },
        })
    },

    /* 总金额的计算 */
    allMoney: function (allData) {
        let totalCount = 0, totalMoney = 0;
        allData.forEach(function (item) {
            for (let i = 0; i < item.goodsObj.length; i++) {
                totalCount += item.goodsObj[i].count;
                totalMoney += item.goodsObj[i].count * item.goodsObj[i].price;
            }
        });
        this.setData({
            totalCount, totalMoney
        })
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.data.leaveStatus=false
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        this.data.leaveStatus=true;
        wx.closeSocket({})
        this.data.leaveStatus = true;
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        this.data.leaveStatus = true;
        wx.closeSocket({})
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.onLoad(this.data.options);
        wx.stopPullDownRefresh();
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },
    handlePeople: function (e) {
        var type = e.target.dataset.type;
        let that = this;
        if (type == 1) { //减少
            let number = that.data.dinerNum - 1;
            if (number >= 1) {
                this.setData({
                    dinerNum: number
                })
            } else {
                this.setData({
                    dinerNum: 1
                })
            }

        } else {  //增加
            let number = that.data.dinerNum + 1;
            this.setData({
                dinerNum: number
            })
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})
