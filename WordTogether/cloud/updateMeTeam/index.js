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
        team_id: event.team_id
      }
    })
}