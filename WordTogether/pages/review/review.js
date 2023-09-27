var util = require('../../utils/util.js')
let app = getApp();
//关于单词发音
const innerAudioContext = wx.createInnerAudioContext()
innerAudioContext.src = ""
// innerAudioContext.autoplay = true

const times = [1, 2, 4, 7, 15, 30] //应在第1，2，4，7，15，30天复习
Page({
  data: {
    hiedden: false,
    last_word_index: 0, //昨天后今天应开始的单词序号
    today_wordList: [], //今天学习的单词列表 
    wordIndex: 0, //正在背的单词在 today_wordList的序号
    word_recite: {}, //正在背的单词
    trans_list: [], //每个单词的不同词性的释义
    sentence_list: [], //例句
    _id: "",
    word: "",
    trans: [],
    openid: "",
    me: "",
    reviewList: [],
    count: 0,
    reviewfinished: false,
    currenTime: {}, //获取今天的日期
    today_reviewList: [],

  },
  //用户点击认识后
  know() {
    if (this.data.wordIndex == this.data.count - 1) { //最后一个单词
      //openid查询小组数据
      var currentindex = this.data.word_recite.currentRvIndex + 1
      var list = this.data.word_recite.review_times
      //获取该单词的currentRVindex
      wx.cloud.callFunction({ //更改单词的nexttime,currentRVindex
          name: 'updateNextTime',
          data: {
            _id: this.data.word_recite._id,
            currentRvIndex: currentindex,
            nextTime: list[currentindex]
          }
        }).then(res => {
          console.log("云函数更改nexttime成功")
        })
        .catch(res => {
          console.log("云函数更改nexttime失败")
        })

      let db = wx.cloud.database()
      db.collection('team_friend').where({
          openid: this.data.openid
        })
        .get()
        .then(res => {
          this.setData({
            me: res.data[0]._id
          })
          console.log('获取到我的_id,success', this.data.me)
          var historyLength = res.data[0].history.length
          var review_finished_sum = this.data.count
          //云函数更新我的学习状态为已完成
          wx.cloud.callFunction({
              name: 'updateMeStatus',
              data: {
                _id: this.data.me,
                review_finished: true,
                historyLength: historyLength - 1,
                review_finished_sum: review_finished_sum
              }
            }).then(res => {
              console.log("状态更改成功", res)
            })
            .catch(err => {
              console.log("状态更改失败", err)
            })
        })
        .catch(err => {
          console.log('获取到我的_id,fail', err)
        })
      this.setData({
        hidden: false
      })
      wx.switchTab({
        url: '/pages/home/home',
      })  
      wx.showToast({
        title: '今日复习完成！',
        icon: 'success',
        duration: 2000
      })
    } else {
      var currentindex = this.data.word_recite.currentRvIndex + 1
      var list = this.data.word_recite.review_times
      //获取该单词的currentRVindex
      wx.cloud.callFunction({ //更改单词的nexttime,currentRVindex
          name: 'updateNextTime',
          data: {
            _id: this.data.word_recite._id,
            currentRvIndex: currentindex,
            nextTime: list[currentindex]
          }
        }).then(res => {
          console.log("云函数更改nexttime成功")
        })
        .catch(res => {
          console.log("云函数更改nexttime失败")
        })

      this.setData({
        wordIndex: this.data.wordIndex + 1
      })
      let i = this.data.wordIndex
      this.setData({
        word_recite: this.data.reviewList[i],
      })
      this.setData({
        trans_list: this.data.word_recite.trans,
      })
      this.setData({
        hidden: false
      })
    }
  },

  //用户点击忘记后
  foget() {
    if (this.data.wordIndex == this.data.count - 1) {
      //openid查询小组数据
      var currentindex = this.data.word_recite.currentRvIndex + 1
      var list = this.data.word_recite.review_times
      //获取该单词的currentRVindex
      wx.cloud.callFunction({ //更改单词的nexttime,currentRVindex
          name: 'updateNextTime',
          data: {
            _id: this.data.word_recite._id,
            currentRvIndex: currentindex,
            nextTime: list[currentindex]
          }
        }).then(res => {
          console.log("云函数更改nexttime成功")
        })
        .catch(res => {
          console.log("云函数更改nexttime失败")
        })
      let db = wx.cloud.database()
      db.collection('team_friend').where({
          openid: this.data.openid
        })
        .get()
        .then(res => {
          this.setData({
            me: res.data[0]._id
          })
          console.log('获取到我的_id,success', this.data.me)
          var historyLength = res.data[0].history.length
          var review_finished_sum = this.data.count
          //云函数更新我的学习状态为已完成
          wx.cloud.callFunction({
              name: 'updateMeStatus',
              data: {
                _id: this.data.me,
                review_finished: true,
                historyLength: historyLength - 1,
                review_finished_sum: review_finished_sum
              }
            }).then(res => {
              console.log("状态更改成功", res)
            })
            .catch(err => {
              console.log("状态更改失败", err)
            })
        })
        .catch(err => {
          console.log('获取到我的_id,fail', err)
        })
      this.setData({
        hidden: false
      })
      wx.switchTab({
        url: '/pages/home/home',
      })
      wx.showToast({
        title: '今日任务完成啦！',
        icon: 'success',
        duration: 2000
      })
    } else {
      var currentindex = this.data.word_recite.currentRvIndex + 1
      var list = this.data.word_recite.review_times
      //获取该单词的currentRVindex
      wx.cloud.callFunction({ //更改单词的nexttime,currentRVindex
          name: 'updateNextTime',
          data: {
            _id: this.data.word_recite._id,
            currentRvIndex: currentindex,
            nextTime: list[currentindex]
          }
        }).then(res => {
          console.log("云函数更改nexttime成功")
        })
        .catch(res => {
          console.log("云函数更改nexttime失败")
        })
      //继续往下写单词
      this.setData({
        wordIndex: this.data.wordIndex + 1
      })
      let i = this.data.wordIndex
      this.setData({
        word_recite: this.data.reviewList[i],
      })
      this.setData({
        trans_list: this.data.word_recite.trans,
      })
      this.setData({
        hidden: false
      })
    }
  },

  //设置第一个背的单词
  setWord() {
    this.setData({
      word_recite: this.data.reviewList[0],
    })
    this.setData({
      trans_list: this.data.word_recite.trans,
    })
    console.log("正在背的单词是", this.data.word_recite)
  },

  //单词发音
  audio_play: function (data) {
    // innerAudioContext.autoplay = true
    innerAudioContext.src = data.currentTarget.dataset['src']
    innerAudioContext.play()
    innerAudioContext.onPlay(() => {
      console.log('录音播放中');
    })
    innerAudioContext.onStop(() => {
      console.log('录音播放停止');
    })
    innerAudioContext.onEnded(() => {
      console.log('录音播放结束');
    })
  },

  //点击屏幕区域事件
  tapedScreen() {
    console.log("点击了屏幕")
    this.setData({
      hidden: true
    })
  },

  async onLoad(options) {
    wx.getStorage({
      key: 'openid',
      success: res => {
        this.setData({
          openid: res.data
        })
        console.log("openid为", this.data.openid)

      },
      fail: err => {
        console.log("openid获取失败")
      }
    })
    //获取今日日期
    var currenTime = util.formatTime(new Date());
    this.setData({
      currenTime: JSON.parse(JSON.stringify(currenTime, null))
    });
    console.log("今天的日期为", this.data.currenTime)

    //获取今日单词列表
    const db = wx.cloud.database()
    db.collection('words_to_review').where({
        nextTime: this.data.currenTime
      })
      .get()
      .then(res => {
        this.setData({
          today_reviewList: res.data
        })
        console.log('words_to_review列表', this.data.today_reviewList)
      })
      .catch(err => {
        console.log('今日单词复习列表获取失败', err)
      })
    var count = await db.collection('words_to_review').where({
      nextTime: this.data.currenTime
    }).count();
    var count = count.total;
    console.log("今日单词复习列表条数为", count);
    this.setData({
      count: count
    })

    // if (count < 20) {
    //   for (let i = 0; i < count; i += 1) { //自己设置每次获取数据的量
    //     let list = await db.collection('words_to_review').skip(i).get()
    //     alll = alll.concat(list.data);
    //   }
    // } else {

    let m = parseInt(count / 20) * 20
    // 2，通过for循环做多次请求，并把多次请求的数据放到一个数组里
    let alll = []
    for (let i = 0; i < m; i += 20) { //自己设置每次获取数据的量
      let list = await db.collection('words_to_review').where({nextTime: this.data.currenTime }).skip(i).get()
      alll = alll.concat(list.data);
    }
    let list = await db.collection('words_to_review').where({nextTime: this.data.currenTime }).limit(count - m).skip(m).get()
    alll = alll.concat(list.data);
    this.setData({
      reviewList: alll
    })
    // 3,把组装好的数据一次性全部返回
    console.log("返回的结果", this.data.reviewList)
    // }
    var last_word_index = count + 1
    this.setWord()
    //中途退出提示
    wx.enableAlertBeforeUnload({
      message: '现在退出将导致学习数据丢失哦',
      success: () => {
        console.log('success')
      },
      fail: () => {
        console.log('fail')
      },
    })
  },
  onShow: function () {
    this.setData({
      chosedBook_name: app.globalData.chosedBook.bookName,
    })
    console.log("show" + app.globalData.chosedBook.bookName)
  },
  onPullDownRefresh: function () {

  },
})