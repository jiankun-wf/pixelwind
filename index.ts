type FadeMode = "in" | "out";
type R = number;
type G = number;
type B = number;
type A = number;
type Pixel = [R, G, B, A];

const errorlog = (text: string) => {
  throw Error(text);
};

class ImageResolver {
  static readonly GRAY_SCALE_RED = 0.299;
  static readonly GRAY_SCALE_GREEN = 0.587;
  static readonly GRAY_SCALE_BLUE = 0.114;

  static rgbToGray(R: R, G: G, B: B) {
    return (
      R * ImageResolver.GRAY_SCALE_RED +
      G * ImageResolver.GRAY_SCALE_GREEN +
      B * ImageResolver.GRAY_SCALE_BLUE
    );
  }

  // 高斯函数代入
  static gaussianFunction(
    x: number,
    y: number,
    sigmaX: number,
    sigmaY: number
  ) {
    const PI = Math.PI;
    const normalizationFactor = 1 / (2 * PI * sigmaX * sigmaY);
    const exponent = -(
      Math.pow(x, 2) / (2 * Math.pow(sigmaX, 2)) +
      Math.pow(y, 2) / (2 * Math.pow(sigmaY, 2))
    );
    const suffix = Math.exp(exponent);
    return normalizationFactor * suffix;
  }
  // 获取高斯矩阵
  static calcGaussianKernel(ksize: number, sigmaX: number, sigmaY: number) {
    const kernel: number[][] = [];
    const half = Math.floor(ksize / 2);
    // 生成初始矩阵
    for (let x = -half; x <= half; x++) {
      const row = half + x;
      kernel[row] = [];
      for (let y = -half; y <= half; y++) {
        const col = half + y;
        kernel[row][col] = ImageResolver.gaussianFunction(x - half, y - half, sigmaX, sigmaY);
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

  private resolveWithUrl(
    url: string,
    limitWidth?: number,
    limitHeight?: number
  ): Promise<Mat> {
    return new Promise((resolve, reject) => {
      const img = new Image(limitWidth ?? undefined, limitHeight ?? undefined);
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
  async readAsDataUrl(
    url: string,
    { width, height }: { width?: number; height?: number } = {}
  ) {
    if (!url) {
      errorlog("no url！");
    }

    try {
      const mat = await this.resolveWithUrl(url, width, height);
      return Promise.resolve(mat);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // 读取blob 或 file对象
  async readAsData<T extends Blob = Blob>(
    blob: T,
    { width, height }: { width?: number; height?: number } = {}
  ) {
    if (!blob.size) {
      errorlog("no content blob");
    }

    const url = URL.createObjectURL(blob);
    try {
      const mat = await this.resolveWithUrl(url, width, height);
      return Promise.resolve(mat);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // 图像的 浅色擦除/深色擦除      渐隐比例：0.50
  fade(mat: Mat, mode: FadeMode, percent: number) {
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

  // f1(i,j)=R(i,j)f2(i,j)=G(i,j)f3(i,j)=B(i,j)
  // Y = 0.2126 R + 0.7152 G + 0.0722 B
  // 图像灰度化处理（加权平均法）
  gray(mat: Mat) {
    mat.recycle((pixel, row, col) => {
      const [R, G, B] = pixel;
      const Gray = Math.floor(ImageResolver.rgbToGray(R, G, B));
      mat.update(row, col, "R", Gray);
      mat.update(row, col, "G", Gray);
      mat.update(row, col, "B", Gray);
    });
  }

  // 中值模糊（中值滤波），用于去除 椒盐噪点与胡椒噪点
  medianBlur(mat: Mat, size: number) {
    if (size % 2 !== 1) {
      errorlog("size需为奇整数！");
    }
    const half = -Math.floor(size / 2);
    const absHalf = Math.abs(half);
    mat.recycle((_pixel, row, col) => {
      const Gs: { gray: number; R: number; G: number; B: number }[] = [];
      // size * size 的像素矩阵
      for (let i = half; i <= absHalf; i++) {
        for (let j = half; j <= absHalf; j++) {
          const [R, G, B] = mat.at(row + i, col + j);

          const Gray = ImageResolver.rgbToGray(R, G, B);

          Gs.push({ gray: Gray, R, G, B });
        }
      }
      const gsv = Gs.filter((item) => item.gray);
      if (!gsv.length) return;
      // 奇数中位数
      gsv.sort((a, b) => a.gray - b.gray);
      if (gsv.length % 2 === 1) {
        // 取中位数
        const { R, G, B } = gsv[Math.floor(Gs.length / 2)];
        // 设置中位数灰度的还原色
        mat.update(row, col, "R", R);
        mat.update(row, col, "G", G);
        mat.update(row, col, "B", B);
      } else {
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

  // 高斯模糊
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

    const gaussianKernel = ImageResolver.calcGaussianKernel(
      ksize,
      sigmaX,
      sigmaY
    );
    if (!gaussianKernel.length) return;

    const half = Math.floor(ksize / 2);

    mat.recycle((_pixel, row, col) => {
      // 应用高斯权重
      let NR = 0,
        NG = 0,
        NB = 0;
      for (let kx = -half; kx < half; ++kx) {
        for (let ky = -half; ky < half; ++ky) {
          const sx = row + kx, sy = col + ky;
          const krow = kx + half, kcol = ky + half;
          
          const rate = gaussianKernel[krow][kcol];

          let [R, G, B] = mat.at(sx, sy);
          const [DR, DG, DB] = mat.at(sx - kx, sy - ky);

          R = R ?? DR ?? 0;
          G = G ?? DG ?? 0;
          B = B ?? DB ?? 0;

          NR += R * rate;
          NG += G * rate;
          NB += B * rate;
        }
      }

      mat.update(row, col, "R", Math.round(NR));
      mat.update(row, col, "G", Math.round(NG));
      mat.update(row, col, "B", Math.round(NB));
    });
  }
}

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

  update(row, col, type: "R" | "G" | "B" | "A", value: number) {
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
        const b = callback(this.at(row, col) as Pixel, row, col);
        if (b === "break") {
          return;
        }
      }
    }
  }

  at(row: number, col: number) {
    const { data } = this;

    const [R, G, B, A] = this.getAddress(row, col);

    return [data[R], data[G], data[B], data[A]];
  }

  imgshow(canvas: HTMLCanvasElement | string) {
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

    canvasEl.width = width;
    canvasEl.height = height;

    const ctx = canvasEl.getContext("2d");

    ctx.putImageData(imageData, 0, 0);
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

// const cv = new ImageResolver();
// window.cv = new ImageResolver();
// export { cv };
