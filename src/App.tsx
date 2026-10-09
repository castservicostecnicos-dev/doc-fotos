import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { PhotoItem, DocumentConfig } from './types';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { ConfigPanel } from './components/ConfigPanel';
import { PhotoGridEditor } from './components/PhotoGridEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { generateSampleImages } from './utils/sampleImages';
import { generateDocxFile, downloadBlobAsDocx } from './services/docxGenerator';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

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
      }, 4000);
    },
    []
  );

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
        const newItems: PhotoItem[] = imageFiles.map((file, idx) => ({
          id: `paste-${Date.now()}-${idx}`,
          name: file.name || `Imagem Colada ${idx + 1}`,
          file,
          previewUrl: URL.createObjectURL(file),
          rotation: 0,
          caption: `Imagem Colada ${idx + 1}`,
          width: 800,
          height: 600,
        }));
        setPhotos((prev) => [...prev, ...newItems]);
        showToast(
          `${imageFiles.length} foto(s) colada(s) com sucesso!`,
          'success'
        );
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showToast]);

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

  // Add photos
  const handlePhotosAdded = (newPhotos: PhotoItem[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
    showToast(
      `${newPhotos.length} foto(s) adicionada(s) à grade de 4 colunas!`,
      'success'
    );
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
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
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
                    onClick={handleLoadSamples}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Carregar 6 Fotos de Demonstração</span>
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
