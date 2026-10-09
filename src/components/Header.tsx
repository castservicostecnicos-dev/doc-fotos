import React from 'react';
import {
  FileText,
  Download,
  Trash2,
  Sparkles,
  Layers,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { PhotoItem } from '../types';

interface HeaderProps {
  photos: PhotoItem[];
  onLoadSamples: () => void;
  onClearAll: () => void;
  onGenerateDocx: () => void;
  isGenerating: boolean;
  generationProgress?: { current: number; total: number; message: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  photos,
  onLoadSamples,
  onClearAll,
  onGenerateDocx,
  isGenerating,
  generationProgress,
}) => {
  const totalRows = Math.ceil(photos.length / 4);
  const estimatedPages = Math.max(1, Math.ceil(photos.length / 12)); // approx 3 rows per A4 page

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">
                DocxPhotoGrid
              </h1>
              <span className="hidden sm:inline-flex items-center text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                4 fotos / linha
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden md:block">
              Gerador de documentos Word (.docx) editáveis com alinhamento padronizado
            </p>
          </div>
        </div>

        {/* Live Metrics - Clean unboxed metadata */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600 border-x border-slate-200 px-4">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{photos.length}</span>
            <span>{photos.length === 1 ? 'foto' : 'fotos'}</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">{totalRows}</span>
            <span>{totalRows === 1 ? 'linha' : 'linhas'}</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>~{estimatedPages} {estimatedPages === 1 ? 'pág' : 'págs'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {photos.length === 0 ? (
            <button
              onClick={onLoadSamples}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              title="Carregar fotos de demonstração para testar imediatamente"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fotos de Amostra</span>
            </button>
          ) : (
            <>
              <button
                onClick={onClearAll}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 px-2.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Remover todas as fotos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>

              <button
                onClick={onLoadSamples}
                disabled={isGenerating}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-2 rounded-lg transition-colors disabled:opacity-50"
                title="Adicionar fotos de exemplo"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Amostras</span>
              </button>
            </>
          )}

          <button
            onClick={onGenerateDocx}
            disabled={photos.length === 0 || isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gerando DOCX...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Documento (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress banner during generation */}
      {isGenerating && generationProgress && (
        <div className="bg-blue-50 border-t border-blue-100 px-4 py-1.5 text-xs text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span className="font-medium">{generationProgress.message}</span>
          </div>
          <span className="font-mono text-blue-700">
            {generationProgress.current} / {generationProgress.total}
          </span>
        </div>
      )}
    </header>
  );
};
