export interface PhotoItem {
  id: string;
  name: string;
  file?: File;
  previewUrl: string;
  rotation: number; // 0, 90, 180, 270
  caption: string;
  width: number;
  height: number;
}

export type AspectRatioType = '4:3' | '1:1' | '16:9' | '3:4';
export type FitModeType = 'cover' | 'contain';
export type MarginSizeType = 'normal' | 'narrow' | 'moderate';
export type PageSizeType = 'a4' | 'letter';
export type OrientationType = 'portrait' | 'landscape';
export type CaptionModeType = 'none' | 'filename' | 'numbered' | 'custom';

export interface DocumentConfig {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  includeHeader: boolean;
  paperSize: PageSizeType;
  orientation: OrientationType;
  margins: MarginSizeType;
  aspectRatio: AspectRatioType;
  fitMode: FitModeType;
  captionMode: CaptionModeType;
  showPhotoBorder: boolean;
  showTableGrid: boolean;
  includeNotesLine: boolean;
  photosPerRow: 4; // strictly 4 per row as required
}
