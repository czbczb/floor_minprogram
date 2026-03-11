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
    showEditModal: false,
    editingCategory: null,
    editCategoryName: ''
  },

  onLoad() {
    this.checkPermission()
  },

  onShow() {
    this.loadCategories()
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
      this.setData({
        categories: res.data || [],
        loading: false
      })
    } catch (err) {
      console.error('加载分类失败', err)
      this.setData({ loading: false })
    }
  },

  onAddCategory(e) {
    const parentid = e.currentTarget.dataset.parentid
    const level = e.currentTarget.dataset.level
    
    this.setData({
      showAddModal: true,
      parentCategory: parentid || null,
      newCategoryLevel: level || 1,
      newCategoryName: ''
    })
  },

  onCloseAddModal() {
    this.setData({
      showAddModal: false,
      parentCategory: null,
      newCategoryName: ''
    })
  },

  onInputCategoryName(e) {
    this.setData({
      newCategoryName: e.detail.value
    })
  },

  async onConfirmAdd() {
    const newCategoryName = this.data.newCategoryName
    const parentCategory = this.data.parentCategory
    const newCategoryLevel = this.data.newCategoryLevel
    
    if (!newCategoryName.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    try {
      await db.categoriesDB.add({
        name: newCategoryName.trim(),
        parentId: parentCategory || '',
        level: newCategoryLevel,
        sort: 0
      })
      
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })
      
      this.onCloseAddModal()
      this.loadCategories()
    } catch (err) {
      console.error('添加分类失败', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    }
  },

  onEditCategory(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    
    this.setData({
      showEditModal: true,
      editingCategory: { _id: id, name: name },
      editCategoryName: name
    })
  },

  onCloseEditModal() {
    this.setData({
      showEditModal: false,
      editingCategory: null,
      editCategoryName: ''
    })
  },

  onInputEditName(e) {
    this.setData({
      editCategoryName: e.detail.value
    })
  },

  async onConfirmEdit() {
    const editingCategory = this.data.editingCategory
    const editCategoryName = this.data.editCategoryName
    
    if (!editCategoryName.trim()) {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      })
      return
    }

    try {
      await db.categoriesDB.update(editingCategory._id, {
        name: editCategoryName.trim()
      })
      
      wx.showToast({
        title: '修改成功',
        icon: 'success'
      })
      
      this.onCloseEditModal()
      this.loadCategories()
    } catch (err) {
      console.error('修改分类失败', err)
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      })
    }
  },

  async onDeleteCategory(e) {
    const id = e.currentTarget.dataset.id
    
    const hasChildren = await db.categoriesDB.hasChildren(id)
    if (hasChildren) {
      wx.showToast({
        title: '请先删除子分类',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该分类吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await db.categoriesDB.delete(id)
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
  },

  getChildren(parentId) {
    return this.data.categories.filter(c => c.parentId === parentId)
  },

  getLevelName(level) {
    const names = ['', '一级分类', '二级分类', '三级分类', '四级分类']
    return names[level] || '第' + level + '级'
  }
})
