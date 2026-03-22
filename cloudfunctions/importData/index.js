// 云函数 - 导入数据（支持图片上传）
const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// 下载图片到临时目录
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      console.log('图片URL为空')
      resolve(null)
      return
    }

    console.log('开始下载图片:', url)
    
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const ext = path.extname(urlObj.pathname) || '.jpg'
    const tempPath = path.join('/tmp', `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`)

    const req = client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // 处理重定向
        console.log('图片URL重定向到:', res.headers.location)
        downloadImage(res.headers.location).then(resolve).catch(reject)
        return
      }
      
      if (res.statusCode !== 200) {
        console.log('图片下载失败, 状态码:', res.statusCode)
        reject(new Error('HTTP ' + res.statusCode))
        return
      }

      const file = fs.createWriteStream(tempPath)
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log('图片下载成功:', tempPath)
        resolve(tempPath)
      })
    })

    req.on('error', (err) => {
      console.log('图片下载错误:', err.message)
      reject(err)
    })
    req.setTimeout(30000)
  })
}

exports.main = async (event, context) => {
  const { action, data } = event

  try {
    switch (action) {
      // 导入分类
      case 'importCategories':
        return await importCategories(data)
      
      // 导入产品（带图片上传）
      case 'importProducts':
        return await importProducts(data)
      
      // 导入产品（仅使用URL，不上传）
      case 'importProductsWithUrl':
        return await importProductsWithUrl(data)
      
      // 清空数据
      case 'clearAll':
        return await clearAll()
      
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('导入失败:', error)
    return { success: false, error: error.message }
  }
}

// 导入分类
async function importCategories(categories) {
  const results = []
  const coll = db.collection('categories')
  // 导入分类
  for (const category of categories) {
    try {
      console.log('导入分类:', category._id, category.name)
      
      // 拼装origId: 
      // 一级分类: 直接用原始ID (如 cat_8)
      // 二级分类: parent.origId + _ + category._id (如 cat_8_cat_8_194)
      let origId
      let parentOrigId = ''
      
      if (category.level == 1 || !category.parentId) {
        // 一级分类
        origId = category._id
        parentOrigId = ''
      } else {
        // 二级分类: parent.origId + _ + category._id
        const parentOrigIdValue = category.parentId
        origId = parentOrigIdValue + '_' + category._id
        parentOrigId = parentOrigIdValue
      }
      
      // 直接使用add()创建，云数据库会自动生成_id
      const result = await coll.add({
        data: {
          origId: origId,
          name: category.name,
          parentId: category.parentId || '',
          parentOrigId: parentOrigId,
          level: category.level || 1,
          sort: category.sort || 0,
          image: category.image || '',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      console.log('分类导入成功, origId:', origId, 'parentOrigId:', parentOrigId)
      
      // 验证是否真的添加成功
      const verify = await coll.doc(result._id).get()
      console.log('验证结果:', verify.data)
      
      results.push({ 
        _id: category._id, 
        newId: result._id,
        name: category.name,
        success: true 
      })
    } catch (error) {
      console.error('分类导入失败:', category._id, error.message)
      results.push({ 
        _id: category._id, 
        name: category.name,
        success: false, 
        error: error.message 
      })
    }
  }
  
  return { success: true, results }
}

// 导入产品（带图片上传）- 下载图片并上传到云存储
async function importProducts(products) {
  const results = []
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    console.log('开始导入产品:', product._id, product.name)
    
    try {
      let imageFileIds = []
      
      // 下载并上传所有图片
      if (product.images && product.images.length > 0) {
        console.log('产品图片数量:', product.images.length)
        for (let j = 0; j < product.images.length; j++) {
          const imgUrl = product.images[j]
          console.log('处理图片:', j, imgUrl)
          try {
            const tempPath = await downloadImage(imgUrl)
            if (tempPath) {
              console.log('开始上传图片到云存储...')
              const ext = imgUrl.split('.').pop() || 'jpg'
              const cloudPath = `products/${product._id}_${Date.now()}_${j}.${ext}`
              
              // 使用文件流上传
              const fileStream = fs.createReadStream(tempPath)
              const uploadResult = await cloud.uploadFile({
                cloudPath: cloudPath,
                fileContent: fileStream
              })
              console.log('图片上传成功:', uploadResult.fileID)
              imageFileIds.push(uploadResult.fileID)
              
              // 删除临时文件
              try {
                fs.unlinkSync(tempPath)
              } catch (e) {}
            }
          } catch (imgError) {
            console.error(`图片[${j}]上传失败:`, imgError.message)
            // 如果上传失败，保留原URL
            imageFileIds.push(imgUrl)
          }
        }
      } else {
        console.log('产品没有图片')
      }

      const result = await db.collection('products').add({
        data: {
          origId: product._id,
          name: product.name,
          description: product.description || '',
          categoryId: product.categoryId,
          categoryOrigId: product.categoryId, // 保存原始categoryId作为categoryOrigId
          categoryPath: product.categoryPath || '',
          images: imageFileIds,
          specifications: [],
          price: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      console.log('产品导入成功, _id:', result._id, '图片:', imageFileIds)
      results.push({ 
        _id: product._id, 
        name: product.name,
        success: true 
      })
    } catch (error) {
      console.error('产品导入失败:', error.message)
      results.push({ 
        _id: product._id, 
        name: product.name,
        success: false, 
        error: error.message 
      })
    }
  }
  
  return { success: true, results }
}

// 导入产品（仅使用URL）
async function importProductsWithUrl(products) {
  const results = []
  const coll = db.collection('products')
  
  for (const product of products) {
    try {
      console.log('导入产品:', product._id, product.name)
      
      const result = await coll.add({
        data: {
          origId: product._id,
          name: product.name,
          description: product.description || '',
          categoryId: product.categoryId,
          categoryOrigId: product.categoryId, // 保存原始categoryId作为categoryOrigId
          categoryPath: product.categoryPath || '',
          images: product.images || [],
          specifications: [],
          price: 0,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
      console.log('产品导入成功, _id:', result._id)
      
      results.push({ 
        _id: product._id, 
        name: product.name,
        success: true 
      })
    } catch (error) {
      console.error('产品导入失败:', product._id, error.message)
      results.push({ 
        _id: product._id, 
        name: product.name,
        success: false, 
        error: error.message 
      })
    }
  }
  
  return { success: true, results }
}

// 清空所有数据（每次最多删除5条，需多次调用）
async function clearAll() {
  let deletedCategories = 0
  let deletedProducts = 0
  
  // 删除分类（每次5条）
  try {
    const categories = await db.collection('categories').limit(2).get()
    for (const category of categories.data) {
      await db.collection('categories').doc(category._id).remove()
      deletedCategories++
    }
  } catch (e) {
    console.error('删除分类失败:', e)
  }
  
  // 删除产品（每次5条）
  try {
    const products = await db.collection('products').limit(5).get()
    for (const product of products.data) {
      await db.collection('products').doc(product._id).remove()
      deletedProducts++
    }
  } catch (e) {
    console.error('删除产品失败:', e)
  }
  
  return { 
    success: true, 
    deletedCategories,
    deletedProducts,
    message: `已删除 ${deletedCategories} 个分类和 ${deletedProducts} 个产品`
  }
}
