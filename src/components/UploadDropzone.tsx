import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, Plus } from 'lucide-react';
import { PhotoItem } from '../types';

interface UploadDropzoneProps {
  onPhotosAdded: (photos: PhotoItem[]) => void;
  onLoadSamples: () => void;
  compact?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onPhotosAdded,
  onLoadSamples,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    setIsLoading(true);
    const newItems: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);

      // Extract image dimensions
      const dimensions = await new Promise<{ width: number; height: number }>(
        (resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: 800, height: 600 });
          img.src = previewUrl;
        }
      );

      // Clean default caption from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

      newItems.push({
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        file,
        previewUrl,
        rotation: 0,
        caption: cleanName,
        width: dimensions.width,
        height: dimensions.height,
      });
    }

    if (newItems.length > 0) {
      onPhotosAdded(newItems);
    }
    setIsLoading(false);
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
      processFiles(e.target.files);
      // Reset input value so same files can be re-selected if deleted
      e.target.value = '';
    }
  };

  if (compact) {
    return (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Mais Fotos</span>
        </button>
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
          ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
          : 'border-slate-300 hover:border-slate-400 bg-white shadow-xs'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
          {isDragging ? 'Solte suas fotos aqui' : 'Selecione ou arraste suas fotos'}
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          O documento .docx organizará automaticamente todas as fotos em linhas de{' '}
          <strong className="text-slate-700 font-semibold">4 fotos com o mesmo tamanho</strong>. Linhas incompletas manterão as fotos com a largura padrão e o restante em branco.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Escolher Arquivos do Computador</span>
          </button>

          <button
            type="button"
            onClick={onLoadSamples}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Testar com 6 Fotos de Exemplo</span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Suporta JPG, PNG, WEBP, GIF · Você também pode colar fotos com Ctrl+V
        </p>
      </div>
    </div>
  );
};
