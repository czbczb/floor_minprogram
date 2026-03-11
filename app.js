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

  // 从数据库获取最新角色
  async refreshRole() {
    try {
      // 使用云函数获取当前用户信息（包括最新角色）
      const res = await wx.cloud.callFunction({
        name: 'getUserInfo'
      })
      
      if (res.result && res.result.user) {
        const role = res.result.user.role || 'user'
        
        // 更新全局数据和本地存储
        this.globalData.role = role
        wx.setStorageSync('role', role)
        
        return role
      }
    } catch (err) {
      console.error('刷新角色失败', err)
    }
    return 'user'
  },

  // 检查是否为管理员
  isAdmin() {
    return this.globalData.role === 'admin'
  }
})
