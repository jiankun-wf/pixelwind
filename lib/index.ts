type FadeMode = "in" | "out";
type R = number;
type G = number;
type B = number;
type A = number;
type Pixel = [R, G, B, A];

const errorlog = (text: string) => {
  throw Error(text);
};

// 遵循规则 static不爆露
// 用Function感觉会将一些变量暴漏出去

class PixelWind {
  // client-only
  readAsElement(img: HTMLImageElement) {
    const cavans = document.createElement("canvas");
    cavans.width = img.width;
    cavans.height = img.height;
    const ctx = cavans.getContext("2d");
    ctx.drawImage(img, 0, 0, cavans.width, cavans.height);
    const imageData = ctx.getImageData(0, 0, cavans.width, cavans.height);

    return new Mat(imageData);
  }

  // base64 或者非跨域url
  async readAsDataUrl(url: string) {
    if (!url) {
      errorlog("no url！");
    }

    try {
      const mat = await PixelWind.resolveWithUrl(url);
      return Promise.resolve(mat);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // 读取blob 或 file对象
  async readAsData<T extends Blob = Blob>(blob: T) {
    if (!blob.size) {
      errorlog("no content blob");
    }

    const url = URL.createObjectURL(blob);
    try {
      const mat = await PixelWind.resolveWithUrl(url);
      return Promise.resolve(mat);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  RESIZE = {
    // 最临近值算法
    INTER_NEAREST: 1,
    // 双线性插值
    INTER_LINEAR: 2,
    // 
    INTER_CUBIC: 3,
    // 
    INTER_AREA: 4,
    // 
    INTER_LANCZOS4: 5,
  };
  // 图片缩放
  resize(
    mat: Mat,
    scaleWidth: number,
    scaleHeight: number,
    mode: number = this.RESIZE.INTER_LINEAR
  ): Mat {
    const imageData = new ImageData(
      new Uint8ClampedArray(scaleHeight * scaleWidth * 4),
      scaleWidth,
      scaleHeight
    );
    const execMat = new Mat(imageData);

    const {
      size: { width, height },
    } = mat;

    switch (mode) {
      // 像素最邻近法
      case this.RESIZE.INTER_NEAREST:
        const xRatio = width / scaleWidth;
        const yRatio = height / scaleHeight;
        execMat.recycle((_pixel, row, col) => {
          const scaleX = Math.round(row * xRatio);
          const scaleY = Math.round(col * yRatio);
          const [R, G, B, A] = mat.at(scaleX, scaleY);

          execMat.update(row, col, "R", R);
          execMat.update(row, col, "G", G);
          execMat.update(row, col, "B", B);
          execMat.update(row, col, "A", A);
        });
        return execMat;
      // 双线性插值法
      // int x = (i+0.5) * width/outWidth - 0.5
      // int y = (j+0.5) * height/outHeight - 0.5
      case this.RESIZE.INTER_LINEAR:
        const xRatio = width / scaleWidth;
        const yRatio = height / scaleHeight;
        execMat.recycle((_pixel, row, col) => {
          // 
          const srcX = (row + 0.5)  * xRatio - 0.5;
          const srcY = (col + 0.5)  * yRatio - 0.5;
          var x1 = Math.floor(srcX);
      var y1 = Math.floor(srcY);
      var x2 = Math.ceil(srcX);
      var y2 = Math.ceil(srcY);


        });

        return;
      case this.RESIZE.INTER_CUBIC:
        return;
      case this.RESIZE.INTER_AREA:
        return;
      case this.RESIZE.INTER_LANCZOS4:
        return;
    }
  }

  // 图像的 浅色擦除/深色擦除      渐隐比例：0.50
  fade(mat: Mat, mode: FadeMode, percent: number) {
    const per = mode === "in" ? 1 - percent : percent;

    const C = per * 255;
    const CR = C,
      CG = C,
      CB = C;

    switch (mode) {
      case "in":
        mat.recycle((pixel, row, col) => {
          const [R, G, B] = pixel;
          if (R + G + B > CR + CG + CB) {
            mat.update(row, col, "R", 255);
            mat.update(row, col, "G", 255);
            mat.update(row, col, "B", 255);
          }
        });
        break;
      case "out":
        mat.recycle((pixel, row, col) => {
          const [R, G, B] = pixel;
          if (R + G + B < CR + CG + CB) {
            mat.update(row, col, "R", 255);
            mat.update(row, col, "G", 255);
            mat.update(row, col, "B", 255);
          }
        });
        break;
    }
  }

  // 图像的纯色化处理 （非白非透明转为指定颜色）
  native(mat: Mat, color: string = "#000000") {
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
  nativeRollback(mat: Mat) {
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

      if (
        R === currentColor[0] &&
        G === currentColor[1] &&
        B === currentColor[2]
      ) {
        mat.update(row, col, "R", 255);
        mat.update(row, col, "G", 255);
        mat.update(row, col, "B", 255);
      } else {
        mat.update(row, col, "R", currentColor[0]);
        mat.update(row, col, "G", currentColor[1]);
        mat.update(row, col, "B", currentColor[2]);
      }
    });
  }

  // 图像的透明像素转换为指定颜色（默认白）
  dropTransparent(mat: Mat, color = "#FFFFFFff") {
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
  colorRollback(mat: Mat) {
    mat.recycle((pixel, row, col) => {
      const [R, G, B, A] = pixel;
      mat.update(row, col, "R", 255 - R);
      mat.update(row, col, "G", 255 - G);
      mat.update(row, col, "B", 255 - B);
      mat.update(row, col, "A", 255 - A);
    });
  }

  // 图像灰度化处理（加权平均法）
  gray(mat: Mat) {
    mat.recycle((pixel, row, col) => {
      const [R, G, B] = pixel;
      const Gray = Math.floor(PixelWind.rgbToGray(R, G, B));
      mat.update(row, col, "R", Gray);
      mat.update(row, col, "G", Gray);
      mat.update(row, col, "B", Gray);
    });
  }

  // 中值滤波（中值滤波），用于去除 椒盐噪点与胡椒噪点
  // TODO 中位数计算 不要用Gray值，要RGB全计算。
  medianBlur(mat: Mat, size: number) {
    if (size % 2 !== 1) {
      errorlog("size需为奇整数！");
    }
    const half = -Math.floor(size / 2);
    const absHalf = Math.abs(half);
    mat.recycle((_pixel, row, col) => {
      const gsv: { R: number[]; G: number[]; B: number[]; A: number[] } = {
        R: [],
        G: [],
        B: [],
        A: [],
      };
      // size * size 的像素矩阵
      for (let i = half; i <= absHalf; i++) {
        let offsetX = row + i;
        if (offsetX < 0 || offsetX >= mat.rows) continue;
        for (let j = half; j <= absHalf; j++) {
          let offsetY = col + j;
          if (offsetY < 0 || offsetY >= mat.cols) continue;

          const [R, G, B, A] = mat.at(offsetX, offsetY);
          gsv.R.push(R);
          gsv.G.push(G);
          gsv.B.push(B);
          gsv.A.push(A);
        }
      }
      gsv.R.sort((a, b) => a - b);
      gsv.G.sort((a, b) => a - b);
      gsv.B.sort((a, b) => a - b);
      gsv.A.sort((a, b) => a - b);
      const isOdd = gsv.R.length % 2 !== 0; // 奇数
      let NR, NG, NB, NA;
      // NA;
      // 奇数中位数
      if (isOdd) {
        // 取中位数
        const { R, G, B, A } = gsv;
        const index = Math.floor(R.length / 2);
        NR = R[index];
        NG = G[index];
        NB = B[index];
        NA = A[index];
      } else {
        // 偶数中位数
        const { R, G, B, A } = gsv;
        const index = R.length / 2;
        const indexPre = index - 1;
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
  }

  // 高斯滤波
  gaussianBlur(mat: Mat, ksize: number, sigmaX: number = 0, sigmaY = sigmaX) {
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

    const gaussianKernel = PixelWind.calcGaussianKernel(ksize, sigmaX, sigmaY);
    if (!gaussianKernel.length) return;

    const half = Math.floor(ksize / 2);

    mat.recycle((_pixel, row, col) => {
      // 应用高斯权重
      let NR = 0,
        NG = 0,
        NB = 0,
        NA = 0;
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
  // ksize * ksize 矩阵取平均值
  meanBlur(mat: Mat, ksize: number) {
    if (ksize % 2 === 0) {
      errorlog("size需为奇整数！");
    }
    const half = Math.floor(ksize / 2);

    // ksize * ksize 矩阵数
    const kernelSize = Math.pow(ksize, 2);

    mat.recycle((_pixel, row, col) => {
      let NR = 0,
        NG = 0,
        NB = 0,
        NA = 0;
      for (let kx = 0; kx < ksize; kx++) {
        for (let ky = 0; ky < ksize; ky++) {
          let offsetX = row + kx - half;
          let offsetY = col + ky - half;

          offsetX = Math.max(offsetX, 0);
          offsetX = Math.min(offsetX, mat.rows - 1);

          offsetY = Math.max(offsetY, 0);
          offsetY = Math.min(offsetY, mat.cols - 1);

          const [R, G, B, A] = mat.at(offsetX, offsetY);

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
  }

  // 线性对比度增强参数
  static readonly LINER_CONTRAST = 1.5;
  // 亮度固定增强参数
  static readonly BRIGHTNESS_CONTRAST = 50;
  // 饱和度增强参数
  static readonly SATURATION_CONTRAST = 1.5;
  // LUT算法（色彩增强）
  LUT(mat: Mat, lutTable?: Uint8ClampedArray) {
    if (arguments.length === 1 || !lutTable?.length) {
      // 生成固定鲜艳规则
      lutTable = new Uint8ClampedArray(256);

      for (let i = 0; i < 256; i++) {
        lutTable[i] = Math.min(
          255,
          Math.floor(i * PixelWind.SATURATION_CONTRAST)
        );
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
  threshold(
    mat: Mat,
    threshold: number,
    maxValue: number,
    type: 1 | 2 | 3 | 4 | 5 = PixelWind.THRESH_BINARY,
    mode: 1 | 2 | 3 = PixelWind.THRESH_MODE_THRESHOLD
  ) {
    mat.recycle((_pixel, row, col) => {
      const [R, G, B] = mat.at(row, col);

      const gray = PixelWind.rgbToGray(R, G, B); // 计算算像素灰度值

      let newValue;

      switch (mode) {
        // 固定阈值模式
        case PixelWind.THRESH_MODE_THRESHOLD:
          newValue = PixelWind.calcThresholdValue(
            gray,
            threshold,
            maxValue,
            type
          );
          break;
        case PixelWind.THRESH_MODE_OTSU:
          // Otsu模式
          newValue = PixelWind.calcThresholdValue(
            gray,
            PixelWind.calcOtsuThreshold(mat),
            maxValue,
            type
          );
          break;
        case PixelWind.THRESH_MODE_MANUAL:
          // 手动模式
          newValue = PixelWind.calcThresholdValue(
            gray,
            threshold,
            maxValue,
            type
          );
          break;
      }

      mat.update(row, col, "R", newValue);
      mat.update(row, col, "G", newValue);
      mat.update(row, col, "B", newValue);
    });
  }

  // 去白
  dropWhite(mat: Mat) {
    mat.recycle((pixel, row, col) => {
      const [R, G, B, A] = pixel;
      if (R === 255 && G === 255 && B === 255 && A !== 0) {
        mat.update(row, col, "A", 0);
      }
    });
  }

  // 毛玻璃滤镜
  // 原理，在 0到offset中随机取一个整数，将当前像素点坐标x，y分别加这个整数，得到新的像素点
  // 将新的像素点的RGBA通道赋值给当前像素点
  // bothFamily：像素点x，y是否分别随机，对于一些色彩纹理较多的图像，建议关闭
  groundGlassFilter(mat: Mat, offset: number = 5, bothFamily: boolean = true) {
    if (!offset || offset <= 0) {
      errorlog("offset 需为正整数！");
    }
    const { rows, cols } = mat;
    const offsetRows = rows - offset;
    const offsetCols = cols - offset;
    for (let row = 0; row < offsetRows; row++) {
      for (let col = 0; col < offsetCols; col++) {
        const index = Math.floor(Math.random() * offset);
        const offsetX = row + index;
        const offsetY =
          col + (bothFamily ? index : Math.floor(Math.random() * offset));
        const [R, G, B, A] = mat.at(offsetX, offsetY);
        mat.update(row, col, "R", R);
        mat.update(row, col, "G", G);
        mat.update(row, col, "B", B);
        mat.update(row, col, "A", A);
      }
    }
  }

  // 怀旧滤镜
  // 公式化计算RGB
  nostalgiaFilter(mat: Mat) {
    mat.recycle((pixel, row, col) => {
      const [R, G, B] = pixel;

      const NR = Math.min(0.393 * R + 0.769 * G + 0.189 * B, 255);
      const NG = Math.min(0.349 * R + 0.686 * G + 0.168 * B, 255);
      const NB = Math.min(0.272 * R + 0.534 * G + 0.131 * B, 255);

      mat.update(row, col, "R", NR);
      mat.update(row, col, "G", NG);
      mat.update(row, col, "B", NB);
    });
  }

  // 流年滤镜 B通道取平方根 然后乘以因子
  fleetingFilter(mat: Mat, size: number = 12) {
    size = Math.round(size);
    if (size <= 0) {
      errorlog("因子必须大于0");
    }
    mat.recycle((pixel, row, col) => {
      const B = pixel[2];

      const NB = Math.sqrt(B) * size;
      mat.update(row, col, "B", NB);
    });
  }

  // 光照滤镜
  // centerX, centerY 中心点
  // radius 光照圆半径
  // strength 光照强度
  sunLightFilter(
    mat: Mat,
    centerX?: number,
    centerY?: number,
    radius?: number,
    strength: number = 150
  ) {
    const { rows, cols } = mat;

    centerX = centerX || Math.floor(rows / 2);
    centerY = centerY || Math.floor(cols / 2);
    radius = radius || Math.min(rows, cols);

    mat.recycle((pixel, row, col) => {
      // 取三角形 x^2 + y^2的第三边距离（此处不用开平方根，比较大小结果都一致，还省去运算过程）
      const distance = Math.pow(centerX - row, 2) + Math.pow(centerY - col, 2);
      // 所在点在光照圆内
      if (distance < Math.pow(radius, 2)) {
        const [R, G, B] = pixel;
        // 计算加强光照值
        const suffix = Math.round(
          strength * (1.0 - Math.sqrt(distance) / radius)
        );

        // 判断R的边缘值 0 - 255 然后赋值
        mat.update(row, col, "R", Math.min(255, Math.max(0, R + suffix)));
        mat.update(row, col, "G", Math.min(255, Math.max(0, G + suffix)));
        mat.update(row, col, "B", Math.min(255, Math.max(0, B + suffix)));
      }
    });
  }

  // 加权平均法 红色通道（R）因子
  static readonly GRAY_SCALE_RED = 0.2989;
  // 加权平均法 绿色通道（G）因子
  static readonly GRAY_SCALE_GREEN = 0.587;
  // 加权平均法 蓝色通道（B）因子
  static readonly GRAY_SCALE_BLUE = 0.114;
  // 加权平均法，计算结果
  // 遵循国际公式：Y = 0.299 R + 0.587 G + 0.114 B
  static rgbToGray(R: R, G: G, B: B) {
    return (
      R * PixelWind.GRAY_SCALE_RED +
      G * PixelWind.GRAY_SCALE_GREEN +
      B * PixelWind.GRAY_SCALE_BLUE
    );
  }
  // 用于解析url图片
  static resolveWithUrl(url: string): Promise<Mat> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => {
        const cavans = document.createElement("canvas");
        cavans.width = img.width;
        cavans.height = img.height;

        const ctx = cavans.getContext("2d");
        ctx!.drawImage(img, 0, 0, cavans.width, cavans.height);

        const imageData: ImageData = ctx!.getImageData(
          0,
          0,
          cavans.width,
          cavans.height
        );

        resolve(new Mat(imageData));
        img.remove();
        cavans.remove();
      });

      img.addEventListener("error", (...args: any[]) => {
        reject(args[1]);
      });

      img.setAttribute("src", url);
    });
  }

  // 高斯函数代入
  static gaussianFunction(
    x: number,
    y: number,
    sigmaX: number,
    sigmaY: number
  ) {
    const exponentX = -((x * x) / (2 * sigmaX * sigmaX));
    const exponentY = -((y * y) / (2 * sigmaY * sigmaY));
    const coefficient = 1 / (2 * Math.PI * sigmaX * sigmaY);
    const value = coefficient * Math.exp(exponentX + exponentY);
    return value;
  }
  // 获取高斯矩阵
  static calcGaussianKernel(ksize: number, sigmaX: number, sigmaY: number) {
    const kernel: number[][] = [];
    const half = Math.floor(ksize / 2);

    // 矩阵和
    let sum = 0;
    // 生成初始矩阵
    for (let x = -half; x <= half; x++) {
      const row = half + x;
      kernel[row] = [];
      for (let y = -half; y <= half; y++) {
        const col = half + y;
        const gaussianFunctionRes = PixelWind.gaussianFunction(
          x,
          y,
          sigmaX,
          sigmaY
        );
        kernel[row][col] = gaussianFunctionRes;
        sum += gaussianFunctionRes;
      }
    }

    //  归一化处理
    for (let i = 0; i < ksize; i++) {
      for (let j = 0; j < ksize; j++) {
        kernel[i][j] /= sum;
      }
    }
    return kernel;
  }

  // 二值化类型
  // 只有大于阈值的像素灰度值值为最大值，其他像素灰度值值为最小值。
  static readonly THRESH_BINARY: 1 = 1;
  // 与 1相反
  static readonly THRESH_BINARY_INV: 2 = 2;
  // 截断阈值处理，大于阈值的像素灰度值被赋值为阈值，小于阈值的像素灰度值保持原值不变。
  static readonly THRESH_TRUNC: 3 = 3;
  // 置零阈值处理，只有大于阈值的像素灰度值被置为0，其他像素灰度值保持原值不变。
  static readonly THRESH_TOZERO: 4 = 4;
  // 反置零阈值处理，只有小于阈值的像素灰度值被置为0，其他像素灰度值保持原值不变。
  static readonly THRESH_TOZERO_INV = 5;
  // 二值化模式  表示阈值处理后，如何处理大于阈值的像素值。
  // 表示直接使用阈值处理。
  static readonly THRESH_MODE_THRESHOLD: 1 = 1;
  // 表示使用Otsu's二值化方法进行阈值处理。
  static readonly THRESH_MODE_OTSU: 2 = 2;
  // 表示使用手动指定的阈值进行阈值处理
  static readonly THRESH_MODE_MANUAL: 3 = 3;

  //根据二值化类型，计算阈值
  // 参数 1. 灰度值 2. 阈值 3. 最大值 4. 二值化类型
  static calcThresholdValue(
    value: number,
    threshold: number,
    maxValue: number,
    type: 1 | 2 | 3 | 4 | 5
  ) {
    let newValue: number;
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
  }

  // 计算 Otsu应用值
  static calcOtsuThreshold(mat: Mat) {
    // 计算灰度直方图
    const histogram = new Array(256).fill(0);
    let totalPixels = 0;

    mat.recycle((pixel, row, col) => {
      const [R, G, B] = pixel;
      const gray = PixelWind.rgbToGray(R, G, B);

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

// 图像数据类，不爆露
class Mat {
  rows: number;
  cols: number;
  channels: number;
  size: { width: number; height: number };
  data: Uint8ClampedArray;

  constructor(imageData: ImageData) {
    this.rows = imageData.height;
    this.cols = imageData.width;
    this.size = { width: imageData.width, height: imageData.height };
    this.channels = 4;
    this.data = imageData.data;
  }

  clone() {
    const {
      data,
      size: { width, height },
    } = this;

    const uin = new Uint8ClampedArray(data);

    const imageData = new ImageData(uin, width, height);

    return new Mat(imageData);
  }

  delete() {
    this.data = new Uint8ClampedArray(0);
  }

  update(row: number, col: number, type: "R" | "G" | "B" | "A", value: number) {
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

  getAddress(row: number, col: number) {
    const { channels, cols } = this;

    // 坐标解析，根据x行y列，计算数据的索引值
    // 本质为换行查找
    // 一行的列数 * 所在行数 * 通道数 为走过的行像素数；
    // 所在列数 * 通道数为 该行走过的列数；
    // 则 R为所得的索引值 G、B、A那就都有了
    const R = cols * row * channels + col * channels;

    return [R, R + 1, R + 2, R + 3];
  }

  recycle(
    callback: (pixel: Pixel, row: number, col: number) => void | "break"
  ) {
    const { rows, cols } = this;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        callback(this.at(row, col) as Pixel, row, col);
      }
    }
  }

  at(row: number, col: number) {
    const { data } = this;

    const [R, G, B, A] = this.getAddress(row, col);

    return [data[R], data[G], data[B], data[A]];
  }

  // clip 是否缩放，注意这个缩放不会影响本身mat图片数据，只做展示缩放
  imgshow(
    canvas: HTMLCanvasElement | string,
    clip = false,
    clipWidth = 0,
    clipHeight = 0
  ) {
    const canvasEl =
      canvas instanceof HTMLCanvasElement
        ? canvas
        : document.querySelector<HTMLCanvasElement>(canvas);
    if (!canvasEl) {
      errorlog("无法找到canvas当前元素！");
    }
    const { data, size } = this;
    const { width, height } = size;
    const imageData = new ImageData(data, width, height);

    const ctx = canvasEl.getContext("2d");

    if (clip) {
      canvasEl.width = clipWidth;
      canvasEl.height = clipHeight;
      window
        .createImageBitmap(imageData, {
          resizeHeight: clipHeight,
          resizeWidth: clipWidth,
        })
        .then((imageBitmap) => {
          ctx.drawImage(imageBitmap, 0, 0);
        });
    } else {
      canvasEl.width = width;
      canvasEl.height = height;

      ctx.putImageData(imageData, 0, 0, 0, 0, canvasEl.width, canvasEl.height);
    }
  }

  toDataUrl(type?: string, quality = 1) {
    const canvas = document.createElement("canvas");

    this.imgshow(canvas);

    return canvas.toDataURL(type ?? "image/png", quality);
  }

  toBlob(type?: string, quality = 1) {
    return new Promise<Blob>((resolve, reject) => {
      const canvas = document.createElement("canvas");

      this.imgshow(canvas);

      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob || !blob.size) {
            return reject(new Error("转换失败：不存在的blob或blob大小为空"));
          }
          resolve(blob);
        },
        type ?? "image/png",
        quality
      );
    });
  }
}

const pw = new PixelWind();
export { pw };
