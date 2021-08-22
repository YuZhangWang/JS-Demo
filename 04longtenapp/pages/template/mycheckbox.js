// pages/template/mycheckbox.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    checked:{
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    toggleCheckbox:function(e){
      console.log(1)
      this.triggerEvent('togglecheckbox', e, {});
    }
  }
})
