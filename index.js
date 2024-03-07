const errorlog = (text) => {
    throw Error(text);
};
class ImageResolver {
    resolveWithUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener("load", () => {
                const cavans = document.createElement("canvas");
                cavans.width = img.width;
                cavans.height = img.height;
                const ctx = cavans.getContext("2d");
                ctx.drawImage(img, 0, 0);
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
    // base64 或者非跨域url
    async readAsDataUrl(url) {
        if (!url) {
            8;
            errorlog("no url！");
        }
        try {
            const mat = await this.resolveWithUrl(url);
            return Promise.resolve(mat);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    // 读取blob 或 file对象
    async readAsData(blob) {
        if (!blob.size) {
            errorlog("no content blob");
        }
        const url = URL.createObjectURL(blob);
        try {
            const mat = await this.resolveWithUrl(url);
            return Promise.resolve(mat);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    // 图像的 浅色渐隐/深色渐隐      渐隐比例：0.50
    fade(mat, mode, percent) {
        const per = percent * 255;
        const [NR, NG, NB] = [per, per, per];
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            if (R + G + B >= NR + NG + NB) {
                mat.update(row, col, "R", 255);
                mat.update(row, col, "G", 255);
                mat.update(row, col, "B", 255);
            }
        });
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
    colorRollback(mat) {
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
    // 灰度化处理
    gray(mat) {
        mat.recycle((pixel, row, col) => {
            const [R, G, B] = pixel;
            const Gray = Math.round(R * 0.299 + G * 0.587 + B * 0.114);
            mat.update(row, col, "R", Gray);
            mat.update(row, col, "G", Gray);
            mat.update(row, col, "B", Gray);
        });
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
    update(row, col, type, value) {
        const { channels, rows, cols, data } = this;
        const index = cols * row * channels + col * channels;
        switch (type) {
            case "R":
                data[index] = value;
                break;
            case "G":
                data[index + 1] = value;
                break;
            case "B":
                data[index + 2] = value;
                break;
            case "A":
                data[index + 3] = value;
                break;
        }
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
        const { channels, rows, cols, data } = this;
        const index = cols * row * channels + col * channels;
        return [data[index], data[index + 1], data[index + 2], data[index + 3]];
    }
}
window.cv = new ImageResolver();
