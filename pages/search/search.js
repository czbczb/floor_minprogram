// pages/search/search.js
const mockData = require('../../utils/mockData.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    keyword: '',
    products: [],
    showLoginModal: false,
    loginCallback: null,
    isLoggedIn: false,
    userInfo: null
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: decodeURIComponent(options.keyword) })
      this.search(this.data.keyword)
    }
    this.checkLoginStatus()
  },

  onShow() {
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({
      isLoggedIn: !!userInfo,
      userInfo: userInfo
    })
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    const keyword = this.data.keyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键字', icon: 'none' })
      return
    }
    this.search(keyword)
  },

  async search(keyword) {
    wx.showLoading({ title: '搜索中...' })
    
    try {
      const db = require('../../utils/db.js')
      const res = await db.productsDB.search(keyword)
      
      if (res.data && res.data.length > 0) {
        this.setData({ products: res.data })
      } else {
        this.setData({ products: this.getMockSearch(keyword) })
      }
    } catch (err) {
      this.setData({ products: this.getMockSearch(keyword) })
    }
    
    wx.hideLoading()
  },

  getMockSearch(keyword) {
    const lower = keyword.toLowerCase()
    return mockData.mockProducts.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.description && p.description.toLowerCase().includes(lower))
    )
  },

  // 点击产品（需要登录）
  onProductTap(e) {
    const id = e.currentTarget.dataset.id
    auth.checkLoginWithPrompt(this, () => {
      wx.navigateTo({ url: `/pages/product/detail?id=${id}` })
    })
  },

  // 关闭登录弹窗
  onCloseLoginModal() {
    this.setData({ showLoginModal: false })
  },

  // 执行登录
  onDoLogin() {
    auth.doLogin(this)
  }
})
