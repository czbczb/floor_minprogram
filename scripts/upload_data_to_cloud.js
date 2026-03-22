// scripts/upload_data_to_cloud.js
// 上传数据文件到云存储
// 运行方式: 在微信开发者工具的云开发控制台中运行，或使用 cloud functions 部署

const cloud = require('wx-server-sdk')
const fs = require('fs')
const path = require('path')

// 初始化云环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

async function uploadDataFiles() {
  const dataDir = path.join(__dirname, '..', 'data', 'output')
  
  try {
    // 上传分类数据
    const categoriesPath = path.join(dataDir, 'categories.json')
    if (fs.existsSync(categoriesPath)) {
      const cloudPath = 'data/categories.json'
      const result = await cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: categoriesPath
      })
      console.log('分类数据上传成功:', result.fileID)
    }

    // 上传产品数据
    const productsPath = path.join(dataDir, 'products.json')
    if (fs.existsSync(productsPath)) {
      const cloudPath = 'data/products.json'
      const result = await cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: productsPath
      })
      console.log('产品数据上传成功:', result.fileID)
    }

    console.log('数据上传完成!')
  } catch (error) {
    console.error('上传失败:', error)
  }
}

uploadDataFiles()
