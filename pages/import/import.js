// pages/import/import.js
const app = getApp()

Page({
  data: {
    stats: {
      categories: 0,
      products: 0
    },
    importing: false,
    step: 1,
    log: [],
    scrollTop: 0
  },

  onLoad() {
    this.loadStats()
  },

  onShow() {
    this.loadStats()
  },

  async loadStats() {
    const db = wx.cloud.database()
    
    try {
      const categoriesRes = await db.collection('categories').count()
      const productsRes = await db.collection('products').count()
      
      this.setData({
        'stats.categories': categoriesRes.total,
        'stats.products': productsRes.total
      })
    } catch (err) {
      console.error('加载统计失败', err)
    }
  },

  addLog(msg) {
    const logs = this.data.log || []
    logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
    this.setData({ 
      log: logs,
      scrollTop: logs.length * 30
    })
  },

  // 重新加载数据
  async loadData() {
    this.setData({ importing: true, step: 1 })
    this.addLog('开始重新加载...')
    
    try {
      // 先检查数据状态
      const db = wx.cloud.database()
      const categoriesRes = await db.collection('categories').limit(100).get()
      const productsRes = await db.collection('products').limit(20).get()
      
      this.setData({
        'stats.categories': categoriesRes.data.length,
        'stats.products': productsRes.data.length
      })
      
      this.addLog(`当前分类: ${categoriesRes.data.length}`)
      this.addLog(`当前产品: ${productsRes.data.length}`)
      
      // 显示分类详情
      if (categoriesRes.data.length > 0) {
        const level1 = categoriesRes.data.filter(c => !c.parentId || c.parentId === '')
        const level2 = categoriesRes.data.filter(c => c.level == 2)
        this.addLog(`一级分类: ${level1.length}, 二级分类: ${level2.length}`)
      }
      
    } catch (err) {
      this.addLog(`加载失败: ${err.message}`)
    }
    
    this.setData({ importing: false })
  },

  // 导入分类
  async importCategories() {
    this.setData({ importing: true, step: 1 })
    this.addLog('开始导入分类...')
    
    try {
      const categories = this.generateCategoriesData()
      
      const res = await wx.cloud.callFunction({
        name: 'importData',
        data: {
          action: 'importCategories',
          data: categories
        }
      })
      
      if (res.result && res.result.success) {
        this.addLog(`分类导入成功: ${res.result.results.length} 条`)
      } else {
        this.addLog(`分类导入结果: ${JSON.stringify(res.result)}`)
      }
      
    } catch (err) {
      this.addLog(`分类导入失败: ${err.message}`)
    }
    
    this.setData({ importing: false })
    this.loadStats()
  },

  // 生成完整分类数据
  generateCategoriesData() {
    const categories = []
    
    // 一级分类 - 从 first.json
    const firstCategories = [
      { id: 8, title: '地铺石' },
      { id: 9, title: '亮光砖' },
      { id: 10, title: '600仿古' },
      { id: 11, title: '800仿古' },
      { id: 12, title: '幕墙' },
      { id: 13, title: '60古建1.2厚' },
      { id: 14, title: '外墙30*60' },
      { id: 15, title: '吸水砖、小地砖' },
      { id: 16, title: '莱姆石' },
      { id: 18, title: '拼花' }
    ]
    
    // 二级分类 - 从 first.json 中的 category_ids
    const secondCategoriesMap = {
      8: [194,227,228,231,230,193,201,192,229,200,195,232],
      9: [197,196,199,198],
      10: [206,205,204,203,207,217],
      11: [219,213,215,209,208,212,210,226],
      12: [202],
      13: [211],
      14: [214,225],
      15: [216,218],
      16: [220,221,222],
      18: [223,224]
    }
    
    // 添加一级分类
    firstCategories.forEach((cat, index) => {
      categories.push({
        _id: `cat_${cat.id}`,
        name: cat.title,
        parentId: '',
        level: 1,
        sort: index + 1,
        image: ''
      })
    })
    
    // 添加二级分类
    Object.keys(secondCategoriesMap).forEach(parentId => {
      const ids = secondCategoriesMap[parentId]
      ids.forEach((id, index) => {
        categories.push({
          _id: `cat_${parentId}_${id}`,
          name: `分类${id}`,
          parentId: `cat_${parentId}`,
          level: 2,
          sort: index + 1,
          image: ''
        })
      })
    })
    
    this.addLog(`生成了 ${categories.length} 个分类 (${firstCategories.length} 个一级, ${categories.length - firstCategories.length} 个二级)`)
    return categories
  },

  // 导入产品（使用URL）
  async importProducts() {
    this.setData({ importing: true, step: 2 })
    this.addLog('开始导入产品（URL模式）...')
    
    // TODO: 实现产品导入
    this.addLog('产品导入功能待实现')
    
    this.setData({ importing: false })
    this.loadStats()
  },

  // 导入产品（上传图片）
  async importProductsWithImages() {
    this.setData({ importing: true, step: 3 })
    this.addLog('开始导入产品（图片上传模式）...')
    
    // TODO: 实现产品导入
    this.addLog('产品导入功能待实现')
    
    this.setData({ importing: false })
    this.loadStats()
  },

  // 清空数据
  async clearData() {
    wx.showModal({
      title: '确认',
      content: '确定要清空所有数据吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ importing: true })
          this.addLog('开始清空数据...')
          
          try {
            const db = wx.cloud.database()
            
            // 清空分类
            let deleted = 0
            while (true) {
              const categories = await db.collection('categories').limit(10).get()
              if (categories.data.length === 0) break
              
              for (const cat of categories.data) {
                await db.collection('categories').doc(cat._id).remove()
                deleted++
              }
            }
            this.addLog(`删除了 ${deleted} 个分类`)
            
            // 清空产品
            deleted = 0
            while (true) {
              const products = await db.collection('products').limit(10).get()
              if (products.data.length === 0) break
              
              for (const p of products.data) {
                await db.collection('products').doc(p._id).remove()
                deleted++
              }
            }
            this.addLog(`删除了 ${deleted} 个产品`)
            
            this.addLog('清空完成!')
            
          } catch (err) {
            this.addLog(`清空失败: ${err.message}`)
          }
          
          this.setData({ importing: false })
          this.loadStats()
        }
      }
    })
  }
})
