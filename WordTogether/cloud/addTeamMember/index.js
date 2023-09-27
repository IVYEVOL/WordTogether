// 云函数入口文件
const cloud = require('wx-server-sdk')


cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  return await cloud.database().collection('team_friend').add({
    data: {
      imageurl: event.imageurl,
      name: event.name,
      openid: event.openid,
      task_finished: event.task_finished,
      team_id: event.team_id,
      history:event.history,
      lastLogin:event.lastLogin,
      tomorrowIndex:event.tomorrowIndex,
      review_finished: event.review_finished,
    }
  })
}