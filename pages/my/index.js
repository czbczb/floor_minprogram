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
    this.checkLoginStatus()
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
          app.clearUserInfo()
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

  // 切换角色（仅管理员可见）
  onSwitchRole() {
    const newRole = this.data.role === 'admin' ? 'user' : 'admin'
    
    wx.showModal({
      title: '切换角色',
      content: `确定要切换为${newRole === 'admin' ? '管理员' : '普通用户'}吗？`,
      success: async (res) => {
        if (res.confirm && this.data.userInfo) {
          try {
            const db = wx.cloud.database()
            await db.collection('users').where({
              _openid: '{openid}'
            }).update({
              data: {
                role: newRole
              }
            })
            
            app.globalData.role = newRole
            wx.setStorageSync('role', newRole)
            
            this.setData({
              role: newRole,
              isAdmin: newRole === 'admin'
            })
            
            wx.showToast({
              title: '角色切换成功',
              icon: 'success'
            })
          } catch (err) {
            console.error('切换角色失败', err)
            wx.showToast({
              title: '切换失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 跳转到分类管理
  onNavigateToCategoryManage() {
    wx.navigateTo({
      url: '/pages/category/manage'
    })
  },

  // 跳转到产品管理
  onNavigateToProductManage() {
    wx.navigateTo({
      url: '/pages/product/manage'
    })
  }
})
