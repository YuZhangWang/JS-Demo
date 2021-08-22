module.exports = {
  handleDineWaySelect: function (e) {
    var that = this;
    var dineWayId = e.currentTarget.dataset.id;
    
    that.setData({ "selectedDineWay": dineWayId });
    if ((parseInt(that.data.shoperInfo.information) & (Math.pow(2, 1))) !=0 && (that.data.selectedDineWay == 2)){

      that.setData({
        switchTel: true
      });
    }else if(that.data.selectedDineWay == 1 && that.data.ddtsTel){
      that.setData({
        switchTel: true
      });
    }else{
      that.setData({
        switchTel: false
      });
    }
    //处理点击到店自取时候  sntel为到店堂吃手机号
    that.setData({
      sntel:""
    })
    that.multInit();
    that.getPreviousOrder();  //暂时修改回显手机号逻辑
  },
  handleDineWayModalTap: function (e) {
    var that = this;
    var target = e.target;
    if (target) {
      var action = target.dataset.action;
      if ("closeModal" == action) {
        that.setData({ "showDineWayList": false });
      }
    }
  },

  handleDineWayModalOpen: function (e) {
    this.setData({ "showDineWayList": true });
  },

  handleDineWayModalClose: function (e) {
    this.setData({ "showDineWayList": false });
  }
}