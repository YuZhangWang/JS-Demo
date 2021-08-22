var cf = require("../config.js");
/* 时间格式化 */
function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
function formatTimeM(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()


  return month + "月" + day + "日"+ ' ' + [hour, minute].map(formatNumber).join(':')
}
function formatDate(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  return [year, month, day].map(formatNumber).join('-');
}
function formatDateC(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  return year+"年"+month+"月"+day+"日";
}
/**
 * 页面参数特殊处理
 * @param options 页面参数对象
 */
function handleOptions(options){
  //
  if (!options){
    return;
  }
  if (options.secret && options.point_code && options.business_type
    && options.business_type == 'change_point') {
    // 强制载入页面参数 防止既有用户进入拿不到该页面参数
    let app = getApp();
    let referrerObj;
    if (app.referrerInfo) {
      referrerObj = JSON.parse(app.referrerInfo);
      if (referrerObj && referrerObj.query) {
        Object.assign(referrerObj.query, options);
      } else{
        referrerObj.query = options;
      }
    } else {
      referrerObj = {query:{}};
      Object.assign(referrerObj.query, options);
    }
    app.referrerInfo = JSON.stringify(referrerObj);
    console.log(app.referrerInfo);

    // 显示模态框
    setTimeout(function(){
      wx.showModal({
        title: '温馨提示',
        content: '绑定成功。\n打开【换点APP】，体验积分互换、积分换彩或其他更多服务~',
        showCancel: false,//是否显示取消按钮
        confirmText: '关闭',
        confirmColor: '#000000',
      });
    },2000);
  }

}
/*
 *
  * */
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
/*
*
* */
function numAddPreZero(num){
  if (isNaN(num)){
    return 0;
  }else{
    num = parseInt(num);
    return num >= 10 ? num : "0" + num;
  }


}
//时间转换
function formatDownTime (time){
  let seconds = 0; //秒
  let minutes = 0;  //分
  let hour = 0;  // 小时
  let day = 0;   //天
  if(time){
    seconds = time;
    if(seconds > 59){
      minutes = Math.floor(seconds / 60);
      seconds = seconds % 60;
      if (minutes > 59){
        hour = Math.floor(minutes / 60);
        minutes = minutes % 60;
        if (hour > 23) {
          day = Math.floor(hour / 24);
          hour = hour % 60
        }
      }
    }
  }
  let ds = numAddPreZero(day);
  let ms = numAddPreZero(minutes);
  let hs = numAddPreZero(hour);
  let ss = numAddPreZero(seconds);

  return ds > 0 ? '' + ds + '天 : ' + hs + ':' + ms + ':' + ss : ''+hs + ':' + ms + ':' + ss;
}
//倒计时
let T = '';
function countDown (that){
  let seconds = that.data.remaintime;
  if(seconds === 0){
    that.setData({
      remaintime:0,
      clock: formatDownTime(0)
    })
  }
  T = setTimeout (function (){
    that.setData({
      remaintime: seconds - 1,
      clock: formatDownTime(seconds - 1)
    });
    countDown(that)

  }, 1000);
  if (Math.floor(that.data.remaintime) == 0){
    clearTimeout(T)
  }

}
function clearTimeOut (){
   clearTimeout(T)
}

/*
* 订单状态
* */
function getOrderStatus(order,siteType) {//商店类型，如预约：yuyue
  var status = order.status;
  var orderType = order.orderType;
  var foodType = order.foodType;
  if (status == 1) {
    return "待支付";
  } else if (status == 2) {
    if (orderType == 2){
      if (foodType && (foodType == 1 || foodType == 2)){
        return "制作中";
      } else {
        return "待配送";
      }
    } else {
      return siteType=="yuyue"?"待消费":"待发货";
    }
  } else if (status == 3) {
    if (orderType == 2) {
      if (foodType && (foodType == 1 || foodType == 2)) {
        return "制作完成";
      } else {
        return "已配送";
      }
    } else{
      return siteType=="yuyue"?"待确认":"待收货";
    }
  } else if (status == 4) {
    return "交易完成";
  } else if (status == 5) {
    return "已取消";
  } else if (status == 6) {
    return "已退货";
  } else if (status == 7) {
    return "未发货，退款中";
  } else if (status == 8) {
    return "已发货，退货中";
  } else if (status == 9) {
    return "已完成，退货中";
  } else if (status == 10) {
    return "待接单";
  }
}

/*
* 获取商品购物车
* */
function getShoppingCartCount(cb,app){
  var cusmallToken = wx.getStorageSync('cusmallToken');
  wx.request({
    url: cf.config.pageDomain + '/applet/mobile/shopping_cart/getCartCount',
    data: {
      cusmallToken: cusmallToken,
      fromUid: app.globalData.fromuid || "",
      shopUid: app.globalData.shopuid || ""
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.data.ret == 0) {
        typeof cb == "function" && cb(res.data.model.count);
      }

    }
  })
}

/**
 * 解析QQ视频链接的源地址
 * 目前支持这几种链接类型：
 * 1、https://imgcache.qq.com/tencentvideo_v1/playerv3/TPout.swf?max_age=86400&v=20161117&vid=x0565vkatl1&auto=0
 * 2、https://v.qq.com/x/cover/dk6z4x5v536r3fz.html
 * 3、https://v.qq.com/iframe/player.html?vid=g0024nmxe2z&tiny=0&auto=0
 */
function getQQVideoInfo(item,i,cb) {
  try{
    var linkUrl = item.data.url;
    var patt = /v.qq.com|imgcache.qq.com/g;
    if (!patt.test(linkUrl)) {
      return false;
    }
    var srcPatt = /src=[\'\"]?([^\'\"]*)[\'\"]?/i;
    var embedPatt = /<\/embed>|<\/iframe>/g;
    if (embedPatt.test(linkUrl)) {
      var src = linkUrl.match(srcPatt);
      if (src.length == 2) {
        linkUrl = src[1];
      } else {
        return false;
      }
    }
  }catch(e){
    console.log(e);
  }

  wx.request({
    url: cf.config.pageDomain + '/applet/mobile/video_analysis/analysis',
    data: {
      origUrl: linkUrl || ""
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.data.ret == 0) {
        typeof cb == "function" && cb(item,i,res.data.model.url);
      }
    }
  })
}

