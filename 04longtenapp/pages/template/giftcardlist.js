module.exports = {
  findGiftCardFormList: function (id) {
    console.log(this.data.giftcardList)
    for (var i = 0; i < this.data.giftcardList.length; i++) {
      if (id == this.data.giftcardList[i].id) {
        return this.data.giftcardList[i];
      }
    }
  },
  handleGiftCardSelect: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    if (id == -1) {
      that.setData({ "selectedGiftCard": null });
      that.multInit();
      return;
    }
    var selectedGiftCard = that.findGiftCardFormList(id);
    that.setData({ "selectedGiftCard": selectedGiftCard });
    that.multInit();
  },
  handleGiftCardModalTap: function (e) {
    var that = this;
    var target = e.target;
    if (target) {
      var action = target.dataset.action;
      if ("closeModal" == action) {
        that.setData({ "showGiftCardList": false });
      }
    }
  },

  handleGiftCardModalOpen: function (e) {
    console.log(e)
    if (this.data.giftcardList && this.data.giftcardList.length > 0) {
      this.setData({ "showGiftCardList": true });
    }
  },

  handleGiftCardModalClose: function (e) {
    this.setData({ "showGiftCardList": false });
  }
}
