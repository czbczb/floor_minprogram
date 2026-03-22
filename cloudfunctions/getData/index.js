// 云函数 - 获取导入数据
// 此版本不依赖 wx-server-sdk，使用基础能力
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { type } = event

  const CATEGORIES_FILE_ID = 'cloud://cloud1-7g3e3lht1fd07e84.636c-cloud1-7g3e3lht1fd07e84-1410254620/category/categories.json'
  const PRODUCTS_FILE_ID = 'cloud://cloud1-7g3e3lht1fd07e84.636c-cloud1-7g3e3lht1fd07e84-1410254620/products/products.json'

  try {
    let categories = []
    let products = []

    // 获取临时下载链接
    try {
      const catResult = await cloud.getTempFileURL({
        fileList: [CATEGORIES_FILE_ID]
      })
      if (catResult.fileList && catResult.fileList[0] && catResult.fileList[0].tempFileURL) {
        // 下载文件内容
        const http = require('http')
        const https = require('https')
        
        const url = catResult.fileList[0].tempFileURL
        const isHttps = url.startsWith('https://')
        const client = isHttps ? https : http
        
        const content = await new Promise((resolve, reject) => {
          client.get(url, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => resolve(data))
          }).on('error', reject)
        })
        
        categories = JSON.parse(content)
      }
    } catch (e) {
      console.log('获取分类数据失败:', e.message)
    }

    try {
      const prodResult = await cloud.getTempFileURL({
        fileList: [PRODUCTS_FILE_ID]
      })
      if (prodResult.fileList && prodResult.fileList[0] && prodResult.fileList[0].tempFileURL) {
        const http = require('http')
        const https = require('https')
        
        const url = prodResult.fileList[0].tempFileURL
        const isHttps = url.startsWith('https://')
        const client = isHttps ? https : http
        
        const content = await new Promise((resolve, reject) => {
          client.get(url, (res) => {
            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => resolve(data))
          }).on('error', reject)
        })
        
        products = JSON.parse(content)
      }
    } catch (e) {
      console.log('获取产品数据失败:', e.message)
    }

    switch (type) {
      case 'categories':
        return { success: true, data: categories }
      case 'products':
        return { success: true, data: products }
      default:
        return { success: true, categories, products }
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    return { success: false, error: error.message }
  }
}