// 统计PV流量
function addPVStat(cb){
  var cusmallToken = wx.getStorageSync('cusmallToken');
  wx.request({
    url: cf.config.pageDomain + '/applet/mobile/dataStatistics/addPv',
    data: {
      cusmallToken: cusmallToken
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      typeof cb == "function" && cb(res.data.model.count);
    }
  })
}

// 处理控件中链接类型的转换
function convertItemLink(item,page){
  var app = page.data.app;
  var shopuid = app.globalData.shopuid;
  var fromuid = app.globalData.fromuid;
  if (item && item.link_type) {
    if (item.link_type == 1) {
      item.url = "test";
    } else if (item.link_type == 8) {
      if (wx.getStorageSync("oem_index_page")){
        item.url = wx.getStorageSync("oem_index_page");
      } else {
        item.url = "/pages/index/index?fromIndex=true";
        if(shopuid){
          item.url = item.url + "&shopuid=" + shopuid;
          if(fromuid){
            item.url = item.url + "&fromuid=" + fromuid;
          }
        }
      }
    } else if (item.link_type == 9) {
      item.url = item.url;
    } else if (item.link_type == 10) {
      if (item.pageid){
        if (item.goods_type == 3 || item.url.indexOf("yydetail")>0){
          item.url = "/pages/yuyue/yydetail?id=" + item.pageid;
        } else if (2 == item.goods_type){
          item.url = "/pages/takeout/indexDetail?id=" + item.pageid+"&type=ta";
        }else{
          item.url = "/pages/detail/detail?id=" + item.pageid;
        }
      } else {
        return item.url;
      }
    } else if (item.link_type == 13) {
      item.url = "/pages/subCategory/subpage?pageId=" + item.pageid;
    } else if (item.link_type == 15) {
      item.url = "/pages/category/category";
      if(item.style){
        item.url = "/pages/category/category?style="+item.style;
      }
    } else if (item.link_type == 16) {
      item.url = "/pages/shoppingcar/shoppingcar";
    } else if (item.link_type == 17) {
      item.url = "/pages/uniquecenter/uniquecenter";
    } else if (item.link_type == 18) {
      item.url = "tel:" + item.link_telnum;
    } else if (item.link_type == 19) {
      item.url = "lbs:" + item.pageid + ":" + item.style + ":" + item.link_name;
      // if (app.globalData.previewuid){
      //   item.url = "lbs:uid:" + app.globalData.previewuid;
      // }
      // if (app.globalData.shopuid){
      //   item.url = "lbs:uid:" + app.globalData.shopuid;
      // }

    } else if (item.link_type == 20) {
      item.link_appid = item.url;
      item.url = "miniapp:" + item.url;
      // item.target = "miniProgram";

    } else if (item.link_type == 21) {
      item.url = "/pages/takeout/index?type=ta";
    } else if (item.link_type == 22) {
      if (shopuid) {
        item.url = "tips:offline";
      }
      item.url = "/pages/offline/pay?id="+item.pageid;
    } else if (item.link_type == 23) {
      item.url = item.url;
    } else if (item.link_type == 24) {
      item.url = "/pages/coupon/coupon?id="+item.pageid;
    } else if (item.link_type == 25) {
      item.url = "/pages/groupbuy/groupbuy?activityId=" + item.pageid;
      if (shopuid){
        item.url = "tips:mulshop";
      }
    } else if (26 == item.link_type){
      item.url = "/pages/sbargain/sbargain?activityId=" + item.pageid;
      if (shopuid) {
        item.url = "tips:mulshop";
      }
    } else if (27 == item.link_type) {
      item.url = "/pages/mult/multlist?id=" + item.pageid+"&title="+item.link_name;
    } else if (28 == item.link_type) { //传入板块id
      item.url = "/pages/forum/community?plateId=" + item.pageid;
      if (shopuid) {
        //item.url = "tips:forum";
      }
    } else if (item.link_type == 30) {
      item.url = "/pages/takeout/index?type=tostore";
    } else if (item.link_type == 31){
      if (item.pageid){
        item.url = "/pages/subCategory/sCategoryList?clsid=" + item.pageid + "&clsname=" + item.link_name;
      }else{
        item.url = "/pages/subCategory/subCategory";
      }

    } else if (item.link_type == 32){
      item.url = "/pages/backuppage/backup1";
    } else if (item.link_type == 33){
      item.url = "/pages/uniquecenter/sign";
    } else if (item.link_type == 34){
      item.url = "/pages/index/index?"+item.pageid;
    } else if (item.link_type == 35){
      item.url = "/pages/sbargain/seckillGoods?id=" + item.pageid;
    } else if (item.link_type == 36){
      item.url = "/pages/interaction/wheel/wheel?activityId=" + item.pageid;
    } else if(37 == item.link_type){
      item.url = "/pages/interaction/kouling/pack_send/pack_send";
    } else if (38 == item.link_type){
      item.url = "/pages/interaction/golden_egg/golden_egg?activityId=" + item.pageid;
    } else if (39 == item.link_type){
      item.url = "/pages/interaction/shake_tree/shake_tree?activityId=" + item.pageid;
    } else if (40 == item.link_type) {
      item.url = "/pages/interaction/heartbeatmatch/heartbeatmatch?activityId=" + item.pageid;
    } else if (41 == item.link_type) {
      item.url = "/pages/interaction/xiuyixiu/xiuyixiu?activityId=" + item.pageid;
    } else if (42 == item.link_type) {
      item.url = "/pages/interaction/zqjizi/zqjizi?activityId=" + item.pageid;
    } else if(43 == item.link_type){
      if (item.pageid){

        item.url = "/pages/forum/community?plateId=" + item.pageid;
      }else{
        item.url = "/pages/forum/communityPlate";
      }

    } else if (44 == item.link_type) {
      item.url = "/pages/interaction/guaguaka/guaguaka?activityId=" + item.pageid;
    } else if (45 == item.link_type){//多媒体文件
      item.url = "/pages/multMedia/multMediaDetail?id=" + item.pageid;
    } else if (46 == item.link_type) {//多媒体分组
      item.url = "/pages/multMedia/mMediaList?id=" + item.pageid;
    } else if (47 == item.link_type) {//排号
      item.url = "/pages/queue/queueList";
    } else if (48 == item.link_type) {// WIFI
      item.url = "wifi:" + item.link_wifiinfo;
    } else if (49 == item.link_type) {// WIFI
      item.url = "/pages/secondCard/cardList";
    } else if (50 == item.link_type){
      item.url = "/pages/articlelink/articlelink?articleUrl=" + item.link_articleUrl;
    } else if (item.link_type == 51) {
      item.url = "/pages/groupbuy/groupbuy?activityId=" + item.pageid;
      if (shopuid) {
        item.url = "tips:mulshop";
      }
    } else if (56 == item.link_type) {
      item.url = "scancode:goods" ;
    } else if(59 == item.link_type){
      item.url = "/pages/detail/detail?id=" + item.pageid;
    } else if (60 == item.link_type) {
      item.url = "/pages/search/search?keyword=&aId=&aInfo=&isReq=false&isGoodsInteral=true";
    } else if (61 == item.link_type) {
      item.url = "/pages/groupbuy/groupbuyList?activityId=" + item.pageid;
    } else if (66 == item.link_type) {
      item.url = "/pages/presales/presales?activityId=" + item.pageid;
    } else if (67 == item.link_type) {
      item.url = "/pages/time_discount/time_discount_goodslist?activityId=" + item.pageid;
    } else if (62 == item.link_type) {
      item.url = "/pages/liveplayer/liveplayer?style=" + item.list_style + "&showend=" + item.show_end;
    } else {
      item.url = item.url;
    }
  } else {
    item.url = "blank";
  }
  return item;
}

