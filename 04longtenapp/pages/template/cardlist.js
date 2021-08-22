module.exports = {
    findCardFormList: function (id) {
        console.log(this.data.cardList)
        for (var i = 0; i < this.data.cardList.length; i++) {
            if (id == this.data.cardList[i].id) {
                return this.data.cardList[i];
            }
        }
    },
    handleCardSelect: function (e) {
        var that = this;
        var id = e.currentTarget.dataset.id;
        if (id == -1) {
            that.setData({"selectedCard": null});
            that.multInit();
            return;
        }
        var selectedCard = that.findCardFormList(id);
        var selDiscount = JSON.parse(selectedCard.rights).discount || 0;
        that.setData({"selectedCard": selectedCard});
        that.setData({"selDiscount": selDiscount});
        that.multInit();
    },
    handleCardModalTap: function (e) {
        var that = this;
        var target = e.target;
        if (target) {
            var action = target.dataset.action;
            if ("closeModal" == action) {
                that.setData({"showCardList": false});
            }
        }
    },

    handleCardModalOpen: function (e) {
        console.log(e)
        if (this.data.cardList && this.data.cardList.length > 0) {
            this.setData({"showCardList": true});
        }
    },

    handleCardModalClose: function (e) {
        this.setData({"showCardList": false});
    }
}
