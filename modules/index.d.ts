type FadeMode = "in" | "out";
type R = number;
type G = number;
type B = number;
type A = number;
type Pixel = [R, G, B, A];
declare class PixelWind {
    readAsElement(img: HTMLImageElement): Mat;
    readAsDataUrl(url: string): Promise<Mat>;
    readAsData<T extends Blob = Blob>(blob: T): Promise<Mat>;
    static calcResizeLinerFunc(point1: number, point2: number, point3: number, point4: number, u: number, v: number): number;
    RESIZE: {
        INTER_NEAREST: number;
        INTER_LINEAR: number;
        INTER_CUBIC: number;
    };
    resize(mat: Mat, scaleWidth: number, scaleHeight: number, mode?: number): Mat;
    fade(mat: Mat, mode: FadeMode, percent: number): void;
    native(mat: Mat, color?: string): void;
    nativeRollback(mat: Mat): void;
    dropTransparent(mat: Mat, color?: string): void;
    colorRollback(mat: Mat): void;
    gray(mat: Mat): void;
    medianBlur(mat: Mat, size: number): void;
    gaussianBlur(mat: Mat, ksize: number, sigmaX?: number, sigmaY?: number): void;
    meanBlur(mat: Mat, ksize: number): void;
    static readonly LINER_CONTRAST = 1.5;
    static readonly BRIGHTNESS_CONTRAST = 50;
    static readonly SATURATION_CONTRAST = 1.5;
    LUT(mat: Mat, lutTable?: Uint8ClampedArray): void;
    THRESHOLD_TYPE: {
        BINARY: number;
        BINARY_INV: number;
        TRUNC: number;
        TOZERO: number;
        TOZERO_INV: number;
    };
    THRESHOLD_MODE: {
        THRESHOLD: number;
        OTSU: number;
        MANUAL: number;
    };
    threshold(mat: Mat, threshold: number, maxValue: number, type?: number, mode?: number): void;
    dropWhite(mat: Mat): void;
    groundGlassFilter(mat: Mat, offset?: number, bothFamily?: boolean): void;
    nostalgiaFilter(mat: Mat): void;
    fleetingFilter(mat: Mat, size?: number): void;
    sunLightFilter(mat: Mat, centerX?: number, centerY?: number, radius?: number, strength?: number): void;
    static readonly GRAY_SCALE_RED = 0.2989;
    static readonly GRAY_SCALE_GREEN = 0.587;
    static readonly GRAY_SCALE_BLUE = 0.114;
    static rgbToGray(R: R, G: G, B: B): number;
    static resolveWithUrl(url: string): Promise<Mat>;
    static gaussianFunction(x: number, y: number, sigmaX: number, sigmaY: number): number;
    static calcGaussianKernel(ksize: number, sigmaX: number, sigmaY: number): number[][];
    static calcThresholdValue(value: number, threshold: number, maxValue: number, type: number): number;
    static calcOtsuThreshold(mat: Mat): number;
}
declare class Mat {
    rows: number;
    cols: number;
    channels: number;
    size: {
        width: number;
        height: number;
    };
    data: Uint8ClampedArray;
    constructor(imageData: ImageData);
    clone(): Mat;
    delete(): void;
    update(row: number, col: number, ...args: number[]): void;
    getAddress(row: number, col: number): number[];
    recycle(callback: (pixel: Pixel, row: number, col: number) => void | "break"): void;
    at(row: number, col: number): number[];
    imgshow(canvas: HTMLCanvasElement | string, clip?: boolean, clipWidth?: number, clipHeight?: number): void;
    toDataUrl(type?: string, quality?: number): string;
    toBlob(type?: string, quality?: number): Promise<Blob>;
}
declare const pw: PixelWind;
export { pw };
