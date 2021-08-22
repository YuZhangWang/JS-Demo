var cf = require("../../config.js");
module.exports = {
  findCategoryIndexFromList : function(catId) {
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
  change(e) {
    var that = this;
    var catId = e.currentTarget.dataset.id;
    var idx = e.detail.current;
    var selectedCatData = that.data.selectedCatData;
    if (!selectedCatData) {
      selectedCatData = {};
    }
    var catIndex = that.findCategoryIndexFromList(catId);
    selectedCatData["cat-" + idx] = that.data.categoryList[catIndex];
    that.setData({
      selectedCatData: selectedCatData,
      indexSize: e.detail.current
    });
    that.loadGoodsByCategory(catId);
  },
  handleCatTabTap: function (e) {
    var that = this;
    var catId = e.currentTarget.dataset.id;
    var idx = e.currentTarget.dataset.index;
    var selectedCatData = that.data.selectedCatData;
    if (!selectedCatData){
      selectedCatData = {};
    }
    var catIndex = that.findCategoryIndexFromList(catId);
    selectedCatData["cat-" + idx] = that.data.categoryList[catIndex];
    that.setData({
      selectedCatData: selectedCatData,
      indexSize:catIndex
    });
    that.loadGoodsByCategory(catId);
    //that.findGoods(catId);
  },
  handleCatgoryTabScrollToLower: function (e) {
    let idx = e.currentTarget.dataset.index;
    //console.log(idx);
    let that = this;
    let cat = that.data.categoryList[0];
    if (that.data.selectedCatData && that.data.selectedCatData["cat-"+idx]){
      cat = that.data.selectedCatData["cat-" + idx];
      // 商品数据存储在categoryList中
      cat = that.data.categoryList[that.findCategoryIndexFromList(cat.id)];
    }
    if (cat.hasLoaded && cat.total > cat.goodsListData.length) {
      that.loadGoodsByCategory(cat.id);
    }
  },
  loadGoodsByCategory : function (categoryId) {
    var that = this;
    var catIndex = that.findCategoryIndexFromList(categoryId);
    var cat = that.data.categoryList[catIndex];
    var mallSiteId = wx.getStorageSync('mallSiteId');
    var cusmallToken = wx.getStorageSync('cusmallToken');
    if (cat && cat.hasLoaded && cat.goodsListData.length >= cat.total) {
      return false;
    }
    if (cat.loading){
      return false;
    }
    var submitData = {
      cusmallToken: cusmallToken,
      mallsiteId: mallSiteId,
      start: cat.goodsListData ? cat.goodsListData.length:0,
      limit: 10
    };
    if (categoryId) {
      submitData.siteBarId = categoryId;
    }
    if (cat) {
      cat.hasLoaded = true;
      cat.loading = true;
    }
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/goods/findGoods',
      data: submitData,
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          if (typeof (cat.goodsListData) == "undefined"){
            cat.goodsListData = [];
          }
          cat.goodsListData = cat.goodsListData.concat(res.data.model.result);
          var markList = [];
          cat.goodsListData.forEach(function (itemGoods) {
            if(itemGoods.cornerMarker && !itemGoods.cornerMarker.content){
              itemGoods.cornerMarker=JSON.parse(itemGoods.cornerMarker)
            }else if(!itemGoods.cornerMarker){
              itemGoods.cornerMarker=""
            }
          })
          cat.total = res.data.model.total;
          cat.loading = false;
          that.setData({
            ["categoryList[" + catIndex+"]"]: cat
          });
        }
      }
    })
  },


  loadAllCategory : function(idx) {
    var that = this;
    var cusmallToken = wx.getStorageSync('cusmallToken');
    var mallSiteId = wx.getStorageSync('mallSiteId');
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/siteBar/findSiteBar',
      data: {
        siteId: mallSiteId,
        start: 0,
        limit: 20,
        cusmallToken: cusmallToken
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {
          var categoryList = res.data.model.result;
          that.setData({
            categoryList: categoryList
          });
          if (categoryList.length > 0){
            let cat = that.data.categoryList[0];
            if (that.data.selectedCatData && that.data.selectedCatData["cat-" + idx]) {
              cat = that.data.selectedCatData["cat-" + idx];
              // 商品数据存储在categoryList中
              cat = that.data.categoryList[that.findCategoryIndexFromList(cat.id)];
            }
            that.loadGoodsByCategory(cat.id);
          }

        }
      }
    })
  }
}
