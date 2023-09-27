// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env:'cloud1-2g6712kfa7e060fe'
    })

    // console.log("用户选择的词书为"+ this.globalData.chosedBook.bookName)
    // console.log("用户选择的任务量"+ this.globalData.task_Number)
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    isLogin: false,
    userInfo: null,
    teamInfo:{},//用户的小组
    myInfo:{},//用户的信息
    chosedBook:{},//用户已选择的书
    task_Number:50,
    openid:"",
    history_date:[],
    history_task:[],
    history_review:[]

  
  }
})
