// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {

  const date = event.date;
  const review_finished_sum = event.review_finished_sum;
  const task_finished_sum = event.task_finished_sum
  return cloud.database().collection('team_friend')
  .doc(event._id)
  .update({
    data:{
      history : _.push({date,review_finished_sum,task_finished_sum})
    }
  })
}