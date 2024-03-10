const errorlog = (text) => {
    throw Error(text);
};
class ImageResolver {
    // client-only
    readAsElement(img) {
        const cavans = document.createElement("canvas");
        cavans.width = img.width;
        cavans.height = img.height;
        const ctx = cavans.getContext("2d");
        ctx.drawImage(img, 0, 0, cavans.width, cavans.height);
        const imageData = ctx.getImageData(0, 0, cavans.width, cavans.height);
        return new Mat(imageData);
    }
    // base64 或者非跨域url
    async readAsDataUrl(url, { width, height } = {}) {
        if (!url) {
            errorlog("no url！");
        }
        try {
            const mat = await ImageResolver.resolveWithUrl(url, width, height);
            return Promise.resolve(mat);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    // 读取blob 或 file对象
    async readAsData(blob, { width, height } = {}) {
        if (!blob.size) {
            errorlog("no content blob");
        }
        const url = URL.createObjectURL(blob);
        try {
            const mat = await ImageResolver.resolveWithUrl(url, width, height);
            return Promise.resolve(mat);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    // 图像的 浅色擦除/深色擦除      渐隐比例：0.50
    fade(mat, mode, percent) {
        const per = mode === "in" ? 1 - percent : percent;
        const C = per * 255;
        const [R, G, B] = [C, C, C];
        switch (mode) {
            case "in":
                mat.recycle((pixel, row, col) => {
                    const [NR, NG, NB] = pixel;
                    if (NR + NG + NB >= R + G + B) {
                        mat.update(row, col, "R", 255);
                        mat.update(row, col, "G", 255);
                        mat.update(row, col, "B", 255);
                    }
                });
                break;
            case "out":
                mat.recycle((pixel, row, col) => {
                    const [NR, NG, NB] = pixel;
                    if (NR + NG + NB <= R + G + B) {
                        mat.update(row, col, "R", 255);
                        mat.update(row, col, "G", 255);
                        mat.update(row, col, "B", 255);
                    }
                });
                break;
        }
    }
    // 图像的纯色化处理 （非白非透明转为指定颜色）
    native(mat, color = "#000000") {
        const c = color.slice(1);
        const [NR, NG, NB] = [
            Number(`0x${c.slice(0, 2)}`),
            Number(`0x${c.slice(2, 4)}`),
            Number(`0x${c.slice(4, 6)}`),
        ];
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            if (R !== 255 || G !== 255 || B !== 255) {
                mat.update(row, col, "R", NR);
                mat.update(row, col, "G", NG);
                mat.update(row, col, "B", NB);
            }
        });
    }
    // 纯色化反转
    nativeRollback(mat) {
        const currentColor = [0, 0, 0, 0];
        mat.recycle((pixel) => {
            const [R, G, B] = pixel;
            if (R !== 255 || G !== 255 || B !== 255) {
                currentColor[0] = R;
                currentColor[1] = G;
                currentColor[2] = B;
                return "break";
            }
        });
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            if (R === currentColor[0] &&
                G === currentColor[1] &&
                B === currentColor[2]) {
                mat.update(row, col, "R", 255);
                mat.update(row, col, "G", 255);
                mat.update(row, col, "B", 255);
            }
            else {
                mat.update(row, col, "R", currentColor[0]);
                mat.update(row, col, "G", currentColor[1]);
                mat.update(row, col, "B", currentColor[2]);
            }
        });
    }
    // 图像的透明像素转换为指定颜色（默认白）
    dropTransparent(mat, color = "#FFFFFFff") {
        const c = color.slice(1);
        const [NR, NG, NB, NA] = [
            Number(`0x${c.slice(0, 2)}`),
            Number(`0x${c.slice(2, 4)}`),
            Number(`0x${c.slice(4, 6)}`),
            c.length >= 8 ? Number(`0x${c.slice(6, 8)}`) : 255,
        ];
        mat.recycle((pixel, row, col) => {
            const A = pixel[3];
            if (A === 0) {
                mat.update(row, col, "R", NR);
                mat.update(row, col, "G", NG);
                mat.update(row, col, "B", NB);
                mat.update(row, col, "A", NA);
            }
        });
    }
    // 颜色逆转 本质为255 - 当前色值（透明度相同）
    colorRollback(mat) {
        mat.recycle((pixel, row, col) => {
            const [R, G, B, A] = pixel;
            mat.update(row, col, "R", 255 - R);
            mat.update(row, col, "G", 255 - G);
            mat.update(row, col, "B", 255 - B);
            mat.update(row, col, "A", 255 - A);
        });
    }
    // 图像灰度化处理（加权平均法）
    gray(mat) {
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            const Gray = Math.floor(ImageResolver.rgbToGray(R, G, B));
            mat.update(row, col, "R", Gray);
            mat.update(row, col, "G", Gray);
            mat.update(row, col, "B", Gray);
        });
    }
    // 中值滤波（中值滤波），用于去除 椒盐噪点与胡椒噪点
    medianBlur(mat, size) {
        if (size % 2 !== 1) {
            errorlog("size需为奇整数！");
        }
        const half = -Math.floor(size / 2);
        const absHalf = Math.abs(half);
        mat.recycle((_pixel, row, col) => {
            const Gs = [];
            // size * size 的像素矩阵
            for (let i = half; i <= absHalf; i++) {
                for (let j = half; j <= absHalf; j++) {
                    const [R, G, B] = mat.at(row + i, col + j);
                    const Gray = ImageResolver.rgbToGray(R, G, B);
                    Gs.push({ gray: Gray, R, G, B });
                }
            }
            const gsv = Gs.filter((item) => item.gray);
            if (!gsv.length)
                return;
            // 奇数中位数
            gsv.sort((a, b) => a.gray - b.gray);
            if (gsv.length % 2 === 1) {
                // 取中位数
                const { R, G, B } = gsv[Math.floor(Gs.length / 2)];
                // 设置中位数灰度的还原色
                mat.update(row, col, "R", R);
                mat.update(row, col, "G", G);
                mat.update(row, col, "B", B);
            }
            else {
                const l = gsv.length;
                // 偶数中位数
                const { R: R1, G: G1, B: B1 } = gsv[l / 2];
                const { R: R2, G: G2, B: B2 } = gsv[l / 2 - 1];
                mat.update(row, col, "R", Math.floor((R1 + R2) / 2));
                mat.update(row, col, "G", Math.floor((G1 + G2) / 2));
                mat.update(row, col, "B", Math.floor((B1 + B2) / 2));
            }
        });
    }
    // 高斯滤波
    gaussianBlur(mat, ksize, sigmaX = 0, sigmaY = sigmaX) {
        if (ksize % 2 === 0) {
            errorlog("size需为奇整数！");
        }
        // 如果没有sigma参数，则自动计算signmaX
        if (!sigmaX || sigmaX === 0) {
            sigmaX = 0.3 * ((ksize - 1) / 2 - 1) + 0.8;
        }
        if (!sigmaY || sigmaY === 0) {
            sigmaY = sigmaX;
        }
        const gaussianKernel = ImageResolver.calcGaussianKernel(ksize, sigmaX, sigmaY);
        if (!gaussianKernel.length)
            return;
        const half = Math.floor(ksize / 2);
        mat.recycle((_pixel, row, col) => {
            // 应用高斯权重
            let NR = 0, NG = 0, NB = 0, NA = 0;
            for (let kx = 0; kx < ksize; kx++) {
                for (let ky = 0; ky < ksize; ky++) {
                    let offsetX = row + kx - half;
                    let offsetY = col + ky - half;
                    offsetX = Math.max(offsetX, 0);
                    offsetX = Math.min(offsetX, mat.rows - 1);
                    offsetY = Math.max(offsetY, 0);
                    offsetY = Math.min(offsetY, mat.cols - 1);
                    const rate = gaussianKernel[kx][ky];
                    const [R, G, B, A] = mat.at(offsetX, offsetY);
                    NR += R * rate;
                    NG += G * rate;
                    NB += B * rate;
                    NA += A * rate;
                }
            }
            mat.update(row, col, "R", Math.round(NR));
            mat.update(row, col, "G", Math.round(NG));
            mat.update(row, col, "B", Math.round(NB));
            mat.update(row, col, "A", Math.round(NA));
        });
    }
    // 均值滤波
    meanBlur(mat, ksize, boderType = 1) {
    }
    // 线性对比度增强参数
    static LINER_CONTRAST = 1.5;
    // 亮度固定增强参数
    static BRIGHTNESS_CONTRAST = 50;
    // 饱和度增强参数
    static SATURATION_CONTRAST = 2;
    // LUT算法（色彩增强）
    LUT(mat, lutTable) {
        if (arguments.length === 1 || !lutTable?.length) {
            // 生成固定鲜艳规则
            lutTable = new Uint8ClampedArray(256);
            for (let i = 0; i < 256; i++) {
                lutTable[i] = Math.min(255, Math.floor(i * ImageResolver.SATURATION_CONTRAST));
            }
        }
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            mat.update(row, col, "R", lutTable[R]);
            mat.update(row, col, "G", lutTable[G]);
            mat.update(row, col, "B", lutTable[B]);
        });
    }
    // 二值化处理，
    // 参数 1. 灰度值 2. 阈值 3. 最大值 4. 二值化类型
    threshold(mat, threshold, maxValue, type = ImageResolver.THRESH_BINARY, mode = ImageResolver.THRESH_MODE_THRESHOLD) {
        mat.recycle((_pixel, row, col) => {
            const [R, G, B] = mat.at(row, col);
            const gray = ImageResolver.rgbToGray(R, G, B); // 计算算像素灰度值
            let newValue;
            switch (mode) {
                // 固定阈值模式
                case ImageResolver.THRESH_MODE_THRESHOLD:
                    newValue = ImageResolver.calcThresholdValue(gray, threshold, maxValue, type);
                    break;
                case ImageResolver.THRESH_MODE_OTSU:
                    // Otsu模式
                    newValue = ImageResolver.calcThresholdValue(gray, ImageResolver.calcOtsuThreshold(mat), maxValue, type);
                    break;
                case ImageResolver.THRESH_MODE_MANUAL:
                    // 手动模式
                    newValue = ImageResolver.calcThresholdValue(gray, threshold, maxValue, type);
                    break;
            }
            mat.update(row, col, "R", newValue);
            mat.update(row, col, "G", newValue);
            mat.update(row, col, "B", newValue);
        });
    }
    // 加权平均法 红色通道（R）因子
    static GRAY_SCALE_RED = 0.2989;
    // 加权平均法 绿色通道（G）因子
    static GRAY_SCALE_GREEN = 0.5870;
    // 加权平均法 蓝色通道（B）因子
    static GRAY_SCALE_BLUE = 0.1140;
    // 加权平均法，计算结果
    // 遵循国际公式：Y = 0.299 R + 0.587 G + 0.114 B
    static rgbToGray(R, G, B) {
        return (R * ImageResolver.GRAY_SCALE_RED +
            G * ImageResolver.GRAY_SCALE_GREEN +
            B * ImageResolver.GRAY_SCALE_BLUE);
    }
    // 用于解析url图片
    static resolveWithUrl(url, limitWidth, limitHeight) {
        return new Promise((resolve, reject) => {
            const img = new Image(limitWidth ?? undefined, limitHeight ?? undefined);
            img.addEventListener("load", () => {
                const cavans = document.createElement("canvas");
                cavans.width = img.width;
                cavans.height = img.height;
                const ctx = cavans.getContext("2d");
                ctx.drawImage(img, 0, 0, cavans.width, cavans.height);
                const imageData = ctx.getImageData(0, 0, cavans.width, cavans.height);
                resolve(new Mat(imageData));
                img.remove();
                cavans.remove();
            });
            img.addEventListener("error", (...args) => {
                reject(args[1]);
            });
            img.setAttribute("src", url);
        });
    }
    // 高斯函数代入
    static gaussianFunction(x, y, sigmaX, sigmaY) {
        const exponentX = -((x * x) / (2 * sigmaX * sigmaX));
        const exponentY = -((y * y) / (2 * sigmaY * sigmaY));
        const coefficient = 1 / (2 * Math.PI * sigmaX * sigmaY);
        const value = coefficient * Math.exp(exponentX + exponentY);
        return value;
    }
    // 获取高斯矩阵
    static calcGaussianKernel(ksize, sigmaX, sigmaY) {
        const kernel = [];
        const half = Math.floor(ksize / 2);
        // 生成初始矩阵
        for (let x = -half; x <= half; x++) {
            const row = half + x;
            kernel[row] = [];
            for (let y = -half; y <= half; y++) {
                const col = half + y;
                kernel[row][col] = ImageResolver.gaussianFunction(x, y, sigmaX, sigmaY);
            }
        }
        // 卷积核归一化
        let sum = 0;
        for (let x = 0; x < ksize; x++) {
            for (let y = 0; y < ksize; y++) {
                sum += kernel[x][y];
            }
        }
        for (let i = 0; i < ksize; i++) {
            for (let j = 0; j < ksize; j++) {
                kernel[i][j] /= sum;
            }
        }
        return kernel;
    }
    // 二值化类型
    // 只有大于阈值的像素灰度值值为最大值，其他像素灰度值值为最小值。
    static THRESH_BINARY = 1;
    // 与 1相反
    static THRESH_BINARY_INV = 2;
    // 截断阈值处理，大于阈值的像素灰度值被赋值为阈值，小于阈值的像素灰度值保持原值不变。
    static THRESH_TRUNC = 3;
    // 置零阈值处理，只有大于阈值的像素灰度值被置为0，其他像素灰度值保持原值不变。
    static THRESH_TOZERO = 4;
    // 反置零阈值处理，只有小于阈值的像素灰度值被置为0，其他像素灰度值保持原值不变。
    static THRESH_TOZERO_INV = 5;
    // 二值化模式  表示阈值处理后，如何处理大于阈值的像素值。
    // 表示直接使用阈值处理。
    static THRESH_MODE_THRESHOLD = 1;
    // 表示使用Otsu's二值化方法进行阈值处理。
    static THRESH_MODE_OTSU = 2;
    // 表示使用手动指定的阈值进行阈值处理
    static THRESH_MODE_MANUAL = 3;
    //根据二值化类型，计算阈值
    // 参数 1. 灰度值 2. 阈值 3. 最大值 4. 二值化类型
    static calcThresholdValue(value, threshold, maxValue, type) {
        let newValue;
        switch (type) {
            case ImageResolver.THRESH_BINARY:
                // THRESH_BINARY
                newValue = value < threshold ? 0 : maxValue;
                break;
            case ImageResolver.THRESH_BINARY_INV:
                // THRESH_BINARY_INV
                newValue = value < threshold ? maxValue : 0;
                break;
            case ImageResolver.THRESH_TRUNC:
                // THRESH_TRUNC
                newValue = value < threshold ? value : threshold;
                break;
            case ImageResolver.THRESH_TOZERO:
                // THRESH_TOZERO
                newValue = value < threshold ? 0 : value;
                break;
            case ImageResolver.THRESH_TOZERO_INV:
                // THRESH_TOZERO_INV
                newValue = value < threshold ? value : 0;
                break;
        }
        return newValue;
    }
    // 计算 Otsu应用值
    static calcOtsuThreshold(mat) {
        // 计算灰度直方图
        const histogram = new Array(256).fill(0);
        let totalPixels = 0;
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            const gray = ImageResolver.rgbToGray(R, G, B);
            histogram[Math.floor(gray)]++;
            totalPixels++;
        });
        // 归一化直方图
        let normalizedHistogram = histogram.map((count) => count / totalPixels);
        // 计算类间方差，以找到最佳阈值
        let bestThreshold = 0;
        let maxVariance = 0;
        for (let threshold = 0; threshold < 256; threshold++) {
            let w0 = normalizedHistogram
                .slice(0, threshold + 1)
                .reduce((a, b) => a + b, 0);
            let w1 = 1 - w0;
            let u0 = normalizedHistogram
                .slice(0, threshold + 1)
                .map((p, i) => i * p)
                .reduce((a, b) => a + b, 0);
            let u1 = normalizedHistogram
                .slice(threshold + 1)
                .map((p, i) => i * p)
                .reduce((a, b) => a + b, 0);
            let variance = w0 * w1 * Math.pow(u0 / w0 - u1 / w1, 2);
            if (variance > maxVariance) {
                maxVariance = variance;
                bestThreshold = threshold;
            }
        }
        return bestThreshold;
    }
}
class Mat {
    rows;
    cols;
    channels;
    size;
    data;
    constructor(imageData) {
        this.rows = imageData.height;
        this.cols = imageData.width;
        this.size = { width: imageData.width, height: imageData.height };
        this.channels = 4;
        this.data = imageData.data;
    }
    clone() {
        const { data, size: { width, height }, } = this;
        const uin = new Uint8ClampedArray(data);
        const imageData = new ImageData(uin, width, height);
        return new Mat(imageData);
    }
    delete() {
        this.data = new Uint8ClampedArray(0);
    }
    update(row, col, type, value) {
        const { data } = this;
        const [R, G, B, A] = this.getAddress(row, col);
        switch (type) {
            case "R":
                data[R] = value;
                break;
            case "G":
                data[G] = value;
                break;
            case "B":
                data[B] = value;
                break;
            case "A":
                data[A] = value;
                break;
        }
    }
    getAddress(row, col) {
        const { channels, cols } = this;
        // 坐标解析，根据x行y列，计算数据的索引值
        // 本质为换行查找
        // 一行的列数 * 所在行数 * 通道数 为走过的行像素数；
        // 所在列数 * 通道数为 该行走过的列数；
        // 则 R为所得的索引值 G、B、A那就都有了
        const R = cols * row * channels + col * channels;
        return [R, R + 1, R + 2, R + 3];
    }
    recycle(callback) {
        const { rows, cols } = this;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const b = callback(this.at(row, col), row, col);
                if (b === "break") {
                    return;
                }
            }
        }
    }
    at(row, col) {
        const { data } = this;
        const [R, G, B, A] = this.getAddress(row, col);
        return [data[R], data[G], data[B], data[A]];
    }
    imgshow(canvas) {
        const canvasEl = canvas instanceof HTMLCanvasElement
            ? canvas
            : document.querySelector(canvas);
        if (!canvasEl) {
            errorlog("无法找到canvas当前元素！");
        }
        const { data, size } = this;
        const { width, height } = size;
        const imageData = new ImageData(data, width, height);
        canvasEl.width = width;
        canvasEl.height = height;
        const ctx = canvasEl.getContext("2d");
        ctx.putImageData(imageData, 0, 0);
    }
    toDataUrl(type, quality = 1) {
        const canvas = document.createElement("canvas");
        this.imgshow(canvas);
        return canvas.toDataURL(type ?? "image/png", quality);
    }
    toBlob(type, quality = 1) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            this.imgshow(canvas);
            canvas.toBlob((blob) => {
                if (!blob || !blob.size) {
                    return reject(new Error("转换失败：不存在的blob或blob大小为空"));
                }
                resolve(blob);
            }, type ?? "image/png", quality);
        });
    }
}
// const cv = new ImageResolver();
window.cv = new ImageResolver();
// export { cv };
