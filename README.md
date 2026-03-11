# 地板展示小程序

一款基于微信云开发的地板产品展示与管理小程序，支持多角色管理、4级分类、产品管理等功能。

## 功能特点

- **双 TabBar 页面**：首页、分类
- **双角色系统**：管理员、普通客户
- **4级分类管理**：支持最多4级分类结构
- **产品管理**：支持图片上传、规格设置、详情页管理
- **云开发支持**：云数据库、云存储、云函数
- **数据 fallback**：数据库为空时自动使用 mock 数据

## 项目结构

```
floor_minprogram/
├── app.js                 # 小程序入口
├── app.json               # 全局配置
├── app.wxss               # 全局样式
├── project.config.json    # 项目配置
├── cloudfunctions/        # 云函数
│   └── getUserInfo/      # 获取用户信息云函数
├── images/                # 图片资源
├── pages/                 # 页面目录
│   ├── index/             # 首页
│   │   ├── index.js
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   ├── category/          # 分类页面
│   │   ├── category.js   # 分类列表
│   │   ├── manage.js     # 分类管理（管理员）
│   │   └── subcategory.js # 子分类管理
│   ├── product/          # 产品页面
│   │   ├── detail.js     # 产品详情
│   │   └── manage.js     # 产品管理（管理员）
│   ├── my/               # 我的页面
│   │   └── index.js
│   └── search/           # 搜索页面
│       └── search.js
└── utils/                 # 工具函数
    ├── auth.js           # 登录认证
    ├── db.js             # 数据库操作
    └── mockData.js       # Mock 数据
```

## 页面功能

### TabBar 页面

| 页面 | 功能 |
|------|------|
| 首页 | 产品列表展示、搜索、热门产品轮播、分类快捷入口 |
| 分类 | 左侧二级分类列表、右侧产品筛选 |

### 功能页面

| 页面 | 权限 | 功能 |
|------|------|------|
| 产品详情 | 全部用户 | 查看产品图片、描述、规格 |
| 我的 | 全部用户 | 登录、角色管理、管理入口 |
| 分类管理 | 管理员 | 添加/编辑/删除分类、上传分类图片 |
| 产品管理 | 管理员 | 添加/编辑/删除产品、上传产品图片 |

## 数据库设计

### users (用户表)
| 字段 | 类型 | 说明 |
|------|------|------|
| _openid | String | 用户 openid |
| nickName | String | 微信昵称 |
| avatarUrl | String | 头像 URL |
| role | String | 角色：admin/admin |
| createTime | Date | 创建时间 |
| updateTime | Date | 更新时间 |

### categories (分类表)
| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 分类名称 |
| parentId | String | 父分类 ID |
| level | Number | 分类级别 (1-4) |
| sort | Number | 排序 |
| image | String | 分类图片 URL |

### products (产品表)
| 字段 | 类型 | 说明 |
|------|------|------|
| name | String | 产品名称 |
| description | String | 产品描述 |
| categoryId | String | 分类 ID |
| categoryPath | String | 分类路径 |
| specifications | Array | 规格信息 |
| images | Array | 产品图片 |
| detailImages | Array | 详情图片 |
| isHot | Boolean | 是否热门 |

## 快速开始

### 1. 创建云开发环境

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序管理后台
3. 开通云开发，创建云开发环境

### 2. 配置项目

1. 打开 `project.config.json`，修改以下配置：
   - `appid`: 你的小程序 AppID
   - `cloudfunctionRoot`: 云函数目录
   - 在开发者工具中设置云开发环境 ID

### 3. 创建数据库集合

在云开发控制台创建以下集合：
- `users`
- `categories`
- `products`

### 4. 部署云函数

```bash
# 在微信开发者工具中右键 cloudfunctions 文件夹
# 选择"上传并部署：云端安装依赖"
```

### 5. 运行项目

在微信开发者工具中打开项目，点击"编译"即可运行。

## 角色权限

### 管理员 (admin)
- 可访问分类管理页面
- 可访问产品管理页面
- 可添加、编辑、删除分类
- 可添加、编辑、删除产品

### 普通用户 (user)
- 可浏览产品
- 可查看产品详情
- 不可访问管理页面

## 技术栈

- 微信小程序原生开发
- 微信云开发 (CloudBase)
- WXML + WXSS + JavaScript

## 注意事项

1. **数据 fallback**：数据库为空时自动使用 mock 数据，方便开发和测试
2. **登录验证**：查看产品详情需要先登录
3. **权限控制**：管理页面仅管理员可访问
4. **分类层级**：最多支持 4 级分类

## 截图说明

- **首页**：3列产品网格、搜索栏、热门轮播、分类入口
- **分类**：左侧分类列表、右侧产品展示
- **我的**：登录按钮、角色显示、管理入口
- **管理页面**：科技蓝主题风格、表单提交

## 更新日志

### v1.0.0
- 初始版本
- 支持双 TabBar
- 支持双角色
- 支持 4 级分类
- 支持产品管理
