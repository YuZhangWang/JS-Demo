
var inputStr = "";
module.exports = {
  handleSearchIng: function (e) {
    wx.navigateTo({
      url: '/pages/search/search?keyword=' + inputStr,
    })
  },
  handleSearchInput: function (e) {
    inputStr = e.detail.value;
  },
  handleSearchTap:function(e){
    let aId = this.data.mAreaId || "";
    if (!this.data.locationInfo){
      this.data.locationInfo = {}
    }
    let aInfo = this.data.areaInfo || this.data.locationInfo.address || "";
    let searchType = e.currentTarget.dataset.searchtype || 0;
    let isReq = e.currentTarget.dataset.isreq;
    if (searchType == 0){
      wx.navigateTo({
        url: '/pages/search/search?keyword=' + inputStr + "&aId=" + aId + "&aInfo=" + aInfo + "&isReq=" + isReq,
      })
    } else {
      wx.navigateTo({
        url: '/pages/mult/multlist?keyword=' + inputStr,
      })
    }
  },
  selectDistrict: function (e) {
    var that = this
    // 如果已经显示，不在执行显示动画
    if (that.data.addressMenuIsShow) {
      return;
    }
    // 执行显示动画
    that.startAddressAnimation(true)
  },
  cityChange: function (e) {
    var that = this;
    var value = e.detail.value
    var provinces = this.data.provinces
    var citys = this.data.citys
    var areas = this.data.areas
    var provinceNum = value[0]
    var cityNum = value[1]
    var countyNum = value[2]
    // 如果省份选择项和之前不一样，表示滑动了省份，此时市默认是省的第一组数据，
    if (this.data.value[0] != provinceNum) {
      var id = provinces[provinceNum].id
      this.setData({
        value: [provinceNum, 0, 0],
        citys: that.data.addressNew.citys[id],
        areas: that.data.addressNew.areas[that.data.addressNew.citys[id][0].id],
      })
    } else if (this.data.value[1] != cityNum) {
      // 滑动选择了第二项数据，即市，此时区显示省市对应的第一组数据
      var id = citys[cityNum].id
      this.setData({
        value: [provinceNum, cityNum, 0],
        areas: that.data.addressNew.areas[citys[cityNum].id],
      })
    } else {
      // 滑动选择了区
      this.setData({
        value: [provinceNum, cityNum, countyNum]
      })
    }
    console.log(this.data)
  },
  hideCitySelected: function (e) {
    this.startAddressAnimation(false)
  },
  startAddressAnimation: function (isShow) {
    console.log(isShow)
    var that = this
    if (isShow) {
      // vh是用来表示尺寸的单位，高度全屏是100vh
      that.animation.translateY(0 + 'vh').step()
    } else {
      that.animation.translateY(40 + 'vh').step()
    }
    that.setData({
      animationAddressMenu: that.animation.export(),
      addressMenuIsShow: isShow,
    })
  },
  // 点击地区选择取消按钮
  cityCancel: function (e) {
    this.startAddressAnimation(false)
  },
  citySureNew: function(e){
    var that = this
    var city = that.data.city
    var value = that.data.value
    that.startAddressAnimation(false)
    // 将选择的城市信息显示到输入框
    console.log(value)
    var areaInfo = "";
    let mAreaId = "";
    let cityName = "";
    if ("000000" !== that.data.provinces[value[0]].id) {
      areaInfo += that.data.provinces[value[0]].name + " ";
      mAreaId += that.data.provinces[value[0]].id.substring(0, 2);
      cityName = that.data.provinces[value[0]].name;
    } else {
      mAreaId += "00"
    }

    if ("000000" !== that.data.citys[value[1]].id) {
      areaInfo += that.data.citys[value[1]].name + " ";
      mAreaId += that.data.citys[value[1]].id.substring(2, 4);
      cityName = that.data.citys[value[1]].name;
    } else {
      mAreaId += "00"
    }
    if ("000000" !== that.data.areas[value[2]].id) {
      areaInfo += that.data.areas[value[2]].name + " ";
      mAreaId += that.data.areas[value[2]].id.substring(4, 6);
    } else {
      mAreaId += "00"
    }
    let locationInfo = that.data.locationInfo || {};
    locationInfo.city = cityName;
    that.setData({
      areaInfo: areaInfo,
      locationInfo: locationInfo

    });
    mAreaId = "000000" == mAreaId ? "" : mAreaId;
    that.setData({
      mAreaId: mAreaId
    });
  }
}