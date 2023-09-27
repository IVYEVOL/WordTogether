// pages/friend/friend.js
const app = getApp();

Page({
  data: {
    taskNumber: 50, //默认单词任务量
    is_ChooseBook: false, //用户是否选择了词书
    my_info: {},
    team_info: {}, //小组信息
    team_book: {},
    team_members: [],
    changingName: "", //正在修改的小组名
    changedName: "", //确定修改的小组名
    teamid: "", //需更改组名的小组id
    optionList: ['预览', '更改头像'],
    hideFlag: true, //true-隐藏  false-显示
    animationData: {}, 
    hiddenmodalput: true,
    hiddenmodalput2: true,
    is_login: false,
    openid: "",
    ta: "",
    team_info_task: 0, //小组任务量
    team_book: "",
  },

  //--------------------------------创建小组+用户入表------------------------------------
  getopenid() { //获取到机主的openid
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
            this.getMyTeamInfo()
            this.getteam_Info()
          }
        })
      }
    })
  },

  //-----------------------------------创建小组------------------------------------------------
  createTeam() { 
    // console.log("用户openid为", app.globalData.openid)
    let db = wx.cloud.database()
    const oi = app.globalData.openid
    db.collection('team_Info').where({ //查询是否有该openid的小组+没有的话创建小组
        team_creater: oi
      })
      .get()
      .then(res => {
        var team = res.data[0]
        if (!team) { //如果该用户从未创建过小组
          //初始化一个小组
          wx.cloud.callFunction({
              name: 'addTeam',
              data: {
                teamAvatarUrl: '/static/tabbar/team_avatar.png',
                teamName: "我的小组",
                team_book: "新东方四级词汇",
                team_friend_sum: 1,
                team_taskNumber: 20,
                team_creater: app.globalData.openid
              }
            }).then(res => { //请求成功
              console.log("addTeam创建小组成功", res.result._id)
              this.setData({
                teamid: res.result._id
              })

              let db = wx.cloud.database()
              const oi = app.globalData.openid
              db.collection('team_friend').where({ //查询用户表是否有该openid的用户，没有则创建一个
                  openid: oi
                })
                .get()
                .then(res => {
                  // console.log('查询该openid小组为', res.data)
                  this.setData({
                    my_info: res.data[0]
                  })
                  app.globalData.myInfo = res.data[0]
                  // console.log('获取该openid的小组信息成功', this.data.team_info)
                  // console.log('glaobaldata获取该openid的小组信息成功', app.globalData.myInfo)
                  if (!app.globalData.myInfo) {
                    wx.getStorage({ //得到用户信息+初始化用户入表
                      key: 'user',
                      success: res => {
                        console.log("用户信息获取成功", res.data)
                        let user = res.data
                        wx.cloud.callFunction({ //用户初始化入库
                            name: 'addTeamMember',
                            data: {
                              imageurl: user.avatarUrl,
                              name: user.nickName,
                              openid: app.globalData.openid,
                              task_finished: false,
                              team_id: this.data.teamid,
                              history: [],
                              lastLogin: "",
                              tomorrowIndex: 0,
                              review_finished: false,
                            }
                          }).then(res => { //请求成功
                            console.log("初始化用户入库成功", res)
                          })
                          .catch(err => { //请求失败
                            console.log("初始化用户入库失败", err)
                          })
                      },
                      fail: err => {
                        console.log("用户信息获取失败")
                      }
                    })
                  } else {
                    console.log("用户已存在用户表中,无需再入库")
                  }
                })
                .catch(err => {
                  console.log('openid查询是否有该用户的小组失败', err)
                })
              wx.showToast({
                title: '创建小组成功',
                icon: 'none',
                duration: 1500,
              })
            })
            .catch(err => { //请求失败
              console.log("addTeam创建小组失败", err)
            })
        } else {
          wx.showToast({ //如果该用户创建过小组
            title: '你已经有一个小组',
            icon: 'none',
            duration: 1500,
          })
        }
      })
      .catch(err => {
        console.log('获取该openid的小组信息失败', err)
      })
  },

  //-----------------------------------退出小组------------------------------------------------
  quitTeam() {
    if (app.globalData.teamInfo.team_creater == app.globalData.openid) { //用户在自己组中
      wx.showToast({
        title: '已经在自己组中啦',
        icon: 'none'
      })
    } else if (!app.globalData.teamInfo) {
      wx.showToast({
        title: '请先创建一个小组',
        icon: 'none'
      })
    } else { 
      //退出后重置全局小组信息
      let db = wx.cloud.database()
      const oi = app.globalData.openid
      db.collection('team_Info').where({
          team_creater: oi
        })
        .get()
        .then(res => {
          // console.log('查询该openid小组为', res.data)
          this.setData({
            team_info: res.data[0]
          })
          app.globalData.teamInfo = res.data[0]
          // console.log('获取该openid的小组信息成功', this.data.team_info)
          console.log('退出小组，现在的小组为', app.globalData.teamInfo)
          //云函数更新我的所属小组id
          wx.cloud.callFunction({
              name: 'updateMeTeam',
              data: {
                _id: app.globalData.myInfo._id,
                team_id: app.globalData.teamInfo._id
              }
            }).then(res => {
              console.log("所属小组更改成功", res)
              wx.showToast({
                title: '退出小组成功',
                icon: 'none'
              })
              wx.startPullDownRefresh()
              wx.stopPullDownRefresh()
            })
            .catch(err => {
              console.log("所属小组更改失败", err)
            })
        })
        .catch(err => {
          console.log('获取该openid的小组信息失败', err)
        })
    }
  },

  //----------------------------------更改小组名------------------------------------------
  //获取用户输入的小组名
  toChangeName: function (e) {
    console.log(e.detail.value)
    this.setData({
      changingName: e.detail.value
    })
  },

  //用户点击取消更改小组名
  modalinput: function (e) {
    console.log(e.currentTarget.dataset.teamid)
    this.setData({
      //注意到模态框的取消按钮也是绑定的这个函数，所以这里直接取反hiddenmodalput，也是没有毛病
      hiddenmodalput: !this.data.hiddenmodalput,
    })
  },
  //用户点击确认更改小组名后
  confirmName: function () {
    hiddenmodalput: !this.data.hiddenmodalput
    this.setData({
      changedName: this.data.changingName
    })
    //云函数更新组名
    wx.cloud.callFunction({
      name: 'updateTeamName',
      data: {
        teamid: this.data.teamid,
        teamname: this.data.changedName
      }
    }).then(res => {
      console.log("小组改名成功")
      wx.showToast({
        title: '小组改名成功',
        duration: 1500,
      })
      wx.startPullDownRefresh() //及时刷新
      wx.stopPullDownRefresh()
    })
    .catch(err => {
      console.log("小组改名失败", err)
    })
    this.setData({
      hiddenmodalput: !this.data.hiddenmodalput,
    })
  },

  //----------------------------用户更改小组任务量-------------------------------------------
  //获取用户输入的任务量
  toChangeTasknumber: function (e) {
    console.log(e.detail.value)
    this.setData({
      taskNumber: e.detail.value
    })
  },

  //用户点击取消更改任务量
  modalinput2: function (e) {
    console.log(e.currentTarget.dataset.teamid)
    this.setData({
      //注意到模态框的取消按钮也是绑定的这个函数，所以这里直接取反hiddenmodalput，也是没有毛病
      hiddenmodalput2: !this.data.hiddenmodalput2,
      teamid: e.currentTarget.dataset.teamid
    })
  },
  //用户点击确认更改任务量后
  confirmTaskNumber: function () {
    hiddenmodalput2: !this.data.hiddenmodalput2

    this.setData({
      taskNumber: parseInt(this.data.taskNumber)
    })
    //云函数更新任务量
    wx.cloud.callFunction({
      name: 'updateTaskNumber',
      data: {
        teamid: this.data.teamid,
        team_taskNumber: this.data.taskNumber
      }
    }).then(res => {
      app.globalData.task_Number = this.data.taskNumber //设置globaldata
      console.log("云函数更改任务量成功，globaldata为" + app.globalData.task_Number)
      wx.showToast({
        title: '更改任务量成功',
        duration: 1500
      })
      wx.startPullDownRefresh()
      wx.stopPullDownRefresh()
    })
    .catch(res => {
      console.log("云函数更改任务量失败")
    })
    this.setData({
      hiddenmodalput2: !this.data.hiddenmodalput2,
    })
  },

  //-------------------------------选择词汇书----------------------------------------
  clickBook: function (e) {
    console.log(e);
    wx.navigateTo({
      url: '/pages/books/books',
    })
  },

  // --------------------------------下拉模态框--更改头像-------------------------------------
  getOption: function (e) {
    console.log(e.currentTarget.dataset.value)
    var value = e.currentTarget.dataset.value
    if (value == '预览') { //预览群头像
      wx.previewImage({
        current: this.data.team_info.teamAvatarUrl, // 当前显示图片的http链接
        urls: [this.data.team_info.teamAvatarUrl] // 需要预览的图片http链接列表
      })
      var that = this;
      that.hideModal();
    } else if (value == '更改头像') {
      //第一步：选择图片
      console.log("点击选择图片")
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        //第二步：上传图片
        success: res => {
          const temFile = res.tempFilePaths[0]
          console.log("上传图片的临时路径", temFile)
          let mycloudenv = 'https://636c-cloud1-2g6712kfa7e060fe-1310140738.tcb.qcloud.la/'
          let cloudpath = 'team_avatar/' + app.globalData.openid + '/' + new Date().getTime() + '.jpg'
          wx.cloud.uploadFile({
            cloudPath: cloudpath,
            filePath: temFile,
            success: res => {
              console.log("上传成功", res.fileID)
            },
            fail(err) {
              console.log("上传失败", err)
            }
          })
          //更改小组头像路径
          wx.cloud.callFunction({
              name: 'updateTeamImage',
              data: {
                teamid: this.data.teamid,
                teamAvatarUrl: mycloudenv + cloudpath
              }
            }).then(res => {
              console.log("云函数更改小组头像成功", res)
            })
            .catch(err => {
              console.log("云函数更改小组头像失败", err)
            })
          wx.startPullDownRefresh()
          wx.stopPullDownRefresh()
        }
      })
      var that = this;
      that.hideModal();
    }
  },
  //取消
  mCancel: function () {
    var that = this;
    that.hideModal();
  },
  // 显示遮罩层
  showModal: function () {
    var that = this;
    that.setData({
      hideFlag: false
    })
    // 创建动画实例
    var animation = wx.createAnimation({
      duration: 400, //动画的持续时间
      timingFunction: 'ease', //动画的效果 默认值是linear->匀速，ease->动画以低速开始，然后加快，在结束前变慢
    })
    this.animation = animation; //将animation变量赋值给当前动画
    var time1 = setTimeout(function () {
      that.slideIn(); //调用动画--滑入
      clearTimeout(time1);
      time1 = null;
    }, 100)
  },

  // 隐藏遮罩层
  hideModal: function () {
    var that = this;
    var animation = wx.createAnimation({
      duration: 400, //动画的持续时间 默认400ms
      timingFunction: 'ease', //动画的效果 默认值是linear
    })
    this.animation = animation
    that.slideDown(); //调用动画--滑出
    var time1 = setTimeout(function () {
      that.setData({
        hideFlag: true
      })
      clearTimeout(time1);
      time1 = null;
    }, 220) //先执行下滑动画，再隐藏模块

  },
  //动画 -- 滑入
  slideIn: function () {
    this.animation.translateY(0).step() // 在y轴偏移，然后用step()完成一个动画
    this.setData({
      //动画实例的export方法导出动画数据传递给组件的animation属性
      animationData: this.animation.export()
    })
  },
  //动画 -- 滑出
  slideDown: function () {
    this.animation.translateY(300).step()
    this.setData({
      animationData: this.animation.export(),
    })
  },
  //获取openid小组信息
  getteam_Info() {
    let db = wx.cloud.database()
    const oi = app.globalData.openid
    //openid查询用户所属小组
    db.collection('team_friend').where({
        openid: oi
      })
      .get()
      .then(res => {
        console.log('用户所属小组ID', res.data[0].team_id)
        app.globalData.myInfo = res.data[0]
        // console.log('用户所属小组信息获取成功', app.globalData.myInfo)
        wx.setStorage({ //设置全局小组
          key: "team",
          data: app.globalData.myInfo
        })

        //id查询小组数据
        db.collection('team_Info').where({
            _id: app.globalData.myInfo.team_id
          })
          .get()
          .then(res => {
            // console.log('id查询小组数据成功', res.data)
            wx.stopPullDownRefresh() //结束刷新
            this.setData({
              team_info: res.data[0]
            })
            app.globalData.teamInfo = res.data[0]
            // console.log('page获取该openid的小组信息成功', this.data.team_info)
            // console.log('globalData获取该openid的小组信息成功', app.globalData.teamInfo)
            wx.setStorage({ //设置全局小组
              key: "team",
              data: this.data.team_info
            })
            this.getFriendList()
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
            console.log('获取小组词汇书信息成功', this.data.team_book.bookName)
            console.log('获取小组词汇书信息成功', this.data.team_book.sum)
          })
          .catch(err => {
            console.log('获取小组词汇书信息失败', err)
          })
      })
      .catch(err => {
        console.log('获取该openid的小组信息失败', err)
      })
  },

  //----------------------------复制小组Id给好友------------------------------------
  copyTeamId() {
    console.log("复制的内容为", this.data.teamid)
    if (this.data.teamid == '') {
      wx.showToast({
        title: '暂无小组ID',
        icon: 'none',
        duration: 1500,
      });
    } else {
      //复制的方法
      wx.setClipboardData({
        //要复制的数据
        data: this.data.teamid,
        success: function (res) {
          wx.showToast({
            title: '小组ID复制成功,快去分享给好友吧',
            icon: 'none',
            duration: 2000,
          });
        }
      });
    }
  },
  //----------------------------获取小组成员列表------------------------------------
  getFriendList() {
    wx.getStorage({ //得到小组的_id
      key: 'team',
      success: res => {
        this.setData({
          teamid: res.data._id
        })
        console.log("小组_id获取成功", this.data.teamid)
        //获取该小组的成员列表
        let db = wx.cloud.database()
        const oi = this.data.teamid
        //openid查询小组数据
        db.collection('team_friend').where({
            team_id: oi
          })
          .get()
          .then(res => {
            this.setData({
              team_members: res.data
            })
            console.log('获取该小组的成员列表成功', this.data.team_members)
          })
          .catch(err => {
            console.log('获取该小组的成员列表失败', err)
          })
      },
      fail: err => {
        console.log("小组_id获取失败")
      }
    })
  },

  //------------------------搜索小组并加入小组------------------------------
  joinTeam() {
    wx.navigateTo({
      url: '/pages/search/search',
    })
  },

  getMyTeamInfo() { //获取我的入库信息
    let db = wx.cloud.database()
    const oi = app.globalData.openid
    db.collection('team_friend').where({
        openid: oi
      })
      .get()
      .then(res => {
        // console.log('查询该openid小组为', res.data)
        this.setData({
          my_info: res.data[0]
        })
        app.globalData.myInfo = res.data[0]
        // console.log('glaobaldata获取该机主小组信息成功', app.globalData.myInfo)
      })
      .catch(err => {
        console.log('glaobaldata获取该机主小组信息失败', err)
      })
  },

  onLoad(options) {
    this.getopenid()

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
        console.log("本机主openid为", this.data.openid)
      },
      fail: err => {
        console.log("openid获取失败")
      }
    })

    wx.getStorage({ //获取小组的每日单词量+词汇书
      key: 'team',
      success: res => {
        //获取小组book名
        this.setData({
          team_info_task: res.data.team_taskNumber,
          team_book: res.data.team_book
        })
        console.log("小组_id获取成功?", res.data._id)
        console.log("小组task获取成功?", this.data.team_info_task)
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
    // console.log("openid为", this.data.openid)
  },

  onShow: function () {
    this.getteam_Info()
    // wx.startPullDownRefresh()
    // wx.stopPullDownRefresh()

    this.setData({
      chosedBook_name: app.globalData.chosedBook.bookName,
      chosedBook_sum: app.globalData.chosedBook.sum,
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
  },

  onPullDownRefresh: function () {
    console.log("好友界面下拉刷新一次")
    this.getteam_Info()
    this.getFriendList()
  },
})