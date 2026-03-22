/**
 * 微信小程序tabbar图标生成脚本
 * 运行: node scripts/download_tabbar_icons.js
 * 
 * 生成简单的图标 - 房屋、分类、人物
 */

const fs = require('fs');
const path = require('path');

// 图标保存目录
const ICONS_DIR = path.join(__dirname, '../images/tabbar');

// 确保目录存在
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 创建简单PNG的函数 - 使用原始字节创建最小PNG
function createSimplePng(width, height, r, g, b) {
  // PNG文件头
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR块
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdr = createPngChunk('IHDR', ihdrData);
  
  // IDAT块 - 图像数据
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b);
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createPngChunk('IDAT', compressed);
  
  // IEND块
  const iend = createPngChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createPngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32计算
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCrcTable();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c;
  }
  return crcTable;
}

// 创建带简单形状的PNG
function createIconPng(filename, drawFunc) {
  const width = 81;
  const height = 81;
  
  // 创建RGBA数据
  const pixels = Buffer.alloc(width * height * 4);
  
  // 背景色
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4 + 3] = 0; // 透明
  }
  
  // 绘制形状
  drawFunc(pixels, width, height);
  
  // 转换为PNG
  return createPngFromRgba(pixels, width, height);
}

function createPngFromRgba(pixels, width, height) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  const ihdr = createPngChunk('IHDR', ihdrData);
  
  // IDAT
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rawData.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const idat = createPngChunk('IDAT', compressed);
  
  // IEND
  const iend = createPngChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// 绘制矩形
function fillRect(pixels, width, x, y, w, h, r, g, b, a = 255) {
  for (let py = y; py < y + h && py < height; py++) {
    for (let px = x; px < x + w && px < width; px++) {
      if (px >= 0 && py >= 0) {
        const i = (py * width + px) * 4;
        pixels[i] = r;
        pixels[i+1] = g;
        pixels[i+2] = b;
        pixels[i+3] = a;
      }
    }
  }
}

const height = 81;

// 图标绘制函数
const icons = {
  // 首页 - 房子
  'index-normal': (pixels, width, height) => {
    // 背景灰色
    fillRect(pixels, width, 0, 0, width, height, 102, 102, 102);
    // 屋顶三角形
    for (let y = 15; y < 35; y++) {
      const halfWidth = (y - 15) * 2;
      fillRect(pixels, width, 40 - halfWidth, y, halfWidth * 2, 1, 255, 255, 255);
    }
    // 墙体
    fillRect(pixels, width, 20, 32, 41, 49, 255, 255, 255);
    // 门
    fillRect(pixels, width, 35, 50, 11, 31, 102, 102, 102);
  },
  'index-active': (pixels, width, height) => {
    // 背景蓝色
    fillRect(pixels, width, 0, 0, width, height, 0, 102, 204);
    // 屋顶三角形
    for (let y = 15; y < 35; y++) {
      const halfWidth = (y - 15) * 2;
      fillRect(pixels, width, 40 - halfWidth, y, halfWidth * 2, 1, 255, 255, 255);
    }
    // 墙体
    fillRect(pixels, width, 20, 32, 41, 49, 255, 255, 255);
    // 门
    fillRect(pixels, width, 35, 50, 11, 31, 0, 102, 204);
  },
  
  // 分类 - 网格
  'category-normal': (pixels, width, height) => {
    fillRect(pixels, width, 0, 0, width, height, 102, 102, 102);
    // 4个方块
    fillRect(pixels, width, 15, 15, 22, 22, 255, 255, 255);
    fillRect(pixels, width, 44, 15, 22, 22, 255, 255, 255);
    fillRect(pixels, width, 15, 44, 22, 22, 255, 255, 255);
    fillRect(pixels, width, 44, 44, 22, 22, 255, 255, 255);
  },
  'category-active': (pixels, width, height) => {
    fillRect(pixels, width, 0, 0, width, height, 0, 102, 204);
    fillRect(pixels, width, 15, 15, 22, 22, 255, 255, 255);
    fillRect(pixels, width, 44, 15, 22, 22, 255, 255, 255);
    fillRect(pixels, width, 15, 44, 22, 22, 255, 255, 255);
    fillRect(pixels, width, 44, 44, 22, 22, 255, 255, 255);
  },
  
  // 我的 - 人物
  'my-normal': (pixels, width, height) => {
    fillRect(pixels, width, 0, 0, width, height, 102, 102, 102);
    // 头
    fillCircle(pixels, width, 40, 25, 12, 255, 255, 255);
    // 身体
    fillRect(pixels, width, 25, 40, 30, 30, 255, 255, 255);
  },
  'my-active': (pixels, width, height) => {
    fillRect(pixels, width, 0, 0, width, height, 0, 102, 204);
    fillCircle(pixels, width, 40, 25, 12, 255, 255, 255);
    fillRect(pixels, width, 25, 40, 30, 30, 255, 255, 255);
  }
};

function fillCircle(pixels, width, cx, cy, r, rColor, gColor, bColor) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) {
          const i = (y * width + x) * 4;
          pixels[i] = rColor;
          pixels[i+1] = gColor;
          pixels[i+2] = bColor;
          pixels[i+3] = 255;
        }
      }
    }
  }
}

function main() {
  console.log('生成tabbar图标...\n');
  
  // 生成图标
  for (const [name, drawFunc] of Object.entries(icons)) {
    const pngPath = path.join(ICONS_DIR, `${name}.png`);
    const png = createIconPng(name, drawFunc);
    fs.writeFileSync(pngPath, png);
    console.log(`✓ ${pngPath}`);
  }
  
  // 更新app.json
  const appJsonPath = path.join(__dirname, '../app.json');
  let appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  appJson.tabBar.list = [
    {
      pagePath: "pages/index/index",
      text: "首页",
      iconPath: "images/tabbar/index-normal.png",
      selectedIconPath: "images/tabbar/index-active.png"
    },
    {
      pagePath: "pages/category/category",
      text: "分类",
      iconPath: "images/tabbar/category-normal.png",
      selectedIconPath: "images/tabbar/category-active.png"
    },
    {
      pagePath: "pages/my/index",
      text: "我的",
      iconPath: "images/tabbar/my-normal.png",
      selectedIconPath: "images/tabbar/my-active.png"
    }
  ];
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf8');
  console.log('\n✓ 已更新 app.json');
}

main();
