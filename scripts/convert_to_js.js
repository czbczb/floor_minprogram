// 将JSON数据转换为JS模块
const fs = require('fs')
const path = require('path')

const categoriesPath = path.join(__dirname, '..', 'data', 'output', 'categories.json')
const productsPath = path.join(__dirname, '..', 'data', 'output', 'products.json')
const outputPath = path.join(__dirname, '..', 'data', 'import_data.js')

// 读取JSON文件
const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'))
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'))

// 生成JS文件内容
const jsContent = `// data/import_data.js - 导入数据
// 从 data/output/categories.json 和 data/output/products.json 自动生成

const categories = ${JSON.stringify(categories, null, 2)}

const products = ${JSON.stringify(products, null, 2)}

module.exports = {
  categories,
  products
}
`

// 写入文件
fs.writeFileSync(outputPath, jsContent, 'utf8')

console.log(`已生成 ${outputPath}`)
console.log(`分类: ${categories.length} 条`)
console.log(`产品: ${products.length} 条`)
