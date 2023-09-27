var util = require('../../utils/util.js')
let app = getApp();
//关于单词发音
const innerAudioContext = wx.createInnerAudioContext()
innerAudioContext.src = ""
// innerAudioContext.autoplay = true

const times = [1, 2, 4, 7, 15, 30] //应在第1，2，4，7，15，30天复习

Page({
  data: {

    list: [],
    today_book: "", //用户选择的书
    last_word_index: 0, //昨天后今天应开始的单词序号
    team_info_task: 0, //小组任务量

    today_wordList: [], //今天学习的单词列表 
    wordIndex: 0, //正在背的单词在 today_wordList的序号
    word_recite: {}, //正在背的单词

    trans_list: [], //每个单词的不同词性的释义
    sentence_list: [], //例句
    chosedBook_name: app.globalData.chosedBook.bookName, //暂代用户最终确定的词书名
    team_book: "",
    bookid: "",

    _id: "",
    word: "",
    trans: [],
    ukphone: "",

    openid: "",
    me: "",

    hiedden: false,
    currenTime: {}, //获取今天的日期
    tomorrowIndex: 0
  },
  //当前日期加天数
  addDate(date, days) {
    //method:'+' || '-'
    //ios不解析带'-'的日期格式，要转成'/'，不然Nan，切记
    var dateVal = date.replace(/-/g, '/');
    var timestamp = Date.parse(dateVal);
    timestamp = timestamp / 1000 + 24 * 60 * 60 * days;

    var n = timestamp;
    var date = new Date(parseInt(n) * 1000);
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    // console.log("复习日期为", y + '/' + m + '/' + d)
    return y + '/' + m + '/' + d
  },

  //用户点击认识后
  know() {
    if (this.data.wordIndex == this.data.team_info_task - 1) { //到达最后一个单词
      //获取该用户openid，把该用户task——finished设置为已完成
      wx.getStorage({
        key: 'openid',
        success: res => {
          this.setData({
            openid: res.data
          })
          console.log("openid为", this.data.openid)
          //获取我的_id
          let db = wx.cloud.database()
          const _ = db.command
          const oi = this.data.openid
          //openid查询小组数据
          db.collection('team_friend').where({
              openid: this.data.openid
            })
            .get()
            .then(res => {
              this.setData({
                me: res.data[0]._id
              })
              console.log('openid', this.data.openid)
              console.log('获取到我的_id,success', this.data.me)
              var historyLength = res.data[0].history.length
              var task_finished_sum = parseInt(this.data.team_info_task)
              //云函数更新我的学习状态为已完成
              wx.cloud.callFunction({
                  name: 'updateMeStatus',
                  data: {
                    _id: this.data.me,
                    task_finished: true,
                    tomorrowIndex: this.data.word_recite.wordRank + 1,
                    historyLength: historyLength - 1,
                    task_finished_sum: task_finished_sum
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
        },
        fail: err => {
          console.log("openid获取失败")
        }
      })
      this.setData({
        hidden: false
      })
      wx.switchTab({
        url: '/pages/home/home',
      })
      wx.showToast({
        title: '今日任务完成啦！',
        icon: 'success'
      })
    } else {
      this.setData({
        wordIndex: this.data.wordIndex + 1
      })
      let i = this.data.wordIndex
      this.setData({
        word_recite: this.data.today_wordList[i],
      })
      this.setData({
        trans_list: this.data.word_recite.content.word.content.trans,
      })
      this.setData({
        hidden: false
      })
    }
    // console.log(this.data.wordIndex)
  },

  //用户点击忘记后
  foget() {
    if (this.data.wordIndex == this.data.team_info_task - 1) {
      //获取该用户openid，把该用户task——finished设置为已完成
      wx.getStorage({
        key: 'openid',
        success: res => {
          this.setData({
            openid: res.data
          })
          console.log("openid为", this.data.openid)

          //获取我的_id
          let db = wx.cloud.database()
          const oi = this.data.openid
          //openid查询小组数据
          db.collection('team_friend').where({
              openid: this.data.openid
            })
            .get()
            .then(res => {
              this.setData({
                me: res.data[0]._id
              })
              console.log('openid', this.data.openid)
              console.log('获取到我的_id,success', this.data.me)
              var historyLength = res.data[0].history.length
              var task_finished_sum = parseInt(this.data.team_info_task)
              //云函数更新我的学习状态为已完成
              wx.cloud.callFunction({
                  name: 'updateMeStatus',
                  data: {
                    _id: this.data.me,
                    task_finished: true,
                    tomorrowIndex: this.data.word_recite.wordRank + 1,
                    historyLength: historyLength - 1,
                    task_finished_sum: task_finished_sum
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

        },
        fail: err => {
          console.log("openid获取失败")
        }
      })
      this.setData({
        hidden: false
      })
      wx.switchTab({
        url: '/pages/home/home',
      })
      wx.showToast({
        title: '今日任务完成啦！',
        icon: 'success'
      })
    } else {
      this.setData({
        _id: this.data.word_recite._id,
        word: this.data.word_recite.headWord,
        trans: this.data.word_recite.content.word.content.trans,
        ukphone: this.data.word_recite.content.word.content.ukphone
      })
      console.log("是这个", this.data.word)

      //设置单词的复习时间数组
      var currenTime = util.formatTime(new Date());
      this.setData({
        currenTime: JSON.parse(JSON.stringify(currenTime, null))
      });
      console.log("今天的日期为", this.data.currenTime)
      let startTime = this.data.currenTime
      var review_times = []
      for (var index in times) {
        // console.log(this.addDate(startTime, times[index]))
        review_times[index] = this.addDate(startTime, times[index])
        console.log("复习日期", review_times[index])
      }
      //将该单词添加到单词复习库中
      wx.cloud.callFunction({
          name: 'addReviewWord',
          data: {
            _id: this.data._id,
            word: this.data.word,
            trans: this.data.trans,
            ukphone: this.data.ukphone,
            startTime: startTime,
            review_times: review_times,
            currentRvIndex: 0,
            nextTime: review_times[0]
          }
        }).then(res => { //请求成功
          console.log("words_to_review数据库添加成功", res)
        })
        .catch(err => { //请求失败
          console.log("words_to_review数据库添加失败", err)
        })
      //继续往下写单词
      this.setData({
        wordIndex: this.data.wordIndex + 1
      })
      let i = this.data.wordIndex
      this.setData({
        word_recite: this.data.today_wordList[i],
      })
      this.setData({
        trans_list: this.data.word_recite.content.word.content.trans,
      })
      this.setData({
        hidden: false
      })
    }
  },

  //设置第一个背的单词
  setWord() {
    this.setData({
      word_recite: this.data.today_wordList[0],
    })
    this.setData({
      trans_list: this.data.word_recite.content.word.content.trans,
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

  tapedScreen() {
    console.log("点击了屏幕")
    this.setData({
      hidden: true
    })
  },
  async onLoad(options) {
    wx.startPullDownRefresh() //启动刷新
    wx.stopPullDownRefresh() //结束刷新
    this.setData({
      chosedBook_name: app.globalData.chosedBook.bookName,
    })

    wx.getStorage({ //得到global小组_id
      key: 'global_bookid',
      success: res => {
        console.log("bookid获取成功", res.data)
      },
      fail: err => {
        console.log("bookid获取失败", err)
      }
    })
    wx.getStorage({ //获取小组的每日单词量+词汇书，并把今天的单词列表构建好
      key: 'team',
      success: res => {
        //获取小组book名
        this.setData({
          team_info_task: res.data.team_taskNumber,
          team_book: res.data.team_book
        })
        console.log("小组_id获取成功", this.data.team_info_task)
        console.log("小组book获取成功", this.data.team_book)

        let db = wx.cloud.database()
        //获取该小组的词汇书的bookId
        db.collection('allBooks').where({
            bookName: this.data.team_book
          })
          .get()
          .then(res => {
            this.setData({
              bookid: res.data[0].bookId
            })
            // console.log('获取该小组的词汇书的bookId,success', res.data)
            console.log('获取该小组的词汇书的bookId', this.data.bookid)

          })
          .catch(err => {
            console.log('获取小组词汇书信息失败', err)
          })
      },
      fail: err => {
        console.log("小组_id获取失败")
      }
    })
    //  console.log("传来的参数为", options.bookid)
    //   console.log("传来的参数为", options.tomorrowIndex)
    console.log("传来的参数为", options)
    this.setData({
      tomorrowIndex: parseInt(options.tomorrowIndex)
    })
    console.log("传来的参数为", this.data.tomorrowIndex)
    //获取今日单词列表
    const db = wx.cloud.database()
    let count = this.data.team_info_task //获取小组每日任务量
    let m = parseInt(count / 20) * 20
    // 2，通过for循环做多次请求，并把多次请求的数据放到一个数组里
    let alll = []
    for (let i = 0; i < m; i += 20) { //自己设置每次获取数据的量
      let list = await db.collection(options.bookid).skip(i + this.data.tomorrowIndex).get()
      alll = alll.concat(list.data);
    }
    let list = await db.collection(options.bookid).limit(count - m).skip(m + this.data.tomorrowIndex).get()
    alll = alll.concat(list.data);
    this.setData({
      today_wordList: alll
    })
    // 3,把组装好的数据一次性全部返回
    console.log("返回的结果", this.data.today_wordList)
    var last_word_index = count + 1
    this.setWord()
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

  audioPlay: function () {
    this.audioCtx.play()
  },
  onReady: function () {

  },
  onShow: function () {
    wx.startPullDownRefresh()
    wx.stopPullDownRefresh()
    this.setData({
      chosedBook_name: app.globalData.chosedBook.bookName,
    })
    console.log("show" + app.globalData.chosedBook.bookName)
  },
  onPullDownRefresh: function () {

  },
})