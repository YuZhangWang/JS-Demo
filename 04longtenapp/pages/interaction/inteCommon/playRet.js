// pages/interaction/inteCommon/playRet.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    staticResPath:{
      type: String,
      value: ""
    },
    isShow:{
      type:Boolean,
      value:false
    },
    haveGift:{
      type: Boolean,
      value: true
    },
    playMsg:{
      type: String,
      value: "xxx"//没中呢,再接再厉哦
    },
    playDesc: {
      type: String,
      value: "x"//换个姿势,快来啊
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    commonImgUrl:"image/mobile/aty/common/"

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTap: function () {
      let myEventDetail = {} // detail对象，提供给事件监听函数
      let myEventOption = {} // 触发事件的选项
      this.triggerEvent('playagain', myEventDetail, myEventOption)
    }

  }
})
