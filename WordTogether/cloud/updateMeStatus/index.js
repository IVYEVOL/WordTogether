// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  return cloud.database().collection('team_friend')
    .doc(event._id)
    .update({
      data: {
        task_finished: event.task_finished,
        review_finished: event.review_finished,
        tomorrowIndex: event.tomorrowIndex,
        lastLogin: event.lastLogin,
        ['history.'+[event.historyLength]+'.task_finished_sum']:event.task_finished_sum,
        ['history.'+[event.historyLength]+'.review_finished_sum']:event.review_finished_sum,
      }
    })
}