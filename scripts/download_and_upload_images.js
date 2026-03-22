/**
 * 下载并上传图片到云存储
 */

const fs = require('fs');
const path = require('path');
const cloud = require('wx-server-sdk');

const PROXY = 'http://localhost:9090';
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'output');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// 确保目录存在
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// curl下载图片
function downloadImage(url, filename) {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const cleanUrl = urlObj.origin + urlObj.pathname;
    const ext = path.extname(urlObj.pathname) || '.jpg';
    const filePath = path.join(TEMP_DIR, `${filename}${ext}`);

    const curlCmd = [
      'curl',
      '-s',
      '-o',
      `"${filePath}"`,
      `"${cleanUrl}"`,
      `--proxy "${PROXY}"`
    ];

    execSync(curlCmd.join(' '), { timeout: 30000 });
    
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  } catch (e) {
    console.error(`下载失败: ${e.message}`);
    return null;
  }
}

const { execSync } = require('child_process');

// 读取products.json
function loadProducts() {
  const filePath = path.join(OUTPUT_DIR, 'products.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 主函数
async function main() {
  console.log('=== 下载并上传图片 ===\n');

  const products = loadProducts();
  console.log(`共 ${products.length} 个产品\n`);

  const results = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (product.images && product.images.length > 0) {
      const imageUrl = product.images[0];
      console.log(`[${i + 1}/${products.length}] ${product.name}: ${imageUrl}`);
      
      // 下载图片
      const localPath = downloadImage(imageUrl, `product_${product._id}`);
      
      if (localPath) {
        results.push({
          _id: product._id,
          name: product.name,
          localPath: localPath,
          originalUrl: imageUrl
        });
        console.log(`  已下载: ${localPath}`);
      } else {
        console.log(`  下载失败`);
      }
    }
  }

  // 保存下载列表
  const downloadListPath = path.join(OUTPUT_DIR, 'download_list.json');
  fs.writeFileSync(downloadListPath, JSON.stringify(results, null, 2));
  
  console.log(`\n下载列表已保存到: ${downloadListPath}`);
  console.log(`需要上传的图片: ${results.length}`);
  
  console.log('\n=== 提示 ===');
  console.log('由于云函数需要在微信开发者工具中运行，请在小程序中实现图片上传功能');
}

main().catch(console.error);
