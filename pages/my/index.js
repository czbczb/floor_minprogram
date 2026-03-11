// pages/my/index.js
const app = getApp()
const db = require('../../utils/db.js')

Page({
  data: {
    userInfo: null,
    role: 'user',
    isLoggedIn: false,
    isAdmin: false
  },

  onLoad() {
    this.checkLoginStatus()
  },

  onShow() {
    // 每次显示页面时都检查最新角色
    if (this.data.isLoggedIn) {
      this.fetchLatestRole()
    } else {
      this.checkLoginStatus()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    const role = wx.getStorageSync('role') || 'user'
    
    this.setData({
      userInfo: userInfo,
      role: role,
      isLoggedIn: !!userInfo,
      isAdmin: role === 'admin'
    })
  },

  // 从数据库获取最新角色
  async fetchLatestRole() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo) return
      
      const cloudDb = wx.cloud.database()
      const res = await cloudDb.collection('users').where({
        _openid: '{openid}'
      }).get()
      
      if (res.data && res.data.length > 0) {
        const user = res.data[0]
        const role = user.role || 'user'
        
        // 更新本地存储
        wx.setStorageSync('role', role)
        
        this.setData({
          role: role,
          isAdmin: role === 'admin'
        })
      }
    } catch (err) {
      console.error('获取最新角色失败', err)
    }
  },

  // 微信登录
  async onLogin() {
    // 获取用户信息
    try {
      const userInfoRes = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })
      
      const userInfo = userInfoRes.userInfo
      
      // 调用云函数获取或创建用户
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo'
      })
      
      if (res.result && res.result.success) {
        const user = res.result.user
        
        // 更新用户信息
        if (userInfo.nickName) {
          await this.updateUserInfo(user._openid, {
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl
          })
        }
        
        // 更新全局数据
        app.setUserInfo(user, user.role || 'user')
        
        this.setData({
          userInfo: userInfo,
          role: user.role || 'user',
          isLoggedIn: true,
          isAdmin: (user.role || 'user') === 'admin'
        })
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      }
    } catch (err) {
      console.error('登录失败', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  },

  // 更新用户信息
  async updateUserInfo(openid, data) {
    const db = wx.cloud.database()
    await db.collection('users').where({
      _openid: openid
    }).update({
      data: data
    })
  },

  // 注销登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要注销登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('role')
          
          // 重置页面数据
          this.setData({
            userInfo: null,
            role: 'user',
            isLoggedIn: false,
            isAdmin: false
          })
          
          wx.showToast({
            title: '已注销',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到分类管理
  onCategoryManage() {
    wx.navigateTo({
      url: '/pages/category/manage'
    })
  },

  // 跳转到产品管理
  onProductManage() {
    wx.navigateTo({
      url: '/pages/product/manage'
    })
  }
})
