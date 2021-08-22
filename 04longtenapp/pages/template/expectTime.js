
function handleExpTimeModalOpen(){
  this.setData({ showExpTime: true });
}
function handleExpTimeModalClose(){
  this.setData({ showExpTime: false });
}
function handleExpTimeModalTap(e){
  var that = this;
  var target = e.target;
  if (target) {
    var action = target.dataset.action;
    if ("closeModal" == action) {
      that.setData({ "showExpTime": false });
    }
  }
}
function handleExpTimeSelected(e) {
  console.log(e);
  var that = this;
  var idx = e.currentTarget.dataset.idx;
  that.setData({
    selectedExpTime:idx
  })
}

function calcTime(data){
  let that = this;
  let timeLimit = data.model.takeAway.timeLimit;//默认配送时长
  let businessTime = JSON.parse(data.model.takeAway.businessTime || "[]");
  let takeAwayTime = [];
  for (let i = 0; i < businessTime.length; i++) {
    console.log(businessTime[i]);
    takeAwayTime.push({ tStart: businessTime[i].startTime, tEnd: businessTime[i].endTime });
  }

  let calcDate = new Date(new Date().getTime() + (timeLimit * 60 * 1000));
  let nowHours = calcDate.getHours();
  let nowMinutes = calcDate.getMinutes();
  let firstMin = nowHours * 60 + nowMinutes;
  let canSelectTimeTA = [];
  canSelectTimeTA.push({ sendTime: "立即送出", showTime: nowHours + ":" + (nowMinutes < 10 ? "0" + nowMinutes : nowMinutes) });

  for (let i = nowHours; i < 24; i++) {
    
    for (let j = 0; j < takeAwayTime.length; j++) {
      let sTime = takeAwayTime[j].tStart.split(":");
      let eTime = takeAwayTime[j].tEnd.split(":");
      let mStartH = parseInt(sTime[0]);
      let mStartM = parseInt(sTime[1]);
      let mEndH = parseInt(eTime[0]);
      let mEndM = parseInt(eTime[1]);
      let mSMinutes = mStartH * 60 + mStartM;
      let mEMinutes = mEndH * 60 + mEndM;

      let mSendTime = i*60;
      let mSendTime30 = i * 60 + 30;
      if (firstMin <= mSendTime && mSMinutes <= mSendTime && mEMinutes >= mSendTime ){
        canSelectTimeTA.push({ sendTime: i + ":00", showTime: i + ":00" });
      }
      if (firstMin <= mSendTime && mSMinutes <= mSendTime30 && mEMinutes >= mSendTime30) {
        canSelectTimeTA.push({ sendTime: i + ":30", showTime: i + ":30" });
      }


    }
  }
  that.setData({
    canSelectTimeTA: canSelectTimeTA
  })
  that.setData({
    distributionMonty: data.model.takeAway.distributionMonty//配送费用
  })
}
module.exports = { handleExpTimeModalOpen, handleExpTimeModalClose, handleExpTimeSelected, handleExpTimeModalTap, calcTime};