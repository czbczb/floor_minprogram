// utils/mockData.js - Mock数据

// 模拟分类数据
const mockCategories = [
  { _id: 'cat1', name: '实木地板', parentId: '', level: 1, sort: 1 },
  { _id: 'cat1-1', name: '橡木', parentId: 'cat1', level: 2, sort: 1 },
  { _id: 'cat1-1-1', name: '橡木A级', parentId: 'cat1-1', level: 3, sort: 1 },
  { _id: 'cat1-1-1-1', name: '橡木A级规格1', parentId: 'cat1-1-1', level: 4, sort: 1 },
  { _id: 'cat1-1-2', name: '橡木B级', parentId: 'cat1-1', level: 3, sort: 2 },
  { _id: 'cat1-2', name: '胡桃木', parentId: 'cat1', level: 2, sort: 2 },
  { _id: 'cat2', name: '复合地板', parentId: '', level: 1, sort: 2 },
  { _id: 'cat2-1', name: '多层复合', parentId: 'cat2', level: 2, sort: 1 },
  { _id: 'cat2-2', name: '强化复合', parentId: 'cat2', level: 2, sort: 2 },
  { _id: 'cat3', name: '竹地板', parentId: '', level: 1, sort: 3 },
  { _id: 'cat4', name: '地暖地板', parentId: '', level: 1, sort: 4 }
]

// 模拟产品数据
const mockProducts = [
  {
    _id: 'prod1',
    name: '橡木本色地板',
    description: '精选优质橡木，自然纹理，环保油漆，适用于家居装修',
    categoryId: 'cat1-1-1',
    categoryPath: '实木地板 > 橡木 > 橡木A级',
    specifications: [
      { name: '规格', value: '910x122x18mm' },
      { name: '材质', value: '纯实木' },
      { name: '表面工艺', value: 'UV漆' }
    ],
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=400'
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800'
    ],
    isHot: true
  },
  {
    _id: 'prod2',
    name: '胡桃木深色地板',
    description: '经典胡桃木色，稳重典雅，适合中式装修风格',
    categoryId: 'cat1-2',
    categoryPath: '实木地板 > 胡桃木',
    specifications: [
      { name: '规格', value: '900x120x18mm' },
      { name: '材质', value: '纯实木' },
      { name: '表面工艺', value: '植物油' }
    ],
    images: [
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400'
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'
    ],
    isHot: true
  },
  {
    _id: 'prod3',
    name: '多层实木复合地板',
    description: '多层结构，稳定不变形，适用地暖环境',
    categoryId: 'cat2-1',
    categoryPath: '复合地板 > 多层复合',
    specifications: [
      { name: '规格', value: '1215x165x15mm' },
      { name: '材质', value: '多层实木复合' },
      { name: '表面工艺', value: '同步纹' }
    ],
    images: [
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=400'
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=800'
    ],
    isHot: false
  },
  {
    _id: 'prod4',
    name: '强化复合地板',
    description: '耐磨防水，易清洁，性价比高',
    categoryId: 'cat2-2',
    categoryPath: '复合地板 > 强化复合',
    specifications: [
      { name: '规格', value: '1285x192x12mm' },
      { name: '耐磨等级', value: 'AC4' },
      { name: '甲醛释放', value: 'E0级' }
    ],
    images: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400'
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
    ],
    isHot: true
  },
  {
    _id: 'prod5',
    name: '竹地板碳化色',
    description: '竹子材质，纹理清晰，环保健康',
    categoryId: 'cat3',
    categoryPath: '竹地板',
    specifications: [
      { name: '规格', value: '960x96x15mm' },
      { name: '材质', value: '竹材' },
      { name: '工艺', value: '碳化' }
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    isHot: false
  },
  {
    _id: 'prod6',
    name: '地暖专用地板',
    description: '专用于地热环境，导热快，不变形',
    categoryId: 'cat4',
    categoryPath: '地暖地板',
    specifications: [
      { name: '规格', value: '1200x150x12mm' },
      { name: '适用环境', value: '地暖' },
      { name: '导热性', value: '优秀' }
    ],
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400'
    ],
    detailImages: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    isHot: false
  }
]

module.exports = {
  mockCategories,
  mockProducts
}
