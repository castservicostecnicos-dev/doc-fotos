import React, { useState } from 'react';
import {
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Edit2,
  Check,
  Sparkles,
  Maximize2,
  Plus,
} from 'lucide-react';
import { PhotoItem, DocumentConfig } from '../types';

interface PhotoGridEditorProps {
  photos: PhotoItem[];
  config: DocumentConfig;
  onUpdatePhoto: (id: string, updates: Partial<PhotoItem>) => void;
  onRemovePhoto: (id: string) => void;
  onMovePhoto: (index: number, targetIndex: number) => void;
  onBatchRotate: () => void;
  onBatchNumber: () => void;
  onAddPhotosClick?: () => void;
}

export const PhotoGridEditor: React.FC<PhotoGridEditorProps> = ({
  photos,
  config,
  onUpdatePhoto,
  onRemovePhoto,
  onMovePhoto,
  onBatchRotate,
  onBatchNumber,
  onAddPhotosClick,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState<string>('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const startEditCaption = (photo: PhotoItem) => {
    setEditingId(photo.id);
    setTempCaption(photo.caption || photo.name);
  };

  const saveEditCaption = (id: string) => {
    onUpdatePhoto(id, { caption: tempCaption });
    setEditingId(null);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      onMovePhoto(draggedIdx, targetIdx);
    }
    setDraggedIdx(null);
  };

  // Group photos into rows of 4 to match the docx output exactly
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

  // Aspect ratio classes for preview
  const aspectClasses: Record<string, string> = {
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '16:9': 'aspect-[16/9]',
    '3:4': 'aspect-[3/4]',
  };

  return (
    <div className="space-y-4">
      {/* Batch toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <span>Organização em Linhas de 4 Fotos</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-normal">
            Arraste ou use as setas para reordenar
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onAddPhotosClick && (
            <button
              type="button"
              onClick={onAddPhotosClick}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Carregar mais fotos em lote"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Fotos</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBatchNumber}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Preencher legendas em ordem Foto 01, Foto 02..."
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Numerar Legendas</span>
          </button>

          <button
            type="button"
            onClick={onBatchRotate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Girar todas as fotos em 90 graus"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Girar Todas</span>
          </button>
        </div>
      </div>

      {/* Rows of 4 */}
      <div className="space-y-4">
        {rows.map((row, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-800">
                Linha {rowIdx + 1}
              </span>
              <span>
                {row.filter(Boolean).length} de 4 fotos nesta linha
              </span>
            </div>

            {/* Strict 4-column layout */}
            <div className="grid grid-cols-4 gap-3">
              {row.map((item, colIdx) => {
                const globalIdx = rowIdx * 4 + colIdx;

                if (!item) {
                  // Empty slot in row
                  return (
                    <div
                      key={`empty-${rowIdx}-${colIdx}`}
                      onClick={onAddPhotosClick}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer rounded-xl flex flex-col items-center justify-center p-4 text-center bg-slate-50/50 min-h-[160px] group"
                      title="Clique para carregar fotos neste espaço"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center text-xs font-mono font-medium mb-1 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 group-hover:text-blue-700">
                        Espaço Livre
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Clique para + fotos
                      </span>
                    </div>
                  );
                }

                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(globalIdx)}
                    onDragOver={(e) => handleDragOver(e, globalIdx)}
                    onDrop={() => handleDrop(globalIdx)}
                    className={`group relative bg-slate-50 border rounded-xl overflow-hidden transition-all flex flex-col ${
                      draggedIdx === globalIdx
                        ? 'opacity-40 border-blue-500 shadow-lg'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Position index badge */}
                    <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-medium shadow-xs">
                      #{globalIdx + 1}
                    </div>

                    {/* Quick photo controls overlay */}
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePhoto(item.id, {
                            rotation: (item.rotation + 90) % 360,
                          })
                        }
                        className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 rounded shadow-xs transition-colors cursor-pointer"
                        title="Girar 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(item.id)}
                        className="p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-red-600 rounded shadow-xs transition-colors cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Image Preview Box with exact aspect ratio */}
                    <div
                      className={`w-full overflow-hidden bg-slate-900/5 relative ${
                        aspectClasses[config.aspectRatio] || 'aspect-[4/3]'
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

                    {/* Caption & Reorder controls */}
                    <div className="p-2.5 bg-white flex-1 flex flex-col justify-between border-t border-slate-100">
                      {isEditing ? (
                        <div className="flex items-center gap-1 mb-2">
                          <input
                            type="text"
                            value={tempCaption}
                            onChange={(e) => setTempCaption(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditCaption(item.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="w-full text-xs px-2 py-1 border border-blue-400 rounded focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => saveEditCaption(item.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditCaption(item)}
                          className="flex items-center justify-between text-xs text-slate-700 font-medium truncate mb-2 cursor-pointer hover:text-blue-600 group/title"
                          title="Clique para editar legenda"
                        >
                          <span className="truncate">
                            {config.captionMode === 'numbered'
                              ? `Foto ${String(globalIdx + 1).padStart(2, '0')}`
                              : item.caption || item.name}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/title:opacity-100 shrink-0 ml-1" />
                        </div>
                      )}

                      {/* Reorder and move buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-slate-400">
                        <button
                          type="button"
                          disabled={globalIdx === 0}
                          onClick={() => onMovePhoto(globalIdx, globalIdx - 1)}
                          className="p-1 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Mover para a esquerda"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <GripVertical className="w-3 h-3" />
                          <span>col {colIdx + 1}</span>
                        </div>

                        <button
                          type="button"
                          disabled={globalIdx === photos.length - 1}
                          onClick={() => onMovePhoto(globalIdx, globalIdx + 1)}
                          className="p-1 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Mover para a direita"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
