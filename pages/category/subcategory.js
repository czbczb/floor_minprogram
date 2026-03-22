// pages/category/subcategory.js
const mockData = require('../../utils/mockData.js')

Page({
  data: {
    parentId: '',
    parentOrigId: '',
    parentName: '',
    subCategories: [],
    products: [],
    useMock: false
  },

  onLoad(options) {
    const id = options.id || ''
    const origId = options.origId || options.id || ''
    const name = decodeURIComponent(options.name || '')
    
    console.log('subcategory onLoad:', { id, origId, name })
    
    this.setData({
      parentId: id,
      parentOrigId: origId,
      parentName: name
    })
    
    wx.setNavigationBarTitle({
      title: name
    })
    
    this.loadSubCategories()
  },

  async loadSubCategories() {
    if (this.data.useMock) {
      const allCategories = mockData.mockCategories
      const subCategories = allCategories.filter(c => c.parentId === this.data.parentId)
      this.setData({ subCategories })
      return
    }

    const db = require('../../utils/db.js')
    const wxDB = db.db
    
    try {
      // 同时按parentId和parentOrigId查询
      const res = await wxDB.collection('categories').where(
        wxDB.command.or(
          { parentId: this.data.parentId },
          { parentOrigId: this.data.parentOrigId },
          { parentId: this.data.parentOrigId }
        )
      ).get()
      
      console.log('子分类查询结果:', res.data)
      
      if (res.data && res.data.length > 0) {
        // 转换云存储URL
        const subCategories = await this.convertCloudUrls(res.data)
        this.setData({ subCategories })
        
        // 如果有子分类，自动选中第一个
        if (subCategories.length > 0) {
          this.filterProducts(subCategories[0]._id, subCategories[0])
        }
      } else {
        console.log('没有找到子分类，使用mock数据')
        const allCategories = mockData.mockCategories
        const subCategories = allCategories.filter(c => c.parentId === this.data.parentId)
        this.setData({ subCategories })
      }
    } catch (err) {
      console.error('加载子分类失败', err)
    }
  },

  // 转换云存储URL为HTTP URL
  async convertCloudUrls(items) {
    if (!items || items.length === 0) return items
    
    const promises = items.map(async item => {
      const newItem = { ...item }
      
      // 转换图片URL
      if (newItem.image && newItem.image.startsWith('cloud://')) {
        try {
          const httpUrl = await this.getTempFileURL(newItem.image)
          newItem.image = httpUrl
        } catch (err) {
          console.error('转换图片URL失败:', err)
        }
      }
      
      // 转换图标URL
      if (newItem.icon && newItem.icon.startsWith('cloud://')) {
        try {
          const httpUrl = await this.getTempFileURL(newItem.icon)
          newItem.icon = httpUrl
        } catch (err) {
          console.error('转换图标URL失败:', err)
        }
      }
      
      return newItem
    })
    
    return Promise.all(promises)
  },

  // 获取临时文件URL
  getTempFileURL(cloudPath) {
    return new Promise((resolve, reject) => {
      wx.cloud.getTempFileURL({
        fileList: [cloudPath],
        success: res => {
          if (res.fileList && res.fileList[0]) {
            resolve(res.fileList[0].tempFileURL)
          } else {
            reject(new Error('获取文件URL失败'))
          }
        },
        fail: reject
      })
    })
  },

  // 点击二级分类，跳转到产品列表
  onSubCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    // 获取完整分类对象
    const category = this.data.subCategories.find(c => c._id === id)
    // 筛选该二级分类下的所有产品（包括子分类的产品）
    this.filterProducts(id, category)
  },

  async filterProducts(categoryId, category) {
    if (this.data.useMock) {
      const products = mockData.mockProducts.filter(p => 
        p.categoryId === categoryId || 
        (p.categoryPath && p.categoryPath.includes(this.data.parentName) && p.categoryPath.includes(mockData.mockCategories.find(c => c._id === categoryId)?.name || ''))
      )
      this.setData({ products })
      return
    }

    const db = require('../../utils/db.js')
    const wxDB = db.db
    
    // 获取分类的origId
    const categoryOrigId = category?.origId || categoryId
    
    try {
      // 同时按categoryId和origId查询
      const res = await wxDB.collection('products').where(
        wxDB.command.or(
          { categoryId: categoryId },
          { categoryId: categoryOrigId },
          { origId: categoryId },
          { origId: categoryOrigId }
        )
      ).get()
      
      console.log('产品查询结果:', res.data)
      
      if (res.data && res.data.length > 0) {
        // 转换云存储URL
        const products = await this.convertCloudUrls(res.data)
        this.setData({ products })
      } else {
        console.log('没有找到产品')
        this.setData({ products: [] })
      }
    } catch (err) {
      console.error('加载产品失败', err)
    }
  },

  // 点击产品进入详情
  onProductTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  }
})
