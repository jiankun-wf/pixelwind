# 图像处理库

## 大小仅为 20kb 但是可以随意操纵 RGBA 类型的像素通道

## 目前实现了 以下快捷功能：

1. gray（灰度值处理），参数：mat 数据。加权平均法计算
2. fade（图像擦退效果），参数：mat 数据、擦退模式（深、浅）、擦退比例。
3. native（纯色化处理，非白非透明像素一色化），参数：mat 数据、色值（hex）。
4. nativeRollback（纯色化反转），参数：mat 数据。
5. dropTransparent（去除透明像素），参数：mat 数据、透明像素将要转化的色值
6. colorRollback（色值反转），参数：mat 数据
7. medianBlur（中值滤波/模糊），去除椒盐与胡椒噪点，参数：mat 数据、模糊半径（奇数）
8. gaussianBlur（高斯滤波/模糊），参数：mat 数据、模糊半径（奇数）、sigmaX（x 方差）、sigmaY（y 方差）
9. LUT（色值增强），参数：mat 数据、lutTable（查找表（Look-Up Table）的数据结构，用于存储像素颜色或像素值之间的映射关系）。
10. threshold（二值化处理），参数：mat 数据、阈值（0-255）、最大阈值、阈值类型、阈值模式。

## Mat 数据结构为存放 RGBA 像素的 Uint8ClampedArray 的 TypedArray，有以下属性和方法：

### 属性

1. rows、cols，行数、列数
2. size: { width, height }，图像宽、高
3. channels，通道数（RGBA），固定为 4
4. data，像素数据

### 方法

1. at(x, y)，获取第 x 行 y 列的像素
2. recycle(callback) 循环像素并返回回调函数 callback(pixel：像素值，row: 当前行数，col：当前列数)
3. getAddress(x, y)，用于获取像素在 data 中的地址，参数同 at
4. imgshow(), 用于将 data 数据展示在画布上，参数：canvas 元素或者元素 Id、clip 是否缩放，clipWidth 缩放最大宽度，clipHeight 缩放最大高度
5. toBlob()，将 data 数据转换为 Blob 对象。
6. toDataURL()，将 data 数据转换为 DataURL。

# 使用

## 修改 index.ts(js)的后面几行;

### node 环境中：

`const cv = new ImageResolver()`;
`export { cv }`;

#### 或

`exports.cv = cv`;

### 浏览器：

`window.cv = new ImageResolver()`

## 读取图像

`const mat = cv.readAsDataUrl(url)`
`const mat = cv.readAsBlob(blob)`
`const mat = cv.readAsElement(imgElement)`

## 操作图像

`cv.gray(mat)`
`cv.fade(mat, 'in', 0.65)`
`cv.native(mat, '#000000')`
`cv.nativeRollback(mat)`

## 展示或生成图像

`mat.toBlob(imageType, quality) // 生成blob，会返回Promise`
`mat.toDataURL() //生成base64码`
`mat.imgshow(canvasId, clip = true, clipWidth = 700, clipHeight = 400) // 在 700 * 400 的画布上完全展示图像`
