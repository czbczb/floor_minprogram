// pages/category/category.js
const mockData = require('../../utils/mockData.js')
const auth = require('../../utils/auth.js')

Page({
  data: {
    // 从首页传来的顶级分类ID
    topCategoryId: null,
    topCategoryOrigId: null,
    // 所有一级分类（用于匹配）
    level1Categories: [],
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
    const newTopCategoryOrigId = app.globalData.selectedCategoryOrigId
    console.log('onShow called, selectedCategoryId:', newTopCategoryId, 'origId:', newTopCategoryOrigId)
    
    if (newTopCategoryId || newTopCategoryOrigId) {
      // 清除
      app.globalData.selectedCategoryId = null
      app.globalData.selectedCategoryOrigId = null
      
      // 同时设置两个ID
      this.setData({ 
        topCategoryId: newTopCategoryId || newTopCategoryOrigId,
        topCategoryOrigId: newTopCategoryOrigId
      }, () => {
        console.log('setData callback, topCategoryId:', this.data.topCategoryId, 'topCategoryOrigId:', this.data.topCategoryOrigId)
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
        const level1 = allCategories.filter(c => c.level == 1)
        const level2 = allCategories.filter(c => c.level == 2)
        console.log('加载分类数据, 总数:', allCategories.length, '一级分类:', level1.length, '二级分类:', level2.length)
        console.log('topCategoryId:', this.data.topCategoryId)
        
        this.setData({
          leftCategories: level2,
          allCategories: allCategories,
          level1Categories: level1
        })
        
        // 如果有顶级分类ID，自动选中该分类下的第一个二级分类
        if (this.data.topCategoryId) {
          const topCat = level1.find(c => c._id === this.data.topCategoryId)
          const topCatOrigId = topCat ? topCat.origId : ''
          console.log('查找顶级分类:', this.data.topCategoryId, 'origId:', topCatOrigId)
          
          // 通过parentId匹配来找到对应的二级分类 (parentId === origId)
          const firstSubCat = level2.find(c2 => c2.parentId === topCatOrigId)
          console.log('找到的子分类:', firstSubCat)
          if (firstSubCat) {
            this.selectCategory(firstSubCat)
          } else {
            console.log('未找到子分类，使用默认第一个')
            if (level2.length > 0) {
              this.selectCategory(level2[0])
            }
          }
        } else if (level2.length > 0) {
          // 默认选中第一个
          console.log('无topCategoryId，默认选中第一个')
          this.selectCategory(level2[0])
        }
      } else {
        // 使用mock数据
        this.loadMockData()
      }
    } catch (err) {
      console.log('使用mock分类数据', err)
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
    
    console.log('选中分类:', category._id, category.name, 'origId:', category.origId, 'parentId:', category.parentId)
    
    // 获取分类ID - 优先使用_id（云数据库的_id）
    const categoryId = category._id
    console.log('查询产品, categoryId:', categoryId)
    
    this.setData({ 
      selectedCategory: category,
      leftIndex: this.data.leftCategories.findIndex(c => c._id === category._id)
    })
    
    try {
      const db = require('../../utils/db.js')
      const wxDB = db.db
      
      // 同时按categoryId、origId和categoryPath查询
      const res = await wxDB.collection('products').where(
        wxDB.command.or(
          { categoryId: categoryId },
          { categoryId: category._id },
          { origId: categoryId },
          { categoryPath: wxDB.RegExp({ regexp: category.name, options: 'i' }) }
        )
      ).get()
      
      console.log('产品查询结果:', res.data)
      
      if (res.data && res.data.length > 0) {
        // 转换云存储URL为HTTP URL
        const products = await this.convertCloudUrls(res.data)
        this.setData({ products: products })
        console.log('加载到产品:', products.length)
      } else {
        console.log('没有找到产品，使用mock数据')
        this.loadMockProducts(category)
      }
    } catch (err) {
      console.error('查询产品失败:', err)
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

  // 转换云存储URL为HTTP URL
  async convertCloudUrls(products) {
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      if (product.images && product.images.length > 0) {
        const cloudUrls = product.images.filter(url => url.startsWith('cloud://'))
        if (cloudUrls.length > 0) {
          try {
            const result = await wx.cloud.getTempFileURL({ fileList: cloudUrls })
            if (result.fileList) {
              for (let j = 0; j < result.fileList.length; j++) {
                const file = result.fileList[j]
                if (file.tempFileURL) {
                  product.images[j] = file.tempFileURL
                }
              }
            }
          } catch (e) {
            console.error('转换URL失败:', e)
          }
        }
      }
    }
    return products
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