/*
* 图片格式化
* */
function formatImg(html){
  var newContent = html.replace(/<img[^>]*>/gi, function (match, capture) {
    var classReg = new RegExp(/class=['|\"]([^\'\"]*)['|\"]/i);
    var styleReg = new RegExp(/style=['|\"]([^\'\"]*)['|\"]/i);
    var srcReg = new RegExp(/src=['|\"]([^\'\"]*)['|\"]/i);

    // 添加压缩图片参数
    if (srcReg.test(match)) {
      match = match.replace(srcReg, function (m, captrue) {
        var slimParam = (m.indexOf("?") != -1 ? "|" : "?") + "imageView2/2/w/1080";
        return m.substring(0, m.length - 1) + slimParam + m.substring(m.length - 1);
      });
    }
    if (styleReg.test(match)) {
      match = match.replace(styleReg, function (m, captrue) {
        return m.substring(0, m.length - 1) + " max-width:100%;" + m.substring(m.length - 1);
      });
    }
    if (classReg.test(match)) {
      match = match.replace(classReg, function (m, captrue) {
        return m.substring(0, m.length - 1) + " img-responsive" + m.substring(m.length - 1);
      });
    } else {
      var srcIndex = match.indexOf("src=");
      return match.substring(0, srcIndex) + " class='img-responsive' " + match.substring(srcIndex);
    }
    return match;
  });
  return newContent;
}

// 处理模板数据（初始化富文本插件，商家金额除以100取小数点2位）
function processDecorationData(decorationData, page, decorationLocation){
  var bannerIndex = 0;
  var multClassArr = [];
  var communityFirst = true;
  var hasLoadAllCategory = false;
  let promiseAll = []; // 新版拼团promise
  var hasLoadAllSubCls = false;
  if (getApp().globalData.bottomMenus){
   getApp().globalData.bottomMenus.isShow = false;
  }

  // 刷新页面后清除原来的定时器
  if (page.data.decoration && page.data.decoration.items) {
    for (let i = 0; i < page.data.decoration.items.length; i++) {
      let item = page.data.decoration.items[i];
      if (item.item_type == "announceWidget") {
        if (item.data.scrollTimer) {
          clearInterval(item.data.scrollTimer);
        }
      }
    }
  }

  //getApp().globalData.bottomMenus = null;
  if (decorationData != null && decorationData.items != null) {
    for (var i = 0; i < decorationData.items.length; i++) {
      var item = decorationData.items[i];
      if (item.item_type == "mc_goodslist"){
        // var goodsList = item.data.list;
        // for(var j=0;j<goodsList.length;j++){
        //   var goods = goodsList[j];
        //   goods.price = (goods.price/100).toFixed(2);
        // }
      } else if (item.item_type == "richtext"){
        if(item.data.richtext){
          // 富文本图片宽度自适应
          item.data.richtext = formatImg(item.data.richtext);
        }
      } else if (item.item_type == "title") {
        convertItemLink(item.data,page);
      } else if(item.item_type == "img_ad"){
        item.item_index = bannerIndex;
        bannerIndex++;
        if(item.data.list.length>0){
          wx.getImageInfo({
            src: cf.config.userImagePath + item.data.list[0].img,
            success(res) {
              console.log(res.width)
              console.log(res.height)
              item.data.bannerHeight =  (res.height / res.width) * 750;
            }
          })
        }

        var itemList = item.data.list;
        for(var j=0;j<itemList.length;j++){
          convertItemLink(itemList[j], page);
        }
      } else if (item.item_type == "bottomMenusWidget"){
        var itemList = item.data.list;
        for (var j = 0; j < itemList.length; j++) {
          convertItemLink(itemList[j], page);
        }
        getApp().globalData.bottomMenus = item.data;
      } else if (item.item_type == "microBottomMenusWidget") {
        var itemList = item.data.list;
        for (var j = 0; j < itemList.length; j++) {
          convertItemLink(itemList[j], page);
        }

      } else if (item.item_type == "four_box"){
          let itemList = item.data.list;
          var imgarr = []
          for(let i=0; i< itemList.length; i++){
            imgarr.push(cf.config.userImagePath+itemList[i].img)
            itemList[i].imgarrs = imgarr;
            convertItemLink(itemList[i], page);
          }

      } else if (item.item_type == "img_nav" ||
        item.item_type == "two_box" ||
        item.item_type == "three_box" ||
        item.item_type == "four_box" ||
        item.item_type == "text_nav" ||
        item.item_type == "showcaseWidget" ||
        item.item_type == "listWidget"){
        var itemList = item.data.list;
        for (var j = 0; j < itemList.length; j++) {
          convertItemLink(itemList[j], page);
        }
      } else if (item.item_type == "videoWidget"){
        (function (decorationLocation){
          getQQVideoInfo(item,i,function(item,i,url){
            item.data.url = url;
            if (decorationLocation){
              page.setData({
                [decorationLocation+'.items[' + i + ']']: item
              });
            } else{
              page.setData({
                ['decoration.items[' + i + ']']: item
              });
            }
          });
        })(decorationLocation)
      } else if (item.item_type == "announceWidget") {
        let itemList = item.data.list;
        for (let j = 0; j < itemList.length; j++) {
          convertItemLink(itemList[j], page);
        }
        // 公告组件上下滚动定时器
        if (item.data.direction == "v" && item.data.list.length > 1){
          item.data.marginTop = 0;
          let itemHeight = (item.data.height || 25);
          (function (item, i, decorationLocation){
            item.data.scrollTimer = setInterval(function(){
              if(item.data.marginTop == -(item.data.list.length-1)*itemHeight){
                item.data.marginTop = 0;
              } else {
                item.data.marginTop -= itemHeight;
              }
              if (decorationLocation){
                page.setData({
                  [decorationLocation + '.items[' + i + ']']: item
                });
              } else {
                page.setData({
                  ['decoration.items[' + i + ']']: item
                });
              }
            },4000);
          })(item, i, decorationLocation);
        }
      } else if (item.item_type == "multShopWidget"){
        multClassArr["mult" + item.data.pageid] = item.data.pageid || "";
        page.setData({
          haveMutl:true
        });
      } else if (item.item_type == "categoryTabWidget"){
        if (!hasLoadAllCategory){
          page.loadAllCategory(i);
          hasLoadAllCategory = true;
        }
      } else if (item.item_type == "nav_tab_panel"){
        let itemList = item.data.list;
        if (itemList && itemList.length > 0){
          page.loadNavPanelPageContent(i,0,itemList[0].pageid);
        }
      } else if ("subPageWidget" == item.item_type){
        if (!hasLoadAllSubCls){
          page.findAllSubCls(i);
          hasLoadAllSubCls = true;
        }
      } else if ("informationWidget" == item.item_type) {
        if(item.data.list.length > 0 && item.data.list[0].pageid){
          let infoPageList = [];
          for (let i = 0; i < item.data.list.length;i++){
            infoPageList.push({ "id": item.data.list[i].pageid});
          }
          page.loadInfoPageById(item.data.list[0].pageid);
          page.setData({
            selectedInfoPageId: item.data.list[0].pageid,
            selectedInfoPageIdx:0
          })
        }
      }else if (item.item_type == "communityWidget"){
        // if (communityFirst){
          let mallSiteId = wx.getStorageSync('mallSiteId');
          page.setData({
            mallSiteId: mallSiteId
          })
          page.communityHandle.fetchTopicListData(page, mallSiteId, item.data.pageid);
          if (item.data.pageid){

            page.communityHandle.fetchCategoryData(page, mallSiteId, item.data.pageid);
          } else {
            page.communityHandle.findCommunitySectionList(page, mallSiteId);
          }
          // communityFirst = false
        // }

      } else if (item.item_type == "search" && item.isReq ==1 ){
        page.setData({
          haveSearch:true
        })
        //砍价
      } else if (item.item_type == "sbargainWidget") {
        if(item.data.activityId){
          page.groupbuyHandle.fetchGroupbuyData(page,item.data.activityId)
        }

      } else if (item.item_type == "groupbuyWidget") {
        if (item.data.activityId) {
          page.groupbuyHandle.fetchGroupbuyData(page, item.data.activityId)
        }
      } else if (item.item_type == "newgroupbuyWidget") {
        if (item.data.activityId) { //新版拼团数据获取
          promiseAll.push(page.groupbuyHandle.newGroupbuyData(page, item.data.activityId));
        }
      } else if (item.item_type == "stepgroupbuyWidget") {
        if (item.data.activityId) {
          page.groupbuyHandle.fetchGroupbuyData(page, item.data.activityId)
        }
      } else if (item.item_type == "presalesWidget") {
        if (item.data.activityId) {
          page.groupbuyHandle.fetchGroupbuyData(page, item.data.activityId)
        }
      } else if (item.item_type == "discountWidget") {
        if (item.data.activityId) {
          page.groupbuyHandle.fetchGroupbuyData(page, item.data.activityId)
        }
      } else if (item.item_type == "liveplayerWidget") {
        page.liveplayerHandle.fetchRoomListData(page,item, item.data.show_end || 0 , i)
      } else if (item.item_type == "bgMusicWidget") {
        page.setData({
          bgMusic: item.data.music || ""
        })
      }else if ("freeWidget" == item.item_type) {
        item.data.hDivW = item.data.height / item.data.constwidth;//constwidth因为自由面板的宽 在pc是固定的
        item.data.calHeight = item.data.hDivW * wx.getSystemInfoSync().windowWidth;
        let mWidgets = item.data.widgets;
        for(let i = 0 ; i < mWidgets.length; i++){
          mWidgets[i].data.calWidth = parseInt(mWidgets[i].data.width) / item.data.constwidth * wx.getSystemInfoSync().windowWidth;
          mWidgets[i].data.calHeight = parseInt(mWidgets[i].data.height) / parseInt(mWidgets[i].data.width) * mWidgets[i].data.calWidth;
          convertItemLink(mWidgets[i].data, page);
        }

      } else if ("imgWidget" == item.item_type){
        autoCalcImgAndBtnWidget(item);
        convertItemLink(item.data, page);
      } else if ("btnWidget" == item.item_type){
        autoCalcImgAndBtnWidget(item);
        convertItemLink(item.data, page);
      } else if ("textWidget" == item.item_type) {
        convertItemLink(item.data, page);
      } else if ("seckillWidget" == item.item_type){
        page.setData({
          currentIdx: i,
        });
        if (undefined == page.data.seckList) page.setData({seckList: {},countDownList:{}});
        if (item.data.content == 1) page.getSKListData();
        else if(item.data.content == 0 && item.data.list.length > 0){
          let skillArray = [];
          item.data.list.length > 1 && item.data.list.reduce(function (pre, cur, Index) {
            if (pre.id) {
              skillArray.push(pre.id + "," + cur.id);
              return pre.id + "," + cur.id;
            } else if (!pre.id && Index === item.data.list.length - 1) {
              skillArray.push(cur.id);
            } else {
              return cur;
            }
          });
          item.data.list.length === 1 && skillArray.push(item.data.list[0].id);
          page.getSKListData(skillArray);
          page.data.skillArray = skillArray;
        }
      }
      else if ("suspendWidget" == item.item_type) {
        autoCalcImgAndBtnWidget(item);
        convertItemLink(item.data, page);
      }

    }
  }
  if (promiseAll) {  //新版拼团数据调用
    Promise.all(promiseAll).then(function (result) {
      let setInter=setInterval(function () {  //时间定时器
          page.newCountDownActy(result);
      }, 1000);
    }).catch(function () {
        console.log("有接口出错了")
    })
  }

  page.setData({
    multClassArr: multClassArr
  });
}

// 所有页面onLoad方法执行完成后的回调方法
function afterPageLoad(page, bottomMenu){
  // 自定义底部菜单数据，计算当前页面是否需要显示底部菜单，计算哪个菜单项是选中状态
  if (!bottomMenu){
    var bottomMenu = getApp().globalData.bottomMenus;
  }
  let pages = getCurrentPages();
  if (pages.length>1) {
    let currPage = pages[pages.length - 2];
    let demoRoute = currPage && currPage.route;
  }


  if (bottomMenu){
    var currentPage = getCurrentPages()[getCurrentPages().length - 1];
    let prePage = getCurrentPages().length >1 ? getCurrentPages()[getCurrentPages().length - 2]:'';
    if (bottomMenu.list && bottomMenu.list.length>0){
      var showMenu = false;
      var menuLen = bottomMenu.list.length;
      let currentMenu = -1;
      bottomMenu.list.forEach((item, index) => {
        if (item.selected) {
          currentMenu = index;
        }
      });
      for(var i=0;i<menuLen;i++){
        var menu = bottomMenu.list[i];
        if (menu.url && menu.url.indexOf(currentPage.route)>=0){
          if (currentPage.route == "pages/detail/detail"){
            if (menu.pageid && menu.pageid == currentPage.options.id){
              menu.selected = true;
            } else {
              menu.selected = false;
            }
            showMenu = true;
          } else if (currentPage.route == "pages/subCategory/subpage") {
            if (menu.pageid && menu.pageid == currentPage.options.pageId) {
              menu.selected = true;
            } else {
              menu.selected = false;
            }
            showMenu = true;
          } else if (currentPage.route == "pages/channel/channel") {
            if (menu.pageid && menu.pageid == currentPage.options.id) {
              menu.selected = true;
            } else if (menu.url && menu.url.split("=").length == 2 && menu.url.split("=")[1] == currentPage.options.id){
              menu.selected = true;
            } else {
              menu.selected = false;
            }
            showMenu = true;
          } else if (currentPage.route == "pages/subCategory/sCategoryList") {
            if (menu.pageid && menu.pageid == currentPage.options.clsid) {
              menu.selected = true;
            } else {
              menu.selected = false;
            }
            showMenu = true;
          } else if (currentPage.route == "pages/form/form") {
            if (menu.formid && menu.formid == currentPage.options.id) {
              menu.selected = true;
            } else if (menu.url && menu.url.split("=").length == 2 && menu.url.split("=")[1] == currentPage.options.id) {
              menu.selected = true;
            } else {
              menu.selected = false;
            }
            showMenu = true;
          } else if (menu.link_type == 34){
            // 多店铺菜单默认不选中
            showMenu = true;
            menu.selected = false;
          } else {
            showMenu = true;
            menu.selected = true;
          }
          //console.log(menu);
        }
        else {
          menu.selected = false;
        }
      }
      /* 如果还是没有一个选中 那么沿用先前页面选中 */
      let menuSelect = -1;
      bottomMenu.list.forEach((item,index) => {
        if (item.selected) menuSelect = index
      });
      if (menuSelect === -1 && currentMenu !== -1) {
        showMenu = true;
        bottomMenu.list[currentMenu].selected = true;
      }

      bottomMenu.isShow = showMenu;
    } else {
      bottomMenu.isShow = false;
    }
    if (currentPage.route.indexOf("pages/index/index") >= 0 || currentPage.route.indexOf("pages/index/tpl_index") >= 0){
      bottomMenu.isShow = true;
    }
  }
  // 页面中无法直接调用getApp(),所以app里面的数据需要冗余在每个Page的data里面并同步更新
  page.setData({app:getApp()})
  return bottomMenu;
}

// 处理订单数据（时间格式转换）
function processOrderData(orderData) {
  if (orderData.buyTime){
    orderData.buyTime = formatTime(new Date(orderData.buyTime));
  }
  if (orderData.createTime){
    orderData.createTime = formatTime(new Date(orderData.createTime));
  }
  if (orderData.payTime){
    orderData.payTime = formatTime(new Date(orderData.payTime));
  }
  if (orderData.realDeliveryTime){
    orderData.realDeliveryTime = formatTime(new Date(orderData.realDeliveryTime));
  }
}

// 处理banner高度根据image高度自适应
function processBannerImgLoad(e,page) {
  var w = e.detail.width;
  var h = e.detail.height;
  var bannerIndex = e.currentTarget.dataset.bannerindex;
  var bannerHeight = (h / w) * 750;
  if (!page.data.bannerHeight[bannerIndex] || bannerHeight > page.data.bannerHeight[bannerIndex]){
    page.data.bannerHeight[bannerIndex] = bannerHeight;
    page.setData({ bannerHeight: page.data.bannerHeight });
  }

}

// 处理页面navigate点击事件
function processNavClick(e) {
  var app = getApp();
  var url = e.currentTarget.dataset.url;
  var page_path=e.currentTarget.dataset.path || '';
  var isIndexPage = e.currentTarget.dataset.isindexpage;
  var isFooterTab = e.currentTarget.dataset.isfootertab;
  var isBtn = e.currentTarget.dataset.isbtn;
  var couponId = e.currentTarget.dataset.couponid;
  console.log(e);
  if(couponId){
    var that = this;
    var cusmallToken = wx.getStorageSync('cusmallToken');
    wx.showLoading({
      title: '加载中',
    });
    wx.request({
      url: cf.config.pageDomain + '/applet/mobile/coupon/obtainCoupon',
      data: {
        cusmallToken: cusmallToken,
        couponId: couponId,
        fromUid: app.globalData.fromuid || "",
        shopUid: app.globalData.shopuid || ""
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        if (res.data.ret == 0) {

          wx.hideLoading();
          wx.showToast({
            title: '领取成功',
            icon: 'success',
            duration: 2000
          })

        } else {
          wx.hideLoading();
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          })

        }
      }
    });
  }
  if (!url) {
    return false;
  }
  if (url.indexOf("tel:") == 0) {
    // 拨打电话
    wx.makePhoneCall({
      phoneNumber: url.split(":")[1]
    })
  }
  else if (url.indexOf("wifi:") == 0) {
    var url = e.currentTarget.dataset.url;
    let wifiInfo = url.split(":")[1];
    if(wifiInfo){
      let wifiConfig = wifiInfo.split(";");
      wx.showLoading({
        title: '连接中...',
      });
      wx.startWifi({
        success: function (res) {
          wx.connectWifi({
            SSID: wifiConfig.length >=1 ? wifiConfig[0] : "",
            BSSID: wifiConfig.length >= 2 ? wifiConfig[1].split(",").join(":"):"",
            password: wifiConfig.length >= 3 ? wifiConfig[2]:"",
            success: function (res) {
              wx.showModal({
                title: "提示",
                content: "wifi连接完成！",
                showCancel: false
              });
              console.log(res.errMsg)
            },
            fail:function(res){
              wx.showModal({
                title: "提示",
                content: "wifi连接失败："+res.errMsg,
                showCancel: false
              });
              console.log(res.errMsg)
            },
            complete:function(){
              wx.hideLoading();
            }
          })
        }
      })
    } else {
      wx.showModal({
        title: "提示",
        content: "wifi连接无效，请检查配置信息",
        showCancel: false
      });
    }
  }
  else if (url.indexOf("miniapp:") == 0) {
    //打开其他小程序

    wx.navigateToMiniProgram({
      appId: url.split(":")[1],
      path:page_path, //跳转小程序路径
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
    })
  }
  else if (url.indexOf("plugin-private") == 0) {
    wx.navigateTo({
      url: url,
    });
  }
  else if (url.indexOf("scancode:") == 0) {
    var mallSite = wx.getStorageSync('mallSite');
    wx.scanCode({
      onlyFromCamera: true,
      success: (res) => {
        console.log(res.result)
        console.log("扫码成功")
        if(res.result){
          wx.request({
            url: cf.config.pageDomain + '/applet/mobile/goods/findGoodsByScan',
            data: {
              uid: mallSite.uid,
              scanCode: res.result
            },
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
                console.log(res)
                if(res && res.data.ret == 0){
                  let goods = res.data.model.goods;
                  wx.navigateTo({
                    url: "/pages/detail/detail?id=" + goods.id
                  })
                }else{
                  wx.showModal({
                    title: "提示",
                    content: "没有查到商品",
                    showCancel: false
                  });
                }


            }
          })
        }

      }
    })
  }
  else if (url.indexOf("tips:") == 0){
    var tipsType = url.split(":")[1];
    if("mulshop" == tipsType){
      wx.showModal({
        title: '温馨提示',
        content: "子店铺不参与连锁店铺活动，如有疑问请联系商家！"
      })
    }
    else if("offline" == tipsType){
      wx.showModal({
        title: '温馨提示',
        content: "子店铺不支持当面付，如有疑问请联系商家！"
      })
    }
    else if ("forum" == tipsType) {
      wx.showModal({
        title: '温馨提示',
        content: "子店铺不支持此模块，如有疑问请联系商家！"
      })
    }
    else if(tipsType){
      wx.showModal({
        title: '温馨提示',
        showCancel:false,
        content: tipsType
      })
    }
    return;
  }
  else if (url.indexOf("lbs:") == 0) {
    // 打开地图
    var latLng = url.split(":")[1];
    var addr = url.split(":")[2];
    var name = url.split(":")[3];
    wx.openLocation({
      latitude: Number(latLng.split(",")[0]),
      longitude: Number(latLng.split(",")[1]),
      scale: 28,
      name: name,
      address: addr
    })

    // var extConfig = wx.getExtConfigSync ? wx.getExtConfigSync() : {}
    // var lbsType = url.split(":")[1];
    // var uid = extConfig.uid;
    // if (url.split(":").length == 3){
    //   uid = url.split(":")[2];
    // }
    // if("uid" == lbsType){
    //   wx.showLoading({
    //     title: '加载中',
    //   });

    //   wx.request({
    //     url: cf.config.pageDomain + '/applet/mobile/lbsinfo/getLbsInfo',
    //     data: {
    //       uid: uid
    //     },
    //     header: {
    //       'content-type': 'application/json'
    //     },
    //     success: function (res) {
    //       if (res.data.ret == 0) {
    //         console.log(res.data);
    //         var lbsinfo = res.data.model.lbsinfo;
    //         wx.openLocation({
    //           latitude: Number(lbsinfo.latitude),
    //           longitude: Number(lbsinfo.longitude),
    //           scale: 28,
    //           name: lbsinfo.name,
    //           address:lbsinfo.address
    //         })
    //         wx.hideLoading();
    //       } else {
    //         wx.hideLoading();
    //         wx.showModal({
    //           title: '获取LBS信息异常',
    //           showCancel: false,
    //           content: res.data.msg
    //         })
    //       }
    //     }
    //   });
    // }
  }
  else {
    if (isFooterTab && !isIndexPage){
      // if ("/pages/index/index" == url) {
      //   wx.reLaunch({
      //     url: url,
      //   });
      // }else{
      //    wx.redirectTo({
      //      url: url,
      //    });
      // }

    }
    else if (isBtn){
      wx.navigateTo({
        url: url,
      });
    }
  }
  return true;
}

//drawEle[
//{type:"",x:100,y:100,width:100,height:100,url:"",fontSize:10,color:"#333333",text:""}
//]
//type 需要画的元素 支持img （图片）、 txt（文字）、dashLine（虚线）
//x 横坐标位置 y纵坐标位置  width 元素的宽 元素的高height   fontSize 字体大小 color 字体颜色/线条颜色 text 文字内容
//
/* canvas 画图*/
function drawPoster(cxt, drawEle, drawWidth, drawHeight,callback){
  drawPostDetail(cxt, drawEle, 0, drawWidth, drawHeight, callback);
}
function drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback){
  console.log("--------------curIndex" + idx)
  if (idx == drawEle.length) {
    cxt.draw();
    setTimeout(function() {
      callback();
    }, 400)
    return;
  }
  let ele = drawEle[idx++]
  switch (ele.type) {
    case "img":
      wx.downloadFile({
        url: ele.url,
        success: function (res) {
          cxt.drawImage(res.tempFilePath, ele.x, ele.y, ele.width, ele.height);
          console.log("suc " + (idx - 1))
        },
        fail:function(e){
          console.log(e)
        },
        complete: function(){
          console.log("com " + (idx - 1));
          drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
        }
      });
      break;
    case "txt":
      cxt.save();
      cxt.setFillStyle(ele.color);
      cxt.setFontSize(ele.fontSize);
      cxt.setTextAlign(ele.align);
      cxt.setTextBaseline(ele.baseline);
      if (ele.bold) {
        console.log('字体加粗')
        cxt.fillText(ele.text, ele.x, ele.y - 0.5);
        cxt.fillText(ele.text, ele.x - 0.5, ele.y);
      }
      cxt.fillText(ele.text, ele.x, ele.y);
      if (ele.bold) {
        cxt.fillText(ele.text, ele.x, ele.y + 0.5);
        cxt.fillText(ele.text, ele.x + 0.5, ele.y);
      }
      cxt.restore();
      drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
      break;
    case 'arcImg':
      wx.downloadFile({
        url: ele.url,
        success: function (res) {
          let rate=0.7;
          cxt.beginPath();
          cxt.save();
          let width = 160 * rate
          let radius = 12 * rate
          let angleLine = 10 * rate
          // { x: (30+30)*rate,y: (246+30)*rate },
          cxt.setLineWidth(1)
          cxt.setStrokeStyle('#E9E9E9')
          cxt.moveTo(ele.x + angleLine, ele.y);           // 创建开始点

          cxt.lineTo(ele.x + angleLine + width, ele.y);          // 创建水平线
          cxt.arcTo(ele.x + angleLine * 2 + width, ele.y, ele.x + angleLine * 2 + width, ele.y + angleLine, radius); // 创建弧

          cxt.lineTo(ele.x + angleLine + width + angleLine, ele.y + angleLine + width);         // 创建垂直线
          cxt.arcTo(ele.x + angleLine * 2 + width, ele.y + angleLine * 2 + width, ele.x + angleLine + width, ele.y + angleLine * 2 + width, radius); // 创建弧

          cxt.lineTo(ele.x + angleLine, ele.y + angleLine * 2 + width);         // 创建水平线
          cxt.arcTo(ele.x, ele.y + angleLine * 2 + width, ele.x, ele.y + angleLine + width, radius); // 创建弧

          cxt.lineTo(ele.x, ele.y + angleLine);         // 创建垂直线
          cxt.arcTo(ele.x, ele.y, ele.x + angleLine, ele.y, radius); // 创建弧

          cxt.stroke(); //
          cxt.clip();
          cxt.drawImage(res.tempFilePath, ele.x, ele.y, 180*rate, 180*rate);
          cxt.restore();
        },
        complete: function(){
          console.log("com " + (idx - 1));
          drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
        }
        })
      break;
    case 'imgCircle':
      wx.downloadFile({
        url: ele.url,
        success: function (res) {
          cxt.save();
          // cxt.drawImage(res.tempFilePath, ele.x, ele.y, ele.width, ele.height);
          cxt.beginPath(); //开始绘制
          //先画个圆   前两个参数确定了圆心 （x,y） 坐标  第三个参数是圆的半径  四参数是绘图方向  默认是false，即顺时针
          cxt.arc(ele.width / 2 + ele.x, ele.height / 2 + ele.y, ele.width / 2 , 0, Math.PI * 2, false);
          cxt.clip();//画好了圆 剪切  原始画布中剪切任意形状和尺寸。一旦剪切了某个区域，则所有之后的绘图都会被限制在被剪切的区域内 这也是我们要save上下文的原因
          cxt.drawImage(res.tempFilePath, ele.x, ele.y, ele.width, ele.height); // 推进去图片，必须是https图片
          cxt.restore(); //恢复之前保存的绘图上下文 恢复之前保存的绘图上下午即状态 还可以继续绘制
          // cxt.draw(); //可将之前在绘图上下文中的描述（路径、变形、样式）画到 canvas 中
          console.log("suc " + (idx - 1))
        },
        complete: function(){
          console.log("com " + (idx - 1));
          drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
        }
      });
      break;
    case "deleteLine":
      cxt.setLineWidth(2)
      cxt.setStrokeStyle(ele.color);
      cxt.beginPath();
      cxt.moveTo(ele.x, ele.y);
      cxt.lineTo(ele.toX, ele.toY);
      cxt.stroke();
      drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
      break;
    case "dashLine":
      cxt.setLineWidth(1)
      cxt.setStrokeStyle(ele.color);
      cxt.beginPath();
      cxt.setLineDash([4, 2]);
      cxt.moveTo(ele.x, ele.y);
      cxt.lineTo(ele.toX, ele.toY);
      cxt.stroke();
      drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
      break;
    case "base64Img":
      wx.downloadFile({
        url: ele.url,
        success: function (res) {
          cxt.drawImage(res.tempFilePath, ele.x, ele.y, ele.width, ele.height);
          console.log("suc " + (idx - 1));
        },
        fail: function (e) {
          console.log(e)
        },
        complete: function () {
          console.log("com " + (idx - 1));
          drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
        }
      });
      break;
    case "rect":
      cxt.setFillStyle(ele.color);
      cxt.fillRect(ele.x, ele.y, ele.width, ele.height);
      drawPostDetail(cxt, drawEle, idx, drawWidth, drawHeight, callback);
    break;
  }
}
function tinyWxHeadImg (headImg) {
  if (headImg == null) return "";
  var headLength = headImg.length;
  if (headImg.substring(headLength - 2, headLength) == "/0") {
    headImg = headImg.substring(0, headLength - 2) + "/96";
  }
  return headImg;
}

/* 获取地址 */
function autoGeyAddr(callback, cusmallToken) {
  wx.getLocation({
    type: 'gcj02',
    success: function (res) {
      wx.request({
        url: cf.config.pageDomain + "/applet/mobile/map_api/locationToDesc",
        data: {
          cusmallToken: cusmallToken,
          location: res.latitude + "," + res.longitude
        },
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          let data = res.data;
          callback(data)

        },
        fail: function () {
        },
        complete: function () {
        }
      });

    }
  });
}

/*   */
function myPXToRPX(val){
  val = parseFloat(val);
  return 750 / wx.getSystemInfoSync().windowWidth * val;
}

/*  */
function autoCalcImgAndBtnWidget(item){
  let numWidth = parseInt(item.data.width);
  let numHeight = parseInt(item.data.height);
  item.data.hDivW = numHeight / numWidth;
  item.data.calWidth = numWidth / item.data.constwidth * wx.getSystemInfoSync().windowWidth;
  item.data.calHeight = item.data.calWidth * item.data.hDivW;
}

/* 手机号码验证 */
function phoneValidate(str){
  let validate = /^[1](([3][0-9])|([4][5-9])|([5][0-3,5-9])|([6][5,6])|([7][0-8])|([8][0-9])|([9][1,8,9]))[0-9]{8}$/;
  return validate.test(str);
}
//
function formatSeconds(value) {
  　　let result = parseInt(value)
  　　let h = Math.floor(result / 3600) < 10 ? '0' + Math.floor(result / 3600) : Math.floor(result / 3600)
  　　let m = Math.floor((result / 60 % 60)) < 10 ? '0' + Math.floor((result / 60 % 60)) : Math.floor((result / 60 % 60))
  　　let s = Math.floor((result % 60)) < 10 ? '0' + Math.floor((result % 60)) : Math.floor((result % 60))
  　　result = `${h}:${m}:${s}`
  　　return result
}

/* 模块导出 */
module.exports = {
  formatTime: formatTime,
  formatDate: formatDate,
  getShoppingCartCount: getShoppingCartCount,
  addPVStat: addPVStat,
  afterPageLoad: afterPageLoad,
  processOrderData: processOrderData,
  processBannerImgLoad: processBannerImgLoad,
  processDecorationData: processDecorationData,
  processNavClick: processNavClick,
  getOrderStatus: getOrderStatus,
  numAddPreZero: numAddPreZero,
  formatImg: formatImg,
  convertItemLink: convertItemLink,
  drawPoster:drawPoster,
  tinyWxHeadImg: tinyWxHeadImg,
  autoGeyAddr: autoGeyAddr,
  phoneValidate,
  formatDateC,
  clearTimeOut,
  countDown,
  formatDownTime,
  handleOptions,
  formatTimeM,
  formatSeconds
}
