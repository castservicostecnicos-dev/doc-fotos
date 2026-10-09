import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Eye,
  Sliders,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Info,
  UploadCloud,
  Folder,
} from 'lucide-react';
import { PhotoItem, DocumentConfig } from './types';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { ConfigPanel } from './components/ConfigPanel';
import { PhotoGridEditor } from './components/PhotoGridEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { generateSampleImages } from './utils/sampleImages';
import { generateDocxFile, downloadBlobAsDocx } from './services/docxGenerator';

const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|jfif|svg|avif)$/i;

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const globalFolderInputRef = useRef<HTMLInputElement>(null);

  // Initial Document Configuration
  const [config, setConfig] = useState<DocumentConfig>({
    title: 'Relatório Fotográfico',
    subtitle: 'Vistoria e Registro de Imagens',
    author: '',
    date: new Date().toLocaleDateString('pt-BR'),
    includeHeader: true,
    paperSize: 'a4',
    orientation: 'portrait',
    margins: 'narrow', // 1.27cm gives optimal printable width for 4 photos
    aspectRatio: '4:3',
    fitMode: 'cover', // Ensures all photos have exactly the same cropped dimensions
    captionMode: 'numbered', // Foto 01, Foto 02...
    showPhotoBorder: false,
    showTableGrid: false,
    includeNotesLine: false,
    photosPerRow: 4,
  });

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToastMessage({ type, text });
      setTimeout(() => {
        setToastMessage(null);
      }, 4500);
    },
    []
  );

  const isImageFile = (file: File): boolean => {
    if (file.type && file.type.startsWith('image/')) return true;
    if (IMAGE_EXTENSION_REGEX.test(file.name)) return true;
    return false;
  };

  // High-performance batch image processor
  const processBatchFiles = useCallback(
    async (rawInputFiles: FileList | File[]) => {
      const fileList = Array.from(rawInputFiles);
      const validImages = fileList.filter(isImageFile);

      if (validImages.length === 0) {
        showToast('Nenhum arquivo de imagem válido encontrado. Use arquivos JPG, PNG, WEBP ou GIF.', 'error');
        return;
      }

      setIsBatchLoading(true);
      setBatchProgress({ current: 0, total: validImages.length });

      const newItems: PhotoItem[] = [];
      const batchSize = 8; // Process in chunks of 8

      for (let i = 0; i < validImages.length; i += batchSize) {
        const slice = validImages.slice(i, i + batchSize);

        const results = await Promise.all(
          slice.map(async (file, sliceIdx) => {
            const globalIdx = i + sliceIdx;
            const previewUrl = URL.createObjectURL(file);

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

        newItems.push(...results);
        setBatchProgress({
          current: Math.min(validImages.length, i + batchSize),
          total: validImages.length,
        });
      }

      setPhotos((prev) => [...prev, ...newItems]);
      setIsBatchLoading(false);
      setBatchProgress(null);
      showToast(`${newItems.length} foto(s) carregada(s) em lote na grade de 4 fotos!`, 'success');
    },
    [showToast]
  );

  // Global Drag and Drop onto window
  useEffect(() => {
    let dragCounter = 0;

    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        setIsWindowDragging(true);
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsWindowDragging(false);
        dragCounter = 0;
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragging(false);
      dragCounter = 0;
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processBatchFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [processBatchFiles]);

  // Paste listener for Ctrl+V images anywhere
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const imageFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        processBatchFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processBatchFiles]);

  // Trigger batch picker
  const triggerBatchUpload = () => {
    globalFileInputRef.current?.click();
  };

  const handleGlobalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      e.target.value = '';
      processBatchFiles(files);
    }
  };

  // Load sample photos
  const handleLoadSamples = async () => {
    try {
      const samples = await generateSampleImages();
      setPhotos((prev) => [...prev, ...samples]);
      showToast('6 fotos de exemplo carregadas para teste imediato!', 'success');
    } catch {
      showToast('Erro ao carregar amostras', 'error');
    }
  };

  // Add photos from components
  const handlePhotosAdded = (newPhotos: PhotoItem[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
    showToast(`${newPhotos.length} foto(s) adicionada(s) à grade de 4 colunas!`, 'success');
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm('Deseja remover todas as fotos da lista?')) {
      setPhotos([]);
      showToast('Todas as fotos foram removidas.', 'info');
    }
  };

  // Update single photo
  const handleUpdatePhoto = (id: string, updates: Partial<PhotoItem>) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Remove single photo
  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Move photo position
  const handleMovePhoto = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return copy;
    });
  };

  // Batch rotate all
  const handleBatchRotate = () => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + 90) % 360,
      }))
    );
    showToast('Todas as fotos foram giradas em 90 graus.', 'info');
  };

  // Batch number captions
  const handleBatchNumber = () => {
    setPhotos((prev) =>
      prev.map((p, idx) => ({
        ...p,
        caption: `Foto ${String(idx + 1).padStart(2, '0')}`,
      }))
    );
    showToast('Legendas numeradas em sequência com sucesso.', 'success');
  };

  // Update config
  const handleUpdateConfig = (updates: Partial<DocumentConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  // Generate & Download DOCX
  const handleGenerateDocx = async () => {
    if (photos.length === 0) {
      showToast('Adicione pelo menos uma foto antes de gerar o documento.', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      const blob = await generateDocxFile({
        photos,
        config,
        onProgress: (current, total, message) => {
          setGenerationProgress({ current, total, message });
        },
      });

      const cleanFileName = config.title
        ? config.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')
        : 'relatorio_fotos_4_por_linha';

      downloadBlobAsDocx(blob, `${cleanFileName}.docx`);
      showToast(
        'Documento .docx baixado com sucesso! Arquivo editável no Microsoft Word ou Google Docs.',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(
        err instanceof Error ? err.message : 'Erro ao gerar o arquivo .docx.',
        'error'
      );
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* Hidden global batch inputs */}
      <input
        ref={globalFileInputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.jfif"
        multiple
        className="hidden"
        onChange={handleGlobalFileChange}
      />
      <input
        ref={globalFolderInputRef}
        type="file"
        {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        multiple
        className="hidden"
        onChange={handleGlobalFileChange}
      />

      {/* Global Drag-and-Drop Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 z-50 bg-blue-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white pointer-events-none p-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-white/20 border-2 border-white/40 flex items-center justify-center mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Solte suas fotos aqui</h2>
          <p className="text-sm text-blue-100 max-w-md">
            As fotos serão carregadas em lote e organizadas na grade padrão de 4 fotos por linha no documento .docx
          </p>
        </div>
      )}

      {/* Batch Processing Indicator */}
      {isBatchLoading && batchProgress && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-blue-600 text-white px-4 py-2 text-xs shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-semibold">
              Processando lote de imagens: {batchProgress.current} de {batchProgress.total} fotos...
            </span>
            <div className="w-48 bg-blue-900/60 rounded-full h-2 ml-auto overflow-hidden hidden sm:block">
              <div
                className="bg-white h-2 transition-all duration-150"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toastMessage.type === 'success' && (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toastMessage.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {toastMessage.type === 'info' && (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        photos={photos}
        onLoadSamples={handleLoadSamples}
        onClearAll={handleClearAll}
        onGenerateDocx={handleGenerateDocx}
        onAddPhotosClick={triggerBatchUpload}
        isGenerating={isGenerating}
        generationProgress={generationProgress}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Intro banner when empty */}
        {photos.length === 0 ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-200 border border-blue-400/30 mb-3">
                  Padronização Rigorosa · 4 Fotos por Linha
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                  Crie documentos .docx com fotos organizadas em linhas de 4
                </h2>
                <p className="text-sm text-blue-100/90 leading-relaxed mb-6">
                  Carregue suas fotos em lote. Todas as imagens recebem o mesmo tamanho e largura padronizados em todo o documento. Se houver menos de 4 fotos em uma linha, elas ocupam o espaço exato e o restante permanece em branco, mantendo o alinhamento impecável. O arquivo final é 100% editável no Microsoft Word e Google Docs.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={triggerBatchUpload}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Selecionar Várias Fotos em Lote</span>
                  </button>

                  <button
                    onClick={() => globalFolderInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors cursor-pointer"
                  >
                    <Folder className="w-4 h-4 text-amber-400" />
                    <span>Carregar Pasta Inteira</span>
                  </button>

                  <button
                    onClick={handleLoadSamples}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Fotos de Amostra</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <UploadDropzone
              onPhotosAdded={handlePhotosAdded}
              onLoadSamples={handleLoadSamples}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Configuration Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Upload em Lote
                  </span>
                  <span className="text-xs text-slate-500">
                    {photos.length} adicionada(s)
                  </span>
                </div>
                <UploadDropzone
                  onPhotosAdded={handlePhotosAdded}
                  onLoadSamples={handleLoadSamples}
                  compact={true}
                />
              </div>

              <ConfigPanel config={config} onChange={handleUpdateConfig} />
            </div>

            {/* Right Column: Editor & Preview Tabs (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'editor'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Grade & Reordenação ({photos.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Simulação do Documento .docx</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 hidden sm:block pr-2">
                  {Math.ceil(photos.length / 4)} linha(s) de até 4 fotos
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'editor' ? (
                <PhotoGridEditor
                  photos={photos}
                  config={config}
                  onUpdatePhoto={handleUpdatePhoto}
                  onRemovePhoto={handleRemovePhoto}
                  onMovePhoto={handleMovePhoto}
                  onBatchRotate={handleBatchRotate}
                  onBatchNumber={handleBatchNumber}
                  onAddPhotosClick={triggerBatchUpload}
                />
              ) : (
                <DocumentPreview photos={photos} config={config} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">DocxPhotoGrid</span>
            <span>·</span>
            <span>Documentos Microsoft Word (.docx) compatíveis com Google Docs e LibreOffice</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Formatação estrita de 4 fotos por linha com proporção uniforme
          </div>
        </div>
      </footer>
    </div>
  );
}
