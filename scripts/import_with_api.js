/**
 * 完整导入脚本 - 调用API获取数据并导入
 * 1. 读取first.json中的数据来循环创建第一级分类
 * 2. 使用一级分类中的category_ids来循环调用getCollect API获取二级分类
 * 3. 循环创建二级分类
 * 4. 使用二级分类的id调用getCategory API获取商品
 * 5. 下载商品图片
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROXY = 'http://localhost:9090';
const API_BASE = 'https://dev.sodatool.com/api/huadi';
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'output');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

// 确保目录存在
[DATA_DIR, OUTPUT_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 使用curl执行请求
function curlRequest(api, data = null) {
  const curlCmd = ['curl', '-s'];

  curlCmd.push(`"${api}"`);

  if (data) {
    curlCmd.push('-X POST');
    curlCmd.push('-H "Content-Type: application/json"');
    curlCmd.push(`--data-raw '${JSON.stringify(data)}'`);
  } else {
    curlCmd.push('-H "Content-Type: application/json"');
  }

  curlCmd.push(`--proxy "${PROXY}"`);

  try {
    const result = execSync(curlCmd.join(' '), { 
      encoding: 'utf8',
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });
    return JSON.parse(result);
  } catch (e) {
    console.error(`  API请求失败: ${e.message}`);
    return null;
  }
}

// 下载图片
function downloadImage(url, filename) {
  if (!url) return null;
  
  try {
    // 移除URL中的查询参数
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
    console.error(`  图片下载失败: ${e.message}`);
    return null;
  }
}

// 读取first.json
function loadFirstCategories() {
  const filePath = path.join(DATA_DIR, 'first.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 获取二级分类 - 优先从API获取，失败则从缓存读取
async function getSecondCategories(firstCategoryId) {
  console.log(`  获取二级分类...`);
  
  const result = curlRequest(
    `${API_BASE}/getCollect`,
    { id: String(firstCategoryId) }
  );
  
  if (result && result.code === 1 && result.data) {
    // 保存到缓存
    const cacheFile = path.join(DATA_DIR, `second_id_${firstCategoryId}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    console.log(`  已保存二级分类缓存`);
    return result.data;
  }
  
  // 尝试读取本地缓存
  const cacheFile = path.join(DATA_DIR, `second_id_${firstCategoryId}.json`);
  if (fs.existsSync(cacheFile)) {
    console.log(`  使用本地缓存`);
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return cacheData.data || [];
  }
  
  return [];
}

// 获取商品列表 - 优先从API获取，失败则从缓存读取
async function getProducts(firstId, secondId) {
  const result = curlRequest(
    `${API_BASE}/getCategory`,
    { id: String(secondId) }
  );
  
  if (result && result.code === 1 && result.data) {
    // 保存到缓存
    const cacheFile = path.join(DATA_DIR, `product_list_${firstId}_${secondId}.json`);
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
    console.log(`    已保存商品列表缓存`);
    return result.data;
  }
  
  // 尝试读取本地缓存
  const cacheFile = path.join(DATA_DIR, `product_list_${firstId}_${secondId}.json`);
  if (fs.existsSync(cacheFile)) {
    console.log(`    使用本地缓存`);
    const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    return cacheData.data || [];
  }
  
  return [];
}

// 主函数
async function main() {
  console.log('=== 完整导入脚本 ===\n');
  console.log('将从API获取数据并导入...\n');

  // 1. 读取一级分类
  const firstCategories = loadFirstCategories();
  console.log(`共读取到 ${firstCategories.length} 个一级分类\n`);

  // 存储所有数据
  const importData = {
    firstCategories: [],
    secondCategories: [],
    products: [],
    categoryMap: {},
    productMap: {}
  };

  // 2. 循环处理每个一级分类
  for (let i = 0; i < firstCategories.length; i++) {
    const firstCat = firstCategories[i];
    console.log(`\n处理一级分类 [${i + 1}/${firstCategories.length}]: ${firstCat.title}`);

    // 创建一级分类
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

    // 从API获取二级分类
    const secondCats = await getSecondCategories(firstCat.id);

    for (const secondId of secondIds) {
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
      importData.categoryMap[`${firstCat.id}_${secondId}`] = secondCategoryId;

      // 4. 获取商品列表
      const products = await getProducts(firstCat.id, secondId);
      console.log(`    获取到 ${products.length} 个商品`);

      for (const product of products) {
        const productName = product.model || `产品${product.id}`;
        console.log(`    商品: ${productName}`);

        // 下载图片
        const localImagePath = downloadImage(
          product.image_path,
          `product_${firstCat.id}_${secondId}_${product.id}`
        );

        importData.products.push({
          _id: `prod_${product.id}`,
          name: productName,  // title取商品的model字段
          description: product.description || '',
          categoryId: secondCategoryId,
          categoryPath: `${firstCat.title} > ${secondCat.title}`,
          externalId: product.id,
          originalImageUrl: product.image_path,
          localImagePath: localImagePath,
          image: product.image || '',
          images: product.images_path || []
        });
        importData.productMap[product.id] = `prod_${product.id}`;
      }
    }
  }

  // 保存导入数据
  const outputPath = path.join(OUTPUT_DIR, 'import_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(importData, null, 2));
  console.log(`\n导入数据已保存到: ${outputPath}`);

  // 统计
  console.log('\n=== 导入统计 ===');
  console.log(`一级分类: ${importData.firstCategories.length}`);
  console.log(`二级分类: ${importData.secondCategories.length}`);
  console.log(`商品: ${importData.products.length}`);

  // 生成分类JSON
  const categoriesForImport = [
    ...importData.firstCategories.map(c => ({
      _id: c._id,
      name: c.name,
      parentId: c.parentId,
      level: c.level,
      sort: c.sort,
      image: c.image,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    })),
    ...importData.secondCategories.map(c => ({
      _id: c._id,
      name: c.name,
      parentId: c.parentId,
      level: c.level,
      sort: c.sort,
      image: c.image,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }))
  ];

  const categoriesPath = path.join(OUTPUT_DIR, 'categories.json');
  fs.writeFileSync(categoriesPath, JSON.stringify(categoriesForImport, null, 2));

  // 生成产品JSON
  const productsForImport = importData.products.map(p => ({
    _id: p._id,
    name: p.name,
    description: p.description,
    categoryId: p.categoryId,
    categoryPath: p.categoryPath,
    images: p.images,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }));

  const productsPath = path.join(OUTPUT_DIR, 'products.json');
  fs.writeFileSync(productsPath, JSON.stringify(productsForImport, null, 2));

  // 图片列表
  const imagesToUpload = importData.products
    .filter(p => p.localImagePath)
    .map(p => ({
      localPath: p.localImagePath,
      productId: p._id,
      productName: p.name
    }));

  const uploadListPath = path.join(OUTPUT_DIR, 'upload_list.json');
  fs.writeFileSync(uploadListPath, JSON.stringify(imagesToUpload, null, 2));

  console.log(`\n分类数据: ${categoriesPath}`);
  console.log(`产品数据: ${productsPath}`);
  console.log(`图片列表: ${uploadListPath}`);
  console.log('\n=== 导入完成 ===');
}

// 运行
main().catch(console.error);
