// pages/books/books.js
let app = getApp();
Page({
  data: {
    is_ChooseBook: {}, //用户是否已选择词书
    choosingBook: {}, //用户正在选择的书，接下来进行弹窗确定
    chosedBook: {},
    chosedBook_name: "",
    allBooks: [], //所有词汇书对应的id，中文名
    team_book: "",
    teamid: "",
    en_ch_book: [{
        eng: 'CET4_3',
        ch: '新东方四级词汇'
      },
      {
        eng: 'IELTSluan_2',
        ch: '雅思词汇'
      }
    ]
  },
  //用户点击词书后，弹框请求用户确认
  chooseBook: function (options) {
    var id = options.currentTarget.dataset.id
    //根据id请求某书的具体信息
    wx.cloud.database().collection('allBooks')
      .doc(id)
      .get()
      .then(res => { //请求成功
        this.setData({
          choosingBook: res.data
        })
        console.log("该书请求成功", this.data.choosingBook.bookName)
        //请求成功后弹窗确认是否选择
        wx.showModal({
          cancelColor: 'cancelColor',
          title: '提示',
          content: '确定选择《' + this.data.choosingBook.bookName + "》？",
          showCancel: true, //是否显示取消按钮
          cancelText: "取消", //默认是“取消”
          cancelColor: '#8c8c8c', //取消文字的颜色
          confirmText: "确定", //默认是“确定”
          confirmColor: '#4768ff', //确定文字的颜色
          success: (res) => {
            if (res.confirm) {
              this.setData({
                chosedBook: this.data.choosingBook,
                chosedBook_name: this.data.choosingBook.bookName
              })
              console.log('用户确定任务书为' + '《' + this.data.chosedBook_name + "》")
              wx.switchTab({
                url: '/pages/friend/friend',
              })

              console.log("小组_id获取成功2", this.data.teamid)
              //云函数更新小组任务书
              wx.cloud.callFunction({
                  name: 'updateTeamBook',
                  data: {
                    teamid: this.data.teamid,
                    team_book: this.data.chosedBook_name
                  }
                }).then(res => {
                  console.log("云函数更改小组任务书成功")
                })
                .catch(res => {
                  console.log("云函数更改小组任务书失败")
                })
            } else if (res.cancel) {
              this.setData({})
              console.log('用户点击取消,任务书' )
            }
          }
        })
      })
      .catch(err => { //请求失败
        console.log("该书请求失败", err)
      })
  },

  onLoad: function (options) {
    this.setData({ //判断用户是否选择了词书
      is_ChooseBook: options.is_ChooseBook
    })
    // console.log(this.data.is_ChooseBook)

    //请求allbooks数据库，展示词书库
    wx.cloud.database().collection('allBooks')
      .get()
      .then(res => { //请求成功
        this.setData({
          allBooks: res.data
        })
        console.log("allBooks数据库请求成功", this.data.allBooks)
      })
      .catch(err => { //请求失败
        console.log("allBooks数据库请求失败", err)
      })

      wx.getStorage({ //得到小组的_id
        key: 'team',
        success: res => {
          this.setData({
            teamid: res.data._id
          })
          console.log("小组_id获取成功", this.data.teamid)
        },
        fail: err => {
          console.log("小组_id获取失败")
        }
      })
  },
  onShow: function () {

  },
  onPullDownRefresh: function () {

  },
})