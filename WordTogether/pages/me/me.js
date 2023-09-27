import * as echarts from '../../ec-canvas/echarts';
var util = require('../../utils/util.js')
let app = getApp();

let chart = null;

function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);
  var option = {
    title: {
      text: '历史',
    },
    legend: {
      orient: "vertical",
      right: "8%"
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      data: app.globalData.history_date
    },
    yAxis: {},
    dataZoom: [{
      type: 'slider',
      show: true, //flase直接隐藏图形
      xAxisIndex: [0],
      left: '9%', //滚动条靠左侧的百分比
      bottom: -5,
      start: 0, //滚动条的起始位置
      end: 20 //滚动条的截止位置（按比例分割你的柱状图x轴长度）
    }],
    series: [{
        name: "已学习",
        type: 'bar',
        data: app.globalData.history_task,
        itemStyle: {
          color: '#4768ff',
          shadowColor: '#91cc75',
          borderType: 'dashed',
          opacity: 0.8
        }
      },
      {
        name: "已复习",
        type: 'bar',
        data: app.globalData.history_review,
        itemStyle: {
          color: '#5ECDF0',
          shadowColor: '#91cc75',
          borderType: 'dashed',
          opacity: 0.8
        }
      }
    ]
  };
  chart.setOption(option);
  return chart;
}

