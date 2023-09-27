let searchkey = ''
let app = getApp();
Page({
  data: {
    searchsuccess: false,
    searchteam: {}
  },
  getSearch(e) {
    console.log(e.detail.value)
    searchkey = e.detail.value
  },

  goSearch() {
    console.log("点击了搜索")
    if (searchkey && searchkey.length > 0) {
      const db = wx.cloud.database()
      db.collection('team_Info').where({
          _id: searchkey
        }).get()
        .then(res => {
          if (res.data[0]) { //搜到有改小组
            console.log("搜索到", res.data[0])
            this.setData({
              searchteam: res.data[0],
              searchsuccess: true
            })
          } else {
            wx.showToast({
              title: '未搜索到该小组',
              duration: 1500,
              icon: 'none'
            })
          }

        })
        .catch(err => {
          console.log("搜索失败", err)
        })
    } else {
      wx.showToast({
        title: '搜索词为空',
        duration: 1500,
        icon: 'none'
      })
    }
  },

  jointeam() {
    console.log(app.globalData.myInfo.team_id)
    console.log(this.data.searchteam._id)
    console.log(app.globalData.openid)
    if (app.globalData.myInfo.team_id == this.data.searchteam._id) {//
      wx.showToast({
        title: '您已经加入这个小组啦',
        icon:'none'
      })
    } else {

    //云函数更新我的所属小组id
    wx.cloud.callFunction({
      name: 'updateMeTeam',
      data: {
        _id: app.globalData.myInfo._id,
        team_id: this.data.searchteam._id
      }
    }).then(res => {
      console.log("所属小组更改成功", res)
      wx.showToast({
        title: '加入这个小组成功',
        icon:'none'
      })
    })
    .catch(err => {
      console.log("所属小组更改失败", err)
    })
    }
  },
  onLoad: function (options) {
    this.setData({
      searchsuccess: false
    })
  },
})