// utils/db.js - 数据库操作工具

const db = wx.cloud.database()

// 用户相关
const usersDB = {
  // 获取当前用户信息
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getUserInfo'
      }).then(res => {
        resolve(res.result)
      }).catch(err => {
        reject(err)
      })
    })
  },

  // 更新用户角色
  updateUserRole(openid, role) {
    return db.collection('users').where({
      _openid: openid
    }).update({
      data: {
        role: role,
        updateTime: new Date()
      }
    })
  },

  // 获取所有用户列表
  getUsers() {
    return db.collection('users').get()
  }
}

// 分类相关
const categoriesDB = {
  // 获取所有分类
  getAll() {
    return db.collection('categories').orderBy('sort', 'asc').get()
  },

  // 获取顶级分类
  getTopLevel() {
    return db.collection('categories').where({
      parentId: ''
    }).orderBy('sort', 'asc').get()
  },

  // 根据父ID获取子分类
  getByParentId(parentId) {
    return db.collection('categories').where({
      parentId: parentId
    }).orderBy('sort', 'asc').get()
  },

  // 添加分类
  add(category) {
    return db.collection('categories').add({
      data: {
        name: category.name,
        parentId: category.parentId || '',
        level: category.level || 1,
        sort: category.sort || 0,
        image: category.image || '',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  },

  // 更新分类
  update(id, data) {
    return db.collection('categories').doc(id).update({
      data: {
        ...data,
        updateTime: db.serverDate()
      }
    })
  },

  // 删除分类
  delete(id) {
    return db.collection('categories').doc(id).remove()
  },

  // 检查是否有子分类
  hasChildren(id) {
    return new Promise((resolve, reject) => {
      db.collection('categories').where({
        parentId: id
      }).count().then(res => {
        resolve(res.total > 0)
      })
    })
  },

  // 获取分类路径
  getCategoryPath(categoryId) {
    return new Promise(async (resolve, reject) => {
      try {
        let path = []
        let currentId = categoryId
        
        while (currentId) {
          const res = await db.collection('categories').doc(currentId).get()
          if (res.data) {
            path.unshift(res.data)
            currentId = res.data.parentId
          } else {
            break
          }
        }
        resolve(path)
      } catch (err) {
        reject(err)
      }
    })
  }
}

// 产品相关
const productsDB = {
  // 获取所有产品
  getAll() {
    return db.collection('products').orderBy('createTime', 'desc').get()
  },

  // 获取产品列表（分页）
  getList(page = 1, pageSize = 20) {
    return db.collection('products')
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
  },

  // 根据分类获取产品
  getByCategory(categoryId) {
    return db.collection('products').where({
      categoryId: categoryId
    }).orderBy('createTime', 'desc').get()
  },

  // 根据顶级分类获取产品（包括所有子分类）
  async getByTopCategory(topCategoryId) {
    try {
      // 获取所有子分类
      const categoriesRes = await db.collection('categories').where({
        parentId: topCategoryId
      }).get()
      
      const categoryIds = [topCategoryId]
      
      // 递归获取所有子分类ID
      const getAllChildIds = async (parentId) => {
        const childRes = await db.collection('categories').where({
          parentId: parentId
        }).get()
        
        if (childRes.data && childRes.data.length > 0) {
          for (const child of childRes.data) {
            categoryIds.push(child._id)
            await getAllChildIds(child._id)
          }
        }
      }
      
      await getAllChildIds(topCategoryId)
      
      // 查询属于这些分类的产品
      const productsRes = await db.collection('products').where({
        categoryId: db.command.in(categoryIds)
      }).orderBy('createTime', 'desc').get()
      
      return productsRes
    } catch (err) {
      console.error('获取分类产品失败', err)
      return { data: [] }
    }
  },

  // 搜索产品
  search(keyword) {
    return db.collection('products').where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).orderBy('createTime', 'desc').get()
  },

  // 获取产品详情
  getById(id) {
    return db.collection('products').doc(id).get()
  },

  // 添加产品
  add(product) {
    return db.collection('products').add({
      data: {
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId,
        categoryPath: product.categoryPath || '',
        specifications: product.specifications || [],
        images: product.images || [],
        detailImages: product.detailImages || [],
        price: product.price || 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })
  },

  // 更新产品
  update(id, data) {
    return db.collection('products').doc(id).update({
      data: {
        ...data,
        updateTime: db.serverDate()
      }
    })
  },

  // 删除产品
  delete(id) {
    return db.collection('products').doc(id).remove()
  }
}

// 云存储相关
const storage = {
  // 上传图片
  uploadImage(filePath, folder = 'images') {
    return new Promise((resolve, reject) => {
      const cloudPath = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${filePath.match(/\.[^.]+$/)[0]}`
      
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: res => {
          resolve(res.fileID)
        },
        fail: err => {
          reject(err)
        }
      })
    })
  },

  // 删除图片
  deleteImage(fileId) {
    return wx.cloud.deleteFile({
      fileList: [fileId]
    })
  },

  // 批量删除图片
  deleteImages(fileIds) {
    return wx.cloud.deleteFile({
      fileList: fileIds
    })
  }
}

module.exports = {
  db,
  usersDB,
  categoriesDB,
  productsDB,
  storage
}
