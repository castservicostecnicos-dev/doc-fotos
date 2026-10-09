import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Plus, Folder, AlertTriangle } from 'lucide-react';
import { PhotoItem } from '../types';

interface UploadDropzoneProps {
  onPhotosAdded: (photos: PhotoItem[]) => void;
  onLoadSamples: () => void;
  compact?: boolean;
}

// Regex to accept any common image extension even if browser MIME type is empty or missing
const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|jfif|svg|avif)$/i;

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onPhotosAdded,
  onLoadSamples,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const isImageFile = (file: File): boolean => {
    if (file.type && file.type.startsWith('image/')) return true;
    if (IMAGE_EXTENSION_REGEX.test(file.name)) return true;
    return false;
  };

  const processFiles = async (inputFiles: FileList | File[]) => {
    // Convert to a real array immediately so browser resetting doesn't clear FileList
    const rawFiles = Array.from(inputFiles);
    const validImageFiles = rawFiles.filter(isImageFile);

    if (validImageFiles.length === 0) {
      if (rawFiles.length > 0) {
        alert('Nenhum arquivo de imagem válido foi identificado. Selecione arquivos JPG, PNG, WEBP ou GIF.');
      }
      return;
    }

    setIsLoading(true);
    setUploadProgress({ current: 0, total: validImageFiles.length });

    const newItems: PhotoItem[] = [];
    const batchSize = 8; // Process in parallel batches for high speed

    for (let i = 0; i < validImageFiles.length; i += batchSize) {
      const slice = validImageFiles.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        slice.map(async (file, sliceIdx) => {
          const globalIdx = i + sliceIdx;
          const previewUrl = URL.createObjectURL(file);

          // Extract image dimensions with safe timeout fallback
          const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
            const img = new Image();
            const timer = setTimeout(() => {
              resolve({ width: 800, height: 600 });
            }, 2000);

            img.onload = () => {
              clearTimeout(timer);
              resolve({
                width: img.naturalWidth || 800,
                height: img.naturalHeight || 600,
              });
            };

            img.onerror = () => {
              clearTimeout(timer);
              resolve({ width: 800, height: 600 });
            };

            img.src = previewUrl;
          });

          // Clean default caption from filename
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

          return {
            id: `photo-${Date.now()}-${globalIdx}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            file,
            previewUrl,
            rotation: 0,
            caption: cleanName,
            width: dimensions.width,
            height: dimensions.height,
          };
        })
      );

      newItems.push(...batchResults);
      setUploadProgress({ current: Math.min(validImageFiles.length, i + batchSize), total: validImageFiles.length });
    }

    if (newItems.length > 0) {
      onPhotosAdded(newItems);
    }

    setIsLoading(false);
    setUploadProgress(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      // Reset input value AFTER copying array so user can select same files again if desired
      e.target.value = '';
      processFiles(files);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.jfif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {uploadProgress && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            <div className="flex justify-between font-semibold mb-1">
              <span>Carregando fotos em lote...</span>
              <span>{uploadProgress.current} / {uploadProgress.total}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 transition-all duration-150"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>+ Várias Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Carregar todas as fotos de uma pasta inteira"
          >
            <Folder className="w-4 h-4 text-amber-600" />
            <span>Pasta Inteira</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
        isDragging
          ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
          : 'border-slate-300 hover:border-slate-400 bg-white shadow-xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.jfif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-2xs">
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : isDragging ? (
            <ImageIcon className="w-7 h-7 animate-bounce text-blue-600" />
          ) : (
            <UploadCloud className="w-7 h-7 text-blue-600" />
          )}
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-1">
          {isDragging ? 'Solte suas fotos aqui' : 'Selecione ou arraste várias fotos de uma vez'}
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Suporta upload em lote sem limite de imagens. Todas as fotos serão organizadas em linhas de{' '}
          <strong className="text-slate-700 font-semibold">4 fotos com o mesmo tamanho</strong> em todo o documento .docx.
        </p>

        {uploadProgress && (
          <div className="w-full mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
            <div className="flex justify-between font-semibold mb-1">
              <span>Carregando fotos...</span>
              <span>{uploadProgress.current} de {uploadProgress.total}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-150"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Selecionar Várias Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Selecionar uma pasta inteira de fotos"
          >
            <Folder className="w-4 h-4 text-amber-600" />
            <span>Pasta Inteira</span>
          </button>

          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fotos de Amostra</span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Suporta JPG, PNG, WEBP, GIF, BMP, JFIF · Também é possível colar fotos com Ctrl+V
        </p>
      </div>
    </div>
  );
};
