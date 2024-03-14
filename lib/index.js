"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pw = void 0;
var errorlog = function (text) {
    throw Error(text);
};
// 遵循规则 static不爆露
// 用Function感觉会将一些变量暴漏出去
var PixelWind = /** @class */ (function () {
    function PixelWind() {
    }
    // client-only
    PixelWind.prototype.readAsElement = function (img) {
        var cavans = document.createElement("canvas");
        cavans.width = img.width;
        cavans.height = img.height;
        var ctx = cavans.getContext("2d");
        ctx.drawImage(img, 0, 0, cavans.width, cavans.height);
        var imageData = ctx.getImageData(0, 0, cavans.width, cavans.height);
        return new Mat(imageData);
    };
    // base64 或者非跨域url
    PixelWind.prototype.readAsDataUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var mat, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!url) {
                            errorlog("no url！");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, PixelWind.resolveWithUrl(url)];
                    case 2:
                        mat = _a.sent();
                        return [2 /*return*/, Promise.resolve(mat)];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_1)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 读取blob 或 file对象
    PixelWind.prototype.readAsData = function (blob) {
        return __awaiter(this, void 0, void 0, function () {
            var url, mat, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!blob.size) {
                            errorlog("no content blob");
                        }
                        url = URL.createObjectURL(blob);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, PixelWind.resolveWithUrl(url)];
                    case 2:
                        mat = _a.sent();
                        return [2 /*return*/, Promise.resolve(mat)];
                    case 3:
                        e_2 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_2)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // 图像的 浅色擦除/深色擦除      渐隐比例：0.50
    PixelWind.prototype.fade = function (mat, mode, percent) {
        var per = mode === "in" ? 1 - percent : percent;
        var C = per * 255;
        var CR = C, CG = C, CB = C;
        switch (mode) {
            case "in":
                mat.recycle(function (pixel, row, col) {
                    var R = pixel[0], G = pixel[1], B = pixel[2];
                    if (R + G + B >= CR + CG + CB) {
                        mat.update(row, col, "R", 255);
                        mat.update(row, col, "G", 255);
                        mat.update(row, col, "B", 255);
                    }
                });
                break;
            case "out":
                mat.recycle(function (pixel, row, col) {
                    var R = pixel[0], G = pixel[1], B = pixel[2];
                    if (R + G + B <= CR + CG + CB) {
                        mat.update(row, col, "R", 255);
                        mat.update(row, col, "G", 255);
                        mat.update(row, col, "B", 255);
                    }
                });
                break;
        }
    };
    // 图像的纯色化处理 （非白非透明转为指定颜色）
    PixelWind.prototype.native = function (mat, color) {
        if (color === void 0) { color = "#000000"; }
        var c = color.slice(1);
        var _a = [
            Number("0x".concat(c.slice(0, 2))),
            Number("0x".concat(c.slice(2, 4))),
            Number("0x".concat(c.slice(4, 6))),
        ], NR = _a[0], NG = _a[1], NB = _a[2];
        mat.recycle(function (pixel, row, col) {
            var R = pixel[0], G = pixel[1], B = pixel[2];
            if (R !== 255 || G !== 255 || B !== 255) {
                mat.update(row, col, "R", NR);
                mat.update(row, col, "G", NG);
                mat.update(row, col, "B", NB);
            }
        });
    };
    // 纯色化反转
    PixelWind.prototype.nativeRollback = function (mat) {
        var currentColor = [0, 0, 0, 0];
        mat.recycle(function (pixel) {
            var R = pixel[0], G = pixel[1], B = pixel[2];
            if (R !== 255 || G !== 255 || B !== 255) {
                currentColor[0] = R;
                currentColor[1] = G;
                currentColor[2] = B;
                return "break";
            }
        });
        mat.recycle(function (pixel, row, col) {
            var R = pixel[0], G = pixel[1], B = pixel[2];
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
    };
    // 图像的透明像素转换为指定颜色（默认白）
    PixelWind.prototype.dropTransparent = function (mat, color) {
        if (color === void 0) { color = "#FFFFFFff"; }
        var c = color.slice(1);
        var _a = [
            Number("0x".concat(c.slice(0, 2))),
            Number("0x".concat(c.slice(2, 4))),
            Number("0x".concat(c.slice(4, 6))),
            c.length >= 8 ? Number("0x".concat(c.slice(6, 8))) : 255,
        ], NR = _a[0], NG = _a[1], NB = _a[2], NA = _a[3];
        mat.recycle(function (pixel, row, col) {
            var A = pixel[3];
            if (A === 0) {
                mat.update(row, col, "R", NR);
                mat.update(row, col, "G", NG);
                mat.update(row, col, "B", NB);
                mat.update(row, col, "A", NA);
            }
        });
    };
    // 颜色逆转 本质为255 - 当前色值（透明度相同）
    PixelWind.prototype.colorRollback = function (mat) {
        mat.recycle(function (pixel, row, col) {
            var R = pixel[0], G = pixel[1], B = pixel[2], A = pixel[3];
            mat.update(row, col, "R", 255 - R);
            mat.update(row, col, "G", 255 - G);
            mat.update(row, col, "B", 255 - B);
            mat.update(row, col, "A", 255 - A);
        });
    };
    // 图像灰度化处理（加权平均法）
    PixelWind.prototype.gray = function (mat) {
        mat.recycle(function (pixel, row, col) {
            var R = pixel[0], G = pixel[1], B = pixel[2];
            var Gray = Math.floor(PixelWind.rgbToGray(R, G, B));
            mat.update(row, col, "R", Gray);
            mat.update(row, col, "G", Gray);
            mat.update(row, col, "B", Gray);
        });
    };
    // 中值滤波（中值滤波），用于去除 椒盐噪点与胡椒噪点
    // TODO 中位数计算 不要用Gray值，要RGB全计算。
    PixelWind.prototype.medianBlur = function (mat, size) {
        if (size % 2 !== 1) {
            errorlog("size需为奇整数！");
        }
        var half = -Math.floor(size / 2);
        var absHalf = Math.abs(half);
        mat.recycle(function (_pixel, row, col) {
            var gsv = {
                R: [],
                G: [],
                B: [],
                A: [],
            };
            // size * size 的像素矩阵
            for (var i = half; i <= absHalf; i++) {
                var offsetX = row + i;
                if (offsetX < 0 || offsetX >= mat.rows)
                    continue;
                for (var j = half; j <= absHalf; j++) {
                    var offsetY = col + j;
                    if (offsetY < 0 || offsetY >= mat.cols)
                        continue;
                    var _a = mat.at(offsetX, offsetY), R = _a[0], G = _a[1], B = _a[2], A = _a[3];
                    gsv.R.push(R);
                    gsv.G.push(G);
                    gsv.B.push(B);
                    gsv.A.push(A);
                }
            }
            gsv.R.sort(function (a, b) { return a - b; });
            gsv.G.sort(function (a, b) { return a - b; });
            gsv.B.sort(function (a, b) { return a - b; });
            gsv.A.sort(function (a, b) { return a - b; });
            var isOdd = gsv.R.length % 2 !== 0; // 奇数
            var NR, NG, NB, NA;
            // NA;
            // 奇数中位数
            if (isOdd) {
                // 取中位数
                var R = gsv.R, G = gsv.G, B = gsv.B, A = gsv.A;
                var index = Math.floor(R.length / 2);
                NR = R[index];
                NG = G[index];
                NB = B[index];
                NA = A[index];
            }
            else {
                // 偶数中位数
                var R = gsv.R, G = gsv.G, B = gsv.B, A = gsv.A;
                var index = R.length / 2;
                var indexPre = index - 1;
                NR = Math.round((R[index] + R[indexPre]) / 2);
                NG = Math.round((G[index] + G[indexPre]) / 2);
                NB = Math.round((B[index] + B[indexPre]) / 2);
                NA = Math.round((A[index] + A[indexPre]) / 2);
            }
            // 设置中位数灰度的还原色
            mat.update(row, col, "R", NR);
            mat.update(row, col, "G", NG);
            mat.update(row, col, "B", NB);
            // mat.update(row, col, "A", NA);
        });
    };
    // 高斯滤波
    PixelWind.prototype.gaussianBlur = function (mat, ksize, sigmaX, sigmaY) {
        if (sigmaX === void 0) { sigmaX = 0; }
        if (sigmaY === void 0) { sigmaY = sigmaX; }
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
        var gaussianKernel = PixelWind.calcGaussianKernel(ksize, sigmaX, sigmaY);
        if (!gaussianKernel.length)
            return;
        var half = Math.floor(ksize / 2);
        mat.recycle(function (_pixel, row, col) {
            // 应用高斯权重
            var NR = 0, NG = 0, NB = 0, NA = 0;
            for (var kx = 0; kx < ksize; kx++) {
                for (var ky = 0; ky < ksize; ky++) {
                    var offsetX = row + kx - half;
                    var offsetY = col + ky - half;
                    offsetX = Math.max(offsetX, 0);
                    offsetX = Math.min(offsetX, mat.rows - 1);
                    offsetY = Math.max(offsetY, 0);
                    offsetY = Math.min(offsetY, mat.cols - 1);
                    var rate = gaussianKernel[kx][ky];
                    var _a = mat.at(offsetX, offsetY), R = _a[0], G = _a[1], B = _a[2], A = _a[3];
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
    };
    // 均值滤波
    // ksize * ksize 矩阵取平均值
    PixelWind.prototype.meanBlur = function (mat, ksize) {
        if (ksize % 2 === 0) {
            errorlog("size需为奇整数！");
        }
        var half = Math.floor(ksize / 2);
        // ksize * ksize 矩阵数
        var kernelSize = Math.pow(ksize, 2);
        mat.recycle(function (_pixel, row, col) {
            var NR = 0, NG = 0, NB = 0, NA = 0;
            for (var kx = 0; kx < ksize; kx++) {
                for (var ky = 0; ky < ksize; ky++) {
                    var offsetX = row + kx - half;
                    var offsetY = col + ky - half;
                    offsetX = Math.max(offsetX, 0);
                    offsetX = Math.min(offsetX, mat.rows - 1);
                    offsetY = Math.max(offsetY, 0);
                    offsetY = Math.min(offsetY, mat.cols - 1);
                    var _a = mat.at(offsetX, offsetY), R = _a[0], G = _a[1], B = _a[2], A = _a[3];
                    NR += R;
                    NG += G;
                    NB += B;
                    NA += A;
                }
            }
            mat.update(row, col, "R", Math.round(NR / kernelSize));
            mat.update(row, col, "G", Math.round(NG / kernelSize));
            mat.update(row, col, "B", Math.round(NB / kernelSize));
            mat.update(row, col, "A", Math.round(NA / kernelSize));
        });
    };
    // LUT算法（色彩增强）
    PixelWind.prototype.LUT = function (mat, lutTable) {
        if (arguments.length === 1 || !(lutTable === null || lutTable === void 0 ? void 0 : lutTable.length)) {
            // 生成固定鲜艳规则
            lutTable = new Uint8ClampedArray(256);
            for (var i = 0; i < 256; i++) {
                lutTable[i] = Math.min(255, Math.floor(i * PixelWind.SATURATION_CONTRAST));
            }
        }
        mat.recycle(function (pixel, row, col) {
            var R = pixel[0], G = pixel[1], B = pixel[2];
            mat.update(row, col, "R", lutTable[R]);
            mat.update(row, col, "G", lutTable[G]);
            mat.update(row, col, "B", lutTable[B]);
        });
    };
    // 二值化处理，
    // 参数 1. 灰度值 2. 阈值 3. 最大值 4. 二值化类型
    PixelWind.prototype.threshold = function (mat, threshold, maxValue, type, mode) {
        if (type === void 0) { type = PixelWind.THRESH_BINARY; }
        if (mode === void 0) { mode = PixelWind.THRESH_MODE_THRESHOLD; }
        mat.recycle(function (_pixel, row, col) {
            var _a = mat.at(row, col), R = _a[0], G = _a[1], B = _a[2];
            var gray = PixelWind.rgbToGray(R, G, B); // 计算算像素灰度值
            var newValue;
            switch (mode) {
                // 固定阈值模式
                case PixelWind.THRESH_MODE_THRESHOLD:
                    newValue = PixelWind.calcThresholdValue(gray, threshold, maxValue, type);
                    break;
                case PixelWind.THRESH_MODE_OTSU:
                    // Otsu模式
                    newValue = PixelWind.calcThresholdValue(gray, PixelWind.calcOtsuThreshold(mat), maxValue, type);
                    break;
                case PixelWind.THRESH_MODE_MANUAL:
                    // 手动模式
                    newValue = PixelWind.calcThresholdValue(gray, threshold, maxValue, type);
                    break;
            }
            mat.update(row, col, "R", newValue);
            mat.update(row, col, "G", newValue);
            mat.update(row, col, "B", newValue);
        });
    };
    // 加权平均法，计算结果
    // 遵循国际公式：Y = 0.299 R + 0.587 G + 0.114 B
    PixelWind.rgbToGray = function (R, G, B) {
        return (R * PixelWind.GRAY_SCALE_RED +
            G * PixelWind.GRAY_SCALE_GREEN +
            B * PixelWind.GRAY_SCALE_BLUE);
    };
    // 用于解析url图片
    PixelWind.resolveWithUrl = function (url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.addEventListener("load", function () {
                var cavans = document.createElement("canvas");
                cavans.width = img.width;
                cavans.height = img.height;
                var ctx = cavans.getContext("2d");
                ctx.drawImage(img, 0, 0, cavans.width, cavans.height);
                var imageData = ctx.getImageData(0, 0, cavans.width, cavans.height);
                resolve(new Mat(imageData));
                img.remove();
                cavans.remove();
            });
            img.addEventListener("error", function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                reject(args[1]);
            });
            img.setAttribute("src", url);
        });
    };
    // 高斯函数代入
    PixelWind.gaussianFunction = function (x, y, sigmaX, sigmaY) {
        var exponentX = -((x * x) / (2 * sigmaX * sigmaX));
        var exponentY = -((y * y) / (2 * sigmaY * sigmaY));
        var coefficient = 1 / (2 * Math.PI * sigmaX * sigmaY);
        var value = coefficient * Math.exp(exponentX + exponentY);
        return value;
    };
    // 获取高斯矩阵
    PixelWind.calcGaussianKernel = function (ksize, sigmaX, sigmaY) {
        var kernel = [];
        var half = Math.floor(ksize / 2);
        // 矩阵和
        var sum = 0;
        // 生成初始矩阵
        for (var x = -half; x <= half; x++) {
            var row = half + x;
            kernel[row] = [];
            for (var y = -half; y <= half; y++) {
                var col = half + y;
                var gaussianFunctionRes = PixelWind.gaussianFunction(x, y, sigmaX, sigmaY);
                kernel[row][col] = gaussianFunctionRes;
                sum += gaussianFunctionRes;
            }
        }
        //  归一化处理
        for (var i = 0; i < ksize; i++) {
            for (var j = 0; j < ksize; j++) {
                kernel[i][j] /= sum;
            }
        }
        return kernel;
    };
    //根据二值化类型，计算阈值
    // 参数 1. 灰度值 2. 阈值 3. 最大值 4. 二值化类型
    PixelWind.calcThresholdValue = function (value, threshold, maxValue, type) {
        var newValue;
        switch (type) {
            case PixelWind.THRESH_BINARY:
                // THRESH_BINARY
                newValue = value < threshold ? 0 : maxValue;
                break;
            case PixelWind.THRESH_BINARY_INV:
                // THRESH_BINARY_INV
                newValue = value < threshold ? maxValue : 0;
                break;
            case PixelWind.THRESH_TRUNC:
                // THRESH_TRUNC
                newValue = value < threshold ? value : threshold;
                break;
            case PixelWind.THRESH_TOZERO:
                // THRESH_TOZERO
                newValue = value < threshold ? 0 : value;
                break;
            case PixelWind.THRESH_TOZERO_INV:
                // THRESH_TOZERO_INV
                newValue = value < threshold ? value : 0;
                break;
        }
        return newValue;
    };
    // 计算 Otsu应用值
    PixelWind.calcOtsuThreshold = function (mat) {
        // 计算灰度直方图
        var histogram = new Array(256).fill(0);
        var totalPixels = 0;
        mat.recycle(function (pixel, row, col) {
            var R = pixel[0], G = pixel[1], B = pixel[2];
            var gray = PixelWind.rgbToGray(R, G, B);
            histogram[Math.floor(gray)]++;
            totalPixels++;
        });
        // 归一化直方图
        var normalizedHistogram = histogram.map(function (count) { return count / totalPixels; });
        // 计算类间方差，以找到最佳阈值
        var bestThreshold = 0;
        var maxVariance = 0;
        for (var threshold = 0; threshold < 256; threshold++) {
            var w0 = normalizedHistogram
                .slice(0, threshold + 1)
                .reduce(function (a, b) { return a + b; }, 0);
            var w1 = 1 - w0;
            var u0 = normalizedHistogram
                .slice(0, threshold + 1)
                .map(function (p, i) { return i * p; })
                .reduce(function (a, b) { return a + b; }, 0);
            var u1 = normalizedHistogram
                .slice(threshold + 1)
                .map(function (p, i) { return i * p; })
                .reduce(function (a, b) { return a + b; }, 0);
            var variance = w0 * w1 * Math.pow(u0 / w0 - u1 / w1, 2);
            if (variance > maxVariance) {
                maxVariance = variance;
                bestThreshold = threshold;
            }
        }
        return bestThreshold;
    };
    // 线性对比度增强参数
    PixelWind.LINER_CONTRAST = 1.5;
    // 亮度固定增强参数
    PixelWind.BRIGHTNESS_CONTRAST = 50;
    // 饱和度增强参数
    PixelWind.SATURATION_CONTRAST = 1.5;
    // 加权平均法 红色通道（R）因子
    PixelWind.GRAY_SCALE_RED = 0.2989;
    // 加权平均法 绿色通道（G）因子
    PixelWind.GRAY_SCALE_GREEN = 0.587;
    // 加权平均法 蓝色通道（B）因子
    PixelWind.GRAY_SCALE_BLUE = 0.114;
    // 二值化类型
    // 只有大于阈值的像素灰度值值为最大值，其他像素灰度值值为最小值。
    PixelWind.THRESH_BINARY = 1;
    // 与 1相反
    PixelWind.THRESH_BINARY_INV = 2;
    // 截断阈值处理，大于阈值的像素灰度值被赋值为阈值，小于阈值的像素灰度值保持原值不变。
    PixelWind.THRESH_TRUNC = 3;
    // 置零阈值处理，只有大于阈值的像素灰度值被置为0，其他像素灰度值保持原值不变。
    PixelWind.THRESH_TOZERO = 4;
    // 反置零阈值处理，只有小于阈值的像素灰度值被置为0，其他像素灰度值保持原值不变。
    PixelWind.THRESH_TOZERO_INV = 5;
    // 二值化模式  表示阈值处理后，如何处理大于阈值的像素值。
    // 表示直接使用阈值处理。
    PixelWind.THRESH_MODE_THRESHOLD = 1;
    // 表示使用Otsu's二值化方法进行阈值处理。
    PixelWind.THRESH_MODE_OTSU = 2;
    // 表示使用手动指定的阈值进行阈值处理
    PixelWind.THRESH_MODE_MANUAL = 3;
    return PixelWind;
}());
// 图像数据类，不爆露
var Mat = /** @class */ (function () {
    function Mat(imageData) {
        this.rows = imageData.height;
        this.cols = imageData.width;
        this.size = { width: imageData.width, height: imageData.height };
        this.channels = 4;
        this.data = imageData.data;
    }
    Mat.prototype.clone = function () {
        var _a = this, data = _a.data, _b = _a.size, width = _b.width, height = _b.height;
        var uin = new Uint8ClampedArray(data);
        var imageData = new ImageData(uin, width, height);
        return new Mat(imageData);
    };
    Mat.prototype.delete = function () {
        this.data = new Uint8ClampedArray(0);
    };
    // 更耗时间所以放弃
    // useMultipleUpdate() {
    //   const collectList: Array<UpdatePixelParam> = [];
    //   const collect = (...args: UpdatePixelParam[]) => {
    //     const al = args.length;
    //     for (let i = 0; i < al; i++) {
    //       collectList.push(args[i]);
    //     }
    //   };
    //   const exec = () => {
    //     const l = collectList.length;
    //     for (let i = 0; i < l; i++) {
    //       const [row, col, type, value] = collect[i];
    //       this.update(row, col, type, value);
    //     }
    //     collectList.splice(0, l);
    //   };
    //   return { exec: exec.bind.bind(this), collect };
    // }
    Mat.prototype.update = function (row, col, type, value) {
        var data = this.data;
        var _a = this.getAddress(row, col), R = _a[0], G = _a[1], B = _a[2], A = _a[3];
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
    };
    Mat.prototype.getAddress = function (row, col) {
        var _a = this, channels = _a.channels, cols = _a.cols;
        // 坐标解析，根据x行y列，计算数据的索引值
        // 本质为换行查找
        // 一行的列数 * 所在行数 * 通道数 为走过的行像素数；
        // 所在列数 * 通道数为 该行走过的列数；
        // 则 R为所得的索引值 G、B、A那就都有了
        var R = cols * row * channels + col * channels;
        return [R, R + 1, R + 2, R + 3];
    };
    Mat.prototype.recycle = function (callback) {
        var _a = this, rows = _a.rows, cols = _a.cols;
        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var b = callback(this.at(row, col), row, col);
                if (b === "break") {
                    return;
                }
            }
        }
    };
    Mat.prototype.at = function (row, col) {
        var data = this.data;
        var _a = this.getAddress(row, col), R = _a[0], G = _a[1], B = _a[2], A = _a[3];
        return [data[R], data[G], data[B], data[A]];
    };
    // clip 是否缩放，注意这个缩放不会影响本身mat图片数据，只做展示缩放
    Mat.prototype.imgshow = function (canvas, clip, clipWidth, clipHeight) {
        if (clip === void 0) { clip = false; }
        if (clipWidth === void 0) { clipWidth = 0; }
        if (clipHeight === void 0) { clipHeight = 0; }
        var canvasEl = canvas instanceof HTMLCanvasElement
            ? canvas
            : document.querySelector(canvas);
        if (!canvasEl) {
            errorlog("无法找到canvas当前元素！");
        }
        var _a = this, data = _a.data, size = _a.size;
        var width = size.width, height = size.height;
        var imageData = new ImageData(data, width, height);
        var ctx = canvasEl.getContext("2d");
        if (clip) {
            canvasEl.width = clipWidth;
            canvasEl.height = clipHeight;
            window
                .createImageBitmap(imageData, {
                resizeHeight: clipHeight,
                resizeWidth: clipWidth,
            })
                .then(function (imageBitmap) {
                ctx.drawImage(imageBitmap, 0, 0);
            });
        }
        else {
            canvasEl.width = width;
            canvasEl.height = height;
            ctx.putImageData(imageData, 0, 0, 0, 0, canvasEl.width, canvasEl.height);
        }
    };
    Mat.prototype.toDataUrl = function (type, quality) {
        if (quality === void 0) { quality = 1; }
        var canvas = document.createElement("canvas");
        this.imgshow(canvas);
        return canvas.toDataURL(type !== null && type !== void 0 ? type : "image/png", quality);
    };
    Mat.prototype.toBlob = function (type, quality) {
        var _this = this;
        if (quality === void 0) { quality = 1; }
        return new Promise(function (resolve, reject) {
            var canvas = document.createElement("canvas");
            _this.imgshow(canvas);
            canvas.toBlob(function (blob) {
                if (!blob || !blob.size) {
                    return reject(new Error("转换失败：不存在的blob或blob大小为空"));
                }
                resolve(blob);
            }, type !== null && type !== void 0 ? type : "image/png", quality);
        });
    };
    return Mat;
}());
var pw = new PixelWind();
exports.pw = pw;
