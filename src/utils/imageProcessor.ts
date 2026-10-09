import { AspectRatioType, FitModeType } from '../types';

export interface ProcessedImageData {
  uint8Array: Uint8Array;
  widthPt: number;
  heightPt: number;
  previewDataUrl: string;
}

const ASPECT_RATIO_VALUES: Record<AspectRatioType, number> = {
  '4:3': 4 / 3,
  '1:1': 1,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
};

export async function processImageForDocx(
  imageUrl: string,
  rotation: number,
  aspectRatio: AspectRatioType,
  fitMode: FitModeType,
  targetDocxWidthPt: number = 130
): Promise<ProcessedImageData> {
  const ratio = ASPECT_RATIO_VALUES[aspectRatio] || 4 / 3;
  const targetDocxHeightPt = Math.round(targetDocxWidthPt / ratio);

  // High-resolution canvas dimensions (for sharp print in Word)
  const canvasWidth = 720;
  const canvasHeight = Math.round(canvasWidth / ratio);

  const img = await loadImage(imageUrl);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Compute rotation & transformation
  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);

  const isRotated90or270 = rotation % 180 !== 0;
  const naturalW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const naturalH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  let drawW: number;
  let drawH: number;

  if (fitMode === 'cover') {
    const scale = Math.max(canvasWidth / naturalW, canvasHeight / naturalH);
    drawW = (isRotated90or270 ? img.naturalHeight : img.naturalWidth) * scale;
    drawH = (isRotated90or270 ? img.naturalWidth : img.naturalHeight) * scale;
  } else {
    // contain
    const scale = Math.min(canvasWidth / naturalW, canvasHeight / naturalH);
    drawW = (isRotated90or270 ? img.naturalHeight : img.naturalWidth) * scale;
    drawH = (isRotated90or270 ? img.naturalWidth : img.naturalHeight) * scale;
  }

  // Draw rotated image centered
  const actualImgW = isRotated90or270 ? drawH : drawW;
  const actualImgH = isRotated90or270 ? drawW : drawH;
  ctx.drawImage(img, -actualImgW / 2, -actualImgH / 2, actualImgW, actualImgH);
  ctx.restore();

  const previewDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  // Convert to Uint8Array for docx
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create image blob'));
      },
      'image/jpeg',
      0.92
    );
  });

  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return {
    uint8Array,
    widthPt: targetDocxWidthPt,
    heightPt: targetDocxHeightPt,
    previewDataUrl,
  };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for remote http(s) URLs; setting on blob/data can fail in some browsers
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    const timeout = setTimeout(() => {
      reject(new Error('Tempo limite excedido ao carregar imagem'));
    }, 15000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(img);
    };
    img.onerror = (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${err}`));
    };
    img.src = src;
  });
}
