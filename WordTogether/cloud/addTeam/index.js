// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  return await cloud.database().collection('team_Info').add({
    data: {
      teamAvatarUrl: event.teamAvatarUrl,
      teamName: event.teamName,
      team_book: event.team_book,
      team_friend_sum: event.team_friend_sum,
      team_taskNumber: event.team_taskNumber,
      team_creater: event.team_creater
    }
  })
}