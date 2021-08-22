var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
module.exports = {
  findCategoryIndexFromList: function (catId) {
    var categoryList = this.data.categoryList;
    if (categoryList && categoryList.length > 0) {
      for (var i = 0; i < categoryList.length; i++) {
        if (catId == categoryList[i].id) {
          return i;
        }
      }
    }
    return -1;
  },
  handleNavPanelTabTap: function (e) {
    var that = this;
    var navIndex = e.currentTarget.dataset.idx;
    var widgetIndex = e.currentTarget.dataset.widgetindex;
    var pageId = e.currentTarget.dataset.pageid;
    var navTabPanelData = that.data.navTabPanelData;
    if (!navTabPanelData) {
      navTabPanelData = {};
      that.setData({
        navTabPanelData: navTabPanelData
      });
    }
    if (!navTabPanelData["nav-" + widgetIndex]) {
      navTabPanelData["nav-" + widgetIndex] = { selectedIndex: 0, panelPageData:[]};
      that.setData({
        navTabPanelData: navTabPanelData
      });
    }
    navTabPanelData["nav-" + widgetIndex].selectedIndex = navIndex;
    that.setData({
      navTabPanelData: navTabPanelData
    });
    that.loadNavPanelPageContent(widgetIndex, navIndex, pageId);
    //that.findGoods(catId);
  },
  loadNavPanelPageContent: function (widgetIndex,navIndex,pageId) {
    var that = this;

    var navTabPanelData = that.data.navTabPanelData;
    if (!navTabPanelData) {
      navTabPanelData = {};
      that.setData({
        navTabPanelData: navTabPanelData
      });
    }
    if (!navTabPanelData["nav-" + widgetIndex]){
      navTabPanelData["nav-" + widgetIndex] = { selectedIndex: 0, panelPageData:[]};
      that.setData({
        navTabPanelData: navTabPanelData
      });
    }
    var navTabData = that.data.navTabPanelData["nav-" + widgetIndex];
    if (!navTabData.panelPageData[navIndex]){
      navTabData.panelPageData[navIndex] = {};
    }
    var mallSiteId = wx.getStorageSync('mallSiteId');
    var cusmallToken = wx.getStorageSync('cusmallToken');
    if (navTabData.panelPageData[navIndex].hasLoaded) {
      return false;
    }
    if (!pageId) {
      return false;
    }
    var submitData = {
      cusmallToken: cusmallToken,
      pageId: pageId,
    };
    navTabData.panelPageData[navIndex].hasLoaded = true;
    wx.showLoading({
      title: '加载中...',
    })
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/cusmall_page/findById',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var decorationData = {};
          decorationData = JSON.parse(res.data.model.detail.decoration);
          var decorationLocation = "navTabPanelData.nav-" + widgetIndex + ".panelPageData[" + navIndex+"]";
          util.processDecorationData(decorationData, that, decorationLocation);
          navTabData.panelPageData[navIndex] = decorationData;
          navTabData.panelPageData[navIndex].hasLoaded = true;
          // that.setData({
          //   ["navTabPanelData[\"nav-" + widgetIndex +"\"]"]: navTabData
          // });
          navTabPanelData["nav-" + widgetIndex] = navTabData;
          that.setData({
            navTabPanelData: navTabPanelData
          });

          if (that.data.haveMutl || that.data.haveSearch) {//获取当前地址
            that.fetchLocationAddr();
            let callback = function (data) {
              let locationInfo = data.model;
              that.setData({
                multInfoAddr: data.model.address,
                locationInfo: locationInfo
              });
            }
            util.autoGeyAddr(callback, cusmallToken);
          }
        }
        wx.hideLoading();
      }
    })
  },

}