Page({
  data: {
    ec: {
      onInit: initChart,
    },
    isLogin: false,
    userInfo2: {},
    userInfo: "", //登陆后用户信息存储在此，并缓存用户信息
    user_Avatar: "",
    defaultImg: "/static/tabbar/default_avatar.png",
    url: "https://636c-cloud1-2g6712kfa7e060fe-1310140738.tcb.qcloud.la/team_avatar.jpg",
    team_info: {},
    teamAvatarUrl: "",
    teamName: "",
    team_book: "",
    team_friend_sum: 0,
    team_taskNumber: 0,
    openid: "default", //登陆用户的openid
    tolearn: 0,
    finished: false,
    count: 0,
    reviewfinished: false,
    currenTime: "",
    history: [],
    history_date: [],
    history_task: [],
    history_review: []
  },

  //登录
  login() {
    wx.getUserProfile({
      desc: '必须授权才可以使用', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: res => {
        let user = res.userInfo
        wx.setStorageSync('user', user) //用户信息缓存到本地
        console.log("授权成功", user)
        this.setData({
          userInfo: user
        })
        this.setData({ //用户创建初始小组
          teamAvatarUrl: "/static/tabbar/team_avatar.png",
          teamName: this.data.userInfo.nickName + "的小组",
          team_book: "雅思词汇",
          team_friend_sum: 1,
          team_taskNumber: 20
        })
        app.globalData.isLogin = true
        wx.setStorage({
          key: "isLogin",
          data: true
        })
        // this.getopenid() //获取用户openid,
      },
      fail: res => {
        console.log("授权失败", res)
      }
    })
  },

  //退出登录
  loginOut() {
    this.setData({
      userInfo: ""
    })
    wx.setStorageSync('user', null) //清空缓存
    app.globalData.isLogin = false
    wx.setStorage({
      key: "isLogin",
      data: false
    })
  },

  //获取到我的openid
  getopenid() {
    wx.login({ //获取code
      success: (res) => {
        console.log(res);
        let code = res.code
        console.log("获取的code为", code);
        //拿code换openid
        wx.request({
          url: `https://api.weixin.qq.com/sns/jscode2session?appid=wx487629d92b71d574&secret=332a4eb7fee8d81e86f884fcd5e1f430&js_code=${code}&grant_type=authorization_code`,
          success: (res) => {
            console.log(res);
            let openid = res.data.openid
            //获取到你的openid
            app.globalData.openid = openid
            this.setData({
              openid: openid
            })
            // console.log("this.data.openid获取的openid为", this.data.openid);
            // console.log("app.globalData.openid获取的openid为", app.globalData.openid);
            wx.setStorage({
              key: "openid",
              data: this.data.openid
            })
          }
        })
      }
    })
  },

  //根据openid查询是否有该用户创建的小组
  getTeamByOpenid() {
    let db = wx.cloud.database()
    const oi = app.globalData.openid
    db.collection('team_Info').where({
        team_creater: oi
      })
      .get()
      .then(res => {
        console.log('查询该openid小组为', res.data)
        wx.stopPullDownRefresh() //结束刷新
        this.setData({
          team_info: res.data[0]
        })
        app.globalData.teamInfo = res.data[0]
        console.log('获取该openid的小组信息成功', this.data.team_info)
        console.log('glaobaldata获取该openid的小组信息成功', this.data.team_info)
      })
      .catch(err => {
        console.log('获取该openid的小组信息失败', err)
      })
  },

  //获取openid小组成员列表信息
  getteam_Info() {
    wx.getStorage({ //得到小组的_id
      key: 'openid',
      success: res => {
        this.setData({
          openid: res.data
        })
        console.log("openid获取成功", this.data.openid)
        let db = wx.cloud.database()
        const oi = this.data.openid
        //获取我的状态+获取team_friend里我的所属team—id
        db.collection('team_friend').where({
            openid: oi
          })
          .get()
          .then(res => {
            let team_id =  res.data[0].team_id
            //根据我的team——id查询小组数据，获取今日待学习
            db.collection('team_Info').doc(team_id)
              .get()
              .then(res => {
                this.setData({
                  tolearn: res.data.team_taskNumber
                })
                console.log('获取该小组任务数量成功2', this.data.tolearn)
              })
              .catch(err => {
                console.log('获取该小组任务数量失败', err)
              })

            this.setData({
              finished: res.data[0].task_finished,
              reviewfinished: res.data[0].review_finished,
              history: res.data[0].history,
              lastLogin: res.data[0].lastLogin
            })
            // console.log('获取到我学习的状态,success', this.data.finished)
            // console.log('获取到我复习的状态,success', this.data.reviewfinished)
            var history_date = []
            var history_task = []
            var history_review = []
            for (let i = 0; i < this.data.history.length; i++) {
              history_date[i] = this.data.history[i].date
              history_task[i] = this.data.history[i].task_finished_sum
              history_review[i] = this.data.history[i].review_finished_sum
            }
            app.globalData.history_date = history_date
            app.globalData.history_task = history_task
            app.globalData.history_review = history_review
            // console.log("history_date", app.globalData.history_date)
            // console.log("history_task", app.globalData.history_task)
            // console.log("history_review", app.globalData.history_review)

          })
          .catch(err => {
            console.log('获取到我的状态，fail', err)
          })
      },
      fail: err => {
        console.log("小组_id获取失败")
      }
    })
  },

  async onLoad(options) {
    this.getopenid()
    wx.setNavigationBarTitle({
      title: '我的',
    })

    let user = wx.getStorageSync('user') //获取缓存
    this.setData({
      userInfo: user,
    })
    this.setData({
      user_Avatar: user.avatarUrl
    })
    // console.log("头像地址为", this.data.user_Avatar)
    // console.log("openid为", this.data.openid)
    this.getteam_Info()

    //获取今日日期
    var currenTime = util.formatTime(new Date());
    this.setData({
      currenTime: JSON.parse(JSON.stringify(currenTime, null))
    });
    console.log("今天的日期为", this.data.currenTime)
    //获取今日单词列表
    const db = wx.cloud.database()
    var count = await db.collection('words_to_review').where({
      nextTime: this.data.currenTime
    }).count();
    var count = count.total;
    console.log("今日单词复习列表条数为", count);
    this.setData({
      count: count
    })
  },

  onReady: function () {
    setTimeout(function () {
      // 获取 chart 实例的方式
      // console.log(chart)
    }, 2000);
  },

  onShow: function () {
    this.getteam_Info()
  },

  onPullDownRefresh() {
    this.getteam_Info()
  },

  onHide: function () {

  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {

  },


  onReachBottom: function () {

  },

  onShareAppMessage: function () {

  }
})