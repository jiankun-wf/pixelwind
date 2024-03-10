# 图像处理库

## 大小仅为20kb 但是可以随意操纵RGBA类型的像素通道

## 目前实现了 以下快捷功能：

1. gray（灰度值处理），参数：mat数据。加权平均法计算
2. fade（图像擦退效果），参数：mat数据、擦退模式（深、浅）、擦退比例。
3. native（纯色化处理，非白非透明像素一色化），参数：mat数据、色值（hex）。
4. nativeRollback（纯色化反转），参数：mat数据。
5. dropTransparent（去除透明像素），参数：mat数据、透明像素将要转化的色值
6. colorRollback（色值反转），参数：mat数据
7. medianBlur（中值滤波/模糊），去除椒盐与胡椒噪点，参数：mat数据、模糊半径（奇数）
8. gaussianBlur（高斯滤波/模糊），参数：mat数据、模糊半径（奇数）、sigmaX（x方差）、sigmaY（y方差）
9. LUT（色值增强），参数：mat数据、lutTable（查找表（Look-Up Table）的数据结构，用于存储像素颜色或像素值之间的映射关系）。
10. threshold（二值化处理），参数：mat数据、阈值（0-255）、最大阈值、阈值类型、阈值模式。

## Mat数据结构为存放RGBA像素的Uint8ClampedArray的TypedArray，有以下属性和方法：
### 属性
1. rows、cols，行数、列数
2. size: { width, height }，图像宽、高
3. channels，通道数（RGBA），固定为4
4. data，像素数据
### 方法
1. at(x, y)，获取第x行y列的像素
2. recycle(callback) 循环像素并返回回调函数callback(pixel：像素值，row: 当前行数，col：当前列数)
3. getAddress(x, y)，用于获取像素在data中的地址，参数同at
4. imgshow(), 用于将data数据展示在画布上，参数：canvas元素或者元素Id
5. toBlob()，将data数据转换为Blob对象。
6. toDataURL()，将data数据转换为DataURL。