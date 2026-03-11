// pages/category/category.js
const mockData = require('../../utils/mockData.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    // 从首页传来的顶级分类ID
    topCategoryId: null,
    // 左侧所有二级分类列表
    leftCategories: [],
    leftIndex: 0,
    // 右侧选中的分类
    selectedCategory: null,
    // 该分类下的产品
    products: [],
    useMock: false,
    // 登录弹窗相关
    showLoginModal: false,
    loginCallback: null,
    isLoggedIn: false,
    userInfo: null
  },

  onLoad() {
    this.loadCategories()
    this.checkLoginStatus()
  },

  onShow() {
    // 检查全局数据中是否有选中的分类
    const app = getApp()
    const newTopCategoryId = app.globalData.selectedCategoryId
    if (newTopCategoryId) {
      app.globalData.selectedCategoryId = null // 清除
      this.setData({ topCategoryId: newTopCategoryId }, () => {
        this.loadCategories()
      })
    } else {
      this.loadCategories()
    }
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({
      isLoggedIn: !!userInfo,
      userInfo: userInfo
    })
  },

  async loadCategories() {
    try {
      const db = require('../../utils/db.js')
      const res = await db.categoriesDB.getAll()
      
      if (res.data && res.data.length > 0) {
        // 有真实数据 - 只获取二级分类（level=2）
        const allCategories = res.data
        const level2 = allCategories.filter(c => c.level == "11")
        console.log('加载分类数据', allCategories)
        console.log('加载分类数据', level2)
        
        this.setData({
          leftCategories: level2,
          allCategories: allCategories
        })
        
        // 如果有顶级分类ID，自动选中该分类下的第一个二级分类
        if (this.data.topCategoryId) {
          const firstSubCat = level2.find(c => c.parentId === this.data.topCategoryId)
          if (firstSubCat) {
            this.selectCategory(firstSubCat)
          }
        } else if (level2.length > 0) {
          // 默认选中第一个
          this.selectCategory(level2[0])
        }
      } else {
        // 使用mock数据
        this.loadMockData()
      }
    } catch (err) {
      console.log('使用mock分类数据')
      this.loadMockData()
    }
  },

  loadMockData() {
    const allCategories = mockData.mockCategories
    const level2 = allCategories.filter(c => c.parentId && c.parentId !== '')
    
    this.setData({
      leftCategories: level2,
      allCategories: allCategories
    })
    
    // 如果有顶级分类ID，自动选中该分类下的第一个二级分类
    if (this.data.topCategoryId) {
      const firstSubCat = level2.find(c => c.parentId === this.data.topCategoryId)
      if (firstSubCat) {
        this.selectCategory(firstSubCat)
      }
    } else if (level2.length > 0) {
      this.selectCategory(level2[0])
    }
  },

  // 点击左侧分类
  onLeftTap(e) {
    const index = e.currentTarget.dataset.index
    const category = this.data.leftCategories[index]
    this.selectCategory(category)
  },

  // 选择分类，加载产品
  async selectCategory(category) {
    if (!category) return
    
    this.setData({ 
      selectedCategory: category,
      leftIndex: this.data.leftCategories.findIndex(c => c._id === category._id)
    })
    
    try {
      const db = require('../../utils/db.js')
      const res = await db.productsDB.getByCategory(category._id)
      
      if (res.data && res.data.length > 0) {
        this.setData({ products: res.data })
      } else {
        this.loadMockProducts(category)
      }
    } catch (err) {
      this.loadMockProducts(category)
    }
  },

  loadMockProducts(category) {
    const products = mockData.mockProducts.filter(p => 
      p.categoryId === category._id ||
      (p.categoryPath && p.categoryPath.includes(category.name))
    )
    this.setData({ products })
  },

  // 点击产品进入详情（需要登录）
  onProductTap(e) {
    const id = e.currentTarget.dataset.id
    auth.checkLoginWithPrompt(this, () => {
      wx.navigateTo({
        url: `/pages/product/detail?id=${id}`
      })
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

