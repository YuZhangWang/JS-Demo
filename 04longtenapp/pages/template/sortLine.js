var cf = require("../../config.js");
var util = require("../../utils/util.js");
var cusmallToken = wx.getStorageSync('cusmallToken');
module.exports = {
  // 综合
  changeSortAll: function (e) {
    var that = this;
    // that.data.goodsOrderObj.isAsc = false;
    console.log(e);
    var widgetIndex = e.currentTarget.dataset.widgetindex;
    var orderType = e.currentTarget.dataset.index;
    var goodsOrder = that.data.goodsOrderObj["w_"+widgetIndex];
    if(!goodsOrder){
      goodsOrder = { "orderType": 1, "isAsc": false };
    }
    goodsOrder.orderType = orderType;
    if(orderType == 3){
      goodsOrder.isAsc = !goodsOrder.isAsc;
    } else {
      goodsOrder.isAsc = false;
    }
    that.setData({
      ["goodsOrderObj.w_" + widgetIndex ]: goodsOrder
    });
    that.handleLoadGoodsByOrder(widgetIndex);
    
  }
  
}
