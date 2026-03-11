// utils/auth.js - 登录验证工具
const app = getApp()

// 检查是否已登录
const checkLogin = () => {
  return app.globalData.isLoggedIn
}

// 显示登录弹窗
const showLoginModal = (pageInstance, callback) => {
  pageInstance.setData({ showLoginModal: true, loginCallback: callback })
}

// 关闭登录弹窗
const closeLoginModal = (pageInstance) => {
  pageInstance.setData({ showLoginModal: false, loginCallback: null })
}

// 执行登录
const doLogin = (pageInstance) => {
  wx.getUserProfile({
    desc: '用于完善用户资料',
    success: async (userInfoRes) => {
      const userInfo = userInfoRes.userInfo
      
      try {
        // 调用云函数获取或创建用户
        const res = await wx.cloud.callFunction({
          name: 'getUserInfo'
        })
        
        if (res.result && res.result.success) {
          const user = res.result.user
          
          // 更新用户信息
          const db = wx.cloud.database()
          await db.collection('users').where({
            _openid: '{openid}'
          }).update({
            data: {
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl
            }
          })
          
          // 更新全局数据
          app.setUserInfo(user, user.role || 'user')
          
          pageInstance.setData({
            userInfo: userInfo,
            role: user.role || 'user',
            isLoggedIn: true,
            isAdmin: (user.role || 'user') === 'admin'
          })
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          // 执行登录后的回调
          if (pageInstance.data.loginCallback) {
            pageInstance.data.loginCallback()
          }
        }
      } catch (err) {
        console.error('登录失败', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
      
      closeLoginModal(pageInstance)
    },
    fail: () => {
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      })
      closeLoginModal(pageInstance)
    }
  })
}

// 检查登录，如果未登录则弹出登录提示
const checkLoginWithPrompt = (pageInstance, callback) => {
  if (checkLogin()) {
    if (callback) callback()
    return true
  }
  
  // 显示登录弹窗
  showLoginModal(pageInstance, callback)
  return false
}

module.exports = {
  checkLogin,
  checkLoginWithPrompt,
  showLoginModal,
  closeLoginModal,
  doLogin
}
