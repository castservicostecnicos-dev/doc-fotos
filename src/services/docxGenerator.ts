import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ImageRun,
  BorderStyle,
  VerticalAlign,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  convertMillimetersToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import { DocumentConfig, PhotoItem } from '../types';
import { processImageForDocx } from '../utils/imageProcessor';

export interface GenerateDocxOptions {
  photos: PhotoItem[];
  config: DocumentConfig;
  onProgress?: (current: number, total: number, message: string) => void;
}

export async function generateDocxFile({
  photos,
  config,
  onProgress,
}: GenerateDocxOptions): Promise<Blob> {
  const totalPhotos = photos.length;
  if (totalPhotos === 0) {
    throw new Error('Nenhuma foto selecionada para gerar o documento.');
  }

  // Margin definitions (in twips/dxa)
  const marginValues = {
    normal: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch = 2.54cm
    moderate: { top: 1080, bottom: 1080, left: 1080, right: 1080 }, // 0.75 inch = 1.9cm
    narrow: { top: 720, bottom: 720, left: 720, right: 720 }, // 0.5 inch = 1.27cm
  };

  const selectedMargins = marginValues[config.margins] || marginValues.narrow;

  // Page dimensions (twips)
  // A4: 210mm x 297mm (11906 x 16838 twips)
  // Letter: 8.5 x 11 inches (12240 x 15840 twips)
  const isA4 = config.paperSize === 'a4';
  const rawPageWidth = isA4
    ? convertMillimetersToTwip(210)
    : convertInchesToTwip(8.5);
  const rawPageHeight = isA4
    ? convertMillimetersToTwip(297)
    : convertInchesToTwip(11);

  const isLandscape = config.orientation === 'landscape';
  const pageWidth = isLandscape ? rawPageHeight : rawPageWidth;
  const pageHeight = isLandscape ? rawPageWidth : rawPageHeight;

  // Printable width
  const printableWidth = pageWidth - (selectedMargins.left + selectedMargins.right);
  const colWidthDxa = Math.floor(printableWidth / 4);

  // In Docx, 1 pt = 20 dxa. Target photo width in pt inside the cell (leaving padding):
  // Column width in points = colWidthDxa / 20.
  // We reserve ~10pt padding for cell margins.
  const targetPhotoWidthPt = Math.max(70, Math.floor(colWidthDxa / 20) - 10);

  onProgress?.(0, totalPhotos, 'Preparando e processando imagens...');

  // 1. Process all photos to uniform aspect ratios and Uint8Array buffers
  const processedPhotos: {
    photo: PhotoItem;
    uint8Array: Uint8Array;
    widthPt: number;
    heightPt: number;
    index: number;
  }[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    onProgress?.(
      i + 1,
      totalPhotos,
      `Otimizando foto ${i + 1} de ${totalPhotos}...`
    );

    const processed = await processImageForDocx(
      photo.previewUrl,
      photo.rotation,
      config.aspectRatio,
      config.fitMode,
      targetPhotoWidthPt
    );

    processedPhotos.push({
      photo,
      uint8Array: processed.uint8Array,
      widthPt: processed.widthPt,
      heightPt: processed.heightPt,
      index: i + 1,
    });
  }

  onProgress?.(totalPhotos, totalPhotos, 'Montando grade de 4 fotos por linha no Word...');

  // 2. Build rows: strictly 4 columns per row
  const rows: TableRow[] = [];
  const chunkCount = Math.ceil(processedPhotos.length / 4);

  const cellBorderNone = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const cellBorderGrid = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const chosenCellBorders = config.showTableGrid ? cellBorderGrid : cellBorderNone;

  for (let r = 0; r < chunkCount; r++) {
    const cells: TableCell[] = [];

    // Each row ALWAYS has exactly 4 cells to guarantee strict alignment across the document
    for (let c = 0; c < 4; c++) {
      const photoIndex = r * 4 + c;
      const item = processedPhotos[photoIndex];

      if (item) {
        // Slot WITH PHOTO
        const cellChildren: Paragraph[] = [];

        // Image paragraph
        cellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            children: [
              new ImageRun({
                data: item.uint8Array,
                transformation: {
                  width: item.widthPt,
                  height: item.heightPt,
                },
                altText: {
                  title: item.photo.name || `Foto ${item.index}`,
                  description: item.photo.caption || `Imagem ${item.index}`,
                  name: `Foto_${item.index}`,
                },
                type: 'jpg',
              }),
            ],
          })
        );

        // Caption paragraph (if enabled)
        let captionText = '';
        if (config.captionMode === 'numbered') {
          captionText = `Foto ${String(item.index).padStart(2, '0')}`;
          if (item.photo.caption && item.photo.caption !== item.photo.name) {
            captionText += ` - ${item.photo.caption}`;
          }
        } else if (config.captionMode === 'filename') {
          captionText = item.photo.name;
        } else if (config.captionMode === 'custom') {
          captionText = item.photo.caption || `Foto ${item.index}`;
        }

        if (config.captionMode !== 'none' && captionText) {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: config.includeNotesLine ? 40 : 120 },
              children: [
                new TextRun({
                  text: captionText,
                  size: 17, // ~8.5pt in Word
                  font: 'Arial',
                  color: '334155',
                  bold: true,
                }),
              ],
            })
          );
        }

        // Optional editable notes field for the user to edit in Word
        if (config.includeNotesLine) {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 20, after: 120 },
              children: [
                new TextRun({
                  text: 'Obs: __________________',
                  size: 15, // ~7.5pt
                  font: 'Arial',
                  color: '94A3B8',
                }),
              ],
            })
          );
        }

        cells.push(
          new TableCell({
            width: {
              size: colWidthDxa,
              type: WidthType.DXA,
            },
            verticalAlign: VerticalAlign.TOP,
            borders: chosenCellBorders,
            margins: {
              top: 100,
              bottom: 100,
              left: 60,
              right: 60,
            },
            children: cellChildren,
          })
        );
      } else {
        // EMPTY SLOT: guarantees that rows with 1, 2, or 3 photos keep exact identical column width
        cells.push(
          new TableCell({
            width: {
              size: colWidthDxa,
              type: WidthType.DXA,
            },
            verticalAlign: VerticalAlign.TOP,
            borders: chosenCellBorders,
            margins: {
              top: 100,
              bottom: 100,
              left: 60,
              right: 60,
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({
                    text: '', // Empty space paragraph
                  }),
                ],
              }),
            ],
          })
        );
      }
    }

    rows.push(
      new TableRow({
        children: cells,
        cantSplit: true, // Prevents row from being split across page breaks awkwardly
      })
    );
  }

  // 3. Document body paragraphs (Title, description, date)
  const bodyParagraphs: (Paragraph | Table)[] = [];

  if (config.title) {
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 100, after: 60 },
        children: [
          new TextRun({
            text: config.title,
            size: 36, // 18pt
            bold: true,
            font: 'Arial',
            color: '0F172A',
          }),
        ],
      })
    );
  }

  const metaItems: string[] = [];
  if (config.subtitle) metaItems.push(config.subtitle);
  if (config.author) metaItems.push(`Responsável: ${config.author}`);
  if (config.date) metaItems.push(`Data: ${config.date}`);
  metaItems.push(`Total de Imagens: ${totalPhotos}`);
  metaItems.push(`Disposição: 4 fotos por linha`);

  if (metaItems.length > 0) {
    bodyParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 0, after: 200 },
        children: [
          new TextRun({
            text: metaItems.join('  ·  '),
            size: 18, // 9pt
            font: 'Arial',
            color: '64748B',
          }),
        ],
      })
    );
  }

  // 4. Photos Table with exactly 4 columns
  const photoTable = new Table({
    width: {
      size: printableWidth,
      type: WidthType.DXA,
    },
    columnWidths: [colWidthDxa, colWidthDxa, colWidthDxa, colWidthDxa],
    rows: rows,
    alignment: AlignmentType.CENTER,
  });

  bodyParagraphs.push(photoTable);

  // Notes block at document end
  bodyParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 300, after: 100 },
      children: [
        new TextRun({
          text: 'Documento gerado automaticamente com alinhamento padrão de 4 fotos por linha. Totalmente editável no Microsoft Word, Google Docs ou LibreOffice.',
          size: 16, // 8pt
          italics: true,
          font: 'Arial',
          color: '94A3B8',
        }),
      ],
    })
  );

  // 5. Create Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidth,
              height: pageHeight,
              orientation: isLandscape ? ('landscape' as const) : ('portrait' as const),
            },
            margin: selectedMargins,
          },
        },
        headers: config.includeHeader
          ? {
              default: new Header({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: config.title || 'Relatório Fotográfico',
                        size: 16,
                        font: 'Arial',
                        color: '94A3B8',
                      }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Página ',
                    size: 16,
                    font: 'Arial',
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    font: 'Arial',
                    color: '94A3B8',
                  }),
                  new TextRun({
                    text: ' de ',
                    size: 16,
                    font: 'Arial',
                    color: '94A3B8',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    font: 'Arial',
                    color: '94A3B8',
                  }),
                ],
              }),
            ],
          }),
        },
        children: bodyParagraphs,
      },
    ],
  });

  onProgress?.(totalPhotos, totalPhotos, 'Gerando arquivo .docx...');
  const docxBlob = await Packer.toBlob(doc);
  return docxBlob;
}

export function downloadBlobAsDocx(blob: Blob, filename: string = 'documento-fotos.docx') {
  const safeFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  saveAs(blob, safeFilename);
}
