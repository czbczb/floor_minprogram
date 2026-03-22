/**
 * 转换为微信云开发导入格式 (JSON Lines)
 * 每行一个JSON对象
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'output');

// 读取并转换分类数据
function convertCategories() {
  const inputPath = path.join(OUTPUT_DIR, 'categories.json');
  const outputPath = path.join(OUTPUT_DIR, 'categories.jsonl');
  
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  // 每行一个JSON对象
  const lines = data.map(item => JSON.stringify(item));
  
  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`已转换为JSON Lines格式: ${outputPath}`);
}

// 读取并转换产品数据
function convertProducts() {
  const inputPath = path.join(OUTPUT_DIR, 'products.json');
  const outputPath = path.join(OUTPUT_DIR, 'products.jsonl');
  
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  // 每行一个JSON对象
  const lines = data.map(item => JSON.stringify(item));
  
  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`已转换为JSON Lines格式: ${outputPath}`);
}

convertCategories();
convertProducts();

console.log('\n请使用 *.jsonl 文件导入到云数据库');
