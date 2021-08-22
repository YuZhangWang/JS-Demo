var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
var mallSite = wx.getStorageSync("mallSite");
module.exports = {
    findCouponFormList: function (couponId) {
        for (var i = 0; i < this.data.couponList.length; i++) {
            if (couponId == this.data.couponList[i].id) {
                return this.data.couponList[i];
            }
        }
    },
    findPreferenceFormList: function (couponId) {
        for (var i = 0; i < this.data.preferenceCodeList.length; i++) {
            if (couponId == this.data.preferenceCodeList[i].id) {
                return this.data.preferenceCodeList[i];
            }
        }
    },
    //计算优惠码
    calculate(item) {
        var money = item.money;
        if (1 == item.type) {
            this.setData({
                preference: Number(money / 100).toFixed(2)
            })
        }
    },

    loadmore() {//优惠券或优惠码上拉刷新
        if (!this.data.couponFlag) {
            return
        }
        if (this.data.total < this.data.limit) {
            return
        }
        var that = this;
        this.setData({
            limit: that.data.limit + 10
        })
        wx.showLoading({
            title: '加载中',
        });
        let cusmallToken = wx.getStorageSync('cusmallToken');
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/order/useDiscountCode',
            data: {
                cusmallToken: cusmallToken,
                discountCode: that.data.preferenceCode || "",
                shopUid: mallSite.uid || "",
                start: 0,
                limit: that.data.limit
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if (res.data.ret == 0) {
                    var data = res.data;
                    that.setData({
                        preferenceCodeList: data.model.result
                    })
                    wx.hideLoading();

                } else {
                    wx.hideLoading();
                    wx.showModal({
                        title: '获取优惠码异常',
                        showCancel: false,
                        content: res.data.msg
                    })
                }
            }
        })
    },

    handleCouponSelect: function (e) {
        var that = this;
        var couponId = e.currentTarget.dataset.id;
        var preferenceCodeId = e.currentTarget.dataset.preferencecodeid;
        // console.log(preferenceCodeId+"啊啊啊")
        var code = e.currentTarget.dataset.code;
        if (couponId == -1) {
            that.setData({
                preferenceCodeId: "",
                selectedPreference: ""
            })
            that.setData({"selectedCoupon": null});
            if (that.multInit) {
                that.multInit();
            } else if (that.refreshPrice) {
                that.refreshPrice()
            }

            return;
        }

        var selectedCoupon = that.findCouponFormList(couponId) || {};

        if (code == 'code') {

            selectedCoupon.preferenceCodeId = preferenceCodeId;
            var selectedPreference = this.findPreferenceFormList(preferenceCodeId)
            that.setData({
                limittype: selectedPreference.limittype
            })
            // if(selectedPreference.limittype!=="3"){
            //   wx.showToast({
            //     title: '该优惠码类型不适用于此商品',
            //     icon: "none",
            //     duration: 2000
            //   })
            //   return
            // }
            console.log(selectedPreference)
            this.calculate(selectedPreference);
            that.setData({
                preferenceCodeId: preferenceCodeId,
                selectedPreference: selectedPreference
            })
        }
        that.setData({"selectedCoupon": selectedCoupon});
        if (that.multInit) {
            that.multInit();
        } else if (that.refreshPrice) {
            that.refreshPrice()
        }
    },
    handleCouponModalTap: function (e) {
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            if ("closeModal" == action) {
                that.setData({"showCouponList": false});
            }
        }
    },

    handleCouponModalOpen: function (e) {

        this.setData({"showCouponList": true});

    },

    handleCouponModalClose: function (e) {
        this.setData({"showCouponList": false});
    }
}
