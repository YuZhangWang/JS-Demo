// 点击立即购买
function onYYGoodsNow() {
  if (!this.checkUserInfo()) {
    return false;
  }
  var that = this;
  that.setData({ categoryContClass: "step2 onByNow" });
}

function gotoForm() {
	wx.navigateTo({
		url: '/pages/form/form?id=' + this.data.goodsData.formId
	});
}

function onCloseCategory(){
  this.setData({ categoryContClass: "" });
}
// 商品购买弹出框中规格选择事件
function handleSkuTap(e) {
  console.log(1)
  var that = this;
  var specId = e.currentTarget.dataset.id;
  var groupId = e.currentTarget.dataset.groupid;
  var sku = findSelectedSpec(that, specId, groupId);
  that.setData({
    specList: that.data.specList,
    ["goodsData.selectedSku"]: sku
  });
}

function findSelectedSpec(that, specId, groupId) {
  var selectedIdArray = [];
  for (var i = 0; i < that.data.specList.length; i++) {
    var specGroup = that.data.specList[i];
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
  for (var k = 0; k < that.data.specData.length; k++) {
    if (that.data.specData[k].ids == selectedIds) {
      return that.data.specData[k];
    }
  }
  return null;
}

module.exports = { onYYGoodsNow, gotoForm, onCloseCategory, handleSkuTap}
