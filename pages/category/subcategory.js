// pages/category/subcategory.js
const mockData = require('../../utils/mockData.js')

Page({
  data: {
    parentId: '',
    parentName: '',
    subCategories: [],
    products: [],
    useMock: true
  },

  onLoad(options) {
    const id = options.id || ''
    const name = decodeURIComponent(options.name || '')
    
    this.setData({
      parentId: id,
      parentName: name
    })
    
    wx.setNavigationBarTitle({
      title: name
    })
    
    this.loadSubCategories()
  },

  loadSubCategories() {
    if (this.data.useMock) {
      const allCategories = mockData.mockCategories
      const subCategories = allCategories.filter(c => c.parentId === this.data.parentId)
      this.setData({ subCategories })
      return
    }

    const db = require('../../utils/db.js')
    db.categoriesDB.getByParentId(this.data.parentId).then(res => {
      this.setData({ subCategories: res.data || [] })
    }).catch(err => {
      console.error('加载子分类失败', err)
    })
  },

  // 点击二级分类，跳转到产品列表
  onSubCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    // 筛选该二级分类下的所有产品（包括子分类的产品）
    this.filterProducts(id)
  },

  filterProducts(categoryId) {
    if (this.data.useMock) {
      const products = mockData.mockProducts.filter(p => 
        p.categoryId === categoryId || 
        (p.categoryPath && p.categoryPath.includes(this.data.parentName) && p.categoryPath.includes(mockData.mockCategories.find(c => c._id === categoryId)?.name || ''))
      )
      this.setData({ products })
      return
    }

    const db = require('../../utils/db.js')
    db.productsDB.getByCategory(categoryId).then(res => {
      this.setData({ products: res.data || [] })
    }).catch(err => {
      console.error('加载产品失败', err)
    })
  },

  // 点击产品进入详情
  onProductTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  }
})
