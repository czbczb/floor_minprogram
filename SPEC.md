# 地板展示小程序 - 技术规格说明书

## 1. 项目概述

### 项目名称
地板展示小程序 (Floor Display Mini Program)

### 项目类型
微信小程序 (WeChat Mini Program) - 云开发模式

### 核心功能
一款支持多角色管理的地板产品展示与管理系统，提供首页浏览、分类筛选、产品详情查看及后台管理功能。

### 目标用户
- **普通客户**: 浏览地板产品，查看分类，搜索产品
- **管理员**: 管理分类/子类，上传和编辑地板产品

---

## 2. 技术架构

### 开发框架
- 微信小程序原生开发
- 微信云开发 (CloudBase)
- WXML + WXSS + JavaScript

### 云开发资源
- 云数据库 (Cloud Database)
- 云存储 (Cloud Storage)
- 云函数 (Cloud Functions) - 按需使用

---

## 3. 页面结构

### TabBar 页面 (2个)
| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `/pages/index/index` | 产品列表展示、搜索 |
| 分类 | `/pages/category/category` | 4级分类选择、产品筛选 |

### 功能页面
| 页面 | 路径 | 权限 | 功能 |
|------|------|------|------|
| 产品详情 | `/pages/product/detail` | 全部用户 | 查看产品详情 |
| 我的 | `/pages/my/index` | 全部用户 | 登录、角色管理、入口 |
| 分类管理 | `/pages/category/manage` | 仅管理员 | 添加/编辑/删除分类 |
| 产品管理 | `/pages/product/manage` | 仅管理员 | 添加/编辑/删除产品 |

### 页面层级结构
```
├── tabBar
│   ├── 首页 (index)
│   └── 分类 (category)
├── 产品 (product)
│   ├── detail (详情)
│   └── manage (管理)
├── 分类 (category)
│   └── manage (管理)
└── 我的 (my)
```

---

## 4. 数据库设计

### 4.1 users (用户表)
```javascript
{
  _id: ObjectId,
  _openid: String,          // 用户openid
  nickName: String,          // 微信昵称
  avatarUrl: String,         // 头像URL
  role: String,              // "admin" | "user"
  createTime: Date,          // 创建时间
  updateTime: Date           // 更新时间
}
```

### 4.2 categories (分类表)
```javascript
{
  _id: ObjectId,
  name: String,              // 分类名称
  parentId: String,          // 父级ID (空字符串表示顶级分类)
  level: Number,             // 层级 (1-4)
  sort: Number,              // 排序号
  image: String,             // 分类图标/图片
  createTime: Date,
  updateTime: Date
}
```

### 4.3 products (产品表)
```javascript
{
  _id: ObjectId,
  name: String,              // 产品名称
  description: String,      // 产品描述
  categoryId: String,       // 所属分类ID
  categoryPath: String,      // 分类路径 "id1,id2,id3,id4"
  specifications: Array,     // 规格列表
  // 示例: [{name: "规格名", value: "规格值"}]
  images: Array,             // 产品图片列表 (Cloud ID)
  detailImages: Array,       // 详情图片列表 (Cloud ID)
  price: Number,             // 价格
  createTime: Date,
  updateTime: Date
}
```

---

## 5. 功能详细设计

### 5.1 首页 (index)
- **搜索栏**: 搜索产品名称
- **产品列表**: 网格布局展示产品卡片
- **产品卡片**: 显示图片、名称、价格
- **下拉刷新**: 刷新产品列表

### 5.2 分类页 (category)
- **分类选择器**: 4级联动选择器
  - 第1级: 大类
  - 第2级: 子类
  - 第3级: 子子类
  - 第4级: 细分类
- **产品列表**: 选择分类后展示对应产品
- **分类切换**: 切换分类后自动更新产品列表

### 5.3 产品详情页 (product/detail)
- **产品图片**: 轮播图展示
- **产品信息**: 名称、描述、价格
- **规格信息**: 展示所有规格
- **详情图片**: 详情页大图展示

### 5.4 我的页面 (my/index)
- **用户信息**: 头像、昵称、登录状态
- **角色标识**: 显示当前角色
- **管理员入口**: 角色为admin时显示
  - 分类管理
  - 产品管理
- **登录/注销**: 微信一键登录

