var util = require('../../utils/util.js')
let app = getApp();
Page({
  data: {
    is_login: false,
    team_info_task: 0,
    team_book: "",
    bookid: "",
    team_info: {}, //小组信息
    team_book: {},
    openid: "",
    mestatus: false, //学习任务是否完成
    reviewfinished: false, //复习任务是否完成
    myStatus: {},


    history: [{
      date: "",
      task_finished_sum: 0,
      review_finished_sum: 0
    }],
    tomorrowIndex: 0,
    currenTime: "", //今天的日期
    count: 0,
  },

  toLearnWord() {
    if (this.data.mestatus) { //如果已经背完
      wx.showToast({
        title: '今天学习任务已经完成啦',
        icon: 'none'
      })
    } else {
      wx.navigateTo({
        url: '/pages/index/index?bookid=' + this.data.bookid + '&tomorrowIndex=' + this.data.tomorrowIndex,
      })
    }

  },

  toReviewWord() {
    if (this.data.reviewfinished) {
      wx.showToast({
        title: '今天复习任务已经完成啦',
        icon: 'none'
      })
    } else if(this.data.count == 0){
      wx.showToast({
        title: '今天没有要复习的单词',
        icon: 'none'
      })
    }
    else {
      wx.navigateTo({
        url: '/pages/review/review',
      })
    }

  },

  //获取openid小组信息
  getteam_Info() {
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
    let db = wx.cloud.database()
    const oi = this.data.openid
    //openid查询小组数据
    db.collection('team_Info').where({
        team_creater: oi
      })
      .get()
      .then(res => {
        // console.log('刷新单条数据成功', res.data)
        wx.stopPullDownRefresh() //结束刷新
        this.setData({
          team_info: res.data[0]
        })
      })
      .catch(err => {
        console.log('获取该openid的小组信息失败', err)
      })

    //查询本书数据
    db.collection('allBooks').where({
        bookName: this.data.team_info.team_book
      })
      .get()
      .then(res => {
        this.setData({
          team_book: res.data[0]
        })
        // console.log('获取小组词汇书信息成功', this.data.team_book.bookName)
        // console.log('获取小组词汇书信息成功', this.data.team_book.sum)
      })
      .catch(err => {
        console.log('获取小组词汇书信息失败', err)
      })
  },

  getMestatus() { //获取我是否已经完成的状态
    wx.getStorage({
      key: 'openid',
      success: res => {
        this.setData({
          openid: res.data
        })
        //获取我的_id
        let db = wx.cloud.database()
        db.collection('team_friend').where({
            openid: this.data.openid
          })
          .get()
          .then(res => {
            this.setData({
              mestatus: res.data[0].task_finished,
              reviewfinished : res.data[0].review_finished
            })
            console.log('openid', this.data.openid)
            console.log('获取到我的状态,success', this.data.mestatus)

          })
          .catch(err => {
            console.log('获取到我的状态,fail', err)
          })
      },
      fail: err => {
        console.log("openid获取失败")
      }
    })
  },

 async onLoad(options) {
    wx.startPullDownRefresh() //启动刷新
    wx.stopPullDownRefresh()
    // console.log("reviewfinished状态为", this.data.reviewfinished)
    // console.log('mestatus状态为', this.data.mestatus)

    //获取我的task_finished和review_finished状态
    wx.getStorage({
      key: 'openid',
      success: res => {
        this.setData({
          openid: res.data
        })
        //获取用户的tomorrowIndex
        let db = wx.cloud.database()
        db.collection('team_friend').where({
            openid: this.data.openid
          })
          .get()
          .then(res => {
            this.setData({
              tomorrowIndex: res.data[0].tomorrowIndex,
              myStatus: res.data[0]
            })
            console.log('获取到我的信息', this.data.myStatus)
            console.log('获取到tomorrowIndex', this.data.tomorrowIndex)
            this.setData({
              mestatus: this.data.myStatus.task_finished,
            })
            this.setData({
              reviewfinished: this.data.myStatus.review_finished
            })
            console.log('学习任务是否完成', this.data.mestatus)
            console.log('复习任务是否完成', this.data.reviewfinished)

            var currenTime = util.formatTime(new Date());
            this.setData({
              currenTime: JSON.parse(JSON.stringify(currenTime, null))
            });
            console.log("今天的日期为", this.data.currenTime)
            if (this.data.myStatus.lastLogin == this.data.currenTime) { //防止重复创建history
            } else {
              //云函数更新小组history
              wx.cloud.callFunction({
                  name: 'addHistory',
                  data: {
                    _id: this.data.myStatus._id,
                    date: this.data.currenTime,
                    review_finished_sum: 0,
                    task_finished_sum: 0
                  }
                }).then(res => {
                  console.log("云函数增加history成功")
                  //云函数更新我的lastLogin
                  wx.cloud.callFunction({
                      name: 'updateMeStatus',
                      data: {
                        _id: this.data.myStatus._id,
                        lastLogin: this.data.currenTime,
                        review_finished: false,
                        task_finished: false
                      }
                    }).then(res => {
                      console.log("更新我的lastLogin成功", res)
                    })
                    .catch(err => {
                      console.log("更新我的lastLogin失败", err)
                    })
                })
                .catch(res => {
                  console.log("云函数增加history失败")
                })
            }
          })
          .catch(err => {
            console.log(err)
          })
      },
      fail: err => {
        console.log("openid获取失败")
      }
    })

    wx.getStorage({
      key: 'isLogin',
      success: res => {
        this.setData({
          is_login: res.data
        })
        console.log("登陆状态为", this.data.is_login)
      },
      fail: err => {
        console.log("登陆状态获取失败")
      }
    })

    wx.getStorage({ //获取小组的每日单词量+词汇书
      key: 'team',
      success: res => {
        //从全局小组获取小组book名
        this.setData({
          team_info_task: res.data.team_taskNumber,
          team_book: res.data.team_book
        })
        console.log("小组_id获取成功?", this.data.team_info_task)
        console.log("小组book获取成功?", this.data.team_book)

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
    this.getMestatus()

     //获取今日日期
     var currenTime = util.formatTime(new Date());
     this.setData({
       currenTime: JSON.parse(JSON.stringify(currenTime, null))
     });
     console.log("今天的日期为", this.data.currenTime)
     //获取今日单词列表
     let db = wx.cloud.database()
     var count = await db.collection('words_to_review').where({
       nextTime: this.data.currenTime
     }).count();
     var count = count.total;
     console.log("今日单词复习列表条数为", count);
     this.setData({
       count: count
     })
  },

  onShow: function () {
    wx.startPullDownRefresh() //启动刷新
    wx.stopPullDownRefresh()
    wx.getStorage({
      key: 'isLogin',
      success: res => {
        this.setData({
          is_login: res.data
        })
        console.log("登陆状态为", this.data.is_login)
      },
      fail: err => {
        console.log("登陆状态获取失败")
      }
    })

    wx.getStorage({
      key: 'openid',
      success: res => {
        this.setData({
          openid: res.data
        })
        //获取用户的tomorrowIndex
        let db = wx.cloud.database()
        db.collection('team_friend').where({
            openid: this.data.openid
          })
          .get()
          .then(res => {
            console.log('获取到我的信息', this.data.myStatus)
            console.log('获取到tomorrowIndex', this.data.tomorrowIndex)
            this.setData({
              mestatus: this.data.myStatus.task_finished,
            })
            this.setData({
              reviewfinished: this.data.myStatus.review_finished
            })
            console.log('学习任务是否完成', this.data.mestatus)
            console.log('复习任务是否完成', this.data.reviewfinished)

          })
          .catch(err => {
            console.log(err)
          })
      },
      fail: err => {
        console.log("openid获取失败")
      }
    })

    this.getMestatus()
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("好友界面下拉刷新一次")
    this.getteam_Info()
    this.getMestatus()
    wx.getStorage({ //获取小组的每日单词量+词汇书
      key: 'team',
      success: res => {
        //从全局小组获取小组book名
        this.setData({
          team_info_task: res.data.team_taskNumber,
          team_book: res.data.team_book
        })
        console.log("小组_id获取成功?", this.data.team_info_task)
        console.log("小组book获取成功?", this.data.team_book)

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

  },
})