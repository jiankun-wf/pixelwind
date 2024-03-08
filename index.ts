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
  static GRAY_SCALE_RED = 0.299;
  static GRAY_SCALE_GREEN = 0.587;
  static GRAY_SCALE_BLUE = 0.114;

  private resolveWithUrl(url: string): Promise<Mat> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => {
        const cavans = document.createElement("canvas");
        cavans.width = img.width;
        cavans.height = img.height;

        const ctx = cavans.getContext("2d");
        ctx!.drawImage(img, 0, 0);

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

  // base64 或者非跨域url
  async readAsDataUrl(url: string) {
    if (!url) {
      8;
      errorlog("no url！");
    }

    try {
      const mat = await this.resolveWithUrl(url);
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
      const mat = await this.resolveWithUrl(url);
      return Promise.resolve(mat);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // 图像的 浅色渐隐/深色渐隐      渐隐比例：0.50
  fade(mat: Mat, mode: FadeMode, percent: number) {
    const per = mode === "in" ? 1 - percent : percent;

    const C = per * 255;
    const [R, G, B] = [C, C, C];

    switch (mode) {
      case "in":
        mat.recycle((_pixel, row, col) => {
          const [NR, NG, NB] = mat.at(row, col);
          if (NR + NG + NB >= R + G + B) {
            mat.update(row, col, "R", 255);
            mat.update(row, col, "G", 255);
            mat.update(row, col, "B", 255);
          }
        });
        break;
      case "out":
        mat.recycle((_pixel, row, col) => {
          const [NR, NG, NB] = mat.at(row, col);
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
      const [R, G, B, A] = pixel;
      if ((R !== 255 || G !== 255 || B !== 255) && A !== 255) {
        currentColor[0] = R;
        currentColor[1] = G;
        currentColor[2] = B;
        currentColor[3] = A;
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
        mat.update(row, col, "A", currentColor[3]);
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
      const [R, G, B, A] = pixel;
      if (A === 255) {
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
      const Gray = ImageResolver.rgbToGray(R, G, B);
      mat.update(row, col, "R", Gray);
      mat.update(row, col, "G", Gray);
      mat.update(row, col, "B", Gray);
    });
  }

  static rgbToGray(R: R, G: G, B: B) {
    return Math.round(
      R * ImageResolver.GRAY_SCALE_RED +
        G * ImageResolver.GRAY_SCALE_GREEN +
        B * ImageResolver.GRAY_SCALE_BLUE
    );
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
      if (!Gs.every((item) => item.gray)) return;
      // 取中位数
      const { R, G, B } = Gs.sort((a, b) => a.gray - b.gray)[
        Math.floor(Gs.length / 2)
      ];
      // 设置中位数灰度的还原色
      mat.update(row, col, "R", R);
      mat.update(row, col, "G", G);
      mat.update(row, col, "B", B);
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

    const imageData = new ImageData(data, height, width);

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

    void this.imgshow(canvas);

    return canvas.toDataURL(type ?? "image/png", quality);
  }

  toBlob(type?: string, quality = 1) {
    return new Promise<Blob>((resolve, reject) => {
      const canvas = document.createElement("canvas");

      void this.imgshow(canvas);

      canvas.toBlob(
        (blob: Blob | null) => {
          if (!blob || !blob.size) {
            return reject("error: 转换失败");
          }
          resolve(blob);
        },
        type ?? "image/png",
        quality
      );
    });
  }
}

window.cv = new ImageResolver();
