import React from 'react';
import {
  FileText,
  Sliders,
  Maximize2,
  Tag,
  Grid,
  Calendar,
  User,
  Settings2,
} from 'lucide-react';
import {
  DocumentConfig,
  AspectRatioType,
  FitModeType,
  MarginSizeType,
  PageSizeType,
  OrientationType,
  CaptionModeType,
} from '../types';

interface ConfigPanelProps {
  config: DocumentConfig;
  onChange: (updated: Partial<DocumentConfig>) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-xs">
      {/* Section 1: Header and Document Info */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cabeçalho do Documento
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Título do Documento
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ex: Relatório Fotográfico de Vistoria"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subtítulo / Descrição
            </label>
            <input
              type="text"
              value={config.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="Ex: Obra Residencial - Bloco B"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Responsável</span>
              </label>
              <input
                type="text"
                value={config.author}
                onChange={(e) => onChange({ author: e.target.value })}
                placeholder="Ex: Eng. Carlos"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Data</span>
              </label>
              <input
                type="text"
                value={config.date}
                onChange={(e) => onChange({ date: e.target.value })}
                placeholder="Ex: 09/10/2026"
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Section 2: Page Setup */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Configuração da Página Word
          </h2>
        </div>

        <div className="space-y-3">
          {/* Format & Orientation */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Formato do Papel
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                {(['a4', 'letter'] as PageSizeType[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onChange({ paperSize: size })}
                    className={`text-xs py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                      config.paperSize === size
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Orientação
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                {(['portrait', 'landscape'] as OrientationType[]).map((orient) => (
                  <button
                    key={orient}
                    type="button"
                    onClick={() => onChange({ orientation: orient })}
                    className={`text-xs py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                      config.orientation === orient
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {orient === 'portrait' ? 'Retrato' : 'Paisagem'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Margens do Documento
            </label>
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'narrow', label: 'Estreita', val: '1,27 cm' },
                  { id: 'moderate', label: 'Moderada', val: '1,90 cm' },
                  { id: 'normal', label: 'Normal', val: '2,54 cm' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChange({ margins: m.id as MarginSizeType })}
                  className={`text-[11px] py-1.5 font-medium rounded-md transition-colors cursor-pointer flex flex-col items-center leading-tight ${
                    config.margins === m.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{m.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {m.val}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Section 3: 4 Photos per Row & Photo Standardization */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Grade Padronizada de Fotos
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Fixado: 4 fotos/linha
          </span>
        </div>

        <div className="space-y-3">
          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
              <span>Proporção das Imagens</span>
              <span className="text-[11px] text-slate-400">Mesmo tamanho em todo doc</span>
            </label>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(['4:3', '1:1', '16:9', '3:4'] as AspectRatioType[]).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => onChange({ aspectRatio: ratio })}
                  className={`text-xs py-1.5 font-medium rounded-md transition-colors cursor-pointer ${
                    config.aspectRatio === ratio
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Fit Mode */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ajuste de Enquadramento
            </label>
            <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'cover', label: 'Preencher / Recortar', desc: '100% idênticas' },
                  { id: 'contain', label: 'Ajustar Inteira', desc: 'Sem cortar fotos' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChange({ fitMode: mode.id as FitModeType })}
                  className={`text-[11px] py-1.5 font-medium rounded-md transition-colors cursor-pointer text-center leading-tight ${
                    config.fitMode === mode.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div>{mode.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Captions */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Legendas Abaixo das Fotos</span>
            </label>
            <select
              value={config.captionMode}
              onChange={(e) => onChange({ captionMode: e.target.value as CaptionModeType })}
              className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="numbered">Numeração Automática (Foto 01, Foto 02...)</option>
              <option value="custom">Legenda Personalizada de Cada Foto</option>
              <option value="filename">Nome Original do Arquivo</option>
              <option value="none">Sem Legenda (Apenas as Fotos)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={config.includeNotesLine}
                onChange={(e) => onChange({ includeNotesLine: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>Adicionar linha para anotações/observações</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={config.showTableGrid}
                onChange={(e) => onChange({ showTableGrid: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>Borda suave da grade da tabela no Word</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={config.includeHeader}
                onChange={(e) => onChange({ includeHeader: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>Incluir cabeçalho com título no topo de cada página</span>
            </label>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs text-slate-600 leading-relaxed flex items-start gap-2">
        <Settings2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Regra de Alinhamento:</span> As fotos são agrupadas rigidamente em células de 4 por linha. Se uma linha tiver 1, 2 ou 3 fotos, o espaço restante permanece livre com as fotos mantendo a mesma largura e altura padrão.
        </div>
      </div>
    </div>
  );
};
