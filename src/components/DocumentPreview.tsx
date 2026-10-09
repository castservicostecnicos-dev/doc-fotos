import React, { useState } from 'react';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Columns,
} from 'lucide-react';
import { PhotoItem, DocumentConfig } from '../types';

interface DocumentPreviewProps {
  photos: PhotoItem[];
  config: DocumentConfig;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ photos, config }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Group photos into rows of 4
  const rows: (PhotoItem | null)[][] = [];
  const totalRows = Math.ceil(photos.length / 4);

  for (let r = 0; r < totalRows; r++) {
    const rowItems: (PhotoItem | null)[] = [];
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c;
      rowItems.push(photos[idx] || null);
    }
    rows.push(rowItems);
  }

  // Calculate pages: approximately 3 rows per page with title, or 4 rows without title
  const rowsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const activePage = Math.min(currentPage, totalPages);

  const startRowIdx = (activePage - 1) * rowsPerPage;
  const pageRows = rows.slice(startRowIdx, startRowIdx + rowsPerPage);

  const aspectClasses: Record<string, string> = {
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '16:9': 'aspect-[16/9]',
    '3:4': 'aspect-[3/4]',
  };

  const marginPaddingClasses: Record<string, string> = {
    narrow: 'p-6',
    moderate: 'p-8',
    normal: 'p-10',
  };

  return (
    <div className="space-y-4">
      {/* Visualizer controls toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Columns className="w-4 h-4 text-blue-600" />
          <span>Pré-visualização do Documento DOCX</span>
          <span className="hidden sm:inline-block text-slate-300">·</span>
          <span className="hidden sm:inline-block text-slate-500 font-normal">
            Simulação da folha {config.paperSize.toUpperCase()} ({config.orientation === 'portrait' ? 'Retrato' : 'Paisagem'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
              title="Reduzir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-700 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(100)}
              className="p-1 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
              title="Zoom padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 border-l border-slate-200 pl-2">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono">
                Pág. {activePage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Document Paper */}
      <div className="overflow-x-auto pb-6 flex justify-center bg-slate-100/70 p-4 sm:p-6 rounded-2xl border border-slate-200">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            width: config.orientation === 'landscape' ? '1080px' : '820px',
            minHeight: config.orientation === 'landscape' ? '760px' : '1100px',
          }}
          className={`bg-white shadow-xl rounded-sm border border-slate-300 text-slate-900 flex flex-col justify-between ${
            marginPaddingClasses[config.margins] || 'p-8'
          }`}
        >
          {/* Document Top Content */}
          <div>
            {/* Header if enabled */}
            {config.includeHeader && (
              <div className="text-right text-[10px] text-slate-400 border-b border-slate-100 pb-2 mb-4 font-sans">
                {config.title || 'Relatório Fotográfico'}
              </div>
            )}

            {/* Document Title & Metadata on first page */}
            {activePage === 1 && (
              <div className="mb-6">
                {config.title && (
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1 font-sans">
                    {config.title}
                  </h1>
                )}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-sans">
                  {config.subtitle && <span>{config.subtitle}</span>}
                  {config.author && (
                    <>
                      <span>·</span>
                      <span>Responsável: {config.author}</span>
                    </>
                  )}
                  {config.date && (
                    <>
                      <span>·</span>
                      <span>Data: {config.date}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="font-medium text-slate-700">
                    {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} (4 por linha)
                  </span>
                </div>
              </div>
            )}

            {/* 4-per-row Table */}
            <div
              className={`w-full ${
                config.showTableGrid
                  ? 'border border-slate-300 divide-y divide-slate-300'
                  : 'space-y-4'
              }`}
            >
              {pageRows.map((row, rIdx) => {
                const currentRowIdx = startRowIdx + rIdx;

                return (
                  <div
                    key={`preview-row-${currentRowIdx}`}
                    className={`grid grid-cols-4 ${
                      config.showTableGrid
                        ? 'divide-x divide-slate-300 bg-white'
                        : 'gap-3'
                    }`}
                  >
                    {row.map((item, colIdx) => {
                      const photoIdx = currentRowIdx * 4 + colIdx;

                      if (!item) {
                        // EMPTY CELL: explicitly preserves 1/4 width with no photo
                        return (
                          <div
                            key={`preview-empty-${currentRowIdx}-${colIdx}`}
                            className={`p-2 flex flex-col items-center justify-center min-h-[120px] ${
                              config.showTableGrid
                                ? 'bg-slate-50/40'
                                : 'border border-dashed border-slate-200/80 rounded bg-slate-50/30'
                            }`}
                          >
                            <span className="text-[10px] text-slate-300 italic">
                              Espaço vazio (coluna {colIdx + 1})
                            </span>
                          </div>
                        );
                      }

                      // CELL WITH PHOTO
                      let captionLabel = '';
                      if (config.captionMode === 'numbered') {
                        captionLabel = `Foto ${String(photoIdx + 1).padStart(2, '0')}`;
                        if (item.caption && item.caption !== item.name) {
                          captionLabel += ` - ${item.caption}`;
                        }
                      } else if (config.captionMode === 'filename') {
                        captionLabel = item.name;
                      } else if (config.captionMode === 'custom') {
                        captionLabel = item.caption || `Foto ${photoIdx + 1}`;
                      }

                      return (
                        <div
                          key={`preview-cell-${item.id}`}
                          className={`p-2 flex flex-col items-center text-center ${
                            config.showTableGrid ? '' : 'rounded bg-white'
                          }`}
                        >
                          {/* Image container with standard ratio */}
                          <div
                            className={`w-full overflow-hidden bg-slate-100 relative ${
                              aspectClasses[config.aspectRatio] || 'aspect-[4/3]'
                            } ${
                              config.showPhotoBorder
                                ? 'border border-slate-300 rounded-xs'
                                : ''
                            }`}
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              style={{
                                transform: `rotate(${item.rotation}deg)`,
                              }}
                              className={`w-full h-full transition-transform ${
                                config.fitMode === 'cover'
                                  ? 'object-cover'
                                  : 'object-contain bg-white'
                              }`}
                            />
                          </div>

                          {/* Caption below photo */}
                          {config.captionMode !== 'none' && captionLabel && (
                            <div className="mt-1 text-[10px] font-bold text-slate-700 leading-tight truncate w-full px-1">
                              {captionLabel}
                            </div>
                          )}

                          {/* Editable notes line if checked */}
                          {config.includeNotesLine && (
                            <div className="mt-1 text-[9px] text-slate-400 font-mono italic">
                              Obs: ________________
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-sans">
            <span>
              Documento .docx editável · Alinhamento padronizado de 4 fotos
            </span>
            <span>
              Página {activePage} de {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Alignment verification badge */}
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Garantia de Formatação:</strong> Todas as fotos possuem a mesma proporção exata e ocupam 25% da largura da linha. Linhas com menos de 4 fotos preservam os espaços vazios mantendo as fotos com a largura idêntica.
        </span>
      </div>
    </div>
  );
};
