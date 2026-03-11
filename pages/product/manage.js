// pages/product/manage.js
const app = getApp()
const db = require('../../utils/db.js')

Page({
  data: {
    products: [],
    loading: true,
    showEditModal: false,
    editingProduct: null,
    
    // 表单数据
    formData: {
      name: '',
      description: '',
      categoryId: '',
      categoryPath: '',
      specifications: [],
      images: [],
      detailImages: [],
      price: 0,
      isHot: false
    },
    
    // 分类选择
    categories: [],
    categoryLevels: [[], [], [], []],
    categoryIndex: [0, 0, 0, 0],
    
    // 规格
    specName: '',
    specValue: '',
    
    // 上传的图片
    tempImages: [],
    tempDetailImages: []
  },

  onLoad() {
    this.checkPermission()
    this.loadCategories()
    this.loadProducts()
  },

  checkPermission() {
    if (!app.isAdmin()) {
      wx.showModal({
        title: '提示',
        content: '您没有管理权限',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
    }
  },

  async loadCategories() {
    try {
      const res = await db.categoriesDB.getAll()
      const categories = res.data || []
      this.setData({ categories })
      this.buildCategoryLevels(categories)
    } catch (err) {
      console.error('加载分类失败', err)
    }
  },

  buildCategoryLevels(categories) {
    const level1 = categories.filter(c => !c.parentId || c.parentId === '')
    const level2 = level1.length > 0 ? categories.filter(c => c.parentId === level1[0]._id) : []
    const level3 = level2.length > 0 ? categories.filter(c => c.parentId === level2[0]._id) : []
    const level4 = level3.length > 0 ? categories.filter(c => c.parentId === level3[0]._id) : []

    this.setData({
      categoryLevels: [
        level1.map(c => c.name),
        level2.map(c => c.name),
        level3.map(c => c.name),
        level4.map(c => c.name)
      ]
    })
  },

  async loadProducts() {
    try {
      const res = await db.productsDB.getAll()
      this.setData({
        products: res.data || [],
        loading: false
      })
    } catch (err) {
      console.error('加载产品失败', err)
      this.setData({ loading: false })
    }
  },

  onCategoryChange(e) {
    const index = e.detail.value
    this.setData({ categoryIndex: index })
  },

  onCategoryColumnChange(e) {
    const column = e.detail.column
    const value = e.detail.value
    const { categories, categoryLevels, categoryIndex } = this.data
    
    const newIndex = [...categoryIndex]
    newIndex[column] = value
    
    // 更新子级分类
    let parentId = ''
    for (let i = 0; i < column; i++) {
      const levelCategories = this.getLevelCategories(categories, i)
      if (levelCategories.length > newIndex[i]) {
        parentId = levelCategories[newIndex[i]]._id
      }
    }
    
    const currentLevelCategories = this.getLevelCategories(categories, column)
    if (currentLevelCategories.length > value) {
      parentId = currentLevelCategories[value]._id
    }
    
    const children = categories.filter(c => c.parentId === parentId)
    const newLevels = [...categoryLevels]
    
    for (let i = column + 1; i < 4; i++) {
      newLevels[i] = []
    }
    
    if (children.length > 0 && column < 3) {
      newLevels[column + 1] = children.map(c => c.name)
    }
    
    this.setData({
      categoryIndex: newIndex,
      categoryLevels: newLevels
    })
  },

  getLevelCategories(categories, level) {
    if (level === 0) {
      return categories.filter(c => !c.parentId || c.parentId === '')
    }
    
    let parentId = ''
    const { categoryIndex, categoryLevels } = this.data
    
    for (let i = 0; i < level; i++) {
      const levelCategories = this.getLevelCategories(categories, i)
      if (levelCategories.length > categoryIndex[i]) {
        parentId = levelCategories[categoryIndex[i]]._id
      }
    }
    
    return categories.filter(c => c.parentId === parentId)
  },

  getSelectedCategory() {
    const { categories, categoryIndex } = this.data
    let result = null
    
    for (let level = 0; level < 4; level++) {
      const levelCategories = this.getLevelCategories(categories, level)
      if (levelCategories.length > categoryIndex[level]) {
        result = levelCategories[categoryIndex[level]]
      }
    }
    
    return result
  },

  onInputName(e) {
    this.setData({ 'formData.name': e.detail.value })
  },

  onInputDescription(e) {
    this.setData({ 'formData.description': e.detail.value })
  },

  onInputPrice(e) {
    this.setData({ 'formData.price': parseFloat(e.detail.value) || 0 })
  },

  // 切换爆款状态
  onToggleHot(e) {
    this.setData({ 'formData.isHot': e.detail.value })
  },

  onInputSpecName(e) {
    this.setData({ specName: e.detail.value })
  },

  onInputSpecValue(e) {
    this.setData({ specValue: e.detail.value })
  },

  addSpecification() {
    const specName = this.data.specName
    const specValue = this.data.specValue
    
    if (!specName || !specValue) {
      wx.showToast({
        title: '请输入规格名称和值',
        icon: 'none'
      })
      return
    }

    const specifications = [...this.data.formData.specifications]
    specifications.push({ name: specName, value: specValue })
    
    this.setData({
      'formData.specifications': specifications,
      specName: '',
      specValue: ''
    })
  },

  removeSpecification(e) {
    const index = e.currentTarget.dataset.index
    const specifications = [...this.data.formData.specifications]
    specifications.splice(index, 1)
    this.setData({ 'formData.specifications': specifications })
  },

  chooseImages() {
    const maxCount = 9 - this.data.formData.images.length
    if (maxCount <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: maxCount,
      success: (res) => {
        this.setData({
          tempImages: [...this.data.tempImages, ...res.tempFilePaths]
        })
      }
    })
  },

  removeTempImage(e) {
    const index = e.currentTarget.dataset.index
    const tempImages = [...this.data.tempImages]
    tempImages.splice(index, 1)
    this.setData({ tempImages })
  },

  chooseDetailImages() {
    const maxCount = 20 - this.data.formData.detailImages.length
    if (maxCount <= 0) {
      wx.showToast({
        title: '最多上传20张详情图片',
        icon: 'none'
      })
      return
    }

    wx.chooseImage({
      count: maxCount,
      success: (res) => {
        this.setData({
          tempDetailImages: [...this.data.tempDetailImages, ...res.tempFilePaths]
        })
      }
    })
  },

  removeTempDetailImage(e) {
    const index = e.currentTarget.dataset.index
    const tempDetailImages = [...this.data.tempDetailImages]
    tempDetailImages.splice(index, 1)
    this.setData({ tempDetailImages })
  },

  onAddProduct() {
    this.setData({
      showEditModal: true,
      editingProduct: null,
      formData: {
        name: '',
        description: '',
        categoryId: '',
        categoryPath: '',
        specifications: [],
        images: [],
        detailImages: [],
        price: 0
      },
      tempImages: [],
      tempDetailImages: [],
      categoryIndex: [0, 0, 0, 0]
    })
    this.loadCategories()
  },

  onEditProduct(e) {
    const product = e.currentTarget.dataset.product
    
    this.setData({
      showEditModal: true,
      editingProduct: product,
      formData: {
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        categoryPath: product.categoryPath || '',
        specifications: product.specifications || [],
        images: product.images || [],
        detailImages: product.detailImages || [],
        price: product.price || 0,
        isHot: product.isHot || false
      },
      tempImages: [],
      tempDetailImages: []
    })
  },

  onCloseModal() {
    this.setData({
      showEditModal: false,
      editingProduct: null
    })
  },

  async onSaveProduct() {
    const formData = this.data.formData
    
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入产品名称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    try {
      let images = [...formData.images]
      let detailImages = [...formData.detailImages]

      // 上传产品图片
      for (const tempPath of this.data.tempImages) {
        const fileId = await db.storage.uploadImage(tempPath, 'products')
        images.push(fileId)
      }

      // 上传详情图片
      for (const tempPath of this.data.tempDetailImages) {
        const fileId = await db.storage.uploadImage(tempPath, 'details')
        detailImages.push(fileId)
      }

      // 获取分类路径
      const category = this.getSelectedCategory()
      let categoryPath = ''
      if (category) {
        const pathRes = await db.categoriesDB.getCategoryPath(category._id)
        categoryPath = pathRes.map(c => c.name).join(' > ')
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: category ? category._id : '',
        categoryPath: categoryPath,
        specifications: formData.specifications,
        images: images,
        detailImages: detailImages,
        price: formData.price,
        isHot: formData.isHot || false
      }

      if (this.data.editingProduct) {
        // 更新
        await db.productsDB.update(this.data.editingProduct._id, productData)
      } else {
        // 添加
        await db.productsDB.add(productData)
      }

      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })

      this.onCloseModal()
      this.loadProducts()
    } catch (err) {
      console.error('保存产品失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  onDeleteProduct(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该产品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.productsDB.delete(id)
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadProducts()
          } catch (err) {
            console.error('删除产品失败', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
