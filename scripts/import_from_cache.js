/**
 * 从本地缓存数据导入脚本
 * 使用data目录下的JSON文件进行导入
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'output');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 读取first.json
function loadFirstCategories() {
  const filePath = path.join(DATA_DIR, 'first.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 读取二级分类缓存文件
function loadSecondCategories(firstId) {
  const filePath = path.join(DATA_DIR, `second_id_${firstId}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.data || [];
  }
  return [];
}

// 读取商品列表缓存文件
function loadProducts(firstId, secondId) {
  const filePath = path.join(DATA_DIR, `product_list_${firstId}_${secondId}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return data.data || [];
  }
  return [];
}

// 主函数
function main() {
  console.log('=== 从本地缓存导入数据 ===\n');

  // 1. 读取一级分类
  const firstCategories = loadFirstCategories();
  console.log(`共读取到 ${firstCategories.length} 个一级分类`);

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
      categoryIds: firstCat.category_ids,
      type: firstCat.type,
      type2: firstCat.type2
    });
    importData.categoryMap[firstCat.id] = firstCategoryId;

    // 3. 获取二级分类
    if (!firstCat.category_ids) {
      console.log('  没有二级分类ID');
      continue;
    }

    const secondIds = firstCat.category_ids.split(',').map(id => parseInt(id.trim()));
    console.log(`  二级分类IDs: ${secondIds.join(', ')}`);

    // 从缓存读取二级分类
    const secondCats = loadSecondCategories(firstCat.id);

    for (const secondId of secondIds) {
      const secondCat = secondCats.find(c => c.id === secondId);

      if (!secondCat) {
        console.log(`  二级分类 ${secondId} 未找到，尝试直接创建`);
        // 仍然创建，只是没有详情
        const secondCategoryId = `cat_${firstCat.id}_${secondId}`;
        importData.secondCategories.push({
          _id: secondCategoryId,
          name: `分类${secondId}`,
          parentId: firstCategoryId,
          level: 2,
          sort: 0,
          image: '',
          externalId: secondId
        });
        importData.categoryMap[`${firstCat.id}_${secondId}`] = secondCategoryId;
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
        imageOriginal: secondCat.image || '',
        externalId: secondCat.id
      });
      importData.categoryMap[`${firstCat.id}_${secondId}`] = secondCategoryId;

      // 4. 获取商品列表
      const products = loadProducts(firstCat.id, secondId);
      console.log(`    获取到 ${products.length} 个商品`);

      for (const product of products) {
        // title取商品的model字段
        const productName = product.model || `产品${product.id}`;
        console.log(`    商品: ${productName}`);

        importData.products.push({
          _id: `prod_${product.id}`,
          name: productName,  // title取商品的model字段
          description: product.description || '',
          categoryId: secondCategoryId,
          categoryPath: `${firstCat.title} > ${secondCat.title}`,
          externalId: product.id,
          originalImageUrl: product.image_path,
          image: product.image || '',
          images: product.images_path || [],
          weigh: product.weigh
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

  // 生成可直接导入的分类数据
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
  console.log(`\n分类数据已保存到: ${categoriesPath}`);

  // 生成可直接导入的产品数据
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
  console.log(`产品数据已保存到: ${productsPath}`);

  console.log('\n=== 导入完成 ===');
  console.log('请使用微信开发者工具或云开发控制台导入数据');
}

// 运行
main();
