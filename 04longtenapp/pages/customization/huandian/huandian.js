// pages/customization/huandian//huandian.js
var cf = require("../../../config.js");
var util = require("../../../utils/util.js");
//获取应用实例
var app = getApp();
console.log(app.globalData.myOpenid);
var mallSiteId = wx.getStorageSync('mallSiteId');
var cusmallToken = wx.getStorageSync('cusmallToken');
var baseHandle = require("../../template/baseHandle.js");
// pages/fenxiao/become.js
Page(Object.assign({}, baseHandle, {

    /**
     * 页面的初始数据
     */
    data: {
        pageType: "换点",
        staticResPath: cf.config.staticResPath,
        userImagePath: cf.config.userImagePath,
        skipUserInfoOauth: true,
        authType:1, //拒绝授权 停留当前页
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.hideLoading();
        app.getUserInfo(this,options, function (userInfo, res) {
            cusmallToken = wx.getStorageSync('cusmallToken');
            mallSiteId = wx.getStorageSync('mallSiteId');
            var mallSite = wx.getStorageSync('mallSite');
            // util.afterPageLoad(that);
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

    },

    /* 打开其他小程序 */
    skipApplet() {
        if (!this.checkUserInfo()) {
            return false;
        }
        wx.navigateToMiniProgram({
            appId: "wx23aa18ebbab47d2f",
            path:"pages/bindPage/index", //跳转小程序路径
            extraData: {
                AppID: wx.getAccountInfoSync().miniProgram.appId,
                OpenID: app.globalData.myOpenid
            },
            success(res) {
                // 打开成功
            },
            fail(res){
                wx.showModal({
                    title: "提示",
                    content: "没有该小程序",
                    showCancel: false
                });
            }
        });
    },

    getMemberInfo() {
        let that = this;
        wx.request({
            url: cf.config.pageDomain + '/applet/mobile/member/getMemberInfo',
            data: {
                cusmallToken: app.globalData.cusmallToken,
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                that.skipApplet();
            }
        })
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
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
}));