### 5.5 分类管理页 (category/manage) - 管理员
- **分类树形列表**: 展示所有分类层级
- **添加分类**: 选择父分类，输入名称
- **编辑分类**: 修改名称
- **删除分类**: 删除当前分类（需确认无子分类和产品）
- **排序**: 支持拖拽或数字排序

### 5.6 产品管理页 (product/manage) - 管理员
- **产品列表**: 展示所有产品
- **添加产品**:
  - 选择分类 (4级联动)
  - 上传产品图片 (最多9张)
  - 填写名称、描述
  - 添加规格 (多组属性)
  - 上传详情图片 (最多20张)
- **编辑产品**: 修改所有字段
- **删除产品**: 删除产品

---

## 6. 权限设计

### 角色定义
| 角色 | 标识 | 权限 |
|------|------|------|
| 普通用户 | `user` | 浏览、搜索、查看 |
| 管理员 | `admin` | 浏览 + 管理 |

### 权限控制
1. **数据库层**: 在users表中存储role字段
2. **页面层**: 
   - 管理员页面检查role="admin"
   - 非管理员访问管理页面时提示无权限
3. **接口层**: 敏感操作需验证管理员身份

---

## 7. UI/UX 设计规范

### 配色方案
- **主色调**: #1AAD19 (微信绿) - 可根据品牌调整
- **次要色**: #F5F5F5 (背景灰)
- **文字色**: #333333 (深灰)
- **辅助色**: #666666 (中灰)
- **边框色**: #E5E5E5 (浅灰)

### 布局规范
- **设计尺寸**: 375px (iPhone 6/7/8)
- **安全边距**: 30rpx (左右各15rpx)
- **卡片圆角**: 12rpx
- **按钮高度**: 88rpx

### 组件规范
- TabBar: 使用微信原生tabBar
- 列表: 使用wx:for循环
- 图片: 使用wx:image加载云存储图片
- 弹窗: 使用wx.showModal

---

## 8. 项目文件结构

```
floor_minprogram/
├── app.js                    # 小程序逻辑
├── app.json                  # 小程序配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json              # sitemap配置
├── pages/
│   ├── index/               # 首页
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── category/            # 分类页
│   │   ├── category.js
│   │   ├── category.json
│   │   ├── category.wxml
│   │   ├── category.wxss
│   │   └── manage/          # 分类管理
│   │       ├── manage.js
│   │       ├── manage.json
│   │       ├── manage.wxml
│   │       └── manage.wxss
│   ├── product/             # 产品相关
│   │   ├── detail/          # 产品详情
│   │   │   ├── detail.js
│   │   │   ├── detail.json
│   │   │   ├── detail.wxml
│   │   │   └── detail.wxss
│   │   └── manage/          # 产品管理
│   │       ├── manage.js
│   │       ├── manage.json
│   │       ├── manage.wxml
│   │       └── manage.wxss
│   └── my/                  # 我的页面
│       ├── index.js
│       ├── index.json
│       ├── index.wxml
│       └── index.wxss
├── components/              # 公共组件
├── utils/                   # 工具函数
├── images/                  # 图片资源
└── cloudfunctions/          # 云函数
```

---

## 9. 关键实现要点

### 4级分类联动实现
- 使用picker组件的mode="multiSelector"
- 动态构建每个picker的range数据
- 监听change事件更新选中值

### 图片上传实现
- 使用wx.chooseImage选择图片
- 使用wx.cloud.uploadFile上传到云存储
- 存储返回的fileID

### 权限验证实现
- 登录时获取openid并查询用户角色
- 存储角色到globalData
- 每次进入管理页面检查权限

---

## 10. 测试要点

1. **TabBar切换**: 确认首页和分类可正常切换
2. **搜索功能**: 输入关键词能过滤产品
3. **分类选择**: 4级选择器能正确联动
4. **角色切换**: 管理员能看到管理入口
5. **CRUD操作**: 分类和产品的增删改查
6. **图片上传**: 图片能正常上传和显示
7. **权限控制**: 普通用户无法访问管理页面

---

## 11. 后续迭代 (可选)

- [ ] 产品收藏功能
- [ ] 产品分享功能
- [ ] 购物车
- [ ] 订单管理
- [ ] 客服消息
- [ ] 小程序码推广
