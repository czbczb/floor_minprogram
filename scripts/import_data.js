/**
 * 导入数据脚本
 * 1. 读取first.json中的数据来循环创建第一级分类
 * 2. 使用一级分类中的category_ids来循环调用getCollect API获取二级分类
 * 3. 循环创建二级分类
 * 4. 使用二级分类的id调用getCategory API获取商品
 * 5. 下载商品图片并上传
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync, exec } = require('child_process');

// 配置
const PROXY = 'http://localhost:9090';
const API_BASE = 'https://dev.sodatool.com/api/huadi';
const DATA_DIR = path.join(__dirname, '..', 'data');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// 确保目录存在
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// HTTP请求函数
function httpRequest(url, method = 'GET', data = null, useProxy = true) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Host': 'dev.sodatool.com',
        'Connection': 'keep-alive',
        'apiVersion': '1.1',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641739) XWEB/18926',
        'xweb_xhr': '1',
        'Accept': '*/*',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Referer': 'https://servicewechat.com/wx0b5ef45ca92cfc87/4/page-frame.html',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Content-Type': 'application/json'
      }
    };

    if (useProxy) {
      options.agent = new (isHttps ? https : http).Agent({
        proxy: PROXY
      });
    }

    const req = client.request(options, (res) => {
      let chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString();
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 使用curl执行请求
function curlRequest(api, data = null) {
  const curlCmd = [
    'curl',
    '-s',
    `"${api}"`
  ];

  if (data) {
    curlCmd.push('-X POST');
    curlCmd.push('-H "Content-Type: application/json"');
    curlCmd.push(`--data-raw '${JSON.stringify(data)}'`);
  } else {
    curlCmd.push('-H "Content-Type: application/json"');
  }

  curlCmd.push(`--proxy ${PROXY}`);

  try {
    const result = execSync(curlCmd.join(' '), { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (e) {
    console.error('curl request failed:', e.message);
    return null;
  }
}

// 下载图片
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve(null);
      return;
    }

    // 移除URL中的查询参数
    const urlObj = new URL(url);
    const cleanUrl = urlObj.origin + urlObj.pathname;
    
    const ext = path.extname(urlObj.pathname) || '.jpg';
    const filePath = path.join(TEMP_DIR, `${filename}${ext}`);

    // 使用curl下载图片
    const curlCmd = [
      'curl',
      '-s',
      '-o',
      `"${filePath}"`,
      `"${cleanUrl}"`,
      `--proxy ${PROXY}`
    ];

    try {
      execSync(curlCmd.join(' '));
      if (fs.existsSync(filePath)) {
        resolve(filePath);
      } else {
        resolve(null);
      }
    } catch (e) {
      console.error('Download failed:', e.message);
      resolve(null);
    }
  });
}

// 读取first.json
function loadFirstCategories() {
  const filePath = path.join(DATA_DIR, 'first.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// 获取二级分类
async function getSecondCategories(firstCategoryId) {
  console.log(`\n获取一级分类 ${firstCategoryId} 的二级分类...`);
  
  const result = await curlRequest(
    `${API_BASE}/getCollect`,
    { id: String(firstCategoryId) }
  );
  
  if (result && result.code === 1 && result.data) {
    return result.data;
  }
  
  // 如果API失败，尝试读取本地缓存文件
  const cacheFile = path.join(DATA_DIR, `second_id_${firstCategoryId}.json`);
  if (fs.existsSync(cacheFile)) {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return cacheData.data || [];
  }
  
  return [];
}

// 获取商品列表
async function getProducts(secondCategoryId) {
  console.log(`获取二级分类 ${secondCategoryId} 的商品列表...`);
  
  const result = await curlRequest(
    `${API_BASE}/getCategory`,
    { id: String(secondCategoryId) }
  );
  
  if (result && result.code === 1 && result.data) {
    return result.data;
  }
  
  // 如果API失败，尝试读取本地缓存文件
  const cacheFile = path.join(DATA_DIR, `product_list_${secondCategoryId}.json`);
  if (fs.existsSync(cacheFile)) {
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return cacheData.data || [];
  }
  
  return [];
}

// 主函数
async function main() {
  console.log('=== 开始导入数据 ===\n');

  // 1. 读取一级分类
  const firstCategories = loadFirstCategories();
  console.log(`共读取到 ${firstCategories.length} 个一级分类`);

  // 存储所有数据
  const importData = {
    firstCategories: [],
    secondCategories: [],
    products: [],
    categoryMap: {}, // 映射外部ID到内部ID
    productMap: {}   // 映射外部ID到内部ID
  };

  // 2. 循环处理每个一级分类
  for (let i = 0; i < firstCategories.length; i++) {
    const firstCat = firstCategories[i];
    console.log(`\n处理一级分类 [${i + 1}/${firstCategories.length}]: ${firstCat.title}`);

    // 创建一级分类（使用本地ID映射）
    const firstCategoryId = `cat_${firstCat.id}`;
    importData.firstCategories.push({
      _id: firstCategoryId,
      name: firstCat.title,
      parentId: '',
      level: 1,
      sort: i + 1,
      image: firstCat.img_path || '',
      externalId: firstCat.id,
      categoryIds: firstCat.category_ids
    });
    importData.categoryMap[firstCat.id] = firstCategoryId;

    // 3. 获取二级分类
    if (!firstCat.category_ids) {
      console.log('  没有二级分类ID');
      continue;
    }

    const secondIds = firstCat.category_ids.split(',').map(id => parseInt(id.trim()));
    console.log(`  二级分类IDs: ${secondIds.join(', ')}`);

    for (const secondId of secondIds) {
      // 获取二级分类数据
      const secondCats = await getSecondCategories(firstCat.id);
      const secondCat = secondCats.find(c => c.id === secondId);

      if (!secondCat) {
        console.log(`  二级分类 ${secondId} 未找到`);
        continue;
      }

      console.log(`  二级分类: ${secondCat.title}`);

      // 创建二级分类
      const secondCategoryId = `cat_${firstCat.id}_${secondCat.id}`;
      importData.secondCategories.push({
        _id: secondCategoryId,
        name: secondCat.title,
        parentId: firstCategoryId,
        level: 2,
        sort: secondCat.weigh || 0,
        image: secondCat.image_path || '',
        externalId: secondCat.id
      });
      importData.categoryMap[`${firstCat.id}_${secondCat.id}`] = secondCategoryId;

      // 4. 获取商品列表
      const products = await getProducts(secondId);
      console.log(`    获取到 ${products.length} 个商品`);

      for (const product of products) {
        console.log(`    商品: ${product.model}`);

        // 下载图片
        const localImagePath = await downloadImage(
          product.image_path,
          `product_${product.id}`
        );

        importData.products.push({
          _id: `prod_${product.id}`,
          name: product.model,  // title取商品的model字段
          description: product.description || '',
          categoryId: secondCategoryId,
          categoryPath: `${firstCat.title} > ${secondCat.title}`,
          externalId: product.id,
          originalImageUrl: product.image_path,
          localImagePath: localImagePath,
          image: '', // 上传后的云存储URL
          images: []
        });
        importData.productMap[product.id] = `prod_${product.id}`;
      }
    }
  }

  // 保存导入数据
  const outputPath = path.join(DATA_DIR, 'import_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(importData, null, 2));
  console.log(`\n导入数据已保存到: ${outputPath}`);

  // 统计
  console.log('\n=== 导入统计 ===');
  console.log(`一级分类: ${importData.firstCategories.length}`);
  console.log(`二级分类: ${importData.secondCategories.length}`);
  console.log(`商品: ${importData.products.length}`);

  // 输出需要上传的图片列表
  const imagesToUpload = importData.products
    .filter(p => p.localImagePath)
    .map(p => ({
      localPath: p.localImagePath,
      productId: p._id
    }));

  console.log(`\n需要上传的图片: ${imagesToUpload.length}`);

  // 保存图片上传列表
  const uploadListPath = path.join(DATA_DIR, 'upload_list.json');
  fs.writeFileSync(uploadListPath, JSON.stringify(imagesToUpload, null, 2));
  console.log(`图片上传列表已保存到: ${uploadListPath}`);

  console.log('\n=== 第一阶段完成 ===');
  console.log('下一步: 需要将数据导入到云数据库');
}

// 运行
main().catch(console.error);
