import { PhotoItem } from '../types';

export function generateSampleImages(): Promise<PhotoItem[]> {
  const samples = [
    { name: 'Inspeção_Fachada_01.jpg', title: 'Fachada Principal', color1: '#1e3a8a', color2: '#3b82f6', icon: '🏢' },
    { name: 'Vistoria_Sala_02.jpg', title: 'Área Interna', color1: '#065f46', color2: '#10b981', icon: '🛋️' },
    { name: 'Eletrica_Quadro_03.jpg', title: 'Quadro de Distribuição', color1: '#854d0e', color2: '#eab308', icon: '⚡' },
    { name: 'Hidraulica_Geral_04.jpg', title: 'Tubulação e Conexões', color1: '#155e75', color2: '#06b6d4', icon: '💧' },
    { name: 'Cobertura_Telhado_05.jpg', title: 'Estrutura Superior', color1: '#701a75', color2: '#d946ef', icon: '🏗️' },
    { name: 'Acesso_Garagem_06.jpg', title: 'Rampa de Acesso', color1: '#374151', color2: '#6b7280', icon: '🚗' },
  ];

  return Promise.all(
    samples.map((item, index) => {
      return new Promise<PhotoItem>((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d')!;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 800, 600);
        grad.addColorStop(0, item.color1);
        grad.addColorStop(1, item.color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 600);

        // Pattern grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        for (let x = 40; x < 800; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 600);
          ctx.stroke();
        }
        for (let y = 40; y < 600; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(800, y);
          ctx.stroke();
        }

        // Center card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(140, 150, 520, 300, 16);
        ctx.fill();

        // Icon
        ctx.font = '64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon, 400, 230);

        // Label
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(item.title, 400, 310);

        // Subtitle
        ctx.fillStyle = '#64748b';
        ctx.font = '500 18px sans-serif';
        ctx.fillText(`Foto de Amostra #${index + 1} · 800x600 px`, 400, 355);

        // Badge at top
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath();
        ctx.roundRect(30, 30, 140, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FOTO 0${index + 1}`, 50, 54);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        resolve({
          id: `sample-${index + 1}-${Date.now()}`,
          name: item.name,
          previewUrl: dataUrl,
          rotation: 0,
          caption: item.title,
          width: 800,
          height: 600,
        });
      });
    })
  );
}
