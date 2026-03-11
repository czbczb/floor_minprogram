// pages/product/detail.js
const mockData = require('../../utils/mockData.js')
const app = getApp()

Page({
  data: {
    product: null,
    loading: true,
    currentImageIndex: 0,
    showLoginModal: false,
    useMock: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadProduct(options.id)
    }
  },

  loadProduct(id) {
    const db = require('../../utils/db.js')
    db.productsDB.getById(id).then(res => {
      if (res.data) {
        this.setData({
          product: res.data,
          loading: false
        })
      } else {
        this.loadMockProduct(id)
      }
    }).catch(err => {
      this.loadMockProduct(id)
    })
  },

  loadMockProduct(id) {
    const product = mockData.mockProducts.find(p => p._id === id)
    this.setData({
      product: product,
      loading: false
    })
  },

  onSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    })
  },

  onPreviewImage(e) {
    const product = this.data.product
    if (!product || !product.images) return
    
    wx.previewImage({
      current: product.images[this.data.currentImageIndex],
      urls: product.images
    })
  },

  onPreviewDetailImage(e) {
    const src = e.currentTarget.dataset.src
    const images = e.currentTarget.dataset.images
    
    wx.previewImage({
      current: src,
      urls: images
    })
  },

  // 分享功能
  onShareAppMessage() {
    const product = this.data.product
    return {
      title: product ? product.name : '地板产品',
      path: '/pages/product/detail?id=' + (product ? product._id : ''),
      imageUrl: product && product.images ? product.images[0] : ''
    }
  },

  // 检查是否需要登录
  checkLogin() {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进行操作',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/my/index'
            })
          }
        }
      })
      return false
    }
    return true
  }
})
