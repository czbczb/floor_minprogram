// pages/index/index.js
const mockData = require('../../utils/mockData.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    categories: [],
    bannerProducts: [],
    searchValue: '',
    showLoginModal: false,
    loginCallback: null,
    isLoggedIn: false,
    userInfo: null
  },

  onLoad() {
    this.loadData()
    this.checkLoginStatus()
  },

  onShow() {
    this.loadData()
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({
      isLoggedIn: !!userInfo,
      userInfo: userInfo
    })
  },

  loadData() {
    this.loadCategories()
    this.loadBannerProducts()
  },

  async loadCategories() {
    try {
      const db = require('../../utils/db.js')
      const res = await db.categoriesDB.getTopLevel()
      
      if (res.data && res.data.length > 0) {
        // 为每个分类获取第一个产品的图片
        const categoriesWithImages = await Promise.all(
          res.data.map(async (cat) => {
            try {
              // 使用新的函数获取包括子分类的产品
              const productRes = await db.productsDB.getByTopCategory(cat._id)
              if (productRes.data && productRes.data.length > 0) {
                const firstProduct = productRes.data[0]
                return {
                  ...cat,
                  image: firstProduct.images && firstProduct.images[0] ? firstProduct.images[0] : cat.image
                }
              }
            } catch (e) {
              console.error('获取产品图片失败', e)
            }
            return {
              ...cat,
              image: cat.image || 'https://picsum.photos/400/200?random=' + Math.random()
            }
          })
        )
        this.setData({ categories: categoriesWithImages })
      } else {
        this.setData({ categories: this.getMockCategories() })
      }
    } catch (err) {
      this.setData({ categories: this.getMockCategories() })
    }
  },

  async loadBannerProducts() {
    try {
      const db = require('../../utils/db.js')
      const res = await db.productsDB.getAll()
      
      if (res.data && res.data.length > 0) {
        const hotProducts = res.data.filter(p => p.isHot)
        this.setData({ bannerProducts: hotProducts })
      } else {
        this.setData({ bannerProducts: this.getMockHotProducts() })
      }
    } catch (err) {
      this.setData({ bannerProducts: this.getMockHotProducts() })
    }
  },

  getMockCategories() {
    const allCategories = mockData.mockCategories
    const level1 = allCategories.filter(c => !c.parentId || c.parentId === '')
    return level1.map((cat, index) => ({
      ...cat,
      image: `https://picsum.photos/400/200?random=${index}`
    }))
  },

  getMockHotProducts() {
    return mockData.mockProducts.filter(p => p.isHot)
  },

  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value })
  },

  onSearch() {
    const keyword = this.data.searchValue.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键字', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}` })
  },

  onCategoryTap() {
    wx.switchTab({ url: '/pages/category/category' })
  },

  // 点击banner产品（需要登录）
  onBannerTap(e) {
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
