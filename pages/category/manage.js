// pages/category/manage.js
const app = getApp()
const db = require('../../utils/db.js')

Page({
  data: {
    categories: [],
    loading: true,
    showAddModal: false,
    parentCategory: null,
    newCategoryName: '',
    newCategoryLevel: 1,
    newCategoryImage: '',
    showEditModal: false,
    editingCategory: null,
    editingCategoryLevel: 1,
    editCategoryName: '',
    editCategoryImage: ''
  },

  onLoad() {
    this.checkPermission()
  },

  onShow() {
    this.loadCategories()
  },

  async checkPermission() {
    // 先刷新角色
    const role = await app.refreshRole()
    if (role !== 'admin') {
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
      console.log('加载分类结果:', res.data)
      const allCategories = res.data || []
      
      // 找出所有一级分类和二级分类
      const level1 = allCategories.filter(c => !c.parentId || c.parentId === '')
      const level2 = allCategories.filter(c => c.level == 2)
      
      console.log('总分类数量:', allCategories.length)
      console.log('一级分类数量:', level1.length, '二级分类数量:', level2.length)
      console.log('一级分类origId:', level1.map(c => c.origId))
      console.log('二级分类parentId:', level2.map(c => c.parentId))
      
      // 按父子关系排序 - 使用origId匹配
      const sortedCategories = []
      level1.forEach(l1 => {
        sortedCategories.push(l1)
        
        // 通过parentId匹配: 二级分类的parentId应该等于一级分类的origId
        const children = level2.filter(c2 => c2.parentId === l1.origId)
        
        sortedCategories.push(...children)
      })
      
      console.log('排序后分类数量:', sortedCategories.length)
      
      this.setData({
        categories: sortedCategories,
        allCategories: allCategories,
        loading: false
      })
    } catch (err) {
      console.error('加载分类失败', err)
      this.setData({ loading: false })
    }
  },

  // 显示添加弹窗
  onAddCategory(e) {
    const parentId = e.currentTarget.dataset.parentid || ''
    const level = e.currentTarget.dataset.level || 1
    
    let parentName = ''
    let parentOrigId = ''
    if (parentId) {
      // 查找父分类 - 从allCategories中查找
      const allCategories = this.data.allCategories || []
      const parent = allCategories.find(c => c._id === parentId)
      parentName = parent ? parent.name : ''
      parentOrigId = parent ? parent.origId : ''
    }
    
    this.setData({
      showAddModal: true,
      parentCategory: parentId ? { _id: parentId, name: parentName, origId: parentOrigId } : null,
      newCategoryName: '',
      newCategoryLevel: level,
      newCategoryImage: ''
    })
  },

  // 关闭添加弹窗
  onCloseAddModal() {
    this.setData({
      showAddModal: false,
      newCategoryName: '',
      newCategoryImage: ''
    })
  },

  // 输入新分类名称
  onInputCategoryName(e) {
    this.setData({
      newCategoryName: e.detail.value
    })
  },

  // 选择图片
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          newCategoryImage: res.tempFilePaths[0]
        })
      }
    })
  },

  // 上传图片到云存储
  async uploadImage(imagePath) {
    if (!imagePath) return ''
    
    try {
      const cloudPath = 'category/' + Date.now() + '-' + Math.random().toString(36).substr(2) + '.png'
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: imagePath
      })
      return uploadRes.fileID
    } catch (err) {
      console.error('上传图片失败', err)
      return ''
    }
  },

  // 确认添加分类
  async onConfirmAdd() {
    const name = this.data.newCategoryName.trim()
    if (!name) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      // 上传图片
      let imageUrl = ''
      if (this.data.newCategoryImage) {
        imageUrl = await this.uploadImage(this.data.newCategoryImage)
      }

      const db = wx.cloud.database()
      
      // 构建分类数据
      // 生成origId: 一级分类用 cat_xxx，二级分类用 parentOrigId_xxx
      const newId = 'cat_' + Date.now().toString(36)
      let origId
      let parentOrigId = ''
      
      if (this.data.newCategoryLevel == 1) {
        // 一级分类
        origId = newId
        parentOrigId = ''
      } else {
        // 二级分类: parentOrigId + _ + newId
        parentOrigId = this.data.parentCategory ? this.data.parentCategory.origId : ''
        origId = parentOrigId ? parentOrigId + '_' + newId : newId
      }
      
      const categoryData = {
        origId: origId,
        name: name,
        level: this.data.newCategoryLevel,
        image: imageUrl,
        createTime: new Date()
      }
      
      // 设置父分类ID
      if (this.data.parentCategory) {
        categoryData.parentId = this.data.parentCategory._id
        categoryData.parentOrigId = parentOrigId
      } else {
        categoryData.parentId = ''
        categoryData.parentOrigId = ''
      }
      
      await db.collection('categories').add({
        data: categoryData
      })

      wx.hideLoading()
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })

      this.setData({
        showAddModal: false,
        newCategoryName: '',
        newCategoryImage: ''
      })

      this.loadCategories()
    } catch (err) {
      wx.hideLoading()
      console.error('添加分类失败', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    }
  },

  // 显示编辑弹窗
  onEditCategory(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    const image = e.currentTarget.dataset.image || ''
    
    // 获取当前分类的级别
    const category = this.data.categories.find(c => c._id === id)
    const level = category ? category.level : 1
    
    this.setData({
      showEditModal: true,
      editingCategory: { _id: id },
      editingCategoryLevel: level,
      editCategoryName: name,
      editCategoryImage: image
    })
  },

  // 关闭编辑弹窗
  onCloseEditModal() {
    this.setData({
      showEditModal: false,
      editingCategory: null,
      editCategoryName: '',
      editCategoryImage: ''
    })
  },

  // 输入编辑分类名称
  onInputEditName(e) {
    this.setData({
      editCategoryName: e.detail.value
    })
  },

  // 选择编辑图片
  onChooseEditImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          editCategoryImage: res.tempFilePaths[0]
        })
      }
    })
  },

  // 确认编辑分类
  async onConfirmEdit() {
    const name = this.data.editCategoryName.trim()
    if (!name) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      // 如果是新选择的图片，先上传
      let imageUrl = this.data.editCategoryImage
      if (imageUrl && !imageUrl.startsWith('cloud://')) {
        imageUrl = await this.uploadImage(imageUrl)
      }

      const db = wx.cloud.database()
      const updateData = { name: name }
      if (this.data.editingCategoryLevel <= 2 && imageUrl) {
        updateData.image = imageUrl
      }

      await db.collection('categories').doc(this.data.editingCategory._id).update({
        data: updateData
      })

      wx.hideLoading()
      wx.showToast({
        title: '修改成功',
        icon: 'success'
      })

      this.setData({
        showEditModal: false,
        editingCategory: null,
        editCategoryName: '',
        editCategoryImage: ''
      })

      this.loadCategories()
    } catch (err) {
      wx.hideLoading()
      console.error('修改分类失败', err)
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      })
    }
  },

  // 删除分类
  onDeleteCategory(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该分类吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const db = wx.cloud.database()
            
            // 删除该分类
            await db.collection('categories').doc(id).remove()
            
            // 删除所有子分类（按parentId或parentOrigId）
            const subCategories = this.data.categories.filter(c => 
              c.parentId === id || c.parentOrigId === id
            )
            for (const subCat of subCategories) {
              await db.collection('categories').doc(subCat._id).remove()
            }
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            
            this.loadCategories()
          } catch (err) {
            console.error('删除分类失败', err)
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
