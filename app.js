// app.js
App({
  globalData: {
    userInfo: null,
    role: 'user', // 'admin' 或 'user'
    isLoggedIn: false
  },

  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-7g3e3lht1fd07e84', // 替换为你的云开发环境ID
        traceUser: true,
      })
    }

    // 检查用户登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    const role = wx.getStorageSync('role') || 'user'
    
    if (userInfo) {
      this.globalData.userInfo = userInfo
      this.globalData.role = role
      this.globalData.isLoggedIn = true
    }
  },

  // 设置用户信息
  setUserInfo(userInfo, role) {
    this.globalData.userInfo = userInfo
    this.globalData.role = role
    this.globalData.isLoggedIn = true
    
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('role', role)
  },

  // 清除用户信息（注销）
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.role = 'user'
    this.globalData.isLoggedIn = false
    
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('role')
  },

  // 检查是否为管理员
  isAdmin() {
    return this.globalData.role === 'admin'
  }
})
