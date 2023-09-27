// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})


// 云函数入口函数
exports.main = async (event, context) => {
  return await cloud.database().collection('words_to_review').add({
    data: {
      _id: event._id,
      word: event.word,
      trans: event.trans,
      ukphone: event.ukphone,
      startTime: event.startTime,
      review_times: event.review_times,
      currentRvIndex: event.currentRvIndex,
      nextTime: event.nextTime

    }
  })
}