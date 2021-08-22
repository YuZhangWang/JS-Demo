/**
 * Class Wheel
 * @class
 * @classdesc 大转盘游戏逻辑部分
 * @author pfan
 * @todo 注意：移动端真机，不支持requestAnimationFrame.
 *
 * @example
 *  new Wheel(this,{
 *    areaNumber: 8,   //抽奖间隔
 *    speed: 16,       //转动速度
 *    awardNumer: 2,   //中奖区域从1开始
 *    mode: 1,         //1是指针旋转，2为转盘旋转
 *    callback: (idx, award) => {
 *      //结束回调， 参数对应宫格索引，对应奖项
 *    }
 *  })
 */
class Wheel {
  /**
   * @constructs Wheel构造函数
   * @param  {Object} pageContext page路由指针
   * @param  {Object} opts      组件所需参数
   * @param  {Number} opts.areaNumber  抽奖间隔
   * @param  {Number} opts.speed       转动速度
   * @param  {Number} opts.awardNumer  中奖区域从1开始
   * @param  {Number} opts.mode     1是指针旋转，2为转盘旋转
   * @param  {Function} opts.callback    结束回调
   */
  constructor (pageContext, opts) {
    this.page = pageContext
    this.deg = 0
    this.areaNumber = opts.areaNumber  // 奖区数量
    this.speed = opts.speed || 16   // 每帧速度
    this.awardNumer = opts.awardNumer //中奖区域 从1开始
    this.mode = opts.mode || 2
    this.singleAngle = ''   //每片扇形的角度
    this.isStart = false
    this.endCallBack = opts.callback


    this.init();
    this.page.start = this.start.bind(this)
    this.page.stop = this.stop.bind(this);
  }

  init () {
    let {areaNumber, singleAngle, mode} = this
    singleAngle = 360 / areaNumber
    this.singleAngle = singleAngle
    this.page.setData({
      wheel: {
        singleAngle: singleAngle,
        mode: mode
      }
    })
  }

  start () {
    if (!this.page.checkUserInfo()) {
      this.init()
      return false;
    }
    let  that = this;
    let {deg, awardNumer, singleAngle, speed, isStart, mode} = this
    if(isStart)return;
    if (undefined == this.page.data.actuallyTime || 0 == this.page.data.actuallyTime){
      wx.showModal({
        showCancel: false,
        content: "没有抽奖机会"
      });
      return;
    }
    if (this.page.data.atyEndTime < new Date().getTime()){
      wx.showModal({
        showCancel: false,
        content: "活动结束"
      });
      return;
    }
    this.page.doLottery();
    console.log(1)
    this.isStart = true;
    let endAddAngle = (awardNumer - 1) * singleAngle + singleAngle/2 + 360; //中奖角度
    let rangeAngle = 500 * 360; // 随机旋转几圈再停止
    that.rangeAngle =  rangeAngle;
    that.endAddAngle = endAddAngle;
    let cAngle
    deg = 0
    this.timer = setInterval( () => {
      if (deg < that.rangeAngle ){
        deg += speed
      }else{
        cAngle = (that.endAddAngle + that.rangeAngle - deg) / speed
        cAngle = cAngle > speed ? speed : cAngle < 1 ? 1 : cAngle
        deg += cAngle

        if (deg >= (that.endAddAngle + that.rangeAngle )){
          deg = that.endAddAngle + that.rangeAngle
          this.isStart = false
          clearInterval(this.timer)
          this.endCallBack()
        }
      }

      this.page.setData({
        wheel: {
          singleAngle: singleAngle,
          deg: deg,
          mode: mode
        }
      })
    }, 16)
  }

  stop(awardNumer){
    let mDeg = this.page.data.wheel.deg
    let mDisDeg = 360 - mDeg % 360;
    let mrangeAngle = mDisDeg + mDeg + 360*2;
    this.rangeAngle = mrangeAngle;
    this.endAddAngle = (awardNumer - 1) * this.singleAngle + this.singleAngle / 2 + 360 //中奖角度;
  }

  reset () {
    let {mode} = this
    this.deg = 0
    this.page.setData({
      wheel: {
        singleAngle: this.singleAngle,
        deg: 0,
        mode: mode
      }
    })
  }

  switch (mode) {
    this.mode = mode
  }

}

export default Wheel

